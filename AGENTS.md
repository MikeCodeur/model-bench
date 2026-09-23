# Repository Guidelines

## Project Structure & Module Organization

- `benchmarks.json` is the source of truth for the 40 benchmark definitions, shared contract, categories, and required metrics.
- `scripts/validate-suite.py` validates catalog shape, allowed values, unique IDs, and category counts.
- `scripts/prepare-run.py` selects benchmarks and creates isolated run workspaces containing `PROMPT.md`, `benchmark.json`, and `run.json`.
- `tests/test-model-bench.py` contains the standard-library test suite.
- `skills/model-bench/SKILL.md` documents the intended agent workflow; `docs/PRD.md` records product scope.

Keep generated run directories outside the repository (for example, under `/tmp`) unless fixtures are deliberately being added.

## Build, Test, and Development Commands

This project has no build step or third-party runtime dependencies. Use Python 3.10 or newer.

```bash
python3 scripts/validate-suite.py
python3 tests/test-model-bench.py
python3 scripts/prepare-run.py --list
python3 scripts/prepare-run.py --model provider/model --output /tmp/model-bench-run
```

Run validation after every catalog edit. The preparation command creates a complete run; add `--category frontend` or `--ids id-one,id-two` for a focused run. It will not replace a non-empty destination unless `--force` is supplied.

## Coding Style & Naming Conventions

Follow PEP 8 with four-space indentation, type hints for public function signatures, `pathlib.Path` for paths, and standard-library modules when practical. Use `snake_case` for Python functions and variables. Script filenames use kebab-case, while test files follow `test-*.py`. Benchmark IDs must remain stable, unique, lowercase, and category-prefixed, such as `3d-06-black-hole-lensing`.

Preserve UTF-8 JSON output and trailing newlines. Do not silently rewrite prompts or normalize model identifiers.

## Testing Guidelines

Tests use `unittest`. Add focused tests for validation rules, selection errors, and generated workspace contents. Use temporary directories for filesystem tests and avoid network access. No coverage threshold is configured; changes should cover both the successful path and relevant rejection cases.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit-style subjects, notably `feat: ...`. Continue with concise imperative subjects such as `fix: reject duplicate benchmark ids` or `docs: clarify run protocol`.

Pull requests should explain the motivation, list affected benchmark IDs or scripts, and include the validation and test commands run. Link relevant issues. For changes that alter generated prompts or reports, include a small representative before/after excerpt; screenshots are only needed for visual output changes.
