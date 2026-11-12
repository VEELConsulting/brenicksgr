// Google reviews for brenicks.com, from Places API (New) Place Details.
// Needs GOOGLE_PLACES_API_KEY (restricted to Places API (New)) and GOOGLE_PLACE_ID in Vercel.
// Google returns up to 5 reviews, sorted by relevance. One Google call per hour at most (Redis + CDN cache),
// which stays inside the 1,000 free Place Details Enterprise + Atmosphere calls a month.
import { redis } from './_redis.js';

const KEY = 'reviews:google:v1';
const TTL = 3600;
const REVIEW_URL = 'https://g.page/r/CaEH9JWm6X88EAI/review';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const key = process.env.GOOGLE_PLACES_API_KEY, place = process.env.GOOGLE_PLACE_ID;
  if (!key || !place) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(JSON.stringify({ configured: false, reviewUrl: REVIEW_URL })); }
  try {
    try { const [hit] = await redis([['GET', KEY]]); if (hit) { res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600'); return res.status(200).send(hit); } } catch (e) { /* no cache: go to Google */ }
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
    try { await redis([['SET', KEY, out, 'EX', String(TTL)]]); } catch (e) { /* cache optional */ }
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).send(out);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(JSON.stringify({ configured: true, error: String(e.message || e), reviewUrl: REVIEW_URL }));
  }
}
