"""《编制》的音效：纸片落下、橡皮章、纸条飞过、钟表、剪刀、档案……由 engine/pipeline/mix.py 执行。"""

def L(kind, line, frac=0.0):
    s = S[kind]; return s['a'] + s[line] + frac * (s[line + '_end'] - s[line])

def slap(t, g=0.25, p=0.0, seed=1):
    """一张纸片拍在桌上"""
    n = int(0.25 * SR); tt = np.arange(n) / SR
    r = np.random.default_rng(seed)
    x = bp(r.standard_normal(n), 300, 5000) * np.exp(-tt / 0.03) + np.sin(2 * np.pi * np.cumsum(110 + 90 * np.exp(-tt * 40)) / SR) * np.exp(-tt / 0.05) * 0.6
    add(fx, t, x, p, g)

def thud(t, g=0.4, p=0.0):
    """沉一点的落下：橡皮章、桌子"""
    n = int(0.6 * SR); tt = np.arange(n) / SR
    add(fx, t, np.sin(2 * np.pi * np.cumsum(60 + 110 * np.exp(-tt * 30)) / SR) * np.exp(-tt / 0.12) + lp(noise(n), 1500) * np.exp(-tt / 0.015) * 0.6, p, g)

def flutter(t, dur=0.5, g=0.08, p=0.0, seed=2):
    """纸条飞过"""
    r = np.random.default_rng(seed); n = int(dur * SR); tt = np.arange(n) / SR
    am = 0.5 + 0.5 * np.sin(2 * np.pi * (18 + 8 * r.random()) * tt)
    add(fx, t, bp(r.standard_normal(n), 1500, 7000) * am * np.sin(np.pi * tt / dur), p, g)

def tk(t, g=0.06, p=0.0):
    add(fx, t, click(0.03, 2500, 8000, 0.003), p, g)

def pop(t, g=0.15, p=0.0, f=800):
    n = int(0.22 * SR); tt = np.arange(n) / SR
    add(fx, t, np.sin(2 * np.pi * np.cumsum(f * (1 + 1.0 * np.exp(-tt * 40))) / SR) * np.exp(-tt / 0.05) + click(0.22, 1500, 6000, 0.004) * 0.5, p, g)

def snip(t, g=0.2, p=0.0):
    """剪刀"""
    for k, dt in enumerate((0, 0.09)):
        add(fx, t + dt, click(0.06, 3000, 10000, 0.012) + metal(2400 + 300 * k, 0.15)[: int(0.06 * SR)] * 0.3, p, g)

# 纸面的空气
add(fx, 0, bp(pink(N), 200, 1500) * 0.025 * env([(0, 0), (1, 1), (DUR - 2, 1), (DUR, 0)]), 0)

# 片名：方格一个个落下，楔子刺进来
a = S['title']['a']
for i in range(24): slap(a + 0.15 + i * 0.03, 0.04, (i % 6 - 2.5) / 3, i)
whoosh(a + 1.3, 0.8, 200, 5000, 0.2, 0.6)
thud(a + 2.1, 0.45); thud(a + 0.6, 0.2, -0.4)

# 冷开场
bugt = S['tower']['a'] + 0.2; pop(bugt, 0.12, 0.6, 1200)
for i, q in enumerate([0.27, 0.34, 0.42, 0.48, 0.55]): slap(L('tower', 'n1', q) + 0.4, 0.3, -0.5 + i * 0.2, i + 3)
thud(L('tower', 'n1', 0.82) + 0.45, 0.45)
a, b = span('chatter')
for i in range(int((b - a) / 0.31)): tk(a + i * 0.31, 0.05, 0.6)
for i in range(16): flutter(a + 0.3 + i * 0.45, 0.4, 0.05, (i % 5 - 2) * 0.3, i)
for q in (0.18, 0.48, 0.76): flutter(L('chatter', 'n2', q), 0.8, 0.12, 0, int(q * 100)); pop(L('chatter', 'n2', q) + 0.85, 0.12, 0, 900)
t0, t1 = L('direct', 'n3', 0.2), L('direct', 'n3', 0.72)
whoosh(t0, t1 - t0, 300, 4000, 0.18, 0.4); pop(t1, 0.3, 0.6, 600)
hit = L('stamp', 'n4', 0.62)
whoosh(hit - 0.7, 0.7, 150, 3000, 0.15); thud(hit, 0.6); slap(hit + 0.02, 0.3, 0, 9)

# 01 编制
for i in range(12): pop(S['belt']['a'] + 0.25 + i * 0.05, 0.04, -0.5 + i * 0.03, 1300)
pop(L('belt', 'd2', 0.2), 0.15, 0.5, 600)
a = S['loop']['a']
for i in range(4): slap(a + 0.2 + i * 0.2, 0.18, -0.4 + i * 0.25, i + 20)
pop(L('loop', 'd1', 0.62), 0.15, 0, 700)
for i in range(6): slap(L('belt', 'd2', 0.45) + i * 0.12 + 0.35, 0.16, -0.6 + i * 0.24, i + 30)
a = S['belt']['a']; t1 = L('belt', 'd3') + 0.3
for i in range(int((t1 - L('belt', 'd2', 0.7)) / 0.425)): add(fx, L('belt', 'd2', 0.7) + i * 0.425, click(0.05, 500, 2000, 0.012), 0, 0.12)
thud(L('belt', 'd3', 0.62), 0.35)

# 02 交接税
thud(L('bars', 'c1', 0.22) + 0.05, 0.35)
for i in range(4): pop(L('bars', 'c1', 0.55) + i * 0.08, 0.08, -0.6 + i * 0.1, 900 + i * 100)
whoosh(L('bars', 'c1', 0.75), 0.9, 300, 3000, 0.12, -0.5)
add(fx, L('bars', 'c2', 0.45), metal(800, 0.6), 0.5, 0.15)
whoosh(L('bars', 'c2', 0.62), 1.2, 3000, 200, 0.12, 0.5)
c3, c3e = L('whisper', 'c3', 0.32), L('whisper', 'c3', 0.88)
for s in range(1, 5):
    t = c3 + (s / 4) * (c3e - c3); slap(t, 0.12, -0.6 + s * 0.3, s + 40)
    for i in range(3): tk(t + 0.6 + i * 0.12, 0.05, -0.6 + s * 0.3)
for i, q in enumerate([0.02, 0.15, 0.32, 0.5, 0.62]):
    for j in range(i + 1): slap(L('sprawl', 'c4', q) + 0.35 + j * 0.05, 0.12 + 0.02 * i, (j - i / 2) * 0.2, i * 10 + j)

# 03 即时
a = S['sched']['a']
for i in range(12): slap(a + 0.3 + i * 0.1, 0.07, (i % 4 - 1.5) * 0.4, i + 60)
pop(L('sched', 'j1', 0.45), 0.25, 0, 500)
for q in (0.22, 0.42, 0.6, 0.78): pop(L('sched', 'j2', q) + 0.2, 0.12, 0, 1000)
pop(L('spawn', 'j3', 0.08), 0.2, -0.5, 700)
whoosh(L('spawn', 'j3', 0.12), 1.0, 300, 3000, 0.1, 0)
for q in (0.22, 0.3, 0.4): pop(L('spawn', 'j3', q) + 0.2, 0.08, 0.4, 1600)
add(fx, L('spawn', 'j3', 0.66), bp(noise(int(0.4 * SR)), 2000, 8000) * np.linspace(1, 0, int(0.4 * SR)) ** 2, 0.4, 0.08)
flutter(L('spawn', 'j3', 0.72), 1.0, 0.1, -0.3, 70); slap(L('spawn', 'j3', 0.95), 0.15, -0.5, 71)
for i, q in enumerate([0.3, 0.55, 0.8]): pop(L('spawn', 'j4', q) - 0.5, 0.1, 0.3, 900 + i * 150); slap(L('spawn', 'j4', q) + 0.8, 0.1, -0.5, 72 + i)

# 04 三条理由
for i in range(3): slap(L('eyes', 'o1', 0.3 + i * 0.15), 0.2, -0.4 + i * 0.4, i + 80)
o2, o2e = L('eyes', 'o2', 0.36), L('eyes', 'o2', 0.6)
r = np.random.default_rng(3); n = int((o2e - o2) * SR)
add(fx, o2, bp(r.standard_normal(n), 2000, 9000) * (0.5 + 0.5 * np.abs(np.sin(np.arange(n) / SR * 9))) * 0.6, 0.2, 0.05)
for i in range(3): whoosh(L('eyes', 'o2', 0.66) + i * 0.08, 0.5, 400, 4000, 0.08, -0.6 + i * 0.6)
add(fx, L('eyes', 'o2', 0.85), lp(noise(int(0.4 * SR)), 3000) * np.exp(-np.arange(int(0.4 * SR)) / SR / 0.08), 0, 0.3)
pop(L('fresh', 'o3', 0.3), 0.12, 0.5, 600)
thud(L('fresh', 'o3', 0.62), 0.25); pop(L('fresh', 'o3', 0.86), 0.25, 0, 1100)
whoosh(L('walls', 'o4', 0.15), 0.6, 200, 2000, 0.12)
thud(L('walls', 'o4', 0.35), 0.3)
add(fx, L('walls', 'o4', 0.36), metal(1800, 0.5), 0, 0.08)
o5 = L('walls', 'o5')
for i in range(3): add(fx, o5 + 0.35 + i * 0.25, click(0.08, 800, 5000, 0.02), -0.5 + i * 0.5, 0.25)
thud(o5 + 1.0, 0.4)

# 05 不是种姓
for i in range(4): whoosh(L('caste', 'm1', 0.1 + i * 0.12), 0.6, 300, 3500, 0.06, -0.6 + 0.4 * i)
for i in range(4): slap(L('caste', 'm2', 0.4) + i * 0.08, 0.15, -0.4 + i * 0.25, i + 90)
whoosh(L('caste', 'm2', 0.72), 0.4, 400, 6000, 0.15, -0.3); whoosh(L('caste', 'm2', 0.78), 0.4, 400, 6000, 0.15, 0.3)
for i, q in enumerate([0.18, 0.26, 0.34, 0.42, 0.5]): tk(L('spec', 'm3', q) + 0.25, 0.08, 0)
for i in range(10): tk(L('spec', 'm3', 0.8) + i * 0.15, 0.04, 0.5)

# 06 回收
flutter(L('prune', 'r1', 0.12), 1.0, 0.1, 0.5, 100)
snip(L('prune', 'r1', 0.62), 0.25, 0.2); snip(L('prune', 'r1', 0.66), 0.22, 0.3)
t = L('prune', 'r1', 0.72); add(fx, S['prune']['a'] + 0.2, bp(noise(int((t - S['prune']['a'] - 0.2) * SR)), 1500, 6000) * 0.4, 0.3, 0.05)
thud(L('creep', 'r2', 0.3), 0.35)
for i in range(4): slap(L('creep', 'r2', 0.48) + i * 0.035 * (L('creep', 'r2', 0.62) - L('creep', 'r2', 0.48)) * 7, 0.15, (-1) ** i * 0.5, i + 110)
a, b = span('creep')
for i in range(int((b - a - 1) / 0.5)): tk(a + 0.5 + i * 0.5, 0.04, -0.6)
for i in range(7): pop(S['ledger']['a'] + 0.3 + i * 0.25, 0.06, -0.6 + i * 0.2, 1400 - i * 60)
for i in range(5): slap(L('ledger', 'r3', 0.25) + i * 0.1, 0.12, -0.5, i + 120)
for i in range(3): slap(L('ledger', 'r3', 0.45) + i * 0.15, 0.1, 0, i + 130)
flutter(L('ledger', 'r3', 0.68), 1.5, 0.06, 0.6, 131)

# 尾声
for f in (0.4, 0.58, 0.8): whoosh(L('office', 'e1', f) + 1.2, 1.0, 400, 5000, 0.1, 0.3)
pop(L('final', 'e2') - 0.1, 0.2, 0, 600)
thud(S['end']['a'] + 0.4, 0.3)
