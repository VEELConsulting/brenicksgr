/* Films: The Build Stack and The Tunnel. The Brenicks Group.
   Two short films drawn in real 3D on canvas (perspective camera, light, particles).
   When a visitor reaches one, the page holds on it while it plays (buttons inside stay live),
   then the scroll is freed. Each film holds the page once per visit; after that it idles and can be replayed. */
(() => {
  const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const eob = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const GOLD = [216, 180, 106], TEAL = [95, 211, 198], IVORY = [247, 245, 240];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1).toFixed(3)})`;
  const SANS = 'Inter, -apple-system, "Segoe UI", Roboto, Arial, sans-serif', SERIF = '"Playfair Display", Georgia, serif';

  /* ── camera and projection ── */
  const cam = () => ({x: 0, y: 0, z: 0, yaw: 0, pitch: 0, f: 600, cx: 0, cy: 0});
  function look(c, px, py, pz, tx, ty, tz) {
    c.x = px; c.y = py; c.z = pz; const fx = tx - px, fy = ty - py, fz = tz - pz;
    c.yaw = Math.atan2(fx, fz); c.pitch = Math.atan2(-fy, Math.hypot(fx, fz));
  }
  function P(c, x, y, z) {
    const dx = x - c.x, dy = y - c.y, dz = z - c.z, cyw = Math.cos(c.yaw), syw = Math.sin(c.yaw);
    const x1 = dx * cyw - dz * syw, z1 = dx * syw + dz * cyw, cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const y1 = dy * cp + z1 * sp, z2 = -dy * sp + z1 * cp;
    if (z2 < 4) return null; const k = c.f / z2; return {x: c.cx + x1 * k, y: c.cy - y1 * k, d: z2, k};
  }
  const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); };
  function line3(ctx, c, a, b, frac = 1) {
    const pa = P(c, ...a), e = [lerp(a[0], b[0], frac), lerp(a[1], b[1], frac), lerp(a[2], b[2], frac)], pb = P(c, ...e);
    if (!pa || !pb) return; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  }
  // a box as faces with outward normals (x,z centred on cx,cz; y from y0 up by h)
  function box(cx, y0, cz, w, h, d) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    const v = (x, y, z) => [x, y, z];
    return [
      {n: [0, 1, 0], k: 'top', p: [v(x0, y1, z0), v(x1, y1, z0), v(x1, y1, z1), v(x0, y1, z1)]},
      {n: [0, -1, 0], k: 'bot', p: [v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1)]},
      {n: [0, 0, -1], k: 'side', p: [v(x0, y0, z0), v(x1, y0, z0), v(x1, y1, z0), v(x0, y1, z0)]},
      {n: [0, 0, 1], k: 'side', p: [v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1)]},
      {n: [-1, 0, 0], k: 'side2', p: [v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0)]},
      {n: [1, 0, 0], k: 'side2', p: [v(x1, y0, z0), v(x1, y0, z1), v(x1, y1, z1), v(x1, y1, z0)]},
    ];
  }
  const boxEdges = (cx, y0, cz, w, h, d) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    const c = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    return [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(([a, b]) => [c[a], c[b]]);
  };
  function drawBox(ctx, c, b, col, alpha, glow) {
    const faces = box(...b).filter((f) => { const m = f.p.reduce((s, q) => [s[0] + q[0] / 4, s[1] + q[1] / 4, s[2] + q[2] / 4], [0, 0, 0]);
      return f.n[0] * (c.x - m[0]) + f.n[1] * (c.y - m[1]) + f.n[2] * (c.z - m[2]) > 0; });
    for (const f of faces) {
      const pts = f.p.map((q) => P(c, ...q)); if (pts.some((q) => !q)) continue;
      const a = f.k === 'top' ? 0.62 : f.k === 'side' ? 0.36 : 0.24;
      const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[2].x, pts[2].y);
      g.addColorStop(0, rgba(col, a * alpha)); g.addColorStop(1, rgba(col.map((v) => v * 0.55), a * alpha * 0.8));
      poly(ctx, pts); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = rgba([255, 236, 190], 0.75 * alpha); ctx.lineWidth = 1; ctx.stroke();
      if (f.k === 'top' && glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; poly(ctx, pts); ctx.fillStyle = rgba(col, 0.25 * glow); ctx.fill(); ctx.restore(); }
    }
  }
  // draw 2D text/content onto a 3D quad (affine from three projected corners)
  function onQuad(ctx, tl, tr, bl, w, h, fn) {
    if (!tl || !tr || !bl) return; ctx.save();
    ctx.setTransform(ctx.__d * (tr.x - tl.x) / w, ctx.__d * (tr.y - tl.y) / w, ctx.__d * (bl.x - tl.x) / h, ctx.__d * (bl.y - tl.y) / h, ctx.__d * tl.x, ctx.__d * tl.y);
    fn(ctx); ctx.restore();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function glowDot(ctx, x, y, r, col, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba([255, 248, 225], a)); g.addColorStop(0.35, rgba(col, a * 0.7)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }

  /* ── a film: canvas, clock, captions, steps ── */
  function Film(root, spec) {
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), cap = root.querySelector('.film__cap'), ctl = root.querySelector('[data-ctl]');
    let W = 0, H = 0, DPR = 1, t = CALM ? spec.dur : 0, playing = false, done = CALM, onEnd = null, raf = 0, visible = false, last = 0, capKey = '';
    const size = () => { const r = root.getBoundingClientRect(); DPR = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); ctx.__d = DPR; };
    const setCap = () => { const html = spec.caption(t, done); if (html !== capKey) { capKey = html; cap.classList.remove('is-on'); setTimeout(() => { cap.innerHTML = html; if (html) cap.classList.add('is-on'); }, html ? 180 : 0); } };
    const render = (now) => {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      spec.draw(ctx, W, H, t, now / 1000, done); setCap(); if (spec.steps) spec.steps(t, done);
    };
    const loop = (now) => {
      raf = 0; if (!visible && !playing) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      if (playing) { t += dt; if (t >= spec.dur) { t = spec.dur; finish(); } }
      render(now); if (!CALM || playing) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
    function finish() { playing = false; done = true; ctl.textContent = 'Replay'; const f = onEnd; onEnd = null; if (f) f(); }
    const api = {
      root, played: CALM,
      play(cb, from = 0) { t = from; done = false; playing = true; onEnd = cb || null; ctl.textContent = 'Skip'; ctl.hidden = false; kick(); },
      seek(time) { t = clamp(time, 0, spec.dur); if (!playing) { done = false; playing = true; ctl.textContent = 'Skip'; } kick(); },
      skip() { t = spec.dur; finish(); kick(); },
      get playing() { return playing; },
    };
    ctl.addEventListener('click', () => { if (playing) api.skip(); else api.play(null); });
    ctl.hidden = CALM;
    new ResizeObserver(() => { size(); render(performance.now()); }).observe(root);
    new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; if (visible) kick(); }), {rootMargin: '10% 0px'}).observe(root);
    size(); render(performance.now());
    return api;
  }

  /* ── hold the page on a film while it plays, then free the scroll ── */
  const films = []; let held = null, lastY = scrollY;
  const KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);
  const stop = (e) => { if (held) e.preventDefault(); };
  const stopKey = (e) => { if (!held || !KEYS.has(e.key)) return; if (e.key === ' ' && e.target.closest && e.target.closest('button,a,input,textarea,[role=button]')) return; e.preventDefault(); };
  const keep = () => { if (held && Math.abs(scrollY - held.y) > 1 && performance.now() > held.settle) scrollTo(0, held.y); };
  function hold(film, y) {
    held = {film, y, settle: performance.now() + 520}; film.played = true; document.documentElement.classList.add('film-hold');
    addEventListener('wheel', stop, {passive: false}); addEventListener('touchmove', stop, {passive: false}); addEventListener('keydown', stopKey); addEventListener('scroll', keep);
    scrollTo({top: y, behavior: 'smooth'});
    film.play(release);
  }
  function release() {
    if (!held) return; held = null; document.documentElement.classList.remove('film-hold');
    removeEventListener('wheel', stop); removeEventListener('touchmove', stop); removeEventListener('keydown', stopKey); removeEventListener('scroll', keep);
  }
  function watch() {
    const y = scrollY, dir = Math.sign(y - lastY); lastY = y; if (held || CALM || !dir) return;
    const H = innerHeight, NAV = ((document.querySelector('.nav') || {}).offsetHeight || 72) + 12;
    for (const f of films) {
      if (f.played) continue;
      const area = f.root.closest('[data-hold]'), useArea = area && area.getBoundingClientRect().height <= H - NAV - 20;
      const r = (useArea ? area : f.root).getBoundingClientRect(); if (r.bottom < 0 || r.top > H) continue;
      if (dir > 0 && r.bottom <= H - 16 && r.bottom > NAV + 60) { hold(f, y + r.bottom - (H - 16)); break; }   // its bottom reached the bottom of the screen
      if (dir < 0 && r.top >= NAV && r.top < H - 60) { hold(f, y + r.top - NAV); break; }                    // coming back up: its top reached the top
    }
  }
  addEventListener('scroll', watch, {passive: true});

  /* ══════════════ 1. THE BUILD STACK ══════════════ */
  const STACK = {
    dur: 8.8,
    land: [3.0, 4.0, 5.0, 6.0],
    caption(t, done) {
      if (done || t > 7.0) return 'Until it shows <em>measurable results.</em>';
      if (t < 1.65) return 'Most firms hand you <em>a deck</em>…';
      if (t < 2.9) return '…and then they leave.';
      return ['We <em>design</em> it.', 'We <em>build</em> it.', 'We <em>integrate</em> it with your systems.', 'We <em>support</em> it.'][clamp(Math.floor((t - 2.9) / 1.0), 0, 3)];
    },
  };
  const LAYERS = [{w: 210, c: TEAL}, {w: 186, c: GOLD}, {w: 162, c: [226, 190, 118]}, {w: 138, c: [240, 210, 140]}], LH = 30, LG = 12;
  const SATS = [{a: -0.3, label: 'CRM'}, {a: 0.87, label: 'Documents'}, {a: 2.05, label: 'Workflows'}].map((s) => ({...s, x: Math.cos(s.a) * 235, z: Math.sin(s.a) * 235}));
  const MOTES = Array.from({length: 60}, (_, i) => ({a: i * 2.399, r: 20 + (i * 37) % 70, s: 0.4 + ((i * 13) % 10) / 10, o: (i * 0.137) % 1}));
  STACK.draw = (ctx, W, H, t, now, done) => {
    const c = cam(); const narrow = W < 480; c.f = Math.min(W, H) * (narrow ? 1.05 : W > H * 1.2 ? 1.3 : 1.12); c.cx = W / 2; c.cy = H * (narrow ? 0.5 : 0.58);
    const sway = CALM ? 0 : Math.sin(now * 0.35) * 0.08;
    const a1 = eio(seg(t, 1.55, 3.0)), rise = eio(seg(t, 6.9, 8.4));
    const th = lerp(0, -0.7, a1) + (t > 3 ? (t - 3) * 0.035 : 0) + (done ? sway : 0);
    const ht = lerp(70, 340, a1) + 30 * rise, dist = lerp(520, 650, a1) + 110 * rise, ty = lerp(70, 62, a1) + 95 * rise;
    look(c, dist * Math.sin(th), ht, -dist * Math.cos(th), 0, ty, 0);

    // floor grid
    const gA = a1;
    if (gA > 0.01) {
      ctx.lineWidth = 1;
      for (let i = -9; i <= 9; i++) for (const axis of [0, 1]) {
        const v = i * 44, fall = 1 - Math.abs(i) / 10;
        ctx.strokeStyle = rgba(GOLD, 0.16 * gA * fall);
        if (axis) line3(ctx, c, [v, 0, -400], [v, 0, 400]); else line3(ctx, c, [-400, 0, v], [400, 0, v]);
      }
      const p0 = P(c, 0, 0, 0); if (p0) glowDot(ctx, p0.x, p0.y, 220 * p0.k, GOLD, 0.25 * gA);
    }

    // the slide deck
    const SW = 236, SH = 134, titles = ['AI Strategy', 'Roadmap', 'Recommendations'];
    for (let i = 2; i >= 0; i--) {
      let ox = (i - 1) * 16, oy = 6 * i, oz = i * 26, alpha = 1, rot = 0;
      if (i < 2) { const o = eio(seg(t, 0.45 + i * 0.5, 0.95 + i * 0.5)); ox += (i ? -1 : 1) * 330 * o; alpha = 1 - o; rot = (i ? -1 : 1) * 0.5 * o; }
      if (alpha <= 0.01) continue;
      const fall = i === 2 ? eio(seg(t, 1.6, 2.7)) : 0, ang = fall * Math.PI / 2;
      const cx = lerp(ox, 0, fall), cz = lerp(oz - 40, -SH / 2 + 4, fall), by = lerp(14 + oy, 0.5, fall);
      const pt = (u, v) => { const x = u * Math.cos(rot), zz = u * Math.sin(rot); return [cx + x, by + v * Math.cos(ang), cz + zz + v * Math.sin(ang)]; };
      const tl = P(c, ...pt(-SW / 2, SH)), tr = P(c, ...pt(SW / 2, SH)), br = P(c, ...pt(SW / 2, 0)), bl = P(c, ...pt(-SW / 2, 0));
      if (!tl || !tr || !br || !bl) continue;
      const fade = i === 2 ? lerp(1, 0.42, fall) * (1 - 0.35 * a1) : 1;
      poly(ctx, [tl, tr, br, bl]); ctx.fillStyle = rgba(IVORY, 0.94 * alpha * fade); ctx.fill(); ctx.strokeStyle = rgba(GOLD, 0.6 * alpha * fade); ctx.stroke();
      onQuad(ctx, tl, tr, bl, SW, SH, (g) => {
        g.globalAlpha = alpha * fade; g.fillStyle = '#0C1117'; g.font = `600 15px ${SERIF}`; g.fillText(titles[i], 16, 30);
        g.fillStyle = 'rgba(12,17,23,.25)'; [0.7, 0.55, 0.62, 0.4].forEach((wd, j) => { g.fillRect(16, 48 + j * 16, (SW - 32) * wd, 6); });
        g.fillStyle = 'rgba(168,132,71,.9)'; g.fillRect(SW - 60, SH - 34, 8, 18); g.fillRect(SW - 48, SH - 44, 8, 28); g.fillRect(SW - 36, SH - 28, 8, 12);
        g.font = `600 8px ${SANS}`; g.fillStyle = 'rgba(12,17,23,.45)'; g.fillText(`SLIDE ${i + 1} / 3`, 16, SH - 12);
        if (i === 2 && fall > 0.95) { g.globalAlpha = 0.85 * seg(t, 2.7, 3.2); g.font = `700 11px ${SANS}`; g.fillStyle = '#A88447'; g.fillText('WHERE MOST FIRMS STOP', 16, SH - 26); }
      });
    }

    // the layers: each falls into place on top of the deck
    const items = [];
    LAYERS.forEach((L, i) => {
      const T = STACK.land[i]; if (t < T - 0.02) return;
      const s = seg(t, T, T + 0.62), y0 = 2 + i * (LH + LG), y = y0 + (i === 0 ? 0 : 240 * (1 - eob(s)));
      items.push({i, L, y, s, T});
    });
    // integration cables and satellites (behind/around)
    const integ = seg(t, STACK.land[2] + 0.35, STACK.land[2] + 1.05);
    if (integ > 0) {
      const top2 = 2 + 2 * (LH + LG) + LH / 2;
      SATS.forEach((S, j) => {
        const sb = [S.x, 0, S.z, 46, 40, 46], k0 = P(c, S.x, 60, S.z);
        drawBox(ctx, c, sb, IVORY, 0.55 * integ, 0);
        if (k0) { ctx.font = `600 ${Math.max(9, 11 * k0.k)}px ${SANS}`; ctx.fillStyle = rgba(IVORY, 0.85 * integ); ctx.textAlign = 'center'; ctx.fillText(S.label.toUpperCase(), k0.x, k0.y - 6); ctx.textAlign = 'left'; }
        const A = [Math.cos(S.a) * 80, top2, Math.sin(S.a) * 80], B = [S.x, 40, S.z], N = 30, f = eo(integ);
        ctx.strokeStyle = rgba(TEAL, 0.75 * integ); ctx.lineWidth = 1.6; ctx.beginPath(); let started = false;
        for (let n = 0; n <= N * f; n++) { const u = n / N, x = lerp(A[0], B[0], u), z = lerp(A[2], B[2], u), yy = lerp(A[1], B[1], u) + Math.sin(u * Math.PI) * 70; const p = P(c, x, yy, z); if (!p) continue; started ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); started = true; }
        ctx.stroke();
        if (f >= 1) for (let q = 0; q < 3; q++) { const u = ((now * 0.45 + q / 3 + j * 0.21) % 1); const p = P(c, lerp(A[0], B[0], u), lerp(A[1], B[1], u) + Math.sin(u * Math.PI) * 70, lerp(A[2], B[2], u)); if (p) glowDot(ctx, p.x, p.y, 7 * p.k + 2, TEAL, 0.9); }
      });
    }
    items.forEach(({i, L, y, s, T}) => {
      const b = [0, y, 0, L.w, LH, L.w];
      if (i === 0) {
        const tr = eo(seg(t, T, T + 0.85)), solid = seg(t, STACK.land[1], STACK.land[1] + 0.6);
        if (solid > 0) drawBox(ctx, c, b, TEAL, 0.55 * solid, 0);
        ctx.strokeStyle = rgba(TEAL, 0.95); ctx.lineWidth = 1.4; boxEdges(...b).forEach(([p, q], n) => line3(ctx, c, p, q, clamp(tr * 12 - n, 0, 1)));
        // dimension lines (the blueprint)
        const dA = seg(t, T + 0.5, T + 1.0) * (1 - solid);
        if (dA > 0) {
          ctx.strokeStyle = rgba(TEAL, 0.7 * dA); ctx.lineWidth = 1; const e = L.w / 2, o = 26;
          line3(ctx, c, [-e, 0, -e - o], [e, 0, -e - o]); line3(ctx, c, [-e, 0, -e - o + 8], [-e, 0, -e - o - 8]); line3(ctx, c, [e, 0, -e - o + 8], [e, 0, -e - o - 8]);
          line3(ctx, c, [e + o, 0, -e], [e + o, 0, e]); line3(ctx, c, [e + o - 8, 0, -e], [e + o + 8, 0, -e]); line3(ctx, c, [e + o - 8, 0, e], [e + o + 8, 0, e]);
          const m = P(c, 0, 0, -e - o - 14); if (m) { ctx.font = `600 ${10 * m.k * 1.6}px ${SANS}`; ctx.fillStyle = rgba(TEAL, 0.9 * dA); ctx.textAlign = 'center'; ctx.fillText('SPEC · SCOPE · SUCCESS MEASURE', m.x, m.y); ctx.textAlign = 'left'; }
        }
      } else drawBox(ctx, c, b, L.c, eo(s), s >= 1 ? 0.25 + 0.15 * Math.sin(now * 2 + i) : 1 - s);
      // landing ripple
      const rp = seg(t, T + 0.5, T + 1.2);
      if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(GOLD, 0.6 * (1 - rp)); ctx.lineWidth = 1.5; ctx.beginPath(); for (let n = 0; n <= 48; n++) { const a = n / 48 * 6.2832, rad = L.w * 0.6 + rp * 160; const p = P(c, Math.cos(a) * rad, y, Math.sin(a) * rad); if (p) n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); }
    });
    // support halo
    const sup = seg(t, STACK.land[3] + 0.4, STACK.land[3] + 1.1);
    if (sup > 0) {
      const hy = 2 + 3 * (LH + LG) + LH / 2, R = 128, spin = now * 0.6;
      ctx.lineWidth = 2; for (let n = 0; n < 40 * eo(sup); n++) { if (n % 2) continue; const a = spin + n / 40 * 6.2832, b2 = spin + (n + 1) / 40 * 6.2832; ctx.strokeStyle = rgba(GOLD, 0.85 * sup); line3(ctx, c, [Math.cos(a) * R, hy, Math.sin(a) * R], [Math.cos(b2) * R, hy, Math.sin(b2) * R]); }
      for (let q = 0; q < 3; q++) { const a = -spin * 1.6 + q * 2.094; const p = P(c, Math.cos(a) * R, hy, Math.sin(a) * R); if (p) glowDot(ctx, p.x, p.y, 9 * p.k + 2, GOLD, sup); }
    }
    // measurable results: beam, rising motes and a climbing line
    if (rise > 0) {
      const topY = 2 + 3 * (LH + LG) + LH, b0 = P(c, 0, topY, 0), b1 = P(c, 0, topY + 300 * rise, 0);
      if (b0 && b1) { const g = ctx.createLinearGradient(b0.x, b0.y, b1.x, b1.y); g.addColorStop(0, rgba([255, 240, 200], 0.9)); g.addColorStop(1, rgba(GOLD, 0)); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.stroke(); glowDot(ctx, b0.x, b0.y, 40 * b0.k, GOLD, 0.8 * rise); }
      MOTES.forEach((m) => { const u = (now * 0.12 * m.s + m.o) % 1, p = P(c, Math.cos(m.a) * m.r, topY + u * 260, Math.sin(m.a) * m.r); if (p) glowDot(ctx, p.x, p.y, 4 * p.k + 1, GOLD, rise * (1 - u) * 0.9); });
      const pc = P(c, 0, topY + 165, 0);
      if (pc) {
        const pw = 170, ph = 74, x = pc.x - pw / 2, y = pc.y - ph / 2;
        ctx.globalAlpha = rise; rr(ctx, x, y, pw, ph, 10); ctx.fillStyle = 'rgba(10,14,19,.82)'; ctx.fill(); ctx.strokeStyle = rgba(GOLD, 0.7); ctx.lineWidth = 1; ctx.stroke();
        ctx.font = `700 9px ${SANS}`; ctx.fillStyle = rgba(GOLD, 0.95); ctx.fillText('MEASURABLE RESULTS', x + 12, y + 18);
        const pts = [0.15, 0.25, 0.2, 0.42, 0.38, 0.6, 0.72, 0.9], n = pts.length, draw = eo(seg(t, 7.2, 8.6));
        ctx.strokeStyle = rgba([255, 230, 170], 1); ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j < n * draw; j++) { const px = x + 12 + j / (n - 1) * (pw - 24), py = y + ph - 12 - pts[j] * (ph - 36); j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
  };

  /* ══════════════ 2. THE TUNNEL ══════════════ */
  const RINGS = [
    {z: 900, name: 'WHERE YOUR TEAM WORKS', tools: ['Salesforce', 'Microsoft 365 & SharePoint', 'Google Workspace', 'Microsoft Copilot']},
    {z: 1800, name: 'HOW IT CONNECTS', tools: ['LangChain', 'n8n', 'RAG & Vector Search']},
    {z: 2700, name: 'THE INTELLIGENCE', tools: ['Writing & summaries', 'Search & answers', 'Decisions & routing']},
  ];
  const CORE = 3600, RR = 250, DWELL = 560;
  const STARS = Array.from({length: 420}, (_, i) => { const a = i * 2.399963, r = 320 + ((i * 7919) % 1100); return {x: Math.cos(a) * r, y: Math.sin(a) * r, z: -900 + ((i * 104729) % 5400), s: 0.6 + (i % 5) * 0.25}; });
  // camera keyframes: [time, z]
  const KZ = [[0, -300], [0.9, -300], [1.9, 900 - DWELL], [2.9, 900 - DWELL + 70], [3.8, 1800 - DWELL], [4.8, 1800 - DWELL + 70], [5.7, 2700 - DWELL], [6.7, 2700 - DWELL + 70], [7.6, CORE - 430]];
  const TUN = {dur: 9.6, seekTo: [1.95, 3.85, 5.75]};
  function camZ(t) { for (let i = 1; i < KZ.length; i++) if (t <= KZ[i][0]) { const [t0, z0] = KZ[i - 1], [t1, z1] = KZ[i]; return lerp(z0, z1, eio(seg(t, t0, t1))); } return KZ[KZ.length - 1][1]; }
  const focusOf = (t) => (t >= 1.7 && t < 3.6 ? 0 : t >= 3.6 && t < 5.5 ? 1 : t >= 5.5 && t < 7.4 ? 2 : -1);
  TUN.caption = (t, done) => {
    if (done || t > 8.3) return 'One system, <em>built around your workflow.</em>';
    if (t < 1.6) return 'Every tool, <em>in its place.</em>';
    if (t >= 7.4) return 'All of it, <em>serving your workflow.</em>';
    return ['<em>Where your team works:</em> we build inside it.', '<em>How it connects:</em> we wire it together.', '<em>The intelligence:</em> the right model for each job.'][Math.max(0, focusOf(t))];
  };
  TUN.draw = (ctx, W, H, t, now, done) => {
    const c = cam(); c.f = Math.min(W, H) * (W < 520 ? 0.7 : W > H * 1.3 ? 0.95 : 0.82); c.cx = W / 2; c.cy = H / 2 + (W < 520 ? 22 : 10);
    const pull = eio(seg(t, 8.0, 9.6)), z = camZ(t), sway = done && !CALM ? Math.sin(now * 0.3) * 40 : 0;
    const px = lerp(0, 2500, pull) + sway, py = lerp(0, 640, pull), pz = lerp(camZ(t), 1650, pull);
    look(c, px, py, pz, 0, lerp(0, -30, pull), lerp(pz + 1000, 2080, pull));
    const speed = Math.abs(camZ(t + 0.03) - camZ(t)) / 0.03 * (1 - pull);
    // stars, streaking with speed
    for (const s of STARS) {
      const p = P(c, s.x, s.y, s.z); if (!p || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      const a = clamp(0.15 + p.k * 0.9, 0, 0.8);
      if (speed > 200) { const q = P(c, s.x, s.y, s.z - speed * 0.05); if (q) { ctx.strokeStyle = rgba(IVORY, a * 0.7); ctx.lineWidth = Math.max(0.6, s.s * p.k); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); continue; } }
      ctx.fillStyle = rgba(s.s > 1.2 ? GOLD : IVORY, a); ctx.fillRect(p.x, p.y, Math.max(1, s.s * p.k * 1.4), Math.max(1, s.s * p.k * 1.4));
    }
    const focus = done ? -1 : focusOf(t), coreA = seg(t, 7.0, 7.8);
    const coreP = P(c, 0, 0, CORE);
    // links from every tool to the core (the finished system)
    const linkA = seg(t, 8.2, 9.4);
    const chipPos = (R, i, j) => { const a = -Math.PI / 2 + j / R.tools.length * 6.2832 + i * 0.6 + now * (i % 2 ? -0.08 : 0.1) * (CALM ? 0 : 1); return [Math.cos(a) * RR, Math.sin(a) * RR, R.z]; };
    if (linkA > 0 && coreP) RINGS.forEach((R, i) => R.tools.forEach((_, j) => {
      const q = chipPos(R, i, j), p = P(c, ...q); if (!p) return;
      ctx.strokeStyle = rgba(GOLD, 0.35 * linkA); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(coreP.x, coreP.y); ctx.stroke();
      const u = (now * 0.5 + j * 0.3 + i * 0.17) % 1, pp = P(c, lerp(q[0], 0, u), lerp(q[1], 0, u), lerp(q[2], CORE, u)); if (pp) glowDot(ctx, pp.x, pp.y, 5 * pp.k * 3 + 2, GOLD, linkA);
    }));
    // core, then rings far to near
    const drawCore = () => {
      if (!coreP) return; const r = Math.min((110 + 60 * coreA) * coreP.k, Math.min(W, H) * 0.2), pulse = CALM ? 1 : 1 + Math.sin(now * 2.2) * 0.05;
      glowDot(ctx, coreP.x, coreP.y, r * 1.8 * pulse, GOLD, 0.5); glowDot(ctx, coreP.x, coreP.y, r * pulse, [255, 236, 190], 0.95);
      if (coreP.k > 0.06) { ctx.font = `500 ${clamp(15 * coreP.k * 3.2, 10, 26)}px ${SERIF}`; ctx.fillStyle = '#0C1117'; ctx.textAlign = 'center'; ctx.fillText('Your workflow', coreP.x, coreP.y + 5); ctx.textAlign = 'left'; }
    };
    const order = RINGS.map((R, i) => ({R, i, d: R.z - c.z})).sort((a, b) => b.d - a.d);
    if (CORE - c.z > order[0].d) drawCore();
    order.forEach(({R, i}) => {
      const rel = R.z - c.z, near = pull > 0.25 ? 1 : rel < 120 ? clamp(rel / 120, 0, 1) : 1; if (near <= 0) return;
      const lit = focus === i ? 1 : 0, base = (0.35 + 0.65 * lit) * near;
      // the ring: a wide soft stroke, a bright thin one, and a dashed inner track
      [[RR, 7, 0.12], [RR, 1.4, 0.8], [RR * 0.92, 1, 0.35]].forEach(([rad, lw, al], k) => {
        ctx.lineWidth = lw; ctx.strokeStyle = rgba(GOLD, al * base); ctx.beginPath(); let on = false;
        for (let n = 0; n <= 120; n++) { if (k === 2 && n % 4 > 1) { on = false; continue; } const a = n / 120 * 6.2832 + (k === 2 ? now * 0.2 : 0), p = P(c, Math.cos(a) * rad, Math.sin(a) * rad, R.z); if (!p) { on = false; continue; } on ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); on = true; }
        ctx.stroke();
      });
      const np = P(c, 0, -RR - 48, R.z);
      if (np && np.k > 0.12) { ctx.font = `700 ${clamp(10 * np.k * 1.6, 8, 13)}px ${SANS}`; ctx.fillStyle = rgba(GOLD, (0.5 + 0.5 * lit) * near); ctx.textAlign = 'center'; ctx.fillText(R.name.split('').join(' '), np.x, np.y); ctx.textAlign = 'left'; }
      R.tools.forEach((tool, j) => {
        const p = P(c, ...chipPos(R, i, j)); if (!p) return;
        const fs = clamp(14 * p.k / (c.f / DWELL) * (W < 520 ? 0.82 : 1), 7, 30); if (fs < 7.5 && !lit) return;
        ctx.font = `500 ${fs}px ${SANS}`; const tw = ctx.measureText(tool).width, w = tw + fs * 1.6, h = fs * 2.1;
        const a = clamp((0.45 + 0.55 * lit) * near * clamp(p.k * 6, 0, 1), 0, 1);
        const X = clamp(p.x, w / 2 + 6, W - w / 2 - 6), Y = clamp(p.y, (W < 520 ? 92 : 66) + h / 2, H - 10 - h / 2);
        if (lit) glowDot(ctx, X, Y, w * 0.8, GOLD, 0.18 * a);
        rr(ctx, X - w / 2, Y - h / 2, w, h, h / 2); ctx.fillStyle = rgba([16, 22, 30], 0.92 * a); ctx.fill();
        ctx.strokeStyle = rgba(lit ? [240, 210, 140] : GOLD, (lit ? 0.95 : 0.55) * a); ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = rgba(IVORY, a); ctx.fillText(tool, X - tw / 2, Y + fs * 0.36);
      });
    });
    if (!(CORE - c.z > order[0].d)) drawCore();
  };

  /* ── wire up ── */
  document.querySelectorAll('[data-film="stack"]').forEach((root) => {
    const btns = [...root.querySelectorAll('[data-seek]')];
    STACK.steps = (t, done) => { const k = done ? 4 : t < 2.95 ? 0 : clamp(Math.floor((t - 2.95) / 1.0) + 1, 0, 4); btns.forEach((b, i) => b.classList.toggle('is-on', i < k)); };
    const f = Film(root, STACK); films.push(f);
    btns.forEach((b, i) => b.addEventListener('click', () => f.seek(STACK.land[i] - 0.05)));
  });
  document.querySelectorAll('[data-film="tunnel"]').forEach((root) => {
    const host = root.closest('[data-tunnel]'), layers = host ? [...host.querySelectorAll('.tunnel__layer')] : [];
    TUN.steps = (t, done) => { const k = done || t > 8.2 ? 9 : focusOf(t); layers.forEach((l, i) => l.classList.toggle('is-on', k === 9 || k === i)); };
    const f = Film(root, TUN); films.push(f);
    layers.forEach((l, i) => { const go = () => f.seek(TUN.seekTo[i]); l.addEventListener('click', go); l.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
  });
})();
