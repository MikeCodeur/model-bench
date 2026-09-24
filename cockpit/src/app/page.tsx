import Link from "next/link";
import { homeDal, listModelsDal } from "@/app/dal/cockpit-dal";
import { stopRunAction } from "@/app/runs/actions";
import { ActionButton } from "@/components/ck/action-button";
import { AutoRefresh, Clock, ElapsedBar } from "@/components/ck/auto-refresh";
import { Crumbs } from "@/components/ck/crumbs";
import { day, duration, money, monthLabel, time } from "@/components/ck/format";
import { Pulse, StatusBadge, thumbBackground } from "@/components/ck/primitives";
import { SEG, segTitle } from "@/components/ck/status";
import { css, sx } from "@/components/ck/style";
import { captureUrl, resultHref, runHref } from "@/components/ck/urls";
import { checksOf, displayState } from "@/services/attempt-state";

export default async function HomePage() {
  const [home, models] = await Promise.all([homeDal(), listModelsDal()]);
  const live = home.live;
  const toolOf = (model: string) => models.find((item) => item.id === model)?.tool ?? model;
  const running = live?.tests.find((test) => test.state === "running") ?? null;
  const kpis = [
    { k: `runs · ${monthLabel(new Date())}`, v: String(home.runsThisMonth), s: home.runningRuns ? `${home.runningRuns} en cours` : "aucun en cours" },
    { k: "taux de livraison", v: home.finished ? `${Math.round((home.delivered / home.finished) * 100)}%` : "—", s: `${home.delivered} / ${home.finished} projets` },
    { k: "dépense", v: money(home.spendUsd), s: "tous modèles" },
    {
      k: "plus rapide",
      v: home.fastest ? duration(home.fastest.durationS) : "—",
      s: home.fastest ? `${home.fastest.model} · ${segTitle(home.fastest.test)}${home.fastest.kind === "iteration" ? ` v${home.fastest.number}` : ""}` : "aucun projet livré",
    },
  ];
  const statusTxt = live?.live ? "En direct" : live?.tests.some((test) => test.state === "stopped") ? "Run arrêté" : "Run terminé";
  return (
    <>
      <Crumbs items={[]} />
      <AutoRefresh active={Boolean(live?.live)} />
      <div data-screen-label="Accueil" style={css("display:flex;flex-direction:column;gap:18px")}>
        <div style={css("display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--border);border-radius:10px;background:var(--surface)")}>
          {kpis.map((kpi, index) => (
            <div key={kpi.k} style={css(`padding:16px 18px;border-left:1px solid ${index ? "var(--border)" : "transparent"}`)}>
              <div style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>{kpi.k}</div>
              <div style={css("margin-top:10px;font:600 26px/1 var(--mono);letter-spacing:-.02em")}>{kpi.v}</div>
              <div style={css("margin-top:7px;font:400 12px/1.3 var(--mono);color:var(--fg-2)")}>{kpi.s}</div>
            </div>
          ))}
        </div>
        <div style={css("display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,380px);gap:18px;align-items:start")}>
          <div style={css("display:flex;flex-direction:column;gap:18px;min-width:0")}>
            {live ? (
              <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface)")}>
                <div style={css("display:flex;align-items:center;gap:10px;height:48px;padding:0 16px;border-bottom:1px solid var(--border);white-space:nowrap")}>
                  {live.live ? <Pulse /> : null}
                  <span style={css("flex:none;font:600 14px/1 var(--sans)")}>{statusTxt}</span>
                  <span style={css("min-width:0;overflow:hidden;text-overflow:ellipsis;font:500 13px/1 var(--mono);color:var(--fg-2)")}>{live.model}</span>
                  <span style={css("min-width:0;flex:0 10 auto;overflow:hidden;text-overflow:ellipsis;font:400 12px/1 var(--mono);color:var(--fg-3)")}>
                    via {toolOf(live.model)} · {day(live.createdAt)} {time(live.createdAt)}
                  </span>
                  <div style={css("margin-left:auto;flex:none;display:flex;gap:6px")}>
                    {live.live ? (
                      <ActionButton
                        action={stopRunAction.bind(null, live.model)}
                        {...sx(
                          "display:inline-flex;align-items:center;gap:7px;height:28px;padding:0 10px;border:1px solid var(--border-strong);border-radius:6px;background:transparent;color:var(--fg);font:500 12.5px/1 var(--sans);cursor:pointer",
                          "border-color:var(--err);color:var(--err)",
                        )}
                      >
                        <span style={css("width:7px;height:7px;background:currentColor;border-radius:1px")} />
                        Arrêter
                      </ActionButton>
                    ) : null}
                    <Link
                      href={runHref(live.model, live.run)}
                      {...sx(
                        "display:inline-flex;align-items:center;height:28px;padding:0 10px;border:1px solid var(--border-strong);border-radius:6px;background:transparent;color:var(--fg);font:500 12.5px/1 var(--sans);cursor:pointer;text-decoration:none",
                        "background:var(--surface-2)",
                      )}
                    >
                      Ouvrir →
                    </Link>
                  </div>
                </div>
                <div style={css("display:grid;grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(max-content,.6fr));border-bottom:1px solid var(--border)")}>
                  <div style={css("padding:16px;min-width:0")}>
                    <div style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>en cours</div>
                    <div style={css("margin-top:8px;font:500 14px/1.3 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{running ? running.test : "—"}</div>
                    <div style={css("margin-top:10px;display:flex;align-items:baseline;gap:8px")}>
                      <span style={css("font:600 28px/1 var(--mono);color:var(--accent-text)")}>{running ? <Clock since={running.latest?.startedAt ?? null} /> : "--:--"}</span>
                      <span style={css("font:400 12.5px/1 var(--mono);color:var(--fg-3)")}>/ {String(live.timeoutMin).padStart(2, "0")}:00</span>
                    </div>
                    <div style={css("margin-top:10px;height:3px;border-radius:2px;background:var(--surface-2);overflow:hidden")}>
                      {running ? (
                        <ElapsedBar since={running.latest?.startedAt ?? null} timeoutS={live.timeoutMin * 60} style={css("height:100%;background:var(--accent)")} />
                      ) : (
                        <div style={css("height:100%;width:0%;background:var(--accent)")} />
                      )}
                    </div>
                  </div>
                  <div style={css("padding:16px;border-left:1px solid var(--border)")}>
                    <div style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>progression</div>
                    <div style={css("margin-top:10px;font:600 22px/1 var(--mono);white-space:nowrap")}>
                      {live.totals.finished}/{live.totals.tests}
                    </div>
                  </div>
                  <div style={css("padding:16px;border-left:1px solid var(--border)")}>
                    <div style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>coût</div>
                    <div style={css("margin-top:10px;font:600 22px/1 var(--mono);white-space:nowrap")}>{money(live.totals.costUsd)}</div>
                  </div>
                  <div style={css("padding:16px;border-left:1px solid var(--border)")}>
                    <div style={css("font:500 12px/1 var(--mono);color:var(--fg-3)")}>durée</div>
                    <div style={css("margin-top:10px;font:600 22px/1 var(--mono);white-space:nowrap")}>{duration(live.totals.durationS)}</div>
                  </div>
                </div>
                <div style={css(`padding:14px 16px 16px;display:grid;grid-template-columns:repeat(${Math.max(live.tests.length, 1)},minmax(0,1fr));gap:4px`)}>
                  {live.tests.map((test) => (
                    <div key={test.test} style={css("display:flex;flex-direction:column;gap:6px;min-width:0")}>
                      <span style={css(`height:6px;border-radius:2px;background:${SEG[test.state]}`)} />
                      <span style={css("font:400 11px/1.2 var(--mono);color:var(--fg-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{segTitle(test.test)}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            <section>
              <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px")}>
                <h2 style={css("margin:0;font:600 15px/1.2 var(--sans)")}>Derniers résultats</h2>
                <Link href="/runs" {...sx("padding:0;border:0;background:none;color:var(--fg-2);font:500 13px/1 var(--sans);cursor:pointer;text-decoration:none", "color:var(--fg)")}>
                  Voir les runs →
                </Link>
              </div>
              <div style={css("display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px")}>
                {home.recent.map((attempt) => {
                  const checks = checksOf(attempt);
                  return (
                    <Link
                      key={`${attempt.model}/${attempt.run}/${attempt.test}/${attempt.number}`}
                      href={resultHref(attempt)}
                      {...sx(
                        "display:flex;flex-direction:column;padding:0;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--fg);text-align:left;overflow:hidden;cursor:pointer;text-decoration:none",
                        "border-color:var(--border-strong)",
                      )}
                    >
                      <div style={css(`position:relative;width:100%;aspect-ratio:16/9;background:${thumbBackground(attempt.hasCapture ? captureUrl(attempt) : null)};border-bottom:1px solid var(--border)`)}>
                        {attempt.kind === "iteration" ? (
                          <span style={css("position:absolute;top:8px;right:8px;padding:3px 6px;border-radius:4px;background:rgba(0,0,0,.78);color:#fafafa;font:600 11px/1 var(--mono)")}>v{attempt.number}</span>
                        ) : null}
                        {checks ? (
                          <span style={css("position:absolute;left:8px;bottom:8px;padding:5px 7px;border-radius:5px;background:rgba(0,0,0,.8);color:#fafafa;font:600 15px/1 var(--mono)")}>
                            {checks.passed}/{checks.total}
                          </span>
                        ) : null}
                      </div>
                      <div style={css("width:100%;padding:10px 12px 12px;display:flex;flex-direction:column;gap:8px")}>
                        <div style={css("min-width:0")}>
                          <div style={css("font:500 13px/1.3 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{attempt.test}</div>
                          <div style={css("margin-top:2px;font:400 12px/1.3 var(--mono);color:var(--fg-3)")}>{attempt.model}</div>
                        </div>
                        <div style={css("display:flex;align-items:center;gap:6px 8px;flex-wrap:wrap")}>
                          <StatusBadge state={displayState(attempt, false)} />
                          <span style={css("margin-left:auto;font:400 11.5px/1 var(--mono);color:var(--fg-2);white-space:nowrap")}>
                            {money(attempt.costUsd)} · {duration(attempt.durationS)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
          <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface)")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;height:48px;padding:0 16px;border-bottom:1px solid var(--border)")}>
              <h2 style={css("margin:0;font:600 14px/1 var(--sans)")}>Classement</h2>
              <Link href="/classement" {...sx("padding:0;border:0;background:none;color:var(--fg-2);font:500 12.5px/1 var(--sans);cursor:pointer;text-decoration:none", "color:var(--fg)")}>
                Tout voir →
              </Link>
            </div>
            {home.top.map((row, index) => (
              <Link
                key={row.id}
                href={row.latestRun ? runHref(row.latestRun.model, row.latestRun.run) : `/lancer?model=${row.id}`}
                {...sx(
                  "width:100%;display:grid;grid-template-columns:20px minmax(0,1fr) 36px 60px;align-items:center;gap:10px;padding:11px 16px;border:0;border-bottom:1px solid var(--border);background:transparent;color:var(--fg);text-align:left;cursor:pointer;text-decoration:none",
                  "background:var(--surface-2)",
                )}
              >
                <span style={css(`font:600 12px/1 var(--mono);color:${index === 0 ? "var(--accent-text)" : "var(--fg-3)"}`)}>{index + 1}</span>
                <span style={css("min-width:0")}>
                  <span style={css("display:block;font:500 13px/1.25 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{row.id}</span>
                  <span style={css("display:block;margin-top:6px;height:3px;border-radius:2px;background:var(--surface-2);overflow:hidden")}>
                    <span style={css(`display:block;height:100%;width:${row.checksPct}%;background:${index === 0 ? "var(--accent)" : "var(--fg-3)"}`)} />
                  </span>
                </span>
                <span style={css("font:600 15px/1 var(--mono);text-align:right")}>{row.benchmarks ? row.checksPct : "—"}</span>
                <span style={css("font:400 12px/1 var(--mono);color:var(--fg-2);text-align:right")}>{money(row.costPerProjectUsd)}</span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
