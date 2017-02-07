const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
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
//////////////////////////////////////////////////                                                                                 
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

function loadImage(file, viewer,vwidth,vheight,zIndex,addBorder,updateROIs,addClass,addID) {
    var fileTypesOther = ['jpg', 'jpeg', 'png','JPG','PNG'];  //acceptable file types
    var fileTypesTiff = ['tiff','tif','TIFF','TIF'];  //acceptable file types
    //var tgt = evt.target || window.event.srcElement,
    //    files = tgt.files;
    console.log('loading image: ' + file.name + ' path: ' + file.path);

    if (FileReader && file){   
        var fr = new FileReader();
        var extension = file.name.split('.').pop().toLowerCase();
        fr.onload = function(e) {
            if (fileTypesTiff.indexOf(extension) > -1) {
                //Using tiff.min.js library - https://github.com/seikichi/tiff.js/tree/master
                console.log('parsing TIFF image ' + file.path + ' ...');
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
                    "height": vheight,
                    "overflow": "hidden",
                    "display": "block",
                    "padding": "0px",
                    "z-index" : zIndex,
                    "position" : "absolute",
                    "image-rendering" : "pixelated"
                });
                if(addClass!=""){
                    $(tiffCanvas).addClass(addClass);
                }
                if(addID!=""){
                    $(tiffCanvas).attr('id',addID);
                }
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
                console.log('parsing jpg or png image ' + file.path + ' ...');
                if(addBorder){
                    $(viewer).html('<img src="' + file.path + '" width='+vwidth+' height='+vheight+' style="z-index:'+zIndex+'; position: absolute; border: 5px solid #666666"/>');
                }else{
                    $(viewer).html('<img src="' + file.path + '" width='+vwidth+' height='+vheight+' style="z-index:'+zIndex+'; position: absolute;"/>');
                }
                if(addID!=""){
                    $(viewer).attr('id',addID);
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
                    if(updateROIs){
                        // clear the ROIs drawn on the canvas already
                        clearROIs();
                        clearExcluded();
                        // clear the drawn ROIs
                        clearDrawnROIs();
                        //drawDefaultROI();
                    }
                    return true;
                }
                var myImage = new Image();
                myImage.name = file.path;
                myImage.onload = findHHandWW;
                myImage.src = file.path;
            }
            else{ // load FAILURE
                console.log('image load FAILURE: invalid file type, ' + file.name);
                return;
            }
        }
        fr.onloadend = function(e) {
            console.log('reference image load complete');
            if(updateROIs){
                // clear the ROIs drawn on the canvas already
                clearROIs();
                clearExcluded();
                // clear the drawn ROIs
                clearDrawnROIs();
                //drawDefaultROI();
            }
        }
        fr.readAsArrayBuffer(file);
    }
}

function flagSequenceImages(){
    refImagePathLeft = "sequence";
    refImagePathRight = "sequence";
    defImagePathsLeft = ["sequence"];
    defImagePathsRight = ["sequence"];
}

$("#loadRef").click(function (){
    var fullImageName = concatImageSequenceName(false);
    var fullStereoImageName = concatImageSequenceName(true);
    updateImageSequencePreview();

    fs.stat(fullImageName, function(err, stat) {
        if(err != null) {
            alert("Invalid image file name: " + fullImageName);
            return;
        }
        else{
            if(showStereoPane){
                fs.stat(fullStereoImageName, function(err, stat) {
                    if(err != null) {
                      alert("Invalid stereo image file name: " + fullStereoImageName);
                      return;
                    }
                    getFileObject(fullImageName, function (fileObject) {
                        loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,false,"","");
                    });
                    getFileObject(fullStereoImageName, function (fileObject) {
                    loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","");
                    });
                    flagSequenceImages();
                });
            }
            else{
                 getFileObject(fullImageName, function (fileObject) {
                     loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,false,"","");
                 });
                 flagSequenceImages();
            }
        }
    });
});

$("#leftCineInput").on("click",function () {
    this.value = null;
});
$("#leftCineInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        // if a right cine file is alread loaded ask the user if it should be unloaded to
        // to avoid frame range mismatch
        if(cinePathRight!="undefined"&&cinePathLeft!="undefined"){
            if (confirm('unload right cine file (this is necessary if the frame ranges are different between right and left cine)')){
                cinePathRight = "undefined";
                $("#cineRightPreviewSpan").text("");
                $("#cineStartPreview span").text("");
                $("#cineEndPreview span").text("");
                $("#panzoomRight").html('');
                // create a tiff image of the selected reference frame
                callCineStatExec(file,true);
            }
            else{
            }
        } // end a right cine file exists
        else{
            callCineStatExec(file,true);
        }
    }
});

$("#rightCineInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        // create a tiff image of the selected reference frame
        callCineStatExec(file,false);
    }
});

// reload the left and right cine image if the ref index is changed
$("#cineRefIndex").change(function () {
    // filename left and right
    var refIndex = $("#cineRefIndex").val();
    // check that the ref index is valid
    if(cinePathLeft!="undefined"||cinePathRight!="undefined")
        if(refIndex < Number($("#cineStartPreviewSpan").text()) || refIndex > Number($("#cineEndPreviewSpan").text())){
            alert("invalid reference index");
            return;
        }
    var offsetIndex = Number(refIndex) - cineFirstFrame;
    alert("offset_index " + offsetIndex);
    if(cinePathLeft!="undefined")
        updateCineDisplayImage(cinePathLeft,offsetIndex,true);
    if(cinePathRight!="undefined")
        updateCineDisplayImage(cinePathRight,offsetIndex,false);    
});


$("#rightRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    $("#refImageTextRight span").text(file.name);
    loadImage(file,"#panzoomRight","auto","auto",1,false,false,"","");
});

$("#calInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        $("#calList").empty();
        calPath = file.path;
        $("#calList").append("<li class='calListLi'>" + file.name + "</li>");
        checkValidInput();
    }
});

$("#leftRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    $("#refImageText span").text(file.name);
    loadImage(file,"#panzoomLeft","auto","auto",1,false,true,"","");
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
        loadImage(defImagePathsLeft[index],"#previewDiv","auto","300px",4,true,false,"","");
    }else{
        loadImage(defImagePathsRight[index],"#previewDiv","auto","300px",4,true,false,"","");
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

$("#initCross").click(function () {
    // write a file that has the image names, etc
    var content = 'var rightFileName = "' + refImagePathRight + '"\n';
    content += 'var leftFileName = "' + refImagePathLeft + '"\n';
    content += 'var rightWidth = ' + refImageWidthRight + '\n';
    content += 'var rightHeight = ' + refImageHeightRight + '\n';
    content += 'var leftWidth = ' + refImageWidthLeft + '\n';
    content += 'var leftHeight = ' + refImageHeightLeft + '\n';
    content += 'var workingDirectory = "' + workingDirectory + '"\n';
    fs.writeFile('.dice-bw-info.js', content, function (err) {
        if(err){
            alert("ERROR: an error ocurred creating the .dice-bw-info.js file "+ err.message)
        }
        consoleMsg('.dice-bw-info.js file has been successfully saved');
    }); 
    var win = new BrowserWindow({ width: 1200, height: 1000 });
    win.on('closed', () => {
        win = null
        $("#crossCorrInit").show();
        updateResultsFilesList();
    })
    win.loadURL('file://' + __dirname + '/cross_init.html');
    $("#crossCorrInit").hide();
    //win.webContents.openDevTools()
});

function openPreviewCross() {
    // write a file that has the image names, etc
    var fileName = workingDirectory;
    if(os.platform()=='win32'){
        fileName += '\\right_projected_to_left_color.tif';
    }else{
        fileName += '/right_projected_to_left_color.tif';
    }
    var content = 'var previewFileName = "' + fileName + '"\n';
    fs.writeFile('.dice-preview-info.js', content, function (err) {
        if(err){
            alert("ERROR: an error ocurred creating the .dice-preview-info.js file "+ err.message)
        }
        consoleMsg('.dice-preview-info.js file has been successfully saved');
    }); 
    var win = new BrowserWindow({ width: 1200, height: 1000 });
    win.on('closed', () => {
        win = null
    })
    win.loadURL('file://' + __dirname + '/preview_cross.html');
    //win.webContents.openDevTools()
}


