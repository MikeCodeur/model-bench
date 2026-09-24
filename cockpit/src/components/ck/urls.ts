import type { AttemptRef } from "@/services/types/domain/attempt-types";
import type { BenchmarkGroup } from "@/services/types/domain/benchmark-types";

export const runHref = (model: string, run: string) => `/runs/${model}/${run}`;
export const resultHref = (ref: AttemptRef, extra = "") => `/runs/${ref.model}/${ref.run}/${ref.test}?v=${ref.number}${extra}`;
export const captureUrl = (ref: AttemptRef) => `/api/captures/${ref.model}/${ref.run}/${ref.test}/${ref.number}`;
export const attemptKeyOf = (ref: AttemptRef) => `${ref.model}/${ref.run}/${ref.test}/attempt-${ref.number}`;
export const compareHref = (test: string, keys: string[] = [], blind = false) =>
  `/comparer?test=${test}${keys.length ? `&keys=${keys.join(",")}` : ""}${blind ? "&blind=1" : ""}`;

const GROUP_PARAMS: Record<BenchmarkGroup, string> = { "3D": "3d", Simulation: "simulation", Frontend: "frontend", Jeu: "jeu", "Code agentique": "code-agentique" };
export const groupParam = (group: BenchmarkGroup) => GROUP_PARAMS[group];
export const groupFromParam = (value: string | undefined): BenchmarkGroup | undefined =>
  (Object.keys(GROUP_PARAMS) as BenchmarkGroup[]).find((group) => GROUP_PARAMS[group] === value);
