"""逐句旁白：按内容缓存，保留上下句语境，修剪静音并保持音高调整语速。"""
import hashlib
import json
import re
import subprocess
import time
import numpy as np
from scipy.io import wavfile
from project import arguments, read_script, synthesis_hash, write_json

SR = 48000


def units(text):
    text = re.sub(r'[，。、：；！？“”《》—\s]', '', text)
    return len(re.sub(r'[A-Za-z]+', lambda match: '*' * min(2, len(match.group())), text))


def duration(path):
    result = subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path),
    ])
    return float(result)


def context_hash(previous, following):
    return hashlib.sha256(json.dumps([previous, following], ensure_ascii=False).encode()).hexdigest()


def processing_hash(narration):
    values = [SR, -42, 0.04, 0.2, narration['paceCap'], narration['paceTarget'], narration['maxSpeedup']]
    return hashlib.sha256(json.dumps(values).encode()).hexdigest()


def tempo_for(text, seconds, narration):
    rate = units(text) / seconds
    if rate < narration['paceTarget'] and len(text) > 6:
        return min(narration['maxSpeedup'], narration['paceTarget'] / rate)
    if rate > narration['paceCap']:
        return max(0.86, narration['paceCap'] / rate)
    return 1.0


def trim(mp3, target):
    result = subprocess.run([
        'ffmpeg', '-loglevel', 'error', '-i', str(mp3), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-',
    ], check=True, capture_output=True)
    samples = np.frombuffer(result.stdout, np.int16).astype(float) / 32768
    if len(samples) < 480:
        raise ValueError('合成音频过短')
    envelope = np.sqrt(np.convolve(samples ** 2, np.ones(480) / 480, 'same'))
    audible = np.where(envelope > 10 ** (-42 / 20))[0]
    if not len(audible):
        raise ValueError('合成音频没有可听见的旁白')
    start = max(0, audible[0] - int(0.04 * SR))
    end = min(len(samples), audible[-1] + int(0.2 * SR))
    trimmed = samples[start:end].copy()
    trimmed[:int(0.01 * SR)] *= np.linspace(0, 1, int(0.01 * SR))
    trimmed[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    wavfile.write(target, SR, (trimmed * 32767).astype(np.int16))


def synthesize(body, target):
    temporary = target.with_name(target.stem + '.tmp.mp3')
    for attempt in range(4):
        result = subprocess.run([
            'elevenlabs', 'text-to-speech', 'convert', '--params',
            json.dumps(body, ensure_ascii=False), '-o', str(temporary),
        ], capture_output=True, text=True)
        if result.returncode == 0 and temporary.exists() and temporary.stat().st_size:
            temporary.replace(target)
            return
        if attempt < 3:
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f'旁白合成失败：{(result.stderr or result.stdout)[-300:]}')


def main(project, force=False):
    directory = project.output / 'vo'
    directory.mkdir(parents=True, exist_ok=True)
    manifest_path = project.timing / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    items = [line for act in read_script()['acts'] for line in act['lines']]
    narration = project.config['narration']
    for i, line in enumerate(items):
        previous = items[i - 1]['text'] if i else ''
        following = items[i + 1]['text'] if i + 1 < len(items) else ''
        fingerprint = synthesis_hash(line['text'], project)
        context = context_hash(previous, following)
        processing = processing_hash(narration)
        mp3 = directory / f'{line["id"]}.mp3'
        wav = directory / f'{line["id"]}.wav'
        cached = manifest.get(line['id'], {})
        needs_synthesis = (
            force or not mp3.exists() or cached.get('hash') != fingerprint
            or cached.get('_contextHash') != context
        )
        if needs_synthesis:
            body = {
                'text': line['text'], 'model_id': narration['model'],
                'voice_settings': narration['settings'], 'language_code': narration['languageCode'],
                'voice_id': project.voice['voice'], 'output_format': 'mp3_44100_192',
            }
            if previous:
                body['previous_text'] = previous
            if following:
                body['next_text'] = following
            synthesize(body, mp3)
        elif (
            wav.exists() and cached.get('_processingHash') == processing
            and cached.get('_processedAudioHash') == hashlib.sha256(wav.read_bytes()).hexdigest()
        ):
            continue
        temporary = wav.with_name(wav.stem + '.tmp.wav')
        trim(mp3, temporary)
        seconds = duration(temporary)
        tempo = tempo_for(line['text'], seconds, narration)
        if abs(tempo - 1) > 0.01:
            paced = wav.with_name(wav.stem + '.paced.wav')
            subprocess.run([
                'ffmpeg', '-y', '-loglevel', 'error', '-i', str(temporary), '-af',
                f'atempo={tempo:.3f}', '-ar', str(SR), str(paced),
            ], check=True)
            paced.replace(temporary)
            seconds = duration(temporary)
        temporary.replace(wav)
        manifest[line['id']] = {
            'hash': fingerprint, 'duration': round(seconds, 3), 'text': line['text'],
            'rate': round(units(line['text']) / seconds, 2), '_contextHash': context,
            '_processingHash': processing, '_processedAudioHash': hashlib.sha256(wav.read_bytes()).hexdigest(),
        }
        write_json(manifest_path, manifest)
        print(project.variant, line['id'], round(seconds, 3), 's', manifest[line['id']]['rate'], '字/秒')


if __name__ == '__main__':
    project, args = arguments(__doc__)
    main(project, args.force)
