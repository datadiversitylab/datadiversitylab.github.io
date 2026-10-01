const blogSearchInput = document.getElementById('blog-search');
const blogFilterOptions = document.querySelectorAll('#blog-547 .filter-option');
const blogCards = document.querySelectorAll('#blog-547 .cs-item');

let selectedTopics = new Set();

function applyBlogFilters() {
    const searchText = blogSearchInput ? blogSearchInput.value.toLowerCase() : '';

    blogCards.forEach(function (card) {
        const name   = card.querySelector('.cs-name');
        const author = card.querySelector('.blog-author');
        const title  = name   ? name.textContent.toLowerCase()   : '';
        const auth   = author ? author.textContent.toLowerCase() : '';

        const cardTopics = Array.from(
            card.querySelectorAll('.cs-item-filters .cs-filter')
        ).map(function (el) { return el.textContent.toLowerCase(); });

        const matchesSearch = title.includes(searchText) || auth.includes(searchText);
        const matchesTopic  = selectedTopics.size === 0 ||
            cardTopics.some(function (t) { return selectedTopics.has(t); });

        card.style.display = (matchesSearch && matchesTopic) ? '' : 'none';
    });
}

function updateAllActivation() {
    const allOption = document.querySelector(
        '#blog-547 .cs-filter-topics-wrapper .filter-option[data-filter="all"]'
    );
    if (allOption) {
        allOption.classList.toggle('active', selectedTopics.size === 0);
    }
}

if (blogSearchInput) {
    blogSearchInput.addEventListener('input', applyBlogFilters);
}

blogFilterOptions.forEach(function (option) {
    option.addEventListener('click', function () {
        const filter = option.getAttribute('data-filter').toLowerCase();

        if (filter === 'all') {
            selectedTopics.clear();
            blogFilterOptions.forEach(function (o) { o.classList.remove('active'); });
            option.classList.add('active');
        } else {
            const allOption = document.querySelector(
                '#blog-547 .cs-filter-topics-wrapper .filter-option[data-filter="all"]'
            );
            if (allOption) allOption.classList.remove('active');
            if (selectedTopics.has(filter)) {
                selectedTopics.delete(filter);
                option.classList.remove('active');
            } else {
                selectedTopics.add(filter);
                option.classList.add('active');
            }
        }
        updateAllActivation();
        applyBlogFilters();
    });
});

// Mobile "Add filters" disclosure
const blogWrapper     = document.querySelector('#blog-547 .cs-filter-button-wrapper');
const blogAddFilter   = document.querySelector('#blog-547 .cs-add-filter-wrapper');
const blogAddFilterImg = blogAddFilter ? blogAddFilter.querySelector('img') : null;

function applyBlogDisplayLogic() {
    if (!blogWrapper) return;
    if (window.matchMedia('(min-width: 1024px)').matches) {
        if (blogAddFilter) blogAddFilter.style.display = 'none';
        Array.from(blogWrapper.children).forEach(function (child) {
            if (child !== blogAddFilter) child.style.display = 'flex';
        });
    } else {
        if (blogAddFilter) blogAddFilter.style.display = 'flex';
    }
}

if (blogAddFilter) {
    blogAddFilter.addEventListener('click', function () {
        const anyVisible = Array.from(blogWrapper.children).some(function (child) {
            return child.style.display === 'flex' && child !== blogAddFilter;
        });
        Array.from(blogWrapper.children).forEach(function (child) {
            if (child !== blogAddFilter) {
                child.style.display = anyVisible ? 'none' : 'flex';
            }
        });
        if (blogAddFilterImg) {
            blogAddFilterImg.src = anyVisible
                ? '/assets/icons/plus.svg'
                : '/assets/icons/remove.svg';
        }
    });
}

applyBlogDisplayLogic();
updateAllActivation();
applyBlogFilters();
window.addEventListener('resize', applyBlogDisplayLogic);
