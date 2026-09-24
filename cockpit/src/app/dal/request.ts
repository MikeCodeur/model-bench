import "server-only";
import { connection } from "next/server";
import { cache } from "react";

/** Data changes while runs execute: every DAL read waits for a real request instead of being prerendered at build time. */
export function requestDal<Args extends unknown[], Result>(read: (...args: Args) => Promise<Result>) {
  return cache(async (...args: Args) => {
    await connection();
    return read(...args);
  });
}
