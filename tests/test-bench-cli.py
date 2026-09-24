#!/usr/bin/env python3
"""End-to-end tests of the `bench` CLI: the real script, a fake agent, temporary data and config dirs."""

import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BENCH = ROOT / "scripts" / "bench.py"
RUN = "2026-09-24-a"
BLACK_HOLE = "3d-06-black-hole-lensing"
LANDING = "web-01-ai-saas-landing"

# Behaves like `claude -p --output-format stream-json`: init event, work in the cwd, result event with usage and cost.
FAKE_AGENT = r'''
import json, pathlib, sys, time
mode, prompt = sys.argv[1], sys.argv[2]
print(json.dumps({"type": "system", "subtype": "init", "model": "fake-model-1"}), flush=True)
if mode == "slow":
    time.sleep(60)
if mode == "ratelimit":
    print("Error: usage limit reached, try again later", flush=True)
    sys.exit(1)
if mode == "fail":
    sys.exit(3)
pathlib.Path("env.txt").write_text(__import__("os").environ.get("FAKE_HOME", ""))
page = pathlib.Path("index.html")
page.write_text((page.read_text() if page.exists() else "") + "<h1>version</h1>\n")
pathlib.Path("node_modules").mkdir(exist_ok=True)
pathlib.Path("node_modules/heavy.js").write_text("x")
usage = {"input_tokens": 1000, "output_tokens": 200, "cache_read_input_tokens": 50, "cache_creation_input_tokens": 10}
print(json.dumps({"type": "result", "result": "done", "total_cost_usd": 0.25, "usage": usage}), flush=True)
'''


class BenchCliTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.data, self.config = self.tmp / "data", self.tmp / "config"
        self.config.mkdir()
        agent = self.tmp / "agent.py"
        agent.write_text(FAKE_AGENT)

        def model(mode, **extra):
            return {"label": f"Fake {mode}", "command": f"{sys.executable} {agent} {mode} {{prompt}}",
                    "parser": "claude-stream-json", "billing": "subscription", **extra}

        models = {"fake": model("ok"), "fake-fail": model("fail"), "fake-ratelimit": model("ratelimit"),
                  "fake-slow": model("slow"), "fake-api": model("ok", billing="api"),
                  "fake-env": model("ok", env={"FAKE_HOME": "~/isolated-home"})}
        (self.config / "models.json").write_text(json.dumps(models))
        (self.config / "bench.config.json").write_text(
            json.dumps({"timeout_min": 5, "idle_timeout_min": 5, "run_budget_usd": 20, "max_attempts": 2, "shots": False}))
        self.spawned = []
        self.env = {**os.environ, "MODEL_BENCH_DATA": str(self.data), "MODEL_BENCH_CONFIG": str(self.config)}

    def tearDown(self):
        self.bench("stop", "--grace", "2")  # only this test's processes: MODEL_BENCH_DATA points to the temp dir
        for proc in self.spawned:
            proc.kill()
            proc.wait()
            proc.stdout.close()
        subprocess.run(["rm", "-rf", str(self.tmp)])

    def bench(self, *args, check=False):
        result = subprocess.run([sys.executable, str(BENCH), *args], env=self.env, capture_output=True, text=True, timeout=120)
        if check:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        return result

    def spawn(self, *args):
        proc = subprocess.Popen([sys.executable, str(BENCH), *args], env=self.env, stdout=subprocess.PIPE,
                                stderr=subprocess.DEVNULL, text=True)
        self.spawned.append(proc)
        return proc

    def run_bench(self, model="fake", ids=f"{BLACK_HOLE},{LANDING}", *extra, check=True):
        return self.bench("run", "--model", model, "--ids", ids, "--yes", *extra, check=check)

    def attempt(self, test, number=1, model="fake"):
        return self.data / model / RUN / test / f"attempt-{number}"

    def attempt_json(self, test, number=1, model="fake"):
        return json.loads((self.attempt(test, number, model) / "attempt.json").read_text())

    def registered(self):
        procs = self.data / ".bench" / "procs"
        return list(procs.glob("*.json")) if procs.exists() else []

    # --- run -------------------------------------------------------------------------------------

    def test_run_records_every_attempt(self):
        self.run_bench("fake", f"{BLACK_HOLE},{LANDING}", "--run-id", RUN)
        attempt = self.attempt_json(BLACK_HOLE)
        self.assertEqual((attempt["status"], attempt["kind"], attempt["attempt"], attempt["based_on"]), ("ok", "fresh", 1, None))
        self.assertEqual(attempt["model_id"], "fake-model-1")
        self.assertEqual(attempt["tokens"], {"input": 1000, "output": 200, "cache_read": 50, "cache_write": 10})
        self.assertEqual((attempt["cost_usd"], attempt["cost_source"], attempt["billing"]), (0.25, "cli", "subscription"))
        self.assertIsNone(attempt["start"])
        self.assertIsNone(attempt["score"])
        folder = self.attempt(BLACK_HOLE)
        for name in ("PROMPT.md", "command.txt", "output.log", "workspace/index.html"):
            self.assertTrue((folder / name).exists(), name)
        self.assertFalse((folder / "workspace" / "node_modules").exists(), "node_modules must not be kept")
        self.assertIn("Contrat de lancement", (folder / "PROMPT.md").read_text())

        run = json.loads((self.data / "fake" / RUN / "run.json").read_text())
        self.assertEqual(run["planned"], [BLACK_HOLE, LANDING])
        self.assertEqual(run["totals"], {"attempts": 2, "ok": 2, "duration_s": run["totals"]["duration_s"], "cost_usd": 0.5})
        self.assertEqual(self.registered(), [], "the run unregisters itself when it ends")

    def test_model_env_reaches_the_agent(self):
        self.run_bench("fake-env", BLACK_HOLE, "--run-id", RUN)
        seen = self.attempt(BLACK_HOLE, model="fake-env").joinpath("workspace/env.txt").read_text()
        self.assertEqual(seen, str(Path.home() / "isolated-home"))

    def test_new_run_ids_follow_the_day(self):
        self.run_bench("fake", BLACK_HOLE)
        self.run_bench("fake", BLACK_HOLE)
        runs = sorted(path.name for path in (self.data / "fake").iterdir())
        self.assertEqual([run[-1] for run in runs], ["a", "b"])

    def test_retry_adds_an_attempt_up_to_the_limit(self):
        self.run_bench("fake", BLACK_HOLE, "--run-id", RUN)
        self.run_bench("fake", BLACK_HOLE, "--run", RUN)
        self.assertEqual(self.attempt_json(BLACK_HOLE, 2)["kind"], "fresh")
        self.assertEqual(self.attempt(BLACK_HOLE, 2).joinpath("workspace/index.html").read_text().count("<h1>"), 1)
        third = self.run_bench("fake", BLACK_HOLE, "--run", RUN, check=False)
        self.assertNotEqual(third.returncode, 0)
        self.assertIn("2 attempts already", third.stdout)
        self.assertFalse(self.attempt(BLACK_HOLE, 3).exists())

    def test_iteration_continues_the_latest_attempt(self):
        self.run_bench("fake", BLACK_HOLE, "--run-id", RUN)
        self.run_bench("fake", BLACK_HOLE, "--run", RUN, "--delta", "Ajoute un bouton pause")
        attempt = self.attempt_json(BLACK_HOLE, 2)
        self.assertEqual((attempt["kind"], attempt["based_on"]), ("iteration", "attempt-1"))
        self.assertEqual(self.attempt(BLACK_HOLE, 2).joinpath("workspace/index.html").read_text().count("<h1>"), 2,
                         "the agent starts from the previous workspace")
        prompt = self.attempt(BLACK_HOLE, 2).joinpath("PROMPT.md").read_text()
        self.assertIn("Ajoute un bouton pause", prompt)
        self.assertLess(len(prompt), len(self.attempt(BLACK_HOLE).joinpath("PROMPT.md").read_text()))

    # --- guards and statuses ---------------------------------------------------------------------

    def test_agent_error_is_recorded_and_the_run_goes_on(self):
        self.run_bench("fake-fail", f"{BLACK_HOLE},{LANDING}", "--run-id", RUN)
        self.assertEqual(self.attempt_json(BLACK_HOLE, model="fake-fail")["status"], "error")
        self.assertEqual(self.attempt_json(LANDING, model="fake-fail")["status"], "error")

    def test_rate_limit_stops_the_run(self):
        self.run_bench("fake-ratelimit", f"{BLACK_HOLE},{LANDING}", "--run-id", RUN)
        self.assertEqual(self.attempt_json(BLACK_HOLE, model="fake-ratelimit")["status"], "rate_limited")
        self.assertFalse(self.attempt(LANDING, model="fake-ratelimit").exists())

    def test_hard_timeout(self):
        self.run_bench("fake-slow", BLACK_HOLE, "--run-id", RUN, "--timeout", "0.02")
        attempt = self.attempt_json(BLACK_HOLE, model="fake-slow")
        self.assertEqual(attempt["status"], "timeout")
        self.assertLess(attempt["duration_s"], 15)

    def test_budget_stops_an_api_billed_run(self):
        self.run_bench("fake-api", f"{BLACK_HOLE},{LANDING}", "--run-id", RUN, "--budget", "0.1")
        self.assertEqual(self.attempt_json(BLACK_HOLE, model="fake-api")["billing"], "api")
        self.assertFalse(self.attempt(LANDING, model="fake-api").exists(), "0.25 $ spent is over the 0.10 $ budget")

    def test_subscription_ignores_the_dollar_budget(self):
        self.run_bench("fake", f"{BLACK_HOLE},{LANDING}", "--run-id", RUN, "--budget", "0.1")
        self.assertTrue(self.attempt(LANDING).exists())

    def test_invalid_requests_are_refused_without_writing(self):
        cases = [
            ("run", "--model", "nope", "--ids", BLACK_HOLE, "--yes"),
            ("run", "--model", "fake", "--ids", "zz-99", "--yes"),
            ("run", "--model", "fake", "--ids", BLACK_HOLE, "--iterate", "--yes"),
            ("run", "--model", "fake", "--ids", BLACK_HOLE, "--run", "2020-01-01-a", "--yes"),
        ]
        for args in cases:
            with self.subTest(args=args):
                self.assertNotEqual(self.bench(*args).returncode, 0)
        self.assertFalse((self.data / "fake").exists())
        self.run_bench("fake", BLACK_HOLE, "--run-id", RUN)
        self.assertNotEqual(self.run_bench("fake", BLACK_HOLE, "--run-id", RUN, check=False).returncode, 0)

    # --- stop --------------------------------------------------------------------------------------

    def test_stop_aborts_a_running_run(self):
        runner = self.spawn("run", "--model", "fake-slow", "--ids", f"{BLACK_HOLE},{LANDING}", "--yes", "--run-id", RUN)
        folder = self.attempt(BLACK_HOLE, model="fake-slow")
        for _ in range(100):
            if (folder / "output.log").exists() and len(self.registered()) == 1:
                break
            time.sleep(0.1)
        listed = json.loads(self.bench("stop", "--list", "--json", check=True).stdout)
        self.assertEqual([(item["kind"], item["model"], item["run"], item["tests"]) for item in listed],
                         [("run", "fake-slow", RUN, [BLACK_HOLE, LANDING])])
        stopped = json.loads(self.bench("stop", "--test", "3d-06", "--json", check=True).stdout)
        self.assertEqual(len(stopped), 1)
        self.assertIsNotNone(runner.wait(10))
        self.assertEqual(json.loads((folder / "attempt.json").read_text())["status"], "aborted")
        self.assertFalse(self.attempt(LANDING, model="fake-slow").exists(), "an aborted run does not go on")
        self.assertEqual(self.registered(), [])
        agents = subprocess.run(["pgrep", "-f", f"{self.tmp}/agent.py"], capture_output=True, text=True).stdout
        self.assertEqual(agents.strip(), "", "the agent process group is gone")

    def test_stop_filters_leave_other_processes_alone(self):
        runner = self.spawn("run", "--model", "fake-slow", "--ids", BLACK_HOLE, "--yes", "--run-id", RUN)
        for _ in range(100):
            if self.registered():
                break
            time.sleep(0.1)
        for args in (("--demos",), ("--test", "web-01"), ("fake",)):
            with self.subTest(args=args):
                self.assertEqual(json.loads(self.bench("stop", *args, "--json", check=True).stdout), [])
        self.assertIsNone(runner.poll())
        self.bench("stop", "fake-slow", "--runs", check=True)
        self.assertIsNotNone(runner.wait(10))

    # --- demos -------------------------------------------------------------------------------------

    def test_start_serves_a_result_until_stopped(self):
        self.run_bench("fake", BLACK_HOLE, "--run-id", RUN)
        server = self.spawn("start", f"fake/{RUN}/3d-06")
        info = json.loads(server.stdout.readline())
        self.assertTrue(info["ok"], info)
        with urllib.request.urlopen(info["url"], timeout=5) as response:
            self.assertIn("<h1>version</h1>", response.read().decode())
        attempt = self.attempt_json(BLACK_HOLE)
        self.assertEqual((attempt["start"], attempt["stack"]), ("ok", "HTML/JS statique"))
        listed = json.loads(self.bench("stop", "--list", "--json", check=True).stdout)
        self.assertEqual([(item["kind"], item["tests"]) for item in listed], [("demo", [BLACK_HOLE])])
        self.bench("stop", "--demos", check=True)
        self.assertIsNotNone(server.wait(10))
        with self.assertRaises(OSError):
            urllib.request.urlopen(info["url"], timeout=2)

    def test_check_reports_projects_that_do_not_start(self):
        self.run_bench("fake-fail", BLACK_HOLE, "--run-id", RUN)
        result = self.bench("open", f"fake-fail/{RUN}", "--check", check=True)
        self.assertIn("KO", result.stdout)
        self.assertIn("0/1 start", result.stdout)
        self.assertEqual(self.attempt_json(BLACK_HOLE, model="fake-fail")["start"], "ko")

    def test_check_runs_the_project_tests(self):
        self.run_bench("fake", BLACK_HOLE, "--run-id", RUN)
        result = self.bench("open", f"fake/{RUN}", "--check", check=True)
        self.assertIn("1/1 start", result.stdout)
        self.assertEqual(self.attempt_json(BLACK_HOLE)["self_tests"], "none")

    @unittest.skipUnless(Path("/Applications/Google Chrome.app").exists(), "needs Chrome")
    def test_delivered_attempts_are_captured_and_shots_syncs_the_missing_ones(self):
        config = json.loads((self.config / "bench.config.json").read_text())
        (self.config / "bench.config.json").write_text(json.dumps({**config, "shots": True}))
        self.run_bench("fake", BLACK_HOLE, "--run-id", RUN)
        shot = self.attempt(BLACK_HOLE) / "captures" / "screenshot.jpg"
        self.assertTrue(shot.exists(), "captured at the end of the attempt")
        self.assertEqual(self.attempt_json(BLACK_HOLE)["start"], "ok")
        self.run_bench("fake", LANDING, "--run", RUN, "--no-shots")
        self.assertFalse((self.attempt(LANDING) / "captures").exists())
        self.run_bench("fake-fail", BLACK_HOLE, "--run-id", RUN)
        synced = self.bench("shots", check=True).stdout
        self.assertIn("1 capture(s) to take", synced, "only the delivered attempt without a capture")
        self.assertTrue((self.attempt(LANDING) / "captures" / "screenshot.jpg").exists())
        self.assertIn("0 capture(s) to take", self.bench("shots", "fake", check=True).stdout)

    def test_open_without_target_lists_results(self):
        self.run_bench("fake", BLACK_HOLE, "--run-id", RUN)
        self.assertIn(f"bench open fake/{RUN}/3d-06/attempt-1", self.bench("open", check=True).stdout)


if __name__ == "__main__":
    unittest.main()
