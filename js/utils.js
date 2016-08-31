document.getElementById("clearConsoleIcon").onclick = function() {eraseText("consoleWindow")};

function eraseText(object_id) {
    document.getElementById(object_id).innerHTML = "Console output:" + '<br/><br/>';
}
