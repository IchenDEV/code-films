"""《凡人》的音效设计（按镜头编排）。由 engine/pipeline/mix.py 执行：
这里可以直接使用 engine/pipeline/dsp.py 里的全部名字（总线 fx/dry、at/end/span、滤波与音效库）。
音乐由同目录的 score.py 负责；这里只放环境声与音效。
可选：设置 HARD = (开始秒, 结束秒)，混音时这一段会被清成纯静音（硬切）。"""

# ═════════ 序：火 ═════════
a, b = span('storm')
SK = S['storm']['skip']  # 暴雨开场裁掉的秒数
w = pink(idx(end('profileUp') + 2) - idx(a))
wind = bp(w, 140, 900) * 0.6 + bp(w, 900, 2400) * 0.15
n = len(wind)
gust = 0.4 + 0.6 * slow(n, 0.35, 1)[:n] ** 2
e = np.interp(np.arange(n) / SR + a, [a, a + 1.2, b - 6, b, end('profileUp') + 2], [0, 0.22, 0.16, 0.1, 0])
add(fx, a, wind * gust * e, -0.2)
for L in S['storm']['lightning']:
    t0 = a + L['t'] + L['delay']
    p = (L['x'] - 0.5) * 1.4
    n = int(6 * SR)
    tt = np.arange(n) / SR
    shape = np.minimum(1, tt / 0.08) * np.exp(-tt / (1.4 + L['power']))
    shape *= 0.6 + 0.4 * np.interp(tt, np.arange(0, 6.01, 0.15), rng.random(41))
    add(fx, t0, lp(brown(n), 160 + 120 * L['power']) * 3 * shape, p, 0.9 * L['power'])
    if L['power'] > 0.8:
        c = hp(noise(int(0.35 * SR)), 900) * np.exp(-np.arange(int(0.35 * SR)) / SR / 0.06)
        add(fx, t0 - 0.03, c, p, 0.25)
    add(fx, t0 + 0.4, lp(brown(n), 70) * np.exp(-tt / 2.5) * np.minimum(1, tt / 0.5) * 4, -p, 0.6 * L['power'])
for st in (8.55, 8.95, 9.15):
    add(fx, a + st - SK, click(0.08, 2500, 9000, 0.012), 0, 0.5)
pb = end('profileUp')
fire_layer(a + 9.0 - SK, pb + 0.5, [(a + 9.0 - SK, 0), (a + 9.3 - SK, 0.06), (a + 12.5 - SK, 0.2), (b - 1, 0.2), (b + 0.5, 0.3), (pb - 3, 0.26), (pb + 0.5, 0)], 0.05, 1)

# ═════════ 第一幕：神坛 ═════════
a, b = span('cave')
fire_layer(a, b + 0.5, [(a, 0), (a + 1.5, 0.09), (b - 1, 0.08), (b + 0.5, 0)], -0.5, 2)
# 天圆地方、伏羲女娲：五声音阶的拨弦
a, b = span('tianyuan')
a, b = span('fuxi')
# 创造亚当、努特、维特鲁威人：管风琴式的和声逐渐升起
a = S['adam']['a']; b = end('vitruvian')

# ═════════ 第一重：位置 ═════════
a, b = span('ptolemy')
# 一千四百年：越来越快的钟摆
t, step = at('ptolemy', 'b2'), 0.5
while t < at('ptolemy', 'b2_end') + 1.0:
    add(fx, t, click(0.03, 2000, 6000, 0.005), 0.3, 0.12); t += step; step = max(0.06, step * 0.86)
a, b = span('flammarion')
whoosh(a, b - a, 200, 2400, 0.15)
a, b = span('copernicus')
h0 = at('copernicus', 'b3', 0.2)
a, b = span('galileo')
a, b = span('zoom')
n = idx(b) - idx(a); tt = np.arange(n) / SR
add(fx, a, bp(pink(n), 60, 600) * np.interp(tt, [0, (b - a) * 0.4, (b - a) * 0.75, b - a], [0, 0.2, 0.28, 0.05]), 0)
a, b = span('paleblue')

# ═════════ 第二重：起源 ═════════
a, b = span('chain')
c2, c2e = at('chain', 'c2'), at('chain', 'c2_end')
a, b = span('darwin')
add(fx, a, hp(pink(idx(b) - idx(a)), 2500) * 0.015, 0.2)
a, b = span('ladder')
fall = at('ladder', 'c5', 0.3)
add(fx, fall + 1.6, lp(brown(int(2 * SR)), 120) * np.exp(-np.arange(int(2 * SR)) / SR / 0.4) * 4, 0, 0.5)
a, b = span('limbs')
n = idx(b) - idx(a)
add(fx, a, lp(brown(n) * 6, 220) * np.interp(np.arange(n) / SR, [0, 1, b - a - 1, b - a], [0, 0.3, 0.3, 0]), 0)
a, b = span('dna')
a, b = span('huxley')
a, b = span('tree')

# ═════════ 第三重：心智 ═════════
a, b = span('descartes')
a, b = span('neurons')
add(fx, a + 2.5, hp(noise(idx(b) - idx(a + 2.5)), 3000) * 0.013, 0)
for sp in S['neurons']['spikes']:
    add(fx, a + sp, click(0.012, 800, 5000, 0.002), 0.15, 0.55)
a, b = span('machines')
n = idx(end('making')) - idx(a); tt = np.arange(n) / SR + a
add(fx, a, sum(np.sin(2 * np.pi * 50 * h * tt) / h for h in (1, 2, 3, 5)) * np.interp(tt, [a, a + 1, end('making')], [0, 0.04, 0.07]), 0)
for c in S['machines']['cuts']:
    add(fx, a + c['t'], metal(180 + rng.random() * 300), rng.random() * 1.2 - 0.6, 0.12)
    m = int(0.6 * SR); cr = np.zeros(m)
    for j in rng.integers(0, m - 500, 40): cr[j:j + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 60)
    add(fx, a + c['t'], hp(cr, 2500) * np.exp(-np.arange(m) / m * 3), rng.random() - 0.5, 0.08)
# 节拍：从机械一直推到符号洪流
beats, tb = [], a
while tb < end('making') - 0.05:
    beats.append(tb)
    bpm = 100 + (tb - a) / (end('making') - a) * 80
    tb += 60 / bpm / 2
for i, bt in enumerate(beats):
    if i % 2 == 0:
        m = int(0.25 * SR); tt = np.arange(m) / SR
        k = np.sin(2 * np.pi * np.cumsum(90 * np.exp(-tt * 20) + 45) / SR) * np.exp(-tt / 0.12)
        add(fx, bt, k, 0, 0.3)
    else:
        add(fx, bt, click(0.03, 5000, 15000, 0.006), 0.35 * (1 if i % 4 == 1 else -1), 0.1)
# 图灵：打字机
a, b = span('turing')
t0 = a + max(0.3, S['turing']['d6'] - 0.2)
k = 0
for li, line in enumerate(['I PROPOSE TO CONSIDER THE QUESTION,', '"CAN MACHINES THINK?"']):
    for ch in line:
        if ch != ' ':
            add(dry, t0 + k * 0.045, click(0.03, 1200, 5000, 0.004) + np.pad(np.sin(2 * np.pi * 180 * np.arange(int(0.02 * SR)) / SR) * 0.3, (0, int(0.01 * SR))), 0.2, 0.12)
        k += 1
    k += 6
# 国际象棋：木子落盘
a, b = span('chess')
add(fx, a + 2.4, lp(click(0.08, 200, 2000, 0.02), 1500), 0, 0.8)
# 围棋：落子，以及那一手
a, b = span('go')
for i in range(36):
    add(fx, a + i * 2.2 / 36, click(0.04, 1800, 7000, 0.006), rng.random() - 0.5, 0.18)
t37 = a + S['go']['d8'] + 1.6
add(fx, t37, click(0.08, 1200, 6000, 0.012), 0.2, 0.9)
a, b = span('protein')
whoosh(a, b - a, 300, 6000, 0.1)
# 符号洪流：上扬，然后硬切
a, b = span('streams')
for c in S['streams']['cuts']:
    add(fx, a + c['t'], metal(220 + rng.random() * 400, 0.5), rng.random() * 1.2 - 0.6, 0.08)
# 能力曲线：光束扫过时的气流
a, b = span('curve')
whoosh(at('curve', 'd12', 0.2), max(1.5, S['curve']['d13'] - S['curve']['d12'] - 0.6), 120, 3000, 0.12)
# 本片的制作过程：噪声上扬直到硬切
a, b = span('making')
n = idx(b) - idx(a); tt = np.arange(n) / SR
add(fx, a, hp(pink(n), 1500) * (tt / tt[-1]) ** 3 * 0.28, 0)
for k in range(int((b - a) / 0.05)):  # 越来越快的数据声
    tk = a + (b - a) * (1 - (1 - k / int((b - a) / 0.05)) ** 0.5)
    add(fx, tk, click(0.01, 3000, 12000, 0.002), np.sin(k) * 0.6, 0.04 + 0.08 * k / int((b - a) / 0.05))
HARD = (end('making'), S['screen']['a'])

# 冷开场：房间底噪与键盘
a, b = span('coldopen')
n = idx(b) - idx(a)
add(dry, a, lp(pink(n), 500) * np.interp(np.arange(n) / SR, [0, 1, b - a], [0, 0.014, 0.014]), 0)
for c in S['coldopen']['typing'][0]['chars']:
    m = int(0.05 * SR); tt = np.arange(m) / SR
    kk = bp(noise(m), 1500, 6000) * np.exp(-tt / 0.006) + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.015) * 0.4
    add(dry, a + c['t'], kk, 0.25, 0.16 * (0.8 + 0.4 * rng.random()))

# 宇宙年历：时针扫过一年的嘀嗒，以及最后十一秒
a, b = span('cosmicyear'); d = b - a
for k in range(48):
    tk = a + 0.3 + (d * 0.42 - 0.3) * (k / 48) ** 0.8
    add(fx, tk, click(0.015, 2500, 8000, 0.003), 0.2, 0.06)
for k in range(11):
    add(fx, a + d * 0.8 + k * 0.22, click(0.03, 1500, 6000, 0.008), 0, 0.14)

# 屏幕
a, b = span('screen')
n = idx(b) - idx(a)
add(dry, a, lp(pink(n), 500) * np.interp(np.arange(n) / SR, [0, 2, b - a - 2, b - a], [0, 0.012, 0.012, 0]), 0)
typ = S['screen']['typing']
for c in typ[0]['chars']:
    m = int(0.05 * SR); tt = np.arange(m) / SR
    kk = bp(noise(m), 1500, 6000) * np.exp(-tt / 0.006) + np.sin(2 * np.pi * 140 * tt) * np.exp(-tt / 0.015) * 0.4
    add(dry, a + c['t'], kk, 0.25, 0.16 * (0.8 + 0.4 * rng.random()))
for item in typ[1:]:
    for c in item['chars']:
        m = int(0.03 * SR)
        add(dry, a + c['t'], np.sin(2 * np.pi * 2400 * np.arange(m) / SR) * np.exp(-np.arange(m) / SR / 0.004), -0.1, 0.02)

# ═════════ 尾声 ═════════
a, b = span('profiles')
fire_layer(a, a + (b - a) * 0.5, [(a, 0), (a + 1.5, 0.06), (a + (b - a) * 0.4, 0.05), (a + (b - a) * 0.5, 0)], 0.3, 4)
a, b = span('descend')
e4 = at('descend', 'e4')
e5 = at('recap', 'e5a')
n = idx(b) - idx(e5 - 1)
add(fx, e5 - 1, bp(pink(n), 150, 900) * np.interp(np.arange(n) / SR, [0, 3, n / SR], [0, 0.06, 0.04]), -0.2)
a, b = span('title')


# 收尾三重：每张图切入时一声低沉的击打
for lid in ('e5a', 'e5b', 'e5c'):
    tk = at('recap', lid, -0.15)
    m = int(1.6 * SR); tt = np.arange(m) / SR
    add(dry, tk, np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 6) + 38) / SR) * np.exp(-tt / 0.5), 0, 0.35)

# ═════════ 三幕之间：重物落地 ═════════

for j, L in enumerate([l for l in TL['labels'] if l['kind'] == 'label']):
    x = landing(300 + j)
    add(dry, L['a'] - 0.05, x, 0.0, 0.55)
    add(fx, L['a'] - 0.05, x, 0.0, 0.35)  # 带一点空间混响
