(function () {
  'use strict';

  var showcase = document.querySelector('[data-catering-showcase]');
  if (!showcase) return;

  var track = showcase.querySelector('[data-showcase-track]');
  var status = showcase.querySelector('[data-showcase-status]');
  var placeholder = showcase.querySelector('[data-showcase-placeholder]');
  var previousButton = showcase.querySelector('[data-showcase-prev]');
  var pauseButton = showcase.querySelector('[data-showcase-pause]');
  var nextButton = showcase.querySelector('[data-showcase-next]');
  var progressBar = showcase.querySelector('[data-showcase-progress]');
  var feedUrl = showcase.getAttribute('data-feed-url');
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var cards = [];
  var seenIds = {};
  var nextCursor = null;
  var hasMore = true;
  var loading = false;
  var initialized = false;
  var isVisible = false;
  var isHovered = false;
  var hasFocus = false;
  var isInteracting = false;
  var manuallyPaused = false;
  var timer = null;
  var scrollFrame = null;
  var scrollIdleTimer = null;
  var retryTimer = null;
  var retryAfter = 0;
  var failureCount = 0;
  var PAGE_SIZE = 6;
  var AUTOPLAY_DELAY = 4000;

  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M8.4 5.5v13M15.6 5.5v13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M8.8 5.6v12.8L18.4 12z" fill="currentColor"/></svg>';

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

  function normalizeCategories(item) {
    if (Array.isArray(item.food_categories)) return item.food_categories.filter(Boolean);
    if (item.food_category) return [item.food_category];
    return [];
  }

  function appendText(parent, tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
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
    image.sizes = '(min-width: 1181px) 370px, (max-width: 620px) 84vw, (max-width: 900px) 50vw, 33vw';
    image.width = Number((item.image || {}).width) || 960;
    image.height = Number((item.image || {}).height) || 720;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.alt = item.alt_text || (item.image || {}).alt || 'A recent Cenas Kitchen catering setup';
    article.appendChild(image);

    var scrim = document.createElement('div');
    scrim.className = 'catering-card-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    article.appendChild(scrim);

    var overlay = document.createElement('div');
    overlay.className = 'catering-card-overlay';
    var meta = document.createElement('div');
    meta.className = 'catering-card-meta';
    var time = appendText(meta, 'time', '', formatDate(item));
    if (item.event_date) time.dateTime = item.event_date;
    appendText(meta, 'span', '', item.event_category || 'Catering');
    overlay.appendChild(meta);

    appendText(overlay, 'h3', '', item.service_style || item.event_category || 'Cenas catering');

    var details = [];
    if (item.guest_count) details.push(Number(item.guest_count).toLocaleString('en-US') + ' guests');
    normalizeCategories(item).slice(0, 3).forEach(function (category) {
      details.push(category);
    });
    if (details.length) appendText(overlay, 'p', 'catering-card-detail', details.join(' · '));

    article.appendChild(overlay);
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
    appendText(inner, 'strong', '', title);
    appendText(inner, 'span', '', message);
    placeholder.appendChild(inner);
  }

  function updateControls() {
    var enabled = cards.length > 1;
    previousButton.disabled = !enabled;
    nextButton.disabled = !enabled;
    if (reducedMotion && reducedMotion.matches) {
      pauseButton.disabled = true;
      pauseButton.innerHTML = ICON_PLAY;
      pauseButton.setAttribute('aria-label', 'Slideshow motion is off');
      pauseButton.title = 'Slideshow motion is off';
    } else {
      pauseButton.disabled = !enabled;
      pauseButton.innerHTML = manuallyPaused ? ICON_PLAY : ICON_PAUSE;
      pauseButton.setAttribute('aria-label', manuallyPaused ? 'Play slideshow' : 'Pause slideshow');
      pauseButton.title = manuallyPaused ? 'Play slideshow' : 'Pause slideshow';
    }
  }

  function updateProgress() {
    if (!progressBar) return;
    var total = track.scrollWidth;
    if (!total || !cards.length) {
      progressBar.style.width = '0';
      return;
    }
    var ratio = Math.min(1, (track.scrollLeft + track.clientWidth) / total);
    progressBar.style.width = (ratio * 100).toFixed(2) + '%';
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
      if (!cards.length && isVisible && !document.hidden) loadMore();
    }, Math.max(retryAfter - Date.now(), 0) + 400);
  }

  async function loadMore(forceRetry) {
    if (loading || !hasMore) return false;
    if (!forceRetry && Date.now() < retryAfter) return false;
    loading = true;
    setStatus(cards.length ? 'Loading earlier caterings…' : 'Loading the latest caterings…');
    try {
      var response = await fetch(feedRequestUrl(), {
        mode: 'cors',
        credentials: 'omit',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Gallery request failed');
      var payload = await response.json();
      var items = responseItems(payload);
      var added = 0;

      items.forEach(function (item, index) {
        var identity = String(item.id || item.public_id || item.image_url || (item.event_date || 'item') + '-' + index);
        if (seenIds[identity]) return;
        var card = createCard(item);
        if (!card) return;
        seenIds[identity] = true;
        if (placeholder && placeholder.parentNode) placeholder.remove();
        track.appendChild(card);
        cards.push(card);
        added += 1;
      });

      nextCursor = payload && (payload.next_cursor || payload.nextCursor || null);
      hasMore = Boolean(nextCursor);
      if (payload && typeof payload.has_more === 'boolean') hasMore = payload.has_more;
      if (Array.isArray(payload)) hasMore = false;
      failureCount = 0;
      retryAfter = 0;

      if (!cards.length) {
        setEmptyState('Fresh catering stories are coming', 'Check back soon for our latest Houston setups.');
      }
      setStatus('');
      updateControls();
      updateProgress();
      updateAutoplay();
      return added > 0;
    } catch (_error) {
      failureCount += 1;
      retryAfter = Date.now() + Math.min(300000, 30000 * Math.pow(2, failureCount - 1));
      if (!cards.length) {
        setEmptyState('The gallery is taking a quick break', 'Our catering menu and quote form are still ready below.');
        scheduleRetry();
      }
      setStatus('Recent catering photos could not be loaded right now.');
      return false;
    } finally {
      loading = false;
    }
  }

  function currentIndex() {
    if (!cards.length) return 0;
    var target = track.scrollLeft;
    var closest = 0;
    var distance = Infinity;
    cards.forEach(function (card, index) {
      var left = card.offsetLeft - track.offsetLeft;
      var delta = Math.abs(left - target);
      if (delta < distance) {
        distance = delta;
        closest = index;
      }
    });
    return closest;
  }

  function scrollToCard(index) {
    if (!cards.length) return;
    var normalized = (index + cards.length) % cards.length;
    var card = cards[normalized];
    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft,
      behavior: reducedMotion && reducedMotion.matches ? 'auto' : 'smooth'
    });
  }

  function atRightEdge() {
    return track.scrollWidth - track.scrollLeft - track.clientWidth <= 2;
  }

  async function advance(direction, forceRetry) {
    if (!cards.length) {
      if (forceRetry) loadMore(true);
      return;
    }
    var index = currentIndex();
    if (direction > 0 && atRightEdge()) {
      if (!hasMore) {
        scrollToCard(0);
        return;
      }
      var added = await loadMore(forceRetry);
      if (!added && hasMore) return;
      if (!hasMore && atRightEdge()) {
        scrollToCard(0);
        return;
      }
    }
    var nextIndex = index + direction;
    if (nextIndex >= cards.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = cards.length - 1;
    scrollToCard(nextIndex);
  }

  function mayAutoplay() {
    return cards.length > 1 && isVisible && !document.hidden && !isHovered && !hasFocus && !isInteracting && !manuallyPaused && !(reducedMotion && reducedMotion.matches);
  }

  function updateAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
    if (mayAutoplay()) {
      timer = window.setInterval(function () { advance(1); }, AUTOPLAY_DELAY);
    }
  }

  function initialize() {
    if (initialized) return;
    initialized = true;
    loadMore();
  }

  previousButton.addEventListener('click', function () { advance(-1); });
  nextButton.addEventListener('click', function () { advance(1, true); });
  pauseButton.addEventListener('click', function () {
    manuallyPaused = !manuallyPaused;
    updateControls();
    updateAutoplay();
  });
  showcase.addEventListener('mouseenter', function () { isHovered = true; updateAutoplay(); });
  showcase.addEventListener('mouseleave', function () { isHovered = false; updateAutoplay(); });
  showcase.addEventListener('focusin', function () { hasFocus = true; updateAutoplay(); });
  showcase.addEventListener('focusout', function (event) {
    if (!showcase.contains(event.relatedTarget)) {
      hasFocus = false;
      updateAutoplay();
    }
  });
  function scheduleInteractionEnd() {
    if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
    scrollIdleTimer = window.setTimeout(function () {
      isInteracting = false;
      updateAutoplay();
    }, 1200);
  }
  track.addEventListener('pointerdown', function () {
    isInteracting = true;
    if (scrollIdleTimer) window.clearTimeout(scrollIdleTimer);
    updateAutoplay();
  }, { passive: true });
  window.addEventListener('pointerup', scheduleInteractionEnd, { passive: true });
  window.addEventListener('pointercancel', scheduleInteractionEnd, { passive: true });
  track.addEventListener('scroll', function () {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(function () {
      scrollFrame = null;
      var remaining = track.scrollWidth - track.scrollLeft - track.clientWidth;
      if (remaining < track.clientWidth * 1.5) loadMore();
      updateProgress();
      if (isInteracting) scheduleInteractionEnd();
    });
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  window.addEventListener('online', function () {
    if (!cards.length && initialized) loadMore(true);
  });
  document.addEventListener('visibilitychange', updateAutoplay);
  if (reducedMotion && reducedMotion.addEventListener) reducedMotion.addEventListener('change', function () {
    updateControls();
    updateAutoplay();
  });

  if ('IntersectionObserver' in window) {
    var loadObserver = new IntersectionObserver(function (entries, observer) {
      if (entries[0] && entries[0].isIntersecting) {
        initialize();
        observer.disconnect();
      }
    }, { rootMargin: '320px 0px' });
    loadObserver.observe(showcase);

    var visibilityObserver = new IntersectionObserver(function (entries) {
      isVisible = Boolean(entries[0] && entries[0].isIntersecting);
      if (isVisible && initialized && !cards.length && !loading && hasMore) loadMore();
      updateAutoplay();
    }, { threshold: 0.2 });
    visibilityObserver.observe(showcase);
  } else {
    isVisible = true;
    initialize();
  }

  updateControls();
  updateProgress();
})();
