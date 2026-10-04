"""《凡人》配乐：一个 D 小调主题贯穿全片；每个段落按镜头表的时间编排，高潮与静默都和画面对位。
乐器与编曲工具来自 engine/pipeline/orchestra.py。
单独试听：在片子目录里运行 python3 ../../engine/pipeline/score_preview.py zh"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'engine', 'pipeline'))
from orchestra import *  # noqa: F401,F403

# 主题（四四拍，单位：拍）
THEME = [('D4', 1), ('A4', 1), ('D5', 2), ('C5', 1), ('Bb4', 1), ('A4', 2), ('G4', 1), ('A4', 1), ('Bb4', 1), ('G4', 1), ('A4', 4),
         ('D4', 1), ('A4', 1), ('D5', 2), ('F5', 1), ('E5', 1), ('D5', 2), ('C5', 1), ('Bb4', 1), ('G4', 1), ('A4', 1), ('D5', 4)]
THEME_CHORDS = ['Dm', 'Bb', 'Gm', 'Asus', 'Dm', 'Bb', 'C', 'Dm']


def theme(sc, t, beat, inst='str', vel=0.7, octave=0, half=None, chords=None, chord_inst='str', chord_vel=0.45, lo=3):
    """奏出主题（整段或上/下半句），可同时铺上主题和声"""
    notes = THEME if half is None else (THEME[:11] if half == 0 else THEME[11:])
    cs = THEME_CHORDS if half is None else (THEME_CHORDS[:4] if half == 0 else THEME_CHORDS[4:])
    if chords:
        for i, ch in enumerate(cs):
            sc.chord(t + i * 4 * beat, ch, 4 * beat * 1.02, chord_inst, chord_vel, lo=lo)
    return sc.melody(t, beat, notes, inst, vel, octave)


def build_score(TL):
    S = {s['kind']: s for s in TL['shots']}
    a = lambda k, line=None, off=0.0: S[k]['a'] + (S[k][line] if line else 0) + off
    b = lambda k: S[k]['b']
    sc = Score(TL['DURATION'])

    # ═══ 序：火 ═══  低音长音，起火后大提琴独奏主题的前半句
    s0 = a('storm')
    sc.put('str', s0 + 0.3, strings(hz('D2'), b('storm') - s0 - 1, 0.35, bright=900, attack=3), 0)
    sc.put('str', s0 + 0.3, strings(hz('A2'), b('storm') - s0 - 1, 0.22, bright=900, attack=4), 0.3)
    for L in S['storm']['lightning']:
        if L['power'] > 0.6:
            for k in range(14):  # 定音鼓滚奏，随雷声涌起
                sc.put('drm', a('storm') + L['t'] + L['delay'] - 0.7 + k * 0.05, timpani(hz('D2'), 0.05 + 0.02 * k * L['power']), -0.2)
    t_fire = a('storm') + 9.4 - S['storm']['skip']
    beat = 60 / 58
    sc.put('str', t_fire, strings(hz('D2'), b('profileUp') - t_fire + 1, 0.45, bright=1200, attack=2), -0.3)
    sc.melody(t_fire + 1.5, beat * 1.15, THEME[:11], 'str', 0.55, octave=-1, pan=-0.1)
    # 仰望星空：高音弦乐泛音
    for nt, p in (('A5', -0.5), ('D6', 0.5), ('E6', 0)):
        sc.put('str', a('profileUp', None, 2.5), strings(hz(nt), b('profileUp') - a('profileUp') + 2, 0.18, bright=5000, attack=3), p)

    # ═══ 第一幕：神坛 ═══
    # 洞穴：竖琴的五声音阶，持续低音
    t0, t1 = a('cave'), a('adam')
    sc.put('str', t0, strings(hz('D2'), t1 - t0 + 1, 0.4, bright=1000, attack=2), 0)
    sc.put('str', t0, strings(hz('A2'), t1 - t0 + 1, 0.3, bright=1000, attack=3), 0.2)
    penta = ['D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5']
    beat = 60 / 66
    t = t0 + 0.4; i = 0
    pattern = [0, 2, 3, 5, 4, 3, 2, 1, 0, 3, 5, 7, 6, 5, 3, 2]
    while t < t1 - 0.4:
        nt = penta[min(len(penta) - 1, pattern[i % len(pattern)] + (2 if (i // 16) % 2 else 0))]
        sc.put('hrp', t, harp(hz(nt), 0.55 + 0.15 * (i % 4 == 0)), np.sin(i * 0.7) * 0.5)
        t += beat / 2; i += 1
    # 天圆地方、伏羲女娲：手鼓般的太鼓，轻
    t = a('tianyuan', None, 0.6)
    while t < t1 - 0.5:
        sc.put('drm', t, taiko(0.35), 0); sc.put('drm', t + beat * 1.5, taiko(0.2), 0.1)
        t += beat * 4
    # 创造亚当 → 维特鲁威人：合唱进入，和声推进，主题由圆号奏出
    t0, t1 = a('adam'), a('ptolemy')
    prog = ['Dm', 'Bb', 'F', 'C']
    span = t1 - t0
    beat = 60 / 64
    bar = 4 * beat
    nb = max(1, int(span / bar))
    for k in range(nb + 1):
        ch = prog[k % 4]
        v = 0.35 + 0.4 * k / nb
        sc.chord(t0 + k * bar, ch, bar * 1.05, 'str', v, lo=3)
        sc.chord(t0 + k * bar, ch, bar * 1.05, 'cho', v * 0.9, lo=3, top=4)
        sc.put('str', t0 + k * bar, strings(hz(CHORDS[ch][0] + '2'), bar * 1.05, v, bright=1200), 0)
        sc.put('drm', t0 + k * bar, timpani(hz(CHORDS[ch][0] + '2') if CHORDS[ch][0] in ('D', 'C', 'Bb') else hz('F2'), 0.3 + 0.4 * k / nb), 0)
    sc.melody(a('vitruvian', None, 0.3), beat, THEME[:11], 'brs', 0.75, octave=-1, pan=0.1)
    sc.put('fx', t1 - 2.5, cymbal_swell(2.5), 0)

    # ═══ 第一重：位置 ═══
    # 托勒密：宏大的合唱与弦乐，主题在高音弦乐
    t0 = a('ptolemy'); beat = 60 / 60
    sc.put('drm', t0, taiko(1.0, big=True), 0); sc.put('fx', t0, crash(0.8), 0)
    theme(sc, t0, beat, 'str', 0.8, octave=0, chords=True, chord_inst='cho', chord_vel=0.55)
    for k in range(int((b('ptolemy') - t0) / (4 * beat)) + 1):
        sc.chord(t0 + k * 4 * beat, THEME_CHORDS[k % 8], 4 * beat * 1.02, 'brs', 0.35, lo=3, top=4)
        sc.put('drm', t0 + k * 4 * beat, taiko(0.6), 0)
    # 弗拉马利翁：弦乐震音上行
    t0, t1 = a('flammarion'), a('copernicus')
    for k, nt in enumerate(['D4', 'E4', 'F4', 'G4', 'A4']):
        tk = t0 + k * (t1 - t0) / 5
        for j in range(int((t1 - t0) / 5 / 0.07)):
            sc.put('str', tk + j * 0.07, pulse_note(hz(nt), 0.06, 0.25 + 0.08 * k), np.sin(j) * 0.3)
    sc.put('fx', t1 - 2.0, cymbal_swell(2.0), 0)
    # 哥白尼：转入降 B 大调，主题的大调变奏
    t0 = a('copernicus'); beat = 60 / 62
    sc.put('fx', t0, crash(0.6), 0)
    major = [('D5', 1), ('F5', 1), ('Bb5', 2), ('A5', 1), ('G5', 1), ('F5', 2), ('Eb5', 1), ('F5', 1), ('G5', 1), ('Eb5', 1), ('F5', 4)]
    for k, ch in enumerate(['Bb', 'F', 'Eb', 'F']):
        sc.chord(t0 + k * 4 * beat, ch, 4 * beat * 1.02, 'str', 0.5, lo=3)
        sc.chord(t0 + k * 4 * beat, ch, 4 * beat * 1.02, 'cho', 0.4, lo=3, top=4)
    sc.melody(t0 + 0.2, beat, major, 'brs', 0.65, octave=-1, pan=-0.1)
    # 伽利略：竖琴拨奏的轻快音型
    t0, t1 = a('galileo'), a('zoom'); beat = 60 / 76; t = t0; i = 0
    gal = ['Bb4', 'D5', 'F5', 'D5', 'A4', 'C5', 'F5', 'C5', 'G4', 'Bb4', 'Eb5', 'Bb4', 'A4', 'C5', 'F5', 'C5']
    while t < t1:
        sc.put('hrp', t, harp(hz(gal[i % 16]), 0.5), np.sin(i) * 0.4); t += beat / 2; i += 1
    sc.chord(t0, 'Bb', t1 - t0, 'str', 0.3, lo=3, attack=1.5)
    # 缩放：跳弓持续音型 + 太鼓，推向最大的高潮
    t0, t1 = a('zoom'), b('zoom') - 0.4
    beat = 60 / 72; bar = 4 * beat
    nb = int((t1 - t0) / bar)
    prog = ['Dm', 'Bb', 'F', 'C']
    for k in range(nb):
        tb = t0 + k * bar
        ch = prog[k % 4]; v = 0.3 + 0.7 * (k / max(1, nb - 1)) ** 1.3
        root = hz(CHORDS[ch][0] + '2')
        for e in range(8):
            sc.put('str', tb + e * beat / 2, pulse_note(root * (2 if e % 2 else 1), 0.13, 0.35 + 0.35 * v), -0.3)
            sc.put('str', tb + e * beat / 2, pulse_note(hz(CHORDS[ch][2] + '3'), 0.13, 0.25 * v), 0.3)
        sc.chord(tb, ch, bar * 1.03, 'str', 0.25 + 0.45 * v, lo=3)
        if k >= 1: sc.chord(tb, ch, bar * 1.03, 'cho', 0.5 * v, lo=3, top=4)
        if k >= 2: sc.chord(tb, ch, bar * 1.03, 'brs', 0.55 * v, lo=2, top=3)
        for e in (0, 2, 3) if k >= 2 else (0,):
            sc.put('drm', tb + e * beat, taiko(0.4 + 0.6 * v, big=(e == 0)), 0)
    if nb >= 4:
        sc.melody(t0 + 2 * bar, beat, THEME[:11], 'str', 0.85, octave=1, pan=0.1)
    sc.put('fx', t1 - 3, cymbal_swell(3), 0)
    for k in range(20): sc.put('drm', t1 - 2 + k * 0.1, timpani(hz('D2'), 0.1 + 0.04 * k), 0)
    # 暗淡蓝点：骤然安静，钢琴独奏主题
    t0 = a('paleblue')
    sc.put('drm', t0, taiko(1.0, big=True), 0); sc.put('fx', t0, crash(1.0), 0)
    sc.put('brs', t0, braam('D1', 5, 0.9), 0)
    sc.put('str', t0 + 0.5, strings(hz('A5'), b('paleblue') - t0, 0.12, bright=6000, attack=3), 0.3)
    sc.put('str', t0 + 0.5, strings(hz('D2'), b('paleblue') - t0, 0.25, bright=800, attack=3), 0)
    sc.melody(t0 + 2.2, 60 / 54, THEME[:11], 'pno', 0.5, octave=0)

    # ═══ 第二重：起源 ═══
    # 存在巨链：庄严的合唱圣咏
    t0, t1 = a('chain'), a('darwin')
    chorale = ['Dm', 'Gm', 'Bb', 'Asus', 'Dm', 'F', 'Gm', 'A', 'Dm']
    dch = (t1 - t0) / len(chorale)
    for k, ch in enumerate(chorale):
        sc.chord(t0 + k * dch, ch, dch * 1.05, 'cho', 0.55, lo=3, top=5)
        sc.chord(t0 + k * dch, ch, dch * 1.05, 'str', 0.3, lo=2, top=4)
    # 达尔文：钢琴的低语
    t0 = a('darwin')
    sc.melody(t0 + 0.3, 60 / 60, [('A4', 1), ('D5', 1), ('F5', 2), ('E5', 2)], 'pno', 0.45)
    # 阶梯倒下：重击，然后钢琴持续音型一路到生命之树
    tf = a('ladder', 'c5', 0.3) + 1.6
    sc.put('drm', tf, taiko(1.0, big=True), 0); sc.put('brs', tf, braam('D1', 4, 0.7), 0)
    t0, t1 = tf + 0.6, b('tree') - 1.5
    beat = 60 / 84; bar = 4 * beat
    prog = ['Dm', 'Bb', 'F', 'C']
    k = 0; t = t0
    while t < t1:
        ch = prog[k % 4]; notes = CHORDS[ch]
        pat = [notes[0] + '3', notes[1] + '3' if notes[1] != 'Db' else 'Db4', notes[2] + '3', notes[0] + '4', notes[2] + '3', notes[1] + '3' if notes[1] != 'Db' else 'Db4', notes[2] + '3', notes[0] + '4']
        prog_k = (t - t0) / (t1 - t0)
        for e, nt in enumerate(pat):
            sc.put('pno', t + e * beat / 2, piano(hz(nt), 1.5, 0.35 + 0.2 * (e == 0) + 0.15 * prog_k), (e - 3.5) * 0.1)
        sc.put('pno', t, piano(hz(notes[0] + '2'), 3, 0.45), 0)
        if t > a('dna'): sc.chord(t, ch, bar * 1.03, 'str', 0.2 + 0.35 * prog_k, lo=3)
        if t > a('huxley'): sc.put('brs', t, brass(hz(notes[0] + '3'), bar, 0.3 + 0.3 * prog_k), -0.2)
        if t > a('tree'):
            sc.chord(t, ch, bar * 1.03, 'cho', 0.4, lo=3, top=4)
            sc.put('drm', t, taiko(0.5), 0)
        t += bar; k += 1
    sc.melody(a('tree', None, 0.4), 60 / 84, THEME[11:], 'str', 0.75, octave=0, pan=0.1)
    tl = b('tree') - 4.2  # 章节标签：由音效里的“落地”承担

    # ═══ 第三重：心智 ═══
    t0, t1 = a('descartes'), a('neurons')
    sc.put('str', t0, strings(hz('D2'), t1 - t0 + 1, 0.4, bright=900, attack=2), 0)
    sc.put('str', t0, strings(hz('A2'), t1 - t0 + 1, 0.3, bright=900, attack=2), 0.2)
    sc.melody(t0 + 1.0, 60 / 56, THEME[:11], 'str', 0.5, octave=-1, pan=-0.2)
    # 神经：轻的电子脉冲，与放电同步
    t0 = a('neurons')
    sc.put('str', t0, strings(hz('D3'), b('neurons') - t0, 0.25, bright=1500, attack=2), 0)
    for sp in S['neurons']['spikes']:
        sc.put('fx', t0 + sp, arp_note(hz('A5'), 0.05, 0.12), 0.3)
    # 机器 → 符号洪流：琶音、鼓、铜管，一路加速
    t0, t1 = a('machines'), b('making')
    t = t0; i = 0
    arp = ['D4', 'A4', 'D5', 'F5', 'A5', 'F5', 'D5', 'A4']
    prog = ['Dm', 'Bb', 'F', 'C']
    last_bar = -1
    while t < t1 - 0.02:
        frac = (t - t0) / (t1 - t0)
        bpm = 96 + 44 * frac
        st = 60 / bpm / 4
        bar_i = int(i / 16)
        ch = prog[bar_i % 4]
        shift = {'Dm': 0, 'Bb': -4, 'F': 3, 'C': -2}[ch]
        sc.put('fx', t, arp_note(transpose(arp[i % 8], shift), st * 0.9, 0.22 + 0.25 * frac), np.sin(i * 0.5) * 0.5)
        if i % 4 == 0:
            sc.put('drm', t, taiko(0.45 + 0.5 * frac, big=(i % 16 == 0)), 0)
        if i % 8 == 4:
            sc.put('drm', t, hp(taiko(0.3 + 0.3 * frac), 300) * 0.7, 0.2)
        if bar_i != last_bar:
            sc.chord(t, ch, st * 16 * 1.02, 'str', 0.25 + 0.5 * frac, lo=3)
            if frac > 0.35: sc.chord(t, ch, st * 16 * 1.02, 'brs', 0.3 + 0.5 * frac, lo=2, top=3)
            if frac > 0.6: sc.chord(t, ch, st * 16 * 1.02, 'cho', 0.5 * frac, lo=3, top=4)
            last_bar = bar_i
        t += st; i += 1
    t37 = a('go', 'd8', 1.6)
    sc.put('drm', t37, taiko(1.0, big=True), 0); sc.put('brs', t37, braam('D1', 3, 0.8), 0); sc.put('fx', t37, crash(0.6), 0)
    sc.put('fx', t1 - 4, cymbal_swell(4), 0)
    for k in range(int(4 / 0.06)):
        sc.put('drm', t1 - 4 + k * 0.06, timpani(hz('D2'), 0.05 + 0.25 * (k * 0.06 / 4) ** 2), 0)

    # ═══ 屏幕：寂静，只有稀疏的钢琴 ═══
    t0 = a('screen', None, 4.0)
    for k, nt in enumerate(['D4', 'A3', 'F4', 'E4', 'D4']):
        sc.put('pno', t0 + k * 3.0, piano(hz(nt), 3, 0.28), 0)

    # ═══ 尾声 ═══
    t0 = a('profiles')
    sc.put('str', t0, strings(hz('D2'), b('profiles') - t0 + 1, 0.35, bright=900, attack=3), 0)
    sc.melody(t0 + 1.5, 60 / 56, THEME[:11], 'pno', 0.45)
    # 走下神坛：主题完整地、宽广地回来，合唱与弦乐
    t0 = a('descend'); beat = (b('recap') - t0 - 1) / 32  # 主题横跨“走下神坛”与收尾三重
    theme(sc, t0, beat, 'str', 0.8, octave=0, chords=True, chord_inst='cho', chord_vel=0.5)
    for k, ch in enumerate(THEME_CHORDS):
        sc.chord(t0 + k * 4 * beat, ch, 4 * beat * 1.02, 'str', 0.45, lo=2, top=4)
        if k >= 4: sc.chord(t0 + k * 4 * beat, ch, 4 * beat * 1.02, 'brs', 0.35, lo=2, top=3)
        sc.put('drm', t0 + k * 4 * beat, timpani(hz('D2') if ch in ('Dm', 'Bb', 'Gm') else hz('A1'), 0.35), 0)
    # 我们很平凡：只剩一个空五度
    t0 = a('black')
    sc.chord(t0, 'D5', b('black') - t0 + 1, 'str', 0.3, lo=3, top=4)
    # 片名
    t0 = a('title', None, 0.8)
    sc.put('drm', t0, taiko(1.0, big=True), 0); sc.put('brs', t0, braam('D1', 6, 0.9), 0); sc.put('fx', t0, crash(0.8), 0)
    sc.chord(t0, 'D5', b('title') - t0 + 2, 'cho', 0.55, lo=3, top=5)
    sc.chord(t0, 'D5', b('title') - t0 + 2, 'str', 0.4, lo=2, top=5)
    sc.melody(a('credits', None, 0.3), 60 / 54, [('D5', 2), ('A4', 2), ('F4', 2), ('D4', 4)], 'pno', 0.4)

    out = reverb(sc.mix(), 4.2, 0.34)
    out = out[: int(TL['DURATION'] * SR)]
    out /= np.sqrt(np.mean(out ** 2)) + 1e-9
    # 段落动态：安静处真的安静，高潮真的推上去（单位 dB）
    P = [(0, -40), (a('storm') - 0.01, -40), (a('storm'), -16), (b('storm') - 2, -12), (b('profileUp'), -10), (a('cave'), -12), (a('tianyuan'), -10), (a('adam'), -9),
         (b('vitruvian') - 0.5, -2), (a('ptolemy'), 0), (b('ptolemy'), -3), (a('flammarion'), -6), (a('copernicus'), -3),
         (a('galileo'), -9), (a('zoom'), -10), (b('zoom') - 0.6, 3), (a('cosmicyear'), -2), (b('cosmicyear') - 0.5, -6), (a('paleblue'), 2), (a('paleblue') + 1.8, -13),
         (b('paleblue') - 4.5, -13), (b('paleblue') - 4.2, -11), (b('paleblue'), -9), (a('chain'), -7), (b('chain'), -7),
         (a('darwin'), -12), (a('ladder', 'c5', 1.8), -12), (a('ladder', 'c5', 2.0), -3), (a('limbs'), -8), (a('huxley'), -5),
         (a('tree'), -3), (b('tree') - 4.4, -3), (b('tree') - 4.2, -6), (b('tree'), -7), (a('descartes'), -10), (a('neurons'), -13),
         (a('machines'), -8), (a('go'), -4), (a('go', 'd8', 1.6), 1), (a('protein'), -3), (a('talk'), -2), (a('accel'), 0), (a('streams'), 1), (a('curve'), -3), (a('making'), -1), (b('making') - 0.1, 3), (b('making'), -40),
         (a('screen'), -40), (a('screen', None, 3.5), -16), (b('screen') - 4.4, -14), (b('screen') - 4.2, -14), (b('screen'), -12),
         (a('profiles'), -12), (a('descend'), -8), (a('descend', 'e4'), -2), (a('recap'), -1), (b('recap'), -5),
         (a('black'), -12), (b('black'), -12), (a('title', None, 0.7), -12), (a('title', None, 0.9), 0), (b('title'), -6), (b('credits'), -14)]
    ts, gs = zip(*sorted(P))
    gain = 10 ** (np.interp(np.arange(len(out)) / SR, ts, gs) / 20)
    out *= gain[:, None]
    return out / (np.max(np.abs(out)) + 1e-9) * 0.9
