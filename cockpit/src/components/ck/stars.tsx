"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { rateAttemptAction } from "@/app/runs/actions";
import type { AttemptRef } from "@/services/types/domain/attempt-types";
import { css } from "./style";
import { useToast } from "./toast";

/** One-click 1–5 star note of a result; clicking the current note removes it. */
export function Stars({ attempt, value, size = 15, disabled = false }: { attempt: AttemptRef; value: number | null; size?: number; disabled?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [hover, setHover] = useState(0);
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(value);
  const lit = hover || shown || 0;
  const rate = (star: number) =>
    startTransition(async () => {
      const next = star === shown ? null : star;
      setShown(next);
      const result = await rateAttemptAction(attempt, next);
      toast(result.message);
      router.refresh();
    });
  return (
    <span
      role="radiogroup"
      aria-label="Note sur 5"
      onMouseLeave={() => setHover(0)}
      style={css(`display:inline-flex;align-items:center;gap:1px;opacity:${disabled ? ".35" : "1"}`)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          role="radio"
          aria-checked={shown === star}
          title={`${star}/5`}
          disabled={disabled}
          onMouseEnter={() => setHover(star)}
          onClick={() => rate(star)}
          style={css(
            `padding:0 1px;border:0;background:transparent;cursor:${disabled ? "default" : "pointer"};font:400 ${size}px/1 var(--sans);color:${star <= lit ? "var(--warn)" : "var(--border-strong)"};opacity:1`,
          )}
        >
          ★
        </button>
      ))}
    </span>
  );
}
