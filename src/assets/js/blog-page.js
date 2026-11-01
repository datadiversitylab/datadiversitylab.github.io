// Blog: topic pills and search. Posts: the copy link button.
(function () {
    'use strict';

    Array.prototype.forEach.call(document.querySelectorAll('[data-copy-link]'), function (btn) {
        btn.addEventListener('click', function () {
            var done = function () { btn.textContent = 'Link copied'; setTimeout(function () { btn.textContent = 'Copy link'; }, 2000); };
            if (navigator.clipboard) { navigator.clipboard.writeText(location.href).then(done); } else { done(); }
        });
    });

    var root = document.getElementById('bl');
    if (!root) { return; }

    var cards = Array.prototype.slice.call(root.querySelectorAll('.bl-card'));
    var pills = Array.prototype.slice.call(root.querySelectorAll('.bl-pill'));
    var box = document.getElementById('bl-q');
    var empty = document.getElementById('bl-empty');
    var state = { tag: '', q: '' };

    // Accents and capitals are ignored
    function fold(s) {
        return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    }

    function render() {
        var q = fold(state.q);
        var shown = 0;
        cards.forEach(function (el) {
            var tags = (el.getAttribute('data-tags') || '').split('|');
            var ok = (!state.tag || tags.indexOf(state.tag) > -1) && (!q || (el.getAttribute('data-hay') || '').indexOf(q) > -1);
            el.hidden = !ok;
            if (ok) { shown++; }
        });
        pills.forEach(function (b) {
            var on = b.getAttribute('data-tag') === state.tag;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        empty.hidden = shown !== 0;

        var parts = [];
        if (state.tag) { parts.push('topic=' + encodeURIComponent(state.tag)); }
        if (state.q) { parts.push('q=' + encodeURIComponent(state.q)); }
        try { history.replaceState(null, '', location.pathname + (parts.length ? '?' + parts.join('&') : '')); } catch (e) { /* ignore */ }
    }

    pills.forEach(function (b) {
        b.addEventListener('click', function () { state.tag = b.getAttribute('data-tag'); render(); });
    });
    box.addEventListener('input', function () { state.q = box.value; render(); });
    var clear = document.getElementById('bl-clear');
    if (clear) { clear.addEventListener('click', function () { state.tag = ''; state.q = ''; box.value = ''; render(); }); }

    // Start from the address, for example ?topic=MacroData
    var params = new URLSearchParams(location.search);
    var topic = params.get('topic') || '';
    if (pills.some(function (b) { return b.getAttribute('data-tag') === topic; })) { state.tag = topic; }
    state.q = params.get('q') || '';
    box.value = state.q;
    render();
})();
