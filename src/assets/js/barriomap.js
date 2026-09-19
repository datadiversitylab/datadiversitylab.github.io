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

// Fullscreen toggle. requestFullscreen() is called on the wrapper div
// around the iframe rather than the iframe itself, which keeps the
// iframe correctly resized to fill the screen via the :fullscreen CSS
// rule below. Exiting fullscreen relies on the browser's own built-in
// control (Escape, or the on-screen indicator most browsers show
// automatically when entering fullscreen).
(function () {
    var wrapper = document.getElementById('barriomap-frame-wrapper');
    var fsBtn = document.getElementById('barriomap-fullscreen-btn');
    if (!wrapper || !fsBtn) return;

    var supportsFullscreen = !!(
        wrapper.requestFullscreen ||
        wrapper.webkitRequestFullscreen ||
        wrapper.mozRequestFullScreen ||
        wrapper.msRequestFullscreen
    );

    if (!supportsFullscreen) {
        fsBtn.hidden = true;
        return;
    }

    fsBtn.addEventListener('click', function () {
        var request = wrapper.requestFullscreen ||
            wrapper.webkitRequestFullscreen ||
            wrapper.mozRequestFullScreen ||
            wrapper.msRequestFullscreen;
        request.call(wrapper);
    });
})();