/**
 * transitions.js — robust page fade transitions
 * Place in /assets/js/ and load with <script defer src="/assets/js/transitions.js"></script>
 */
(function () {
  const main = document.getElementById('main');
  if (!main) return;

  // Use View Transitions API if available (Chrome 111+, Edge 111+)
  const supportsViewTransitions = !!document.startViewTransition;

  // ── Fade-in on arrival ──────────────────────────────────────────
  // Handle bfcache restore (back/forward) — snap visible immediately
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      main.style.opacity = '1';
      main.style.transform = 'none';
    }
  });

  // ── Intercept internal link clicks ─────────────────────────────
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip anything that shouldn't transition
    if (
      link.hostname !== window.location.hostname ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:') ||
      link.target === '_blank' ||
      e.defaultPrevented ||
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
    ) return;

    e.preventDefault();

    if (supportsViewTransitions) {
      // Native crossfade — browser handles snapshot + animation
      document.startViewTransition(function () {
        window.location.href = href;
      });
    } else {
      // Fallback — fade out, navigate on transitionend (no setTimeout race)
      main.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      main.style.opacity = '0';
      main.style.transform = 'translateY(5px)';
      main.addEventListener('transitionend', function go() {
        main.removeEventListener('transitionend', go);
        window.location.href = href;
      });
    }
  });
})();