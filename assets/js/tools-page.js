// Tools and data library: search, type tiles and filter chips. Also the copy buttons for install lines.
(function () {
    'use strict';

    // ---------- Copy buttons ----------
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
        clearTimeout(button.flashTimer);
        button.flashTimer = setTimeout(function () { button.textContent = button.dataset.label; }, 1600);
    }
    document.addEventListener('click', function (event) {
        var copy = event.target.closest('[data-copy]');
        if (!copy) { return; }
        copyText(copy.getAttribute('data-copy')).then(function () { flash(copy, 'Copied'); }, function () { flash(copy, 'Press Ctrl+C'); });
    });

    // ---------- Filters ----------
    var grid = document.getElementById('tl-grid');
    if (!grid) { return; }

    // Lower case and without accents
    function fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }
    function split(s) { return s ? s.split('|') : []; }

    var records = Array.prototype.map.call(grid.querySelectorAll('.tl-card'), function (el) {
        return {
            el: el,
            hay: fold(el.dataset.hay),
            types: split(el.dataset.types),
            topics: split(el.dataset.topics),
            live: el.dataset.live === '1'
        };
    });

    var q = document.getElementById('tl-q');
    var count = document.getElementById('tl-count');
    var clearBtn = document.getElementById('tl-clear');
    var empty = document.getElementById('tl-empty');
    var featured = document.getElementById('tl-featured');
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.tl-tile'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('.tl-chip'));

    var state = { q: '', type: '', chip: 'all' };

    function matches(r) {
        if (state.q) {
            var words = fold(state.q).split(/\s+/).filter(Boolean);
            for (var i = 0; i < words.length; i++) {
                if (r.hay.indexOf(words[i]) === -1) { return false; }
            }
        }
        if (state.type && r.types.indexOf(state.type) === -1) { return false; }
        if (state.chip === 'live' && !r.live) { return false; }
        if (state.chip.indexOf('topic:') === 0 && r.topics.indexOf(state.chip.slice(6)) === -1) { return false; }
        return true;
    }

    function isFiltered() { return !!(state.q || state.type || state.chip !== 'all'); }

    function render() {
        var shown = 0;
        records.forEach(function (r) {
            var ok = matches(r);
            r.el.hidden = !ok;
            if (ok) { shown++; }
        });
        tiles.forEach(function (t) {
            t.setAttribute('aria-pressed', t.getAttribute('data-type') === state.type ? 'true' : 'false');
        });
        chips.forEach(function (c) {
            var on = c.getAttribute('data-chip') === state.chip;
            c.classList.toggle('is-on', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var total = records.length;
        count.textContent = isFiltered() ? shown + ' of ' + total + ' tools and datasets' : total + ' tools and datasets';
        clearBtn.hidden = !isFiltered();
        empty.hidden = shown > 0;
        if (featured) { featured.hidden = isFiltered(); }
        writeUrl();
    }

    function writeUrl() {
        if (!window.history || !history.replaceState) { return; }
        var params = new URLSearchParams();
        if (state.q) { params.set('q', state.q); }
        if (state.type) { params.set('type', state.type); }
        if (state.chip !== 'all') { params.set('filter', state.chip); }
        var query = params.toString();
        try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '')); } catch (e) { /* ignore */ }
    }

    function readUrl() {
        var params = new URLSearchParams(location.search);
        if (params.get('q')) { state.q = params.get('q'); q.value = state.q; }
        var type = params.get('type');
        var tile = tiles.filter(function (t) { return fold(t.getAttribute('data-type')) === fold(type); })[0];
        if (tile) { state.type = tile.getAttribute('data-type'); }
        var filter = params.get('filter');
        if (filter && chips.some(function (c) { return c.getAttribute('data-chip') === filter; })) { state.chip = filter; }
    }

    q.addEventListener('input', function () { state.q = q.value.trim(); render(); });
    tiles.forEach(function (t) {
        t.addEventListener('click', function () {
            var name = t.getAttribute('data-type');
            state.type = state.type === name ? '' : name;
            render();
            if (state.type) {
                var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                var box = count.getBoundingClientRect();
                if (box.top < 0 || box.top > window.innerHeight * 0.6) {
                    count.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
                }
            }
        });
    });
    chips.forEach(function (c) {
        c.addEventListener('click', function () { state.chip = c.getAttribute('data-chip'); render(); });
    });

    function reset() {
        state.q = ''; state.type = ''; state.chip = 'all';
        q.value = '';
        render();
    }
    clearBtn.addEventListener('click', reset);
    Array.prototype.forEach.call(document.querySelectorAll('[data-reset]'), function (b) { b.addEventListener('click', reset); });

    readUrl();
    render();
})();
