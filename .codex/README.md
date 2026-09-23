# Project Codex Configuration

This directory is reserved for project-specific Codex configuration and automation.

Keep repository-wide contributor instructions in [`AGENTS.md`](../AGENTS.md). Add files here only when the benchmark runner needs project-local Codex behavior, such as a checked-in workflow, hook, or skill configuration.

Do not store credentials, API keys, generated runs, model outputs, or machine-specific settings in this directory. Prefer environment variables for secrets and the existing `runs/` or `results/` paths for generated artifacts.
