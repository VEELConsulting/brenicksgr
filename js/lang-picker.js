/* Language picker: appears in the header only once a translated page has been reviewed by a native speaker
   (js/languages.json, written by scripts/i18n.mjs). Until then it shows nothing. */
(function () {
  var actions = document.querySelector('.nav__actions');
  if (!actions || !window.fetch) return;
  var here = location.pathname, m = here.match(/^\/(es|fr|de|pt|ar|ja|zh|it|nl|ko)\//), cur = m ? m[1] : 'en';
  var page = (m ? here.slice(3) : here).replace(/^\//, '') || 'index.html';
  if (/\/$/.test(page)) page += 'index.html';
  fetch('/js/languages.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (list) {
    list = (list || []).filter(function (l) { return l.pages.indexOf(page) !== -1; });
    if (!list.length) return;
    var all = [{ lang: 'en', name: 'English' }].concat(list);
    var sel = document.createElement('select');
    sel.className = 'nav__lang'; sel.setAttribute('aria-label', 'Language');
    sel.style.cssText = 'background:transparent;color:inherit;border:1px solid var(--c-border,rgba(180,160,120,.25));border-radius:999px;padding:.35rem .6rem;font:inherit;font-size:.8rem;margin-right:.5rem;cursor:pointer';
    all.forEach(function (l) { var o = document.createElement('option'); o.value = l.lang; o.textContent = l.name; if (l.lang === cur) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', function () { var p = page.replace(/index\.html$/, ''); location.href = sel.value === 'en' ? '/' + p : '/' + sel.value + '/' + p; });
    actions.insertBefore(sel, actions.firstChild);
  }).catch(function () {});
})();
