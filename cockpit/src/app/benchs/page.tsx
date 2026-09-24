import Link from "next/link";
import { Suspense } from "react";
import { benchmarkCardsDal, listModelsDal, missingCapturesDal } from "@/app/dal/cockpit-dal";
import { syncCapturesAction } from "@/app/runs/actions";
import { ActionButton } from "@/components/ck/action-button";
import { Crumbs } from "@/components/ck/crumbs";
import { difficulty } from "@/components/ck/format";
import { thumbBackground } from "@/components/ck/primitives";
import { QueryInput } from "@/components/ck/query-input";
import { chip } from "@/components/ck/status";
import { css, sx } from "@/components/ck/style";
import { captureUrl, compareHref, groupFromParam, groupParam, resultHref } from "@/components/ck/urls";
import { BENCHMARK_GROUPS } from "@/services/types/domain/benchmark-types";

export default async function BenchsPage({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }) {
  const { cat, q } = await searchParams;
  const group = groupFromParam(cat);
  const [all, cards, models, missingCaptures] = await Promise.all([benchmarkCardsDal(), benchmarkCardsDal(group, q), listModelsDal(), missingCapturesDal()]);
  const href = (param?: string) => {
    const next = new URLSearchParams();
    if (param) next.set("cat", param);
    if (q) next.set("q", q);
    return `/benchs${next.size ? `?${next}` : ""}`;
  };
  const chips = [
    { id: undefined, label: "tous", n: all.length },
    ...BENCHMARK_GROUPS.map((item) => ({ id: groupParam(item), label: item.toLowerCase(), n: all.filter((card) => card.group === item).length })),
  ];
  const catLabel = group ? group.toLowerCase() : "tous";
  return (
    <>
      <Crumbs
        items={[
          { label: "benchs", href: "/benchs" },
          { label: catLabel, menuTitle: "catégorie", options: chips.map((item) => ({ label: item.label, sub: "", href: href(item.id), active: item.label === catLabel })) },
        ]}
      />
      <div data-screen-label="Catalogue des benchs" style={css("display:flex;flex-direction:column;gap:16px")}>
        <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap")}>
          <div>
            <h1 style={css("margin:0;font:600 22px/1.2 var(--sans);letter-spacing:-.015em")}>Benchs</h1>
            <div style={css("margin-top:4px;font:400 13px/1.3 var(--mono);color:var(--fg-2)")}>
              {cards.length} projets · {BENCHMARK_GROUPS.length} catégories
            </div>
          </div>
          <div style={css("display:flex;gap:8px")}>
            <Suspense>
              <QueryInput
                placeholder="Filtrer par nom…"
                style="width:240px;height:32px;padding:0 11px;border:1px solid var(--border);border-radius:7px;background:var(--surface);color:var(--fg);font:400 13px/1 var(--mono);outline-color:var(--accent)"
              />
            </Suspense>
            {missingCaptures ? (
              <ActionButton
                action={syncCapturesAction}
                title="Démarre chaque résultat livré sans capture et le photographie (bench shots)"
                {...sx(
                  "height:32px;padding:0 12px;border:1px solid var(--border-strong);border-radius:7px;background:transparent;color:var(--fg);font:500 13px/1 var(--sans);cursor:pointer;white-space:nowrap",
                  "background:var(--surface-2)",
                )}
              >
                Synchroniser les captures · {missingCaptures}
              </ActionButton>
            ) : null}
            <Link
              href={`/lancer?sel=${cards.map((card) => card.benchmark.id).join(",")}`}
              {...sx(
                "display:inline-flex;align-items:center;height:32px;padding:0 13px;border:1px solid var(--primary);border-radius:7px;background:var(--primary);color:var(--primary-fg);font:600 13px/1 var(--sans);cursor:pointer;text-decoration:none",
                "opacity:.88",
              )}
            >
              Lancer la sélection
            </Link>
          </div>
        </div>
        <div style={css("display:flex;gap:6px;flex-wrap:wrap")}>
          {chips.map((item) => {
            const colors = chip(item.label === catLabel);
            return (
              <Link
                key={item.label}
                href={href(item.id)}
                style={css(
                  `display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border:1px solid ${colors.bd};border-radius:6px;background:${colors.bg};color:${colors.fg};font:500 12.5px/1 var(--mono);cursor:pointer;text-decoration:none`,
                )}
              >
                {item.label}
                <span style={css("opacity:.7")}>{item.n}</span>
              </Link>
            );
          })}
        </div>
        <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px")}>
          {cards.map((card) => {
            const best = card.results[0]?.attempt;
            return (
              <article key={card.benchmark.id} style={css("display:flex;flex-direction:column;border:1px solid var(--border);border-radius:10px;background:var(--surface);overflow:hidden")}>
                <Link
                  href={best ? resultHref(best) : `/lancer?sel=${card.benchmark.id}`}
                  style={css(
                    `display:block;position:relative;padding:0;border:0;border-bottom:1px solid var(--border);aspect-ratio:16/9;background:${thumbBackground(card.cover ? captureUrl(card.cover) : null)};cursor:pointer`,
                  )}
                >
                  <span style={css("position:absolute;top:8px;left:8px;padding:3px 7px;border-radius:4px;background:rgba(0,0,0,.78);color:#fafafa;font:500 11px/1 var(--mono)")}>{card.group}</span>
                </Link>
                <div style={css("padding:12px 14px 14px;display:flex;flex-direction:column;gap:11px;flex:1")}>
                  <div>
                    <div style={css("font:600 13.5px/1.3 var(--mono)")}>{card.benchmark.id}</div>
                    <div style={css("margin-top:3px;font:400 13px/1.35 var(--sans);color:var(--fg-2)")}>{card.benchmark.title}</div>
                    <div style={css("margin-top:8px;display:flex;gap:12px;font:400 11.5px/1 var(--mono);color:var(--fg-3)")}>
                      <span>{difficulty(card.benchmark.difficulty)}</span>
                      <span>
                        {card.deliveredModels}/{models.length} livrés
                      </span>
                    </div>
                  </div>
                  <div style={css("display:flex;flex-direction:column;gap:6px;padding-top:10px;border-top:1px solid var(--border)")}>
                    {card.results.slice(0, 3).map((result, index) => (
                      <div key={result.model} style={css("display:grid;grid-template-columns:128px minmax(0,1fr) 24px;align-items:center;gap:10px")}>
                        <span style={css("font:400 12px/1 var(--mono);color:var(--fg-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{result.model}</span>
                        <span style={css("height:3px;border-radius:2px;background:var(--surface-2);overflow:hidden")}>
                          <span style={css(`display:block;height:100%;width:${result.score}%;background:${index === 0 ? "var(--accent)" : "var(--fg-3)"}`)} />
                        </span>
                        <span style={css("font:600 12px/1 var(--mono);text-align:right;white-space:nowrap")}>{result.score}</span>
                      </div>
                    ))}
                    {card.results.length === 0 ? <div style={css("font:400 12px/1 var(--mono);color:var(--fg-3)")}>pas encore lancé</div> : null}
                  </div>
                  <div style={css("margin-top:auto;display:flex;gap:6px")}>
                    <Link
                      href={compareHref(card.benchmark.id)}
                      {...sx(
                        "flex:1;display:inline-flex;align-items:center;justify-content:center;height:28px;border:1px solid var(--border-strong);border-radius:6px;background:transparent;color:var(--fg);font:500 12.5px/1 var(--sans);cursor:pointer;text-decoration:none",
                        "background:var(--surface-2)",
                      )}
                    >
                      Comparer
                    </Link>
                    <Link
                      href={`/lancer?sel=${card.benchmark.id}`}
                      {...sx(
                        "flex:1;display:inline-flex;align-items:center;justify-content:center;height:28px;border:1px solid var(--border-strong);border-radius:6px;background:transparent;color:var(--fg);font:500 12.5px/1 var(--sans);cursor:pointer;text-decoration:none",
                        "background:var(--surface-2)",
                      )}
                    >
                      Lancer
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
