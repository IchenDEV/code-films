"""《初生牛犊》的音效：印刷机、贴纸、纸团、气泡、齿轮、火箭……由 engine/pipeline/mix.py 执行。"""

def L(kind, line, frac=0.0):
    s = S[kind]; return s['a'] + s[line] + frac * (s[line + '_end'] - s[line])

def pop(t, g=0.2, p=0.0, f=900):
    """贴纸“啪”地贴上"""
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-tt * 40))) / SR) * np.exp(-tt / 0.05) + click(0.25, 1500, 7000, 0.004) * 0.8
    add(fx, t, x, p, g)

def thunk(t, g=0.3, p=0.0):
    """印版压下"""
    n = int(0.5 * SR); tt = np.arange(n) / SR
    add(fx, t, np.sin(2 * np.pi * np.cumsum(80 + 120 * np.exp(-tt * 35)) / SR) * np.exp(-tt / 0.08) + lp(noise(n), 1800) * np.exp(-tt / 0.01) * 0.5, p, g)

def bubble(t, f, g=0.1, p=0.0):
    n = int(0.2 * SR); tt = np.arange(n) / SR
    add(fx, t, np.sin(2 * np.pi * np.cumsum(f * (1 + 2.5 * tt / 0.2)) / SR) * np.exp(-tt / 0.05), p, g)

def crumple(t, dur=0.6, g=0.15, p=0.0, seed=1):
    r = np.random.default_rng(seed); n = int(dur * SR); out = np.zeros(n)
    for i in r.integers(0, n - 800, int(dur * 70)):
        m = int(r.integers(100, 700)); out[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (m / 4))
    add(fx, t, bp(out, 1200, 8000), p, g)

def tick(t, g=0.08, p=0.0):
    add(fx, t, click(0.03, 2500, 8000, 0.003), p, g)

# 纸面的空气
add(fx, 0, bp(pink(N), 200, 1500) * 0.03 * env([(0, 0), (1, 1), (DUR - 2, 1), (DUR, 0)]), 0)

# 片名
a = S['title']['a']; thunk(a + 0.3, 0.35); thunk(a + 0.7, 0.3, 0.2)
for k in range(10): tick(a + 0.2 + k * 0.3, 0.05, -0.5 + k * 0.1)

# 01 梯子
a = S['ladder']['a']
for k in range(14): add(fx, a + 0.3 + k * 0.32, click(0.05, 600, 2500, 0.01), 0, 0.1)
for i in range(3): pop(L('ladder', 'p1', 0.35 + i * 0.15), 0.18, 0.3, 700 + i * 200)
for k in range(5): bubble(L('bubble', 't1', 0.25 + k * 0.1), 1400 + k * 120, 0.04)
a = S['crab']['a']
for k in range(9): pop(a + 0.2 + k * 0.08, 0.06, -0.6, 1200)
for k in range(30): tick(a + 0.7 + k * 0.17, 0.05, -0.4 + k * 0.02)
for i in range(4): pop(L('crab', 't4') + 0.9 + i * 0.35, 0.16, 0.5, 900 + i * 150)
a, b = span('deep')
add(fx, a, lp(brown(idx(b) - idx(a)), 300) * 0.25 * np.interp(np.arange(idx(b) - idx(a)) / SR, [0, 1, b - a - 1, b - a], [0, 1, 1, 0]), 0)
for k in range(24): bubble(a + 0.3 + k * 0.45 + 0.13 * (k % 3), 600 + (k * 137) % 900, 0.05, (k % 5 - 2) * 0.3)
t5, t5e = L('deep', 't5'), L('deep', 't5', 1)
for k in range(10): add(fx, t5 + 0.72 * (t5e - t5) + k * 0.12, metal(400 + 40 * k, 0.4), 0.2, 0.05)

# 02 潮水：每枚型号邮票盖下去
gens = [('g2', 0.05), ('g2', 0.5), ('g3', 0.05), ('g3', 0.42), ('g4', 0.05)]
for i, (ln, f) in enumerate(gens): thunk(L('tanks', ln, f), 0.32, -0.6 + 0.3 * i)
pop(L('tanks', 'g4', 0.5), 0.2, 0.5, 1300)
g5, g5e = L('maps', 'g5'), L('maps', 'g5', 1)
whoosh(g5 + 0.3 * (g5e - g5), 0.55 * (g5e - g5), 300, 3000, 0.12)
thunk(g5 + 0.86 * (g5e - g5), 0.3)
g6, g6e = L('rope', 'g6'), L('rope', 'g6', 1)
for i in range(6): pop(g6 + 0.55 * (g6e - g6) + i * 0.4 + 0.2, 0.14, 0.3, 1000 + i * 130)

# 03 怪人
pop(L('bricks', 'w1') + 0.2, 0.3, 0.6, 500)
w2, w2e = L('bricks', 'w2'), L('bricks', 'w2', 1)
for i in range(24): add(fx, w2 + i * (w2e - w2) / 24, click(0.04, 800, 4000, 0.008), -0.3, 0.1)
w3, w3e = L('layers', 'w3'), L('layers', 'w3', 1)
whoosh(w3 + 0.3, 0.45 * (w3e - w3), 200, 2500, 0.08, -0.4)
for i in range(26): tick(w3 + 0.5 * (w3e - w3) + i * 0.5 * (w3e - w3) / 26, 0.05, 0.5)
pop(L('layers', 'w4', 0.55), 0.3, 0, 600)
w5, w5e = L('envfile', 'w5'), L('envfile', 'w5', 1)
pop(w5 + 0.5 * (w5e - w5), 0.3, 0.4, 450)
whoosh(w5 + 0.55 * (w5e - w5), 0.25 * (w5e - w5), 300, 2000, 0.08)

# 04 扔掉
y1 = L('trash', 'y1')
for i in range(6):
    t0 = y1 + 0.2 + i * 0.35
    whoosh(t0, 1.0, 300, 5000, 0.08, -0.6 + 0.25 * i)
    if i % 3 == 1: add(fx, t0 + 0.8, lp(noise(int(0.5 * SR)), 900) * np.exp(-np.arange(int(0.5 * SR)) / SR / 0.1) * 0.6, -0.6 + 0.25 * i, 0.5)
y3, y3e = L('trash', 'y3'), L('trash', 'y3', 1)
crumple(y3 + 0.2 * (y3e - y3), 0.6, 0.18, 0.4)
thunk(y3 + 0.8 * (y3e - y3), 0.3, 0.6)
y4, y4e = L('tower', 'y4'), L('tower', 'y4', 1)
b0, b1 = y4 + 0.3 * (y4e - y4), y4 + 0.7 * (y4e - y4)
for i in range(22): add(fx, b0 + i * (b1 - b0) / 22, click(0.05, 500, 3000, 0.01), 0, 0.12)
for k in range(int((b1 - b0) / 0.06)): tick(b0 + k * 0.06, 0.04, -0.6)
pop(y4 + 0.78 * (y4e - y4), 0.3, 0.4, 700)

# 05 目标
o1, o1e = L('shells', 'o1'), L('shells', 'o1', 1)
whoosh(o1 + 0.2, 0.5 * (o1e - o1), 600, 6000, 0.12, -0.5)
thunk(o1 + 0.7 * (o1e - o1), 0.35)
o2, o2e = L('shells', 'o2'), L('shells', 'o2', 1)
add(fx, o2 + 0.35 * (o2e - o2), click(0.08, 900, 3000, 0.02), -0.4, 0.3)
for i in range(6): pop(o2 + 0.62 * (o2e - o2) + i * 0.15, 0.08, 0.3, 1500 + i * 100)

# 06 我错了
x1 = L('fence', 'x1'); pop(x1 + 0.6, 0.25, 0, 600)
x2, x2e = L('fence', 'x2'), L('fence', 'x2', 1)
whoosh(x2 + 0.25 * (x2e - x2), 0.5 * (x2e - x2), 300, 4000, 0.15, 0.3)
x3, x3e = L('wrong', 'x3'), L('wrong', 'x3', 1)
thunk(x3 + 0.1 * (x3e - x3), 0.5); thunk(x3 + 0.14 * (x3e - x3), 0.4, 0.2)
x4, x4e = L('wrong', 'x4'), L('wrong', 'x4', 1)
for i in range(4): pop(x4 + (0.05 + i * 0.18) * (x4e - x4), 0.22, (-1) ** i * 0.4, 700 + i * 120)
a, b = span('weird')
for i in range(40): pop(a + 0.1 + i * 0.05 + (i % 3) * 0.01, 0.05, (i % 7 - 3) / 3, 900 + (i * 91) % 1200)
crumple(a + 1.0, b - a - 2, 0.06, 0, 7)
thunk(L('weird', 'x5') + 0.1, 0.45)
a = S['end']['a']; thunk(a + 0.3, 0.3); thunk(a + 0.55, 0.25, 0.2)
