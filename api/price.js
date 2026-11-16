// Market price for this visitor: their country (from Vercel's edge), its tier, the tier's prices in US dollars and an
// approximate rate to their own currency. Never cached: a price shown to one country must never reach another.
// Exchange rates are the European Central Bank's free daily reference rates, kept for 12 hours.
import { redis } from './_redis.js';
import { PRICING, priceFor, localFor } from './_prices.js';

const ECB = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
let memo = { at: 0, rates: null };

// Units of each currency per 1 US dollar, from the ECB's euro rates.
export async function usdRates() {
  if (memo.rates && Date.now() - memo.at < 12 * 3600e3) return memo.rates;
  try { const [v] = await redis([['GET', 'fx:usd']]); if (v) { const j = JSON.parse(v); if (Date.now() - j.at < 12 * 3600e3) { memo = j; return j.rates; } } } catch { /* fall through */ }
  try {
    const xml = await (await fetch(ECB)).text();
    const eur = { EUR: 1 }; for (const m of xml.matchAll(/currency='([A-Z]{3})' rate='([\d.]+)'/g)) eur[m[1]] = +m[2];
    if (!eur.USD) return memo.rates;
    const rates = {}; for (const [c, r] of Object.entries(eur)) rates[c] = r / eur.USD;
    memo = { at: Date.now(), rates };
    try { await redis([['SET', 'fx:usd', JSON.stringify(memo), 'EX', 43200]]); } catch { /* memory copy is enough */ }
    return rates;
  } catch { return memo.rates; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'X-Vercel-IP-Country');
  // ?country=XX previews another market, only where PRICING_PREVIEW is set (staging), never on the live site
  const preview = process.env.PRICING_PREVIEW && req.query && req.query.country;
  const country = String(preview || req.headers['x-vercel-ip-country'] || '').toUpperCase().slice(0, 2);
  const m = localFor(country);
  const prices = {};
  for (const id of Object.keys(PRICING.packages)) prices[id] = priceFor(id, m.tier);
  const currency = PRICING.currencyOf[country] || 'USD';
  let rate = null;
  if (m.live && currency !== 'USD') { const r = await usdRates(); rate = r && r[currency] ? +r[currency].toFixed(4) : null; }
  res.status(200).json({ ...m, enabled: PRICING.enabled, k: PRICING.tiers[m.tier].k, currency, rate, prices, checkout: m.closed ? 'closed' : m.live ? 'market' : 'standard' });
}
