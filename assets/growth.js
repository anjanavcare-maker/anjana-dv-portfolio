/* growth.js — enquiry form for the Growth Partnership page.
   Collects the qualifier fields and opens WhatsApp with the message pre-filled. */
(function () {
  'use strict';

  var WHATSAPP_NUMBER = '918547454062';
  var form = document.getElementById('growth-form');
  if (!form) return;

  var nameEl = document.getElementById('g-name');
  var bizEl = document.getElementById('g-business');
  var siteEl = document.getElementById('g-site');
  var needEl = document.getElementById('g-need');
  var budgetEl = document.getElementById('g-budget');
  var errorEl = document.getElementById('g-error');
  var successEl = document.getElementById('growth-success');
  var fallbackEl = document.getElementById('growth-fallback');

  function showError(on) {
    if (!errorEl) return;
    errorEl.classList.toggle('show', on);
  }

  function buildMessage() {
    var lines = ['Website enquiry — Growth Partnership', ''];
    lines.push('Name: ' + nameEl.value.trim());
    lines.push('Business: ' + bizEl.value.trim());
    if (siteEl.value.trim()) lines.push('Website: ' + siteEl.value.trim());
    if (needEl.value) lines.push('Needs: ' + needEl.value);
    if (budgetEl.value) lines.push('Monthly budget: ' + budgetEl.value);
    return lines.join('\n');
  }

  function buildUrl() {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(buildMessage());
  }

  [nameEl, bizEl].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', function () {
      if (el.value.trim() !== '') showError(false);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!nameEl.value.trim() || !bizEl.value.trim()) {
      showError(true);
      (nameEl.value.trim() ? bizEl : nameEl).focus();
      return;
    }
    showError(false);

    var url = buildUrl();
    if (fallbackEl) fallbackEl.href = url;

    try {
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      /* the fallback link stays available */
    }

    form.style.display = 'none';
    if (successEl) successEl.classList.add('show');
  });
})();
