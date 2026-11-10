/* Brenicks website chat: a gold-ring button that opens a small chat with the Brenicks Concierge. */
(function () {
  if (window.__brenicksChat) return; window.__brenicksChat = true;
  var css = '#bk-chat-btn{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));z-index:2147483000;width:60px;height:60px;border-radius:50%;border:2px solid #C9A45C;background:radial-gradient(circle at 35% 30%,#20252C,#0C1117 72%);box-shadow:0 10px 24px rgba(0,0,0,.35);cursor:pointer;display:grid;place-items:center;transition:transform .2s,box-shadow .2s}' +
    '#bk-chat-btn:hover{transform:scale(1.05);box-shadow:0 0 0 6px rgba(201,164,92,.18),0 10px 24px rgba(0,0,0,.35)}' +
    '#bk-chat{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:calc(max(18px,env(safe-area-inset-bottom)) + 74px);z-index:2147483000;width:min(380px,calc(100vw - 32px));height:min(540px,calc(100vh - 120px));display:none;flex-direction:column;background:#F7F5F0;color:#0C1117;border:1px solid #D8D2C4;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28);overflow:hidden;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '#bk-chat.open{display:flex}#bk-chat header{background:#0C1117;color:#F7F5F0;padding:14px 16px;display:flex;align-items:center;gap:10px}#bk-chat header b{font:600 15px Georgia,serif;letter-spacing:.14em}#bk-chat header span{font-size:12px;color:#C9A45C;display:block;letter-spacing:.06em}' +
    '#bk-chat .log{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:8px}#bk-chat .m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}#bk-chat .a{background:#fff;border:1px solid #E6E0D3;align-self:flex-start}#bk-chat .u{background:#0C1117;color:#F7F5F0;align-self:flex-end}' +
    '#bk-chat form{display:flex;gap:8px;padding:10px;border-top:1px solid #E6E0D3;background:#fff}#bk-chat input{flex:1;font:inherit;border:1px solid #D8D2C4;border-radius:10px;padding:9px 11px;background:#F7F5F0}#bk-chat button[type=submit]{font:inherit;border:0;border-radius:10px;padding:0 14px;background:#A88447;color:#fff;cursor:pointer}#bk-chat .x{margin-left:auto;background:none;border:0;color:#F7F5F0;font-size:20px;cursor:pointer}#bk-chat a{color:#7A5B25}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var mark = '<svg width="28" height="28" viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="34" height="34" fill="none" stroke="#C9A45C" stroke-width="2"/><text x="20" y="29" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#E9C77F">B</text></svg>';
  var btn = document.createElement('button'); btn.id = 'bk-chat-btn'; btn.setAttribute('aria-label', 'Chat with Brenicks'); btn.innerHTML = mark;
  var box = document.createElement('div'); box.id = 'bk-chat'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Brenicks chat');
  box.innerHTML = '<header>' + mark + '<div><b>BRENICKS</b><span>Ask us anything</span></div><button class="x" aria-label="Close">×</button></header><div class="log" aria-live="polite"></div><form><input name="q" autocomplete="off" placeholder="Type your question…" aria-label="Your message"><button type="submit">Send</button></form>';
  document.body.appendChild(btn); document.body.appendChild(box);
  var log = box.querySelector('.log'), form = box.querySelector('form'), input = form.querySelector('input');
  var sid = (function () { try { var s = sessionStorage.getItem('bk-chat-sid'); if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('bk-chat-sid', s); } return s; } catch (e) { return Math.random().toString(36).slice(2); } })();
  var msgs = [];
  var add = function (role, text) { var d = document.createElement('div'); d.className = 'm ' + (role === 'user' ? 'u' : 'a'); d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
  var opened = false;
  btn.addEventListener('click', function () { box.classList.toggle('open'); if (!opened) { opened = true; add('assistant', 'Hello. I can answer questions about AI implementation, Salesforce and web design at Brenicks, or help you book a free consultation. What are you working on?'); } if (box.classList.contains('open')) input.focus(); if (window.brenicksTrack) window.brenicksTrack('Opened chat'); });
  box.querySelector('.x').addEventListener('click', function () { box.classList.remove('open'); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = '';
    add('user', q); msgs.push({ role: 'user', content: q });
    var wait = add('assistant', '…');
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session: sid, path: location.pathname, messages: msgs }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { wait.textContent = j.reply || 'Sorry, something went wrong. Email hello@brenicks.com.'; msgs.push({ role: 'assistant', content: wait.textContent }); })
      .catch(function () { wait.textContent = 'The chat is offline. Email hello@brenicks.com.'; });
  });
})();
