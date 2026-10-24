// The ACDB app inside the page.
// 1. The app starts with the tab or species in the address of this page (#tab=Map_tab, #species=...).
// 2. The app tells this page what people do. The address follows, and the events go to the analytics.
// 3. The app fills the window below the site header. The page is locked, so scrolling stays in the app.
(function () {
    var iframe = document.getElementById('acdb-iframe');
    var wrapper = document.getElementById('acdb-frame-wrapper');
    var fallback = document.getElementById('acdb-fallback');
    if (!iframe || !wrapper) return;

    var APP = iframe.getAttribute('data-src');
    var ORIGIN = new URL(APP, window.location.href).origin;
    var loaded = false;

    // Start the app. A shared link can open a tab or a species
    var fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    var query = new URLSearchParams({ embed: '1' });
    ['tab', 'species'].forEach(function (key) {
        if (fromHash.get(key)) query.set(key, fromHash.get(key));
    });
    iframe.src = APP + '?' + query.toString();
    if (fromHash.get('tab') || fromHash.get('species')) wrapper.scrollIntoView({ block: 'start' });

    // Events to the analytics. Umami is used when it is on the page
    function report(name, data) {
        var clean = {};
        Object.keys(data || {}).slice(0, 8).forEach(function (k) {
            var v = data[k];
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') clean[k] = typeof v === 'string' ? v.slice(0, 100) : v;
        });
        var eventName = 'acdb_' + String(name).replace(/[^a-z0-9_]/gi, '').slice(0, 40);
        if (window.umami && typeof window.umami.track === 'function') window.umami.track(eventName, clean);
        window.dispatchEvent(new CustomEvent('acdb:event', { detail: { name: eventName, data: clean } }));
    }

    // The address of this page follows the app, so that Back, reload, and sharing work
    function setHash(tab, species) {
        var p = new URLSearchParams();
        if (tab && tab !== 'Explore_tab') p.set('tab', tab);
        if (species) p.set('species', species);
        var text = p.toString();
        history.replaceState(null, '', window.location.pathname + window.location.search + (text ? '#' + text : ''));
    }

    // Tell the app where it lives, so that copied links point here
    function hello() {
        if (!iframe.contentWindow) return;
        iframe.contentWindow.postMessage({ type: 'acdb:init', url: window.location.origin + window.location.pathname + window.location.search }, ORIGIN);
    }

    window.addEventListener('message', function (ev) {
        if (ev.source !== iframe.contentWindow || ev.origin !== ORIGIN || !ev.data) return;
        var m = ev.data;
        if (m.type === 'acdb:ready') { loaded = true; hello(); }
        else if (m.type === 'acdb:state') setHash(m.tab, m.species);
        else if (m.type === 'acdb:event') report(m.name, m.data);
    });

    iframe.addEventListener('load', function () { loaded = true; hello(); });

    // If the app never loads, offer the link to its own tab. The page cannot see why from here
    window.setTimeout(function () {
        if (!loaded && fallback) fallback.hidden = false;
    }, 8000);

    // The page is locked and the app fills the window below the site header
    document.documentElement.classList.add('acdb-lock');

    function fit() {
        window.scrollTo(0, 0);
        var nav = document.querySelector('#cs-navigation, header');
        var bottom = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
        document.documentElement.style.setProperty('--acdb-offset', Math.max(0, bottom) + 'px');
    }
    fit();
    window.addEventListener('load', fit);
    window.addEventListener('resize', fit);
})();
