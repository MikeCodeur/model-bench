import { z } from "zod";
import { modelIdSchema, runIdSchema, testIdSchema } from "./ref-validation";

export const launchRunSchema = z.object({ model: modelIdSchema, tests: z.array(testIdSchema).min(1).max(100) });
export const retryTestSchema = z.object({ model: modelIdSchema, run: runIdSchema, test: testIdSchema });
export const iterateSchema = retryTestSchema.extend({ delta: z.string().trim().min(3).max(2000) });
export const runRefInputSchema = z.object({ model: modelIdSchema, run: runIdSchema });
