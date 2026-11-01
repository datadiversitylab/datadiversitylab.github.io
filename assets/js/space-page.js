// Space and tech page: photo viewer for the cards that have photos.
(function () {
    'use strict';

    var view = document.getElementById('st-view');
    if (!view) { return; }

    var big = document.getElementById('st-big');
    var title = document.getElementById('st-vtitle');
    var count = document.getElementById('st-vcount');
    var closeBtn = document.getElementById('st-x');
    var name = '';
    var sources = [];
    var at = 0;
    var opener = null;

    function show() {
        big.src = sources[at];
        big.alt = name + ', photo ' + (at + 1) + ' of ' + sources.length;
        count.textContent = sources.length > 1 ? (at + 1) + ' of ' + sources.length : '';
        view.classList.toggle('is-one', sources.length < 2);
        // Load the next photo while this one is on screen
        if (sources.length > 1) { new Image().src = sources[(at + 1) % sources.length]; }
    }

    function step(by) {
        if (sources.length < 2) { return; }
        at = (at + by + sources.length) % sources.length;
        show();
    }

    function open(card) {
        sources = Array.prototype.map.call(card.querySelectorAll('.st-photos li'), function (li) { return li.getAttribute('data-src'); });
        if (!sources.length) { return; }
        name = card.querySelector('.st-name').textContent.trim();
        title.textContent = name;
        at = 0;
        opener = document.activeElement;
        view.hidden = false;
        document.body.style.overflow = 'hidden';
        show();
        closeBtn.focus();
    }

    function close() {
        view.hidden = true;
        big.removeAttribute('src');
        document.body.style.overflow = '';
        if (opener && opener.focus) { opener.focus(); }
    }

    document.addEventListener('click', function (event) {
        var button = event.target.closest('.st-open');
        if (button) { open(button.closest('.st-card')); }
    });
    closeBtn.addEventListener('click', close);
    document.getElementById('st-prev').addEventListener('click', function () { step(-1); });
    document.getElementById('st-next').addEventListener('click', function () { step(1); });
    view.addEventListener('click', function (event) {
        if (event.target === view || (event.target.closest('.st-stage') && event.target.tagName !== 'IMG')) { close(); }
    });
    document.addEventListener('keydown', function (event) {
        if (view.hidden) { return; }
        if (event.key === 'Escape') { close(); }
        if (event.key === 'ArrowLeft') { step(-1); }
        if (event.key === 'ArrowRight') { step(1); }
    });

    // Swipe on phones
    var startX = null;
    view.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX; }, { passive: true });
    view.addEventListener('touchend', function (event) {
        if (startX === null) { return; }
        var dx = event.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 50) { step(dx < 0 ? 1 : -1); }
    }, { passive: true });
})();
