// Tests for the one checkout:  node api/_checkout.test.mjs   (no network; Stripe is stubbed)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PACKAGES, TIERS, MARKETS } from './_pricebook.js';
import { sign } from './_checkout-sign.js';
import handler, { resolve, sessionForm } from './checkout.js';

const SECRET = 'test-secret-0123456789'; const env = { CHECKOUT_SIGNING_SECRET: SECRET };
const exp = Math.floor(Date.now() / 1000) + 3600;
const link = (o) => { const x = { exp, ...o }; return { ...x, sig: sign(x, SECRET) }; };
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const book = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')) : null;
const want = (s) => Math.round(Number(String(s).replace(/\/.*$/, '').replace(/[^\d.]/g, '')) * 100);

// 1. Every fixed package at every tier charges exactly the price book amount (17 packages x 5 tiers = 85 links replaced).
const country = { T1: 'US', T2: 'ES', T3: 'MX', T4: 'ZA' };
let fixed = 0, priced = 0;
for (const [id, p] of Object.entries(PACKAGES)) for (const t of TIERS) {
  const pr = p.price[t]; if (!pr.amount) continue;
  if (book) { ok(pr.amount === want((book.data || book).items.find((i) => i.id === id).price[t]), `${id} ${t} matches the price book`); priced++; }
  if (!country[t]) continue; // T5 has no open market yet
  const r = resolve(link({ p: id, t, k: country[t], q: p.per_user ? 12 : '' }), Date.now(), env);
  ok(!r.error && r.amount === pr.amount && r.qty === (p.per_user ? 12 : 1), `${id} ${t} resolves: ${r.error || r.amount}`); fixed++;
}
// 2. Public T1 needs no signature; per-user lets the client set the count (min 10).
let r = resolve({ p: 'PB-003' }, Date.now(), env); ok(r.amount === 500000 && r.tier === 'T1' && !r.signed, 'public T1');
r = resolve({ p: 'PB-007' }, Date.now(), env); ok(r.adjustable && r.qty === 10, 'public per-user is adjustable from 10');
ok(resolve({ p: 'PB-007', q: '9' }, Date.now(), env).status === 400, 'below the 10-user minimum refused');
// 3. A visitor cannot choose a tier, amount or country, or edit a signed link.
ok(resolve({ p: 'PB-003', t: 'T5' }, Date.now(), env).status === 403, 'unsigned T5 refused');
const good = link({ p: 'PB-003', t: 'T4', k: 'ZA', c: 'Acme Dental' });
ok(resolve({ ...good, t: 'T5' }, Date.now(), env).status === 403, 'tampered tier refused');
ok(resolve({ ...good, p: 'PB-004' }, Date.now(), env).status === 403, 'tampered package refused');
ok(resolve({ ...good, sig: good.sig.slice(1) }, Date.now(), env).status === 403, 'bad signature refused');
ok(resolve(good, (exp + 1) * 1000, env).status === 410, 'expired link refused');
ok(resolve(good, Date.now(), {}).status === 403, 'no signing secret: signed links refused');
// 4. Launch markets only; T1 open to any country (size and headquarters rules).
ok(resolve(link({ p: 'PB-003', t: 'T4', k: 'NG' }), Date.now(), env).status === 403, 'T4 for a closed market refused');
ok(resolve(link({ p: 'PB-003', t: 'T2', k: 'ZA' }), Date.now(), env).status === 403, 'wrong tier for the market refused');
ok(!resolve(link({ p: 'PB-003', t: 'T1', k: 'ZA' }), Date.now(), env).error, 'T1 for a big ZA firm allowed');
ok(MARKETS.ZA === 'T4' && MARKETS.ES === 'T2' && MARKETS.MX === 'T3' && MARKETS.IE === 'T1', 'launch markets from the price book');
// 5. Scoped work: amount only on a signed link, inside the tier's range.
ok(resolve({ p: 'PB-012' }, Date.now(), env).status === 400, 'pilot needs a quote');
ok(resolve(link({ p: 'PB-012', t: 'T3', k: 'MX', a: 1200000 }), Date.now(), env).amount === 1200000, 'pilot T3 quote in range');
ok(resolve(link({ p: 'PB-012', t: 'T3', k: 'MX', a: 2000000 }), Date.now(), env).status === 400, 'pilot quote above range refused');
ok(resolve(link({ p: 'PB-017', k: 'US', a: 9000000 }), Date.now(), env).amount === 9000000, 'implementation quote, open-ended');
ok(resolve(link({ p: 'PB-001', k: 'US', a: 100 }), Date.now(), env).status === 400, 'amount on a fixed package refused');
// 6. Stripe session: subscriptions monthly, metadata on the payment, address and VAT number collected.
let f = sessionForm(resolve(link({ p: 'PB-009', t: 'T4', k: 'ZA', q: 15, c: 'Acme Dental' }), Date.now(), env));
ok(f.get('mode') === 'subscription' && f.get('line_items[0][price_data][recurring][interval]') === 'month' && f.get('line_items[0][price_data][unit_amount]') === '7000' && f.get('line_items[0][quantity]') === '15', 'subscription form');
ok(f.get('subscription_data[metadata][tier]') === 'T4' && f.get('client_reference_id') === 'Acme_Dental' && f.get('tax_id_collection[enabled]') === 'true' && f.get('billing_address_collection') === 'required', 'metadata, address, VAT');
f = sessionForm(resolve({ p: 'PB-010' }, Date.now(), env));
ok(f.get('mode') === 'payment' && f.get('payment_intent_data[metadata][package]') === 'PB-010' && !f.has('line_items[0][price_data][recurring][interval]'), 'one-off form');

// 7. The handler: redirects, fallbacks and the live-key guard.
function call(url, e = {}) {
  return new Promise((done) => {
    const saved = { ...process.env }; Object.assign(process.env, { STRIPE_SECRET_KEY: '', CHECKOUT_LIVE: '', CHECKOUT_SIGNING_SECRET: SECRET }, e);
    const res = { code: 200, h: {}, status(c) { this.code = c; return this; }, setHeader(k, v) { this.h[k.toLowerCase()] = v; return this; }, end(b) { process.env = saved; done({ code: this.code, h: this.h, body: b || '' }); } };
    handler({ method: 'GET', url }, res);
  });
}
const qs = (o) => '/api/checkout?' + new URLSearchParams(o);
let sent = null; globalThis.fetch = async (u, o) => { sent = { u, form: new URLSearchParams(o.body.toString()), auth: o.headers.Authorization }; return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_x' }) }; };
let x = await call(qs({ p: 'PB-003' })); ok(x.code === 302 && x.h.location === PACKAGES['PB-003'].link && x.h['cache-control'] === 'no-store', 'no key: public falls back to today\'s link');
x = await call(qs(link({ p: 'PB-003', t: 'T4', k: 'ZA' }))); ok(x.code === 503 && /opening soon/.test(x.body), 'no key: client link waits');
x = await call(qs(link({ p: 'PB-003', t: 'T4', k: 'ZA', c: 'Acme' })), { STRIPE_SECRET_KEY: 'sk_test_123' });
ok(x.code === 303 && x.h.location.startsWith('https://checkout.stripe.com/') && sent.form.get('line_items[0][price_data][unit_amount]') === '225000' && sent.auth === 'Bearer sk_test_123', 'test key: Stripe session for T4 $2,250');
sent = null; x = await call(qs({ p: 'PB-003' }), { STRIPE_SECRET_KEY: 'sk_live_123' }); ok(x.code === 503 && sent === null, 'live key blocked until CHECKOUT_LIVE=on');
x = await call(qs({ p: 'PB-003' }), { STRIPE_SECRET_KEY: 'sk_live_123', CHECKOUT_LIVE: 'on' }); ok(x.code === 303, 'live allowed once switched on');
x = await call(qs({ p: 'PB-003', t: 'T5' }), { STRIPE_SECRET_KEY: 'sk_test_123' }); ok(x.code === 403 && /proposal/.test(x.body), 'unsigned tier shows a plain page');
x = await call(qs({ p: 'NOPE' })); ok(x.code === 404, 'unknown package');
globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'bad' } }) });
x = await call(qs({ p: 'PB-003' }), { STRIPE_SECRET_KEY: 'sk_test_123' }); ok(x.code === 502, 'Stripe error shows a retry page');

console.log(`All ${n} checks passed (${fixed} signed tier links checked against the price book${book ? `, and ${priced} fixed prices against the exported book` : ''}).`);
