// The website chat ("Concierge"). Answers from the knowledge base (api/_kb.js, improved by the Chat Experience team),
// stores every conversation server-side, and hands over to a person when someone on the Chat Desk claims it.
// POST {session, path, message}                  → {reply, staff?}
// GET  ?session=<id>&after=<n>                    → {messages: [staff replies after index n]}  (the widget polls this)
// Optional later: ANTHROPIC_API_KEY (and CHAT_MODEL) for AI-written replies grounded in the same knowledge base.
import { redis, day, readBody } from './_redis.js';
import { loadKb, BOOKING } from './_kb.js';

const money = (n) => '$' + n.toLocaleString('en-US');
const rx = (s) => { try { return new RegExp(s, 'i'); } catch (e) { return /$^/; } };

export const intentOf = (kb, text) => {
  const t = text.toLowerCase();
  const score = {};
  for (const [k, s] of Object.entries(kb.services)) score[k] = (t.match(new RegExp(s.keywords, 'gi')) || []).length * (k === 'salesforce' ? 1.5 : 1);
  const service = Object.entries(score).sort((a, b) => b[1] - a[1]).find(([, v]) => v > 0)?.[0] || null;
  const stage = /audit|review|assess|readiness|health ?check|evaluat|not converting|slow|why (isn|doesn)|diagnos/.test(t) ? 'audit'
    : /monthly|ongoing|maintenan|support|care plan|hosting|retainer|manage (it|my|our)|keep (it )?(running|updated)/.test(t) ? 'retainer'
    : /build|new (web)?site|\bnew\b[^.?!]{0,25}\b(web ?site|site)\b|redesign|rebuild|set ?up|implement|create|launch|pilot|start from scratch|migrat/.test(t) ? 'build' : null;
  const pages = +((t.match(/(\d{1,3})\s*(?:-|to)?\s*(?:\d{1,3}\s*)?pages?/) || [])[1] || 0);
  const users = +((t.match(/(\d{1,5})\s*(?:salesforce\s*)?(?:users?|seats?|licen[cs]es?|people|employees|staff|reps?)/) || [])[1] || 0);
  const price = /price|pricing|cost|how much|budget|rate|fee|quote|charge|expensive|cheap|afford|\$/.test(t);
  return { service, stage, pages, users, price };
};

export const answer = (kb, userLines, botLines) => {
  const last = userLines[userLines.length - 1], q = last.toLowerCase();
  const all = intentOf(kb, userLines.join(' ')), now = intentOf(kb, last);
  const service = now.service || all.service, stage = now.stage || all.stage;
  const pages = now.pages || all.pages, seats = now.users || all.users;
  const email = (userLines.join(' ').match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0];
  const invited = botLines.some((b) => /leave your email/i.test(b));
  const close = email ? ` Book a free consultation anytime: ${BOOKING}` : (invited ? ` You can also book a free consultation: ${BOOKING}` : ` Leave your email and Lionel will follow up personally, or book a free consultation: ${BOOKING}`);
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(last)) return `Thank you. Lionel reads every message and will reply to ${email}${service ? ' about ' + kb.services[service].name : ''}. If you'd like to talk sooner: ${BOOKING}`;
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q) && !service) return kb.hello;
  if (/\bbook\b|schedule|appointment|\bmeeting\b|free consultation|talk to (someone|a person|you)|set up a call|hop on a call/.test(q) && !now.price) return `You can book a free consultation here: ${BOOKING}. Or email hello@brenicks.com.`;
  const faq = (kb.faqs || []).find((f) => rx(f.match).test(last));
  if (faq && !now.price) return faq.answer + (email || invited ? '' : ` Anything about our AI, Salesforce or web design work I can help with?`);
  if (!service) {
    if (all.price) return kb.starting_points + (invited || email ? '' : ' Leave your email and Lionel will follow up personally.');
    return kb.off_topic + (email ? '' : ' Or leave your email and Lionel will follow up personally.');
  }
  const P = kb.services[service];
  const line = (x) => `${x[0]}: ${x[1]} (${x[2]})`;
  const pick = (list, size) => (size && list.length > 1 ? (list.find((x) => x[3] && size <= x[3]) || list[list.length - 1]) : null);
  let fit = null;
  if (P.per_user && seats) {
    const n = Math.max(P.min_users || 1, seats), st = stage || 'build', rate = P.per_user[st];
    fit = `For ${seats} user${seats === 1 ? '' : 's'}, ${P[st][0][0]} comes to about ${money(n * rate)}${st === 'retainer' ? ' per month' : ''} (${money(rate)} per user${st === 'retainer' ? ' per month' : ''}${seats < (P.min_users || 0) ? `, minimum ${P.min_users} users` : ''}).` + (st === 'build' ? ` Most teams start with the ${P.audit[0][0]} at about ${money(n * P.per_user.audit)}.` : '');
  } else if (stage) {
    const one = pick(P[stage], pages) || (P[stage].length === 1 ? P[stage][0] : null);
    fit = one ? `${line(one)}.` : `${P[stage].map(line).join('. ')}.`;
  }
  let body;
  if (all.price) body = `${P.range} ${fit || 'Packages: ' + ['audit', 'build', 'retainer'].map((k) => P[k].map((x) => `${x[0]} ${x[1]}`).join(', ')).join('; ') + '.'}`;
  else body = fit || `${P.about} Most clients start with the ${P[P.start][0][0]} (${P[P.start][0][1]}).`;
  const ask = !stage ? ' Are you after a review, a new build, or ongoing support?' : (service === 'web' && !pages ? ' Roughly how many pages does your site have?' : (P.per_user && !seats ? ' How many users do you have?' : ''));
  return `${body} ${kb.quote_note}; details at ${P.page}.${ask}${close}`;
};

// How warm is this visitor? Contact details make a Lead; contact plus buying signals (urgency, size, price,
// a clear service and stage) make a HOT LEAD. Each level alerts Lionel's phone once per conversation.
const URGENT = /asap|urgent|right away|this week|this month|next week|ready to (start|go|buy|sign|move)|budget (is )?(approved|ready|set)|when can (you|we) start|next steps?|send (me |us )?(a |the )?(proposal|quote|invoice|contract)|sign (up|today)|let.?s (do|go|start)|we.?re ready|how (do|can) we (start|proceed)/i;
export const heatOf = (kb, userLines) => {
  const t = userLines.join(' '), it = intentOf(kb, t);
  const email = (t.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || null, phone = (t.match(/\+?\d[\d\s().-]{7,}\d/) || [])[0] || null;
  const urgent = URGENT.test(t);
  const score = (email || phone ? 3 : 0) + (it.service ? 1 : 0) + (it.stage ? 1 : 0) + (it.pages || it.users ? 1 : 0) + (it.price ? 1 : 0) + (urgent ? 2 : 0) + (/\bbook|call|meeting|consult/i.test(t) ? 1 : 0);
  const level = (email || phone) && (urgent || score >= 6) ? 'hot' : (email || phone) ? 'lead' : (urgent && score >= 4 ? 'warm' : null);
  return { level, score, email, phone, urgent, intent: it };
};
const APP = process.env.COMMAND_APP_URL || 'https://brenicks-command.pages.dev';
async function alertLionel(rec, heat, kb) {
  if (!process.env.DASH_TOKEN) return;
  const svc = heat.intent.service ? kb.services[heat.intent.service].name : 'unspecified service';
  const size = heat.intent.users ? `, ${heat.intent.users} users` : heat.intent.pages ? `, ${heat.intent.pages} pages` : '';
  const who = [heat.email, heat.phone].filter(Boolean).join(' · ') || 'no contact yet';
  const title = heat.level === 'hot' ? 'HOT LEAD on brenicks.com' : heat.level === 'lead' ? 'New lead on brenicks.com' : 'Warm visitor on brenicks.com';
  const body = `${svc}${size}. ${who}. "${rec.first_message.slice(0, 90)}"`;
  try { await fetch(APP + '/api/notify', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.DASH_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ title, body, url: '/desk/', tag: 'chat-' + rec.session + '-' + heat.level, level: heat.level === 'hot' ? 'hot' : 'lead' }) }); } catch (e) { /* the desk still has it */ }
}

export default async function handler(req, res) {
  const sid = String((req.method === 'GET' ? req.query.session : (req.body && req.body.session)) || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
  try {
    if (req.method === 'GET') {
      if (sid.length < 8) { res.status(400).json({ messages: [] }); return; }
      const [v] = await redis([['GET', 'chat:' + sid]]);
      const rec = v ? JSON.parse(v) : null, after = +req.query.after || 0;
      const staff = rec ? rec.transcript.map((m, i) => ({ ...m, i })).filter((m) => m.role === 'staff' && m.i >= after).map((m) => ({ i: m.i, by: m.by, content: m.content, at: m.at })) : [];
      res.setHeader('Cache-Control', 'no-store'); res.status(200).json({ messages: staff, length: rec ? rec.transcript.length : 0 }); return;
    }
    if (req.method !== 'POST') { res.status(405).end(); return; }
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const [count] = await redis([['INCR', 'rl:' + ip], ['EXPIRE', 'rl:' + ip, 60]]);
    if (count > 20) { res.status(429).json({ reply: 'You are sending messages quickly. Please wait a minute and try again.' }); return; }
    const b = await readBody(req);
    if (sid.length < 8) { res.status(400).json({ reply: 'Please reload the page to start a chat.' }); return; }
    const text = String(b.message || (Array.isArray(b.messages) ? (b.messages.filter((m) => m.role === 'user').pop() || {}).content : '') || '').slice(0, 2000).trim();
    if (!text) { res.status(400).json({ reply: 'Say hello to start.' }); return; }
    const kb = await loadKb();
    const [v] = await redis([['GET', 'chat:' + sid]]);
    const now = new Date().toISOString();
    const rec = v ? JSON.parse(v) : { session: sid, at: now, day: day(), first_message: text.slice(0, 300), transcript: [], status: 'open', path: String(b.path || '').slice(0, 160) };
    rec.transcript.push({ role: 'user', content: text, at: now });
    const userLines = rec.transcript.filter((m) => m.role === 'user').map((m) => m.content);
    let reply = '';
    const live = rec.claimed_by && rec.claimed_at && Date.now() - Date.parse(rec.claimed_at) < 20 * 60000;
    if (live) reply = `Got it. ${rec.claimed_by} from Brenicks is with you and will reply here shortly.`;
    else {
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const sys = `You are the website chat for The Brenicks Group. Only discuss the company and these offers and prices, exactly as written. We quote by scope; give the published range. Company: ${kb.company}. Offers: ${JSON.stringify(kb.services)} ${JSON.stringify(kb.faqs)}. Never invent prices, timelines or results. Booking: ${BOOKING}. Under 90 words.`;
          const msgs = rec.transcript.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-12).map((m) => ({ role: m.role, content: m.content }));
          const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.CHAT_MODEL || 'claude-haiku-5-5', max_tokens: 400, system: sys, messages: msgs }) });
          const j = await r.json(); reply = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
        } catch (e) { reply = ''; }
      }
      if (!reply) reply = answer(kb, userLines, rec.transcript.filter((m) => m.role === 'assistant').map((m) => m.content));
    }
    rec.transcript.push({ role: 'assistant', content: reply, at: new Date().toISOString(), kb: kb.version });
    rec.messages = rec.transcript.length;
    rec.last_at = now;
    rec.lead = /[\w.+-]+@[\w-]+\.[\w.]+/.test(userLines.join(' '));
    const it = intentOf(kb, userLines.join(' '));
    rec.intent = { service: it.service, stage: it.stage, pages: it.pages || null, users: it.users || null, asked_price: it.price };
    if (rec.status === 'closed') rec.status = 'open';
    const heat = heatOf(kb, userLines);
    rec.heat = { level: heat.level, score: heat.score };
    const rank = { warm: 1, lead: 2, hot: 3 };
    const alert = heat.level && heat.level !== 'warm' && (rank[heat.level] || 0) > (rank[rec.alerted] || 0);
    if (alert) rec.alerted = heat.level;
    const cmds = [['SET', 'chat:' + sid, JSON.stringify(rec), 'EX', 7776000], ['ZADD', 'chats', Date.now(), sid]];
    if (rec.transcript.length <= 2) cmds.push(['INCR', 'chats:' + day()], ['EXPIRE', 'chats:' + day(), 7776000], ['LPUSH', 'events', JSON.stringify({ at: rec.at, type: 'chat', path: rec.path, label: rec.first_message.slice(0, 80) })], ['LTRIM', 'events', 0, 499]);
    await redis(cmds);
    if (alert) await alertLionel(rec, heat, kb);
    res.status(200).json({ reply, length: rec.transcript.length });
  } catch (e) {
    res.status(200).json({ reply: 'The assistant is offline right now. Email hello@brenicks.com or book a call: ' + BOOKING });
  }
}
