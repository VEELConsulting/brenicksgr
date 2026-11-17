// Signs and checks client checkout links. A link at a tier other than T1, or with a quoted amount, is only honoured
// when signed with CHECKOUT_SIGNING_SECRET, so a visitor cannot pick a cheaper tier by editing the address.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const FIELDS = ['p', 't', 'q', 'a', 'k', 'c', 'exp']; // package, tier, quantity, amount (cents), country, client ref, expiry (unix s)
const canon = (o) => FIELDS.map((f) => f + '=' + (o[f] == null ? '' : String(o[f]))).join('&');
export const sign = (o, secret) => createHmac('sha256', secret).update(canon(o)).digest('base64url');
export function verify(o, sig, secret) {
  if (!secret || !sig) return false;
  const want = Buffer.from(sign(o, secret)), got = Buffer.from(String(sig));
  return want.length === got.length && timingSafeEqual(want, got);
}
