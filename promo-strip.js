/* Brenicks promo strip. One file, no dependencies.
   Usage: <script src="/promo-strip.js" data-site="certdepo.com" defer></script>
   The marketing desk edits PROMOS; a promotion shows only when approved is true,
   the current time is inside its window, and its sites list includes this site.
   Sites with a fixed header add data-push="<selector>": the strip then pins to the
   top above that header and moves it (and the page) down by the strip's height,
   and sets --bps-h on <html> for any other fixed piece the site wants to move. */
(function () {
  var PROMOS = [
    {
      id: "BF26",
      approved: false, // Lionel approved BF26 on 18 Nov 2026; switch to true once code BF49 exists in Stripe
      start: "2026-11-27T00:00:00-05:00",
      end: "2026-12-01T23:59:59-05:00",
      code: "BF49", // Stripe promotion code, created by Lionel
      href: "https://certdepo.com/?promo=BF49",
      copy: {
        "certdepo.com": { label: "Black Friday", text: "A full year of CertDepo for $49, normally $70.", cta: "Get the deal" },
        "brenicks.com": { label: "Black Friday", text: "CertDepo, our Salesforce cert prep: one year for $49, normally $70.", cta: "See CertDepo" },
        "lionelkmunyuki.com": { label: "Black Friday", text: "I built CertDepo for Salesforce cert prep. One year for $49 this week.", cta: "Take a look" }
      }
    }
  ];

  var me = document.currentScript;
  var site = (me && me.dataset.site) || location.hostname.replace(/^www\./, "");
  var now = Date.now();
  var p = PROMOS.find(function (x) {
    return x.approved && x.copy[site] && now >= Date.parse(x.start) && now <= Date.parse(x.end);
  });
  if (!p) return;
  var key = "promo-strip-closed-" + p.id;
  try { if (localStorage.getItem(key)) return; } catch (e) {}

  var c = p.copy[site];
  var ends = new Date(p.end).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  var css =
    ".bps{--bps-bg:#101820;--bps-fg:#f4f6f8;--bps-mute:#a9b4c0;--bps-chip:#ffffff1a;--bps-acc:#ffd166;" +
    "position:relative;z-index:9999;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;" +
    "background:var(--bps-bg);color:var(--bps-fg);font:500 14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;" +
    "padding:9px max(44px,env(safe-area-inset-right,0px)) 9px max(16px,env(safe-area-inset-left,0px));text-align:center}" +
    ".bps b{color:var(--bps-acc);font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:12px}" +
    ".bps .t{color:var(--bps-fg)}.bps .e{color:var(--bps-mute);font-size:13px}" +
    ".bps button.code{font:600 13px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:var(--bps-fg);" +
    "background:var(--bps-chip);border:1px dashed var(--bps-mute);border-radius:6px;padding:3px 9px;cursor:pointer}" +
    ".bps a{color:var(--bps-acc);text-decoration:none;font-weight:600;white-space:nowrap}.bps a:hover{text-decoration:underline}" +
    ".bps .x{position:absolute;right:max(8px,env(safe-area-inset-right,0px));top:50%;transform:translateY(-50%);background:none;border:0;" +
    "color:var(--bps-mute);font-size:20px;line-height:1;cursor:pointer;padding:6px}" +
    ".bps button:focus-visible,.bps a:focus-visible{outline:2px solid var(--bps-acc);outline-offset:2px}" +
    "@media (max-width:520px){.bps{font-size:13px;gap:8px}.bps .e{display:none}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var bar = document.createElement("div");
  bar.className = "bps"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Promotion");
  bar.innerHTML =
    "<b></b><span class='t'></span>" +
    "<button class='code' type='button' title='Copy code'></button>" +
    "<span class='e'></span><a></a>" +
    "<button class='x' type='button' aria-label='Close promotion'>×</button>";
  bar.querySelector("b").textContent = c.label;
  bar.querySelector(".t").textContent = c.text;
  var codeBtn = bar.querySelector(".code"); codeBtn.textContent = "Code " + p.code;
  bar.querySelector(".e").textContent = "Ends " + ends;
  var a = bar.querySelector("a"); a.href = p.href; a.textContent = c.cta + " →";
  var push = me && me.dataset.push ? [].slice.call(document.querySelectorAll(me.dataset.push)) : [];
  var basePad = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
  var fit = function () {
    var h = bar.offsetHeight;
    push.forEach(function (el) { el.style.top = h + "px"; });
    document.body.style.paddingTop = (basePad + h) + "px";
    document.documentElement.style.setProperty("--bps-h", h + "px");
  };
  var unfit = function () {
    push.forEach(function (el) { el.style.top = ""; });
    document.body.style.paddingTop = "";
    document.documentElement.style.removeProperty("--bps-h");
  };
  if (push.length) {
    var z = parseInt(getComputedStyle(push[0]).zIndex, 10);
    bar.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:" + (isNaN(z) ? 9999 : z + 1);
  }

  codeBtn.addEventListener("click", function () {
    var done = function () { codeBtn.textContent = "Copied"; setTimeout(function () { codeBtn.textContent = "Code " + p.code; }, 1500); };
    try { navigator.clipboard.writeText(p.code).then(done, function () {}); } catch (e) {}
  });
  bar.querySelector(".x").addEventListener("click", function () {
    bar.remove(); if (push.length) unfit(); try { localStorage.setItem(key, "1"); } catch (e) {}
  });
  document.body.insertBefore(bar, document.body.firstChild);
  if (push.length) { fit(); window.addEventListener("resize", fit); }
})();
