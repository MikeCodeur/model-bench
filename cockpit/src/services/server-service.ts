import { z } from "zod";
import { listBenchProcesses, stopBenchProcesses } from "@/lib/bench-cli";
import { listDemoProcesses } from "@/lib/demo-process";
import { bestAttempt } from "@/services/attempt-state";
import { closeJobs } from "@/services/job-service";
import { startDemoService } from "@/services/demo-service";
import { listRunDetailsService } from "@/services/run-service";
import type { Attempt } from "@/services/types/domain/attempt-types";
import type { BenchProcess } from "@/services/types/domain/process-types";
import { modelIdSchema, parseOrThrow, runIdSchema, testIdSchema } from "@/services/validation/ref-validation";

/** A process started by bench, plus the demo URL when the cockpit started it. */
export type ServerView = BenchProcess & { url: string | null };

const scopeSchema = z.object({
  kind: z.enum(["run", "demo"]).optional(),
  model: modelIdSchema.optional(),
  run: runIdSchema.optional(),
  test: testIdSchema.optional(),
  pid: z.number().int().positive().optional(),
});

export type ServerScope = z.infer<typeof scopeSchema>;

/** Every run and demo server alive right now, from the cockpit or a terminal. */
export async function listServersService(): Promise<ServerView[]> {
  const [processes, demos] = [await listBenchProcesses(), listDemoProcesses()];
  return processes.map((item) => ({
    ...item,
    url: demos.find((demo) => demo.pid === item.pid || (item.kind === "demo" && demo.key.startsWith(`${item.model}/${item.run}/${item.tests[0]}/`)))?.url ?? null,
  }));
}

/** Stop what matches the scope: everything, one kind, a model, a run, a benchmark or a single process. */
export async function stopServersService(input: ServerScope = {}): Promise<BenchProcess[]> {
  const scope = parseOrThrow(scopeSchema, input);
  const stopped = await stopBenchProcesses(scope);
  if (stopped.some((item) => item.kind === "run")) await closeJobs(scope.model);
  return stopped;
}

/** Delivered attempts to serve: the latest one per benchmark of a run, or the best one per benchmark of a model. */
export async function demoTargetsService(input: { model?: string; run?: string } = {}): Promise<Attempt[]> {
  const scope = parseOrThrow(scopeSchema.pick({ model: true, run: true }), input);
  const runs = (await listRunDetailsService()).filter((run) => (!scope.model || run.model === scope.model) && (!scope.run || run.run === scope.run));
  const byKey = new Map<string, Attempt[]>();
  for (const attempt of runs.flatMap((run) => run.tests.flatMap((test) => test.attempts))) {
    if (attempt.status !== "ok" || attempt.start === "ko") continue;
    const key = `${attempt.model}/${scope.run ? attempt.run : ""}/${attempt.test}`;
    byKey.set(key, [...(byKey.get(key) ?? []), attempt]);
  }
  return [...byKey.values()].flatMap((list) => {
    const pick = scope.run ? list.sort((a, b) => b.number - a.number)[0] : bestAttempt(list);
    return pick ? [pick] : [];
  });
}

/** Start the demos of a model or a run (all models when empty) one after the other, in the background. */
export async function startDemosService(input: { model?: string; run?: string } = {}): Promise<number> {
  const targets = await demoTargetsService(input);
  void (async () => {
    for (const attempt of targets) await startDemoService(attempt).catch(() => null);
  })();
  return targets.length;
}
