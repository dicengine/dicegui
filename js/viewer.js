// initialize panzooms
$("#panzoomLeft").panzoom({
    $zoomIn: $(".zoom-in-left"),
    $zoomOut: $(".zoom-out-left"),
    $zoomRange: $(".zoom-range-left"),
    $reset: $(".reset-left"),
    which: 3,
    minScale: 0.05,
    cursor: "pointer"
});
$("#panzoomRight").panzoom({
    $zoomIn: $(".zoom-in-right"),
    $zoomOut: $(".zoom-out-right"),
    $zoomRange: $(".zoom-range-right"),
    $reset: $(".reset-right"),
    which: 3,
    minScale: 0.05,
    cursor: "pointer"
});

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { clientX: _x, clientY: _y };
}

function zoomToFitLeft(){
    $("#panzoomLeft").panzoom("resetDimensions");
    var windowHeight = $("#viewWindowLeft").outerHeight();
    var imageHeight = refImageHeightLeft;
    var e = getOffset( document.getElementById('viewWindowLeft') );
    if(imageHeight>0){
        var scale = (windowHeight-10) / imageHeight;
        $("#panzoomLeft").panzoom("setMatrix", [ 1, 0, 0, 1, 0, 0 ]);
        $("#panzoomLeft").panzoom("zoom",scale,{focal: e });
    }                              
}

function zoomToFitRight(){
    $("#panzoomRight").panzoom("resetDimensions");
    var windowHeight = $("#viewWindowRight").outerHeight();
    var imageHeight = refImageHeightRight;
    var e = getOffset( document.getElementById('viewWindowRight') );
    if(imageHeight>0){
        var scale = (windowHeight-10) / imageHeight;
        $("#panzoomRight").panzoom("setMatrix", [ 1, 0, 0, 1, 0, 0 ]);
        $("#panzoomRight").panzoom("zoom",scale,{focal: e });
    }                              
}

$("#zoomToFitLeft").click(function(){zoomToFitLeft();});
$("#zoomToFitRight").click(function(){zoomToFitRight();});

// compute the image coordiates of the mouse in the left viewer
$("#panzoomLeft").mousemove(function( event ) {
    var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
    var viewX = event.pageX - $(this).offset().left;
    var viewY = event.pageY - $(this).offset().top;
    var imgX = Math.round(viewX / scale);
    var imgY = Math.round(viewY / scale);
    if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
        $("#leftPos").text("x:" + imgX + " y:" + imgY);
    }
});

// compute the image coordiates of the mouse in the right viewer
$("#panzoomRight").mousemove(function( event ) {
    var scale = $("#panzoomRight").panzoom("getMatrix")[0];
    var viewX = event.pageX - $(this).offset().left;
    var viewY = event.pageY - $(this).offset().top;
    var imgX = Math.round(viewX / scale);
    var imgY = Math.round(viewY / scale);
    if(imgX>=0&&imgX<refImageWidthRight&&imgY>=0&&imgY<refImageHeightRight){
        $("#rightPos").text("x:" + imgX + " y:" + imgY);
    }
});

// zoom on focal point from mousewheel    
$("#panzoomLeft").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomLeft").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});

// zoom on focal point from mousewheel    
$("#panzoomRight").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomRight").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});

function loadRefImage(evt, viewer) {
    var fileTypesOther = ['jpg', 'jpeg', 'png','JPG','PNG'];  //acceptable file types
    var fileTypesTiff = ['tiff','tif','TIFF','TIF'];  //acceptable file types
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    if (FileReader && files && files.length) {
        var fr = new FileReader();
        var extension = files[0].name.split('.').pop().toLowerCase();
        fr.onload = function(e) {
            if (fileTypesTiff.indexOf(extension) > -1) {
                //Using tiff.min.js library - https://github.com/seikichi/tiff.js/tree/master
                $('#consoleWindow').append('parsing reference TIFF image ...<br/>');
                //initialize with 100MB for large files
                Tiff.initialize({
                    TOTAL_MEMORY: 100000000
                });
                var tiff = new Tiff({
                    buffer: e.target.result
                });
                var tiffCanvas = tiff.toCanvas();
                $(tiffCanvas).css({
                    "width": "auto",
                    "max-width": "1500px",
                    "height": "auto",
                    "overflow": "hidden",
                    "display": "block",
                    "padding": "0px",
                    "z-index" : "1",
                    "position" : "absolute",
                    "image-rendering" : "pixelated"
                }).addClass("preview");
                tiffCanvas.getContext("2d").mozImageSmoothingEnabled = false;
                tiffCanvas.getContext("2d").msImageSmoothingEnabled = false;
                tiffCanvas.getContext("2d").imageSmoothingEnabled = false;
                $(viewer).html(tiffCanvas);
                if(viewer=="#panzoomLeft"){
                    refImageWidthLeft = tiff.width();
                    refImageHeightLeft = tiff.height();
                    refImagePathLeft = files[0].path;
                }else{
                    refImageWidthRight = tiff.width();
                    refImageHeightRight = tiff.height();
                    refImagePathRight = files[0].path;
                }
                updateDimsLabels();
            }
            else if(fileTypesOther.indexOf(extension) > -1){
                $('#consoleWindow').append('parsing reference jpg or png image ...<br/>');
                $(viewer).html('<img src="' + files[0].path + '" width="auto" height="auto" style="z-index:1; position: absolute;"/>');                
                function findHHandWW() {
                    var imgHeight = this.height;
                    var imgWidth = this.width;
                    if(viewer=="#panzoomLeft"){
                        refImageWidthLeft = imgWidth;
                        refImageHeightLeft = imgHeight;
                        refImagePathLeft = files[0].path;
                    }else{
                        refImageWidthRight = imgWidth;
                        refImageHeightRight = imgHeight;
                        refImagePathRight = files[0].path;
                    }
                    updateDimsLabels();
                    return true;
                }
                var myImage = new Image();
                myImage.name = files[0].path;
                myImage.onload = findHHandWW;
                myImage.src = files[0].path;
            }
            else{ // load FAILURE
                $('#consoleWindow').append('image load FAILURE: invalid file type, ' + files[0].name + '<br/>');            
            }
        }
        fr.onloadend = function(e) {
            $('#consoleWindow').append('reference image load complete <br/>');
        }
        fr.readAsArrayBuffer(files[0]);
    } 
}

$("#rightRefInput").change(function (evt) {
    loadRefImage(evt,"#panzoomRight");
});

$("#leftRefInput").change(function (evt) {
    loadRefImage(evt,"#panzoomLeft");
});

$("#leftDefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
    files = tgt.files;
    if(files){
        $("#defImageListLeft").text("");
        defImagePathsLeft = [];
        for(var i = 0, l = files.length; i < l; i++) {
            var filePath = files[i].path;
            var fileName = files[i].name;
            $("#defImageListLeft").append(fileName + '</br>');
            defImagePathsLeft.push(filePath);
        }
    }
});

$("#rightDefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
    files = tgt.files;
    if(files){
        $("#defImageListRight").text("");
        defImagePathsLeft = [];
        for(var i = 0, l = files.length; i < l; i++) {
            var filePath = files[i].path;
            var fileName = files[i].name;
            $("#defImageListRight").append(fileName + '</br>');
            defImagePathsRight.push(filePath);
        }
    }
});

function updateDimsLabels (){
    $("#leftDims").text("w:" + refImageWidthLeft  + " h:" + refImageHeightLeft);
    $("#rightDims").text("w:" + refImageWidthRight  + " h:" + refImageHeightRight);
}
