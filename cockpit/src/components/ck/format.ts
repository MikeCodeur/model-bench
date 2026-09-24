/** Number formats of the mockup: dot decimal, `$` after, durations as `23 min` or `1h46`, clocks as `07:12`. */
export const money = (value: number | null) => (value === null ? "—" : `${value.toFixed(2)} $`);

export function duration(seconds: number | null): string {
  if (seconds === null) return "—";
  const s = Math.round(seconds);
  if (s >= 3600) {
    const hours = Math.floor(s / 3600);
    return `${hours}h${String(Math.round((s % 3600) / 60)).padStart(2, "0")}`;
  }
  return `${Math.max(1, Math.round(s / 60))} min`;
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function tokens(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

export function day(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

export function time(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
export const monthLabel = (date: Date) => MONTHS[date.getMonth()];

export const pct = (value: number) => `${Math.max(0, Math.min(100, value))}%`;

export const difficulty = (value: string) => (value === "advanced" ? "avancé" : value === "intermediate" ? "intermédiaire" : value);
