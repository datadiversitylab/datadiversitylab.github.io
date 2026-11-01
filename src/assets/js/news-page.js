// Lab news: one year at a time, all years in a short list, and search across everything.
(function () {
    'use strict';

    var root = document.getElementById('nw');
    if (!root) { return; }

    var q = document.getElementById('nw-q');
    var count = document.getElementById('nw-count');
    var empty = document.getElementById('nw-empty');
    var pills = Array.prototype.slice.call(root.querySelectorAll('.nw-pill'));
    var years = Array.prototype.slice.call(root.querySelectorAll('.nw-year'));
    if (!pills.length) { return; }

    // Lower case and without accents, so "roman" finds "Román"
    function fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }
    function plural(n) { return n + (n === 1 ? ' update' : ' updates'); }

    var state = { year: pills[0].getAttribute('data-year'), q: '' };

    function render() {
        var words = fold(state.q).split(/\s+/).filter(Boolean);
        var searching = words.length > 0;
        var all = state.year === 'all' || searching;
        root.classList.toggle('is-all', all);

        var total = 0;
        years.forEach(function (y) {
            var show = all || y.getAttribute('data-year') === state.year;
            var yearHits = 0;
            Array.prototype.forEach.call(y.querySelectorAll('.nw-card'), function (card) {
                var hits = 0;
                Array.prototype.forEach.call(card.querySelectorAll('.nw-item'), function (item) {
                    var text = fold(item.getAttribute('data-text'));
                    var ok = words.every(function (w) { return text.indexOf(w) > -1; });
                    item.hidden = !ok;
                    if (ok) { hits++; }
                });
                card.hidden = hits === 0;
                yearHits += hits;
            });
            y.hidden = !show || yearHits === 0;
            if (show) { total += yearHits; }
        });

        pills.forEach(function (p) {
            var on = !searching && p.getAttribute('data-year') === state.year;
            p.classList.toggle('is-on', on);
            p.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        if (searching) {
            count.textContent = total + (total === 1 ? ' update matches' : ' updates match');
        } else if (state.year === 'all') {
            count.textContent = 'All years: ' + plural(total);
        } else {
            count.textContent = state.year + ': ' + plural(total);
        }
        empty.hidden = total > 0;
        writeUrl();
    }

    function writeUrl() {
        if (!window.history || !history.replaceState) { return; }
        var params = new URLSearchParams();
        if (state.year !== pills[0].getAttribute('data-year')) { params.set('year', state.year); }
        if (state.q) { params.set('q', state.q); }
        var query = params.toString();
        try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '')); } catch (e) { /* ignore */ }
    }

    // Open or close one update. Clicking a link inside it works as usual.
    function toggle(item) {
        var open = item.classList.toggle('is-open');
        item.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    root.addEventListener('click', function (event) {
        if (event.target.closest('a')) { return; }
        var more = event.target.closest('.nw-more');
        if (more) {
            var card = more.closest('.nw-card');
            var expanded = card.classList.toggle('is-expanded');
            more.textContent = expanded ? 'Show fewer' : 'Show ' + more.getAttribute('data-more') + ' more';
            return;
        }
        var item = event.target.closest('.nw-item');
        if (item) { toggle(item); }
    });
    root.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') { return; }
        if (event.target.classList && event.target.classList.contains('nw-item')) {
            event.preventDefault();
            toggle(event.target);
        }
    });

    pills.forEach(function (p) {
        p.addEventListener('click', function () {
            state.year = p.getAttribute('data-year');
            state.q = '';
            q.value = '';
            render();
        });
    });
    q.addEventListener('input', function () { state.q = q.value.trim(); render(); });
    document.getElementById('nw-reset').addEventListener('click', function () {
        state.q = '';
        q.value = '';
        render();
    });

    var params = new URLSearchParams(location.search);
    var year = params.get('year');
    if (year && pills.some(function (p) { return p.getAttribute('data-year') === year; })) { state.year = year; }
    if (params.get('q')) { state.q = params.get('q'); q.value = state.q; }
    render();
})();
