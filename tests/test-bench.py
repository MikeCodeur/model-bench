#!/usr/bin/env python3

import argparse
import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("bench", ROOT / "scripts" / "bench.py")
bench = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench)


def fake_bench(tmp: Path, kind: str, model: str, test: str) -> tuple[subprocess.Popen, subprocess.Popen]:
    """A sleeping `bench.py` process registered like a real one, with one child process group."""
    script = tmp / "bench.py"
    script.write_text("import time\ntime.sleep(60)\n")
    proc = subprocess.Popen(["python3", str(script)])
    child = subprocess.Popen(["sleep", "60"], start_new_session=True)
    procs = tmp / ".bench" / "procs"
    procs.mkdir(parents=True, exist_ok=True)
    entry = {"pid": proc.pid, "kind": kind, "model": model, "run": "2026-09-24-a", "tests": [test], "groups": [child.pid]}
    (procs / f"{proc.pid}.json").write_text(json.dumps(entry))
    return proc, child


class BenchTests(unittest.TestCase):
    def test_stop_by_benchmark_then_everything(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.environ["MODEL_BENCH_DATA"] = tmp
            scan = bench.unregistered_processes
            bench.unregistered_processes = lambda known: []  # never touch the machine's real bench processes
            try:
                run, run_child = fake_bench(Path(tmp), "run", "opus-5-5", "3d-06-black-hole-lensing")
                demo, demo_child = fake_bench(Path(tmp), "demo", "haiku-4-5", "web-01-ai-saas-landing")
                stop = lambda **kw: bench.cmd_stop(argparse.Namespace(**{"target": None, "test": None, "runs": False, "demos": False, "list": False, "json": False, "grace": 5, **kw}))
                stop(test="3d-06")
                self.assertIsNotNone(run.wait(5))
                self.assertIsNotNone(run_child.wait(5))
                self.assertIsNone(demo.poll())
                self.assertEqual([e["pid"] for e in bench.registered_processes()], [demo.pid])
                stop()
                self.assertIsNotNone(demo.wait(5))
                self.assertIsNotNone(demo_child.wait(5))
                self.assertEqual(bench.registered_processes(), [])
            finally:
                bench.unregistered_processes = scan
                del os.environ["MODEL_BENCH_DATA"]
                for proc in (run, run_child, demo, demo_child):
                    proc.kill()

    def test_unregistered_processes_are_read_from_their_command_line(self):
        script = Path(tempfile.mkdtemp()) / "bench.py"
        script.write_text("import time\ntime.sleep(60)\n")
        proc = subprocess.Popen(["python3", str(script), "start", "opus-5-5/2026-09-23-a/3d-06-black-hole-lensing/attempt-2"])
        try:
            found = [e for e in bench.unregistered_processes(set()) if e["pid"] == proc.pid]
            self.assertEqual(found[0]["kind"], "demo")
            self.assertEqual((found[0]["model"], found[0]["run"], found[0]["tests"]), ("opus-5-5", "2026-09-23-a", ["3d-06-black-hole-lensing"]))
        finally:
            proc.kill()

    def test_stale_registration_is_dropped(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.environ["MODEL_BENCH_DATA"] = tmp
            try:
                procs = Path(tmp) / ".bench" / "procs"
                procs.mkdir(parents=True)
                (procs / "999999.json").write_text(json.dumps({"pid": 999999, "groups": []}))
                self.assertEqual(bench.registered_processes(), [])
                self.assertFalse((procs / "999999.json").exists())
            finally:
                del os.environ["MODEL_BENCH_DATA"]

    def test_prompt_stays_one_argument(self):
        prompt = "Line 1\nIt's \"quoted\" `code` $HOME"
        args = bench.build_args('agent -p --flag "" {prompt}', prompt)
        self.assertEqual(args, ["agent", "-p", "--flag", "", prompt])

    def test_resolve_short_ids(self):
        benches = [{"id": "3d-06-black-hole-lensing"}, {"id": "web-01-ai-saas-landing"}]
        self.assertEqual(bench.resolve_ids(benches, "3d-06, web-01"), "3d-06-black-hole-lensing,web-01-ai-saas-landing")

    def test_next_run_id_skips_existing(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "2026-09-23-a").mkdir()
            self.assertEqual(bench.next_run_id(Path(tmp), "2026-09-23"), "2026-09-23-b")

    def test_hard_timeout_kills_agent(self):
        with tempfile.TemporaryDirectory() as tmp:
            work, log = Path(tmp), Path(tmp) / "out.log"
            exit_code, forced, duration = bench.execute(["sleep", "30"], work, log, timeout_s=1, idle_s=60)
            self.assertEqual(forced, "timeout")
            self.assertLess(duration, 10)

    def test_idle_timeout_kills_silent_agent(self):
        with tempfile.TemporaryDirectory() as tmp:
            work, log = Path(tmp) / "w", Path(tmp) / "out.log"
            work.mkdir()
            _, forced, _ = bench.execute(["sleep", "30"], work, log, timeout_s=60, idle_s=1)
            self.assertEqual(forced, "stalled")

    def test_successful_agent(self):
        with tempfile.TemporaryDirectory() as tmp:
            work, log = Path(tmp) / "w", Path(tmp) / "out.log"
            work.mkdir()
            exit_code, forced, _ = bench.execute(["sh", "-c", "echo hi > index.html"], work, log, 60, 60)
            self.assertEqual((exit_code, forced), (0, None))
            self.assertEqual(bench.final_status(exit_code, forced, log), "ok")
            self.assertTrue((work / "index.html").is_file())

    def test_delta_prompt_keeps_only_changes(self):
        base = "# T\n\n## Mission\n\nDo it\n\n## Contrat\n\nsame"
        full = "# T\n\n## Mission\n\nDo it\n\n## Contrat\n\nsame\n\n## Pilotage\n\n- speed"
        delta = bench.delta_prompt({"id": "x", "title": "T"}, base, full, "Rends le disque plus brillant")
        self.assertIn("## Pilotage", delta)
        self.assertIn("Rends le disque plus brillant", delta)
        self.assertNotIn("## Mission", delta)

    def test_delta_prompt_refuses_empty_change(self):
        with self.assertRaises(SystemExit):
            bench.delta_prompt({"id": "x", "title": "T"}, "# T\n\n## A\n\nx", "# T\n\n## A\n\nx", None)


if __name__ == "__main__":
    unittest.main()
