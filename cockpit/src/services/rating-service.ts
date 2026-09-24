import { z } from "zod";
import { getAttemptDao, rateAttemptDao } from "@/db/repositories/attempt-repository";
import { NotFoundError, ValidationError } from "@/services/errors/service-errors";
import type { AttemptRef } from "@/services/types/domain/attempt-types";
import { attemptRefSchema, parseOrThrow } from "@/services/validation/ref-validation";

const ratingSchema = z.number().int().min(1).max(5).nullable();

/** Give a finished result 1 to 5 stars, or remove its note with null. The note drives the score and the leaderboard. */
export async function rateAttemptService(input: AttemptRef & { rating: number | null }): Promise<void> {
  const ref = parseOrThrow(attemptRefSchema, input);
  const rating = parseOrThrow(ratingSchema, input.rating);
  const attempt = await getAttemptDao(ref);
  if (!attempt) throw new NotFoundError("Attempt not found");
  if (attempt.status === "running") throw new ValidationError("A running attempt cannot be rated yet");
  await rateAttemptDao(ref, rating);
}
