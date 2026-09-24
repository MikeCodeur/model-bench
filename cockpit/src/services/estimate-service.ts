import { listRunDetailsService } from "@/services/run-service";
import { listBenchmarksService } from "@/services/benchmark-service";
import type { Attempt } from "@/services/types/domain/attempt-types";

export type Estimate = { durationS: number; costUsd: number; basis: "model" | "model-average" | "other-models" | "default" };

export type LaunchEstimate = {
  perTest: Record<string, Estimate>;
  durationS: number;
  costUsd: number;
  maxDurationS: number;
};

const DEFAULT_DURATION_S = { intermediate: 600, advanced: 900 };
const DEFAULT_TIMEOUT_MIN = 30;

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

function averageOf(attempts: Attempt[]): { durationS: number; costUsd: number } | null {
  const done = attempts.filter((attempt) => attempt.kind === "fresh" && attempt.status !== "running" && attempt.durationS !== null);
  if (!done.length) return null;
  const costs = done.flatMap((attempt) => (attempt.costUsd === null ? [] : [attempt.costUsd]));
  return { durationS: mean(done.map((attempt) => attempt.durationS ?? 0)), costUsd: costs.length ? mean(costs) : 0 };
}

/**
 * Duration and cost expected for a model on a set of benchmarks, from past first attempts:
 * this model on this benchmark, else this model on average, else other models on this benchmark, else a default by difficulty.
 */
export async function estimateLaunchService(input: { model: string; tests: string[] }): Promise<LaunchEstimate> {
  const [runs, benchmarks] = await Promise.all([listRunDetailsService(), listBenchmarksService()]);
  const attempts = runs.flatMap((run) => run.tests.flatMap((test) => test.attempts));
  const own = attempts.filter((attempt) => attempt.model === input.model);
  const modelAverage = averageOf(own);
  const perTest: Record<string, Estimate> = {};
  for (const test of input.tests) {
    const onTest = averageOf(own.filter((attempt) => attempt.test === test));
    const others = averageOf(attempts.filter((attempt) => attempt.test === test));
    const difficulty = benchmarks.find((bench) => bench.id === test)?.difficulty ?? "intermediate";
    perTest[test] = onTest
      ? { ...onTest, basis: "model" }
      : modelAverage
        ? { ...modelAverage, basis: "model-average" }
        : others
          ? { ...others, basis: "other-models" }
          : { durationS: DEFAULT_DURATION_S[difficulty], costUsd: 0, basis: "default" };
  }
  const values = Object.values(perTest);
  return {
    perTest,
    durationS: values.reduce((sum, estimate) => sum + estimate.durationS, 0),
    costUsd: values.reduce((sum, estimate) => sum + estimate.costUsd, 0),
    maxDurationS: input.tests.length * DEFAULT_TIMEOUT_MIN * 60,
  };
}

/** Estimates for every declared model on every benchmark, so a launch screen can sum any selection instantly. */
export async function estimateTableService(models: string[]): Promise<Record<string, LaunchEstimate>> {
  const tests = (await listBenchmarksService()).map((bench) => bench.id);
  const entries = await Promise.all(models.map(async (model) => [model, await estimateLaunchService({ model, tests })] as const));
  return Object.fromEntries(entries);
}
