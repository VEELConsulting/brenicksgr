// Summary for the Brenicks command centre: daily visitors, pages, sources, recent events and chats.
// Protected by DASH_TOKEN (send "Authorization: Bearer <token>").
import { redis, day } from './_redis.js';

export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (!process.env.DASH_TOKEN || auth !== 'Bearer ' + process.env.DASH_TOKEN) { res.status(401).json({ error: 'unauthorized' }); return; }
  try {
    const days = [...Array(30)].map((_, i) => day(new Date(Date.now() - i * 864e5))).reverse();
    const cmds = [];
    days.forEach((d) => cmds.push(['GET', 'pv:' + d], ['PFCOUNT', 'uv:' + d], ['GET', 'chats:' + d], ['GET', 'err:' + d]));
    const week = days.slice(-7);
    week.forEach((d) => cmds.push(['ZRANGE', 'pages:' + d, 0, 49, 'REV', 'WITHSCORES'], ['ZRANGE', 'src:' + d, 0, 49, 'REV', 'WITHSCORES']));
    cmds.push(['LRANGE', 'events', 0, 79], ['ZRANGE', 'chats', 0, 19, 'REV']);
    const out = await redis(cmds);
    let k = 0;
    const daily = days.map((d) => ({ day: d, pageviews: +out[k++] || 0, visitors: +out[k++] || 0, chats: +out[k++] || 0, errors: +out[k++] || 0 }));
    const pages = {}, sources = {};
    week.forEach(() => { const p = out[k++] || [], s = out[k++] || []; for (let i = 0; i < p.length; i += 2) pages[p[i]] = (pages[p[i]] || 0) + +p[i + 1]; for (let i = 0; i < s.length; i += 2) sources[s[i]] = (sources[s[i]] || 0) + +s[i + 1]; });
    const events = (out[k++] || []).map((e) => { try { return JSON.parse(e); } catch { return null; } }).filter(Boolean);
    const ids = out[k++] || [];
    const chats = ids.length ? (await redis(ids.map((id) => ['GET', 'chat:' + id]))).map((c) => { try { const x = JSON.parse(c); return { at: x.at, first_message: x.first_message, messages: x.messages, lead: x.lead, transcript: x.transcript }; } catch { return null; } }).filter(Boolean) : [];
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ updated: new Date().toISOString(), site: 'brenicks.com', analytics_connected: true, chat_connected: true, chat_mode: process.env.ANTHROPIC_API_KEY ? 'ai' : 'free', daily,
      pages: Object.entries(pages).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([path, views]) => ({ path, views })),
      sources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([source, visitors]) => ({ source, visitors })), events, chats });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
