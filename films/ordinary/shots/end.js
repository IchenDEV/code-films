// 尾声：火光与屏幕光中的同一张侧脸；从神坛上走下来；片名与鸣谢
(() => {
  SHOT.profiles = (ctx, u, dur) => {
    const m = ease(u, dur * 0.32, dur * 0.55);
    const fade = ease(u, 0, 1.6) * (1 - ease(u, dur - 1.4, dur));
    ctx.save();
    if (m < 1) {
      ctx.save(); ctx.globalAlpha = fade * (1 - m);
      drawFireProfile(ctx, u + 200, 0.06);
      ctx.restore();
    }
    if (m > 0) {
      const scr = 0.9 + 0.1 * noise1(u * 1.3, 901);
      const b = makeTemp(), c = b.getContext('2d');
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'lighter';
      glow(c, W * 1.02, H * 0.42, 900, [150, 180, 220], 0.2 * scr);
      c.restore();
      drawProfile(c, W * 0.42, H * 0.6, 360, 0.06, { rgb: [180, 205, 240], k: 0.85 * scr }, 0);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fade * m;
      ctx.drawImage(b, 0, 0);
    }
    ctx.restore();
  };

  // 从神坛上走下来
  const TIERS = 5, BASE = 820, TH = 70;
  const temple = [];
  for (let i = 0; i < TIERS; i++) {
    const hw = 420 - i * 72, y0 = BASE - i * TH, y1 = y0 - TH;
    temple.push([[CX - hw, y0], [CX - hw + 18, y1], [CX + hw - 18, y1], [CX + hw, y0]]);
  }
  const TOP = BASE - TIERS * TH;
  const CROWD = [];
  INITS.push(() => {
    for (let i = 0; i < 46; i++) {
      const x = 80 + rand(i, 950) * (W - 160);
      if (Math.abs(x - CX) < 40) continue;
      const r = rand(i, 951);
      CROWD.push({ x, kind: r < 0.5 ? 'person' : r < 0.72 ? 'tree' : r < 0.9 ? 'deer' : 'grass', h: 0.75 + rand(i, 952) * 0.4, ph: rand(i, 953) });
    }
  });
  function deer(ctx, x, y, s, flip) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    ctx.beginPath();
    ctx.ellipse(0, -46, 30, 13, 0, 0, TAU);
    ctx.moveTo(22, -52); ctx.quadraticCurveTo(34, -80, 40, -88); ctx.lineTo(48, -86); ctx.lineTo(46, -80); ctx.quadraticCurveTo(38, -70, 30, -46);
    ctx.fill();
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const lx of [-22, -14, 16, 24]) { ctx.moveTo(lx, -40); ctx.lineTo(lx + (lx > 0 ? 2 : -2), 0); }
    ctx.moveTo(41, -88); ctx.lineTo(36, -104); ctx.moveTo(38, -96); ctx.lineTo(30, -100); ctx.moveTo(44, -88); ctx.lineTo(50, -102);
    ctx.stroke();
    ctx.restore();
  }
  function tree(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round';
    const br = (bx, by, a, len, w, d) => {
      const nx = bx + Math.sin(a) * len, ny = by - Math.cos(a) * len;
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(nx, ny); ctx.stroke();
      if (d > 0) { br(nx, ny, a - 0.45, len * 0.72, w * 0.68, d - 1); br(nx, ny, a + 0.4, len * 0.7, w * 0.68, d - 1); }
    };
    br(0, 0, 0, 60, 7, 5);
    ctx.restore();
  }
  SHOT.descend = (ctx, u, dur, sh) => {
    const e4 = sh.e4 ?? dur * 0.3, e5 = e4 + 2.6;
    const down = easeInOut(ramp(u, e4 + 0.4, e4 + 3.6));
    const pull = easeInOut(ramp(u, e5 - 0.5, dur));
    const sc = lerp(1, 0.62, pull);
    drawStars(ctx, u + 300, ease(u, e5 - 1, e5 + 3) * 0.7, H * 0.9, 0.5);
    ctx.save();
    ctx.translate(CX, BASE); ctx.scale(sc, sc); ctx.translate(-CX, -BASE + pull * 120);
    // 地平线上冷的微光
    const hg = ease(u, e4 + 1, e4 + 4);
    if (hg > 0) {
      ctx.save(); ctx.translate(CX, BASE); ctx.scale(1, 0.18);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 2400);
      g.addColorStop(0, `rgba(120,140,170,${0.28 * hg})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(-2600, -2600, 5200, 5200);
      ctx.restore();
    }
    // 神坛
    const tk = ease(u, 0.2, 1.6) * (1 - ease(u, e4 + 0.2, e4 + 2.4));
    if (tk > 0) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [lw, al] of [[5, 0.08], [1.3, 0.75]]) {
        ctx.strokeStyle = gold(al * tk); ctx.lineWidth = lw;
        for (const p of temple) { ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(CX - 40, BASE); ctx.lineTo(CX - 20, TOP); ctx.moveTo(CX + 40, BASE); ctx.lineTo(CX + 20, TOP); ctx.stroke();
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, CX, TOP - 50, 220, [255, 200, 130], 0.25 * tk);
      ctx.restore();
      ctx.restore();
    }
    // 大地
    const gk = ease(u, e4 + 0.8, e4 + 3.5);
    ctx.strokeStyle = `rgba(200,206,214,${0.35 * gk})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(CX - 2400 * gk, BASE); ctx.lineTo(CX + 2400 * gk, BASE); ctx.stroke();
    // 周围的人、树、鹿、草
    const ck = ease(u, e5 - 0.6, e5 + 3.0);
    if (ck > 0) {
      ctx.save();
      for (const c of CROWD) {
        const a = ck * (0.4 + 0.5 * c.ph);
        ctx.fillStyle = ctx.strokeStyle = `rgba(150,160,174,${a * 0.75})`;
        if (c.kind === 'person') { standingPath(ctx, c.x, BASE, 74 * c.h); ctx.fill(); }
        else if (c.kind === 'tree') tree(ctx, c.x, BASE, 0.9 * c.h + 0.3);
        else if (c.kind === 'deer') deer(ctx, c.x, BASE, 0.75 * c.h, c.ph > 0.5);
        else { ctx.lineWidth = 1.2; ctx.beginPath(); for (let g = 0; g < 7; g++) { ctx.moveTo(c.x + g * 4, BASE); ctx.lineTo(c.x + g * 4 + (g - 3) * 2, BASE - 10 - (g % 3) * 5); } ctx.stroke(); }
      }
      ctx.restore();
    }
    // 那个人：从金色的高处走到平地，颜色也变得和其他人一样
    const y = lerp(TOP, BASE, down);
    const col = [lerp(236, 150, down), lerp(212, 160, down), lerp(160, 174, down)];
    ctx.fillStyle = `rgba(${col.map((v) => v | 0)},${lerp(0.95, 0.75 * (0.4 + 0.5 * 0.6), ease(u, e5, e5 + 3))})`;
    standingPath(ctx, CX, y, 74);
    ctx.fill();
    if (down < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, CX, y - 40, 90, GOLD, 0.25 * (1 - down) * ease(u, 0.2, 1.6)); ctx.restore(); }
    ctx.restore();
  };

  // 三重退位再落一次：暗淡蓝点 → 生命之树上的我们 → 被光扫过的分布曲线
  SHOT.recap = (ctx, u, dur, sh) => {
    const tb = sh.e5b ?? dur / 3, tc = sh.e5c ?? dur * 2 / 3;
    const i = u < tb - 0.15 ? 0 : u < tc - 0.15 ? 1 : 2;
    const t0 = [0, tb - 0.15, tc - 0.15][i];
    const lt = u - t0;
    const push = 1 + lt * 0.025;
    ctx.save();
    ctx.translate(CX, CY); ctx.scale(push, push); ctx.translate(-CX, -CY);
    const pb = TL.shots.find((s) => s.kind === 'paleblue');
    if (i === 0) {
      const D = [0.5946, 0.5196];
      const map = kenburns(ctx, 'paleblue', 1, [D[0], D[1] + 0.028, 0.14], [D[0], D[1] + 0.028, 0.14], { filter: 'brightness(0.9)', vig: 0.6 });
      const [dx, dy] = map(D[0], D[1]);
      ctx.strokeStyle = 'rgba(220,230,240,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(dx, dy, 22, 0, TAU); ctx.stroke();
    }
    else if (i === 1) SHOT.tree(ctx, 100, 100, { c10: 0 });
    else window.drawCurve(ctx, 0, 1, {}, true);
    ctx.restore();
    // 每次切换带一下闪白
    const f = Math.exp(-lt * 9);
    if (i > 0 && f > 0.01) { ctx.fillStyle = `rgba(236,232,222,${0.35 * f})`; ctx.fillRect(0, 0, W, H); }
  };

  SHOT.black = () => {};
  SHOT.title = () => {};

  const CREDITS = {
    zh: [
      ['凡人', 30],
      ['', 10],
      ['旁白  ElevenLabs 语音合成', 19],
      ['画面与声音  程序生成', 19],
      ['', 10],
      ['档案图像  Wikimedia Commons · 公有领域', 19],
      ['伏羲女娲图（唐）· 米开朗基罗《创造亚当》· 古埃及纸草中的努特', 16],
      ['达·芬奇《维特鲁威人》· 塞拉里乌斯《和谐大宇宙》· 弗拉马利翁版画', 16],
      ['NASA/JPL《暗淡蓝点》· 瓦拉德斯《存在巨链》· 达尔文笔记 B', 16],
      ['赫胥黎《人类在自然界的位置》· 笛卡尔《论人》· 卡哈尔', 16],
    ],
    en: [
      ['ORDINARY', 28],
      ['', 10],
      ['Narration  ElevenLabs voice synthesis', 19],
      ['Picture and sound  procedurally generated', 19],
      ['', 10],
      ['Archival images  Wikimedia Commons · public domain', 19],
      ['Fuxi and Nüwa (Tang) · Michelangelo, The Creation of Adam · Nut, Egyptian papyrus', 16],
      ['Leonardo, Vitruvian Man · Cellarius, Harmonia Macrocosmica · The Flammarion engraving', 16],
      ['NASA/JPL, Pale Blue Dot · Valadés, Great Chain of Being · Darwin, Notebook B', 16],
      ["Huxley, Man's Place in Nature · Descartes, Treatise of Man · Ramón y Cajal", 16],
    ],
  };
  SHOT.credits = (ctx, u, dur) => {
    const rows = CREDITS[TL.lang];
    const a = win(u, 0, dur, 1.2, 1.4);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let y = CY - 190;
    for (const [s, size] of rows) {
      ctx.font = `${size}px ${SERIF}`; ctx.letterSpacing = size > 20 ? '0.5em' : '0.08em';
      ctx.fillStyle = `rgba(222,214,198,${a * (size > 20 ? 0.9 : size > 17 ? 0.7 : 0.5)})`;
      ctx.fillText(s, CX, y);
      y += size * 2.1;
    }
    ctx.restore();
  };
})();
