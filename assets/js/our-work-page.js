// Our work: papers, tools and grants in one list, with search, type, topic and sort.
// The address keeps the choices, so a filtered view can be shared (?type=Paper&topic=Software&q=...).
(function () {
    'use strict';

    var node = document.getElementById('ow-data');
    var list = document.getElementById('ow-list');
    if (!node || !list) { return; }

    var data;
    try { data = JSON.parse(node.textContent); } catch (e) { return; }
    var items = (data.items || []).filter(Boolean);
    var topics = (data.topics || []).filter(function (t) {
        return items.some(function (i) { return (i.topics || []).indexOf(t) > -1; });
    });

    var STEP = 25;
    var state = { type: 'all', topic: 'all', term: '', sort: 'new', shown: STEP };

    var els = {
        q: document.getElementById('ow-q'),
        sort: document.getElementById('ow-sort'),
        topics: document.getElementById('ow-topics'),
        summary: document.getElementById('ow-summary'),
        clear: document.getElementById('ow-clear'),
        empty: document.getElementById('ow-empty'),
        more: document.getElementById('ow-more')
    };
    var typeButtons = Array.prototype.slice.call(document.querySelectorAll('.ow-type'));

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) { n.className = cls; }
        if (text) { n.textContent = text; }
        return n;
    }

    function matches(i, skip) {
        if (skip !== 'type' && state.type !== 'all' && i.type !== state.type) { return false; }
        if (skip !== 'topic' && state.topic !== 'all' && (i.topics || []).indexOf(state.topic) === -1) { return false; }
        if (state.term) {
            var words = state.term.split(' ');
            for (var k = 0; k < words.length; k++) { if (i.hay.indexOf(words[k]) === -1) { return false; } }
        }
        return true;
    }

    function compare(a, b) {
        if (state.sort === 'az') { return a.title.localeCompare(b.title); }
        // Items without a year go last in both directions
        if (!a.year && !b.year) { return a.title.localeCompare(b.title); }
        if (!a.year) { return 1; }
        if (!b.year) { return -1; }
        var diff = (a.year * 13 + (a.month || 0)) - (b.year * 13 + (b.month || 0));
        if (diff === 0) { return a.title.localeCompare(b.title); }
        return state.sort === 'old' ? diff : -diff;
    }

    function row(i) {
        var li = el('li', 'ow-row');
        li.appendChild(el('span', 'ow-year', i.shownYear || ''));

        var main = el('div', 'ow-main');
        var top = el('div', 'ow-top');
        top.appendChild(el('span', 'ow-badge ow-badge-' + i.type.toLowerCase(), i.type === 'Tool' ? 'Tool or data' : i.type));
        (i.pills || []).forEach(function (p) { top.appendChild(el('span', 'ow-pill', p)); });
        main.appendChild(top);

        var title = el('a', 'ow-title', i.title);
        title.href = i.url;
        main.appendChild(title);

        var meta = [i.who, i.where].filter(Boolean).join(' · ');
        if (meta) { main.appendChild(el('p', 'ow-meta', meta)); }

        // Small photos of the lab members on the paper, tool or grant. Each links to the person.
        var faces = (i.faces || []).filter(function (f) { return f && f.image; });
        if (faces.length) {
            var fl = el('ul', 'ow-faces');
            fl.setAttribute('aria-label', 'Lab members');
            faces.slice(0, 6).forEach(function (f) {
                var item = el('li');
                var a = el('a');
                a.href = f.url || '/our-team/';
                a.title = f.name;
                var img = el('img');
                img.src = f.image;
                img.alt = f.name;
                img.width = 30;
                img.height = 30;
                img.loading = 'lazy';
                img.decoding = 'async';
                a.appendChild(img);
                item.appendChild(a);
                fl.appendChild(item);
            });
            if (faces.length > 6) { fl.appendChild(el('li', 'ow-faces-more', '+' + (faces.length - 6))); }
            main.appendChild(fl);
        }

        var actions = el('div', 'ow-actions');
        var open = el('a', 'ow-act ow-act-main', i.type === 'Grant' ? 'See the grant' : 'Open page');
        open.href = i.url;
        actions.appendChild(open);
        if (i.link2) {
            var out = el('a', 'ow-act', i.link2Label || 'Link');
            out.href = i.link2;
            if (/^https?:/.test(i.link2) || /\.pdf$/i.test(i.link2)) { out.target = '_blank'; out.rel = 'noopener'; }
            actions.appendChild(out);
        }
        if (i.detail) {
            var detail = el('p', 'ow-detail', i.detail);
            detail.hidden = true;
            var btn = el('button', 'ow-act ow-toggle', 'Preview');
            btn.type = 'button';
            btn.setAttribute('aria-expanded', 'false');
            btn.addEventListener('click', function () {
                var opening = detail.hidden;
                detail.hidden = !opening;
                btn.setAttribute('aria-expanded', String(opening));
                btn.textContent = opening ? 'Hide preview' : 'Preview';
            });
            actions.appendChild(btn);
            main.appendChild(actions);
            main.appendChild(detail);
        } else {
            main.appendChild(actions);
        }
        li.appendChild(main);
        return li;
    }

    function count(button, n) {
        var em = button.querySelector('em');
        if (em) { em.textContent = n; }
    }

    function buildTopics() {
        els.topics.innerHTML = '';
        if (!topics.length) { return; }
        els.topics.appendChild(el('span', 'ow-topics-label', 'Topic'));
        ['all'].concat(topics).forEach(function (t) {
            var b = el('button', 'ow-topic', t === 'all' ? 'Any' : t);
            b.type = 'button';
            b.setAttribute('data-topic', t);
            b.appendChild(el('em'));
            b.addEventListener('click', function () {
                state.topic = state.topic === t ? 'all' : t;
                state.shown = STEP;
                render();
            });
            els.topics.appendChild(b);
        });
    }

    function syncUrl() {
        var p = new URLSearchParams();
        if (state.type !== 'all') { p.set('type', state.type); }
        if (state.topic !== 'all') { p.set('topic', state.topic); }
        if (state.term) { p.set('q', state.term); }
        if (state.sort !== 'new') { p.set('sort', state.sort); }
        var qs = p.toString();
        try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) { /* ignore */ }
    }

    function render() {
        // Each group counts what you would get if you picked it, given the other filters
        typeButtons.forEach(function (b) {
            var t = b.getAttribute('data-type');
            count(b, items.filter(function (i) { return matches(i, 'type') && (t === 'all' || i.type === t); }).length);
            b.classList.toggle('is-on', state.type === t);
            b.setAttribute('aria-pressed', String(state.type === t));
        });
        Array.prototype.forEach.call(els.topics.querySelectorAll('.ow-topic'), function (b) {
            var t = b.getAttribute('data-topic');
            count(b, items.filter(function (i) { return matches(i, 'topic') && (t === 'all' || (i.topics || []).indexOf(t) > -1); }).length);
            var on = state.topic === t;
            b.classList.toggle('is-on', on);
            b.setAttribute('aria-pressed', String(on));
        });

        var all = items.filter(function (i) { return matches(i); }).sort(compare);
        var slice = all.slice(0, state.shown);
        list.innerHTML = '';
        slice.forEach(function (i) { list.appendChild(row(i)); });

        els.empty.hidden = all.length !== 0;
        els.more.hidden = all.length <= slice.length;
        els.more.textContent = 'Show ' + Math.min(STEP, all.length - slice.length) + ' more';
        els.clear.hidden = !(state.type !== 'all' || state.topic !== 'all' || state.term);
        els.summary.textContent = all.length ? 'Showing ' + slice.length + ' of ' + all.length + (all.length === 1 ? ' item' : ' items') : '';
        syncUrl();
    }

    typeButtons.forEach(function (b) {
        b.addEventListener('click', function () { state.type = b.getAttribute('data-type'); state.shown = STEP; render(); });
    });

    var timer;
    els.q.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            state.term = els.q.value.trim().toLowerCase().replace(/\s+/g, ' ');
            state.shown = STEP;
            render();
        }, 120);
    });
    els.sort.addEventListener('change', function () { state.sort = els.sort.value; state.shown = STEP; render(); });
    els.more.addEventListener('click', function () { state.shown += STEP; render(); });
    els.clear.addEventListener('click', function () {
        state.type = 'all'; state.topic = 'all'; state.term = ''; els.q.value = ''; state.shown = STEP; render();
    });

    // Start from the address
    var q = new URLSearchParams(location.search);
    if (['Paper', 'Tool', 'Grant'].indexOf(q.get('type')) > -1) { state.type = q.get('type'); }
    if (topics.indexOf(q.get('topic')) > -1) { state.topic = q.get('topic'); }
    if (q.get('q')) { state.term = q.get('q').toLowerCase(); els.q.value = q.get('q'); }
    if (['new', 'old', 'az'].indexOf(q.get('sort')) > -1) { state.sort = q.get('sort'); els.sort.value = state.sort; }

    buildTopics();
    render();
})();
