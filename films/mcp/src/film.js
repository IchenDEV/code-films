/* 《MCP 跑偏了》—— 七个场景，一条时间轴。
   所有画面时间都锚定在旁白的句子/分句上（L/C），音画共用的事件时间在 CUE 里。 */
(() => {
  const TL = window.TL;
  const tl = gsap.timeline({ paused: true });
  const L = (id) => TL.lines[id].start;
  const LE = (id) => TL.lines[id].end;
  const C = (id, k) => { const c = TL.lines[id].cl; return c[Math.min(k, c.length - 1)]; };
  const A = (id) => TL.acts[id].start;
  const CUE = TL.cues;
  const $ = (s) => document.querySelector(s);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const MINT = '#74d4b0', AMB = '#e6b04e', RED = '#e2654c', COP = '#c98a5a', MUTE = '#837f77';
  const px = (v) => v + 'px';
  let seed = 23;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rr = (a, b) => a + (b - a) * rnd();

  // ---------- primitives ----------
  function mk(tag, cls, parent, html, style) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (style) Object.assign(e.style, style);
    parent.appendChild(e);
    return e;
  }
  // 只标记有意堆叠的道具文字；其他标题、字幕与布局仍参与碰撞检查。
  function allowTextOverlap(element) {
    [element, ...element.querySelectorAll('*')].forEach((node) => {
      const hasText = [...node.childNodes].some((child) => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
      if (hasText) node.setAttribute('data-layout-allow-overlap', '');
    });
    return element;
  }
  // 以 (cx, cy) 为中心放置；之后的 x/y 都是相对这个“家”的偏移
  function at(parent, cls, html, cx, cy, style) {
    const e = mk('div', cls, parent, html, Object.assign({ position: 'absolute', left: px(cx), top: px(cy) }, style || {}));
    gsap.set(e, { xPercent: -50, yPercent: -50 });
    e._cx = cx; e._cy = cy;
    return e;
  }
  function hidden(e, extra) { gsap.set(e, Object.assign({ autoAlpha: 0 }, extra || {})); return e; }
  function fadeIn(e, t, d = 0.6, to) { tl.to(e, Object.assign({ autoAlpha: 1, duration: d, ease: 'power2.out' }, to || {}), t); }
  function fadeOut(e, t, d = 0.5, to) { tl.to(e, Object.assign({ autoAlpha: 0, duration: d, ease: 'power1.in' }, to || {}), t); }
  function fadeTo(e, t, a, d = 0.6) { tl.to(e, { autoAlpha: a, duration: d, ease: 'power1.inOut' }, t); }
  function pop(e, t, d = 0.5) { tl.to(e, { autoAlpha: 1, scale: 1, duration: d, ease: 'back.out(1.7)' }, t); }
  function flyTo(e, t, cx, cy, d = 1, extra, arc = 'x') {
    tl.to(e, Object.assign({ x: cx - e._cx, duration: d, ease: arc === 'x' ? 'sine.inOut' : 'power2.inOut' }, extra || {}), t);
    tl.to(e, { y: cy - e._cy, duration: d, ease: arc === 'x' ? 'power2.inOut' : 'sine.inOut' }, t);
  }
  // 物理式落下：先加速、触地压扁、回弹
  function drop(e, t, d = 0.5, squash = 0.9, rot = 0) {
    tl.to(e, { autoAlpha: 1, duration: 0.12 }, t - d);
    tl.to(e, { y: 0, rotation: rot, duration: d, ease: 'power3.in' }, t - d);
    tl.to(e, { scaleY: squash, scaleX: 1 + (1 - squash) * 0.4, duration: 0.07, ease: 'power1.out', transformOrigin: '50% 100%' }, t);
    tl.to(e, { scaleY: 1, scaleX: 1, duration: 0.45, ease: 'back.out(3)' }, t + 0.07);
  }
  // 任意函数驱动的轨迹（u: 0..1, s: 秒）
  function track(e, t0, dur, fn) {
    const o = { u: 0 };
    tl.to(o, { u: 1, duration: dur, ease: 'none', onUpdate() { gsap.set(e, fn(o.u, o.u * dur)); } }, t0);
  }
  function count(e, t, d, a, b, fmt, ease = 'power1.inOut') {
    const o = { v: a };
    e.textContent = fmt(a);
    tl.to(o, { v: b, duration: d, ease, onUpdate() { e.textContent = fmt(o.v); } }, t);
  }
  // 打字：用 clip-path 按字逐步露出
  function type(e, t, d, n) {
    e.style.width = 'fit-content';
    gsap.set(e, { clipPath: 'inset(0% 100% 0% 0%)' });
    tl.to(e, { clipPath: 'inset(0% 0% 0% 0%)', duration: d, ease: `steps(${Math.max(1, n || 20)})` }, t);
  }
  function swing(e, t, amp = 7) {
    tl.to(e, { keyframes: [{ rotation: amp, duration: 0.32 }, { rotation: -amp * 0.6, duration: 0.5 }, { rotation: amp * 0.32, duration: 0.5 },
      { rotation: -amp * 0.12, duration: 0.45 }, { rotation: 0, duration: 0.45 }], ease: 'sine.inOut' }, t);
  }
  // crossfading text slot
  function slot(parent, cls) { const s = mk('span', 'slot ' + (cls || ''), parent, null, { display: 'inline-grid' }); s._cur = null; return s; }
  function say(s, t, html, d = 0.4) {
    const sp = mk('span', '', s, html, { gridArea: '1 / 1', whiteSpace: 'nowrap' });
    if (t == null) { s._cur = sp; return sp; }
    gsap.set(sp, { autoAlpha: 0 });
    if (s._cur) tl.to(s._cur, { autoAlpha: 0, duration: d }, t);
    tl.to(sp, { autoAlpha: 1, duration: d }, t);
    s._cur = sp;
    return sp;
  }

  // svg overlay in world coordinates
  function svgLayer(parent) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('class', 'ov');
    parent.appendChild(s);
    return s;
  }
  function path(svg, d, o = {}) {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('stroke', o.stroke || 'rgba(236,231,221,.3)');
    p.setAttribute('stroke-width', o.width || 1.5);
    if (o.dash) p.setAttribute('stroke-dasharray', o.dash);
    if (o.filter) p.setAttribute('filter', o.filter);
    if (o.opacity != null) p.setAttribute('opacity', o.opacity);
    svg.appendChild(p);
    p._len = p.getTotalLength();
    p._dashed = !!o.dash;
    if (!o.dash) gsap.set(p, { strokeDasharray: p._len + ' ' + p._len, strokeDashoffset: p._len });
    gsap.set(p, { autoAlpha: 0 });
    return p;
  }
  function draw(p, t, d = 0.9, ease = 'power2.inOut') {
    tl.to(p, { autoAlpha: 1, duration: p._dashed ? 0.5 : 0.12 }, t);
    if (!p._dashed) tl.to(p, { strokeDashoffset: 0, duration: d, ease }, t);
  }

  // scenes & cameras
  const scenesEl = $('#scenes');
  function scene(t0, t1, fin = 0.7, fout = 0.7) {
    const root = mk('div', 'layer', scenesEl);
    gsap.set(root, { autoAlpha: 0 });
    tl.to(root, { autoAlpha: 1, duration: fin, ease: 'power1.inOut' }, t0);
    if (t1 != null) tl.to(root, { autoAlpha: 0, duration: fout, ease: 'power1.inOut' }, t1);
    return root;
  }
  function cam(root) { return mk('div', 'layer cam', root); }
  const camXY = (wx, wy, s) => ({ x: -s * (wx - 960), y: -s * (wy - 540), scale: s });
  function camSet(c, wx, wy, s) { gsap.set(c, camXY(wx, wy, s)); }
  function camTo(c, t, wx, wy, s, d, ease = 'power2.inOut') { tl.to(c, Object.assign(camXY(wx, wy, s), { duration: d, ease }), t); }

  const card = (parent, cx, cy, w, h, html, style) => at(parent, 'card', html, cx, cy, Object.assign({ width: px(w), height: px(h) }, style || {}));
  const paper = (parent, cx, cy, w, h, html, style) => at(parent, 'paper', html, cx, cy, Object.assign({ width: px(w), height: px(h) }, style || {}));

  // =====================================================================
  // OPEN —— 一条本该接上的线，在最后跑偏了
  // =====================================================================
  {
    const root = scene(0.0, A('p') - 0.4, 0.8, 0.9);
    const c = cam(root);
    camSet(c, 960, 540, 1.04);
    camTo(c, 0, 960, 540, 1.0, A('p'), 'sine.out');
    const svg = svgLayer(c);
    const d = 'M140,660 L1180,660 C1420,660 1560,640 1790,548';
    const glow = path(svg, d, { stroke: 'rgba(201,138,90,.25)', width: 8 });
    const p = path(svg, d, { stroke: COP, width: 2.2 });
    const ez = gsap.parseEase('power1.inOut');
    draw(glow, 0.5, 3.4, 'power1.inOut'); draw(p, 0.5, 3.4, 'power1.inOut');
    // 目标：本该接上的接口（虚线圈）
    const target = at(c, '', '', 1800, 660, { width: '46px', height: '46px', borderRadius: '50%', border: '1.5px dashed rgba(236,231,221,.35)' });
    const tlabel = at(c, 'lbl', '接口', 1800, 712);
    hidden(target, { scale: 0.7 }); hidden(tlabel);
    pop(target, 0.4); fadeIn(tlabel, 0.6);
    const dot = at(c, '', '', 140, 660, { width: '10px', height: '10px', borderRadius: '50%', background: '#f3cfa8', boxShadow: '0 0 18px rgba(240,180,130,.95)' });
    hidden(dot);
    fadeIn(dot, 0.45, 0.2);
    track(dot, 0.5, 3.4, (u) => { const pt = p.getPointAtLength(ez(u) * p._len); return { x: pt.x - 140, y: pt.y - 660 }; });
    const t1 = at(c, 'serif nw', 'MCP 跑偏了', 960, 440, { fontSize: '96px', letterSpacing: '.08em', color: '#f3efe7' });
    const t2 = at(c, 'nw', '一根管道，和它两端的猜测', 960, 548, { fontSize: '22px', letterSpacing: '.42em', color: MUTE });
    hidden(t1, { y: 14 }); hidden(t2, { y: 8 });
    fadeIn(t1, CUE.title, 1.4, { y: 0 });
    fadeIn(t2, CUE.title + 0.9, 1.2, { y: 0 });
  }

  // =====================================================================
  // P —— Pi 的转身：工具说明塞满上下文 → 沙箱里写程序，只带回结论
  // =====================================================================
  {
    const root = scene(A('p') - 0.3, A('c') - 0.5);
    const c = cam(root);
    camSet(c, 960, 540, 1);
    // 发布说明
    const rel = card(c, 960, 470, 600, 300, '', { padding: '30px 40px' });
    mk('div', 'lbl mono', rel, 'pi · release notes');
    mk('div', 'serif', rel, 'Pi 0.99.0', { fontSize: '54px', marginTop: '6px', color: '#f3efe7' });
    const rows = ['内置 MCP', 'codemode 代码模式', '工具发现 · 结构化输出'].map((t) =>
      mk('div', '', rel, `<span class="mono" style="color:${MINT}">+</span>&nbsp;&nbsp;${t}`, { fontSize: '23px', marginTop: '12px', color: '#e2ddd3' }));
    hidden(rel, { y: -60, rotation: -4 });
    tl.to(rel, { autoAlpha: 1, duration: 0.25 }, L('p1') - 0.6);
    tl.to(rel, { y: 0, rotation: 0.6, duration: 0.9, ease: 'back.out(1.3)' }, L('p1') - 0.6);
    rows.forEach((r, i) => { hidden(r, { x: -10 }); fadeIn(r, C('p1', 1) + 0.15 + i * 0.4, 0.5, { x: 0 }); });
    // Mario 的旧文
    const pap = paper(c, 640, 480, 580, 330, '', { padding: '34px 42px' });
    allowTextOverlap(mk('div', 'lbl', pap, 'BLOG', { color: '#85786a' })); // 旋转纸张的轴对齐框会相交
    mk('div', '', pap, 'What if you don’t need<br>MCP at all?', { fontFamily: '"DejaVu Serif", serif', fontSize: '36px', lineHeight: '1.22', marginTop: '12px', color: '#26221d' });
    mk('div', '', pap, 'Mario Zechner', { fontSize: '17px', marginTop: '16px', color: '#5e5448' });
    [92, 84, 58].forEach((w) => mk('div', '', pap, '', { width: w + '%', height: '7px', borderRadius: '3px', background: 'rgba(40,34,28,.16)', marginTop: '14px' }));
    const stamp = at(pap, 'stamp', 'NO MCP', 400, 200);
    hidden(stamp, { scale: 1.9, rotation: -10 });
    hidden(pap, { x: -300, rotation: -10 });
    const p2 = C('p2', 1) - 0.25;
    tl.to(pap, { autoAlpha: 1, duration: 0.3 }, p2);
    tl.to(pap, { x: 0, rotation: -3.5, duration: 1.0, ease: 'power3.out' }, p2);
    tl.to(rel, { x: 1300 - 960, y: 10, rotation: 2.5, scale: 0.9, duration: 1.0, ease: 'power3.inOut' }, p2);
    tl.to(stamp, { autoAlpha: 0.9, scale: 1, duration: 0.14, ease: 'power4.in' }, CUE.stamp - 0.14);
    tl.to(pap, { keyframes: [{ y: 5, duration: 0.05 }, { y: -1, duration: 0.08 }, { y: 0, duration: 0.12 }] }, CUE.stamp);
    // 退场
    const p3 = L('p3') - 0.35;
    tl.to(rel, { x: 1900 - 960, rotation: 9, duration: 0.8, ease: 'power2.in' }, p3);
    fadeOut(rel, p3 + 0.5, 0.3);
    tl.to(pap, { x: -700, y: 60, rotation: -12, duration: 0.8, ease: 'power2.in' }, p3);
    fadeOut(pap, p3 + 0.5, 0.3);

    // 上下文面板
    const ctx = card(c, 520, 470, 540, 640, '');
    mk('div', 'lbl', ctx, '模型上下文', { position: 'absolute', left: '24px', top: '20px' });
    const tok = mk('div', 'mono', ctx, '0 tokens', { position: 'absolute', right: '24px', top: '18px', fontSize: '15px', color: '#cfc9be' });
    const mtrack = mk('div', '', ctx, '', { position: 'absolute', left: '24px', right: '24px', bottom: '24px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,.07)', overflow: 'hidden' });
    const fill = mk('div', '', mtrack, '', { position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: MINT, transformOrigin: '0 50%' });
    gsap.set(fill, { scaleX: 0.02 });
    const pct = mk('div', 'mono', ctx, '2%', { position: 'absolute', right: '24px', bottom: '38px', fontSize: '13px', color: MUTE });
    const ask = at(c, 'chip', '<span class="k">用户</span>哪些订单超期了？', 520, 236, { fontSize: '17px' });
    hidden(ctx, { y: 20 }); hidden(ask, { scale: 0.9 });
    fadeIn(ctx, L('p3') - 0.2, 0.7, { y: 0 });
    pop(ask, L('p3') + 0.4);
    // 几十份工具说明
    const TOOLS = [
      ['list_orders', '按状态列出订单，支持 page / limit / sort'], ['get_order', '读取单个订单的全部字段和历史'], ['update_order', '修改订单状态，需要权限 orders.write'],
      ['refund_order', '发起退款，金额不能超过实付'], ['search_customers', '按姓名、电话、邮箱模糊搜索客户'], ['get_customer', '客户详情，包括地址和偏好'],
      ['list_tickets', '列出工单，可按负责人和标签筛选'], ['create_ticket', '新建工单，标题必填，正文支持 markdown'], ['update_ticket', '修改工单字段、负责人或优先级'],
      ['add_comment', '给工单追加评论，可 @ 同事'], ['list_products', '商品目录，含库存与价格区间'], ['get_inventory', '某个仓库的实时库存'],
      ['create_invoice', '开具发票，需要税号与抬头'], ['send_email', '用模板发邮件，支持附件'], ['send_sms', '发送短信验证码或通知'],
      ['query_metrics', '查询看板指标，时间粒度可选'], ['export_report', '导出 CSV / XLSX 报表'], ['list_users', '内部用户与角色'],
      ['grant_role', '给用户授予角色，需管理员'], ['read_file', '读取共享盘中的文件'], ['write_file', '写入文件，覆盖前需确认'],
      ['list_files', '列出目录内容，支持 glob'], ['search_docs', '全文检索内部文档'], ['get_doc', '读取一篇文档的正文'],
      ['create_doc', '新建文档并设置权限'], ['list_events', '日历事件，按时间范围'], ['create_event', '创建会议并邀请参与者'],
      ['get_weather', '城市天气（别问为什么在这里）'], ['translate', '多语言翻译，保留格式'], ['summarize', '对长文本做摘要'],
      ['list_webhooks', '查看已注册的回调地址'], ['retry_job', '重跑失败的后台任务'], ['get_job', '后台任务状态与日志'], ['cancel_job', '取消一个正在运行的任务'],
    ];
    const stack = mk('div', 'layer', c);
    const tcards = TOOLS.map(([n, dsc], i) => {
      const e = at(stack, 'mono nw', `<span style="color:${AMB}">${n}</span><span style="color:${MUTE}">  — ${dsc}</span>`, 1640, 500, {
        width: '470px', padding: '6px 10px', borderRadius: '6px', fontSize: '13.5px', overflow: 'hidden',
        background: 'rgba(33,35,39,.98)', border: '1px solid rgba(236,231,221,.14)', boxShadow: '0 4px 10px rgba(0,0,0,.4)' });
      e._cx = 520; e._cy = 760 - i * 14.6; // 家 = 堆叠位置
      allowTextOverlap(e); // 工具说明刻意挤成一叠，表现上下文拥堵
      gsap.set(e, { left: px(520), top: px(760 - i * 14.6) });
      const sx = rr(1450, 1900), sy = rr(180, 860);
      hidden(e, { x: sx - 520, y: sy - e._cy, rotation: rr(-24, 24) });
      return e;
    });
    const pour = CUE.pour, span = 2.9;
    tcards.forEach((e, i) => {
      const t = pour + (i / tcards.length) * span;
      tl.to(e, { autoAlpha: 1, duration: 0.15 }, t);
      tl.to(e, { x: 0, y: 0, rotation: rr(-1.4, 1.4), duration: 0.7, ease: 'power3.out' }, t);
    });
    count(tok, pour, span + 0.5, 0, 48200, (v) => Math.round(v).toLocaleString('en-US') + ' tokens');
    count(pct, pour, span + 0.5, 2, 92, (v) => Math.round(v) + '%');
    tl.to(fill, { scaleX: 0.92, duration: span + 0.5, ease: 'power1.inOut' }, pour);
    tl.to(fill, { backgroundColor: AMB, duration: 0.4 }, pour + 1.4);
    tl.to(fill, { backgroundColor: RED, duration: 0.4 }, pour + 2.5);
    tl.to(tok, { color: RED, duration: 0.3 }, C('p3', 2));
    tl.to(tok, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, transformOrigin: '100% 50%' }, C('p3', 2));
    tl.to(stack, { keyframes: [{ x: 5, duration: 0.05 }, { x: -5, duration: 0.07 }, { x: 4, duration: 0.07 }, { x: -2, duration: 0.07 }, { x: 0, duration: 0.08 }] }, C('p3', 3) + 0.1);

    // 沙箱 + codemode
    const sb = at(c, '', '', 1340, 470, { width: '700px', height: '640px', borderRadius: '16px', border: '1.5px dashed rgba(116,212,176,.55)', background: 'rgba(116,212,176,.035)' });
    mk('div', 'lbl', sb, '沙箱 · CODEMODE', { position: 'absolute', left: '24px', top: '20px', color: MINT });
    const code = mk('div', 'mono', sb, null, { position: 'absolute', left: '28px', top: '62px', fontSize: '18px', lineHeight: '1.75', color: '#d9d4ca' });
    const K = (s) => `<span style="color:#c792ea">${s}</span>`, F = (s) => `<span style="color:${AMB}">${s}</span>`, S = (s) => `<span style="color:${MINT}">${s}</span>`;
    const lines = [
      [`${K('const')} open = ${K('await')} ${F('mcp.orders.list')}({ status: ${S('"open"')} })`, 50],
      [`${K('const')} late = open.filter(o =&gt; o.ageDays &gt; 7)`, 40],
      [`${K('return')} { late: late.length }`, 28],
    ].map(([h, n]) => { const e = mk('div', 'nw', code, h); e._n = n; return e; });
    hidden(sb, { scale: 0.96 });
    const p4 = C('p4', 0);
    fadeIn(sb, p4 - 0.3, 0.6, { scale: 1 });
    lines.forEach((e, i) => type(e, p4 + 0.4 + i * 1.05, 0.95, e._n));
    // 中间结果在沙箱里滚动
    const dwin = mk('div', 'mono', sb, null, { position: 'absolute', left: '28px', right: '28px', top: '210px', height: '190px', overflow: 'hidden', fontSize: '14px', lineHeight: '1.6', color: '#6f6b64',
      borderTop: '1px solid rgba(236,231,221,.08)', borderBottom: '1px solid rgba(236,231,221,.08)', paddingTop: '6px' });
    const dcol = mk('div', '', dwin);
    for (let i = 0; i < 40; i++) {
      const id = 10230 + i * 7, age = Math.floor(rr(0, 19)), st = rnd() < 0.7 ? 'open' : 'paid';
      mk('div', 'nw', dcol, `#${id}   ${st.padEnd(6, ' ')}  ${String(age).padStart(2, ' ')}d   ¥${(rr(20, 900)).toFixed(2)}`.replace(/ /g, '&nbsp;'),
        age > 7 && st === 'open' ? { color: '#a39d92' } : null);
    }
    allowTextOverlap(dcol); // 结论卡片穿过沙箱里的滚动中间结果
    hidden(dwin);
    fadeIn(dwin, C('p4', 1) - 0.2, 0.5);
    tl.fromTo(dcol, { y: 0 }, { y: -420, duration: 7, ease: 'none' }, C('p4', 1) - 0.2);
    // 工具卡进入沙箱，收成命名空间
    const NS = ['mcp.orders.*', 'mcp.customers.*', 'mcp.tickets.*', 'mcp.files.*', 'mcp.docs.*', 'mcp.jobs.*', 'mcp.email.*', 'mcp.metrics.*'];
    const nsEls = NS.map((n, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const e = at(c, 'mono nw', n, 1340 - 255 + col * 170, 686 + row * 42,
        { fontSize: '13px', padding: '4px 9px', borderRadius: '5px', color: AMB, border: '1px solid rgba(230,176,78,.35)', background: 'rgba(230,176,78,.07)' });
      hidden(e, { scale: 0.7 });
      return e;
    });
    const p4b = C('p4', 1) - 0.1;
    tcards.forEach((e, i) => {
      const t = p4b + i * 0.03;
      tl.to(e, { x: 1340 - 520 + rr(-200, 200), y: 700 - e._cy + rr(-20, 30), scale: 0.3, rotation: rr(-8, 8), duration: 0.75, ease: 'power2.in' }, t);
      tl.to(e, { autoAlpha: 0, duration: 0.2 }, t + 0.6);
    });
    nsEls.forEach((e, i) => pop(e, p4b + 0.75 + i * 0.07, 0.4));
    count(tok, p4b + 0.2, 1.3, 48200, 2100, (v) => Math.round(v).toLocaleString('en-US') + ' tokens');
    count(pct, p4b + 0.2, 1.3, 92, 4, (v) => Math.round(v) + '%');
    tl.to(fill, { scaleX: 0.04, backgroundColor: MINT, duration: 1.3, ease: 'power2.inOut' }, p4b + 0.2);
    tl.to(tok, { color: '#cfc9be', duration: 0.4 }, p4b + 0.4);
    // 只把结论带回来
    const res = at(c, 'chip m', '<span class="k">结论</span>12 单超期 7 天以上', 1340, 450, { fontSize: '19px' });
    hidden(res, { scale: 0.8 });
    pop(res, C('p4', 2) - 0.1);
    flyTo(res, C('p4', 2) + 0.35, 520, 300, CUE.result - C('p4', 2) - 0.35, null, 'y');
    tl.to(res, { scale: 1.06, duration: 0.15, yoyo: true, repeat: 1 }, CUE.result);
    // 很聪明。但……
    const ok = at(c, 'mono', '✓', 735, 300, { fontSize: '22px', color: MINT });
    hidden(ok, { scale: 0.5 }); pop(ok, L('p5') + 0.2);
    tl.to(c, { autoAlpha: 0.38, duration: 1.4, ease: 'power1.inOut' }, C('p5', 1));
    camTo(c, C('p5', 1), 960, 520, 0.95, 4, 'sine.inOut');
  }

  // =====================================================================
  // C —— 插上了，问题才刚开始
  // =====================================================================
  {
    const root = scene(A('c') - 0.3, A('g') - 0.5);
    // --- c1: Type-C
    const c = cam(root);
    camSet(c, 1060, 540, 1.0);
    const PORTS = [-2, -1, 0, 1, 2].map((k) => 540 + k * 190);
    function plug(py) {
      const g = at(c, '', '', 1370 - 1000, py, { width: '2000px', height: '140px' });
      mk('div', 'rubber', g, '', { position: 'absolute', right: '440px', top: '50px', width: '1560px', height: '40px',
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 600px)', maskImage: 'linear-gradient(90deg, transparent 0, #000 600px)' });
      mk('div', 'rubber', g, '', { position: 'absolute', right: '380px', top: '32px', width: '96px', height: '76px', borderRadius: '16px' });
      const body = mk('div', '', g, 'MCP', { position: 'absolute', right: '120px', top: '10px', width: '270px', height: '120px', borderRadius: '30px',
        background: 'linear-gradient(180deg,#dcd8d1 0%,#a9a59e 30%,#8d8983 52%,#a19d96 70%,#6d6964 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 14px 30px rgba(0,0,0,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '30px', fontWeight: 700, letterSpacing: '.32em',
        color: 'rgba(48,44,40,.55)', textShadow: '0 1px 0 rgba(255,255,255,.55)' });
      mk('div', 'metal', g, '', { position: 'absolute', right: '0', top: '44px', width: '134px', height: '52px', borderRadius: '26px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.7)' });
      return g;
    }
    const plugs = PORTS.map((py) => plug(py));
    plugs.forEach((g, i) => hidden(g, { x: i === 2 ? -480 : -360 }));
    const dev = at(c, '', '', 1240 + 300, 540, { width: '600px', height: '1080px', borderRadius: '30px',
      background: 'linear-gradient(90deg,#1e1f22,#141517 40%)', border: '1px solid rgba(236,231,221,.1)', boxShadow: '-20px 0 40px rgba(0,0,0,.5)' });
    const leds = PORTS.map((py) => {
      at(c, '', '', 1246, py, { width: '14px', height: '64px', borderRadius: '4px', background: '#050506', boxShadow: 'inset 3px 0 6px rgba(0,0,0,.9)' });
      const l = at(c, 'nw', '<span class="led"></span>&nbsp;&nbsp;已连接', 1356, py, { fontSize: '17px', color: MINT });
      hidden(l);
      return l;
    });
    hidden(dev);
    fadeIn(dev, A('c') - 0.1, 0.8);
    tl.to(plugs[2], { autoAlpha: 1, duration: 0.5 }, A('c') + 0.1);
    tl.to(plugs[2], { x: -120, duration: 2.0, ease: 'power2.out' }, C('c1', 1) - 0.4);
    tl.to(plugs[2], { x: 0, duration: 0.22, ease: 'power4.in' }, CUE.click - 0.22);
    tl.to(plugs[2], { keyframes: [{ x: -5, duration: 0.06 }, { x: 0, duration: 0.2 }] }, CUE.click);
    tl.to(dev, { keyframes: [{ x: 4, duration: 0.05 }, { x: 0, duration: 0.25 }] }, CUE.click);
    fadeIn(leds[2], CUE.click + 0.05, 0.3);
    // 到处能用
    camTo(c, C('c1', 3) - 0.2, 1060, 540, 0.5, 1.6);
    [0, 1, 3, 4].forEach((k, i) => {
      const t = CUE.leds + i * 0.2;
      tl.to(plugs[k], { autoAlpha: 1, duration: 0.3 }, t - 0.5);
      tl.to(plugs[k], { x: 0, duration: 0.5, ease: 'power3.in' }, t - 0.5);
      fadeIn(leds[k], t, 0.3);
    });
    fadeOut(c, L('c2') - 0.4, 0.7);

    // --- c2–c5: 服务端 —— 管道 —— Agent
    const s = cam(root);
    hidden(s);
    fadeIn(s, L('c2') - 0.3, 0.8);
    const svg = svgLayer(s);
    const srv = card(s, 400, 470, 430, 300, '', { padding: '22px 26px' });
    mk('div', 'lbl', srv, 'MCP SERVER');
    mk('div', 'serif', srv, '我的 MCP Server', { fontSize: '27px', marginTop: '6px' });
    ['search_orders(query, cursor)', 'get_order(id)', 'update_ticket(id, patch)', 'export_report(range)'].forEach((t) =>
      mk('div', 'mono nw', srv, `<span style="color:${AMB}">${t.split('(')[0]}</span><span style="color:${MUTE}">(${t.split('(')[1]}</span>`, { fontSize: '14.5px', marginTop: '11px' }));
    const badge = (parent) => { const b = mk('span', 'tag g', parent, '支持 MCP', { position: 'absolute', right: '22px', top: '20px' }); hidden(b, { scale: 0.6 }); return b; };
    const bS = badge(srv);
    const ag = card(s, 1520, 470, 400, 200, '', { padding: '22px 26px' });
    mk('div', 'lbl', ag, 'AGENT');
    mk('div', 'serif', ag, 'Agent', { fontSize: '27px', marginTop: '6px' });
    mk('div', 'mono', ag, 'tools/list → 4 个工具', { fontSize: '14.5px', marginTop: '12px', color: MUTE });
    const cab = path(svg, 'M615,470 L1320,470', { stroke: COP, width: 3 });
    const cabG = path(svg, 'M615,470 L1320,470', { stroke: 'rgba(201,138,90,.22)', width: 10 });
    const con = at(s, 'tag m', '<span class="led" style="width:7px;height:7px"></span>&nbsp; 已连接', 968, 438);
    hidden(con, { scale: 0.7 });
    draw(cabG, L('c2') + 0.1, 1.1); draw(cab, L('c2') + 0.1, 1.1);
    pop(con, L('c2') + 1.1);
    // c3: 挂在管道上的问题
    const Q = ['下一页谁来取？', '长任务怎么跟进？', '用户确认会弹吗？'];
    const qs = Q.map((q, i) => {
      const x = 760 + i * 205;
      const g = at(s, '', '', x, 470 + 100, { width: '240px', height: '200px', transformOrigin: '50% 0%' });
      mk('div', '', g, '', { position: 'absolute', left: '119.5px', top: '0', width: '1px', height: '92px', background: 'rgba(236,231,221,.35)' });
      mk('div', 'chip a', g, `<span class="k">?</span>${q}`, { left: '50%', top: '92px', transform: 'translateX(-50%)', fontSize: '17px' });
      hidden(g, { y: -24 });
      const t = C('c3', i) + 0.05;
      tl.to(g, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'back.out(2)' }, t);
      swing(g, t + 0.1, 6 + i);
      return g;
    });
    // c4: 结构化结果，两种读法
    const c4 = L('c4') - 0.4;
    qs.forEach((g, i) => tl.to(g, { y: 140, rotation: rr(-20, 20), autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, c4 + i * 0.08));
    tl.to(con, { autoAlpha: 0, duration: 0.4 }, c4);
    tl.to([cab, cabG], { autoAlpha: 0, duration: 0.5 }, c4 + 0.1);
    const pa = path(svg, 'M615,470 L1000,470 C1160,470 1160,300 1320,300', { stroke: COP, width: 3 });
    const pb = path(svg, 'M615,470 L1000,470 C1160,470 1160,660 1320,660', { stroke: COP, width: 3 });
    draw(pa, c4 + 0.1, 0.9); draw(pb, c4 + 0.1, 0.9);
    flyTo(ag, c4, 1520, 300, 0.8, null, 'y');
    const aA = card(s, 1520, 300, 400, 220, '', { padding: '22px 26px' });
    mk('div', 'lbl', aA, 'AGENT');
    mk('div', 'serif', aA, 'Agent A', { fontSize: '27px', marginTop: '6px' });
    const aB = card(s, 1520, 660, 400, 220, '', { padding: '22px 26px' });
    mk('div', 'lbl', aB, 'AGENT');
    mk('div', 'serif', aB, 'Agent B', { fontSize: '27px', marginTop: '6px' });
    hidden(aA); hidden(aB, { y: 30 });
    fadeIn(aA, c4 + 0.6, 0.4);
    tl.to(ag, { autoAlpha: 0, duration: 0.4 }, c4 + 0.6);
    fadeIn(aB, c4 + 0.3, 0.7, { y: 0 });
    const tbl = mk('div', 'mono', aA, null, { marginTop: '10px', fontSize: '14px', lineHeight: '1.65', color: '#d9d4ca' });
    tbl.innerHTML = `<div style="color:${MUTE}">id&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;status&nbsp;&nbsp;age</div><div>A-1042&nbsp;&nbsp;open&nbsp;&nbsp;&nbsp;&nbsp;12d</div><div>A-1047&nbsp;&nbsp;open&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;9d</div>`;
    const tA = mk('span', 'tag m', aA, '✓ outputSchema', { position: 'absolute', right: '22px', top: '62px' });
    const para = mk('div', '', aB, '“共返回 42 个订单，其中几个状态是 open，最早的一单已经……”', { marginTop: '12px', fontSize: '16px', lineHeight: '1.6', color: '#a9a399', width: '330px' });
    const tB = mk('span', 'tag a', aB, '→ 交给模型', { position: 'absolute', right: '22px', top: '62px' });
    [tbl, tA, para, tB].forEach((e) => hidden(e));
    const js = at(s, 'card mono nw', '{ "orders": [ … ],<br>&nbsp;&nbsp;"total": 42 }', 640, 470, { fontSize: '15px', padding: '10px 14px', borderColor: 'rgba(201,138,90,.65)', lineHeight: '1.5' });
    hidden(js, { scale: 0.8 });
    pop(js, C('c4', 0) - 0.1, 0.4);
    flyTo(js, C('c4', 0) + 0.2, 1000, 470, CUE.split - C('c4', 0) - 0.2, null, 'x');
    const jA = at(s, 'card mono nw', js.innerHTML, 1000, 470, { fontSize: '15px', padding: '10px 14px', borderColor: 'rgba(201,138,90,.65)', lineHeight: '1.5' });
    const jB = at(s, 'card mono nw', js.innerHTML, 1000, 470, { fontSize: '15px', padding: '10px 14px', borderColor: 'rgba(201,138,90,.65)', lineHeight: '1.5' });
    hidden(jA); hidden(jB);
    tl.set([jA, jB], { autoAlpha: 1 }, CUE.split);
    tl.set(js, { autoAlpha: 0 }, CUE.split);
    const tAa = C('c4', 1) + 0.6, tBb = C('c4', 2) + 0.7;
    flyTo(jA, CUE.split + 0.05, 1500, 330, tAa - CUE.split - 0.05, null, 'y');
    tl.to(jA, { scale: 0.4, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, tAa - 0.1);
    fadeIn(tbl, tAa, 0.5); pop(tA, tAa + 0.25);
    flyTo(jB, CUE.split + 0.05, 1060, 560, 0.8, null, 'y');
    flyTo(jB, tBb - 0.9, 1500, 690, 0.9, null, 'y');
    tl.to(jB, { scaleY: 0.2, autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, tBb - 0.1);
    fadeIn(para, tBb, 0.6); pop(tB, tBb + 0.3);
    // c5: 都写着“支持 MCP”
    const bA = badge(aA), bB = badge(aB);
    gsap.set([bA, bB], { top: '20px' });
    [bS, bA, bB].forEach((b, i) => pop(b, C('c5', 0) + 0.25 + i * 0.18, 0.4));
    const neq = at(s, 'serif', '≠', 1520, 480, { fontSize: '68px', color: RED });
    hidden(neq, { scale: 1.6 });
    tl.to(neq, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power3.in' }, CUE.neq - 0.3);
    camTo(s, C('c5', 0), 1000, 480, 1.04, 5, 'sine.inOut');
  }

  // =====================================================================
  // G —— 兼容性，靠两头猜
  // =====================================================================
  {
    const root = scene(A('g') - 0.3, A('x') - 0.5);
    const c = cam(root);
    const svg = svgLayer(c);
    // g1: 同一份凭据
    const tok = paper(c, 430, 480, 340, 210, '', { padding: '24px 30px' });
    gsap.set(tok, { rotation: -2 });
    mk('div', 'lbl', tok, '凭据', { color: '#85786a' });
    mk('div', '', tok, 'OAuth Token', { fontFamily: '"DejaVu Serif", serif', fontSize: '32px', marginTop: '6px', color: '#26221d' });
    mk('div', 'mono nw', tok, 'eyJhbGciOiJSUzI1NiIsInR5…', { fontSize: '15px', marginTop: '10px', color: '#5e5448' });
    mk('div', 'mono nw', tok, 'scope: orders.read · exp 3600s', { fontSize: '12.5px', marginTop: '10px', color: '#85786a' });
    hidden(tok, { y: 30 });
    fadeIn(tok, A('g') + 0.1, 0.8, { y: 0 });
    const HY = [270, 480, 690];
    const hosts = HY.map((y, i) => {
      const h = card(c, 1460, y, 400, 150, '', { padding: '22px 28px' });
      mk('div', 'lbl', h, 'MCP 客户端');
      mk('div', 'serif', h, '客户端 ' + 'ABC'[i], { fontSize: '27px', marginTop: '6px' });
      const glow = mk('div', '', h, '', { position: 'absolute', inset: '-1px', borderRadius: '14px', border: `1.5px solid ${[MINT, RED, AMB][i]}`, boxShadow: `0 0 26px ${['rgba(116,212,176,.3)', 'rgba(226,101,76,.3)', 'rgba(230,176,78,.3)'][i]}` });
      hidden(glow);
      hidden(h, { x: 30 });
      fadeIn(h, A('g') + 0.3 + i * 0.15, 0.7, { x: 0 });
      h._glow = glow;
      return h;
    });
    const lines = HY.map((y) => path(svg, `M610,480 C900,480 980,${y} 1255,${y}`, { stroke: 'rgba(236,231,221,.22)', width: 1.4, dash: '4 7' }));
    lines.forEach((p, i) => draw(p, C('g1', 1) + i * 0.1));
    tl.to(tok, { scale: 1.05, duration: 0.25, yoyo: true, repeat: 1 }, C('g1', 1));
    const ghost = () => {
      const g = paper(c, 600, 480, 132, 70, '<div class="mono" style="font-size:13px;color:#5e5448;padding:12px 14px">token<br>eyJhbG…</div>', { borderRadius: '4px' });
      hidden(g, { scale: 0.6 });
      return g;
    };
    const res = (h, cls, txt, t) => { const e = mk('span', 'tag ' + cls, h, txt, { position: 'absolute', right: '24px', top: '58px', fontSize: '16px', padding: '4px 12px' }); hidden(e, { scale: 1.5 }); tl.to(e, { autoAlpha: 1, scale: 1, duration: 0.22, ease: 'power3.in' }, t - 0.05); fadeIn(h._glow, t, 0.25); return e; };
    // A：通过
    const g1 = ghost();
    pop(g1, CUE.pass - 1.0, 0.3);
    flyTo(g1, CUE.pass - 0.8, 1180, 270, 0.8, { rotation: 4 }, 'x');
    tl.to(g1, { autoAlpha: 0, scale: 0.6, duration: 0.25 }, CUE.pass);
    res(hosts[0], 'm', '通过 · 200', CUE.pass);
    // B：被拒，弹回落下
    const g2 = ghost();
    pop(g2, CUE.deny - 1.0, 0.3);
    flyTo(g2, CUE.deny - 0.8, 1180, 480, 0.8, null, 'x');
    tl.to(g2, { x: 1020 - 600, y: 470 - 480, rotation: -18, duration: 0.35, ease: 'power2.out' }, CUE.deny);
    tl.to(g2, { y: 900 - 480, rotation: -40, autoAlpha: 0, duration: 0.8, ease: 'power2.in' }, CUE.deny + 0.35);
    res(hosts[1], 'r', '拒绝 · 401', CUE.deny);
    // C：反复重试
    const g3 = ghost();
    pop(g3, CUE.retry - 1.0, 0.3);
    flyTo(g3, CUE.retry - 0.8, 1180, 690, 0.8, null, 'x');
    const cnt = mk('span', 'tag a', hosts[2], '', { position: 'absolute', right: '24px', top: '58px', fontSize: '16px', padding: '4px 12px' });
    hidden(cnt);
    fadeIn(hosts[2]._glow, CUE.retry, 0.25);
    fadeIn(cnt, CUE.retry, 0.2);
    for (let k = 0; k < 4; k++) {
      const t = CUE.retry + k * 0.45;
      tl.to(g3, { x: 1080 - 600, duration: 0.2, ease: 'power2.out' }, t);
      tl.to(g3, { x: 1180 - 600, duration: 0.22, ease: 'power2.in' }, t + 0.22);
      say(cnt._s || (cnt._s = slot(cnt)), t, '重试 ×' + (k + 1), 0.08);
    }
    const g1grp = [tok, ...hosts, ...lines, g1, g2, g3];
    tl.to(g1grp, { autoAlpha: 0, duration: 0.4 }, LE('g1') + 0.05);

    // g2: 支持矩阵
    const mx = mk('div', 'layer', c);
    gsap.set(mx, { transformOrigin: '790px 470px' });
    const ROWS = ['OAuth 授权', 'structuredContent', '分页 cursor', '长任务 tasks', '用户确认', '资源 resources', 'Apps 界面'];
    const DATA = [
      ['✓', '部分', '✓', '✕', '✓', '旧版'],
      ['✓', '文本', '✓', '文本', '?', '文本'],
      ['✓', '✓', '✕', '✕', '✓', '?'],
      ['部分', '✕', '✓', '✕', '?', '✕'],
      ['✓', '✕', '部分', '✕', '✓', '✕'],
      ['✓', '✓', '✕', '✕', '✓', '部分'],
      ['✓', '✕', '✓', '✕', '扩展', '✕'],
    ];
    const col = (j) => 650 + j * 128, row = (i) => 290 + i * 70;
    const heads = 'ABCDEF'.split('').map((ch, j) => { const e = at(mx, 'lbl', '客户端 ' + ch, col(j), 222, { letterSpacing: '.08em', fontSize: '14px', color: '#b9b4aa' }); hidden(e); return e; });
    heads.forEach(allowTextOverlap); // 特例纸张进入时覆盖背景矩阵标题
    const labs = ROWS.map((r, i) => { const e = at(mx, 'nw', r, 400, row(i), { width: '300px', textAlign: 'right', fontSize: '18px', color: '#d9d4ca' }); hidden(e, { x: -10 }); return e; });
    const cells = [];
    DATA.forEach((rw, i) => rw.forEach((v, j) => {
      const color = v === '✓' ? MINT : v === '✕' ? RED : v === '?' ? MUTE : AMB;
      const e = at(mx, '', v, col(j), row(i), { width: '108px', height: '50px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: v.length > 1 ? '16px' : '22px', color, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(236,231,221,.09)' });
      hidden(e, { scale: 0.5 });
      e._j = j; e._v = v;
      cells.push(e);
    }));
    heads.forEach((e, j) => fadeIn(e, CUE.matrix - 0.3 + j * 0.05, 0.4));
    labs.forEach((e, i) => fadeIn(e, CUE.matrix - 0.3 + i * 0.06, 0.4, { x: 0 }));
    const order = cells.map((e, i) => i).sort(() => rnd() - 0.5);
    order.forEach((ci, k) => pop(cells[ci], CUE.matrix + (k / cells.length) * 2.0, 0.35));
    // 按最弱的那一列来设计
    const weak = at(mx, '', '', col(3), (row(0) + row(6)) / 2, { width: '124px', height: px(row(6) - row(0) + 74), borderRadius: '12px', border: `1.5px solid ${RED}`, boxShadow: '0 0 24px rgba(226,101,76,.25)' });
    const wtag = at(mx, 'tag r', '设计基线 = 最弱的客户端', col(3), row(6) + 66, { fontSize: '15px' });
    hidden(weak, { scale: 1.08 }); hidden(wtag, { y: -6 });
    tl.to(weak, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power2.out' }, CUE.weak);
    fadeIn(wtag, CUE.weak + 0.3, 0.4, { y: 0 });
    cells.filter((e) => e._j !== 3).forEach((e) => fadeTo(e, CUE.weak + 0.6 + rnd() * 0.5, 0.22, 0.6));
    // g3: Agent 自己兜底
    tl.to(mx, { x: -170, scale: 0.86, duration: 1.0, ease: 'power2.inOut' }, L('g3') - 0.3);
    const rt = card(c, 1600, 480, 360, 430, '', { padding: '24px 28px' });
    mk('div', 'lbl', rt, 'AGENT 运行时');
    mk('div', 'serif', rt, '自己兜底', { fontSize: '28px', marginTop: '6px' });
    hidden(rt, { x: 40 });
    fadeIn(rt, L('g3') - 0.1, 0.8, { x: 0 });
    const FB = [['超时', '30s'], ['重试', '×3'], ['降级', '只读文本'], ['人工确认', '每次写操作']];
    const fbt = [C('g3', 1), C('g3', 2), C('g3', 2) + 0.45, C('g3', 2) + 0.9];
    FB.forEach(([k, v], i) => {
      const e = mk('div', 'chip a', rt, `<span class="k">${k}</span>${v}`, { position: 'absolute', left: '28px', top: px(110 + i * 72), fontSize: '18px' });
      hidden(e, { x: 40 });
      fadeIn(e, fbt[i], 0.5, { x: 0, ease: 'back.out(1.6)' });
    });
    // g4: 特例记录
    const nb = paper(c, 960, 500, 860, 580, '', { padding: '40px 58px' });
    mk('div', '', nb, '', { position: 'absolute', inset: '118px 40px 30px 40px', backgroundImage: 'repeating-linear-gradient(180deg, transparent 0 53px, rgba(70,90,130,.22) 53px 54px)' });
    mk('div', '', nb, '', { position: 'absolute', left: '96px', top: '0', bottom: '0', width: '1px', background: 'rgba(190,60,50,.35)' });
    const hd = mk('div', '', nb, '', { display: 'flex', alignItems: 'baseline', gap: '18px', paddingLeft: '56px' });
    mk('div', 'serif', hd, '特例记录', { fontSize: '36px', fontWeight: 700, color: '#26221d' });
    mk('div', '', hd, '接一次 · 测一次 · 记一笔', { fontSize: '16px', color: '#8a7a66', letterSpacing: '.12em' });
    const ENT = ['客户端 B：refresh token 不刷新，只能重新授权', '客户端 D：忽略 structuredContent，只读文本', '客户端 E：确认框不弹，写操作直接执行',
      '客户端 A：分页 cursor 不回传', '客户端 F：只认旧版授权流程', '客户端 C：长任务一超时就整个重发'];
    const ents = ENT.map((t, i) => {
      const e = mk('div', 'serif nw', nb, `<span style="color:#9a8b78;font-size:16px;margin-right:18px">#${i + 1}</span>${t}`,
        { position: 'absolute', left: '70px', top: px(128 + i * 54), fontSize: '22px', color: '#2c2620' });
      return e;
    });
    hidden(nb, { y: 760, rotation: 3 });
    tl.to(nb, { autoAlpha: 1, duration: 0.2 }, CUE.paper);
    tl.to(nb, { y: 0, rotation: -1.2, duration: 1.0, ease: 'power3.out' }, CUE.paper);
    tl.to([mx, rt], { autoAlpha: 0.22, duration: 0.8 }, CUE.paper + 0.2);
    const et = [C('g4', 2) - 0.1, C('g4', 3) - 0.1, C('g4', 4) - 0.1, C('g4', 4) + 0.4, C('g4', 4) + 0.8, C('g4', 4) + 1.2];
    ents.forEach((e, i) => type(e, et[i], 0.45, 22));
  }

  // =====================================================================
  // X —— 扩展一层层叠上去，“已连接”说明得越来越少
  // =====================================================================
  const SLABS = [
    ['MCP Apps', '界面组件 · ui://', 700, -10],
    ['Plugin Extensions', 'window.openai', 820, 30],
    ['宿主 X 扩展', '侧边栏 · 文件查看', 620, -46],
    ['宿主 Y 扩展', '富表单 · 私有事件', 680, 36],
    ['宿主 Z 扩展', '……', 560, -20],
  ];
  const BASE_Y = 790, SLAB_H = 66, STEP = 72;
  function slabEl(parent, name, sub, w, dx, k, accent) {
    const e = at(parent, 'card', '', 960 + dx, BASE_Y - (k + 1) * STEP, { width: px(w), height: px(SLAB_H), borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px' });
    mk('span', 'serif nw', e, name, { fontSize: '23px', color: '#ebe6dc' });
    mk('span', 'mono nw', e, sub, { fontSize: '14px', color: accent || MUTE });
    return e;
  }
  function baseEl(parent) {
    const b = at(parent, 'card', '', 960, BASE_Y, { width: '760px', height: '70px', borderRadius: '10px', borderTop: `2px solid ${COP}`, display: 'flex', alignItems: 'center', padding: '0 26px', gap: '14px' });
    mk('span', 'serif', b, 'MCP', { fontSize: '26px', fontWeight: 700, letterSpacing: '.1em' });
    mk('span', '', b, '协议', { fontSize: '16px', color: MUTE });
    const tg = mk('span', 'tag m', b, '<span class="led" style="width:7px;height:7px"></span>&nbsp; 已连接', { marginLeft: 'auto', fontSize: '14px' });
    return [b, tg];
  }
  {
    const root = scene(A('x') - 0.3, A('s') - 0.5);
    const c = cam(root);
    camSet(c, 960, 640, 1.0);
    const [base, btag] = baseEl(c);
    const slabs = SLABS.map(([n, s, w, dx], k) => slabEl(c, n, s, w, dx, k));
    slabs.forEach((e) => hidden(e, { y: -620 }));
    const tcue = [CUE.slab1, CUE.slab2, CUE.slab3, CUE.slab4, CUE.slab5];
    slabs.forEach((e, k) => {
      drop(e, tcue[k], 0.5, 0.9, rr(-0.6, 0.6));
      const below = [base, ...slabs.slice(0, k)];
      tl.to(below, { y: 3, duration: 0.06 }, tcue[k]);
      tl.to(below, { y: 0, duration: 0.35, ease: 'power2.out' }, tcue[k] + 0.06);
    });
    camTo(c, CUE.slab2, 960, 560, 0.94, 3.2, 'sine.inOut');
    // 每一层都合理
    slabs.forEach((e, k) => {
      const ck = mk('span', 'mono', e, '✓', { marginLeft: 'auto', color: MINT, fontSize: '20px' });
      hidden(ck, { scale: 0.4 });
      pop(ck, C('x2', 0) + 0.1 + k * 0.16, 0.35);
    });
    // 推近“已连接”，再拉远：上面还在长
    camTo(c, C('x2', 1) - 0.1, 1220, 760, 1.55, 1.3);
    tl.to(btag, { boxShadow: '0 0 24px rgba(116,212,176,.55)', duration: 0.4 }, C('x2', 1) + 0.5);
    camTo(c, C('x2', 2) - 0.1, 960, 420, 0.62, 2.6, 'power2.inOut');
    tl.to(btag, { autoAlpha: 0.35, scale: 0.82, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 1.4 }, C('x2', 2) + 0.4);
    for (let k = 0; k < 9; k++) {
      const w = rr(480, 820), dx = rr(-60, 60);
      const g = at(c, '', '', 960 + dx, BASE_Y - (SLABS.length + 1 + k) * STEP, { width: px(w), height: px(SLAB_H), borderRadius: '10px', border: '1.5px dashed rgba(236,231,221,.42)' });
      hidden(g, { y: -40 });
      fadeIn(g, C('x2', 2) + 0.2 + k * 0.22, 0.5, { y: 0 });
    }
  }

  // =====================================================================
  // S —— 命令行、Linux 机器与凭据；沙箱是节点，控制层常驻
  // =====================================================================
  {
    const root = scene(A('s') - 0.3, A('m') - 0.5);
    const c = cam(root);
    const svg = svgLayer(c);
    // s1: 终端
    const term = card(c, 960, 460, 800, 300, '', { background: '#0d0e10', padding: '0', overflow: 'hidden' });
    const bar = mk('div', '', term, '', { height: '36px', borderBottom: '1px solid rgba(236,231,221,.08)', display: 'flex', gap: '8px', alignItems: 'center', padding: '0 16px' });
    for (let i = 0; i < 3; i++) mk('span', '', bar, '', { width: '11px', height: '11px', borderRadius: '50%', background: '#36373a' });
    const tb = mk('div', 'mono', term, null, { padding: '22px 26px', fontSize: '20px', lineHeight: '1.7', color: '#e2ddd3' });
    const cmd = mk('div', 'nw', tb, `<span style="color:${MINT}">~ $</span> gh issue list --state open`);
    const outs = [['#412', '登录后偶尔掉线', 'bug'], ['#409', '导出 CSV 编码错误', 'bug'], ['#405', '支持批量退款', 'feature']].map(([a, b, d]) =>
      mk('div', 'nw', tb, `<span style="color:${AMB}">${a}</span>&nbsp;&nbsp;${b}&nbsp;&nbsp;<span style="color:${MUTE}">${d}</span>`, { fontSize: '16px', color: '#bab5ab' }));
    hidden(term, { y: 20 });
    fadeIn(term, A('s') - 0.1, 0.7, { y: 0 });
    type(cmd, C('s1', 0) + 0.3, 1.3, 32);
    outs.forEach((e, i) => { hidden(e); fadeIn(e, C('s1', 1) + 0.8 + i * 0.12, 0.2); });
    tl.to(term, { autoAlpha: 0, scale: 0.6, x: -560, y: -230, duration: 0.8, ease: 'power2.in' }, L('s2') - 0.3);
    // s2: 查订单 —— 先领一台机器
    const agent = at(c, 'chip m', '<span class="k">智能体</span>查订单', 330, 500, { fontSize: '20px' });
    hidden(agent, { scale: 0.8 });
    pop(agent, C('s2', 0) + 0.1);
    const ws = card(c, 1100, 500, 660, 470, '', { padding: '26px 32px' });
    mk('div', 'lbl', ws, 'LINUX 工作站');
    mk('div', 'mono', ws, 'ubuntu-24.04 · 8 vCPU · 32 GB · 常驻', { fontSize: '14px', color: MUTE, marginTop: '6px' });
    [['文件系统', '/home/agent'], ['依赖', 'apt · npm · pip · …'], ['工具', 'git · gh · aws · docker']].forEach(([k, v]) => {
      const r = mk('div', 'nw', ws, `<span style="display:inline-block;width:110px;color:${MUTE};font-size:15px">${k}</span><span class="mono" style="font-size:16px">${v}</span>`, { marginTop: '14px', fontSize: '16px' });
    });
    const vault = mk('div', '', ws, '', { position: 'absolute', left: '32px', right: '32px', bottom: '28px', height: '150px', borderRadius: '10px', border: '1.5px dashed rgba(230,176,78,.4)' });
    mk('div', 'lbl', vault, '凭据', { position: 'absolute', left: '14px', top: '10px', color: AMB });
    hidden(ws, { y: -720 });
    drop(ws, CUE.thud, 0.6, 0.93);
    tl.to(agent, { keyframes: [{ y: -8, duration: 0.08 }, { y: 0, duration: 0.3, ease: 'bounce.out' }] }, CUE.thud);
    const teth = path(svg, 'M420,500 Q590,560 768,500', { stroke: 'rgba(236,231,221,.35)', width: 1.6 });
    draw(teth, CUE.thud + 0.2, 0.6);
    const KEYS = ['GitHub token', 'AWS 密钥', '~/.ssh/id_ed25519', '浏览器 Cookie', '数据库密码'];
    const kpos = [[930, 668], [1120, 668], [1300, 668], [990, 714], [1200, 714]];
    const keys = KEYS.map((k, i) => {
      const e = at(c, 'chip a', `<span class="k">◆</span>${k}`, kpos[i][0], kpos[i][1], { fontSize: '15px', padding: '5px 11px' });
      allowTextOverlap(e); // 凭据移入控制层时会汇聚到同一位置
      hidden(e, { y: -700, rotation: rr(-30, 30) });
      const t = CUE.keys + i * 0.32;
      tl.to(e, { autoAlpha: 1, duration: 0.1 }, t - 0.45);
      tl.to(e, { y: 0, rotation: rr(-4, 4), duration: 0.45, ease: 'power3.in' }, t - 0.45);
      tl.to(e, { keyframes: [{ y: -10, duration: 0.1, ease: 'power2.out' }, { y: 0, duration: 0.14, ease: 'power2.in' }] }, t);
      tl.to(ws, { keyframes: [{ y: 2, duration: 0.05 }, { y: 0, duration: 0.2 }] }, t);
      return e;
    });
    const risk = at(c, 'tag r', '撤权？审计？泄漏了怎么办？', 1100, 790, { fontSize: '16px', padding: '4px 12px' });
    hidden(risk, { y: -6 });
    fadeIn(risk, Math.min(CUE.keys + 1.7, L('s3') - 1.0), 0.4, { y: 0 });
    // s3: 机器变成一个节点；沙箱用时创建、用完回收
    const s3 = L('s3') - 0.35;
    tl.to(ws, { x: 520 - 1100, y: 770 - 500, scale: 0.42, autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, s3);
    tl.to([agent, risk, teth], { autoAlpha: 0, duration: 0.5 }, s3);
    keys.forEach((e, i) => tl.to(e, { y: -1000 - rr(0, 100), x: rr(-120, 120), rotation: rr(-20, 20), duration: 0.8, ease: 'power2.in' }, s3 + i * 0.05));
    const node = (x, en, zh, sub) => {
      const n = card(c, x, 770, 300, 128, '', { padding: '20px 24px' });
      mk('div', 'lbl', n, en);
      mk('div', 'serif', n, zh, { fontSize: '26px', marginTop: '4px' });
      mk('div', '', n, sub, { fontSize: '14px', color: MUTE, marginTop: '4px' });
      hidden(n, { scale: 0.9 });
      return n;
    };
    const nL = node(520, 'LOCAL', '本地电脑', '代码 · 浏览器 · 桌面软件');
    const nR = node(1400, 'REMOTE', '远程服务', '订单 · 工单 · 文档');
    pop(nL, s3 + 0.6, 0.6); pop(nR, s3 + 0.8, 0.6);
    const slotLbl = at(c, 'lbl', 'SANDBOX', 960, 690);
    hidden(slotLbl); fadeIn(slotLbl, s3 + 0.8, 0.5);
    let sbN = 0;
    function sandbox(t0, t1) {
      sbN++;
      const b = at(c, '', '', 960 + (sbN % 2 ? -8 : 10), 772, { width: '290px', height: '128px', borderRadius: '14px', border: '1.5px dashed rgba(116,212,176,.6)', background: 'rgba(116,212,176,.05)', padding: '18px 22px' });
      mk('div', 'serif', b, '临时沙箱 #' + sbN, { fontSize: '24px' });
      const tr = mk('div', '', b, '', { position: 'absolute', left: '22px', right: '22px', bottom: '22px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.07)', overflow: 'hidden' });
      const f = mk('div', '', tr, '', { position: 'absolute', inset: 0, background: MINT, transformOrigin: '0 50%' });
      gsap.set(f, { scaleX: 0 });
      hidden(b, { scale: 0.7 });
      pop(b, t0, 0.5);
      tl.to(f, { scaleX: 1, duration: t1 - t0 - 0.6, ease: 'power1.inOut' }, t0 + 0.3);
      tl.to(b, { autoAlpha: 0, scale: 0.9, duration: 0.5, ease: 'power2.in' }, t1);
      return b;
    }
    sandbox(C('s3', 1) - 0.1, C('s3', 2) + 0.2);
    const sbx2 = LE('s3') + 0.1;
    [0, 2.2, 4.4, 6.6].forEach((o) => sandbox(sbx2 + o, sbx2 + o + 1.9));
    // s4: 控制层
    const ctrl = card(c, 960, 300, 1240, 150, '', { padding: '26px 34px', borderTop: `2px solid ${COP}` });
    const ch = mk('div', '', ctrl, '', { display: 'flex', alignItems: 'baseline', gap: '14px' });
    mk('span', 'lbl', ch, 'CONTROL');
    mk('div', 'serif', ctrl, '控制层', { fontSize: '32px', marginTop: '4px' });
    mk('div', 'nw', ctrl, '<span class="led"></span>&nbsp;&nbsp;长期在线', { fontSize: '15px', color: MINT, marginTop: '6px' });
    const comp = (x, k, v, cls) => { const e = at(c, 'chip ' + (cls || ''), `<span class="k">${k}</span>${v}`, x, 300, { fontSize: '17px', padding: '12px 18px' }); hidden(e, { y: 10 }); return e; };
    const cT = comp(840, '任务', '进度 · 产物'), cP = comp(1080, '权限', '审批记录'), cV = comp(1350, '凭据', '统一保管', 'a');
    gsap.set(cV, { width: '250px', height: '110px', padding: '12px 18px' });
    hidden(ctrl, { y: -260 });
    const s4 = C('s4', 0) - 0.4;
    tl.to(ctrl, { autoAlpha: 1, duration: 0.3 }, s4);
    tl.to(ctrl, { y: 0, duration: 0.9, ease: 'power3.out' }, s4);
    [cT, cP, cV].forEach((e, i) => fadeIn(e, s4 + 0.5 + i * 0.15, 0.5, { y: 0 }));
    tl.to(ctrl, { boxShadow: '0 0 40px rgba(201,138,90,.25), 0 20px 44px rgba(0,0,0,.5)', duration: 0.6 }, CUE.ctrl);
    // 凭据回到控制层
    keys.forEach((e, i) => {
      const tx = 1300 + (i % 3) * 50 - 50, ty = 318 + Math.floor(i / 3) * 22;
      tl.set(e, { x: tx - e._cx, y: -500, scale: 0.55, rotation: rr(-10, 10) }, CUE.ctrl - 0.2);
      tl.to(e, { y: ty - e._cy, autoAlpha: 1, rotation: rr(-3, 3), duration: 0.55, ease: 'power3.in' }, CUE.ctrl + 0.2 + i * 0.13);
    });
    // 调度线与流动
    const dl = [520, 960, 1400].map((x) => path(svg, `M${x === 960 ? 960 : x},375 C${x},520 ${x},560 ${x},706`, { stroke: 'rgba(201,138,90,.5)', width: 1.6, dash: '3 6' }));
    dl.forEach((p, i) => draw(p, C('s4', 1) - 0.4 + i * 0.12));
    const pass = at(c, 'chip m', '<span class="k">短期凭据</span>仅本次会话', 1350, 330, { fontSize: '14px', padding: '5px 10px' });
    hidden(pass, { scale: 0.7 });
    pop(pass, C('s4', 1) + 0.2, 0.4);
    flyTo(pass, C('s4', 1) + 0.6, 960, 690, 1.3, null, 'y');
    tl.to(pass, { autoAlpha: 0, duration: 0.3 }, C('s4', 1) + 2.0);
    [[520, 700], [1400, 700]].forEach(([x, y], i) => {
      const a = at(c, 'chip', '<span class="k">产物</span>' + ['补丁', '查询结果'][i], x, y, { fontSize: '14px', padding: '5px 10px' });
      hidden(a, { scale: 0.7 });
      const t = C('s4', 1) + 1.0 + i * 0.5;
      pop(a, t, 0.4);
      flyTo(a, t + 0.3, 840, 330, 1.3, null, 'y');
      tl.to(a, { autoAlpha: 0, duration: 0.3 }, t + 1.55);
    });
    camTo(c, L('s4'), 960, 540, 1.0, 0.01);
    camTo(c, L('s4') + 0.1, 960, 520, 0.97, 6, 'sine.inOut');
  }

  // =====================================================================
  // M —— 退回一个更小的位置；一根到处都有的管道；适配的轮回
  // =====================================================================
  {
    const root = scene(A('m') - 0.3, A('e') - 0.5);
    const c = cam(root);
    camSet(c, 960, 560, 0.94);
    const [base] = baseEl(c);
    const slabs = SLABS.map(([n, s, w, dx], k) => slabEl(c, n, s, w, dx, k));
    // 上层抬起、散开
    const m1 = C('m1', 0) + 0.8;
    slabs.forEach((e, k) => {
      tl.to(e, { y: -380 - k * 30 + rr(-20, 20), x: rr(-120, 120), rotation: rr(-4, 4), autoAlpha: 0, duration: 1.4, ease: 'power2.inOut' }, m1 + (4 - k) * 0.08);
    });
    camTo(c, m1, 960, 540, 1.0, 1.6);
    tl.to(base, { autoAlpha: 0, duration: 0.4 }, C('m1', 1) - 0.3);
    // 能力接口
    const ifc = card(c, 960, 680, 1000, 200, '', { padding: '24px 34px', borderTop: `2px solid ${COP}` });
    const ih = mk('div', '', ifc, '', { display: 'flex', alignItems: 'baseline', gap: '14px' });
    mk('span', 'serif', ih, 'MCP', { fontSize: '28px', fontWeight: 700, letterSpacing: '.1em' });
    mk('span', '', ih, '能力接口', { fontSize: '18px', color: '#d9d4ca' });
    mk('span', 'tag m', ih, '稳定 · 保守', { marginLeft: 'auto' });
    const cols = mk('div', '', ifc, '', { display: 'flex', gap: '26px', marginTop: '18px' });
    const COLS = [['能力', 'tools/list'], ['输入', 'inputSchema'], ['输出', 'outputSchema · structuredContent']];
    const cEls = COLS.map(([k, v]) => {
      const e = mk('div', '', cols, `<div class="lbl" style="color:${MINT}">${k}</div><div class="mono nw" style="font-size:16px;margin-top:6px">${v}</div>`,
        { flex: k === '输出' ? '1.6' : '1', padding: '10px 14px', borderRadius: '9px', border: '1px solid rgba(236,231,221,.1)', background: 'rgba(255,255,255,.02)' });
      gsap.set(e, { opacity: 0.28 });
      return e;
    });
    hidden(ifc, { scaleY: 0.4 });
    tl.to(ifc, { autoAlpha: 1, scaleY: 1, duration: 0.7, ease: 'power3.out' }, C('m1', 1) - 0.3);
    [C('m2', 0), C('m2', 1), C('m2', 2)].forEach((t, i) => {
      tl.to(cEls[i], { opacity: 1, borderColor: 'rgba(116,212,176,.55)', duration: 0.4 }, t);
    });
    // 上层：运行框架，在试
    const up = at(c, '', '', 960, 330, { width: '1100px', height: '230px', borderRadius: '18px', border: '1.5px dashed rgba(236,231,221,.22)' });
    mk('div', 'lbl', up, '运行框架 · 上层', { position: 'absolute', left: '22px', top: '16px' });
    hidden(up);
    const UPC = ['工具发现', '延迟加载', '代码模式', '界面', '长任务', '沙箱调度'];
    const spots = [[560, 330], [740, 290], [930, 360], [1110, 300], [1280, 370], [1370, 290], [650, 400], [1020, 280], [1200, 420]];
    const ucs = UPC.map((t, i) => { const [x, y] = spots[i]; const e = at(c, 'chip', t, x, y, { fontSize: '18px' }); hidden(e, { scale: 0.7 }); return e; });
    const vlinks = [760, 1160].map((x) => at(c, '', '', x, 512, { width: '1px', height: '120px', borderLeft: '1.5px dashed rgba(236,231,221,.22)' }));
    vlinks.forEach((v) => hidden(v));
    const m2b = C('m2', 3) - 0.2;
    fadeIn(up, m2b, 0.6); vlinks.forEach((v) => fadeIn(v, m2b + 0.2, 0.5));
    ucs.forEach((e, i) => pop(e, m2b + 0.3 + i * 0.1, 0.45));
    for (let r = 1; r <= 3; r++) {
      const t = m2b + 0.6 + r * 1.25;
      const perm = spots.slice().sort(() => rnd() - 0.5);
      ucs.forEach((e, i) => flyTo(e, t + i * 0.04, perm[i][0], perm[i][1], 1.0, null, i % 2 ? 'x' : 'y'));
    }
    tl.to(c, { autoAlpha: 0, duration: 0.7 }, L('m3') - 0.5);

    // m3–m5: 一根到处都有的管道
    const n = cam(root);
    hidden(n);
    fadeIn(n, L('m3') - 0.3, 0.8);
    camSet(n, 960, 540, 1.06);
    camTo(n, L('m3') - 0.3, 960, 540, 1.0, 6, 'sine.out');
    const svg = svgLayer(n);
    const busG = path(svg, 'M110,540 L1810,540', { stroke: 'rgba(201,138,90,.22)', width: 12 });
    const bus = path(svg, 'M110,540 L1810,540', { stroke: COP, width: 3 });
    draw(busG, C('m3', 0), 1.4, 'power2.out'); draw(bus, C('m3', 0), 1.4, 'power2.out');
    const NA = 13;
    const agents = [], servers = [];
    for (let i = 0; i < NA; i++) {
      const x = 190 + i * 128, ya = 300 + (i % 2 ? 26 : -12), ys = 780 + (i % 2 ? -14 : 22);
      const a = at(n, '', '', x, ya, { width: '34px', height: '34px', borderRadius: '50%', border: '1.5px solid rgba(236,231,221,.55)', background: '#1c1e22' });
      const s = at(n, '', '', x + 40, ys, { width: '32px', height: '32px', borderRadius: '7px', border: '1.5px solid rgba(201,138,90,.7)', background: '#1c1e22' });
      hidden(a, { scale: 0.5 }); hidden(s, { scale: 0.5 });
      const pa = path(svg, `M${x},${ya + 17} C${x},${ya + 120} ${x},460 ${x},540`, { stroke: 'rgba(201,138,90,.55)', width: 1.4 });
      const ps = path(svg, `M${x + 40},${ys - 16} C${x + 40},${ys - 110} ${x + 40},620 ${x + 40},540`, { stroke: 'rgba(201,138,90,.55)', width: 1.4 });
      const t = C('m3', 1) - 0.4 + i * 0.07;
      pop(a, t, 0.4); pop(s, t + 0.05, 0.4);
      draw(pa, t + 0.1, 0.6); draw(ps, t + 0.15, 0.6);
      agents.push({ x, y: ya, e: a }); servers.push({ x: x + 40, y: ys, e: s });
    }
    const la = at(n, 'lbl', 'AGENT', 120, 300), ls = at(n, 'lbl', '服务端', 120, 790);
    hidden(la); hidden(ls); fadeIn(la, C('m3', 1), 0.5); fadeIn(ls, C('m3', 1) + 0.2, 0.5);
    // 管道上的脉冲
    for (let k = 0; k < 10; k++) {
      const d = at(n, '', '', 110, 540, { width: '8px', height: '8px', borderRadius: '50%', background: '#f3cfa8', boxShadow: '0 0 12px rgba(240,180,130,.9)' });
      hidden(d);
      const t = C('m3', 1) + 0.6 + k * 1.3;
      tl.to(d, { autoAlpha: 1, duration: 0.2 }, t);
      tl.to(d, { x: 1700 * (k % 2 ? 1 : 1), duration: 3.2, ease: 'none' }, t);
      tl.to(d, { autoAlpha: 0, duration: 0.3 }, t + 2.9);
    }
    // 当年：适配各家 API
    const era1 = at(n, 'serif nw', '当年', 220, 170, { fontSize: '26px', color: '#b59a74', letterSpacing: '.2em' });
    hidden(era1);
    fadeIn(era1, C('m4', 0) + 0.2, 0.6);
    const oldT = [1, 3, 4, 6, 8, 9, 11].map((i, k) => {
      const s = servers[i];
      const e = at(n, 'nw', '适配 ' + ['支付', '短信', '地图', '邮件', 'CRM', '工单', '网盘'][k] + ' API', s.x + 6, s.y + 48, {
        fontSize: '13px', padding: '2px 8px', borderRadius: '5px', color: '#c4ab86', border: '1px dashed rgba(196,171,134,.6)', background: 'rgba(196,171,134,.06)' });
      const strike = mk('div', '', e, '', { position: 'absolute', left: '4px', right: '4px', top: '50%', height: '1.5px', background: '#c4ab86', transformOrigin: '0 50%' });
      gsap.set(strike, { scaleX: 0 });
      hidden(e, { y: 6 });
      fadeIn(e, C('m4', 1) + k * 0.12, 0.4, { y: 0 });
      tl.to(strike, { scaleX: 1, duration: 0.35, ease: 'power2.out' }, LE('m4') - 0.1 + k * 0.06);
      tl.to(e, { autoAlpha: 0.35, duration: 0.5 }, LE('m4') + 0.3 + k * 0.06);
      return e;
    });
    // 现在：适配各家对 MCP 的理解
    const era2 = at(n, 'serif nw', '现在', 220, 214, { fontSize: '26px', color: AMB, letterSpacing: '.2em' });
    hidden(era2);
    fadeIn(era2, CUE.flip - 0.3, 0.6);
    tl.to(era1, { autoAlpha: 0.35, duration: 0.6 }, CUE.flip - 0.3);
    const NEW = ['的授权', '的扩展', '的分页', '的界面', '的确认框', '的结构化结果', '的长任务', '的重试'];
    [0, 2, 3, 5, 7, 8, 10, 12].forEach((i, k) => {
      const a = agents[i];
      const e = at(n, 'tag a nw', '适配 ' + 'ABCDEFGH'[k] + ' ' + NEW[k], a.x, a.y - 44, { fontSize: '13px', transformPerspective: 600 });
      hidden(e, { rotationX: -90 });
      const t = CUE.flip + k * 0.16;
      tl.to(e, { autoAlpha: 1, duration: 0.1 }, t);
      tl.to(e, { rotationX: 0, duration: 0.55, ease: 'back.out(2)' }, t);
    });
    tl.to([busG], { autoAlpha: 0.35, duration: 1.2 }, C('m5', 1));
    camTo(n, C('m5', 1), 960, 520, 0.96, 3, 'sine.inOut');
  }

  // =====================================================================
  // E —— 摊开来看：一地鸡毛
  // =====================================================================
  {
    const root = scene(A('e') - 0.3, null, 0.8);
    const c = cam(root);
    const floor = mk('div', 'layer', c, '', { background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 82%, rgba(255,240,220,.035) 92%, rgba(0,0,0,.25) 100%)' });
    hidden(floor);
    fadeIn(floor, L('e2'), 2.0);
    function build(k, w, h) {
      const e = card(c, 0, 0, w, h, '', { padding: '14px 18px', overflow: 'hidden' });
      const lb = (t) => mk('div', 'lbl', e, t, { fontSize: '11px' });
      if (k === 'plug') {
        Object.assign(e.style, { background: 'linear-gradient(180deg,#dcd8d1 0%,#a9a59e 30%,#8d8983 52%,#a19d96 70%,#6d6964 100%)', border: 'none', borderRadius: '30px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '26px', letterSpacing: '.3em', color: 'rgba(48,44,40,.6)', textShadow: '0 1px 0 rgba(255,255,255,.5)' });
        e.textContent = 'MCP';
      } else if (k === 'code') {
        lb('CODEMODE');
        mk('div', 'mono nw', e, `<span style="color:#c792ea">const</span> open = <span style="color:#c792ea">await</span><br><span style="color:${AMB}">mcp.orders.list</span>(…)`, { fontSize: '14px', marginTop: '8px', lineHeight: '1.6' });
      } else if (k === 'apps' || k === 'ext') {
        Object.assign(e.style, { display: 'flex', alignItems: 'center', gap: '12px' });
        mk('span', 'serif nw', e, k === 'apps' ? 'MCP Apps' : 'Plugin Extensions', { fontSize: '20px' });
        mk('span', 'mono nw', e, k === 'apps' ? 'ui://' : 'window.openai', { fontSize: '12px', color: MUTE });
      } else if (k === 'term') {
        Object.assign(e.style, { background: '#0d0e10' });
        mk('div', 'mono nw', e, `<span style="color:${MINT}">~ $</span> gh issue list<br><span style="color:${MUTE}">#412 登录后偶尔掉线</span>`, { fontSize: '14px', lineHeight: '1.7', marginTop: '18px' });
      } else if (k === 'box') {
        Object.assign(e.style, { background: 'rgba(116,212,176,.05)', border: '1.5px dashed rgba(116,212,176,.6)' });
        lb('SANDBOX');
        mk('div', 'serif', e, '临时沙箱', { fontSize: '22px', marginTop: '6px' });
      } else if (k === 'ctrl') {
        Object.assign(e.style, { borderTop: `2px solid ${COP}`, display: 'flex', alignItems: 'center', gap: '14px' });
        mk('span', 'serif', e, '控制层', { fontSize: '22px' });
        mk('span', 'nw', e, '<span class="led" style="width:6px;height:6px"></span> 长期在线', { fontSize: '13px', color: MINT });
      } else if (k === 'matrix') {
        lb('支持矩阵');
        const g = mk('div', '', e, '', { display: 'grid', gridTemplateColumns: 'repeat(6, 22px)', gap: '6px', marginTop: '10px' });
        for (let i = 0; i < 24; i++) mk('div', '', g, '', { width: '22px', height: '16px', borderRadius: '4px', background: [MINT, RED, AMB, MUTE][Math.floor(rnd() * 4)], opacity: 0.75 });
      } else if (k === 'note') {
        e.className = 'paper';
        Object.assign(e.style, { padding: '16px 20px' });
        mk('div', 'serif', e, '特例记录', { fontSize: '20px', fontWeight: 700 });
        ['#1 客户端 B：不刷新', '#2 客户端 D：只读文本', '#3 客户端 E：不弹确认'].forEach((t) => mk('div', 'serif nw', e, t, { fontSize: '13px', marginTop: '8px', color: '#4a4036' }));
      }
      return allowTextOverlap(e); // 结尾道具摊开、落地后有意堆叠
    }
    const e1T = [C('e1', 0), C('e1', 0) + 0.5, C('e1', 1), C('e1', 1) + 0.35, C('e1', 2), C('e1', 3), C('e1', 3) + 0.35, C('e1', 3) + 0.7, C('e1', 3) + 1.05];
    const G = TL.G;
    TL.ecards.forEach((d, i) => {
      const e = build(d.k, d.w, d.h);
      gsap.set(e, { left: px(d.gx), top: px(d.gy) });
      hidden(e, { scale: 0.85 });
      pop(e, e1T[i], 0.55);
      const ck = at(c, 'mono', '✓', d.gx + d.w / 2 - 6, d.gy - d.h / 2 + 4, { fontSize: '18px', color: MINT, width: '26px', height: '26px', borderRadius: '50%', background: '#16181b',
        border: '1px solid rgba(116,212,176,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      hidden(ck, { scale: 0.4 });
      pop(ck, C('e1', 4) + i * 0.1, 0.35);
      fadeOut(ck, L('e2') - 0.1, 0.4);
      // 摊开
      tl.to(e, { x: d.sx - d.gx, y: d.sy - d.gy, rotation: d.sr, duration: 2.4, ease: 'power2.inOut' }, L('e2') + i * 0.05);
      // 落地：与混音同一组参数
      const T1 = Math.sqrt(2 * (d.yf - d.sy) / G), v2 = 0.26 * G * T1, T2 = 2 * v2 / G, v3 = 0.26 * v2, T3 = 2 * v3 / G, TT = T1 + T2 + T3;
      track(e, d.t0, TT + 0.05, (u, s) => {
        let y;
        if (s < T1) y = d.sy + 0.5 * G * s * s;
        else if (s < T1 + T2) { const q = s - T1; y = d.yf - (v2 * q - 0.5 * G * q * q); }
        else if (s < TT) { const q = s - T1 - T2; y = d.yf - (v3 * q - 0.5 * G * q * q); }
        else y = d.yf;
        const k = Math.min(1, s / TT);
        const x = d.sx + (d.xf - d.sx) * (1 - Math.pow(1 - k, 2));
        const r = d.sr + (d.rf - d.sr) * (1 - Math.pow(1 - k, 3));
        return { x: x - d.gx, y: y - d.gy, rotation: r };
      });
    });
    camTo(c, L('e2') + 1.2, 960, 560, 1.03, 5, 'sine.inOut');
    // 羽毛
    function feather(len) {
      const s = document.createElementNS(SVGNS, 'svg');
      s.setAttribute('viewBox', '0 0 64 200');
      s.setAttribute('width', 64 * len / 200); s.setAttribute('height', len);
      let g = `<defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4efe6" stop-opacity=".92"/><stop offset=".75" stop-color="#e9e1d3" stop-opacity=".7"/><stop offset="1" stop-color="#e9e1d3" stop-opacity=".25"/></linearGradient></defs>`;
      g += `<path d="M32,188 C6,152 2,78 29,6 C52,40 62,122 35,184 Z" fill="url(#fg)"/>`;
      for (let y = 14; y < 178; y += 4) {
        const wl = 25 * Math.sin(Math.PI * (y - 4) / 186) + 1, wr = 27 * Math.sin(Math.PI * (y - 4) / 186) + 1;
        g += `<path d="M31,${y + 6} Q${31 - wl * 0.6},${y + 1} ${31 - wl},${y - 7}" stroke="rgba(120,110,95,.26)" stroke-width=".55" fill="none"/>`;
        g += `<path d="M31,${y + 6} Q${31 + wr * 0.6},${y + 1} ${31 + wr},${y - 7}" stroke="rgba(120,110,95,.26)" stroke-width=".55" fill="none"/>`;
      }
      for (let k = 0; k < 9; k++) g += `<path d="M31,${176 + k} q${(k % 2 ? 1 : -1) * (6 + k)},${-4 - k} ${(k % 2 ? 1 : -1) * (10 + k * 1.4)},${-2 - k * 0.6}" stroke="rgba(240,234,224,.55)" stroke-width=".6" fill="none"/>`;
      g += `<path d="M31,199 C32.5,140 33,70 29,5" stroke="rgba(214,204,188,.95)" stroke-width="1.5" fill="none"/>`;
      s.innerHTML = g;
      return s;
    }
    const e3 = L('e3');
    for (let i = 0; i < 17; i++) {
      const len = rr(95, 175);
      const f = mk('div', '', c, null, { position: 'absolute', left: 0, top: 0, filter: i % 5 === 4 ? 'blur(1.2px)' : 'drop-shadow(0 6px 8px rgba(0,0,0,.35))' });
      f.appendChild(feather(len));
      const x0 = rr(160, 1760), y0 = -len - rr(10, 120), yf = rr(966, 1010) - len * 0.08;
      const D = rr(4.4, 6.4), t0 = e3 - 0.4 + i * 0.2 + rr(0, 0.25);
      const A1 = rr(40, 90), fq = rr(0.32, 0.55), ph = rr(0, 6.28), drift = rr(-120, 120);
      const r0 = rr(-30, 30), rl = (rnd() < 0.5 ? -1 : 1) * rr(70, 105);
      gsap.set(f, { x: x0, y: y0, rotation: r0, transformOrigin: '50% 50%' });
      track(f, t0, D, (u, s) => {
        const yu = u < 0.92 ? u / 0.92 : 1;
        const y = y0 + (yf - y0) * (yu * yu * (3 - 2 * yu) * 0.35 + yu * 0.65);
        const sw = Math.sin(2 * Math.PI * fq * s + ph);
        const x = x0 + A1 * sw * (1 - u * 0.85) + drift * u;
        const land = Math.max(0, (u - 0.6) / 0.4);
        const rot = (r0 + 32 * Math.cos(2 * Math.PI * fq * s + ph)) * (1 - land) + rl * land;
        return { x, y, rotation: rot };
      });
    }
    // 片名
    const t1 = at(c, 'serif nw', '一地鸡毛', 960, 420, { fontSize: '132px', letterSpacing: '.24em', color: '#f3efe7', textShadow: '0 6px 40px rgba(0,0,0,.8)' });
    const rule = at(c, '', '', 960, 534, { width: '64px', height: '1px', background: COP });
    const t2 = at(c, 'serif nw', 'MCP 跑偏了', 960, 580, { fontSize: '26px', letterSpacing: '.3em', color: MUTE });
    hidden(t1, { y: 10 }); hidden(t2, { y: 6 }); hidden(rule, { scaleX: 0 });
    tl.to(t1, { autoAlpha: 1, y: 0, duration: 1.6, ease: 'power2.out' }, CUE.endc + 0.05);
    tl.to(rule, { autoAlpha: 1, scaleX: 1, duration: 1.0, ease: 'power2.out' }, CUE.endc + 1.6);
    fadeIn(t2, CUE.endc + 2.2, 1.2, { y: 0 });
    const fade = mk('div', 'layer', root, '', { background: '#000' });
    hidden(fade);
    tl.to(fade, { autoAlpha: 1, duration: 1.4, ease: 'power1.in' }, TL.dur - 1.5);
  }

  // =====================================================================
  // KEY CAPTIONS & SUBTITLES
  // =====================================================================
  const keyL = $('#key'), keyScrim = $('#keyScrim');
  hidden(keyScrim);
  ['p', 'c', 'g', 'x', 's', 'm'].forEach((act, i) => {
    const k = mk('div', 'key', keyL, `<span class="n">0${i + 1}</span><span class="r"></span><span class="tx">${TL.acts[act].key}</span>`);
    hidden(k, { y: 8 });
    const r = k.querySelector('.r');
    gsap.set(r, { scaleX: 0 });
    const t0 = A(act) + 0.3, t1 = A(act) + 5.0;
    tl.to(keyScrim, { autoAlpha: 1, duration: 0.6 }, t0 - 0.2);
    tl.to(k, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, t0);
    tl.to(r, { scaleX: 1, duration: 0.8, ease: 'power2.out' }, t0 + 0.2);
    tl.to(k, { autoAlpha: 0, duration: 0.6 }, t1);
    tl.to(keyScrim, { autoAlpha: 0, duration: 0.6 }, t1 + 0.1);
  });
  const subsL = $('#subs');
  TL.subs.forEach((s) => {
    const e = mk('div', 'sub', subsL, s.text);
    hidden(e);
    tl.to(e, { autoAlpha: 1, duration: 0.16 }, s.t0);
    tl.to(e, { autoAlpha: 0, duration: 0.16 }, s.t1 - 0.16);
  });

  tl.to({}, { duration: 0.001 }, TL.dur - 0.001);
  window.__timelines = window.__timelines || {};
  window.__timelines['main'] = tl;
  tl.seek(0);
  window.__film = tl;
})();
