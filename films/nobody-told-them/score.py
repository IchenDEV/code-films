"""《初生牛犊》配乐：C 大调 / A 小调，104 拍。钢琴的跳音、竖琴拨弦、短弓的低音和一点合成琶音，
像一本小册子翻起来的声音；“我错了”之前几乎停下，之后全部回来。"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'engine', 'pipeline'))
from orchestra import *  # noqa: F401,F403
CHORDS.setdefault('G', ['G', 'B', 'D']); CHORDS.setdefault('Em', ['E', 'G', 'B'])
BPM = 104; BEAT = 60 / BPM
PROG = ['Am', 'F', 'C', 'G']
ARP = {'Am': ['A3', 'C4', 'E4', 'A4'], 'F': ['F3', 'A3', 'C4', 'F4'], 'C': ['C4', 'E4', 'G4', 'C5'], 'G': ['G3', 'B3', 'D4', 'G4']}
ROOT = {'Am': 'A2', 'F': 'F2', 'C': 'C3', 'G': 'G2'}
MOTIF = [('E5', 0.5), ('G5', 0.5), ('A5', 1), ('G5', 0.5), ('E5', 0.5), ('D5', 1), ('C5', 0.5), ('D5', 0.5), ('E5', 2)]


def hat(vel=0.3):
    n = int(0.06 * SR); return hp(rng.standard_normal(n), 7000) * np.exp(-np.arange(n) / SR / 0.012) * vel


def build_score(TL):
    S = {s['kind']: s for s in TL['shots']}
    A = lambda k, line=None, f=0.0: S[k]['a'] + ((S[k][line] + f * (S[k][line + '_end'] - S[k][line])) if line else 0)
    B = lambda k: S[k]['b']
    sc = Score(TL['DURATION'])

    def groove(t0, t1, kick=True, hats=True, bass=True, arp='pno', chords=True, vel=1.0, prog=PROG):
        bar = 4 * BEAT; t = t0; k = 0
        while t < t1 - 0.2:
            ch = prog[k % len(prog)]
            if chords: sc.chord(t, ch if ch in ('Am', 'F', 'C', 'G') else 'C', bar * 1.02, 'str', 0.18 * vel, lo=3, top=4, bright=1600, attack=0.4)
            for b in range(8):
                tb = t + b * BEAT / 2
                if tb >= t1: break
                if arp == 'pno': sc.put('pno', tb, piano(hz(ARP[ch][b % 4]) * (2 if b >= 4 else 1), 0.6, 0.28 * vel), (b % 4 - 1.5) * 0.25)
                elif arp == 'hrp': sc.put('hrp', tb, harp(hz(ARP[ch][(b * 3) % 4]) * 2, 0.32 * vel, 1.5), (b % 4 - 1.5) * 0.3)
                elif arp == 'syn': sc.put('fx', tb, arp_note(hz(ARP[ch][(b * 5) % 4]) * 2, 0.08, 0.22 * vel), (b % 2 - 0.5) * 0.6)
                if hats: sc.put('drm', tb + (BEAT / 4 if b % 2 else 0), hat(0.18 * vel), 0.3)
                if bass and b % 2 == 0: sc.put('str', tb, pulse_note(hz(ROOT[ch]), 0.16, 0.3 * vel), 0)
            if kick:
                for b in (0, 2): sc.put('drm', t + b * BEAT, taiko(0.42 * vel), 0)
                sc.put('drm', t + 3.5 * BEAT, taiko(0.2 * vel), 0)
            t += bar; k += 1

    # 片名：一句动机
    sc.melody(S['title']['a'] + 0.3, BEAT, MOTIF, 'pno', 0.42)
    sc.put('drm', S['title']['a'] + 0.3, taiko(0.6, big=True), 0)
    # 01 梯子：好奇，往下走
    groove(S['ladder']['a'], B('crab'), kick=False, hats=True, arp='pno', vel=0.8)
    sc.melody(A('bubble', 't2'), BEAT, MOTIF[:5], 'hrp', 0.4)
    a, b = S['deep']['a'], B('deep')
    sc.chord(a, 'Am', b - a + 1, 'str', 0.3, lo=2, top=4, bright=900, attack=1.5)
    sc.chord(a, 'Am', b - a + 1, 'cho', 0.22, lo=3, top=4)
    for i in range(int((b - a) / (BEAT / 2))):
        sc.put('hrp', a + i * BEAT / 2, harp(hz(['A4', 'C5', 'E5', 'B4', 'E5', 'A5'][i % 6]), 0.18, 2.0), np.sin(i) * 0.5)
    sc.put('drm', A('deep', 't5', 0.75), timpani(hz('A2'), 0.5), 0)
    # 02 潮水：节奏进来
    groove(S['tanks']['a'], B('rope'), arp='hrp', vel=0.9)
    sc.chord(A('tanks', 'g4', 0.05), 'C', 3.0, 'cho', 0.4, lo=3, top=5)
    sc.melody(A('rope', 'g6', 0.55), BEAT, MOTIF, 'pno', 0.36)
    # 03 怪人：有点歪的合成琶音
    groove(S['bricks']['a'], B('music') - 0.5, arp='syn', vel=0.85, prog=['Am', 'Am', 'F', 'G'])
    sc.put('brs', A('bricks', 'w1') + 0.2, brass(hz('A3'), 0.5, 0.6), 0)
    a, b = A('music', 'w6'), B('music')
    sc.melody(a + 0.2, BEAT, [('A4', 1), ('C5', 0.5), ('D5', 0.5), ('E5', 1), ('D5', 1)] * 2, 'hrp', 0.35, pan=-0.3)
    sc.melody(a + 2.2, BEAT * 0.75, [('E5', 0.5), ('G5', 0.5), ('A5', 1), ('C6', 0.5), ('A5', 0.5), ('G5', 1)] * 2, 'pno', 0.3, pan=0.3)
    sc.chord(A('music', 'w6', 0.62), 'C', b - A('music', 'w6', 0.62) + 1, 'cho', 0.35, lo=3, top=5)
    # 04 扔掉：火箭上升的琶音，塔一层层加快
    groove(S['trash']['a'], B('tower'), arp='pno', vel=0.9)
    y4, y4e = A('tower', 'y4'), A('tower', 'y4', 1)
    b0, b1 = y4 + 0.3 * (y4e - y4), y4 + 0.7 * (y4e - y4)
    scale = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6']
    for i in range(22): sc.put('hrp', b0 + i * (b1 - b0) / 22, harp(hz(scale[min(10, i // 2)]), 0.3, 1.5), 0)
    sc.chord(y4 + 0.78 * (y4e - y4), 'C', 2.5, 'brs', 0.35, lo=3, top=4)
    # 05 目标：安静一点的钢琴
    a, b = S['shells']['a'], B('shells')
    groove(a, b, kick=False, hats=False, arp='pno', vel=0.6, prog=['F', 'C', 'G', 'Am'])
    # 06 我错了：几乎停下，然后全部回来
    a = S['fence']['a']
    groove(a, A('wrong', 'x3', 0.05), arp='hrp', vel=0.7, hats=False)
    x3 = A('wrong', 'x3', 0.1)
    sc.put('drm', x3, taiko(0.9, big=True), 0); sc.put('drm', x3, timpani(hz('C2'), 0.6), 0)
    sc.chord(x3, 'F', 4 * BEAT * 2, 'cho', 0.4, lo=3, top=5); sc.chord(x3, 'F', 4 * BEAT * 2, 'str', 0.3, lo=3, top=5)
    groove(A('wrong', 'x4'), B('weird'), arp='syn', vel=1.0)
    groove(A('wrong', 'x4'), B('weird'), kick=False, hats=False, bass=False, chords=False, arp='pno', vel=0.7)
    sc.melody(A('weird', 'x5') + 0.1, BEAT, MOTIF, 'brs', 0.42)
    a, b = S['end']['a'], B('end')
    sc.chord(a, 'C', b - a + 1, 'str', 0.3, lo=3, top=5, attack=0.3)
    sc.melody(a + 0.3, BEAT, MOTIF, 'pno', 0.4)
    sc.put('drm', a + 0.3, taiko(0.5, big=True), 0)

    out = reverb(sc.mix(), 2.2, 0.22)[: int(TL['DURATION'] * SR)]
    tt = np.arange(len(out)) / SR
    x3 = A('wrong', 'x3', 0.1)
    dyn = np.interp(tt, [0, S['tanks']['a'], S['bricks']['a'], S['shells']['a'], B('shells'), x3 - 3, x3 - 0.05, x3 + 0.1, A('wrong', 'x4'), TL['DURATION']],
                    [0.7, 0.8, 0.85, 0.65, 0.7, 0.5, 0.3, 1.0, 0.9, 0.85])
    out *= dyn[:, None]
    return out / (np.max(np.abs(out)) + 1e-9) * 0.9
