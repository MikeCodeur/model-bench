import { leaderboardService, type LeaderboardRow } from "@/services/model-service";
import { listRunDetailsService } from "@/services/run-service";
import type { Attempt } from "@/services/types/domain/attempt-types";
import type { RunDetail } from "@/services/types/domain/run-types";

export type Home = {
  runsThisMonth: number;
  runningRuns: number;
  delivered: number;
  finished: number;
  spendUsd: number;
  fastest: Attempt | null;
  live: RunDetail | null;
  recent: Attempt[];
  top: LeaderboardRow[];
};

export async function homeService(now = new Date()): Promise<Home> {
  const [runs, top] = await Promise.all([listRunDetailsService(), leaderboardService()]);
  const tests = runs.flatMap((run) => run.tests);
  const attempts = tests.flatMap((test) => test.attempts);
  const finishedTests = tests.filter((test) => test.state !== "pending" && test.state !== "running");
  const delivered = attempts.filter((attempt) => attempt.status === "ok" && attempt.start !== "ko");
  const month = (date: string | null) => (date ? new Date(date) : null);
  return {
    runsThisMonth: runs.filter((run) => {
      const created = month(run.createdAt);
      return created && created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }).length,
    runningRuns: runs.filter((run) => run.live).length,
    delivered: finishedTests.filter((test) => test.state === "done").length,
    finished: finishedTests.length,
    spendUsd: attempts.reduce((sum, attempt) => sum + (attempt.costUsd ?? 0), 0),
    fastest: [...delivered].sort((a, b) => (a.durationS ?? Infinity) - (b.durationS ?? Infinity))[0] ?? null,
    live: runs.find((run) => run.live) ?? runs[0] ?? null,
    recent: attempts
      .filter((attempt) => attempt.status !== "running")
      .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""))
      .slice(0, 6),
    top: top.slice(0, 6),
  };
}
