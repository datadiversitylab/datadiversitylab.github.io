// Team page: filters and search. Profile pages: the "Show all" buttons.
(function () {
    'use strict';

    // Profile pages
    Array.prototype.forEach.call(document.querySelectorAll('.tp-more'), function (btn) {
        btn.addEventListener('click', function () {
            var list = btn.previousElementSibling;
            Array.prototype.forEach.call(list.querySelectorAll('.is-extra'), function (el) { el.hidden = false; });
            btn.hidden = true;
        });
    });

    // Team page
    var root = document.getElementById('tm');
    if (!root) { return; }

    var items = Array.prototype.slice.call(root.querySelectorAll('.tm-item'));
    var blocks = Array.prototype.slice.call(root.querySelectorAll('.tm-block'));
    var pills = Array.prototype.slice.call(root.querySelectorAll('.tm-pill'));
    var box = document.getElementById('tm-q');
    var empty = document.getElementById('tm-empty');
    var state = { show: '', q: '' };

    // Accents and capitals are ignored, so "perez" finds "Pérez"
    function fold(s) {
        return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }

    function render() {
        var q = fold(state.q);
        var shown = 0;
        items.forEach(function (el) {
            var ok = (!state.show || el.getAttribute('data-status') === state.show) &&
                (!q || (el.getAttribute('data-hay') || '').indexOf(q) > -1);
            el.hidden = !ok;
            if (ok) { shown++; }
        });

        // A group or section with nobody left hides, and the others show their own count
        Array.prototype.forEach.call(root.querySelectorAll('.tm-group'), function (group) {
            var n = group.querySelectorAll('.tm-item:not([hidden])').length;
            group.hidden = n === 0;
            var label = group.querySelector('[data-n]');
            if (label) { label.textContent = n; }
        });
        blocks.forEach(function (block) {
            block.hidden = block.querySelectorAll('.tm-item:not([hidden])').length === 0;
        });

        pills.forEach(function (b) {
            var on = b.getAttribute('data-show') === state.show;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        empty.hidden = shown !== 0;

        // The address keeps the choice, so a filtered view can be shared
        var parts = [];
        if (state.show) { parts.push('show=' + encodeURIComponent(state.show)); }
        if (state.q) { parts.push('q=' + encodeURIComponent(state.q)); }
        try { history.replaceState(null, '', location.pathname + (parts.length ? '?' + parts.join('&') : '')); } catch (e) { /* ignore */ }
    }

    pills.forEach(function (b) {
        b.addEventListener('click', function () { state.show = b.getAttribute('data-show'); render(); });
    });
    box.addEventListener('input', function () { state.q = box.value; render(); });
    document.getElementById('tm-clear').addEventListener('click', function () {
        state.show = ''; state.q = ''; box.value = ''; render();
    });

    // Start from the address, for example ?show=alumni
    var params = new URLSearchParams(location.search);
    var show = params.get('show') || '';
    if (pills.some(function (b) { return b.getAttribute('data-show') === show; })) { state.show = show; }
    state.q = params.get('q') || '';
    box.value = state.q;
    render();
})();
