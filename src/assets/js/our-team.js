document.addEventListener('DOMContentLoaded', function () {

    const filters = document.querySelectorAll('.cs-filter-wrapper div');
    const items = document.querySelectorAll('.cs-item');
    const allFilter = document.querySelector('.cs-filter-wrapper div[data-filter="All"]');
    const startYearInput = document.getElementById('startYear');
    const endYearInput = document.getElementById('endYear');

    const DEFAULT_FILTERS = ['PhD student', 'PI', 'Postdoc', 'Staff', 'Undergraduate student'];

    // Initialise default active filters on page load
    filters.forEach(filter => {
        const value = filter.getAttribute('data-filter');
        if (DEFAULT_FILTERS.includes(value)) {
            filter.classList.add('active');
        }
    });

    // Remove 'active' from 'All' since we're using specific defaults
    allFilter.classList.remove('active');

    updateItemsVisibility();

    filters.forEach(filter => {
        filter.addEventListener('click', function () {
            const filterValue = this.getAttribute('data-filter');
            handleFilterSelection(filterValue, this);
        });
    });

    function handleFilterSelection(filterValue, selectedFilter) {
        if (filterValue === 'All') {
            filters.forEach(filter => {
                if (filter !== selectedFilter) {
                    filter.classList.remove('active');
                }
            });
        } else {
            allFilter.classList.remove('active');
        }

        selectedFilter.classList.toggle('active');
        updateItemsVisibility();
    }

    function getItemYear(item) {
        const el = item.querySelector('.cs-start-date-year-data');
        if (!el) return NaN;
        const match = el.textContent.match(/\d{4}/);
        return match ? parseInt(match[0], 10) : NaN;
    }

    function updateItemsVisibility() {
        const activeFilters = Array.from(document.querySelectorAll('.cs-filter-wrapper div.active'))
            .map(active => active.getAttribute('data-filter'));

        const startYearRaw = startYearInput.value.trim();
        const endYearRaw = endYearInput.value.trim();
        const startYear = startYearRaw !== '' ? parseInt(startYearRaw, 10) : null;
        const endYear = endYearRaw !== '' ? parseInt(endYearRaw, 10) : null;
        const hasYearFilter = startYear !== null || endYear !== null;

        items.forEach(item => {
            // Year check
            let yearMatch = true;
            if (hasYearFilter) {
                const itemYear = getItemYear(item);
                if (startYear !== null && itemYear < startYear) yearMatch = false;
                if (endYear !== null && itemYear > endYear) yearMatch = false;
            }

            // Type check
            const itemFilters = Array.from(item.querySelectorAll('.cs-item-filters div'))
                .map(div => div.textContent.trim());
            const isHonorary = itemFilters.includes('Honorary');

            let typeMatch = false;
            if (isHonorary) {
                // Honorary members always show regardless of active filters
                typeMatch = true;
            } else if (activeFilters.includes('All')) {
                typeMatch = true;
            } else if (activeFilters.length > 0) {
                typeMatch = activeFilters.some(filter => itemFilters.includes(filter));
            }

            item.style.display = (typeMatch && yearMatch) ? '' : 'none';
        });
    }

    startYearInput.addEventListener('input', updateItemsVisibility);
    endYearInput.addEventListener('input', updateItemsVisibility);

    // Affiliations tooltip: show the full list on hover when there are several
    document.querySelectorAll('.cs-affiliations').forEach(function (el) {
        let list = [];
        try {
            list = JSON.parse(el.getAttribute('data-full-affiliations') || '[]');
        } catch (e) {
            return;
        }
        if (!Array.isArray(list) || list.length < 2) return; // nothing to expand

        el.classList.add('has-tooltip');

        function buildHtml() {
            return list.map(function (a) {
                const name = (a && a.name) ? a.name : '';
                if (a && a.url) {
                    return '<a href="' + a.url + '" target="_blank" rel="noopener noreferrer">' + name + '</a>';
                }
                return name;
            }).join('<br>');
        }

        function place(tooltip, event) {
            tooltip.style.left = (event.pageX + 12) + 'px';
            tooltip.style.top = (event.pageY + 12) + 'px';
        }

        let hideTimer;
        function scheduleHide() {
            hideTimer = setTimeout(function () {
                const tooltip = document.querySelector('#affiliations-tooltip');
                if (tooltip) tooltip.style.display = 'none';
            }, 250);
        }
        function cancelHide() {
            if (hideTimer) clearTimeout(hideTimer);
        }

        el.addEventListener('mouseover', function (event) {
            cancelHide();
            let tooltip = document.querySelector('#affiliations-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'affiliations-tooltip';
                tooltip.className = 'author-tooltip';
                document.body.appendChild(tooltip);
                tooltip.addEventListener('mouseover', cancelHide);
                tooltip.addEventListener('mouseout', scheduleHide);
            }
            tooltip.innerHTML = buildHtml();
            tooltip.style.display = 'block';
            tooltip.style.pointerEvents = 'auto';
            place(tooltip, event);
        });

        el.addEventListener('mousemove', function (event) {
            const tooltip = document.querySelector('#affiliations-tooltip');
            if (tooltip && tooltip.style.display === 'block') place(tooltip, event);
        });

        el.addEventListener('mouseout', scheduleHide);
    });

    // Read more. The button only shows when the bio is cut off by the card.
    // We measure the bio text alone, so the button itself can't change the result.
    const bios = [];

    document.querySelectorAll('#meet-team-547 .cs-desc').forEach(function (desc) {
        const btn = desc.querySelector('.read-more-btn');
        const text = desc.querySelector('.read-more-text') || desc;
        if (!btn) return;

        desc.style.display = 'block';

        // The button sits just below the bio, outside the clipped area, so it is always visible.
        desc.insertAdjacentElement('afterend', btn);
        btn.style.position = 'static';
        btn.style.alignSelf = 'flex-start';
        btn.style.margin = '0.25rem 0 0';
        btn.style.cursor = 'pointer';

        // Collapsed: use the CSS max-height if there is one, otherwise three lines.
        // Expanded: inline styles win over the stylesheet, so the card always opens.
        function collapse() {
            desc.style.removeProperty('max-height');
            desc.style.overflow = 'hidden';
            if (!isFinite(parseFloat(getComputedStyle(desc).maxHeight))) {
                const lineHeight = parseFloat(getComputedStyle(text).lineHeight) ||
                    parseFloat(getComputedStyle(text).fontSize) * 1.5;
                desc.style.maxHeight = (lineHeight * 3) + 'px';
            }
        }

        function expand() {
            desc.style.setProperty('max-height', 'none', 'important');
            desc.style.setProperty('overflow', 'visible', 'important');
        }

        function checkOverflow() {
            if (desc.classList.contains('show-more')) return;
            // Cards hidden by a filter have no size yet. We measure them when they appear.
            if (desc.getClientRects().length === 0) return;
            collapse();
            const needed = text.getBoundingClientRect().height;
            btn.style.display = needed > desc.clientHeight + 2 ? 'inline-block' : 'none';
        }

        bios.push(checkOverflow);
        checkOverflow();

        if (window.ResizeObserver) {
            new ResizeObserver(checkOverflow).observe(desc);
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const open = desc.classList.toggle('show-more');
            btn.textContent = open ? ' show less' : '...read more';
            if (open) {
                expand();
            } else {
                checkOverflow();
            }
        });
    });

    function checkAllBios() {
        bios.forEach(function (check) { check(); });
    }

    // Fonts and images can change the text height after the first check
    window.addEventListener('load', checkAllBios);
    window.addEventListener('resize', checkAllBios);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkAllBios);
    document.querySelectorAll('.cs-filter-wrapper div').forEach(function (f) {
        f.addEventListener('click', function () { setTimeout(checkAllBios, 0); });
    });
    startYearInput.addEventListener('input', checkAllBios);
    endYearInput.addEventListener('input', checkAllBios);

});
