#!/usr/bin/env python3
"""Materialize isolated prompt workspaces for one model-bench run."""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "benchmarks.json"


def load_catalog() -> dict:
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def select_benchmarks(data: dict, category: str | None, ids: str | None) -> list[dict]:
    benches = data["benchmarks"]
    if category:
        benches = [bench for bench in benches if bench["category"] == category]
    if ids:
        requested = [item.strip() for item in ids.split(",") if item.strip()]
        lookup = {bench["id"]: bench for bench in benches}
        missing = [bench_id for bench_id in requested if bench_id not in lookup]
        if missing:
            raise SystemExit(f"Unknown or filtered benchmark ids: {', '.join(missing)}")
        benches = [lookup[bench_id] for bench_id in requested]
    return benches


def render_prompt(bench: dict, contract: dict, model: str) -> str:
    criteria = "\n".join(f"- [ ] {item}" for item in bench["acceptance"])
    deliverables = "\n".join(f"- {item}" for item in contract["deliverables"])
    return f"""# {bench['title']}

Model route: `{model}`
Benchmark ID: `{bench['id']}`
Difficulty: `{bench['difficulty']}`

## Mission

{bench['brief']}

## Contrat commun

- Travaille uniquement dans ce workspace isolé.
- N'utilise aucun service réseau au runtime du rendu.
- Termine le projet et exécute les tests ou auto-checks pertinents avant de conclure.
- N'invente pas un résultat de test. Conserve les erreurs dans les logs.

## Livrables

{deliverables}

## Critères d'acceptation

{criteria}

## Capture attendue

`{bench['capture']}`
"""


def prepare(output: Path, model: str, benches: list[dict], data: dict, force: bool) -> None:
    if output.exists() and any(output.iterdir()):
        if not force:
            raise SystemExit(f"Output directory is not empty: {output}. Use --force to replace it.")
        shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True)

    run = {
        "suite": data["suite"],
        "schema_version": data["schema_version"],
        "model": model,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "benchmark_count": len(benches),
        "benchmark_ids": [bench["id"] for bench in benches],
        "status": "prepared",
    }
    (output / "run.json").write_text(
        json.dumps(run, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    for bench in benches:
        workspace = output / bench["id"]
        workspace.mkdir()
        (workspace / "PROMPT.md").write_text(
            render_prompt(bench, data["common_contract"], model), encoding="utf-8"
        )
        metadata = {
            **bench,
            "model": model,
            "run_status": "pending",
            "metrics": {metric: None for metric in data["common_contract"]["required_metrics"]},
        }
        (workspace / "benchmark.json").write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", help="Exact provider model id or route")
    parser.add_argument("--output", type=Path, help="Run output directory")
    parser.add_argument("--category", help="Only materialize one exact category")
    parser.add_argument("--ids", help="Comma-separated benchmark ids")
    parser.add_argument("--force", action="store_true", help="Replace a non-empty output directory")
    parser.add_argument("--list", action="store_true", help="List benchmark ids and exit")
    args = parser.parse_args()

    data = load_catalog()
    benches = select_benchmarks(data, args.category, args.ids)

    if args.list:
        for bench in benches:
            print(f"{bench['id']}\t{bench['category']}\t{bench['difficulty']}\t{bench['title']}")
        return

    if not args.model or not args.output:
        parser.error("--model and --output are required unless --list is used")
    if not benches:
        raise SystemExit("No benchmark matched the selection")

    prepare(args.output, args.model, benches, data, args.force)
    print(f"Prepared {len(benches)} benchmarks for {args.model} in {args.output}")


if __name__ == "__main__":
    main()
