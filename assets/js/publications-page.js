// Publications page: search, topic and kind filters, sorting, card or list view.
// Also handles the Cite, Copy and Share buttons on the page of each paper.
(function () {
    'use strict';

    // ---------- Copy and share buttons (listing and paper pages) ----------
    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            var box = document.createElement('textarea');
            box.value = text;
            box.setAttribute('readonly', '');
            box.style.position = 'fixed';
            box.style.opacity = '0';
            document.body.appendChild(box);
            box.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            document.body.removeChild(box);
            if (ok) { resolve(); } else { reject(new Error('copy failed')); }
        });
    }

    function flash(button, message) {
        if (!button.dataset.label) { button.dataset.label = button.textContent; }
        button.textContent = message;
        button.classList.add('is-done');
        clearTimeout(button.flashTimer);
        button.flashTimer = setTimeout(function () {
            button.textContent = button.dataset.label;
            button.classList.remove('is-done');
        }, 1600);
    }

    document.addEventListener('click', function (event) {
        var copy = event.target.closest('[data-copy]');
        if (copy) {
            copyText(copy.getAttribute('data-copy')).then(function () {
                flash(copy, 'Copied');
            }, function () {
                flash(copy, 'Press Ctrl+C');
            });
            return;
        }
        var share = event.target.closest('[data-share]');
        if (share) {
            if (navigator.share) {
                navigator.share({ title: document.title.trim(), url: location.href }).catch(function () {});
            } else {
                copyText(location.href).then(function () { flash(share, 'Link copied'); }, function () {});
            }
        }
    });

    // ---------- Listing ----------
    var grid = document.getElementById('pl-grid');
    if (!grid) { return; }

    // Lower case and without accents, so "roman" finds "Román"
    function fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }
    function split(s) {
        return s ? s.split('|') : [];
    }

    var records = Array.prototype.map.call(grid.querySelectorAll('.pl-card'), function (el) {
        var d = el.dataset;
        var areas = split(d.areas);
        return {
            el: el,
            hay: fold(d.hay),
            title: d.title || '',
            year: parseInt(d.year, 10) || 0,
            rank: parseInt(d.rank, 10) || 0,
            kind: d.kind,
            areas: areas,
            topics: split(d.topics),
            tools: areas.indexOf('Tools') > -1,
            student: d.student === '1',
            venue: d.venue || '',
            keywords: split(d.keywords),
            url: d.url
        };
    });

    var q = document.getElementById('pl-q');
    var sortBox = document.getElementById('pl-sort');
    var fromBox = document.getElementById('pl-from');
    var toBox = document.getElementById('pl-to');
    var venueBox = document.getElementById('pl-venue');
    var areaBox = document.getElementById('pl-area');
    var countBox = document.getElementById('pl-count');
    var clearBtn = document.getElementById('pl-clear');
    var empty = document.getElementById('pl-empty');
    var featured = document.getElementById('pl-featured');
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.pl-tile'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('.pl-chip'));
    var viewButtons = Array.prototype.slice.call(document.querySelectorAll('.pl-seg button'));
    var more = document.querySelector('.pl-more');

    var state = { q: '', topic: '', kind: 'all', sort: 'new', view: 'cards', from: '', to: '', venue: '', area: '' };

    function matches(r) {
        if (state.q) {
            var words = fold(state.q).split(/\s+/).filter(Boolean);
            for (var i = 0; i < words.length; i++) {
                if (r.hay.indexOf(words[i]) === -1) { return false; }
            }
        }
        if (state.topic && r.topics.indexOf(state.topic) === -1) { return false; }
        if (state.kind === 'tools' && !r.tools) { return false; }
        if (state.kind === 'student' && !r.student) { return false; }
        if (state.kind !== 'all' && state.kind !== 'tools' && state.kind !== 'student' && r.kind !== state.kind) { return false; }
        if (state.from && (!r.year || r.year < parseInt(state.from, 10))) { return false; }
        if (state.to && (!r.year || r.year > parseInt(state.to, 10))) { return false; }
        if (state.venue && r.venue !== state.venue) { return false; }
        if (state.area && r.areas.indexOf(state.area) === -1) { return false; }
        return true;
    }

    function compare(a, b) {
        if (state.sort === 'title') { return a.title.localeCompare(b.title); }
        var diff = state.sort === 'old' ? a.rank - b.rank : b.rank - a.rank;
        return diff || a.title.localeCompare(b.title);
    }

    function isFiltered() {
        return !!(state.q || state.topic || state.kind !== 'all' || state.from || state.to || state.venue || state.area);
    }

    function yearHeader(year, count) {
        var row = document.createElement('div');
        row.className = 'pl-year';
        var h = document.createElement('h2');
        h.textContent = year || 'Undated';
        var line = document.createElement('i');
        var n = document.createElement('span');
        n.textContent = count + (count === 1 ? ' paper' : ' papers');
        row.appendChild(h);
        row.appendChild(line);
        row.appendChild(n);
        return row;
    }

    function render() {
        var shown = records.filter(matches).sort(compare);
        var hidden = records.filter(function (r) { return shown.indexOf(r) === -1; });

        Array.prototype.forEach.call(grid.querySelectorAll('.pl-year'), function (node) {
            grid.removeChild(node);
        });

        var fragment = document.createDocumentFragment();
        var byYear = {};
        shown.forEach(function (r) { byYear[r.year] = (byYear[r.year] || 0) + 1; });
        var current = null;
        shown.forEach(function (r) {
            if (state.sort !== 'title' && r.year !== current) {
                current = r.year;
                fragment.appendChild(yearHeader(r.year, byYear[r.year]));
            }
            r.el.hidden = false;
            fragment.appendChild(r.el);
        });
        hidden.forEach(function (r) {
            r.el.hidden = true;
            fragment.appendChild(r.el);
        });
        grid.appendChild(fragment);

        grid.classList.toggle('is-list', state.view === 'list');
        viewButtons.forEach(function (b) {
            var on = b.getAttribute('data-view') === state.view;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        tiles.forEach(function (t) {
            t.setAttribute('aria-pressed', t.getAttribute('data-topic') === state.topic ? 'true' : 'false');
        });
        chips.forEach(function (c) {
            var on = c.getAttribute('data-kind') === state.kind;
            c.classList.toggle('is-on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        var total = records.length;
        countBox.textContent = isFiltered() ? shown.length + ' of ' + total + ' papers' : total + ' papers';
        clearBtn.hidden = !isFiltered();
        empty.hidden = shown.length > 0;
        if (featured) { featured.hidden = isFiltered(); }
        writeUrl();
    }

    // ---------- Address bar ----------
    function writeUrl() {
        if (!window.history || !history.replaceState) { return; }
        var params = new URLSearchParams();
        if (state.q) { params.set('q', state.q); }
        if (state.topic) { params.set('topic', state.topic); }
        if (state.kind !== 'all') { params.set('kind', state.kind); }
        var query = params.toString();
        try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '')); } catch (e) { /* ignore */ }
    }

    function readUrl() {
        var params = new URLSearchParams(location.search);
        var topic = params.get('topic');
        var kind = params.get('kind');
        if (params.get('q')) { state.q = params.get('q'); q.value = state.q; }
        if (topic) {
            var tile = tiles.filter(function (t) { return fold(t.getAttribute('data-topic')) === fold(topic); })[0];
            var area = Array.prototype.filter.call(areaBox.options, function (o) { return o.value && fold(o.value) === fold(topic); })[0];
            if (tile) {
                state.topic = tile.getAttribute('data-topic');
            } else if (fold(topic) === 'tools') {
                state.kind = 'tools';
            } else if (area) {
                state.area = area.value;
                areaBox.value = area.value;
            }
        }
        if (kind && chips.some(function (c) { return c.getAttribute('data-kind') === kind; })) { state.kind = kind; }
    }

    // ---------- Events ----------
    function toResults() {
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var box = countBox.getBoundingClientRect();
        if (box.top < 0 || box.top > window.innerHeight * 0.6) {
            countBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }
    }

    q.addEventListener('input', function () { state.q = q.value.trim(); render(); });
    sortBox.addEventListener('change', function () { state.sort = sortBox.value; render(); });
    if (fromBox) { fromBox.addEventListener('change', function () { state.from = fromBox.value; render(); }); }
    if (toBox) { toBox.addEventListener('change', function () { state.to = toBox.value; render(); }); }
    venueBox.addEventListener('change', function () { state.venue = venueBox.value; render(); });
    areaBox.addEventListener('change', function () { state.area = areaBox.value; render(); });

    viewButtons.forEach(function (b) {
        b.addEventListener('click', function () { state.view = b.getAttribute('data-view'); render(); });
    });
    tiles.forEach(function (t) {
        t.addEventListener('click', function () {
            var name = t.getAttribute('data-topic');
            state.topic = state.topic === name ? '' : name;
            render();
            if (state.topic) { toResults(); }
        });
    });
    chips.forEach(function (c) {
        c.addEventListener('click', function () { state.kind = c.getAttribute('data-kind'); render(); });
    });

    function reset() {
        state.q = ''; state.topic = ''; state.kind = 'all';
        state.from = ''; state.to = ''; state.venue = ''; state.area = '';
        q.value = '';
        if (fromBox) { fromBox.value = ''; }
        if (toBox) { toBox.value = ''; }
        venueBox.value = '';
        areaBox.value = '';
        render();
    }
    clearBtn.addEventListener('click', reset);
    Array.prototype.forEach.call(document.querySelectorAll('[data-reset]'), function (b) {
        b.addEventListener('click', reset);
    });

    document.getElementById('pl-surprise').addEventListener('click', function () {
        var pool = records.filter(function (r) { return !r.el.hidden; });
        if (!pool.length) { pool = records; }
        var pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick) { location.href = pick.url; }
    });

    readUrl();
    if (more && (state.from || state.to || state.venue || state.area)) { more.open = true; }
    render();
})();
