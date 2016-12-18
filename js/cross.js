//const remote2 = require('electron').remote;
const fs = require('fs');

$("#crossCancelButton").click(function () {
    var win = remote.getCurrentWindow();
    win.close();
});

$("#crossAcceptButton").click(function () {
    alert("I was ACCEPTED");
    var window = remote.getCurrentWindow();
    window.close();
});

// initialize panzooms
$("#panzoomCross").panzoom({
    $zoomIn: $(".zoom-in-left"),
    $zoomOut: $(".zoom-out-left"),
    $zoomRange: $(".zoom-range-left"),
    $reset: $(".reset-left"),
    which: 2,
    minScale: 0.05,
    cursor: "pointer"
});

$(document).ready(function(){ /*code here*/
    //var refImagePathRightBW = "not set"
    var fileName = '.dice-bw-info.js';
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            console.log('loading browser window info from ' + fileName);
            $.getScript( fileName )
                .done(function( s, Status ) {
                    console.warn( Status );
                    alert("I am here and value is " + rightFileName)

                    var getFileBlob = function (url, cb) {
                        var xhr = new XMLHttpRequest();
                        xhr.open("GET", url);
                        xhr.responseType = "blob";
                        xhr.addEventListener('load', function() {
                            cb(xhr.response);
                        });
                        xhr.send();
                    };

                    var blobToFile = function (blob, name) {
                        blob.lastModifiedDate = new Date();
                        blob.name = name.split('/').pop();
                        blob.path = name;
                        return blob;
                    };

                    var getFileObject = function(filePathOrUrl, cb) {
                        getFileBlob(filePathOrUrl, function (blob) {
                            // TODO fix for windows too
                            cb(blobToFile(blob, filePathOrUrl));
                        });
                    };

                    getFileObject(rightFileName, function (fileObject) {
                        console.log(fileObject);
                        loadImage(fileObject,"#panzoomCross",1200,"auto",0,false,false);
                        //$('#crossViewWindow').height("100%");
                    });
                })
                .fail(function( jqxhr, settings, exception ) {
                    console.warn( "Something went wrong"+exception );
                });
        } else if(err.code == 'ENOENT') {
            // file does not exist
            console.log('browser window info file does not exist');
        } else {
            console.log('error occurred trying to load browser window info');
        }
    });
})
