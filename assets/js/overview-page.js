// Overview page: photo carousel and the Read more buttons.
(function () {
    'use strict';

    // ---------- Read more ----------
    document.addEventListener('click', function (event) {
        var button = event.target.closest('.ov-more');
        if (!button) { return; }
        var card = button.closest('.ov-card');
        var full = card.querySelector('.ov-full');
        var short = card.querySelector('.ov-short');
        var open = full.hidden;
        full.hidden = !open;
        short.hidden = open;
        button.textContent = open ? 'Show less' : 'Read more';
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // ---------- Carousel ----------
    var car = document.getElementById('ov-car');
    if (!car) { return; }

    var slides = Array.prototype.slice.call(car.querySelectorAll('.ov-slide'));
    var count = slides.length;
    var dotsBox = document.getElementById('ov-dots');
    var capTitle = document.getElementById('ov-cap-title');
    var capText = document.getElementById('ov-cap-text');
    var at = 0;
    var dots = [];

    function wrap(i) { return (i + count) % count; }

    function show(i) {
        at = wrap(i);
        slides.forEach(function (s, k) {
            s.classList.toggle('is-active', k === at);
            s.classList.toggle('is-prev', count > 2 && k === wrap(at - 1));
            s.classList.toggle('is-next', count > 1 && k === wrap(at + 1));
            // Load the photos next to this one
            if (k === at || k === wrap(at - 1) || k === wrap(at + 1)) {
                var img = s.querySelector('img');
                img.loading = 'eager';
            }
        });
        dots.forEach(function (d, k) {
            d.classList.toggle('is-on', k === at);
            d.setAttribute('aria-current', k === at ? 'true' : 'false');
        });
        capTitle.textContent = slides[at].getAttribute('data-title');
        capText.textContent = slides[at].getAttribute('data-caption');
        capText.hidden = !capText.textContent;
    }

    if (count > 1) {
        slides.forEach(function (s, k) {
            var d = document.createElement('button');
            d.type = 'button';
            d.setAttribute('aria-label', 'Show photo ' + (k + 1));
            d.addEventListener('click', function () { show(k); });
            dotsBox.appendChild(d);
            dots.push(d);
        });
        car.querySelector('.ov-prev').addEventListener('click', function () { show(at - 1); });
        car.querySelector('.ov-next').addEventListener('click', function () { show(at + 1); });
        slides.forEach(function (s, k) {
            s.addEventListener('click', function () { if (!s.classList.contains('is-active')) { show(k); } });
        });
        car.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft') { show(at - 1); }
            if (event.key === 'ArrowRight') { show(at + 1); }
        });

        // Swipe on phones
        var startX = null;
        car.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX; }, { passive: true });
        car.addEventListener('touchend', function (event) {
            if (startX === null) { return; }
            var dx = event.changedTouches[0].clientX - startX;
            startX = null;
            if (Math.abs(dx) > 40) { show(dx < 0 ? at + 1 : at - 1); }
        }, { passive: true });
    }

    car.classList.add('is-ready');
    show(0);
})();

// Menu on the left of Our work: marks the section you are reading.
(function () {
    'use strict';
    var menu = document.getElementById('ow-side');
    if (!menu || !('IntersectionObserver' in window)) { return; }
    var links = [].slice.call(menu.querySelectorAll('a[data-spy]'));
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('data-spy')); });
    var seen = {};

    function mark() {
        var current = null;
        targets.forEach(function (el, i) { if (el && seen[el.id]) { current = i; } });
        links.forEach(function (a, i) { a.classList.toggle('is-on', i === current); });
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
        mark();
    }, { rootMargin: '-15% 0px -70% 0px' });
    targets.forEach(function (el) { if (el) { io.observe(el); } });
})();
