export type AttemptStatus = "running" | "ok" | "error" | "timeout" | "stalled" | "rate_limited" | "aborted";

export type AttemptKind = "fresh" | "iteration";

export type StartCheck = "ok" | "ko" | null;

export type SelfTests = "pass" | "fail" | "none" | null;

export type AttemptRef = {
  model: string;
  run: string;
  test: string;
  number: number;
};

export type Tokens = {
  input: number | null;
  output: number | null;
  cacheRead: number | null;
  cacheWrite: number | null;
};

export type Attempt = AttemptRef & {
  kind: AttemptKind;
  basedOn: number | null;
  status: AttemptStatus;
  startedAt: string | null;
  durationS: number | null;
  modelId: string | null;
  cliVersion: string | null;
  suiteCommit: string | null;
  start: StartCheck;
  selfTests: SelfTests;
  tokens: Tokens;
  costUsd: number | null;
  billing: string | null;
  stack: string | null;
  score: number | null;
  notes: string;
  hasCapture: boolean;
};

/** What a screen shows for a project: the mockup's seven states. */
export type DisplayState = "pending" | "running" | "done" | "nostart" | "error" | "timeout" | "stopped";

/** Stand-in for the score until scoring exists: the checks we can actually verify. */
export type Checks = {
  finished: boolean | null;
  starts: boolean | null;
  tests: boolean | null;
  passed: number;
  total: number;
};

export type WorkspaceFile = {
  path: string;
  size: number;
};

export type LogStep =
  | { kind: "text"; text: string; at: string | null }
  | { kind: "tool"; name: string; summary: string; at: string | null }
  | { kind: "result"; text: string; costUsd: number | null; durationMs: number | null };
