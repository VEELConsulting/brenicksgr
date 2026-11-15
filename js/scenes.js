/* Scenes: The Build Stack and The Tunnel. The Brenicks Group.
   Scroll-linked, never pinned: each scene reads how far its section has travelled through the screen
   and eases toward it, so it moves with the visitor and never holds them in place. */
(() => {
  const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // progress of an element through the viewport: 0 as its top enters the bottom edge, 1 as its bottom leaves the top
  const travel = (el) => { const r = el.getBoundingClientRect(), H = innerHeight; return clamp((H - r.top) / (H + r.height), 0, 1); };

  function runWhenVisible(el, tick) {
    let raf = 0, on = false, last = 0;
    const loop = (now) => { if (!on) { raf = 0; return; } tick(now, Math.min(64, now - (last || now))); last = now; raf = requestAnimationFrame(loop); };
    new IntersectionObserver((es) => es.forEach((e) => { on = e.isIntersecting; if (on && !raf) { last = 0; raf = requestAnimationFrame(loop); } }), {rootMargin: '15% 0px'}).observe(el);
  }

  /* ── 1. THE BUILD STACK ── */
  document.querySelectorAll('[data-stack]').forEach((root) => {
    const cam = root.querySelector('.stack3d__cam'), world = root.querySelector('.stack3d__world'), deck = root.querySelector('.stack3d__deck');
    const slabs = [...root.querySelectorAll('.stack3d__slab')], beam = root.querySelector('.stack3d__beam');
    const lDeck = root.querySelector('.stack3d__label--deck'), lTop = root.querySelector('.stack3d__label--top'), steps = [...root.querySelectorAll('.stack3d__steps span')];
    const T = 22, GAP = 34; let p = 0;
    const draw = (now) => {
      const target = smooth(0.12, 0.62, travel(root));
      p = CALM ? target : p + (target - p) * 0.08;
      const drift = CALM ? 0 : Math.sin(now / 4200) * 7;
      cam.style.transform = `scale(${(0.86 + 0.14 * p).toFixed(4)}) translateY(${(18 - 30 * p).toFixed(1)}px)`;
      world.style.transform = `rotateX(${(62 - 6 * p).toFixed(2)}deg) rotateZ(${(-40 + drift).toFixed(2)}deg)`;
      deck.style.transform = `translateZ(0) scale(${(1 - 0.08 * p).toFixed(3)})`;
      deck.style.opacity = (1 - 0.55 * smooth(0.15, 0.5, p)).toFixed(3);
      let lit = 0;
      slabs.forEach((s, i) => {
        const a = smooth(0.1 + i * 0.18, 0.32 + i * 0.18, p), bob = CALM ? 0 : Math.sin(now / 1300 + i) * 2.2 * a;
        s.style.transform = `translateZ(${(8 + (i * GAP + 26) * a + bob).toFixed(1)}px) scale(${(0.6 + 0.4 * a).toFixed(3)})`;
        s.style.opacity = a.toFixed(3); if (a > 0.6) lit = i + 1;
      });
      const b = smooth(0.82, 0.98, p);
      beam.style.transform = `translateZ(${(26 + 4 * GAP + T + 4).toFixed(0)}px) scaleZ(${b.toFixed(3)})`; beam.style.opacity = b.toFixed(3);
      lDeck.style.opacity = (1 - 0.5 * smooth(0.3, 0.6, p)).toFixed(3);
      lTop.style.opacity = b.toFixed(3); lTop.style.transform = `translateY(${(10 - 10 * b).toFixed(1)}px)`;
      steps.forEach((s, i) => s.classList.toggle('is-on', i < lit));
    };
    if (CALM) { addEventListener('scroll', () => draw(0), {passive: true}); draw(0); } else runWhenVisible(root, draw);
  });

  /* ── 2. THE TUNNEL ── */
  document.querySelectorAll('[data-tunnel]').forEach((root) => {
    const view = root.querySelector('.tunnel__view'), world = root.querySelector('.tunnel__world'), core = root.querySelector('.tunnel__core');
    const hint = root.querySelector('.tunnel__hint'), layers = [...root.querySelectorAll('.tunnel__layer')];
    const rings = [...root.querySelectorAll('.tunnel__ring')].map((el, i) => ({
      el, i, z: -i * 520, circle: el.querySelector('.tunnel__circle'), name: el.querySelector('.tunnel__name'),
      chips: [...el.querySelectorAll('.tunnel__chip')].map((c) => ({c, w: 0, h: 0})), spin: (i % 2 ? -1 : 1) * (0.006 + i * 0.002)
    }));
    const CORE_Z = -1560; let p = 0, R = 220;
    const size = () => {
      R = clamp(Math.min(view.clientWidth * 0.29, view.clientHeight * 0.36), 105, 215);
      rings.forEach((g) => { const d = R * 2; Object.assign(g.circle.style, {width: d + 'px', height: d + 'px', left: -R + 'px', top: -R + 'px'}); g.chips.forEach((k) => { k.w = k.c.offsetWidth; k.h = k.c.offsetHeight; }); });
    };
    size(); addEventListener('resize', size, {passive: true});
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(size);
    const draw = (now) => {
      const target = smooth(0.18, 0.78, travel(root));
      p = CALM ? target : p + (target - p) * 0.07;
      const camZ = p * 1360;
      world.style.transform = `translateZ(${camZ.toFixed(1)}px)`;
      let focus = 0;
      rings.forEach((g) => {
        const rel = g.z + camZ; // 0 = at the screen plane; positive = flying past the viewer
        const op = rel > 0 ? clamp(1 - rel / 200, 0, 1) : clamp(1 + rel / 1900, 0.25, 1);
        g.el.style.opacity = op.toFixed(3); g.el.style.visibility = op < 0.02 ? 'hidden' : 'visible';
        g.el.style.transform = `translateZ(${g.z}px)`;
        if (rel > -700 && rel < 260) focus = g.i;
        const turn = CALM ? 0 : now * g.spin * 0.001 * 6;
        g.chips.forEach((k, j) => {
          const a = turn + (j / g.chips.length) * Math.PI * 2 - Math.PI / 2 + g.i * 0.5;
          k.c.style.transform = `translate(${(Math.cos(a) * R - k.w / 2).toFixed(1)}px, ${(Math.sin(a) * R - k.h / 2).toFixed(1)}px)`;
        });
        g.name.style.transform = `translate(-50%, ${(-R - 34).toFixed(0)}px)`;
      });
      const cr = CORE_Z + camZ;
      core.style.transform = `translateZ(${CORE_Z}px) scale(${(1 + 0.6 * smooth(0.7, 1, p)).toFixed(3)})`;
      core.style.opacity = clamp(0.35 + (cr + 1560) / 1560, 0.35, 1).toFixed(3);
      if (p > 0.86) focus = 3;
      layers.forEach((l, i) => l.classList.toggle('is-on', i === Math.min(focus, layers.length - 1) || (focus === 3 && i === layers.length - 1)));
      if (hint) hint.style.opacity = (1 - smooth(0.05, 0.25, p)).toFixed(2);
    };
    if (CALM) { addEventListener('scroll', () => draw(0), {passive: true}); draw(0); } else runWhenVisible(root, draw);
  });
})();
