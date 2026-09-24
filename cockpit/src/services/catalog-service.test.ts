import { describe, expect, it } from "vitest";
import { getBenchmarkService, listBenchmarksService } from "@/services/benchmark-service";
import { leaderboardService, toolOf } from "@/services/model-service";

describe("benchmark-service", () => {
  it("lists and filters the catalog", async () => {
    expect(await listBenchmarksService()).toHaveLength(3);
    const frontends = await listBenchmarksService({ category: "frontend" });
    expect(frontends.map((bench) => bench.id)).toEqual(["web-01-ai-saas-landing"]);
  });

  it("flags projects without UI", async () => {
    const api = (await listBenchmarksService()).find((bench) => bench.id === "agent-01-task-api");
    expect(api).toMatchObject({ hasUi: false, controls: [] });
  });

  it("collects the attempts of a benchmark across runs", async () => {
    const detail = await getBenchmarkService("3d-06-black-hole-lensing");
    expect(detail.attempts.map((attempt) => attempt.number)).toEqual([1, 2]);
  });
});

describe("model-service", () => {
  it("reads the harness from the command", () => {
    expect(toolOf("claude -p --model x {prompt}")).toBe("Claude Code");
    expect(toolOf("opencode run --model y {prompt}")).toBe("OpenCode");
  });

  it("ranks models on their best attempt per benchmark", async () => {
    const [opus, haiku] = await leaderboardService();
    // The interrupted landing page attempt is not a result: only the black hole counts.
    expect(opus).toMatchObject({ id: "opus-5-5", tool: "Claude Code", initials: "AN", runs: 1, benchmarks: 1, deliveredPct: 100, checksPct: 100 });
    expect(haiku).toMatchObject({ id: "haiku-4-5", runs: 0, benchmarks: 0, costPerProjectUsd: null });
  });
});
