console.log("Growth Operator Loaded 🚀");

const form = document.querySelector("form");
const results = document.getElementById("results");

form.addEventListener("submit", function (event) {

    event.preventDefault();

    form.style.display = "none";

    results.style.display = "block";

});