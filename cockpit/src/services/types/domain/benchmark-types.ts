export type BenchmarkCategory =
  | "3d"
  | "simulation-2d"
  | "math-visual"
  | "algorithm-visual"
  | "frontend"
  | "game"
  | "agentic-code";

export type BenchmarkDifficulty = "intermediate" | "advanced";

export type BenchmarkProvenance = "original" | "video-reconstructed" | "external";

export type BenchmarkCapture = "none" | "screenshot" | "video" | "both";

export type Benchmark = {
  id: string;
  title: string;
  category: BenchmarkCategory;
  difficulty: BenchmarkDifficulty;
  provenance: BenchmarkProvenance;
  brief: string;
  acceptance: string[];
  controls: string[];
  capture: BenchmarkCapture;
  hasUi: boolean;
  sourceUrl: string | null;
};

export type Catalog = {
  suite: string;
  benchmarks: Benchmark[];
};

/** The five families shown on screen; several catalog categories fold into "Simulation". */
export type BenchmarkGroup = "3D" | "Simulation" | "Frontend" | "Jeu" | "Code agentique";

export const BENCHMARK_GROUPS: BenchmarkGroup[] = ["3D", "Simulation", "Frontend", "Jeu", "Code agentique"];
