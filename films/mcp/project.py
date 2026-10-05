"""影片配置和版本路径；每个配音版本独立保存声音、对齐和渲染产物。"""
import argparse
from dataclasses import dataclass
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Project:
    variant: str
    config: dict

    @property
    def voice(self):
        return self.config['variants'][self.variant]

    @property
    def timing(self):
        return ROOT / 'timing' / self.variant

    @property
    def output(self):
        return ROOT / 'out' / self.variant

    @property
    def film(self):
        return ROOT / 'film' / self.variant

    @property
    def timeline(self):
        return ROOT / f'timeline_{self.variant}.json'


def arguments(description, argv=None):
    config = json.loads((ROOT / 'film.json').read_text())
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('variant', nargs='?', choices=config['variants'], default=config['defaultVariant'])
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args(argv)
    return Project(args.variant, config), args


def read_script():
    return json.loads((ROOT / 'script.json').read_text())


def synthesis_hash(text, project):
    narration = project.config['narration']
    values = [text, project.voice['voice'], narration['model'], narration['settings']]
    return hashlib.sha1(json.dumps(values).encode()).hexdigest()[:12]


def source_hash(audio, text):
    return hashlib.sha256(audio.read_bytes() + text.encode()).hexdigest()


def mix_fingerprint(project):
    digest = hashlib.sha256((ROOT / 'audio.py').read_bytes() + project.timeline.read_bytes())
    timeline = json.loads(project.timeline.read_text())
    for lid in timeline['lines']:
        digest.update((project.output / f'vo/{lid}.wav').read_bytes())
    return digest.hexdigest()


def verify_mix(project):
    metadata = project.output / 'mix.json'
    mix = project.film / 'assets/mix.wav'
    if not metadata.exists() or not mix.exists():
        raise ValueError('缺少混音，请先运行 audio')
    cached = json.loads(metadata.read_text())
    if (
        cached['sourceHash'] != mix_fingerprint(project)
        or cached['audioHash'] != hashlib.sha256(mix.read_bytes()).hexdigest()
    ):
        raise ValueError('混音与当前画面或声音不符，请先运行 audio')


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n')
    temporary.replace(path)


if __name__ == '__main__':
    project, args = arguments('检查当前版本的混音是否可以渲染')
    verify_mix(project)
