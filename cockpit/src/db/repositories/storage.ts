import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/env";

export const dataDir = () => env.MODEL_BENCH_DATA;
export const repoDir = () => env.BENCH_REPO;

export async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await fs.readFile(file, "utf-8"));
}

export async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf-8");
  } catch {
    return null;
  }
}

export async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith(".")).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

export async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(() => true, () => false);
}

/** Resolve a relative path inside a root, refusing anything that escapes it. */
export function safeJoin(root: string, relative: string): string | null {
  const resolved = path.resolve(root, relative);
  return resolved === root || resolved.startsWith(root + path.sep) ? resolved : null;
}
