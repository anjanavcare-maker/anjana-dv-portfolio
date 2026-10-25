/* cms-content.js — applies content/site.json edits to the live pages.
 * Two modes:
 *  - normal:  fills the page from content/site.json (fallback: keep static markup)
 *  - ?edit=1: additionally makes every editable element contenteditable,
 *             marks it with data-cms-path, and talks to the parent window
 *             (the visual editor at /admin/) so edits flow back into the JSON.
 */
(function () {
  'use strict';

  var DATA_URL = 'content/site.json';
  var IS_EDIT = /[?&]edit=1/.test(window.location.search);
  var IMG = {}; // path -> data URL overrides pushed by the visual editor (unsaved uploads)

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function imgSrc(path, fallback) {
    return IMG[path] || fallback || '';
  }
  /* ---------- edit-mode plumbing ---------- */
  var appliedFromParent = false;
  // Editor channel registers immediately (before any fetch) so uploads/edits
  // from the parent are never missed or clobbered by our own content load.
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;
    var d = e.data;
    if (!d || d.type !== 'cms:apply') return;
    appliedFromParent = true;
    apply(d.json, true, d.images || {});
  });

  function mark(el, path, isHtml) {
    if (!IS_EDIT || !el) return;
    el.setAttribute('data-cms-path', path);
    if (isHtml) el.setAttribute('data-cms-html', '1');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-cms-edit', 'true');
    el.classList.add('cms-editable');
  }
  function listenEdits() {
    if (!IS_EDIT) return;
    document.addEventListener('blur', function (e) {
      var t = e.target;
      if (!t || !t.getAttribute || !t.getAttribute('data-cms-path')) return;
      var path = t.getAttribute('data-cms-path');
      var value = t.getAttribute('data-cms-html') ? t.innerHTML : t.textContent;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'cms:change', path: path, value: value, html: !!t.getAttribute('data-cms-html') }, window.location.origin);
      }
    }, true);
  }

  /* ---------- all applies take (d, force) — force re-renders in edit mode ---------- */
  function applyHero(d, force) {
    var hero = d.hero;
    var h1 = q('.hero h1');
    if (h1 && (hero.title || force)) { h1.innerHTML = hero.title || ''; mark(h1, 'hero.title', true); }
    var lead = q('.hero .lead');
    if (lead && (hero.lead || force)) { lead.innerHTML = hero.lead || ''; mark(lead, 'hero.lead', true); }
    var avail = q('.avail-chip');
    if (avail && hero.availability) { avail.innerHTML = '<span class="avail-dot" aria-hidden="true"></span> ' + esc(hero.availability); mark(avail, 'hero.availability'); }
    var chips = q('.hero-chips');
    if (chips && hero.chips) {
      chips.innerHTML = hero.chips.map(function (c, i) {
        return '<span class="hero-chip" data-cms-path="hero.chips.' + i + '"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(c) + '</span>';
      }).join('');
    }
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
    if (st && hero.stats) {
      st.innerHTML = hero.stats.map(function (x, i) {
        return '<div class="stat"><div class="stat-num" data-cms-path="hero.stats.' + i + '.num"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(x.num) + '</div><p class="stat-label" data-cms-path="hero.stats.' + i + '.label"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(x.label) + '</p></div>';
      }).join('');
    }
    var pi = q('.portrait-img');
    if (pi && d.portrait) {
      if (d.portrait.image) pi.setAttribute('src', imgSrc('portrait.image', d.portrait.image));
      if (d.portrait.alt) pi.setAttribute('alt', d.portrait.alt);
      mark(pi, 'portrait.image');
    }
    var wh = { eyebrow: q('#work .eyebrow'), title: q('#work .sec-title'), sub: q('#work .sec-sub') };
    if (d.work) {
      if (wh.eyebrow && d.work.eyebrow) { wh.eyebrow.textContent = d.work.eyebrow; mark(wh.eyebrow, 'work.eyebrow'); }
      if (wh.title && d.work.title) { wh.title.innerHTML = d.work.title; mark(wh.title, 'work.title', true); }
      if (wh.sub && d.work.sub) { wh.sub.textContent = d.work.sub; mark(wh.sub, 'work.sub'); }
    }
  }

  function cardMarkup(p, idx) {
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
      ? '<div class="mock-body mock-shot"><img class="shot" src="' + esc(imgSrc('projects.' + idx + '.image', p.image)) + '" alt="" loading="lazy" width="1200" height="800" /></div>'
      : '<div class="mock-body"></div>';
    var mock = '<div class="mock" aria-hidden="true"><div class="mock-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="mock-url">' + esc(urlHost) + '</span></div>' + shot + '</div>';
    var info = '<h3 class="card-name" data-cms-path="projects.' + idx + '.name"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(p.name) + '</h3>' +
      '<p class="card-desc" data-cms-path="projects.' + idx + '.desc"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(p.desc) + '</p>' +
      '<div class="card-links"><a class="card-link" href="' + esc(p.link) + '" target="_blank" rel="noopener">Visit site ' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></a></div>';
    if (p.featured) {
      return '<article class="work-card featured" data-cats="' + esc(cats) + '"' + styleAttr + '>' +
        mock + '<div class="card-side"><div class="card-tags">' + tags + '</div>' + info + '</div></article>';
    }
    return '<article class="work-card" data-cats="' + esc(cats) + '"' + styleAttr + '>' +
      '<div class="card-top"><div class="card-tags">' + tags + '</div></div>' + mock +
      '<div class="card-info">' + info + '</div></article>';
  }

  function domify(htmlString) {
    var t = document.createElement('template');
    t.innerHTML = htmlString.trim();
    return t.content.firstChild;
  }

  function applyProjects(d, force) {
    var grid = q('.work-grid');
    if (!grid || !d.projects) return;
    var cta = grid.querySelector('.cta-card');
    qa('.work-card:not(.cta-card)', grid).forEach(function (card) { card.remove(); });
    var frag = document.createDocumentFragment();
    d.projects.forEach(function (p, i) { frag.appendChild(domify(cardMarkup(p, i))); });
    if (cta) { cta.parentNode.insertBefore(frag, cta); } else { grid.appendChild(frag); }
  }

  function applyContact(d, force) {
    var c = d.contact;
    if (!c) return;
    var t = q('#contact .sec-title');
    if (t && c.title) { t.textContent = c.title; mark(t, 'contact.title'); }
    var sb = q('#contact .sec-sub');
    if (sb && c.sub) { sb.textContent = c.sub; mark(sb, 'contact.sub'); }
    qa('#contact .method').forEach(function (m) {
      var k = q('.method-k', m);
      if (!k) return;
      var key = k.textContent.trim().toLowerCase();
      var v = q('.method-v', m);
      var note = q('.method-note', m);
      var val = c[key];
      if (v) {
        if (val) {
          var linkEl = v.querySelector('a');
          if (linkEl) {
            linkEl.textContent = val;
            if (key === 'whatsapp') {
              linkEl.href = 'https://wa.me/' + String(val).replace(/\D/g, '');
            }
          } else { v.textContent = val; }
          mark(v, 'contact.' + key);
        }
        v.setAttribute('data-cms-path', 'contact.' + key);
        if (IS_EDIT) v.setAttribute('contenteditable', 'true');
      }
      if (note) note.textContent = '';
    });
  }

  function applyAbout(d, force) {
    var a = d.about;
    if (!a) return;
    var t = q('.about-sticky .sec-title');
    if (t && a.title) { t.innerHTML = a.title; mark(t, 'about.title', true); }
    var copy = q('.about-copy');
    if (copy && a.paragraphs) {
      copy.innerHTML = a.paragraphs.map(function (p, i) {
        return '<p data-cms-path="about.paragraphs.' + i + '"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(p) + '</p>';
      }).join('');
    }
    var facts = q('.about-facts');
    if (facts && a.facts) {
      facts.innerHTML = a.facts.map(function (f, i) {
        return '<div class="fact"><p class="fact-k" data-cms-path="about.facts.' + i + '.0"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(f[0]) + '</p><p class="fact-v" data-cms-path="about.facts.' + i + '.1"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(f[1]) + '</p></div>';
      }).join('');
    }
  }

  function applyPricing(d, force) {
    var pr = d.pricing;
    if (!pr) return;
    var t = q('#pricing .sec-title') || q('#pricing h1');
    if (t && pr.title) { t.innerHTML = pr.title; mark(t, 'pricing.title', true); }
    var sb = q('#pricing .sec-sub');
    if (sb && pr.sub) { sb.textContent = pr.sub; mark(sb, 'pricing.sub'); }
    var grid = q('.price-grid');
    if (grid && pr.tiers) {
      grid.innerHTML = pr.tiers.map(function (x, i) {
        var badge = x.badge ? '<span class="price-badge">' + esc(x.badge) + '</span>' : '';
        return '<div class="price-card' + (x.featured ? ' featured' : '') + '">' + badge +
          '<p class="price-tier" data-cms-path="pricing.tiers.' + i + '.tier"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(x.tier) + '</p>' +
          '<h3 class="price-name" data-cms-path="pricing.tiers.' + i + '.name"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(x.name) + '</h3>' +
          '<p class="price-amt"><span class="price-cur">' + esc(x.currency) + '</span>' + esc(x.amount) +
          '<span class="price-from"> ' + esc(x.from) + '</span></p>' +
          '<p class="price-desc" data-cms-path="pricing.tiers.' + i + '.desc"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(x.desc) + '</p>' +
          '<ul class="price-feats">' + (x.features || []).map(function (f, j) {
            return '<li data-cms-path="pricing.tiers.' + i + '.features.' + j + '"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(f) + '</li>';
          }).join('') + '</ul>' +
          '<a class="btn ' + (x.featured ? 'btn-primary' : 'btn-secondary') + '" href="#contact">' + esc(x.cta) + '</a></div>';
      }).join('');
    }
    var note = q('.price-note');
    if (note && pr.note) { note.innerHTML = pr.note.replace(/^Fast delivery:/, '<strong>Fast delivery:</strong>'); mark(note, 'pricing.note'); }
    var fl = q('.faq-list');
    if (fl && d.faq) {
      fl.innerHTML = d.faq.map(function (f, i) {
        return '<details class="faq-item"><summary data-cms-path="faq.' + i + '.q"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(f.q) + '</summary><p data-cms-path="faq.' + i + '.a"' + (IS_EDIT ? ' contenteditable="true"' : '') + '>' + esc(f.a) + '</p></details>';
      }).join('');
    }
  }

  function applyGrowth(d, force) {
    var g = d.growth;
    if (!g) return;

    function setText(sel, value, path) {
      var el = q(sel);
      if (el && value) { el.textContent = value; mark(el, path); }
    }
    function setHtml(sel, value, path) {
      var el = q(sel);
      if (el && value) { el.innerHTML = value; mark(el, path, true); }
    }
    function editable(path) {
      return ' data-cms-path="' + path + '"' + (IS_EDIT ? ' contenteditable="true"' : '');
    }

    if (g.hero) {
      setText('.g-hero .eyebrow', g.hero.eyebrow, 'growth.hero.eyebrow');
      setHtml('.g-hero h1', g.hero.title, 'growth.hero.title');
      setText('.g-hero .g-lead', g.hero.lead, 'growth.hero.lead');
      var chips = q('.g-chips');
      if (chips && g.hero.chips) {
        chips.innerHTML = g.hero.chips.map(function (c, i) {
          return '<span class="g-chip"' + editable('growth.hero.chips.' + i) + '>' + esc(c) + '</span>';
        }).join('');
      }
      var acts = qa('.g-hero-actions .btn');
      if (acts[0] && g.hero.ctaPrimary) acts[0].innerHTML = esc(g.hero.ctaPrimary) + ' <span class="arr" aria-hidden="true">\u2192</span>';
      if (acts[1] && g.hero.ctaSecondary) acts[1].textContent = g.hero.ctaSecondary;
    }

    if (g.package) {
      var p = g.package;
      setText('.g-package-label', p.label, 'growth.package.label');
      setText('.g-package-name', p.name, 'growth.package.name');
      var cur = q('.g-package-price .cur');
      if (cur && p.currency) cur.textContent = p.currency;
      var num = q('.g-package-price .num');
      if (num && p.amount) num.textContent = p.amount;
      var per = q('.g-package-price .per');
      if (per && p.per) per.textContent = p.per;
      setText('.g-package-note', p.note, 'growth.package.note');
      var list = q('.g-package-list');
      if (list && p.features) {
        var iconEl = q('li svg', list);
        var icon = iconEl ? iconEl.outerHTML : '';
        list.innerHTML = p.features.map(function (f, i) {
          return '<li>' + icon + '<span' + editable('growth.package.features.' + i) + '>' + esc(f) + '</span></li>';
        }).join('');
      }
      var pkgBtn = q('.g-package .btn');
      if (pkgBtn && p.cta) pkgBtn.innerHTML = esc(p.cta) + ' <span class="arr" aria-hidden="true">\u2192</span>';
      setText('.g-package-foot', p.foot, 'growth.package.foot');
    }

    if (g.compare) {
      setHtml('#compare .sec-title', g.compare.title, 'growth.compare.title');
      setText('#compare .sec-sub', g.compare.sub, 'growth.compare.sub');
      var tbody = q('#compare .g-compare tbody');
      if (tbody && g.compare.rows) {
        tbody.innerHTML = g.compare.rows.map(function (r, i) {
          return '<tr><th scope="row"' + editable('growth.compare.rows.' + i + '.label') + '>' + esc(r.label) + '</th>' +
                 '<td' + editable('growth.compare.rows.' + i + '.one') + '>' + esc(r.one) + '</td>' +
                 '<td class="col-growth"' + editable('growth.compare.rows.' + i + '.growth') + '>' + esc(r.growth) + '</td></tr>';
        }).join('');
      }
    }

    if (g.included) {
      setHtml('#included .sec-title', g.included.title, 'growth.included.title');
      setText('#included .sec-sub', g.included.sub, 'growth.included.sub');
    }

    if (g.activities) {
      var grid = q('.g-act-grid');
      if (grid) {
        var icons = qa('.g-act-grid .g-act-icon').map(function (el) { return el.innerHTML; });
        grid.innerHTML = g.activities.map(function (a, i) {
          return '<article class="g-act">' +
            '<div class="g-act-icon">' + (icons[i] || icons[0] || '') + '</div>' +
            '<h3' + editable('growth.activities.' + i + '.name') + '>' + esc(a.name) + '</h3>' +
            '<p' + editable('growth.activities.' + i + '.desc') + '>' + esc(a.desc) + '</p></article>';
        }).join('');
      }
    }

    if (g.deliverables) {
      setHtml('#deliverables .sec-title', g.deliverables.title, 'growth.deliverables.title');
      setText('#deliverables .sec-sub', g.deliverables.sub, 'growth.deliverables.sub');
      var dl = q('.g-deliv');
      if (dl && g.deliverables.items) {
        dl.innerHTML = g.deliverables.items.map(function (it, i) {
          return '<div class="g-deliv-row"><dt' + editable('growth.deliverables.items.' + i + '.label') + '>' + esc(it.label) + '</dt>' +
                 '<dd' + editable('growth.deliverables.items.' + i + '.value') + '>' + esc(it.value) + '</dd></div>';
        }).join('');
      }
    }

    if (g.process) {
      setHtml('#process .sec-title', g.process.title, 'growth.process.title');
      var steps = q('.g-steps');
      if (steps && g.process.items) {
        steps.innerHTML = g.process.items.map(function (s, i) {
          return '<article class="g-step">' +
            '<p class="g-step-num"' + editable('growth.process.items.' + i + '.num') + '>' + esc(s.num || '') + '</p>' +
            '<h3' + editable('growth.process.items.' + i + '.name') + '>' + esc(s.name) + '</h3>' +
            '<p' + editable('growth.process.items.' + i + '.desc') + '>' + esc(s.desc) + '</p></article>';
        }).join('');
      }
    }

    if (g.industries) {
      setHtml('#industries .sec-title', g.industries.title, 'growth.industries.title');
      setText('#industries .sec-sub', g.industries.sub, 'growth.industries.sub');
      var ind = q('.g-ind-grid');
      if (ind && g.industries.items) {
        ind.innerHTML = g.industries.items.map(function (it, i) {
          return '<article class="g-ind"><h3' + editable('growth.industries.items.' + i + '.name') + '>' + esc(it.name) + '</h3>' +
                 '<p' + editable('growth.industries.items.' + i + '.desc') + '>' + esc(it.desc) + '</p></article>';
        }).join('');
      }
    }

    if (g.faq) {
      setHtml('#faq-growth .sec-title', g.faq.title, 'growth.faq.title');
      var fl = q('#faq-growth .faq-list');
      if (fl && g.faq.items) {
        fl.innerHTML = g.faq.items.map(function (f, i) {
          return '<details class="faq-item"' + (i === 0 ? ' open' : '') + '><summary' + editable('growth.faq.items.' + i + '.q') + '>' + esc(f.q) + '</summary>' +
                 '<p' + editable('growth.faq.items.' + i + '.a') + '>' + esc(f.a) + '</p></details>';
        }).join('');
      }
    }

    if (g.enquiry) {
      setHtml('#enquire .sec-title', g.enquiry.title, 'growth.enquiry.title');
      setText('#enquire .sec-sub', g.enquiry.sub, 'growth.enquiry.sub');
    }
  }

  function apply(d, force, images) {
    IMG = images || {};
    if (q('.hero')) { applyHero(d, force); applyProjects(d, force); applyContact(d, force); }
    if (q('.about-grid')) applyAbout(d, force);
    if (q('.price-grid')) applyPricing(d, force);
    if (q('.g-hero')) applyGrowth(d, force);
    if (IS_EDIT) document.body.classList.add('cms-edit-mode');
  }

  function boot() {
    fetch(DATA_URL + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('no content'); return r.json(); })
      .then(function (json) {
        // If the editor already pushed fresher content, don't clobber it.
        if (!appliedFromParent) apply(json, false);
        listenEdits();
      })
      .catch(function () { listenEdits(); /* keep the static markup when no content */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();