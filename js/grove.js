/* The Grove. The Brenicks Group.
   A maple garden in ancient Japan for the Salesforce page, drawn on canvas.
   Two old maples stand close to the camera, cropped by the frame, red leaves stirring in the wind. Far behind them
   are a mountain, a pagoda and a torii gate in the haze, and a still lake.
   Two Japanese white-eyes (mejiro) land on the branches. As each one lands, the leather hanging scroll tied below that
   branch unrolls; the bird sings, looks down at the scroll, then looks at us. One lands on "New Orgs". The other
   lands on the far tree, hops from branch to branch, flies off, then flies back from behind the viewer onto the tree.
   When every scroll is open, the trees blossom and the blue-violet evening turns to sunrise.
   On phones the birds come to each scroll as it scrolls into view. The scene runs only while it is on screen. */
(() => {
  const root = document.querySelector('[data-grove]'); if (!root) return;
  const cv = root.querySelector('.grove__canvas'), ctx = cv.getContext('2d');
  const cards = [...root.querySelectorAll('[data-perch]')], head = root.querySelector('.grove__head'), ctl = root.querySelector('[data-grove-ctl]');
  const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), eob = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const rngOf = (seed) => { let s = seed >>> 0 || 7; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; };
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 1).toFixed(3)})`;
  const canFilter = 'filter' in document.createElement('canvas').getContext('2d');

  /* ── the two moods: blue-violet evening before sunset, and sunrise ── */
  const DUSK = { sky: ['#22305E', '#3A3F7C', '#5D4E92', '#93649E', '#C9839C', '#E6A79C'], fuji: '#6B6A9E', snow: '#C9C6E6', ridge: ['#5A5689', '#463F72', '#352E58'],
    lake: ['#7C6BA6', '#3A3566'], ground: '#1E1828', torii: [150, 70, 90], light: [255, 190, 170], haze: [170, 150, 210] };
  const DAWN = { sky: ['#3E6EA6', '#7FA6CF', '#C9B9C8', '#F4C29A', '#FFB47E', '#FFE0A8'], fuji: '#9D8FB2', snow: '#FFF1E2', ridge: ['#A88FAE', '#8A7192', '#5E4A64'],
    lake: ['#F5C39A', '#7D6A8C'], ground: '#2C1E22', torii: [196, 62, 50], light: [255, 214, 160], haze: [255, 210, 180] };
  const LEAVES = ['#5C0B12', '#86141A', '#AE1F1E', '#CF3424', '#E85A2C', '#F28A3C'];
  const BARK = [[38, 32, 30], [70, 60, 54], [112, 100, 90]];

  // which tree each scroll hangs from: 0 is the left tree, 1 the right (New Orgs, Existing, Automation, Visibility, Migration, Ongoing)
  const TREE_OF = [0, 1, 1, 0, 0, 1];
  // [bird, type, from, to, start, end, reveal]; numbers are scrolls; 'L', 'R', 'TR', 'VIEW' are points off the screen
  const SCRIPT = [
    [0, 'fly', 'L', 0, 0.3, 2.5, 0],
    [1, 'fly', 'R', 1, 1.2, 3.4, 1],
    [1, 'hop', 1, 2, 6.2, 6.95, 2],
    [1, 'hop', 2, 5, 9.7, 10.5, 5],
    [1, 'away', 5, 'TR', 13.3, 14.5, -1],
    [1, 'approach', 'VIEW', 4, 14.9, 17.4, 4],
    [0, 'hop', 0, 3, 17.8, 18.7, 3],
  ];
  const SCRIPT_END = 21.4, ROUTINE = 2.8;

  let W = 0, H = 0, DPR = 1, narrow = false, T = 0, started = false, raf = 0, last = 0, visible = false, bloomAt = Infinity;
  let L = null, branches = [], clusters = [], twigs = [], perches = [], falling = [], petals = [], motes = [], bokeh = [], notes = [], dyn = [], queued = new Set(), mx = 0, tmx = 0;
  const birds = [mkBird(0), mkBird(1)], lit = new Set(), idle = [];
  function mkBird(i) { return { i, x: -99, y: -99, s: 1, face: 1, flap: 0, perched: null, landedAt: -9, ph: i * 1.7, hidden: true, lastNote: 0 }; }

  /* ── sprites: a maple leaf, a cherry blossom, a blurred leaf for the foreground ── */
  const sprites = new Map();
  function mapleSprite(col, blur = 0) {
    const key = col + blur; if (sprites.has(key)) return sprites.get(key);
    const S = blur ? 160 : 64, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'), cc = hex(col), R = S * (blur ? 0.3 : 0.42);
    g.translate(S / 2, S / 2); if (blur && canFilter) g.filter = `blur(${blur}px)`;
    const path = () => { g.beginPath(); for (let k = 0; k <= 280; k++) { const th = (k / 280) * TAU, a = th - Math.PI / 2, lobe = Math.pow(Math.abs(Math.cos(3.5 * (th - Math.PI))), 0.55), tooth = 0.035 * Math.sin(th * 42), gap = Math.exp(-Math.pow((th - Math.PI) * 3.2, 2)) * 0.55, r = R * (0.42 + 0.58 * lobe + tooth - gap); const x = Math.cos(a + Math.PI) * r * -1, y = Math.sin(a + Math.PI) * r * -1; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
    path(); const gr = g.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.05, 0, 0, R * 1.1);
    gr.addColorStop(0, rgba(cc.map((v) => Math.min(255, v * 1.35 + 18)))); gr.addColorStop(0.55, rgba(cc)); gr.addColorStop(1, rgba(cc.map((v) => v * 0.6)));
    g.fillStyle = gr; g.fill(); g.strokeStyle = rgba(cc.map((v) => v * 0.45), 0.85); g.lineWidth = S / 64; g.stroke();
    if (!blur) { g.strokeStyle = rgba(cc.map((v) => Math.min(255, v * 1.5 + 30)), 0.45); g.lineWidth = S / 90; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.78; g.beginPath(); g.moveTo(0, R * 0.12); g.lineTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); g.stroke(); }
      g.strokeStyle = rgba(cc.map((v) => v * 0.5), 0.9); g.lineWidth = S / 50; g.beginPath(); g.moveTo(0, R * 0.12); g.lineTo(R * 0.06, R * 0.62); g.stroke(); }
    sprites.set(key, c); return c;
  }
  function blossomSprite(k) {
    const key = 'b' + k; if (sprites.has(key)) return sprites.get(key);
    const S = 48, c = document.createElement('canvas'); c.width = S; c.height = S; const g = c.getContext('2d'); g.translate(S / 2, S / 2);
    const tint = [[255, 228, 236], [252, 200, 216], [246, 176, 200]][k % 3];
    for (let p = 0; p < 5; p++) {
      g.save(); g.rotate(p * TAU / 5 + k * 0.3); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-9, -6, -8, -17, -2.2, -19); g.lineTo(0, -16.5); g.lineTo(2.2, -19); g.bezierCurveTo(8, -17, 9, -6, 0, 0);
      const gr = g.createLinearGradient(0, 0, 0, -19); gr.addColorStop(0, 'rgba(232,92,128,1)'); gr.addColorStop(0.35, rgba(tint)); gr.addColorStop(1, 'rgba(255,248,250,1)');
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(200,90,120,.35)'; g.lineWidth = 0.6; g.stroke(); g.restore();
    }
    for (let s = 0; s < 9; s++) { const a = s * TAU / 9; g.strokeStyle = 'rgba(200,60,90,.8)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5); g.stroke(); g.fillStyle = '#F6D36B'; g.beginPath(); g.arc(Math.cos(a) * 6.8, Math.sin(a) * 6.8, 1, 0, TAU); g.fill(); }
    sprites.set(key, c); return c;
  }
  function petalSprite() {
    if (sprites.has('petal')) return sprites.get('petal');
    const c = document.createElement('canvas'); c.width = 24; c.height = 24; const g = c.getContext('2d'); g.translate(12, 12);
    g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-7, 3, -6, -6, -1.6, -8); g.lineTo(0, -6); g.lineTo(1.6, -8); g.bezierCurveTo(6, -6, 7, 3, 0, 8);
    const gr = g.createLinearGradient(0, 8, 0, -8); gr.addColorStop(0, '#F08AA8'); gr.addColorStop(1, '#FFF2F6'); g.fillStyle = gr; g.fill();
    sprites.set('petal', c); return c;
  }

  /* ── layout: measure the scrolls, grow the trees towards them, paint the backdrop ── */
  function layout() {
    const r = root.getBoundingClientRect(); W = r.width; H = r.height; narrow = W < 901;
    DPR = Math.min(devicePixelRatio || 1, W > 1500 ? 1.4 : 1.75);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    // measured without transforms, so a scroll still waiting for its bird is placed where it will hang
    const rel = (el) => { let x = 0, y = 0, e = el; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
    const rects = cards.map(rel), hb = rel(head), headR = { x: hb.x - 24, y: hb.y - 24, w: hb.w + 48, h: hb.h + 48 };
    const avoid = rects.map((q) => ({ x: q.x - 14, y: q.y - 4, w: q.w + 28, h: q.h + 14 })).concat([headR]);
    const inAvoid = (x, y) => avoid.some((q) => x > q.x && x < q.x + q.w && y > q.y && y < q.y + q.h);
    const rnd = rngOf(1185 + Math.round(W / 40) * 7 + Math.round(H / 60));
    const k = clamp(W / 1300, 0.62, 1.15);

    // two old maples, close to the camera, each cropped by the edge of the frame
    const tw = clamp(W * 0.11, 64, 180);
    const trees = [
      { side: -1, base: [W * 0.03 - tw * 0.15, H + 60], c1: [W * 0.085, H * 0.64], c2: [W * -0.01, H * 0.32], top: [W * 0.07, -90], w: tw },
      { side: 1, base: [W * 0.975 + tw * 0.15, H + 60], c1: [W * 0.925, H * 0.6], c2: [W * 1.01, H * 0.3], top: [W * 0.94, -90], w: tw * 0.9 },
    ];
    trees.forEach((t) => { t.at = (y) => { const u = clamp((t.base[1] - y) / (t.base[1] - t.top[1]), 0, 1); return { x: bez(t.base[0], t.c1[0], t.c2[0], t.top[0], u), w: t.w * (1 - 0.34 * u) }; }; });

    branches = []; clusters = []; twigs = []; perches = [];
    const addBranch = (tree, p0, p1, p2, p3, w0, w1, flex) => { const b = { tree, p: [p0, p1, p2, p3], w0, w1, flex, dip: 0, dv: 0, ph: rnd() * TAU }; branches.push(b); return b; };
    const addCluster = (anchor, r0, n, lift = 0) => {
      const base = anchorPos(anchor, 0, true), leaves = [], blooms = [];
      for (let i = 0, tries = 0; i < n && tries < n * 4; tries++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * r0, ox = Math.cos(a) * d * 1.3, oy = Math.sin(a) * d * 0.82 - lift;
        if (inAvoid(base.x + ox, base.y + oy)) continue;
        const light = clamp(0.48 - oy / (r0 * 1.7) + ox / (r0 * 4.5) + (rnd() - 0.5) * 0.75, 0, 0.999);
        leaves.push({ ox, oy, sz: (0.62 + rnd() * 0.5) * k, ang: rnd() * TAU, col: Math.floor(light * 6), ph: rnd() * TAU }); i++;
        if (rnd() < 0.3) blooms.push({ ox: ox + (rnd() - 0.5) * 6, oy: oy - 3, sz: (0.36 + rnd() * 0.3) * k, ang: rnd() * TAU, kind: Math.floor(rnd() * 3), delay: rnd() * 0.65, ph: rnd() * TAU });
      }
      const blobs = Array.from({ length: 3 + Math.floor(rnd() * 3) }, () => { const a = rnd() * TAU, d = rnd() * r0 * 0.55; return { ox: Math.cos(a) * d * 1.2, oy: Math.sin(a) * d * 0.7 - lift, r: r0 * (0.42 + rnd() * 0.32) }; })
        .filter((q) => !inAvoid(base.x + q.ox, base.y + q.oy));
      clusters.push({ anchor, leaves, blobs, blooms });
    };
    const dens = narrow ? 0.6 : 1;

    // a branch to each scroll: out from the trunk, over the scroll's cord, ending a little beyond it
    rects.forEach((q, i) => {
      const ti = cards.length === 6 ? TREE_OF[i] : i % 2, t = trees[ti], inward = -t.side;
      const hole = { x: q.x + q.w / 2, y: q.y + 6 }, py = q.y - 44 - rnd() * 12;
      const y0 = py + 46 + rnd() * 50, tr = t.at(y0), x0 = tr.x + inward * tr.w * 0.22;
      const tip = { x: hole.x + inward * (64 + rnd() * 44), y: py - 18 - rnd() * 14 };
      const p1 = [lerp(x0, tip.x, 0.33), y0 - 16 - rnd() * 24], p2 = [lerp(x0, tip.x, 0.72), py + 8];
      const b = addBranch(ti, [x0, y0], p1, p2, [tip.x, tip.y], clamp(tr.w * 0.19, 10, 26), 2, 1);
      let best = 0.8, bd = 1e9; for (let s = 0.3; s <= 0.98; s += 0.01) { const d = Math.abs(bez(x0, p1[0], p2[0], tip.x, s) - hole.x); if (d < bd) { bd = d; best = s; } }
      perches[i] = { b, s: best, hole, card: i, tree: ti };
      const nt = 3 + Math.floor(rnd() * 3);
      for (let j = 0; j < nt; j++) {
        const s = 0.26 + j / nt * 0.72 + rnd() * 0.06; if (Math.abs(s - best) < 0.08) continue;
        const tw2 = { b, s, ang: -Math.PI / 2 + inward * (0.35 + rnd() * 0.75), len: (26 + rnd() * 50) * (narrow ? 0.75 : 1), w: 2.6 + rnd() * 2, ph: rnd() * TAU };
        twigs.push(tw2); addCluster({ b, s, twig: tw2 }, (22 + rnd() * 16) * (narrow ? 0.8 : 1), Math.round((30 + rnd() * 18) * dens), 4);
      }
      addCluster({ b, s: 1 }, 26 * (narrow ? 0.85 : 1), Math.round(36 * dens), 8);
      addCluster({ b, s: 0.55 }, 22, Math.round(24 * dens), 16);
    });

    // the canopy: limbs that climb out of the frame, heavy with leaves, so we only ever see part of each tree
    trees.forEach((t, ti) => {
      const inward = -t.side, n = narrow ? 5 : 9;
      for (let j = 0; j < n; j++) {
        const y0 = lerp(H * 0.01, Math.min(H * 0.42, 640), j / (n - 1)) + rnd() * 40, tr = t.at(y0), out = j % 3 === 2 ? -inward : inward;
        const len = (narrow ? W * 0.34 : W * 0.2) * (0.6 + rnd() * 0.7) * (out === inward ? 1 : 0.6);
        const x0 = tr.x + out * tr.w * 0.3, tip = [x0 + out * len, y0 - 90 - rnd() * 160];
        const b = addBranch(ti, [x0, y0], [x0 + out * len * 0.35, y0 - 10], [x0 + out * len * 0.75, tip[1] + 50], tip, clamp(tr.w * 0.21, 9, 30), 2.6, 0.5);
        for (let s = 0.25; s <= 1.0; s += narrow ? 0.2 : 0.12) addCluster({ b, s }, (34 + rnd() * 26) * (narrow ? 0.8 : 1), Math.round((40 + rnd() * 26) * dens * 0.95), 10);
      }
      for (let j = 0; j < (narrow ? 5 : 11); j++) {
        const x = t.at(-10).x, b = addBranch(ti, [x, -10], [x, -10], [x, -10], [x + inward * (20 + j * W * 0.022), 10 + rnd() * 70], 1, 1, 0.35);
        b.hidden = true; addCluster({ b, s: 1 }, 50 + rnd() * 30, Math.round(60 * dens), 0);
      }
    });

    L = { dusk: paintLand(DUSK, rnd), dawn: paintLand(DAWN, rngOf(55)), skyDusk: paintSky(DUSK), skyDawn: paintSky(DAWN), near: paintTrunks(trees) };
    falling = Array.from({ length: narrow ? 14 : 28 }, () => newFall(true));
    petals = Array.from({ length: narrow ? 22 : 46 }, () => newPetal(true));
    motes = Array.from({ length: narrow ? 16 : 34 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.6, ph: Math.random() * TAU, sp: 0.2 + Math.random() * 0.5 }));
    bokeh = Array.from({ length: narrow ? 2 : 4 }, (_, i) => ({ x: Math.random() * W, y: H * (0.15 + Math.random() * 0.7), sz: (narrow ? 0.5 : 0.8) + Math.random() * 0.6, vx: 6 + Math.random() * 10, ph: Math.random() * TAU, col: 1 + (i % 4) }));
    root.classList.toggle('is-live', !CALM && cards.length > 0);
    applyLit(); draw(performance.now() / 1000, 0);
  }
  function newFall(any) { return { x: Math.random() * W * 1.1 - W * 0.05, y: any ? Math.random() * H : -20 - Math.random() * 80, vy: 26 + Math.random() * 30, sw: 20 + Math.random() * 34, ph: Math.random() * TAU, spin: 0.8 + Math.random() * 2.2, col: Math.floor(Math.random() * 6), sz: 0.5 + Math.random() * 0.45 }; }
  function newPetal(any) { return { x: Math.random() * W * 1.2 - W * 0.1, y: any ? Math.random() * H : -10 - Math.random() * 60, vy: 18 + Math.random() * 22, sw: 26 + Math.random() * 40, ph: Math.random() * TAU, spin: 1 + Math.random() * 3, sz: 0.45 + Math.random() * 0.5 }; }

  /* ── the backdrop, painted once per mood ── */
  const HZ = () => H * 0.78;   // the horizon: where the lake meets the far shore
  function paintSky(M) {
    const c = document.createElement('canvas'); c.width = Math.round(W + 40); c.height = Math.round(H); const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, HZ()); M.sky.forEach((col, i) => sky.addColorStop(i / (M.sky.length - 1), col));
    g.fillStyle = sky; g.fillRect(0, 0, c.width, H);
    // long thin clouds, lit from below
    const rnd = rngOf(M === DUSK ? 3 : 4);
    for (let i = 0; i < 9; i++) { const y = HZ() * (0.18 + rnd() * 0.6), x = rnd() * c.width, w = 160 + rnd() * 380, h = 5 + rnd() * 10;
      const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, rgba(mix(hex(M.sky[1]), [255, 255, 255], 0.15), 0)); gr.addColorStop(0.5, rgba(M.light, 0.28 + rnd() * 0.2)); gr.addColorStop(1, rgba(M.light, 0));
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill(); }
    return c;
  }
  function paintLand(M, rnd) {
    const c = document.createElement('canvas'), pad = 20; c.width = Math.round(W + pad * 2); c.height = Math.round(H); const g = c.getContext('2d'); g.translate(pad, 0);
    const hz = HZ(), blurOn = (px) => { if (canFilter) g.filter = px ? `blur(${px}px)` : 'none'; };
    // the mountain, far off, with snow
    blurOn(1.4);
    const fx = W * 0.42, fy = hz - Math.min(H * 0.42, W * 0.24), fw = Math.max(W * 0.36, 420);
    g.beginPath(); g.moveTo(fx - fw, hz); g.quadraticCurveTo(fx - fw * 0.35, hz - (hz - fy) * 0.55, fx - fw * 0.08, fy + 4); g.lineTo(fx + fw * 0.08, fy + 4); g.quadraticCurveTo(fx + fw * 0.35, hz - (hz - fy) * 0.55, fx + fw, hz); g.closePath();
    const fg = g.createLinearGradient(0, fy, 0, hz); fg.addColorStop(0, M.fuji); fg.addColorStop(1, rgba(M.haze, 0.9)); g.fillStyle = fg; g.fill();
    g.save(); g.clip(); g.beginPath(); g.moveTo(fx - fw, fy + (hz - fy) * 0.3);
    for (let x = -fw; x <= fw; x += 8) g.lineTo(fx + x, fy + (hz - fy) * (0.24 + 0.06 * Math.sin(x / 9) + 0.04 * Math.sin(x / 23)));
    g.lineTo(fx + fw, fy - 10); g.lineTo(fx - fw, fy - 10); g.closePath(); g.fillStyle = M.snow; g.fill(); g.restore();
    // ridges, nearer and darker, with pine silhouettes, a pagoda and a torii gate
    M.ridge.forEach((col, li) => {
      blurOn(li === 0 ? 1.1 : li === 1 ? 0.6 : 0);
      const base = hz - H * (0.08 - li * 0.025), amp = H * (0.05 - li * 0.012), yAt = (x) => base - amp * (0.55 + 0.45 * Math.sin(x / (210 + li * 80) + li * 2.3)) - amp * 0.3 * Math.sin(x / 71 + li);
      g.beginPath(); g.moveTo(-pad, hz + 4); for (let x = -pad; x <= W + pad; x += 10) g.lineTo(x, yAt(x)); g.lineTo(W + pad, hz + 4); g.closePath(); g.fillStyle = col; g.fill();
      const n = Math.round(W / (34 - li * 7));
      for (let i = 0; i < n; i++) { const x = rnd() * (W + pad * 2) - pad, y = yAt(x) + 2, s = (6 + rnd() * 7) * (1 + li * 0.6); pine(g, x, y, s, col); }
      if (li === 1) pagoda(g, W * 0.73, yAt(W * 0.73) + 4, clamp(H * 0.17, 90, 170), col, M);
      if (li === 2) torii(g, W * 0.24, yAt(W * 0.24) + 2, clamp(H * 0.07, 34, 70), M);
      // haze between ridges
      blurOn(0); const hzG = g.createLinearGradient(0, base - amp * 2, 0, hz); hzG.addColorStop(0, rgba(M.haze, 0)); hzG.addColorStop(1, rgba(M.haze, 0.22 - li * 0.05));
      g.fillStyle = hzG; g.fillRect(-pad, base - amp * 2, W + pad * 2, hz - base + amp * 2);
    });
    blurOn(0);
    // the lake: the sky mirrored, darker, with long ripples
    const ly = hz, lh = H * 0.08, lg = g.createLinearGradient(0, ly, 0, ly + lh); lg.addColorStop(0, M.lake[0]); lg.addColorStop(1, M.lake[1]);
    g.fillStyle = lg; g.fillRect(-pad, ly, W + pad * 2, lh);
    for (let i = 0; i < 70; i++) { const y = ly + rnd() * lh, x = rnd() * W, w = 20 + rnd() * 90; g.fillStyle = rgba(M.light, 0.08 + rnd() * 0.14); g.fillRect(x, y, w, 1); }
    // the near shore: moss, stones, fallen red leaves
    const gy = ly + lh; g.beginPath(); g.moveTo(-pad, H); for (let x = -pad; x <= W + pad; x += 10) g.lineTo(x, gy - 6 * Math.sin(x / 130) - 4 * Math.sin(x / 41)); g.lineTo(W + pad, H); g.closePath();
    const gg = g.createLinearGradient(0, gy - 10, 0, H); gg.addColorStop(0, rgba(mix(hex(M.ground), [70, 90, 50], 0.35))); gg.addColorStop(1, M.ground); g.fillStyle = gg; g.fill();
    for (let i = 0; i < 9; i++) { const x = rnd() * W, y = gy + 10 + rnd() * (H - gy - 10), r = 8 + rnd() * 16; g.fillStyle = rgba(mix(hex(M.ground), [150, 140, 150], 0.3)); g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.7, 0, 0, TAU); g.fill(); g.fillStyle = rgba(M.light, 0.12); g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.25, r, r * 0.3, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < W / 2.2; i++) { const x = rnd() * W, y = gy + rnd() * (H - gy) + 2, s = 0.18 + rnd() * 0.18; g.save(); g.translate(x, y); g.rotate(rnd() * TAU); g.scale(s, s * 0.55); g.globalAlpha = 0.55 + rnd() * 0.4; g.drawImage(mapleSprite(LEAVES[Math.floor(rnd() * 6)]), -32, -32); g.restore(); }
    return { c, pad };
  }
  function pine(g, x, y, s, col) { g.fillStyle = col; g.fillRect(x - s * 0.05, y - s * 1.6, s * 0.1, s * 1.6); for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x + (i - 1) * s * 0.25, y - s * (1.0 + i * 0.35), s * (0.75 - i * 0.18), s * 0.2, 0, 0, TAU); g.fill(); } }
  function pagoda(g, x, y, h, col, M) {
    // five storeys with upturned eaves and a finial (sōrin)
    const body = mix(hex(col), [0, 0, 0], 0.25), roof = mix(hex(col), [0, 0, 0], 0.4), tier = h * 0.15;
    for (let i = 0; i < 5; i++) {
      const by = y - i * tier, w = h * (0.36 - i * 0.045);
      g.fillStyle = rgba(body); g.fillRect(x - w * 0.55, by - tier * 0.7, w * 1.1, tier * 0.7);
      g.fillStyle = rgba(M.light, 0.5); if (i < 4) g.fillRect(x - w * 0.12, by - tier * 0.55, w * 0.24, tier * 0.28);   // a lit window
      g.fillStyle = rgba(roof); g.beginPath(); g.moveTo(x - w * 1.25, by - tier * 0.62); g.quadraticCurveTo(x - w * 0.9, by - tier * 0.72, x - w * 0.6, by - tier * 0.95);
      g.lineTo(x + w * 0.6, by - tier * 0.95); g.quadraticCurveTo(x + w * 0.9, by - tier * 0.72, x + w * 1.25, by - tier * 0.62); g.lineTo(x + w * 1.05, by - tier * 0.72); g.lineTo(x - w * 1.05, by - tier * 0.72); g.closePath(); g.fill();
    }
    g.fillStyle = rgba(roof); g.fillRect(x - 1.5, y - 5 * tier - h * 0.25, 3, h * 0.28);
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x, y - 5 * tier - h * 0.04 - i * h * 0.04, 2.6, 0, TAU); g.fill(); }
  }
  function torii(g, x, y, h, M) {
    const col = rgba(M.torii, 0.92), w = h * 1.25;
    g.fillStyle = col; g.fillRect(x - w * 0.36, y - h, h * 0.08, h); g.fillRect(x + w * 0.28, y - h, h * 0.08, h);
    g.fillRect(x - w * 0.46, y - h * 0.78, w * 0.92, h * 0.07);
    g.beginPath(); g.moveTo(x - w * 0.62, y - h * 0.96); g.quadraticCurveTo(x, y - h * 0.88, x + w * 0.62, y - h * 0.96); g.lineTo(x + w * 0.56, y - h * 1.08); g.quadraticCurveTo(x, y - h * 1.0, x - w * 0.56, y - h * 1.08); g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,10,10,.6)'; g.fillRect(x - w * 0.5, y - h * 1.1, w, h * 0.04);
  }
  function paintTrunks(trees) {
    const c = document.createElement('canvas'); c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    const g = c.getContext('2d'); g.scale(DPR, DPR); const rnd = rngOf(11);
    trees.forEach((t) => {
      const N = 70, Lp = [], Rp = [];
      for (let i = 0; i <= N; i++) { const y = lerp(t.base[1], t.top[1], i / N), a = t.at(y), flare = Math.pow(clamp((y - H * 0.78) / (H * 0.28), 0, 1), 2) * t.w * 0.4, wob = Math.sin(y / 37 + t.side) * t.w * 0.03; Lp.push([a.x - a.w / 2 - flare + wob, y]); Rp.push([a.x + a.w / 2 + flare + wob, y]); }
      g.beginPath(); Lp.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); [...Rp].reverse().forEach((p) => g.lineTo(p[0], p[1])); g.closePath();
      const mid = t.at(H * 0.5), sunny = t.side < 0, gr = g.createLinearGradient(mid.x - mid.w / 2, 0, mid.x + mid.w / 2, 0);
      // a round trunk: dark at the shaded edge, a soft highlight, a warm rim where the low sun catches it
      // the low sun sits between the trees, so each trunk is lit on its inner edge
      const RIMC = [226, 168, 150], stops = sunny ? [BARK[0], BARK[1], BARK[2], BARK[1], RIMC] : [RIMC, BARK[1], BARK[2], BARK[1], BARK[0]];
      [0, 0.12, 0.45, 0.8, 1].forEach((o, i) => gr.addColorStop(o, rgba(stops[i])));
      g.fillStyle = gr; g.fill(); g.save(); g.clip();
      // smooth maple bark: long pale streaks, fine horizontal lenticels, a few twisting ridges
      for (let i = 0; i < 52; i++) {
        const f = rnd(), y0 = H + 40 - rnd() * 80, len = 0.25 + rnd() * 0.75; g.beginPath();
        for (let u = 0; u <= len; u += 0.02) { const y = lerp(y0, t.top[1], u), a = t.at(y), x = a.x + (f - 0.5) * a.w + Math.sin(u * 28 + i) * 2.4 + u * t.w * 0.08 * t.side; u ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = f > 0.55 ? 'rgba(190,180,170,.10)' : 'rgba(0,0,0,.22)'; g.lineWidth = 1 + rnd() * 3; g.stroke();
      }
      for (let i = 0; i < 260; i++) { const y = rnd() * H, a = t.at(y), x = a.x + (rnd() - 0.5) * a.w * 0.9; g.fillStyle = `rgba(20,14,12,${0.15 + rnd() * 0.2})`; g.fillRect(x, y, 2 + rnd() * 6, 1); }
      for (let i = 0; i < 5; i++) { const y = H * (0.18 + rnd() * 0.7), a = t.at(y), x = a.x + (rnd() - 0.5) * a.w * 0.45; g.fillStyle = 'rgba(10,6,6,.45)'; g.beginPath(); g.ellipse(x, y, a.w * 0.07, a.w * 0.12, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(220,200,190,.16)'; g.lineWidth = 2; g.stroke(); }
      // moss on the shaded, lower side
      for (let i = 0; i < 260; i++) { const y = H * (0.5 + rnd() * 0.55), a = t.at(y), x = a.x - t.side * a.w * (0.05 + rnd() * 0.45); g.fillStyle = `rgba(${90 + rnd() * 40 | 0},${120 + rnd() * 40 | 0},${50 + rnd() * 20 | 0},${0.12 + rnd() * 0.25})`; g.beginPath(); g.arc(x, y, 1 + rnd() * 3.2, 0, TAU); g.fill(); }
      const ao = g.createLinearGradient(mid.x - mid.w / 2, 0, mid.x + mid.w / 2, 0); ao.addColorStop(0, `rgba(0,0,0,${sunny ? 0.45 : 0})`); ao.addColorStop(0.5, 'rgba(0,0,0,0)'); ao.addColorStop(1, `rgba(0,0,0,${sunny ? 0 : 0.45})`);
      g.fillStyle = ao; g.fillRect(0, 0, W, H); g.restore();
    });
    return c;
  }

  /* ── wind, branches ── */
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
    const tw = a.twig, ang = tw.ang + (base ? 0 : WN * 0.18 + 0.06 * Math.sin(n * 2.4 + tw.ph));
    return { x: p.x + Math.cos(ang) * tw.len, y: p.y + Math.sin(ang) * tw.len };
  }

  /* ── birds ── */
  const offPoint = (k) => (k === 'L' ? { x: -90, y: H * 0.16 } : k === 'R' ? { x: W + 90, y: H * 0.06 } : k === 'TR' ? { x: W + 160, y: -140 } : { x: W * 0.56, y: H + 260 });
  function perchPt(i) { const p = perches[i]; if (!p) return { x: W / 2, y: H / 2 }; const q = branchPt(p.b, p.s); return { x: q.x, y: q.y - p.b.w0 * 0.1 }; }
  const ptOf = (k) => (typeof k === 'number' ? perchPt(k) : typeof k === 'object' ? k : offPoint(k));
  const allSegs = () => (narrow ? dyn : SCRIPT).concat(idle);

  function placeBirds(now) {
    const segs = allSegs();
    for (const bd of birds) {
      let cur = null, prev = null;
      for (const s of segs) { if (s[0] !== bd.i) continue; if (T >= s[4] && T <= s[5]) cur = s; if (T > s[5] && (!prev || s[5] >= prev[5])) prev = s; }
      if (cur) {
        const [, type, from, to, t0, t1] = cur, u = (T - t0) / (t1 - t0), a = ptOf(from), b = ptOf(to), dx = b.x - a.x;
        bd.hidden = false; bd.perched = null;
        if (type === 'approach') {
          // from behind the viewer into the scene: large and close, shrinking with distance
          const depth = 1 - Math.pow(1 - u, 2.3); bd.s = lerp(8, 1, depth);
          bd.x = lerp(a.x, b.x, depth) + Math.sin(u * 5) * 34 * (1 - u); bd.y = lerp(a.y, b.y, depth) - Math.sin(u * Math.PI) * 70;
          bd.face = b.x < a.x ? -1 : 1; bd.flap = u < 0.86 ? now * 16 : Math.PI * 0.55;
        } else {
          const e = type === 'away' ? u * u : eio(u), hgt = type === 'hop' ? 30 + Math.abs(dx) * 0.12 : 70 + Math.abs(dx) * 0.12;
          bd.x = bez(a.x, a.x + dx * 0.3, b.x - dx * 0.25, b.x, e); bd.y = bez(a.y, a.y - hgt, b.y - hgt * 0.6, b.y, e);
          bd.s = type === 'away' ? lerp(1, 0.55, u) : 1; bd.face = dx < 0 ? -1 : 1;
          bd.flap = type === 'hop' ? (u < 0.5 ? now * 16 : Math.PI * 0.6) : u < 0.78 ? now * 16 : u < 0.92 ? Math.PI * 0.55 : now * 22;
        }
      } else if (prev && typeof prev[3] === 'number') {
        const p = perchPt(prev[3]); bd.hidden = false; bd.perched = prev[3]; bd.landedAt = prev[5]; bd.s = 1; bd.x = p.x; bd.y = p.y; bd.flap = 0;
        // face the open air, towards the middle of the scene, when there was no flight to set a direction
        if (prev[2] === prev[3]) bd.face = p.x < W / 2 ? 1 : -1;
      } else bd.hidden = true;
    }
  }
  // what a perched bird is doing: sing, look down at the scroll, look at us, then rest and glance about
  function pose(bd, now) {
    const r = T - bd.landedAt, P = { open: 0, pitch: 0, front: 0 };
    if (r < ROUTINE + 0.2) {
      if (r > 0.25 && r < 1.0) { P.open = Math.max(0, Math.sin((r - 0.25) * 22)) * 0.5; P.pitch = -0.18; if (now - bd.lastNote > 0.22) { bd.lastNote = now; sing(bd); } }
      else if (r >= 1.0 && r < 1.75) P.pitch = 0.55 * Math.sin(seg(r, 1.0, 1.75) * Math.PI);
      else if (r >= 1.75 && r < 2.75) P.front = Math.sin(seg(r, 1.75, 2.75) * Math.PI) > 0.25 ? 1 : 0;
    } else {
      const n = Math.sin(now * 0.6 + bd.ph * 5); if (n > 0.93) P.front = 1; else if (n < -0.9) P.pitch = 0.4; else P.pitch = Math.sin(now * 0.9 + bd.ph) * 0.1;
    }
    return P;
  }
  function sing(bd) {
    const s = clamp(W / 1300, 0.8, 1.15) * (narrow ? 1.2 : 1.45);
    notes.push({ x: bd.x + bd.face * 20 * s, y: bd.y - 24 * s, vx: bd.face * (14 + Math.random() * 14), vy: -24 - Math.random() * 16, life: 0, sym: Math.random() < 0.5 ? '♪' : '♫' });
  }

  function drawBird(bd, now) {
    if (bd.hidden) return;
    const s = bd.s * clamp(W / 1300, 0.8, 1.15) * (narrow ? 1.2 : 1.45), f = bd.face, perched = bd.perched !== null, P = perched ? pose(bd, now) : { open: 0, pitch: -0.05, front: 0 };
    const c = ctx; c.save(); c.translate(bd.x, bd.y + (perched ? Math.sin(now * 2.4 + bd.ph) * 0.4 : 0)); c.scale(f * s, s);
    if (bd.s > 1.8) c.globalAlpha = clamp(1.3 - bd.s * 0.07, 0.72, 1);
    const OL = [122, 150, 44], OLD = [78, 98, 26], BUFF = [226, 220, 204], YEL = [234, 214, 62], RIM = [255, 214, 170];
    // contact shadow on the branch
    if (perched) { c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(1, 1, 10, 2.2, 0, 0, TAU); c.fill(); }
    if (!perched) wing(c, Math.sin(bd.flap), true);
    // tail: three narrow feathers
    c.save(); c.translate(-12, -10); c.rotate(perched ? 0.42 : 0.06);
    for (let i = 0; i < 3; i++) { c.fillStyle = rgba(mix(OLD, [40, 50, 20], i * 0.2)); c.beginPath(); c.moveTo(0, -1.5 + i); c.lineTo(-19, -2 + i * 2); c.lineTo(-19.5, 0.2 + i * 2); c.lineTo(0, 2 + i); c.closePath(); c.fill(); }
    c.restore();
    // body
    c.save(); c.rotate(perched ? -0.2 : -0.04);
    const bg = c.createLinearGradient(0, -23, 0, -3); bg.addColorStop(0, rgba(OL)); bg.addColorStop(0.45, rgba(mix(OL, BUFF, 0.35))); bg.addColorStop(1, rgba(BUFF));
    c.fillStyle = bg; c.beginPath(); c.moveTo(10, -18); c.bezierCurveTo(6, -25, -10, -24, -15, -14); c.bezierCurveTo(-16, -8, -8, -3, 1, -3.5); c.bezierCurveTo(9, -4, 13, -10, 10, -18); c.fill();
    c.fillStyle = 'rgba(205,176,128,.45)'; c.beginPath(); c.ellipse(-3, -8, 9, 3.6, 0.05, 0, TAU); c.fill();         // buff flanks
    c.fillStyle = rgba(YEL, 0.75); c.beginPath(); c.ellipse(7, -14.5, 5, 4.4, 0.3, 0, TAU); c.fill();                 // yellow breast
    c.strokeStyle = 'rgba(40,50,20,.16)'; c.lineWidth = 0.6;                                                         // feather texture
    for (let i = 0; i < 14; i++) { const x = -12 + (i % 7) * 3.2, y = -19 + Math.floor(i / 7) * 4 + (i % 2); c.beginPath(); c.arc(x, y, 2.4, 0.2, Math.PI - 0.2); c.stroke(); }
    c.strokeStyle = rgba(RIM, 0.55); c.lineWidth = 1.1; c.beginPath(); c.moveTo(9, -19.5); c.bezierCurveTo(4, -24.5, -9, -23.5, -14, -15); c.stroke();
    c.restore();
    if (perched) wing(c, null, false);
    // head
    c.save(); c.translate(7, -18); c.rotate(P.pitch); c.translate(2, -4);
    const hg = c.createLinearGradient(0, -8, 0, 7); hg.addColorStop(0, rgba(mix(OL, [255, 255, 160], 0.15))); hg.addColorStop(1, rgba(OL));
    if (P.front < 0.5) {
      c.fillStyle = hg; c.beginPath(); c.arc(0, 0, 7.4, 0, TAU); c.fill();
      c.fillStyle = rgba(YEL); c.beginPath(); c.arc(3.4, 4.2, 4.2, -0.4, Math.PI * 0.9); c.fill();                     // yellow throat
      const o = P.open, bx = 6.2, by = -0.6;                                                                       // beak, upper and lower
      c.save(); c.translate(bx, by); c.rotate(-o * 0.6); c.fillStyle = '#3B3B3E'; c.beginPath(); c.moveTo(0, -1.4); c.lineTo(7.4, 0.2); c.lineTo(0, 0.6); c.closePath(); c.fill(); c.restore();
      c.save(); c.translate(bx, by + 0.8); c.rotate(o * 0.6); c.fillStyle = '#6E6E74'; c.beginPath(); c.moveTo(0, -0.2); c.lineTo(6.6, 0.1); c.lineTo(0, 1.4); c.closePath(); c.fill(); c.restore();
      c.fillStyle = '#FBFBF4'; c.beginPath(); c.arc(1.6, -1.2, 3.1, 0, TAU); c.fill();                              // the white eye-ring
      c.fillStyle = '#121212'; c.beginPath(); c.arc(1.9, -1.2, 1.9, 0, TAU); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(2.5, -1.9, 0.65, 0, TAU); c.fill();
      c.fillStyle = 'rgba(30,30,20,.5)'; c.fillRect(3.6, -1.6, 2.6, 0.7);                                            // lores
    } else {
      // turned to look at us
      c.fillStyle = hg; c.beginPath(); c.ellipse(0.5, 0, 7.6, 7.2, 0, 0, TAU); c.fill();
      c.fillStyle = rgba(YEL); c.beginPath(); c.ellipse(0.5, 4.4, 4.6, 3.2, 0, 0, TAU); c.fill();
      for (const ex of [-3.1, 4.1]) { c.fillStyle = '#FBFBF4'; c.beginPath(); c.arc(ex, -1.3, 2.7, 0, TAU); c.fill(); c.fillStyle = '#121212'; c.beginPath(); c.arc(ex, -1.2, 1.7, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + 0.5, -1.8, 0.55, 0, TAU); c.fill(); }
      c.fillStyle = '#3B3B3E'; c.beginPath(); c.moveTo(-0.9, 1.1); c.lineTo(1.9, 1.1); c.lineTo(0.5, 4.2); c.closePath(); c.fill();
    }
    c.restore();
    if (!perched) wing(c, Math.sin(bd.flap), false);
    // legs and toes gripping the branch
    if (perched) { c.strokeStyle = '#5A6070'; c.lineWidth = 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-1.5, -4.5); c.lineTo(-0.8, 0); c.moveTo(2.5, -4.5); c.lineTo(3.2, 0); c.moveTo(-3, 0.3); c.lineTo(1.5, 0.3); c.moveTo(1.5, 0.3); c.lineTo(5.5, 0.3); c.stroke(); }
    c.restore();

    function wing(g, fl, far) {
      const OLW = far ? mix(OLD, [20, 26, 10], 0.35) : OLD;
      if (fl === null) { // folded along the body
        g.save(); g.rotate(-0.16);
        const wg = g.createLinearGradient(0, -19, 0, -8); wg.addColorStop(0, rgba(OL)); wg.addColorStop(1, rgba(OLD));
        g.fillStyle = wg; g.beginPath(); g.moveTo(6, -17); g.bezierCurveTo(-2, -21, -14, -18, -22, -10.5); g.bezierCurveTo(-12, -9, -2, -9.5, 5, -11); g.closePath(); g.fill();
        for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(190,210,110,${0.35 - i * 0.05})`; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-6 - i * 2, -15 + i * 1.3); g.quadraticCurveTo(-14 - i, -13 + i, -21 + i * 0.5, -10.6 + i * 0.3); g.stroke(); }
        g.restore(); return;
      }
      // spread: a leading edge to the wrist, then the primaries fanned out to the tip
      const lift = fl, sx = far ? 0 : 3, sy = -16, wx = -3 + (far ? 1 : 0), wy = sy - 12 * lift - 3, tx = -16, ty = sy - 24 * lift - 2;
      g.fillStyle = rgba(OLW); g.beginPath(); g.moveTo(sx + 3, sy + 1); g.quadraticCurveTo(wx + 4, wy - 2, wx, wy);
      for (let i = 0; i < 6; i++) { const a = i / 5, px = lerp(tx + 2, -12, a), py = lerp(ty, sy + 3, a); g.lineTo(px - 2, py - 1); g.lineTo(px + 1.5, py + 2); }
      g.lineTo(-9, sy + 3); g.closePath(); g.fill();
      if (!far) { g.strokeStyle = 'rgba(200,220,120,.4)'; g.lineWidth = 0.8; for (let i = 0; i < 5; i++) { const a = i / 5; g.beginPath(); g.moveTo(wx, wy + 1); g.lineTo(lerp(tx + 2, -12, a), lerp(ty, sy + 3, a)); g.stroke(); } }
    }
  }

  /* ── reveals, the bloom ── */
  function applyLit() { cards.forEach((c, i) => c.classList.toggle('is-lit', lit.has(i))); }
  function runEvents(prevT) {
    for (const s of allSegs()) {
      const [, , from, to, t0, t1, rev] = s;
      if (prevT < t0 && T >= t0 && typeof from === 'number' && perches[from]) perches[from].b.dv -= 40;
      if (prevT < t1 && T >= t1) { if (typeof to === 'number' && perches[to]) perches[to].b.dv += 120; if (rev >= 0 && !lit.has(rev)) { lit.add(rev); applyLit(); } }
    }
    if (lit.size === cards.length && bloomAt === Infinity) bloomAt = T + (narrow ? 2.2 : 2.6);
    if (bloomAt !== Infinity && ctl && ctl.textContent !== 'Replay') ctl.textContent = 'Replay';
  }
  // phones: a bird comes to each scroll as it scrolls into view
  const lastAt = [null, null], busy = [0, 0];
  function phoneScript() {
    if (!narrow) return;
    const vh = innerHeight, rr = root.getBoundingClientRect();
    cards.forEach((card, i) => {
      if (lit.has(i) || queued.has(i) || !perches[i]) return; const b = card.getBoundingClientRect(); if (b.top > vh * 0.78 || b.bottom < vh * 0.1) return;
      const bi = cards.length === 6 ? TREE_OF[i] : i % 2, start = Math.max(T + 0.05, busy[bi]), to = perchPt(i);
      const from = lastAt[bi] != null ? lastAt[bi] : { x: bi ? W + 70 : -70, y: to.y - 160 }, fp = ptOf(from), dist = Math.hypot(to.x - fp.x, to.y - fp.y), dur = clamp(dist / 420, 0.8, 2.0);
      dyn.push([bi, dist < 200 ? 'hop' : 'fly', from, i, start, start + dur, i]); queued.add(i); lastAt[bi] = i; busy[bi] = start + dur + ROUTINE;
    });
    void rr;
  }
  // after the story: the birds stay, preen, and now and then hop to another branch of their tree
  let nextIdle = SCRIPT_END + 4;
  function planIdle() {
    if (T < nextIdle || T < bloomAt) return;
    const bd = birds[Math.random() < 0.5 ? 0 : 1], here = lastPerch(bd.i); if (here == null) { nextIdle = T + 4; return; }
    const tree = perches[here]?.tree, there = lastPerch(1 - bd.i), opts = perches.filter((p) => p && p.tree === tree && p.card !== here && p.card !== there).map((p) => p.card);
    if (opts.length && !narrow) { const to = opts[Math.floor(Math.random() * opts.length)]; idle.push([bd.i, 'hop', here, to, T + 0.1, T + 0.85, -1]); }
    if (idle.length > 12) idle.splice(0, idle.length - 12);
    nextIdle = T + 6 + Math.random() * 6;
  }
  function lastPerch(i) { let best = null, bt = -1; for (const s of allSegs()) if (s[0] === i && s[5] <= T + 0.01 && s[5] > bt && typeof s[3] === 'number') { bt = s[5]; best = s[3]; } return best; }

  /* ── one frame ── */
  function draw(now, dt) {
    WN = CALM ? 0.3 : wind(now);
    const bloom = CALM ? 1 : bloomAt === Infinity ? 0 : eio(seg(T, bloomAt, bloomAt + 5)), c = ctx;
    for (const b of branches) { b.dv += (-70 * b.dip - 7 * b.dv) * dt; b.dip += b.dv * dt; }
    placeBirds(now);
    c.setTransform(DPR, 0, 0, DPR, 0, 0); mx += (tmx - mx) * Math.min(1, dt * 3);
    // sky, the sun, the far land: evening, crossfading to sunrise as the trees bloom
    c.drawImage(L.skyDusk, -20 - mx * 6, 0, W + 40, H);
    if (bloom > 0) { c.globalAlpha = bloom; c.drawImage(L.skyDawn, -20 - mx * 6, 0, W + 40, H); c.globalAlpha = 1; }
    const hz = HZ(), sunX = W * 0.62, sunY = lerp(hz + 40, hz - H * 0.16, bloom);
    { const R = Math.max(W, H) * 0.5, g = c.createRadialGradient(sunX, sunY, 0, sunX, sunY, R), col = mix(DUSK.light, DAWN.light, bloom);
      g.addColorStop(0, rgba(col, 0.55 + 0.3 * bloom)); g.addColorStop(0.08, rgba(col, 0.3 + 0.2 * bloom)); g.addColorStop(0.45, rgba(col, 0.08)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (bloom > 0.02) { c.fillStyle = rgba([255, 244, 214], bloom); c.beginPath(); c.arc(sunX, sunY, clamp(W * 0.03, 18, 44), 0, TAU); c.fill(); } }
    c.drawImage(L.dusk.c, -L.dusk.pad - mx * 12, 0, W + L.dusk.pad * 2, H);
    if (bloom > 0) { c.globalAlpha = bloom; c.drawImage(L.dawn.c, -L.dawn.pad - mx * 12, 0, W + L.dawn.pad * 2, H); c.globalAlpha = 1; }
    // drifting mist over the lake and between the ridges
    for (let i = 0; i < 3; i++) {
      const y = hz - H * (0.02 + i * 0.045), x = ((now * (8 + i * 4) + i * 400) % (W + 800)) - 400, g = c.createRadialGradient(x, y, 0, x, y, 420);
      g.addColorStop(0, rgba(mix(DUSK.haze, DAWN.haze, bloom), 0.22)); g.addColorStop(1, rgba(mix(DUSK.haze, DAWN.haze, bloom), 0)); c.save(); c.scale(1, 0.18); c.translate(0, y / 0.18 - y); c.fillStyle = g; c.fillRect(x - 420, y - 420, 840, 840); c.restore();
    }
    // light shafts through the canopy, stronger at sunrise
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = W * (0.3 + i * 0.13), a = (0.03 + 0.02 * Math.sin(now * 0.4 + i * 1.7)) * (0.8 + bloom * 1.2), g = c.createLinearGradient(x, 0, x - W * 0.25, H), col = mix(DUSK.light, DAWN.light, bloom);
      g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g;
      c.beginPath(); c.moveTo(x, -10); c.lineTo(x + 40 + i * 12, -10); c.lineTo(x - W * 0.22 + 90, H); c.lineTo(x - W * 0.28, H); c.closePath(); c.fill();
    }
    c.restore();
    c.drawImage(L.near, 0, 0, W, H);
    // branches: tapered, with a rim of warm light along the top
    for (const b of branches) {
      if (b.hidden) continue; const N = 16, top = [], bot = [];
      for (let i = 0; i <= N; i++) { const s = i / N, p = branchPt(b, s), q = branchPt(b, Math.min(1, s + 0.02)), ang = Math.atan2(q.y - p.y, q.x - p.x) - Math.PI / 2, w = lerp(b.w0, b.w1, Math.pow(s, 0.8)) / 2; top.push([p.x + Math.cos(ang) * w, p.y + Math.sin(ang) * w]); bot.push([p.x - Math.cos(ang) * w, p.y - Math.sin(ang) * w]); }
      c.beginPath(); top.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath();
      c.fillStyle = rgba(BARK[1]); c.fill();
      c.beginPath(); (top[0][1] < bot[0][1] ? top : bot).forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = rgba(mix([235, 170, 160], [255, 214, 160], bloom), 0.45); c.lineWidth = 1.3; c.stroke();
    }
    c.lineCap = 'round';
    for (const tw of twigs) { const a = branchPt(tw.b, tw.s), e = anchorPos({ b: tw.b, s: tw.s, twig: tw }, now); c.strokeStyle = rgba(BARK[1]); c.lineWidth = tw.w; c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + e.x) / 2 + 4, (a.y + e.y) / 2 + 3, e.x, e.y); c.stroke(); }
    // the cords from each branch down to its scroll
    for (const p of perches) {
      if (!p || !(lit.has(p.card) || !root.classList.contains('is-live'))) continue; const a = branchPt(p.b, p.s);
      c.strokeStyle = 'rgba(200,160,90,.9)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + p.hole.x) / 2 + WN * 3, (a.y + p.hole.y) / 2, p.hole.x, p.hole.y); c.stroke();
    }
    // foliage: shadowed masses, then the leaves, then the blossoms
    const deep = hex(LEAVES[0]).map((v) => v * 0.6), mid2 = hex(LEAVES[1]);
    for (const cl of clusters) { const o = anchorPos(cl.anchor, now); for (const q of cl.blobs) { const x = o.x + q.ox, y = o.y + q.oy, g = c.createRadialGradient(x - q.r * 0.3, y - q.r * 0.4, 0, x, y, q.r); g.addColorStop(0, rgba(mid2, 0.5)); g.addColorStop(0.35, rgba(deep, 0.92)); g.addColorStop(0.8, rgba(deep, 0.7)); g.addColorStop(1, rgba(deep, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, q.r, 0, TAU); c.fill(); } }
    for (const cl of clusters) {
      const o = anchorPos(cl.anchor, now);
      for (const lf of cl.leaves) {
        const fl = Math.sin(now * 3.1 + lf.ph) * 0.3 + WN * 0.22, x = o.x + lf.ox + Math.sin(now * 1.9 + lf.ph) * 1.2, y = o.y + lf.oy + Math.cos(now * 2.3 + lf.ph) * 0.8;
        const a = lf.ang + fl, s = lf.sz * 0.5, cs = Math.cos(a) * s, sn = Math.sin(a) * s, tilt = 0.75 + 0.25 * Math.cos(now * 2 + lf.ph);
        c.setTransform(DPR * cs, DPR * sn, -DPR * sn * tilt, DPR * cs * tilt, DPR * x, DPR * y); c.drawImage(mapleSprite(LEAVES[lf.col]), -32, -32);
      }
    }
    if (bloom > 0) for (const cl of clusters) {
      const o = anchorPos(cl.anchor, now);
      for (const bl of cl.blooms) {
        const g = eob(clamp((bloom - bl.delay * 0.7) / 0.3, 0, 1)); if (g <= 0.01) continue;
        const x = o.x + bl.ox + Math.sin(now * 1.7 + bl.ph) * 1, y = o.y + bl.oy, a = bl.ang + Math.sin(now * 2 + bl.ph) * 0.15, s = bl.sz * g * 0.55;
        c.setTransform(DPR * Math.cos(a) * s, DPR * Math.sin(a) * s, -DPR * Math.sin(a) * s, DPR * Math.cos(a) * s, DPR * x, DPR * y); c.drawImage(blossomSprite(bl.kind), -24, -24);
      }
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    // birds and their song
    for (const bd of birds) drawBird(bd, now);
    c.font = `600 ${narrow ? 13 : 16}px Georgia, serif`; c.textAlign = 'center';
    for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; n.life += dt; n.x += n.vx * dt; n.y += n.vy * dt; if (n.life > 1.3) { notes.splice(i, 1); continue; }
      c.fillStyle = `rgba(255,248,230,${(1 - n.life / 1.3) * 0.95})`; c.shadowColor = 'rgba(255,200,140,.8)'; c.shadowBlur = 8; c.fillText(n.sym, n.x + Math.sin(n.life * 9) * 3, n.y); }
    c.shadowBlur = 0;
    // falling maple leaves, tumbling; cherry petals once the trees bloom
    for (const f of falling) {
      if (!CALM) { f.y += f.vy * dt; f.x += (WN * 26 + 8) * dt + Math.sin(now * 1.2 + f.ph) * f.sw * dt; if (f.y > H + 30 || f.x > W + 40) Object.assign(f, newFall(false)); }
      const a = now * f.spin + f.ph, s = f.sz * 0.6, ca = Math.cos(a * 0.7), sa = Math.sin(a * 0.7), flip = Math.cos(a);
      c.setTransform(DPR * s * ca, DPR * s * sa, -DPR * s * sa * flip, DPR * s * ca * flip, DPR * f.x, DPR * f.y); c.drawImage(mapleSprite(LEAVES[f.col]), -32, -32);
    }
    if (bloom > 0) for (const p of petals) {
      if (!CALM) { p.y += p.vy * dt; p.x += (WN * 30 + 14) * dt + Math.sin(now * 1.5 + p.ph) * p.sw * dt; if (p.y > H + 20 || p.x > W + 30) Object.assign(p, newPetal(false)); }
      const a = now * p.spin + p.ph, s = p.sz, flip = Math.cos(a * 1.3); c.globalAlpha = bloom;
      c.setTransform(DPR * s * Math.cos(a), DPR * s * Math.sin(a), -DPR * s * Math.sin(a) * flip, DPR * s * Math.cos(a) * flip, DPR * p.x, DPR * p.y); c.drawImage(petalSprite(), -12, -12); c.globalAlpha = 1;
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    // fireflies in the evening, motes in the sunrise
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      const x = m.x + Math.sin(now * m.sp + m.ph) * 18, y = m.y + Math.cos(now * m.sp * 0.8 + m.ph) * 12, a = 0.5 * (0.5 + 0.5 * Math.sin(now * 1.6 + m.ph * 3)), col = mix([255, 214, 140], [255, 244, 220], bloom);
      const g = c.createRadialGradient(x, y, 0, x, y, m.r * 4); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, m.r * 4, 0, TAU); c.fill();
    }
    c.restore();
    // out-of-focus leaves drifting right past the lens
    for (const b of bokeh) {
      if (!CALM) { b.x += b.vx * dt; b.y += Math.sin(now * 0.5 + b.ph) * 6 * dt; if (b.x > W + 140) { b.x = -140; b.y = H * (0.15 + Math.random() * 0.7); } }
      const a = now * 0.4 + b.ph, s = b.sz; c.globalAlpha = 0.38;
      c.setTransform(DPR * s * Math.cos(a), DPR * s * Math.sin(a), -DPR * s * Math.sin(a), DPR * s * Math.cos(a), DPR * b.x, DPR * b.y); c.drawImage(mapleSprite(LEAVES[b.col], 5), -80, -80); c.globalAlpha = 1;
    }
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    // colour grade: cool violet in the evening, warm gold at sunrise; a soft vignette; fade into the neighbouring sections
    c.fillStyle = rgba(mix([70, 60, 140], [255, 170, 110], bloom), 0.1); c.fillRect(0, 0, W, H);
    const vg = c.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,20,.38)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light', bgc = isDark ? [8, 12, 20] : [250, 248, 244], v = c.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, rgba(bgc, 0.6)); v.addColorStop(0.05, rgba(bgc, 0)); v.addColorStop(0.95, rgba(bgc, 0)); v.addColorStop(1, rgba(bgc, 0.7)); c.fillStyle = v; c.fillRect(0, 0, W, H);
  }

  function loop(ms) {
    const now = ms / 1000, dt = Math.min(0.1, last ? now - last : 0); last = now;
    if (started && !CALM) { const p = T; T += dt; phoneScript(); runEvents(p); planIdle(); }
    draw(now, dt);
    raf = visible ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf && visible && !CALM) { last = 0; raf = requestAnimationFrame(loop); } };

  /* ── controls ── */
  function finish() {
    for (let i = 0; i < cards.length; i++) lit.add(i); applyLit(); started = true;
    if (narrow) { dyn.length = 0; [0, 1].forEach((bi) => { const mine = perches.filter((p) => p && p.tree === bi); const p = mine[mine.length - 1]; if (p) dyn.push([bi, 'hop', p.card, p.card, T - 0.2, T - 0.1, -1]); }); }
    else { const p = T; T = Math.max(T, SCRIPT_END - 2.5); runEvents(p); }
    if (bloomAt === Infinity || bloomAt > T) bloomAt = T + 0.3; if (ctl) ctl.textContent = 'Replay'; kick();
  }
  function replay() { lit.clear(); applyLit(); idle.length = 0; dyn.length = 0; queued.clear(); lastAt[0] = lastAt[1] = null; busy[0] = busy[1] = 0; notes.length = 0; T = 0; bloomAt = Infinity; nextIdle = SCRIPT_END + 4; started = true; if (ctl) ctl.textContent = 'Skip'; kick(); }
  ctl && ctl.addEventListener('click', () => (ctl.textContent === 'Replay' ? replay() : finish()));
  root.addEventListener('pointermove', (e) => { const r = root.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - 0.5; });

  /* ── start when the section is on screen ── */
  function boot() {
    layout();
    if (CALM) { for (let i = 0; i < cards.length; i++) lit.add(i); applyLit(); T = SCRIPT_END + 6; bloomAt = 0; draw(0, 0); if (ctl) ctl.hidden = true; return; }
    const io = new IntersectionObserver((es) => { for (const e of es) { visible = e.isIntersecting; if (e.intersectionRatio > (narrow ? 0.05 : 0.28) && !started) started = true; } kick(); }, { threshold: [0, 0.05, 0.28, 0.5] });
    io.observe(root);
    let rt = 0, lastW = innerWidth; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(innerWidth - lastW) < 2 && narrow) return; lastW = innerWidth; layout(); kick(); }, 180); });
    new MutationObserver(() => kick()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else addEventListener('load', boot);
})();
