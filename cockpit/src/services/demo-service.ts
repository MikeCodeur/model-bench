import { getAttemptDao } from "@/db/repositories/attempt-repository";
import { stopBenchProcesses } from "@/lib/bench-cli";
import { listDemoProcesses, startDemoProcess, stopDemoProcess, type DemoStart } from "@/lib/demo-process";
import { NotFoundError, ValidationError } from "@/services/errors/service-errors";
import type { AttemptRef } from "@/services/types/domain/attempt-types";
import { attemptRefSchema, parseOrThrow } from "@/services/validation/ref-validation";

/** Demos kept running at once; the oldest stops when a new one starts beyond this. Room for a whole run of two models. */
const MAX_DEMOS = 40;

const targetOf = (ref: AttemptRef) => `${ref.model}/${ref.run}/${ref.test}/attempt-${ref.number}`;

/** Start (or reuse) the demo of a finished attempt with the launch contract. */
export async function startDemoService(input: AttemptRef): Promise<DemoStart> {
  const ref = parseOrThrow(attemptRefSchema, input);
  const attempt = await getAttemptDao(ref);
  if (!attempt) throw new NotFoundError("Attempt not found");
  if (attempt.status === "running") throw new ValidationError("The attempt is still running");
  const target = targetOf(ref);
  const running = listDemoProcesses().filter((demo) => demo.key !== target);
  for (const demo of running.sort((a, b) => a.startedAt - b.startedAt).slice(0, Math.max(0, running.length - (MAX_DEMOS - 1)))) {
    stopDemoProcess(demo.key);
  }
  return startDemoProcess(target);
}

/** Stop the demo of one attempt, whether the cockpit or a terminal (`bench start`) started it. */
export async function stopDemoService(input: AttemptRef): Promise<void> {
  const ref = parseOrThrow(attemptRefSchema, input);
  stopDemoProcess(targetOf(ref));
  await stopBenchProcesses({ kind: "demo", model: ref.model, run: ref.run, test: ref.test });
}
