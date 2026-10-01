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

    // Read more — cs-desc is a <span> so we force block, then measure
    document.querySelectorAll('#meet-team-547 .cs-desc').forEach(function (desc) {
        const btn = desc.querySelector('.read-more-btn');
        if (!btn) return;

        desc.style.display = 'block';

        function checkOverflow() {
            if (desc.classList.contains('show-more')) return;
            desc.style.maxHeight = 'none';
            const full = desc.scrollHeight;
            desc.style.maxHeight = '';
            const clamped = parseFloat(getComputedStyle(desc).maxHeight);
            btn.style.display = (!isNaN(clamped) && full > clamped + 4) ? 'inline' : 'none';
        }

        checkOverflow();
        window.addEventListener('load', checkOverflow);

        if (window.ResizeObserver) {
            new ResizeObserver(checkOverflow).observe(desc);
        }

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            desc.classList.toggle('show-more');
            btn.textContent = desc.classList.contains('show-more') ? ' show less' : '...read more';
        });
    });


});
