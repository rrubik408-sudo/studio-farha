/* ================================================
   NEWS — fetch data/news.json and render cards
   ================================================ */

(function () {
  'use strict';

  var DATA_URL = 'data/news.json';

  /* ---- Date formatting ---- */
  function formatDate(str) {
    if (!str) return '';
    try {
      var d = new Date(str);
      return d.toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return str;
    }
  }

  /* ---- Sanitise text to prevent XSS ---- */
  function esc(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
  }

  /* ---- Build one card element ---- */
  function buildCard(post) {
    var article = document.createElement('article');
    article.className = 'news-card';
    article.setAttribute('role', 'listitem');

    var imgSrc = post.image ? esc(post.image) : 'img/news/placeholder.jpg';
    var link   = post.link ? esc(post.link) : '';

    var readMore = link
      ? '<a class="news-card-link" href="' + link + '" target="_blank" rel="noopener">'
          + 'Číst více <span class="news-card-link-arrow" aria-hidden="true">→</span>'
        + '</a>'
      : '';

    article.innerHTML =
      '<div class="news-card-figure">'
        + '<img src="' + imgSrc + '" alt="' + esc(post.title || '') + '" loading="lazy">'
      + '</div>'
      + '<div class="news-card-body">'
        + '<div class="news-card-date">' + esc(formatDate(post.date)) + '</div>'
        + '<h3 class="news-card-title">' + esc(post.title || '') + '</h3>'
        + '<p class="news-card-desc">' + esc(post.description || '') + '</p>'
        + readMore
      + '</div>';

    return article;
  }

  /* ---- Animate cards in as they enter viewport ---- */
  function observeCards(cards) {
    if (!('IntersectionObserver' in window)) {
      cards.forEach(function (c) { c.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card  = entry.target;
        var index = parseInt(card.dataset.index, 10) || 0;
        setTimeout(function () {
          card.classList.add('is-visible');
        }, index * 110);
        observer.unobserve(card);
      });
    }, { threshold: 0.08 });

    cards.forEach(function (card) { observer.observe(card); });
  }

  /* ---- Render posts into every .news-grid on the page ---- */
  function render(posts) {
    var grids = document.querySelectorAll('.news-grid');
    if (!grids.length) return;

    var sorted = posts.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 3);

    grids.forEach(function (grid) {
      grid.innerHTML = '';

      if (!sorted.length) {
        var empty = document.createElement('p');
        empty.className = 'news-empty';
        empty.textContent = 'Žádné aktuality zatím nejsou k dispozici.';
        grid.appendChild(empty);
        return;
      }

      var cards = sorted.map(function (post, i) {
        var card = buildCard(post);
        card.dataset.index = i;
        return card;
      });

      cards.forEach(function (card) { grid.appendChild(card); });
      observeCards(cards);
    });
  }

  /* ---- Show loading dots ---- */
  function showLoading(grid) {
    var wrap = document.createElement('div');
    wrap.className = 'news-loading';
    wrap.setAttribute('aria-label', 'Načítám aktuality…');
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement('span');
      dot.className = 'news-loading-dot';
      wrap.appendChild(dot);
    }
    grid.appendChild(wrap);
  }

  /* ---- Fetch and go ---- */
  function init() {
    var grids = document.querySelectorAll('.news-grid');
    if (!grids.length) return;

    grids.forEach(function (g) { showLoading(g); });

    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(render)
      .catch(function () {
        grids.forEach(function (grid) {
          grid.innerHTML = '<p class="news-empty">Aktuality se nepodařilo načíst.</p>';
        });
      });
  }

  /* ---- Boot ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
