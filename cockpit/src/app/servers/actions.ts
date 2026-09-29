"use server";

import { revalidatePath } from "next/cache";
import { failure, type ActionResult } from "@/app/action-result";
import { startDemosService, stopServersService, type ServerScope } from "@/services/server-service";

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

export async function stopServersAction(scope: ServerScope = {}): Promise<ActionResult> {
  try {
    const stopped = await stopServersService(scope);
    revalidatePath("/", "layout");
    if (!stopped.length) return { success: true, message: "Rien à arrêter" };
    const runs = stopped.filter((item) => item.kind === "run").length;
    return { success: true, message: `Arrêté · ${plural(runs, "run")}, ${plural(stopped.length - runs, "démo")}` };
  } catch (error) {
    return failure(error);
  }
}

export async function startDemosAction(scope: { model?: string; run?: string } = {}): Promise<ActionResult> {
  try {
    const count = await startDemosService(scope);
    revalidatePath("/", "layout");
    return { success: true, message: count ? `Démarrage de ${plural(count, "démo")}, une par une` : "Aucune démo livrée à démarrer" };
  } catch (error) {
    return failure(error);
  }
}
