"""逐版本离线重建、故障输入与版本隔离的契约。"""
import json
from pathlib import Path
import re
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
        for name in ('src', 'timing', 'film'):
            shutil.copytree(ROOT / name, self.project / name, ignore=shutil.ignore_patterns('mix.wav', '.hyperframes*'))
        for name in ('script.json', 'film.json', 'project.py', 'build_timeline.py', 'timeline_E.json', 'timeline_F.json'):
            shutil.copy2(ROOT / name, self.project / name)

    def build(self, variant='F'):
        return subprocess.run(
            ['python3', str(self.project / 'build_timeline.py'), variant],
            cwd='/tmp', capture_output=True, text=True,
        )

    def test_both_versions_rebuild_without_audio_or_api_preserving_approved_picture(self):
        for variant in ('E', 'F'):
            with self.subTest(variant=variant):
                expected = (self.project / f'film/{variant}/index.html').read_bytes()
                expected_timeline = json.loads((self.project / f'timeline_{variant}.json').read_text())
                (self.project / f'film/{variant}/index.html').unlink()
                result = self.build(variant)
                self.assertEqual(result.returncode, 0, result.stderr)
                rebuilt = (self.project / f'film/{variant}/index.html').read_bytes()
                picture = lambda html: re.sub(rb'      <audio\b[^>]*></audio>\n', b'', html)
                self.assertEqual(picture(rebuilt), picture(expected))
                self.assertNotIn(b'<audio', rebuilt)
                timeline = json.loads((self.project / f'timeline_{variant}.json').read_text())
                self.assertEqual(timeline, expected_timeline)
                self.assertGreater(timeline['dur'] - timeline['lines']['e3']['end'], 5)
                for subtitle in timeline['subs']:
                    self.assertLess(subtitle['t0'], subtitle['t1'])
                    self.assertLessEqual(subtitle['t1'], timeline['dur'])
                for cue in timeline['cues'].values():
                    self.assertTrue(0 <= cue <= timeline['dur'])
                for card in timeline['ecards']:
                    self.assertLess(card['t0'], card['land'])
                    self.assertLess(card['land'], card['land2'])

    def test_rebuilding_one_voice_leaves_other_voice_untouched(self):
        before = (self.project / 'film/F/index.html').read_bytes()
        timeline = (self.project / 'timeline_F.json').read_bytes()
        result = self.build('E')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.project / 'film/F/index.html').read_bytes(), before)
        self.assertEqual((self.project / 'timeline_F.json').read_bytes(), timeline)

    def assert_failed_build_preserves_outputs(self):
        picture = self.project / 'film/F/index.html'
        timeline = self.project / 'timeline_F.json'
        picture.write_text('existing picture')
        timeline.write_text('existing timeline')
        result = self.build()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(picture.read_text(), 'existing picture')
        self.assertEqual(timeline.read_text(), 'existing timeline')

    def test_missing_alignment_preserves_outputs(self):
        (self.project / 'timing/F/align/p1.json').unlink()
        self.assert_failed_build_preserves_outputs()

    def test_empty_alignment_preserves_outputs(self):
        (self.project / 'timing/F/align/p1.json').write_text('{"characters":[]}')
        self.assert_failed_build_preserves_outputs()

    def test_stale_alignment_preserves_outputs(self):
        path = self.project / 'timing/F/align/p1.json'
        data = json.loads(path.read_text())
        data['characters'][0]['text'] = '错'
        path.write_text(json.dumps(data))
        self.assert_failed_build_preserves_outputs()

    def test_negative_duration_preserves_outputs(self):
        path = self.project / 'timing/F/manifest.json'
        data = json.loads(path.read_text())
        data['p1']['duration'] = -1
        path.write_text(json.dumps(data))
        self.assert_failed_build_preserves_outputs()

    def test_changed_script_requires_new_narration(self):
        path = self.project / 'script.json'
        data = json.loads(path.read_text())
        data['acts'][1]['lines'][0]['text'] += '新句子。'
        path.write_text(json.dumps(data))
        self.assert_failed_build_preserves_outputs()

    def test_changed_audio_requires_new_alignment(self):
        audio = self.project / 'out/F/vo/p1.wav'
        audio.parent.mkdir(parents=True)
        audio.write_bytes(b'changed narration')
        self.assert_failed_build_preserves_outputs()


if __name__ == '__main__':
    unittest.main()
