const filters = document.querySelectorAll('.cs-filter-wrapper div');
const items = document.querySelectorAll('.cs-item');
const allFilter = document.querySelector('.cs-filter-wrapper div[data-filter="All"]');
const startYearInput = document.getElementById('startYear');
const endYearInput = document.getElementById('endYear');

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

function updateItemsVisibility() {
    let activeFilters = Array.from(document.querySelectorAll('.cs-filter-wrapper div.active')).map(active => active.getAttribute('data-filter'));

    // Fetch values from year inputs and convert them to numbers
    const startYear = parseInt(startYearInput.value, 10) || -Infinity;
    const endYear = parseInt(endYearInput.value, 10) || Infinity;;

    // Check if there are no active filters and select 'All' if so
    if (activeFilters.length === 0) {
        allFilter.classList.add('active');
        activeFilters = ['All'];
    }

    if (activeFilters.includes('All')) {
        items.forEach(item => {
            const itemYear = parseInt(item.querySelector('.cs-start-date-year-data').textContent, 10);
            if (!isNaN(startYear) && !isNaN(endYear) && (itemYear < startYear || itemYear > endYear)) {
                item.style.display = 'none';
            } else {
                item.style.display = '';
            }
        });
    } else {
        items.forEach(item => {
            const itemFilters = Array.from(item.querySelectorAll('.cs-item-filters div')).map(div => div.textContent.trim());
            const isFilterMatch = activeFilters.some(filter => itemFilters.includes(filter));
            const itemYear = parseInt(item.querySelector('.cs-start-date-year-data').textContent, 10) || startYear;
            const isYearMatch = !isNaN(startYear) && !isNaN(endYear) && itemYear >= startYear && itemYear <= endYear;

            if (isFilterMatch && (!isNaN(startYear) && !isNaN(endYear) ? isYearMatch : true)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

startYearInput.addEventListener('input', updateItemsVisibility);
endYearInput.addEventListener('input', updateItemsVisibility);