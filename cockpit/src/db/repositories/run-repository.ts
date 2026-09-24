import "server-only";
import path from "node:path";
import { z } from "zod";
import { dataDir, exists, listDirs, readJson } from "./storage";

export type StoredRunRef = { model: string; run: string };

export type StoredRunMeta = {
  createdAt: string | null;
  cliVersion: string | null;
  planned: string[];
  timeoutMin: number;
};

const storedRun = z.object({
  created_at: z.string().nullish(),
  cli_version: z.string().nullish(),
  planned: z.array(z.string()).default([]),
  guards: z.object({ timeout_min: z.number().default(30) }).default({ timeout_min: 30 }),
});

export async function listRunsDao(): Promise<StoredRunRef[]> {
  const runs: StoredRunRef[] = [];
  for (const model of await listDirs(dataDir())) {
    for (const run of await listDirs(path.join(dataDir(), model))) {
      runs.push({ model, run });
    }
  }
  return runs;
}

export async function getRunMetaDao(ref: StoredRunRef): Promise<StoredRunMeta | null> {
  const file = path.join(dataDir(), ref.model, ref.run, "run.json");
  if (!(await exists(file))) return null;
  const data = storedRun.parse(await readJson(file));
  return {
    createdAt: data.created_at ?? null,
    cliVersion: data.cli_version ?? null,
    planned: data.planned,
    timeoutMin: data.guards.timeout_min,
  };
}
