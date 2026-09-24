"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { launchRunAction } from "@/app/runs/actions";
import type { LaunchEstimate } from "@/services/estimate-service";
import { duration, money } from "./format";
import { chip } from "./status";
import { css, sx } from "./style";
import { useToast } from "./toast";

export type LaunchModel = { id: string; tool: string; score: string; cost: string };
export type LaunchBench = { id: string; meta: string; group: string; thumb: string };

/** Launch screen: pick a model and benchmarks, see the estimate from past runs, start `bench run`. */
export function LaunchForm({
  models,
  groups,
  benches,
  estimates,
  initialModel,
  initialSel,
}: {
  models: LaunchModel[];
  groups: string[];
  benches: LaunchBench[];
  estimates: Record<string, LaunchEstimate>;
  initialModel: string;
  initialSel: string[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [model, setModel] = useState(initialModel);
  const [sel, setSel] = useState<Set<string>>(new Set(initialSel));
  const [pending, startTransition] = useTransition();
  const current = models.find((item) => item.id === model);
  const estimate = estimates[model];
  const ids = benches.filter((bench) => sel.has(bench.id)).map((bench) => bench.id);
  const nn = ids.length;
  const estDuration = ids.reduce((sum, id) => sum + (estimate?.perTest[id]?.durationS ?? 0), 0);
  const estCost = ids.reduce((sum, id) => sum + (estimate?.perTest[id]?.costUsd ?? 0), 0);
  const summary = [
    { k: "modèle", v: model },
    { k: "outil", v: current?.tool ?? "" },
    { k: "projets", v: String(nn) },
    { k: "durée max", v: nn ? duration(nn * 1800) : "—" },
    { k: "durée estimée", v: nn ? `~${duration(estDuration)}` : "—" },
    { k: "coût estimé", v: nn ? `~${money(estCost)}` : "—" },
  ];
  const toggle = (list: string[], on: boolean) =>
    setSel((previous) => {
      const next = new Set(previous);
      for (const id of list) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  const launch = () => {
    if (!nn) return;
    startTransition(async () => {
      const result = await launchRunAction(model, ids);
      toast(result.message);
      if (result.success && result.href) router.push(result.href);
    });
  };
  return (
    <div style={css("display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start")}>
      <div style={css("display:flex;flex-direction:column;gap:16px;min-width:0")}>
        <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface)")}>
          <div style={css("display:flex;align-items:center;gap:10px;height:46px;padding:0 16px;border-bottom:1px solid var(--border)")}>
            <span style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>01</span>
            <h2 style={css("margin:0;font:600 14px/1 var(--sans)")}>Modèle</h2>
          </div>
          <div style={css("padding:12px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px")}>
            {models.map((item) => {
              const active = item.id === model;
              return (
                <button
                  key={item.id}
                  onClick={() => setModel(item.id)}
                  {...sx(
                    `display:grid;grid-template-columns:16px minmax(0,1fr) auto;align-items:center;gap:11px;padding:11px 12px;border:1px solid ${active ? "var(--accent)" : "var(--border)"};border-radius:8px;background:${active ? "var(--accent-soft)" : "var(--surface)"};color:var(--fg);text-align:left;cursor:pointer`,
                    "border-color:var(--border-strong)",
                  )}
                >
                  <span style={css(`width:16px;height:16px;border-radius:50%;border:1.5px solid ${active ? "var(--accent)" : "var(--border-strong)"};display:grid;place-items:center`)}>
                    <span style={css(`width:8px;height:8px;border-radius:50%;background:${active ? "var(--accent)" : "transparent"}`)} />
                  </span>
                  <span style={css("min-width:0")}>
                    <span style={css("display:block;font:500 13px/1.25 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{item.id}</span>
                    <span style={css("display:block;margin-top:3px;font:400 11.5px/1.2 var(--sans);color:var(--fg-3)")}>via {item.tool}</span>
                  </span>
                  <span style={css("text-align:right")}>
                    <span style={css("display:block;font:600 14px/1 var(--mono)")}>{item.score}</span>
                    <span style={css("display:block;margin-top:4px;font:400 11px/1 var(--mono);color:var(--fg-3)")}>{item.cost}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface)")}>
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px;height:46px;padding:0 16px;border-bottom:1px solid var(--border)")}>
            <div style={css("display:flex;align-items:center;gap:10px")}>
              <span style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>02</span>
              <h2 style={css("margin:0;font:600 14px/1 var(--sans)")}>Benchs</h2>
            </div>
            <div style={css("display:flex;gap:4px")}>
              {[
                ["Tout", () => toggle(benches.map((bench) => bench.id), true)],
                ["Aucun", () => setSel(new Set())],
              ].map(([label, go]) => (
                <button
                  key={label as string}
                  onClick={go as () => void}
                  {...sx(
                    "height:26px;padding:0 9px;border:0;border-radius:5px;background:transparent;color:var(--fg-2);font:500 12.5px/1 var(--sans);cursor:pointer",
                    "background:var(--surface-2);color:var(--fg)",
                  )}
                >
                  {label as string}
                </button>
              ))}
            </div>
          </div>
          <div style={css("padding:12px 12px 0;display:flex;gap:6px;flex-wrap:wrap")}>
            {groups.map((group) => {
              const list = benches.filter((bench) => bench.group === group).map((bench) => bench.id);
              const count = list.filter((id) => sel.has(id)).length;
              const full = count === list.length && list.length > 0;
              const colors = chip(full);
              return (
                <button
                  key={group}
                  onClick={() => toggle(list, !full)}
                  style={css(
                    `display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border:1px solid ${colors.bd};border-radius:6px;background:${colors.bg};color:${colors.fg};font:500 12.5px/1 var(--mono);cursor:pointer`,
                  )}
                >
                  {group.toLowerCase()}
                  <span style={css("opacity:.75")}>
                    {count}/{list.length}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={css("padding:12px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px")}>
            {benches.map((bench) => {
              const on = sel.has(bench.id);
              const est = estimate?.perTest[bench.id];
              return (
                <button
                  key={bench.id}
                  onClick={() => toggle([bench.id], !on)}
                  {...sx(
                    `display:grid;grid-template-columns:16px 52px minmax(0,1fr) auto;align-items:center;gap:11px;padding:7px 11px 7px 10px;border:1px solid ${on ? "var(--accent)" : "var(--border)"};border-radius:8px;background:${on ? "var(--accent-soft)" : "var(--surface)"};color:var(--fg);text-align:left;cursor:pointer`,
                    "border-color:var(--border-strong)",
                  )}
                >
                  <span
                    style={css(
                      `width:16px;height:16px;border-radius:4px;border:1.5px solid ${on ? "var(--accent)" : "var(--border-strong)"};background:${on ? "var(--accent)" : "transparent"};display:grid;place-items:center;color:#fff;font:700 11px/1 var(--sans)`,
                    )}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span style={css(`width:52px;height:32px;border-radius:4px;background:${bench.thumb}`)} />
                  <span style={css("min-width:0")}>
                    <span style={css("display:block;font:500 13px/1.25 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{bench.id}</span>
                    <span style={css("display:block;margin-top:3px;font:400 11.5px/1.2 var(--sans);color:var(--fg-3)")}>{bench.meta}</span>
                  </span>
                  <span style={css("font:400 11.5px/1 var(--mono);color:var(--fg-3)")} title={est ? `estimation : ${est.basis}` : undefined}>
                    {est ? `~${Math.max(1, Math.round(est.durationS / 60))} min` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <aside style={css("position:sticky;top:76px;border:1px solid var(--border);border-radius:10px;background:var(--surface)")}>
        <div style={css("height:46px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--border)")}>
          <h2 style={css("margin:0;font:600 14px/1 var(--sans)")}>Récapitulatif</h2>
        </div>
        <div style={css("padding:4px 16px")}>
          {summary.map((item) => (
            <div key={item.k} style={css("display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)")}>
              <span style={css("font:400 12.5px/1.3 var(--mono);color:var(--fg-3)")}>{item.k}</span>
              <span style={css("font:500 13px/1.3 var(--mono);text-align:right")}>{item.v}</span>
            </div>
          ))}
        </div>
        <div style={css("padding:8px 16px 16px;display:flex;flex-direction:column;gap:8px")}>
          <button
            onClick={launch}
            disabled={!nn || pending}
            {...sx(
              `height:38px;border:1px solid var(--primary);border-radius:7px;background:var(--primary);color:var(--primary-fg);font:600 14px/1 var(--sans);cursor:pointer;opacity:${nn ? "1" : ".4"}`,
              "opacity:.88",
            )}
          >
            Lancer · {nn} projet{nn > 1 ? "s" : ""}
          </button>
          <button
            onClick={() => router.push("/")}
            {...sx(
              "height:34px;border:1px solid var(--border-strong);border-radius:7px;background:transparent;color:var(--fg);font:500 13px/1 var(--sans);cursor:pointer",
              "background:var(--surface-2)",
            )}
          >
            Annuler
          </button>
        </div>
      </aside>
    </div>
  );
}
