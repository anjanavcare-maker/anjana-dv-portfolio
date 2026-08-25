/* Visual Editor logic — Anjana DV
 * Split view: real site preview (edit mode) + structured forms.
 * Publish commits content/site.json to GitHub -> Vercel auto-deploys.
 */
(function () {
  'use strict';

  var ORIGIN = window.location.origin;
  var TOKEN_KEY = 'anjana_cm_token';
  var REPO = 'anjanavcare-maker/anjana-dv-portfolio';
  var FILE = 'content/site.json';
  var API = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE;

  var json = null;
  var dirty = false;
  var token = localStorage.getItem(TOKEN_KEY) || '';

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function getPath(o, p) {
    return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o);
  }
  function setPath(o, p, v) {
    var ks = p.split('.');
    var cur = o;
    for (var i = 0; i < ks.length - 1; i++) {
      if (cur[ks[i]] == null) cur[ks[i]] = {};
      cur = cur[ks[i]];
    }
    cur[ks[ks.length - 1]] = v;
  }
  function toArray(v) {
    return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function arrToText(a) { return (a || []).join(', '); }
  function tagsToText(tags) {
    return (tags || []).map(function (t) {
      return t.cls ? t.text + ' (' + t.cls + ')' : t.text;
    }).join(', ');
  }
  function textToTags(s) {
    return toArray(s).map(function (item) {
      var m = /^(.*?)(?:\s*\((\w+)\))?$/.exec(item);
      return { text: m ? m[1].trim() : item, cls: m && m[2] ? m[2] : null };
    });
  }
  function status(msg, kind) {
    var el = $('status');
    el.textContent = msg;
    el.className = kind || '';
  }
  function markDirty() {
    dirty = true;
    $('dirty').hidden = false;
  }
  function b64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function pushToFrame() {
    var f = $('cms-frame');
    if (f && f.contentWindow && json) {
      f.contentWindow.postMessage({ type: 'cms:apply', json: json }, ORIGIN);
    }
  }

  /* ---------------- iframe preview ---------------- */
  var PAGES = { 'index.html': '../index.html?edit=1', 'about.html': '../about.html?edit=1', 'pricing.html': '../pricing.html?edit=1' };
  function loadPage(page) {
    $('cms-frame').src = PAGES[page] || PAGES['index.html'];
    document.querySelectorAll('.pv-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-page') === page); });
  }

  /* ---------------- form widgets ---------------- */
  function makeField(cfg) {
    var wrap = document.createElement('div');
    wrap.className = 'field' + (cfg.type === 'check' ? ' check' : '');
    var lab = document.createElement('label');
    lab.textContent = cfg.label || cfg.path;
    wrap.appendChild(lab);

    var input;
    if (cfg.type === 'check') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !!getPath(json, cfg.path);
      input.addEventListener('change', function () {
        setPath(json, cfg.path, input.checked);
        markDirty(); pushToFrame();
      });
    } else if (cfg.type === 'area') {
      input = document.createElement('textarea');
      input.value = getPath(json, cfg.path) || '';
      input.addEventListener('input', function () {
        setPath(json, cfg.path, input.value);
        markDirty(); pushToFrame();
      });
    } else {
      input = document.createElement('input');
      input.type = cfg.type === 'url' ? 'text' : 'text';
      input.value = getPath(json, cfg.path) == null ? '' : String(getPath(json, cfg.path));
      input.addEventListener('input', function () {
        var v = input.value;
        if (cfg.type === 'comma') v = toArray(v);
        if (cfg.type === 'commaTags') v = textToTags(v);
        setPath(json, cfg.path, v);
        markDirty(); pushToFrame();
      });
    }
    input.setAttribute('data-path', cfg.path);
    wrap.appendChild(input);
    return wrap;
  }

  function makeList(cfg) {
    var box = document.createElement('div');

    function render() {
      box.innerHTML = '';
      var items = getPath(json, cfg.path) || [];
      items.forEach(function (it, i) {
        var row = document.createElement('div');
        row.className = 'lr';
        var head = document.createElement('div');
        head.className = 'lr-h';
        var t = document.createElement('span');
        t.className = 'lr-t';
        var label = cfg.labelFn ? cfg.labelFn(it, i) : (it.name || it.tier || it.q || it['0'] || cfg.itemName || 'item');
        t.textContent = (i + 1) + '. ' + label;
        head.appendChild(t);
        var x = document.createElement('button');
        x.type = 'button'; x.className = 'lr-x'; x.textContent = '\u2715';
        x.title = 'Remove';
        x.addEventListener('click', function () {
          var arr = getPath(json, cfg.path);
          arr.splice(i, 1);
          markDirty(); pushToFrame(); render();
        });
        head.appendChild(x);
        row.appendChild(head);

        if (cfg.string) {
          var w = document.createElement('div');
          w.className = 'field';
          var ta = document.createElement('textarea');
          ta.value = it || '';
          ta.addEventListener('input', function () {
            var arr = getPath(json, cfg.path);
            arr[i] = ta.value;
            markDirty(); pushToFrame();
          });
          w.appendChild(ta);
          row.appendChild(w);
        } else {
          (cfg.fields || []).forEach(function (f) {
            row.appendChild(makeField({ path: cfg.path + '.' + i + '.' + f.path, label: f.label, type: f.type }));
          });
        }
        box.appendChild(row);
      });
      var add = document.createElement('button');
      add.type = 'button'; add.className = 'lr-add';
      add.textContent = '+ Add ' + (cfg.addLabel || cfg.itemName || 'item');
      add.addEventListener('click', function () {
        var arr = getPath(json, cfg.path) || [];
        arr.push(cfg.blank ? cfg.blank() : (cfg.string ? '' : {}));
        setPath(json, cfg.path, arr);
        markDirty(); pushToFrame(); render();
      });
      box.appendChild(add);
    }
    render();
    return box;
  }

  function section(title, body) {
    var wrap = document.createElement('div');
    wrap.className = 'sec-wrap';
    var d = document.createElement('details');
    d.open = true;
    var s = document.createElement('summary');
    s.textContent = title;
    d.appendChild(s);
    var inner = document.createElement('div');
    inner.appendChild(body);
    d.appendChild(inner);
    wrap.appendChild(d);
    return wrap;
  }

  function buildForm() {
    var root = $('fields');
    root.innerHTML = '';
    var h = document.createElement('h3');
    h.className = 'sec';
    h.textContent = 'Edit content — changes apply live to the preview';
    root.appendChild(h);
    var hint = document.createElement('p');
    hint.style.cssText = 'color:var(--faint);font-size:12px;margin:0 0 8px;';
    hint.innerHTML = 'Tip: click any text directly in the preview to edit it in place. Lists (projects, pricing, FAQ) are edited here in the sidebar.';
    root.appendChild(hint);

    // Hero
    root.appendChild(section('Hero', (function () {
      var b = document.createElement('div');
      b.appendChild(makeField({ path: 'hero.availability', label: 'Availability note', type: 'text' }));
      b.appendChild(makeField({ path: 'hero.title', label: 'Headline (HTML allowed)', type: 'area' }));
      b.appendChild(makeField({ path: 'hero.lead', label: 'Intro paragraph (HTML allowed)', type: 'area' }));
      b.appendChild(makeField({ path: 'hero.chips', label: 'Stack chips (comma separated)', type: 'comma', placeholder: 'WordPress, Elementor' }));
      b.appendChild(makeField({ path: 'hero.cta.primary.text', label: 'Primary button text', type: 'text' }));
      b.appendChild(makeField({ path: 'hero.cta.primary.href', label: 'Primary button link', type: 'text' }));
      b.appendChild(makeField({ path: 'hero.cta.secondary.text', label: 'Secondary button text', type: 'text' }));
      b.appendChild(makeField({ path: 'hero.cta.secondary.href', label: 'Secondary button link', type: 'text' }));
      var l = makeList({
        path: 'hero.stats', itemName: 'stat', addLabel: 'stat',
        labelFn: function (it, i) { return it.label || 'stat'; },
        blank: function () { return { num: '', label: '' }; },
        fields: [
          { path: 'num', label: 'Number', type: 'text' },
          { path: 'label', label: 'Label', type: 'text' }
        ]
      });
      b.appendChild(l);
      return b;
    })()));

    // Portrait
    root.appendChild(section('Portrait photo', (function () {
      var b = document.createElement('div');
      b.appendChild(makeField({ path: 'portrait.image', label: 'Image path (assets/…  or full URL)', type: 'text' }));
      b.appendChild(makeField({ path: 'portrait.alt', label: 'Alt text', type: 'text' }));
      b.appendChild(makeField({ path: 'portrait.tagLeft', label: 'Tag left', type: 'text' }));
      b.appendChild(makeField({ path: 'portrait.tagRight', label: 'Tag right', type: 'text' }));
      return b;
    })()));

    // Work heading
    root.appendChild(section('Work section heading', (function () {
      var b = document.createElement('div');
      b.appendChild(makeField({ path: 'work.eyebrow', label: 'Eyebrow', type: 'text' }));
      b.appendChild(makeField({ path: 'work.title', label: 'Title (HTML allowed)', type: 'area' }));
      b.appendChild(makeField({ path: 'work.sub', label: 'Subtitle', type: 'text' }));
      return b;
    })()));

    // Projects
    root.appendChild(section('Projects', makeList({
      path: 'projects', itemName: 'project', addLabel: 'project',
      labelFn: function (it) { return it.name || 'unnamed'; },
      blank: function () { return { name: 'New project', desc: '', link: '', image: '', tags: [], cats: ['live'], colors: {}, featured: false }; },
      fields: [
        { path: 'name', label: 'Client / project name', type: 'text' },
        { path: 'desc', label: 'Description', type: 'area' },
        { path: 'link', label: 'Website URL', type: 'text' },
        { path: 'image', label: 'Screenshot path (assets/thumbs/… .jpg)', type: 'text' },
        { path: 'tags', label: 'Card tags — text or "text (live)" (comma separated)', type: 'commaTags' },
        { path: 'cats', label: 'Categories (comma: live kerala uae finance …)', type: 'comma' },
        { path: 'colors.bg', label: 'Brand bg (--mbg, optional)', type: 'text' },
        { path: 'colors.fg', label: 'Brand fg (--mfg, optional)', type: 'text' },
        { path: 'colors.accent', label: 'Brand accent (--mk-accent, optional)', type: 'text' },
        { path: 'featured', label: 'Featured (big card)', type: 'check' }
      ]
    })));

    // Contact
    root.appendChild(section('Contact', (function () {
      var b = document.createElement('div');
      b.appendChild(makeField({ path: 'contact.title', label: 'Title', type: 'text' }));
      b.appendChild(makeField({ path: 'contact.sub', label: 'Subtitle', type: 'text' }));
      b.appendChild(makeField({ path: 'contact.email', label: 'Email', type: 'text' }));
      b.appendChild(makeField({ path: 'contact.whatsapp', label: 'WhatsApp number', type: 'text' }));
      b.appendChild(makeField({ path: 'contact.linkedin', label: 'LinkedIn handle', type: 'text' }));
      return b;
    })()));

    // About
    root.appendChild(section('About page', (function () {
      var b = document.createElement('div');
      b.appendChild(makeField({ path: 'about.title', label: 'Title (HTML allowed)', type: 'area' }));
      var l = makeList({ path: 'about.paragraphs', string: true, itemName: 'paragraph', addLabel: 'paragraph', labelFn: function (it, i) { return 'Paragraph ' + (i + 1); } });
      b.appendChild(l);
      var f = makeList({
        path: 'about.facts', itemName: 'fact', addLabel: 'fact',
        labelFn: function (it, i) { return it['0'] || 'fact'; },
        blank: function () { return ['', '']; },
        fields: [
          { path: '0', label: 'Key', type: 'text' },
          { path: '1', label: 'Value', type: 'text' }
        ]
      });
      b.appendChild(f);
      return b;
    })()));

    // Pricing
    root.appendChild(section('Pricing page', (function () {
      var b = document.createElement('div');
      b.appendChild(makeField({ path: 'pricing.title', label: 'Title (HTML allowed)', type: 'area' }));
      b.appendChild(makeField({ path: 'pricing.sub', label: 'Subtitle', type: 'text' }));
      b.appendChild(makeField({ path: 'pricing.note', label: 'Bottom note', type: 'area' }));
      var l = makeList({
        path: 'pricing.tiers', itemName: 'package', addLabel: 'package',
        labelFn: function (it) { return it.tier + ' — ' + it.name; },
        blank: function () { return { badge: '', tier: 'New', name: 'Plan name', currency: '\u20B9', amount: '0', from: 'onwards', desc: '', features: [], cta: 'Start', featured: false }; },
        fields: [
          { path: 'badge', label: 'Badge (e.g. Most chosen — optional)', type: 'text' },
          { path: 'tier', label: 'Package name', type: 'text' },
          { path: 'name', label: 'Plan name', type: 'text' },
          { path: 'currency', label: 'Currency symbol', type: 'text' },
          { path: 'amount', label: 'Amount (e.g. 5,000)', type: 'text' },
          { path: 'from', label: 'Suffix (onwards)', type: 'text' },
          { path: 'desc', label: 'Description', type: 'area' },
          { path: 'features', label: 'What\u2019s included (comma separated)', type: 'comma' },
          { path: 'cta', label: 'Button text', type: 'text' },
          { path: 'featured', label: 'Highlight (featured)', type: 'check' }
        ]
      });
      b.appendChild(l);
      return b;
    })()));

    // FAQ
    root.appendChild(section('FAQ', makeList({
      path: 'faq', itemName: 'question', addLabel: 'question',
      labelFn: function (it) { return it.q || 'question'; },
      blank: function () { return { q: '', a: '' }; },
      fields: [
        { path: 'q', label: 'Question', type: 'area' },
        { path: 'a', label: 'Answer', type: 'area' }
      ]
    })));
  }

  /* ---------------- publish ---------------- */
  function publish() {
    if (!token) { openToken(); return; }
    status('Publishing to GitHub…');
    var head = { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' };

    fetch(API, { headers: head })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { throw new Error('token'); }
        return r.json();
      })
      .then(function (cur) {
        var sha = cur.sha;
        var body = {
          message: 'Content update from visual editor',
          content: b64(JSON.stringify(json, null, 2)),
          branch: 'main'
        };
        if (sha) body.sha = sha;
        return fetch(API, {
          method: 'PUT',
          headers: Object.assign(head, { 'Content-Type': 'application/json' }),
          body: JSON.stringify(body)
        });
      })
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function () {
        dirty = false;
        $('dirty').hidden = true;
        status('\u2705 Published — Vercel is deploying; live in ~1 minute', 'ok');
        setTimeout(function () {
          $('cms-frame').src = $('cms-frame').src.replace('?edit=1', '?v=' + Date.now());
          status('\u2705 Live site updated', 'ok');
        }, 70000);
      })
      .catch(function (e) {
        status(e.message === 'token' ? 'Token rejected — please re-enter it' : 'Publish failed: ' + e.message, 'err');
        if (e.message === 'token') openToken();
      });
  }

  /* ---------------- token overlay ---------------- */
  function openToken() {
    $('token-overlay').hidden = false;
    $('token-input').focus();
  }
  function saveToken() {
    var v = $('token-input').value.trim();
    if (!v) return;
    fetch('https://api.github.com/user', { headers: { Authorization: 'token ' + v } })
      .then(function (r) {
        if (r.ok) {
          token = v;
          localStorage.setItem(TOKEN_KEY, v);
          $('token-overlay').hidden = true;
          $('token-msg').textContent = '';
          status('\u2705 Token saved (' + r.status + ')', 'ok');
        } else {
          $('token-msg').className = 'msg err';
          $('token-msg').textContent = 'GitHub rejected that token (' + r.status + '). Use a classic token with repo scope.';
        }
      })
      .catch(function () {
        $('token-msg').className = 'msg err';
        $('token-msg').textContent = 'Network error while checking the token.';
      });
  }

  /* ---------------- events ---------------- */
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return;
    var d = e.data;
    if (!d || d.type !== 'cms:change') return;
    var v = d.value;
    if (d.html) v = d.value;
    setPath(json, d.path, v);
    markDirty();
    var input = document.querySelector('input[data-path="' + d.path + '"], textarea[data-path="' + d.path + '"]');
    if (input) {
      if (input.tagName === 'INPUT' && input.type === 'checkbox') { input.checked = !!v; }
      else if (input.tagName === 'TEXTAREA') { input.value = v; }
      else { input.value = v; }
    }
  }, false);

  function loadAll() {
    fetch(FILE + '?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('no content');
        return r.json();
      })
      .then(function (j) {
        json = j;
        buildForm();
        loadPage('index.html');
        status('Ready — edit anything and hit Save & Publish', 'ok');
      })
      .catch(function (e) {
        status('Could not load content/site.json: ' + e.message, 'err');
      });
  }

  $('btn-publish').addEventListener('click', publish);
  $('btn-token').addEventListener('click', openToken);
  $('btn-reset').addEventListener('click', function () {
    if (dirty && !confirm('Discard unsaved changes and reload from GitHub?')) return;
    dirty = false;
    $('dirty').hidden = true;
    loadAll();
  });
  $('btn-token-save').addEventListener('click', saveToken);
  $('btn-token-cancel').addEventListener('click', function () { $('token-overlay').hidden = true; });
  $('token-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') saveToken(); });
  document.querySelectorAll('.pv-btn').forEach(function (b) {
    b.addEventListener('click', function () { loadPage(b.getAttribute('data-page')); });
  });
  var frame = $('cms-frame');
  frame.addEventListener('load', function () {
    if (json) { setTimeout(pushToFrame, 250); pushToFrame(); }
  });

  if (!token) openToken();
  loadAll();
})();