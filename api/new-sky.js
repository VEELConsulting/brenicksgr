// Password-protected demo of the New Sky Aerospace agent command centre: brenicks.com/new-sky
// The password is checked against its SHA-256 hash; a signed-in browser keeps a 30-day cookie.
import { createHash, timingSafeEqual } from 'node:crypto';
import { PAGE, LOGO } from './_newsky_page.js';

const PASS_HASH = '34cea3c9cc670610e497f30453d388039a5818b7e382d0c2314ded7ef1e37d97';
const sha = (s) => createHash('sha256').update(s).digest('hex');
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const COOKIE = 'ns_demo';

const login = (bad) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>New Sky Aerospace · Agent Command</title><link rel="icon" href="/favicon.svg">
<style>
*{box-sizing:border-box}html,body{margin:0;height:100%;background:#0C1117;color:#F7F5F0;font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif}
.wrap{min-height:100%;display:grid;place-items:center;padding:24px}
.card{width:100%;max-width:400px;border:1px solid #2E343C;background:#141A21;padding:36px 30px;display:grid;gap:18px}
.bar{display:flex;height:4px;margin:-36px -30px 6px}.bar i{flex:1}
.brand{display:flex;align-items:center;gap:12px}.logo{background:#fff;padding:4px 8px;display:flex}.logo img{height:38px}
.x{color:#7d8287}.bk{display:flex;align-items:center;gap:8px;font-family:'Iowan Old Style',Palatino,Georgia,serif;letter-spacing:4px;font-size:14px}
.bk b{width:30px;height:30px;border:1.5px solid #A88447;display:grid;place-items:center;font-weight:400;letter-spacing:0;font-size:18px}
h1{margin:0;font-family:'Iowan Old Style',Palatino,Georgia,serif;font-weight:400;font-size:28px;line-height:1.15}
p{margin:0;color:#A7ABB2;font-size:14px;line-height:1.55}
label{font-size:12px;letter-spacing:2px;color:#A7ABB2}
input{width:100%;font:inherit;font-size:16px;padding:14px;background:#0C1117;border:1px solid #2E343C;color:#F7F5F0;margin-top:8px}
input:focus{outline:2px solid #A88447;outline-offset:1px}
button{font:inherit;font-weight:600;letter-spacing:1px;min-height:52px;border:0;background:#A88447;color:#0C1117;cursor:pointer}
.err{color:#F08A7E;font-size:13px}.foot{font-size:12px;color:#7d8287}.foot a{color:#C9A464}
</style></head><body><div class="wrap"><form class="card" method="post" action="/new-sky">
<div class="bar"><i style="background:#A88447"></i><i style="background:#E13323"></i></div>
<div class="brand"><span class="logo"><img src="${LOGO}" alt="New Sky Aerospace"></span><span class="x">×</span><span class="bk"><b>B</b>BRENICKS</span></div>
<h1>Your Command Center</h1>
<p>Prepared for Errol &amp; Nadia by The Brenicks Group LLC. Enter the password Lionel sent you.</p>
<div><label for="pw">PASSWORD</label><input id="pw" name="password" type="password" autocomplete="current-password" required autofocus></div>
${bad ? '<div class="err" role="alert">That password didn\'t match. Please try again.</div>' : ''}
<button type="submit">VIEW YOUR DEMO</button>
<div class="foot">Questions? <a href="https://brenicks.com/contact/">brenicks.com</a></div>
</form></div></body></html>`;

const send = (res, status, html, headers = {}) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('X-Frame-Options', 'DENY');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(html);
};

export default function handler(req, res) {
  const token = sha('ns-session:' + PASS_HASH);
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p.length === 2));
  const url = new URL(req.url, 'https://brenicks.com');
  if (url.searchParams.has('logout')) return send(res, 302, '', { Location: '/new-sky', 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : (req.body || {});
    const pw = String(body.password || '').trim();
    if (pw && same(sha(pw), PASS_HASH)) {
      return send(res, 303, '', { Location: '/new-sky', 'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax` });
    }
    return send(res, 401, login(true));
  }
  if (cookies[COOKIE] && same(cookies[COOKIE], token)) return send(res, 200, PAGE);
  return send(res, 200, login(false));
}
