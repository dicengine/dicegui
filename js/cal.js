$(window).load(function(){
    workingDirectory = localStorage.getItem("workingDirectory"); 
    localStorage.setItem("calFileName","");
    execCalPath = localStorage.getItem("execCalPath");
    execOpenCVServerPath = localStorage.getItem("execOpenCVServerPath");
    console.log('using cal exec: ' + execCalPath);
    $("#calibrateButton").prop("disabled",true);
    $("#acceptButton").prop("disabled",true);
    $("#cancelButton").hide();
    //
    //$('.board-size').hide();

    console.log('showStereoPane is ' + localStorage.getItem("showStereoPane"));
    if(localStorage.getItem("showStereoPane")==0){ // 2d analysis
        $( '.trinocOption' ).hide();
        $( '.stereoOption' ).hide();
        $( '.stereoPrefix' ).hide();
        $( '.2dOption' ).show();
        $('#leftPreviewToggle').css('width','48.5%');
        $('#leftPreviewToggle').css('float','');
        $('#leftPreviewToggle').css('margin','0 auto');
    }else if(localStorage.getItem("showStereoPane")==1){ // stereo
        $( '.2dOption' ).hide();
        $( '.trinocOption' ).hide();
        $('#leftPreviewToggle').css('width','48.5%');
        $('#rightPreviewToggle').css('width','48.5%');
    }else{ // trinoc
        $( '.2dOption' ).hide();
        $( '.trinocOption' ).show();
        $('#leftPreviewToggle').css('width','32%');
        $('#rightPreviewToggle').css('width','32%');
    }
    $("#calThreshP").hide();
    $("#calThreshConstant").hide();
    $(".adaptive-thresh").hide();
    $("#calUseAdaptiveThreshP").hide();
    $(".cine-input").hide();
    // .load the images if they exist
    //refreshCalDisplayImages();

    // detect a change to any of the image files and update display
    //fs.watchFile(fullPath('','.cal_left.png'), (curr, prev) => {
    //    refreshCalDisplayImages();
    //});
    // initialize panzooms
    $("#panzoomLeftCal").panzoom({
        which: 2,
        minScale: 0.05,
        cursor: "pointer"
    });
    $("#panzoomRightCal").panzoom({
        which: 2,
        minScale: 0.05,
        cursor: "pointer" 
    });
    $("#panzoomMiddleCal").panzoom({
        which: 2,
        minScale: 0.05,
        cursor: "pointer"
    });
});

$("#calFileSelectMode").on('change',function (){
    if($(this).val()=="sequence"){
        if(localStorage.getItem("showStereoPane")!=0){
            $(".stereoPrefix").show();
        }
        $(".sequence-input").show();
        $(".cine-input").hide();
    }
    else if($(this).val()=="cine"){
        $(".sequence-input").hide();
        $(".cine-input").show();
    }
    if(localStorage.getItem("showStereoPane")==0){
        $(".stereoOption").hide();
    }else{
        $(".stereoOption").show();
    }
});


$("#leftCalCineInput").on("click",function () {
    this.value = null;
});
$("#leftCalCineInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        $("#cineCalLeftPreview span").text(file.path);
        fs.stat(file.path, function(err, stat) {
            if(err == null) {
                if(localStorage.getItem("showStereoPane")!=0) {// stereo?
                    fs.stat($("#cineCalRightPreview span").text(), function(err2, stat) {
                        if(err2 == null) {
                            callCalCineStatExec(file.path,function(){previewCalImages(true)});
                        }
                    });
                }else{
                    callCalCineStatExec(file.path,function(){previewCalImages(true)});
                }
            }
        });
    }
});

$("#rightCalCineInput").on("click",function () {
    this.value = null;
});
$("#rightCalCineInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        $("#cineCalRightPreview span").text(file.path);
        fs.stat(file.path, function(err, stat) {
            if(err == null) {
                fs.stat($("#cineCalLeftPreview span").text(), function(err2, stat) {
                    if(err2 == null) {
                        callCalCineStatExec(file.path,function(){previewCalImages(true)});
                    }
                });
            }
        });
    }
});


$("#calThreshConstant").on('input',function(){
    $("#calThreshConstantLabel").text($(this).val());
});
$("#calAdaptiveThreshConstant").on('input',function(){
    $("#calAdaptiveThreshConstantLabel").text($(this).val());
});
$("#calBlockSize").on('input',function(){
    $("#calBlockSizeLabel").text($(this).val());
});

// zoom on focal point from mousewheel 
$("#panzoomLeftCal").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomLeftCal").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});
$("#panzoomRightCal").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomRightCal").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});
$("#panzoomMiddleCal").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomMiddleCal").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});

$( "#selectable").selectable();

$("#calFrameScroller").on('input', function () {
        $("#frameCurrentPreviewSpan").text($(this).val());
    }).change(function(){
    $("#frameCurrentPreviewSpan").text($(this).val());
    previewCalImages();
});

function calConsoleMsg(string){
    $("#calConsoleWindow").append(string + '</br>');
    $("#calConsoleWindow").scrollTop($("#calConsoleWindow").get(0).scrollHeight);
}

function refreshCalDisplayImages(){
    var leftName = fullPath('','.cal_left.png');
    fs.stat(leftName, function(err, stat) {
        if(err == null) {
            getFileObject(leftName, function (fileObject) {
                // get the current width of the parent viewer
                var vwidth = $("#viewWindowLeftCal").outerWidth();
                loadImage(fileObject,"#panzoomLeftCal",vwidth,"auto",1,false,false,"","",false,function(){$("#viewWindowLeftCal").css('height',$("#viewWindowLeftCal img").outerHeight()+'px')});
            });
        }
	else{
            // no-op if the file isn't there
        }
    });
    var rightName = fullPath('','.cal_right.png');
    fs.stat(rightName, function(err, stat) {
        if(err == null) {
            getFileObject(rightName, function (fileObject) {
                // get the current width of the parent viewer
                var vwidth = $("#viewWindowRightCal").outerWidth();
                loadImage(fileObject,"#panzoomRightCal",vwidth,"auto",1,false,false,"","",false,function(){$("#viewWindowRightCal").css('height',$("#viewWindowRightCal img").outerHeight()+'px')});
            });
        }
	else{
            // no-op if the file isn't there
        }
    });
    var middleName = fullPath('','.cal_middle.png');
    fs.stat(middleName, function(err, stat) {
        if(err == null) {
            getFileObject(middleName, function (fileObject) {
                // get the current width of the parent viewer
                var vwidth = $("#viewWindowMiddleCal").outerWidth();
                loadImage(fileObject,"#panzoomMiddleCal",vwidth,"auto",1,false,false,"","",false,function(){$("#viewWindowMiddleCal").css('height',$("#viewWindowMiddleCal img").outerHeight()+'px')});
            });
        }
	else{
            // no-op if the file isn't there
        }
    });
}

function startProgress (){
    $("#runLoaderCal").removeClass('post-loader-success');
    $("#runLoaderCal").removeClass('post-loader-fail');
    $("#runLoaderCal").addClass('loader');
}
function endProgress (success){
    $("#runLoaderCal").removeClass('loader');
    if(success){
        $("#runLoaderCal").addClass('post-loader-success');
    }
    else {
        $("#runLoaderCal").addClass('post-loader-fail');
    }
}

$("#calMode").on('change',function (){
    if($(this).val()=="checkerboard"){
        $("#boardImage").attr("src","./images/checkerboard_diagram.png");
        $("#binaryThresh").val(30);
        $("#binaryLabel").text($("#binaryThresh").val());
        $('.origin-loc').hide();
        $('.threshold-options').hide();
        $('.board-size-dots').hide();
    }
    else if($(this).val()=="vic3d"){
        $("#boardImage").attr("src","./images/dots_diagram.png");
        $("#binaryThresh").val(30);
        $("#binaryLabel").text($("#binaryThresh").val());
        $('.origin-loc').show();
        $('.threshold-options').show();
        $('.board-size-dots').show();
    }
    else if($(this).val()=="vic3dDark"){
        $("#boardImage").attr("src","./images/dots_black_diagram.png");
        $("#binaryThresh").val(100);
        $("#binaryLabel").text($("#binaryThresh").val());
        $('.origin-loc').show();
        $('.threshold-options').show();
        $('.board-size-dots').show();
    }
});

function updateCalCinePreviewImages(cb){
    console.log('updateCalCinePreviewImages');
    cine_left = $("#cineCalLeftPreview span").text();
    cine_right = $("#cineCalRightPreview span").text();
    child_process = require('child_process');
    readline      = require('readline');
    tifLeft  = fullPath('','.cal_') + 'left.tif';
    tifRight = fullPath('','.cal_') + 'right.tif';
    index = $("#calFrameScroller").val();
    console.log("updateCalCinePreviewImages: converting file " + cine_left + " index " + index + " to .tif for display");
    var procConv = child_process.spawn(execCineToTiffPath, [cine_left,index,index,tifLeft],{cwd:workingDirectory});//,maxBuffer:1024*1024})
    readline.createInterface({
        input     : procConv.stdout,
        terminal  : false
    }).on('line', function(line) {
        console.log(line);
    });
    procConv.on('error', function(){
        alert('DICe .cine file converstion to .tiff failed: invalid executable: ' + execCineToTiffPath);
    });
    procConv.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if(code!=0){
            //alert('DICe .cine file conversion to .tiff failed');
        }
        else{
            if(localStorage.getItem("showStereoPane")==0){
                cb = cb || $.noop;
                cb();
            }else{
                console.log("updateCalCinePreviewImages: converting (right file) file " + cine_right + " index " + index + " to .tif for display");
                var procConvRight = child_process.spawn(execCineToTiffPath, [cine_right,index,index,tifRight],{cwd:workingDirectory});//,maxBuffer:1024*1024})
                readline.createInterface({
                    input     : procConvRight.stdout,
                    terminal  : false
                }).on('line', function(line) {
                    console.log(line);
                });
                procConvRight.on('error', function(){
                    alert('DICe .cine file right converstion to .tiff failed: invalid executable: ' + execCineToTiffPath);
                });
                procConvRight.on('close', (code) => {
                    console.log(`child process exited with code ${code}`);
                    if(code!=0){
                        //alert('DICe .cine file conversion to .tiff failed');
                    }
                    else{
                        cb = cb || $.noop;
                        cb();
                    }
                });
            }
            
        }
    });

}

function callCalCineStatExec(file,callback) {
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc;

//    var fileName = file.path;
    console.log('callCalCineStatExec: loading cal cine file: ' + file)
    fs.stat(file, function(err, stat) {
        if(err != null) {
            alert("could not find .cine file: " + file);
            return false;
        }
        else{
            console.log("getting frame range of cine file: " + file);
            var proc = child_process.spawn(execCineStatPath, [file],{cwd:workingDirectory});//,maxBuffer:1024*1024})
        }
        readline.createInterface({
            input     : proc.stdout,
            terminal  : false
        }).on('line', function(line) {
            console.log(line);
        });
        proc.on('error', function(){
            alert('DICe .cine file stat failed: invalid executable: ' + execCineStatPath);
            return false;
        });
        proc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if(code!=0){
                alert('DICe .cine file stat failed');
                return false;
            }
            else{
                // read the output file:
                var statFileName = fullPath('','cine_stats.dat');
                fs.stat(statFileName, function(err, stat) {
                    if(err != null) {
                        alert("could not find .cine stats file: " + statFileName);
                        return false;
                    }else{
                         fs.readFile(statFileName, 'utf8', function (err,data) {
                             if (err) {
                                 console.log(err);
                                 return false;
                             }
                             var stats = data.toString().split(/\s+/g).map(Number);
                             if($("#frameStartPreviewSpan").text()!=stats[1]||$("#frameEndPreviewSpan").text()!=stats[2]){
                                 console.log('callCalCineStatExec: updating cine file stats');
                                 $("#startIndex").val(stats[1]);
                                 $("#endIndex").val(stats[2]);
                                 $("#frameStartPreviewSpan").text(stats[1]);
                                 $("#frameCurrentPreviewSpan").text(stats[1]);
                                 $("#frameEndPreviewSpan").text(stats[2]);
                                 $("#cineCalStartSpan").text(stats[1]);
                                 $("#cineCalEndSpan").text(stats[2]);
                                 $("#calFrameScroller").attr('min',stats[1]);
                                 $("#calFrameScroller").attr('max',stats[2]);
                                 $("#calFrameScroller").val(stats[1]);
                             }
                             callback = callback || $.noop;
                             callback();
                             return true;
                         }); // end else
                    }
                });
            }
        }); // end proc.on    
    }); // end fileName fs.stat
}

//function generateCineCalImages(cb){
//    cine_file = $("#cineCalLeftPreview span").text();
//    console.log('generateCineCalImages: ' + cine_file);
//    callCalCineStatExec(cine_file,function(){updateCalCinePreviewImages(cb)});
//}

function previewCalImages(first_load=false){
    // create the list of files:
    leftName="";
    rightName="";
    middleName="";
    console.log('previewCalImages called');
    
    if($("#calFileSelectMode").val()=="cine"){
        leftName=".cal_left.tif";
        rightName=".cal_right.tif";
        middleName=".cal_middle.tif";
        updateCalCinePreviewImages(function(){previewCalImagesImpl(first_load,leftName,rightName,middleName)});
        $("#calibrateButton").prop("disabled",false);
        //generateCineCalImages(function(){previewCalImagesImpl(first_load,leftName,rightName,middleName)});
    }else{
        if(localStorage.getItem("showStereoPane")==0)
            leftName = concatImageSequenceName($("#calFrameScroller").val(),3); // use mode 3 to avoid the stereo suffix
        else
            leftName = concatImageSequenceName($("#calFrameScroller").val(),0);
        console.log('leftName ' + leftName);
        if(localStorage.getItem("showStereoPane")==1){
            rightName = concatImageSequenceName($("#calFrameScroller").val(),1);
            console.log('rightName ' + rightName);
        }
        if(localStorage.getItem("showStereoPane")==2){
            middleName = concatImageSequenceName($("#calFrameScroller").val(),2);
            console.log('middleName ' + middleName);
        }
        previewCalImagesImpl(first_load,leftName,rightName,middleName);
    }
}

function previewCalImagesImpl(first_load, leftName,rightName,middleName){
    // set up the arguments for the OpenCVServer
    var args = [];
    // create the list of files:
    args.push(leftName);
    args.push('.cal_left.png');
    if(localStorage.getItem("showStereoPane")==1){
        args.push(rightName);
        args.push('.cal_right.png');
    }
    if(localStorage.getItem("showStereoPane")==2){
        args.push(middleName);
        args.push('.cal_middle.png');
    }
    if(first_load){
        args.push('filter:none');
    }
    else if($("#calMode").val()=="checkerboard"){
        args.push('filter:checkerboard_targets');
        args.push('num_cal_fiducials_x');
        args.push($("#calWidth").val());
        args.push('num_cal_fiducials_y');
        args.push($("#calHeight").val());
    }else{ // dot target
        args.push('filter:dot_targets');
        args.push('cal_target_type');
        if($("#calMode").val()=="vic3dDark")
            args.push('WHITE_ON_BLACK_W_DONUT_DOTS'); // invert the colors for the dark pattern
        else
            args.push('BLACK_ON_WHITE_W_DONUT_DOTS');
        if($("#previewThreshCheck")[0].checked){
            args.push('preview_threshold');
            args.push('true');
        }
        args.push('num_cal_fiducials_x');
        args.push($("#calWidth").val());
        args.push('num_cal_fiducials_y');
        args.push($("#calHeight").val());
        args.push('num_cal_fiducials_origin_to_x_marker');
        args.push($("#calInnerWidth").val());
        args.push('num_cal_fiducials_origin_to_y_marker');
        args.push($("#calInnerHeight").val());
        args.push('cal_origin_x');
        args.push($("#calOriginX").val());
        args.push('cal_origin_y');
        args.push($("#calOriginY").val());
        if($("#autoThreshCheck")[0].checked){
            // no op so the default sweep range gets used
        }else{
            // adaptive only gets used if the threshold is set, not swept 
            if($("#adaptiveThreshCheck")[0].checked){
                args.push('use_adaptive_threshold');
                args.push('true');
                args.push('threshold_start');
                args.push($("#calAdaptiveThreshConstant").val());
                args.push('threshold_end');
                args.push($("#calAdaptiveThreshConstant").val());
                args.push('threshold_step');
                args.push($("#calAdaptiveThreshConstant").val());
                args.push('block_size');
                args.push($("#calBlockSize").val());
            }else{
                args.push('threshold_start');
                args.push($("#calThreshConstant").val());
                args.push('threshold_end');
                args.push($("#calThreshConstant").val());
                args.push('threshold_step');
                args.push($("#calThreshConstant").val());
            }
        }
        //args.push('dot_tol'); // TODO enable user to set these (default is 0.25)
        //args.push('filter_mode'); // default is 1 
        //args.push('block_size'); // default is 3
    }
//    var thresh = 0;
//    if($("#adaptiveThreshCheck")[0].checked){
//        args.push('Filter:AdaptiveThreshold');
//        thresh = $("#calAdaptiveThreshConstant").val();
//    }
//    else{
//        thresh = $("#calThreshConstant").val();
//    }
//    args.push('Filter:PatternSpacing');
//    args.push($("#targetSpacingSize").val());
//    args.push('Filter:BinaryThreshold');
//    args.push(1); // 0 is gaussian 1 is mean
//    args.push(75); // block size
//    args.push(thresh); // threshold constant
//    args.push('Filter:Blob');
//    args.push(0); // use area filter
//    args.push(50); // min area
//    args.push(200); // max area
//    args.push(0); // use circularity
//    args.push(0.75); // circ min
//    args.push(1.0); // circ max
//    args.push(0); // eccentricity filter
//    args.push(0.0); // ecc min
//    args.push(1.0); // ecc max
//    args.push(0); // convexity
//    args.push(0.0); // convexity min
//    args.push(1.0); // convexity max
    // call the filter exec
    var child_process = require('child_process');
    var readline      = require('readline');
    //alert('opencv server: ' + execOpenCVServerPath);
    startProgress();
    var proc = child_process.spawn(execOpenCVServerPath,args,{cwd:workingDirectory});//,maxBuffer:1024*1024});
    proc.on('error', function(){
        alert('DICe OpenCVServer failed: invalid executable: ' + execOpenCVServerPath);
    });
    setTimeout(function(){ if($("#calMode").val()=="checkerboard"){proc.kill()}}, 10000);
    proc.on('close', (code) => {
        console.log(`OpenCVServer exited with code ${code}`);
        if(code==0){
            endProgress(true);
            refreshCalDisplayImages();
            if(first_load){
                $("#leftPreviewBody").css('border', '');
                $("#rightPreviewBody").css('border', '');
                $("#middlePreviewBody").css('border', '');
            }
            else{
                $("#leftPreviewBody").css('border', '3px solid #00cc00');
                $("#rightPreviewBody").css('border', '3px solid #00cc00');
                $("#middlePreviewBody").css('border', '3px solid #00cc00');
            }
            $("#previewLeftSpan").text("");
            $("#previewRightSpan").text("");
            $("#previewMiddleSpan").text("");
        }else{
            //if(code>=2&&code<=8){
//                refreshCalDisplayImages();
//                if(code==2||code==4||code==6||code==8){
//                    $("#leftPreviewBody").css('border', '3px solid red');
//                    $("#previewLeftSpan").text("error finding cal dots");
//                }
//                if(code==3||code==5||code==7){
//                    $("#leftPreviewBody").css('border', '3px solid #00cc00');
//                    $("#previewLeftSpan").text("");
//                }
//                if(code==3||code==4||code==7||code==8){
//                    $("#rightPreviewBody").css('border', '3px solid red');
//                    $("#previewRightSpan").text("error finding cal dots");
//                }
//                if(code==2||code==5||code==6){
//                    $("#rightPreviewBody").css('border', '3px solid #00cc00');
//                    $("#previewRightSpan").text("");
//                }
//                if(code==5||code==6||code==7||code==8){
//                    $("#middlePreviewBody").css('border', '3px solid red');
//                    $("#previewMiddleSpan").text("error finding cal dots");
//                }
//                if(code==2||code==3||code==4){
//                    $("#middlePreviewBody").css('border', '3px solid #00cc00');
//                    $("#previewMiddleSpan").text("");
//                }
                //if(code==9||code==11||code==13||code==15){
                //    $("#leftPreviewBody").css('border', '3px solid red');
                //    $("#previewLeftSpan").text("invalid num cal dots");
                //}
                //if(code==10||code==12||code==14){
                //    $("#leftPreviewBody").css('border', '3px solid #00cc00');
                //    $("#previewLeftSpan").text("");
                //}
                //if(code==10||code==11||code==14||code==15){
                //    $("#rightPreviewBody").css('border', '3px solid red');
                //    $("#previewRightSpan").text("invalid num cal dots");
                //}
                //if(code==9||code==12||code==13){
                //    $("#rightPreviewBody").css('border', '3px solid #00cc00');
                //    $("#previewRightSpan").text("");
                //}
                //if(code==12||code==13||code==14||code==15){
                //    $("#middlePreviewBody").css('border', '3px solid red');
                //    $("#previewMiddleSpan").text("invalid num cal dots");
                //}
                //if(code==9||code==10||code==11){
                //    $("#middlePreviewBody").css('border', '3px solid #00cc00');
                //    $("#previewMiddleSpan").text("");
                //}
            //}
            if(code==1||code==2||code==3){
                refreshCalDisplayImages();
                endProgress(false);
                // remove border on preview windows
                $("#leftPreviewBody").css('border', '3px solid red');
                $("#rightPreviewBody").css('border', '3px solid red');
                $("#middlePreviewBody").css('border', '3px solid red');
                $("#previewLeftSpan").text("");
                $("#previewRightSpan").text("");
                $("#previewMiddleSpan").text("");
                // clear the preview images
                $("#panzoomLeftCal").html('');
                $("#panzoomRightCal").html('');
                $("#panzoomMiddleCal").html('');
                $("#previewLeftSpan").text("marker location failed");
                $("#previewRightSpan").text("marker location failed");
                $("#previewMiddleSpan").text("marker location failed");
            }else if(code==4){
                endProgress(false);
                // remove border on preview windows
                $("#leftPreviewBody").css('border', '3px solid red');
                $("#rightPreviewBody").css('border', '3px solid red');
                $("#middlePreviewBody").css('border', '3px solid red');
                $("#previewLeftSpan").text("");
                $("#previewRightSpan").text("");
                $("#previewMiddleSpan").text("");
                // clear the preview images
                $("#panzoomLeftCal").html('');
                $("#panzoomRightCal").html('');
                $("#panzoomMiddleCal").html('');
                $("#previewLeftSpan").text("image load failure");
                $("#previewRightSpan").text("image load failure");
                $("#previewMiddleSpan").text("image load failure");
            }else{
                endProgress(false);
                refreshCalDisplayImages();
                //alert('OpenCVServer failed');
                // remove border on preview windows
                $("#leftPreviewBody").css('border', '3px solid red');
                $("#rightPreviewBody").css('border', '3px solid red');
                $("#middlePreviewBody").css('border', '3px solid red');
                $("#previewLeftSpan").text("");
                $("#previewRightSpan").text("");
                $("#previewMiddleSpan").text("");
                // clear the preview images
                $("#panzoomLeftCal").html('');
                $("#panzoomRightCal").html('');
                $("#panzoomMiddleCal").html('');
                $("#previewLeftSpan").text("preview failure (try adjusting threshold)");
                $("#previewRightSpan").text("preview failure (try adjusting threshold)");
                $("#previewMiddleSpan").text("preview failure (try adjusting threshold)");
            }
        }
    });
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        calConsoleMsg(line);
    });
}

function updateCalSequenceLabels(stats){
    // catch someone trying to load a serial image set for a stereo cal
    if(localStorage.getItem("showStereoPane")==1){ // is stereo
        if(stats.leftPrefix==""&&stats.leftSuffix==""){
            alert("warning, auto detection of file naming convention failed.");
            return;
        }
    }
    
    
    $("#imagePrefix").val(stats.prefix);
    $("#startIndex").val(stats.startIndex);
    $("#imagePoseIndex").val(stats.startIndex);
    $("#endIndex").val(stats.endIndex);
    $("#skipIndex").val(stats.frameInterval);
    $("#numDigits").val(stats.numDigits);
    $("#stereoLeftSuffix").val(stats.leftSuffix);
    $("#stereoLeftPrefix").val(stats.leftPrefix);
    // check if someone is trying to load a folder with stereo images for a single camera calibration
    if(localStorage.getItem("showStereoPane")==0){ // is 2d
        if(stats.leftSuffix!=''){
            alert('Warning: stereo file name suffix detected, but this is a single camera calibration.');
            $('.leftSuffix').show();
            $("#stereoLeftSuffixText").text('suffix');
        }else if(stats.leftPrefix!=''){
            alert('Warning: stereo file name prefix detected, but this is a single camera calibration.');
            $("#imagePrefix").val(stats.leftPrefix);
            $('.leftSuffix').hide();
            $("#stereoLeftSuffixText").text('stereo left suffix');
        }else{
            $('.leftSuffix').hide();
            $("#stereoLeftSuffixText").text('stereo left suffix');
        }
    }
//    if(localStorage.getItem("showStereoPane")==1){
//        if(stats.leftPrefix!=''){
//            //$('.prefixOption').hide();
//            //$('.stereoPrefix').show();
//            //$('.leftSuffix').hide();
//            //$('.rightSuffix').hide();
//        }else{
//            $('.prefixOption').show();
//            //$('.steroePrefix').hide();
//            //$('.leftSuffix').show();
//            //$('.rightSuffix').show();
//        }
//    }
    $("#stereoRightSuffix").val(stats.rightSuffix);
    $("#stereoRightPrefix").val(stats.rightPrefix);
    $("#imageExtension").val(stats.extension);

    $("#calFrameScroller").val(stats.startIndex);
    $("#frameStartPreviewSpan").text(stats.startIndex);
    $("#frameCurrentPreviewSpan").text(stats.startIndex);
    $("#frameEndPreviewSpan").text(stats.endIndex);
    $("#calFrameScroller").attr('min',stats.startIndex);
    $("#calFrameScroller").attr('max',stats.endIndex);
    $("#calFrameScroller").attr('step',stats.frameInterval);
    
    updateImageSequencePreview();

    updateSelectableList();

    previewCalImages(true);
}

$("#changeImageFolder").on("click",function () {
    this.value = null;
});

$("#previewCal").on("click",function () {
    previewCalImages();
});


$("#changeImageFolder").click(function(){
    var path =  dialog.showOpenDialog({defaultPath: workingDirectory, properties: ['openDirectory']});
    if(path){
        autoDetectImageSequence(path[0],updateCalSequenceLabels);
        $('#imageFolder span').text(path[0]);
    }
});

function updateFrameScroller(){
    if($("#calFileSelectMode").val()=="cine"){
        should_return = false;
        if(Number($("#startIndex").val())>Number($("#EndIndex").val())){
            alert('start index ' + Number($("#startIndex").val()) + ' cannot be greater than the end index ' + Number($("#EndIndex").val()));
            should_return = true;
        }
        if(Number($("#endIndex").val())<Number($("#StartIndex").val())){
            alert('end index cannot be less than the start index');
            should_return = true;
        }
        if(Number($("#endIndex").val())>Number($("#cineCalEndSpan").text())){
            alert('end index cannot be greater than the file end index');
            should_return = true;
        }
        if(Number($("#startIndex").val())<Number($("#cineCalStartSpan").text())){
            alert('Start index ' + Number($("#startIndex").val()) + ' cannot be less than the file start index ' + Number($("#cineCalStartSpan").text()));
            should_return = true;
        }
        if(should_return)
            return;
    }
    $("#calFrameScroller").val($("#startIndex").val());
    $("#calFrameScroller").attr('min',$("#startIndex").val());
    $("#calFrameScroller").attr('max',$("#endIndex").val());
    $("#calFrameScroller").attr('step',$("#skipIndex").val());
    $("#frameStartPreviewSpan").text($("#startIndex").val());
    $("#frameCurrentPreviewSpan").text($("#startIndex").val());
    $("#frameEndPreviewSpan").text($("#endIndex").val());
}

$("#startIndex,#endIndex,#skipIndex").on('focusout',function(e){
    updateFrameScroller();
    updateImageSequencePreview(function(){updateSelectableList;previewCalImages(true)});
});

$("#imagePrefix,#startIndex,#endIndex,#skipIndex,#numDigits,#imageExtension,#stereoLeftSuffix,#stereoRightSuffix").keypress(function(e){
    if(e.which!=13) return;
    updateFrameScroller();
    updateImageSequencePreview(function(){updateSelectableList;previewCalImages(true)});
});

$("#binaryThresh").on('input',function(){
    $("#binaryLabel").text($(this).val());
});

function concatImageSequenceName(frame,mode){
    // set mode to 0 for left stereo
    // set mode to 1 for right stereo
    // set mode to 2 for trinoc
    // set mode to 3 for 2d
    var fullImageName = "";
    mode = mode || 0;
    frame = frame || 0;
    if(!arguments.length)
        $('#imageSequencePreview span').text('');
    fullImageName = $("#imageFolderSpan").text();
    if(os.platform()=='win32'){
        fullImageName += '\\';
    }else{
        fullImageName += '/';
    }
    //if($('.stereoPrefix').is(":visible")){
    if(mode==0)
        fullImageName += $("#stereoLeftPrefix").val();
    else if (mode==1)
        fullImageName += $("#stereoRightPrefix").val();
    //}else{
    fullImageName += $("#imagePrefix").val(); // note this might be empty
    //}
    // get the number of digits in the ref index
    if($("#calFileSelectMode").val()=="sequence"){
        var tmpNum = 0;
        if(arguments.length)
            tmpNum = Number(frame);
        else
            tmpNum = Number($("#startIndex").val());
        var defDig = 0;
        if(tmpNum==0)
            defDig = 1;
        else{
            while (tmpNum) {tmpNum = Math.floor(tmpNum/10); defDig++;}
        }
        var digits = Number($("#numDigits").val());
        if(digits > 1)
            for(j=0;j<digits - defDig;++j){
                fullImageName += "0";
            }
        if(arguments.length)
            fullImageName += frame;
        else
            fullImageName += $("#startIndex").val();
    }
    if($('.leftSuffix').is(":visible")){
        if(mode==0||mode==3)
            fullImageName += $("#stereoLeftSuffix").val();
        else if(mode==1)
            fullImageName += $("#stereoRightSuffix").val();
        else
            fullImageName += $("#stereoMiddleSuffix").val();
    }
    fullImageName += $("#imageExtension").val();
    return fullImageName;
}

function updateSelectableList(){
    $("#selectable").empty();

    // check the bounds of the range
    if($("#startIndex").val()=='undefined'||$("#endIndex").val()=='undefined'||$("#skipIndex").val()=='undefined') return;

    var si = Number($("#startIndex").val());
    var ei = Number($("#endIndex").val());
    var step = Number($("#skipIndex").val());
    if(ei<si) return;
    if(step==0) return;
    
    // for each file in the sequence, add an item to the selectable list:
    var index = 0;
    for(i=si;i<=ei;i+=step){
        if(localStorage.getItem("showStereoPane")==1||localStorage.getItem("showStereoPane")==2)
            fileName = concatImageSequenceName(i);
        else
            fileName = concatImageSequenceName(i,3);
        // strip off everything before the last slash or backslash
        fileName = fileName.split(/[\\\/]/).pop();
        $("#selectable").append('<li style="display:block;" id="calListItem_'+index+'" class="ui-widget-content"><span style="float:left;">'+fileName+'</span></li>');
        index++;
    }
}

function updateImageSequencePreview(cb){
    var fullImageName='';
    
    if($("#calFileSelectMode").val()=="cine"){
        $("#calibrateButton").prop("disabled",false);
        return;
    }
    
    if(localStorage.getItem("showStereoPane")==1||localStorage.getItem("showStereoPane")==2)
        fullImageName = concatImageSequenceName($("#startIndex").val(),0);
    else
        fullImageName = concatImageSequenceName($("#startIndex").val(),3);
    $('#imageSequencePreview span').text(fullImageName);

    cb = cb || $.noop;
    // see if the file exists:
    fs.stat(fullImageName, function(err, stat) {
        if(err == null) {
            $("#imageSequencePreview").css({color:"#009933"})
            $("#calibrateButton").prop("disabled",false);
            cb();
        }
        else{
            $("#imageSequencePreview").css({color:"#ff0000"})
            $("#calibrateButton").prop("disabled",true);
            $("#acceptButton").prop("disabled",true);
        }
    });
}

//$("#previewThreshCheck,#calAdaptiveThreshConstant,#calThreshConstant").change(function() {
//        previewCalImages();
//});

$("#autoThreshCheck").change(function() {
    if(this.checked) {
        $("#calThreshP").hide();
        $("#calThreshConstant").hide();
        $(".adaptive-thresh").hide();
        //$("#calAdaptiveThreshConstant").hide();
        $("#calUseAdaptiveThreshP").hide();
    }else{
        $("#calUseAdaptiveThreshP").show();
        if($("#adaptiveThreshCheck")[0].checked){
            $(".adaptive-thresh").show();
            //$("#calAdaptiveThreshConstant").show();
        }
        else{
            $("#calThreshP").show();
            $("#calThreshConstant").show();
        }
    }
});

$("#adaptiveThreshCheck").change(function() {
    if(this.checked) {
        $("#calThreshP").hide();
        $("#calThreshConstant").hide();
        $('.adaptive-thresh').show();
        //$("#calAdaptiveThreshP").show();
        //$("#calAdaptiveThreshConstant").show();
    }else{
        $("#calThreshP").show();
        $("#calThreshConstant").show();
        $('.adaptive-thresh').hide();
        //$("#calAdaptiveThreshP").hide();
        //$("#calAdaptiveThreshConstant").hide();
    }
});

$("#calibrateButton").on('click',function(){
    writeInputFile(); 
});

$("#acceptButton").on('click',function(){
    var outName = workingDirectory;
    if(os.platform()=='win32'){
        outName += '\\';
    }else{
        outName += '/';
    }
    outName += 'cal.xml';
    localStorage.setItem("calFileName",outName);
    window.close();
});

function writeInputFile() {
    var fileName = workingDirectory;
    if(os.platform()=='win32'){
        fileName += '\\';
    }else{
        fileName += '/';
    }
    fileName += 'cal_input.xml';
    console.log('writing cal input file ' + fileName);
    var content = '';
    content += '<!-- Auto generated input file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    var folderName = $("#imageFolderSpan").text();
    if(os.platform()=='win32'){
       folderName += '\\';
    }else{
       folderName += '/';
    }
    content += '<Parameter name="xml_file_format" type="string" value="DICe_xml_calibration_file" />\n';
    
    if($("#calFileSelectMode").val()=="cine"){
        content += '<Parameter name="image_folder" type="string" value="" />\n';
        content += '<Parameter name="cine_file" type="string" value="'+ $("#cineCalLeftPreview span").text() +'" />\n';
        content += '<Parameter name="cine_ref_index" type="int" value="'+$("#startIndex").val()+'" />\n';
        content += '<Parameter name="cine_start_index" type="int" value="'+$("#startIndex").val()+'" />\n';
        content += '<Parameter name="cine_skip_index" type="int" value="'+$("#skipIndex").val()+'" />\n';
        content += '<Parameter name="cine_end_index" type="int" value="'+$("#endIndex").val()+'" />\n';
        if(localStorage.getItem("showStereoPane")==1){
            content += '<Parameter name="stereo_cine_file" type="string" value="'+ $("#cineCalRightPreview span").text() +'" />\n';
        }
    }else{
        content += '<Parameter name="image_folder" type="string" value="'+folderName +'" />\n';
        content += '<Parameter name="image_file_extension" type="string" value="'+$("#imageExtension").val()+'" />\n';
        if(localStorage.getItem("showStereoPane")==1){
            if($("#stereoLeftPrefix").val()!=''){ // stereo analysis
                content += '<Parameter name="stereo_left_file_prefix" type="string" value="'+$("#stereoLeftPrefix").val()+'"/>\n';
                content += '<Parameter name="stereo_right_file_prefix" type="string" value="'+$("#stereoRightPrefix").val()+'"/>\n';
            }else{
                content += '<Parameter name="stereo_left_suffix" type="string" value="'+$("#stereoLeftSuffix").val()+'"/>\n';
                content += '<Parameter name="stereo_right_suffix" type="string" value="'+$("#stereoRightSuffix").val()+'"/>\n';
                content += '<Parameter name="image_file_prefix" type="string" value="'+$("#imagePrefix").val()+'" />\n';
            }
        }else{
            content += '<Parameter name="image_file_prefix" type="string" value="'+$("#imagePrefix").val()+'" />\n';
        }
        if(localStorage.getItem("showStereoPane")==0 && $('.leftSuffix').is(":visible")){ // 2d, but the files have a suffix
            content += '<Parameter name="file_suffix" type="string" value="'+$("#stereoLeftSuffix").val()+'"/>\n';
        }
        content += '<Parameter name="reference_image_index" type="int" value="'+$("#startIndex").val()+'" />\n';
        content += '<Parameter name="start_image_index" type="int" value="'+$("#startIndex").val()+'" />\n';
        content += '<Parameter name="end_image_index" type="int" value="'+$("#endIndex").val()+'" />\n';
        content += '<Parameter name="skip_image_index" type="int" value="'+$("#skipIndex").val()+'" />\n';
        content += '<Parameter name="num_file_suffix_digits" type="int" value="'+$("#numDigits").val()+'" />\n';
        if(localStorage.getItem("showStereoPane")==0){ // add the pose estimation index for 2d
            content += '<Parameter name="pose_estimation_index" type="int" value="'+$("#imagePoseIndex").val()+'" />\n';
        }
    }
    
    if($("#calMode").val()=="checkerboard"){
        content += '<Parameter name="cal_target_type" type="string" value="CHECKER_BOARD"/>\n';
    }else{
        if($("#calMode").val()=="vic3d")
            content += '<Parameter name="cal_target_type" type="string" value="BLACK_ON_WHITE_W_DONUT_DOTS"/>\n';
        else if($("#calMode").val()=="vic3dDark"){
            content += '<Parameter name="cal_target_type" type="string" value="WHITE_ON_BLACK_W_DONUT_DOTS"/>\n';
        }
        content += '<Parameter name="num_cal_fiducials_origin_to_x_marker" type="int" value="'+$("#calInnerWidth").val()+'"/>\n';
        content += '<Parameter name="num_cal_fiducials_origin_to_y_marker" type="int" value="'+$("#calInnerHeight").val()+'"/>\n';
        content += '<Parameter name="cal_origin_x" type="int" value="'+$("#calOriginX").val()+'"/>\n';
        content += '<Parameter name="cal_origin_y" type="int" value="'+$("#calOriginY").val()+'"/>\n';
    }
    content += '<Parameter name="cal_target_spacing_size" type="double" value="'+$("#targetSpacingSize").val()+'"/>\n';
    content += '<Parameter name="num_cal_fiducials_x" type="int" value="'+$("#calWidth").val()+'"/>\n';
    content += '<Parameter name="num_cal_fiducials_y" type="int" value="'+$("#calHeight").val()+'"/>\n';

    if($("#autoThreshCheck")[0].checked){
        // no op so the default sweep range gets used
    }else{
        // adaptive only gets used if the threshold is set, not swept 
        if($("#adaptiveThreshCheck")[0].checked){
            content += '<Parameter name="threshold_start" type="int" value="'+$("#calAdaptiveThreshConstant").val()+'"/>\n';
            content += '<Parameter name="threshold_end" type="int" value="'+$("#calAdaptiveThreshConstant").val()+'"/>\n';
            content += '<Parameter name="threshold_step" type="int" value="'+$("#calAdaptiveThreshConstant").val()+'"/>\n';
            content += '<Parameter name="use_adaptive_threshold" type="bool" value="true"/>\n';
            content += '<Parameter name="block_size" type="int" value="'+$("#calBlockSize").val()+'"/>\n';
        }else{
            content += '<Parameter name="threshold_start" type="int" value="'+$("#calThreshConstant").val()+'"/>\n';
            content += '<Parameter name="threshold_end" type="int" value="'+$("#calThreshConstant").val()+'"/>\n';
            content += '<Parameter name="threshold_step" type="int" value="'+$("#calThreshConstant").val()+'"/>\n';
            content += '<Parameter name="use_adaptive_threshold" type="bool" value="false"/>\n';
        }
    }
    hasManualOffs = false;
    $('#selectable .ui-selected').each(function() {
        hasManualOffs = true;
    })
    if(hasManualOffs){
        content += '<Parameter name="cal_disable_image_indices" type="string" value="{';
        firstId = true;
        $('#selectable .ui-selected').each(function() {
            if(!firstId)
                content += ',';
            content += $(this).index();
            firstId = false;
//            id_num_str = $(this).attr('id').split('_').pop();
//            if(id_num_str.length>0){
//                if(!firstId)
//                    content += ',';
//                content += id_num_str;
//                firstId = false;
//            }
        })
        content += '}" />\n';
    }

    content += '</ParameterList>\n';
    
    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message);
            return;
         }
        console.log('cal_input.xml file has been successfully saved');
        deleteFileIfExists("cal.log",function(){deleteFileIfExists("cal_errors.txt",callCalExec())});
        //callCalExec();
    });
}

function callCalExec() {
    startProgress();
    $("#cancelButton").show();
    var fileName = workingDirectory;
    var logName = workingDirectory;
    var outName = workingDirectory;
    var errorName = workingDirectory;
    if(os.platform()=='win32'){
        fileName += '\\';
        logName += '\\';
        outName += '\\';
        errorName += '\\';
    }else{
        fileName += '/';
        logName += '/';
        outName += '/';
        errorName += '/';
    }
    fileName += 'cal_input.xml';
    logName += 'cal.log';
    outName += 'cal.xml';
    errorName += 'cal_errors.txt';
    console.log('running ' + execCalPath +' with input file: ' + fileName);
    var child_process = require('child_process');
    var readline      = require('readline');
    var logStream = fs.createWriteStream(logName, {flags: 'w'});
    var proc = child_process.spawn(execCalPath, [fileName,outName],{cwd:workingDirectory});//,maxBuffer:1024*1024});
    proc.stdout.pipe(logStream);
    proc.stderr.pipe(logStream);
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        calConsoleMsg(line);
        //console.log(line);    
    });
    $("#cancelButton").on('click',function(){
        proc.kill(); 
    });
    proc.on('exit', function (code, signal) {
        console.log('cal process  exited with code = ' +code+'  signal = '+signal);
    //});
    //proc.on('close', (code) => {
    //    console.log(`cal process exited with code ${code}`);
        $("#acceptButton").prop("disabled",false);
        $("#cancelButton").hide();
        if(code!=0){
            alert('DICe cal execution failed (see cal.log for details)');
            endProgress(false);
        }
        else{
            endProgress(true);
            // update the output file name
            $('#calOutputPreview span').text(outName);
            
            // read the cal.log file for the rms error:
            fs.stat(logName, function(err, stat) {
                if(err == null) {
                    fs.readFile(logName, 'utf8', function (err,dataS) {
                         if (err) {
                              return console.log(err);
                         }
                        var resDataLines = dataS.toString().split(/\r?\n/);
                        for(i=0;i<resDataLines.length;++i){
                            if(resDataLines[i].includes("RMS error:")){
                                var outputString = resDataLines[i].substring(resDataLines[i].indexOf(":")+1,resDataLines[i].length);
                                $('#rmsPreview span').text(outputString);
                            }
                            else if(resDataLines[i].includes("average epipolar error")){
                                var outputString = resDataLines[i].substring(resDataLines[i].indexOf(":")+1,resDataLines[i].length);
                                $('#epipolarPreview span').text(outputString);
                            }
                        }
                    }); // end read file
                } // end null err
                else{
                    console.log("error: could not open the log file " + logName);
                }
            }); // end stat
            fs.stat(errorName, function(err, stat) {
                if(err == null) {
                    fs.readFile(errorName, 'utf8', function (err,dataS) {
                         if (err) {
                              return console.log(err);
                         }
                        resDataLines = dataS.toString().split(/\r?\n/);
                        console.log(resDataLines);
                        numActiveImages = $('#selectable li').length;
                        $('#selectable li').each(function() {
                            if ($(this).hasClass("ui-selected")){
                                //numActiveImages--;
                                $('.error-span').html('');
                            }
                        })
                        if(numActiveImages==resDataLines.length-1){
                            // remove all the exiting error notes
                            $('.error-span').html('');
                            //lineIndex = 0;
                            $('#selectable li').each(function() {
                                // skip deactivated images
                                if (!$(this).hasClass("ui-selected")){
                                    // update the string in each list item for the images
                                    $(this).append('<span class="error-span" style="float:right;">'+resDataLines[$(this).index()]+'<\span>');
                                    //lineIndex++;
                                }
                            })
                        }
                        else{
                            console.log('could not update image errors ' + numActiveImages + ' ' + resDataLines.length);
                        }
                    }); // end read cal_error.txt file
                } // end null err
                else{
                    console.log("could not open the cal error file " + errorName);
                }
            }); // end stat
        } // end else
    });
}
