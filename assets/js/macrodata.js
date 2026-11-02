// MacroData: the section menu and the photo viewer.
document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('.mdx-sub');
    if (bar) {
        var groups = Array.prototype.slice.call(bar.querySelectorAll('.mdx-dd'));
        var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        var timers = new Map();

        var setOpen = function (g, open) {
            g.classList.toggle('is-open', open);
            var b = g.querySelector('button');
            if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (!open) g.classList.remove('is-pinned');
        };
        var closeAll = function (except) {
            groups.forEach(function (g) { if (g !== except) setOpen(g, false); });
        };
        var later = function (g, fn, ms) {
            clearTimeout(timers.get(g));
            timers.set(g, setTimeout(fn, ms));
        };

        groups.forEach(function (g) {
            var button = g.querySelector('button');
            if (!button) return;

            // Hover opens fast and closes slowly, so a small drift of the mouse does not close it
            if (canHover) {
                g.addEventListener('mouseenter', function () {
                    later(g, function () { closeAll(g); setOpen(g, true); }, 70);
                });
                g.addEventListener('mouseleave', function () {
                    later(g, function () { if (!g.classList.contains('is-pinned')) setOpen(g, false); }, 380);
                });
            }

            // A click keeps it open until you click somewhere else
            button.addEventListener('click', function (ev) {
                ev.stopPropagation();
                clearTimeout(timers.get(g));
                var pin = !g.classList.contains('is-pinned');
                closeAll(g);
                setOpen(g, pin);
                g.classList.toggle('is-pinned', pin);
            });

            // Keyboard: arrow down goes into the list
            g.addEventListener('keydown', function (ev) {
                var links = Array.prototype.slice.call(g.querySelectorAll('.mdx-menu a'));
                var i = links.indexOf(document.activeElement);
                if (ev.key === 'ArrowDown') {
                    ev.preventDefault();
                    setOpen(g, true);
                    (links[i + 1] || links[0]).focus();
                } else if (ev.key === 'ArrowUp' && i > -1) {
                    ev.preventDefault();
                    (links[i - 1] || button).focus();
                }
            });
            g.addEventListener('focusout', function (ev) {
                if (!g.contains(ev.relatedTarget)) later(g, function () { setOpen(g, false); }, 120);
            });
        });

        document.addEventListener('click', function () { closeAll(null); });
        document.addEventListener('keydown', function (ev) {
            if (ev.key === 'Escape') {
                var open = groups.filter(function (g) { return g.classList.contains('is-open'); })[0];
                closeAll(null);
                if (open) open.querySelector('button').focus();
            }
        });
    }

    // On phones the row of pages scrolls sideways. Bring the current page into view
    document.querySelectorAll('.mdx-chips').forEach(function (row) {
        var cur = row.querySelector('.is-current');
        if (cur) row.scrollLeft = Math.max(0, cur.offsetLeft - row.clientWidth / 2 + cur.clientWidth / 2);
    });

    // Index on the left: mark the section you are reading
    var toc = Array.prototype.slice.call(document.querySelectorAll('.mdx-toc a'));
    if (toc.length && 'IntersectionObserver' in window) {
        var byId = {};
        toc.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
        var mark = function (id) {
            toc.forEach(function (a) { a.classList.toggle('is-on', a === byId[id]); });
        };
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
        }, { rootMargin: '-25% 0px -65% 0px' });
        Object.keys(byId).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) io.observe(el);
        });
        mark(toc[0].getAttribute('href').slice(1));
    }

    // Photo viewer for the gallery and the news
    var shots = Array.prototype.slice.call(document.querySelectorAll('[data-shot]'));
    if (shots.length) {
        var box = document.createElement('div');
        box.className = 'mdx-lb';
        box.hidden = true;
        box.innerHTML = '<button type="button" class="mdx-lb-x" aria-label="Cerrar">×</button>' +
            '<button type="button" class="mdx-lb-p" aria-label="Anterior">‹</button>' +
            '<figure><img alt=""></figure>' +
            '<button type="button" class="mdx-lb-n" aria-label="Siguiente">›</button>';
        document.body.appendChild(box);
        var img = box.querySelector('img');
        var set = [];
        var at = 0;

        var show = function (i) {
            at = (i + set.length) % set.length;
            img.src = set[at].getAttribute('data-full');
            img.alt = set[at].getAttribute('data-alt') || '';
        };
        var close = function () { box.hidden = true; document.body.style.overflow = ''; };

        shots.forEach(function (el) {
            el.addEventListener('click', function (ev) {
                ev.preventDefault();
                var key = el.getAttribute('data-shot');
                set = shots.filter(function (s) { return s.getAttribute('data-shot') === key; });
                box.hidden = false;
                document.body.style.overflow = 'hidden';
                show(set.indexOf(el));
                box.querySelector('.mdx-lb-x').focus();
            });
        });
        box.querySelector('.mdx-lb-x').addEventListener('click', close);
        box.querySelector('.mdx-lb-p').addEventListener('click', function () { show(at - 1); });
        box.querySelector('.mdx-lb-n').addEventListener('click', function () { show(at + 1); });
        box.addEventListener('click', function (ev) { if (ev.target === box) close(); });
        document.addEventListener('keydown', function (ev) {
            if (box.hidden) return;
            if (ev.key === 'Escape') close();
            if (ev.key === 'ArrowLeft') show(at - 1);
            if (ev.key === 'ArrowRight') show(at + 1);
        });
    }
});
