import "server-only";
import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import readline from "node:readline";
import { env } from "@/env";

export type DemoStart = { ok: true; url: string } | { ok: false; error: string };

type RunningDemo = { key: string; child: ChildProcess; ready: Promise<DemoStart>; startedAt: number };

const START_TIMEOUT_MS = 240_000;

// Survives Next.js module reloads in development.
const registry = ((globalThis as { __benchDemos?: Map<string, RunningDemo> }).__benchDemos ??= new Map());

/** Start `bench start <target>` once per target and resolve with the URL it prints. */
export function startDemoProcess(target: string): Promise<DemoStart> {
  const existing = registry.get(target);
  if (existing && existing.child.exitCode === null) return existing.ready;

  const child = spawn("python3", [path.join(env.BENCH_REPO, "scripts", "bench.py"), "start", target], {
    cwd: env.BENCH_REPO,
    detached: true,
    stdio: ["ignore", "pipe", "ignore"],
  });
  const ready = new Promise<DemoStart>((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false, error: "La démo n'a pas démarré à temps." }), START_TIMEOUT_MS);
    readline.createInterface({ input: child.stdout! }).once("line", (line) => {
      clearTimeout(timer);
      try {
        const data = JSON.parse(line) as { ok: boolean; url: string | null; log: string | null };
        resolve(data.ok && data.url ? { ok: true, url: data.url } : { ok: false, error: data.log ?? "Le projet ne démarre pas." });
      } catch {
        resolve({ ok: false, error: line });
      }
    });
    child.once("exit", () => {
      clearTimeout(timer);
      registry.delete(target);
      resolve({ ok: false, error: "Le processus de démo s'est arrêté." });
    });
  });
  registry.set(target, { key: target, child, ready, startedAt: Date.now() });
  return ready;
}

export function stopDemoProcess(target: string): void {
  const demo = registry.get(target);
  if (!demo?.child.pid) return;
  try {
    process.kill(-demo.child.pid, "SIGTERM");
  } catch {
    demo.child.kill("SIGTERM");
  }
  registry.delete(target);
}

export function listDemoProcesses(): { key: string; startedAt: number }[] {
  return [...registry.values()].map(({ key, startedAt }) => ({ key, startedAt }));
}
