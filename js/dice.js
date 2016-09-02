document.getElementById("runLi").onclick = function() {callDICeExec()};

function callDICeExec() {

    var child_process = require('child_process');
    var readline      = require('readline');
    var proc          = child_process.spawn('/Users/dzturne/code/KDICe/build_global/bin/dice', ['--version']);
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        console.log(line);
        $('#consoleWindow').append(line + '<br/>');
    });

    proc.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
    
    proc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        // move the scroll on the console to the bottom
        var objDiv = document.getElementById("consoleWindow");
        objDiv.scrollTop = objDiv.scrollHeight;
    });    
}
