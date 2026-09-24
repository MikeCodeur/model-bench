import type { CSSProperties } from "react";

/**
 * The screens are ported from docs/cockpit/design/Cockpit.dc.html, whose inline styles are copied verbatim.
 * The mockup names its colors differently from the design-system tokens (same values): this table renames them.
 */
const MOCKUP_VARS: Record<string, string> = {
  "--bg": "--background",
  "--surface": "--card",
  "--surface-2": "--muted",
  "--border-strong": "--input",
  "--fg": "--foreground",
  "--fg-2": "--muted-foreground",
  "--fg-3": "--subtle-foreground",
  "--primary-fg": "--primary-foreground",
  "--accent": "--ring",
  "--accent-text": "--active-foreground",
  "--accent-soft": "--accent",
  "--ok": "--success",
  "--ok-soft": "--success-soft",
  "--warn": "--warning",
  "--warn-soft": "--warning-soft",
  "--err": "--destructive",
  "--err-soft": "--destructive-soft",
  "--idle": "--stopped",
  "--idle-soft": "--stopped-soft",
  "--shadow": "--shadow-popover",
  "--sans": "--font-sans",
  "--mono": "--font-mono",
};

const renameVars = (value: string) => value.replace(/var\((--[a-z0-9-]+)/g, (_, name: string) => `var(${MOCKUP_VARS[name] ?? name}`);

function splitDeclarations(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === ";" && depth === 0) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

const camel = (property: string) => (property.startsWith("--") ? property : property.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

/** Parse a mockup `style="..."` string into a React style object. */
export function css(text: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const declaration of splitDeclarations(text)) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    style[camel(declaration.slice(0, colon).trim())] = renameVars(declaration.slice(colon + 1).trim());
  }
  return style as CSSProperties;
}

const HOVER_FLAGS: Record<string, string> = {
  color: "data-hc",
  background: "data-hb",
  "border-color": "data-hbc",
  opacity: "data-ho",
};

/** Style plus the mockup's `style-hover`, rendered through data attributes and CSS variables (see globals.css). */
export type StyleProps = { style: CSSProperties; [flag: `data-${string}`]: string };

export function sx(text: string, hover?: string): StyleProps {
  const props: Record<string, string> = {};
  const style = css(text) as Record<string, string>;
  if (hover) {
    for (const declaration of splitDeclarations(hover)) {
      const colon = declaration.indexOf(":");
      const property = declaration.slice(0, colon).trim();
      const flag = HOVER_FLAGS[property];
      if (!flag) continue;
      props[flag] = "";
      style[`--h-${property}`] = renameVars(declaration.slice(colon + 1).trim());
    }
  }
  return { style: style as CSSProperties, ...props } as StyleProps;
}
