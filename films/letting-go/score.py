"""《放手》配乐：D 羽调式（D F G A C）的五声音阶。竖琴模仿古筝的拨奏，弦乐铺底，钢琴点出主题；
前半克制，告示越贴越密时低音弦渐紧；放手之后弦乐与合唱舒展开，最后回到一架钢琴。
乐器与编曲工具来自 engine/pipeline/orchestra.py。"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'engine', 'pipeline'))
from orchestra import *  # noqa: F401,F403

PENTA = ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'F5', 'G5', 'A5']
THEME = [('A4', 1), ('D5', 1), ('C5', 1), ('A4', 1), ('G4', 2), ('F4', 1), ('G4', 1), ('A4', 4),
         ('A4', 1), ('C5', 1), ('D5', 2), ('F5', 1), ('D5', 1), ('C5', 1), ('A4', 1), ('D5', 4)]


def build_score(TL):
    S = {s['kind']: s for s in TL['shots']}
    A = lambda k, line=None, f=0.0: S[k]['a'] + ((S[k][line] + f * (S[k][line + '_end'] - S[k][line])) if line else 0)
    B = lambda k: S[k]['b']
    sc = Score(TL['DURATION'])
    rng_ = np.random.default_rng(3)

    def zheng(t0, t1, beat, pattern, base=5, vel=0.42, every=1.0):
        """古筝式的拨奏：沿五声音阶的走句，偶有倚音"""
        t, i = t0, 0
        while t < t1:
            k = pattern[i % len(pattern)] + base
            nt = PENTA[int(np.clip(k, 0, len(PENTA) - 1))]
            v = vel * (1.0 if i % 4 == 0 else 0.7) * every
            sc.put('hrp', t, harp(hz(nt), v, 3.5), np.sin(i * 0.9) * 0.45)
            if i % 8 == 7: sc.put('hrp', t + beat * 0.25, harp(hz(nt) * 2 ** (2 / 12), v * 0.4, 2.0), 0.2)
            t += beat; i += 1

    # ═══ 序：低音弦渐渐收紧 ═══
    a, b = S['notes']['a'], B('notes')
    sc.put('str', a + 0.5, strings(hz('D2'), b - a + 1.5, 0.32, bright=800, attack=4), -0.2)
    sc.put('str', a + 4, strings(hz('A2'), b - a - 2.5, 0.22, bright=900, attack=5), 0.2)
    # 告示越贴越密：跳弓的重复音
    t, step = A('notes', 'o2') - 1.5, 0.5
    while t < b - 0.2:
        sc.put('str', t, pulse_note(hz('D3'), 0.12, 0.22), 0.1); t += step; step = max(0.18, step * 0.93)
    sc.put('fx', b - 2.2, cymbal_swell(2.2), 0, 0.6)
    # 风吹走之后：一个空的五度，钢琴几声
    a, b = S['thesis']['a'], B('thesis')
    sc.put('drm', a + 1.4, timpani(hz('D2'), 0.25), 0)
    sc.chord(a + 2.0, 'D5', b - a, 'str', 0.28, lo=3, top=4, bright=1400, attack=3)
    t4 = A('thesis', 'o4')
    sc.melody(t4 + 0.4, 0.95, [('A4', 2), ('D5', 2), ('C5', 3), ('A4', 4)], 'pno', 0.4)
    sc.melody(A('thesis', 'o5') + 0.6, 0.95, [('G4', 2), ('A4', 2), ('D4', 5)], 'pno', 0.32)
    # 片名：一声鼓，合唱
    t = S['title']['a'] + 0.6
    sc.put('drm', t, taiko(0.5, big=True), 0)
    sc.chord(t, 'D5', B('title') - t + 2, 'cho', 0.42, lo=3, top=5)
    sc.put('hrp', t + 0.1, harp(hz('D3'), 0.6, 4), -0.2)

    # ═══ 年代卡：每到一段，一声鼓，一记弦乐 ═══
    era_ch = ['Dm', 'Bb', 'F', 'Gm', 'Bb', 'Dm', 'Dm', 'F']
    for n in range(1, 9):
        t = S[f'era{n}']['a'] + 0.95
        sc.put('drm', t, taiko(0.55, big=n in (1, 7)), 0)
        sc.put('drm', t, timpani(hz('D2'), 0.3), 0)
        sc.chord(t, era_ch[n - 1], 2.6, 'str', 0.34, lo=3, top=5, bright=1900, attack=0.15, release=1.4)
        for i, nt in enumerate(PENTA[5:11]):
            sc.put('hrp', t - 0.42 + i * 0.07, harp(hz(nt), 0.22, 2.0), -0.4 + 0.16 * i)

    # ═══ 一 · 续写 / 二 · 嘱咐：古筝般的拨奏，弦乐慢慢换和声 ═══
    beat = 60 / 76
    a, b = S['trace']['a'], B('frames')
    zheng(a + 0.6, b - 0.6, beat, [0, 2, 3, 5, 3, 2, 1, 2, 0, 3, 5, 7, 5, 3, 2, 3], base=3, vel=0.34)
    prog = ['Dm', 'Bb', 'F', 'C']
    bar = 8 * beat
    k = 0; t = a
    while t < b:
        sc.chord(t, prog[k % 4], bar * 1.05, 'str', 0.24, lo=3, top=4, bright=1300, attack=1.5); t += bar; k += 1
    sc.melody(A('trace', 'a3') + 0.3, beat, THEME[:8], 'pno', 0.38)
    sc.melody(A('frames', 'b4', 0.5), beat * 0.9, [('D5', 1), ('C5', 1), ('A4', 1), ('G4', 1), ('F4', 1), ('D4', 1), ('C4', 1), ('D4', 4)], 'pno', 0.3)

    # ═══ 三 · 步骤 ═══
    a, b = S['stones']['a'], B('scholars')
    sc.put('str', a, strings(hz('D2'), b - a + 1, 0.26, bright=900, attack=2), 0)
    sc.chord(a, 'Dm', b - a + 1, 'str', 0.2, lo=3, top=4, bright=1200, attack=2)
    c1, c1e = A('stones', 'c1'), A('stones', 'c1', 1)
    S0, S1 = c1 + 0.36 * (c1e - c1), c1e + 0.4
    for i in range(7):
        sc.put('hrp', S0 + i * (S1 - S0) / 6, harp(hz(PENTA[5 + i]), 0.42, 3), -0.6 + 0.2 * i)
    c2, c2e = A('stones', 'c2'), A('stones', 'c2', 1)
    t = c2 + 0.5 * (c2e - c2)
    for i in range(16):
        sc.put('hrp', t + i * 0.16 + rng_.random() * 0.05, harp(hz(PENTA[8 + (i * 3) % 6]), 0.22, 2.5), rng_.uniform(-0.8, 0.8))
    c3, c3e = A('scholars', 'c3'), A('scholars', 'c3', 1)
    M = c3 + 0.55 * (c3e - c3)
    for i, nt in enumerate(['A4', 'G4', 'F4', 'D4']):
        sc.put('pno', M + i * 0.42, piano(hz(nt), 3, 0.32), 0)
    sc.put('pno', M + 1.9, piano(hz('D3'), 4, 0.36), 0)

    # ═══ 四 · 补丁：不安的低音 ═══
    a, b = S['patches']['a'], B('scroll')
    sc.put('str', a, strings(hz('Bb1'), B('patches') - a + 1, 0.3, bright=700, attack=2), 0)
    sc.put('str', a + 1, strings(hz('E3'), B('patches') - a, 0.12, bright=1500, attack=3), 0.4)
    t = a + 0.6
    while t < B('patches') - 0.3:
        sc.put('str', t, pulse_note(hz('D3'), 0.1, 0.16), -0.2); sc.put('str', t + 0.38, pulse_note(hz('Eb3'), 0.1, 0.12), 0.2); t += 1.15
    a = S['scroll']['a']
    sc.chord(a, 'Gm', b - a + 1, 'str', 0.24, lo=3, top=4, bright=1200, attack=2)
    d3, d3e = A('scroll', 'd3'), A('scroll', 'd3', 1)
    ts = d3 + 0.74 * (d3e - d3)
    sc.put('drm', ts, timpani(hz('D2'), 0.4), 0)
    sc.chord(ts, 'Dm', b - ts + 2, 'cho', 0.25, lo=3, top=4)

    # ═══ 五 · 推理：和声舒展 ═══
    a, b = S['reason']['a'], B('reason')
    beat = 60 / 70; bar = 4 * beat
    prog = ['Bb', 'F', 'C', 'Dm']
    k = 0; t = a
    while t < b:
        v = 0.22 + 0.12 * min(1, (t - a) / (b - a))
        sc.chord(t, prog[k % 4], bar * 1.05, 'str', v, lo=3, top=5, bright=1600, attack=1.2)
        sc.put('str', t, strings(hz(CHORDS[prog[k % 4]][0] + '2'), bar * 1.05, v, bright=900), 0)
        t += bar; k += 1
    sc.melody(A('reason', 'e2', 0.5), beat, THEME[:8], 'str', 0.34, pan=0.1)
    # ═══ 六 · 上下文：灯下只剩一个低音与钢琴 ═══
    a, b = S['lamp']['a'], B('lamp')
    sc.put('str', a, strings(hz('D2'), b - a + 1.5, 0.22, bright=600, attack=2), 0)
    for i, nt in enumerate(['D4', 'A4', 'C5', 'D5', 'A4']):
        sc.put('pno', a + 1.2 + i * 2.2, piano(hz(nt), 3.5, 0.26), 0.1 * i)

    # ═══ 七 · 放手：蓄势，停笔时几乎无声；挥笔的一刻，全团落下 ═══
    a, b = S['letgo']['a'], B('letgo')
    SW = a + S['letgo']['sweep']
    g2e = A('letgo', 'g2', 1)
    sc.put('str', a, strings(hz('D2'), SW - a + 0.2, 0.3, bright=800, attack=2), 0)
    sc.put('str', a + 1, strings(hz('A2'), SW - a - 1, 0.2, bright=900, attack=3), 0.2)
    t, step = a + 1.0, 1.0
    while t < g2e - 0.2:
        sc.put('str', t, pulse_note(hz('D3'), 0.12, 0.16 + 0.1 * (t - a) / (g2e - a)), 0.1); t += step; step = max(0.36, step * 0.95)
    sc.put('str', g2e, strings(hz('A5'), SW - g2e, 0.1, bright=5000, attack=1.0), 0)  # 停笔：一根极高的弦
    sc.put('fx', SW - 1.3, cymbal_swell(1.3), 0, 0.7)
    sc.put('drm', SW, taiko(1.0, big=True), 0)
    sc.put('drm', SW, timpani(hz('D2'), 0.8), 0)
    sc.put('drm', SW + 0.02, taiko(0.6, big=True), 0.2)
    sc.chord(SW, 'F', b - SW + 2.5, 'str', 0.55, lo=3, top=5, bright=2400, attack=0.12, release=2)
    sc.chord(SW, 'F', b - SW + 2.5, 'cho', 0.5, lo=3, top=5, release=2)
    sc.put('str', SW, strings(hz('F2'), b - SW + 2.5, 0.5, bright=1200, attack=0.1), 0)
    sc.melody(SW + 0.9, 60 / 66, THEME[8:12] + [('D5', 4)], 'str', 0.45, pan=0.1)
    # ═══ 八 · 今后：钢琴，轻 ═══
    a, b = S['grading']['a'], B('grading')
    sc.chord(a, 'Dm', b - a + 1, 'str', 0.2, lo=3, top=4, bright=1200, attack=1.5)
    for i, nt in enumerate(['A4', 'C5', 'D5', 'C5', 'A4', 'G4']):
        sc.put('pno', A('grading', 'f0', 0.32 + i * 0.1), piano(hz(nt), 2.5, 0.26), -0.2 + 0.08 * i)

    # ═══ 尾声：四方印，最后一笔山水 ═══
    a, b = S['seals']['a'], B('seals')
    f2, f2e = A('seals', 'f2'), A('seals', 'f2', 1)
    sc.chord(a, 'F', f2 - a + 0.2, 'str', 0.24, lo=3, top=4, bright=1400, attack=2)
    for i, (f, ch) in enumerate(zip([0.02, 0.23, 0.45, 0.66], ['F', 'C', 'Dm', 'Bb'])):
        t = f2 + f * (f2e - f2) + 0.06
        nxt = f2 + [0.23, 0.45, 0.66, 1.15][i] * (f2e - f2) + 0.06
        sc.chord(t, ch, nxt - t + 0.4, 'str', 0.3, lo=3, top=4, bright=1600, attack=0.4)
        sc.put('drm', t, taiko(0.32), 0)
        sc.put('hrp', t, harp(hz(['F4', 'C5', 'D5', 'A4'][i]), 0.5, 3), (i - 1.5) * 0.3)
    a, b = S['freehand']['a'], B('end')
    beat = 60 / 64
    sc.chord(a, 'F', 4 * beat * 2, 'str', 0.36, lo=3, top=5, bright=1800)
    sc.chord(a, 'F', 4 * beat * 2, 'cho', 0.3, lo=3, top=4)
    sc.chord(a + 8 * beat, 'C', 4 * beat * 2, 'str', 0.34, lo=3, top=5, bright=1800)
    sc.chord(a + 8 * beat, 'C', 4 * beat * 2, 'cho', 0.28, lo=3, top=4)
    tend = a + 16 * beat
    sc.chord(tend, 'Dm', b - tend + 1, 'str', 0.3, lo=3, top=5, bright=1400, attack=1)
    sc.chord(tend, 'D5', b - tend + 1, 'cho', 0.24, lo=3, top=4)
    sc.melody(a + 0.5, beat, THEME[:8], 'str', 0.4, pan=-0.1)
    sc.melody(a + 0.5 + 12 * beat, beat, [('A4', 1), ('C5', 1), ('D5', 6)], 'pno', 0.36)
    sc.put('drm', S['end']['a'] + 0.6, taiko(0.4, big=True), 0)

    out = reverb(sc.mix(), 4.5, 0.4)[: int(TL['DURATION'] * SR)]
    # 段落动态：灯下最静，放手与尾声最满
    tt = np.arange(len(out)) / SR
    SW = S['letgo']['a'] + S['letgo']['sweep']
    dyn = np.interp(tt, [0, B('notes') - 3, B('notes'), S['trace']['a'], S['reason']['a'], S['lamp']['a'] + 1.5, B('lamp'), A('letgo', 'g2', 1), SW - 0.05, SW + 0.1, B('letgo'), S['grading']['a'], S['freehand']['a'] + 2, TL['DURATION']],
                    [0.7, 0.95, 0.8, 0.75, 0.8, 0.55, 0.6, 0.75, 0.45, 1.0, 0.95, 0.65, 1.0, 0.9])
    out *= dyn[:, None]
    return out / (np.max(np.abs(out)) + 1e-9) * 0.9
