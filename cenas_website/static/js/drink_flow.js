/* Cena's Kitchen \u00b7 Drinks cover flow (Menu > Tequila)
 *
 * Flip through the drinks like picking an album: the front card faces the
 * guest, the others stand angled on a track to either side.
 *
 * Built from the drink groups already in the page (every .menu-group with a
 * data-df attribute), so the menu text lives in one place. Without this
 * script those lists simply show as before, and "See the full list" brings
 * them back. Drinks without a photo get a "Photo coming soon" card.
 *
 * Loaded lazily by the small inline loader in index.html when the drinks come
 * near the screen. Only transform and opacity are animated.
 */
(function () {
  'use strict';

  var embed = document.getElementById('drinks');
  var root = document.getElementById('drink-flow');
  if (!embed || !root || root.getAttribute('data-df-init')) return;
  var panel = embed.parentNode;
  var groupEls = panel ? panel.querySelectorAll('.menu-group[data-df]') : [];
  if (!groupEls.length) return;
  root.setAttribute('data-df-init', '1');

  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var forceReduce = /[?&]motion=reduce\b/.test(location.search);
  var reduce = forceReduce || !!(reduceMq && reduceMq.matches);
  var XFADE = 150;

  /* ------------------------------------------------------------ the data */

  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  var groups = [];
  Array.prototype.forEach.call(groupEls, function (g) {
    var items = [];
    Array.prototype.forEach.call(g.querySelectorAll('.mitem'), function (m) {
      var img = m.querySelector('img.mthumb');
      var ds = m.querySelector('.ds');
      var tag = text(ds && ds.querySelector('em'));
      var rest = text(ds);
      if (tag && rest.indexOf(tag) === 0) rest = rest.slice(tag.length);
      rest = rest.replace(/^\s*\u2014\s*/, '').trim();
      items.push({ name: text(m.querySelector('.nm')), img: img ? img.getAttribute('src') : '', tag: tag, desc: rest });
    });
    if (items.length) groups.push({ label: text(g.querySelector('.gh h3')) || 'Drinks', items: items, note: text(g.querySelector('.menu-note')) });
  });
  if (!groups.length) return;

  /* ------------------------------------------------------------ the shell */

  function el(tag, cls, attrs, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (txt != null) n.textContent = txt;
    return n;
  }
  var CHEV = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var ui = {};
  ui.back = el('button', 'df-back', { type: 'button' }, 'Flip through the drinks');
  ui.tabsWrap = el('div', 'df-tabs-wrap');
  ui.tabs = el('div', 'df-tabs', { role: 'tablist', 'aria-label': 'Drinks' });
  ui.tabsWrap.appendChild(ui.tabs);
  ui.stage = el('div', 'df-stage');
  ui.corner = el('div', 'df-corner');
  ui.count = el('span', 'df-count');
  ui.listBtn = el('button', 'df-listbtn', { type: 'button' }, 'See the full list');
  ui.corner.appendChild(ui.count);
  ui.corner.appendChild(ui.listBtn);
  ui.scene = el('div', 'df-scene', { tabindex: '0', role: 'region', 'aria-roledescription': 'carousel',
    'aria-label': 'Drinks. Left and right arrow keys flip through them.' });
  ui.track = el('div', 'df-track', { 'aria-hidden': 'true' });
  ui.cards = el('div', 'df-cards', { 'aria-hidden': 'true' });
  ui.scene.appendChild(ui.track);
  ui.scene.appendChild(ui.cards);
  ui.cap = el('div', 'df-cap');
  ui.prev = el('button', 'df-arrow df-prev', { type: 'button', 'aria-label': 'Previous drink' });
  ui.next = el('button', 'df-arrow df-next', { type: 'button', 'aria-label': 'Next drink' });
  ui.prev.innerHTML = CHEV;
  ui.next.innerHTML = CHEV;
  ui.capTxt = el('div', 'df-cap-txt');
  ui.cap.appendChild(ui.prev);
  ui.cap.appendChild(ui.capTxt);
  ui.cap.appendChild(ui.next);
  ui.note = el('p', 'df-note');
  ui.live = el('p', 'df-sr', { role: 'status', 'aria-live': 'polite' });
  ui.stage.appendChild(ui.corner);
  ui.stage.appendChild(ui.scene);
  ui.stage.appendChild(ui.cap);
  ui.stage.appendChild(ui.note);
  root.appendChild(ui.back);
  root.appendChild(ui.tabsWrap);
  root.appendChild(ui.stage);
  root.appendChild(ui.live);

  /* ------------------------------------------------------------- geometry */

  var geo = null;
  function measure() {
    var w = ui.scene.clientWidth || root.clientWidth || 360;
    var phone = (window.innerWidth || w) < 600;
    var s = phone ? Math.max(170, Math.min(240, w * 0.58)) : Math.max(220, Math.min(300, w * 0.34));
    s = Math.round(s);
    var top = 14;
    geo = { s: s, top: top, gap: s * (phone ? 0.66 : 0.72), step: s * (phone ? 0.24 : 0.3), depth: s * 0.45, rot: 58 };
    root.style.setProperty('--df-s', s + 'px');
    root.style.setProperty('--df-top', top + 'px');
    root.style.setProperty('--df-h', Math.round(top + s * 1.36) + 'px');
  }

  function pose(o) {
    var a = Math.abs(o), sg = o < 0 ? -1 : 1, t = Math.min(a, 1), far = Math.max(0, a - 1);
    return {
      x: sg * (t * geo.gap + far * geo.step),
      z: -(t * geo.depth + far * geo.s * 0.06),
      r: -sg * t * geo.rot,
      op: Math.max(0, Math.min(1, 4.2 - a)),
      zi: 50 - Math.round(a * 4)
    };
  }

  /* ---------------------------------------------------------------- state */

  var st = { g: 0, cur: 0, pos: 0, list: false };
  var cards = [];

  function place(p) {
    st.pos = p;
    for (var i = 0; i < cards.length; i++) {
      var o = i - p, q = pose(o), c = cards[i];
      c.style.transform = 'translateX(' + q.x.toFixed(1) + 'px) translateZ(' + q.z.toFixed(1) + 'px) rotateY(' + q.r.toFixed(2) + 'deg)';
      c.style.opacity = q.op.toFixed(3);
      c.style.zIndex = q.zi;
      c.style.visibility = q.op > 0 ? '' : 'hidden';
      c.classList.toggle('df-front', Math.abs(o) < 0.5);
    }
  }

  function still(fn) {
    root.classList.add('df-still');
    fn();
    void ui.cards.offsetWidth;          // apply without a transition
    root.classList.remove('df-still');
  }

  /* ---------------------------------------------------------------- cards */

  function makeCard(it, i) {
    var b = el('button', 'df-card', { type: 'button', tabindex: '-1', 'data-i': String(i) });
    var face = el('span', 'df-face');
    var refl = el('span', 'df-refl');
    if (it.img) {
      var im = el('img', '', { src: it.img, alt: '', decoding: 'async', draggable: 'false' });
      face.appendChild(im);
      refl.appendChild(el('img', '', { src: it.img, alt: '', decoding: 'async', draggable: 'false' }));
    } else {
      var soon = el('span', 'df-soon');
      soon.appendChild(el('span', 'df-soon-name', null, it.name));
      soon.appendChild(el('span', 'df-soon-sub', null, 'Photo coming soon'));
      face.appendChild(soon);
      refl.appendChild(soon.cloneNode(true));
    }
    b.appendChild(face);
    b.appendChild(refl);
    return b;
  }

  function renderGroup(gi) {
    st.g = gi;
    var items = groups[gi].items;
    ui.cards.textContent = '';
    cards = [];
    for (var i = 0; i < items.length; i++) {
      var c = makeCard(items[i], i);
      cards.push(c);
      ui.cards.appendChild(c);
    }
    st.cur = 0;
    root.classList.toggle('df-single', items.length < 2);
    // a group with names only (no taglines): no reserved room for them under the card
    root.classList.toggle('df-short', !items.some(function (x) { return x.tag || x.desc; }));
    still(function () { place(0); });
    renderCaption(false);
    ui.note.textContent = groups[gi].note;
    ui.note.hidden = !groups[gi].note;
    Array.prototype.forEach.call(ui.tabs.children, function (t, k) {
      var on = k === gi;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
  }

  /* -------------------------------------------------------------- caption */

  function renderCaption(animate) {
    var it = groups[st.g].items[st.cur];
    var n = groups[st.g].items.length;
    var layer = el('div', 'df-cap-layer');
    layer.appendChild(el('p', 'df-name', null, it.name));
    if (it.tag) layer.appendChild(el('p', 'df-tag', null, it.tag));
    if (it.desc) layer.appendChild(el('p', 'df-desc', null, it.desc));
    ui.capTxt.textContent = '';
    ui.capTxt.appendChild(layer);
    if (animate && layer.animate) layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: XFADE, easing: 'ease-out' });
    ui.count.textContent = (st.cur + 1) + ' of ' + n;
    ui.prev.disabled = st.cur === 0;
    ui.next.disabled = st.cur === n - 1;
    var msg = it.name + ', ' + (st.cur + 1) + ' of ' + n + '.';
    if (ui.live.textContent !== msg) ui.live.textContent = msg;
  }

  /* --------------------------------------------------------------- motion */

  function goTo(i) {
    var n = cards.length;
    i = Math.max(0, Math.min(n - 1, i));
    if (i === st.cur && Math.abs(st.pos - i) < 0.01) return;
    st.cur = i;
    if (reduce) {
      still(function () { place(i); });
      if (ui.cards.animate) ui.cards.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: XFADE, easing: 'linear' });
    } else {
      place(i);
    }
    renderCaption(true);
  }

  function switchGroup(gi) {
    if (gi === st.g) return;
    if (!reduce && ui.cards.animate) {
      var out = ui.cards.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' });
      out.onfinish = function () {
        renderGroup(gi);
        out.cancel();
        ui.cards.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      };
    } else {
      renderGroup(gi);
      if (ui.cards.animate) ui.cards.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: XFADE, easing: 'linear' });
    }
  }

  /* ----------------------------------------------------------------- tabs */

  groups.forEach(function (g, gi) {
    var t = el('button', 'df-tab', { type: 'button', role: 'tab', 'aria-selected': 'false', tabindex: '-1' }, g.label);
    t.addEventListener('click', function () { switchGroup(gi); });
    ui.tabs.appendChild(t);
  });
  if (groups.length < 2) ui.tabsWrap.hidden = true;
  ui.tabs.addEventListener('keydown', function (e) {
    var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    var gi = Math.max(0, Math.min(groups.length - 1, st.g + d));
    switchGroup(gi);
    ui.tabs.children[gi].focus();
  });

  /* --------------------------------------------------------------- inputs */

  ui.prev.addEventListener('click', function () { goTo(st.cur - 1); });
  ui.next.addEventListener('click', function () { goTo(st.cur + 1); });
  ui.scene.addEventListener('keydown', function (e) {
    var k = e.key, to = null;
    if (k === 'ArrowLeft') to = st.cur - 1;
    else if (k === 'ArrowRight') to = st.cur + 1;
    else if (k === 'Home') to = 0;
    else if (k === 'End') to = cards.length - 1;
    if (to === null) return;
    e.preventDefault();
    goTo(to);
  });

  var drag = null, swallowClick = false;
  ui.scene.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    drag = { x0: e.clientX, y0: e.clientY, p0: st.cur, id: e.pointerId, moved: false };
  });
  ui.scene.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      drag.moved = true;
      root.classList.add('df-drag');
      try { ui.scene.setPointerCapture(drag.id); } catch (_e) { /* old browsers */ }
    }
    var p = drag.p0 - dx / (geo.gap * 0.95);
    p = Math.max(-0.35, Math.min(cards.length - 0.65, p));
    if (!reduce) place(p);
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag;
    drag = null;
    if (!d.moved) return;
    root.classList.remove('df-drag');
    swallowClick = true;
    setTimeout(function () { swallowClick = false; }, 0);
    var dx = (e ? e.clientX : d.x0) - d.x0;
    var steps = Math.round(dx / (geo.gap * 0.95));
    if (!steps && Math.abs(dx) > 30) steps = dx < 0 ? -1 : 1;
    var to = Math.max(0, Math.min(cards.length - 1, d.p0 - steps));
    if (to === st.cur) { place(to); return; }
    goTo(to);
  }
  ui.scene.addEventListener('pointerup', endDrag);
  ui.scene.addEventListener('pointercancel', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    root.classList.remove('df-drag');
    place(st.cur);
  });
  ui.cards.addEventListener('click', function (e) {
    if (swallowClick) { e.preventDefault(); return; }
    var c = e.target.closest ? e.target.closest('.df-card') : null;
    if (!c) return;
    var i = Number(c.getAttribute('data-i'));
    if (i !== st.cur) goTo(i);
  });

  /* ------------------------------------------------------------ list view */

  function setList(on) {
    st.list = on;
    panel.classList.toggle('df-list', on);
    ui.back.hidden = !on;
    if (!on) { measure(); still(function () { place(st.cur); }); }
    // keep the guest where the drinks are: jump (not glide) back to the top of this block
    var r = embed.getBoundingClientRect();
    if (r.top < 0 || r.top > (window.innerHeight || 800) * 0.6) {
      var de = document.documentElement, prev = de.style.scrollBehavior;
      de.style.scrollBehavior = 'auto';
      window.scrollTo(0, Math.max(0, r.top + (window.pageYOffset || de.scrollTop) - 90));
      de.style.scrollBehavior = prev;
    }
    (on ? ui.back : ui.scene).focus({ preventScroll: true });
  }
  ui.listBtn.addEventListener('click', function () { setList(true); });
  ui.back.addEventListener('click', function () { setList(false); });

  /* ------------------------------------------------------------ lifecycle */

  function relayout() {
    if (st.list || !root.offsetWidth) return;
    measure();
    still(function () { place(st.cur); });
  }
  var lastW = 0;
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      var w = root.offsetWidth;
      if (!w || w === lastW) return;
      lastW = w;
      relayout();
    }).observe(root);
  }
  window.addEventListener('resize', relayout);
  function onReduceChange() {
    reduce = forceReduce || !!(reduceMq && reduceMq.matches);
    root.classList.toggle('df-reduce', reduce);
  }
  if (reduceMq) {
    if (reduceMq.addEventListener) reduceMq.addEventListener('change', onReduceChange);
    else if (reduceMq.addListener) reduceMq.addListener(onReduceChange);
  }

  root.classList.toggle('df-reduce', reduce);
  embed.hidden = false;
  panel.classList.add('df-on');
  ui.back.hidden = true;
  measure();
  renderGroup(0);
})();
