import type { DisplayState } from "@/services/types/domain/attempt-types";

/** Status visuals, copied from the mockup's `ST` and `SEG` tables. */
export const ST: Record<DisplayState, { label: string; fg: string; bg: string; bd: string; bs: string; g: string }> = {
  pending: { label: "en attente", fg: "var(--fg-3)", bg: "transparent", bd: "var(--border-strong)", bs: "dashed", g: "○" },
  running: { label: "en cours", fg: "var(--accent-text)", bg: "var(--accent-soft)", bd: "transparent", bs: "solid", g: "" },
  done: { label: "livré", fg: "var(--ok)", bg: "var(--ok-soft)", bd: "transparent", bs: "solid", g: "✓" },
  nostart: { label: "ne démarre pas", fg: "var(--err)", bg: "transparent", bd: "var(--err)", bs: "solid", g: "▲" },
  error: { label: "erreur", fg: "var(--err)", bg: "var(--err-soft)", bd: "transparent", bs: "solid", g: "✕" },
  timeout: { label: "timeout", fg: "var(--warn)", bg: "var(--warn-soft)", bd: "transparent", bs: "solid", g: "◷" },
  stopped: { label: "arrêté", fg: "var(--idle)", bg: "var(--idle-soft)", bd: "transparent", bs: "solid", g: "■" },
};

export const SEG: Record<DisplayState, string> = {
  pending: "var(--surface-2)",
  running: "var(--accent)",
  done: "var(--ok)",
  nostart: "var(--err)",
  error: "var(--err)",
  timeout: "var(--warn)",
  stopped: "var(--fg-3)",
};

/** Chip colors (mockup `chip(active)`). */
export const chip = (active: boolean) => ({
  bg: active ? "var(--accent-soft)" : "var(--surface)",
  fg: active ? "var(--accent-text)" : "var(--fg-2)",
  bd: active ? "var(--accent)" : "var(--border)",
});

/** Short family name of a benchmark id, used under progress segments (`3d-06-black-hole-lensing` → `black-hole-lensing`). */
export const segTitle = (test: string) => test.split("-").slice(2).join("-") || test;
