"""配乐：用 ElevenLabs Music（music_v2_5）按时间轴作曲。
每个成片版本一首：段落边界取自实测的镜头与对位点（片名重击、协调者接过目标的那一下……），
所以高潮和静默都落在画面上。结果按作曲计划的哈希缓存在 out/music/。
用法：python3 tools/music.py <variant>…"""
import hashlib, json, os, subprocess, sys, time

CFG = json.load(open('film.json'))
BPM = '112 BPM'
GLOBAL = [BPM, 'modern cinematic electronic score', 'tech documentary', 'instrumental', 'polished punchy production', 'D minor', 'wide stereo']
NEG = ['vocals', 'singing', 'lyrics', 'spoken word', 'voice', 'choir words']

STYLE = {
    'hook': ['starts instantly at full presence on the very first beat', 'no fade-in', 'driving pulsing synth arpeggio', 'shimmering digital textures', 'sub-bass pulses', 'rising tension'],
    'title': ['huge cinematic impact on the downbeat', 'wide synth chord stab', 'big drums for one bar', 'then settles into a pulse'],
    'early': ['light curious groove', 'plucky synth arpeggios', 'soft kick and ticking hi-hats', 'nostalgic and playful', 'warm keys'],
    'agent': ['building momentum', 'driving synth bassline', 'steady four-on-the-floor kick', 'brighter arpeggios', 'focused and confident'],
    'parallel': ['energetic', 'many layered arpeggios stacking up', 'faster hi-hats', 'busy rhythmic texture', 'excitement'],
    'agent+parallel': ['building momentum', 'driving synth bassline', 'steady kick', 'arpeggios multiply and stack up', 'energetic'],
    'bottleneck': ['tension and overwhelm', 'stuttering filtered pulses', 'ticking clock', 'claustrophobic dissonant pads', 'heartbeat-like low drum', 'pulls back to near silence in the last two seconds'],
    'drop': ['massive euphoric drop on the first beat', 'loudest and fullest section of the piece', 'huge supersaw chords', 'big punchy drums', 'soaring synth lead', 'triumphant'],
    'archive': ['sudden breakdown', 'very quiet', 'solo warm felt piano', 'soft pads', 'reflective', 'no drums', 'no bass'],
    'verify': ['steady rebuilding pulse', 'mid-tempo electronic beat returns', 'clean arpeggio', 'purposeful and confident'],
    'archive+verify': ['breakdown with warm felt piano', 'then a steady pulse rebuilds', 'clean arpeggio', 'purposeful'],
    'reality': ['quiet and restrained', 'minimal sparse pulse', 'cautious', 'no big drums'],
    'recap': ['uplifting build', 'emotional chord progression', 'rising layers of strings and synths', 'hopeful climax'],
    'end': ['gentle resolution', 'solo piano with soft ambient pad', 'quiet and open-ended', 'fades out to silence'],
}


def sections(TL):
    S = {s['kind']: s for s in TL['shots']}
    arrive = S['bloom']['cues'].get('handoff', S['bloom']['a'] + 0.8) + 0.5
    if TL['cut'] == 'long':
        marks = [('hook', 0), ('title', S['title']['cues']['t2']), ('early', S['ide']['a']), ('agent', S['agent']['a']),
                 ('parallel', S['grid']['a']), ('bottleneck', S['overload']['a']), ('drop', arrive), ('archive', S['archive']['a']),
                 ('verify', S['loop']['a']), ('reality', S['reality']['a']), ('recap', S['ladder']['a']), ('end', S['end']['a'])]
    else:
        marks = [('hook', 0), ('early', S['tab']['a']), ('agent+parallel', S['agent']['a']), ('bottleneck', S['overload']['a']),
                 ('drop', arrive), ('archive+verify', S['archive']['a']), ('recap', S['ladder']['a']), ('end', S['end']['a'])]
    out = []
    for i, (name, t) in enumerate(marks):
        t1 = marks[i + 1][1] if i + 1 < len(marks) else TL['duration']
        out.append((name, t, t1))
    return out


def plan_for(TL):
    chunks = []
    for name, a, b in sections(TL):
        ms = int(round((b - a) * 1000))
        chunks.append({'text': f'[{name}]', 'duration_ms': ms, 'positive_styles': [BPM] + STYLE[name],
                       'negative_styles': NEG, 'context_adherence': 'high'})
    return chunks


def main():
    os.makedirs('out/music', exist_ok=True)
    for v in sys.argv[1:]:
        TL = json.load(open(f'timeline/{v}.json'))
        chunks = plan_for(TL)
        h = hashlib.sha1(json.dumps([chunks, GLOBAL]).encode()).hexdigest()[:10]
        path = f'out/music/{v}-{h}.mp3'
        meta = {'variant': v, 'plan': chunks, 'file': path}
        if not os.path.exists(path):
            body = {'composition_plan': {'positive_global_styles': GLOBAL, 'negative_global_styles': NEG, 'chunks': chunks},
                    'model_id': CFG['music']['model']}
            for attempt in range(3):
                # 用 --json - 直接发请求体：CLI 的本地校验还要求旧版 music_prompt 字段
                r = subprocess.run(['elevenlabs', 'music', 'compose', '--json', '-', '-o', path], input=json.dumps(body), capture_output=True, text=True)
                if r.returncode == 0 and os.path.exists(path) and os.path.getsize(path) > 10000: break
                print('retry', v, (r.stderr or r.stdout)[-500:]); time.sleep(6)
            else:
                sys.exit('music failed ' + v)
        json.dump(meta, open(f'out/music/{v}.json', 'w'), indent=1)
        d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]))
        print(f'{v}: {d:.1f}s (timeline {TL["duration"]:.1f}s) → {path}')
        for c in chunks: print(f'   {c["text"]:18s} {c["duration_ms"] / 1000:5.1f}s')


if __name__ == '__main__':
    main()
