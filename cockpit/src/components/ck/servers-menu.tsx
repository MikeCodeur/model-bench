"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ActionResult } from "@/app/action-result";
import { startDemosAction, stopServersAction } from "@/app/servers/actions";
import type { ServerView } from "@/services/server-service";
import { Pulse } from "./primitives";
import { css, sx } from "./style";
import { useToast } from "./toast";

export type ServerItem = ServerView;

const MENU_BUTTON =
  "height:28px;padding:0 10px;border:1px solid var(--border-strong);border-radius:6px;background:transparent;color:var(--fg);font:500 12.5px/1 var(--sans);cursor:pointer;white-space:nowrap";
const shortTest = (test: string) => test.split("-").slice(0, 2).join("-");

/** Top-bar entry to everything bench runs on this machine: list, stop one, stop by kind, start a model's demos. */
export function ServersMenu({ servers, models }: { servers: ServerItem[]; models: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [model, setModel] = useState("");
  const [pending, startTransition] = useTransition();
  const runs = servers.filter((item) => item.kind === "run").length;
  const demos = servers.length - runs;
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [open, router]);
  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      setConfirm(null);
      toast((await action()).message);
      router.refresh();
    });
  /** Stopping agent runs loses their current attempt: ask for a second click. */
  const guarded = (key: string, needsConfirm: boolean, action: () => Promise<ActionResult>) => () => {
    if (needsConfirm && confirm !== key) return setConfirm(key);
    run(action);
  };
  return (
    <div style={css("position:relative;flex:none")}>
      <button
        onClick={() => setOpen((value) => !value)}
        title="Runs et serveurs de démo en cours"
        {...sx(
          `display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 10px;border:1px solid ${open ? "var(--border-strong)" : "var(--border)"};border-radius:8px;background:var(--surface);color:var(--fg-2);font:500 12px/1 var(--mono);cursor:pointer;white-space:nowrap`,
          "color:var(--fg);border-color:var(--border-strong)",
        )}
      >
        {runs ? <Pulse /> : <span style={css(`width:7px;height:7px;border-radius:50%;background:${demos ? "var(--ok)" : "var(--fg-3)"}`)} />}
        serveurs
        <span style={css("color:var(--fg)")}>{servers.length}</span>
      </button>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={css("position:fixed;inset:0;z-index:30")} />
          <div
            style={css(
              "position:absolute;right:0;top:42px;z-index:40;width:460px;padding:6px;background:var(--surface);border:1px solid var(--border-strong);border-radius:10px;box-shadow:var(--shadow)",
            )}
          >
            <div style={css("display:flex;justify-content:space-between;padding:8px 9px 6px;font:500 11px/1 var(--mono);color:var(--fg-3)")}>
              <span>en cours</span>
              <span>
                {runs} run{runs > 1 ? "s" : ""} · {demos} démo{demos > 1 ? "s" : ""}
              </span>
            </div>
            <div style={css("max-height:280px;overflow:auto")}>
              {servers.length === 0 ? <div style={css("padding:12px 9px;font:400 13px/1.3 var(--mono);color:var(--fg-3)")}>Rien ne tourne.</div> : null}
              {servers.map((item) => (
                <div key={item.pid} style={css("display:grid;grid-template-columns:52px minmax(0,1fr) auto 26px;align-items:center;gap:10px;padding:7px 9px;border-radius:6px")}>
                  <span
                    style={css(
                      `justify-self:start;padding:3px 6px;border-radius:4px;background:${item.kind === "run" ? "var(--accent)" : "var(--muted)"};color:${item.kind === "run" ? "var(--active-foreground)" : "var(--fg-2)"};font:600 10.5px/1 var(--mono)`,
                    )}
                  >
                    {item.kind === "run" ? "run" : "démo"}
                  </span>
                  <span style={css("min-width:0")}>
                    <span style={css("display:block;font:500 12.5px/1.3 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                      {item.model}/{item.run}
                    </span>
                    <span style={css("display:block;font:400 11.5px/1.3 var(--mono);color:var(--fg-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                      {item.tests.length > 1 ? `${shortTest(item.tests[0])} +${item.tests.length - 1}` : item.tests.map(shortTest).join("")}
                    </span>
                  </span>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" {...sx("font:500 12px/1 var(--mono);color:var(--fg-2);text-decoration:none", "color:var(--fg)")}>
                      ouvrir ↗
                    </a>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={guarded(`pid-${item.pid}`, item.kind === "run", () => stopServersAction({ pid: item.pid }))}
                    title={confirm === `pid-${item.pid}` ? "Cliquer encore pour arrêter ce run" : "Arrêter"}
                    disabled={pending}
                    {...sx(
                      `width:24px;height:24px;border:1px solid ${confirm === `pid-${item.pid}` ? "var(--err)" : "var(--border)"};border-radius:5px;background:transparent;color:${confirm === `pid-${item.pid}` ? "var(--err)" : "var(--fg-2)"};font:400 14px/1 var(--sans);cursor:pointer`,
                      "color:var(--err);border-color:var(--err)",
                    )}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={css("margin-top:6px;padding:10px 9px 6px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px;flex-wrap:wrap")}>
              <span style={css("margin-right:auto;font:500 11px/1 var(--mono);color:var(--fg-3)")}>arrêter</span>
              <button onClick={guarded("demos", false, () => stopServersAction({ kind: "demo" }))} disabled={pending || !demos} {...sx(MENU_BUTTON, "background:var(--surface-2)")}>
                Les démos
              </button>
              <button
                onClick={guarded("runs", true, () => stopServersAction({ kind: "run" }))}
                disabled={pending || !runs}
                {...sx(`${MENU_BUTTON};${confirm === "runs" ? "border-color:var(--err);color:var(--err)" : ""}`, "background:var(--surface-2)")}
              >
                {confirm === "runs" ? "Confirmer ?" : "Les runs"}
              </button>
              <button
                onClick={guarded("all", runs > 0, () => stopServersAction({}))}
                disabled={pending || !servers.length}
                {...sx(`${MENU_BUTTON};border-color:var(--err);color:var(--err)`, "background:var(--err-soft)")}
              >
                {confirm === "all" ? "Confirmer ?" : "Tout arrêter"}
              </button>
            </div>
            <div style={css("padding:8px 9px 8px;display:flex;align-items:center;gap:6px")}>
              <span style={css("margin-right:auto;font:500 11px/1 var(--mono);color:var(--fg-3)")}>démarrer les démos</span>
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
                style={css("height:28px;padding:0 8px;border:1px solid var(--border-strong);border-radius:6px;background:var(--surface);color:var(--fg);font:500 12.5px/1 var(--mono)")}
              >
                <option value="">tous les modèles</option>
                {models.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              <button onClick={() => run(() => startDemosAction(model ? { model } : {}))} disabled={pending} {...sx(MENU_BUTTON, "background:var(--surface-2)")}>
                ▶ Démarrer
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
