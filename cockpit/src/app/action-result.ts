import { ConflictError, NotFoundError, ValidationError } from "@/services/errors/service-errors";

export type ActionResult = { success: boolean; message: string; href?: string };

/** Turn a service error into a message the UI can show; unexpected errors bubble up. */
export function failure(error: unknown): ActionResult {
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
    return { success: false, message: error.message };
  }
  throw error;
}
