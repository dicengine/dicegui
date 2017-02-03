//const remote2 = require('electron').remote;
const fs = require('fs');
const os = require('os');

$("#previewCloseButton").click(function () {
    var win = remote.getCurrentWindow();
    win.close();
});

// initialize panzooms
$("#panzoomCross").panzoom({
    which: 2,
    minScale: 0.05,
    cursor: "pointer"
});
// zoom on focal point from mousewheel
$("#panzoomCross").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomCross").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});

///////////////////////////////////////////////////
// these three transform a string into a file object
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
    if(os.platform()=='win32'){
        blob.name = name.split('\\').pop();
    }else{
        blob.name = name.split('/').pop();
    }
    blob.path = name;
    return blob;
};
var getFileObject = function(filePathOrUrl, cb) {
    getFileBlob(filePathOrUrl, function (blob) {
        cb(blobToFile(blob, filePathOrUrl));
    });
};
//////////////////////////////////////////////////////

$(document).ready(function(){
    var fileName = '.dice-preview-info.js';
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            console.log('loading browser window info from ' + fileName);
            $.getScript( fileName )
                .done(function( s, Status ) {
                    console.warn( Status );
                    //previewWidth = leftWidth;
                    //previewHeight = leftHeight;
                    //console.log('preview width ' + rWidth + ' preview height ' + rHeight)
                    getFileObject(previewFileName, function (fileObject) {
                        loadImage(fileObject,"#panzoomCross","auto","auto",1,false,false,"","");
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
