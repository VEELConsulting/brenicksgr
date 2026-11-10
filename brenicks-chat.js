/* Brenicks website chat: a gold-ring button that opens a chat with the Brenicks Concierge.
   Phones: the chat fills the screen, follows the keyboard (header, last message and the typing box stay in view),
   the text box grows as you type, and nothing zooms (inputs are 16px). A person from the Brenicks Chat Desk can
   answer in this window; their messages arrive within a few seconds while the chat is open. */
(function () {
  if (window.__brenicksChat) return; window.__brenicksChat = true;
  var css = '' +
    '#bk-chat-btn{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));z-index:2147483000;width:60px;height:60px;border-radius:50%;border:2px solid #C9A45C;background:radial-gradient(circle at 35% 30%,#20252C,#0C1117 72%);box-shadow:0 10px 24px rgba(0,0,0,.35);cursor:pointer;display:grid;place-items:center;padding:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .2s,box-shadow .2s}' +
    '#bk-chat-btn:hover{transform:scale(1.05);box-shadow:0 0 0 6px rgba(201,164,92,.18),0 10px 24px rgba(0,0,0,.35)}#bk-chat-btn:focus-visible{outline:3px solid #F3CF7A;outline-offset:3px}' +
    '#bk-chat-btn .dot{position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:#E5484D;border:2px solid #0C1117;display:none}#bk-chat-btn.new .dot{display:block}' +
    '#bk-chat{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(max(16px,env(safe-area-inset-bottom)) + 72px);z-index:2147483001;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));display:none;flex-direction:column;background:#F7F5F0;color:#0C1117;border:1px solid #D8D2C4;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28);overflow:hidden;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-text-size-adjust:100%}' +
    '#bk-chat.open{display:flex}' +
    '#bk-chat header{flex:none;background:#0C1117;color:#F7F5F0;padding:12px 14px;display:flex;align-items:center;gap:10px}#bk-chat header b{font:600 15px Georgia,serif;letter-spacing:.14em;display:block}#bk-chat header span{font-size:12px;color:#C9A45C;display:block;letter-spacing:.06em}' +
    '#bk-chat .x{margin-left:auto;background:none;border:0;color:#F7F5F0;font-size:26px;line-height:1;width:44px;height:44px;cursor:pointer;touch-action:manipulation}' +
    '#bk-chat .log{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px;display:flex;flex-direction:column;gap:8px}' +
    '#bk-chat .m{max-width:86%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}#bk-chat .a{background:#fff;border:1px solid #E6E0D3;align-self:flex-start}#bk-chat .u{background:#0C1117;color:#F7F5F0;align-self:flex-end}' +
    '#bk-chat .s{border-color:#C9A45C;box-shadow:0 0 0 1px rgba(201,164,92,.35)}#bk-chat .who{font-size:11px;letter-spacing:.06em;color:#7A5B25;margin-bottom:2px;font-weight:600}#bk-chat a{color:#7A5B25}' +
    '#bk-chat form{flex:none;display:flex;align-items:flex-end;gap:8px;padding:10px;padding-bottom:max(10px,env(safe-area-inset-bottom));border-top:1px solid #E6E0D3;background:#fff}' +
    '#bk-chat textarea{flex:1;font:16px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;border:1px solid #D8D2C4;border-radius:12px;padding:10px 12px;background:#F7F5F0;color:#0C1117;resize:none;min-height:44px;max-height:120px;overflow-y:auto;margin:0}' +
    '#bk-chat textarea:focus{outline:2px solid #C9A45C;outline-offset:0}' +
    '#bk-chat button[type=submit]{flex:none;font:600 15px system-ui,-apple-system,sans-serif;border:0;border-radius:12px;height:44px;padding:0 16px;background:#A88447;color:#fff;cursor:pointer;touch-action:manipulation}' +
    '@media (max-width:600px){#bk-chat{inset:0;width:100%;height:100%;max-height:none;border-radius:0;border:0;right:0;bottom:0}#bk-chat header{padding-top:max(12px,env(safe-area-inset-top))}html.bk-chat-lock,html.bk-chat-lock body{overflow:hidden;height:100%}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  // phones must never zoom when the box is tapped: make sure the page allows its normal scale
  var vp = document.querySelector('meta[name=viewport]'); if (!vp) { vp = document.createElement('meta'); vp.name = 'viewport'; vp.content = 'width=device-width,initial-scale=1,viewport-fit=cover'; document.head.appendChild(vp); }

  var mark = '<svg width="28" height="28" viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="34" height="34" fill="none" stroke="#C9A45C" stroke-width="2"/><text x="20" y="29" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#E9C77F">B</text></svg>';
  var btn = document.createElement('button'); btn.id = 'bk-chat-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Chat with Brenicks'); btn.setAttribute('aria-expanded', 'false'); btn.innerHTML = mark + '<span class="dot"></span>';
  var box = document.createElement('div'); box.id = 'bk-chat'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Brenicks chat');
  box.innerHTML = '<header>' + mark + '<div><b>BRENICKS</b><span>Ask us anything</span></div><button class="x" type="button" aria-label="Close chat">×</button></header><div class="log" aria-live="polite"></div><form><textarea name="q" rows="1" enterkeyhint="send" autocomplete="off" placeholder="Type your question…" aria-label="Your message"></textarea><button type="submit">Send</button></form>';
  document.body.appendChild(btn); document.body.appendChild(box);
  var log = box.querySelector('.log'), form = box.querySelector('form'), input = form.querySelector('textarea');
  var phone = function () { return window.matchMedia('(max-width:600px)').matches; };

  // keep header, last message and the typing box visible above the on-screen keyboard
  var fit = function () {
    if (!box.classList.contains('open') || !phone() || !window.visualViewport) { box.style.height = ''; box.style.top = ''; return; }
    var v = window.visualViewport; box.style.top = v.offsetTop + 'px'; box.style.height = v.height + 'px'; log.scrollTop = log.scrollHeight;
  };
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', fit); window.visualViewport.addEventListener('scroll', fit); }
  var grow = function () { if (!input.value) { input.style.height = ''; return; } input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; };
  input.addEventListener('input', grow);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !phone()) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } });

  var sid = (function () { try { var s = sessionStorage.getItem('bk-chat-sid'); if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('bk-chat-sid', s); } return s; } catch (e) { return Math.random().toString(36).slice(2) + Date.now().toString(36); } })();
  var fill = function (d, text) { d.textContent = ''; String(text).split(/(https:\/\/[^\s)]+)/).forEach(function (part, i) { if (i % 2) { var u = part.replace(/[.,;:]+$/, ''); var a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.textContent = /calendly/.test(u) ? 'pick a time →' : u.replace(/^https:\/\//, ''); d.appendChild(a); if (u.length < part.length) d.appendChild(document.createTextNode(part.slice(u.length))); } else d.appendChild(document.createTextNode(part)); }); };
  var add = function (role, text) { var d = document.createElement('div'); d.className = 'm ' + (role === 'user' ? 'u' : 'a'); fill(d, text); log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };

  var seen = 0, started = false, timer = 0;
  var poll = function () {
    clearTimeout(timer);
    if (!started || document.hidden) { timer = setTimeout(poll, 8000); return; }
    fetch('/api/chat?session=' + encodeURIComponent(sid) + '&after=' + seen, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      (j.messages || []).forEach(function (m) { var d = add('assistant', m.content); var who = document.createElement('div'); who.className = 'who'; who.textContent = (m.by || 'Brenicks') + ' · Brenicks'; d.insertBefore(who, d.firstChild); d.classList.add('s'); seen = Math.max(seen, m.i + 1); if (!box.classList.contains('open')) btn.classList.add('new'); });
      if (j.length) seen = Math.max(seen, j.length);
    }).catch(function () {}).then(function () { timer = setTimeout(poll, box.classList.contains('open') ? 5000 : 15000); });
  };

  var opened = false;
  var open = function (on) {
    box.classList.toggle('open', on); btn.setAttribute('aria-expanded', String(on)); btn.classList.remove('new');
    document.documentElement.classList.toggle('bk-chat-lock', on && phone());
    btn.style.display = on && phone() ? 'none' : '';
    if (on && !opened) { opened = true; add('assistant', 'Hello. Ask me about The Brenicks Group, our websites, Salesforce or AI work, or what it costs. What are you working on?'); if (window.brenicksTrack) window.brenicksTrack('Opened chat'); }
    if (on) { if (!phone()) input.focus(); fit(); poll(); } else { box.style.height = ''; box.style.top = ''; btn.focus(); }
  };
  btn.addEventListener('click', function () { open(!box.classList.contains('open')); });
  box.querySelector('.x').addEventListener('click', function () { open(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('open')) open(false); });
  input.addEventListener('focus', function () { setTimeout(fit, 300); });

  form.addEventListener('submit', function (e) {
    e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = ''; grow();
    add('user', q);
    var wait = add('assistant', '…');
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session: sid, path: location.pathname, message: q }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { fill(wait, j.reply || 'Sorry, something went wrong. Email hello@brenicks.com.'); log.scrollTop = log.scrollHeight; if (j.length) seen = Math.max(seen, j.length); started = true; poll(); })
      .catch(function () { wait.textContent = 'The chat is offline. Email hello@brenicks.com.'; });
  });
})();
