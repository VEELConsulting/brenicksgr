/* Brenicks first-party visit counter. No cookies, no third parties. */
(function () {
  var send = function (data) {
    try {
      var body = JSON.stringify(data);
      if (navigator.sendBeacon) navigator.sendBeacon('/api/collect', new Blob([body], { type: 'application/json' }));
      else fetch('/api/collect', { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    } catch (e) { /* never break the page */ }
  };
  var utm = (new URLSearchParams(location.search)).get('utm_source');
  send({ type: 'pageview', path: location.pathname, ref: document.referrer, utm: utm });
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/calendly|mailto:|tel:/i.test(h) || a.hasAttribute('data-track')) send({ type: 'click', path: location.pathname, label: (a.getAttribute('data-track') || a.textContent || h).trim().slice(0, 100) });
  }, true);
  window.addEventListener('error', function (e) { send({ type: 'error', path: location.pathname, label: String(e.message || 'error').slice(0, 100) }); });
  window.brenicksTrack = function (label) { send({ type: 'click', path: location.pathname, label: String(label).slice(0, 100) }); };
})();
