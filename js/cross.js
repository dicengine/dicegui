//const remote2 = require('electron').remote;
const fs = require('fs');
const os = require('os');

// disable the accept button initially
$("#crossAcceptButton").prop("disabled",true);

$("#crossCancelButton").click(function () {
    resetProjection();
    var win = remote.getCurrentWindow();
    win.close();
});

$("#crossAcceptButton").click(function () {
    alert("I was ACCEPTED");
    var window = remote.getCurrentWindow();
    window.close();
});

// initialize panzooms
// for now panzoom is disabled for the cross initializer
//$("#panzoomCross").panzoom({
//    $zoomIn: $(".zoom-in-left"),
//    $zoomOut: $(".zoom-out-left"),
//    $zoomRange: $(".zoom-range-left"),
//    $reset: $(".reset-left"),
//    which: 2,
//    minScale: 0.05,
//    cursor: "pointer"
//});

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
//////////////////////////////////////////////////

var rWidth = 0;
var rHeight = 0;
var lWidth = 0;
var lHeight = 0;
var crossScale = 0;

$(document).ready(function(){
    var fileName = '.dice-bw-info.js';
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            console.log('loading browser window info from ' + fileName);
            $.getScript( fileName )
                .done(function( s, Status ) {
                    console.warn( Status );

                    // assume a parent div size of 1350 x 900 with pad left and bottom of 100px
 
                    // check if the height or width is the limiting dim:
                    rWidth = 1200;
                    rHeight = "auto";
                    crossScale = (1200.0/rightWidth);
                    lWidth = Math.round(crossScale*leftWidth);
                    lHeight = "auto";
                    getFileObject(rightFileName, function (fileObject) {
                        console.log(fileObject);
                        if(rightWidth/rightHeight < 1200.0/800.0){ // height limited
                            rWidth = "auto"
                            rHeight = 800;
                            lWidth = "auto";
                            crossScale = (800.0/rightHeight); 
                            lHeight = Math.round(crossScale*leftHeight);
                        }
                        loadImage(fileObject,"#panzoomCrossBottom",rWidth,rHeight,0,false,false,"bottom-image","");
                        getFileObject(leftFileName, function (fileObject) {
                            loadImage(fileObject,"#panzoomCrossTop",lWidth,lHeight,1,false,false,"top-image sepia","topImage");
                        });
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

$("#transparencyInput").on('input',function(){
    $("#transparencyLabel").text($(this).val());
    // update the transparency of the image
    $("#panzoomCrossTop").css("opacity",$(this).val());
});

// global vars:
var projectionStep = 0;

var startX = 0; // start and end are in global coords, not image coords
var startY = 0;
var endX = 0;
var endY = 0;

var leftButtonDown = false;
var firstClick = true;

var origin1X = 0; // all of these coordinates are in global coordinates
var origin1Y = 0; // need to be transformed if used as image coordinates for a transform
var origin2X = 0;
var origin2Y = 0;
var origin3X = 0;
var origin3Y = 0;
var dest1X = 0;
var dest1Y = 0;
var dest2X = 0;
var dest2Y = 0;
var dest3X = 0;
var dest3Y = 0;

// transform scale and translate variables
var t1 = 1; var t2 = 0; var t3 = 0; var t4 = 1; var t5 = 0; var t6 = 0;
// transform with skew variables
var a = 1; var b = 0; var c = 0; var d = 1; var e = 0; var f = 0;

function resetProjection(){
    origin1X = 0;
    origin1Y = 0;
    origin2X = 0;
    origin2Y = 0;
    origin3X = 0;
    origin3Y = 0;
    dest1X = 0;
    dest1Y = 0;
    dest2X = 0;
    dest2Y = 0;
    dest3X = 0;
    dest3Y = 0;
    t1 = 1; t2 = 0; t3 = 0; t4 = 1; t5 = 0; t6 = 0;
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    var trans_str = 'matrix(1,0,0,1,0,0)';
    console.log(trans_str);
    $("#topImage").css({'transform-origin': '0 0'});
    $("#topImage").css({'transform':trans_str});
    firstClick = true;
    projectionStep = 0;
}

$("#crossResetButton").click(function () {
    resetProjection();
    $("#crossAcceptButton").prop("disabled",true);
});
//startX = Math.round((viewX-1) / crossScale);
//startY = Math.round((viewY-1) / crossScale);

$("#panzoomCrossTop").mousedown(function(){
    if(event.button == 0 && projectionStep<=2){
        startX = event.pageX - $(this).offset().left;
        startY = event.pageY - $(this).offset().top;
        leftButtonDown = true; // enables the transformation for mousemove
        if(firstClick && projectionStep==0){
            origin1X = startX;
            origin1Y = startY;
            dest1X = startX;
            dest1Y = startY;
            firstClick = false;
        }
        else if(firstClick && projectionStep==1){
            if(Math.abs(startX-origin1X) < 5 && Math.abs(startY-origin1Y) < 5 ){
                alert("Projection control points cannot coincide within 5 pixels.");
            }
            else{
                origin2X = startX;
                origin2Y = startY;
                dest2X = startX;
                dest2Y = startY;
                firstClick = false;
            }
        }
        else if(firstClick && projectionStep==2){
            if((Math.abs(startX-origin1X) < 5 && Math.abs(startY-origin1Y) < 5) ||
               (Math.abs(startX-origin2X) < 5 && Math.abs(startY-origin2Y) < 5)){
                alert("Projection control points cannot coincide within 5 pixels.");
            }
            else{
                origin3X = startX;
                origin3Y = startY;
                dest3X = startX;
                dest3Y = startY;
                firstClick = false;
            }
        }
        console.log("startX " + startX + " startY " + startY + " endX " + endX + " endY " + endY);
    }
});        
$("#panzoomCrossTop").on('mouseup mouseleave',function(){
    // add point to shapeon left click
    if(event.button == 0 && projectionStep <= 2){
        leftButtonDown = false;
        endX = event.pageX - $(this).offset().left;
        endY = event.pageY - $(this).offset().top;
        if(projectionStep==0){ // translation only
            dest1X += endX - startX;
            dest1Y += endY - startY;
        }
        else if(projectionStep==1){ // translation and scale
            dest2X += endX - startX;
            dest2Y += endY - startY;
        }
        else if(projectionStep==2){ // translation, scale and skew
            dest3X += endX - startX;
            dest3Y += endY - startY;
        }
        console.log("o1X " + origin1X + " o1Y " + origin1Y + " d1X " + dest1X + " d1Y " + dest1Y);
    }
});        
$("#panzoomCrossTop").mousemove(function(){
    // add point to shapeon left click
    var trans_str = "";
    if(event.button == 0 && leftButtonDown && projectionStep <= 2){
        var X = event.pageX - $(this).offset().left;
        var Y = event.pageY - $(this).offset().top;
        console.log('X ' + X + ' Y ' + Y);
        //endX = Math.round((viewX-1) / crossScale);
        //endY = Math.round((viewY-1) / crossScale);
        if(projectionStep==0){ // translation only
            t1=1.0;t2=0;t3=0;t4=1; // no scale or skew
            t5 = (dest1X - origin1X) + (X - startX);
            t6 = (dest1Y - origin1Y) + (Y - startY);
            trans_str = 'matrix('+t1+','+t2+','+t3+','+t4+','+t5+','+t6+')';
            console.log(trans_str);
            $("#topImage").css({'transform':trans_str});
        }
        else if(projectionStep==1){ // translation and scale
            // the scales in x and y have to be calculated
            var old_dx = origin2X - dest1X;
            var old_dy = origin2Y - dest1Y;
            var new_dx = dest2X + (X - startX) - dest1X;
            var new_dy = dest2Y + (Y - startY) - dest1Y;
            console.log('origin2x ' + origin2X + ' origin 1X ' + origin1X + ' old_dx ' + old_dx + ' new dx ' + new_dx)
            //var new_dx = dest2X - dest1X;
            //var new_dy = dest2Y - dest1Y;
            if(old_dx != 0.0 && old_dy !=0.0){
                if( new_dx / old_dx > 0.0 &&  new_dy / old_dy > 0.0){
                    t5 = (dest1X - origin1X); // translation stays the same
                    t6 = (dest1Y - origin1Y);
                    t1 = new_dx / old_dx;
                    t4 = new_dy / old_dy;
                    t2=0;t3=0; // no skew
                    var origin = origin1X + 'px ' + origin1Y + 'px';
                    $("#topImage").css({'transform-origin': origin});
                    trans_str = 'matrix('+t1+','+t2+','+t3+','+t4+','+t5+','+t6+')';
                    console.log(trans_str);
                    $("#topImage").css({'transform':trans_str});
                }
            }
        }
        else if(projectionStep==2){ // translation, scale and skew
            // solve for the parameters using a direct solve:
            var x1 = origin1X;
            var x1p = dest1X;
            var y1 = origin1Y;
            var y1p = dest1Y;
            var x2 = origin2X - t5; // unoffset to get original coord
            var x2p = dest2X;
            var y2 = origin2Y - t6; // unoffset to get original coord
            var y2p = dest2Y;
            var x3 = (origin3X - dest1X)/t1 + dest1X - t5; // unscale and unoffset to get original coord
            var x3p = dest3X + (X - startX);
            var y3 = (origin3Y - dest1Y)/t4 + dest1Y - t6; // unscale and unoffset to get original coord
            var y3p = dest3Y + (Y - startY);
            console.log("x1 " + x1 + " y1 " + y1 + " x2 " + x2 + " y2 " + y2 + " x3 " + x3 + " y3 " + y3);
            c = (x1p - x3p - (x1*(x1p - x2p))/(x1 - x2) + (x3*(x1p - x2p))/(x1 - x2))/(y1 - y3 - (x1*(y1 - y2))/(x1 - x2) + (x3*(y1 - y2))/(x1 - x2));
            d = (y1p - y3p - (x1*(y1p - y2p))/(x1 - x2) + (x3*(y1p - y2p))/(x1 - x2))/(y1 - y3 - (x1*(y1 - y2))/(x1 - x2) + (x3*(y1 - y2))/(x1 - x2));
            a = -(x2p - x1p + c*(y1 - y2))/(x1 - x2);
            b = -(y2p - y1p + d*(y1 - y2))/(x1 - x2);
            e = x1p - c*y1 + (x1*(x2p - x1p + c*(y1 - y2)))/(x1 - x2);
            f = y1p - d*y1 + (x1*(y2p - y1p + d*(y1 - y2)))/(x1 - x2);
            $("#topImage").css({'transform-origin': '0px 0px'});
            trans_str = 'matrix('+a+','+b+','+c+','+d+','+e+','+f+')';
            console.log(trans_str);
            if(a>0.0 && d > 0.0){
                $("#topImage").css({'transform':trans_str});
            }
        }
    }
});        

$(document).keypress(function(e) {
    if(e.which == 13) {
        projectionStep+=1;
        firstClick = true;
        if(projectionStep>2){
            $("#crossAcceptButton").prop("disabled",false);
        }
    }
});
