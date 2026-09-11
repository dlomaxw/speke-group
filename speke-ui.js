/* ===========================================================
   SPEKE GROUP — shared UI behaviour
   Preloader, scroll reveal, sticky header, counters, filters
   =========================================================== */
(function () {
  'use strict';

  /* Mark the document as script-enabled BEFORE first paint. Every rule that
     starts an element hidden is scoped to .sg-js, so a page whose scripts are
     blocked still renders fully instead of staying invisible. */
  document.documentElement.classList.add('sg-js');

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Preloader -------------------------------- */
  function buildLoader() {
    if (document.getElementById('speke-loader')) return;
    if (document.body.getAttribute('data-loader') === 'off') return;

    var word = 'SPEKE GROUP';
    var letters = '';
    for (var i = 0; i < word.length; i++) {
      var ch = word[i] === ' ' ? '&nbsp;' : word[i];
      letters += '<span style="animation-delay:' + (0.75 + i * 0.055).toFixed(2) + 's">' +
        ch + '</span>';
    }

    var el = document.createElement('div');
    el.id = 'speke-loader';
    el.innerHTML =
      '<div class="curtain top"></div>' +
      '<div class="curtain bot"></div>' +
      '<div class="glow"></div>' +
      '<div class="mark">' +
        '<div class="ring-wrap">' +
          '<svg viewBox="0 0 172 172" aria-hidden="true">' +
            '<circle class="ring-track" cx="86" cy="86" r="81"></circle>' +
            '<circle class="ring-draw"  cx="86" cy="86" r="81"></circle>' +
          '</svg>' +
          '<div class="bead"></div>' +
          '<div class="logo-badge"><img src="assets/speke-logo.png" alt="Speke Group"></div>' +
        '</div>' +
        '<div class="word">' + letters + '</div>' +
        '<div class="tag">Hotels &middot; Apartments &middot; Resorts</div>' +
        '<div class="bar"><i></i></div>' +
      '</div>';
    document.body.appendChild(el);
  }

  function dismissLoader() {
    var el = document.getElementById('speke-loader');
    var shell = document.querySelector('.page-shell');
    if (shell) shell.classList.add('is-ready');
    if (!el) return;
    el.classList.add('is-done');
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
  }

  /* ---------- 2. Scroll reveal ---------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('revealed');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var node = entry.target;
        var step = parseFloat(node.getAttribute('data-reveal-delay') || 0);
        node.style.transitionDelay = step + 's';
        node.classList.add('revealed');
        io.unobserve(node);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* stagger children of any [data-stagger] container */
  function applyStagger() {
    var groups = document.querySelectorAll('[data-stagger]');
    for (var g = 0; g < groups.length; g++) {
      var step = parseFloat(groups[g].getAttribute('data-stagger')) || 0.07;
      var kids = groups[g].querySelectorAll(':scope > [data-reveal]');
      for (var k = 0; k < kids.length; k++) {
        kids[k].setAttribute('data-reveal-delay', (k * step).toFixed(3));
      }
    }
  }

  /* ---------- 3. Sticky header --------------------------- */
  function initHeader() {
    var header = document.querySelector('.sg-header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle('scrolled', window.scrollY > 28);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- 4. Count-up stats -------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    function run(node) {
      var target = parseFloat(node.getAttribute('data-count'));
      var suffix = node.getAttribute('data-suffix') || '';
      if (reduced) { node.textContent = target + suffix; return; }
      var dur = 1400, start = null;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < nums.length; i++) run(nums[i]);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    for (var j = 0; j < nums.length; j++) io.observe(nums[j]);
  }

  /* ---------- 5. Chip filters ---------------------------- */
  /* <div data-filter-group="portfolio"> chips with data-filter="hotel" */
  /* items: <div data-filter-item="portfolio" data-tags="hotel resort">  */
  function initFilters() {
    var groups = document.querySelectorAll('[data-filter-group]');
    for (var g = 0; g < groups.length; g++) {
      (function (group) {
        var name = group.getAttribute('data-filter-group');
        group.addEventListener('click', function (ev) {
          var chip = ev.target.closest('[data-filter]');
          if (!chip || !group.contains(chip)) return;
          var value = chip.getAttribute('data-filter');

          var chips = group.querySelectorAll('[data-filter]');
          for (var c = 0; c < chips.length; c++) chips[c].classList.remove('active');
          chip.classList.add('active');

          var items = document.querySelectorAll('[data-filter-item="' + name + '"]');
          for (var i = 0; i < items.length; i++) {
            var tags = (items[i].getAttribute('data-tags') || '').split(/\s+/);
            var show = value === 'all' || tags.indexOf(value) !== -1;
            items[i].classList.toggle('filter-hide', !show);
            if (show) {
              items[i].style.transitionDelay = '0s';
              items[i].classList.add('revealed');
            }
          }
        });
      })(groups[g]);
    }
  }

  /* ---------- 6. Tab panels ------------------------------ */
  /* <div data-tabs="offers"> buttons data-tab="accommodation" */
  /* panels: <div data-tab-panel="offers" data-tab-key="accommodation"> */
  function initTabs() {
    var bars = document.querySelectorAll('[data-tabs]');
    for (var t = 0; t < bars.length; t++) {
      (function (bar) {
        var name = bar.getAttribute('data-tabs');
        bar.addEventListener('click', function (ev) {
          var btn = ev.target.closest('[data-tab]');
          if (!btn || !bar.contains(btn)) return;
          var key = btn.getAttribute('data-tab');

          var btns = bar.querySelectorAll('[data-tab]');
          for (var b = 0; b < btns.length; b++) btns[b].classList.remove('active');
          btn.classList.add('active');

          var panels = document.querySelectorAll('[data-tab-panel="' + name + '"]');
          for (var p = 0; p < panels.length; p++) {
            var on = panels[p].getAttribute('data-tab-key') === key;
            panels[p].hidden = !on;
            if (on) {
              panels[p].style.animation = 'none';
              void panels[p].offsetWidth;
              panels[p].style.animation = 'sg-hero .55s cubic-bezier(.16,1,.3,1) forwards';
            }
          }
        });
      })(bars[t]);
    }
  }

  /* ---------- 7. Outbound links -------------------------- */
  /* Property sites live on other domains; send them to a new tab and
     add rel=noopener so the opened page cannot reach back via window.opener. */
  function initExternalLinks() {
    var here = window.location.hostname;
    var links = document.querySelectorAll('a[href^="http"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.hostname && a.hostname !== here) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    }
  }

  /* ---------- 8. Mobile navigation ----------------------- */
  /* Below 900px the nav collapses behind a toggle, and each submenu
     opens on tap since there is no hover on touch devices. */
  function initMobileNav() {
    var header = document.querySelector('.sg-header');
    var nav = header && header.querySelector('.sg-nav');
    if (!nav || header.querySelector('.nav-toggle')) return;

    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    nav.parentNode.insertBefore(btn, nav);

    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    /* Tapping a parent that owns a submenu expands it instead of
       navigating away; a second tap follows the link. */
    nav.addEventListener('click', function (ev) {
      if (!window.matchMedia('(max-width:900px)').matches) return;
      var link = ev.target.closest('.sg-nav > .item > a');
      if (!link) return;
      var item = link.parentNode;
      if (!item.querySelector('.sg-drop')) return;
      if (!item.classList.contains('open')) {
        ev.preventDefault();
        item.classList.add('open');
      }
    });

    /* Leaving mobile width resets the menu to its desktop state. */
    var mq = window.matchMedia('(max-width:900px)');
    var onChange = function (e) {
      if (e.matches) return;
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      var opened = nav.querySelectorAll('.item.open');
      for (var i = 0; i < opened.length; i++) opened[i].classList.remove('open');
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------- 9. Hero video ------------------------------ */
  function initHeroVideo() {
    var video = document.querySelector('.hero-media');
    if (!video) return;
    /* The canvas runtime re-renders the page, so this can run more than
       once. Wire each video element up only the first time we see it. */
    if (video.dataset.sgWired === '1') return;
    video.dataset.sgWired = '1';
    var btn = document.querySelector('.video-toggle');
    var userPaused = false;

    /* Set these as properties, not markup: the canvas runtime rebuilds the
       DOM and drops the bare boolean attributes, which left the hero
       playing once and then freezing. Muted is also what makes autoplay
       permissible in the first place. */
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    function attempt() {
      var p = video.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    /* Respect a reduced-motion preference: hold on the poster frame. */
    if (reduced) {
      video.autoplay = false;
      video.pause();
      userPaused = true;
      if (btn) {
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Play background video');
      }
    } else {
      attempt();
      /* Autoplay can be refused before the first frame is ready; retry once
         there is something to show. */
      video.addEventListener('loadeddata', function () {
        if (!userPaused && video.paused) attempt();
      });
    }

    if (btn) {
      btn.addEventListener('click', function () {
        userPaused = !video.paused;
        if (userPaused) video.pause(); else attempt();
        btn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
        btn.setAttribute('aria-label', userPaused ? 'Play background video'
                                                  : 'Pause background video');
      });
    }

    /* Don't decode frames for a hero that has been scrolled past.
       Backgrounded tabs are left to the browser, which already throttles
       media on its own — pausing on visibilitychange as well just thrashes
       play/pause when a host rapidly toggles visibility. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (userPaused) return;
          if (e.isIntersecting) attempt();
          else video.pause();
        });
      }, { threshold: 0.15 }).observe(video);
    }
  }

  /* ---------- 10. Woven band ----------------------------- */
  /* The motifs draw themselves the first time the band scrolls into
     view; the panning and sheen are pure CSS and run on their own. */
  function initWovenBand() {
    var bands = document.querySelectorAll('.woven-band');
    if (!bands.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      for (var i = 0; i < bands.length; i++) bands[i].classList.add('is-visible');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { threshold: 0.25 });

    for (var j = 0; j < bands.length; j++) io.observe(bands[j]);
  }

  /* ---------- boot --------------------------------------- */
  function boot() {
    buildLoader();
    applyStagger();
    initReveal();
    initHeader();
    initCounters();
    initFilters();
    initTabs();
    initExternalLinks();
    initMobileNav();
    initHeroVideo();
    initWovenBand();

    var minimum = reduced ? 200 : 2350;
    var started = Date.now();
    function finish() {
      var waited = Date.now() - started;
      window.setTimeout(dismissLoader, Math.max(0, minimum - waited));
    }
    /* The design-canvas runtime re-renders the page after we run, which
       discards anything we injected into the header. Re-apply the DOM
       tweaks whenever the tree changes; both are idempotent. */
    var reapplyQueued = false;
    function reapply() {
      reapplyQueued = false;
      initExternalLinks();
      initMobileNav();
      initHeroVideo();
      initWovenBand();
    }
    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        if (reapplyQueued) return;
        reapplyQueued = true;
        window.requestAnimationFrame(reapply);
      }).observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener('load', reapply);

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish);
    /* safety net so the page never stays behind the loader */
    window.setTimeout(dismissLoader, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
