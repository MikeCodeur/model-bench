<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cockpit architecture

Chain: page → `app/dal/xxxDal` (reads) or colocated `actions.ts` `xxxAction` (writes) → `services/xxx-service.ts` → `db/repositories/xxx-repository.ts` (`xxxDao`) → files.

- `app/` and `components/` never import `@/db/*` or `@/lib/bench-cli` / `@/lib/demo-process` (ESLint `no-restricted-imports`).
- Every DAL read goes through `requestDal` (`app/dal/request.ts`), which calls `connection()`, so pages are never prerendered with stale run data.
- Server actions and route handlers stay minimal: validate with zod, call a service, revalidate or redirect.
- Business rules live in `services/`. Services validate their own inputs (`services/validation/`), import neither Next.js nor React, and throw `NotFoundError` / `ValidationError`.
- Domain types in `services/types/domain/` are independent from the storage format. Repositories map the snake_case JSON written by the Python runner to them. Switching persistence means rewriting `db/repositories/` only.
- `process.env` is read in `src/env.ts` only.
- Design: pixel port of `docs/cockpit/design/Cockpit.dc.html`. Tokens copied verbatim into `src/app/globals.css`, dark by default via `next-themes` (`data-theme`), Tailwind without preflight. Screens keep the mockup's inline style strings through `css()` / `sx()` (`components/ck/style.ts`), which rename the mockup variables to the design-system tokens; hovers use `sx(base, hover)`. Compare a screen with the mockup at 1440 px, dark and light, before calling it done.
- The score does not exist yet: screens show the three checks we can verify (finished, starts, own tests) via `checksOf`.
- Actions start the Python CLI (`lib/bench-cli.ts`): launch, rerun, retry, iterate (`--delta`), stop. Demos run through `bench start` (`lib/demo-process.ts`) and show in an iframe over the attempt's capture. Votes and job logs live in `$MODEL_BENCH_DATA/.cockpit/`.

Commands: `pnpm dev -p 3333`, `pnpm test` (Vitest on `test/fixtures/`), `pnpm lint`, `pnpm typecheck`, `pnpm build`.
