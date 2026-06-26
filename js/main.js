/* ============================================
   BRENICKS — MAIN JS
   ============================================ */
(function () {
  'use strict';

  // ── THEME ──────────────────────────────────
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const stored = localStorage.getItem('brenicks-theme');
  const setTheme = (t) => { html.setAttribute('data-theme', t); localStorage.setItem('brenicks-theme', t); };
  if (stored) setTheme(stored);
  else setTheme('dark');
  themeBtn?.addEventListener('click', () => setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  // ── NAV SCROLL ─────────────────────────────
  const nav = document.getElementById('nav');
  const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 48);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── MOBILE BURGER ──────────────────────────
  const burger = document.getElementById('navBurger');
  const mobileNav = document.getElementById('navMobile');

  function openMenu() {
    mobileNav?.classList.add('open');
    nav?.classList.add('menu-open');
    burger?.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    mobileNav?.classList.remove('open');
    nav?.classList.remove('menu-open');
    burger?.setAttribute('aria-expanded', 'false');
  }

  burger?.addEventListener('click', () => {
    mobileNav?.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close smoothly when scrolling starts
  let scrollCloseTimer;
  window.addEventListener('scroll', () => {
    if (mobileNav?.classList.contains('open')) {
      clearTimeout(scrollCloseTimer);
      scrollCloseTimer = setTimeout(closeMenu, 80);
    }
  }, { passive: true });

  // Close when a nav link is clicked
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // ── REVEAL ON SCROLL ───────────────────────
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  );
  reveals.forEach(el => revealObserver.observe(el));

  // ── SMOOTH ANCHOR LINKS ────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });

  // ── WORK CATALOGUE FILTER ──────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.catalogue-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });

  // ── CONTACT FORM ───────────────────────────
  const form = document.getElementById('briefForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        form.innerHTML = `<div class="form-success"><div class="form-success__icon">✓</div><h3>Message received.</h3><p>We'll be in touch within 24 hours.</p></div>`;
      }, 1200);
    });
  }

  // ── SERVICE PILLS (contact page) ───────────
  document.querySelectorAll('.service-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.service-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');
      const inp = document.getElementById('serviceInput');
      if (inp) inp.value = pill.dataset.val;
    });
  });

  // ── CURSOR GLOW (desktop only) ─────────────
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(200,169,110,0.04) 0%,transparent 70%);transform:translate(-50%,-50%);transition:left 0.8s cubic-bezier(0.23,1,0.32,1),top 0.8s cubic-bezier(0.23,1,0.32,1);will-change:left,top;';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
  }

})();
