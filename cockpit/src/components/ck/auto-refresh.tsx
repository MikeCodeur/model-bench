"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clock } from "./format";

/** Re-render server data every few seconds while a run is live. */
export function AutoRefresh({ active, intervalMs = 3000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);
  return null;
}

/** Elapsed time since `since`, ticking every second. */
export function useElapsed(since: string | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return since ? Math.max(0, (now - Date.parse(since)) / 1000) : 0;
}

/** Server and browser clocks differ by the render delay, hence the hydration warning suppression. */
export function Clock({ since }: { since: string | null }) {
  return <span suppressHydrationWarning>{clock(useElapsed(since))}</span>;
}

/** Progress bar width following the elapsed time over the timeout. */
export function ElapsedBar({ since, timeoutS, style }: { since: string | null; timeoutS: number; style: React.CSSProperties }) {
  const elapsed = useElapsed(since);
  return <span suppressHydrationWarning style={{ display: "block", ...style, width: `${Math.min(100, (elapsed / timeoutS) * 100)}%` }} />;
}
