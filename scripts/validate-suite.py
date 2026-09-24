#!/usr/bin/env python3
"""Validate the model-bench catalog using only the stdlib."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "benchmarks.json"
REQUIRED_FIELDS = {
    "id",
    "title",
    "category",
    "difficulty",
    "provenance",
    "brief",
    "acceptance",
    "capture",
}
ALLOWED_CATEGORIES = {"3d", "simulation-2d", "math-visual", "algorithm-visual", "frontend", "game", "agentic-code"}
ALLOWED_DIFFICULTIES = {"intermediate", "advanced"}
ALLOWED_PROVENANCE = {"video-reconstructed", "original", "external"}
ALLOWED_CAPTURE = {"none", "screenshot", "video", "both"}


def validate() -> dict:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    benches = data.get("benchmarks", [])
    errors: list[str] = []

    for key in ("presentation", "controls", "launch"):
        if not data.get("common_contract", {}).get(key):
            errors.append(f"common_contract.{key} is missing")

    ids = [bench.get("id") for bench in benches]
    duplicates = sorted(key for key, count in Counter(ids).items() if count > 1)
    if duplicates:
        errors.append(f"duplicate ids: {', '.join(duplicates)}")

    for index, bench in enumerate(benches, start=1):
        missing = sorted(REQUIRED_FIELDS - bench.keys())
        if missing:
            errors.append(f"benchmark #{index} missing: {', '.join(missing)}")
            continue
        if bench["difficulty"] not in ALLOWED_DIFFICULTIES:
            errors.append(f"{bench['id']}: invalid difficulty")
        if bench["provenance"] not in ALLOWED_PROVENANCE:
            errors.append(f"{bench['id']}: invalid provenance")
        if bench["capture"] not in ALLOWED_CAPTURE:
            errors.append(f"{bench['id']}: invalid capture")
        if bench["category"] not in ALLOWED_CATEGORIES:
            errors.append(f"{bench['id']}: invalid category")
        if bench["capture"] != "none" and len(bench.get("controls", [])) < 3:
            errors.append(f"{bench['id']}: a project with a UI needs at least 3 controls")
        if len(bench["acceptance"]) < 3:
            errors.append(f"{bench['id']}: fewer than 3 acceptance criteria")
        if bench["provenance"] == "external" and not (bench.get("source_url") and bench.get("license")):
            errors.append(f"{bench['id']}: external benchmark needs source_url and license")
        if bench["provenance"] == "video-reconstructed" and not bench.get("video_timestamp"):
            errors.append(f"{bench['id']}: video timestamp required")

    counts = Counter(bench.get("category") for bench in benches)

    if errors:
        raise SystemExit("\n".join(f"ERROR: {error}" for error in errors))

    return {
        "suite": data["suite"],
        "count": len(benches),
        "categories": dict(counts),
        "video_reconstructed": sum(
            bench["provenance"] == "video-reconstructed" for bench in benches
        ),
    }


if __name__ == "__main__":
    print(json.dumps(validate(), ensure_ascii=False, indent=2))
