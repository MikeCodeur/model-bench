import Link from "next/link";
import { benchmarkCardsDal, compareDal, runDetailsDal, voteDal } from "@/app/dal/cockpit-dal";
import { voteAction } from "@/app/comparer/actions";
import { ActionButton } from "@/components/ck/action-button";
import { Crumbs } from "@/components/ck/crumbs";
import { DemoFrame } from "@/components/ck/demo-frame";
import { duration, harness, money, tokens } from "@/components/ck/format";
import { ST, chip } from "@/components/ck/status";
import { css, sx } from "@/components/ck/style";
import { captureUrl, compareHref } from "@/components/ck/urls";
import type { CompareRowKey } from "@/services/compare-service";

const LETTERS = "ABCD";
const ROW_LABELS: Record<CompareRowKey, string> = {
  rating: "note",
  checks: "contrôles",
  tests: "tests",
  duration: "durée",
  cost: "coût",
  tokens: "tokens",
  starts: "démarre",
};

export default async function ComparerPage({ searchParams }: { searchParams: Promise<{ test?: string; keys?: string; blind?: string }> }) {
  const query = await searchParams;
  const blind = query.blind === "1";
  const [cards, runs] = await Promise.all([benchmarkCardsDal(), runDetailsDal()]);
  const withResults = cards.filter((card) => card.results.length);
  const lastIteration = runs.flatMap((run) => run.tests.flatMap((test) => test.attempts)).find((attempt) => attempt.basedOn !== null);
  const test = query.test ?? lastIteration?.test ?? withResults[0]?.benchmark.id;
  if (!test) {
    return (
      <>
        <Crumbs items={[{ label: "comparer", href: "/comparer" }]} />
        <div style={css("padding:40px 0;font:400 13px/1.5 var(--mono);color:var(--fg-2)")}>Aucun résultat à comparer pour l’instant.</div>
      </>
    );
  }
  const keys = query.keys ? query.keys.split(",").filter(Boolean) : undefined;
  const cmp = await compareDal(test, keys);
  const current = cmp.slots.map((slot) => slot.key);
  const vote = current.length >= 2 ? await voteDal(test, current) : null;
  const n = cmp.slots.length;
  const same = (a: string[] | null) => !!a && a.length === current.length && a.every((key, index) => key === current[index]);
  const presets = [
    { label: "modèles", keys: cmp.presets.models },
    ...(cmp.presets.versions ? [{ label: "v1 / v2", keys: cmp.presets.versions }] : []),
  ];
  const benchOptions = withResults.map((card) => card.benchmark.id);
  const formatCell = (key: CompareRowKey, value: number | boolean | null, index: number) => {
    if (value === null) return "—";
    if (key === "rating") return `★ ${value}/5`;
    if (key === "checks") {
      const checks = cmp.slots[index].checks;
      return checks ? `${checks.passed}/${checks.total}` : "—";
    }
    if (key === "tests") return value ? "✓ passent" : "✕ échouent";
    if (key === "starts") return value ? "✓ oui" : "✕ non";
    if (key === "duration") return duration(value as number);
    if (key === "cost") return money(value as number);
    return tokens(value as number);
  };
  const cellColor = (key: CompareRowKey, value: number | boolean | null) =>
    value === null ? "var(--fg-3)" : key === "starts" || key === "tests" ? (value ? "var(--ok)" : "var(--err)") : "var(--fg)";
  return (
    <>
      <Crumbs
        items={[
          { label: "comparer", href: "/comparer" },
          {
            label: test,
            menuTitle: "bench",
            options: withResults.map((card) => ({ label: card.benchmark.id, sub: card.group, href: compareHref(card.benchmark.id, [], blind), active: card.benchmark.id === test })),
          },
        ]}
      />
      <div data-screen-label="Comparer" style={css("display:flex;flex-direction:column;gap:16px")}>
        <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap")}>
          <div>
            <h1 style={css("margin:0;font:600 22px/1.2 var(--mono);letter-spacing:-.01em")}>{cmp.benchmark.id}</h1>
            <div style={css("margin-top:5px;font:400 13px/1.3 var(--mono);color:var(--fg-2)")}>
              {cmp.benchmark.title} · {n} résultats côte à côte
            </div>
          </div>
          <div style={css("display:flex;align-items:center;gap:8px;flex-wrap:wrap")}>
            <div style={css("display:flex;padding:3px;border:1px solid var(--border);border-radius:8px;background:var(--surface)")}>
              {presets.map((preset) => {
                const active = same(preset.keys);
                return (
                  <Link
                    key={preset.label}
                    href={compareHref(test, preset.keys, blind)}
                    style={css(
                      `display:inline-flex;align-items:center;height:26px;padding:0 10px;border:0;border-radius:5px;background:${active ? "var(--surface-2)" : "transparent"};color:${active ? "var(--fg)" : "var(--fg-2)"};font:500 12.5px/1 var(--mono);cursor:pointer;text-decoration:none`,
                    )}
                  >
                    {preset.label}
                  </Link>
                );
              })}
            </div>
            <Link
              href={compareHref(test, current, !blind)}
              style={css(
                `display:inline-flex;align-items:center;gap:9px;height:32px;padding:0 11px;border:1px solid ${blind ? "var(--accent)" : "var(--border-strong)"};border-radius:7px;background:transparent;color:var(--fg);font:500 13px/1 var(--sans);cursor:pointer;text-decoration:none`,
              )}
            >
              <span style={css(`position:relative;width:28px;height:16px;border-radius:8px;background:${blind ? "var(--accent)" : "var(--border-strong)"}`)}>
                <span style={css(`position:absolute;top:2px;left:${blind ? "14px" : "2px"};width:12px;height:12px;border-radius:50%;background:#fff`)} />
              </span>
              Mode aveugle
            </Link>
            {n < 4 && cmp.addable.length ? (
              <Link
                href={compareHref(test, [...current, cmp.addable[0]], blind)}
                {...sx(
                  "display:inline-flex;align-items:center;height:32px;padding:0 12px;border:1px solid var(--border-strong);border-radius:7px;background:transparent;color:var(--fg);font:500 13px/1 var(--sans);cursor:pointer;text-decoration:none",
                  "background:var(--surface-2)",
                )}
              >
                + Ajouter
              </Link>
            ) : null}
          </div>
        </div>
        <div style={css("display:flex;gap:6px;flex-wrap:wrap")}>
          {benchOptions.map((id) => {
            const colors = chip(id === test);
            return (
              <Link
                key={id}
                href={compareHref(id, [], blind)}
                style={css(
                  `display:inline-flex;align-items:center;height:26px;padding:0 9px;border:1px solid ${colors.bd};border-radius:6px;background:${colors.bg};color:${colors.fg};font:400 12px/1 var(--mono);cursor:pointer;text-decoration:none`,
                )}
              >
                {id}
              </Link>
            );
          })}
        </div>
        <div style={css(`display:grid;grid-template-columns:repeat(${Math.max(n, 1)},minmax(0,1fr));gap:12px`)}>
          {cmp.slots.map((slot, index) => {
            const preferred = vote?.preferred === slot.key;
            const st = ST[slot.state];
            const ok = slot.state === "done";
            const versioned = slot.attempt.number > 1 || cmp.slots.some((other) => other !== slot && other.attempt.model === slot.attempt.model && other.attempt.run === slot.attempt.run);
            return (
              <section
                key={slot.key}
                style={css(`border:1px solid ${preferred ? "var(--accent)" : "var(--border)"};border-radius:10px;background:var(--surface);overflow:hidden;display:flex;flex-direction:column`)}
              >
                <div style={css("display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:11px 12px")}>
                  <div style={css("min-width:0")}>
                    <div style={css("font:600 13.5px/1.25 var(--mono)")}>
                      {blind ? `Résultat ${LETTERS[index]}` : `${slot.attempt.model}${versioned ? ` · v${slot.attempt.number}` : ""}`}
                    </div>
                    <div style={css("margin-top:3px;font:400 12px/1.2 var(--mono);color:var(--fg-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>
                      {blind ? "identité masquée" : `${slot.attempt.run} · via ${harness(slot.model?.tool ?? "?", slot.attempt.cliVersion)}`}
                    </div>
                  </div>
                  {n > 2 ? (
                    <Link
                      href={compareHref(
                        test,
                        current.filter((key) => key !== slot.key),
                        blind,
                      )}
                      title="Retirer"
                      {...sx(
                        "width:24px;height:24px;flex:none;display:grid;place-items:center;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--fg-2);font:400 14px/1 var(--sans);cursor:pointer;text-decoration:none",
                        "color:var(--fg)",
                      )}
                    >
                      ×
                    </Link>
                  ) : null}
                </div>
                <div style={css("position:relative;aspect-ratio:4/3;background:#030304;border-top:1px solid var(--border);border-bottom:1px solid var(--border);overflow:hidden")}>
                  {ok ? (
                    <DemoFrame attempt={slot.attempt} capture={slot.attempt.hasCapture ? captureUrl(slot.attempt) : null} />
                  ) : (
                    <div style={css("position:absolute;inset:0;display:grid;place-items:center;background:#0b0b0c;color:#fafafa;font:600 13px/1.3 var(--mono)")}>
                      {st.g} {st.label}
                    </div>
                  )}
                  <span style={css("position:absolute;left:8px;top:8px;padding:3px 6px;border-radius:4px;background:rgba(0,0,0,.72);color:#fafafa;font:600 11.5px/1 var(--mono)")}>
                    {LETTERS[index]}
                  </span>
                </div>
                <div style={css("padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px")}>
                  <span
                    style={css(
                      `display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 7px;border-radius:5px;border:1px ${st.bs} ${st.bd};background:${st.bg};color:${st.fg};font:500 11.5px/1 var(--mono);white-space:nowrap`,
                    )}
                  >
                    <span>{st.g}</span>
                    {st.label}
                  </span>
                  <ActionButton
                    action={voteAction.bind(null, test, current, slot.key, blind)}
                    disabled={n < 2}
                    style={css(
                      `height:28px;padding:0 10px;border:1px solid ${preferred ? "var(--accent)" : "var(--border-strong)"};border-radius:6px;background:${preferred ? "var(--accent-soft)" : "transparent"};color:${preferred ? "var(--accent-text)" : "var(--fg)"};font:600 12.5px/1 var(--sans);cursor:pointer`,
                    )}
                  >
                    {preferred ? "✓ préféré" : "Je préfère"}
                  </ActionButton>
                </div>
              </section>
            );
          })}
        </div>
        <section style={css("border:1px solid var(--border);border-radius:10px;background:var(--surface);overflow:hidden")}>
          {cmp.rows.map((row) => (
            <div
              key={row.key}
              style={css(
                `display:grid;grid-template-columns:140px repeat(${Math.max(n, 1)},minmax(0,1fr));gap:12px;align-items:center;min-height:42px;padding:0 12px;border-bottom:1px solid var(--border)`,
              )}
            >
              <span style={css("font:400 12.5px/1 var(--mono);color:var(--fg-3)")}>{ROW_LABELS[row.key]}</span>
              {row.cells.map((cell, index) => (
                <span
                  key={index}
                  style={css(`display:flex;align-items:center;gap:8px;font:${row.key === "checks" ? "600" : "400"} 13.5px/1 var(--mono);color:${cellColor(row.key, cell.value)}`)}
                >
                  {formatCell(row.key, cell.value, index)}
                  {cell.best ? (
                    <span style={css("padding:3px 5px;border-radius:4px;background:var(--accent-soft);color:var(--accent-text);font:600 10px/1 var(--mono);letter-spacing:.04em")}>BEST</span>
                  ) : null}
                </span>
              ))}
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
