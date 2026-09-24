import {
  getAttemptDao,
  listWorkspaceDao,
  readAttemptFileDao,
  readCaptureDao,
  readWorkspaceFileDao,
} from "@/db/repositories/attempt-repository";
import { NotFoundError } from "@/services/errors/service-errors";
import type { Attempt, AttemptRef, LogStep, WorkspaceFile } from "@/services/types/domain/attempt-types";
import { attemptRefSchema, parseOrThrow } from "@/services/validation/ref-validation";

export type AttemptDetail = {
  attempt: Attempt;
  prompt: string | null;
  command: string | null;
  base: Attempt | null;
  basePrompt: string | null;
};

export type JournalKind = "READ" | "BASH" | "EDIT" | "TEST" | "FIX" | "DONE" | "ERR";

export type JournalEntry = { elapsedS: number | null; kind: JournalKind; title: string; detail: string };

export type CodeFile = WorkspaceFile & { added: number | null };

const TOOL_TARGET_KEYS = ["command", "file_path", "path", "pattern", "url", "description"];

function summarizeToolInput(input: unknown): string {
  if (input && typeof input === "object") {
    for (const key of TOOL_TARGET_KEYS) {
      const value = (input as Record<string, unknown>)[key];
      if (typeof value === "string") return value.split("\n")[0].slice(0, 160);
    }
  }
  return JSON.stringify(input ?? "").slice(0, 160);
}

/** `/bin/zsh -lc 'cd x && y'` → `cd x && y`: Codex wraps every command in a login shell. */
const unwrapShell = (command: string) => command.match(/^\S*\/(?:ba|z)?sh -lc (['"])([\s\S]*)\1$/)?.[2] ?? command;

/** Turn an agent transcript into readable steps: Claude Code stream-json or `codex exec --json`. Unknown lines are skipped. */
export function parseAgentLog(log: string): LogStep[] {
  const steps: LogStep[] = [];
  let lastMessage = "";
  for (const line of log.split("\n")) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    const at = typeof event.timestamp === "string" ? event.timestamp : null;
    if (event.type === "assistant") {
      const content = (event.message as { content?: unknown[] } | undefined)?.content ?? [];
      for (const block of content as Record<string, unknown>[]) {
        if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
          steps.push({ kind: "text", text: block.text.trim(), at });
        }
        if (block.type === "tool_use") {
          steps.push({ kind: "tool", name: String(block.name), summary: summarizeToolInput(block.input), at });
        }
      }
    }
    if (event.type === "item.completed") {
      const item = (event.item ?? {}) as Record<string, unknown>;
      if (item.type === "agent_message" && typeof item.text === "string" && item.text.trim()) {
        lastMessage = item.text.trim();
        steps.push({ kind: "text", text: lastMessage, at });
      }
      if (item.type === "command_execution" && typeof item.command === "string") {
        steps.push({ kind: "tool", name: "Bash", summary: unwrapShell(item.command).split("\n")[0].slice(0, 160), at });
      }
      if (item.type === "file_change" && Array.isArray(item.changes)) {
        const changes = item.changes as { path?: string; kind?: string }[];
        const summary = changes.map((change) => change.path ?? "").join(", ").slice(0, 160);
        steps.push({ kind: "tool", name: changes.every((change) => change.kind === "add") ? "Write" : "Edit", summary, at });
      }
    }
    if (event.type === "turn.completed") steps.push({ kind: "result", text: lastMessage, costUsd: null, durationMs: null });
    if (event.type === "result") {
      steps.push({
        kind: "result",
        text: typeof event.result === "string" ? event.result : "",
        costUsd: typeof event.total_cost_usd === "number" ? event.total_cost_usd : null,
        durationMs: typeof event.duration_ms === "number" ? event.duration_ms : null,
      });
    }
  }
  return steps;
}

const TEST_COMMAND = /(^|&&|;)\s*((pnpm|npm|yarn|npx)\s+(run\s+)?)?(test|vitest|jest|pytest)\b|node --test/;
const TOOL_KINDS: Record<string, { kind: JournalKind; label: string }> = {
  Read: { kind: "READ", label: "Lecture" },
  Glob: { kind: "READ", label: "Recherche de fichiers" },
  Grep: { kind: "READ", label: "Recherche dans le code" },
  WebFetch: { kind: "READ", label: "Lecture d'une page" },
  Write: { kind: "EDIT", label: "Écriture" },
  Edit: { kind: "EDIT", label: "Modification" },
  MultiEdit: { kind: "EDIT", label: "Modification" },
  NotebookEdit: { kind: "EDIT", label: "Modification" },
  Bash: { kind: "BASH", label: "Commande" },
};

/** Tool targets relative to the agent's workspace: drop the leading `cd <workspace> &&` and the temp workspace prefix. */
export function tidyDetail(detail: string): string {
  return detail
    .replace(/^cd\s+\S+\s*(&&|;)\s*/, "")
    .replace(/\S*\/model-bench\/[^/\s]+\/?/g, "")
    .trim();
}

const firstSentence = (text: string) => text.split(/(?<=[.!?:])\s|\n/)[0].replace(/[*`#]/g, "").trim().slice(0, 90);

/** Journal of the agent's work: one entry per tool call, titled by what the agent said just before, plus the outcome. */
export function buildJournal(steps: LogStep[], status: Attempt["status"]): JournalEntry[] {
  const first = steps.flatMap((step) => (step.kind !== "result" && step.at ? [step.at] : []))[0];
  const elapsed = (at: string | null) => (first && at ? Math.max(0, (Date.parse(at) - Date.parse(first)) / 1000) : null);
  const entries: JournalEntry[] = [];
  let intent: string | null = null;
  for (const step of steps) {
    if (step.kind === "text") intent = firstSentence(step.text);
    if (step.kind === "tool") {
      if (step.name === "TodoWrite") continue;
      const known = TOOL_KINDS[step.name] ?? { kind: "BASH" as JournalKind, label: step.name };
      const detail = tidyDetail(step.summary);
      const kind = step.name === "Bash" && TEST_COMMAND.test(detail) ? "TEST" : known.kind;
      entries.push({ elapsedS: elapsed(step.at), kind, title: intent ?? (kind === "TEST" ? "Tests" : known.label), detail: detail || step.summary });
      intent = null;
    }
    if (step.kind === "result") {
      entries.push({
        elapsedS: step.durationMs !== null ? step.durationMs / 1000 : null,
        kind: status === "ok" ? "DONE" : "ERR",
        title: status === "ok" ? "Livraison" : "Échec",
        detail: firstSentence(step.text),
      });
    }
  }
  return entries;
}

async function requireAttempt(ref: AttemptRef): Promise<Attempt> {
  const attempt = await getAttemptDao(ref);
  if (!attempt) throw new NotFoundError(`Attempt ${ref.model}/${ref.run}/${ref.test}/attempt-${ref.number} not found`);
  return attempt;
}

export async function getAttemptService(input: AttemptRef): Promise<AttemptDetail> {
  const ref = parseOrThrow(attemptRefSchema, input);
  const attempt = await requireAttempt(ref);
  const baseRef = attempt.basedOn ? { ...ref, number: attempt.basedOn } : null;
  return {
    attempt,
    prompt: await readAttemptFileDao(ref, "PROMPT.md"),
    command: await readAttemptFileDao(ref, "command.txt"),
    base: baseRef ? await getAttemptDao(baseRef) : null,
    basePrompt: baseRef ? await readAttemptFileDao(baseRef, "PROMPT.md") : null,
  };
}

export async function getAttemptLogService(input: AttemptRef): Promise<LogStep[]> {
  const ref = parseOrThrow(attemptRefSchema, input);
  await requireAttempt(ref);
  return parseAgentLog((await readAttemptFileDao(ref, "output.log")) ?? "");
}

export async function getJournalService(input: AttemptRef): Promise<JournalEntry[]> {
  const ref = parseOrThrow(attemptRefSchema, input);
  const attempt = await requireAttempt(ref);
  return buildJournal(parseAgentLog((await readAttemptFileDao(ref, "output.log")) ?? ""), attempt.status);
}

export async function listAttemptFilesService(input: AttemptRef): Promise<WorkspaceFile[]> {
  const ref = parseOrThrow(attemptRefSchema, input);
  await requireAttempt(ref);
  return listWorkspaceDao(ref);
}

/** Workspace files; for an iteration, the lines each file gained over the base attempt (null when unchanged). */
export async function listCodeFilesService(input: AttemptRef): Promise<CodeFile[]> {
  const ref = parseOrThrow(attemptRefSchema, input);
  const attempt = await requireAttempt(ref);
  const files = await listWorkspaceDao(ref);
  if (!attempt.basedOn) return files.map((file) => ({ ...file, added: null }));
  const baseRef = { ...ref, number: attempt.basedOn };
  return Promise.all(
    files.map(async (file) => {
      const [current, base] = await Promise.all([readWorkspaceFileDao(ref, file.path), readWorkspaceFileDao(baseRef, file.path)]);
      if (current === null || current === base) return { ...file, added: null };
      const before = new Set((base ?? "").split("\n"));
      const added = current.split("\n").filter((line) => !before.has(line)).length;
      return { ...file, added: added || null };
    }),
  );
}

export async function getAttemptFileService(input: AttemptRef & { path: string }): Promise<string> {
  const ref = parseOrThrow(attemptRefSchema, input);
  const content = await readWorkspaceFileDao(ref, input.path);
  if (content === null) throw new NotFoundError(`File ${input.path} not readable`);
  return content;
}

export async function getCaptureService(input: AttemptRef): Promise<Buffer> {
  const ref = parseOrThrow(attemptRefSchema, input);
  const capture = await readCaptureDao(ref);
  if (!capture) throw new NotFoundError("No capture for this attempt");
  return capture;
}
