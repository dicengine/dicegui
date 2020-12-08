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

function deleteDisplayImageFiles(lrm,cb){
    var cbCalled = false;
    cb = cb || $.noop;
    var nameToCheck = '.preview_';
    if(lrm==0){
        nameToCheck += 'left';
    }else if(lrm==1){
        nameToCheck += 'right';
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
                                if (err) {}//throw err;}
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

function flagSequenceImages(){
    refImagePathLeft = "sequence";
    refImagePathRight = "sequence";
    defImagePathsLeft = ["sequence"];
    defImagePathsRight = ["sequence"];
}

function loadImageSequence(reset_ref_ROIs,cb){
    cb = cb || $.noop;
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
            updatePreview(fullImageName,'left',[],[],"",cb);
            if(showStereoPane==1||showStereoPane==2){
                fs.stat(fullStereoImageName, function(err, stat) {
                    if(err != null) {
                        alert("Invalid stereo image file name: " + fullStereoImageName);
                        return;
                    }
                    updatePreview(fullStereoImageName,'right');
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

//$("#loadSubsetFileInput").on("click",function () {
//    this.value = null;
//});

$("#loadSubsetFileInput").change(function (evt) {
    if (confirm('Importing a subset locations file will reset all ROIs. Continue loading?')) {
        var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
        if(file){
            addLivePlotPtsActive = false;
            $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
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

$("#loadRef").click(function (){
    loadImageSequence(true);
});

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
//                $("#cineStartPreviewSpan").text("");
//                $("#cineEndPreview span").text("");
//                $("#panzoomRight").html('');
//                // create a tiff image of the selected reference frame
//                callCineStatExec(file,0,true);
//            }
//            else{
//            }
//        } // end a right cine file exists
//        else{
            callCineStatExec(file,0,true);
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
        callCineStatExec(file,1,false);
    }
});

function reloadCineImages(index){
    // check that the ref index is valid
    if(cinePathLeft!="undefined"||cinePathRight!="undefined")
        if(index < Number($("#cineStartPreviewSpan").text()) || index > Number($("#cineEndPreviewSpan").text())){
            alert("invalid index");
            return;
        }
    var offsetIndex = Number(index);
    // for tracklib special filters can be applied over the images
    if($("#analysisModeSelect").val()=="tracking"&&showStereoPane==1&&$("#segPreviewCheck")[0].checked){ // signifies tracklib
        updateTracklibDisplayImages(offsetIndex);
    }else{    // otherwise just diplay the raw frame
        if(cinePathLeft!="undefined")
            updateCineDisplayImage(cinePathLeft,offsetIndex,'left');
        if(cinePathRight!="undefined")
            updateCineDisplayImage(cinePathRight,offsetIndex,'right');
    }
}


// reload the left and right cine image if the ref index is changed
$("#cineRefIndex").change(function () {
    var refIndex = $("#cineRefIndex").val();
});

$("#frameScroller").on('input', function () {
    $("#cineCurrentPreviewSpan").text($(this).val());
}).change(function(){
    reloadCineImages($(this).val());
});

$("#cineGoToIndex").keypress(function(event) { 
    if (event.keyCode === 13) { 
        if($(this).val() < Number($("#cineStartPreviewSpan").text()) || $(this).val() > Number($("#cineEndPreviewSpan").text())){
            alert("invalid index");
            return;
        }
        $("#frameScroller").val($(this).val());
        $("#cineCurrentPreviewSpan").text($(this).val());
        reloadCineImages($(this).val());
    } 
}); 

$(".update-tracklib-preview").keypress(function(event) { 
    if (event.keyCode === 13) { 
        reloadCineImages($("#frameScroller").val());//$("#cineCurrentPreviewSpan").text());
    } 
}); 


$(".update-tracklib-preview").change(function () {
    reloadCineImages($("#frameScroller").val());//$("#cineCurrentPreviewSpan").text());
});

$("#rightRefInput").on("click",function () {
    this.value = null;
});
$("#rightRefInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    $("#refImageTextRight span").text(file.name);
    updatePreview(file.path,'right',[],[],"",function(){refImagePathRight = file.path;});
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
    updatePreview(file.path,'left',[],[],"",function(){refImagePathLeft = file.path;});
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

//$("#drawEpipolar").click(function(){
//    // check if cal.xml file exists
//    fs.stat(calPath, function(err, stat) {
//        if(err == null) {
//            completeShape();
//            addROIsActive = false;
//            addExcludedActive = false;
//            addObstructedActive = false;
//            addLivePlotPtsActive = false;
//            $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
//            $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
//            $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
//            $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
//            drawEpipolarActive = !drawEpipolarActive;
//            if(drawEpipolarActive){
//                $("#drawEpipolar").css('color','#33ccff');
//            }else{
//                //$("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
//                deactivateEpipolar();
//            }
//        }else {
//            alert('calibration file has not been set (this utility only works once a calibration has been performed)');
//            return;
//        }
//    });
//});

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

