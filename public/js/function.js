function toogleDarkMode() {
    // html, body, input, textarea, select, button
    var elements = []
    Array.prototype.forEach.call(document.getElementsByTagName("html"), (elem) => {elements.push(elem)})
    Array.prototype.forEach.call(document.getElementsByTagName("body"), (elem) => {elements.push(elem)})
    Array.prototype.forEach.call(document.getElementsByTagName("input"), (elem) => {elements.push(elem)})
    Array.prototype.forEach.call(document.getElementsByTagName("textarea"), (elem) => {elements.push(elem)})
    Array.prototype.forEach.call(document.getElementsByTagName("select"), (elem) => {elements.push(elem)})
    Array.prototype.forEach.call(document.getElementsByTagName("button"), (elem) => {elements.push(elem)})
    elements.push(document.getElementById("back_button"))
    elements.push(document.getElementById("logout_button"))
    elements.forEach((ele) => { 
            ele.classList.toggle("dark-mode")
    })
}

document.getElementById("darkmode_button").addEventListener("click", (elem) => {
    if (elem.target.classList[0] == "dark") {
        elem.target.classList.remove("dark")
        elem.target.classList.add("light")
    }else{
        elem.target.classList.add("dark")
        elem.target.classList.remove("light")
    }
    toogleDarkMode()
})