import "server-only";
import path from "node:path";
import { z } from "zod";
import type { Catalog } from "@/services/types/domain/benchmark-types";
import { readJson, repoDir } from "./storage";

const storedBenchmark = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["3d", "simulation-2d", "math-visual", "algorithm-visual", "frontend", "game", "agentic-code"]),
  difficulty: z.enum(["intermediate", "advanced"]),
  provenance: z.enum(["original", "video-reconstructed", "external"]),
  brief: z.string(),
  acceptance: z.array(z.string()),
  controls: z.array(z.string()).default([]),
  capture: z.enum(["none", "screenshot", "video", "both"]),
  source_url: z.string().optional(),
});

const storedCatalog = z.object({
  suite: z.string(),
  benchmarks: z.array(storedBenchmark),
});

export async function getCatalogDao(): Promise<Catalog> {
  const data = storedCatalog.parse(await readJson(path.join(repoDir(), "benchmarks.json")));
  return {
    suite: data.suite,
    benchmarks: data.benchmarks.map((bench) => ({
      id: bench.id,
      title: bench.title,
      category: bench.category,
      difficulty: bench.difficulty,
      provenance: bench.provenance,
      brief: bench.brief,
      acceptance: bench.acceptance,
      controls: bench.controls,
      capture: bench.capture,
      hasUi: bench.capture !== "none",
      sourceUrl: bench.source_url ?? null,
    })),
  };
}
