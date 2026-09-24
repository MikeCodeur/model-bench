import type { Attempt, Checks, DisplayState } from "./attempt-types";

export type RunTotals = {
  tests: number;
  finished: number;
  delivered: number;
  starting: number;
  running: number;
  costUsd: number;
  durationS: number;
  outputTokens: number;
};

export type RunSummary = {
  model: string;
  run: string;
  createdAt: string | null;
  cliVersion: string | null;
  timeoutMin: number;
  live: boolean;
  totals: RunTotals;
  states: { test: string; state: DisplayState }[];
};

export type RunTest = {
  test: string;
  state: DisplayState;
  checks: Checks | null;
  latest: Attempt | null;
  attempts: Attempt[];
};

export type RunDetail = RunSummary & {
  tests: RunTest[];
};
