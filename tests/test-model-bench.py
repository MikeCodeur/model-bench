#!/usr/bin/env python3

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


validator = load_module("validate_suite", ROOT / "scripts" / "validate-suite.py")
preparer = load_module("prepare_run", ROOT / "scripts" / "prepare-run.py")


class ModelBenchTests(unittest.TestCase):
    def test_catalog_is_valid(self):
        result = validator.validate()
        self.assertEqual(sum(result["categories"].values()), result["count"])

    def test_every_ui_project_has_controls(self):
        data = preparer.load_catalog()
        for bench in data["benchmarks"]:
            if bench["capture"] != "none":
                self.assertGreaterEqual(len(bench.get("controls", [])), 3, bench["id"])

    def test_prepare_two_selected_benchmarks(self):
        data = preparer.load_catalog()
        selected = preparer.select_benchmarks(
            data,
            category=None,
            ids="3d-06-black-hole-lensing,web-01-ai-saas-landing",
        )
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "run"
            preparer.prepare(output, "provider/model", selected, data, force=False)
            run = json.loads((output / "run.json").read_text(encoding="utf-8"))
            self.assertEqual(run["benchmark_count"], 2)
            for bench in selected:
                workspace = output / bench["id"]
                self.assertTrue((workspace / "PROMPT.md").is_file())
                self.assertTrue((workspace / "benchmark.json").is_file())

    def test_unknown_id_is_rejected(self):
        data = preparer.load_catalog()
        with self.assertRaises(SystemExit):
            preparer.select_benchmarks(data, None, "does-not-exist")


if __name__ == "__main__":
    unittest.main()
