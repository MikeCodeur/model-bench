import "server-only";
import path from "node:path";
import { z } from "zod";
import type { Model } from "@/services/types/domain/model-types";
import { readJson, repoDir } from "./storage";

const storedModels = z.record(
  z.string(),
  z.object({
    label: z.string(),
    command: z.string(),
    model_id: z.string().optional(),
    billing: z.enum(["subscription", "api"]).default("api"),
  }),
);

export async function getModelsDao(): Promise<Model[]> {
  const data = storedModels.parse(await readJson(path.join(repoDir(), "models.json")));
  return Object.entries(data).map(([id, model]) => ({
    id,
    label: model.label,
    modelId: model.model_id ?? null,
    billing: model.billing,
    command: model.command,
  }));
}
