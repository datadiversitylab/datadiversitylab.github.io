var dropdowns = document.querySelectorAll("#dropdown-cards .cs-flex-group");
    
dropdowns.forEach(function(dropdown) {
    dropdown.addEventListener("click", function(e) {
        if (dropdown.classList.contains("is-active")) {
            dropdown.querySelector(".cs-dropdown-icon img").src = "../assets/icons/plus.svg";
            dropdown.classList.remove("is-active");
            return;
        }

        dropdowns.forEach(function(dropdown) {
            dropdown.querySelector(".cs-dropdown-icon img").src = "../assets/icons/plus.svg";
            dropdown.classList.remove("is-active");
        });

        dropdown.querySelector(".cs-dropdown-icon img").src = "../assets/icons/remove.svg";
        dropdown.classList.toggle("is-active");
    });
});