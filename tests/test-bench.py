#!/usr/bin/env python3

import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("bench", ROOT / "scripts" / "bench.py")
bench = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bench)


class BenchTests(unittest.TestCase):
    def test_prompt_stays_one_argument(self):
        prompt = "Line 1\nIt's \"quoted\" `code` $HOME"
        args = bench.build_args('agent -p --flag "" {prompt}', prompt)
        self.assertEqual(args, ["agent", "-p", "--flag", "", prompt])

    def test_resolve_short_ids(self):
        benches = [{"id": "3d-06-black-hole-lensing"}, {"id": "web-01-ai-saas-landing"}]
        self.assertEqual(bench.resolve_ids(benches, "3d-06, web-01"), "3d-06-black-hole-lensing,web-01-ai-saas-landing")

    def test_next_run_id_skips_existing(self):
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "2026-09-23-a").mkdir()
            self.assertEqual(bench.next_run_id(Path(tmp), "2026-09-23"), "2026-09-23-b")

    def test_hard_timeout_kills_agent(self):
        with tempfile.TemporaryDirectory() as tmp:
            work, log = Path(tmp), Path(tmp) / "out.log"
            exit_code, forced, duration = bench.execute(["sleep", "30"], work, log, timeout_s=1, idle_s=60)
            self.assertEqual(forced, "timeout")
            self.assertLess(duration, 10)

    def test_idle_timeout_kills_silent_agent(self):
        with tempfile.TemporaryDirectory() as tmp:
            work, log = Path(tmp) / "w", Path(tmp) / "out.log"
            work.mkdir()
            _, forced, _ = bench.execute(["sleep", "30"], work, log, timeout_s=60, idle_s=1)
            self.assertEqual(forced, "stalled")

    def test_successful_agent(self):
        with tempfile.TemporaryDirectory() as tmp:
            work, log = Path(tmp) / "w", Path(tmp) / "out.log"
            work.mkdir()
            exit_code, forced, _ = bench.execute(["sh", "-c", "echo hi > index.html"], work, log, 60, 60)
            self.assertEqual((exit_code, forced), (0, None))
            self.assertEqual(bench.final_status(exit_code, forced, log), "ok")
            self.assertTrue((work / "index.html").is_file())

    def test_delta_prompt_keeps_only_changes(self):
        base = "# T\n\n## Mission\n\nDo it\n\n## Contrat\n\nsame"
        full = "# T\n\n## Mission\n\nDo it\n\n## Contrat\n\nsame\n\n## Pilotage\n\n- speed"
        delta = bench.delta_prompt({"id": "x", "title": "T"}, base, full, "Rends le disque plus brillant")
        self.assertIn("## Pilotage", delta)
        self.assertIn("Rends le disque plus brillant", delta)
        self.assertNotIn("## Mission", delta)

    def test_delta_prompt_refuses_empty_change(self):
        with self.assertRaises(SystemExit):
            bench.delta_prompt({"id": "x", "title": "T"}, "# T\n\n## A\n\nx", "# T\n\n## A\n\nx", None)


if __name__ == "__main__":
    unittest.main()
