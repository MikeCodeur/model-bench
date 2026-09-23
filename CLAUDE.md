# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
python3 tests/test-model-bench.py                                          # all tests
python3 tests/test-model-bench.py ModelBenchTests.test_unknown_id_is_rejected   # single test
python3 scripts/validate-suite.py                                          # validate catalog
```

`python3 -m unittest discover` finds nothing: test files are kebab-case (`test-*.py`), so run the file directly.

## Architecture

- `benchmarks.json` holds everything: `common_contract` (deliverables, viewports, required metrics, scoring) plus the `benchmarks` list. `prepare-run.py` renders `PROMPT.md` from a benchmark + `common_contract`, so a contract change alters every prompt.
- Scripts have kebab-case filenames and are not importable as modules; tests load them with `importlib` (`load_module` in the test file).
- `validate-suite.py` hardcodes the suite shape: exactly 40 benchmarks, `EXPECTED_COUNTS` per category, and allowed values for `difficulty`, `provenance`, `capture`. Adding, removing or recategorizing a benchmark requires updating `EXPECTED_COUNTS` and the 40-count assertion in the test.
- `video-reconstructed` benchmarks require `video_timestamp`; every benchmark needs at least 3 `acceptance` criteria.

## Target design (not implemented yet)

`docs/PRD.md` is the product spec. Key decisions to respect when building the runner:

- Model-agnostic: the runner knows no provider. Each model is an entry in `models.json` with a shell `command` containing `{prompt}` and an optional `price` (USD per million tokens). No provider-specific code in the core.
- Concepts: Suite, Test, Model, Run, Attempt. A retry creates a new `attempt-N` in the same run and never overwrites.
- Storage is JSON only (`attempt.json` per attempt, `run.json` per run); unknown values are `null`, never `0`. No SQLite in v1.
- Results live outside the repo so agents running without permissions cannot read other models' outputs. After each attempt, delete `node_modules`, `.next`, `dist` and caches but keep source and lockfile so the project can be replayed.
- Keep v1 minimal; captures, delivery gate, scoring, remote storage and SQLite are listed extensions, not v1 scope.
