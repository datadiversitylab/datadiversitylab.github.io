// In the news: one year at a time, all years in a short list, search, image galleries and a viewer.
(function () {
    'use strict';

    var root = document.getElementById('pn');
    if (!root) { return; }

    // ---------- Image galleries ----------
    Array.prototype.forEach.call(root.querySelectorAll('.pn-gallery'), function (gallery) {
        var slides = gallery.querySelectorAll('.pn-slide');
        if (slides.length < 2) { return; }
        var index = 0;
        gallery.classList.add('is-ready');
        function show(i) {
            Array.prototype.forEach.call(slides, function (s, n) { s.classList.toggle('is-current', n === i); });
        }
        show(0);
        gallery.querySelector('.pn-prev').addEventListener('click', function () {
            index = index === 0 ? slides.length - 1 : index - 1;
            show(index);
        });
        gallery.querySelector('.pn-next').addEventListener('click', function () {
            index = index === slides.length - 1 ? 0 : index + 1;
            show(index);
        });
    });

    // ---------- Image viewer ----------
    var modal = document.getElementById('pn-modal');
    var modalImg = document.getElementById('pn-modal-img');
    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
    }
    root.addEventListener('click', function (event) {
        var img = event.target.closest('.pn-slide img');
        if (!img) { return; }
        modalImg.src = img.currentSrc || img.src;
        modalImg.alt = img.alt;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
    });
    document.getElementById('pn-modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (event) { if (event.target === modal) { closeModal(); } });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !modal.hidden) { closeModal(); } });

    // ---------- Years and search ----------
    var q = document.getElementById('pn-q');
    var count = document.getElementById('pn-count');
    var empty = document.getElementById('pn-empty');
    var pills = Array.prototype.slice.call(root.querySelectorAll('.pn-pill'));
    var years = Array.prototype.slice.call(root.querySelectorAll('.pn-year'));
    if (!pills.length) { return; }

    // Lower case and without accents, so "universite" finds "Université"
    function fold(s) {
        return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }
    function plural(n) { return n + (n === 1 ? ' story' : ' stories'); }

    var state = { year: pills[0].getAttribute('data-year'), q: '' };

    function render() {
        var words = fold(state.q).split(/\s+/).filter(Boolean);
        var searching = words.length > 0;
        var all = state.year === 'all' || searching;
        root.classList.toggle('is-all', all);

        var total = 0;
        years.forEach(function (y) {
            var show = all || y.getAttribute('data-year') === state.year;
            var hits = 0;
            Array.prototype.forEach.call(y.querySelectorAll('.pn-card'), function (card) {
                var text = fold(card.getAttribute('data-hay'));
                var ok = words.every(function (w) { return text.indexOf(w) > -1; });
                card.hidden = !ok;
                if (ok) { hits++; }
            });
            y.hidden = !show || hits === 0;
            if (show) { total += hits; }
        });

        pills.forEach(function (p) {
            var on = !searching && p.getAttribute('data-year') === state.year;
            p.classList.toggle('is-on', on);
            p.setAttribute('aria-pressed', on ? 'true' : 'false');
        });

        if (searching) {
            count.textContent = total + (total === 1 ? ' story matches' : ' stories match');
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

    pills.forEach(function (p) {
        p.addEventListener('click', function () {
            state.year = p.getAttribute('data-year');
            state.q = '';
            q.value = '';
            render();
        });
    });
    q.addEventListener('input', function () { state.q = q.value.trim(); render(); });
    document.getElementById('pn-reset').addEventListener('click', function () {
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
