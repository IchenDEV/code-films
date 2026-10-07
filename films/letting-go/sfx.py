"""《放手》的音效：纸、墨、印、水、灯。由 engine/pipeline/mix.py 执行，可直接使用 dsp.py 的全部名字。
时刻与画面共用时间轴；镜头内的动作时刻与 shots/*.js 里的公式保持一致。"""


def L(kind, line, frac=0.0):
    s = S[kind]
    return s['a'] + s[line] + frac * (s[line + '_end'] - s[line])


def stamp(t, g=0.5, p=0.0, seed=0):
    """印章或浆糊纸落下：闷的身体 + 纸面的一下"""
    r = np.random.default_rng(seed)
    n = int(0.6 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-tt * 40)) / SR) * np.exp(-tt / 0.09)
    slap = lp(r.standard_normal(n), 2200) * np.exp(-tt / 0.012) * 0.6
    grit = bp(r.standard_normal(n), 900, 3500) * np.exp(-tt / 0.04) * 0.2
    add(fx, t, (body + slap + grit) * np.minimum(1, tt / 0.001), p, g)


def brush(t0, dur, g=0.1, p=0.0, seed=0):
    """毛笔划过纸面：带起伏的沙沙声"""
    n = int(dur * SR)
    if n <= 0: return
    tt = np.arange(n) / SR
    x = bp(pink(n), 1500, 6000) + bp(pink(n), 350, 1400) * 0.5
    e = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 0.6 * (0.65 + 0.35 * np.interp(tt, np.linspace(0, dur, 12), np.random.default_rng(seed).random(12)))
    add(fx, t0, x * e, p, g)


def rustle(t0, dur, g=0.1, p=0.0, seed=0):
    """纸张翻动、飘落"""
    r = np.random.default_rng(seed)
    n = int(dur * SR); tt = np.arange(n) / SR
    grid = np.arange(0, dur + 0.1, 0.05)
    flut = np.interp(tt, grid, r.random(len(grid)) ** 3)
    e = np.interp(tt, [0, dur * 0.15, dur * 0.7, dur], [0, 1, 0.7, 0])
    add(fx, t0, bp(noise(n), 1800, 9000) * flut * e, p, g)


def drop(t, f=900, g=0.25, p=0.0):
    """一滴水 / 石头入水"""
    n = int(0.5 * SR); tt = np.arange(n) / SR
    plink = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.9 * (1 - np.exp(-tt * 28)))) / SR) * np.exp(-tt / 0.09)
    plop = lp(noise(n), 500) * np.exp(-tt / 0.05) * 0.5
    add(fx, t, (plink * 0.6 + plop) * np.minimum(1, tt / 0.002), p, g)


def wood(t, g=0.2, p=0.0):
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 820 * tt) * np.exp(-tt / 0.025) + np.sin(2 * np.pi * 1730 * tt) * 0.4 * np.exp(-tt / 0.015)
    add(fx, t, x + click(0.25, 800, 4000, 0.006), p, g)


def crackle(t0, dur, g=0.15, p=0.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR); out = np.zeros(n)
    for i in r.integers(0, max(1, n - 2000), int(dur * 18)):
        m = int(r.integers(60, 500))
        out[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (m / 5)) * (0.3 + r.random())
    add(fx, t0, bp(out, 900, 6000), p, g)


# —— 整片的屋内空气：很轻的风 ——
nn = N
air = bp(pink(nn), 120, 900) * 0.5
air *= 0.6 + 0.4 * slow(nn, 0.2, 3)[:nn]
add(fx, 0, air * env([(0, 0), (2, 0.05), (DUR - 4, 0.05), (DUR, 0)]), 0, 0.8)

# ═══ 序：告示一张张贴上 ═══
a = S['notes']['a']; T1 = S['notes']['o2_end'] + 0.3
for i in range(28):
    t = a + 1.0 + (T1 - 1.0) * (i / 27) ** 0.55
    stamp(t, 0.22 + 0.18 * (i / 27), (i % 5 - 2) * 0.25, i)
# 风把它们吹走
a = S['thesis']['a']
whoosh(a + 1.2, 3.2, 200, 3000, 0.28, 0.3)
rustle(a + 1.4, 4.2, 0.22, 0.4, 2)
brush(L('thesis', 'o4') + 0.1, 2.1, 0.14, 0.1, 3)
stamp(L('thesis', 'o5') + 0.25, 0.4, -0.4, 4)
brush(L('thesis', 'o5') + 1.3, 2.3, 0.1, 0.4, 5)

# ═══ 片名 ═══
a = S['title']['a']
brush(a + 0.8, 1.1, 0.12, -0.15, 6); brush(a + 1.7, 1.1, 0.12, 0.15, 7)
stamp(a + 3.05, 0.45, 0.3, 8)

# ═══ 年代卡：历史线向前延伸 ═══
for n in range(1, 9):
    a = S[f'era{n}']['a']
    brush(a + 0.35, 1.0, 0.07, -0.3, 200 + n)
    stamp(a + 0.95, 0.3, 0.0, 210 + n)
    brush(a + 0.9, 0.9, 0.07, 0.2, 220 + n)

# ═══ 一 · 续写 ═══
t2, t2e, t3 = L('trace', 'a2'), L('trace', 'a2', 1), L('trace', 'a3')
dt = (t2e - 0.1 - (t2 + 0.2)) / 6
for j in range(6):
    brush(t2 + 0.2 + j * dt, dt * 1.4, 0.05, -0.3 + 0.12 * j, 20 + j)
brush(t3 + 0.3, 1.1, 0.12, 0.3, 40)

# ═══ 二 · 嘱咐 ═══
b1, b1e, b2, b2e, b3, b3e = L('letter', 'b1'), L('letter', 'b1', 1), L('letter', 'b2'), L('letter', 'b2', 1), L('letter', 'b3'), L('letter', 'b3', 1)
brush(b1 + 0.62 * (b1e - b1), b1e + 0.3 - (b1 + 0.62 * (b1e - b1)), 0.08, 0.3, 50)
brush(b2 + 0.25 * (b2e - b2), b2e + 0.2 - (b2 + 0.25 * (b2e - b2)), 0.07, 0.1, 51)
whoosh(b3 + 0.1, 0.8, 600, 5000, 0.12, 0.2)  # 朱笔划掉
for i, f in enumerate([0.5, 0.67, 0.84]):
    brush(b3 + f * (b3e - b3), 0.9, 0.08, -0.1 * i, 52 + i)
stamp(b3 + 0.84 * (b3e - b3) + 1.25, 0.3, -0.2, 56)
b4, b4e = L('frames', 'b4'), L('frames', 'b4', 1)
F0 = b4 + 0.2 * (b4e - b4); F1 = b4 + 0.78 * (b4e - b4)
for i in range(10):
    wood(F0 + i * (F1 - F0) / 9, 0.12 + 0.02 * i, (i % 3 - 1) * 0.3)

# ═══ 三 · 步骤 ═══
c1, c1e = L('stones', 'c1'), L('stones', 'c1', 1)
S0 = c1 + 0.36 * (c1e - c1); S1 = c1e + 0.4
for i in range(7):
    drop(S0 + i * (S1 - S0) / 6, 700 + 60 * i, 0.22, -0.7 + 0.23 * i)
brush(c1 + 0.55 * (c1e - c1), c1e + 0.2 - (c1 + 0.55 * (c1e - c1)), 0.07, 0, 59)
a, b = span('stones')
n = idx(b) - idx(a)
add(fx, a, bp(pink(n), 300, 2000) * np.interp(np.arange(n) / SR, [0, 1.5, b - a - 1.5, b - a], [0, 0.05, 0.05, 0]), 0)
c2, c2e = L('stones', 'c2'), L('stones', 'c2', 1)
brush(c2 + 0.5 * (c2e - c2), c2e + 1.6 - (c2 + 0.5 * (c2e - c2)), 0.07, 0.5, 60)
a = S['scholars']['a']
for i in range(5):
    add(fx, a + 0.4 + i * 0.32, click(0.05, 500, 2500, 0.01), (i - 2) * 0.3, 0.12)
c3, c3e = L('scholars', 'c3'), L('scholars', 'c3', 1)
stamp(c3 + 0.3, 0.22, 0, 61)
whoosh(c3 + 0.55 * (c3e - c3), 1.9, 300, 1500, 0.08)

# ═══ 四 · 补丁 ═══
d1, d1e, d2, d2e = L('patches', 'd1'), L('patches', 'd1', 1), L('patches', 'd2'), L('patches', 'd2', 1)
a, b = span('patches')
crackle(a + 0.4, d1 + 0.35 * (d1e - d1) - (a + 0.4), 0.12, -0.4, 70)
for i in range(5):
    stamp(d1 + 0.3 * (d1e - d1) + i * 0.4, 0.22, 0.5, 71 + i)
stamp(d2 + 0.12, 0.35, -0.3, 77)
crackle(d2 + 0.3 * (d2e - d2), 0.48 * (d2e - d2), 0.12, 0.1, 78)
add(fx, d2 + 0.76 * (d2e - d2), click(0.06, 1200, 6000, 0.01), 0.3, 0.35)  # 名字卡裂开
stamp(d2e + 0.12, 0.35, 0.1, 79)
crackle(d2e + 0.5, b - d2e - 0.4, 0.1, 0.4, 80)
d3, d3e = L('scroll', 'd3'), L('scroll', 'd3', 1)
whoosh(d3 + 0.05 * (d3e - d3), 0.37 * (d3e - d3), 200, 1800, 0.08)
stamp(d3 + 0.74 * (d3e - d3), 0.5, -0.2, 81)

# ═══ 五 · 推理 ═══
a = S['reason']['a']
e2, e2e = L('reason', 'e2'), L('reason', 'e2', 1)
brush(a + 0.6, e2e + 0.2 - (a + 0.6), 0.08, -0.3, 90)
brush(e2 + 0.75 * (e2e - e2), 1.6, 0.07, -0.5, 91)

# ═══ 六 · 上下文：灯 ═══
a, b = span('lamp')
fire_layer(a + 0.2, b, [(a + 0.2, 0), (a + 1.5, 0.05), (b - 1.4, 0.05), (b, 0)], -0.2, 5)
e4, e4e = L('lamp', 'e4'), L('lamp', 'e4', 1)
for i in range(3):
    stamp(e4 + 0.56 * (e4e - e4) + i * 0.32, 0.25, -0.5 + 0.3 * i, 92 + i)

# ═══ 七 · 放手：一笔圆相 ═══
a = S['letgo']['a']
g1, g1e, g2, g2e = L('letgo', 'g1'), L('letgo', 'g1', 1), L('letgo', 'g2'), L('letgo', 'g2', 1)
SW = a + S['letgo']['sweep']
brush(a + 0.3, g1 + 0.4 * (g1e - g1) - (a + 0.3), 0.1, -0.3, 100)
for k in range(7):
    rustle(g1 + 0.5 * (g1e - g1) + k * 0.16, 2.0, 0.06, 0.4, 101 + k)
whoosh(g2 + 0.32 * (g2e - g2), 0.5, 600, 5000, 0.12, 0.4)
rustle(g2 + 0.6 * (g2e - g2), 2.0, 0.08, 0.5, 109)
brush(g2 + 0.7 * (g2e - g2), g2e + 0.5 - (g2 + 0.7 * (g2e - g2)), 0.07, 0.5, 110)
# 挥笔：一口气，带着风声；墨点甩出；印落下
whoosh(SW - 0.25, 0.4, 400, 4000, 0.25, -0.2)
brush(SW - 0.06, 0.95, 0.3, 0.1, 111)
add(dry, SW + 0.02, boom(52, 2.5, 0.8), 0, 0.22)
for i in range(5):
    add(fx, SW + 0.7 + i * 0.03, click(0.03, 900, 5000, 0.006), 0.3 + 0.1 * i, 0.2)
stamp(SW + 1.35, 0.55, 0.2, 112)

# ═══ 八 · 今后：改稿 ═══
f0, f0e = L('grading', 'f0'), L('grading', 'f0', 1)
stamp(S['grading']['a'] + 0.55, 0.35, 0.4, 113)
for i in range(6):
    brush(f0 + (0.32 + i * 0.1) * (f0e - f0), 0.45, 0.06, -0.3, 114 + i)

# ═══ 尾声 ═══
f2, f2e = L('seals', 'f2'), L('seals', 'f2', 1)
for i, f in enumerate([0.02, 0.23, 0.45, 0.66]):
    stamp(f2 + f * (f2e - f2) + 0.06, 0.55, (i - 1.5) * 0.3, 120 + i)
brush(f2 + 0.84 * (f2e - f2), f2e + 1.2 - (f2 + 0.84 * (f2e - f2)), 0.1, 0, 125)
f3, f3e = L('freehand', 'f3'), L('freehand', 'f3', 1)
brush(f3 - 0.2, f3e + 1.4 - f3, 0.1, 0, 126)
stamp(end('freehand') - 3.35, 0.45, -0.5, 127)
a = S['end']['a']
stamp(a + 3.05, 0.3, 0.3, 128)
