import { describe, expect, it } from "vitest";
import {
  getAttemptFileService,
  getAttemptLogService,
  getAttemptService,
  listAttemptFilesService,
  parseAgentLog,
} from "@/services/attempt-service";
import { NotFoundError } from "@/services/errors/service-errors";

const ref = { model: "opus-5-5", run: "2026-09-23-a", test: "3d-06-black-hole-lensing", number: 1 };

describe("attempt-service", () => {
  it("returns the attempt with its prompt, command and base", async () => {
    const detail = await getAttemptService({ ...ref, number: 2 });
    expect(detail.attempt.tokens).toEqual({ input: 42, output: 21790, cacheRead: 988222, cacheWrite: 49063 });
    expect(detail.base?.number).toBe(1);
    const first = await getAttemptService(ref);
    expect(first.prompt).toContain("Trou noir");
    expect(first.command).toContain("claude -p");
  });

  it("turns the stream-json log into readable steps", async () => {
    const steps = await getAttemptLogService(ref);
    expect(steps).toEqual([
      { kind: "text", text: "Je commence par le shader.", at: "2026-09-23T04:30:05.000Z" },
      { kind: "tool", name: "Write", summary: "src/shader.js", at: "2026-09-23T04:30:05.000Z" },
      { kind: "tool", name: "Bash", summary: "pnpm test", at: "2026-09-23T04:31:10.000Z" },
      { kind: "result", text: "Terminé.", costUsd: 2.07, durationMs: 1386000 },
    ]);
  });

  it("ignores lines that are not events", () => {
    expect(parseAgentLog("garbage\n\n{}")).toEqual([]);
  });

  it("lists and reads workspace files", async () => {
    const files = await listAttemptFilesService(ref);
    expect(files.map((file) => file.path)).toEqual(["index.html", "src/shader.js"]);
    expect(await getAttemptFileService({ ...ref, path: "src/shader.js" })).toContain("export const g");
  });

  it("refuses paths outside the workspace", async () => {
    await expect(getAttemptFileService({ ...ref, path: "../attempt.json" })).rejects.toBeInstanceOf(NotFoundError);
  });
});
