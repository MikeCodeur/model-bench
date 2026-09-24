import { z } from "zod";
import { addVoteDao, listVotesDao } from "@/db/repositories/vote-repository";
import type { Vote } from "@/services/types/domain/vote-types";
import { parseOrThrow, testIdSchema } from "@/services/validation/ref-validation";

const attemptKey = z.string().regex(/^[a-z0-9][a-z0-9._-]*\/\d{4}-\d{2}-\d{2}-[a-z]\/[a-z0-9-]+\/attempt-\d+$/);

const voteInput = z
  .object({ test: testIdSchema, candidates: z.array(attemptKey).min(2).max(4), preferred: attemptKey, blind: z.boolean() })
  .refine((vote) => vote.candidates.includes(vote.preferred), { message: "preferred must be one of the candidates" });

/** Record a "Je préfère" pick between two to four results of the same benchmark. */
export async function recordVoteService(input: Omit<Vote, "at">): Promise<Vote> {
  const vote = { ...parseOrThrow(voteInput, input), at: new Date().toISOString() };
  await addVoteDao(vote);
  return vote;
}

/** The latest pick for this exact set of candidates, if any. */
export async function getVoteService(input: { test: string; candidates: string[] }): Promise<Vote | null> {
  const key = [...input.candidates].sort().join("|");
  const votes = (await listVotesDao()).filter((vote) => vote.test === input.test && [...vote.candidates].sort().join("|") === key);
  return votes[votes.length - 1] ?? null;
}
