// Lab meetings page: opens the current semester, finds the next meeting, and marks past and upcoming rows.
(function () {
    'use strict';

    var panels = [].slice.call(document.querySelectorAll('.lm-panel'));
    if (!panels.length) { return; }
    var pills = [].slice.call(document.querySelectorAll('.lm-pill'));
    var rows = [].slice.call(document.querySelectorAll('.lm-row'));

    // Days as whole numbers, in the visitor's own calendar
    var DAY = 864e5;
    var num = function (iso) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / DAY; };
    var now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY;

    rows.forEach(function (r) {
        var d = num(r.getAttribute('data-date'));
        r.classList.toggle('is-past', d < today);
        r.classList.toggle('is-today', d === today);
    });

    // The semester that covers today, or the closest one
    var distance = function (p) {
        var a = num(p.getAttribute('data-first') || '1970-01-01');
        var b = num(p.getAttribute('data-last') || '1970-01-01');
        return today < a ? a - today : today > b ? today - b : 0;
    };
    var closest = panels.slice().sort(function (x, y) { return distance(x) - distance(y); })[0];

    function show(slug) {
        panels.forEach(function (p) { p.hidden = p.getAttribute('data-sem') !== slug; });
        pills.forEach(function (a) {
            var on = a.getAttribute('data-sem') === slug;
            a.classList.toggle('is-on', on);
            if (on) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
        });
    }

    var asked = (new URLSearchParams(location.search).get('sem') || location.hash.slice(1)).toLowerCase();
    var start = panels.filter(function (p) { return p.getAttribute('data-sem') === asked; })[0] || closest;
    show(start.getAttribute('data-sem'));

    pills.forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            var slug = a.getAttribute('data-sem');
            show(slug);
            if (history.replaceState) { history.replaceState(null, '', '?sem=' + slug); }
        });
    });

    // The next meeting that is not marked as off
    var upcoming = rows.filter(function (r) { return !r.getAttribute('data-off') && num(r.getAttribute('data-date')) >= today; })
        .sort(function (x, y) { return num(x.getAttribute('data-date')) - num(y.getAttribute('data-date')); });
    var next = upcoming[0];
    var box = document.getElementById('lm-next');

    if (!next || !box) {
        var none = document.getElementById('lm-none');
        if (none) { none.hidden = false; }
        return;
    }
    next.classList.add('is-next');

    var $ = function (id) { return document.getElementById(id); };
    var away = num(next.getAttribute('data-date')) - today;
    $('lmn-label').textContent = away === 0 ? 'Meeting today' : 'Next meeting';
    $('lmn-when').textContent = away === 0 ? '' : away === 1 ? 'Tomorrow' : away <= 30 ? 'In ' + away + ' days' : '';
    $('lmn-title').textContent = next.getAttribute('data-title');
    $('lmn-date').textContent = next.getAttribute('data-long');

    var panel = next.closest('.lm-panel');
    var where = [panel.getAttribute('data-when'), panel.getAttribute('data-place')].filter(Boolean).join(' · ');
    $('lmn-where').textContent = where;
    $('lmn-where').hidden = !where;

    var who = next.getAttribute('data-who');
    var holder = $('lmn-person');
    holder.textContent = '';
    if (who) {
        var img = next.getAttribute('data-img');
        var url = next.getAttribute('data-url');
        var el = document.createElement(url ? 'a' : 'span');
        if (url) { el.href = url; }
        if (img) {
            var pic = document.createElement('img');
            pic.src = img; pic.alt = ''; pic.width = 40; pic.height = 40;
            el.appendChild(pic);
        }
        var label = document.createElement('span');
        label.textContent = who;
        el.appendChild(label);
        holder.appendChild(el);
    }
    holder.hidden = !who;

    var link = $('lmn-link');
    var href = next.getAttribute('data-link');
    link.hidden = !href;
    if (href) { link.href = href; link.textContent = (next.getAttribute('data-linklabel') || 'Link') + ' →'; }

    box.hidden = false;
})();
