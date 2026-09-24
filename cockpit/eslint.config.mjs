import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Presentation reads through app/dal and writes through actions: never the storage or infrastructure.
    files: ["src/app/**", "src/components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/db/*", "@/db/**"], message: "Presentation must go through app/dal (reads) or actions (writes)." },
            { group: ["@/lib/bench-cli", "@/lib/demo-process"], message: "Infrastructure is only reachable from services." },
          ],
        },
      ],
    },
  },
  {
    // Services hold the business rules and must stay framework-free.
    files: ["src/services/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["next", "next/*", "react", "react/*"], message: "Services must not depend on Next.js or React." },
            { group: ["@/app/*", "@/app/**", "@/components/*", "@/components/**"], message: "Services must not import presentation." },
          ],
        },
      ],
    },
  },
  {
    // process.env is read in one place only.
    files: ["src/**"],
    ignores: ["src/env.ts"],
    rules: {
      "no-restricted-properties": ["warn", { object: "process", property: "env", message: "Use @/env instead." }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
