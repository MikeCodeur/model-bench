import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Vote } from "@/services/types/domain/vote-types";
import { dataDir } from "./storage";

const votesFile = () => path.join(dataDir(), ".cockpit", "votes.json");

const storedVotes = z.array(
  z.object({
    test: z.string(),
    candidates: z.array(z.string()),
    preferred: z.string(),
    blind: z.boolean(),
    at: z.string(),
  }),
);

export async function listVotesDao(): Promise<Vote[]> {
  try {
    return storedVotes.parse(JSON.parse(await fs.readFile(votesFile(), "utf-8")));
  } catch {
    return [];
  }
}

export async function addVoteDao(vote: Vote): Promise<void> {
  const votes = [...(await listVotesDao()), vote];
  await fs.mkdir(path.dirname(votesFile()), { recursive: true });
  await fs.writeFile(votesFile(), JSON.stringify(votes, null, 2) + "\n", "utf-8");
}
