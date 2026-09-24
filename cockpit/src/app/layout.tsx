import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/context/app-providers";
import { Shell, type LivePill, type PaletteItem } from "@/components/ck/shell";
import { css } from "@/components/ck/style";
import { money } from "@/components/ck/format";
import { runHref, resultHref } from "@/components/ck/urls";
import { benchProcessesDal, benchmarkCardsDal, listModelsDal, missingCapturesDal, runDetailsDal } from "@/app/dal/cockpit-dal";
import { stopAllAction, stopRunAction, syncCapturesAction } from "@/app/runs/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "model-bench · cockpit",
  description: "Lancer, suivre et comparer les benchmarks de modèles d'IA",
};

async function stop(model: string) {
  "use server";
  return stopRunAction(model);
}

async function syncCaptures() {
  "use server";
  return syncCapturesAction();
}

async function stopAll(kind?: "run" | "demo") {
  "use server";
  return stopAllAction(kind);
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [runs, models, cards, processes, missingCaptures] = await Promise.all([runDetailsDal(), listModelsDal(), benchmarkCardsDal(), benchProcessesDal(), missingCapturesDal()]);
  const running = { runs: processes.filter((item) => item.kind === "run").length, demos: processes.filter((item) => item.kind === "demo").length };
  const liveRun = runs.find((run) => run.live) ?? runs[0] ?? null;
  const live: LivePill = liveRun
    ? {
        model: liveRun.model,
        progress: `${liveRun.totals.finished}/${liveRun.totals.tests}`,
        cost: money(liveRun.totals.costUsd),
        running: liveRun.live,
        href: runHref(liveRun.model, liveRun.run),
      }
    : null;
  const latestRunOf = (model: string) => runs.find((run) => run.model === model);
  const palette: PaletteItem[] = [
    { group: "actions", label: "Lancer un run", sub: "", href: "/lancer" },
    { group: "actions", label: "Thème", sub: "", action: "theme" },
    ...runs.filter((run) => run.live).map((run): PaletteItem => ({ group: "actions", label: "Arrêter le run en direct", sub: run.model, action: "stop", model: run.model })),
    ...(running.runs + running.demos
      ? [
          { group: "actions", label: "Tout arrêter", sub: `${running.runs} runs · ${running.demos} démos`, action: "stopAll" } as PaletteItem,
          ...(running.demos ? [{ group: "actions", label: "Arrêter les démos", sub: `${running.demos} serveurs`, action: "stopDemos" } as PaletteItem] : []),
        ]
      : []),
    ...(missingCaptures ? [{ group: "actions", label: "Synchroniser les captures", sub: `${missingCaptures} manquantes`, action: "syncCaptures" } as PaletteItem] : []),
    { group: "actions", label: "Comparer en mode aveugle", sub: "", href: "/comparer?blind=1" },
    { group: "aller à", label: "Accueil", sub: "", href: "/" },
    { group: "aller à", label: "Benchs", sub: "", href: "/benchs" },
    { group: "aller à", label: "Classement", sub: "", href: "/classement" },
    { group: "aller à", label: "Tokens", sub: "", href: "/tokens" },
    ...models.map((model): PaletteItem => {
      const latest = latestRunOf(model.id);
      return { group: "modèles", label: model.id, sub: model.tool, href: latest ? runHref(model.id, latest.run) : `/lancer?model=${model.id}` };
    }),
    ...runs.map((run): PaletteItem => ({ group: "runs", label: `${run.run} · ${run.model}`, sub: run.live ? "en direct" : run.run.slice(0, 10), href: runHref(run.model, run.run) })),
    ...cards.map((card): PaletteItem => {
      const latest = card.results[0]?.attempt;
      return { group: "benchs", label: card.benchmark.id, sub: card.benchmark.title, href: latest ? resultHref(latest) : `/lancer?sel=${card.benchmark.id}` };
    }),
  ];
  return (
    <html lang="fr" suppressHydrationWarning>
      <body style={css("min-height:100vh;background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased")}>
        <AppProviders>
          <Shell live={live} running={running} palette={palette} onStop={stop} onStopAll={stopAll} onSyncCaptures={syncCaptures}>
            <div style={css("max-width:1440px;margin:0 auto;padding:16px 28px 64px")}>{children}</div>
          </Shell>
        </AppProviders>
      </body>
    </html>
  );
}
