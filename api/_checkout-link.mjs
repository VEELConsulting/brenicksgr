// Makes a client's own checkout link from their proposal. Needs CHECKOUT_SIGNING_SECRET (the same value as on Vercel).
//   node api/_checkout-link.mjs --package PB-003 --tier T4 --country ZA --client "Acme Dental" [--users 12] [--amount 18000] [--days 30] --sanctions-checked
// --amount is in US dollars, only for scoped work (AI Pilot, AI Implementation). Prints the link; send it with the proposal.
import { PACKAGES, MARKETS } from './_pricebook.js';
import { sign } from './_checkout-sign.js';
import { resolve } from './checkout.js';

const a = {}; const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); a[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
const die = (m) => { console.error(m); process.exit(1); };
const secret = process.env.CHECKOUT_SIGNING_SECRET; if (!secret) die('Set CHECKOUT_SIGNING_SECRET first.');
if (!PACKAGES[a.package]) die('Unknown --package. One of: ' + Object.keys(PACKAGES).join(', '));
const k = String(a.country || '').toUpperCase(); if (!/^[A-Z]{2}$/.test(k)) die('Give --country as a two-letter code, for example ZA.');
if (k !== 'US' && !a['sanctions-checked']) die('Outside the US: screen the client and its owners against the OFAC list first, then add --sanctions-checked.');
const t = a.tier || MARKETS[k] || 'T1';
if (t !== 'T1' && MARKETS[k] !== t) die(`${k} is not open at ${t}. Open markets: ${JSON.stringify(MARKETS)}. Firms over 200 staff, billing in US dollars, or headquartered in a T1 country pay T1.`);
const o = { p: a.package, t, q: a.users || '', a: a.amount ? Math.round(Number(a.amount) * 100) : '', k, c: String(a.client || '').replace(/[^\w.\-:@ ]/g, '').slice(0, 120), exp: Math.floor(Date.now() / 1000) + 86400 * Number(a.days || 30) };
o.sig = sign(o, secret);
const r = resolve(o, Date.now(), { CHECKOUT_SIGNING_SECRET: secret }); if (r.error) die(r.error);
const u = new URL('https://brenicks.com/api/checkout'); for (const [x, v] of Object.entries(o)) if (v !== '') u.searchParams.set(x, v);
console.log(`${r.pkg.name}, ${t}, ${r.qty} x $${(r.amount / 100).toLocaleString('en-US')}${r.pkg.monthly ? ' a month' : ''} for ${o.c || 'the client'} (${k}); link valid ${a.days || 30} days:\n${u}`);
