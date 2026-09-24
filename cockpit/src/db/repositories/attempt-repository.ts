import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Attempt, AttemptRef, WorkspaceFile } from "@/services/types/domain/attempt-types";
import { dataDir, exists, listDirs, readJson, readText, safeJoin } from "./storage";

export type AttemptTextFile = "PROMPT.md" | "command.txt" | "output.log";

const MAX_FILE_BYTES = 512 * 1024;
const WORKSPACE_IGNORED = new Set(["node_modules", ".next", "dist", ".git", ".turbo", ".cache", ".vite"]);

const storedAttempt = z.object({
  kind: z.enum(["fresh", "iteration"]).default("fresh"),
  based_on: z.string().nullish(),
  status: z.enum(["ok", "error", "timeout", "stalled", "rate_limited", "aborted"]),
  started_at: z.string().nullish(),
  duration_s: z.number().nullish(),
  model_id: z.string().nullish(),
  cli_version: z.string().nullish(),
  suite_commit: z.string().nullish(),
  start: z.enum(["ok", "ko"]).nullish(),
  self_tests: z.enum(["pass", "fail", "none"]).nullish(),
  tokens: z
    .object({
      input: z.number().nullish(),
      output: z.number().nullish(),
      cache_read: z.number().nullish(),
      cache_write: z.number().nullish(),
    })
    .default({}),
  cost_usd: z.number().nullish(),
  billing: z.string().nullish(),
  stack: z.string().nullish(),
  score: z.number().nullish(),
  notes: z.string().default(""),
});

const attemptDir = (ref: AttemptRef) => path.join(dataDir(), ref.model, ref.run, ref.test, `attempt-${ref.number}`);

const attemptNumber = (dir: string) => Number(dir.replace("attempt-", ""));

async function readAttempt(ref: AttemptRef): Promise<Attempt> {
  const dir = attemptDir(ref);
  const file = path.join(dir, "attempt.json");
  if (!(await exists(file))) {
    const started = await fs.stat(path.join(dir, "PROMPT.md")).catch(() => null);
    return {
      ...ref,
      kind: "fresh",
      basedOn: null,
      status: "running",
      startedAt: started ? started.mtime.toISOString() : null,
      durationS: null,
      modelId: null,
      cliVersion: null,
      suiteCommit: null,
      start: null,
      selfTests: null,
      tokens: { input: null, output: null, cacheRead: null, cacheWrite: null },
      costUsd: null,
      billing: null,
      stack: null,
      score: null,
      notes: "",
      hasCapture: false,
    };
  }
  const data = storedAttempt.parse(await readJson(file));
  return {
    ...ref,
    kind: data.kind,
    basedOn: data.based_on ? attemptNumber(data.based_on) : null,
    status: data.status,
    startedAt: data.started_at ?? null,
    durationS: data.duration_s ?? null,
    modelId: data.model_id ?? null,
    cliVersion: data.cli_version ?? null,
    suiteCommit: data.suite_commit ?? null,
    start: data.start ?? null,
    selfTests: data.self_tests ?? null,
    tokens: {
      input: data.tokens.input ?? null,
      output: data.tokens.output ?? null,
      cacheRead: data.tokens.cache_read ?? null,
      cacheWrite: data.tokens.cache_write ?? null,
    },
    costUsd: data.cost_usd ?? null,
    billing: data.billing ?? null,
    stack: data.stack ?? null,
    score: data.score ?? null,
    notes: data.notes,
    hasCapture: await exists(path.join(dir, "captures", "screenshot.jpg")),
  };
}

export async function listRunAttemptsDao(model: string, run: string): Promise<Attempt[]> {
  const attempts: Attempt[] = [];
  for (const test of await listDirs(path.join(dataDir(), model, run))) {
    const dirs = (await listDirs(path.join(dataDir(), model, run, test))).filter((dir) => /^attempt-\d+$/.test(dir));
    for (const dir of dirs) {
      attempts.push(await readAttempt({ model, run, test, number: attemptNumber(dir) }));
    }
  }
  return attempts;
}

export async function getAttemptDao(ref: AttemptRef): Promise<Attempt | null> {
  return (await exists(attemptDir(ref))) ? readAttempt(ref) : null;
}

export async function readAttemptFileDao(ref: AttemptRef, file: AttemptTextFile): Promise<string | null> {
  return readText(path.join(attemptDir(ref), file));
}

export async function listWorkspaceDao(ref: AttemptRef): Promise<WorkspaceFile[]> {
  const root = path.join(attemptDir(ref), "workspace");
  const files: WorkspaceFile[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (WORKSPACE_IGNORED.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.push({ path: path.relative(root, full), size: (await fs.stat(full)).size });
    }
  }
  await walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function readCaptureDao(ref: AttemptRef): Promise<Buffer | null> {
  return fs.readFile(path.join(attemptDir(ref), "captures", "screenshot.jpg")).catch(() => null);
}

export async function readWorkspaceFileDao(ref: AttemptRef, relative: string): Promise<string | null> {
  const file = safeJoin(path.join(attemptDir(ref), "workspace"), relative);
  if (!file) return null;
  const stat = await fs.stat(file).catch(() => null);
  if (!stat?.isFile() || stat.size > MAX_FILE_BYTES) return null;
  return readText(file);
}
