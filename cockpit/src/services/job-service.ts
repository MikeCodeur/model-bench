import { randomUUID } from "node:crypto";
import { jobLogPath, listJobsDao, saveJobDao } from "@/db/repositories/job-repository";
import { listRunsDao } from "@/db/repositories/run-repository";
import { benchArgs, isProcessAlive, isRunnerAlive, listBenchProcesses, spawnBench, stopBenchProcesses, type BenchCommand } from "@/lib/bench-cli";
import { listBenchmarksService } from "@/services/benchmark-service";
import { ConflictError, NotFoundError } from "@/services/errors/service-errors";
import { listModelsService } from "@/services/model-service";
import { getRunService, listRunDetailsService } from "@/services/run-service";
import type { Job, JobKind } from "@/services/types/domain/job-types";
import type { BenchProcess, BenchProcessKind } from "@/services/types/domain/process-types";
import { iterateSchema, launchRunSchema, retryTestSchema, runRefInputSchema } from "@/services/validation/job-validation";
import { modelIdSchema, parseOrThrow } from "@/services/validation/ref-validation";

export type JobStarted = { model: string; run: string; job: Job };

async function requireModel(model: string) {
  if (!(await listModelsService()).some((item) => item.id === model)) throw new NotFoundError(`Model ${model} is not declared`);
}

async function requireTests(tests: string[]) {
  const known = new Set((await listBenchmarksService()).map((bench) => bench.id));
  const unknown = tests.filter((test) => !known.has(test));
  if (unknown.length) throw new NotFoundError(`Unknown benchmarks: ${unknown.join(", ")}`);
}

/** One `bench run` per model at a time, like the runner's concurrency of 1. */
function requireIdle(model: string) {
  if (isRunnerAlive(model)) throw new ConflictError(`A run is already in progress for ${model}`);
}

/** Next free `<date>-<letter>` id, the same rule as the runner. */
export async function nextRunId(model: string, now = new Date()): Promise<string> {
  const day = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const taken = new Set((await listRunsDao()).filter((ref) => ref.model === model).map((ref) => ref.run));
  const letter = "abcdefghijklmnopqrstuvwxyz".split("").find((candidate) => !taken.has(`${day}-${candidate}`));
  if (!letter) throw new ConflictError(`Too many runs on ${day}`);
  return `${day}-${letter}`;
}

const LIVE_WAIT_MS = 20_000;

/** Wait until the runner has created its attempt, so the page the user lands on already shows it running. */
async function waitUntilLive(model: string, run: string, pid: number): Promise<void> {
  const deadline = Date.now() + LIVE_WAIT_MS;
  while (Date.now() < deadline && isProcessAlive(pid)) {
    const detail = await getRunService({ model, run }).catch(() => null);
    if (detail?.live) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function start(kind: JobKind, command: BenchCommand, run: string | null): Promise<JobStarted> {
  const id = randomUUID();
  const args = benchArgs(command);
  const job: Job = {
    id,
    kind,
    model: command.model,
    run,
    tests: command.tests,
    args,
    pid: spawnBench(args, jobLogPath(id)),
    startedAt: new Date().toISOString(),
    stoppedAt: null,
  };
  await saveJobDao(job);
  if (run) await waitUntilLive(command.model, run, job.pid);
  return { model: command.model, run: run ?? "", job };
}

/** New run of a model on a selection of benchmarks. */
export async function launchRunService(input: { model: string; tests: string[] }): Promise<JobStarted> {
  const { model, tests } = parseOrThrow(launchRunSchema, input);
  await requireModel(model);
  await requireTests(tests);
  requireIdle(model);
  const runId = await nextRunId(model);
  return start("run", { kind: "run", model, runId, tests }, runId);
}

/** New run with the same benchmarks as an existing one. */
export async function rerunRunService(input: { model: string; run: string }): Promise<JobStarted> {
  const { model, run } = parseOrThrow(runRefInputSchema, input);
  const detail = await getRunService({ model, run });
  return launchRunService({ model, tests: detail.tests.map((test) => test.test) });
}

/** New attempt of one benchmark inside an existing run. */
export async function retryTestService(input: { model: string; run: string; test: string }): Promise<JobStarted> {
  const { model, run, test } = parseOrThrow(retryTestSchema, input);
  await getRunService({ model, run });
  await requireTests([test]);
  requireIdle(model);
  return start("retry", { kind: "retry", model, run, tests: [test] }, run);
}

/** Iteration: the model continues its latest attempt with a delta prompt. */
export async function iterateService(input: { model: string; run: string; test: string; delta: string }): Promise<JobStarted> {
  const { model, run, test, delta } = parseOrThrow(iterateSchema, input);
  await getRunService({ model, run });
  requireIdle(model);
  return start("iterate", { kind: "iterate", model, run, tests: [test], delta }, run);
}

async function closeJobs(model?: string) {
  const now = new Date().toISOString();
  for (const job of await listJobsDao()) {
    if ((!model || job.model === model) && !job.stoppedAt) await saveJobDao({ ...job, stoppedAt: now });
  }
}

/** Stop every runner of a model; the runner marks the current attempt `aborted`. */
export async function stopRunService(input: { model: string }): Promise<void> {
  const model = parseOrThrow(modelIdSchema, input.model);
  await stopBenchProcesses({ model, kind: "run" });
  await closeJobs(model);
}

/** Delivered attempts of UI benchmarks that have no screenshot yet. */
export async function missingCapturesService(): Promise<number> {
  const [runs, benchmarks] = await Promise.all([listRunDetailsService(), listBenchmarksService()]);
  const withUi = new Set(benchmarks.filter((bench) => bench.capture !== "none").map((bench) => bench.id));
  return runs
    .flatMap((run) => run.tests.flatMap((test) => test.attempts))
    .filter((attempt) => attempt.status === "ok" && !attempt.hasCapture && withUi.has(attempt.test)).length;
}

/** `bench shots` in the background: screenshot every delivered attempt still missing one. */
export async function syncCapturesService(): Promise<Job> {
  const active = await listActiveJobsService();
  if (active.some((job) => job.kind === "shots")) throw new ConflictError("Les captures sont déjà en cours de synchronisation");
  return (await start("shots", { kind: "shots", model: "*", tests: [] }, null)).job;
}

/** Runs and demo servers started by bench, from the cockpit or a terminal. */
export async function listBenchProcessesService(): Promise<BenchProcess[]> {
  return listBenchProcesses();
}

/** Stop all runs and demo servers, or only one kind. */
export async function stopAllService(input: { kind?: BenchProcessKind } = {}): Promise<BenchProcess[]> {
  const kind = input.kind === "run" || input.kind === "demo" ? input.kind : undefined;
  const stopped = await stopBenchProcesses({ kind });
  if (kind !== "demo") await closeJobs();
  return stopped;
}

export async function listActiveJobsService(): Promise<Job[]> {
  return (await listJobsDao()).filter((job) => !job.stoppedAt && isProcessAlive(job.pid));
}
