"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { startDemoAction } from "@/app/runs/demo-actions";
import { iterateAction } from "@/app/runs/actions";
import type { AttemptRef, Checks, DisplayState } from "@/services/types/domain/attempt-types";
import { ST } from "./status";
import { css, sx } from "./style";
import { useToast } from "./toast";

export type ResultMetric = { k: string; v: string; fg: string };

const STAGE_BUTTON =
  "height:26px;padding:0 9px;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--fg-2);font:500 12px/1 var(--sans);cursor:pointer";
const STAGE_BUTTON_HOVER = "color:var(--fg);border-color:var(--border-strong)";

const SUGGEST = ["ajoute un panneau de réglages", "optimise les fps", "rends-le responsive"];

/** Demo stage (the attempt served by `bench start` in an iframe, its capture meanwhile) and the aside: checks, metrics, retouch. */
export function ResultMain({
  attempt,
  state,
  checks,
  capture,
  stageTag,
  failMsg,
  showNoControls,
  metrics,
  delta,
  nextVersion,
  canIterate,
}: {
  attempt: AttemptRef;
  state: DisplayState;
  checks: Checks | null;
  capture: string | null;
  stageTag: string;
  failMsg: string;
  showNoControls: boolean;
  metrics: ResultMetric[];
  delta: string;
  nextVersion: string;
  canIterate: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const stage = useRef<HTMLDivElement>(null);
  const [retouch, setRetouch] = useState("");
  const [pending, startTransition] = useTransition();
  const showDemo = state === "done";
  const key = `${attempt.model}/${attempt.run}/${attempt.test}/${attempt.number}`;
  const [started, setStarted] = useState<{ key: string; url: string | null; error: string | null } | null>(null);
  const demo = started?.key === key ? started : { url: null, error: null };
  useEffect(() => {
    if (!showDemo) return;
    let live = true;
    startDemoAction(attempt).then((result) => {
      if (live) setStarted(result.ok ? { key, url: result.url, error: null } : { key, url: null, error: result.error });
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, showDemo]);
  const st = ST[state];
  const host = demo.url ? demo.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : demo.error ? "démo indisponible" : showDemo ? "démarrage…" : "pas de démo";
  const subs: [string, boolean | null][] = checks
    ? [
        ["terminé", checks.finished],
        ["démarre", checks.starts],
        ["tests", checks.tests],
      ]
    : [
        ["terminé", null],
        ["démarre", null],
        ["tests", null],
      ];
  const launchRetouch = () => {
    if (!retouch.trim()) return toast("Décris la retouche à faire");
    startTransition(async () => {
      const result = await iterateAction(attempt.model, attempt.run, attempt.test, retouch);
      toast(result.success ? `Retouche lancée → ${nextVersion} en cours` : result.message);
      if (result.success) {
        setRetouch("");
        if (result.href) router.push(result.href);
      }
    });
  };
  return (
    <div style={css("display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start")}>
      <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface);overflow:hidden")}>
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:12px;height:40px;padding:0 12px;border-bottom:1px solid var(--border)")}>
          <span style={css("display:flex;align-items:center;gap:9px;font:400 12.5px/1 var(--mono);color:var(--fg-2)")}>
            <span style={css(`width:7px;height:7px;border-radius:50%;background:${st.fg}`)} />
            {host} · {attempt.test} · v{attempt.number}
          </span>
          <div style={css("display:flex;gap:6px")}>
            {demo.url ? (
              <>
                <button
                  onClick={() => navigator.clipboard.writeText(demo.url!).then(() => toast("Lien copié"))}
                  title={demo.url}
                  {...sx(STAGE_BUTTON, STAGE_BUTTON_HOVER)}
                >
                  Copier le lien
                </button>
                <a href={demo.url} target="_blank" rel="noreferrer" {...sx(`display:inline-flex;align-items:center;text-decoration:none;${STAGE_BUTTON}`, STAGE_BUTTON_HOVER)}>
                  Nouvelle fenêtre ↗
                </a>
              </>
            ) : null}
            <button onClick={() => stage.current?.requestFullscreen?.()} {...sx(STAGE_BUTTON, STAGE_BUTTON_HOVER)}>
              Plein écran
            </button>
          </div>
        </div>
        <div ref={stage} style={css("position:relative;aspect-ratio:16/9;background:#030304;overflow:hidden")}>
          {showDemo && capture ? <div style={css(`position:absolute;inset:0;background:url('${capture}') center / cover no-repeat`)} /> : null}
          {showDemo && demo.url ? (
            <iframe src={demo.url} title={attempt.test} style={css("position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#030304")} />
          ) : null}
          {!showDemo ? (
            <div style={css("position:absolute;inset:0;display:grid;place-items:center;background:#0b0b0c")}>
              <div style={css("display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px;text-align:center")}>
                <span style={css("font:600 14px/1.3 var(--mono);color:#fafafa")}>
                  {st.g} {st.label}
                </span>
                <span style={css("max-width:48ch;font:400 12.5px/1.5 var(--mono);color:#a1a1aa")}>{failMsg}</span>
              </div>
            </div>
          ) : null}
          <span style={css("position:absolute;left:10px;bottom:10px;padding:4px 7px;border-radius:4px;background:rgba(0,0,0,.72);color:#e4e4e7;font:400 11.5px/1 var(--mono)")}>
            {demo.error && showDemo ? "capture · la démo ne démarre pas" : stageTag}
          </span>
        </div>
        {showNoControls ? (
          <div
            style={css(
              "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-top:1px solid var(--border);font:400 12.5px/1.4 var(--mono);color:var(--fg-2)",
            )}
          >
            <span>Cette version n’expose aucun réglage.</span>
            <button
              onClick={() => setRetouch("Ajoute un panneau de réglages pour piloter les paramètres principaux de la démo.")}
              {...sx(
                "height:26px;padding:0 9px;border:1px solid var(--border-strong);border-radius:5px;background:transparent;color:var(--fg);font:500 12px/1 var(--sans);cursor:pointer;white-space:nowrap",
                "background:var(--surface-2)",
              )}
            >
              Demander un panneau
            </button>
          </div>
        ) : null}
      </section>
      <aside style={css("display:flex;flex-direction:column;gap:12px")}>
        <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface);padding:16px")}>
          <div style={css("display:flex;align-items:center;justify-content:space-between")}>
            <span style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>contrôles</span>
            <span
              style={css(
                `display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 7px;border-radius:5px;border:1px ${st.bs} ${st.bd};background:${st.bg};color:${st.fg};font:500 11.5px/1 var(--mono)`,
              )}
            >
              <span>{st.g}</span>
              {st.label}
            </span>
          </div>
          <div style={css("margin-top:12px;display:flex;align-items:baseline;gap:6px")}>
            <span style={css("font:600 56px/.9 var(--mono);letter-spacing:-.04em")}>{checks && checks.total ? checks.passed : "—"}</span>
            <span style={css("font:400 14px/1 var(--mono);color:var(--fg-3)")}>{checks && checks.total ? `/${checks.total}` : ""}</span>
          </div>
          <div style={css("margin-top:16px;display:flex;flex-direction:column;gap:9px")}>
            {subs.map(([label, value]) => (
              <div key={label} style={css("display:grid;grid-template-columns:96px minmax(0,1fr) 26px;align-items:center;gap:10px")}>
                <span style={css("font:400 12px/1 var(--mono);color:var(--fg-2)")}>{label}</span>
                <span style={css("height:4px;border-radius:2px;background:var(--surface-2);overflow:hidden")}>
                  <span style={css(`display:block;height:100%;width:${value ? "100%" : "0%"};background:var(--fg)`)} />
                </span>
                <span style={css("font:600 12px/1 var(--mono);text-align:right")}>{value === null ? "—" : value ? "oui" : "non"}</span>
              </div>
            ))}
          </div>
        </section>
        <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface)")}>
          {metrics.map((metric) => (
            <div key={metric.k} style={css("display:flex;justify-content:space-between;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border)")}>
              <span style={css("font:400 12.5px/1.3 var(--mono);color:var(--fg-3)")}>{metric.k}</span>
              <span style={css(`font:500 12.5px/1.3 var(--mono);color:${metric.fg};text-align:right`)}>{metric.v}</span>
            </div>
          ))}
          <div style={css("padding:10px 16px;font:400 11.5px/1.4 var(--mono);color:var(--fg-3)")}>{delta}</div>
        </section>
        <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface);padding:14px 16px;display:flex;flex-direction:column;gap:10px")}>
          <span style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>retouche → {nextVersion}</span>
          <textarea
            value={retouch}
            onChange={(event) => setRetouch(event.target.value)}
            placeholder="ajoute un panneau de réglages…"
            rows={3}
            style={css(
              "resize:vertical;padding:9px 11px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--fg);font:400 13px/1.45 var(--mono);outline-color:var(--accent)",
            )}
          />
          <div style={css("display:flex;gap:6px;flex-wrap:wrap")}>
            {SUGGEST.map((label) => (
              <button
                key={label}
                onClick={() => setRetouch(label)}
                {...sx(
                  "height:24px;padding:0 8px;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--fg-2);font:400 11.5px/1 var(--mono);cursor:pointer",
                  "color:var(--fg);border-color:var(--border-strong)",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={launchRetouch}
            disabled={pending || !canIterate}
            title={canIterate ? undefined : "Un run de ce modèle est déjà en cours"}
            {...sx(
              "height:32px;border:1px solid var(--primary);border-radius:7px;background:var(--primary);color:var(--primary-fg);font:600 13px/1 var(--sans);cursor:pointer",
              "opacity:.88",
            )}
          >
            Lancer la retouche
          </button>
        </section>
      </aside>
    </div>
  );
}
