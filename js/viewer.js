//const remote = require('electron').remote;
//const BrowserWindow = remote.BrowserWindow;
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
$("#panzoomMiddle").panzoom({
    $zoomIn: $(".zoom-in-middle"),
    $zoomOut: $(".zoom-out-middle"),
    $zoomRange: $(".zoom-range-middle"),
    $reset: $(".reset-middle"),
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
    var e = getOffset( document.getElementById('viewWindowLeft') );
    if(refImageHeightLeft > 0 && refImageWidthLeft > 0){
        var scaleH = ($("#viewWindowLeft").outerWidth()-10) / refImageWidthLeft;
        var scaleW = ($("#viewWindowLeft").outerHeight()-10) / refImageHeightLeft;
        var scale = scaleW;
        if(scaleH<scaleW) scale = scaleH;
        $("#panzoomLeft").panzoom("setMatrix", [ 1, 0, 0, 1, 0, 0 ]);
        $("#panzoomLeft").panzoom("zoom",scale,{focal: e });
    }
}

function zoomToFitRight(){
    $("#panzoomRight").panzoom("resetDimensions");
    var e = getOffset( document.getElementById('viewWindowRight') );
    if(refImageHeightRight > 0 && refImageWidthRight > 0){
        var scaleH = ($("#viewWindowRight").outerWidth()-10) / refImageWidthRight;
        var scaleW = ($("#viewWindowRight").outerHeight()-10) / refImageHeightRight;
        var scale = scaleW;
        if(scaleH<scaleW) scale = scaleH;
        $("#panzoomRight").panzoom("setMatrix", [ 1, 0, 0, 1, 0, 0 ]);
        $("#panzoomRight").panzoom("zoom",scale,{focal: e });
    }
}

function zoomToFitMiddle(){
    $("#panzoomMiddle").panzoom("resetDimensions");
    var windowHeight = $("#viewWindowMiddle").outerHeight();
    var imageHeight = refImageHeightMiddle;
    var e = getOffset( document.getElementById('viewWindowMiddle') );
    if(imageHeight>0){
        var scale = (windowHeight-10) / imageHeight;
        $("#panzoomMiddle").panzoom("setMatrix", [ 1, 0, 0, 1, 0, 0 ]);
        $("#panzoomMiddle").panzoom("zoom",scale,{focal: e });
    }
}

$("#zoomToFitLeft").click(function(){zoomToFitLeft();});
$("#zoomToFitRight").click(function(){zoomToFitRight();});
$("#zoomToFitMiddle").click(function(){zoomToFitMiddle();});

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

// compute the image coordiates of the mouse in the right viewer
$("#panzoomMiddle").mousemove(function( event ) {
    var scale = $("#panzoomMiddle").panzoom("getMatrix")[0];
    var viewX = event.pageX - $(this).offset().left;
    var viewY = event.pageY - $(this).offset().top;
    var imgX = Math.round(viewX / scale);
    var imgY = Math.round(viewY / scale);
    if(imgX>=0&&imgX<refImageWidthMiddle&&imgY>=0&&imgY<refImageHeightMiddle){
        $("#middlePos").text("x:" + imgX + " y:" + imgY);
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

// zoom on focal point from mousewheel    
$("#panzoomMiddle").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomMiddle").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});

function deleteDisplayImageFiles(lrm,cb){
    var cbCalled = false;
    cb = cb || $.noop;
    var nameToCheck = '.display_image_';
    if(lrm==0){
        nameToCheck += 'left';
    }else if(lrm==1){
        nameToCheck += 'right';
    }else{
        nameToCheck += 'middle';
    }
    hiddenDir = fullPath('.dice','');
    console.log('removing any existing display image files with name base ' + nameToCheck + ' from ' + hiddenDir);
    fs.readdir(hiddenDir, (err,dir) => {
        // es5
        // count up the number of potential files to delete
        var numExistingFiles = 0;
        if(!dir)return;
        for(var i = 0; i < dir.length; i++) {
            if(dir[i].includes(nameToCheck))
                numExistingFiles++;
        }
        console.log(numExistingFiles + ' display image files exist');
        if(numExistingFiles==0){
            cb();
            return;
        }
        for(var i = 0; i < dir.length; i++) {
            (function(i) {
                var filePath = dir[i];
                if(filePath.includes(nameToCheck)){
                    console.log('attempting to delete file ' + filePath);
                    var fullFilePath = fullPath('.dice',filePath);
                    fs.stat(fullFilePath, function(err, stat) {
                        console.log('stat called on file ' + fullFilePath);
                        if(err == null) {
                            fs.unlink(fullFilePath, (err) => {
                                numExistingFiles--;
                                if (err) throw err;
                                console.log('successfully deleted '+fullFilePath+' '+i);
                                if(numExistingFiles==0) {
                                    cb();
                                }
	                    });
                        }else{
                            // no-op
	                }
                    }); // end stat
                } //end includes
            })(i);
        }
    });
}

function deleteHiddenFiles(find_str,cb){
    var cbCalled = false;
    cb = cb || $.noop;
    hiddenDir = fullPath('.dice','');
    console.log('removing hidden files from ' + hiddenDir);
    fs.readdir(hiddenDir, (err,dir) => {
        // count up the number of potential files to delete
        var numExistingFiles = 0;
        if(!dir)return;
        for(var i = 0; i < dir.length; i++) {
            if(dir[i].includes(find_str))
                numExistingFiles++;
        }
        console.log(numExistingFiles + ' hidden files exist');
        if(numExistingFiles==0){
            cb();
            return;
        }
        for(var i = 0; i < dir.length; i++) {
            (function(i) {
                var filePath = dir[i];
                if(filePath.includes(find_str)){
                    console.log('attempting to delete file ' + filePath);
                    var fullFilePath = fullPath('.dice',filePath);
                    fs.stat(fullFilePath, function(err, stat) {
                        console.log('stat called on file ' + fullFilePath);
                        if(err == null) {
                            fs.unlink(fullFilePath, (err) => {
                                numExistingFiles--;
                                if (err) throw err;
                                console.log('successfully deleted '+fullFilePath+' '+i);
                                if(numExistingFiles==0) {
                                    cb();
                                }
                        });
                        }else{
                            // no-op
                    }
                    }); // end stat
                } //end includes
            })(i);
        }
    });
}

function copyFile(source, target, cb) {
    console.log('copying ' + source + ' to ' + target);
    var cbCalled = false;
    cb = cb || $.noop;
    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function(ex) {
        done();
    });
    rd.pipe(wr);
    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

function loadImage(file,viewer,vwidth,vheight,zIndex,addBorder,updateROIs,addClass,addID,recordPath,callBack) {
    callBack = callBack || $.noop;
    var fileTypesOther = ['jpg', 'jpeg', 'png','JPG','PNG'];  //acceptable file types
    var fileTypesBMP = ['bmp','BMP'];  //acceptable file types
    var fileTypesTiff = ['tiff','tif','TIFF','TIF'];  //acceptable file types
    //var tgt = evt.target || window.event.srcElement,
    //    files = tgt.files;
    console.log('loading image: ' + file.name + ' path: ' + file.path);

    if (FileReader && file){   
        var fr = new FileReader();
        var extension = file.name.split('.').pop().toLowerCase();
        var localFileName = '.display_image_';
        var lrm =   0;
        var copyRequired = false;
        if(viewer=="#panzoomLeft"){
            localFileName += 'left.';
            lrm = 0;
            copyRequired = true;
        }else if(viewer=="#panzoomMiddle"){
            localFileName += 'middle.';
            lrm = 2;
            copyRequired = true;
        }else if(viewer=="#panzoomRight"){
            localFileName += 'right.';
            lrm = 1;
            copyRequired = true;
        }
        localFileName = fullPath('.dice',localFileName);
        localFileName += extension;
        if(!file.name.includes('display_image_')&&copyRequired){
            // copy the image file to the working directory as the display image
            deleteDisplayImageFiles(lrm,function(){copyFile(file.path,localFileName);});
        }
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
                    if(bestFitXOrigin==0) bestFitXOrigin = refImageWidthLeft / 2;
                    if(bestFitYOrigin==0) bestFitYOrigin = refImageHeightLeft / 2;
                    if(bestFitXAxis==0) bestFitXAxis = 1.25*refImageWidthLeft / 2;
                    if(bestFitYAxis==0) bestFitYAxis = refImageHeightLeft / 2;
                    if(livePlotLineXOrigin==0) livePlotLineXOrigin = refImageWidthLeft / 2;
                    if(livePlotLineYOrigin==0) livePlotLineYOrigin = 0.75*refImageHeightLeft / 2;
                    if(livePlotLineXAxis==0) livePlotLineXAxis = 1.5*refImageWidthLeft / 2;
                    if(livePlotLineYAxis==0) livePlotLineYAxis = 0.75*refImageHeightLeft / 2;
                    if(recordPath) refImagePathLeft = file.path;
                    updateDimsLabels();
                    checkValidInput();
                }else if(viewer=="#panzoomRight"){
                    refImageWidthRight = tiff.width();
                    refImageHeightRight = tiff.height();
                    if(recordPath) refImagePathRight = file.path;
                    updateDimsLabels();
                    checkValidInput();
                }else if(viewer=="#panzoomMiddle"){
                    refImageWidthMiddle = tiff.width();
                    refImageHeightMiddle = tiff.height();
                    if(recordPath) refImagePathMiddle = file.path;
                    updateDimsLabels();
                    checkValidInput();
                }
                if(addBorder){
                    $(tiffCanvas).css({border: '5px solid #666666'});
                }
            }
            else if(fileTypesOther.indexOf(extension) > -1||fileTypesBMP.indexOf(extension) > -1){
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
                        if(bestFitXOrigin==0) bestFitXOrigin = refImageWidthLeft / 2;
                        if(bestFitYOrigin==0) bestFitYOrigin = refImageHeightLeft / 2;
                        if(bestFitXAxis==0) bestFitXAxis = 1.25*refImageWidthLeft / 2;
                        if(bestFitYAxis==0) bestFitYAxis = refImageHeightLeft / 2;
                        if(recordPath) refImagePathLeft = file.path;
                        if(livePlotLineXOrigin==0) livePlotLineXOrigin = refImageWidthLeft / 2;
                        if(livePlotLineYOrigin==0) livePlotLineYOrigin = 1.5*refImageHeightLeft / 2;
                        if(livePlotLineXAxis==0) livePlotLineXAxis = 1.5*refImageWidthLeft / 2;
                        if(livePlotLineYAxis==0) livePlotLiveYAxis = 1.5*refImageHeightLeft / 2 + 50;
                        updateDimsLabels();
                        checkValidInput();
                    }else if(viewer=="#panzoomRight"){
                        refImageWidthRight = imgWidth;
                        refImageHeightRight = imgHeight;
                        if(recordPath) refImagePathRight = file.path;
                        updateDimsLabels();
                        checkValidInput();
                    }else if(viewer=="#panzoomMiddle"){
                        refImageWidthMiddle = imgWidth;
                        refImageHeightMiddle = imgHeight;
                        if(recordPath) refImagePathMiddle = file.path;
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
                    }
                    if(typeof $("#showDeformedCheck")[0] != "undefined")
                        if($("#showDeformedCheck")[0].checked){
                            updateDeformedCoords();
                        }else{
                            if(typeof drawROIs === "function")
                                drawROIs();
                        }
                    callBack();
                    return true;
                }
                var myImage  = new Image();
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
            }
            if(typeof $("#showDeformedCheck")[0] != "undefined")
                if($("#showDeformedCheck")[0].checked){
                    updateDeformedCoords();
                }else{
                    if(typeof drawROIs === "function")
                        drawROIs();
                }
            callBack();
            //if($("#binaryAutoUpdateCheck")[0].checked)
            //    callOpenCVServerExec();
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

function load_image_sequence(reset_ref_ROIs){
    var fullImageName = concatImageSequenceName(0);
    var fullStereoImageName = concatImageSequenceName(1);
    var fullTrinocImageName = concatImageSequenceName(2);
    updateImageSequencePreview();

    fs.stat(fullImageName, function(err, stat) {
        if(err != null) {
            alert("Invalid image file name: " + fullImageName);
            return;
        }
        else{
            if(showStereoPane==1||showStereoPane==2){
                fs.stat(fullStereoImageName, function(err, stat) {
                    if(err != null) {
                      alert("Invalid stereo image file name: " + fullStereoImageName);
                      return;
                    }
                    getFileObject(fullImageName, function (fileObject) {
                        //loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,reset_ref_ROIs,"","",true,function(){if($("#binaryAutoUpdateCheck")[0].checked) callOpenCVServerExec();});
                        loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,reset_ref_ROIs,"","",true);
                    });
                    getFileObject(fullStereoImageName, function (fileObject) {
                        //loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","",true,function(){if($("#binaryAutoUpdateCheck")[0].checked) callOpenCVServerExec();});
                        loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","",true);
                    });
                    flagSequenceImages();
                });
                if(showStereoPane==2){
                    fs.stat(fullTrinocImageName, function(err, stat) {
                        if(err != null) {
                            alert("Invalid trinoc image file name: " + fullTrinocImageName);
                            return;
                        }
                        getFileObject(fullTrinocImageName, function (fileObject) {
                            //loadImage(fileObject,"#panzoomMiddle","auto","auto",1,false,false,"","",true,function(){if($("#binaryAutoUpdateCheck")[0].checked) callOpenCVServerExec();});
                            loadImage(fileObject,"#panzoomMiddle","auto","auto",1,false,false,"","",true);
                        });
                        flagSequenceImages();
                    });
                }
            }
            else{
                 getFileObject(fullImageName, function (fileObject) {
                     //loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,reset_ref_ROIs,"","",true,function(){if($("#binaryAutoUpdateCheck")[0].checked) callOpenCVServerExec();});
                     loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,reset_ref_ROIs,"","",true);
                 });
                 flagSequenceImages();
            }
        }
    });    
}

$("#consoleButton").on("click",function () {
    if(!$(this).hasClass('action-li')) return;
    $("#resultsButton").addClass('action-li');
    $("#resultsButton").addClass('toggle-title');
    $(this).removeClass('action-li');
    $(this).addClass('toggle-title-bold');
    $("#consoleWindow").show();
    $("#resultsWindow").hide();
});

$("#resultsButton").on("click",function () {
    if(!$(this).hasClass('action-li')) return;
    $("#consoleButton").addClass('action-li');
    $("#consoleButton").addClass('toggle-title');
    $(this).removeClass('action-li');
    $(this).addClass('toggle-title-bold');
    $("#consoleWindow").hide();
    $("#resultsWindow").show();
});

$("#loadSubsetFileInput").on("click",function () {
    this.value = null;
});
$("#loadSubsetFileInput").change(function (evt) {
    if (confirm('Importing a subset locations file will reset all ROIs. Continue loading?')) {
        var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
        if(file){
            clearROIs();
            clearExcluded();
            clearObstructed();
            clearDrawnROIs();
            addLivePlotPtsActive = false;
            addROIsActive = false;
            addObstructedActive = false;
            addExcludedActive = false;
            $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
            $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
            $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
            $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
            fs.readFile(file.path,'utf8',function(err,data){
                if(err){
                }else{
                    read_subset_file(data);
                    drawROIs();
                    drawDotsAndBoxesForSubsets(file.path);
                }
            }); // end readfile
        }
    }else{
        return false;
    }
});

$("#loadRef").click(function (){
    load_image_sequence(true);
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
        if((cinePathRight!="undefined"||cinePathMiddle!="undefined")&&cinePathLeft!="undefined"){
            if (confirm('unload right (and trinoc) cine file (this is necessary if the frame ranges are different between right and left cine)')){
                deleteDisplayImageFiles(0);
                deleteDisplayImageFiles(1);
                deleteDisplayImageFiles(2);
                deleteHiddenFiles('background');
                cinePathRight = "undefined";
                $("#cineRightPreviewSpan").text("");
                $("#cineStartPreviewSpan").text("");
                $("#cineEndPreview span").text("");
                $("#panzoomRight").html('');
                cinePathMiddle = "undefined";
                $("#cineMiddlePreviewSpan").text("");
                $("#panzoomMiddle").html('');
                // create a tiff image of the selected reference frame
                callCineStatExec(file,0,true);
            }
            else{
            }
        } // end a right cine file exists
        else{
            callCineStatExec(file,0,true);
        }
    }
});

$("#rightCineInput").on("click",function () {
    this.value = null;
});
$("#rightCineInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        // create a tiff image of the selected reference frame
        callCineStatExec(file,1,false);
    }
});

$("#middleCineInput").on("click",function () {
    this.value = null;
});
$("#middleCineInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        // create a tiff image of the selected reference frame
        callCineStatExec(file,2,false);
    }
});


function reload_cine_images(index){
    // check that the ref index is valid
    if(cinePathLeft!="undefined"||cinePathRight!="undefined"||cinePathMiddle!="undefined")
        if(index < Number($("#cineStartPreviewSpan").text()) || index > Number($("#cineEndPreviewSpan").text())){
            alert("invalid index");
            return;
        }
    var offsetIndex = Number(index);// - cineFirstFrame;
    cineLeftOpenCVComplete = false;
    cineRightOpenCVComplete = false;
    //alert("offset_index " + offsetIndex);
    if(cinePathLeft!="undefined")
        updateCineDisplayImage(cinePathLeft,offsetIndex,0);
    if(cinePathRight!="undefined")
        updateCineDisplayImage(cinePathRight,offsetIndex,1);
    if(cinePathMiddle!="undefined")
        updateCineDisplayImage(cinePathMiddle,offsetIndex,2);
}


// reload the left and right cine image if the ref index is changed
$("#cineRefIndex").change(function () {
    // filename left and right
    var refIndex = $("#cineRefIndex").val();
    $("#frameScroller").val(refIndex);
    $("#cineCurrentPreviewSpan").text(refIndex);
    reload_cine_images(refIndex);
//    // check that the ref index is valid
//    if(cinePathLeft!="undefined"||cinePathRight!="undefined"||cinePathMiddle!="undefined")
//        if(refIndex < Number($("#cineStartPreviewSpan").text()) || refIndex > Number($("#cineEndPreviewSpan").text())){
//            alert("invalid reference index");
//            return;
//        }
//    var offsetIndex = Number(refIndex);// - cineFirstFrame;
//    cineLeftOpenCVComplete = false;
//    cineRightOpenCVComplete = false;
//    //alert("offset_index " + offsetIndex);
//    if(cinePathLeft!="undefined")
//        updateCineDisplayImage(cinePathLeft,offsetIndex,0);
//    if(cinePathRight!="undefined")
//        updateCineDisplayImage(cinePathRight,offsetIndex,1);
//    if(cinePathMiddle!="undefined")
//        updateCineDisplayImage(cinePathMiddle,offsetIndex,2);
});

$("#frameScroller").on('input', function () {
        $("#cineCurrentPreviewSpan").text($(this).val());
    }).change(function(){
        reload_cine_images($(this).val());
//        $("#cineRefIndex").val($(this).val());
//        $("#cineRefIndex").trigger("change");
//        if(typeof arrowCausedEvent === 'undefined'){
//            deleteHiddenFiles('keypoints',function(){$("#cineRefIndex").trigger("change");});
//        }else{
//            if(arrowCausedEvent){
//                $("#cineRefIndex").trigger("change");
//            }
//            else
//                deleteHiddenFiles('keypoints',function(){$("#cineRefIndex").trigger("change");});
//        }
        arrowCausedEvent = false;
    });

$("#frameScroller").on('keydown', function(event) {
    if (event.keyCode === 37 || event.keyCode === 39) { 
        arrowCausedEvent = true;
    } 
}); 

$("#cineGoToIndex").keypress(function(event) { 
    if (event.keyCode === 13) { 
        if($(this).val() < Number($("#cineStartPreviewSpan").text()) || $(this).val() > Number($("#cineEndPreviewSpan").text())){
            alert("invalid index");
            return;
        }
        $("#frameScroller").val($(this).val());
        reload_cine_images($(this).val());
        $("#cineCurrentPreviewSpan").text($(this).val());
    } 
}); 


$(".update-tracklib-preview").keypress(function(event) { 
    if (event.keyCode === 13) { 
        reload_cine_images($("#frameScroller").val());//$("#cineCurrentPreviewSpan").text());
//        reload_cine_images($("#cineCurrentPreviewSpan").text());
//        $("#cineRefIndex").trigger("change");
    } 
}); 


$(".update-tracklib-preview").change(function () {
    reload_cine_images($("#frameScroller").val());//$("#cineCurrentPreviewSpan").text());
});

//$("#showTracksCheck").change(function () {
//    reload_cine_images($("#frameScroller").val());//$("#cineCurrentPreviewSpan").text());
//});
//
//$("#segPreviewCheck").change(function () {
//    reload_cine_images($("#frameScroller").val());//$("#cineCurrentPreviewSpan").text());
//}); 

//
//$("#threshPreviewCheck").change(function () {
//    reload_cine_images($("#cineCurrentPreviewSpan").text());
//    //$("#cineRefIndex").trigger("change");
//}); 
//$("#trajectoryPreviewCheck").change(function () {
//    reload_cine_images($("#cineCurrentPreviewSpan").text());
//    //$("#cineRefIndex").trigger("change");
//}); 

$("#rightRefInput").on("click",function () {
    this.value = null;
});
$("#rightRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    $("#refImageTextRight span").text(file.name);
    //loadImage(file,"#panzoomRight","auto","auto",1,false,false,"","",true,function(){if($("#binaryAutoUpdateCheck")[0].checked) callOpenCVServerExec();});
    loadImage(file,"#panzoomRight","auto","auto",1,false,false,"","",true);
});

$("#middleRefInput").on("click",function () {
    this.value = null;
});
$("#middleRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    $("#refImageTextMiddle span").text(file.name);
    //loadImage(file,"#panzoomMiddle","auto","auto",1,false,false,"","",true,function(){if($("#binaryAutoUpdateCheck")[0].) callOpenCVServerExec();});
    loadImage(file,"#panzoomMiddle","auto","auto",1,false,false,"","",true);
});

$("#calInput").on("click",function () {
    this.value = null;
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

$("#calInfo").click(function(){
	var win = new BrowserWindow({ 
            webPreferences: {
		nodeIntegration: true
	    },
            width: 500, height: 800 });
    win.on('closed', () => {
        win = null
    })
    win.loadURL('file://' + __dirname + '/cal_help.html');
});

$("#leftRefInput").on("click",function () {
    this.value = null;
});
$("#leftRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    $("#refImageText span").text(file.name);
    //loadImage(file,"#panzoomLeft","auto","auto",1,false,true,"","",true,function(){if($("#binaryAutoUpdateCheck")[0].checked) callOpenCVServerExec();});
    loadImage(file,"#panzoomLeft","auto","auto",1,false,true,"","",true);
    updatePreview(file,'left');
});

$("#leftDefInput").on("click",function () {
    this.value = null;
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

function createCalPreview(event){
    // create an absolute position div and add it to the body
    div = $("<div />")
    div.html('<iframe id="calIframe" src="'+calPath+'" width="300", height="500"></iframe>');
    div.attr({id: 'previewCalDiv', class: 'preview'});
    var closeButton = $('<button/>',
    {
        text: 'close',
        click: function () { removeCalPreview(); }
    });
    div.append(closeButton);
    var topCoord = event.pageY - 100;
    div.css({position: 'absolute', top: topCoord, left: '194px', 'z-index': 3, padding: '5px', 'background-color':'white',width: 'auto', height: 'auto'});
    $("#contentDiv").append(div);
}

function removeCalPreview(){
    $("#previewCalDiv").remove();
}

function createPreview(index,loc,event){
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
    if(loc==0){
        loadImage(defImagePathsLeft[index],"#previewDiv","auto","300px",4,true,false,"","",false);
    }else if(loc==1){
        loadImage(defImagePathsRight[index],"#previewDiv","auto","300px",4,true,false,"","",false);
    }else if(loc==2){
        loadImage(defImagePathsMiddle[index],"#previewDiv","auto","300px",4,true,false,"","",false);
    }
}

function removePreview(){
    $("#previewDiv").remove();
    $("#previewDivTri").remove();
}

$("#calList").on("click", ".calListLi" ,function(event){
    createCalPreview(event);
});

//$("#calList").on("mouseout", ".calListLi",function(){
//    removeCalPreview();
//});

$("#defImageListLeft").on("mouseover", ".defListLi" ,function(event){
    var index = $(this).index();
    createPreview(index,0,event);
});

$("#defImageListLeft").on("mouseout", ".defListLi",function(){
    removePreview();
});

$("#defImageListRight").on("mouseover", ".defListLi" ,function(event){
    var index = $(this).index();
    createPreview(index,1,event);
});

$("#defImageListRight").on("mouseout", ".defListLi",function(){
    removePreview();
});

$("#defImageListMiddle").on("mouseover", ".defListLi" ,function(event){
    var index = $(this).index();
    createPreview(index,2,event);
});

$("#defImageListMiddle").on("mouseout", ".defListLi",function(){
    removePreview();
});

$("#rightDefInput").on("click",function () {
    this.value = null;
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

$("#middleDefInput").on("click",function () {
    this.value = null;
});
$("#middleDefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
    files = tgt.files;
    if(files){
        $("#defImageListMiddle").empty();
        defImagePathsRight = [];
        for(var i = 0, l = files.length; i < l; i++) {
            var filePath = files[i].path;
            var fileName = files[i].name;
            $("#defImageListMiddle").append("<li class='defListLi' id='defListLi_"+i+"'>" + fileName + "</li>");
            defImagePathsMiddle.push(files[i]);//filePath);
        }
    }
    checkValidInput();
});

function updateDimsLabels (){
    $("#leftDims").text("w:" + refImageWidthLeft  + " h:" + refImageHeightLeft);
    $("#rightDims").text("w:" + refImageWidthRight  + " h:" + refImageHeightRight);
    $("#middleDims").text("w:" + refImageWidthMiddle  + " h:" + refImageHeightMiddle);
}

$("#drawEpipolar").click(function(){
    // check if cal.xml file exists
    fs.stat(calPath, function(err, stat) {
        if(err == null) {
            completeShape();
            addROIsActive = false;
            addExcludedActive = false;
            addObstructedActive = false;
            addLivePlotPtsActive = false;
            $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
            $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
            $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
            $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
            drawEpipolarActive = !drawEpipolarActive;
            if(drawEpipolarActive){
                $("#drawEpipolar").css('color','#33ccff');
            }else{
                //$("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
                deactivateEpipolar();
            }
        }else {
            alert('calibration file has not been set (this utility only works once a calibration has been performed)');
            return;
        }
    });
});

$("#initCross").click(function () {
    localStorage.setItem("rightFileName",refImagePathRight);
    localStorage.setItem("leftFileName",refImagePathLeft);
    localStorage.setItem("rightWidth",refImageWidthRight);
    localStorage.setItem("rightHeight",refImageHeightRight);
    localStorage.setItem("leftWidth",refImageWidthLeft);
    localStorage.setItem("leftHeight",refImageHeightLeft);
    localStorage.setItem("workingDirectory",workingDirectory);
    var win = new BrowserWindow({
            webPreferences: {
		nodeIntegration: true
	    },
            width: 1200, height: 1000 });
    win.on('closed', () => {
        win = null
        $("#crossCorrInit").show();
        updateResultsFilesList();
    })
    win.loadURL('file://' + __dirname + '/cross_init.html');
    $("#crossCorrInit").hide();
    //win.webContents.openDevTools()
});

$("#performCal").click(function () {
    localStorage.setItem("workingDirectory",workingDirectory);
    localStorage.setItem("calFileName","");
    localStorage.setItem("execCalPath",execCalPath);
    localStorage.setItem("execOpenCVServerPath",execOpenCVServerPath);
    localStorage.setItem("execCineToTiffPath",execCineToTiffPath);
    localStorage.setItem("execCineStatPath",execCineStatPath);
    localStorage.setItem("showStereoPane",showStereoPane);
    
    var win = new BrowserWindow({
            webPreferences: {
		nodeIntegration: true
	    },
            width: 1200, height: 1200 });
    win.on('closed', () => {
        calFileName = localStorage["calFileName"];
        if(calFileName != ""){
            $("#calList").empty();
            calPath = calFileName;
            $("#calList").append("<li class='calListLi'>cal.xml</li>");
            checkValidInput();
        }
        win = null
    })
    win.loadURL('file://' + __dirname + '/cal.html');
    //win.webContents.openDevTools()
});

function openPreviewCross() {
    localStorage.setItem("workingDirectory",workingDirectory);
    var win = new BrowserWindow({ 
            webPreferences: {
		nodeIntegration: true
	    },
            width: 1200, height: 1000 });
    win.on('closed', () => {
        win = null
    })
    win.loadURL('file://' + __dirname + '/preview_cross.html');
    //win.webContents.openDevTools()
}

$("#calibrationCheck").change(function() {
    if(this.checked) {
        $(".cal-options").show();
    }else{
        $(".cal-options").hide();
    }
    checkValidInput();
});

