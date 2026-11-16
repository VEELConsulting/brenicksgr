/* Market pricing on the service pages (MKT-001). Asks /api/price which market the visitor is in. In the US and every
   T1 market, or while market pricing is switched off, the page stays exactly as written. Elsewhere every tagged price
   ([data-price]) shows that market's price in US dollars, with an approximate amount in the visitor's own currency,
   one plain note says the prices are for businesses in their country, and checkout opens at the market price. */
(function () {
  var tagged = document.querySelectorAll('[data-price]');
  if (!tagged.length || !window.fetch) return;
  var usd = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var lang = document.documentElement.lang || 'en';
  var round3 = function (n) { var d = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 2)); return Math.round(n / d) * d; };
  fetch('/api/price', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (m) {
    if (!m) return;
    if (m.closed && m.enabled) {
      document.querySelectorAll('a[data-pkg]').forEach(function (a) { a.setAttribute('href', '/contact/?market=closed'); });
      return;
    }
    if (!m.live) return;
    var place = m.country; try { place = new Intl.DisplayNames([lang, 'en'], { type: 'region' }).of(m.country); } catch (e) { /* code is fine */ }
    var local = function (n) {
      if (!m.rate || m.currency === 'USD') return '';
      try { return new Intl.NumberFormat([navigator.language || lang, 'en'], { style: 'currency', currency: m.currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(round3(n * m.rate)); } catch (e) { return ''; }
    };
    var css = document.createElement('style');
    css.textContent = '.market-local{display:block;font-size:.82em;opacity:.7;margin-top:.15rem}.market-note{margin:0 0 1.5rem;padding:.75rem 1rem;border:1px solid var(--c-border,rgba(180,160,120,.25));border-radius:10px;font-size:.92rem;color:var(--c-text-2,#5A5650);background:var(--c-surface,rgba(255,255,255,.6))}.market-note b{color:var(--c-text,#1A1814);font-weight:600}';
    document.head.appendChild(css);
    var noted = new Set();
    tagged.forEach(function (el) {
      var v = m.prices[el.getAttribute('data-price')]; if (v == null) return;
      el.textContent = usd(v);
      // one approximate local amount per price line, under it
      var line = el.closest('p, li, h2, .btn, a') || el.parentNode;
      if (line && !noted.has(line) && !line.classList.contains('btn')) {
        var amounts = line.querySelectorAll('[data-price]'), txt = [];
        amounts.forEach(function (a) { var x = local(m.prices[a.getAttribute('data-price')]); if (x) txt.push(x); });
        if (txt.length) { var s = document.createElement('span'); s.className = 'market-local'; s.textContent = 'about ' + txt.join(' to '); line.appendChild(s); }
        noted.add(line);
      }
    });
    document.querySelectorAll('a[data-pkg]').forEach(function (a) { a.setAttribute('href', '/api/checkout?pkg=' + encodeURIComponent(a.getAttribute('data-pkg'))); });
    var first = document.querySelector('.tiers-grid, .tier-card, [data-price]');
    var host = first && (first.closest('.tiers-grid') || first.closest('section .container') || first.parentNode);
    if (host && host.parentNode) {
      var note = document.createElement('p'); note.className = 'market-note';
      note.innerHTML = '<b>Priced for businesses in ' + place.replace(/[<>&]/g, '') + '.</b> Prices are in US dollars' + (m.rate ? ', with an approximate amount in your currency that moves with the exchange rate' : '') + '. The final amount is shown at checkout.';
      host.parentNode.insertBefore(note, host);
    }
  }).catch(function () { /* the page as written is always correct for US buyers */ });
})();
