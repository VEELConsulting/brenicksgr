brenicks.com add-on (free mode)

Upload into the brenicks.com GitHub repository, keeping these places:
  api/            -> a folder named "api" at the top of the repository (4 files)
  brenicks-beacon.js, brenicks-chat.js -> top of the repository, next to index.html
  js/main.js      -> replaces the existing js/main.js (same file plus 6 lines at the end that load the two scripts on every page)
  package.json    -> top of the repository. If one already exists, do not replace it: add  "type": "module"  to it instead.

Vercel (brenicks.com project):
  Storage -> Upstash for Redis -> Free -> connect to this project
  Settings -> Environment Variables: DASH_TOKEN (new random 64-character code), ANALYTICS_SALT (another random code)
  Redeploy.
