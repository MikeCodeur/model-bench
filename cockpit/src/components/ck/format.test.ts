import { describe, expect, it } from "vitest";
import { harness } from "./format";

describe("harness", () => {
  it("adds the version from the raw --version output", () => {
    expect(harness("Codex CLI", "codex-cli 0.156.1")).toBe("Codex CLI 0.156.1");
    expect(harness("Claude Code", "2.1.280 (Claude Code)")).toBe("Claude Code 2.1.280");
    expect(harness("Claude Code", null)).toBe("Claude Code");
  });
});
