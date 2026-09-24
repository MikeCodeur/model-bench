import { getRunMetaDao, listRunsDao } from "@/db/repositories/run-repository";
import { listRunAttemptsDao } from "@/db/repositories/attempt-repository";
import { isRunnerAlive } from "@/lib/bench-cli";
import { checksOf, displayState } from "@/services/attempt-state";
import { NotFoundError } from "@/services/errors/service-errors";
import type { Attempt } from "@/services/types/domain/attempt-types";
import type { RunDetail, RunSummary, RunTest, RunTotals } from "@/services/types/domain/run-types";
import { parseOrThrow, runRefSchema, runTestRefSchema } from "@/services/validation/ref-validation";

/** One row per test: planned tests first in launch order, each showing its most recent attempt. */
export function buildTests(attempts: Attempt[], planned: string[], runnerAlive: boolean): RunTest[] {
  const byTest = new Map<string, Attempt[]>(planned.map((test) => [test, []]));
  for (const attempt of attempts) byTest.set(attempt.test, [...(byTest.get(attempt.test) ?? []), attempt]);
  return [...byTest.entries()].map(([test, list]) => {
    const sorted = [...list].sort((a, b) => a.number - b.number);
    const latest = sorted[sorted.length - 1] ?? null;
    return {
      test,
      attempts: sorted,
      latest,
      state: latest ? displayState(latest, runnerAlive) : "pending",
      checks: latest ? checksOf(latest) : null,
    };
  });
}

/** States come from the latest attempt of each test; cost, time and tokens add up every attempt, iterations included. */
export function computeTotals(tests: RunTest[]): RunTotals {
  const all = tests.flatMap((test) => test.attempts);
  return {
    tests: tests.length,
    finished: tests.filter((test) => test.state !== "pending" && test.state !== "running").length,
    delivered: tests.filter((test) => test.state === "done").length,
    starting: tests.filter((test) => test.latest?.start === "ok").length,
    running: tests.filter((test) => test.state === "running").length,
    costUsd: all.reduce((sum, attempt) => sum + (attempt.costUsd ?? 0), 0),
    durationS: all.reduce((sum, attempt) => sum + (attempt.durationS ?? 0), 0),
    outputTokens: all.reduce((sum, attempt) => sum + (attempt.tokens.output ?? 0), 0),
  };
}

async function loadRun(model: string, run: string): Promise<RunDetail> {
  const [meta, attempts] = await Promise.all([getRunMetaDao({ model, run }), listRunAttemptsDao(model, run)]);
  if (!meta && attempts.length === 0) throw new NotFoundError(`Run ${model}/${run} not found`);
  const runnerAlive = attempts.some((attempt) => attempt.status === "running") && isRunnerAlive(model);
  const tests = buildTests(attempts, meta?.planned ?? [], runnerAlive);
  return {
    model,
    run,
    createdAt: meta?.createdAt ?? attempts[0]?.startedAt ?? null,
    cliVersion: meta?.cliVersion ?? null,
    timeoutMin: meta?.timeoutMin ?? 30,
    live: tests.some((test) => test.state === "running"),
    totals: computeTotals(tests),
    states: tests.map(({ test, state }) => ({ test, state })),
    tests,
  };
}

const toSummary = (run: RunDetail): RunSummary => ({
  model: run.model,
  run: run.run,
  createdAt: run.createdAt,
  cliVersion: run.cliVersion,
  timeoutMin: run.timeoutMin,
  live: run.live,
  totals: run.totals,
  states: run.states,
});

/** Every run, most recent first. */
export async function listRunsService(): Promise<RunSummary[]> {
  const runs = await Promise.all((await listRunsDao()).map(({ model, run }) => loadRun(model, run)));
  return runs.map(toSummary).sort((a, b) => (b.createdAt ?? b.run).localeCompare(a.createdAt ?? a.run));
}

/** Every run with its tests, most recent first. */
export async function listRunDetailsService(): Promise<RunDetail[]> {
  const runs = await Promise.all((await listRunsDao()).map(({ model, run }) => loadRun(model, run)));
  return runs.sort((a, b) => (b.createdAt ?? b.run).localeCompare(a.createdAt ?? a.run));
}

export async function getRunService(input: { model: string; run: string }): Promise<RunDetail> {
  const { model, run } = parseOrThrow(runRefSchema, input);
  return loadRun(model, run);
}

export async function getRunTestService(input: { model: string; run: string; test: string }): Promise<RunTest> {
  const { model, run, test } = parseOrThrow(runTestRefSchema, input);
  const found = (await loadRun(model, run)).tests.find((item) => item.test === test);
  if (!found) throw new NotFoundError(`Test ${test} not found in ${model}/${run}`);
  return found;
}
