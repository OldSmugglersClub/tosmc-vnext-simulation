(() => {
  'use strict';
  if (window.__OSC_V247_INITIALIZED__) return;
  window.__OSC_V247_INITIALIZED__ = true;

  const idle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 1));

  idle(() => {
    document.querySelectorAll('img:not([loading])').forEach((image) => {
      if (!image.closest('header, .hero, .site-hero')) image.loading = 'lazy';
      image.decoding = 'async';
    });

    document.querySelectorAll('a, button, summary, input, select').forEach((element) => {
      if (!element.hasAttribute('aria-label') && !element.textContent.trim() && !element.getAttribute('title')) {
        element.setAttribute('aria-label', 'Bedienelement');
      }
    });
  });
})();
