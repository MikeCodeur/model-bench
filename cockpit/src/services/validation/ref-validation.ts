import { z } from "zod";
import { ValidationError } from "@/services/errors/service-errors";

export const modelIdSchema = z.string().regex(/^[a-z0-9][a-z0-9._-]*$/);
export const runIdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z]$/);
export const testIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const attemptNumberSchema = z.coerce.number().int().min(1);

export const runRefSchema = z.object({ model: modelIdSchema, run: runIdSchema });
export const runTestRefSchema = runRefSchema.extend({ test: testIdSchema });
export const attemptRefSchema = runTestRefSchema.extend({ number: attemptNumberSchema });

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ValidationError(result.error.issues.map((issue) => issue.message).join(", "));
  return result.data;
}
