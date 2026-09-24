import { getModelsDao } from "@/db/repositories/model-repository";
import { bestAttempt, checksOf, checksPercent, scoreOf } from "@/services/attempt-state";
import { groupOf, listBenchmarksService } from "@/services/benchmark-service";
import { listRunDetailsService } from "@/services/run-service";
import type { Attempt } from "@/services/types/domain/attempt-types";
import type { BenchmarkGroup } from "@/services/types/domain/benchmark-types";
import type { Model } from "@/services/types/domain/model-types";

const TOOLS: Record<string, string> = {
  claude: "Claude Code",
  codex: "Codex CLI",
  gemini: "Gemini CLI",
  opencode: "OpenCode",
  kimi: "Kimi CLI",
  qwen: "Qwen Code",
  aider: "Aider",
};

/** The harness that runs the model, read from the first word of its command. */
export function toolOf(command: string): string {
  const binary = command.trim().split(/\s+/)[0]?.split("/").pop() ?? "";
  return TOOLS[binary] ?? binary;
}

/** Two-letter badge, like the mockup's provider initials. */
export function initialsOf(model: Model): string {
  const source = model.modelId ?? model.id;
  const provider = [
    ["claude", "AN"],
    ["gpt", "OA"],
    ["codex", "OA"],
    ["gemini", "GO"],
    ["kimi", "MS"],
    ["glm", "ZP"],
    ["qwen", "QW"],
    ["deepseek", "DS"],
  ].find(([prefix]) => source.includes(prefix));
  return provider ? provider[1] : model.id.slice(0, 2).toUpperCase();
}

export type ModelView = Model & { tool: string; initials: string };

export type LeaderboardRow = ModelView & {
  runs: number;
  latestRun: { model: string; run: string } | null;
  /** Raw `--version` output of the harness on the latest run. */
  cliVersion: string | null;
  benchmarks: number;
  checksPct: number;
  /** Mean score out of 100 of the model's best attempts (see `scoreOf`). */
  score: number;
  /** Mean human note of those attempts, null when none is rated. */
  rating: number | null;
  rated: number;
  deliveredPct: number;
  costPerProjectUsd: number | null;
  avgDurationS: number | null;
};

export type LeaderboardSort = "score" | "price" | "speed";

export async function listModelsService(): Promise<ModelView[]> {
  return (await getModelsDao()).map((model) => ({ ...model, tool: toolOf(model.command), initials: initialsOf(model) }));
}

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

/**
 * One row per declared model. For each benchmark the model ran, its best attempt across all runs counts:
 * checks % is the stand-in for the score, delivered % the share of benchmarks with a delivered best attempt.
 */
export async function leaderboardService(input: { group?: BenchmarkGroup; sort?: LeaderboardSort } = {}): Promise<LeaderboardRow[]> {
  const [models, runs, benchmarks] = await Promise.all([listModelsService(), listRunDetailsService(), listBenchmarksService()]);
  const inScope = new Set(benchmarks.filter((bench) => !input.group || groupOf(bench.category) === input.group).map((bench) => bench.id));
  const rows = models.map((model): LeaderboardRow => {
    const own = runs.filter((run) => run.model === model.id);
    const byBench = new Map<string, Attempt[]>();
    for (const test of own.flatMap((run) => run.tests)) {
      if (inScope.has(test.test)) byBench.set(test.test, [...(byBench.get(test.test) ?? []), ...test.attempts]);
    }
    const best = [...byBench.values()].map(bestAttempt).filter((attempt): attempt is Attempt => attempt !== null);
    return {
      ...model,
      runs: own.length,
      latestRun: own[0] ? { model: own[0].model, run: own[0].run } : null,
      cliVersion: own[0]?.cliVersion ?? null,
      benchmarks: best.length,
      checksPct: Math.round(average(best.map((attempt) => checksPercent(checksOf(attempt)))) ?? 0),
      score: Math.round(average(best.map((attempt) => scoreOf(attempt) ?? 0)) ?? 0),
      rating: average(best.flatMap((attempt) => (attempt.rating === null ? [] : [attempt.rating]))),
      rated: best.filter((attempt) => attempt.rating !== null).length,
      deliveredPct: best.length ? Math.round((best.filter((attempt) => attempt.status === "ok").length / best.length) * 100) : 0,
      costPerProjectUsd: average(best.flatMap((attempt) => (attempt.costUsd === null ? [] : [attempt.costUsd]))),
      avgDurationS: average(best.flatMap((attempt) => (attempt.durationS === null ? [] : [attempt.durationS]))),
    };
  });
  const sort = input.sort ?? "score";
  const withData = (row: LeaderboardRow) => (row.benchmarks ? 0 : 1);
  return rows.sort(
    (a, b) =>
      withData(a) - withData(b) ||
      (sort === "score"
        ? b.score - a.score || (a.costPerProjectUsd ?? Infinity) - (b.costPerProjectUsd ?? Infinity)
        : sort === "price"
          ? (a.costPerProjectUsd ?? Infinity) - (b.costPerProjectUsd ?? Infinity)
          : (a.avgDurationS ?? Infinity) - (b.avgDurationS ?? Infinity)),
  );
}
