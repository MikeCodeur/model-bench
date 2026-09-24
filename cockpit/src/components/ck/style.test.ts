import { describe, expect, it } from "vitest";
import { css, sx } from "./style";

describe("mockup style helpers", () => {
  it("parses declarations and keeps parentheses intact", () => {
    expect(css("font:500 12px/1 var(--mono);color:var(--fg-3);background:rgba(0,0,0,.78)")).toEqual({
      font: "500 12px/1 var(--font-mono)",
      color: "var(--subtle-foreground)",
      background: "rgba(0,0,0,.78)",
    });
  });

  it("maps mockup color names onto the design-system tokens", () => {
    expect(css("background:var(--accent-soft);border:1px solid var(--accent)")).toEqual({
      background: "var(--accent)",
      border: "1px solid var(--ring)",
    });
  });

  it("turns hover styles into flags and variables", () => {
    const props = sx("color:var(--fg-2)", "color:var(--fg);background:var(--surface-2)");
    expect(props["data-hc"]).toBe("");
    expect(props["data-hb"]).toBe("");
    expect(props.style).toMatchObject({ "--h-color": "var(--foreground)", "--h-background": "var(--muted)" });
  });
});
