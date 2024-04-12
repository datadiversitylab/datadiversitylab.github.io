var button = document.querySelector('.cs-button-link');
var container = document.querySelector('#dropdown-cards'); // Replace '#specific-container' with the ID of your container

button.addEventListener('click', function(event) {
    event.preventDefault();
    container.classList.toggle('show-all');
    if (container.classList.contains('show-all')) {
        button.textContent = 'View less';
    } else {
        button.textContent = 'View all';
    }
});