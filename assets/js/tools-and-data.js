const searchInput = document.getElementById('search');
const filterOptions = document.querySelectorAll('.filter-option');
const cards = document.querySelectorAll('.cs-item');

let selectedCategories = new Set();
let selectedKeywords = new Set();

// Each filter group: its sidebar wrapper and the set it feeds
const filterGroups = [
    { wrapper: '.cs-filter-category-wrapper', set: () => selectedCategories, cardSelector: '.cs-item-categories .cs-filter' },
    { wrapper: '.cs-filter-keywords-wrapper', set: () => selectedKeywords, cardSelector: '.cs-item-filters .cs-filter' }
];

function groupForOption(optionElement) {
    return filterGroups.find(g => optionElement.closest(g.wrapper)) || null;
}

function applyFilters() {
    const searchText = searchInput.value.toLowerCase();

    cards.forEach(card => {
        const name = card.querySelector('.cs-name');
        const desc = card.querySelector('.cs-desc');
        const title = name ? name.textContent.toLowerCase() : '';
        const description = desc ? desc.textContent.toLowerCase() : '';

        const cardCategories = Array.from(card.querySelectorAll('.cs-item-categories .cs-filter')).map(el => el.textContent.toLowerCase());
        const cardKeywords = Array.from(card.querySelectorAll('.cs-item-filters .cs-filter')).map(el => el.textContent.toLowerCase());

        const matchesSearch = title.includes(searchText) || description.includes(searchText);
        const matchesCategory = selectedCategories.size === 0 || cardCategories.some(c => selectedCategories.has(c));
        const matchesKeyword = selectedKeywords.size === 0 || cardKeywords.some(k => selectedKeywords.has(k));

        card.style.display = (matchesSearch && matchesCategory && matchesKeyword) ? '' : 'none';
    });
}

function updateFilterSets(filter, group, optionElement) {
    if (!group) return;
    const set = group.set();
    const allOption = document.querySelector(group.wrapper + ' .filter-option[data-filter="all"]');

    if (filter === 'all') {
        set.clear();
        document.querySelectorAll(group.wrapper + ' .filter-option').forEach(el => el.classList.remove('active'));
        optionElement.classList.add('active');
    } else {
        set.has(filter) ? set.delete(filter) : set.add(filter);
        if (allOption) allOption.classList.remove('active');
        optionElement.classList.toggle('active');
    }
    updateAllFilterActivation();
}

function updateAllFilterActivation() {
    filterGroups.forEach(group => {
        const allOption = document.querySelector(group.wrapper + ' .filter-option[data-filter="all"]');
        if (allOption) {
            allOption.classList.toggle('active', group.set().size === 0);
        }
    });
}

searchInput.addEventListener('input', applyFilters);

filterOptions.forEach(option => option.addEventListener('click', function (event) {
    const filter = event.target.getAttribute('data-filter').toLowerCase();
    const group = groupForOption(event.target);
    updateFilterSets(filter, group, event.target);
    applyFilters();
}));

// Mobile "Add filters" disclosure, mirrors the publications page
const wrapper = document.querySelector('.cs-filter-button-wrapper');
const filterButton = document.querySelector('.cs-add-filter-wrapper');
const filterButtonImage = filterButton ? filterButton.querySelector('img') : null;

function applyDisplayLogicBasedOnScreenSize() {
    if (window.matchMedia('(min-width: 1024px)').matches) {
        if (filterButton) filterButton.style.display = 'none';
        Array.from(wrapper.children).forEach(child => {
            if (child !== filterButton) child.style.display = 'flex';
        });
    } else {
        if (filterButton) filterButton.style.display = 'flex';
    }
}

if (filterButton) {
    filterButton.addEventListener('click', function () {
        const anyVisible = Array.from(wrapper.children).some(child =>
            child.style.display === 'flex' && child !== filterButton
        );
        Array.from(wrapper.children).forEach(function (child) {
            if (child !== filterButton) {
                child.style.display = anyVisible ? 'none' : 'flex';
            }
        });
        if (filterButtonImage) {
            filterButtonImage.src = anyVisible ? '../assets/icons/plus.svg' : '../assets/icons/remove.svg';
        }
    });
}

applyDisplayLogicBasedOnScreenSize();
updateAllFilterActivation();
applyFilters();
window.addEventListener('resize', applyDisplayLogicBasedOnScreenSize);
