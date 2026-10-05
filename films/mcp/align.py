"""逐字对齐各版本的处理后旁白，按音频和文本的内容缓存。"""
import json
import subprocess
from project import arguments, read_script, source_hash, write_json


def main(project, force=False):
    for act in read_script()['acts']:
        for line in act['lines']:
            audio = project.output / f'vo/{line["id"]}.wav'
            target = project.timing / f'align/{line["id"]}.json'
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
            write_json(target, data)
            print(project.variant, 'aligned', line['id'])


if __name__ == '__main__':
    project, args = arguments(__doc__)
    main(project, args.force)
