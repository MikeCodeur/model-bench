import { benchmarkCardsDal, estimateTableDal, leaderboardDal, listModelsDal } from "@/app/dal/cockpit-dal";
import { Crumbs } from "@/components/ck/crumbs";
import { difficulty, harness, money } from "@/components/ck/format";
import { LaunchForm } from "@/components/ck/launch-form";
import { thumbBackground } from "@/components/ck/primitives";
import { css } from "@/components/ck/style";
import { captureUrl } from "@/components/ck/urls";
import { BENCHMARK_GROUPS } from "@/services/types/domain/benchmark-types";

const TIMEOUT_MIN = 30;

export default async function LancerPage({ searchParams }: { searchParams: Promise<{ model?: string; sel?: string }> }) {
  const query = await searchParams;
  const [models, board, cards] = await Promise.all([listModelsDal(), leaderboardDal(), benchmarkCardsDal()]);
  const estimates = await estimateTableDal(models.map((model) => model.id));
  const initialModel = models.find((model) => model.id === query.model)?.id ?? models[0]?.id ?? "";
  const known = new Set(cards.map((card) => card.benchmark.id));
  return (
    <>
      <Crumbs items={[{ label: "nouveau-run", href: "/lancer" }]} />
      <div data-screen-label="Lancer un run" style={css("display:flex;flex-direction:column;gap:16px")}>
        <div>
          <h1 style={css("margin:0;font:600 22px/1.2 var(--sans);letter-spacing:-.015em")}>Lancer un run</h1>
          <div style={css("margin-top:4px;font:400 13px/1.3 var(--mono);color:var(--fg-2)")}>un modèle × une sélection de benchs · {TIMEOUT_MIN} min max par projet</div>
        </div>
        <LaunchForm
          models={models.map((model) => {
            const row = board.find((item) => item.id === model.id);
            return { id: model.id, tool: harness(model.tool, row?.cliVersion ?? null), score: row?.benchmarks ? String(row.score) : "—", cost: money(row?.costPerProjectUsd ?? null) };
          })}
          groups={BENCHMARK_GROUPS}
          benches={cards.map((card) => ({
            id: card.benchmark.id,
            meta: `${card.benchmark.title} · ${difficulty(card.benchmark.difficulty)}`,
            group: card.group,
            thumb: thumbBackground(card.cover ? captureUrl(card.cover) : null),
          }))}
          estimates={estimates}
          initialModel={initialModel}
          initialSel={(query.sel ?? "").split(",").filter((id) => known.has(id))}
        />
      </div>
    </>
  );
}
