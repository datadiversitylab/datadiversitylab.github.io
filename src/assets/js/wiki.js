// Lab meetings page: pick a year and a semester from the schedules that exist.
(function () {
    var box = document.querySelector('[data-schedule]');
    if (!box) return;

    var yearSelect = box.querySelector('[data-year-select]');
    var termSelect = box.querySelector('[data-semester-select]');
    var panels = Array.prototype.slice.call(box.querySelectorAll('.schedule-panel'));
    if (!yearSelect || !termSelect || !panels.length) return;

    var ORDER = { Spring: 1, Summer: 2, Fall: 3 };
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    function toDate(iso) {
        var p = iso.split('-');
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    // Show dates as "Wed, Aug 12, 2026" and mark the next meeting in each semester
    panels.forEach(function (panel) {
        panel.key = Number(panel.getAttribute('data-key'));
        panel.last = null;
        var nextFound = false;
        panel.querySelectorAll('tbody tr').forEach(function (row) {
            var iso = row.getAttribute('data-date');
            if (!iso) return;
            var d = toDate(iso);
            if (isNaN(d)) return;
            row.querySelector('time').textContent = d.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
            });
            if (!panel.last || d > panel.last) panel.last = d;
            var skipped = /no (lab )?meeting/i.test(row.textContent);
            if (!nextFound && d >= today && !skipped) {
                nextFound = true;
                row.classList.add('is-next');
                var badge = document.createElement('span');
                badge.className = 'schedule-badge';
                badge.textContent = 'Next';
                row.querySelector('td').appendChild(badge);
            }
        });
    });

    function newestFirst(a, b) { return b.key - a.key; }

    // The semester that is running or coming up. If none, the most recent one.
    function defaultPanel() {
        var fromHash = panels.filter(function (p) { return p.id === location.hash.slice(1); })[0];
        if (fromHash) return fromHash;
        var upcoming = panels.filter(function (p) { return p.last && p.last >= today; })
            .sort(function (a, b) { return a.key - b.key; })[0];
        return upcoming || panels.slice().sort(newestFirst)[0];
    }

    function fillYears() {
        var years = [];
        panels.forEach(function (p) {
            var y = p.getAttribute('data-year');
            if (years.indexOf(y) === -1) years.push(y);
        });
        years.sort(function (a, b) { return b - a; });
        yearSelect.innerHTML = '';
        years.forEach(function (y) {
            var o = document.createElement('option');
            o.value = y;
            o.textContent = y;
            yearSelect.appendChild(o);
        });
    }

    function fillSemesters(year, wanted) {
        var terms = panels.filter(function (p) { return p.getAttribute('data-year') === year; })
            .map(function (p) { return p.getAttribute('data-semester'); })
            .sort(function (a, b) { return (ORDER[a] || 0) - (ORDER[b] || 0); });
        termSelect.innerHTML = '';
        terms.forEach(function (t) {
            var o = document.createElement('option');
            o.value = t;
            o.textContent = t;
            termSelect.appendChild(o);
        });
        termSelect.value = terms.indexOf(wanted) !== -1 ? wanted : terms[terms.length - 1];
    }

    function show(year, term) {
        panels.forEach(function (p) {
            var match = p.getAttribute('data-year') === year && p.getAttribute('data-semester') === term;
            p.hidden = !match;
            if (match && history.replaceState) history.replaceState(null, '', '#' + p.id);
        });
    }

    yearSelect.addEventListener('change', function () {
        fillSemesters(yearSelect.value, termSelect.value);
        show(yearSelect.value, termSelect.value);
    });
    termSelect.addEventListener('change', function () {
        show(yearSelect.value, termSelect.value);
    });

    // Links like /lab-documents/lab-meetings/#2025-spring open that semester
    window.addEventListener('hashchange', function () {
        var target = panels.filter(function (p) { return p.id === location.hash.slice(1); })[0];
        if (!target) return;
        yearSelect.value = target.getAttribute('data-year');
        fillSemesters(yearSelect.value, target.getAttribute('data-semester'));
        show(yearSelect.value, termSelect.value);
    });

    var start = defaultPanel();
    fillYears();
    yearSelect.value = start.getAttribute('data-year');
    fillSemesters(yearSelect.value, start.getAttribute('data-semester'));
    show(yearSelect.value, termSelect.value);
})();
