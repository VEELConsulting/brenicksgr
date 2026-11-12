// Google reviews for brenicks.com, from Places API (New) Place Details.
// Needs GOOGLE_PLACES_API_KEY (restricted to Places API (New)) and GOOGLE_PLACE_ID in Vercel.
// Google returns up to 5 reviews, sorted by relevance. One Google call per hour at most (Redis + CDN cache),
// which stays inside the 1,000 free Place Details Enterprise + Atmosphere calls a month.
// Guard: an hourly lock and a cap of 30 Google calls a day, both in Redis; without Redis it never calls Google.
import { redis, day } from './_redis.js';

const KEY = 'reviews:google:v1';
const LAST = 'reviews:google:last';   // last good copy, kept with no expiry
const LOCK = 'reviews:google:lock';   // one Google call an hour, success or failure
const TTL = 3600;
const DAILY_CAP = 30;                 // 30 a day x 31 days = 930, under the 1,000 free a month
const REVIEW_URL = 'https://g.page/r/CaEH9JWm6X88EAI/review';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const key = process.env.GOOGLE_PLACES_API_KEY, place = process.env.GOOGLE_PLACE_ID;
  if (!key || !place) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(JSON.stringify({ configured: false, reviewUrl: REVIEW_URL })); }
  const stale = (why) => (async () => {
    let last = null; try { [last] = await redis([['GET', LAST]]); } catch (e) { /* none */ }
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).send(last || JSON.stringify({ configured: true, paused: why, reviewUrl: REVIEW_URL }));
  })();
  try {
    // Spending guard: no Redis, no Google call. Every call to Google must pass the hourly lock and the daily cap.
    let hit, gotLock, used;
    try {
      [hit] = await redis([['GET', KEY]]);
      if (hit) { res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600'); return res.status(200).send(hit); }
      const cnt = 'reviews:google:calls:' + day();
      [gotLock, used] = await redis([['SET', LOCK, '1', 'NX', 'EX', String(TTL)], ['INCR', cnt], ['EXPIRE', cnt, '172800']]);
    } catch (e) { return stale('cache unavailable'); }
    if (gotLock !== 'OK') return stale('waiting for the hourly refresh');
    if (Number(used) > DAILY_CAP) return stale('daily cap reached');
    const r = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(place), {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews' }
    });
    if (!r.ok) throw new Error('Google ' + r.status);
    const p = await r.json();
    const out = JSON.stringify({
      configured: true, source: 'Google', sort: 'Most relevant (Google)', fetchedAt: new Date().toISOString(),
      name: p.displayName && p.displayName.text, rating: p.rating || null, count: p.userRatingCount || 0,
      mapsUri: p.googleMapsUri || null, reviewUrl: REVIEW_URL,
      reviews: (p.reviews || []).map((v) => ({
        rating: v.rating, text: (v.originalText && v.originalText.text) || (v.text && v.text.text) || '',
        when: v.relativePublishTimeDescription || '', publishTime: v.publishTime || null,
        author: (v.authorAttribution && v.authorAttribution.displayName) || 'A Google user',
        authorUri: (v.authorAttribution && v.authorAttribution.uri) || null,
        photo: (v.authorAttribution && v.authorAttribution.photoUri) || null,
        reviewUri: v.googleMapsUri || null
      }))
    });
    try { await redis([['SET', KEY, out, 'EX', String(TTL)], ['SET', LAST, out]]); } catch (e) { /* cache optional */ }
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).send(out);
  } catch (e) {
    return stale('Google error: ' + String(e.message || e));
  }
}
