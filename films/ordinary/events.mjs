// 《凡人》镜头内的事件：闪电、神经放电、蒙太奇剪辑点、屏幕上的逐字。
// 由 engine/pipeline/build_timeline.mjs 在排完镜头后调用，直接写进各镜头对象。
const STORM_SKIP = 3.0; // 暴雨开场裁掉的秒数（画面以 u + skip 绘制）

export function addEvents({ lang, L, shots, SCREEN, rnd }) {
  const S = (k) => shots.find((x) => x.kind === k);
  const storm = S('storm');
  // 暴雨开场裁掉了前 3 秒：闪电时刻按镜头内时间记录（画面以 u + 3 绘制）
  storm.lightning = [
    { t: 2.6, x: 0.72, delay: 1.3, power: 0.7, seed: 11 },
    { t: 4.15, x: 0.24, delay: 0.9, power: 0.85, seed: 23 },
    { t: 4.32, x: 0.25, delay: 0.9, power: 0.5, seed: 24 },
    { t: 7.4, x: 0.58, delay: 0.55, power: 1.0, seed: 37 },
  ].map((L) => ({ ...L, t: +(L.t - STORM_SKIP).toFixed(3) })).filter((L) => L.t > 0.3);
  storm.skip = STORM_SKIP;
  const neu = S('neurons');
  neu.spikes = [];
  for (let t = 3.8; t < neu.b - neu.a - 0.4;) {
    neu.spikes.push(+t.toFixed(3));
    const rate = 1.5 + (t / (neu.b - neu.a)) * 6;
    t += -Math.log(1 - rnd()) / rate + 0.05;
  }
  // 机器：剪辑点逐渐加快
  const mac = S('machines');
  mac.cuts = [];
  {
    const kinds = ['arm', 'gears', 'leg', 'crank', 'digits', 'punch'];
    let t = 0, d = 1.3, i = 0;
    while (t < mac.b - mac.a - 0.2) { mac.cuts.push({ t: +t.toFixed(3), kind: kinds[i++ % kinds.length] }); t += d; d = Math.max(0.45, d * 0.84); }
  }
  const str = S('streams');
  str.cuts = [];
  {
    const kinds = ['language', 'image', 'code', 'language', 'image', 'code', 'gears', 'punch', 'digits'];
    let t = 0, d = 1.5, i = 0;
    while (t < str.b - str.a - 0.1) { str.cuts.push({ t: +t.toFixed(3), kind: kinds[i++ % kinds.length] }); t += d; d = Math.max(0.14, d * 0.8); }
  }
  // 屏幕上的逐字
  const scr = S('screen');
  scr.typing = [];
  const type = (text, t0, step, who) => {
    let t = t0;
    const chars = [];
    for (const ch of text) {
      chars.push({ ch, t: +t.toFixed(3) });
      if (lang === 'zh') t += '，。？'.includes(ch) ? step + 0.42 : step * (0.85 + rnd() * 0.3);
      else t += '.,?'.includes(ch) ? step + 0.35 : ch === ' ' ? step * 0.6 : step * (0.8 + rnd() * 0.4);
    }
    scr.typing.push({ who, text, chars });
    return t;
  };
  const stepQ = lang === 'zh' ? 0.17 : 0.075, stepR = lang === 'zh' ? 0.115 : 0.045;
  {
    const co = S('coldopen');
    const keep = scr.typing; scr.typing = [];
    type(SCREEN.q[L], 1.3, stepQ, 'user');
    co.typing = scr.typing; scr.typing = keep;
  }
  const tq = type(SCREEN.q[L], 2.4, stepQ, 'user');
  const t1 = type(SCREEN.r1[L], tq + 1.6, stepR, 'reply');
  type(SCREEN.r2[L], t1 + 0.9, stepR * 1.15, 'reply');

}
