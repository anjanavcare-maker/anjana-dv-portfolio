/* Anjana DV — Portfolio · interactions
   Filter · scroll-spy · reveal · form validation · misc chrome */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── footer year & clock ─────────────────────────────────── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var clockEl = document.getElementById('clock');
  function tickClock() {
    if (!clockEl) return;
    try {
      var now = new Date();
      var ist = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
      });
      clockEl.textContent = 'Kochi · ' + ist + ' IST';
    } catch (e) { /* keep static */ }
  }
  tickClock();
  if (!reduceMotion) setInterval(tickClock, 60000);

  /* ─── mobile menu ─────────────────────────────────────────── */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileMenu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        mobileMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ─── scroll reveal ───────────────────────────────────────── */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ─── back to top ─────────────────────────────────────────── */
  var toTop = document.getElementById('to-top');
  if (toTop) {
    var onScrollTT = function () {
      toTop.classList.toggle('show', window.scrollY > 640);
    };
    window.addEventListener('scroll', onScrollTT, { passive: true });
    onScrollTT();
    toTop.addEventListener('click', function () {
      if (reduceMotion) window.scrollTo(0, 0);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ─── scroll spy (active nav link) ────────────────────────── */
  var spyLinks = document.querySelectorAll('.nav-links a[data-spy]');
  var spySections = [];
  spyLinks.forEach(function (a) {
    var sec = document.getElementById(a.getAttribute('data-spy'));
    if (sec) spySections.push({ link: a, sec: sec });
  });
  if (spySections.length && 'IntersectionObserver' in window) {
    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          spyLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          var hit = spySections.filter(function (s) { return s.sec === en.target; })[0];
          if (hit) hit.link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-38% 0px -55% 0px' });
    spySections.forEach(function (s) { spyIO.observe(s.sec); });
  }

  /* ─── portfolio filter ────────────────────────────────────── */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('#work-grid .work-card:not(.cta-card)');
  var countEl = document.getElementById('work-count');

  function applyFilter(key) {
    var shown = 0;
    cards.forEach(function (card) {
      var cats = (card.getAttribute('data-cats') || '').split(/\s+/);
      var match = key === 'all' || cats.indexOf(key) !== -1;
      card.classList.toggle('is-hidden', !match);
      if (match) shown++;
    });
    if (countEl) {
      var liveShown = 0;
      cards.forEach(function (c) {
        if (!c.classList.contains('is-hidden') &&
            (c.getAttribute('data-cats') || '').indexOf('live') !== -1) liveShown++;
      });
      countEl.textContent = shown + ' project' + (shown === 1 ? '' : 's') +
        (liveShown > 0 ? ' · ' + liveShown + ' live' : '');
    }
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  /* ─── card pointer glow (desktop, fine pointers only) ─────── */
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.work-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ─── cursor sparkle: web-designer elements ────────────────── */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var FX_ICONS = [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M6.5 7.5l3.4 9 2.1-6.5 2.1 6.5 3.4-9"/></svg>', /* WordPress */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5h10M7 12h10M7 19h10M7 5v14"/></svg>', /* Elementor E */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>', /* Instagram */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8.5h3V5h-3a4 4 0 0 0-4 4v3H7v3h3v6h3v-6h3l.6-3H13V9a1 1 0 0 1 1-0.5z"/></svg>', /* Facebook */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="4" r="2.4"/><circle cx="12" cy="11" r="2.4"/><circle cx="12" cy="18" r="2.4"/><circle cx="5.2" cy="14.6" r="2.4"/><circle cx="18.8" cy="14.6" r="2.4"/></svg>', /* Figma */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6l-5 6 5 6M16 6l5 6-5 6"/></svg>', /* code */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 0 0 0 18h1.4a2 2 0 0 0 1.5-3.4 1.9 1.9 0 0 1 1-1.7H14a5 5 0 0 0 5-5c0-3.3-3.1-6-7-6z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/></svg>', /* palette */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>', /* layout */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 2 5.5 5 5.5 9l-2.8 6H9.3L6.5 12c0-4 2.5-7 5.5-9z"/><circle cx="12" cy="10" r="1.6"/><path d="M9 18c-1 1-1.5 3-1.5 3s2-.5 3-1.5M15 18c1 1 1.5 3 1.5 3s-2-.5-3-1.5"/></svg>', /* rocket */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 3l7 18 2.6-7.6L22 11z"/></svg>', /* cursor */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>', /* SEO */
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M10.5 18h3"/></svg>' /* responsive */
    ];
    var FX_COLORS = ['var(--accent)', 'var(--amber)', 'var(--fg)'];
    var fxLive = 0;
    function fxIcon() { return FX_ICONS[Math.floor(Math.random() * FX_ICONS.length)]; }
    function fxColor() { return FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)]; }

    function spawnFx(x, y, opts) {
      opts = opts || {};
      if (fxLive > 120 || !document.body) return;
      var p = document.createElement('span');
      p.className = 'fx-p';
      p.innerHTML = fxIcon();
      p.style.color = fxColor();
      var size = opts.size || (18 + Math.random() * 18);
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      document.body.appendChild(p);
      fxLive++;
      if (!p.animate) { p.remove(); fxLive--; return; }

      var angle = Math.random() * Math.PI * 2;
      var dist = 40 + Math.random() * 90;
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist - 26;
      var rot = (Math.random() - 0.5) * 200;
      var dur = 560 + Math.random() * 420;
      var anim = p.animate([
        { transform: 'translate(-50%,-50%) translate(0px,0px) scale(0.4) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%,-50%) translate(' + (dx * 0.5) + 'px,' + (dy * 0.5) + 'px) scale(1) rotate(' + (rot * 0.5) + 'deg)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) scale(1.15) rotate(' + rot + 'deg)', opacity: 0 }
      ], { duration: dur, easing: 'cubic-bezier(.16,.84,.44,1)' });
      anim.onfinish = function () { p.remove(); fxLive--; };
    }

    function burstFx(x, y) {
      var n = 10 + Math.floor(Math.random() * 6);
      for (var i = 0; i < n; i++) spawnFx(x, y);
    }

    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      burstFx(e.clientX, e.clientY);
    });

    var lastTrail = 0;
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var now = Date.now();
      if (now - lastTrail < 90) return;
      lastTrail = now;
      spawnFx(e.clientX, e.clientY, { size: 12 + Math.random() * 10 });
    });
  }

  /* ─── contact form ────────────────────────────────────────── */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var NAME_RE = /^[^0-9<>@/\\]{2,80}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(fieldEl, on) {
    fieldEl.closest('.field').classList.toggle('invalid', on);
    fieldEl.setAttribute('aria-invalid', on ? 'true' : 'false');
    var msg = fieldEl.closest('.field').querySelector('.field-error');
    if (msg) msg.setAttribute('role', 'alert');
  }

  function validateName(input, showErr) {
    var ok = NAME_RE.test(input.value.trim());
    if (showErr && !ok) setError(input, true);
    return ok;
  }

  function validateEmail(input, showErr) {
    var v = input.value.trim();
    var ok = EMAIL_RE.test(v);
    if (showErr && !ok) setError(input, true);
    return ok;
  }

  function validateMsg(input, showErr) {
    var ok = input.value.trim().length >= 20;
    if (showErr && !ok) setError(input, true);
    return ok;
  }

  var fName = document.getElementById('f-name');
  var fEmail = document.getElementById('f-email');
  var fMsg = document.getElementById('f-msg');
  var fType = document.getElementById('f-type');
  var charHint = document.getElementById('char-hint');

  /* blur → first validation ; then re-validate on input while invalid */
  [[fName, validateName], [fEmail, validateEmail], [fMsg, validateMsg]].forEach(function (pair) {
    var input = pair[0], fn = pair[1];
    input.addEventListener('blur', function () {
      if (input.value.trim() !== '') fn(input, true);
    });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('invalid')) fn(input, true);
    });
  });

  if (fMsg && charHint) {
    fMsg.addEventListener('input', function () {
      charHint.textContent = fMsg.value.length + ' / 800';
    });
  }

  function buildMailto() {
    var subject = 'Website enquiry — ' + (fType.value ? fType.value : 'New project');
    var body =
      'Name: ' + fName.value.trim() + '\n' +
      'Email: ' + fEmail.value.trim() + '\n' +
      'Project type: ' + (fType.value || '—') + '\n\n' +
      fMsg.value.trim() + '\n';
    return 'mailto:hello@anjanadv.com?subject=' + encodeURIComponent(subject) +
           '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var okName = validateName(fName, true);
    var okEmail = validateEmail(fEmail, true);
    var okMsg = validateMsg(fMsg, true);
    if (!(okName && okEmail && okMsg)) {
      var firstInvalid = form.querySelector('.field.invalid .input, .field.invalid .textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    var mailto = buildMailto();
    var fallback = document.getElementById('mailto-fallback');
    if (fallback) fallback.href = mailto;
    try { window.location.href = mailto; } catch (err) { /* fallback link available */ }
    form.style.display = 'none';
    var success = document.getElementById('form-success');
    if (success) success.classList.add('show');
  });

  /* select: clear invalid state when user picks an option */
  if (fType) {
    fType.addEventListener('change', function () { setError(fType, false); });
  }
})();

/* ─── website planner tool ───────────────────────────────────── */
(function () {
  'use strict';
  var nameEl = document.getElementById('pl-name');
  var domainEl = document.getElementById('pl-domain');
  var catEl = document.getElementById('pl-category');
  var pagesEl = document.getElementById('pl-pages');
  var taglineEl = document.getElementById('pl-tagline');
  var phoneEl = document.getElementById('pl-phone');
  var addressEl = document.getElementById('pl-address');
  var servicesEl = document.getElementById('pl-services');
  var hoursEl = document.getElementById('pl-hours');
  var photosEl = document.getElementById('pl-photos');
  var photoNoteEl = document.getElementById('pl-photo-note');
  var mock = document.getElementById('pl-mock');
  var urlEl = document.getElementById('pl-url');
  var themesEl = document.getElementById('pl-themes');
  if (!nameEl || !mock) return;

  var CATS = {
    restaurant:  { tag: 'Restaurant',  title: 'Great food, made with love.', sub: 'Menus, offers and reservations — all in one place.', cta: 'View menu', services: ['Biryani', 'Kerala meals', 'Desserts', 'Home delivery'] },
    bakery:      { tag: 'Bakery',      title: 'Fresh from the oven daily.', sub: 'Cakes, breads and treats for every occasion.', cta: 'Order now', services: ['Custom cakes', 'Fresh bread', 'Pastries', 'Party orders'] },
    clinic:      { tag: 'Healthcare',  title: 'Care you can trust.', sub: 'Doctors, services and easy appointment booking.', cta: 'Book appointment', services: ['General medicine', 'Consultations', 'Lab tests', 'Health packages'] },
    dental:      { tag: 'Dental',      title: 'Healthy smiles for life.', sub: 'Modern dental care with a gentle touch.', cta: 'Book a visit', services: ['Cleanings', 'Root canals', 'Braces', 'Whitening'] },
    pharmacy:    { tag: 'Pharmacy',    title: 'Your health, our priority.', sub: 'Medicines, wellness products and doorstep delivery.', cta: 'Order medicines', services: ['Prescriptions', 'Wellness products', 'Home delivery', 'Health advice'] },
    gym:         { tag: 'Gym & Fitness',title: 'Stronger every single day.', sub: 'Training, classes and nutrition to hit your goals.', cta: 'Join now', services: ['Personal training', 'Group classes', 'Diet plans', 'Yoga'] },
    salon:       { tag: 'Beauty',      title: 'Look and feel amazing.', sub: 'Hair, skin and styling by expert hands.', cta: 'Book a slot', services: ['Hair styling', 'Facials', 'Makeup', 'Nail care'] },
    spa:         { tag: 'Spa & Wellness', title: 'Relax. Recharge. Repeat.', sub: 'Therapies and packages for body and mind.', cta: 'Book a session', services: ['Massages', 'Body therapies', 'Facial rituals', 'Couple packages'] },
    education:   { tag: 'Education',   title: 'Learn. Grow. Succeed.', sub: 'Courses, admissions and student success stories.', cta: 'Apply now', services: ['Courses', 'Admissions', 'Scholarships', 'Career guidance'] },
    coaching:    { tag: 'Coaching',    title: 'Unlock your full potential.', sub: 'Tuition and coaching that gets results.', cta: 'Start learning', services: ['Expert tuition', 'Exam prep', 'Doubt clearing', 'Online classes'] },
    realestate:  { tag: 'Real estate', title: 'Find your perfect space.', sub: 'Listings, projects and open houses near you.', cta: 'Browse listings', services: ['Apartments', 'Villas', 'Commercial', 'Land plots'] },
    construction:{ tag: 'Construction',title: 'Built to last.', sub: 'Projects, quality and on-time delivery you can trust.', cta: 'Get a quote', services: ['Residential', 'Commercial', 'Renovation', 'Interiors'] },
    interior:    { tag: 'Interiors',   title: 'Spaces that feel like you.', sub: 'Design, décor and turnkey interior solutions.', cta: 'Design my space', services: ['Home interiors', 'Office interiors', '3D design', 'Turnkey fit-out'] },
    retail:      { tag: 'Retail',      title: 'Everything you need, in one place.', sub: 'New arrivals, offers and store locations.', cta: 'Shop now', services: ['New arrivals', 'Best sellers', 'Offers', 'Store locator'] },
    fashion:     { tag: 'Fashion',     title: 'Style that speaks for you.', sub: 'Collections, trends and seasonal drops.', cta: 'Explore collection', services: ['New collection', 'Ethnic wear', 'Accessories', 'Custom orders'] },
    jewellery:   { tag: 'Jewellery',   title: 'Crafted for your moments.', sub: 'Gold, diamond and bridal collections.', cta: 'View collection', services: ['Gold', 'Diamond', 'Bridal sets', 'Custom design'] },
    electronics: { tag: 'Electronics', title: 'Latest tech, right price.', sub: 'Gadgets, accessories and expert support.', cta: 'Shop now', services: ['Mobiles', 'Laptops', 'Accessories', 'Repairs'] },
    auto:        { tag: 'Auto care',   title: 'Keep it running like new.', sub: 'Service, parts and detailing under one roof.', cta: 'Book service', services: ['General service', 'Engine care', 'Detailing', 'Spare parts'] },
    travel:      { tag: 'Travel',      title: 'Your next journey starts here.', sub: 'Packages, visas and unforgettable itineraries.', cta: 'Plan a trip', services: ['Holiday packages', 'Visa assistance', 'Flight & hotel', 'Custom tours'] },
    hotel:       { tag: 'Hotel',       title: 'A home away from home.', sub: 'Rooms, dining and experiences worth staying for.', cta: 'Book a stay', services: ['Rooms & suites', 'Restaurant', 'Events', 'Amenities'] },
    wedding:     { tag: 'Weddings',    title: 'Moments made unforgettable.', sub: 'Planning, décor and photography for your big day.', cta: 'Plan my wedding', services: ['Wedding planning', 'Décor', 'Photography', 'Catering'] },
    photography: { tag: 'Photography', title: 'Frozen in time, forever.', sub: 'Portraits, events and creative shoots.', cta: 'Book a shoot', services: ['Weddings', 'Portraits', 'Events', 'Product shoots'] },
    legal:       { tag: 'Legal',       title: 'Your rights, protected.', sub: 'Expert legal advice and representation when it matters.', cta: 'Book consultation', services: ['Consultation', 'Documentation', 'Dispute resolution', 'Contracts'] },
    accounting:  { tag: 'Accounting',  title: 'Numbers you can trust.', sub: 'Accounts, tax and compliance handled for you.', cta: 'Get a consult', services: ['Bookkeeping', 'GST & tax', 'Payroll', 'Audits'] },
    it:          { tag: 'IT services', title: 'Technology that works for you.', sub: 'Web, software and support for growing businesses.', cta: 'Start a project', services: ['Web development', 'Software', 'Cloud setup', 'IT support'] },
    homeservices:{ tag: 'Home services', title: 'Home fixed, hassle gone.', sub: 'Repairs, installation and cleaning, done right.', cta: 'Book a service', services: ['Plumbing', 'Electrical', 'AC service', 'Cleaning'] },
    logistics:   { tag: 'Logistics',   title: 'Delivered on time, every time.', sub: 'Freight, transport and tracking services.', cta: 'Get a quote', services: ['Freight', 'Courier', 'Warehousing', 'Tracking'] },
    other:       { tag: 'Business',    title: 'Your brand, beautifully online.', sub: 'Tell your story and turn visitors into customers.', cta: 'Get started', services: ['Service one', 'Service two', 'Service three', 'Service four'] }
  };

  var SECTION_LABELS = ['Home', 'About', 'Services', 'Gallery', 'Contact', 'Testimonials', 'Pricing', 'Blog', 'FAQ', 'Portfolio', 'Team', 'Careers'];

  var color = '#A855F7';
  var template = 'classic';
  var photos = [];
  var MAX_PHOTOS = 6;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function val(el) { return el ? el.value.trim() : ''; }
  function slug(s) {
    var v = s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24);
    return v || 'yourbusiness';
  }
  function cleanDomain(s) {
    return s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/[/?#].*$/, '').replace(/\/+$/, '');
  }

  /* ─── estimate ─── */
  var estEl = document.getElementById('pl-est');
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function estimateRange() {
    var pageCount = parseInt(pagesEl.value, 10) || 5;
    var base = { 3: [5000, 6000], 5: [5000, 8000], 8: [8000, 12000], 12: [12000, 18000] }[pageCount] || [5000, 8000];
    var tpl = template === 'showcase' ? 2500 : (template === 'modern' ? 1500 : 0);
    return [base[0] + tpl, base[1] + tpl];
  }
  function updateEstimate() {
    if (!estEl) return;
    var r = estimateRange();
    estEl.textContent = inr(r[0]) + ' – ' + inr(r[1]);
  }

  /* ─── render preview ─── */
  function render() {
    var name = val(nameEl) || 'Your Business';
    var cat = CATS[catEl.value] || CATS.other;
    var pageCount = parseInt(pagesEl.value, 10) || 5;
    var sections = SECTION_LABELS.slice(0, Math.max(3, pageCount));
    var domain = val(domainEl);
    var tagline = val(taglineEl);
    var phone = val(phoneEl);
    var address = val(addressEl);
    var servicesRaw = val(servicesEl);
    var hours = val(hoursEl);

    var displayDomain = domain ? cleanDomain(domain) : slug(name) + '.com';
    if (urlEl) urlEl.textContent = displayDomain;

    var services = servicesRaw ? servicesRaw.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 6) : cat.services;

    mock.style.setProperty('--pa', color);
    mock.classList.toggle('is-dynamic', false);
    mock.dataset.tpl = template;
    mock.classList.remove('tpl-classic', 'tpl-modern', 'tpl-showcase');
    mock.classList.add('tpl-' + template);

    var secHtml = sections.map(function (label) {
      return '<div class="pl-mock-sec"><span class="pl-mock-sec-title">' + esc(label) + '</span><i class="w40"></i><i></i><i></i></div>';
    }).join('');

    var contactBits = [];
    if (phone) contactBits.push('<span class="pl-mock-chip no-ic">' + esc(phone) + '</span>');
    if (address) contactBits.push('<span class="pl-mock-chip no-ic">' + esc(address) + '</span>');
    if (hours) contactBits.push('<span class="pl-mock-chip no-ic">' + esc(hours) + '</span>');
    var contactHtml = contactBits.length
      ? '<div class="pl-mock-contact">' + contactBits.join('') + '</div>' : '';

    var servicesHtml = '<div class="pl-mock-services">' +
      '<div class="pl-mock-sec-title">' + esc(cat.tag) + ' · services</div>' +
      services.map(function (s) { return '<span class="pl-mock-svc">' + esc(s) + '</span>'; }).join('') +
      '</div>';

    var galleryHtml = photos.length
      ? '<div class="pl-mock-gallery">' + photos.slice(0, 4).map(function (p) {
          return '<span class="pl-mock-photo" style="background-image:url(\'' + p + '\')"></span>';
        }).join('') + '</div>'
      : '<div class="pl-mock-gallery ghoul">' +
        [0, 1, 2, 3].map(function () { return '<span class="pl-mock-photo"></span>'; }).join('') +
        '</div>';

    var heroPhoto = photos.length
      ? '<span class="pl-mock-hero-img" style="background-image:url(\'' + photos[0] + '\')"></span>'
      : '';

    var heroLayout = template === 'showcase'
      ? '<div class="pl-mock-hero tpl-hero-showcase">' + heroPhoto +
          '<div class="pl-mock-hero-in"><span class="pl-mock-eyebrow">' + esc(cat.tag) + '</span>' +
          '<div class="pl-mock-h1">' + esc(tagline || cat.title) + '</div>' +
          '<div class="pl-mock-sub">' + esc(cat.sub) + '</div>' +
          '<span class="pl-mock-cta">' + esc(cat.cta) + '</span></div></div>'
      : '<div class="pl-mock-hero">' + heroPhoto +
          '<div class="pl-mock-hero-in"><span class="pl-mock-eyebrow">' + esc(cat.tag) + '</span>' +
          '<div class="pl-mock-h1">' + esc(tagline || cat.title) + '</div>' +
          '<div class="pl-mock-sub">' + esc(cat.sub) + '</div>' +
          '<span class="pl-mock-cta">' + esc(cat.cta) + '</span></div></div>';

    mock.innerHTML =
      '<div class="pl-mock-nav">' +
        '<span class="pl-mock-logo">' + esc(name) + '</span>' +
        '<span class="pl-mock-link">' + esc(displayDomain) + '</span>' +
        '<span class="pl-mock-links"><i></i><i></i><i></i></span>' +
      '</div>' +
      heroLayout +
      contactHtml +
      servicesHtml +
      galleryHtml +
      '<div class="pl-mock-sections' + (template === 'showcase' ? ' cols2' : '') + '">' + secHtml + '</div>';

    updateEstimate();
    renderThemes(catEl.value);
  }

  /* ─── real theme inspiration strip (Round C) ─── */
  function renderThemes(catKey) {
    if (!themesEl) return;
    var list = (window.PLANNER_THEMES && window.PLANNER_THEMES[catKey]) || [];
    if (!list.length) { themesEl.innerHTML = ''; return; }
    themesEl.innerHTML =
      '<p class="pl-themes-title">Real free WordPress themes in this style — tap to explore</p>' +
      '<div class="pl-themes-row">' +
      list.map(function (t) {
        return '<a class="pl-theme-card" href="' + esc(t.url) + '" target="_blank" rel="noopener">' +
          '<img class="pl-theme-thumb" src="' + esc(t.thumb) + '" alt="' + esc(t.name) + ' theme preview" loading="lazy" onerror="this.closest(\'.pl-theme-card\').style.display=\'none\'">' +
          '<span class="pl-theme-name">' + esc(t.name) + '</span></a>';
      }).join('') +
      '</div>';
  }

  /* ─── listeners ─── */
  if (nameEl) nameEl.addEventListener('input', render);
  if (domainEl) domainEl.addEventListener('input', render);
  if (catEl) catEl.addEventListener('change', render);
  if (pagesEl) pagesEl.addEventListener('change', render);
  if (taglineEl) taglineEl.addEventListener('input', render);
  if (phoneEl) phoneEl.addEventListener('input', render);
  if (addressEl) addressEl.addEventListener('input', render);
  if (servicesEl) servicesEl.addEventListener('input', render);
  if (hoursEl) hoursEl.addEventListener('input', render);

  var swatches = document.querySelectorAll('.pl-swatch');
  swatches.forEach(function (s) {
    s.addEventListener('click', function () {
      swatches.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
      s.classList.add('is-active'); s.setAttribute('aria-pressed', 'true');
      color = s.getAttribute('data-color');
      render();
    });
  });

  var tpls = document.querySelectorAll('.pl-tpl');
  tpls.forEach(function (s) {
    s.addEventListener('click', function () {
      tpls.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
      s.classList.add('is-active'); s.setAttribute('aria-pressed', 'true');
      template = s.getAttribute('data-tpl');
      render();
    });
  });

  /* ─── photo upload: client-side only ─── */
  function downscale(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var maxW = 1000;
        var w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try { cb(c.toDataURL('image/jpeg', 0.82)); }
        catch (e) { cb(null); }
      };
      img.onerror = function () { cb(null); };
      img.src = reader.result;
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(file);
  }

  if (photosEl) {
    photosEl.addEventListener('change', function () {
      var files = Array.prototype.slice.call(photosEl.files || []);
      var room = MAX_PHOTOS - photos.length;
      var todo = files.slice(0, room);
      todo.forEach(function (f) {
        downscale(f, function (dataUrl) {
          if (dataUrl) { photos.push(dataUrl); render(); }
        });
      });
      photosEl.value = '';
    });
  }
  if (photoNoteEl) {
    var noteTimer = null;
    (function () {
      var orig = photoNoteEl.textContent;
      setInterval(function () {
        if (!photosEl) return;
        var n = photos.length;
        photoNoteEl.textContent = n
          ? n + ' of ' + MAX_PHOTOS + ' photos added — showing in the preview. Photos never leave this device.'
          : orig;
      }, 400);
    })();
  }

  /* ─── WhatsApp lead capture ─── */
  var sendBtn = document.getElementById('pl-send');
  var contactEmail = document.getElementById('pl-contact-email');
  /* TODO: replace with Anjana's real WhatsApp number (digits only, country code, no + or spaces) */
  var WHATSAPP_NUMBER = '919999999999';

  function planSummary() {
    var name = val(nameEl) || 'Your Business';
    var cat = CATS[catEl.value] || CATS.other;
    var domain = val(domainEl) ? cleanDomain(val(domainEl)) : slug(name) + '.com';
    var r = estimateRange();
    var email = contactEmail ? contactEmail.value.trim() : '';
    return {
      name: name,
      domain: domain,
      category: cat.tag,
      template: template,
      colour: activeSwatchLabel(),
      pages: pagesEl.options[pagesEl.selectedIndex].text,
      services: val(servicesEl),
      phone: val(phoneEl),
      address: val(addressEl),
      hours: val(hoursEl),
      tagline: val(taglineEl),
      photos: photos.length,
      budget: inr(r[0]) + ' – ' + inr(r[1]),
      email: email
    };
  }

  function activeSwatchLabel() {
    var act = document.querySelector('.pl-swatch.is-active');
    return act ? act.getAttribute('aria-label') : 'Violet';
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', function () {
      var p = planSummary();
      var emailLine = p.email ? ('\nMy email: ' + p.email) : '';
      var text =
        'Website plan request — ' + p.name + '\n\n' +
        'Business name: ' + p.name + '\n' +
        'Domain: ' + p.domain + '\n' +
        'Category: ' + p.category + '\n' +
        'Template: ' + p.template.charAt(0).toUpperCase() + p.template.slice(1) + '\n' +
        'Theme colour: ' + p.colour + '\n' +
        'Pages: ' + p.pages +
        (p.tagline ? ('\nTagline: ' + p.tagline) : '') +
        (p.phone ? ('\nPhone: ' + p.phone) : '') +
        (p.address ? ('\nAddress: ' + p.address) : '') +
        (p.services ? ('\nServices: ' + p.services) : '') +
        (p.hours ? ('\nHours/offers: ' + p.hours) : '') +
        (p.photos ? ('\nPhotos added: ' + p.photos) : '') +
        '\nEstimated budget: ' + p.budget +
        emailLine + '\n\n' +
        'Notes for Anjana:\n';
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  render();
  updateEstimate();
})();

/* ─── scroll progress line (v2) ─────────────────────────────── */
(function () {
  var bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  function onScroll() {
    var d = document.documentElement;
    var max = d.scrollHeight - d.clientHeight;
    var p = max > 0 ? Math.min(1, d.scrollTop / max) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

/* ─── planner extras: device toggle, persistence, progress, print (v2) ─── */
(function () {
  var mock = document.getElementById('pl-mock');
  if (!mock) return;

  var nameEl = document.getElementById('pl-name');
  var domainEl = document.getElementById('pl-domain');
  var catEl = document.getElementById('pl-category');
  var pagesEl = document.getElementById('pl-pages');
  var taglineEl = document.getElementById('pl-tagline');
  var phoneEl = document.getElementById('pl-phone');
  var addressEl = document.getElementById('pl-address');
  var servicesEl = document.getElementById('pl-services');
  var hoursEl = document.getElementById('pl-hours');
  var emailEl = document.getElementById('pl-contact-email');
  var photoNoteEl = document.getElementById('pl-photo-note');

  var FIELDS = [nameEl, domainEl, taglineEl, phoneEl, addressEl, servicesEl, hoursEl, emailEl].filter(Boolean);
  var STORAGE_KEY = 'anjanaPlannerV1';

  /* device toggle */
  var devices = document.querySelectorAll('.pl-device');
  devices.forEach(function (d) {
    d.addEventListener('click', function () {
      devices.forEach(function (x) { x.classList.remove('is-active'); x.setAttribute('aria-pressed', 'false'); });
      d.classList.add('is-active'); d.setAttribute('aria-pressed', 'true');
      mock.classList.toggle('is-mobile', d.getAttribute('data-device') === 'mobile');
    });
  });

  /* persistence */
  function persist() {
    try {
      var tplBtn = document.querySelector('.pl-tpl.is-active');
      var swatchBtn = document.querySelector('.pl-swatch.is-active');
      var data = {
        name: nameEl ? nameEl.value : '',
        domain: domainEl ? domainEl.value : '',
        category: catEl ? catEl.value : '',
        pages: pagesEl ? pagesEl.value : '',
        tagline: taglineEl ? taglineEl.value : '',
        phone: phoneEl ? phoneEl.value : '',
        address: addressEl ? addressEl.value : '',
        services: servicesEl ? servicesEl.value : '',
        hours: hoursEl ? hoursEl.value : '',
        email: emailEl ? emailEl.value : '',
        template: tplBtn ? (tplBtn.getAttribute('data-tpl') || 'classic') : 'classic',
        color: swatchBtn ? (swatchBtn.getAttribute('data-color') || '#A855F7') : '#A855F7'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function restore() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) {}
    if (!data) return;
    function setVal(el, v) {
      if (el && v != null) {
        el.value = v;
        el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      }
    }
    setVal(nameEl, data.name);
    setVal(domainEl, data.domain);
    setVal(catEl, data.category);
    setVal(pagesEl, data.pages);
    setVal(taglineEl, data.tagline);
    setVal(phoneEl, data.phone);
    setVal(addressEl, data.address);
    setVal(servicesEl, data.services);
    setVal(hoursEl, data.hours);
    setVal(emailEl, data.email);
    if (data.template) {
      var t = document.querySelector('.pl-tpl[data-tpl="' + data.template + '"]');
      if (t) t.click();
    }
    if (data.color) {
      var s = document.querySelector('.pl-swatch[data-color="' + data.color + '"]');
      if (s) s.click();
    }
  }

  var saveTimer = null;
  FIELDS.forEach(function (el) {
    el.addEventListener('input', function () { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 300); });
  });
  [catEl, pagesEl].forEach(function (el) {
    if (el) el.addEventListener('change', persist);
  });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && (t.classList.contains('pl-tpl') || t.classList.contains('pl-swatch'))) persist();
  });

  /* progress */
  var countEl = document.getElementById('pl-progress-count');
  var fillEl = document.getElementById('pl-progress-fill');
  function updateProgress() {
    if (!countEl || !fillEl) return;
    var total = FIELDS.length;
    var filled = FIELDS.filter(function (el) { return el.value && el.value.trim() !== ''; }).length;
    countEl.textContent = filled + ' of ' + total + ' details';
    fillEl.style.width = (filled / total * 100) + '%';
  }
  FIELDS.forEach(function (el) { el.addEventListener('input', updateProgress); });

  /* print plan card */
  var printBtn = document.getElementById('pl-print');
  var card = document.getElementById('pl-print-card');
  function inr(n) { return '₹' + n.toLocaleString('en-IN'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function estimate() {
    var pageCount = parseInt(pagesEl ? pagesEl.value : '5', 10) || 5;
    var base = { 3: [5000, 6000], 5: [5000, 8000], 8: [8000, 12000], 12: [12000, 18000] }[pageCount] || [5000, 8000];
    var tplBtn = document.querySelector('.pl-tpl.is-active');
    var tpl = tplBtn ? tplBtn.getAttribute('data-tpl') : 'classic';
    var bonus = tpl === 'showcase' ? 2500 : (tpl === 'modern' ? 1500 : 0);
    return [base[0] + bonus, base[1] + bonus];
  }
  if (printBtn && card) {
    printBtn.addEventListener('click', function () {
      var name = (nameEl ? nameEl.value.trim() : '') || 'Your Business';
      var domain = (domainEl ? domainEl.value.trim() : '') ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) + '.com';
      var cat = catEl ? catEl.options[catEl.selectedIndex].text : 'Business';
      var tplBtn = document.querySelector('.pl-tpl.is-active');
      var tpl = tplBtn ? tplBtn.getAttribute('data-tpl') : 'classic';
      var swatch = document.querySelector('.pl-swatch.is-active');
      var colour = swatch ? swatch.getAttribute('aria-label') : 'Violet';
      var pages = pagesEl ? pagesEl.options[pagesEl.selectedIndex].text : '5 pages';
      var r = estimate();
      var photoN = 0;
      if (photoNoteEl) { var m = photoNoteEl.textContent.match(/(\d+) of (\d+)/); if (m) photoN = parseInt(m[1], 10) || 0; }
      var rows = [
        ['Business name', name],
        ['Domain', domain],
        ['Category', cat],
        ['Template', tpl.charAt(0).toUpperCase() + tpl.slice(1)],
        ['Theme colour', colour],
        ['Pages', pages],
        ['Estimated budget', inr(r[0]) + ' – ' + inr(r[1])]
      ];
      function opt(el, label) { var v = el ? el.value.trim() : ''; if (v) rows.push([label, v]); }
      opt(taglineEl, 'Tagline');
      opt(phoneEl, 'Phone / WhatsApp');
      opt(addressEl, 'Address');
      opt(servicesEl, 'Services');
      opt(hoursEl, 'Hours / offer');
      opt(emailEl, 'Email');
      if (photoN) rows.push(['Photos', photoN + ' photo' + (photoN === 1 ? '' : 's') + ' included']);
      var body = rows.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('');
      card.innerHTML =
        '<h2>' + esc(name) + ' — Website plan</h2>' +
        '<p class="pp-domain">' + esc(domain) + '</p>' +
        '<table>' + body + '</table>' +
        '<p class="pp-foot">Prepared with the Anjana DV website planner · ' + new Date().toLocaleDateString('en-IN') + '</p>';
      window.print();
    });
  }

  restore();
  updateProgress();
})();