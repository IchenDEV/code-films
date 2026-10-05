"""确认归档版本可独立重建，缺失输入时不会覆盖现有画面。"""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.project = Path(self.temporary.name)
        for name in ('src', 'timing'):
            shutil.copytree(ROOT / name, self.project / name)
        for name in ('script.json', 'build_timeline.py'):
            shutil.copy2(ROOT / name, self.project / name)
        (self.project / 'film').mkdir()
        self.output = self.project / 'film/index.html'

    def build(self):
        return subprocess.run(
            ['python3', 'build_timeline.py'], cwd=self.project,
            capture_output=True, text=True,
        )

    def test_rebuild_without_audio_or_api_preserves_approved_picture(self):
        result = self.build()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), (ROOT / 'film/index.html').read_bytes())
        timeline = json.loads((self.project / 'timeline.json').read_text())
        self.assertEqual(timeline, json.loads((ROOT / 'timeline.json').read_text()))
        self.assertGreater(timeline['dur'], 0)
        self.assertGreaterEqual(timeline['dur'] - timeline['lines']['z5']['end'], 2)
        for subtitle in timeline['subs']:
            self.assertLess(subtitle['t0'], subtitle['t1'])
            self.assertLessEqual(subtitle['t1'], timeline['dur'])

    def test_missing_alignment_does_not_overwrite_existing_picture(self):
        self.output.write_text('existing picture')
        (self.project / 'timing/align/h1.json').unlink()
        result = self.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.output.read_text(), 'existing picture')

    def test_malformed_alignment_does_not_overwrite_existing_picture(self):
        self.output.write_text('existing picture')
        (self.project / 'timing/align/h1.json').write_text('{}')
        result = self.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.output.read_text(), 'existing picture')


class DispatchTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.repo = Path(self.temporary.name)
        shutil.copy2(ROOT.parents[1] / 'run.sh', self.repo / 'run.sh')

    def test_film_specific_command_receives_step_and_arguments(self):
        film = self.repo / 'films/custom'
        film.mkdir(parents=True)
        entry = film / 'run.sh'
        entry.write_text('#!/bin/bash\nprintf "%s\\n" "$PWD" "$@"\n')
        entry.chmod(0o755)
        result = subprocess.run(
            ['bash', str(self.repo / 'run.sh'), 'custom', 'stills', 'zh', '--at', '42,90'],
            cwd='/tmp', capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.splitlines(), [str(film), 'stills', 'zh', '--at', '42,90'])

    def test_canvas_film_keeps_shared_pipeline(self):
        film = self.repo / 'films/canvas'
        film.mkdir(parents=True)
        (film / 'film.json').write_text('{"languages":["zh"]}')
        engine = self.repo / 'engine/pipeline'
        engine.mkdir(parents=True)
        (engine / 'build_timeline.mjs').write_text('console.log("legacy timeline: " + process.cwd());')
        result = subprocess.run(
            ['bash', str(self.repo / 'run.sh'), 'canvas', 'timeline'],
            cwd='/tmp', capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f'legacy timeline: {film}', result.stdout)


if __name__ == '__main__':
    unittest.main()
