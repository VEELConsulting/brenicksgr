// First-party, cookieless visit counter for brenicks.com.
// Each visitor is counted with a daily-rotating hash of IP + browser; the IP itself is never stored.
import crypto from 'node:crypto';
import { redis, day, readBody } from './_redis.js';

const clean = (s, n = 200) => String(s || '').replace(/[\u0000-\u001f]/g, '').slice(0, n);
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  try {
    const b = await readBody(req);
    const d = day();
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ua = clean(req.headers['user-agent'], 300);
    const visitor = crypto.createHash('sha256').update(d + (process.env.ANALYTICS_SALT || 'brenicks') + ip + ua).digest('hex').slice(0, 16);
    const type = ['pageview', 'click', 'error', 'chat'].includes(b.type) ? b.type : 'pageview';
    const path = clean(b.path, 160) || '/';
    let source = 'Direct';
    try { if (b.ref) { const h = new URL(b.ref).hostname.replace(/^www\./, ''); if (h && !h.endsWith('brenicks.com')) source = h; } } catch { /* ignore */ }
    if (b.utm) source = clean(b.utm, 60);
    const device = /Mobi|Android|iPhone/i.test(ua) ? 'Mobile' : /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Desktop';
    const bot = /bot|crawl|spider|preview|headless/i.test(ua);
    const country = clean(req.headers['x-vercel-ip-country'], 4);
    const event = { at: new Date().toISOString(), type, path, source, device, country, label: clean(b.label, 120), visitor: visitor.slice(0, 6) };
    if (bot) { res.status(204).end(); return; }
    const cmds = [['LPUSH', 'events', JSON.stringify(event)], ['LTRIM', 'events', 0, 499]];
    if (type === 'pageview') cmds.push(['INCR', 'pv:' + d], ['PFADD', 'uv:' + d, visitor], ['ZINCRBY', 'pages:' + d, 1, path], ['ZINCRBY', 'src:' + d, 1, source], ['EXPIRE', 'pages:' + d, 7776000], ['EXPIRE', 'src:' + d, 7776000], ['EXPIRE', 'uv:' + d, 7776000], ['EXPIRE', 'pv:' + d, 7776000]);
    if (type === 'error') cmds.push(['INCR', 'err:' + d], ['EXPIRE', 'err:' + d, 7776000]);
    await redis(cmds);
    res.status(204).end();
  } catch (e) { res.status(204).end(); }
}
