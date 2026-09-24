/** A process started by the `bench` CLI: an agent run or a demo server (start, open, serve, shots). */
export type BenchProcessKind = "run" | "demo";

export type BenchProcess = {
  pid: number;
  kind: BenchProcessKind;
  model: string | null;
  run: string | null;
  tests: string[];
};
