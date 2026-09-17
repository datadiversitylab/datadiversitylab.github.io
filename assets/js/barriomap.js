// Reveal a fallback "open in new tab" link if the embedded app never
// fires a load event within a reasonable time. Because the app is
// hosted on a different origin, this script can't inspect the iframe's
// contents to check whether it was actually blocked by the host's
// framing policy (that's blocked by the browser's same-origin policy,
// by design), so a missed 'load' event is the most reliable signal
// available from here.
(function () {
    var iframe = document.getElementById('barriomap-iframe');
    var fallback = document.getElementById('barriomap-fallback');
    if (!iframe || !fallback) return;

    var loaded = false;
    var TIMEOUT_MS = 8000;

    iframe.addEventListener('load', function () {
        loaded = true;
    });

    window.setTimeout(function () {
        if (!loaded) {
            fallback.hidden = false;
        }
    }, TIMEOUT_MS);
})();
