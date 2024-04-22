document.addEventListener('scroll', (e) => {
    const scroll = document.documentElement.scrollTop;
    if (scroll >= 50) {
        document.querySelector('body').classList.add('scroll')
    } else {
        document.querySelector('body').classList.remove('scroll')
    }
});

// add classes for mobile navigation toggling
var CSbody = document.querySelector("body");
const CSnavbarMenu = document.querySelector("#cs-navigation");
const CShamburgerMenu = document.querySelector("#cs-navigation .cs-toggle");

CShamburgerMenu.addEventListener('click', function () {
    CShamburgerMenu.classList.toggle("cs-active");
    CSnavbarMenu.classList.toggle("cs-active");
    CSbody.classList.toggle("cs-open");
    // run the function to check the aria-expanded value
    ariaExpanded();
});

// checks the value of aria expanded on the cs-ul and changes it accordingly whether it is expanded or not
function ariaExpanded() {
    const csUL = document.querySelector('#cs-expanded');
    const csExpanded = csUL.getAttribute('aria-expanded');

    if (csExpanded === 'false') {
        csUL.setAttribute('aria-expanded', 'true');
    } else {
        csUL.setAttribute('aria-expanded', 'false');
    }
}

// mobile nav toggle code
const dropDowns = Array.from(document.querySelectorAll('#cs-navigation .cs-dropdown'));
for (const item of dropDowns) {
    const onClick = () => {
        item.classList.toggle('cs-active')
    }
    item.addEventListener('click', onClick)
}

const img = document.querySelectorAll('picture.cs-picture img');
img.forEach((img) => {
    if (img.src === window.location.href) { // Check if src is equal to the current URL
        img.parentElement.querySelectorAll('source').forEach((source) => {
            source.srcset = '../assets/images/placeholder-image.png';
        });
        img.src = '../assets/images/placeholder-image.png';
    }

    img.onerror = function () {
        // this.parentElement.querySelector('source').srcset = '../assets/images/placeholder-image.png';
        this.parentElement.querySelectorAll('source').forEach((source) => {
            source.srcset = '../assets/images/placeholder-image.png';
        });
        this.onerror = null;
        this.src = '../assets/images/placeholder-image.png';
    };
});

const captionSliders = document.querySelectorAll(".cs-picture-caption");

captionSliders.forEach((slider) => {
    const leftArrow = slider.querySelector(".cs-arrow-left");
    const rightArrow = slider.querySelector(".cs-arrow-right");
    const images = Array.from(slider.querySelectorAll("picture > img, picture > source"));
    const captions = Array.from(slider.querySelectorAll(".cs-text-caption"));
    const selectors = Array.from(slider.querySelectorAll(".cs-image-selector"));
    let currentIndex = 0;
    let timer = null;

    function updateContent() {
        const newSrcset = captions[currentIndex].dataset.srcset;
        const newCaption = captions[currentIndex].innerHTML;

        images.forEach((img) => {
            // Update srcset for lazy-loaded images
            if (img.tagName === 'SOURCE') {
                img.srcset = newSrcset; // Update only if the tag is <source>
            } else {
                img.src = newSrcset; // Update <img> src if necessary
            }
        });

        captions.forEach((caption, index) => {
            caption.style.display = index === currentIndex ? "block" : "none";
            if (index === currentIndex) {
                caption.innerHTML = newCaption;
            }
        });

        selectors.forEach((selector, index) => {
            selector.classList.toggle("active", index === currentIndex);
        });
    }

    function resetTimer() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            moveRight();
        }, 10000);
    }

    function moveRight() {
        if (currentIndex === selectors.length - 1) {
            currentIndex = 0;
        } else {
            currentIndex++;
        }
        updateContent();
        if (slider.classList.contains("timer-slider")) {
            resetTimer();
        }
    }

    if (leftArrow && rightArrow) {
        leftArrow.addEventListener("click", () => {
            if (currentIndex === 0) {
                currentIndex = selectors.length - 1;
            } else {
                currentIndex--;
            }
            updateContent();
            if (slider.classList.contains("timer-slider")) {
                resetTimer();
            }
        });

        rightArrow.addEventListener("click", () => {
            moveRight();
            if (slider.classList.contains("timer-slider")) {
                resetTimer();
            }
        });
    }

    // Apply event listeners for direct selection
    selectors.forEach((selector, index) => {
        selector.addEventListener("click", () => {
            currentIndex = index;
            updateContent();
            if (slider.classList.contains("timer-slider")) {
                resetTimer();
            }
        });
    });

    // Initialize the timer only if 'timer-slider' class is present
    if (slider.classList.contains("timer-slider")) {
        resetTimer();
    }
});

// JS for read more button with conditional display based on parent's height
const itemsReadMore = document.querySelectorAll(".cs-item .cs-desc");
if (itemsReadMore.length > 0 && itemsReadMore[0].querySelector(".read-more-btn") !== null) {
    itemsReadMore.forEach((desc) => {
        const readMoreBtn = desc.querySelector(".read-more-btn");
        const readMoreText = desc.querySelector(".read-more-text");
        if (readMoreText.offsetHeight > 162) {
            // If parent's height is over 162, show the button and add functionality
            readMoreBtn.style.display = "block"; // Ensure the button is visible
            readMoreBtn.addEventListener("click", (e) => {
                const itemChosen = e.target.parentElement;
                itemChosen.classList.toggle("show-more");
                if (itemChosen.classList.contains("show-more")) {
                    readMoreBtn.innerText = "...read less";
                } else {
                    readMoreBtn.innerText = "...read more";
                }
            });
        } else {
            // If parent's height is not over 144px, hide the button
            readMoreBtn.style.display = "none";
        }
    });
}