// Brenicks global price book (MKT-001, filed Nov 15, 2026). One source for the pages, the checkout and the chat.
// Prices are US dollars. A country's tier sets the share of the anchor (US) price; rules keep some items fixed.
// Tiers come from World Bank GDP per person (2025), as filed in MKT-001; reviewed each July. Edit here and in the Archives together.
export const PRICING = {
  // Switched off until Lionel says go: set GLOBAL_PRICING=on in Vercel to turn it on, remove it to turn it off.
  enabled: (typeof process !== 'undefined' && process.env.GLOBAL_PRICING) === 'on',
  // Launch markets (council amendment 3): GLOBAL_PRICING_MARKETS=ZA,IE,MX,ES limits it to those countries.
  // Empty = every non-T1 country once enabled.
  markets: String((typeof process !== 'undefined' && process.env.GLOBAL_PRICING_MARKETS) || '').toUpperCase().split(',').map((s) => s.trim()).filter(Boolean),
  candidates: ['ZA', 'IE', 'MX', 'ES'],
  floor: 0.35,
  tiers: {
    T1: { name: 'Anchor', k: 1.0 },
    T2: { name: 'Prime', k: 0.8 },
    T3: { name: 'Growth', k: 0.6 },
    T4: { name: 'Emerging', k: 0.45 },
    T5: { name: 'Frontier', k: 0.35 },
  },
  // rule: 'local' drops with the tier; 'floor60' never below 60%; 'fixed' same everywhere.
  // cost_floor: council amendment 1, set by the Treasurer from real delivery hours (US dollars); null until set.
  packages: {
    'web-audit-std':   { name: 'Site Audit: Standard', usd: 500, unit: 'one-time', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_28EbJ19Frglefrw77P0480b' },
    'web-audit-ext':   { name: 'Site Audit: Extended', usd: 900, unit: 'one-time', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_aFa8wP2cZ1qk2EK0Jr0480c' },
    'web-starter':     { name: 'Website Starter', usd: 5000, unit: 'one-time', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_5kQcN59Frgle0wCfEl0480d' },
    'web-growth':      { name: 'Website Growth', usd: 9000, unit: 'one-time', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_5kQ8wPg3P6KEfrwcs90480e' },
    'web-care-std':    { name: 'Care Plan: Standard', usd: 300, unit: 'month', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_4gMeVdeZL6KE938bo50480f' },
    'web-care-ext':    { name: 'Care Plan: Extended', usd: 600, unit: 'month', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_aFa00j6tf6KE938cs90480g' },
    'sf-audit':        { name: 'Salesforce Org Audit', usd: 100, unit: 'user', min: 10, rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_00waEX2cZed6frwak10480i' },
    'sf-setup':        { name: 'Salesforce Quick Setup', usd: 500, unit: 'user', min: 10, rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_bJefZh5pb3ysdjo2Rz0480k' },
    'sf-care':         { name: 'Salesforce Care Retainer', usd: 150, unit: 'user-month', min: 10, rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_28EfZh3h38SM93877P0480l' },
    'ai-assess-std':   { name: 'AI Readiness Assessment: Standard', usd: 2500, unit: 'one-time', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_eVqaEXeZLc4Ybbgak104800' },
    'ai-assess-full':  { name: 'AI Readiness Assessment: Full', usd: 4500, unit: 'one-time', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_4gMcN5cRD3ysa7c8bT04801' },
    'ai-pilot-from':   { name: 'AI Pilot (from)', usd: 10000, unit: 'one-time', rule: 'floor60', cost_floor: null },
    'ai-pilot-to':     { name: 'AI Pilot (up to)', usd: 30000, unit: 'one-time', rule: 'floor60', cost_floor: null },
    'ai-pilot-deposit':{ name: 'AI Pilot deposit', usd: 2500, unit: 'one-time', rule: 'floor60', cost_floor: null, link: 'https://buy.stripe.com/test_6oU28reZL4Cwa7cak104802' },
    'ai-ops-keep':     { name: 'AI Operations: Keep', usd: 750, unit: 'month', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_9B600jeZLfha7Z4ak10480m' },
    'ai-ops-run':      { name: 'AI Operations: Run', usd: 2000, unit: 'month', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_28E9AT6tfglegvA0Jr0480n' },
    'ai-ops-grow':     { name: 'AI Operations: Grow', usd: 3500, unit: 'month', rule: 'local', cost_floor: null, link: 'https://buy.stripe.com/test_5kQcN56tf8SM3IO2Rz0480o' },
    'ai-implementation': { name: 'AI Implementation', usd: 30000, unit: 'scoped', rule: 'fixed', cost_floor: null },
  },
  // Markets closed by US sanctions: pages show, checkout does not (see MKT-001).
  closed: ['CU', 'IR', 'KP', 'RU'],
  tierOf: {"AD":"T1","AE":"T1","AF":"T5","AG":"T3","AL":"T3","AM":"T4","AO":"T5","AR":"T3","AS":"T3","AT":"T1","AU":"T1","AW":"T2","AZ":"T4","BA":"T3","BB":"T2","BD":"T5","BE":"T1","BF":"T5","BG":"T3","BH":"T2","BI":"T5","BJ":"T5","BM":"T1","BN":"T2","BO":"T4","BR":"T3","BS":"T2","BT":"T4","BW":"T4","BY":"T3","BZ":"T4","CA":"T1","CD":"T5","CF":"T5","CG":"T5","CH":"T1","CI":"T5","CL":"T3","CM":"T5","CN":"T3","CO":"T4","CR":"T3","CU":"T4","CV":"T4","CW":"T3","CY":"T2","CZ":"T2","DE":"T1","DJ":"T5","DK":"T1","DM":"T3","DO":"T3","DZ":"T4","EC":"T4","EE":"T2","EG":"T5","ER":"T5","ES":"T2","ET":"T5","FI":"T1","FJ":"T4","FM":"T4","FO":"T1","FR":"T1","GA":"T4","GB":"T1","GD":"T3","GE":"T4","GH":"T5","GI":"T2","GL":"T1","GM":"T5","GN":"T5","GQ":"T4","GR":"T2","GT":"T4","GU":"T2","GW":"T5","GY":"T2","HK":"T1","HN":"T5","HR":"T2","HT":"T5","HU":"T2","ID":"T4","IE":"T1","IL":"T1","IM":"T1","IN":"T5","IQ":"T4","IR":"T5","IS":"T1","IT":"T2","JG":"T1","JM":"T4","JO":"T4","JP":"T2","KE":"T5","KG":"T5","KH":"T5","KI":"T5","KM":"T5","KN":"T2","KP":"T5","KR":"T2","KW":"T2","KY":"T1","KZ":"T3","LA":"T5","LB":"T4","LC":"T3","LI":"T1","LK":"T4","LR":"T5","LS":"T5","LT":"T2","LU":"T1","LV":"T2","LY":"T4","MA":"T4","MC":"T1","MD":"T4","ME":"T3","MF":"T3","MG":"T5","MH":"T4","MK":"T3","ML":"T5","MM":"T5","MN":"T4","MO":"T1","MP":"T3","MR":"T5","MT":"T1","MU":"T3","MV":"T3","MW":"T5","MX":"T3","MY":"T3","MZ":"T5","NA":"T4","NC":"T2","NE":"T5","NG":"T5","NI":"T5","NL":"T1","NO":"T1","NP":"T5","NR":"T3","NZ":"T1","OM":"T3","PA":"T3","PE":"T4","PF":"T3","PG":"T5","PH":"T4","PK":"T5","PL":"T2","PR":"T2","PS":"T5","PT":"T2","PW":"T3","PY":"T4","QA":"T1","RO":"T3","RS":"T3","RU":"T3","RW":"T5","SA":"T2","SB":"T5","SC":"T3","SD":"T5","SE":"T1","SG":"T1","SI":"T2","SK":"T2","SL":"T5","SM":"T1","SN":"T5","SO":"T5","SR":"T4","SS":"T5","ST":"T4","SV":"T4","SX":"T2","SY":"T5","SZ":"T4","TC":"T2","TD":"T5","TG":"T5","TH":"T4","TJ":"T5","TL":"T5","TM":"T4","TN":"T4","TO":"T4","TR":"T3","TT":"T3","TV":"T4","TW":"T2","TZ":"T5","UA":"T4","UG":"T5","US":"T1","UY":"T2","UZ":"T5","VC":"T3","VE":"T5","VG":"T2","VI":"T2","VN":"T4","VU":"T4","WS":"T4","XK":"T4","YE":"T5","ZA":"T4","ZM":"T5","ZW":"T5"},
  currencyOf: {"AD":"EUR","AE":"AED","AF":"AFN","AG":"XCD","AI":"XCD","AL":"ALL","AM":"AMD","AO":"AOA","AR":"ARS","AS":"USD","AT":"EUR","AU":"AUD","AW":"AWG","AX":"EUR","AZ":"AZN","BA":"BAM","BB":"BBD","BD":"BDT","BE":"EUR","BF":"XOF","BG":"BGN","BH":"BHD","BI":"BIF","BJ":"XOF","BL":"EUR","BM":"BMD","BN":"BND","BO":"BOB","BQ":"USD","BR":"BRL","BS":"BSD","BT":"BTN","BW":"BWP","BY":"BYN","BZ":"BZD","CA":"CAD","CC":"AUD","CD":"CDF","CF":"XAF","CG":"XAF","CH":"CHF","CI":"XOF","CK":"CKD","CL":"CLP","CM":"XAF","CN":"CNY","CO":"COP","CR":"CRC","CU":"CUC","CV":"CVE","CW":"ANG","CX":"AUD","CY":"EUR","CZ":"CZK","DE":"EUR","DJ":"DJF","DK":"DKK","DM":"XCD","DO":"DOP","DZ":"DZD","EC":"USD","EE":"EUR","EG":"EGP","EH":"DZD","ER":"ERN","ES":"EUR","ET":"ETB","FI":"EUR","FJ":"FJD","FK":"FKP","FM":"USD","FO":"DKK","FR":"EUR","GA":"XAF","GB":"GBP","GD":"XCD","GE":"GEL","GF":"EUR","GG":"GBP","GH":"GHS","GI":"GIP","GL":"DKK","GM":"GMD","GN":"GNF","GP":"EUR","GQ":"XAF","GR":"EUR","GS":"SHP","GT":"GTQ","GU":"USD","GW":"XOF","GY":"GYD","HK":"HKD","HN":"HNL","HR":"EUR","HT":"HTG","HU":"HUF","ID":"IDR","IE":"EUR","IL":"ILS","IM":"GBP","IN":"INR","IO":"USD","IQ":"IQD","IR":"IRR","IS":"ISK","IT":"EUR","JE":"GBP","JG":"GBP","JM":"JMD","JO":"JOD","JP":"JPY","KE":"KES","KG":"KGS","KH":"KHR","KI":"AUD","KM":"KMF","KN":"XCD","KP":"KPW","KR":"KRW","KW":"KWD","KY":"KYD","KZ":"KZT","LA":"LAK","LB":"LBP","LC":"XCD","LI":"CHF","LK":"LKR","LR":"LRD","LS":"LSL","LT":"EUR","LU":"EUR","LV":"EUR","LY":"LYD","MA":"MAD","MC":"EUR","MD":"MDL","ME":"EUR","MF":"EUR","MG":"MGA","MH":"USD","MK":"MKD","ML":"XOF","MM":"MMK","MN":"MNT","MO":"MOP","MP":"USD","MQ":"EUR","MR":"MRU","MS":"XCD","MT":"EUR","MU":"MUR","MV":"MVR","MW":"MWK","MX":"MXN","MY":"MYR","MZ":"MZN","NA":"NAD","NC":"XPF","NE":"XOF","NF":"AUD","NG":"NGN","NI":"NIO","NL":"EUR","NO":"NOK","NP":"NPR","NR":"AUD","NU":"NZD","NZ":"NZD","OM":"OMR","PA":"USD","PE":"PEN","PF":"XPF","PG":"PGK","PH":"PHP","PK":"PKR","PL":"PLN","PM":"EUR","PN":"NZD","PR":"USD","PS":"EGP","PT":"EUR","PW":"USD","PY":"PYG","QA":"QAR","RE":"EUR","RO":"RON","RS":"RSD","RU":"RUB","RW":"RWF","SA":"SAR","SB":"SBD","SC":"SCR","SD":"SDG","SE":"SEK","SG":"SGD","SH":"GBP","SI":"EUR","SJ":"NOK","SK":"EUR","SL":"SLL","SM":"EUR","SN":"XOF","SO":"SOS","SR":"SRD","SS":"SSP","ST":"STN","SV":"USD","SX":"ANG","SY":"SYP","SZ":"SZL","TC":"USD","TD":"XAF","TF":"EUR","TG":"XOF","TH":"THB","TJ":"TJS","TK":"NZD","TL":"USD","TM":"TMT","TN":"TND","TO":"TOP","TR":"TRY","TT":"TTD","TV":"AUD","TW":"TWD","TZ":"TZS","UA":"UAH","UG":"UGX","UM":"USD","US":"USD","UY":"UYU","UZ":"UZS","VA":"EUR","VC":"XCD","VE":"VES","VG":"USD","VI":"USD","VN":"VND","VU":"VUV","WF":"XPF","WS":"WST","XK":"EUR","YE":"YER","YT":"EUR","ZA":"ZAR","ZM":"ZMW","ZW":"USD"},
};

// Clean steps: $5 under $100, $25 under $1,000, $50 under $10,000, $500 above.
export const roundPrice = (v) => { const step = v < 100 ? 5 : v < 1000 ? 25 : v < 10000 ? 50 : 500; return Math.round(v / step) * step; };
export const tierFor = (country) => PRICING.tierOf[String(country || '').toUpperCase()] || 'T1';
export const priceFor = (id, tier) => {
  const p = PRICING.packages[id]; if (!p) return null;
  const k = PRICING.tiers[tier] ? PRICING.tiers[tier].k : 1;
  if (p.rule === 'fixed' || k >= 1) return p.usd;
  const share = Math.max(p.rule === 'floor60' ? 0.6 : PRICING.floor, k);
  let v = roundPrice(p.usd * share);
  if (p.cost_floor) v = Math.max(v, p.cost_floor);
  return v;
};
// Is market pricing live for this visitor's country?
export const localFor = (country) => {
  const c = String(country || '').toUpperCase(), tier = tierFor(c);
  const on = PRICING.enabled && tier !== 'T1' && !PRICING.closed.includes(c) && (!PRICING.markets.length || PRICING.markets.includes(c));
  return { country: c || null, tier: on ? tier : 'T1', live: on, closed: PRICING.closed.includes(c) };
};
