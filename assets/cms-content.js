/* cms-content.js — applies content/site.json edits to the live pages.
 * Works alongside the Decap CMS admin panel (admin/index.html).
 * If site.json is missing/unreachable, the original markup stays untouched. */
(function () {
  'use strict';

  var DATA_URL = 'content/site.json';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function applyHero(d) {
    var hero = d.hero;
    if (q('.hero h1')) q('.hero h1').innerHTML = hero.title || '';
    if (q('.hero .lead')) q('.hero .lead').innerHTML = hero.lead || '';
    var avail = q('.avail-chip');
    if (avail) avail.innerHTML = '<span class="avail-dot" aria-hidden="true"></span> ' + esc(hero.availability);
    var chips = q('.hero-chips');
    if (chips && hero.chips) chips.innerHTML = hero.chips.map(function (c) { return '<span class="hero-chip">' + esc(c) + '</span>'; }).join('');
    var p = q('.hero-cta .btn-primary');
    if (p && hero.cta && hero.cta.primary) {
      p.setAttribute('href', hero.cta.primary.href || '#work');
      p.innerHTML = esc(hero.cta.primary.text) + ' <span class="arr" aria-hidden="true">\u2192</span>';
    }
    var s = q('.hero-cta .btn-secondary');
    if (s && hero.cta && hero.cta.secondary) {
      s.setAttribute('href', hero.cta.secondary.href || '#contact');
      s.textContent = hero.cta.secondary.text;
    }
    var st = q('.hero-stats');
    if (st && hero.stats) st.innerHTML = hero.stats.map(function (x) {
      return '<div class="stat"><div class="stat-num">' + esc(x.num) + '</div><p class="stat-label">' + esc(x.label) + '</p></div>';
    }).join('');
    var pi = q('.portrait-img');
    if (pi && d.portrait) {
      if (d.portrait.image) pi.setAttribute('src', d.portrait.image);
      if (d.portrait.alt) pi.setAttribute('alt', d.portrait.alt);
    }
    var pt = q('.portrait-tag');
    if (pt && d.portrait) {
      pt.innerHTML = '<span>' + esc(d.portrait.tagLeft) + '</span><span>' + esc(d.portrait.tagRight) + '</span>';
    }
    var wh = { eyebrow: q('#work .eyebrow'), title: q('#work .sec-title'), sub: q('#work .sec-sub') };
    if (d.work) {
      if (wh.eyebrow) wh.eyebrow.textContent = d.work.eyebrow;
      if (wh.title) wh.title.innerHTML = d.work.title;
      if (wh.sub) wh.sub.textContent = d.work.sub;
    }
  }

  function cardMarkup(p) {
    var style = [];
    if (p.colors && p.colors.bg) style.push('--mbg:' + p.colors.bg);
    if (p.colors && p.colors.fg) style.push('--mfg:' + p.colors.fg);
    if (p.colors && p.colors.accent) style.push('--mk-accent:' + p.colors.accent);
    var styleAttr = style.length ? ' style="' + style.join('; ') + ';"' : '';
    var cats = Array.isArray(p.cats) ? p.cats.join(' ') : String(p.cats || 'live');
    var tags = (p.tags || []).map(function (t) {
      var cls = t.cls ? ' ' + t.cls : '';
      return '<span class="tag' + cls + '">' + esc(t.text) + '</span>';
    }).join('');
    var urlHost = '';
    try { urlHost = new URL(p.link).host; } catch (e) { urlHost = p.link.replace(/^https?:\/\//, '').split('/')[0]; }
    var shot = p.image
      ? '<div class="mock-body mock-shot"><img class="shot" src="' + esc(p.image) + '" alt="" loading="lazy" width="1200" height="800" /></div>'
      : '<div class="mock-body"></div>';
    var mock = '<div class="mock" aria-hidden="true"><div class="mock-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="mock-url">' + esc(urlHost) + '</span></div>' + shot + '</div>';
    var info = '<h3 class="card-name">' + esc(p.name) + '</h3><p class="card-desc">' + esc(p.desc) + '</p>' +
      '<div class="card-links"><a class="card-link" href="' + esc(p.link) + '" target="_blank" rel="noopener">Visit site ' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></a></div>';
    if (p.featured) {
      return '<article class="work-card featured reveal" data-cats="' + esc(cats) + '"' + styleAttr + '>' +
        mock + '<div class="card-side"><div class="card-tags">' + tags + '</div>' + info + '</div></article>';
    }
    return '<article class="work-card reveal" data-cats="' + esc(cats) + '"' + styleAttr + '>' +
      '<div class="card-top"><div class="card-tags">' + tags + '</div></div>' + mock +
      '<div class="card-info">' + info + '</div></article>';
  }

  function domify(htmlString) {
    var t = document.createElement('template');
    t.innerHTML = htmlString.trim();
    return t.content.firstChild;
  }

  function applyProjects(d) {
    var grid = q('.work-grid');
    if (!grid || !d.projects) return;
    var cta = grid.querySelector('.cta-card');
    qa('.work-card:not(.cta-card)', grid).forEach(function (card) { card.remove(); });
    var frag = document.createDocumentFragment();
    d.projects.forEach(function (p) { frag.appendChild(domify(cardMarkup(p))); });
    if (cta) { cta.parentNode.insertBefore(frag, cta); } else { grid.appendChild(frag); }
  }

  function applyContact(d) {
    var c = d.contact;
    if (!c) return;
    var t = q('#contact .sec-title');
    if (t && c.title) t.textContent = c.title;
    var sb = q('#contact .sec-sub');
    if (sb && c.sub) sb.textContent = c.sub;
    qa('#contact .method').forEach(function (m) {
      var k = q('.method-k', m);
      if (!k) return;
      var key = k.textContent.trim().toLowerCase();
      var v = q('.method-v', m);
      var note = q('.method-note', m);
      var val = c[key];
      if (v && val) v.textContent = val;
      if (note) note.textContent = '';
    });
  }

  function applyAbout(d) {
    var a = d.about;
    if (!a) return;
    var t = q('.about-sticky .sec-title');
    if (t && a.title) t.innerHTML = a.title;
    var copy = q('.about-copy');
    if (copy && a.paragraphs) copy.innerHTML = a.paragraphs.map(function (p) {
      return '<p class="reveal">' + esc(p) + '</p>';
    }).join('');
    var facts = q('.about-facts');
    if (facts && a.facts) facts.innerHTML = a.facts.map(function (f) {
      return '<div class="fact"><p class="fact-k">' + esc(f[0]) + '</p><p class="fact-v">' + esc(f[1]) + '</p></div>';
    }).join('');
  }

  function applyPricing(d) {
    var pr = d.pricing;
    if (!pr) return;
    var t = q('#pricing .sec-title') || q('#pricing h1');
    if (t && pr.title) t.innerHTML = pr.title;
    var sb = q('#pricing .sec-sub');
    if (sb && pr.sub) sb.textContent = pr.sub;
    var grid = q('.price-grid');
    if (grid && pr.tiers) {
      grid.innerHTML = pr.tiers.map(function (x) {
        var badge = x.badge ? '<span class="price-badge">' + esc(x.badge) + '</span>' : '';
        return '<div class="price-card' + (x.featured ? ' featured' : '') + ' reveal">' + badge +
          '<p class="price-tier">' + esc(x.tier) + '</p><h3 class="price-name">' + esc(x.name) + '</h3>' +
          '<p class="price-amt"><span class="price-cur">' + esc(x.currency) + '</span>' + esc(x.amount) +
          '<span class="price-from"> ' + esc(x.from) + '</span></p>' +
          '<p class="price-desc">' + esc(x.desc) + '</p>' +
          '<ul class="price-feats">' + (x.features || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
          '<a class="btn ' + (x.featured ? 'btn-primary' : 'btn-secondary') + '" href="#contact">' + esc(x.cta) + '</a></div>';
      }).join('');
    }
    var note = q('.price-note');
    if (note && pr.note) note.innerHTML = pr.note.replace(/^Fast delivery:/, '<strong>Fast delivery:</strong>');
    var fl = q('.faq-list');
    if (fl && d.faq) fl.innerHTML = d.faq.map(function (f) {
      return '<details class="faq-item reveal"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>';
    }).join('');
  }

  function apply(d) {
    if (q('.hero')) { applyHero(d); applyProjects(d); applyContact(d); }
    if (q('.about-grid')) applyAbout(d);
    if (q('.price-grid')) applyPricing(d);
  }

  function boot() {
    fetch(DATA_URL + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('no content'); return r.json(); })
      .then(apply)
      .catch(function () { /* keep the static markup when content is unavailable */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();