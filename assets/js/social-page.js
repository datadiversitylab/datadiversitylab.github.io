// Social page: photo wall with year, tag and search filters, and a photo viewer.
(function () {
    'use strict';

    var grid = document.getElementById('sp-grid');
    if (!grid) { return; }

    var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

    // Lower case and without accents, so "bogota" finds "Bogotá"
    function fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }

    var records = Array.prototype.map.call(grid.querySelectorAll('.sp-tile'), function (el, i) {
        var d = el.dataset;
        var nameBox = el.querySelector('.sp-name');
        // Titles often start with the year, which the caption already shows
        var name = nameBox.textContent.trim().replace(/^\d{4}\s+/, '');
        nameBox.textContent = name;
        var photos = el.querySelectorAll('.sp-photos li').length;
        if (photos < 2) { el.classList.add('is-single'); }
        if (photos >= 4) { el.classList.add('is-big'); }
        return {
            el: el,
            index: i,
            name: name,
            year: parseInt(d.year, 10) || 0,
            month: MONTHS[String(d.month || '').slice(0, 3).toLowerCase()] || 0,
            tags: d.tags ? d.tags.split('|') : [],
            hay: fold(d.hay),
            photos: photos
        };
    });

    // Newest first. Ties keep the order of the files.
    records.sort(function (a, b) {
        return (b.year - a.year) || (b.month - a.month) || (a.index - b.index);
    });
    records.forEach(function (r) { grid.appendChild(r.el); });

    var years = [];
    records.forEach(function (r) {
        if (r.year && years.indexOf(r.year) === -1) { years.push(r.year); }
    });

    var q = document.getElementById('sp-q');
    var yearBox = document.getElementById('sp-years');
    var tagBox = document.getElementById('sp-tags');
    var countBox = document.getElementById('sp-count');
    var empty = document.getElementById('sp-empty');
    var root = document.getElementById('sp');

    var state = { q: '', year: years.length ? String(years[0]) : 'all', tag: '' };

    function inSearch(r) {
        if (!state.q) { return true; }
        var words = fold(state.q).split(/\s+/).filter(Boolean);
        for (var i = 0; i < words.length; i++) {
            if (r.hay.indexOf(words[i]) === -1) { return false; }
        }
        return true;
    }
    function inYear(r) {
        // A search looks through all years
        return state.q || state.year === 'all' || String(r.year) === state.year;
    }
    function inTag(r) {
        return !state.tag || r.tags.indexOf(state.tag) > -1;
    }

    function pill(label, value, on) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'sp-pill' + (on ? ' is-on' : '');
        b.setAttribute('data-value', value);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = label;
        return b;
    }

    function render() {
        var pool = records.filter(function (r) { return inSearch(r) && inYear(r); });

        // Tag pills with the counts of the current year or search
        var counts = {};
        pool.forEach(function (r) {
            r.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
        });
        if (state.tag && !counts[state.tag]) { state.tag = ''; }
        var names = Object.keys(counts).sort(function (a, b) {
            return (counts[b] - counts[a]) || a.localeCompare(b);
        });
        tagBox.textContent = '';
        if (names.length > 1) {
            tagBox.appendChild(pill('All', '', !state.tag));
            names.forEach(function (t) {
                tagBox.appendChild(pill(t + ' (' + counts[t] + ')', t, state.tag === t));
            });
        }

        // Year pills
        yearBox.textContent = '';
        years.forEach(function (y) {
            yearBox.appendChild(pill(String(y), String(y), !state.q && state.year === String(y)));
        });
        yearBox.appendChild(pill('All years', 'all', !state.q && state.year === 'all'));

        // Tiles
        var shown = pool.filter(inTag);
        var photos = 0;
        var wideDone = false;
        records.forEach(function (r) {
            var show = shown.indexOf(r) > -1;
            r.el.hidden = !show;
            r.el.classList.remove('is-wide');
            if (show) {
                photos += r.photos;
                // The newest event of a year opens the wall
                if (!wideDone && !r.el.classList.contains('is-big') && !state.q && state.year !== 'all') {
                    r.el.classList.add('is-wide');
                    wideDone = true;
                }
            }
        });

        var text = shown.length + (shown.length === 1 ? ' event and ' : ' events and ') + photos + (photos === 1 ? ' photo' : ' photos');
        if (!state.q && state.year !== 'all') { text += ' in ' + state.year; }
        countBox.textContent = text;
        empty.hidden = shown.length > 0;
        grid.hidden = shown.length === 0;
        root.classList.toggle('is-all', state.year === 'all' || !!state.q);
        writeUrl();
    }

    // ---------- Address bar ----------
    function writeUrl() {
        if (!window.history || !history.replaceState) { return; }
        var params = new URLSearchParams();
        if (state.q) { params.set('q', state.q); }
        if (!state.q && years.length && state.year !== String(years[0])) { params.set('year', state.year); }
        if (state.tag) { params.set('tag', state.tag); }
        var query = params.toString();
        try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '')); } catch (e) { /* ignore */ }
    }

    function readUrl() {
        var params = new URLSearchParams(location.search);
        var year = params.get('year');
        if (params.get('q')) { state.q = params.get('q'); q.value = state.q; }
        if (year && (year === 'all' || years.indexOf(parseInt(year, 10)) > -1)) { state.year = year; }
        if (params.get('tag')) { state.tag = params.get('tag'); }
    }

    // ---------- Events ----------
    q.addEventListener('input', function () { state.q = q.value.trim(); render(); });

    yearBox.addEventListener('click', function (event) {
        var b = event.target.closest('.sp-pill');
        if (!b) { return; }
        state.year = b.getAttribute('data-value');
        state.q = '';
        q.value = '';
        render();
    });
    tagBox.addEventListener('click', function (event) {
        var b = event.target.closest('.sp-pill');
        if (!b) { return; }
        state.tag = b.getAttribute('data-value');
        render();
    });
    document.getElementById('sp-clear').addEventListener('click', function () {
        state.q = '';
        state.tag = '';
        state.year = 'all';
        q.value = '';
        render();
    });

    // ---------- Photo viewer ----------
    var view = document.getElementById('sp-view');
    var big = document.getElementById('sp-big');
    var vTitle = document.getElementById('sp-vtitle');
    var vMeta = document.getElementById('sp-vmeta');
    var vStory = document.getElementById('sp-vstory');
    var vLinks = document.getElementById('sp-vlinks');
    var vCount = document.getElementById('sp-vcount');
    var closeBtn = document.getElementById('sp-x');
    var current = null;
    var sources = [];
    var at = 0;
    var opener = null;

    function showPhoto() {
        big.src = sources[at];
        big.alt = current.name + ', photo ' + (at + 1) + ' of ' + sources.length;
        vCount.textContent = sources.length > 1 ? (at + 1) + ' of ' + sources.length : '';
        view.classList.toggle('is-one', sources.length < 2);
        // Load the next photo while this one is on screen
        if (sources.length > 1) { new Image().src = sources[(at + 1) % sources.length]; }
    }

    function step(by) {
        if (sources.length < 2) { return; }
        at = (at + by + sources.length) % sources.length;
        showPhoto();
    }

    function openView(r) {
        var el = r.el;
        current = r;
        at = 0;
        sources = Array.prototype.map.call(el.querySelectorAll('.sp-photos li'), function (li) { return li.getAttribute('data-src'); });
        vTitle.textContent = r.name;
        vMeta.textContent = el.querySelector('.sp-meta').textContent.replace(/\s+/g, ' ').trim();
        vStory.innerHTML = el.querySelector('.sp-story').innerHTML;
        vStory.hidden = !vStory.textContent.trim();
        vLinks.innerHTML = el.querySelector('.sp-links').innerHTML;
        opener = document.activeElement;
        view.hidden = false;
        document.body.style.overflow = 'hidden';
        showPhoto();
        closeBtn.focus();
    }

    function closeView() {
        view.hidden = true;
        big.removeAttribute('src');
        document.body.style.overflow = '';
        if (opener && opener.focus) { opener.focus(); }
    }

    grid.addEventListener('click', function (event) {
        var tile = event.target.closest('.sp-tile');
        if (!tile) { return; }
        var r = records.filter(function (x) { return x.el === tile; })[0];
        if (r) { openView(r); }
    });
    closeBtn.addEventListener('click', closeView);
    document.getElementById('sp-prev').addEventListener('click', function () { step(-1); });
    document.getElementById('sp-next').addEventListener('click', function () { step(1); });
    view.addEventListener('click', function (event) {
        if (event.target === view || event.target.closest('.sp-stage') && event.target.tagName !== 'IMG') { closeView(); }
    });
    document.addEventListener('keydown', function (event) {
        if (view.hidden) { return; }
        if (event.key === 'Escape') { closeView(); }
        if (event.key === 'ArrowLeft') { step(-1); }
        if (event.key === 'ArrowRight') { step(1); }
    });

    // Swipe on phones
    var startX = null;
    view.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX; }, { passive: true });
    view.addEventListener('touchend', function (event) {
        if (startX === null) { return; }
        var dx = event.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 50) { step(dx < 0 ? 1 : -1); }
    }, { passive: true });

    readUrl();
    render();
})();
