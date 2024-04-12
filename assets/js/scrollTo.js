var body = document.body,
    html = document.documentElement;

var pageFullHeight = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );

const btns = document.querySelectorAll(".cs-filter-wrapper a");
btns.forEach(btn => {
    btn.addEventListener("click", function() {
        const contentId = this.getAttribute('href').substring(1); // Get the id of the content element
        const content = document.getElementById(contentId); // Get the content element
        const contentPosition = content.offsetTop; // Get the top position of the content element
        const headerHeight = document.querySelector("header").getBoundingClientRect().height;
        // console.log(window.innerHeight, headerHeight, contentPosition, pageFullHeight)
        if (pageFullHeight - window.innerHeight + headerHeight < contentPosition) {
            // Add a border
            content.classList.add('out-of-reach');
    
            // Remove the border after 0.5 seconds
            setTimeout(() => {
                content.classList.remove('out-of-reach');
            }, 500);
        } 
    });
});

function scrollToActivate() {
    let activeButton = null;
    for (const btn of btns) {
        const contentId = btn.getAttribute('href').substring(1); // Get the id of the content element
        const content = document.getElementById(contentId); // Get the content element
        const contentPosition = content.getBoundingClientRect().top; // Get the top position of the contenat element
        if (contentPosition >= 0 && contentPosition <= window.innerHeight) {
            activeButton = btn;
            break; // Exit the loop after the first button is found
        }
    }

    if (activeButton) {
        for (const btn of btns) {
            if (btn !== activeButton) {
                btn.classList.remove('active');
            }
        }
        activeButton.classList.add('active');
    }
}

window.addEventListener('scroll', function() {
    scrollToActivate();
});

scrollToActivate()