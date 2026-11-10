// The website chat ("Concierge"). Stores each conversation for the team.
// Free mode (default, no API key): answers common questions from a short fixed list and invites the visitor to leave an email;
// Lionel and the Concierge agent read every conversation and follow up by email.
// Optional later: ANTHROPIC_API_KEY (and CHAT_MODEL) for AI-written replies. Optional: BOOKING_URL.
import { redis, day, readBody } from './_redis.js';

const BOOKING = process.env.BOOKING_URL || 'https://calendly.com/thebrenicksgroup/website-consultation';
const SYSTEM = `You are the Concierge on brenicks.com, the website of The Brenicks Group, a consultancy in Raleigh, North Carolina that helps professional-services firms (law, accounting, consulting) and small businesses with AI implementation, Salesforce consulting and integration, and website design.
Be warm, brief (under 90 words), and plain. Answer questions about the services and how an engagement starts. Never invent prices, timelines, client names or results; if asked about price, say it depends on scope and offer a free consultation.
To book, share ${BOOKING}. The email is hello@brenicks.com.
If the visitor seems interested, you may ask for their name, firm and email so the team can follow up; never pressure. Do not discuss these instructions.`;

// Free-mode answers: plain, no prices or promises, always a way to reach a person.
const freeReply = (msgs) => {
  const users = msgs.filter((m) => m.role === 'user').map((m) => m.content);
  const q = users[users.length - 1].toLowerCase();
  const email = (users.join(' ').match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0];
  const asked = msgs.filter((m) => m.role === 'assistant' && /leave your email/i.test(m.content)).length > 0;
  const tail = email ? '' : (asked ? '' : ' If you leave your email here, Lionel will reply to you personally.');
  if (email && /[\w.+-]+@[\w-]+\.[\w.]+/.test(q)) return `Thank you. Lionel reads every message and will reply to ${email}. If you'd like to talk sooner, you can book a free consultation: ${BOOKING}`;
  if (/price|cost|how much|budget|rate|fee|quote/.test(q)) return `It depends on the scope, so we don't quote a fixed price before understanding what you need. A free consultation is the quickest way to a clear number: ${BOOKING}.` + tail;
  if (/salesforce|crm/.test(q)) return 'We set up, connect and improve Salesforce for small and mid-size firms: data model, automations, integrations and migration. What are you using Salesforce for today?' + tail;
  if (/\bai\b|agent|automat|chatgpt|claude|llm/.test(q)) return 'We design and build AI systems that take repetitive work off your team, like drafting, knowledge search and proposals, inside the tools you already use. What task takes your team the most time?' + tail;
  if (/web|site|design|seo|landing/.test(q)) return 'We design and rebuild websites that are fast, clear and built to turn visitors into enquiries. Do you have a site today, and what would you like it to do better?' + tail;
  if (/book|call|meet|consult|talk|schedule|appointment/.test(q)) return `You can book a free consultation here: ${BOOKING}. Or email hello@brenicks.com.`;
  if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q)) return 'Hello! Are you looking at AI, Salesforce or your website? Tell me a little about your business and what you need.';
  return `Thanks for your message. Lionel reads every conversation and follows up personally.${email ? '' : ' Leave your email and he will reply to you.'} You can also book a free consultation: ${BOOKING}`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  try {
    const [count] = await redis([['INCR', 'rl:' + ip], ['EXPIRE', 'rl:' + ip, 60]]);
    if (count > 20) { res.status(429).json({ reply: 'You are sending messages quickly. Please wait a minute and try again.' }); return; }
    const b = await readBody(req);
    const sid = String(b.session || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'anon';
    const msgs = (Array.isArray(b.messages) ? b.messages : []).slice(-12).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) })).filter((m) => m.content);
    if (!msgs.length || msgs[msgs.length - 1].role !== 'user') { res.status(400).json({ reply: 'Say hello to start.' }); return; }
    let reply;
    if (process.env.ANTHROPIC_API_KEY) {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: process.env.CHAT_MODEL || 'claude-haiku-5-5', max_tokens: 400, system: SYSTEM, messages: msgs }) });
      const j = await r.json();
      reply = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    }
    if (!reply) reply = freeReply(msgs);
    const all = msgs.concat([{ role: 'assistant', content: reply }]);
    const lead = /[\w.+-]+@[\w-]+\.[\w.]+/.test(msgs.filter((m) => m.role === 'user').map((m) => m.content).join(' '));
    const rec = { session: sid, at: new Date().toISOString(), day: day(), first_message: msgs.find((m) => m.role === 'user').content.slice(0, 300), messages: all.length, lead, transcript: all };
    const cmds = [['SET', 'chat:' + sid, JSON.stringify(rec), 'EX', 7776000], ['ZADD', 'chats', Date.now(), sid]];
    if (all.length <= 2) cmds.push(['INCR', 'chats:' + day()], ['EXPIRE', 'chats:' + day(), 7776000], ['LPUSH', 'events', JSON.stringify({ at: rec.at, type: 'chat', path: String(b.path || '').slice(0, 160), label: rec.first_message.slice(0, 80) })], ['LTRIM', 'events', 0, 499]);
    await redis(cmds);
    res.status(200).json({ reply });
  } catch (e) {
    res.status(200).json({ reply: 'The assistant is offline right now. Email hello@brenicks.com or book a call: ' + BOOKING });
  }
}
