/* ============================================
   BRENICKS — THE ATELIER
   Generative plates, scroll / hover / click motion,
   coffee-cup reading meter, scheduled publishing.
   ============================================ */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  // ---------- schedule (dates are US Eastern) ----------
  function liveAt(d) { return Date.parse(d + 'T00:00:00-05:00'); }
  function isLive(d) { return !d || Date.now() >= liveAt(d); }
  function niceDate(d) {
    var dt = new Date(liveAt(d) + 6 * 3600e3);
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  }

  // ---------- seeded random ----------
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function el(tag, attrs, parent) {
    var n = tag.indexOf('svg:') === 0 ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // ---------- toast ----------
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', { class: 'at-toast', role: 'status', 'aria-live': 'polite' }, document.body); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }

  // ============ ART BUILDERS ============
  // each returns { update(p, t, mx, my) , hover(on), click() }
  var ART = {};

  ART.escher = function (box) {
    box.classList.add('art--escher');
    var svg = el('svg:svg', { viewBox: '0 0 400 400', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid slice' }, box);
    var s = 34, w = s * Math.cos(Math.PI / 6);
    for (var row = -1; row < 12; row++) {
      for (var col = -1; col < 12; col++) {
        var cx = col * 2 * w + (row % 2 ? w : 0), cy = row * 1.5 * s;
        var top = [cx, cy - s, cx + w, cy - s / 2, cx, cy, cx - w, cy - s / 2];
        var left = [cx - w, cy - s / 2, cx, cy, cx, cy + s, cx - w, cy + s / 2];
        var right = [cx, cy, cx + w, cy - s / 2, cx + w, cy + s / 2, cx, cy + s];
        el('svg:polygon', { points: top.join(' '), class: 'ft' }, svg);
        el('svg:polygon', { points: left.join(' '), class: 'fl' }, svg);
        el('svg:polygon', { points: right.join(' '), class: 'fr' }, svg);
      }
    }
    var hov = false, last = null, manual = false;
    return {
      update: function (p) { var f = (p > 0.55) !== hov !== manual; if (f !== last) { box.classList.toggle('flip', f); last = f; } },
      hover: function (on) { hov = on; last = null; },
      click: function () { manual = !manual; last = null; }
    };
  };

  ART.bauhaus = function (box) {
    box.classList.add('art--bauhaus');
    var names = ['c', 's', 't', 'bar', 'bar', 'ring'];
    var parts = names.map(function (n) { return el('div', { class: 'bh bh--' + n }, box); });
    // [left, top, width, height, rotate] in %
    var layouts = [
      [[52, 14, 34, 34, 0], [12, 50, 30, 30, 0], [44, 52, 38, 34, 0], [8, 22, 60, 3, 0], [30, 8, 3, 84, 0], [18, 14, 22, 22, 0]],
      [[10, 10, 46, 46, 0], [58, 56, 28, 28, 18], [52, 12, 32, 30, 180], [6, 74, 88, 3, -12], [70, 6, 3, 60, 0], [56, 58, 34, 34, 0]],
      [[34, 34, 32, 32, 0], [8, 8, 22, 22, 45], [64, 62, 28, 28, 90], [0, 50, 100, 2, 0], [50, 0, 2, 100, 0], [20, 20, 60, 60, 0]],
      [[60, 50, 30, 30, 0], [14, 14, 40, 40, -8], [16, 60, 30, 28, 0], [10, 40, 80, 4, 30], [58, 12, 3, 40, 0], [62, 52, 26, 26, 0]]
    ];
    var i = 0;
    function apply() {
      var L = layouts[i % layouts.length];
      parts.forEach(function (n, k) { var v = L[k]; n.style.left = v[0] + '%'; n.style.top = v[1] + '%'; n.style.width = v[2] + '%'; n.style.height = v[3] + '%'; n.style.transform = 'rotate(' + v[4] + 'deg)'; });
    }
    apply();
    return {
      update: function (p) { box.style.transform = 'rotate(' + ((p - 0.5) * 6) + 'deg) scale(1.02)'; },
      hover: function (on) { if (on) { i++; apply(); } },
      click: function () { i++; apply(); }
    };
  };

  var actx;
  function tone(freq, color) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = color === '#E8B21C' ? 'triangle' : color === '#1F4FA0' ? 'sine' : 'square';
      o.frequency.value = freq; g.gain.value = 0.0001;
      o.connect(g); g.connect(actx.destination);
      var t = actx.currentTime; g.gain.exponentialRampToValueAtTime(color === '#C8321E' ? 0.05 : 0.14, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.start(t); o.stop(t + 1.5);
    } catch (e) { /* audio unavailable */ }
  }
  ART.kandinsky = function (box, opts) {
    box.classList.add('art--kandinsky');
    var r = rng(11), cols = ['#E8B21C', '#C8321E', '#1F4FA0', '#F7F5F0', '#2E8B6E', '#8E3B8F'];
    var scale = [196, 220, 247, 262, 294, 330, 349, 392, 440, 494];
    for (var j = 0; j < 7; j++) {
      var ln = el('div', { class: 'kd-line' }, box);
      ln.style.left = (r() * 70 + 5) + '%'; ln.style.top = (r() * 80 + 10) + '%'; ln.style.width = (r() * 40 + 20) + '%';
      ln.style.transform = 'rotate(' + (r() * 180 - 90) + 'deg)';
    }
    var circles = [];
    for (var k = 0; k < 13; k++) {
      var size = 6 + r() * 24, c = cols[k % cols.length];
      var b = el(opts && opts.interactive ? 'button' : 'span', { class: 'kd', 'aria-label': 'Play a note' }, box);
      if (b.tagName === 'BUTTON') b.type = 'button';
      b.style.width = size + '%'; b.style.aspectRatio = '1'; b.style.left = (r() * (96 - size) + 2) + '%'; b.style.top = (r() * (92 - size) + 4) + '%';
      b.style.background = 'radial-gradient(circle at 35% 35%, ' + c + ', ' + c + 'CC 60%, ' + c + '55)';
      b.style.color = c;
      var f = scale[Math.floor((1 - size / 30) * (scale.length - 1))];
      (function (b, f, c) {
        b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); tone(f, c); b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); });
      })(b, f, c);
      circles.push({ b: b, ph: r() * 6.28 });
    }
    if (opts && opts.interactive) { var h = el('span', { class: 'art-hint' }, box); h.textContent = 'TAP A CIRCLE · HEAR IT'; }
    return {
      update: function (p, t) { if (RM) return; circles.forEach(function (o, n) { o.b.style.translate = (Math.sin(t / 1400 + o.ph) * 6) + 'px ' + (Math.cos(t / 1700 + o.ph) * 6 + (p - .5) * (n % 3 - 1) * 40) + 'px'; }); }
    };
  };

  ART.basquiat = function (box) {
    box.classList.add('art--basquiat');
    var words = [['Call for a quote', 8, 10], ['Fax us', 54, 22], ['Spreadsheet', 10, 36], ['Paper ticket', 46, 50], ['Wait 3 days', 12, 64]];
    var items = words.map(function (w) {
      var d = el('div', { class: 'bq-word' }, box); d.textContent = w[0];
      d.style.left = w[1] + '%'; d.style.top = w[2] + '%'; d.style.transform = 'rotate(' + ((w[1] % 7) - 3) + 'deg)';
      var s = el('svg:svg', { viewBox: '0 0 100 30', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, d);
      el('svg:path', { d: 'M2 18 C 20 8, 35 26, 52 14 S 82 8, 98 16', pathLength: '400' }, s);
      return d;
    });
    var keep = el('div', { class: 'bq-word bq-keep' }, box); keep.textContent = 'Quoted in minutes';
    keep.style.left = '30%'; keep.style.top = '84%';
    var cr = el('svg:svg', { class: 'bq-crown', viewBox: '0 0 120 60', 'aria-hidden': 'true' }, box);
    cr.style.position = 'absolute'; cr.style.left = '40%'; cr.style.top = '72%'; cr.style.width = '22%';
    el('svg:path', { d: 'M8 54 L14 14 L36 38 L60 6 L84 38 L106 14 L112 54 Z M8 54 L112 54', pathLength: '600' }, cr);
    var boost = 0;
    return {
      update: function (p) {
        var q = clamp(p * 1.5 - 0.15 + boost, 0, 1.6);
        items.forEach(function (d, i) { d.style.setProperty('--k', clamp(q * 1.8 - i * 0.22, 0, 1)); });
        box.style.setProperty('--p2', clamp(q * 1.6 - 1, 0, 1));
      },
      hover: function (on) { boost = on ? 0.6 : 0; },
      click: function () { boost = boost ? 0 : 1; }
    };
  };

  ART.giger = function (box) {
    box.classList.add('art--giger');
    var N = 18, rings = [];
    for (var i = 0; i < N; i++) { var g = el('div', { class: 'gg' }, box); g.style.width = '62%'; g.style.height = '74%'; rings.push(g); }
    var speed = 0, gx = 50, gy = 50, tx = 50, ty = 50;
    return {
      update: function (p, t, mx, my) {
        tx = 50 + (mx || 0) * 18; ty = 50 + (my || 0) * 18; gx += (tx - gx) * .08; gy += (ty - gy) * .08;
        box.style.setProperty('--gx', gx + '%'); box.style.setProperty('--gy', gy + '%');
        var base = p * 1.4 + (RM ? 0 : t / 14000) * (1 + speed);
        rings.forEach(function (g, i) {
          var d = ((i / N + base) % 1 + 1) % 1, z = Math.pow(d, 2.4) * 3.2 + .04;
          g.style.setProperty('--z', z.toFixed(3)); g.style.setProperty('--o', (d < .08 ? d / .08 : d > .85 ? (1 - d) / .15 : 1).toFixed(2));
          g.style.setProperty('--rot', (i * 9 + p * 40) + 'deg');
        });
      },
      hover: function (on) { speed = on ? 3 : 0; },
      click: function () { speed = speed ? 0 : 6; }
    };
  };

  var aid = 0;
  ART.arsham = function (box) {
    box.classList.add('art--arsham');
    var id = 'ar' + (++aid);
    var svg = el('svg:svg', { viewBox: '0 0 400 400', 'aria-hidden': 'true' }, box);
    var defs = el('svg:defs', {}, svg), mask = el('svg:mask', { id: id }, defs);
    el('svg:rect', { width: 400, height: 400, fill: '#fff' }, mask);
    var r = rng(7), holes = [];
    for (var i = 0; i < 70; i++) { var c = el('svg:circle', { cx: 40 + r() * 320, cy: 140 + r() * 130, r: 0, fill: '#000' }, mask); holes.push({ c: c, max: 4 + r() * 22, at: r() }); }
    var g = el('svg:g', { mask: 'url(#' + id + ')' }, svg);
    var tx = el('svg:text', { x: 200, y: 262, 'text-anchor': 'middle', 'font-size': 170, fill: '#ECEAE4' }, g); tx.textContent = 'FAX';
    var tx2 = el('svg:text', { x: 200, y: 262, 'text-anchor': 'middle', 'font-size': 170, fill: 'none', stroke: '#BDB8AC', 'stroke-width': 1.5 }, g); tx2.textContent = 'FAX';
    var cap = el('svg:text', { x: 200, y: 330, 'text-anchor': 'middle', 'font-size': 14, fill: '#ECEAE4', 'letter-spacing': 6, style: 'font-family:var(--at-mono)' }, svg); cap.textContent = 'EXCAVATED · 2040';
    var extra = 0;
    return {
      update: function (p) {
        var q = clamp(p * 1.4 - .1 + extra, 0, 1.3);
        holes.forEach(function (h) { h.c.setAttribute('r', (clamp((q - h.at * .7) * 2.2, 0, 1) * h.max).toFixed(1)); });
      },
      hover: function (on) { extra = on ? .5 : 0; },
      click: function () { extra = extra >= .9 ? 0 : 1; }
    };
  };

  function gearPath(R, n, depth) {
    var d = '', step = Math.PI * 2 / n;
    for (var i = 0; i < n; i++) {
      var a = i * step, pts = [[R, a], [R + depth, a + step * .18], [R + depth, a + step * .46], [R, a + step * .64], [R, a + step]];
      pts.forEach(function (q, k) { var x = Math.cos(q[1]) * q[0], y = Math.sin(q[1]) * q[0]; d += (i === 0 && k === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1); });
    }
    return d + 'Z M ' + (R * .32) + ' 0 A ' + (R * .32) + ' ' + (R * .32) + ' 0 1 0 ' + (-R * .32) + ' 0 A ' + (R * .32) + ' ' + (R * .32) + ' 0 1 0 ' + (R * .32) + ' 0Z';
  }
  ART.house = function (box) {
    box.classList.add('art--house');
    var svg = el('svg:svg', { viewBox: '0 0 400 400', 'aria-hidden': 'true' }, box);
    var gu = el('svg:g', { class: 'guil' }, svg);
    for (var i = 0; i < 46; i++) el('svg:circle', { cx: 200 + Math.cos(i * .9) * 7, cy: 200 + Math.sin(i * .9) * 7, r: 14 + i * 4 }, gu);
    var specs = [[200, 200, 92, 24, '#A88447'], [318, 112, 52, 14, '#C9A86A'], [96, 314, 62, 16, '#6E5428']];
    var gears = specs.map(function (s) {
      var g = el('svg:g', { transform: 'translate(' + s[0] + ' ' + s[1] + ')' }, svg);
      var p = el('svg:path', { d: gearPath(s[2], s[3], 12), fill: s[4], 'fill-rule': 'evenodd', class: 'gear', opacity: .92 }, g);
      return { p: p, ratio: 24 / s[3] };
    });
    var hand = el('svg:line', { x1: 200, y1: 200, x2: 200, y2: 70, stroke: '#F7F5F0', 'stroke-width': 2, 'stroke-linecap': 'round' }, svg);
    el('svg:circle', { cx: 200, cy: 200, r: 6, fill: '#F7F5F0' }, svg);
    var boost = 1;
    return {
      update: function (p, t) {
        var a = p * 540 + (RM ? 0 : t / 60) * boost;
        gears.forEach(function (g, i) { g.p.setAttribute('transform', 'rotate(' + ((i % 2 ? -1 : 1) * a * g.ratio).toFixed(2) + ')'); });
        var sec = RM ? 0 : Math.floor(t / 1000) % 60;
        hand.setAttribute('transform', 'rotate(' + (sec * 6) + ' 200 200)');
      },
      hover: function (on) { boost = on ? 6 : 1; },
      click: function () { boost = boost > 1 ? 1 : 12; }
    };
  };

  // ============ RUNTIME ============
  var arts = [];
  function mount(holder, opts) {
    var type = holder.getAttribute('data-art');
    if (!ART[type]) return;
    var box = el('div', { class: 'art' }, holder);
    var api = ART[type](box, opts || {}) || {};
    var rec = { holder: holder, api: api, p: .5, mx: 0, my: 0, vis: false, fixedP: null };
    if (FINE) {
      holder.addEventListener('pointermove', function (e) { var b = holder.getBoundingClientRect(); rec.mx = (e.clientX - b.left) / b.width * 2 - 1; rec.my = (e.clientY - b.top) / b.height * 2 - 1; holder.style.setProperty('--mx', rec.mx.toFixed(3)); });
      holder.addEventListener('pointerleave', function () { rec.mx = rec.my = 0; holder.style.setProperty('--mx', 0); });
    }
    holder.addEventListener('pointerenter', function () { api.hover && api.hover(true); });
    holder.addEventListener('pointerleave', function () { api.hover && api.hover(false); });
    arts.push(rec);
    return rec;
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { var r = arts.filter(function (a) { return a.holder === e.target; })[0]; if (r) r.vis = e.isIntersecting; if (e.isIntersecting && e.target.classList.contains('at-reveal')) e.target.classList.add('in'); });
  }, { rootMargin: '10% 0px' }) : null;

  function frame(t) {
    var vh = window.innerHeight;
    arts.forEach(function (a) {
      if (!a.vis) return;
      var p = a.fixedP;
      if (p === null) { var b = a.holder.getBoundingClientRect(); p = clamp(1 - (b.top + b.height / 2) / (vh + b.height) - 0 + .0, 0, 1); p = clamp((vh - b.top) / (vh + b.height), 0, 1); a.holder.style.setProperty('--p', p.toFixed(3)); a.holder.style.setProperty('--vis', clamp(1 - Math.abs(p - .5) * 2.2, 0, 1).toFixed(3)); }
      a.api.update && a.api.update(p, t, a.mx, a.my);
    });
    hooks.forEach(function (h) { h(t); });
    requestAnimationFrame(frame);
  }
  var hooks = [];

  // ---------- cursor ----------
  function cursor() {
    if (!FINE || RM || !document.body.classList.contains('at-body')) return;
    var c = el('div', { class: 'at-cursor', 'aria-hidden': 'true' }, document.body), lab = el('span', { class: 'at-cursor__label' }, c);
    var x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; c.classList.add('on'); var t = e.target.closest && e.target.closest('[data-cursor]'); c.classList.toggle('big', !!t); if (t) lab.textContent = t.getAttribute('data-cursor'); });
    document.addEventListener('pointerleave', function () { c.classList.remove('on'); });
    hooks.push(function () { cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; });
  }

  // ---------- page transitions ----------
  var crossDocVT = 'onpagereveal' in window;
  var shutter = el('div', { class: 'at-shutter', 'aria-hidden': 'true' }, document.body);
  if (sessionStorage.getItem('at-shut') === '1') {
    sessionStorage.removeItem('at-shut');
    document.documentElement.classList.add('at-arrive');
    requestAnimationFrame(function () { requestAnimationFrame(function () { document.documentElement.classList.remove('at-arrive'); shutter.style.transform = 'scaleY(0)'; shutter.style.transformOrigin = 'top'; setTimeout(function () { shutter.removeAttribute('style'); }, 500); }); });
  }
  function go(href) {
    if (crossDocVT || RM) { location.href = href; return; }
    sessionStorage.setItem('at-shut', '1');
    document.documentElement.classList.add('at-leaving');
    setTimeout(function () { location.href = href; }, 430);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-at-link]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var plate = a.closest('[data-date]');
    if (plate && !isLive(plate.getAttribute('data-date'))) {
      e.preventDefault();
      (plate.querySelector('.at-plate__art') || plate).classList.remove('at-wobble'); void plate.offsetWidth;
      (plate.querySelector('.at-plate__art') || plate).classList.add('at-wobble');
      toast('Plate ' + plate.getAttribute('data-n') + ' opens ' + niceDate(plate.getAttribute('data-date')) + '. The Scribe is still polishing it.');
      return;
    }
    e.preventDefault(); go(a.href);
  });


  // ---------- tilt (phones and tablets) ----------
  var COARSE = window.matchMedia('(pointer: coarse)').matches;
  var tilt = { on: false, x: 0, y: 0, sx: 0, sy: 0 };
  function onTilt(e) {
    if (e.gamma == null) return;
    var a = (screen.orientation && screen.orientation.angle) || window.orientation || 0, g = e.gamma, b = e.beta, x, y;
    if (a === 90) { x = b; y = -g - 45; } else if (a === -90 || a === 270) { x = -b; y = g - 45; } else { x = g; y = b - 45; }
    tilt.x = clamp(x / 28, -1, 1); tilt.y = clamp(y / 28, -1, 1); tilt.on = true;
  }
  function startTilt() { addEventListener('deviceorientation', onTilt); document.querySelectorAll('.at-tilt').forEach(function (b) { b.classList.remove('show'); }); }
  function setupTilt(where) {
    if (!COARSE || RM || !('DeviceOrientationEvent' in window)) return;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      (where || []).forEach(function (host) {
        if (!host) return;
        var b = el('button', { type: 'button', class: 'at-tilt show' }, host);
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5" transform="rotate(-14 12 12)"/><path d="M3 9a9 9 0 0 1 3-4M21 15a9 9 0 0 1-3 4"/></svg>TILT YOUR PHONE';
        b.addEventListener('click', function () {
          DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') { startTilt(); toast('Tilt away.'); } else toast('Motion access was declined. Settings can turn it back on.'); }).catch(function () {});
        });
      });
    } else startTilt();
    hooks.push(function () {
      if (!tilt.on) return;
      tilt.sx += (tilt.x - tilt.sx) * .12; tilt.sy += (tilt.y - tilt.sy) * .12;
      arts.forEach(function (a) { a.mx = tilt.sx; a.my = tilt.sy; a.holder.style.setProperty('--mx', tilt.sx.toFixed(3)); });
      tiltHooks.forEach(function (h) { h(tilt.sx, tilt.sy); });
    });
  }
  var tiltHooks = [];


  // ---------- hero background: a new mathematical drawing on every visit ----------
  function heroArt(svg) {
    var seed = Math.floor(Math.random() * 1e6), r = rng(seed), C = 500, TAU = Math.PI * 2;
    function poly(pts, extra) { var d = 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L'); return el('svg:path', Object.assign({ d: d, class: 'af' }, extra || {}), svg); }
    var kinds = [
      ['Harmonograph', function () {
        var f = [2 + Math.floor(r() * 3), 3 + Math.floor(r() * 3), 2 + Math.floor(r() * 3), 3 + Math.floor(r() * 3)].map(function (v) { return v + (r() - .5) * .02; });
        var p = [r() * TAU, r() * TAU, r() * TAU, r() * TAU], d = .0016 + r() * .0012, pts = [];
        for (var t = 0; t < 900; t += .1) { var e = Math.exp(-d * t * 6); pts.push([C + 430 * e * (Math.sin(f[0] * t + p[0]) * .6 + Math.sin(f[1] * t + p[1]) * .4), C + 430 * e * (Math.sin(f[2] * t + p[2]) * .6 + Math.sin(f[3] * t + p[3]) * .4)]); }
        poly(pts);
      }],
      ['Spirograph', function () {
        var R = 300, k = 3 + Math.floor(r() * 9), rr = R * (k - 1) / k * (.35 + r() * .5), dd = rr * (.6 + r() * .9), pts = [];
        var g = function (a, b) { return b ? g(b, a % b) : a; }, turns = rr / g(Math.round(R), Math.round(rr)) || 20;
        for (var t = 0; t < TAU * Math.min(turns, 40); t += .012) pts.push([C + (R - rr) * Math.cos(t) + dd * Math.cos((R - rr) / rr * t), C + (R - rr) * Math.sin(t) - dd * Math.sin((R - rr) / rr * t)]);
        poly(pts);
      }],
      ['Rose curve', function () {
        var n = 2 + Math.floor(r() * 7), dd = 1 + Math.floor(r() * 8), k = n / dd, layers = 3 + Math.floor(r() * 4);
        for (var L = 0; L < layers; L++) { var pts = [], A = 460 - L * 70, rot = L * r(); for (var t = 0; t < TAU * dd; t += .006) { var rad = A * Math.cos(k * t); pts.push([C + rad * Math.cos(t + rot), C + rad * Math.sin(t + rot)]); } poly(pts); }
      }],
      ['Phyllotaxis', function () {
        var ga = Math.PI * (3 - Math.sqrt(5)) + (r() - .5) * .02, c = 10 + r() * 6, n = 900;
        for (var i = 1; i < n; i++) { var a = i * ga, rad = c * Math.sqrt(i); el('svg:circle', { cx: (C + rad * Math.cos(a)).toFixed(1), cy: (C + rad * Math.sin(a)).toFixed(1), r: (1 + i / n * 5).toFixed(2), class: 'ad' }, svg); }
      }],
      ['String star', function () {
        var n = 120 + Math.floor(r() * 120), m = 2 + Math.floor(r() * 60), pts = [];
        for (var i = 0; i < n; i++) { var a = i / n * TAU, b = (i * m) % n / n * TAU; el('svg:line', { x1: C + 470 * Math.cos(a), y1: C + 470 * Math.sin(a), x2: C + 470 * Math.cos(b), y2: C + 470 * Math.sin(b), class: 'af' }, svg); }
      }],
      ['Lissajous lattice', function () {
        var a = 1 + Math.floor(r() * 6), b = a + 1 + Math.floor(r() * 5), layers = 6;
        for (var L = 0; L < layers; L++) { var pts = [], ph = L * Math.PI / layers + r(); for (var t = 0; t <= TAU + .01; t += .004) pts.push([C + 470 * Math.sin(a * t + ph), C + 470 * Math.sin(b * t)]); poly(pts); }
      }]
    ];
    var pick = kinds[Math.floor(Math.random() * kinds.length)];
    pick[1]();
    return 'TODAY’S DRAWING · ' + pick[0].toUpperCase() + ' · NO. ' + seed;
  }

  // ---------- INDEX ----------
  function index() {
    var hero = document.querySelector('.at-hero');
    var title = document.querySelector('.at-hero__title');
    if (title && !RM) {
      var chars = [].slice.call(title.querySelectorAll('.ch'));
      addEventListener('pointermove', function (e) {
        chars.forEach(function (c) {
          var b = c.getBoundingClientRect(), dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2), d = Math.hypot(dx, dy), f = clamp(1 - d / 380, 0, 1);
          c.style.setProperty('--dx', (-dx * f * .12).toFixed(1) + 'px'); c.style.setProperty('--dy', (-dy * f * .18).toFixed(1) + 'px'); c.style.setProperty('--r', (dx * f * .03).toFixed(1) + 'deg');
        });
      }, { passive: true });
    }
    if (title) {
      var tch = [].slice.call(title.querySelectorAll('.ch')), r0 = rng(5), depth = tch.map(function () { return .35 + r0() * .65; });
      tiltHooks.push(function (x, y) { tch.forEach(function (c, i) { var d = depth[i]; c.style.setProperty('--dx', (x * 26 * d).toFixed(1) + 'px'); c.style.setProperty('--dy', (y * 20 * d).toFixed(1) + 'px'); c.style.setProperty('--r', (x * 6 * d * (i % 2 ? -1 : 1)).toFixed(1) + 'deg'); }); });
    }
    var field = document.querySelector('.at-hero__field');
    if (field) {
      var label = heroArt(field);
      var cap = el('div', { class: 'at-hero__variant', 'aria-hidden': 'true' }, hero); cap.textContent = label;
      hooks.push(function () { var s = clamp(scrollY / (hero.offsetHeight || 1), 0, 1); hero.style.setProperty('--s', s.toFixed(3)); });
      tiltHooks.push(function (x, y) { field.style.translate = (x * 30).toFixed(1) + 'px ' + (y * 30).toFixed(1) + 'px'; });
    }
    setupTilt([document.querySelector('.at-hero__inner')]);
    document.querySelectorAll('.at-plate').forEach(function (pl) {
      var art = pl.querySelector('.at-plate__art'), rec = mount(art);
      var live = isLive(pl.getAttribute('data-date'));
      pl.classList.toggle('is-sealed', !live);
      art.setAttribute('data-cursor', live ? 'READ' : 'SEALED');
      if (!live) {
        var seal = pl.querySelector('.at-seal__when'); if (seal) seal.textContent = new Date(liveAt(pl.getAttribute('data-date')) + 6 * 3600e3).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' }).replace(',', '');
      }
      io && io.observe(art); io && pl.querySelectorAll('.at-reveal').forEach(function (n) { io.observe(n); });
      if (!io) { rec.vis = true; pl.querySelectorAll('.at-reveal').forEach(function (n) { n.classList.add('in'); }); }
    });
    document.querySelectorAll('.at-cal__d').forEach(function (d) { d.classList.toggle('live', isLive(d.getAttribute('data-date'))); });
    var count = document.querySelector('[data-live-count]');
    if (count) count.textContent = document.querySelectorAll('.at-plate:not(.is-sealed)').length;
  }

  // ---------- POST ----------
  function post() {
    var body = document.body, date = body.getAttribute('data-date');
    var heroArt = document.querySelector('.at-post-hero__art');
    var rec = mount(heroArt, { interactive: true });
    if (rec) rec.vis = true;
    heroArt.addEventListener('click', function () { rec.api.click && rec.api.click(); });
    var hero = document.querySelector('.at-post-hero');
    hooks.push(function () { var s = clamp(scrollY / (hero.offsetHeight || 1), 0, 1); hero.style.setProperty('--s', s.toFixed(3)); if (rec) rec.fixedP = .35 + s * .65; });
    // split title
    var t = document.querySelector('.at-post-hero__title');
    if (t && !RM) { var txt = t.textContent, n = 0; t.textContent = ''; t.classList.add('at-split'); t.setAttribute('aria-label', txt); txt.split(' ').forEach(function (w, wi) { var ws = el('span', { 'aria-hidden': 'true', style: 'display:inline-block;white-space:nowrap' }, t); w.split('').forEach(function (ch) { var s = el('span', { class: 'ch' }, ws); s.textContent = ch; s.style.setProperty('--i', n++); }); if (wi < txt.split(' ').length - 1) t.appendChild(document.createTextNode(' ')); }); }
    var copy = document.querySelector('.at-post-hero__copy');
    tiltHooks.push(function (x, y) { if (t) t.style.transform = 'translate3d(' + (x * 14).toFixed(1) + 'px,' + (y * 10).toFixed(1) + 'px,0) rotate(' + (x * -1.2).toFixed(2) + 'deg)'; });
    setupTilt([copy]);
    if (!isLive(date)) {
      body.classList.add('at-post-sealed');
      var w = document.querySelector('.at-post-seal b'); if (w) w.textContent = niceDate(date);
      return;
    }
    // sips + pull quotes
    var sips = [].slice.call(document.querySelectorAll('.at-sip')), pulls = [].slice.call(document.querySelectorAll('.at-pull'));
    var art = document.querySelector('.at-article'), cup = document.querySelector('.at-cup'), liquid = document.querySelector('.at-cup__liquid'), label = document.querySelector('.at-cup__label');
    var said = 0, sayT;
    function say(msg) { label.textContent = msg; cup.classList.add('say', 'pulse'); clearTimeout(sayT); sayT = setTimeout(function () { cup.classList.remove('say', 'pulse'); }, 2200); }
    hooks.push(function () {
      var vh = innerHeight;
      sips.forEach(function (s) { var b = s.getBoundingClientRect(); s.style.setProperty('--k', clamp((vh - b.top) / (vh * .5), 0, 1).toFixed(3)); });
      pulls.forEach(function (s) { var b = s.getBoundingClientRect(); s.style.setProperty('--k', clamp((vh * .9 - b.top) / (vh * .55), 0, 1).toFixed(3)); });
      var ab = art.getBoundingClientRect(), prog = clamp((vh * .6 - ab.top) / ab.height, 0, 1);
      cup.classList.toggle('on', ab.top < vh * .7 && prog < 1.05);
      liquid.setAttribute('y', (12 + prog * 18).toFixed(2)); liquid.setAttribute('height', (18 - prog * 18).toFixed(2));
      var stage = prog > .97 ? 4 : prog > .66 ? 3 : prog > .33 ? 2 : prog > .02 ? 1 : 0;
      if (stage > said) { said = stage; say(['', 'Sip one', 'Sip two', 'Sip three', 'Cup empty. Thanks for reading.'][stage]); }
    });
    var nx = document.querySelector('.at-next[data-art]');
    if (nx) {
      var nr = mount(nx); io ? io.observe(nx) : (nr.vis = true);
      var nd = nx.getAttribute('data-date');
      if (nd && !isLive(nd)) { nx.querySelector('.at-next__cap small').textContent = 'NEXT PLATE · OPENS ' + niceDate(nd).toUpperCase(); nx.setAttribute('data-cursor', 'SEALED'); nx.querySelector('.art').style.filter = 'blur(10px) brightness(.7)'; nx.addEventListener('click', function (e) { e.preventDefault(); toast('The next plate opens ' + niceDate(nd) + '.'); }); nx.removeAttribute('data-at-link'); }
    }
  }

  // ---------- INSIGHTS BAND ----------
  function band() { document.querySelectorAll('[data-art]:not(.at-plate__art):not(.at-post-hero__art):not(.at-next)').forEach(function (h) { var r = mount(h); io ? io.observe(h) : (r.vis = true); }); }

  cursor();
  if (document.body.classList.contains('at-index')) index();
  else if (document.body.classList.contains('at-post')) post();
  band();
  requestAnimationFrame(frame);
})();
