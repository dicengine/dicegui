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

//function getOffset( el ) {
//    var _x = 0;
//    var _y = 0;
//    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
//        _x += el.offsetLeft - el.scrollLeft;
//        _y += el.offsetTop - el.scrollTop;
//        el = el.offsetParent;
//    }
//    return { clientX: _x, clientY: _y };
//}

//function deleteDisplayImageFiles(name,dest,cb){
//    var cbCalled = false;
//    cb = cb || $.noop;
//    var nameToCheck = '.preview_';
//    if(lrm==0){
//        nameToCheck += 'left';
//    }else if(lrm==1){
//        nameToCheck += 'right';
//    }
//    hiddenDir = fullPath('.dice','');
//    console.log('removing any existing display image files with name base ' + nameToCheck + ' from ' + hiddenDir);
//    fs.readdir(hiddenDir, (err,dir) => {
//        // es5
//        // count up the number of potential files to delete
//        var numExistingFiles = 0;
//        if(!dir)return;
//        for(var i = 0; i < dir.length; i++) {
//            if(dir[i].includes(nameToCheck))
//                numExistingFiles++;
//        }
//        console.log(numExistingFiles + ' display image files exist');
//        if(numExistingFiles==0){
//            cb();
//            return;
//        }
//        for(var i = 0; i < dir.length; i++) {
//            (function(i) {
//                var filePath = dir[i];
//                if(filePath.includes(nameToCheck)){
//                    console.log('attempting to delete file ' + filePath);
//                    var fullFilePath = fullPath('.dice',filePath);
//                    fs.stat(fullFilePath, function(err, stat) {
//                        console.log('stat called on file ' + fullFilePath);
//                        if(err == null) {
//                            fs.unlink(fullFilePath, (err) => {
//                                numExistingFiles--;
//                                if (err) {}//throw err;}
//                                else{
//                                    console.log('successfully deleted '+fullFilePath+' '+i);
//                                    if(numExistingFiles==0) {
//                                        cb();
//                                    }
//                                }
//	                    });
//                        }else{
//                            // no-op
//	                }
//                    }); // end stat
//                } //end includes
//            })(i);
//        }
//    });
//}

function deleteHiddenFiles(find_str,cb){
    var cbCalled = false;
    cb = cb || $.noop;
    hiddenDir = fullPath('.dice','');
    console.log('removing hidden files that include ' + find_str + ' from ' + hiddenDir);
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
                                if (err) {} // don't complain about the file not existing
                                else{
                                    console.log('successfully deleted '+fullFilePath+' '+i);
                                    if(numExistingFiles==0) {
                                        cb();
                                    }
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

function flagSequenceImages(){
    refImagePathLeft = "sequence";
    refImagePathRight = "sequence";
    defImagePathsLeft = ["sequence"];
    defImagePathsRight = ["sequence"];
}

function loadImageSequence(cb){
    cb = cb || $.noop;
    var fullImageName = concatImageSequenceName(0);
    var fullStereoImageName = concatImageSequenceName(1);
    updateImageSequencePreview();

    fs.stat(fullImageName, function(err, stat) {
        if(err != null) {
            alert("Invalid image file name: " + fullImageName);
            return;
        }
        else{
            updatePreviewImage({srcPath:fullImageName,dest:'left'},cb);
            if(showStereoPane==1||showStereoPane==2){
                fs.stat(fullStereoImageName, function(err, stat) {
                    if(err != null) {
                        alert("Invalid stereo image file name: " + fullStereoImageName);
                        return;
                    }
                    updatePreviewImage({srcPath:fullStereoImageName,dest:'right'});
                    flagSequenceImages();
                });
            }
            else{
                flagSequenceImages();
            }
        }
    });
}

$("#consoleButton").on("click",function () {
    if(!$(this).hasClass('action-li')) return;
    $("#plotsButton").addClass('action-li');
    $("#plotsButton").addClass('toggle-title');
    $(this).removeClass('action-li');
    $(this).addClass('toggle-title-bold');
    $("#consoleWindow").show();
    $("#plotsWindow").hide();
});

$("#plotsButton").on("click",function () {
    if(!$(this).hasClass('action-li')) return;
    $("#consoleButton").addClass('action-li');
    $("#consoleButton").addClass('toggle-title');
    $(this).removeClass('action-li');
    $(this).addClass('toggle-title-bold');
    $("#consoleWindow").hide();
    $("#plotsWindow").show();
});

function isResultsMode(){
    return !$("#resultsButton").hasClass('action-li');
}

$("#resultsButton").on("click",function () {
    if(!$(this).hasClass('action-li')) return;
    $("#previewButton").addClass('action-li');
    $("#previewButton").addClass('toggle-title');
    $(this).removeClass('action-li');
    $(this).addClass('toggle-title-bold');
    $("#previewWindow :input").attr("disabled", true);
    $(".tracklib-preview-only").hide();
    $("#resultsWindow").show();
    // reload the results file
    $("#showTrackingCheck").prop("checked",true);
    reloadCineImages($("#frameScroller").val());
});

$("#previewButton").on("click",function () {
    if(!$(this).hasClass('action-li')) return;
    $("#resultsButton").addClass('action-li');
    $("#resultsButton").addClass('toggle-title');
    $(this).removeClass('action-li');
    $(this).addClass('toggle-title-bold');
    $("#previewWindow :input").attr("disabled", false);
    $(".tracklib-preview-only").show();
    $("#resultsWindow").hide();
    $('#trackGID').val(0);
    reloadCineImages($("#frameScroller").val());
});


//$("#loadSubsetFileInput").on("click",function () {
//    this.value = null;
//});

$("#loadSubsetFileInput").change(function (evt) {
    if (confirm('Importing a subset locations file will reset all ROIs. Continue loading?')) {
        var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
        if(file){
            fs.readFile(file.path,'utf8',function(err,data){
                if(err){
                }else{
                    readSubsetFile(data);
                    $(this).prop("value", "");
                    removeSubsetPreview(); 
                }
            }); // end readfile
        }
    }else{
        $(this).prop("value", "");
        return false;
    }
});

//$("#loadRef").click(function (){
//    loadImageSequence();
//});

$("#leftCineInput").on("click",function () {
    this.value = null;
});
$("#leftCineInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        // TODO if a right cine file is alread loaded ask the user if it should be unloaded to
        // to avoid frame range mismatch
//        if(cinePathRight!="undefined"){
//            if (confirm('unload right cine file (this is necessary if the frame ranges are different between right and left cine)')){
//                deleteDisplayImageFiles(0);
//                deleteDisplayImageFiles(1);
//                deleteDisplayImageFiles(2);
//                deleteHiddenFiles('background');
//                cinePathRight = "undefined";
//                $("#cineRightPreviewSpan").text("");
//                $("#startPreviewSpan").text("");
//                $("#endPreviewSpan").text("");
//                // create a tiff image of the selected reference frame
//                callCineStatExec(file,0);
//            }
//            else{
//            }
//        } // end a right cine file exists
//        else{
            callCineStatExec(file.path,0);
//        }
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
        callCineStatExec(file.path,1);
    }
});

function reloadCineImages(index,loadData=true){
    // check that the ref index is valid
    if(cinePathLeft!="undefined"||cinePathRight!="undefined")
        if(index < Number($("#startPreviewSpan").text()) || index > Number($("#endPreviewSpan").text())){
            alert("invalid index");
            return;
        }
    var offsetIndex = Number(index);
    // for tracklib special filters can be applied over the images
    if($("#analysisModeSelect").val()=="tracking"&&showStereoPane==1&&($("#showSegmentationCheck")[0].checked||$("#showTrackingCheck")[0].checked)){  // signifies tracklib
            updateTracklibDisplayImages(offsetIndex,loadData);
            return;
    }else if($("#analysisModeSelect").val()=="tracking"&&showStereoPane==1){    // otherwise just diplay the raw frame
        // remove any plots or display lines
        resetPlotlyViewer('left');
        resetPlotlyViewer('right');
        Plotly.purge(document.getElementById("livePlots"));
        Plotly.purge(document.getElementById("livePlot3d"));
        if(cinePathLeft!="undefined")
            updateCineDisplayImage(cinePathLeft,offsetIndex,'left',function(){showDeformedROIs();});
        if(cinePathRight!="undefined")
            updateCineDisplayImage(cinePathRight,offsetIndex,'right');
    }
    if(cinePathLeft!="undefined")
        updateCineDisplayImage(cinePathLeft,offsetIndex,'left',function(){showDeformedROIs();});
    if(cinePathRight!="undefined")
        updateCineDisplayImage(cinePathRight,offsetIndex,'right');
}


// reload the left and right cine image if the ref index is changed
$("#cineRefIndex").change(function () {
    var refIndex = $("#cineRefIndex").val();
});

function selectHasValue(select, value) {
    obj = document.getElementById(select);
    if (obj !== null) {
        return (obj.innerHTML.indexOf('value="' + value + '"') > -1);
    } else {
        return false;
    }
}

function setScrollerText(val){
    if($("#fileSelectMode").val()=="list" && val<0)
        $("#currentPreviewSpan").text('ref');
    else
        $("#currentPreviewSpan").text(val);
}

$("#frameScroller").on('input', function () {
    setScrollerText($(this).val());
}).change(function(){
    $("#warningLeft").text("");
    $("#warningRight").text("");
    setScrollerText($(this).val()); // call this again in case the value was set by a call to .val() which wouldn't fire the input event
    if($("#fileSelectMode").val()=="list"){
        $('#defImageListLeft li').each(function(i){
            $(this).removeClass('def-image-ul-selected');
        });
        $('#defImageListRight li').each(function(i){
            $(this).removeClass('def-image-ul-selected');
        });
        if(Number($(this).val())<0){
            if(refImagePathLeft!="")
                updatePreviewImage({srcPath:refImagePathLeft,dest:'left'});
            else{
                resetPlotlyViewer('left');
            }
            if(showStereoPane==1&&refImagePathRight!="")
                updatePreviewImage({srcPath:refImagePathRight,dest:'right'});
            else{
                resetPlotlyViewer('right');
            }
        }else{
            var index = $(this).val();
            if(defImagePathsLeft.length > $(this).val()){
                updatePreviewImage({srcPath:defImagePathsLeft[index].path,dest:'left'});
                $("#defImageListLeft li:eq(" + index.toString() + ")").addClass("def-image-ul-selected");
            }
            else{
                resetPlotlyViewer('left');
            }
            if(defImagePathsRight.length > $(this).val()){
                updatePreviewImage({srcPath:defImagePathsRight[index].path,dest:'right'});
                $("#defImageListRight li:eq(" + index.toString() + ")").addClass("def-image-ul-selected");
            }
            else{
                resetPlotlyViewer('right');
            }
        }
    }else if($("#fileSelectMode").val()=="sequence"){
        updateImageSequencePreview(true);
    }else if($("#fileSelectMode").val()=="cine"){
        reloadCineImages($(this).val(),!isResultsMode());
    }
    if($("#analysisModeSelect").val()=="subset"||$("#analysisModeSelect").val()=="global"){
        checkContourJsonFileExists();
    }
    // turn off live plot info if this is not the first frame
    toggleLivePlotVisibility($(this).val()==$(this).attr('min'));
    if(selectHasValue("stepSelect",$(this).val())){
        console.log('updating step select with val ' + $(this).val());
        $("#stepSelect").val($(this).val()).change();
    }else{
        console.log('not updating step select since ' + $(this).val() + ' is not a valid option');
    }
    showDeformedROIs();
    removeSubsetPreview();
    $("#trackDisplayModeSelect").trigger("change");
});

$("#cineGoToIndex").keypress(function(event) { 
    if (event.keyCode === 13) { 
        if($(this).val() < Number($("#startPreviewSpan").text()) || $(this).val() > Number($("#endPreviewSpan").text())){
            alert("invalid index");
            return;
        }
        $("#frameScroller").val($(this).val());
        $("#currentPreviewSpan").text($(this).val());
        reloadCineImages($(this).val());
    } 
}); 

$(".update-tracklib-preview").keypress(function(event) { 
    if (event.keyCode === 13) { 
        reloadCineImages($("#frameScroller").val());
    } 
}); 

$("#previewTracklib").on("click",function () {
    reloadCineImages($("#frameScroller").val());
});

$("#rightRefInput").on("click",function () {
    this.value = null;
});
$("#rightRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    $("#refImageTextRight span").text(file.name);
    updatePreviewImage({srcPath:file.path,dest:'right'},function(){refImagePathRight = file.path;});
    updateFrameScrollerRange();
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
    updatePreviewImage({srcPath:file.path,dest:'left'},function(){refImagePathLeft = file.path;});
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
    updateFrameScrollerRange();
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

$("#calList").on("click", ".calListLi" ,function(event){
    createCalPreview(event);
});

$("#calList").on("mouseout", ".calListLi",function(){
    removeCalPreview();
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

$("#performCal").click(function () {
    localStorage.setItem("workingDirectory",workingDirectory);
    localStorage.setItem("calFileName","");
    localStorage.setItem("execCalPath",execCalPath);
    localStorage.setItem("execOpenCVServerPath",execOpenCVServerPath);
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

$("#calibrationCheck").change(function() {
    if(this.checked) {
        $(".cal-options").show();
    }else{
        $(".cal-options").hide();
    }
    checkValidInput();
});

$("#bestFitCheck").change(function() {
    drawBestFitLine();
});

$("#showRepSubsetCheck").change(function() {
    drawRepresentativeSubset();
});

function ShowDialogBox(title, content, btn1text, btn2text, cb1, cb2) {
    cb1 = cb1 || $.noop;
    cb2 = cb2 || $.noop;
    $("#lblMessage").html(content);
    $("#dialog").dialog({
        resizable: false,
        title: title,
        modal: true,
        width: '400px',
        height: 'auto',
        bgiframe: false,
        buttons: [
            {
                text: btn1text,
                click: function () {
                    cb1();
                    $("#dialog").dialog('close');
                }
            },
            {
                text: btn2text,
                click: function () {
                    cb2();
                    $("#dialog").dialog('close');
                }
            }
        ]
    });
}
