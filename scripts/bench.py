#!/usr/bin/env python3
"""Run model-bench benchmarks on a declared model, then open or check the results."""

from __future__ import annotations

import argparse
import functools
import html
import threading
import importlib.util
import json
import os
import platform
import re
import shlex
import shutil
import signal
import socket
import string
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import webbrowser
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = 1
IGNORED = ("node_modules", ".next", "dist", ".turbo", ".cache", ".vite", ".parcel-cache", "coverage", ".git", ".pnpm-store")
RATE_LIMIT = re.compile(r"rate.?limit|usage limit|quota|\b429\b|overloaded", re.IGNORECASE)
STOPPING_STATUSES = {"rate_limited", "aborted"}

spec = importlib.util.spec_from_file_location("prepare_run", ROOT / "scripts" / "prepare-run.py")
preparer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preparer)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def data_dir() -> Path:
    return Path(os.environ.get("MODEL_BENCH_DATA", Path.home() / "model-bench-data"))


def build_args(command: str, prompt: str) -> list[str]:
    return [part.replace("{prompt}", prompt) for part in shlex.split(command)]


def resolve_ids(benches: list[dict], ids: str | None) -> str | None:
    """Accept short prefixes such as 3d-06 in place of full benchmark ids."""
    if not ids:
        return ids
    known = [bench["id"] for bench in benches]
    resolved = []
    for token in (item.strip() for item in ids.split(",") if item.strip()):
        matches = [bench_id for bench_id in known if bench_id == token or bench_id.startswith(token + "-")]
        resolved.append(matches[0] if len(matches) == 1 else token)
    return ",".join(resolved)


def next_run_id(model_dir: Path, day: str) -> str:
    for letter in string.ascii_lowercase:
        if not (model_dir / f"{day}-{letter}").exists():
            return f"{day}-{letter}"
    raise SystemExit(f"Too many runs on {day}")


def attempt_numbers(test_dir: Path) -> list[int]:
    if not test_dir.exists():
        return []
    return sorted(int(path.name.split("-")[1]) for path in test_dir.glob("attempt-*"))


def tool_version(command: str | None) -> str | None:
    if not command:
        return None
    try:
        result = subprocess.run(shlex.split(command), capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.TimeoutExpired):
        return None
    lines = (result.stdout or result.stderr).strip().splitlines()
    return lines[0] if lines else None


def suite_commit() -> str | None:
    commit = tool_version(f"git -C {shlex.quote(str(ROOT))} rev-parse --short HEAD")
    dirty = subprocess.run(["git", "-C", str(ROOT), "status", "--porcelain"], capture_output=True, text=True).stdout.strip()
    return f"{commit}-dirty" if commit and dirty else commit


def environment() -> dict:
    return {
        "os": f"{platform.system()} {platform.mac_ver()[0] or platform.release()}",
        "arch": platform.machine(),
        "node": tool_version("node --version"),
        "pnpm": tool_version("pnpm --version"),
    }


def newest_mtime(path: Path) -> float:
    newest = path.stat().st_mtime
    for current, dirs, files in os.walk(path):
        dirs[:] = [name for name in dirs if name not in IGNORED]
        for name in files:
            try:
                newest = max(newest, os.lstat(os.path.join(current, name)).st_mtime)
            except OSError:
                pass
    return newest


def kill_group(pgid: int) -> None:
    for sig in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.killpg(pgid, sig)
        except (ProcessLookupError, PermissionError):
            return
        for _ in range(50):
            try:
                os.killpg(pgid, 0)
            except (ProcessLookupError, PermissionError):
                return
            time.sleep(0.1)


def kill_leftovers(work: Path) -> int:
    """Kill processes that escaped the process group but still run inside the work dir."""
    root = os.path.realpath(work)
    result = subprocess.run(["lsof", "-d", "cwd", "-Fpn"], capture_output=True, text=True)
    killed, pid = 0, None
    for line in result.stdout.splitlines():
        if line.startswith("p"):
            pid = int(line[1:])
        elif line.startswith("n") and pid and pid != os.getpid() and os.path.realpath(line[1:]).startswith(root):
            try:
                os.kill(pid, signal.SIGKILL)
                killed += 1
            except ProcessLookupError:
                pass
    return killed


def execute(args: list[str], work: Path, log_path: Path, timeout_s: float, idle_s: float) -> tuple[int | None, str | None, float]:
    """Run the agent with hard and idle timeouts. Returns (exit code, forced status, duration)."""
    started = time.monotonic()
    last_activity = time.time()
    last_size = 0
    forced = None
    with log_path.open("wb") as log:
        proc = subprocess.Popen(args, cwd=work, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            while proc.poll() is None:
                time.sleep(2)
                size = log_path.stat().st_size
                if size != last_size:
                    last_size, last_activity = size, time.time()
                if time.monotonic() - started > timeout_s:
                    forced = "timeout"
                    break
                if time.time() - max(last_activity, newest_mtime(work)) > idle_s:
                    forced = "stalled"
                    break
        except KeyboardInterrupt:
            forced = "aborted"
        finally:
            kill_group(proc.pid)
            proc.wait()
    return (None if forced else proc.returncode), forced, round(time.monotonic() - started, 1)


def parse_usage(parser: str | None, log_path: Path) -> tuple[dict, float | None, str | None]:
    tokens = {"input": None, "output": None, "cache_read": None, "cache_write": None}
    if parser != "claude-stream-json":
        return tokens, None, None
    cost, model_id = None, None
    for line in log_path.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get("type") == "system" and event.get("subtype") == "init":
            model_id = event.get("model")
        if event.get("type") == "result":
            usage = event.get("usage") or {}
            tokens = {
                "input": usage.get("input_tokens"),
                "output": usage.get("output_tokens"),
                "cache_read": usage.get("cache_read_input_tokens"),
                "cache_write": usage.get("cache_creation_input_tokens"),
            }
            cost = event.get("total_cost_usd")
    return tokens, cost, model_id


def price_cost(price: dict | None, tokens: dict) -> float | None:
    if not price or tokens["input"] is None or tokens["output"] is None:
        return None
    return round((tokens["input"] * price["input"] + tokens["output"] * price["output"]) / 1_000_000, 4)


def final_status(exit_code: int | None, forced: str | None, log_path: Path) -> str:
    if forced:
        return forced
    if exit_code == 0:
        return "ok"
    tail = log_path.read_bytes()[-4000:].decode("utf-8", errors="replace")
    return "rate_limited" if RATE_LIMIT.search(tail) else "error"


def split_sections(prompt: str) -> dict[str, str]:
    sections = {}
    for chunk in ("\n" + prompt).split("\n## ")[1:]:
        title, _, body = chunk.partition("\n")
        sections[title.strip()] = body.strip()
    return sections


def delta_prompt(bench: dict, base_prompt: str, full_prompt: str, extra: str | None) -> str:
    """Prompt for an iteration: only what changed since the base attempt, plus optional free text."""
    before = split_sections(base_prompt)
    changed = [f"## {title}\n\n{body}" for title, body in split_sections(full_prompt).items() if before.get(title) != body]
    if extra:
        changed.append(f"## Demandes supplémentaires\n\n{extra}")
    if not changed:
        raise SystemExit(f"{bench['id']}: prompt unchanged since the base attempt, use --delta to say what to change")
    body = "\n\n".join(changed)
    return f"""# {bench['title']} — itération

Ce dossier contient ton projet existant pour ce test. Garde tout ce qui fonctionne déjà, ne repars pas de zéro.

Ajoute ou mets à jour uniquement ce qui suit :

{body}

Le contrat de lancement reste valable. Vérifie que le projet démarre toujours et que les critères d'acceptation d'origine restent remplis.
"""


def collect_attempts(run_dir: Path) -> list[dict]:
    """run.json summary rebuilt from attempt.json files, the source of truth."""
    keys = ("test", "attempt", "status", "duration_s", "cost_usd", "based_on")
    return [
        {key: attempt.get(key) for key in keys}
        for attempt in (load_json(path) for path in sorted(run_dir.glob("*/attempt-*/attempt.json")))
    ]


def run_attempt(bench: dict, number: int, run_dir: Path, run: dict, model: dict, catalog: dict, guards: dict,
                base: Path | None = None, extra: str | None = None) -> dict:
    attempt_dir = run_dir / bench["id"] / f"attempt-{number}"
    full_prompt = preparer.render_prompt(bench, catalog["common_contract"])
    prompt = full_prompt
    if base:
        prompt = delta_prompt(bench, (base / "PROMPT.md").read_text(encoding="utf-8"), full_prompt, extra)
    attempt_dir.mkdir(parents=True)
    (attempt_dir / "PROMPT.md").write_text(prompt, encoding="utf-8")
    (attempt_dir / "command.txt").write_text(model["command"] + "\n", encoding="utf-8")
    work_root = Path(tempfile.gettempdir()) / "model-bench"
    work_root.mkdir(exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix=f"{bench['id']}-", dir=work_root))
    if base:
        shutil.copytree(base / "workspace", work, symlinks=True, dirs_exist_ok=True)
    log_path = attempt_dir / "output.log"
    started_at = now_iso()
    exit_code, forced, duration = execute(
        build_args(model["command"], prompt), work, log_path, guards["timeout_min"] * 60, guards["idle_timeout_min"] * 60
    )
    leftovers = kill_leftovers(work)
    shutil.copytree(work, attempt_dir / "workspace", ignore=shutil.ignore_patterns(*IGNORED), symlinks=True)
    shutil.rmtree(work, ignore_errors=True)
    tokens, cost, model_id = parse_usage(model.get("parser"), log_path)
    cost_source = "cli" if cost is not None else None
    if cost is None:
        cost = price_cost(model.get("price"), tokens)
        cost_source = "computed" if cost is not None else None
    attempt = {
        "schema_version": SCHEMA_VERSION,
        "model": run["model"],
        "test": bench["id"],
        "run": run["run"],
        "attempt": number,
        "kind": "iteration" if base else "fresh",
        "based_on": base.name if base else None,
        "model_id": model_id or model.get("model_id"),
        "cli_version": run["cli_version"],
        "suite_commit": run["suite_commit"],
        "env": run["env"],
        "started_at": started_at,
        "duration_s": duration,
        "exit_code": exit_code,
        "status": final_status(exit_code, forced, log_path),
        "leftover_processes_killed": leftovers,
        "start": None,
        "tokens": tokens,
        "cost_usd": cost,
        "cost_source": cost_source,
        "billing": model.get("billing", "api"),
        "score": None,
        "notes": "",
    }
    write_json(attempt_dir / "attempt.json", attempt)
    return attempt


def cmd_run(args: argparse.Namespace) -> None:
    catalog = preparer.load_catalog()
    models = load_json(ROOT / "models.json")
    if args.model not in models:
        raise SystemExit(f"Unknown model {args.model}. Declared: {', '.join(models)}")
    model = models[args.model]
    guards = load_json(ROOT / "bench.config.json")
    if args.timeout:
        guards["timeout_min"] = args.timeout
    if args.budget is not None:
        guards["run_budget_usd"] = args.budget
    budget = None if model.get("billing") == "subscription" else guards["run_budget_usd"]

    benches = preparer.select_benchmarks(catalog, args.category, resolve_ids(catalog["benchmarks"], args.ids))
    model_dir = data_dir() / args.model
    run_id = args.run or next_run_id(model_dir, datetime.now().strftime("%Y-%m-%d"))
    run_dir = model_dir / run_id
    if args.delta:
        args.iterate = True
    if args.iterate and not args.run:
        raise SystemExit("--iterate needs --run: an iteration continues an existing run")
    if args.run and not run_dir.exists():
        raise SystemExit(f"Run not found: {run_dir}")

    planned = []
    for bench in benches:
        number = len(attempt_numbers(run_dir / bench["id"])) + 1
        if number > guards["max_attempts"]:
            print(f"skip {bench['id']}: {guards['max_attempts']} attempts already")
        else:
            planned.append((bench, number))
    if not planned:
        raise SystemExit("Nothing to run")

    print(f"Model   {model['label']} ({args.model})")
    print(f"Run     {run_dir}")
    print(f"Guards  timeout {guards['timeout_min']} min, idle {guards['idle_timeout_min']} min, "
          f"budget {'n/a (subscription)' if budget is None else f'{budget} $'}")
    for bench, number in planned:
        print(f"  - {bench['id']} (attempt {number}{', iteration' if args.iterate else ''})")
    print(f"Worst case: {len(planned) * guards['timeout_min']} min")
    if not args.yes and input("Launch? [y/N] ").strip().lower() not in ("y", "o", "yes", "oui"):
        raise SystemExit("Cancelled")

    run_dir.mkdir(parents=True, exist_ok=True)
    run_path = run_dir / "run.json"
    run = load_json(run_path) if run_path.exists() else {
        "schema_version": SCHEMA_VERSION,
        "model": args.model,
        "label": model["label"],
        "command": model["command"],
        "run": run_id,
        "created_at": now_iso(),
        "attempts": [],
    }
    run.update(suite_commit=suite_commit(), cli_version=tool_version(model.get("version_command")), env=environment(), guards=guards)

    for bench, number in planned:
        spent = sum(item["cost_usd"] or 0 for item in run["attempts"])
        if budget is not None and spent >= budget:
            print(f"Budget reached ({spent:.2f} $), stopping")
            break
        print(f"> {bench['id']} attempt {number} ...", flush=True)
        base = None
        if args.iterate:
            previous = attempt_numbers(run_dir / bench["id"])
            if not previous:
                print(f"skip {bench['id']}: no previous attempt to iterate on")
                continue
            base = run_dir / bench["id"] / f"attempt-{previous[-1]}"
        attempt = run_attempt(bench, number, run_dir, run, model, catalog, guards, base, args.delta)
        run["attempts"] = collect_attempts(run_dir)
        run["totals"] = {
            "attempts": len(run["attempts"]),
            "ok": sum(item["status"] == "ok" for item in run["attempts"]),
            "duration_s": round(sum(item["duration_s"] for item in run["attempts"]), 1),
            "cost_usd": round(sum(item["cost_usd"] or 0 for item in run["attempts"]), 4),
        }
        write_json(run_path, run)
        cost = "" if attempt["cost_usd"] is None else f", {attempt['cost_usd']} $"
        print(f"  {attempt['status']} in {attempt['duration_s']} s{cost}", flush=True)
        if attempt["status"] in STOPPING_STATUSES:
            print(f"Stopping run: {attempt['status']}")
            break
    print(f"Done: {run_dir}")


def find_dir(parent: Path, token: str) -> Path:
    candidates = [path for path in parent.iterdir() if path.is_dir() and (path.name == token or path.name.startswith(token + "-"))]
    if len(candidates) != 1:
        raise SystemExit(f"Cannot resolve '{token}' in {parent}")
    return candidates[0]


def resolve_attempts(target: str) -> list[Path]:
    """model/run -> latest attempt of every test; model/run/test[/attempt-n] -> one attempt."""
    parts = target.strip("/").split("/")
    if len(parts) < 2:
        raise SystemExit("Target must be <model>/<run>[/<test>[/attempt-<n>]]")
    run_dir = data_dir() / parts[0] / parts[1]
    if not run_dir.is_dir():
        raise SystemExit(f"Run not found: {run_dir}")
    tests = [find_dir(run_dir, parts[2])] if len(parts) > 2 else sorted(p for p in run_dir.iterdir() if p.is_dir())
    if len(parts) > 3:
        return [tests[0] / parts[3]]
    return [test / f"attempt-{attempt_numbers(test)[-1]}" for test in tests if attempt_numbers(test)]


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_http(port: int, proc: subprocess.Popen, timeout_s: float) -> bool:
    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline and proc.poll() is None:
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=2)
            return True
        except urllib.error.HTTPError as error:
            return error.code < 500
        except (urllib.error.URLError, OSError):
            time.sleep(1)
    return False


def launch_command(app: Path, port: int) -> list[str] | None:
    package = app / "package.json"
    if package.exists() and load_json(package).get("scripts", {}).get("start"):
        return ["pnpm", "start"]
    if (app / "index.html").exists():
        return [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1"]
    return None


KNOWN_DEPS = {
    "three": "Three.js", "@react-three/fiber": "React Three Fiber", "react": "React", "next": "Next.js", "vue": "Vue",
    "svelte": "Svelte", "vite": "Vite", "pixi.js": "PixiJS", "phaser": "Phaser", "d3": "D3", "chart.js": "Chart.js",
    "recharts": "Recharts", "tailwindcss": "Tailwind", "typescript": "TypeScript", "express": "Express",
    "fastify": "Fastify", "hono": "Hono", "better-sqlite3": "SQLite", "matter-js": "Matter.js", "cannon-es": "cannon-es",
    "@dimforge/rapier3d-compat": "Rapier",
}
RAW_APIS = (("webgpu", "WebGPU"), ("webgl2", "WebGL2"), ("'webgl'", "WebGL"), ('"webgl"', "WebGL"), ("getcontext('2d')", "Canvas 2D"), ('getcontext("2d")', "Canvas 2D"))


def detect_stack(app: Path) -> str:
    stack = []
    package = app / "package.json"
    if package.exists():
        data = load_json(package)
        deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
        stack += [label for name, label in KNOWN_DEPS.items() if name in deps]
    sources = ""
    for current, dirs, files in os.walk(app):
        dirs[:] = [name for name in dirs if name not in IGNORED]
        for name in files:
            if name.endswith((".js", ".mjs", ".ts", ".tsx", ".jsx", ".html")):
                sources += (Path(current) / name).read_text(errors="replace").lower()
    for needle, label in RAW_APIS:
        if needle in sources and label not in stack and not (label.startswith("WebGL") and "Three.js" in stack):
            stack.append(label)
    stack.append("Node" if package.exists() else "HTML/JS statique")
    return " · ".join(dict.fromkeys(stack))


def info_page(attempt: dict, bench: dict, run: dict, stack: str, app_url: str) -> str:
    started = datetime.fromisoformat(attempt["started_at"]).astimezone().strftime("%d/%m/%Y %H:%M")
    version = f"tentative {attempt['attempt']}"
    if attempt.get("based_on"):
        version += f" (itération de {attempt['based_on']})"
    cost = "" if attempt.get("cost_usd") is None else f"{attempt['cost_usd']:.2f} $"
    minutes = f"{attempt['duration_s'] / 60:.1f} min"
    parts = [bench["title"], bench["id"], f"{run.get('label', attempt['model'])} ({attempt.get('model_id')})",
             started, version, stack, minutes, cost, attempt["status"]]
    line = " · ".join(html.escape(str(part)) for part in parts if part)
    return f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>{html.escape(bench['title'])} — {html.escape(attempt['model'])}</title>
<style>
  html, body {{ margin: 0; height: 100%; background: #000; }}
  iframe {{ border: 0; width: 100%; height: calc(100% - 22px); display: block; }}
  footer {{ height: 22px; line-height: 22px; padding: 0 10px; font: 11px/22px ui-monospace, Menlo, monospace;
           color: #8a8a8a; background: #0b0b0b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
  body.hidden iframe {{ height: 100%; }} body.hidden footer {{ display: none; }}
</style></head>
<body>
<iframe src="{app_url}" allow="fullscreen; autoplay"></iframe>
<footer title="Touche i : masquer / afficher">{line}</footer>
<script>addEventListener("keydown", e => {{ if (e.key === "i" && e.target === document.body) document.body.classList.toggle("hidden") }});
document.querySelector("iframe").addEventListener("load", e => {{ try {{ e.target.contentWindow.addEventListener("keydown", ev => {{ if (ev.key === "i" && !/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) document.body.classList.toggle("hidden") }}) }} catch (_) {{}} }});</script>
</body></html>
"""


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


def serve_info_page(directory: Path) -> ThreadingHTTPServer:
    handler = functools.partial(QuietHandler, directory=str(directory))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


class App:
    """A result copied to a temp dir and started with the launch contract."""

    def __init__(self, attempt_dir: Path) -> None:
        self.attempt_dir = attempt_dir
        self.tmp = Path(tempfile.mkdtemp(prefix="model-bench-open-"))
        self.app = self.tmp / "app"
        self.port = free_port()
        self.proc: subprocess.Popen | None = None
        self.log_path = self.tmp / "open.log"
        self.command: list[str] | None = None

    def start(self) -> bool:
        shutil.copytree(self.attempt_dir / "workspace", self.app, symlinks=True)
        env = {**os.environ, "PORT": str(self.port), "npm_config_strict_dep_builds": "false", "CI": "true"}
        ok = False
        with self.log_path.open("wb") as log:
            self.command = launch_command(self.app, self.port)
            if self.command and self.command[0] == "pnpm":
                subprocess.run(["pnpm", "install"], cwd=self.app, env=env, stdout=log, stderr=subprocess.STDOUT, timeout=600)
            if self.command:
                self.proc = subprocess.Popen(self.command, cwd=self.app, env=env, stdin=subprocess.DEVNULL,
                                             stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
                ok = wait_http(self.port, self.proc, 180)
        attempt = load_json(self.attempt_dir / "attempt.json")
        attempt.update(start="ok" if ok else "ko", start_checked_at=now_iso())
        write_json(self.attempt_dir / "attempt.json", attempt)
        return ok

    def run_tests(self) -> str:
        """Run the project's own `pnpm test`: pass, fail or none."""
        package = self.app / "package.json"
        if not package.exists() or not load_json(package).get("scripts", {}).get("test"):
            result = "none"
        else:
            env = {**os.environ, "CI": "true", "npm_config_strict_dep_builds": "false"}
            with (self.tmp / "test.log").open("wb") as log:
                try:
                    code = subprocess.run(["pnpm", "test"], cwd=self.app, env=env, stdin=subprocess.DEVNULL,
                                          stdout=log, stderr=subprocess.STDOUT, timeout=300, start_new_session=True).returncode
                    result = "pass" if code == 0 else "fail"
                except subprocess.TimeoutExpired:
                    result = "fail"
        attempt = load_json(self.attempt_dir / "attempt.json")
        attempt["self_tests"] = result
        write_json(self.attempt_dir / "attempt.json", attempt)
        return result

    def info_html(self) -> str:
        attempt = load_json(self.attempt_dir / "attempt.json")
        bench = next(b for b in preparer.load_catalog()["benchmarks"] if b["id"] == attempt["test"])
        run_path = self.attempt_dir.parents[1] / "run.json"
        run = load_json(run_path) if run_path.exists() else {}
        return info_page(attempt, bench, run, detect_stack(self.app), f"http://127.0.0.1:{self.port}/")

    def label(self) -> str:
        return "/".join(self.attempt_dir.parts[-3:])

    def stop(self) -> None:
        if self.proc:
            kill_group(self.proc.pid)
        shutil.rmtree(self.tmp, ignore_errors=True)


def open_attempt(attempt_dir: Path, check: bool) -> bool:
    if not (attempt_dir / "attempt.json").exists():
        print(f"..  {'/'.join(attempt_dir.parts[-3:])}  still running, nothing to open yet")
        return False
    app = App(attempt_dir)
    try:
        ok = app.start()
        tests = f"  tests {app.run_tests()}" if check else ""
        print(f"{'ok' if ok else 'KO'}  {app.label()}{tests}" + ("" if app.command else "  (no index.html or start script)"))
        if ok and not check:
            wrapper = app.tmp / "wrapper"
            wrapper.mkdir()
            (wrapper / "index.html").write_text(app.info_html(), encoding="utf-8")
            server = serve_info_page(wrapper)
            url = f"http://127.0.0.1:{server.server_address[1]}/"
            webbrowser.open(url)
            print(f"Serving {url}  (key i hides the info bar, Ctrl+C to stop)", flush=True)
            try:
                app.proc.wait()
            except KeyboardInterrupt:
                pass
            finally:
                server.shutdown()
        elif not ok:
            print(app.log_path.read_text(errors="replace")[-1500:])
    finally:
        app.stop()
    return ok


def short_id(test_id: str) -> str:
    return "-".join(test_id.split("-")[:2])


def cmd_serve(args: argparse.Namespace) -> None:
    """Start every attempt of a run behind one fixed port: /<test>/ = latest, /<test>/attempt-<n>/."""
    parts = args.target.strip("/").split("/")
    if len(parts) != 2:
        raise SystemExit("Target must be <model>/<run>")
    run_dir = data_dir() / parts[0] / parts[1]
    attempt_dirs = sorted(p.parent for p in run_dir.glob("*/attempt-*/attempt.json"))
    if not attempt_dirs:
        raise SystemExit(f"No finished attempt in {run_dir}")
    site = Path(tempfile.mkdtemp(prefix="model-bench-serve-"))
    apps: list[App] = []
    links = []
    try:
        for attempt_dir in attempt_dirs:
            app = App(attempt_dir)
            apps.append(app)
            ok = app.start()
            short = short_id(attempt_dir.parent.name)
            page = site / short / attempt_dir.name
            page.mkdir(parents=True)
            (page / "index.html").write_text(app.info_html() if ok else f"<p>{app.label()} does not start</p>", encoding="utf-8")
            print(f"{'ok' if ok else 'KO'}  /{short}/{attempt_dir.name}/", flush=True)
        for test_dir in sorted({d.parent for d in attempt_dirs}):
            latest = f"attempt-{attempt_numbers(test_dir)[-1]}"
            short = short_id(test_dir.name)
            (site / short / "index.html").write_text(f'<meta http-equiv="refresh" content="0; url={latest}/">', encoding="utf-8")
            links.append(f'<li><a href="{short}/">{html.escape(test_dir.name)}</a></li>')
        (site / "index.html").write_text(f"<h1>{html.escape(args.target)}</h1><ul>{''.join(links)}</ul>", encoding="utf-8")
        handler = functools.partial(QuietHandler, directory=str(site))
        server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
        print(f"Serving http://127.0.0.1:{args.port}/  (Ctrl+C to stop)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
    finally:
        for app in apps:
            app.stop()
        shutil.rmtree(site, ignore_errors=True)


def list_results() -> None:
    root = data_dir()
    for attempt_json in sorted(root.glob("*/*/*/attempt-*/attempt.json")):
        attempt = load_json(attempt_json)
        short = "-".join(attempt["test"].split("-")[:2])
        start = {"ok": "starts", "ko": "DOES NOT START"}.get(attempt.get("start"), "not checked")
        print(f"{attempt['status']:<8} {start:<15} bench open {attempt['model']}/{attempt['run']}/{short}/attempt-{attempt['attempt']}")
    running = [p for p in root.glob("*/*/*/attempt-*") if not (p / "attempt.json").exists()]
    for path in running:
        print(f"{'running':<8} {'':<15} {'/'.join(path.parts[-4:])}")
    if not running and not list(root.glob("*/*/*/attempt-*")):
        print(f"No results in {root}")


def cmd_open(args: argparse.Namespace) -> None:
    if not args.target:
        list_results()
        return
    attempts = resolve_attempts(args.target)
    if not args.check and len(attempts) > 1:
        raise SystemExit("Open one test at a time, or use --check for a whole run")
    results = [open_attempt(attempt, args.check) for attempt in attempts]
    if args.check:
        print(f"{sum(results)}/{len(results)} start")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run", help="Run benchmarks on a model")
    run.add_argument("--model", required=True)
    run.add_argument("--category")
    run.add_argument("--ids", help="Comma-separated ids or prefixes (3d-06)")
    run.add_argument("--run", help="Existing run id, to add new attempts")
    run.add_argument("--timeout", type=float, help="Minutes per attempt")
    run.add_argument("--budget", type=float, help="USD per run")
    run.add_argument("--iterate", action="store_true", help="Continue from the latest attempt with a delta prompt")
    run.add_argument("--delta", help="Free-text changes to add to the delta prompt (implies --iterate)")
    run.add_argument("--yes", action="store_true", help="Skip confirmation")
    run.set_defaults(func=cmd_run)
    open_ = sub.add_parser("open", help="Start a result and open it in the browser")
    open_.add_argument("target", nargs="?", help="<model>/<run>[/<test>[/attempt-<n>]]; omit to list results")
    open_.add_argument("--check", action="store_true", help="Only check that it starts, then stop")
    open_.set_defaults(func=cmd_open)
    serve = sub.add_parser("serve", help="Serve every attempt of a run on one fixed port")
    serve.add_argument("target", help="<model>/<run>")
    serve.add_argument("--port", type=int, default=5100)
    serve.set_defaults(func=cmd_serve)
    args = parser.parse_args()
    # Background shells ignore SIGINT and a plain SIGTERM would orphan the agent: route both to the cleanup path.
    signal.signal(signal.SIGINT, signal.default_int_handler)
    signal.signal(signal.SIGTERM, signal.default_int_handler)
    args.func(args)


if __name__ == "__main__":
    main()
