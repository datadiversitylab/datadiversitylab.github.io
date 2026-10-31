// The "View all" toggle only exists inside #dropdown-cards.
// Without this check, the script grabbed the first link on the page and blocked it from opening.
var container = document.querySelector('#dropdown-cards');
var button = container ? container.querySelector('.cs-button-link') : null;

if (button) {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        container.classList.toggle('show-all');
        if (container.classList.contains('show-all')) {
            button.textContent = 'View less';
        } else {
            button.textContent = 'View all';
        }
    });
}
