// Shows Google reviews on the page (section #reviews). Stays hidden until Google returns at least one review.
(function () {
  'use strict';
  var box = document.getElementById('reviews'); if (!box) return;
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var stars = function (n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<span aria-hidden="true" style="color:' + (i <= Math.round(n) ? 'var(--c-gold)' : 'var(--c-border)') + '">★</span>'; return s; };
  var safeUrl = function (u) { return /^https:\/\//.test(u || '') ? u : null; };
  fetch('/api/reviews').then(function (r) { return r.json(); }).then(function (d) {
    if (!d || !d.reviews || !d.reviews.length) return;
    var list = d.reviews.map(function (v) {
      var who = safeUrl(v.authorUri) ? '<a href="' + esc(v.authorUri) + '" target="_blank" rel="noopener">' + esc(v.author) + '</a>' : esc(v.author);
      var pic = safeUrl(v.photo) ? '<img src="' + esc(v.photo) + '" alt="" width="36" height="36" loading="lazy" referrerpolicy="no-referrer" style="border-radius:50%">' : '';
      return '<figure class="review-card glass-card"><div class="review-card__stars" role="img" aria-label="' + esc(v.rating) + ' out of 5 stars">' + stars(v.rating) + '</div>' +
        '<blockquote class="review-card__text">' + esc(v.text) + '</blockquote>' +
        '<figcaption class="review-card__who">' + pic + '<span><b>' + who + '</b><br><small>' + esc(v.when) + ' on Google</small></span></figcaption></figure>';
    }).join('');
    var head = '<div class="reviews__summary"><span class="reviews__score">' + esc((d.rating || 0).toFixed(1)) + '</span><span><span class="reviews__stars" role="img" aria-label="' + esc((d.rating || 0).toFixed(1)) + ' out of 5 stars">' + stars(d.rating || 0) + '</span><br><small>' + esc(d.count) + ' Google review' + (d.count === 1 ? '' : 's') + ' · ' + esc(d.sort) + '</small></span></div>';
    var links = '<div class="reviews__links">' + (safeUrl(d.mapsUri) ? '<a class="btn btn--ghost" href="' + esc(d.mapsUri) + '" target="_blank" rel="noopener">Read all reviews on Google</a>' : '') + '<a class="btn btn--primary" href="' + esc(d.reviewUrl) + '" target="_blank" rel="noopener">Worked with us? Leave a review</a></div>';
    box.querySelector('[data-reviews]').innerHTML = head + '<div class="reviews__grid">' + list + '</div>' + links + '<p class="reviews__credit">Reviews from Google. Shown as Google sorts them, unedited.</p>';
    box.hidden = false;
  }).catch(function () {});
})();
