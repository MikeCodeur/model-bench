import type { Attempt, Checks, DisplayState } from "@/services/types/domain/attempt-types";

/** The state shown for an attempt. An attempt still being written only counts as running while a runner process exists. */
export function displayState(attempt: Attempt, runnerAlive: boolean): DisplayState {
  switch (attempt.status) {
    case "running":
      return runnerAlive ? "running" : "stopped";
    case "ok":
      return attempt.start === "ko" ? "nostart" : "done";
    case "timeout":
    case "stalled":
      return "timeout";
    case "aborted":
      return "stopped";
    default:
      return "error";
  }
}

/** The score stand-in: finished without error, starts with the launch contract, its own tests pass. Unknown checks are left out. */
export function checksOf(attempt: Attempt): Checks | null {
  if (attempt.status === "running") return null;
  const finished = attempt.status === "ok";
  const starts = attempt.start === null ? null : attempt.start === "ok";
  const tests = attempt.selfTests === null || attempt.selfTests === "none" ? null : attempt.selfTests === "pass";
  const known = [finished, starts, tests].filter((value): value is boolean => value !== null);
  return { finished, starts, tests, passed: known.filter(Boolean).length, total: known.length };
}

export function checksPercent(checks: Checks | null): number {
  return checks && checks.total ? Math.round((checks.passed / checks.total) * 100) : 0;
}

/** Best attempt of a list: most checks passed, then fastest. Running attempts never win. */
export function bestAttempt(attempts: Attempt[]): Attempt | null {
  const finished = attempts.filter((attempt) => attempt.status !== "running");
  return (
    finished.sort(
      (a, b) =>
        checksPercent(checksOf(b)) - checksPercent(checksOf(a)) || (a.durationS ?? Infinity) - (b.durationS ?? Infinity),
    )[0] ?? null
  );
}

/** Every token the attempt consumed: input, cache reads and writes, output. Null when the CLI reported none. */
export function totalTokens(attempt: Attempt): number | null {
  const parts = [attempt.tokens.input, attempt.tokens.cacheRead, attempt.tokens.cacheWrite, attempt.tokens.output];
  return parts.every((part) => part === null) ? null : parts.reduce<number>((sum, part) => sum + (part ?? 0), 0);
}
