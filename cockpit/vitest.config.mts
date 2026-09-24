import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;
const fixtures = path.join(root, "test/fixtures");

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: { "server-only": path.join(root, "test/stubs/server-only.ts") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: { MODEL_BENCH_DATA: path.join(fixtures, "data"), BENCH_REPO: path.join(fixtures, "repo") },
  },
});
