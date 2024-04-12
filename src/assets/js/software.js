const filters = document.querySelectorAll('.cs-filter-wrapper div');
const items = document.querySelectorAll('.cs-item');
const allFilter = document.querySelector('.cs-filter-wrapper div[data-filter="All"]');
const h3Elements = document.querySelectorAll('h3'); // Select all h3 elements

filters.forEach(filter => {
    filter.addEventListener('click', function () {
        const filterValue = this.getAttribute('data-filter');
        handleFilterSelection(filterValue, this);
    });
});

function handleFilterSelection(filterValue, selectedFilter) {
    // Remove 'active' class from all filters
    filters.forEach(filter => {
        filter.classList.remove('active');
    });

    // Add 'active' class to the selected filter
    selectedFilter.classList.add('active');

    // Hide h3 elements that do not match the selected filter
    h3Elements.forEach(h3 => {
        const h3Class = h3.className.split(' ').filter(className => className !== 'cs-d-none').pop().toLowerCase().replace(' ', '-');

        if (filterValue.toLowerCase().replace(' ', '-') === 'all') {
            h3.classList.remove('cs-d-none'); // Show all h3 elements
        } else if (h3Class !== filterValue.toLowerCase().replace(' ', '-')) {
            h3.classList.add('cs-d-none'); // Hide the h3 element
        } else {
            h3.classList.remove('cs-d-none'); // Show the h3 element
        }
    });

    updateItemsVisibility();
}

function updateItemsVisibility() {
    const activeFilter = document.querySelector('.cs-filter-wrapper div.active').getAttribute('data-filter');

    if (activeFilter === 'All') {
        items.forEach(item => item.style.display = '');
    } else {
        items.forEach(item => {
            const itemFilters = Array.from(item.querySelectorAll('.cs-item-filters div')).map(div => div.textContent.trim());
            const isMatch = itemFilters.includes(activeFilter);
            item.style.display = isMatch ? '' : 'none';
        });
    }
}