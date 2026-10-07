"""《编制》配乐：D 小调 / F 大调，96 拍。
组织架构图的段落是一支机械的“办公室进行曲”：低音拨弦的八分音符、钟表般的跳音、军鼓似的嘀嗒；
“即时”一章打开成 F 大调的竖琴与合唱；调度器长成中层时，进行曲走调地回来；结尾落在温暖的 F 大调上。"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'engine', 'pipeline'))
from orchestra import *  # noqa: F401,F403
BPM = 96; BEAT = 60 / BPM
MARCH = ['Dm', 'Dm', 'Bb', 'A']
OPEN = ['F', 'C', 'Dm', 'Bb']
ARP = {'Dm': ['D3', 'F3', 'A3', 'D4'], 'Bb': ['Bb2', 'D3', 'F3', 'Bb3'], 'A': ['A2', 'Db3', 'E3', 'A3'], 'F': ['F3', 'A3', 'C4', 'F4'],
       'C': ['C3', 'E3', 'G3', 'C4'], 'Gm': ['G2', 'Bb2', 'D3', 'G3'], 'Am': ['A2', 'C3', 'E3', 'A3']}
ROOT = {'Dm': 'D2', 'Bb': 'Bb1', 'A': 'A1', 'F': 'F2', 'C': 'C2', 'Gm': 'G1', 'Am': 'A1'}
# 主题：一句四小节的动机（单位：拍）
THEME = [('D5', 1), ('A4', 0.5), ('D5', 0.5), ('F5', 1), ('E5', 1), ('D5', 0.5), ('C5', 0.5), ('A4', 1), ('D5', 2)]
THEME_MAJ = [('F5', 1), ('C5', 0.5), ('F5', 0.5), ('A5', 1), ('G5', 1), ('F5', 0.5), ('E5', 0.5), ('C5', 1), ('F5', 2)]


def tick(vel=0.25):
    n = int(0.03 * SR); return hp(rng.standard_normal(n), 5000) * np.exp(-np.arange(n) / SR / 0.004) * vel


def snare(vel=0.3):
    n = int(0.18 * SR); tt = np.arange(n) / SR
    return (bp(rng.standard_normal(n), 1500, 7000) * np.exp(-tt / 0.05) + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / 0.03) * 0.5) * vel


def build_score(TL):
    S = {s['kind']: s for s in TL['shots']}
    A = lambda k, line=None, f=0.0: S[k]['a'] + ((S[k][line] + f * (S[k][line + '_end'] - S[k][line])) if line else 0)
    B = lambda k: S[k]['b']
    sc = Score(TL['DURATION'])

    def march(t0, t1, prog=MARCH, vel=1.0, ticks=True, drum=True, keys=True, pad=True, detune=0.0):
        """机械的进行曲：拨弦低音 + 跳音 + 嘀嗒"""
        bar = 4 * BEAT; t = t0; k = 0
        while t < t1 - 0.2:
            ch = prog[k % len(prog)]
            if pad: sc.chord(t, ch, bar * 1.02, 'str', 0.14 * vel, lo=3, top=4, bright=1200, attack=0.5)
            for b in range(8):
                tb = t + b * BEAT / 2
                if tb >= t1: break
                sc.put('hrp', tb, harp(hz(ROOT[ch]) * (2 if b % 2 else 1) * 2 ** (detune / 12), 0.42 * vel, 0.6), -0.2)
                if keys and b % 2 == 1: sc.put('pno', tb, piano(hz(ARP[ch][(b // 2) % 4]) * 2 * 2 ** (detune / 12), 0.35, 0.22 * vel), 0.3)
                if ticks: sc.put('drm', tb, tick(0.16 * vel), 0.5 if b % 2 else -0.5)
            if drum:
                sc.put('drm', t, taiko(0.35 * vel), 0)
                sc.put('drm', t + 2 * BEAT, snare(0.25 * vel), 0.1)
                sc.put('drm', t + 3.5 * BEAT, snare(0.12 * vel), 0.1)
            t += bar; k += 1

    def flow(t0, t1, prog=OPEN, vel=1.0, inst='hrp', choir_on=True, pulse=False):
        """打开的段落：竖琴琶音 + 弦乐长音"""
        bar = 4 * BEAT; t = t0; k = 0
        while t < t1 - 0.2:
            ch = prog[k % len(prog)]
            sc.chord(t, ch, bar * 1.05, 'str', 0.2 * vel, lo=3, top=5, bright=2200, attack=0.9)
            if choir_on: sc.chord(t, ch, bar * 1.05, 'cho', 0.12 * vel, lo=4, top=5)
            for b in range(8):
                tb = t + b * BEAT / 2
                if tb >= t1: break
                nt = hz(ARP[ch][[0, 1, 2, 3, 2, 3, 1, 2][b]]) * 2
                if inst == 'hrp': sc.put('hrp', tb, harp(nt, 0.3 * vel, 2.0), (b % 4 - 1.5) * 0.3)
                elif inst == 'pno': sc.put('pno', tb, piano(nt, 1.2, 0.22 * vel), (b % 4 - 1.5) * 0.25)
                elif inst == 'syn': sc.put('fx', tb, arp_note(nt * 2, 0.09, 0.18 * vel), (b % 2 - 0.5) * 0.6)
                if pulse and b % 2 == 0: sc.put('str', tb, pulse_note(hz(ROOT[ch]) * 2, 0.15, 0.2 * vel), 0)
            t += bar; k += 1

    # 片名：楔子刺进来那一下
    a = S['title']['a']
    sc.put('drm', a + 2.1, taiko(0.9, big=True), 0); sc.put('drm', a + 2.1, timpani(hz('D2'), 0.6), 0)
    sc.chord(a + 2.1, 'Dm', 3.5, 'brs', 0.4, lo=3, top=4)
    sc.melody(a + 2.6, BEAT, THEME[:5], 'pno', 0.4)
    # 冷开场：办公室进行曲
    march(S['tower']['a'] + 0.4, B('chatter') - 0.3, vel=0.85)
    sc.put('drm', A('tower', 'n1', 0.82), timpani(hz('A1'), 0.5), 0)
    # 直线：几乎停下，只剩一支竖琴；修好时一声钟
    a, b = S['direct']['a'], B('direct')
    sc.chord(a, 'F', b - a + 0.5, 'str', 0.12, lo=4, top=5, attack=1.0)
    t1 = A('direct', 'n3', 0.72)
    for i, nt in enumerate(['F4', 'A4', 'C5', 'F5', 'A5']): sc.put('hrp', A('direct', 'n3', 0.2) + i * (t1 - A('direct', 'n3', 0.2)) / 5, harp(hz(nt), 0.35, 2.0), 0.2)
    sc.put('fx', t1, piano(hz('F5'), 3.0, 0.5), 0); sc.put('fx', t1, piano(hz('C6'), 3.0, 0.3), 0.2)
    # 印章：低音铜管 + 定音鼓
    hit = A('stamp', 'n4', 0.62)
    sc.chord(S['stamp']['a'], 'Dm', hit - S['stamp']['a'], 'str', 0.18, lo=2, top=4, bright=800, attack=2.0)
    sc.put('drm', hit, taiko(1.0, big=True), 0); sc.put('drm', hit, timpani(hz('D2'), 0.8), 0)
    sc.chord(hit, 'Dm', 3.0, 'brs', 0.45, lo=2, top=4)
    # 01 编制：转圈的进行曲
    march(S['loop']['a'] + 0.6, B('belt') - 0.6, vel=0.9)
    sc.melody(A('loop', 'd1', 0.1), BEAT, THEME, 'str', 0.3)
    sc.put('drm', A('belt', 'd3', 0.62), timpani(hz('A1'), 0.6), 0)
    sc.chord(A('belt', 'd3', 0.62), 'A', 3.0, 'brs', 0.35, lo=3, top=4)
    # 02 交接税：低音持续，越叠越高
    a, b = S['bars']['a'], B('bars')
    sc.chord(a, 'Dm', b - a, 'str', 0.2, lo=2, top=4, bright=1000, attack=2.0)
    flow(a + 0.5, b - 0.3, prog=['Dm', 'Gm', 'Dm', 'A'], vel=0.6, inst='pno', choir_on=False, pulse=True)
    a, b = S['whisper']['a'], B('whisper')
    sc.chord(a, 'Gm', b - a, 'str', 0.2, lo=3, top=4, bright=900, attack=1.5)
    for i in range(int((b - a) / BEAT)): sc.put('hrp', a + i * BEAT, harp(hz(['D5', 'A4', 'F4', 'D4'][i % 4]) * (1 - 0.01 * i), 0.22 * (1 - i / ((b - a) / BEAT) * 0.6), 2.0), np.sin(i) * 0.4)
    a, b = S['sprawl']['a'], B('sprawl')
    march(a + 0.3, b - 0.5, vel=1.0)
    for i, q in enumerate([0.02, 0.15, 0.32, 0.5, 0.62]):
        t = A('sprawl', 'c4', q); sc.put('drm', t, taiko(0.4 + i * 0.12, big=i >= 3), 0)
        sc.chord(t, ['Dm', 'Bb', 'Gm', 'A', 'A'][i], 1.8, 'brs', 0.2 + i * 0.06, lo=3, top=4)
    sc.put('drm', A('sprawl', 'c4', 0.75), crash(0.5), 0)
    # 03 即时：F 大调打开
    a = S['sched']['a']
    sc.put('drm', a + 0.4, timpani(hz('F2'), 0.5), 0)
    flow(a + 1.6, B('spawn') - 0.3, vel=0.9, inst='hrp')
    sc.melody(A('sched', 'j2', 0.1), BEAT, THEME_MAJ, 'pno', 0.35)
    sc.melody(A('spawn', 'j4'), BEAT, THEME_MAJ[:5], 'str', 0.3, octave=-1)
    # 04 三条理由：钢琴，安静一点
    flow(S['eyes']['a'] + 0.4, B('walls') - 1.0, prog=['Dm', 'Bb', 'F', 'C'], vel=0.7, inst='pno', choir_on=False, pulse=True)
    sc.chord(A('eyes', 'o2', 0.85), 'A', 2.5, 'brs', 0.3, lo=3, top=4)
    sc.put('drm', A('eyes', 'o2', 0.85), timpani(hz('A1'), 0.5), 0)
    sc.chord(A('fresh', 'o3', 0.62), 'F', 4.0, 'cho', 0.35, lo=3, top=5)
    o5 = A('walls', 'o5')
    sc.put('drm', o5 + 1.0, taiko(0.6, big=True), 0); sc.chord(o5 + 1.0, 'F', 3.0, 'brs', 0.35, lo=3, top=4)
    # 05 不是种姓：俏皮的合成琶音
    flow(S['caste']['a'] + 0.4, B('spec') - 0.4, prog=['F', 'C', 'Dm', 'Bb'], vel=0.75, inst='syn', choir_on=False, pulse=True)
    m2 = A('caste', 'm2', 0.72)
    sc.put('drm', m2, taiko(0.7, big=True), 0); sc.chord(m2, 'Bb', 2.5, 'brs', 0.35, lo=3, top=4)
    # 06 回收：流动，然后进行曲走调地回来
    flow(S['prune']['a'] + 0.4, B('prune') - 0.3, prog=['F', 'C', 'Dm', 'Bb'], vel=0.75, inst='hrp', choir_on=False)
    sc.put('drm', A('prune', 'r1', 0.66), snare(0.4), 0)
    march(S['creep']['a'] + 0.3, B('creep') - 0.3, vel=0.8, detune=-0.35)
    sc.melody(A('creep', 'r2', 0.5), BEAT * 1.2, THEME, 'brs', 0.3, octave=-1)
    a, b = S['ledger']['a'], B('ledger')
    sc.chord(a + 0.3, 'Bb', (b - a) / 2, 'str', 0.22, lo=3, top=5, attack=1.5)
    sc.chord(a + (b - a) / 2, 'F', (b - a) / 2 + 1, 'str', 0.22, lo=3, top=5, attack=1.5)
    sc.melody(A('ledger', 'r3', 0.68), BEAT, THEME_MAJ[:5], 'hrp', 0.35)
    # 尾声：全部回来，落在 F 大调
    flow(S['office']['a'] + 0.3, B('final') - 0.5, vel=1.0, inst='hrp')
    flow(S['office']['a'] + 0.3, B('final') - 0.5, vel=0.6, inst='pno', choir_on=False, pulse=True)
    e2 = A('final', 'e2')
    sc.put('drm', e2, taiko(0.8, big=True), 0); sc.put('drm', e2, timpani(hz('F2'), 0.7), 0)
    sc.melody(e2 + 0.1, BEAT, THEME_MAJ, 'brs', 0.42)
    a, b = S['end']['a'], B('end')
    sc.chord(a, 'F', b - a + 1, 'str', 0.25, lo=3, top=5, attack=0.4)
    sc.melody(a + 0.4, BEAT, THEME_MAJ[:5], 'pno', 0.38)

    out = reverb(sc.mix(), 2.4, 0.24)[: int(TL['DURATION'] * SR)]
    tt = np.arange(len(out)) / SR
    dyn = np.interp(tt,
                    [0, S['direct']['a'], S['direct']['a'] + 0.8, S['stamp']['a'], S['loop']['a'], S['bars']['a'], S['sprawl']['a'], B('sprawl'),
                     S['sched']['a'] + 1, S['eyes']['a'], S['caste']['a'], S['creep']['a'], S['ledger']['a'], S['office']['a'], A('final', 'e2'), TL['DURATION']],
                    [0.8, 0.8, 0.45, 0.7, 0.75, 0.7, 0.8, 1.0, 0.75, 0.65, 0.75, 0.7, 0.6, 0.85, 1.0, 0.85])
    out *= dyn[:, None]
    return out / (np.max(np.abs(out)) + 1e-9) * 0.9
