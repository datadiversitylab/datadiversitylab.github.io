// Senate page: the contents list follows the section on screen.
(function () {
    'use strict';

    var list = document.getElementById('fs-toc');
    if (!list || !('IntersectionObserver' in window)) { return; }

    var links = Array.prototype.slice.call(list.querySelectorAll('a'));
    var blocks = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);

    function mark(id) {
        links.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + id); });
    }

    // The block nearest the top of the screen is the current one
    var seen = {};
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { seen[e.target.id] = e.isIntersecting; });
        for (var i = 0; i < blocks.length; i++) {
            if (seen[blocks[i].id]) { mark(blocks[i].id); return; }
        }
    }, { rootMargin: '-15% 0px -65% 0px' });

    blocks.forEach(function (b) { observer.observe(b); });
    if (blocks.length) { mark(blocks[0].id); }
})();
