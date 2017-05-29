//const remote2 = require('electron').remote;
//const fs = require('fs');
//const os = require('os');

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

var ipcRenderer = require('electron').ipcRenderer;
ipcRenderer.on('workingDir',function(workingDir){
    alert("I was recieved: " + workingDir);
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
    var previewFileName = localStorage.getItem("workingDirectory");
    if(os.platform()=='win32'){
        previewFileName += '\\right_projected_to_left_color.tif';
    }else{
        previewFileName += '/right_projected_to_left_color.tif';
    }                      
    getFileObject(previewFileName, function (fileObject) {
        loadImage(fileObject,"#panzoomCross","auto","auto",1,false,false,"","",false);
    });
})
