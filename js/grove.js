/* The Grove. The Brenicks Group.
   An autumn scene for the Salesforce page: two trees seen close up, cropped by the frame, swaying in the wind.
   Birds land on the branches. As each one lands, the service card tied below that branch drops on its string.
   One bird lands on "New Orgs". The other lands on the far tree, hops from branch to branch and flies off, then
   flies back from behind the viewer onto the tree. The branches are grown towards wherever the cards sit, so the
   scene fits every screen size. It runs only while the section is on screen. */
(() => {
  const root = document.querySelector('[data-grove]'); if (!root) return;
  const cv = root.querySelector('.grove__canvas'), ctx = cv.getContext('2d');
  const cards = [...root.querySelectorAll('[data-perch]')], head = root.querySelector('.grove__head'), ctl = root.querySelector('[data-grove-ctl]');
  const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light';
  const rngOf = (seed) => { let s = seed >>> 0 || 7; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; };
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 1).toFixed(3)})`;

  const THEMES = {
    dark: { sky: ['#070B18', '#141A36', '#3A2A4A', '#8A4A3A', '#E09A55'], sun: [255, 196, 120], hills: ['#2E2848', '#231D38', '#16121F'], meadow: '#120E14',
      leaves: ['#5E1712', '#8E2716', '#B8421B', '#D96A22', '#EC9A33', '#F6C35A'], bark: ['#1A120D', '#2E2017', '#4A3324'], rim: [232, 160, 90], ray: [255, 190, 110], mote: [255, 210, 130], dim: 0.86 },
    light: { sky: ['#8DB8D2', '#BFD3D6', '#F0D8AE', '#F4BE7E', '#F7A85E'], sun: [255, 230, 170], hills: ['#B9A6BC', '#9C849A', '#6D5559'], meadow: '#5B4636',
      leaves: ['#8E2A16', '#B8401C', '#DA6420', '#EE8C2C', '#F7B23F', '#FCD772'], bark: ['#3A281C', '#5A3E2B', '#7C5A3F'], rim: [255, 214, 150], ray: [255, 236, 190], mote: [255, 245, 220], dim: 1 },
  };
  // which tree each card hangs from: A is the left tree, B the right (New Orgs, Existing, Automation, Visibility, Migration, Ongoing)
  const TREE_OF = [0, 1, 1, 0, 0, 1];
  // the story: [bird, type, from, to, start, end, reveal]; perches are card indexes, 'L'/'R'/'TR'/'VIEW' are off-screen points
  const SCRIPT = [
    [0, 'fly', 'L', 0, 0.3, 2.5, 0],
    [1, 'fly', 'R', 1, 1.6, 3.8, 1],
    [1, 'hop', 1, 2, 4.6, 5.25, 2],
    [1, 'hop', 2, 5, 5.9, 6.65, 5],
    [1, 'away', 5, 'TR', 7.3, 8.7, -1],
    [1, 'approach', 'VIEW', 4, 9.2, 11.7, 4],
    [0, 'hop', 0, 3, 12.2, 13.1, 3],
  ];
  const SCRIPT_END = 13.4;

  let W = 0, H = 0, DPR = 1, narrow = false, T = CALM ? SCRIPT_END + 1 : 0, live = false, started = false, raf = 0, last = 0, visible = false;
  let far = null, near = null, branches = [], clusters = [], twigs = [], perches = [], falling = [], motes = [], theme = null, mx = 0, tmx = 0;
  const birds = [mkBird(0), mkBird(1)], lit = new Set(), idle = [];

  function mkBird(i) { return { i, x: -99, y: -99, s: 1, face: 1, flap: 0, perched: null, ph: i * 1.7, peck: 0, hidden: true }; }

  /* ── layout: measure the cards, grow the trees towards them ── */
  function layout() {
    const r = root.getBoundingClientRect(); W = r.width; H = r.height; narrow = W < 901;
    DPR = Math.min(devicePixelRatio || 1, W > 1500 ? 1.25 : 1.6);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    theme = THEMES[isDark() ? 'dark' : 'light'];
    // measured without transforms, so a card that is still waiting for its bird is placed where it will hang
    const rel = (el) => { let x = 0, y = 0, e = el; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
    const rects = cards.map(rel), hb = rel(head), headR = { x: hb.x - 20, y: hb.y - 20, w: hb.w + 40, h: hb.h + 40 };
    const avoid = rects.map((q) => ({ x: q.x - 10, y: q.y - 6, w: q.w + 20, h: q.h + 16 })).concat([headR]);
    const inAvoid = (x, y) => avoid.some((q) => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h);
    const rnd = rngOf(2026 + Math.round(W / 40));

    // two trunks, close to the camera, each cropped by the edge of the frame
    const tw = clamp(W * 0.105, 70, 170);
    const trees = [
      { side: -1, base: [W * 0.035 - tw * 0.2, H + 60], c1: [W * 0.07, H * 0.62], c2: [W * 0.005, H * 0.3], top: [W * 0.06, -80], w: tw },
      { side: 1, base: [W * 0.975 + tw * 0.2, H + 60], c1: [W * 0.94, H * 0.6], c2: [W * 1.0, H * 0.28], top: [W * 0.945, -80], w: tw * 0.92 },
    ];
    trees.forEach((t) => { t.at = (y) => { const u = clamp((t.base[1] - y) / (t.base[1] - t.top[1]), 0, 1); return { x: bez(t.base[0], t.c1[0], t.c2[0], t.top[0], u), w: t.w * (1 - 0.32 * u) }; }; });

    branches = []; clusters = []; twigs = []; perches = [];
    const addBranch = (tree, p0, p1, p2, p3, w0, w1, flex) => { const b = { tree, p: [p0, p1, p2, p3], w0, w1, flex, dip: 0, dv: 0, ph: rnd() * TAU }; branches.push(b); return b; };
    const addCluster = (anchor, r, n, lift = 0) => {
      const leaves = [];
      for (let k = 0, tries = 0; k < n && tries < n * 4; tries++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * r, ox = Math.cos(a) * d * 1.25, oy = Math.sin(a) * d * 0.85 - lift;
        const base = anchorPos(anchor, 0, true); if (inAvoid(base.x + ox, base.y + oy)) continue;
        const light = clamp(0.5 - oy / (r * 1.6) + ox / (r * 4) + (rnd() - 0.5) * 0.7, 0, 0.999);
        leaves.push({ ox, oy, sz: (0.75 + rnd() * 0.6) * clamp(W / 1300, 0.7, 1.1), ang: rnd() * TAU, col: Math.floor(light * 6), ph: rnd() * TAU }); k++;
      }
      // the body of the cluster: soft masses of shadowed foliage behind the individual leaves, for volume
      const blobs = Array.from({ length: 3 + Math.floor(rnd() * 3) }, () => { const a = rnd() * TAU, d = rnd() * r * 0.55; return { ox: Math.cos(a) * d * 1.2, oy: Math.sin(a) * d * 0.7 - lift, r: r * (0.45 + rnd() * 0.35) }; })
        .filter((q) => { const base = anchorPos(anchor, 0, true); return !inAvoid(base.x + q.ox, base.y + q.oy); });
      clusters.push({ anchor, leaves, blobs });
    };
    const scale = narrow ? 0.55 : 1;

    // a branch to each card: it reaches out from the trunk, passes over the card's eyelet and ends a little beyond it
    rects.forEach((q, i) => {
      const ti = narrow && cards.length !== 6 ? i % 2 : TREE_OF[i] ?? i % 2, t = trees[ti], inward = -t.side;
      const hole = { x: q.x + q.w / 2, y: q.y + 14 }, py = q.y - 46 - rnd() * 10;
      const y0 = py + 50 + rnd() * 50, tr = t.at(y0), x0 = tr.x + inward * tr.w * 0.25;
      const tip = { x: hole.x + inward * (60 + rnd() * 40), y: py - 16 - rnd() * 14 };
      const p1 = [lerp(x0, tip.x, 0.33), y0 - 18 - rnd() * 22], p2 = [lerp(x0, tip.x, 0.72), py + 8];
      const b = addBranch(ti, [x0, y0], p1, p2, [tip.x, tip.y], clamp(tr.w * 0.2, 12, 26), 2.2, 1);
      let best = 0.8, bd = 1e9; for (let s = 0.3; s <= 0.98; s += 0.01) { const d = Math.abs(bez(x0, p1[0], p2[0], tip.x, s) - hole.x); if (d < bd) { bd = d; best = s; } }
      const perch = { b, s: best, hole, card: i, tree: ti }; perches[i] = perch;
      // twigs and leaves along the branch, mostly above it
      const nt = 3 + Math.floor(rnd() * 3);
      for (let k = 0; k < nt; k++) {
        const s = 0.28 + k / nt * 0.7 + rnd() * 0.06; if (Math.abs(s - best) < 0.07) continue;
        const tw2 = { b, s, ang: -Math.PI / 2 + inward * (0.4 + rnd() * 0.7), len: (28 + rnd() * 52) * (0.7 + scale * 0.3), w: 3 + rnd() * 2, ph: rnd() * TAU };
        twigs.push(tw2); addCluster({ b, s, twig: tw2 }, (22 + rnd() * 16) * (0.7 + scale * 0.3), Math.round((28 + rnd() * 18) * (0.6 + scale * 0.4)), 4);
      }
      addCluster({ b, s: 1 }, 26 * (0.75 + scale * 0.25), Math.round(34 * (0.6 + scale * 0.4)), 8);
      addCluster({ b, s: 0.55 }, 22, Math.round(22 * (0.6 + scale * 0.4)), 16);
    });

    // the canopy: limbs that climb out of the frame, heavy with leaves, so we only ever see part of each tree
    trees.forEach((t, ti) => {
      const inward = -t.side, n = narrow ? 5 : 9;
      for (let k = 0; k < n; k++) {
        const y0 = lerp(H * 0.02, Math.min(H * 0.42, 620), k / (n - 1)) + rnd() * 40, tr = t.at(y0), out = k % 3 === 2 ? -inward : inward;
        const len = (narrow ? W * 0.32 : W * 0.2) * (0.6 + rnd() * 0.7) * (out === inward ? 1 : 0.6);
        const x0 = tr.x + out * tr.w * 0.3, tip = [x0 + out * len, y0 - 90 - rnd() * 160];
        const b = addBranch(ti, [x0, y0], [x0 + out * len * 0.35, y0 - 10], [x0 + out * len * 0.75, tip[1] + 50], tip, clamp(tr.w * 0.22, 10, 30), 3, 0.5);
        for (let s = 0.25; s <= 1.0; s += narrow ? 0.2 : 0.12) addCluster({ b, s }, (34 + rnd() * 26) * (0.7 + scale * 0.3), Math.round((40 + rnd() * 26) * (0.55 + scale * 0.45)), 10);
      }
      // a crown of leaves where the trunk leaves the frame
      for (let k = 0; k < (narrow ? 5 : 11); k++) {
        const b = addBranch(ti, [t.at(-10).x, -10], [t.at(-10).x, -10], [t.at(-10).x, -10], [t.at(-10).x + inward * (20 + k * W * 0.022), 10 + rnd() * 70], 1, 1, 0.35);
        b.hidden = true; addCluster({ b, s: 1 }, 50 + rnd() * 30, Math.round(60 * (0.55 + scale * 0.45)), 0);
      }
    });

    far = paintFar(); near = paintNear(trees);
    falling = Array.from({ length: narrow ? 14 : 30 }, () => newFalling(rnd, true));
    motes = Array.from({ length: narrow ? 18 : 40 }, () => ({ x: rnd() * W, y: rnd() * H, r: 0.6 + rnd() * 1.8, ph: rnd() * TAU, sp: 0.2 + rnd() * 0.6 }));
    root.classList.toggle('is-live', !narrow && !CALM && cards.length > 0);
    applyLit();
    draw(performance.now() / 1000, 0);
  }

  function newFalling(rnd, anywhere) {
    const r = rnd || Math.random;
    return { x: r() * W * 1.1 - W * 0.05, y: anywhere ? r() * H : -20 - r() * 80, vy: 22 + r() * 30, sw: 18 + r() * 30, ph: r() * TAU, spin: 0.8 + r() * 2.2, col: Math.floor(r() * 6), sz: 0.9 + r() * 0.7 };
  }

  /* ── the far layer: sky, sun, hills, distant trees (painted once) ── */
  function paintFar() {
    const c = document.createElement('canvas'), pad = 24; c.width = Math.round((W + pad * 2) * DPR); c.height = Math.round(H * DPR);
    const g = c.getContext('2d'); g.scale(DPR, DPR); g.translate(pad, 0);
    const sky = g.createLinearGradient(0, 0, 0, H); theme.sky.forEach((col, i) => sky.addColorStop([0, 0.35, 0.62, 0.8, 0.92][i], col));
    g.fillStyle = sky; g.fillRect(-pad, 0, W + pad * 2, H);
    const sx = W * 0.68, sy = H * 0.74, sun = g.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.55);
    sun.addColorStop(0, rgba(theme.sun, 0.75)); sun.addColorStop(0.08, rgba(theme.sun, 0.42)); sun.addColorStop(0.4, rgba(theme.sun, 0.1)); sun.addColorStop(1, rgba(theme.sun, 0));
    g.fillStyle = sun; g.fillRect(-pad, 0, W + pad * 2, H);
    const rnd = rngOf(77);
    theme.hills.forEach((col, li) => {
      const base = H * (0.7 + li * 0.07), amp = H * (0.05 - li * 0.008);
      g.beginPath(); g.moveTo(-pad, H);
      for (let x = -pad; x <= W + pad; x += 12) g.lineTo(x, base - amp * (0.6 + 0.4 * Math.sin(x / (180 + li * 90) + li * 2)) - amp * 0.4 * Math.sin(x / 63 + li));
      g.lineTo(W + pad, H); g.closePath(); g.fillStyle = col; g.fill();
      // little rounded trees along the ridge, hazier further away
      const n = Math.round(W / (26 - li * 5));
      for (let k = 0; k < n; k++) {
        const x = rnd() * (W + pad * 2) - pad, y = base - amp * (0.6 + 0.4 * Math.sin(x / (180 + li * 90) + li * 2)) - amp * 0.4 * Math.sin(x / 63 + li), s = (5 + rnd() * 8) * (1 + li * 0.7);
        g.fillStyle = col; g.beginPath(); g.ellipse(x, y - s * 0.6, s * 0.7, s, 0, 0, TAU); g.fill();
        if (li === 2 && rnd() < 0.5) { g.fillStyle = rgba(hex(theme.leaves[1 + Math.floor(rnd() * 3)]), 0.07); g.beginPath(); g.ellipse(x, y - s * 0.8, s * 0.5, s * 0.7, 0, 0, TAU); g.fill(); }
      }
      // haze between ridges
      const hz = g.createLinearGradient(0, base - amp * 2, 0, base + 40); hz.addColorStop(0, rgba(theme.sun, 0)); hz.addColorStop(1, rgba(theme.sun, 0.07 - li * 0.015));
      g.fillStyle = hz; g.fillRect(-pad, base - amp * 2, W + pad * 2, amp * 2 + 40);
    });
    // the meadow in front, with a scatter of fallen leaves
    const my = H * 0.9; g.beginPath(); g.moveTo(-pad, H);
    for (let x = -pad; x <= W + pad; x += 10) g.lineTo(x, my - 10 * Math.sin(x / 140) - 6 * Math.sin(x / 37));
    g.lineTo(W + pad, H); g.closePath(); g.fillStyle = theme.meadow; g.fill();
    for (let k = 0; k < W / 3; k++) { const x = rnd() * W, y = my + rnd() * (H - my) + 4; g.fillStyle = rgba(hex(theme.leaves[Math.floor(rnd() * 6)]), 0.35 + rnd() * 0.4); g.beginPath(); g.ellipse(x, y, 2.5 + rnd() * 2.5, 1.2 + rnd(), rnd() * 3, 0, TAU); g.fill(); }
    for (let x = -pad; x < W + pad; x += 3) { const h = 6 + rnd() * 14, y = my - 10 * Math.sin(x / 140) - 6 * Math.sin(x / 37) + 4; g.strokeStyle = rgba(hex(theme.meadow), 1); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + 2, y - h * 0.5, x + 3 + rnd() * 3, y - h); g.stroke(); }
    return { c, pad };
  }

  /* ── the near layer: the two trunks, painted once (bark, moss, rim light) ── */
  function paintNear(trees) {
    const c = document.createElement('canvas'); c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    const g = c.getContext('2d'); g.scale(DPR, DPR); const bark = theme.bark.map(hex), rnd = rngOf(11);
    trees.forEach((t) => {
      const N = 60, L = [], R = [];
      for (let k = 0; k <= N; k++) { const y = lerp(t.base[1], t.top[1], k / N), a = t.at(y), flare = Math.pow(clamp((y - H * 0.75) / (H * 0.3), 0, 1), 2) * t.w * 0.35; L.push([a.x - a.w / 2 - flare, y]); R.push([a.x + a.w / 2 + flare, y]); }
      g.beginPath(); L.forEach((p, k) => (k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); R.reverse().forEach((p) => g.lineTo(p[0], p[1])); g.closePath();
      const mid = t.at(H * 0.5), gr = g.createLinearGradient(mid.x - mid.w / 2, 0, mid.x + mid.w / 2, 0), lit = t.side < 0; // light comes from the right, the low sun
      gr.addColorStop(0, rgba(lit ? bark[0] : bark[1], 1)); gr.addColorStop(0.55, rgba(bark[1], 1)); gr.addColorStop(0.86, rgba(lit ? bark[2] : bark[0], 1)); gr.addColorStop(1, rgba(lit ? theme.rim : bark[0], lit ? 0.9 : 1));
      g.fillStyle = gr; g.fill(); g.save(); g.clip();
      // bark ridges: long wavering strokes that follow the trunk
      for (let k = 0; k < 46; k++) {
        const f = rnd(), y0 = H + 40 - rnd() * 80, len = 0.3 + rnd() * 0.7; g.beginPath();
        for (let u = 0; u <= len; u += 0.02) { const y = lerp(y0, t.top[1], u), a = t.at(y), x = a.x + (f - 0.5) * a.w + Math.sin(u * 40 + k) * 2.2; u ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = rgba(f > 0.75 && lit ? theme.rim : [0, 0, 0], f > 0.75 && lit ? 0.22 : 0.28 + rnd() * 0.2); g.lineWidth = 1.2 + rnd() * 2.6; g.stroke();
      }
      // knots and moss
      for (let k = 0; k < 4; k++) { const y = H * (0.2 + rnd() * 0.7), a = t.at(y), x = a.x + (rnd() - 0.5) * a.w * 0.5; g.fillStyle = rgba([0, 0, 0], 0.4); g.beginPath(); g.ellipse(x, y, a.w * 0.08, a.w * 0.14, 0, 0, TAU); g.fill(); g.strokeStyle = rgba(theme.rim, 0.18); g.lineWidth = 1.5; g.stroke(); }
      for (let k = 0; k < 160; k++) { const y = H * (0.55 + rnd() * 0.5), a = t.at(y), x = a.x - t.side * a.w * (0.1 + rnd() * 0.42); g.fillStyle = rgba([86, 110, 52], 0.12 + rnd() * 0.2); g.beginPath(); g.arc(x, y, 1 + rnd() * 3, 0, TAU); g.fill(); }
      // ambient occlusion on the shaded side, and the rim of light on the sunny side
      const ao = g.createLinearGradient(mid.x - mid.w / 2, 0, mid.x + mid.w / 2, 0); ao.addColorStop(0, rgba([0, 0, 0], lit ? 0.45 : 0)); ao.addColorStop(0.5, 'rgba(0,0,0,0)'); ao.addColorStop(1, rgba([0, 0, 0], lit ? 0 : 0.45));
      g.fillStyle = ao; g.fillRect(0, 0, W, H); g.restore();
    });
    return c;
  }

  /* ── leaf sprites: one small painted leaf per colour ── */
  const sprites = {};
  function leafSprite(col) {
    const key = col; if (sprites[key]) return sprites[key];
    const c = document.createElement('canvas'), S = 32; c.width = S; c.height = S; const g = c.getContext('2d'), cc = hex(col);
    g.translate(S / 2, S / 2); g.beginPath(); g.moveTo(-12, 0); g.quadraticCurveTo(-4, -9, 12, 0); g.quadraticCurveTo(-4, 9, -12, 0); g.closePath();
    const gr = g.createLinearGradient(0, -8, 0, 8); gr.addColorStop(0, rgba(cc.map((v) => Math.min(255, v * 1.18)), 1)); gr.addColorStop(1, rgba(cc.map((v) => v * 0.72), 1));
    g.fillStyle = gr; g.fill(); g.strokeStyle = rgba(cc.map((v) => v * 0.45), 0.9); g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.moveTo(-11, 0); g.lineTo(10, 0); g.strokeStyle = rgba(cc.map((v) => v * 0.55), 0.8); g.lineWidth = 0.8; g.stroke();
    return (sprites[key] = c);
  }

  /* ── wind and branch motion ── */
  const wind = (n) => 0.6 * Math.sin(n * 0.8) + 0.28 * Math.sin(n * 1.7 + 1.3) + 0.14 * Math.sin(n * 3.3 + 0.4);
  let WN = 0;
  function branchPt(b, s, base) {
    const x = bez(b.p[0][0], b.p[1][0], b.p[2][0], b.p[3][0], s), y = bez(b.p[0][1], b.p[1][1], b.p[2][1], b.p[3][1], s);
    if (base) return { x, y };
    const k = s * s * b.flex, w = WN + 0.25 * Math.sin(T * 2.1 + b.ph);
    return { x: x + w * k * 9, y: y + Math.abs(w) * k * 3 + b.dip * Math.pow(s, 1.4) };
  }
  function anchorPos(a, n, base) {
    const p = branchPt(a.b, a.s, base); if (!a.twig) return p;
    const tw = a.twig, ang = tw.ang + (base ? 0 : (WN * 0.18 + 0.06 * Math.sin(n * 2.4 + tw.ph)));
    return { x: p.x + Math.cos(ang) * tw.len, y: p.y + Math.sin(ang) * tw.len };
  }

  /* ── birds ── */
  function offPoint(k) {
    return k === 'L' ? { x: -80, y: H * 0.18 } : k === 'R' ? { x: W + 80, y: H * 0.08 } : k === 'TR' ? { x: W + 140, y: -120 } : { x: W * 0.58, y: H + 220 };
  }
  function perchPt(i) { const p = perches[i]; if (!p) return { x: W / 2, y: H / 2 }; const q = branchPt(p.b, p.s); return { x: q.x, y: q.y - p.b.w0 * 0.12 - 1 }; }
  const ptOf = (k) => (typeof k === 'number' ? perchPt(k) : offPoint(k));

  function placeBirds(now) {
    const segs = SCRIPT.concat(idle);
    for (const bd of birds) {
      let cur = null, prev = null;
      for (const s of segs) { if (s[0] !== bd.i) continue; if (T >= s[4] && T <= s[5]) cur = s; if (T > s[5] && (!prev || s[5] >= prev[5])) prev = s; }
      if (cur) {
        const [, type, from, to, t0, t1] = cur, u = (T - t0) / (t1 - t0), a = ptOf(from), b = ptOf(to), dx = b.x - a.x;
        bd.hidden = false; bd.perched = null;
        if (type === 'approach') {
          // from behind the viewer into the scene: big and blurred, shrinking with distance
          const depth = 1 - Math.pow(1 - u, 2.2); bd.s = lerp(7, 1, depth);
          bd.x = lerp(a.x, b.x, depth) + Math.sin(u * 5) * 30 * (1 - u); bd.y = lerp(a.y, b.y, depth) - Math.sin(u * Math.PI) * 60;
          bd.face = b.x < a.x ? -1 : 1; bd.flap = u < 0.86 ? now * 15 : now * 3;
        } else {
          const e = type === 'away' ? u * u : eio(u), hgt = type === 'hop' ? 30 + Math.abs(dx) * 0.12 : 70 + Math.abs(dx) * 0.12;
          bd.x = bez(a.x, a.x + dx * 0.3, b.x - dx * 0.25, b.x, e); bd.y = bez(a.y, a.y - hgt, b.y - hgt * 0.6, b.y, e);
          bd.s = type === 'away' ? lerp(1, 0.6, u) : 1; bd.face = dx < 0 ? -1 : 1;
          bd.flap = type === 'hop' ? (u < 0.5 ? now * 14 : Math.PI * 0.6) : u < 0.78 ? now * 14 : u < 0.92 ? Math.PI * 0.55 : now * 20;
        }
      } else if (prev) {
        const to = prev[3];
        if (typeof to === 'number') { const p = perchPt(to); bd.hidden = false; bd.perched = to; bd.s = 1; bd.x = p.x; bd.y = p.y; bd.flap = 0; }
        else bd.hidden = true;
      } else bd.hidden = true;
    }
  }

  function drawBird(bd, now) {
    if (bd.hidden) return;
    const s = bd.s * clamp(W / 1300, 0.8, 1.15) * (narrow ? 1.25 : 1.5), f = bd.face, perched = bd.perched !== null;
    ctx.save(); ctx.translate(bd.x, bd.y + (perched ? Math.sin(now * 2.2 + bd.ph) * 0.5 : 0)); ctx.scale(f * s, s);
    if (bd.s > 1.6) ctx.globalAlpha = clamp(1.25 - bd.s * 0.07, 0.75, 1);   // close to the lens: a touch translucent, like a blur
    const peck = perched ? Math.max(0, Math.sin(now * 0.9 + bd.ph * 3)) ** 18 : 0, tilt = perched ? Math.sin(now * 0.7 + bd.ph) * 0.12 - peck * 0.5 : -0.1;
    const back = isDark() ? '#7A6150' : '#6A5242', backD = isDark() ? '#4A3A30' : '#3D2F26', breast = '#E2742A';
    const fl = perched ? null : Math.sin(bd.flap);
    if (fl !== null) { // the far wing, behind the body
      ctx.fillStyle = backD; ctx.beginPath(); ctx.moveTo(2, -13); ctx.quadraticCurveTo(-2, -20 - fl * 14, -6 + Math.abs(fl) * 2, -22 - fl * 18); ctx.quadraticCurveTo(-6, -14, -7, -11); ctx.closePath(); ctx.fill();
    }
    // tail
    ctx.fillStyle = backD; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(-25, perched ? -3 : -9); ctx.lineTo(-24, perched ? -9 : -14); ctx.closePath(); ctx.fill();
    // body
    ctx.save(); ctx.rotate(perched ? -0.18 : -0.05);
    const bg = ctx.createLinearGradient(0, -18, 0, 0); bg.addColorStop(0, back); bg.addColorStop(1, backD);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(-1, -10, 12.5, 8.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = breast; ctx.beginPath(); ctx.ellipse(3.5, -7.5, 8, 6, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,215,.75)'; ctx.beginPath(); ctx.ellipse(1, -3.4, 5.5, 2.6, 0.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(theme.rim, 0.55); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(-1, -10, 12.5, 8.4, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.restore();
    // head
    ctx.save(); ctx.translate(8.5, -16); ctx.rotate(tilt);
    ctx.fillStyle = backD; ctx.beginPath(); ctx.arc(0, 0, 6.3, 0, TAU); ctx.fill();
    ctx.fillStyle = breast; ctx.beginPath(); ctx.arc(2.2, 2.6, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F1C24E'; ctx.beginPath(); ctx.moveTo(5.4, -1.4); ctx.lineTo(11.5, 0.3); ctx.lineTo(5.4, 1.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(2.6, -1.4, 1.7, 0, TAU); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(3, -1.4, 1, 0, TAU); ctx.fill();
    ctx.restore();
    // the near wing
    ctx.fillStyle = back;
    if (fl === null) { ctx.beginPath(); ctx.ellipse(-3.5, -11, 9.5, 5, -0.15, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 0.8; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-10 + k * 3, -9); ctx.lineTo(-4 + k * 3, -13); ctx.stroke(); } }
    else { ctx.beginPath(); ctx.moveTo(5, -12); ctx.quadraticCurveTo(0, -20 - fl * 16, -9 + Math.abs(fl) * 3, -24 - fl * 22); ctx.quadraticCurveTo(-7, -13, -8, -10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = rgba(theme.rim, 0.4); ctx.lineWidth = 1; ctx.stroke(); }
    // feet on the branch
    if (perched) { ctx.strokeStyle = '#3A2A20'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(-1, 1); ctx.moveTo(2, -3); ctx.lineTo(3, 1); ctx.stroke(); }
    ctx.restore();
  }

  /* ── reveals ── */
  function applyLit() { cards.forEach((c, i) => c.classList.toggle('is-lit', lit.has(i))); }
  function runEvents(prevT) {
    for (const s of SCRIPT.concat(idle)) {
      const [, , from, to, t0, t1, rev] = s;
      if (prevT < t0 && T >= t0 && typeof from === 'number' && perches[from]) perches[from].b.dv -= 40;           // pushing off
      if (prevT < t1 && T >= t1) {
        if (typeof to === 'number' && perches[to]) perches[to].b.dv += 120;                                       // landing weight
        if (rev >= 0 && !lit.has(rev)) { lit.add(rev); applyLit(); }
      }
    }
    if (T > SCRIPT_END && ctl && ctl.textContent !== 'Replay') ctl.textContent = 'Replay';
  }
  // after the story: the birds stay, preen, and now and then hop to another branch of their tree
  let nextIdle = SCRIPT_END + 3;
  function planIdle() {
    if (T < nextIdle || CALM) return;
    const bd = birds[Math.random() < 0.5 ? 0 : 1], here = lastPerch(bd.i); if (here == null) { nextIdle = T + 4; return; }
    const tree = perches[here]?.tree, other = birds[1 - bd.i], there = lastPerch(other.i);
    const options = perches.filter((p) => p && p.tree === tree && p.card !== here && p.card !== there).map((p) => p.card);
    if (options.length) { const to = options[Math.floor(Math.random() * options.length)]; idle.push([bd.i, 'hop', here, to, T + 0.1, T + 0.85, -1]); }
    if (idle.length > 12) idle.splice(0, idle.length - 12);
    nextIdle = T + 5 + Math.random() * 5;
  }
  function lastPerch(i) { let best = null, bt = -1; for (const s of SCRIPT.concat(idle)) if (s[0] === i && s[5] <= T + 0.01 && s[5] > bt && typeof s[3] === 'number') { bt = s[5]; best = s[3]; } return best; }

  /* ── one frame ── */
  function draw(now, dt) {
    WN = CALM ? 0.3 : wind(now);
    for (const b of branches) { b.dv += (-70 * b.dip - 7 * b.dv) * dt; b.dip += b.dv * dt; }
    placeBirds(now);
    const c = ctx; c.setTransform(DPR, 0, 0, DPR, 0, 0);
    mx += (tmx - mx) * Math.min(1, dt * 3);
    c.drawImage(far.c, -far.pad + mx * -10, 0, (W + far.pad * 2), H);
    // light shafts through the canopy
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      const x = W * (0.32 + k * 0.13), a = (0.035 + 0.025 * Math.sin(now * 0.4 + k * 1.7)) * (isDark() ? 0.9 : 1.2), g = c.createLinearGradient(x, 0, x - W * 0.25, H);
      g.addColorStop(0, rgba(theme.ray, a)); g.addColorStop(1, rgba(theme.ray, 0)); c.fillStyle = g;
      c.beginPath(); c.moveTo(x, -10); c.lineTo(x + 40 + k * 12, -10); c.lineTo(x - W * 0.22 + 90, H); c.lineTo(x - W * 0.28, H); c.closePath(); c.fill();
    }
    c.restore();
    c.drawImage(near, 0, 0, W, H);
    // branches (tapered, with a rim of light on top)
    const bark = theme.bark.map(hex);
    for (const b of branches) {
      if (b.hidden) continue; const N = 16, top = [], bot = [];
      for (let k = 0; k <= N; k++) { const s = k / N, p = branchPt(b, s), q = branchPt(b, Math.min(1, s + 0.02)), ang = Math.atan2(q.y - p.y, q.x - p.x) - Math.PI / 2, w = lerp(b.w0, b.w1, Math.pow(s, 0.8)) / 2; top.push([p.x + Math.cos(ang) * w, p.y + Math.sin(ang) * w]); bot.push([p.x - Math.cos(ang) * w, p.y - Math.sin(ang) * w]); }
      c.beginPath(); top.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); for (let k = bot.length - 1; k >= 0; k--) c.lineTo(bot[k][0], bot[k][1]); c.closePath();
      c.fillStyle = rgba(bark[1], 1); c.fill();
      c.beginPath(); (top[0][1] < bot[0][1] ? top : bot).forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = rgba(theme.rim, 0.42); c.lineWidth = 1.3; c.stroke();
    }
    for (const tw of twigs) { const a = branchPt(tw.b, tw.s), e = anchorPos({ b: tw.b, s: tw.s, twig: tw }, now); c.strokeStyle = rgba(bark[1], 1); c.lineWidth = tw.w; c.lineCap = 'round'; c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + e.x) / 2 + 4, (a.y + e.y) / 2 + 3, e.x, e.y); c.stroke(); }
    // strings from each branch down to its card, once the card has dropped
    for (const p of perches) {
      if (!p || !(lit.has(p.card) || !root.classList.contains('is-live'))) continue; const a = branchPt(p.b, p.s);
      c.strokeStyle = rgba(isDark() ? [216, 180, 106] : [140, 104, 52], 0.85); c.lineWidth = 1.2; c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + p.hole.x) / 2 + WN * 3, (a.y + p.hole.y) / 2, p.hole.x, p.hole.y); c.stroke();
    }
    // leaves: first the shadowed masses, then the lit leaves on top
    const pal = theme.leaves, deep = hex(pal[0]).map((v) => v * 0.7), mid2 = hex(pal[1]), dimB = isDark() ? 0.8 : 1;
    for (const cl of clusters) { const o = anchorPos(cl.anchor, now); for (const q of cl.blobs) { const x = o.x + q.ox, y = o.y + q.oy, g = c.createRadialGradient(x - q.r * 0.3, y - q.r * 0.4, 0, x, y, q.r); g.addColorStop(0, rgba(mid2, 0.55 * dimB)); g.addColorStop(0.35, rgba(deep, 0.92)); g.addColorStop(0.8, rgba(deep, 0.75)); g.addColorStop(1, rgba(deep, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, q.r, 0, TAU); c.fill(); } }
    for (const cl of clusters) {
      const o = anchorPos(cl.anchor, now);
      for (const lf of cl.leaves) {
        const fl = Math.sin(now * 3.1 + lf.ph) * 0.35 + WN * 0.25, x = o.x + lf.ox + Math.sin(now * 1.9 + lf.ph) * 1.2, y = o.y + lf.oy + Math.cos(now * 2.3 + lf.ph) * 0.8;
        const a = lf.ang + fl, s = lf.sz * 0.62, cs = Math.cos(a) * s, sn = Math.sin(a) * s;
        c.setTransform(DPR * cs, DPR * sn, -DPR * sn * 0.8, DPR * cs * 0.8, DPR * x, DPR * y); c.drawImage(leafSprite(pal[lf.col]), -16, -16);
      }
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!isDark()) { /* the leaves in the dark theme are slightly dimmed by the dusk */ } else { c.fillStyle = 'rgba(8,10,24,.08)'; c.fillRect(0, 0, W, H); }
    // birds
    for (const bd of birds) drawBird(bd, now);
    // falling leaves, tumbling in three dimensions
    for (const f of falling) {
      if (!CALM) { f.y += f.vy * dt; f.x += (WN * 26 + 8) * dt + Math.sin(now * 1.2 + f.ph) * f.sw * dt; if (f.y > H + 30 || f.x > W + 40) Object.assign(f, newFalling(null, false)); }
      const a = now * f.spin + f.ph, s = f.sz * 0.55; c.setTransform(DPR * s * Math.cos(a * 0.7), DPR * s * Math.sin(a * 0.7), -DPR * s * Math.sin(a * 0.7) * Math.cos(a), DPR * s * Math.cos(a * 0.7) * Math.cos(a), DPR * f.x, DPR * f.y);
      c.drawImage(leafSprite(pal[f.col]), -16, -16);
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    // floating motes: fireflies at dusk, dust in the sun by day
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      const x = m.x + Math.sin(now * m.sp + m.ph) * 18, y = m.y + Math.cos(now * m.sp * 0.8 + m.ph) * 12, a = (isDark() ? 0.55 : 0.35) * (0.5 + 0.5 * Math.sin(now * 1.6 + m.ph * 3));
      const g = c.createRadialGradient(x, y, 0, x, y, m.r * 4); g.addColorStop(0, rgba(theme.mote, a)); g.addColorStop(1, rgba(theme.mote, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, m.r * 4, 0, TAU); c.fill();
    }
    c.restore();
    // soften the very top and bottom into the neighbouring sections
    const v = c.createLinearGradient(0, 0, 0, H); const bgc = isDark() ? [8, 12, 20] : [250, 248, 244];
    v.addColorStop(0, rgba(bgc, 0.55)); v.addColorStop(0.06, rgba(bgc, 0)); v.addColorStop(0.94, rgba(bgc, 0)); v.addColorStop(1, rgba(bgc, 0.65));
    c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  function loop(ms) {
    const now = ms / 1000, dt = Math.min(0.1, last ? now - last : 0); last = now;
    if (started && !CALM) { const p = T; T += dt; runEvents(p); planIdle(); }
    draw(now, dt);
    raf = visible ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf && visible && !CALM) { last = 0; raf = requestAnimationFrame(loop); } };

  /* ── controls ── */
  function finish() { const p = T; T = Math.max(T, SCRIPT_END + 0.01); runEvents(p); for (let i = 0; i < cards.length; i++) lit.add(i); applyLit(); started = true; if (ctl) ctl.textContent = 'Replay'; }
  function replay() { lit.clear(); applyLit(); idle.length = 0; T = 0; nextIdle = SCRIPT_END + 3; started = true; if (ctl) ctl.textContent = 'Skip'; kick(); }
  ctl && ctl.addEventListener('click', () => (ctl.textContent === 'Replay' ? replay() : finish()));
  root.addEventListener('pointermove', (e) => { const r = root.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - 0.5; });

  /* ── start when the section is on screen ── */
  function boot() {
    layout();
    if (CALM) { for (let i = 0; i < cards.length; i++) lit.add(i); applyLit(); T = SCRIPT_END + 1; draw(0, 0); if (ctl) ctl.hidden = true; return; }
    const io = new IntersectionObserver((es) => { for (const e of es) { visible = e.isIntersecting; if (e.intersectionRatio > 0.28 && !started) started = true; } kick(); }, { threshold: [0, 0.28, 0.5] });
    io.observe(root);
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); kick(); }, 180); });
    new MutationObserver(() => { layout(); kick(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else addEventListener('load', boot);
})();
