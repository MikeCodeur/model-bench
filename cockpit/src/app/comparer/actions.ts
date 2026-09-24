"use server";

import { revalidatePath } from "next/cache";
import { failure, type ActionResult } from "@/app/action-result";
import { recordVoteService } from "@/services/vote-service";

export async function voteAction(test: string, candidates: string[], preferred: string, blind: boolean): Promise<ActionResult> {
  try {
    await recordVoteService({ test, candidates, preferred, blind });
    revalidatePath("/comparer");
    return { success: true, message: "Préférence enregistrée" };
  } catch (error) {
    return failure(error);
  }
}
