"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { startDemoAction } from "@/app/runs/demo-actions";
import type { AttemptRef } from "@/services/types/domain/attempt-types";
import { css, sx } from "./style";

const OVERLAY_BUTTON =
  "display:grid;place-items:center;width:26px;height:24px;padding:0;border:0;border-radius:4px;background:rgba(0,0,0,.72);color:#fafafa;font:600 13px/1 var(--sans);cursor:pointer;text-decoration:none";

/**
 * A finished attempt's live demo in a stage of the given ratio: capture first, then the iframe once `bench start` answers.
 * Top-right overlay: full screen, and a new window once the demo URL is known.
 */
export function DemoStage({
  attempt,
  capture,
  style,
  children,
}: {
  attempt: AttemptRef;
  capture: string | null;
  style: string;
  children?: ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const key = `${attempt.model}/${attempt.run}/${attempt.test}/${attempt.number}`;
  const [started, setStarted] = useState<{ key: string; url: string } | null>(null);
  const url = started?.key === key ? started.url : null;
  useEffect(() => {
    let live = true;
    startDemoAction(attempt).then((result) => {
      if (live && result.ok) setStarted({ key, url: result.url });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <div ref={stage} style={css(style)}>
      {capture ? <div style={css(`position:absolute;inset:0;background:url('${capture}') center / cover no-repeat`)} /> : null}
      {url ? <iframe src={url} title={attempt.test} style={css("position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#030304")} /> : null}
      {children}
      <span style={css("position:absolute;right:8px;top:8px;display:flex;gap:4px")}>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" title="Ouvrir la démo dans une nouvelle fenêtre" {...sx(OVERLAY_BUTTON, "background:rgba(0,0,0,.9)")}>
            ↗
          </a>
        ) : null}
        <button onClick={() => stage.current?.requestFullscreen?.()} title="Plein écran" {...sx(OVERLAY_BUTTON, "background:rgba(0,0,0,.9)")}>
          ⤢
        </button>
      </span>
    </div>
  );
}
