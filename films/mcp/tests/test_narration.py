"""缓存命中不产生 API 请求，重处理与对齐失效按内容判断。"""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import align
import project
import tts


class NarrationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        root_patch = patch.object(project, 'ROOT', self.root)
        root_patch.start()
        self.addCleanup(root_patch.stop)
        config = json.loads((ROOT / 'film.json').read_text())
        self.project = project.Project('E', config)
        self.line = {'id': 'one', 'text': '一句关于能力接口的旁白。', 'gap': 0.3}
        (self.root / 'script.json').write_text(json.dumps({'acts': [{'lines': [self.line]}]}))
        (self.project.output / 'vo').mkdir(parents=True)
        self.wav = self.project.output / 'vo/one.wav'
        self.mp3 = self.wav.with_suffix('.mp3')
        self.wav.write_bytes(b'approved processed audio')
        self.mp3.write_bytes(b'approved raw audio')
        self.entry = {
            'text': self.line['text'], 'duration': 3, 'hash': project.synthesis_hash(self.line['text'], self.project),
            '_contextHash': tts.context_hash('', ''), '_processingHash': tts.processing_hash(config['narration']),
            '_processedAudioHash': hashlib.sha256(self.wav.read_bytes()).hexdigest(),
        }
        self.save_manifest()

    def save_manifest(self):
        project.write_json(self.project.timing / 'manifest.json', {'one': self.entry})

    def test_unchanged_narration_needs_no_synthesis_or_processing(self):
        with patch.object(tts, 'synthesize') as synthesis, patch.object(tts, 'trim') as processing:
            tts.main(self.project)
        synthesis.assert_not_called()
        processing.assert_not_called()
        self.assertEqual(self.wav.read_bytes(), b'approved processed audio')

    def test_new_pace_reprocesses_cached_raw_audio_without_api(self):
        self.project.config['narration']['paceTarget'] = 5.1

        def trim(raw, target):
            target.write_bytes(b'reprocessed audio')

        with patch.object(tts, 'synthesize') as synthesis, patch.object(tts, 'trim', side_effect=trim), \
                patch.object(tts, 'duration', return_value=3), patch.object(tts, 'tempo_for', return_value=1):
            tts.main(self.project)
        synthesis.assert_not_called()
        self.assertEqual(self.wav.read_bytes(), b'reprocessed audio')

    def test_failed_synthesis_preserves_approved_audio_and_manifest(self):
        manifest = (self.project.timing / 'manifest.json').read_bytes()
        with patch.object(tts, 'synthesize', side_effect=RuntimeError('API unavailable')):
            with self.assertRaises(RuntimeError):
                tts.main(self.project, force=True)
        self.assertEqual(self.wav.read_bytes(), b'approved processed audio')
        self.assertEqual((self.project.timing / 'manifest.json').read_bytes(), manifest)

    def test_alignment_cache_uses_audio_content_rather_than_mtime(self):
        target = self.project.timing / 'align/one.json'
        project.write_json(target, {
            'characters': [{'text': self.line['text'], 'start': 0, 'end': 3}],
            '_sourceHash': project.source_hash(self.wav, self.line['text']),
        })
        with patch.object(align.subprocess, 'run') as request:
            align.main(self.project)
        request.assert_not_called()
        self.wav.write_bytes(b'new audio with same path')
        with patch.object(align.subprocess, 'run', side_effect=RuntimeError('API unavailable')) as request:
            with self.assertRaises(RuntimeError):
                align.main(self.project)
        request.assert_called_once()

    def test_mix_cannot_be_rendered_after_narration_changes(self):
        (self.root / 'audio.py').write_text('audio source')
        self.project.timeline.write_text(json.dumps({'lines': {'one': {}}}))
        mix = self.project.film / 'assets/mix.wav'
        mix.parent.mkdir(parents=True)
        mix.write_bytes(b'mix')
        project.write_json(self.project.output / 'mix.json', {
            'sourceHash': project.mix_fingerprint(self.project),
            'audioHash': hashlib.sha256(mix.read_bytes()).hexdigest(),
        })
        project.verify_mix(self.project)
        self.wav.write_bytes(b'changed voice')
        with self.assertRaises(ValueError):
            project.verify_mix(self.project)


if __name__ == '__main__':
    unittest.main()
