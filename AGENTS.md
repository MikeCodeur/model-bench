# Repository Guidelines

Benchmark suite used to test new AI models on visible, runnable projects (3D, frontend, simulations, games, agentic code) for YouTube videos. Product spec: `docs/PRD.md`.

## Structure

- `benchmarks.json`: single source of truth. `common_contract` (deliverables, viewports, required metrics, scoring) + the `benchmarks` list. `prepare-run.py` renders each `PROMPT.md` from a benchmark and `common_contract`, so a contract change alters every prompt.
- `scripts/validate-suite.py`: validates the catalog. It hardcodes the suite shape: exactly 40 benchmarks, `EXPECTED_COUNTS` per category, allowed `difficulty` / `provenance` / `capture` values, at least 3 `acceptance` criteria, `video_timestamp` required for `video-reconstructed`. Adding, removing or recategorizing a benchmark means updating `EXPECTED_COUNTS` and the 40-count test.
- `scripts/prepare-run.py`: selects benchmarks (`--category`, `--ids`) and writes one workspace per benchmark (`PROMPT.md`, `benchmark.json`) plus `run.json`. Refuses a non-empty output dir without `--force`.
- `scripts/bench.py` (wrapper `./bench`): the runner. `run` executes benchmarks on a model declared in `models.json` with the guards of `bench.config.json`; `open` starts a result (`--check` only verifies it starts and records `start` in `attempt.json`).
- `models.json`: one entry per model, a shell `command` with `{prompt}`. Optional `model_id`, `version_command`, `parser` (`claude-stream-json`), `billing` (`subscription` disables the dollar budget). Commands must isolate the CLI from the user's personal config (instructions, skills, hooks, MCP).
- `common_contract.launch` in `benchmarks.json`: every project starts either as a static `index.html` or with `pnpm install && pnpm start` on `PORT`. `bench open` relies on it.
- `skills/model-bench/SKILL.md`: agent workflow for a run (also exposed to Claude Code via `.claude/skills/`).

## Commands

No build step, no third-party dependencies (Python stdlib only).

```bash
python3 scripts/validate-suite.py
python3 tests/test-model-bench.py                                              # all tests
python3 tests/test-model-bench.py ModelBenchTests.test_unknown_id_is_rejected  # one test
./bench run --model opus-5-5 --ids 3d-06,web-01           # asks for confirmation, --yes to skip
./bench run --model opus-5-5 --run 2026-09-23-a --ids 3d-06   # retry = new attempt
./bench open opus-5-5/2026-09-23-a/3d-06                  # start one result in the browser
./bench open opus-5-5/2026-09-23-a --check                # check every test of a run starts
python3 tests/test-bench.py
python3 scripts/prepare-run.py --list
python3 scripts/prepare-run.py --model provider/model --ids 3d-06-black-hole-lensing --output /tmp/model-bench-smoke
```

`python3 -m unittest discover` finds nothing: test files are kebab-case, so run the file directly. Scripts are loaded in tests through `importlib` for the same reason.

Run validation and tests after every catalog edit.

## Run outputs

Never write run outputs inside the repository.

- Work dir (while a model runs): temporary and empty, `$TMPDIR/model-bench/<random-id>/`, deleted afterwards. The model never runs inside the repo or the results dir, so it cannot read the catalog or other models' outputs.
- Results: `~/model-bench-data/<model>/<run>/<test>/attempt-<n>/` (overridable with `MODEL_BENCH_DATA`), containing `PROMPT.md`, `command.txt`, `attempt.json`, `output.log` and `workspace/` (source + lockfile, without `node_modules`, `.next`, `dist` or caches).
- A retry creates `attempt-<n+1>`; never overwrite an attempt.

## Runner principles

See `docs/PRD.md`. The runner is model-agnostic: each model is an entry in `models.json` with a shell `command` containing `{prompt}` and an optional `price`. No provider-specific code in the core. Storage is JSON only; unknown metrics are `null`, never `0`. Keep v1 minimal: captures, automatic delivery gate, scoring and SQLite are later extensions. Never make the agent run inside the repo or the results dir.

## Conventions

- Benchmark IDs are stable, unique, lowercase and category-prefixed (`3d-06-black-hole-lensing`).
- Never rewrite prompts per model or normalize model identifiers.
- JSON output in UTF-8 with a trailing newline.
- Script files kebab-case, tests `test-*.py`, Python code `snake_case` with `pathlib`.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
