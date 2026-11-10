// The chat's knowledge base: everything the website chat may say, kept in the database so the Chat Experience team
// can improve it through /api/kb without anyone uploading code. DEFAULT_KB is the fallback until the first publish.
// Grounding rule: the chat only talks about what Brenicks offers, and every price in the knowledge base must appear
// on brenicks.com's own service pages at the moment it is published (checked in api/kb.js).
import { redis } from './_redis.js';

export const BOOKING = process.env.BOOKING_URL || 'https://calendly.com/thebrenicksgroup/website-consultation';
export const SERVICE_PAGES = ['https://brenicks.com/web-design/', 'https://brenicks.com/salesforce/', 'https://brenicks.com/ai-implementation/'];

export const DEFAULT_KB = {
  version: 1,
  updated: '2026-11-10T17:00:00Z',
  approved_by: 'Lionel (initial)',
  company: 'The Brenicks Group is a boutique consultancy, founded in 2018, for ambitious small and mid-size businesses, with a focus on professional-services firms (law, accounting, consulting). Three services: AI implementation, Salesforce consulting and web design. 50+ projects delivered. The person who scopes a project builds it. Every engagement ends with full ownership. Contact: hello@brenicks.com, +1 919 298 1808, replies within 24 hours.',
  greeting: 'Hello. Ask me about The Brenicks Group, our websites, Salesforce or AI work, or what it costs. What are you working on?',
  hello: 'Hello! Are you looking at your website, Salesforce or AI for your business? Tell me a little about what you need and I can point you to the right package and price.',
  starting_points: 'We quote by scope, and our published ranges are: websites $500 to $9,000 (care plans $300 to $600 a month); Salesforce $100 to $500 per user, minimum 10 users (care $150 per user a month); AI projects $2,000 to $150,000+ (operations $2,000 to $10,000 a month). Which one are you looking at, and how big is your team or site?',
  fallback: 'Thanks for your message. Lionel reads every conversation and follows up personally.',
  off_topic: 'I can only help with The Brenicks Group and what we do: AI implementation, Salesforce consulting and web design. Is one of those on your mind?',
  quote_note: 'The exact figure comes after a short call',
  services: {
    web: { page: 'https://brenicks.com/web-design/', name: 'web design', range: 'We quote by scope, but website projects range from $500 (an audit) to $9,000 (a 12-page build), and care plans run $300 to $600 a month.', about: 'We design and rebuild fast, clear websites built to turn visitors into enquiries.', start: 'audit',
      keywords: 'web ?site|web ?design|\\bsite\\b|pages?\\b|seo|landing|redesign|wordpress|shopify|squarespace|wix|homepage',
      audit: [['Site Audit — Standard', '$500 flat', '3 days, sites up to 10 pages', 10], ['Site Audit — Extended', '$900 flat', '5 days, sites of 11–30 pages', 30]],
      build: [['Website Starter', '$5,000 flat', '3–4 weeks, up to 5 custom pages', 5], ['Website Growth', '$9,000 flat', '5–7 weeks, up to 12 pages with a CMS', 12]],
      retainer: [['Care Plan — Standard', '$300/month', 'hosting, monitoring, backups and up to 2 hours of edits, sites up to 10 pages', 10], ['Care Plan — Extended', '$600/month', 'up to 5 hours of edits, sites of 11–30 pages', 30]] },
    salesforce: { page: 'https://brenicks.com/salesforce/', name: 'Salesforce', range: 'We quote by scope, but Salesforce work ranges from $100 to $500 per user (minimum 10 users), and ongoing care is $150 per user a month.', about: 'We set up, connect and improve Salesforce: data model, automations, integrations and migration.', start: 'audit',
      keywords: 'salesforce|\\bcrm\\b|sfdc|users?\\b|licen[cs]es?|seats?', per_user: { audit: 100, build: 500, retainer: 150 }, min_users: 10,
      audit: [['Org Audit', '$100 per user', '1 week, minimum 10 users']], build: [['Quick Setup', '$500 per user', '2–3 weeks, minimum 10 users']], retainer: [['Care Retainer', '$150 per user per month', 'minimum 10 users']] },
    ai: { page: 'https://brenicks.com/ai-implementation/', name: 'AI implementation', range: 'We quote by scope, but AI projects range from $2,000 (a readiness assessment) to $150,000+ (a firm-wide rollout), and AI operations run $2,000 to $10,000 a month.', about: 'We build AI tools that take repetitive work off your team, like drafting, knowledge search and proposals, on your real data.', start: 'audit',
      keywords: '\\bai\\b|a\\.i\\.|artificial|automat|agents?\\b|chat ?bot|gpt|claude|copilot|llm|machine learning|document|proposal|intake|knowledge',
      audit: [['AI Readiness Assessment', '$2,000–$5,000', '2 weeks: workflow audit, ranked AI opportunities and an ROI estimate']],
      build: [['AI Pilot', '$10,000–$30,000', '4–8 weeks: one working tool on your real data'], ['AI Implementation', '$30,000–$150,000+', 'firm-wide rollout, copilots and custom agents']],
      retainer: [['AI Operations', '$2,000–$10,000/month', 'monitoring, model updates and new automations']] },
  },
  // Extra answers the team adds over time: {id, match (a regular expression, case-insensitive), answer, service?}
  faqs: [
    { id: 'history', match: 'how long (have|has|are)|in business|been around|founded|established|since when|when did (you|brenicks|the company) (start|begin)|how old|years (of experience|in)', answer: 'The Brenicks Group was founded in 2018 and has delivered 50+ projects since then.' },
    { id: 'about', match: 'who (are|is) (you|brenicks|the brenicks)|what (is|does) (brenicks|the brenicks|your company)|about (you|the company|brenicks|your (firm|company))|tell me about', answer: 'The Brenicks Group is a boutique consultancy for ambitious small and mid-size businesses, with a focus on professional-services firms like law, accounting and consulting. We do three things: AI implementation, Salesforce consulting and web design. The person who scopes your project is the person who builds it.' },
    { id: 'name', match: 'what does (brenicks|the name) mean|why (the name )?brenicks|name brenicks|meaning of', answer: 'Brenicks is a pure brand name: no acronym. It stands for the standard we hold our work to, uncommon quality in everything we produce.' },
    { id: 'who-builds', match: 'who (will|would|actually) (do|build|work|ship)|your team|how many (people|employees|staff)|outsourc|junior', answer: 'The person who scopes your project is the person who builds it: no rotating team and no hand-offs to a junior bench.' },
    { id: 'clients', match: 'who do you work with|what (kind|type)s? of (clients|businesses|companies)|industr|law firm|accounting firm|consulting firm|professional services', answer: 'We work with ambitious small and mid-size businesses, especially professional-services firms such as law, accounting and consulting practices.' },
    { id: 'work', match: 'portfolio|examples?|case stud|past (work|projects)|clients you|projects (have you|you have)|work you.?ve done', answer: "We've delivered 50+ projects. Selected work on our homepage includes Oceanis Yachts and Pinnacle Resorts (web design) and Maison Étoile (Salesforce)." },
    { id: 'ownership', match: 'own (the|it)|ownership|source code|intellectual property|documentation|lock.?in', answer: 'Every engagement ends with full ownership: the system, the documentation and the knowledge to run it without us.' },
    { id: 'contact', match: 'phone|number|email (address)?|contact|reach (you|someone)|get in touch', answer: 'Email hello@brenicks.com or call +1 919 298 1808. We reply within 24 hours.' },
    { id: 'location', match: 'where are you|located|based|raleigh|remote|office', answer: 'We are based in Raleigh, North Carolina, and work with clients remotely.' },
    { id: 'timeline', match: 'how long (does|will|would|to)|timeline|turnaround|how soon|how many weeks|how quickly', answer: 'Timelines depend on the package: website audits take 3–5 days, new websites 3–7 weeks, a Salesforce Quick Setup 2–3 weeks and an AI Pilot 4–8 weeks.' },
  ],
};

let cache = { at: 0, kb: null };
export async function loadKb() {
  if (cache.kb && Date.now() - cache.at < 60000) return cache.kb;
  try { const [v] = await redis([['GET', 'kb:live']]); cache = { at: Date.now(), kb: v ? JSON.parse(v) : DEFAULT_KB }; } catch (e) { cache = { at: Date.now(), kb: cache.kb || DEFAULT_KB }; }
  return cache.kb;
}
export const clearKbCache = () => { cache = { at: 0, kb: null }; };
