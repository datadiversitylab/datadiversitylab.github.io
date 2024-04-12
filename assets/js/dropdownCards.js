var dropdowns = document.querySelectorAll("#dropdown-cards .cs-flex-group");

dropdowns.forEach(function(dropdown) {
    dropdown.addEventListener("click", function(e) {
        if (dropdown.classList.contains("is-active")) {
            dropdown.querySelector(".cs-dropdown-icon img").src = "../assets/icons/chevron-down.svg";
            dropdown.classList.remove("is-active");
            return;
        }

        dropdowns.forEach(function(dropdown) {
            dropdown.querySelector(".cs-dropdown-icon img").src = "../assets/icons/chevron-down.svg";
            dropdown.classList.remove("is-active");
        });

        dropdown.querySelector(".cs-dropdown-icon img").src = "../assets/icons/chevron-up.svg";
        dropdown.classList.toggle("is-active");
    });
});

if (document.querySelector(".first-news")) {
    document.querySelector(".first-news .cs-flex-group").classList.add("is-active");
}

