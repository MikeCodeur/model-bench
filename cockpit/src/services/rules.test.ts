import { describe, expect, it } from "vitest";
import { buildJournal, getJournalService, listCodeFilesService, parseAgentLog } from "@/services/attempt-service";
import { bestAttempt, checksOf, displayState, scoreOf } from "@/services/attempt-state";
import { NotFoundError, ValidationError } from "@/services/errors/service-errors";
import { rateAttemptService } from "@/services/rating-service";
import { compareService } from "@/services/compare-service";
import { estimateLaunchService } from "@/services/estimate-service";
import { homeService } from "@/services/home-service";
import { listBenchmarkCardsService } from "@/services/benchmark-service";
import type { Attempt } from "@/services/types/domain/attempt-types";

const attempt = (patch: Partial<Attempt>): Attempt => ({
  model: "m", run: "2026-09-23-a", test: "t", number: 1, kind: "fresh", basedOn: null, status: "ok", startedAt: null,
  durationS: 600, modelId: null, cliVersion: null, suiteCommit: null, start: "ok", selfTests: "pass",
  tokens: { input: null, output: null, cacheRead: null, cacheWrite: null }, costUsd: 1, billing: null, stack: null,
  score: null, rating: null, notes: "", hasCapture: false, ...patch,
});

describe("attempt-state", () => {
  it("maps runner statuses onto the seven screen states", () => {
    expect(displayState(attempt({}), false)).toBe("done");
    expect(displayState(attempt({ start: "ko" }), false)).toBe("nostart");
    expect(displayState(attempt({ status: "stalled" }), false)).toBe("timeout");
    expect(displayState(attempt({ status: "aborted" }), false)).toBe("stopped");
    expect(displayState(attempt({ status: "rate_limited" }), false)).toBe("error");
    expect(displayState(attempt({ status: "running" }), true)).toBe("running");
    expect(displayState(attempt({ status: "running" }), false)).toBe("stopped");
  });

  it("counts only the checks we know", () => {
    expect(checksOf(attempt({}))).toMatchObject({ passed: 3, total: 3 });
    expect(checksOf(attempt({ selfTests: "none" }))).toMatchObject({ passed: 2, total: 2 });
    expect(checksOf(attempt({ status: "error", start: null, selfTests: null }))).toMatchObject({ passed: 0, total: 1 });
    expect(checksOf(attempt({ status: "running" }))).toBeNull();
  });

  it("picks the attempt with most checks, then the fastest", () => {
    const slow = attempt({ number: 1, durationS: 900 });
    const fast = attempt({ number: 2, durationS: 300 });
    const broken = attempt({ number: 3, durationS: 60, start: "ko" });
    expect(bestAttempt([slow, broken, fast])?.number).toBe(2);
  });
});

describe("rating", () => {
  it("scores a rated result from its stars, an unrated one from its checks", () => {
    expect(scoreOf(attempt({ rating: 1 }))).toBe(20);
    expect(scoreOf(attempt({ rating: 5 }))).toBe(100);
    expect(scoreOf(attempt({}))).toBe(60);
    expect(scoreOf(attempt({ status: "error", start: null, selfTests: null }))).toBe(0);
    expect(scoreOf(attempt({ status: "running" }))).toBeNull();
  });

  it("lets a bad note push a delivered result below an unrated one", () => {
    const rejected = attempt({ number: 1, rating: 1, durationS: 60 });
    const unrated = attempt({ number: 2, durationS: 900 });
    const loved = attempt({ number: 3, rating: 5, durationS: 1200 });
    expect(bestAttempt([rejected, unrated])?.number).toBe(2);
    expect(bestAttempt([rejected, unrated, loved])?.number).toBe(3);
  });

  it("only accepts 1 to 5 stars or no note", async () => {
    const ref = { model: "opus-5-5", run: "2026-09-23-a", test: "web-01-ai-saas-landing", number: 1 };
    await expect(rateAttemptService({ ...ref, rating: 6 })).rejects.toBeInstanceOf(ValidationError);
    await expect(rateAttemptService({ ...ref, rating: 0 })).rejects.toBeInstanceOf(ValidationError);
    await expect(rateAttemptService({ ...ref, number: 9, rating: 3 })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("journal", () => {
  it("titles tool calls with what the agent said and times them", async () => {
    const journal = await getJournalService({ model: "opus-5-5", run: "2026-09-23-a", test: "3d-06-black-hole-lensing", number: 1 });
    expect(journal).toEqual([
      { elapsedS: 0, kind: "EDIT", title: "Je commence par le shader.", detail: "src/shader.js" },
      { elapsedS: 65, kind: "TEST", title: "Tests", detail: "pnpm test" },
      { elapsedS: 1386, kind: "DONE", title: "Livraison", detail: "Terminé." },
    ]);
  });

  it("ends with an error entry when the attempt failed", () => {
    const entries = buildJournal([{ kind: "result", text: "boom", costUsd: null, durationMs: 1000 }], "error");
    expect(entries).toEqual([{ elapsedS: 1, kind: "ERR", title: "Échec", detail: "boom" }]);
  });

  it("reads a codex exec --json transcript", () => {
    const log = [
      { type: "thread.started", thread_id: "t" },
      { type: "item.completed", item: { type: "agent_message", text: "Je crée la scène." } },
      { type: "item.completed", item: { type: "command_execution", command: "/bin/zsh -lc 'pnpm test'", exit_code: 0 } },
      { type: "item.completed", item: { type: "file_change", changes: [{ path: "src/main.js", kind: "add" }] } },
      { type: "item.completed", item: { type: "agent_message", text: "Terminé." } },
      { type: "turn.completed", usage: { input_tokens: 10, output_tokens: 2 } },
    ]
      .map((event) => JSON.stringify(event))
      .join("\n");
    const entries = buildJournal(parseAgentLog(log), "ok");
    expect(entries.map((entry) => [entry.kind, entry.title, entry.detail])).toEqual([
      ["TEST", "Je crée la scène.", "pnpm test"],
      ["EDIT", "Écriture", "src/main.js"],
      ["DONE", "Livraison", "Terminé."],
    ]);
  });

  it("shows journal commands relative to the workspace and spots test runs", () => {
    const workspace = "/private/var/folders/x/T/model-bench/3d-06-black-hole-lensing-e2rot0mt";
    const entries = buildJournal(
      [
        { kind: "tool", name: "Bash", summary: `cd ${workspace} && cat tests/render.test.js`, at: null },
        { kind: "tool", name: "Bash", summary: `cd ${workspace}; pnpm test`, at: null },
        { kind: "tool", name: "Write", summary: `${workspace}/src/controls.js`, at: null },
      ],
      "ok",
    );
    expect(entries.map((entry) => [entry.kind, entry.detail])).toEqual([
      ["BASH", "cat tests/render.test.js"],
      ["TEST", "pnpm test"],
      ["EDIT", "src/controls.js"],
    ]);
  });

  it("counts lines an iteration added to each file", async () => {
    const files = await listCodeFilesService({ model: "opus-5-5", run: "2026-09-23-a", test: "3d-06-black-hole-lensing", number: 1 });
    expect(files.every((file) => file.added === null)).toBe(true);
  });
});

describe("estimates, comparison, home", () => {
  it("estimates from past first attempts, falling back to a default by difficulty", async () => {
    const estimate = await estimateLaunchService({ model: "opus-5-5", tests: ["3d-06-black-hole-lensing", "agent-01-task-api"] });
    expect(estimate.perTest["3d-06-black-hole-lensing"]).toMatchObject({ durationS: 1386.8, costUsd: 2.07, basis: "model" });
    expect(estimate.perTest["agent-01-task-api"].basis).toBe("model-average");
    const cold = await estimateLaunchService({ model: "haiku-4-5", tests: ["agent-01-task-api"] });
    expect(cold.perTest["agent-01-task-api"]).toMatchObject({ durationS: 600, basis: "default" });
    expect(cold.maxDurationS).toBe(1800);
  });

  it("compares v1 and v2 when a single model ran the benchmark", async () => {
    const comparison = await compareService({ test: "3d-06-black-hole-lensing" });
    expect(comparison.slots.map((slot) => slot.key)).toEqual([
      "opus-5-5/2026-09-23-a/3d-06-black-hole-lensing/attempt-1",
      "opus-5-5/2026-09-23-a/3d-06-black-hole-lensing/attempt-2",
    ]);
    const duration = comparison.rows.find((row) => row.key === "duration");
    expect(duration?.cells.map((cell) => cell.best)).toEqual([false, true]);
  });

  it("rejects results of another benchmark", async () => {
    await expect(
      compareService({ test: "3d-06-black-hole-lensing", keys: ["opus-5-5/2026-09-23-a/web-01-ai-saas-landing/attempt-1", "opus-5-5/2026-09-23-a/3d-06-black-hole-lensing/attempt-1"] }),
    ).rejects.toThrow();
  });

  it("builds catalog cards and the home summary", async () => {
    const [blackHole] = await listBenchmarkCardsService({ group: "3D" });
    expect(blackHole).toMatchObject({ group: "3D", deliveredModels: 1 });
    expect(blackHole.results[0]).toMatchObject({ model: "opus-5-5", checksPct: 100 });
    const home = await homeService(new Date("2026-09-30T12:00:00Z"));
    expect(home).toMatchObject({ runsThisMonth: 1, runningRuns: 0, delivered: 1, finished: 2 });
    expect(home.fastest?.number).toBe(2);
  });
});
