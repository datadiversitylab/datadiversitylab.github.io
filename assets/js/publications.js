const searchInput = document.getElementById('search');
// Adjust selector to specifically target keyword and journal type filters
const keywordFilterOptions = document.querySelectorAll('.cs-filter-keywords-wrapper .filter-option');
const journalTypeFilterOptions = document.querySelectorAll('.cs-filter-journal-type-wrapper .filter-option');
const filterOptions = document.querySelectorAll('.filter-option');
const startYearInput = document.getElementById('startYear');
const endYearInput = document.getElementById('endYear');
const cards = document.querySelectorAll('.cs-item');
const orderByButton = document.querySelector('.order-by-button');
let selectedKeywords = new Set();
let selectedJournalTypes = new Set();
let isAscending = false;

function applyFiltersAndOrder() {
    let visibleKeywords = new Set();
    let visibleJournalTypes = new Set();

    const searchText = searchInput.value.toLowerCase();
    const startYear = parseInt(startYearInput.value, 10) || -Infinity;
    const endYear = parseInt(endYearInput.value, 10) || Infinity;

    cards.forEach(card => {
        const titleElement = card.querySelector('.cs-name');
        const authorElement = card.querySelector('.cs-publication-author');
        const publicationYearElement = card.querySelector('.cs-publication-year');
        const publicationTypeElement = card.querySelector('.cs-publication-type');

        const title = titleElement ? titleElement.textContent.toLowerCase() : '';
        const author = authorElement ? authorElement.textContent.toLowerCase() : '';
        const publicationType = publicationTypeElement ? publicationTypeElement.textContent.toLowerCase() : '';
        const cardKeywords = Array.from(card.querySelectorAll('.cs-item-filters .cs-filter')).map(el => el.textContent.toLowerCase());

        const matchesSearch = title.includes(searchText) || author.includes(searchText);
        const matchesPublicationType = selectedJournalTypes.size === 0 || selectedJournalTypes.has(publicationType);
        const matchesKeywords = selectedKeywords.size === 0 || cardKeywords.some(keyword => selectedKeywords.has(keyword));

        const publicationYear = publicationYearElement ? parseInt(publicationYearElement.textContent, 10) : null;
        const matchesYear = publicationYear ? publicationYear >= startYear && publicationYear <= endYear : true;

        if (matchesSearch && matchesYear && matchesPublicationType && matchesKeywords) {
            card.style.display = '';
            visibleKeywords = new Set([...visibleKeywords, ...cardKeywords]);
            if (publicationType) visibleJournalTypes.add(publicationType);
        } else {
            card.style.display = 'none';
        }
    });

    updateFilterOptionVisibility(keywordFilterOptions, visibleKeywords);
    updateFilterOptionVisibility(journalTypeFilterOptions, visibleJournalTypes);
    sortDisplayedCards();
}

function updateFilterOptionVisibility(filterOptions, visibleItems) {
    filterOptions.forEach(option => {
        const filterValue = option.getAttribute('data-filter').toLowerCase();
        if (filterValue === 'all' || visibleItems.has(filterValue)) {
            option.style.display = ''; // Show matching filter option
        } else {
            option.style.display = 'none'; // Hide non-matching filter option
        }
    });
}

function sortDisplayedCards() {
    const displayedCards = Array.from(cards).filter(card => card.style.display !== 'none');

    displayedCards.sort((a, b) => {
        const yearA = parseInt(a.querySelector('.cs-publication-year').textContent, 10);
        const yearB = parseInt(b.querySelector('.cs-publication-year').textContent, 10);
        return isAscending ? yearA - yearB : yearB - yearA;
    });

    // Reattach sorted cards to the DOM
    const parent = cards[0].parentNode;
    displayedCards.forEach(card => parent.appendChild(card));
}

function updateFilterSets(filter, isKeyword, optionElement) {
    // Deselect all other options in the section if 'all' is selected
    if (filter === 'all') {
        if (isKeyword) {
            selectedKeywords.clear();
            document.querySelectorAll('.cs-filter-keywords-wrapper .filter-option').forEach(el => el.classList.remove('active'));
        } else {
            selectedJournalTypes.clear();
            document.querySelectorAll('.cs-filter-journal-type-wrapper .filter-option').forEach(el => el.classList.remove('active'));
        }
        optionElement.classList.add('active'); // Ensure 'All' is marked active
    } else {
        if (isKeyword) {
            // Toggle the current keyword selection and ensure 'All' is inactive
            selectedKeywords.has(filter) ? selectedKeywords.delete(filter) : selectedKeywords.add(filter);
            document.querySelector('.cs-filter-keywords-wrapper .filter-option[data-filter="all"]').classList.remove('active');
        } else {
            // Toggle the current journal type selection and ensure 'All' is inactive
            selectedJournalTypes.has(filter) ? selectedJournalTypes.delete(filter) : selectedJournalTypes.add(filter);
            document.querySelector('.cs-filter-journal-type-wrapper .filter-option[data-filter="all"]').classList.remove('active');
        }
        optionElement.classList.toggle('active');
    }
    updateAllFilterActivation();
}

function updateAllFilterActivation() {
    const allJournalTypeFilter = document.querySelector('.cs-filter-journal-type-wrapper .filter-option[data-filter="all"]');
    const allKeywordsFilter = document.querySelector('.cs-filter-keywords-wrapper .filter-option[data-filter="all"]');

    if (selectedJournalTypes.size === 0) {
        allJournalTypeFilter.classList.add('active');
    } else {
        allJournalTypeFilter.classList.remove('active');
    }

    if (selectedKeywords.size === 0) {
        allKeywordsFilter.classList.add('active');
    } else {
        allKeywordsFilter.classList.remove('active');
    }
}

// Correctly adding the search input event listener to apply filters on input
searchInput.addEventListener('input', applyFiltersAndOrder);
[startYearInput, endYearInput].forEach(input => input.addEventListener('input', applyFiltersAndOrder));

filterOptions.forEach(option => option.addEventListener('click', function(event) {
    const filter = event.target.getAttribute('data-filter').toLowerCase();
    const isKeyword = event.target.closest('.cs-filter-keywords-wrapper') !== null;
    const isJournalType = !isKeyword; // Assuming any non-keyword filter is a journal type

    updateFilterSets(filter, isKeyword, event.target);
    applyFiltersAndOrder();
}));

orderByButton.addEventListener('click', function() {
    isAscending = !isAscending; // Toggle sort order

    // Toggle the img src based on isAscending
    orderByButton.src = isAscending ? "../assets/icons/order-asc.svg" : "../assets/icons/order-desc.svg";

    applyFiltersAndOrder(); // Reapply filters and order
});

const wrapper = document.querySelector('.cs-filter-button-wrapper');
const filterButton = document.querySelector('.cs-add-filter-wrapper');
const filterButtonImage = filterButton.querySelector('img'); // Assuming there is an img element

// Function to apply display logic based on screen size
function applyDisplayLogicBasedOnScreenSize() {
    // Assuming 1rem = 16px, 64rem = 1024px
    if (window.matchMedia('(min-width: 1024px)').matches) {
        // Screen size is bigger than 64rem
        filterButton.style.display = 'none'; // Hide the filterButton
        Array.from(wrapper.children).forEach(child => {
            if (child !== filterButton) {
                child.style.display = 'flex'; // Show other elements
            }
        });
    } else {
        // Screen size is less than or equal to 64rem
        filterButton.style.display = 'flex'; // Show the filterButton
        // Optionally reset other elements to their default state if needed
    }
}

// Event listener for the filterButton click
filterButton.addEventListener('click', function() {
    let isAnyChildVisible = Array.from(wrapper.children).some(child =>
        child.style.display === 'flex' && child !== filterButton
    );

    Array.from(wrapper.children).forEach(function(child) {
        if (child !== filterButton) {
            child.style.display = isAnyChildVisible ? 'none' : 'flex';
        }
    });

    if (isAnyChildVisible) {
        filterButtonImage.src = '../assets/icons/plus.svg';
    } else {
        filterButtonImage.src = '../assets/icons/remove.svg';
    }
});

// Initial check and setup based on screen size
applyDisplayLogicBasedOnScreenSize();

updateAllFilterActivation();
applyFiltersAndOrder();
// Reapply logic on window resize to accommodate dynamic changes
window.addEventListener('resize', applyDisplayLogicBasedOnScreenSize);