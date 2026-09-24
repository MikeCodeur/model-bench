"use client";

import { useEffect, useState } from "react";
import { startDemoAction } from "@/app/runs/demo-actions";
import type { AttemptRef } from "@/services/types/domain/attempt-types";
import { css } from "./style";

/** A finished attempt's live demo, over its capture until `bench start` answers. */
export function DemoFrame({ attempt, capture }: { attempt: AttemptRef; capture: string | null }) {
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
    <>
      {capture ? <div style={css(`position:absolute;inset:0;background:url('${capture}') center / cover no-repeat`)} /> : null}
      {url ? <iframe src={url} title={attempt.test} style={css("position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#030304")} /> : null}
    </>
  );
}
