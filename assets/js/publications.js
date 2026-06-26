const searchInput = document.getElementById('search');
const piOnlyCheckbox = document.getElementById('piOnlyCheckbox');

// Adjust selector to specifically target keyword and journal type filters
const keywordFilterOptions = document.querySelectorAll('.cs-filter-keywords-wrapper .filter-option');
const journalTypeFilterOptions = document.querySelectorAll('.cs-filter-journal-type-wrapper .filter-option');
const outputTypeFilterOptions = document.querySelectorAll('.cs-filter-output-wrapper .filter-option');
const researchAreaFilterOptions = document.querySelectorAll('.cs-filter-areas-wrapper .filter-option');
const filterOptions = document.querySelectorAll('.filter-option');
const startYearInput = document.getElementById('startYear');
const endYearInput = document.getElementById('endYear');
const cards = document.querySelectorAll('.cs-item');
const orderByButton = document.querySelector('.order-by-button');
let selectedKeywords = new Set();
let selectedJournalTypes = new Set();
let selectedOutputTypes = new Set();
let selectedResearchAreas = new Set();
let isAscending = false;

function applyFiltersAndOrder() {
    let visibleKeywords = new Set();
    let visibleJournalTypes = new Set();
    let visibleOutputTypes = new Set();
    let visibleResearchAreas = new Set();

    const searchText = searchInput.value.toLowerCase();
    const startYear = parseInt(startYearInput.value, 10) || -Infinity;
    const endYear = parseInt(endYearInput.value, 10) || Infinity;
    const filterByAuthor = piOnlyCheckbox.checked;

    cards.forEach(card => {
        const titleElement = card.querySelector('.cs-name');
        const authorElement = card.querySelector('.cs-publication-author');
        const publicationYearElement = card.querySelector('.cs-publication-year');
        const publicationMonthElement = card.querySelector('.cs-publication-month');
        const publicationTypeElement = card.querySelector('.cs-publication-type');
        const outputTypeElement = card.querySelector('.cs-output-type');

        const title = titleElement ? titleElement.textContent.toLowerCase() : '';
        const author = authorElement ? authorElement.textContent.toLowerCase() : '';
        const publicationType = publicationTypeElement ? publicationTypeElement.textContent.toLowerCase() : '';
        const outputType = outputTypeElement ? outputTypeElement.textContent.toLowerCase() : '';
        const cardKeywords = Array.from(card.querySelectorAll('.cs-item-filters .cs-filter')).map(el => el.textContent.toLowerCase());
        const cardAreas = Array.from(card.querySelectorAll('.cs-item-areas .cs-filter')).map(el => el.textContent.toLowerCase());

        const matchesSearch = title.includes(searchText) || author.includes(searchText);
        const matchesPublicationType = selectedJournalTypes.size === 0 || selectedJournalTypes.has(publicationType);
        const matchesKeywords = selectedKeywords.size === 0 || cardKeywords.some(keyword => selectedKeywords.has(keyword));
        const matchesOutputType = selectedOutputTypes.size === 0 || selectedOutputTypes.has(outputType);
        const matchesResearchAreas = selectedResearchAreas.size === 0 || cardAreas.some(area => selectedResearchAreas.has(area));
        const matchesAuthor = !filterByAuthor || author.includes("cristian román-palacios");

        const publicationYear = publicationYearElement ? parseInt(publicationYearElement.textContent, 10) : null;
        const publicationMonth = publicationMonthElement ? publicationMonthElement.textContent : "Dec"; // Treat missing month as December (latest)
        const matchesYear = publicationYear ? publicationYear >= startYear && publicationYear <= endYear : true;

        if (matchesSearch && matchesYear && matchesPublicationType && matchesKeywords && matchesOutputType && matchesResearchAreas && matchesAuthor) {
            card.style.display = '';
            visibleKeywords = new Set([...visibleKeywords, ...cardKeywords]);
            visibleResearchAreas = new Set([...visibleResearchAreas, ...cardAreas]);
            if (publicationType) visibleJournalTypes.add(publicationType);
            if (outputType) visibleOutputTypes.add(outputType);
        } else {
            card.style.display = 'none';
        }
    });

    updateFilterOptionVisibility(keywordFilterOptions, visibleKeywords);
    updateFilterOptionVisibility(journalTypeFilterOptions, visibleJournalTypes);
    updateFilterOptionVisibility(outputTypeFilterOptions, visibleOutputTypes);
    updateFilterOptionVisibility(researchAreaFilterOptions, visibleResearchAreas);
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
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    displayedCards.sort((a, b) => {
        const yearA = parseInt(a.querySelector('.cs-publication-year').textContent, 10);
        const yearB = parseInt(b.querySelector('.cs-publication-year').textContent, 10);
        const monthA = months.indexOf(a.querySelector('.cs-publication-month') ? a.querySelector('.cs-publication-month').textContent : "Dec");
        const monthB = months.indexOf(b.querySelector('.cs-publication-month') ? b.querySelector('.cs-publication-month').textContent : "Dec");

        if (yearA !== yearB) {
            return isAscending ? yearA - yearB : yearB - yearA;
        } else {
            return isAscending ? monthA - monthB : monthB - monthA;
        }
    });

    const parent = cards[0].parentNode;
    displayedCards.forEach(card => parent.appendChild(card));
}

// Maps each filter group to its wrapper selector and its selected-set
const filterGroups = [
    { wrapper: '.cs-filter-keywords-wrapper', set: () => selectedKeywords },
    { wrapper: '.cs-filter-journal-type-wrapper', set: () => selectedJournalTypes },
    { wrapper: '.cs-filter-output-wrapper', set: () => selectedOutputTypes },
    { wrapper: '.cs-filter-areas-wrapper', set: () => selectedResearchAreas }
];

function groupForOption(optionElement) {
    return filterGroups.find(g => optionElement.closest(g.wrapper)) || null;
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

// Correctly adding the search input event listener to apply filters on input
searchInput.addEventListener('input', applyFiltersAndOrder);
[startYearInput, endYearInput].forEach(input => input.addEventListener('input', applyFiltersAndOrder));

filterOptions.forEach(option => option.addEventListener('click', function(event) {
    const filter = event.target.getAttribute('data-filter').toLowerCase();
    const group = groupForOption(event.target);

    updateFilterSets(filter, group, event.target);
    applyFiltersAndOrder();
}));

orderByButton.addEventListener('click', function() {
    isAscending = !isAscending; // Toggle sort order
    orderByButton.textContent = isAscending ? "Ascending" : "Descending"; // Update the button text
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

piOnlyCheckbox.addEventListener('change', applyFiltersAndOrder);

// Initial check and setup based on screen size
applyDisplayLogicBasedOnScreenSize();

updateAllFilterActivation();
applyFiltersAndOrder();
// Reapply logic on window resize to accommodate dynamic changes
window.addEventListener('resize', applyDisplayLogicBasedOnScreenSize);

// et al
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".cs-publication-author").forEach(authorElement => {
        const fullAuthors = authorElement.getAttribute("data-full-authors") || "";
        const authorList = fullAuthors.split(',').map(author => author.trim());

        // Ensure we only modify if there are more than 3 authors
        if (authorList.length > 3) {
            authorElement.innerHTML = `${authorList[0]} et al.`;
            authorElement.classList.add("has-tooltip");

            // Create tooltip on hover
            authorElement.addEventListener("mouseover", function(event) {
                let tooltip = document.querySelector("#author-tooltip");
                if (!tooltip) {
                    tooltip = document.createElement("div");
                    tooltip.id = "author-tooltip";
                    tooltip.className = "author-tooltip";
                    document.body.appendChild(tooltip);
                }
                tooltip.innerHTML = authorList.join("<br>"); // Display all authors
                tooltip.style.display = "block";
                tooltip.style.left = `${event.pageX + 10}px`;
                tooltip.style.top = `${event.pageY + 10}px`;
            });

            // Hide tooltip when mouse leaves
            authorElement.addEventListener("mouseout", function() {
                document.querySelector("#author-tooltip").style.display = "none";
            });
        }
    });
});