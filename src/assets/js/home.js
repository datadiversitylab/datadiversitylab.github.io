// Landing page behavior: the photo tree in the hero and the count-up numbers.
// Markup lives in src/index.html. Styles live in src/css/home.css.

(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function shuffle(list) {
        var a = list.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function make(tag, className) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        return el;
    }

    // ------------------------------------------------------------------
    // Numbers in the hero count up once, when the row scrolls into view
    // ------------------------------------------------------------------
    function initCounters() {
        var row = document.querySelector('.hero-stats');
        if (!row || reduceMotion || !('IntersectionObserver' in window)) return;

        function run(el) {
            var target = parseInt(el.getAttribute('data-target'), 10) || 0;
            var from = target > 100 ? target - 3 : 0;
            var start = performance.now();
            function step(now) {
                var progress = Math.min((now - start) / 1600, 1);
                var eased = 1 - Math.pow(2, -10 * progress);
                el.textContent = progress < 1 ? Math.floor(from + (target - from) * eased) : target;
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        var observer = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            row.querySelectorAll('.hero-stat-number').forEach(run);
            observer.disconnect();
        }, { threshold: 0.3 });
        observer.observe(row);
    }

    // ------------------------------------------------------------------
    // Photo tree: a radial tree with one photo at every tip.
    // Research (papers) is one branch and community (events, workshops) the other.
    // ------------------------------------------------------------------
    function initTree() {
        var stage = document.getElementById('hero-tree');
        var photosEl = document.getElementById('ht-photos');
        var svg = document.getElementById('ht-lines');
        var note = document.getElementById('hero-note');
        if (!stage || !photosEl || !svg || !note) return;

        var pool = [].slice.call(document.querySelectorAll('#ht-pool li')).map(function (li) {
            var d = li.dataset;
            return {
                group: d.group, sub: d.sub, src: d.src, link: (d.link || '').trim(),
                kicker: (d.kicker || '').trim(), title: (d.title || '').trim(), desc: (d.desc || '').trim()
            };
        });
        var research = pool.filter(function (p) { return p.group === 'research'; });
        var community = pool.filter(function (p) { return p.group === 'community'; });
        if (research.length < 2 || community.length < 2) { stage.parentNode.hidden = true; return; }

        var SVG = 'http://www.w3.org/2000/svg';
        var base = parseInt(stage.getAttribute('data-count'), 10) || 6;
        var SIZE = [1, 0.82, 0.94, 0.76, 0.9, 0.84, 1, 0.8];
        var items = [], topo = null, jitter = [], focus = 0, rotation = 0, held = false, visible = true;

        function count() {
            return Math.min(window.innerWidth < 1050 ? 5 : base, research.length + community.length);
        }

        // Take photos from each source in turn so events and workshops are both represented
        function pickCommunity(n) {
            var lists = ['socials', 'macrodata'].map(function (sub) {
                return shuffle(community.filter(function (p) { return p.sub === sub; }));
            });
            var out = [], i = 0;
            while (out.length < n && lists.some(function (l) { return l.length; })) {
                var l = lists[i++ % lists.length];
                if (l.length) out.push(l.shift());
            }
            return out;
        }
        function pick(n) {
            // Community photos outnumber papers about two to one
            var r = Math.max(1, Math.round(n * 0.35));
            return shuffle(research).slice(0, r).concat(pickCommunity(n - r));
        }

        function setImage(img, src) {
            img.classList.remove('is-loaded');
            img.onload = function () { img.classList.add('is-loaded'); };
            img.src = src;
            if (img.complete) img.classList.add('is-loaded');
        }
        function describe(d) { return d.title + (d.kicker ? ', ' + d.kicker : ''); }

        function render() {
            var picks = pick(count());
            photosEl.innerHTML = '';
            items = picks.map(function (d, i) {
                var photo = make('div', 'ht-photo is-' + d.group);
                var inner = make('div', 'ht-photo-in');
                var button = make('button', 'ht-btn');
                var img = new Image();
                button.type = 'button';
                button.setAttribute('aria-label', describe(d));
                img.alt = '';
                img.decoding = 'async';
                button.appendChild(img); inner.appendChild(button); photo.appendChild(inner); photosEl.appendChild(photo);
                setImage(img, d.src);
                var select = function () { focusTo(i); };
                button.addEventListener('click', select);
                button.addEventListener('focus', select);
                button.addEventListener('mouseenter', function () {
                    if (window.matchMedia('(hover: hover)').matches) select();
                });
                return { data: d, photo: photo, inner: inner, button: button, img: img };
            });
            jitter = items.map(function () { return (Math.random() - 0.5) * 0.22; });

            // The first split separates research from community. Below it, splits are random.
            var split = items.filter(function (it) { return it.data.group === 'research'; }).length;
            topo = { leaf: false, kids: [build(0, split), build(split, items.length)] };
            topo.h = Math.max(topo.kids[0].h, topo.kids[1].h) + 1;

            draw();
            focus = 0;
            items[0].photo.classList.add('is-focus');
            fillNote(items[0].data);
        }

        function build(lo, hi) {
            if (hi - lo === 1) return { leaf: true, i: lo, h: 0, group: items[lo].data.group };
            var k = lo + Math.round((hi - lo) * (0.35 + 0.3 * Math.random()));
            k = Math.max(lo + 1, Math.min(hi - 1, k));
            var left = build(lo, k), right = build(k, hi);
            return { leaf: false, kids: [left, right], h: Math.max(left.h, right.h) + 1, group: left.group };
        }

        // Root at the centre, tips on the outer ring, arcs at each split
        function draw() {
            svg.innerHTML = '';
            var size = stage.clientWidth;
            if (!size) return;
            var c = size / 2, n = items.length;
            svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);

            var photoRadius = size * 0.128;
            var ring = c - photoRadius * 1.16 - 4;
            var angles = items.map(function (it, i) { return -Math.PI / 2 + (i + 0.5) * 2 * Math.PI / n + jitter[i]; });

            function point(r, a) { return [c + r * Math.cos(a), c + r * Math.sin(a)]; }
            function fmt(v) { return v.toFixed(1); }
            function radius(node) { return node.leaf ? ring : ring * 0.74 * (1 - node.h / topo.h); }
            function angle(node) {
                if (node.leaf) return angles[node.i];
                if (node.a === undefined) node.a = (angle(node.kids[0]) + angle(node.kids[1])) / 2;
                return node.a;
            }
            function line(d, delay, group) {
                var p = document.createElementNS(SVG, 'path');
                p.setAttribute('d', d);
                p.setAttribute('pathLength', '1');
                if (group === 'research') p.setAttribute('class', 'is-research');
                p.style.setProperty('--d', delay.toFixed(2) + 's');
                svg.appendChild(p);
            }
            function dot(pt, r, delay, group) {
                var e = document.createElementNS(SVG, 'circle');
                e.setAttribute('cx', fmt(pt[0])); e.setAttribute('cy', fmt(pt[1])); e.setAttribute('r', r);
                if (group === 'root') e.setAttribute('class', 'ht-root');
                else if (group === 'research') e.setAttribute('class', 'is-research');
                e.style.setProperty('--d', delay.toFixed(2) + 's');
                svg.appendChild(e);
            }

            function walk(node, depth) {
                var r = radius(node), t = depth * 0.4 + 0.2;
                var a1 = angle(node.kids[0]), a2 = angle(node.kids[1]);
                if (r > 1) {
                    var p1 = point(r, a1), p2 = point(r, a2);
                    line('M' + fmt(p1[0]) + ',' + fmt(p1[1]) + 'A' + fmt(r) + ',' + fmt(r) + ' 0 ' + (a2 - a1 > Math.PI ? 1 : 0) + ' 1 ' + fmt(p2[0]) + ',' + fmt(p2[1]), t, node.group);
                    dot(point(r, angle(node)), 2.8, t, node.group);
                } else {
                    dot([c, c], 5, 0, 'root');
                }
                node.kids.forEach(function (kid) {
                    var ka = angle(kid);
                    var from = point(r, ka), to = point(radius(kid), ka);
                    line('M' + fmt(from[0]) + ',' + fmt(from[1]) + 'L' + fmt(to[0]) + ',' + fmt(to[1]), t + 0.25, kid.group);
                    if (kid.leaf) {
                        var pr = photoRadius * SIZE[kid.i % SIZE.length];
                        var el = items[kid.i].photo;
                        el.style.left = fmt(to[0] - pr) + 'px';
                        el.style.top = fmt(to[1] - pr) + 'px';
                        el.style.width = el.style.height = fmt(2 * pr) + 'px';
                        el.style.setProperty('--d', (t + 0.8).toFixed(2) + 's');
                    } else {
                        walk(kid, depth + 1);
                    }
                });
            }
            walk(topo, 0);
        }

        // ---- The caption under the tree ----
        function fillNote(d) {
            document.getElementById('hn-kicker').textContent = d.kicker;
            document.getElementById('hn-title').textContent = d.title;
            document.getElementById('hn-desc').textContent = d.desc;
            var a = document.getElementById('hn-link');
            if (!d.link) { a.hidden = true; return; }
            a.hidden = false;
            a.href = d.link;
            if (/^https?:\/\//.test(d.link)) { a.target = '_blank'; a.rel = 'noopener'; }
            else { a.removeAttribute('target'); a.removeAttribute('rel'); }
        }
        var noteTimer;
        function focusTo(i) {
            if (i === focus || !items[i]) return;
            items[focus].photo.classList.remove('is-focus');
            focus = i;
            items[i].photo.classList.add('is-focus');
            clearTimeout(noteTimer);
            note.classList.add('is-out');
            noteTimer = setTimeout(function () { fillNote(items[i].data); note.classList.remove('is-out'); }, reduceMotion ? 0 : 220);
        }

        // ---- Replace one photo (never the focused one) with a fresh one from the same branch ----
        function swapOne() {
            if (items.length < 2) return;
            var k;
            do { k = Math.floor(Math.random() * items.length); } while (k === focus);
            var current = items[k], shown = items.map(function (it) { return it.data.src; });
            var options = pool.filter(function (p) { return p.group === current.data.group && shown.indexOf(p.src) < 0; });
            if (!options.length) return;
            var other = options.filter(function (p) { return p.sub !== current.data.sub; });
            var next = shuffle(other.length ? other : options)[0];
            var preload = new Image();
            preload.onload = function () {
                current.inner.classList.add('is-swap');
                setTimeout(function () {
                    current.data = next;
                    current.button.setAttribute('aria-label', describe(next));
                    setImage(current.img, next.src);
                    current.inner.classList.remove('is-swap');
                }, 420);
            };
            preload.src = next.src;
        }

        // ---- Slow turn. Photos counter-rotate through the same variable so faces stay upright ----
        var last = 0, frame = 0;
        function tick(now) {
            if (last && !held) {
                rotation = (rotation + (now - last) / 1000 * 1.1) % 360;
                stage.style.setProperty('--ht-rot', rotation.toFixed(2) + 'deg');
            }
            last = now;
            frame = requestAnimationFrame(tick);
        }
        function start() { if (!frame && !reduceMotion) { last = 0; frame = requestAnimationFrame(tick); } }
        function stop() { if (frame) { cancelAnimationFrame(frame); frame = 0; } }

        render();
        requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('is-in'); }); });

        [stage, note].forEach(function (el) {
            el.addEventListener('mouseenter', function () { held = true; });
            el.addEventListener('mouseleave', function () { held = false; });
        });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) start(); else stop();
            }).observe(stage.parentNode);
        } else {
            start();
        }
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stop(); else if (visible) start();
        });

        if (!reduceMotion) {
            setInterval(function () {
                if (held || document.hidden || !visible) return;
                focusTo((focus + 1) % items.length);
                setTimeout(swapOne, 3000);
            }, 6500);
        }

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (count() !== items.length) { render(); stage.classList.add('is-in'); } else { draw(); }
            }, 150);
        });
    }

    initCounters();
    initTree();
})();
