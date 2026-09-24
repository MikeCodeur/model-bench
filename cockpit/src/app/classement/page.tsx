import Link from "next/link";
import { leaderboardDal } from "@/app/dal/cockpit-dal";
import { Crumbs } from "@/components/ck/crumbs";
import { duration, money } from "@/components/ck/format";
import { chip } from "@/components/ck/status";
import { css, sx } from "@/components/ck/style";
import { groupFromParam, groupParam, runHref } from "@/components/ck/urls";
import type { LeaderboardSort } from "@/services/model-service";
import { BENCHMARK_GROUPS } from "@/services/types/domain/benchmark-types";

const SORTS: [LeaderboardSort, string][] = [
  ["checks", "contrôles"],
  ["price", "prix"],
  ["speed", "vitesse"],
];
const COLS = "36px minmax(220px,1.6fr) minmax(150px,1fr) 70px 90px 74px 80px";

export default async function ClassementPage({ searchParams }: { searchParams: Promise<{ cat?: string; sort?: string }> }) {
  const params = await searchParams;
  const group = groupFromParam(params.cat);
  const sort = SORTS.find(([id]) => id === params.sort)?.[0] ?? "checks";
  const rows = await leaderboardDal(group, sort);
  const href = (cat: string | undefined, sortId: LeaderboardSort) => {
    const next = new URLSearchParams();
    if (cat) next.set("cat", cat);
    if (sortId !== "checks") next.set("sort", sortId);
    return `/classement${next.size ? `?${next}` : ""}`;
  };
  const catParam = group ? groupParam(group) : undefined;
  const chips = [{ id: undefined, label: "tous les benchs" }, ...BENCHMARK_GROUPS.map((item) => ({ id: groupParam(item), label: item.toLowerCase() }))];
  const maxCost = Math.max(3, Math.ceil(Math.max(0, ...rows.map((row) => row.costPerProjectUsd ?? 0))));
  const ticks = Array.from({ length: 4 }, (_, index) => Math.round((maxCost / 3) * index * 100) / 100);
  return (
    <>
      <Crumbs items={[{ label: "classement", href: "/classement" }]} />
      <div data-screen-label="Classement des modèles" style={css("display:flex;flex-direction:column;gap:16px")}>
        <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap")}>
          <div>
            <h1 style={css("margin:0;font:600 22px/1.2 var(--sans);letter-spacing:-.015em")}>Classement</h1>
            <div style={css("margin-top:4px;font:400 13px/1.3 var(--mono);color:var(--fg-2)")}>
              {rows.length} modèles · meilleur résultat par bench · {group ? group.toLowerCase() : "tous les benchs"}
            </div>
          </div>
          <div style={css("display:flex;padding:3px;border:1px solid var(--border);border-radius:8px;background:var(--surface)")}>
            {SORTS.map(([id, label]) => (
              <Link
                key={id}
                href={href(catParam, id)}
                style={css(
                  `display:inline-flex;align-items:center;height:26px;padding:0 11px;border:0;border-radius:5px;background:${sort === id ? "var(--surface-2)" : "transparent"};color:${sort === id ? "var(--fg)" : "var(--fg-2)"};font:500 12.5px/1 var(--mono);cursor:pointer;text-decoration:none`,
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div style={css("display:flex;gap:6px;flex-wrap:wrap")}>
          {chips.map((item) => {
            const colors = chip(item.id === catParam);
            return (
              <Link
                key={item.label}
                href={href(item.id, sort)}
                style={css(
                  `display:inline-flex;align-items:center;height:28px;padding:0 10px;border:1px solid ${colors.bd};border-radius:6px;background:${colors.bg};color:${colors.fg};font:500 12.5px/1 var(--mono);cursor:pointer;text-decoration:none`,
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div style={css("display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:16px;align-items:start")}>
          <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface);overflow-x:auto")}>
            <div style={css("min-width:760px")}>
              <div
                style={css(
                  `display:grid;grid-template-columns:${COLS};gap:12px;align-items:center;height:38px;padding:0 16px;border-bottom:1px solid var(--border);font:500 11.5px/1 var(--mono);color:var(--fg-3)`,
                )}
              >
                <span>#</span>
                <span>modèle</span>
                <span>contrôles</span>
                <span>livrés</span>
                <span>$/projet</span>
                <span>durée</span>
                <span>runs</span>
              </div>
              {rows.map((row, index) => (
                <Link
                  key={row.id}
                  href={row.latestRun ? runHref(row.latestRun.model, row.latestRun.run) : `/lancer?model=${row.id}`}
                  {...sx(
                    `width:100%;display:grid;grid-template-columns:${COLS};gap:12px;align-items:center;min-height:58px;padding:0 16px;border:0;border-bottom:1px solid var(--border);background:transparent;color:var(--fg);text-align:left;cursor:pointer;text-decoration:none`,
                    "background:var(--surface-2)",
                  )}
                >
                  <span style={css(`font:600 13px/1 var(--mono);color:${index === 0 ? "var(--accent-text)" : "var(--fg-3)"}`)}>{index + 1}</span>
                  <span style={css("display:flex;align-items:center;gap:11px;min-width:0")}>
                    <span
                      style={css(
                        "width:28px;height:28px;flex:none;display:grid;place-items:center;border:1px solid var(--border-strong);border-radius:6px;background:var(--surface-2);font:600 10.5px/1 var(--mono);color:var(--fg-2)",
                      )}
                    >
                      {row.initials}
                    </span>
                    <span style={css("min-width:0")}>
                      <span style={css("display:block;font:600 13.5px/1.2 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{row.id}</span>
                      <span style={css("display:block;margin-top:3px;font:400 12px/1.2 var(--sans);color:var(--fg-3)")}>
                        {row.label} · via {row.tool}
                      </span>
                    </span>
                  </span>
                  <span style={css("display:flex;align-items:center;gap:10px")}>
                    <span style={css("width:26px;font:600 15px/1 var(--mono)")}>{row.benchmarks ? row.checksPct : "—"}</span>
                    <span style={css("flex:1;height:4px;border-radius:2px;background:var(--surface-2);overflow:hidden")}>
                      <span style={css(`display:block;height:100%;width:${row.checksPct}%;background:${index === 0 ? "var(--accent)" : "var(--fg-3)"}`)} />
                    </span>
                  </span>
                  <span style={css("font:400 13px/1 var(--mono)")}>{row.benchmarks ? `${row.deliveredPct}%` : "—"}</span>
                  <span style={css("font:400 13px/1 var(--mono)")}>{money(row.costPerProjectUsd)}</span>
                  <span style={css("font:400 13px/1 var(--mono)")}>{duration(row.avgDurationS)}</span>
                  <span style={css("font:400 13px/1 var(--mono);color:var(--fg-2)")}>{row.runs}</span>
                </Link>
              ))}
            </div>
          </section>
          <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface);padding:14px 16px 16px")}>
            <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px")}>
              <h2 style={css("margin:0;font:600 14px/1 var(--sans)")}>Contrôles × coût</h2>
              <span style={css("font:400 11.5px/1 var(--mono);color:var(--fg-3)")}>↖ meilleur rapport</span>
            </div>
            <div style={css("display:grid;grid-template-columns:26px minmax(0,1fr);gap:8px")}>
              <div style={css("position:relative;height:300px;font:400 10.5px/1 var(--mono);color:var(--fg-3)")}>
                <span style={css("position:absolute;top:-4px;right:0")}>100</span>
                <span style={css("position:absolute;top:calc(50% - 5px);right:0")}>50</span>
                <span style={css("position:absolute;bottom:-4px;right:0")}>0</span>
              </div>
              <div
                style={css(
                  "position:relative;height:300px;border-left:1px solid var(--border-strong);border-bottom:1px solid var(--border-strong);background:linear-gradient(var(--border) 1px,transparent 1px) 0 0/100% 25%",
                )}
              >
                {rows
                  .filter((row) => row.benchmarks && row.costPerProjectUsd !== null)
                  .map((row, index) => (
                    <div
                      key={row.id}
                      style={css(
                        `position:absolute;left:${((row.costPerProjectUsd ?? 0) / maxCost) * 100}%;bottom:${row.checksPct}%;transform:translate(-5px,5px);display:flex;align-items:center;gap:6px;white-space:nowrap`,
                      )}
                    >
                      <span style={css(`width:10px;height:10px;border-radius:50%;background:${index === 0 ? "var(--accent)" : "var(--fg-2)"};box-shadow:0 0 0 2px var(--surface)`)} />
                      <span style={css("font:500 11.5px/1 var(--mono);color:var(--fg-2)")}>{row.id}</span>
                    </div>
                  ))}
              </div>
              <span />
              <div style={css("display:flex;justify-content:space-between;font:400 10.5px/1 var(--mono);color:var(--fg-3)")}>
                {ticks.map((tick) => (
                  <span key={tick}>{tick} $</span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
