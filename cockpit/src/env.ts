import "server-only";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  MODEL_BENCH_DATA: z.string().default(path.join(os.homedir(), "model-bench-data")),
  BENCH_REPO: z.string().default(path.resolve(process.cwd(), "..")),
  COCKPIT_MODE: z.enum(["local", "public"]).default("local"),
});

export const env = schema.parse(process.env);
