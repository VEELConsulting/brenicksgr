// The Chat Desk: every website conversation in one shared queue that any available hand can take.
// Needs "Authorization: Bearer <DASH_TOKEN>". Used by the Brenicks Command app (/desk/) and by the sittings.
// GET  ?status=open|all&limit=50                 → {chats:[{session, at, last_at, status, claimed_by, lead, intent, first_message, transcript}]}
// POST {session, action:"claim", by}             → takes it (the chat tells the visitor a person is with them for 20 minutes)
// POST {session, action:"reply", by, text}       → posts a message from that person into the visitor's chat window
// POST {session, action:"release" | "close", by} → hands it back to the queue, or marks it done
import { redis, readBody } from './_redis.js';

const auth = (req) => process.env.DASH_TOKEN && (req.headers.authorization || '') === 'Bearer ' + process.env.DASH_TOKEN;
export default async function handler(req, res) {
  if (!auth(req)) { res.status(401).json({ error: 'unauthorized' }); return; }
  try {
    if (req.method === 'GET') {
      const limit = Math.min(100, +req.query.limit || 50);
      const ids = (await redis([['ZREVRANGE', 'chats', 0, limit - 1]]))[0] || [];
      const vals = ids.length ? (await redis([['MGET', ...ids.map((i) => 'chat:' + i)]]))[0] : [];
      let chats = vals.filter(Boolean).map((v) => JSON.parse(v)).map((c) => ({ session: c.session, at: c.at, last_at: c.last_at || c.at, status: c.status || 'open', claimed_by: c.claimed_by || null, claimed_at: c.claimed_at || null, lead: !!c.lead, heat: c.heat || null, intent: c.intent || null, path: c.path, first_message: c.first_message, transcript: c.transcript || [] }));
      if ((req.query.status || 'open') === 'open') chats = chats.filter((c) => c.status !== 'closed');
      res.setHeader('Cache-Control', 'no-store'); res.status(200).json({ chats }); return;
    }
    if (req.method !== 'POST') { res.status(405).end(); return; }
    const b = await readBody(req);
    const sid = String(b.session || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40), by = String(b.by || '').trim().slice(0, 40);
    if (!sid || !by) { res.status(400).json({ error: 'needs session and by' }); return; }
    const [v] = await redis([['GET', 'chat:' + sid]]);
    if (!v) { res.status(404).json({ error: 'no such chat' }); return; }
    const c = JSON.parse(v), now = new Date().toISOString();
    if (b.action === 'claim') { c.claimed_by = by; c.claimed_at = now; c.status = 'claimed'; }
    else if (b.action === 'reply') {
      const t = String(b.text || '').trim().slice(0, 2000); if (!t) { res.status(400).json({ error: 'empty reply' }); return; }
      c.transcript.push({ role: 'staff', by, content: t, at: now }); c.claimed_by = by; c.claimed_at = now; c.status = 'replied'; c.last_at = now;
    } else if (b.action === 'release') { c.claimed_by = null; c.claimed_at = null; c.status = 'open'; }
    else if (b.action === 'close') { c.status = 'closed'; c.closed_by = by; c.closed_at = now; }
    else { res.status(400).json({ error: 'unknown action' }); return; }
    (c.desk_log = c.desk_log || []).push({ at: now, by, action: b.action });
    await redis([['SET', 'chat:' + sid, JSON.stringify(c), 'EX', 7776000], ['ZADD', 'chats', Date.now(), sid]]);
    res.status(200).json({ ok: true, status: c.status, claimed_by: c.claimed_by });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
