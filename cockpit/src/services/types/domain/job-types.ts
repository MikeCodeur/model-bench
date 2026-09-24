export type JobKind = "run" | "retry" | "rerun" | "iterate" | "shots";

/** A bench CLI process started from the cockpit. */
export type Job = {
  id: string;
  kind: JobKind;
  model: string;
  run: string | null;
  tests: string[];
  args: string[];
  pid: number;
  startedAt: string;
  stoppedAt: string | null;
};
