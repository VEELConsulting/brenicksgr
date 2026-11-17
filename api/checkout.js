// One checkout for every package and tier. Reads prices from api/_pricebook.js (generated from the price book) and
// sends the client to a Stripe Checkout page for the right amount, so no price is ever kept in a payment link.
//
//   GET /api/checkout?p=PB-003                     public price (T1), as on the service pages
//   GET /api/checkout?p=PB-003&t=T4&k=ZA&c=...&exp=...&sig=...   a client's own link, made with api/_checkout-link.mjs
//       q = user count for per-user packages (at least the package minimum); a = quoted amount in cents for scoped work
//
// Rules: the tier follows the client's business and is set on their proposal, never by the visitor, so anything but
// the public T1 price needs a signed link; a tier other than T1 is honoured only for a country open at that tier.
// Env: STRIPE_SECRET_KEY (test key until live is approved), CHECKOUT_SIGNING_SECRET, CHECKOUT_LIVE=on to allow a live key.
// With no Stripe key the public price falls back to today's payment link, so nothing breaks before the switch-over.
import { PACKAGES, TIERS, MARKETS, UPDATED } from './_pricebook.js';
import { verify } from './_checkout-sign.js';

const SITE = 'https://brenicks.com';
const clean = (s, n) => String(s || '').replace(/[^\w.\-:@ ]/g, '').slice(0, n);

// Works out what to charge. Returns {error, status} or the line to sell.
export function resolve(q, now = Date.now(), env = process.env) {
  const pkg = PACKAGES[q.p];
  if (!pkg) return { status: 404, error: 'That package does not exist.' };
  const tier = q.t || 'T1';
  if (!TIERS.includes(tier)) return { status: 400, error: 'Unknown price tier.' };
  const signed = !!q.sig;
  if (signed) {
    if (!verify(q, q.sig, env.CHECKOUT_SIGNING_SECRET)) return { status: 403, error: 'This payment link is not valid. Please ask us for a new one.' };
    if (!(Number(q.exp) * 1000 > now)) return { status: 410, error: 'This payment link has expired. Please ask us for a new one.' };
  } else if (tier !== 'T1' || q.a || q.k || q.c) return { status: 403, error: 'This price needs the payment link from your proposal.' };
  const country = String(q.k || '').toUpperCase();
  if (tier !== 'T1' && MARKETS[country] !== tier) return { status: 403, error: 'This price is not available for that country yet.' };
  const p = pkg.price[tier];
  let amount;
  if (p.amount) { if (q.a) return { status: 400, error: 'This package has a fixed price.' }; amount = p.amount; }
  else {
    if (!signed) return { status: 400, error: 'This work is priced after a scoping call.', page: pkg.page };
    amount = Math.round(Number(q.a));
    if (!(amount >= p.min) || (p.max != null && amount > p.max)) return { status: 400, error: 'The quoted amount is outside the range for this package.' };
  }
  let qty = pkg.min_qty, adjustable = false;
  if (pkg.per_user) {
    if (q.q != null && q.q !== '') { qty = Math.round(Number(q.q)); if (!(qty >= pkg.min_qty && qty <= 10000)) return { status: 400, error: `This package needs at least ${pkg.min_qty} users.` }; }
    else if (signed) return { status: 400, error: 'This payment link is missing the user count.' };
    else adjustable = true; // public link: the client enters the user count at checkout, as the page says
  } else if (q.q && Number(q.q) !== 1) return { status: 400, error: 'This package is sold one at a time.' };
  return { id: q.p, pkg, tier, amount, qty, adjustable, country, client: clean(q.c, 120), signed };
}

// The form body for POST https://api.stripe.com/v1/checkout/sessions
export function sessionForm(r) {
  const f = new URLSearchParams();
  const meta = { package: r.id, tier: r.tier, country: r.country, client_ref: r.client, price_book: UPDATED.slice(0, 10) };
  f.set('mode', r.pkg.monthly ? 'subscription' : 'payment');
  f.set('line_items[0][price_data][currency]', 'usd');
  f.set('line_items[0][price_data][unit_amount]', String(r.amount));
  f.set('line_items[0][price_data][product_data][name]', 'The Brenicks Group: ' + r.pkg.name + (r.pkg.per_user ? ' (per user)' : ''));
  if (r.pkg.monthly) f.set('line_items[0][price_data][recurring][interval]', 'month');
  f.set('line_items[0][quantity]', String(r.qty));
  if (r.adjustable) { f.set('line_items[0][adjustable_quantity][enabled]', 'true'); f.set('line_items[0][adjustable_quantity][minimum]', String(r.pkg.min_qty)); f.set('line_items[0][adjustable_quantity][maximum]', '10000'); }
  f.set('billing_address_collection', 'required');
  f.set('tax_id_collection[enabled]', 'true');
  f.set('success_url', SITE + r.pkg.page + '?checkout=paid');
  f.set('cancel_url', SITE + r.pkg.page);
  if (r.client) f.set('client_reference_id', r.client.replace(/[^\w\-]/g, '_').slice(0, 200));
  const into = r.pkg.monthly ? 'subscription_data[metadata]' : 'payment_intent_data[metadata]';
  for (const [k, v] of Object.entries(meta)) if (v) { f.set(`metadata[${k}]`, v); f.set(`${into}[${k}]`, v); }
  return f;
}

function page(res, status, msg, back) {
  res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Checkout · The Brenicks Group</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080C14;color:#F3F0EA;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;padding:16px}main{max-width:420px;text-align:center}h1{font:600 26px/1.3 Georgia,serif;color:#C8A96E;margin:0 0 12px}a{color:#C8A96E}</style></head>
<body><main><h1>The Brenicks Group</h1><p>${msg}</p><p><a href="${back || '/contact/'}">${back ? 'Back to the package' : 'Contact us'}</a></p></main></body></html>`);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store'); // prices are per client: never cache one client's checkout for another
  if (req.method !== 'GET') { res.status(405).end(); return; }
  const q = Object.fromEntries(new URL(req.url, SITE).searchParams);
  const r = resolve(q);
  if (r.error) { page(res, r.status, r.error, r.page); return; }
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!key) {
    if (!r.signed && r.pkg.link) { res.status(302).setHeader('Location', r.pkg.link); res.end(); return; }
    page(res, 503, 'Online checkout is opening soon. Write to us and we will send your invoice.'); return;
  }
  if (/^(sk|rk)_live_/.test(key) && process.env.CHECKOUT_LIVE !== 'on') { page(res, 503, 'Online checkout is opening soon. Write to us and we will send your invoice.'); return; }
  try {
    const s = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' }, body: sessionForm(r) });
    const j = await s.json();
    if (!s.ok || !j.url) throw new Error((j.error && j.error.message) || 'Stripe ' + s.status);
    res.status(303).setHeader('Location', j.url); res.end();
  } catch (e) {
    console.error('checkout', r.id, r.tier, e.message);
    page(res, 502, 'We could not open the payment page just now. Please try again in a minute, or contact us.', r.pkg.page);
  }
}
