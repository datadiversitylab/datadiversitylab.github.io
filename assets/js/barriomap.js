// BarrioMap inside the page.
// The app fills the window below the site header. The page is locked, so scrolling stays in the app.
(function () {
    var iframe = document.getElementById('barriomap-iframe');
    var fallback = document.getElementById('barriomap-fallback');
    if (!iframe) return;

    // If the app never loads, offer the link to its own tab. The page cannot see why from here
    var loaded = false;
    iframe.addEventListener('load', function () { loaded = true; });
    window.setTimeout(function () {
        if (!loaded && fallback) fallback.hidden = false;
    }, 8000);

    document.documentElement.classList.add('barriomap-lock');

    function fit() {
        window.scrollTo(0, 0);
        var nav = document.querySelector('#cs-navigation, header');
        var bottom = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
        document.documentElement.style.setProperty('--barriomap-offset', Math.max(0, bottom) + 'px');
    }
    fit();
    window.addEventListener('load', fit);
    window.addEventListener('resize', fit);
})();
