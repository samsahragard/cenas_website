/* Cena's Kitchen \u00b7 Bar Shelf (#bar)
 *
 * Loaded lazily by the small inline loader in index.html on the first
 * `ck:pageshow` event for the bar page, so the home page never downloads it.
 * Everything on the shelf is rendered from /static/data/bar_shelf.json.
 *
 * The shelf is a ring: every bottle of the current filter sits at a slot
 * offset o from the centre (0). A bottle's pose (x, y, depth, scale) is a
 * function of o along an elliptical arc, so turning the ring is just moving
 * o. Only transform and opacity are ever animated (Web Animations API, so the
 * motion can be paused/stepped with document.getAnimations()).
 */
(function () {
  'use strict';

  var root = document.getElementById('bar-shelf');
  var page = document.getElementById('page-bar');
  if (!root || !page || root.getAttribute('data-bs-init')) return;
  root.setAttribute('data-bs-init', '1');

  var DATA_URL = root.getAttribute('data-src') || '/static/data/bar_shelf.json';
  var EASE_CSS = 'cubic-bezier(.23,1,.32,1)';
  var ease = bezier(0.23, 1, 0.32, 1);
  var THETA = Math.PI / 5;         // 36 degrees between neighbouring slots
  var SIDES = 2;                   // visible slots on each side of the centre
  var TAB_MIN = 15;                // style tabs only for categories this big
  var LIST_FIRST_BELOW = 330;      // narrower than this, open on the list view
  var PANEL_BESIDE = 960;          // detail panel sits beside the stage from here
  var XFADE = 150;                 // every crossfade (caption, reduced motion)
  var RISE_MS = 240, RISE_STAGGER = 35, RISE_PX = 26;

  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var forceReduce = /[?&]motion=reduce\b/.test(location.search);
  var reduce = forceReduce || !!(reduceMq && reduceMq.matches);

  // A 1x1 AVIF: if the browser can show it, display images come as AVIF (full
  // colour, 4:4:4); otherwise the WebP twin is used. The data file lists WebP.
  var AVIF_PROBE = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAFgAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBIAAAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAHm1kYXQSAAoEOAAGCTIMGAAKKKKEAACwEpqY';
  var fmt = { avif: false };

  var data = null;
  var cats = [];
  var catById = {};
  var bottleById = {};
  var st = { cat: null, tab: 'All', view: 'shelf' };
  var ring = { items: [], els: [], n: 0, pos: 0, target: 0, move: null, token: 0, L: null };
  var geo = null;
  var ui = {};
  var built = false;
  var ringBroken = false;
  var measureRaf = 0;
  var drag = null;
  var swallowClick = false;
  var idleHandle = 0;
  var lastAnnounced = '';

  /* ------------------------------------------------------------------ utils */

  function el(tag, cls, attrs, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function mod(a, n) { return ((a % n) + n) % n; }

  // Case- and accent-insensitive search key: "Patr\u00f3n A\u00f1ejo" -> "patron anejo".
  function fold(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/['\u2018\u2019`\u00b4]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function listJoin(a) {
    if (a.length < 2) return a.join('');
    return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }

  // cubic-bezier timing function, solved by bisection (robust for any curve).
  function bezier(x1, y1, x2, y2) {
    function at(t, a, b) { var u = 1 - t; return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 24; i++) {
        t = (lo + hi) / 2;
        if (at(t, x1, x2) < x) lo = t; else hi = t;
      }
      return at(t, y1, y2);
    };
  }

  function now() { return (document.timeline && document.timeline.currentTime) || performance.now(); }

  function idle(fn) {
    if (window.requestIdleCallback) return window.requestIdleCallback(fn, { timeout: 2000 });
    return setTimeout(fn, 400);
  }
  function cancelIdle(h) {
    if (!h) return;
    if (window.cancelIdleCallback) window.cancelIdleCallback(h); else clearTimeout(h);
  }

  /* ------------------------------------------------------------ data model */

  function prepare(json) {
    if (!json || !json.categories || !json.bottles) throw new Error('bad shelf data');
    data = json;
    cats = [];
    catById = {};
    bottleById = {};
    json.categories.forEach(function (c) {
      var cat = { id: c.id, label: c.label, featured: c.featured, styles: c.styles || [], bottles: [] };
      cats.push(cat);
      catById[c.id] = cat;
    });
    json.bottles.forEach(function (b) {
      var cat = catById[b.category];
      if (!cat || !b.id) return;
      b._key = fold(b.name + ' ' + b.style + ' ' + (b.tab || ''));
      bottleById[b.id] = b;
      cat.bottles.push(b);
    });
    cats = cats.filter(function (c) { return c.bottles.length; });
    cats.forEach(function (c) {
      c.bottles.sort(function (a, b) { return a.rank - b.rank; });
      c.tabs = tabsFor(c);
    });
  }

  function tabsFor(cat) {
    if (cat.bottles.length < TAB_MIN) return [];
    var order = [];
    cat.styles.forEach(function (s) {
      cat.bottles.forEach(function (b) { if (b.style === s && order.indexOf(b.tab) === -1) order.push(b.tab); });
    });
    cat.bottles.forEach(function (b) { if (order.indexOf(b.tab) === -1) order.push(b.tab); });
    var tabs = order.filter(function (t) {
      return cat.bottles.filter(function (b) { return b.tab === t; }).length >= 2;
    });
    return tabs.length > 1 ? ['All'].concat(tabs) : [];
  }

  function filtered() {
    var cat = catById[st.cat];
    if (!cat) return [];
    if (st.tab === 'All') return cat.bottles.slice();
    return cat.bottles.filter(function (b) { return b.tab === st.tab; });
  }

  // Centre-out order: rank 1 in the centre, 2 at +1, 3 at -1, 4 at +2 ...
  // stored as a circular list read left-to-right from the centre.
  function ringOrder(list) {
    var n = list.length, seq = new Array(n);
    list.forEach(function (b, i) {
      var r = i + 1;
      var off = r === 1 ? 0 : (r % 2 === 0 ? r / 2 : -(r - 1) / 2);
      seq[mod(off, n)] = b;
    });
    return seq;
  }

  function kindOf(b) {
    var c = catById[b.category];
    return c.label.indexOf('&') !== -1 ? b.style : c.label;
  }

  function styleLine(b) {
    var kind = kindOf(b), c = catById[b.category];
    var parts = [kind];
    if (fold(b.style) !== fold(kind) && fold(b.style) !== fold(c.label)) parts.push(b.style);
    var f = b.facts || {};
    // "Whiskey \u00b7 Tennessee \u00b7 United States", not "Tennessee \u00b7 Tennessee, United States"
    var region = f.region && fold(f.region) !== fold(b.style) ? f.region : '';
    var place = [region, f.country].filter(Boolean).join(', ');
    if (place) parts.push(place);
    if (f.abv) parts.push(f.abv + ' ABV');
    return parts.join(' \u00b7 ');
  }

  function shortLine(b) {
    var parts = [b.style];
    if (b.top_shelf) parts.push('Top shelf');
    return parts.join(' \u00b7 ');
  }

  /* ------------------------------------------------------------- geometry */

  // Visible window for n bottles. For n >= 6 the ring has 2 visible slots a
  // side plus an invisible wrap slot at +-3. Smaller filters only fill
  // +1, -1, +2, -2 (in that order) and fade out half a slot past the last one,
  // so a bottle is never shown twice, even mid-turn.
  function layoutFor(n) {
    if (n >= 2 * SIDES + 2) return { lo: -n / 2, hi: n / 2, a: SIDES, b: SIDES, ea: SIDES + 1, eb: SIDES + 1 };
    var a = Math.floor((n - 1) / 2), b = Math.ceil((n - 1) / 2);
    return { lo: -a - 0.5, hi: b + 0.5, a: a, b: b, ea: a + 0.5, eb: b + 0.5 };
  }

  function wrapOff(x) {
    var n = ring.n, L = ring.L;
    if (n <= 1) return x;
    while (x <= L.lo + 1e-9) x += n;
    while (x > L.hi + 1e-9) x -= n;
    return x;
  }

  function opacityAt(o) {
    var L = ring.L;
    if (o >= -L.a - 1e-9 && o <= L.b + 1e-9) return 1;
    if (o < -L.a) return Math.max(0, Math.min(1, (o + L.ea) / (L.ea - L.a)));
    return Math.max(0, Math.min(1, (L.eb - o) / (L.eb - L.b)));
  }

  function transformAt(o, k, lift) {
    var u = Math.min(Math.abs(o), 3.4);
    var s = (1 - 0.26 * u + 0.04 * u * u) * (k || 1);
    var th = Math.max(-3.4, Math.min(3.4, o)) * THETA;
    var x = geo.rx * Math.sin(th);
    var y = -geo.ry * (1 - Math.cos(th)) + (lift || 0);
    var z = -Math.round(u * 100);
    return 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,' + z + 'px) scale(' + s.toFixed(4) + ')';
  }

  function measure() {
    var sc = ui.scene;
    var w = sc.clientWidth || root.clientWidth || 360;
    var vh = window.innerHeight || document.documentElement.clientHeight || 800;
    var phone = (window.innerWidth || w) < 600;
    // Centre bottle height follows the viewport so the shelf + caption fit a
    // screen: ~300 px on a 390x844 phone, up to 440 px on a tall desktop.
    var hc = phone ? Math.max(170, Math.min(300, vh * 0.36, w * 0.9))
                   : Math.max(300, Math.min(440, (vh - 360) / 1.24, w * 0.55));
    hc = Math.round(hc);
    var rx = Math.round(Math.min(hc * 0.71, w * (phone ? 0.47 : 0.44)));
    // A low, near-eye-level view of the table matches the straight-on bottle photos.
    var ry = Math.round(hc * (phone ? 0.10 : 0.12));
    var face = Math.round(hc * 0.09);
    var ryTop = Math.round(ry * 1.35);
    var pad = phone ? 6 : 10;
    var base = pad + face + (ryTop - ry);
    var top = 46;                      // room for the "1 of 52 \u00b7 See all as a list" corner
    var h = base + hc + top;
    geo = { w: w, hc: hc, rx: rx, ry: ry, face: face, ryTop: ryTop, base: base, h: h, phone: phone };
    var s = sc.style;
    s.setProperty('--bs-hc', hc + 'px');
    s.setProperty('--bs-rx', rx + 'px');
    s.setProperty('--bs-ry', ry + 'px');
    s.setProperty('--bs-rytop', ryTop + 'px');
    s.setProperty('--bs-face', face + 'px');
    s.setProperty('--bs-base', base + 'px');
    s.setProperty('--bs-pad', pad + 'px');
    s.height = h + 'px';
    ring.els.forEach(sizeBottle);
  }

  // Every bottle fits a bottom-aligned box no wider than 0.62 x its height.
  // Low-resolution photos are capped at 1.25 CSS px per image pixel so they
  // are never blown up into mush (they simply stand a little shorter).
  function sizeBottle(e) {
    var b = e.b, ar = (b.img && b.img.w && b.img.h) ? b.img.w / b.img.h : 0.33;
    var hc = b.img && b.img.h ? Math.min(geo.hc, b.img.h * 1.25) : geo.hc, w, hgt;
    if (ar > 0.62) { w = hc * 0.62; hgt = w / ar; } else { hgt = hc; w = hgt * ar; }
    var bw = Math.max(w, 64);
    e.node.style.width = bw.toFixed(1) + 'px';
    e.node.style.height = hgt.toFixed(1) + 'px';
    e.node.style.marginLeft = (-bw / 2).toFixed(1) + 'px';
    e.boxW = bw;
    e.boxH = hgt;
    placeShadow(e);
  }

  /* ------------------------------------------------------------------ DOM */

  function buildShell() {
    root.innerHTML = '';
    root.classList.add('bs-look-a');
    root.classList.toggle('bs-reduce', reduce);

    ui.catsWrap = el('div', 'bs-cats-wrap');
    ui.cats = el('div', 'bs-cats', { role: 'tablist', 'aria-label': 'Kinds of drink' });
    ui.catBtns = {};
    cats.forEach(function (c) {
      var b = el('button', 'bs-cat', { type: 'button', role: 'tab', id: 'bs-cat-' + c.id,
        'aria-selected': 'false', 'aria-controls': 'bs-stage', tabindex: '-1', 'data-cat': c.id }, c.label);
      ui.catBtns[c.id] = b;
      ui.cats.appendChild(b);
    });
    ui.catsWrap.appendChild(ui.cats);
    root.appendChild(ui.catsWrap);

    ui.layout = el('div', 'bs-layout');
    ui.stage = el('div', 'bs-stage', { id: 'bs-stage' });

    ui.tabsWrap = el('div', 'bs-tabs-wrap');
    ui.tabs = el('div', 'bs-tabs', { role: 'tablist', 'aria-label': 'Styles' });
    ui.tabsWrap.appendChild(ui.tabs);
    ui.stage.appendChild(ui.tabsWrap);

    ui.scene = el('div', 'bs-scene', { role: 'region', 'aria-roledescription': 'carousel',
      'aria-label': 'Bottle shelf. Left and right arrow keys turn the shelf.', tabindex: '0' });
    ui.corner = el('div', 'bs-corner');
    ui.hint = el('span', 'bs-hint');
    ui.listBtn = el('button', 'bs-listbtn', { type: 'button' }, 'See all as a list');
    ui.corner.appendChild(ui.hint);
    ui.corner.appendChild(ui.listBtn);
    // The view holds the whole set (wall light, plinth, bottles) and fades out
    // at its edges so the shelf melts into the page instead of sitting in a box.
    ui.view = el('div', 'bs-view');
    ui.wall = el('div', 'bs-wall', { 'aria-hidden': 'true' });
    ui.glow = el('div', 'bs-glow', { 'aria-hidden': 'true' });
    ui.plinth = el('div', 'bs-plinth', { 'aria-hidden': 'true' });
    ui.plinth.appendChild(el('i', 'bs-plinth-top'));
    ui.ring = el('div', 'bs-ring');
    ui.view.appendChild(ui.wall);
    ui.view.appendChild(ui.glow);
    ui.view.appendChild(ui.plinth);
    ui.view.appendChild(ui.ring);
    ui.scene.appendChild(ui.view);
    ui.scene.appendChild(ui.corner);
    ui.stage.appendChild(ui.scene);

    ui.caprow = el('div', 'bs-caprow');
    ui.prev = el('button', 'bs-arrow bs-prev', { type: 'button', 'aria-label': 'Previous bottle' });
    ui.prev.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    ui.next = el('button', 'bs-arrow bs-next', { type: 'button', 'aria-label': 'Next bottle' });
    ui.next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    ui.cap = el('div', 'bs-cap');
    ui.caprow.appendChild(ui.prev);
    ui.caprow.appendChild(ui.cap);
    ui.caprow.appendChild(ui.next);
    ui.stage.appendChild(ui.caprow);
    ui.live = el('p', 'bs-sr', { 'aria-live': 'polite', 'aria-atomic': 'true' });
    ui.stage.appendChild(ui.live);

    ui.panel = el('div', 'bs-panel', { 'aria-live': 'off' });
    ui.layout.appendChild(ui.stage);
    ui.layout.appendChild(ui.panel);
    root.appendChild(ui.layout);

    ui.list = el('div', 'bs-list', { hidden: '' });
    var bar = el('div', 'bs-listbar');
    var lab = el('label', 'bs-sr', { 'for': 'bs-q' }, 'Type a bottle name');
    ui.q = el('input', 'bs-q', { id: 'bs-q', type: 'search', placeholder: 'Type a bottle name',
      autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'search' });
    ui.back = el('button', 'bs-back', { type: 'button' }, 'Back to the shelf');
    bar.appendChild(lab);
    bar.appendChild(ui.q);
    bar.appendChild(ui.back);
    ui.listBody = el('div', 'bs-listbody');
    ui.list.appendChild(bar);
    ui.list.appendChild(ui.listBody);
    root.appendChild(ui.list);

    wire();
    built = true;
  }

  function wire() {
    ui.cats.addEventListener('click', function (e) {
      var b = e.target.closest('.bs-cat');
      if (b) selectCategory(b.getAttribute('data-cat'), { user: true });
    });
    ui.cats.addEventListener('keydown', function (e) { tablistKeys(e, ui.cats, '.bs-cat', function (b) { selectCategory(b.getAttribute('data-cat'), { user: true, keyboard: true }); }); });
    ui.cats.addEventListener('scroll', function () { edgeFade(ui.catsWrap, ui.cats); }, { passive: true });

    ui.tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.bs-tab');
      if (b) selectTab(b.getAttribute('data-tab'));
    });
    ui.tabs.addEventListener('keydown', function (e) { tablistKeys(e, ui.tabs, '.bs-tab', function (b) { selectTab(b.getAttribute('data-tab')); }); });
    ui.tabs.addEventListener('scroll', function () { edgeFade(ui.tabsWrap, ui.tabs); }, { passive: true });

    ui.prev.addEventListener('click', function () { step(-1); });
    ui.next.addEventListener('click', function () { step(1); });
    ui.listBtn.addEventListener('click', function () { st.autoList = false; showList(true, { focus: true }); });
    ui.back.addEventListener('click', function () { st.autoList = false; showList(false, { focus: true }); });
    ui.q.addEventListener('input', renderList);

    ui.ring.addEventListener('click', function (e) {
      var node = e.target.closest('.bs-bottle');
      if (!node) return;
      var e2 = elFor(node);
      if (!e2) return;
      var o = Math.round(wrapOff(e2.i - ring.target));
      if (o === 0) {
        // Phone: tapping the centred bottle brings its details into view.
        if (window.innerWidth < PANEL_BESIDE) scrollToEl(ui.panel);
        return;
      }
      focusAfter = node === document.activeElement;
      moveTo(ring.target + o, { from: 'tap' });
    });

    ui.scene.addEventListener('keydown', function (e) {
      if (ring.n < 2 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      var onBottle = !!(document.activeElement && document.activeElement.classList.contains('bs-bottle'));
      if (e.key === 'ArrowLeft') { e.preventDefault(); focusAfter = onBottle; step(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); focusAfter = onBottle; step(1); }
      else if (e.key === 'Home') { e.preventDefault(); focusAfter = onBottle; jumpToIndex(0); }
      else if (e.key === 'End') { e.preventDefault(); focusAfter = onBottle; jumpToIndex(ring.n - 1); }
    });

    // Swipe: horizontal drags turn the ring, vertical scroll still works (touch-action: pan-y).
    ui.scene.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      swallowClick = false;
    });
    ui.scene.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (Math.abs(e.clientX - drag.x) > 10) swallowClick = true;
    });
    ui.scene.addEventListener('pointerup', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && ring.n > 1) {
        swallowClick = true;
        step(dx > 0 ? -1 : 1);
      }
      if (swallowClick) setTimeout(function () { swallowClick = false; }, 350);
    });
    ui.scene.addEventListener('pointercancel', function () { drag = null; });
    ui.scene.addEventListener('click', function (e) {
      if (swallowClick) { e.preventDefault(); e.stopPropagation(); swallowClick = false; }
    }, true);
    ui.scene.addEventListener('dragstart', function (e) { e.preventDefault(); });

    ui.listBody.addEventListener('click', function (e) {
      var b = e.target.closest('.bs-li');
      if (b) pickFromList(b.getAttribute('data-id'));
    });
  }

  var focusAfter = false;

  function tablistKeys(e, list, sel, activate) {
    var items = Array.prototype.slice.call(list.querySelectorAll(sel));
    var i = items.indexOf(document.activeElement);
    if (i === -1) return;
    var j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = items.length - 1;
    if (j === -1) return;
    e.preventDefault();
    items[j].focus();
    activate(items[j]);
  }

  function edgeFade(wrap, scroller) {
    var max = scroller.scrollWidth - scroller.clientWidth;
    var over = max > 2;
    wrap.classList.toggle('bs-fade-l', over && scroller.scrollLeft > 2);
    wrap.classList.toggle('bs-fade-r', over && scroller.scrollLeft < max - 2);
  }

  function revealChip(wrap, scroller, chip) {
    if (!chip) return;
    var left = chip.offsetLeft, right = left + chip.offsetWidth, pad = 28;
    var view = scroller.clientWidth, cur = scroller.scrollLeft, to = cur;
    if (left - pad < cur) to = left - pad;
    else if (right + pad > cur + view) to = right + pad - view;
    if (to !== cur) scroller.scrollTo({ left: Math.max(0, to), behavior: reduce ? 'auto' : 'smooth' });
    edgeFade(wrap, scroller);
  }

  function scrollToEl(node) {
    var head = document.getElementById('head');
    var top = node.getBoundingClientRect().top + window.pageYOffset - (head ? head.offsetHeight : 0) - 10;
    if (reduce) {
      var de = document.documentElement, prev = de.style.scrollBehavior;
      de.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, top));
      de.style.scrollBehavior = prev;
    } else {
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  }

  /* ------------------------------------------------------------ rendering */

  function renderCats() {
    cats.forEach(function (c) {
      var b = ui.catBtns[c.id], on = c.id === st.cat;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
      b.classList.toggle('is-on', on);
    });
    revealChip(ui.catsWrap, ui.cats, ui.catBtns[st.cat]);
  }

  function renderTabs() {
    var cat = catById[st.cat];
    var tabs = cat.tabs;
    ui.tabsWrap.hidden = !tabs.length;
    ui.stage.classList.toggle('bs-has-tabs', !!tabs.length);
    // Rebuild only when the category changes, so keyboard focus survives.
    if (ui.tabs.getAttribute('data-for') !== st.cat) {
      ui.tabs.innerHTML = '';
      ui.tabs.setAttribute('data-for', st.cat);
      ui.tabs.setAttribute('aria-label', cat.label + ' styles');
      tabs.forEach(function (t) {
        ui.tabs.appendChild(el('button', 'bs-tab', { type: 'button', role: 'tab',
          'aria-controls': 'bs-stage', 'data-tab': t }, t));
      });
      ui.tabs.scrollLeft = 0;
    }
    Array.prototype.forEach.call(ui.tabs.querySelectorAll('.bs-tab'), function (b) {
      var on = b.getAttribute('data-tab') === st.tab;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
    });
    if (tabs.length) {
      edgeFade(ui.tabsWrap, ui.tabs);
      revealChip(ui.tabsWrap, ui.tabs, ui.tabs.querySelector('.is-on'));
    }
  }

  // A bottle = cast shadow + contact shadow + photo + a light/shade layer cut to
  // the photo's own shape (so every bottle is lit from the same side as the set).
  function makeBottle(b, i) {
    var node = el('button', 'bs-bottle', { type: 'button', 'aria-label': b.name, 'data-id': b.id });
    node.appendChild(el('span', 'bs-cast', { 'aria-hidden': 'true' }));
    node.appendChild(el('span', 'bs-shadow', { 'aria-hidden': 'true' }));
    var img = el('img', 'bs-img', { alt: '', draggable: 'false', decoding: 'async' });
    node.appendChild(img);
    node.appendChild(el('span', 'bs-shade', { 'aria-hidden': 'true' }));
    var e = { b: b, i: i, node: node, img: img, q: '', pending: null, k: b.scale || 1, bl: 0.2, br: 0.8, based: false };
    node._bs = e;
    img.addEventListener('load', function () { measureBase(e); });
    return e;
  }

  // Where the bottle actually touches the table: the opaque extent of the
  // photo's bottom rows, so its contact shadow is exactly as wide as its base.
  function measureBase(e) {
    if (e.based) return;
    var im = e.img, w = im.naturalWidth, h = im.naturalHeight;
    if (!w || !h) return;
    try {
      var rows = Math.max(2, Math.round(h * 0.03));
      var c = document.createElement('canvas');
      c.width = w;
      c.height = rows;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(im, 0, h - rows, w, rows, 0, 0, w, rows);
      var d = ctx.getImageData(0, 0, w, rows).data, x0 = w, x1 = -1;
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < w; x++) {
          if (d[(y * w + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
        }
      }
      if (x1 >= x0) { e.bl = x0 / w; e.br = (x1 + 1) / w; e.based = true; }
      // mean brightness of the bottle (tiny sample): bright studio-lit glass reads
      // like a sticker in a dim room, so it gets a little more of the room's shade
      var sw2 = 24, sh2 = 48;
      var c2 = document.createElement('canvas');
      c2.width = sw2;
      c2.height = sh2;
      var x2 = c2.getContext('2d', { willReadFrequently: true });
      x2.drawImage(im, 0, 0, sw2, sh2);
      var d2 = x2.getImageData(0, 0, sw2, sh2).data, sum = 0, cnt = 0;
      for (var i2 = 0; i2 < d2.length; i2 += 4) {
        if (d2[i2 + 3] > 200) { sum += 0.2126 * d2[i2] + 0.7152 * d2[i2 + 1] + 0.0722 * d2[i2 + 2]; cnt++; }
      }
      if (cnt) e.node.style.setProperty('--bs-dim', Math.max(0, Math.min(0.2, (sum / cnt / 255 - 0.5) * 0.5)).toFixed(3));
    } catch (_err) { /* keep the default base */ }
    if (geo) placeShadow(e);
  }

  function placeShadow(e) {
    var s = e.node.style, bw = e.boxW || 0, bh = e.boxH || 0;
    if (!bw || !bh) return;
    var ar = (e.b.img && e.b.img.w && e.b.img.h) ? e.b.img.w / e.b.img.h : 0.33;
    var iw = Math.min(bw, bh * ar), x0 = (bw - iw) / 2;
    s.setProperty('--bs-sx', (x0 + iw * (e.bl + e.br) / 2).toFixed(1) + 'px');
    s.setProperty('--bs-sw', Math.max(12, iw * (e.br - e.bl)).toFixed(1) + 'px');
  }

  function elFor(node) { return node && node._bs; }

  // Build the ring for the current category + tab, centred on bottle id `centerId`.
  function buildRing(centerId) {
    cancelMove();
    ring.token++;
    var list = filtered();
    ring.items = ringOrder(list);
    ring.n = ring.items.length;
    ring.L = layoutFor(Math.max(ring.n, 1));
    ui.ring.innerHTML = '';
    ring.els = ring.items.map(function (b, i) {
      var e = makeBottle(b, i);
      ui.ring.appendChild(e.node);
      if (geo) sizeBottle(e);
      return e;
    });
    var idx = 0;
    if (centerId) {
      for (var i = 0; i < ring.n; i++) if (ring.items[i].id === centerId) { idx = i; break; }
    }
    ring.pos = ring.target = idx;
    root.classList.toggle('bs-single', ring.n < 2);
    ui.prev.hidden = ui.next.hidden = ring.n < 2;
  }

  function currentBottle() { return ring.n ? ring.items[mod(ring.target, ring.n)] : null; }

  // Apply resting poses for position p (no animation).
  function placeAll(p) {
    ring.els.forEach(function (e) {
      var o = wrapOff(e.i - p);
      e.node.style.transform = transformAt(o, e.k);
      e.node.style.opacity = String(opacityAt(o));
    });
  }

  function settleState() {
    var p = ring.target;
    var order = ring.els.map(function (e) { return { e: e, o: wrapOff(e.i - p) }; })
      .sort(function (a, b) { return a.o - b.o; });
    var active = document.activeElement;
    var refocus = active && active.classList && active.classList.contains('bs-bottle') ? active : null;
    order.forEach(function (x) {
      var vis = Math.abs(x.o) <= SIDES + 1e-6 && opacityAt(x.o) > 0.5;
      var n = x.e.node;
      n.classList.toggle('bs-off', !vis);
      n.classList.toggle('bs-center', Math.abs(x.o) < 1e-6);
      if (vis) {
        n.removeAttribute('aria-hidden');
        n.removeAttribute('inert');
        n.tabIndex = 0;
      } else {
        n.setAttribute('aria-hidden', 'true');
        n.setAttribute('inert', '');
        n.tabIndex = -1;
      }
      ui.ring.appendChild(n);      // DOM order = visual order (left to right)
    });
    if (refocus && refocus.isConnected && !refocus.hasAttribute('inert')) refocus.focus({ preventScroll: true });
    ensureImages(p, false);
    schedulePrefetch();
  }

  function renderCaption(animate) {
    var b = currentBottle();
    if (!b) return;
    var k = mod(ring.target, ring.n) + 1;
    ui.hint.textContent = k + ' of ' + ring.n;
    root.setAttribute('data-center', b.id);
    root.setAttribute('data-cat', st.cat);
    root.setAttribute('data-tab', st.tab);
    var layer = el('div', 'bs-cap-layer');
    layer.appendChild(el('span', 'bs-cap-name', null, b.name));
    layer.appendChild(el('span', 'bs-cap-sub', null, shortLine(b)));
    var old = ui.cap.querySelectorAll('.bs-cap-layer');
    ui.cap.appendChild(layer);
    if (animate && old.length && layer.animate) {
      // staggered inside the 150 ms: the old name lifts away first, then the new one settles in
      // (reduced motion: opacity only - no transform keys at all)
      var kin = reduce ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }];
      var kout = reduce ? [{ opacity: 1 }, { opacity: 0 }]
        : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px)' }];
      layer.animate(kin, { duration: XFADE - 60, delay: 60, easing: 'ease-out', fill: 'backwards' });
      Array.prototype.forEach.call(old, function (o) {
        o.classList.add('bs-cap-old');
        var a = o.animate(kout, { duration: 70, easing: 'ease-in', fill: 'forwards' });
        a.onfinish = function () { if (o.parentNode) o.parentNode.removeChild(o); };
        a.oncancel = a.onfinish;
      });
    } else {
      Array.prototype.forEach.call(old, function (o) { o.parentNode.removeChild(o); });
    }
    renderPanel(b, animate);
  }

  function renderPanel(b, animate) {
    var p = ui.panel;
    p.innerHTML = '';
    var inner = el('div', 'bs-panel-in');
    if (b.top_shelf) inner.appendChild(el('span', 'bs-pill', null, 'Top shelf'));
    inner.appendChild(el('h2', 'bs-pname', null, b.name));
    inner.appendChild(el('p', 'bs-pline', null, styleLine(b)));
    var f = b.facts || {};
    if (f.appellation) inner.appendChild(el('p', 'bs-papp', null, f.appellation));
    var ex = data.style_explainers && data.style_explainers[b.style];
    if (ex) {
      var pe = el('p', 'bs-pex');
      pe.appendChild(el('b', null, null, b.style + ': '));
      pe.appendChild(document.createTextNode(ex));
      inner.appendChild(pe);
    }
    if (b.poured_in && b.poured_in.length) {
      inner.appendChild(el('p', 'bs-ppour', null, 'Poured in our ' + listJoin(b.poured_in) + '.'));
    }
    p.appendChild(inner);
    if (animate && inner.animate) inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: XFADE, easing: 'linear' });
  }

  function announce() {
    var b = currentBottle();
    if (!b) return;
    var msg = b.name + ', ' + b.style + ', ' + (mod(ring.target, ring.n) + 1) + ' of ' + ring.n + '.';
    if (msg === lastAnnounced) return;
    lastAnnounced = msg;
    ui.live.textContent = msg;
  }

  function syncHash() {
    if (!page.classList.contains('is-active') || !history.replaceState) return;
    var b = currentBottle();
    if (!b) return;
    var h = '#bar/' + st.cat + '/' + b.id;
    if (location.hash !== h) history.replaceState(history.state, '', location.pathname + location.search + h);
  }

  /* --------------------------------------------------------------- images */

  function want(e, o) { return Math.abs(o) <= SIDES + 1e-6 ? 'display' : 'side'; }

  function detectAvif() {
    return new Promise(function (res) {
      var im = new Image();
      var done = function (ok) { res(ok); };
      im.onload = function () { done(im.naturalWidth > 0); };
      im.onerror = function () { done(false); };
      setTimeout(function () { done(false); }, 1500);
      im.src = AVIF_PROBE;
    });
  }

  function srcFor(b, q) {
    var url = b.img && b.img[q];
    if (url && q === 'display' && fmt.avif) url = url.replace(/\.webp$/, '.avif');
    return url;
  }

  function showSrc(e, url) {
    e.img.src = url;
    // the light/shade layer is cut to the photo's own shape
    e.node.style.setProperty('--bs-src', 'url("' + url + '")');
  }

  function setImg(e, q) {
    if (e.q === 'display' || e.q === q) return;
    var url = srcFor(e.b, q);
    if (!url) return;
    if (!e.q) { showSrc(e, url); e.q = q; return; }
    if (e.pending === url) return;
    e.pending = url;
    var im = new Image();
    im.src = url;
    (im.decode ? im.decode() : Promise.resolve()).then(function () {
      if (e.pending !== url) return;
      showSrc(e, url);
      e.q = q;
      e.pending = null;
    }, function () { e.pending = null; });
  }

  // Load what slots within +-3 of position p need (display for +-2, side beyond).
  function ensureImages(p, alsoPath) {
    ring.els.forEach(function (e) {
      var o = wrapOff(e.i - p);
      if (Math.abs(o) <= SIDES + 1 + 1e-6) setImg(e, want(e, o));
      else if (alsoPath && !e.q) setImg(e, 'side');
    });
  }

  function decodeVisible(timeoutMs) {
    var jobs = [];
    ring.els.forEach(function (e) {
      if (!e.img.src || Math.abs(wrapOff(e.i - ring.target)) > SIDES) return;
      if (e.img.decode) jobs.push(e.img.decode().catch(function () {}));
    });
    return Promise.race([Promise.all(jobs), new Promise(function (r) { setTimeout(r, timeoutMs); })]);
  }

  var prefetched = {};
  function schedulePrefetch() {
    cancelIdle(idleHandle);
    var token = ring.token;
    idleHandle = idle(function () {
      idleHandle = 0;
      if (token !== ring.token || !ring.n) return;
      var p = ring.target, jobs = [];
      ring.els.forEach(function (e) {
        var u = Math.abs(wrapOff(e.i - p));
        if (u <= SIDES) return;
        if (u <= SIDES + 2) jobs.push({ u: u, url: srcFor(e.b, 'display') });
        else jobs.push({ u: u, url: e.b.img.side });
      });
      jobs.sort(function (a, b) { return a.u - b.u; });
      jobs.forEach(function (j) {
        if (!j.url || prefetched[j.url]) return;
        prefetched[j.url] = 1;
        var im = new Image();
        im.decoding = 'async';
        im.src = j.url;
      });
    });
  }

  /* --------------------------------------------------------------- motion */

  function cancelMove() {
    if (ring.move) {
      ring.move.anims.forEach(function (a) { try { a.cancel(); } catch (_e) {} });
      ring.move = null;
    }
  }

  // Where the ring visually is right now (mid-turn aware).
  function visualPos() {
    var m = ring.move;
    if (!m || m.kind !== 'spin') return ring.target;
    var t = m.anims.length && m.anims[0].currentTime != null ? m.anims[0].currentTime : (now() - m.t0);
    var f = Math.max(0, Math.min(1, t / m.dur));
    return m.p0 + (m.p1 - m.p0) * ease(f);
  }

  function step(d) {
    if (ring.n < 2) return;
    moveTo(ring.target + d, { from: 'step' });
  }

  function jumpToIndex(i) {
    if (!ring.n) return;
    var cur = mod(ring.target, ring.n);
    var d = i - cur;
    if (ring.n > 1) d = shortest(d);
    moveTo(ring.target + d, { from: 'jump' });
  }

  function shortest(d) {
    var n = ring.n;
    d = mod(d, n);
    if (d > n / 2) d -= n;
    return d;
  }

  function moveTo(t, opts) {
    opts = opts || {};
    if (!ring.n || ringBroken) return;
    var p0 = visualPos();
    var dist = t - p0;
    ring.target = t;
    var token = ++ring.token;
    renderCaption(true);
    if (focusAfter) {
      // Keyboard users stay on the bottle that is heading for the centre.
      focusAfter = false;
      ring.wantFocus = true;
      focusTarget();
    }
    if (Math.abs(dist) < 1e-6 && !ring.move) { settle(token); return; }
    if (reduce) { crossfadeTo(token); return; }
    // Jumps of more than 2 steps never spin; neither does a pile-up of fast
    // clicks that has run more than 3 steps ahead (it collapses into a refill).
    var jumpy = opts.from === 'jump' || opts.from === 'list';
    if ((jumpy && Math.abs(dist) > 2.001) || Math.abs(dist) > 3.001) { refill(token); return; }
    spin(p0, t, token);
  }

  function spin(p0, p1, token) {
    cancelMove();
    var d = Math.abs(p1 - p0);
    var dur = Math.round(d <= 1 ? 450 : Math.min(760, 450 + (d - 1) * 150));
    var samples = Math.max(10, Math.ceil(d * 16));
    var anims = [];
    var rate = -(p1 - p0);              // change of every offset per unit of progress
    ensureImages(p1, false);
    ring.els.forEach(function (e) {
      var oA = wrapOff(e.i - p0), oB = wrapOff(e.i - p1);
      var lo = Math.min(oA, oA + rate), hi = Math.max(oA, oA + rate);
      var endT = transformAt(oB, e.k), endO = opacityAt(oB);
      e.node.style.transform = endT;
      e.node.style.opacity = String(endO);
      // Skip bottles whose whole path stays off stage.
      if (ring.n >= 2 * SIDES + 2 && !(hi > -(SIDES + 1.01) && lo < SIDES + 1.01)) return;
      if (!e.q) setImg(e, 'side');
      var frames = [], prev = null;
      for (var s = 0; s <= samples; s++) {
        var f = s / samples;
        var o = wrapOff(e.i - (p0 + (p1 - p0) * f));
        if (prev !== null && Math.abs(o - prev.o) > ring.n / 2) {
          // Crossing the back of the ring: jump across while fully transparent.
          var from = rate > 0 ? ring.L.hi : ring.L.lo, to = rate > 0 ? ring.L.lo : ring.L.hi;
          var fx = prev.f + (from - prev.o) / rate;
          fx = Math.max(prev.f, Math.min(f, fx));
          frames.push({ offset: fx, transform: transformAt(from, e.k), opacity: 0 });
          frames.push({ offset: fx, transform: transformAt(to, e.k), opacity: 0 });
        }
        frames.push({ offset: f, transform: transformAt(o, e.k), opacity: opacityAt(o) });
        prev = { o: o, f: f };
      }
      frames[frames.length - 1].transform = endT;
      frames[frames.length - 1].opacity = endO;
      e.node.classList.remove('bs-off');
      anims.push(e.node.animate(frames, { duration: dur, easing: EASE_CSS }));
    });
    ring.move = { kind: 'spin', p0: p0, p1: p1, dur: dur, t0: now(), anims: anims };
    finishWhenDone(anims, token);
  }

  function refill(token) {
    cancelMove();
    ring.pos = ring.target;
    placeAll(ring.target);
    settleState();
    var p = ring.target, anims = [];
    var rising = ring.els.map(function (e) { return { e: e, o: wrapOff(e.i - p) }; })
      .filter(function (x) { return Math.abs(x.o) <= SIDES + 1e-6 && opacityAt(x.o) > 0; });
    rising.forEach(function (x) {
      x.e.node.style.opacity = '0';
    });
    decodeVisible(700).then(function () {
      if (token !== ring.token) return;
      rising.forEach(function (x) {
        var e = x.e, op = opacityAt(x.o);
        e.node.style.opacity = String(op);
        anims.push(e.node.animate([
          { transform: transformAt(x.o, e.k, RISE_PX), opacity: 0 },
          { transform: transformAt(x.o, e.k), opacity: op }
        ], { duration: RISE_MS, delay: Math.round(Math.abs(x.o)) * RISE_STAGGER, easing: EASE_CSS, fill: 'backwards' }));
      });
      ring.move = { kind: 'rise', anims: anims };
      finishWhenDone(anims, token);
    });
  }

  // Snapshot of the ring as it looks now (used for reduced-motion crossfades).
  function makeGhost() {
    var old = ui.view.querySelectorAll('.bs-ghost');
    Array.prototype.forEach.call(old, function (g) { g.parentNode.removeChild(g); });
    var ghost = ui.ring.cloneNode(true);
    ghost.className = 'bs-ring bs-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('inert', '');
    Array.prototype.forEach.call(ghost.querySelectorAll('button'), function (b) {
      b.setAttribute('tabindex', '-1');
      b.removeAttribute('aria-label');
    });
    ui.view.insertBefore(ghost, ui.ring);
    return ghost;
  }

  function crossfadeTo(token, ghost) {
    cancelMove();
    // Reduced motion: no movement at all, the new arrangement fades in over
    // the old one (a snapshot of the visible bottles) in 150 ms.
    ghost = ghost || makeGhost();
    ring.pos = ring.target;
    placeAll(ring.target);
    settleState();
    var anims = [];
    if (ui.ring.animate) {
      ring.els.forEach(function (e) {
        var o = wrapOff(e.i - ring.target), op = opacityAt(o);
        if (op > 0) anims.push(e.node.animate([{ opacity: 0 }, { opacity: op }], { duration: XFADE, easing: 'linear' }));
      });
      var ga = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: XFADE, easing: 'linear', fill: 'forwards' });
      ga.onfinish = ga.oncancel = function () { if (ghost.parentNode) ghost.parentNode.removeChild(ghost); };
      anims.push(ga);
    } else if (ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
    ring.move = { kind: 'fade', anims: anims };
    finishWhenDone(anims, token);
  }

  function finishWhenDone(anims, token) {
    if (!anims.length) { settle(token); return; }
    Promise.all(anims.map(function (a) { return a.finished; })).then(function () {
      settle(token);
    }, function () { /* cancelled by a newer move */ });
  }

  function focusTarget() {
    var e = ring.els[mod(ring.target, ring.n)];
    if (!e) return;
    e.node.classList.remove('bs-off');
    e.node.removeAttribute('inert');
    e.node.removeAttribute('aria-hidden');
    e.node.tabIndex = 0;
    e.node.focus({ preventScroll: true });
  }

  function settle(token) {
    if (token !== ring.token) return;
    ring.move = null;
    ring.pos = ring.target;
    // Keep the numbers small so long sessions never drift.
    if (Math.abs(ring.target) > 1e6) { ring.target = ring.pos = mod(ring.target, ring.n); placeAll(ring.target); }
    settleState();
    if (ring.wantFocus) { ring.wantFocus = false; if (!document.activeElement || !document.activeElement.classList.contains('bs-center')) focusTarget(); }
    announce();
    syncHash();
  }

  /* ------------------------------------------------------------- actions */

  function selectCategory(id, opts) {
    opts = opts || {};
    if (!catById[id]) return;
    var same = id === st.cat;
    st.cat = id;
    st.tab = 'All';
    renderCats();
    if (st.view === 'list') {
      // Keep the (hidden) ring in step so "Back to the shelf" matches the chips.
      if (!same && !ringBroken) showRing(catById[id].featured, false);
      renderList();
      return;
    }
    if (same && !opts.centerId && opts.user) {
      // Re-tapping the active category re-centres its featured bottle.
      goToBottle(catById[id].featured);
    } else {
      showRing(opts.centerId || catById[id].featured, true);
    }
    if (opts.user && !opts.keyboard) keepCaptionInView();
  }

  function selectTab(t) {
    var cat = catById[st.cat];
    if (!cat || cat.tabs.indexOf(t) === -1) return;
    var keep = currentBottle();
    st.tab = t;
    var list = filtered();
    // Stay on the current bottle when it is in the new tab, else open on the tab's best-known.
    var center = keep && list.indexOf(keep) !== -1 ? keep.id : (list[0] && list[0].id);
    showRing(center, true);
  }

  function showRing(centerId, rise) {
    var ghost = reduce && rise && built && ring.n && st.view === 'shelf' ? makeGhost() : null;
    renderTabs();
    buildRing(centerId);
    if (!geo) measure(); else ring.els.forEach(sizeBottle);
    renderCaption(rise);
    var token = ring.token;
    if (reduce || !rise) {
      placeAll(ring.target);
      if (reduce && rise) { crossfadeTo(token, ghost); return; }
      settle(token);
      return;
    }
    refill(token);
  }

  function goToBottle(id) {
    var b = bottleById[id];
    if (!b) return;
    if (b.category !== st.cat) {
      st.cat = b.category;
      st.tab = 'All';
      renderCats();
      showRing(id, true);
      return;
    }
    var inRing = -1;
    for (var i = 0; i < ring.n; i++) if (ring.items[i].id === id) { inRing = i; break; }
    if (inRing === -1) {
      st.tab = 'All';
      showRing(id, true);
      return;
    }
    var d = shortest(inRing - mod(ring.target, ring.n));
    if (d === 0) { renderCaption(false); settle(ring.token); return; }
    moveTo(ring.target + d, { from: 'jump' });
  }

  function keepCaptionInView() {
    // After a category tap the centred bottle's name must be on screen.
    requestAnimationFrame(function () {
      var r = ui.caprow.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom > vh - 4 || r.top < 0) scrollToEl(ui.catsWrap);
    });
  }

  /* ------------------------------------------------------------- list view */

  function showList(on, opts) {
    st.view = on ? 'list' : 'shelf';
    ui.list.hidden = !on;
    ui.layout.hidden = on;
    root.classList.toggle('bs-listing', on);
    root.setAttribute('data-view', st.view);
    if (on) {
      cancelMove();
      ui.back.hidden = ringBroken;
      renderList();
      if (opts && opts.focus) {
        var fine = window.matchMedia && window.matchMedia('(pointer:fine)').matches;
        (fine ? ui.q : (ringBroken ? ui.q : ui.back)).focus({ preventScroll: true });
      }
    } else {
      measure();
      placeAll(ring.target);
      settleState();
      renderCaption(false);
      if (opts && opts.focus) ui.listBtn.focus({ preventScroll: true });
    }
  }

  function renderList() {
    var q = fold(ui.q.value);
    var body = ui.listBody;
    body.innerHTML = '';
    var groups = [];
    function byName(a, b) { return a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true }); }
    if (!q) {
      var cat = catById[st.cat];
      var styles = cat.styles.slice();
      cat.bottles.forEach(function (b) { if (styles.indexOf(b.style) === -1) styles.push(b.style); });
      styles.forEach(function (s) {
        var items = cat.bottles.filter(function (b) { return b.style === s; }).sort(byName);
        if (items.length) groups.push({ title: s === cat.label ? cat.label : s, items: items });
      });
      body.appendChild(el('p', 'bs-listcap', null, cat.label + ' \u00b7 grouped by style'));
    } else {
      var words = q.split(' ');
      cats.forEach(function (c) {
        var items = c.bottles.filter(function (b) {
          return words.every(function (w) { return b._key.indexOf(w) !== -1; });
        }).sort(byName);
        if (items.length) groups.push({ title: c.label, items: items });
      });
      if (!groups.length) {
        body.appendChild(el('p', 'bs-empty', { role: 'status' }, 'No bottles match \u201c' + ui.q.value.trim() + '\u201d.'));
        return;
      }
    }
    groups.forEach(function (g) {
      var sec = el('section', 'bs-lgroup');
      sec.appendChild(el('h3', 'bs-lhead', null, g.title));
      var ul = el('ul', 'bs-lul');
      g.items.forEach(function (b) {
        var li = el('li');
        var btn = el('button', 'bs-li', { type: 'button', 'data-id': b.id });
        var im = el('img', 'bs-limg', { alt: '', loading: 'lazy', decoding: 'async', src: b.img.side,
          width: String(Math.round(b.img.w * 300 / (b.img.h || 300)) || 100), height: '300' });
        var tx = el('span', 'bs-ltxt');
        tx.appendChild(el('span', 'bs-lname', null, b.name));
        tx.appendChild(el('span', 'bs-lsub', null, styleLine(b) + (b.top_shelf ? ' \u00b7 Top shelf' : '')));
        btn.appendChild(im);
        btn.appendChild(tx);
        li.appendChild(btn);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      body.appendChild(sec);
    });
  }

  // A bottle picked from the list: back to the shelf with it centred (refill, no spin).
  function pickFromList(id) {
    var b = bottleById[id];
    if (!b || ringBroken) return;
    showList(false);
    if (b.category !== st.cat || filtered().indexOf(b) === -1) {
      st.cat = b.category;
      st.tab = 'All';
      renderCats();
      showRing(id, true);
    } else {
      var inRing = 0;
      for (var i = 0; i < ring.n; i++) if (ring.items[i].id === id) { inRing = i; break; }
      var d = shortest(inRing - mod(ring.target, ring.n));
      if (d !== 0) {
        ring.target += d;
        renderCaption(true);
        if (reduce) crossfadeTo(++ring.token); else refill(++ring.token);
      } else {
        syncHash();
      }
    }
    var node = ring.els[mod(ring.target, ring.n)];
    if (node) { node.node.removeAttribute('inert'); node.node.tabIndex = 0; node.node.focus({ preventScroll: true }); }
    scrollToEl(ui.catsWrap);
  }

  /* ----------------------------------------------------------- deep links */

  function fromHash() {
    var parts = location.hash.slice(1).split('/');
    if (parts[0] !== 'bar') return null;
    var cat = safeDecode(parts[1]), id = safeDecode(parts[2]);
    if (id && bottleById[id]) return { cat: bottleById[id].category, id: id };
    if (cat && catById[cat]) return { cat: cat, id: null };
    // Plain "#bar" keeps whatever the guest was looking at; anything unknown
    // after it quietly falls back to the default shelf.
    if (parts.length > 1 && (parts[1] || parts[2])) return { cat: cats[0].id, id: null };
    return { cat: null, id: null };
  }

  function safeDecode(s) {
    try { return decodeURIComponent(s || ''); } catch (_e) { return ''; }
  }

  function restore(first) {
    var want2 = fromHash();
    if (!want2) return;
    if (!want2.cat) {
      if (first || !st.cat) { st.cat = cats[0].id; st.tab = 'All'; renderCats(); showRing(cats[0].featured, true); }
      else if (st.view === 'shelf') { measure(); placeAll(ring.target); settle(ring.token); }
      return;
    }
    var id = want2.id || catById[want2.cat].featured;
    var cur = currentBottle();
    if (!first && st.cat === want2.cat && cur && cur.id === id) {
      syncHash();
      return;
    }
    if (first || st.cat !== want2.cat) {
      st.cat = want2.cat;
      st.tab = 'All';
      renderCats();
      showRing(id, true);
    } else {
      goToBottle(id);
    }
  }

  /* -------------------------------------------------------- load + boot */

  function showLoading() {
    root.classList.remove('bs-error');
    root.classList.add('bs-loading');
    root.setAttribute('aria-busy', 'true');
    root.innerHTML = '<div class="bs-skel" aria-hidden="true"><div class="bs-skel-row"></div>' +
      '<div class="bs-skel-stage"><div class="bs-skel-plinth"></div></div></div>' +
      '<p class="bs-sr" role="status">Loading the shelf\u2026</p>';
  }

  function showError() {
    root.classList.remove('bs-loading');
    root.classList.add('bs-error');
    root.removeAttribute('aria-busy');
    root.innerHTML = '';
    var box = el('div', 'bs-errbox', { role: 'alert' });
    box.appendChild(el('p', 'bs-errtxt', null, 'Couldn\u2019t load the shelf.'));
    var btn = el('button', 'bs-retry', { type: 'button' }, 'Try again');
    btn.addEventListener('click', load);
    box.appendChild(btn);
    root.appendChild(box);
  }

  function load() {
    root.classList.toggle('bs-reduce', reduce);
    showLoading();
    var avifReady = detectAvif().then(function (ok) { fmt.avif = ok; });
    fetch(DATA_URL, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (json) {
      return avifReady.then(function () { return json; });
    }).then(function (json) {
      prepare(json);
      if (!cats.length) throw new Error('empty shelf');
      root.classList.remove('bs-loading');
      root.removeAttribute('aria-busy');
      buildShell();
      start();
    }).catch(function () {
      built = false;
      showError();
    });
  }

  function start() {
    try {
      measure();
      restore(true);
    } catch (err) {
      ringBroken = true;
      if (window.console && console.error) console.error('Bar shelf ring failed; showing the list.', err);
    }
    var narrow = (window.innerWidth || document.documentElement.clientWidth) < LIST_FIRST_BELOW;
    if (ringBroken || narrow) {
      if (!st.cat) { st.cat = cats[0].id; renderCats(); }
      st.autoList = !ringBroken;     // opened by width, not by the guest
      showList(true);
    } else {
      root.setAttribute('data-view', 'shelf');
    }
  }

  function onShow() {
    if (!built) return;
    if (st.view === 'shelf' && !ringBroken) {
      var t = ring.target;
      cancelMove();
      measure();
      ring.pos = ring.target = t;
      placeAll(t);
      settleState();
    }
    restore(false);
    edgeFade(ui.catsWrap, ui.cats);
    if (!ui.tabsWrap.hidden) edgeFade(ui.tabsWrap, ui.tabs);
  }

  document.addEventListener('ck:pageshow', function (e) {
    if (e.detail && e.detail.page === 'bar') onShow();
  });
  window.addEventListener('hashchange', function () {
    if (built && location.hash.slice(1).split('/')[0] === 'bar' && page.classList.contains('is-active')) restore(false);
  });
  window.addEventListener('resize', function () {
    if (!built || !page.classList.contains('is-active')) return;
    cancelAnimationFrame(measureRaf);
    measureRaf = requestAnimationFrame(function () {
      if (st.view === 'list' && st.autoList && window.innerWidth >= LIST_FIRST_BELOW) {
        st.autoList = false;      // the window grew: give the guest the shelf
        showList(false);
        return;
      }
      if (st.view !== 'shelf') return;
      var t = ring.target;
      cancelMove();
      measure();
      ring.pos = ring.target = t;
      placeAll(t);
      settleState();
      edgeFade(ui.catsWrap, ui.cats);
      if (!ui.tabsWrap.hidden) edgeFade(ui.tabsWrap, ui.tabs);
    });
  });
  function onReduceChange() {
    reduce = forceReduce || !!(reduceMq && reduceMq.matches);
    root.classList.toggle('bs-reduce', reduce);
  }
  if (reduceMq) {
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', onReduceChange);
    else if (reduceMq.addListener) reduceMq.addListener(onReduceChange);
  }

  if (page.classList.contains('is-active')) load();
  else {
    var once = function (e) {
      if (!e.detail || e.detail.page !== 'bar') return;
      document.removeEventListener('ck:pageshow', once);
      if (!built && !root.classList.contains('bs-loading')) load();
    };
    document.addEventListener('ck:pageshow', once);
  }
})();
