// Checkout at the visitor's market price. In the US and every T1 market, and whenever market pricing is off, this
// sends the buyer to the package's existing Stripe payment link, so nothing changes there. Elsewhere it opens a
// Stripe Checkout for the tier price in US dollars; with Adaptive Pricing switched on in Stripe, the buyer pays in
// their own currency and Brenicks receives dollars. Billing address and tax ID are collected so the Treasurer can
// confirm the business country (the tier follows the business, not the browser).
// Needs STRIPE_SECRET_KEY in Vercel before market pricing goes live.
import { PRICING, priceFor, localFor } from './_prices.js';

const SITE = 'https://brenicks.com';
const back = (pkg) => (pkg.startsWith('web') ? '/web-design/' : pkg.startsWith('sf') ? '/salesforce/' : pkg.startsWith('ai-ops') ? '/ai-implementation/operations/' : pkg.startsWith('ai-pilot') ? '/ai-implementation/pilot/' : '/ai-implementation/assessment/');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  const id = String((req.query && req.query.pkg) || '').replace(/[^a-z0-9-]/g, '');
  const p = PRICING.packages[id];
  if (!p || !p.link) { res.redirect(302, '/contact/'); return; }
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);
  const m = localFor(country);
  if (m.closed) { res.redirect(302, '/contact/?market=closed'); return; }
  if (!m.live || !process.env.STRIPE_SECRET_KEY) { res.redirect(302, p.link); return; }
  const usd = priceFor(id, m.tier);
  const monthly = /month/.test(p.unit), perUser = /user/.test(p.unit);
  const users = perUser ? Math.max(p.min || 1, Math.min(500, parseInt((req.query && req.query.users) || p.min || 1, 10) || p.min || 1)) : 1;
  const f = new URLSearchParams();
  f.set('mode', monthly ? 'subscription' : 'payment');
  f.set('line_items[0][quantity]', String(users));
  f.set('line_items[0][price_data][currency]', 'usd');
  f.set('line_items[0][price_data][unit_amount]', String(Math.round(usd * 100)));
  f.set('line_items[0][price_data][product_data][name]', p.name + (perUser ? ' (per user)' : ''));
  if (monthly) f.set('line_items[0][price_data][recurring][interval]', 'month');
  f.set('billing_address_collection', 'required');
  f.set('tax_id_collection[enabled]', 'true');
  f.set('metadata[package]', id); f.set('metadata[tier]', m.tier); f.set('metadata[country]', country);
  f.set('success_url', SITE + back(id) + '?paid=1');
  f.set('cancel_url', SITE + back(id));
  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }, body: f });
    const j = await r.json();
    if (j.url) { res.redirect(303, j.url); return; }
  } catch { /* fall back below */ }
  res.redirect(302, p.link);
}
