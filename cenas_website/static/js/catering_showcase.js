(function () {
  'use strict';

  var showcase = document.querySelector('[data-catering-showcase]');
  if (!showcase) return;

  var track = showcase.querySelector('[data-showcase-track]');
  var status = showcase.querySelector('[data-showcase-status]');
  var placeholder = showcase.querySelector('[data-showcase-placeholder]');
  var feedUrl = showcase.getAttribute('data-feed-url');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var strip = null;
  var cards = [];
  var seenIds = {};
  var nextCursor = null;
  var hasMore = true;
  var loading = false;
  var initialized = false;
  var built = false;
  var retryTimer = null;
  var retryAfter = 0;
  var failureCount = 0;
  var resizeTimer = null;
  var PAGE_SIZE = 12;
  var MAX_PAGES = 8;
  // Continuous marquee speed — pixels per second. Slightly slow, never stops.
  var MARQUEE_SPEED = 28;

  if (!feedUrl) return;
  var resolvedFeedUrl = '';
  try {
    resolvedFeedUrl = new URL(feedUrl, window.location.href).href;
  } catch (_error) {
    return;
  }

  function setStatus(message) {
    status.textContent = message || '';
  }

  function safeUrl(value) {
    if (!value) return '';
    try {
      var url = new URL(value, resolvedFeedUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return url.href;
    } catch (_error) {
      return '';
    }
  }

  function formatDate(item) {
    if (item.date_label) return item.date_label;
    if (!item.event_date) return 'Recent event';
    var date = new Date(item.event_date + (item.event_date.indexOf('T') === -1 ? 'T12:00:00' : ''));
    if (isNaN(date.getTime())) return item.event_date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function imageSource(item) {
    var image = item.image || {};
    return safeUrl(image.src || image.url || item.image_url || item.thumbnail_url);
  }

  function imageSourceSet(item) {
    var image = item.image || {};
    var entries = [];
    if (typeof image.srcset === 'string') {
      image.srcset.split(',').forEach(function (candidate) {
        var parts = candidate.trim().split(/\s+/);
        var url = safeUrl(parts[0]);
        var descriptor = parts[1] && /^\d+(w|x)$/.test(parts[1]) ? ' ' + parts[1] : '';
        if (url) entries.push(url + descriptor);
      });
    } else if (image.srcset && typeof image.srcset === 'object') {
      Object.keys(image.srcset).forEach(function (descriptor) {
        var url = safeUrl(image.srcset[descriptor]);
        var normalized = /^\d+$/.test(descriptor) ? descriptor + 'w' : descriptor;
        if (url && /^\d+(w|x)$/.test(normalized)) entries.push(url + ' ' + normalized);
      });
    }
    return entries.join(', ');
  }

  function createCard(item) {
    var source = imageSource(item);
    if (!source) return null;

    var article = document.createElement('article');
    article.className = 'catering-card';
    article.setAttribute('data-showcase-card', '');

    var image = document.createElement('img');
    image.src = source;
    var sourceSet = imageSourceSet(item);
    if (sourceSet) image.srcset = sourceSet;
    image.sizes = '(max-width: 620px) 84vw, (min-width: 1359px) 462px, 34vw';
    image.width = Number((item.image || {}).width) || 960;
    image.height = Number((item.image || {}).height) || 720;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = item.alt_text || (item.image || {}).alt || 'A recent Cenas Kitchen catering setup';
    article.appendChild(image);

    // The date is the only text on the picture, pinned top-right.
    var time = document.createElement('time');
    time.className = 'catering-card-date';
    time.textContent = formatDate(item);
    if (item.event_date) time.dateTime = item.event_date;
    article.appendChild(time);

    return article;
  }

  function setEmptyState(title, message) {
    if (!placeholder) {
      placeholder = document.createElement('div');
      placeholder.className = 'catering-showcase-state';
      track.appendChild(placeholder);
    }
    placeholder.replaceChildren();
    var inner = document.createElement('div');
    var heading = document.createElement('strong');
    heading.textContent = title;
    inner.appendChild(heading);
    var detail = document.createElement('span');
    detail.textContent = message;
    inner.appendChild(detail);
    placeholder.appendChild(inner);
  }

  function ensureStrip() {
    if (strip) return strip;
    strip = document.createElement('div');
    strip.className = 'catering-showcase-strip';
    strip.setAttribute('data-showcase-strip', '');
    track.appendChild(strip);
    return strip;
  }

  function feedRequestUrl() {
    var url = new URL(resolvedFeedUrl);
    url.searchParams.set('limit', String(PAGE_SIZE));
    if (nextCursor) url.searchParams.set('cursor', nextCursor);
    return url.href;
  }

  function responseItems(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    if (payload && Array.isArray(payload.results)) return payload.results;
    return [];
  }

  function scheduleRetry() {
    if (retryTimer) window.clearTimeout(retryTimer);
    retryTimer = window.setTimeout(function () {
      retryTimer = null;
      if (!cards.length && !document.hidden) loadAll();
    }, Math.max(retryAfter - Date.now(), 0) + 400);
  }

  async function loadPage() {
    var response = await fetch(feedRequestUrl(), {
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('Gallery request failed');
    var payload = await response.json();
    var items = responseItems(payload);

    items.forEach(function (item, index) {
      var identity = String(item.id || item.public_id || item.image_url || (item.event_date || 'item') + '-' + index);
      if (seenIds[identity]) return;
      var card = createCard(item);
      if (!card) return;
      seenIds[identity] = true;
      if (placeholder && placeholder.parentNode) placeholder.remove();
      ensureStrip().appendChild(card);
      cards.push(card);
    });

    nextCursor = payload && (payload.next_cursor || payload.nextCursor || null);
    hasMore = Boolean(nextCursor);
    if (payload && typeof payload.has_more === 'boolean') hasMore = payload.has_more;
    if (Array.isArray(payload)) hasMore = false;
  }

  async function loadAll() {
    if (loading || built) return;
    if (Date.now() < retryAfter) return;
    loading = true;
    setStatus('Loading the latest caterings…');
    try {
      var pages = 0;
      while (hasMore && pages < MAX_PAGES) {
        await loadPage();
        pages += 1;
      }
      failureCount = 0;
      retryAfter = 0;
      if (!cards.length) {
        setEmptyState('Fresh catering stories are coming', 'Check back soon for our latest Houston setups.');
        setStatus('');
        return;
      }
      setStatus('');
      buildMarquee();
    } catch (_error) {
      failureCount += 1;
      retryAfter = Date.now() + Math.min(300000, 30000 * Math.pow(2, failureCount - 1));
      if (!cards.length) {
        setEmptyState('The gallery is taking a quick break', 'Our catering menu and quote form are still ready below.');
        scheduleRetry();
      } else {
        // Some pages made it — run with what we have.
        buildMarquee();
      }
      setStatus('Recent catering photos could not be loaded right now.');
    } finally {
      loading = false;
    }
  }

  function marqueeDisabled() {
    return reducedMotion && reducedMotion.matches;
  }

  function setDuration() {
    if (!strip || !built) return;
    var loopWidth = strip.scrollWidth / 2;
    if (!loopWidth) return;
    strip.style.setProperty('--marquee-duration', (loopWidth / MARQUEE_SPEED).toFixed(2) + 's');
  }

  function cloneSet(sourceCards) {
    var fragment = document.createDocumentFragment();
    sourceCards.forEach(function (card) {
      var copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('img').forEach(function (img) { img.alt = ''; });
      fragment.appendChild(copy);
    });
    return fragment;
  }

  function buildMarquee() {
    if (built || !cards.length) return;
    built = true;
    ensureStrip();
    if (marqueeDisabled()) {
      // Reduced motion: leave a single, manually scrollable row.
      setDuration();
      return;
    }
    // Pad one loop until it fills the viewport row, then duplicate the whole
    // loop once — translateX(-50%) then wraps seamlessly.
    var base = cards.slice();
    var guard = 0;
    while (strip.scrollWidth < track.clientWidth * 1.25 && guard < 8) {
      strip.appendChild(cloneSet(base));
      guard += 1;
    }
    strip.appendChild(cloneSet(Array.prototype.slice.call(strip.children)));
    setDuration();
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    loadAll();
  }

  window.addEventListener('resize', function () {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(setDuration, 200);
  }, { passive: true });
  window.addEventListener('online', function () {
    if (!cards.length && initialized) {
      retryAfter = 0;
      loadAll();
    }
  });

  if ('IntersectionObserver' in window) {
    var loadObserver = new IntersectionObserver(function (entries, observer) {
      if (entries[0] && entries[0].isIntersecting) {
        initialize();
        observer.disconnect();
      }
    }, { rootMargin: '320px 0px' });
    loadObserver.observe(showcase);
  } else {
    initialize();
  }
})();
