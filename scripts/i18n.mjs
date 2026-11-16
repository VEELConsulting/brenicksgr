// Language pages for brenicks.com (MKT-001, languages wave 1).
//   node scripts/i18n.mjs extract index.html   prints the page's text strings as JSON, for translators
//   node scripts/i18n.mjs build                writes /<lang>/<page> for every catalogue in i18n/<lang>.json
// A catalogue is {lang, name, reviewed, pages: {"index.html": {"English text": "translation", ...}}}.
// A page stays a hidden draft (noindex, no hreflang, not in the language picker) until its catalogue says
// "reviewed": true, which is set only after a native speaker has read it. English is always the reference.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://brenicks.com/';
const SKIP = /<(script|style|svg)\b[\s\S]*?<\/\1>/gi;
const ATTRS = ['content', 'aria-label', 'alt', 'placeholder', 'title'];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const encode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Walk the page, calling fn on each visible text run and each translatable attribute value; returns the new HTML.
function walk(html, fn) {
  const keep = [];
  html = html.replace(SKIP, (m) => { keep.push(m); return `\u0000${keep.length - 1}\u0000`; });
  html = html.replace(/>([^<]+)</g, (m, t) => {
    const core = decode(t).trim();
    if (!core || /\u0000\d+\u0000/.test(core) || !/[A-Za-z]/.test(core)) return m;
    const out = fn(core); if (out == null) return m;
    const lead = t.match(/^\s*/)[0], tail = t.match(/\s*$/)[0];
    return '>' + lead + encode(out) + tail + '<';
  });
  html = html.replace(new RegExp(`\\s(${ATTRS.join('|')})="([^"]*)"`, 'g'), (m, a, v) => {
    if (!v.trim() || (a === 'content' && !/[A-Za-z]{3,} [A-Za-z]/.test(v))) return m;   // only sentence-like meta contents
    const out = fn(decode(v).trim()); return out == null ? m : ` ${a}="${encode(out).replace(/"/g, '&quot;')}"`;
  });
  return html.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
}

const mode = process.argv[2];
if (mode === 'extract') {
  const html = fs.readFileSync(path.join(ROOT, process.argv[3]), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const seen = new Set();
  walk(html, (t) => { seen.add(t); return null; });
  console.log(JSON.stringify(Object.fromEntries([...seen].map((s) => [s, ''])), null, 1));
} else if (mode === 'build') {
  const dir = path.join(ROOT, 'i18n');
  const cats = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  const live = cats.filter((c) => c.reviewed);
  for (const cat of cats) {
    for (const [page, dict] of Object.entries(cat.pages)) {
      let html = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      const missing = new Set();
      html = walk(html, (t) => { if (dict[t]) return dict[t]; if (!(t in dict)) missing.add(t); return null; });
      html = html.replace('<html lang="en"', `<html lang="${cat.lang}"`);
      // the page now sits one folder deeper, so its relative links and files move up one level
      html = html.replace(/\s(href|src)="(?!https?:|\/|#|mailto:|tel:|data:)([^"]+)"/g, (m, a, v) => ` ${a}="../${v}"`);
      const slug = page.replace(/index\.html$/, '');
      const alts = [`<link rel="alternate" hreflang="en" href="${SITE}${slug}" />`].concat(live.map((c) => `<link rel="alternate" hreflang="${c.lang}" href="${SITE}${c.lang}/${slug}" />`));
      const head = cat.reviewed
        ? `  <link rel="canonical" href="${SITE}${cat.lang}/${slug}" />\n  ${alts.join('\n  ')}\n`
        : '  <meta name="robots" content="noindex, nofollow" />\n  <!-- DRAFT: AI translation awaiting native review. Not linked and not indexed. -->\n';
      html = html.replace('</head>', head + '</head>');
      const out = path.join(ROOT, cat.lang, page);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
      console.log(`${cat.lang}/${page}: ${cat.reviewed ? 'live' : 'draft'}${missing.size ? `, ${missing.size} strings not in the catalogue: ${[...missing].slice(0, 6).join(' | ')}` : ''}`);
    }
  }
  // the language picker reads this list; it holds only reviewed languages, so drafts never appear in it
  fs.writeFileSync(path.join(ROOT, 'js', 'languages.json'), JSON.stringify(live.map((c) => ({ lang: c.lang, name: c.name, pages: Object.keys(c.pages) })), null, 1) + '\n');
  console.log(`language picker: ${live.length ? live.map((c) => c.lang).join(', ') : 'hidden (no reviewed language yet)'}`);
} else {
  console.log('usage: node scripts/i18n.mjs extract <page> | build');
}
