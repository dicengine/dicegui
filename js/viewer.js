// initialize panzooms
$("#panzoomLeft").panzoom({
    $zoomIn: $(".zoom-in-left"),
    $zoomOut: $(".zoom-out-left"),
    $zoomRange: $(".zoom-range-left"),
    $reset: $(".reset-left"),
    which: 2,
    minScale: 0.05,
    cursor: "pointer"
});
$("#panzoomRight").panzoom({
    $zoomIn: $(".zoom-in-right"),
    $zoomOut: $(".zoom-out-right"),
    $zoomRange: $(".zoom-range-right"),
    $reset: $(".reset-right"),
    which: 2,
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

function loadImage(file, viewer,vwidth,vheight,zIndex,addBorder,updateROIs) {
    var fileTypesOther = ['jpg', 'jpeg', 'png','JPG','PNG'];  //acceptable file types
    var fileTypesTiff = ['tiff','tif','TIFF','TIF'];  //acceptable file types
    //var tgt = evt.target || window.event.srcElement,
    //    files = tgt.files;

    if (FileReader && file){   
        var fr = new FileReader();
        var extension = file.name.split('.').pop().toLowerCase();
        fr.onload = function(e) {
            if (fileTypesTiff.indexOf(extension) > -1) {
                //Using tiff.min.js library - https://github.com/seikichi/tiff.js/tree/master
                consoleMsg('parsing TIFF image ' + file.path + ' ...');
                //initialize with 100MB for large files
                Tiff.initialize({
                    TOTAL_MEMORY: 1000000000
                });
                var tiff = new Tiff({
                    buffer: e.target.result
                });
                var tiffCanvas = tiff.toCanvas();
                $(tiffCanvas).css({
                    "width": vwidth,
                    "max-width": "1500px",
                    "height": vheight,
                    "overflow": "hidden",
                    "display": "block",
                    "padding": "0px",
                    "z-index" : zIndex,
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
                    refImagePathLeft = file.path;
                    updateDimsLabels();
                    checkValidInput();
                }else if(viewer=="#panzoomRight"){
                    refImageWidthRight = tiff.width();
                    refImageHeightRight = tiff.height();
                    refImagePathRight = file.path;
                    updateDimsLabels();
                    checkValidInput();
                }
                if(addBorder){
                    $(tiffCanvas).css({border: '5px solid #666666'});
                }
            }
            else if(fileTypesOther.indexOf(extension) > -1){
                //alert(file.path);
                consoleMsg('parsing jpg or png image ' + file.path + ' ...');
                if(addBorder){
                    $(viewer).html('<img src="' + file.path + '" width='+vwidth+' height='+vheight+' style="z-index:'+zIndex+'; position: absolute; border: 5px solid #666666"/>');
                }else{
                    $(viewer).html('<img src="' + file.path + '" width='+vwidth+' height='+vheight+' style="z-index:'+zIndex+'; position: absolute;"/>');
                }
                function findHHandWW() {
                    var imgHeight = this.height;
                    var imgWidth = this.width;
                    if(viewer=="#panzoomLeft"){
                        refImageWidthLeft = imgWidth;
                        refImageHeightLeft = imgHeight;
                        refImagePathLeft = file.path;
                        updateDimsLabels();
                        checkValidInput();
                    }else if(viewer=="#panzoomRight"){
                        refImageWidthRight = imgWidth;
                        refImageHeightRight = imgHeight;
                        refImagePathRight = file.path;
                        updateDimsLabels();
                        checkValidInput();
                    }
                    $(viewer).css({width:vwidth,height:vheight})
                    return true;
                }
                var myImage = new Image();
                myImage.name = file.path;
                myImage.onload = findHHandWW;
                myImage.src = file.path;
            }
            else{ // load FAILURE
                consoleMsg('image load FAILURE: invalid file type, ' + file.name);
                return;
            }
        }
        fr.onloadend = function(e) {
            consoleMsg('reference image load complete');
            if(updateROIs){
                // clear the ROIs drawn on the canvas already
                clearROIs();
                clearExcluded();
                // clear the drawn ROIs
                clearDrawnROIs();
                drawDefaultROI();
            }
        }
        fr.readAsArrayBuffer(file);
    }
}

$("#rightRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
      file = tgt.files[0];
    loadImage(file,"#panzoomRight","auto","auto",1,false,false);
});

$("#leftRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
      file = tgt.files[0];
    loadImage(file,"#panzoomLeft","auto","auto",1,false,true);
});

$("#leftDefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
    files = tgt.files;
    if(files){
        $("#defImageListLeft").empty();
        defImagePathsLeft = [];
        for(var i = 0, l = files.length; i < l; i++) {
            var filePath = files[i].path;
            var fileName = files[i].name;                           
            $("#defImageListLeft").append("<li class='defListLi' id='defListLi_"+i+"'>" + fileName + "</li>");
            defImagePathsLeft.push(files[i]);//filePath);
        }
    }
    checkValidInput();
});

function createPreview(index,isLeft,event){
    // create an absolute position div and add it to the body
    div = $("<div />")
    div.attr({id: 'previewDiv', class: 'preview'});
    var topCoord = event.pageY - 100;
    div.css({position: 'absolute', top: topCoord, left: '194px', 'z-index': 3, padding: '5px'});
    divTri = $("<div />")
    divTri.attr({id: 'previewDivTri', class: 'arrow-left'});
    var topCoordTri = event.pageY - 68;
    divTri.css({position: 'absolute', top: topCoordTri, left: '190px'});
    $("#contentDiv").append(divTri);
    $("#contentDiv").append(div);
    if(isLeft){
        loadImage(defImagePathsLeft[index],"#previewDiv","auto","300px",4,true,false);
    }else{
        loadImage(defImagePathsRight[index],"#previewDiv","auto","300px",4,true,false);
    }
}

function removePreview(){
    $("#previewDiv").remove();
    $("#previewDivTri").remove();
}

$("#defImageListLeft").on("mouseover", ".defListLi" ,function(event){
    var index = $(this).index();
    createPreview(index,true,event);
});

$("#defImageListLeft").on("mouseout", ".defListLi",function(){
    removePreview();
});

$("#defImageListRight").on("mouseover", ".defListLi" ,function(event){
    var index = $(this).index();
    createPreview(index,false,event);
});

$("#defImageListRight").on("mouseout", ".defListLi",function(){
    removePreview();
});

$("#rightDefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
    files = tgt.files;
    if(files){
        $("#defImageListRight").empty();
        defImagePathsRight = [];
        for(var i = 0, l = files.length; i < l; i++) {
            var filePath = files[i].path;
            var fileName = files[i].name;
            $("#defImageListRight").append("<li class='defListLi' id='defListLi_"+i+"'>" + fileName + "</li>");
            defImagePathsRight.push(files[i]);//filePath);
        }
    }
    checkValidInput();
});

function updateDimsLabels (){
    $("#leftDims").text("w:" + refImageWidthLeft  + " h:" + refImageHeightLeft);
    $("#rightDims").text("w:" + refImageWidthRight  + " h:" + refImageHeightRight);
}
