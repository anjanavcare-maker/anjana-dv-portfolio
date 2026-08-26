/* auth-gate.js - passcode gate for the Visual Editor (/admin/).
 * Front-door protection: checks the passcode in the browser and keeps the
 * session for this tab. The real write-protection is the serverless api
 * routes, which now require this same passcode as the x-admin-key header
 * (Vercel env ADMIN_KEY) - so a passcode is required to publish too.
 */
(function () {
  'use strict';
  var OK = 'admin-ok';
  var PASS = 'admin-pass';
  var HASH = '43fbd826b065898d94df6e29a6b1f446a5d5135b6bf12966afe061d8a630632b';
  var FALLBACK = 'NjIwMi1uaW1kYS1hbmFqbmE=';
  if (sessionStorage.getItem(OK) === '1') return;

  var screen = document.getElementById('login-screen');
  if (!screen) return;
  screen.hidden = false;
  document.body.classList.add('locked');

  function digestHex(str) {
    var buf = new TextEncoder().encode(str);
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', buf).then(function (d) {
        var out = '';
        new Uint8Array(d).forEach(function (b) { out += ('0' + b.toString(16)).slice(-2); });
        return out;
      });
    }
    var rev = str.split('').reverse().join('');
    return Promise.resolve(btoa(unescape(encodeURIComponent(rev))));
  }

  var form = document.getElementById('login-form');
  var input = document.getElementById('login-pass');
  var msg = document.getElementById('login-msg');
  var btn = document.getElementById('login-btn');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value;
    if (!v) return;
    btn.disabled = true;
    digestHex(v).then(function (h) {
      if (h === HASH || btoa(unescape(encodeURIComponent(v.split('').reverse().join('')))) === FALLBACK) {
        sessionStorage.setItem(OK, '1');
        sessionStorage.setItem(PASS, v);
        location.reload();
      } else {
        msg.hidden = false;
        input.value = '';
        input.focus();
        btn.disabled = false;
      }
    });
  });
})();
