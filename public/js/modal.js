// Modal input mot de passe
var modal = document.getElementsByClassName("modal")[0];
// Retire la fenêtre modale lorsqu'on clique ailleurs
window.addEventListener("click", (event) => {
    if (event.target == modal) closeModal();
})
window.addEventListener("keydown", (event) => {
    if (event.keyCode == 27) {
        closeModal();
        closeAllOptionsBox()
    }
})

function closeModal() {
    modal.classList.add("hide")
}

function showModal() {
    modal.classList.remove("hide")
}