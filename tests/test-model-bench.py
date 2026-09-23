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
    def test_catalog_has_exactly_40_valid_benchmarks(self):
        result = validator.validate()
        self.assertEqual(result["count"], 40)
        self.assertEqual(sum(result["categories"].values()), 40)

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
