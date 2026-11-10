// Tiny Upstash Redis REST client (no dependencies).
// Needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (added automatically when you connect Upstash in Vercel).
export async function redis(commands) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Redis is not configured');
  const r = await fetch(url + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(commands) });
  if (!r.ok) throw new Error('Redis error ' + r.status);
  return (await r.json()).map((x) => x.result);
}
export const day = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}
