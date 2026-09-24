import { getCatalogDao } from "@/db/repositories/benchmark-repository";
import { listRunAttemptsDao } from "@/db/repositories/attempt-repository";
import { listRunsDao } from "@/db/repositories/run-repository";
import { bestAttempt, checksOf, checksPercent, scoreOf } from "@/services/attempt-state";
import { NotFoundError } from "@/services/errors/service-errors";
import type { Attempt } from "@/services/types/domain/attempt-types";
import type { Benchmark, BenchmarkCategory, BenchmarkGroup } from "@/services/types/domain/benchmark-types";
import { parseOrThrow, testIdSchema } from "@/services/validation/ref-validation";

const GROUPS: Record<BenchmarkCategory, BenchmarkGroup> = {
  "3d": "3D",
  "simulation-2d": "Simulation",
  "math-visual": "Simulation",
  "algorithm-visual": "Simulation",
  frontend: "Frontend",
  game: "Jeu",
  "agentic-code": "Code agentique",
};

export const groupOf = (category: BenchmarkCategory): BenchmarkGroup => GROUPS[category];

export type BenchmarkDetail = {
  benchmark: Benchmark;
  attempts: Attempt[];
};

export type ModelResult = { model: string; attempt: Attempt; checksPct: number; score: number };

export type BenchmarkCard = {
  benchmark: Benchmark;
  group: BenchmarkGroup;
  /** Best attempt of each model that ran the benchmark, best first. */
  results: ModelResult[];
  deliveredModels: number;
  cover: Attempt | null;
};

export async function listBenchmarksService(filter: { category?: BenchmarkCategory } = {}): Promise<Benchmark[]> {
  const { benchmarks } = await getCatalogDao();
  return filter.category ? benchmarks.filter((bench) => bench.category === filter.category) : benchmarks;
}

async function allAttempts(): Promise<Attempt[]> {
  const runs = await listRunsDao();
  return (await Promise.all(runs.map(({ model, run }) => listRunAttemptsDao(model, run)))).flat();
}

function resultsFor(benchId: string, attempts: Attempt[]): ModelResult[] {
  const byModel = new Map<string, Attempt[]>();
  for (const attempt of attempts.filter((item) => item.test === benchId)) {
    byModel.set(attempt.model, [...(byModel.get(attempt.model) ?? []), attempt]);
  }
  return [...byModel.entries()]
    .flatMap(([model, list]) => {
      const best = bestAttempt(list);
      return best ? [{ model, attempt: best, checksPct: checksPercent(checksOf(best)), score: scoreOf(best) ?? 0 }] : [];
    })
    .sort((a, b) => b.score - a.score || (a.attempt.durationS ?? Infinity) - (b.attempt.durationS ?? Infinity));
}

/** Catalog cards filtered by group and by a text query on id and title. */
export async function listBenchmarkCardsService(filter: { group?: BenchmarkGroup; query?: string } = {}): Promise<BenchmarkCard[]> {
  const [{ benchmarks }, attempts] = await Promise.all([getCatalogDao(), allAttempts()]);
  const query = filter.query?.trim().toLowerCase() ?? "";
  return benchmarks
    .filter((bench) => !filter.group || groupOf(bench.category) === filter.group)
    .filter((bench) => !query || `${bench.id} ${bench.title}`.toLowerCase().includes(query))
    .map((benchmark) => {
      const results = resultsFor(benchmark.id, attempts);
      return {
        benchmark,
        group: groupOf(benchmark.category),
        results,
        deliveredModels: results.filter((result) => result.attempt.status === "ok").length,
        cover: results.find((result) => result.attempt.hasCapture)?.attempt ?? null,
      };
    });
}

export async function getBenchmarkService(id: string): Promise<BenchmarkDetail> {
  const benchId = parseOrThrow(testIdSchema, id);
  const benchmark = (await getCatalogDao()).benchmarks.find((bench) => bench.id === benchId);
  if (!benchmark) throw new NotFoundError(`Benchmark ${benchId} not found`);
  return { benchmark, attempts: (await allAttempts()).filter((attempt) => attempt.test === benchId) };
}
