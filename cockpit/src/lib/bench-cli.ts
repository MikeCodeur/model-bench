import "server-only";
import { execFile, execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { env } from "@/env";
import type { BenchProcess, BenchProcessKind } from "@/services/types/domain/process-types";

export type BenchCommand =
  | { kind: "run"; model: string; runId: string; tests: string[] }
  | { kind: "retry"; model: string; run: string; tests: string[] }
  | { kind: "iterate"; model: string; run: string; tests: string[]; delta: string };

const benchScript = () => path.join(env.BENCH_REPO, "scripts", "bench.py");

/** Validated command → argv for `bench`. Never a shell string. */
export function benchArgs(command: BenchCommand): string[] {
  const args = ["run", "--model", command.model, "--ids", command.tests.join(","), "--yes"];
  if (command.kind === "run") return [...args, "--run-id", command.runId];
  if (command.kind === "retry") return [...args, "--run", command.run];
  return [...args, "--run", command.run, "--delta", command.delta];
}

/** Start `bench` detached in its own process group, output appended to a log file. Returns the pid. */
export function spawnBench(args: string[], logFile: string): number {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const out = fs.openSync(logFile, "a");
  const child = spawn("python3", [benchScript(), ...args], {
    cwd: env.BENCH_REPO,
    detached: true,
    stdio: ["ignore", out, out],
    // eslint-disable-next-line no-restricted-properties -- the child inherits the whole environment, it is not config
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  child.unref();
  fs.closeSync(out);
  if (!child.pid) throw new Error("bench did not start");
  return child.pid;
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Only a Python process executing `bench.py run --model <model>` counts, not a shell or editor mentioning it. */
export function runnerPattern(model: string): string {
  const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `^[^ ]*python[0-9.]* [^ ]*bench\\.py run --model ${escaped}( |$)`;
}

/** Is a `bench run` process working on this model right now (started from the cockpit or a terminal)? */
export function isRunnerAlive(model: string): boolean {
  try {
    execFileSync("pgrep", ["-i", "-f", runnerPattern(model)], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export type BenchStopFilter = { kind?: BenchProcessKind; model?: string };

function stopArgs(filter: BenchStopFilter): string[] {
  return ["stop", ...(filter.model ? [filter.model] : []), ...(filter.kind === "run" ? ["--runs"] : filter.kind === "demo" ? ["--demos"] : []), "--json"];
}

/** Every process started by `bench` (cockpit or terminal), via `bench stop --list`. */
export async function listBenchProcesses(filter: BenchStopFilter = {}): Promise<BenchProcess[]> {
  const { stdout } = await promisify(execFile)("python3", [benchScript(), ...stopArgs(filter), "--list"], { cwd: env.BENCH_REPO });
  return JSON.parse(stdout) as BenchProcess[];
}

/** `bench stop`: SIGTERM so runs mark their attempt `aborted` and servers clean up, SIGKILL after the grace delay. */
export async function stopBenchProcesses(filter: BenchStopFilter = {}): Promise<BenchProcess[]> {
  const { stdout } = await promisify(execFile)("python3", [benchScript(), ...stopArgs(filter)], { cwd: env.BENCH_REPO, timeout: 60_000 });
  return JSON.parse(stdout) as BenchProcess[];
}
