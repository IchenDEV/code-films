"""将修剪、调速后的旁白逐字对齐；音频与文本未变时使用已保存的结果。"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys


def source_hash(audio, text):
    return hashlib.sha256(audio.read_bytes() + text.encode()).hexdigest()


def main(force=False):
    script = json.loads(Path('script.json').read_text())
    directory = Path('timing/align')
    directory.mkdir(parents=True, exist_ok=True)
    for act in script['acts']:
        for line in act['lines']:
            audio = Path(f'out/vo/{line["id"]}.wav')
            target = directory / f'{line["id"]}.json'
            fingerprint = source_hash(audio, line['text'])
            if not force and target.exists():
                cached = json.loads(target.read_text())
                if cached.get('_sourceHash') == fingerprint:
                    continue
            result = subprocess.run([
                'elevenlabs', 'forced-alignment', 'create',
                '--file', str(audio), '--text', line['text'], '--format', 'json',
            ], check=True, capture_output=True, text=True)
            data = json.loads(result.stdout)
            if not data.get('characters'):
                raise ValueError(f'{line["id"]}: 对齐结果缺少逐字时间')
            data['_sourceHash'] = fingerprint
            temporary = target.with_suffix('.tmp')
            temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2))
            temporary.replace(target)
            print('aligned', line['id'])


if __name__ == '__main__':
    main('--force' in sys.argv)
