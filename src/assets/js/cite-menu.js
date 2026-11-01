// Cite menu: any button with data-cite opens a small menu with the citation and BibTeX.
// Put data-citation and data-bibtex on the button. Used on paper pages, the publications list and tool pages.
(function () {
    'use strict';

    var style = document.createElement('style');
    style.textContent = [
        '[data-cite]::after{content:"";display:inline-block;margin-left:.45em;vertical-align:.12em;border:.28em solid transparent;border-top-color:currentColor;border-bottom:0}',
        '.cite-pop{position:fixed;z-index:1000;min-width:12.5rem;padding:.35rem;background:#fff;border:1px solid #c2d6cc;border-radius:12px;box-shadow:0 8px 28px rgba(43,58,50,.2)}',
        '.cite-pop[hidden]{display:none}',
        '.cite-pop button{display:block;width:100%;padding:.55rem .8rem;font:inherit;font-size:.92rem;font-weight:700;text-align:left;color:#2b3a32;background:none;border:0;border-radius:8px;cursor:pointer}',
        '.cite-pop button:hover,.cite-pop button:focus-visible{background:#e7f1ec;outline:none}'
    ].join('');
    document.head.appendChild(style);

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) { return navigator.clipboard.writeText(text); }
        return new Promise(function (resolve, reject) {
            var box = document.createElement('textarea');
            box.value = text;
            box.setAttribute('readonly', '');
            box.style.position = 'fixed';
            box.style.opacity = '0';
            document.body.appendChild(box);
            box.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            document.body.removeChild(box);
            if (ok) { resolve(); } else { reject(new Error('copy failed')); }
        });
    }

    var pop = document.createElement('div');
    pop.className = 'cite-pop';
    pop.setAttribute('role', 'menu');
    pop.hidden = true;
    pop.innerHTML = '<button type="button" role="menuitem" data-do="citation">Copy citation</button>' +
        '<button type="button" role="menuitem" data-do="bibtex">Copy BibTeX</button>' +
        '<button type="button" role="menuitem" data-do="download">Download .bib</button>';
    document.body.appendChild(pop);

    var owner = null;

    function close(refocus) {
        pop.hidden = true;
        if (owner) {
            owner.setAttribute('aria-expanded', 'false');
            if (refocus) { owner.focus(); }
        }
        owner = null;
    }

    function open(button) {
        owner = button;
        button.setAttribute('aria-expanded', 'true');
        pop.hidden = false;
        var r = button.getBoundingClientRect();
        var w = pop.offsetWidth;
        pop.style.top = Math.round(r.bottom + 6) + 'px';
        pop.style.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - w - 8))) + 'px';
        pop.querySelector('button').focus();
    }

    function flash(item, message) {
        var label = item.getAttribute('data-label') || item.textContent;
        item.setAttribute('data-label', label);
        item.textContent = message;
        setTimeout(function () { item.textContent = label; close(true); }, 700);
    }

    function download(bibtex) {
        var key = (bibtex.match(/@\w+\{([^,]+),/) || [])[1] || 'reference';
        var blob = new Blob([bibtex + '\n'], { type: 'application/x-bibtex' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = key + '.bib';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }

    document.addEventListener('click', function (e) {
        var button = e.target.closest('[data-cite]');
        if (button) {
            e.preventDefault();
            if (owner === button) { close(); } else { open(button); }
            return;
        }
        var item = e.target.closest('.cite-pop button');
        if (item && owner) {
            var what = item.getAttribute('data-do');
            var bibtex = owner.getAttribute('data-bibtex') || '';
            var citation = owner.getAttribute('data-citation') || '';
            if (what === 'download') {
                if (bibtex) { download(bibtex); flash(item, 'Downloaded'); } else { flash(item, 'No BibTeX'); }
            } else {
                var text = what === 'bibtex' ? bibtex : citation;
                if (!text) { flash(item, 'Not available'); return; }
                copyText(text).then(function () { flash(item, 'Copied'); }, function () { flash(item, 'Press Ctrl+C'); });
            }
            return;
        }
        if (!pop.hidden) { close(); }
    });

    document.addEventListener('keydown', function (e) {
        if (pop.hidden) { return; }
        if (e.key === 'Escape') { close(true); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            var items = Array.prototype.slice.call(pop.querySelectorAll('button'));
            var i = items.indexOf(document.activeElement);
            items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
        }
    });

    window.addEventListener('scroll', function () { if (!pop.hidden) { close(); } }, { passive: true });
    window.addEventListener('resize', function () { if (!pop.hidden) { close(); } });
})();
