// Grants page: role and funder filters, and the expand buttons.
(function () {
    'use strict';

    var root = document.getElementById('gp');
    if (!root) { return; }

    var items = Array.prototype.slice.call(root.querySelectorAll('.gp-card, .gp-row'));
    var blocks = Array.prototype.slice.call(root.querySelectorAll('.gp-block'));
    var roleBox = document.getElementById('gp-roles');
    var funderBox = document.getElementById('gp-funders');
    var empty = document.getElementById('gp-empty');
    var state = { role: '', funder: '' };

    function mark(box, key, value) {
        Array.prototype.forEach.call(box.querySelectorAll('.gp-pill'), function (b) {
            var on = b.getAttribute('data-' + key) === value;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function render() {
        var shown = 0;
        items.forEach(function (el) {
            var ok = (!state.role || el.getAttribute('data-role') === state.role) &&
                (!state.funder || el.getAttribute('data-funder') === state.funder);
            el.hidden = !ok;
            if (ok) { shown++; }
        });

        // A section with no match hides, and the others show their own count
        blocks.forEach(function (block) {
            var n = block.querySelectorAll('.gp-card:not([hidden]), .gp-row:not([hidden])').length;
            block.hidden = n === 0;
            var label = block.querySelector('[data-n]');
            if (label) {
                if (!label.getAttribute('data-all')) { label.setAttribute('data-all', label.textContent); }
                label.textContent = (state.role || state.funder) ? n + (n === 1 ? ' grant' : ' grants') : label.getAttribute('data-all');
            }
        });

        mark(roleBox, 'role', state.role);
        mark(funderBox, 'funder', state.funder);
        empty.hidden = shown > 0;
        writeUrl();
    }

    // ---------- Address bar ----------
    function writeUrl() {
        if (!window.history || !history.replaceState) { return; }
        var params = new URLSearchParams();
        if (state.role) { params.set('role', state.role); }
        if (state.funder) { params.set('funder', state.funder); }
        var query = params.toString();
        try { history.replaceState(null, '', location.pathname + (query ? '?' + query : '')); } catch (e) { /* ignore */ }
    }

    function readUrl() {
        var params = new URLSearchParams(location.search);
        var role = params.get('role');
        var funder = params.get('funder');
        if (role && roleBox.querySelector('[data-role="' + role.replace(/"/g, '') + '"]')) { state.role = role; }
        if (funder && funderBox.querySelector('[data-funder="' + funder.replace(/"/g, '') + '"]')) { state.funder = funder; }
    }

    // ---------- Events ----------
    roleBox.addEventListener('click', function (event) {
        var b = event.target.closest('.gp-pill');
        if (!b) { return; }
        state.role = b.getAttribute('data-role');
        render();
    });
    funderBox.addEventListener('click', function (event) {
        var b = event.target.closest('.gp-pill');
        if (!b) { return; }
        state.funder = b.getAttribute('data-funder');
        render();
    });
    document.getElementById('gp-clear').addEventListener('click', function () {
        state.role = '';
        state.funder = '';
        render();
    });

    // Read more on active cards
    root.addEventListener('click', function (event) {
        var more = event.target.closest('.gp-more');
        if (more) {
            var card = more.closest('.gp-card');
            var open = card.classList.toggle('is-open');
            more.textContent = open ? 'Show less' : 'Read more';
            more.setAttribute('aria-expanded', open ? 'true' : 'false');
            return;
        }
        // Details of past grants
        var toggle = event.target.closest('.gp-toggle');
        if (toggle) {
            var detail = toggle.parentNode.querySelector('.gp-detail');
            var show = detail.hidden;
            detail.hidden = !show;
            toggle.setAttribute('aria-expanded', show ? 'true' : 'false');
        }
    });

    readUrl();
    render();
})();
