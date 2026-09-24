import { bestAttempt, checksOf, checksPercent, displayState, totalTokens } from "@/services/attempt-state";
import { getBenchmarkService } from "@/services/benchmark-service";
import { ValidationError } from "@/services/errors/service-errors";
import { listModelsService, type ModelView } from "@/services/model-service";
import type { Attempt, AttemptRef, Checks, DisplayState } from "@/services/types/domain/attempt-types";
import type { Benchmark } from "@/services/types/domain/benchmark-types";
import { attemptRefSchema, parseOrThrow } from "@/services/validation/ref-validation";

export type CompareSlot = {
  key: string;
  attempt: Attempt;
  model: ModelView | null;
  state: DisplayState;
  checks: Checks | null;
};

export type CompareRowKey = "rating" | "checks" | "tests" | "duration" | "cost" | "tokens" | "starts";

export type CompareRow = { key: CompareRowKey; cells: { value: number | boolean | null; best: boolean }[] };

export type Comparison = {
  benchmark: Benchmark;
  slots: CompareSlot[];
  rows: CompareRow[];
  presets: { models: string[]; versions: string[] | null };
  addable: string[];
};

export const attemptKey = (ref: AttemptRef) => `${ref.model}/${ref.run}/${ref.test}/attempt-${ref.number}`;

export function parseAttemptKey(key: string): AttemptRef {
  const [model, run, test, attempt] = key.split("/");
  return parseOrThrow(attemptRefSchema, { model, run, test, number: attempt?.replace("attempt-", "") });
}


/** Higher is better for checks and tests, lower for time, cost and tokens. Best needs at least two values. */
function rowOf(key: CompareRowKey, slots: CompareSlot[]): CompareRow {
  const values: (number | boolean | null)[] = slots.map(({ attempt, checks }) => {
    if (key === "rating") return attempt.rating;
    if (key === "checks") return checks ? checksPercent(checks) : null;
    if (key === "tests") return checks?.tests ?? null;
    if (key === "duration") return attempt.durationS;
    if (key === "cost") return attempt.costUsd;
    if (key === "tokens") return totalTokens(attempt);
    return checks?.starts ?? null;
  });
  const numbers = values.filter((value): value is number => typeof value === "number");
  const best =
    key === "starts" || key === "tests" || numbers.length < 2
      ? null
      : key === "checks" || key === "rating"
        ? Math.max(...numbers)
        : Math.min(...numbers);
  return { key, cells: values.map((value) => ({ value, best: value !== null && value === best })) };
}

/** Two to four finished attempts of one benchmark side by side; defaults to the best attempt of each model, else v1 against v2. */
export async function compareService(input: { test: string; keys?: string[] }): Promise<Comparison> {
  const { benchmark, attempts } = await getBenchmarkService(input.test);
  const models = await listModelsService();
  const finished = attempts.filter((attempt) => attempt.status !== "running");
  const byModel = new Map<string, Attempt[]>();
  for (const attempt of finished) byModel.set(attempt.model, [...(byModel.get(attempt.model) ?? []), attempt]);
  const modelPreset = [...byModel.values()].map(bestAttempt).flatMap((attempt) => (attempt ? [attemptKey(attempt)] : [])).slice(0, 4);
  const iteration = finished.filter((attempt) => attempt.basedOn !== null).at(-1);
  const versionPreset = iteration ? [attemptKey({ ...iteration, number: iteration.basedOn! }), attemptKey(iteration)] : null;

  const requested = input.keys?.length ? input.keys : modelPreset.length >= 2 ? modelPreset : (versionPreset ?? finished.slice(0, 2).map(attemptKey));
  const slots = requested.slice(0, 4).map((key): CompareSlot => {
    const ref = parseAttemptKey(key);
    if (ref.test !== benchmark.id) throw new ValidationError(`${key} is not a result of ${benchmark.id}`);
    const attempt = finished.find((item) => attemptKey(item) === key);
    if (!attempt) throw new ValidationError(`${key} is not a finished result`);
    return {
      key,
      attempt,
      model: models.find((model) => model.id === attempt.model) ?? null,
      state: displayState(attempt, false),
      checks: checksOf(attempt),
    };
  });
  const used = new Set(slots.map((slot) => slot.key));
  return {
    benchmark,
    slots,
    rows: (["rating", "checks", "tests", "duration", "cost", "tokens", "starts"] as CompareRowKey[]).map((key) => rowOf(key, slots)),
    presets: { models: modelPreset, versions: versionPreset },
    addable: finished.map(attemptKey).filter((key) => !used.has(key)),
  };
}
