// The chat's knowledge base, managed by the Chat Experience team. Needs "Authorization: Bearer <DASH_TOKEN>".
// GET                                   → {live, history:[{version, updated, approved_by, note}]}
// POST {action:"publish", kb, proposed_by, approved_by, note}  → checks it, then makes it live (the chat picks it up within a minute)
// POST {action:"rollback"}              → restores the previous version
// Checks before anything goes live: services only web / salesforce / ai; every $ amount must appear on brenicks.com's
// service pages right now; every match pattern must be valid; the approver must differ from the proposer.
import { redis, readBody } from './_redis.js';
import { DEFAULT_KB, SERVICE_PAGES, clearKbCache } from './_kb.js';

const auth = (req) => process.env.DASH_TOKEN && (req.headers.authorization || '') === 'Bearer ' + process.env.DASH_TOKEN;
const amounts = (s) => (JSON.stringify(s).match(/\$\d[\d,]*(?:\.\d+)?/g) || []);
const text = (h) => h.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

async function check(kb) {
  const problems = [];
  if (!kb || typeof kb !== 'object') return ['kb missing'];
  const services = Object.keys(kb.services || {});
  if (!services.length || services.some((s) => !['web', 'salesforce', 'ai'].includes(s))) problems.push('services must be web, salesforce and/or ai only');
  for (const [k, s] of Object.entries(kb.services || {})) {
    for (const st of ['audit', 'build', 'retainer']) if (!Array.isArray(s[st]) || !s[st].length) problems.push(`${k}.${st} is empty`);
    try { new RegExp(s.keywords, 'gi'); } catch (e) { problems.push(`${k}.keywords is not a valid pattern`); }
    if (!String(s.page || '').startsWith('https://brenicks.com/')) problems.push(`${k}.page must be a brenicks.com page`);
  }
  for (const f of kb.faqs || []) {
    try { new RegExp(f.match, 'i'); } catch (e) { problems.push(`faq ${f.id} has an invalid match pattern`); }
    if (!f.answer || String(f.answer).length > 600) problems.push(`faq ${f.id} answer is missing or longer than 600 characters`);
  }
  for (const k of ['greeting', 'hello', 'starting_points', 'fallback', 'quote_note']) if (!kb[k] || String(kb[k]).length > 600) problems.push(`${k} is missing or too long`);
  if (JSON.stringify(kb).length > 60000) problems.push('knowledge base is larger than 60 KB');
  // grounding: every price must be on the live site
  const pages = await Promise.all(SERVICE_PAGES.map((u) => fetch(u, { headers: { 'User-Agent': 'brenicks-kb-check' } }).then((r) => r.text()).catch(() => '')));
  const site = text(pages.join(' ')).replace(/\s+/g, ' ');
  if (site.length < 500) problems.push('could not read the service pages to check prices; try again');
  else for (const a of new Set(amounts(kb))) if (!site.includes(a)) problems.push(`price ${a} is not on brenicks.com's service pages`);
  return problems;
}

export default async function handler(req, res) {
  if (!auth(req)) { res.status(401).json({ error: 'unauthorized' }); return; }
  try {
    if (req.method === 'GET') {
      const [live, hist] = await redis([['GET', 'kb:live'], ['LRANGE', 'kb:history', 0, 19]]);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ live: live ? JSON.parse(live) : DEFAULT_KB, from_default: !live, history: (hist || []).map((h) => { const k = JSON.parse(h); return { version: k.version, updated: k.updated, approved_by: k.approved_by, proposed_by: k.proposed_by, note: k.note }; }) });
      return;
    }
    if (req.method !== 'POST') { res.status(405).end(); return; }
    const b = await readBody(req);
    if (b.action === 'rollback') {
      const [cur, prev] = await redis([['GET', 'kb:live'], ['LINDEX', 'kb:history', 1]]);
      if (!prev) {
        if (!cur) { res.status(409).json({ error: 'already on the built-in version' }); return; }
        await redis([['DEL', 'kb:live'], ['LPOP', 'kb:history']]); clearKbCache();
        res.status(200).json({ ok: true, live_version: DEFAULT_KB.version, replaced: JSON.parse(cur).version }); return;
      }
      await redis([['SET', 'kb:live', prev], ['LPOP', 'kb:history']]);
      clearKbCache(); res.status(200).json({ ok: true, live_version: JSON.parse(prev).version, replaced: cur ? JSON.parse(cur).version : null }); return;
    }
    if (b.action !== 'publish') { res.status(400).json({ error: 'action must be publish or rollback' }); return; }
    if (!b.proposed_by || !b.approved_by || String(b.proposed_by) === String(b.approved_by)) { res.status(400).json({ error: 'needs proposed_by and a different approved_by' }); return; }
    const problems = await check(b.kb);
    if (problems.length) { res.status(422).json({ error: 'not published', problems }); return; }
    const [cur] = await redis([['GET', 'kb:live']]);
    const version = (cur ? JSON.parse(cur).version : DEFAULT_KB.version) + 1;
    const kb = { ...b.kb, version, updated: new Date().toISOString(), proposed_by: String(b.proposed_by).slice(0, 60), approved_by: String(b.approved_by).slice(0, 60), note: String(b.note || '').slice(0, 300) };
    await redis([['SET', 'kb:live', JSON.stringify(kb)], ['LPUSH', 'kb:history', JSON.stringify(kb)], ['LTRIM', 'kb:history', 0, 49]]);
    clearKbCache();
    res.status(200).json({ ok: true, version });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
