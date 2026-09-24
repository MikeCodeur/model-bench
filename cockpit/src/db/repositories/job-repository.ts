import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Job } from "@/services/types/domain/job-types";
import { dataDir } from "./storage";

const jobsDir = () => path.join(dataDir(), ".cockpit", "jobs");

const storedJob = z.object({
  id: z.string(),
  kind: z.enum(["run", "retry", "rerun", "iterate"]),
  model: z.string(),
  run: z.string().nullable(),
  tests: z.array(z.string()),
  args: z.array(z.string()),
  pid: z.number(),
  startedAt: z.string(),
  stoppedAt: z.string().nullable(),
});

export const jobLogPath = (id: string) => path.join(jobsDir(), `${id}.log`);

export async function saveJobDao(job: Job): Promise<void> {
  await fs.mkdir(jobsDir(), { recursive: true });
  await fs.writeFile(path.join(jobsDir(), `${job.id}.json`), JSON.stringify(job, null, 2) + "\n", "utf-8");
}

export async function listJobsDao(): Promise<Job[]> {
  const files = await fs.readdir(jobsDir()).catch(() => [] as string[]);
  const jobs: Job[] = [];
  for (const file of files.filter((name) => name.endsWith(".json"))) {
    try {
      jobs.push(storedJob.parse(JSON.parse(await fs.readFile(path.join(jobsDir(), file), "utf-8"))));
    } catch {
      continue;
    }
  }
  return jobs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}
