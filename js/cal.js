$(window).load(function(){
    workingDirectory = localStorage.getItem("workingDirectory"); 
    localStorage.setItem("calFileName","");
    $("#calibrateButton").prop("disabled",true);
    $("#acceptButton").prop("disabled",true);
    $("#cancelButton").hide();
    $('.board-size').hide();

    console.log('useTrinoc is ' + localStorage.getItem("useTrinoc"));
    if(localStorage.getItem("useTrinoc")=='true'){
        $( '.trinocOption' ).show();
        $('#leftPreviewToggle').css('width','32%');        
        $('#rightPreviewToggle').css('width','32%');        
    }
    else{
        $( '.trinocOption' ).hide();
        $('#leftPreviewToggle').css('width','48.5%');        
        $('#rightPreviewToggle').css('width','48.5%');        
    }
    $("#calThreshP").hide();
    $("#calThreshConstant").hide();
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

$("#calThreshConstant").on('input',function(){
    $("#calThreshConstantLabel").text($(this).val());
});
$("#calAdaptiveThreshConstant").on('input',function(){
    $("#calAdaptiveThreshConstantLabel").text($(this).val());
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
        $("#boardImage").attr("src","./images/CheckerboardExample.png");
        $("#binaryThresh").val(30);
        $("#binaryLabel").text($("#binaryThresh").val());
        $('.board-size').show();
    }
    else if($(this).val()=="vic3d"){
        $("#boardImage").attr("src","./images/MarkerCalExample.png");
        $("#binaryThresh").val(30);
        $("#binaryLabel").text($("#binaryThresh").val());
        $('.board-size').hide();
    }
    else if($(this).val()=="vic3dDark"){
        $("#boardImage").attr("src","./images/DarkMarkerCalExample.png");
        $("#binaryThresh").val(100);
        $("#binaryLabel").text($("#binaryThresh").val());
        $('.board-size').hide();
    }
});

function previewCalImages(){
    // set up the arguments for the OpenCVServer
    var args = [];
    // create the list of files:
    var leftName = concatImageSequenceName($("#calFrameScroller").val(),0);
    console.log('leftName ' + leftName);
    args.push(leftName);
    args.push('.cal_left.png');
    
    var rightName = concatImageSequenceName($("#calFrameScroller").val(),1);
    console.log('rightName ' + rightName);
    args.push(rightName);
    args.push('.cal_right.png');
    if(localStorage.getItem("useTrinoc")=='true'){
        var middleName = concatImageSequenceName($("#calFrameScroller").val(),2);
        console.log('middleName ' + middleName);
        args.push(middleName);
        args.push('.cal_middle.png');
    }
    if($("#previewThreshCheck")[0].checked)
        args.push('Filter:PreviewThreshold');
    var thresh = 0;
    if($("#adaptiveThreshCheck")[0].checked){
        args.push('Filter:AdaptiveThreshold');
        thresh = $("#calAdaptiveThreshConstant").val();
    }
    else{
        thresh = $("#calThreshConstant").val();
    }
    args.push('Filter:CalPreview');
    if($("#calMode").val()=="checkerboard"){
    args.push('Filter:BoardSize');
        args.push($("#calWidth").val());
        args.push($("#calHeight").val());
    }
    args.push('Filter:PatternSpacing');
    args.push($("#targetSpacingSize").val());
    args.push('Filter:BinaryThreshold');
    args.push(1); // 0 is gaussian 1 is mean
    args.push(75); // block size
    args.push(thresh); // threshold constant
    if($("#calMode").val()=="vic3dDark"){
        args.push(1.0); // invert the colors for the dark pattern
    }else{
        args.push(0); // otherwise, do not invert
    }
    args.push('Filter:Blob');
    args.push(0); // use area filter
    args.push(50); // min area
    args.push(200); // max area
    args.push(0); // use circularity
    args.push(0.75); // circ min
    args.push(1.0); // circ max
    args.push(0); // eccentricity filter
    args.push(0.0); // ecc min
    args.push(1.0); // ecc max
    args.push(0); // convexity
    args.push(0.0); // convexity min
    args.push(1.0); // convexity max
    // call the filter exec
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc = child_process.spawn(execOpenCVServerPath,args,{cwd:workingDirectory});//,maxBuffer:1024*1024});
    proc.on('error', function(){
        alert('DICe OpenCVServer failed: invalid executable: ' + execOpenCVServerPath);
    });
    proc.on('close', (code) => {
        console.log(`OpenCVServer exited with code ${code}`);
        if(code==0){
            refreshCalDisplayImages();
            $("#leftPreviewBody").css('border', '3px solid #00cc00');
            $("#rightPreviewBody").css('border', '3px solid #00cc00');
            $("#middlePreviewBody").css('border', '3px solid #00cc00');
            $("#previewLeftSpan").text("");
            $("#previewRightSpan").text("");
            $("#previewMiddleSpan").text("");
        }else{
            if(code>=2&&code<=8){
                refreshCalDisplayImages();
                if(code==2||code==4||code==6||code==8){
                    $("#leftPreviewBody").css('border', '3px solid red');
                    $("#previewLeftSpan").text("error finding cal dots");
                }
                if(code==3||code==5||code==7){
                    $("#leftPreviewBody").css('border', '3px solid #00cc00');
                    $("#previewLeftSpan").text("");
                }
                if(code==3||code==4||code==7||code==8){
                    $("#rightPreviewBody").css('border', '3px solid red');
                    $("#previewRightSpan").text("error finding cal dots");
                }
                if(code==2||code==5||code==6){
                    $("#rightPreviewBody").css('border', '3px solid #00cc00');
                    $("#previewRightSpan").text("");
                }
                if(code==5||code==6||code==7||code==8){
                    $("#middlePreviewBody").css('border', '3px solid red');
                    $("#previewMiddleSpan").text("error finding cal dots");
                }
                if(code==2||code==3||code==4){
                    $("#middlePreviewBody").css('border', '3px solid #00cc00');
                    $("#previewMiddleSpan").text("");
                }
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
            }else if(code==9){
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
    $("#imagePrefix").val(stats.prefix);
    $("#startIndex").val(stats.startIndex);
    $("#endIndex").val(stats.endIndex);
    $("#skipIndex").val(stats.frameInterval);
    $("#numDigits").val(stats.numDigits);
    $("#stereoLeftSuffix").val(stats.leftSuffix);
    $("#stereoRightSuffix").val(stats.rightSuffix);
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

    previewCalImages();
}

$("#changeImageFolder").on("click",function () {
    this.value = null;
});



$("#changeImageFolder").click(function(){
    var path =  dialog.showOpenDialog({defaultPath: workingDirectory, properties: ['openDirectory']});
    if(path){
        autoDetectImageSequence(path[0],updateCalSequenceLabels);
        $('#imageFolder span').text(path[0]);    
    }
});

$("#imagePrefix,#startIndex,#endIndex,#skipIndex,#numDigits,#imageExtension,#stereoLeftSuffix,#stereoRightSuffix").on('keyup',function(){
    $("#calFrameScroller").val($("#startIndex").val());
    $("#calFrameScroller").attr('min',$("#startIndex").val());
    $("#calFrameScroller").attr('max',$("#endIndex").val());
    $("#calFrameScroller").attr('step',$("#skipIndex").val());
    $("#frameStartPreviewSpan").text($("#startIndex").val());
    $("#frameCurrentPreviewSpan").text($("#startIndex").val());
    $("#frameEndPreviewSpan").text($("#endIndex").val());
    updateImageSequencePreview(updateSelectableList);
});

$("#binaryThresh").on('input',function(){
    $("#binaryLabel").text($(this).val());
});

function concatImageSequenceName(frame,mode){
    var fullImageName = "";
    mode = mode || 0;
    if(!arguments.length)
        $('#imageSequencePreview span').text('');    
    fullImageName = $("#imageFolderSpan").text();
    if(os.platform()=='win32'){
        fullImageName += '\\';
    }else{
        fullImageName += '/';
    }
    fullImageName += $("#imagePrefix").val();
    // get the number of digits in the ref index
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
    if(mode==0)
      fullImageName += $("#stereoLeftSuffix").val();                                                       
    else if(mode==1)
      fullImageName += $("#stereoRightSuffix").val();                                                       
    else if(mode==2)
      fullImageName += $("#stereoMiddleSuffix").val();                                                       
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
        fileName = concatImageSequenceName(i);
        // strip off everything before the last slash or backslash
        fileName = fileName.split(/[\\\/]/).pop();
        $("#selectable").append('<li style="display:block;" id="calListItem_'+index+'" class="ui-widget-content"><span style="float:left;">'+fileName+'</span></li>');
        index++;
    }
}

function updateImageSequencePreview(cb){
    var fullImageName = concatImageSequenceName();
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

$("#previewThreshCheck,#calAdaptiveThreshConstant,#calThreshConstant").change(function() {
        previewCalImages();
});

$("#adaptiveThreshCheck").change(function() {
    if(this.checked) {
        $("#calThreshP").hide();
        $("#calThreshConstant").hide();
        $("#calAdaptiveThreshP").show();
        $("#calAdaptiveThreshConstant").show();
    }else{
        $("#calThreshP").show();
        $("#calThreshConstant").show();
        $("#calAdaptiveThreshP").hide();
        $("#calAdaptiveThreshConstant").hide();        
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
    outName += 'cal.txt';
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
    content += '<Parameter name="image_folder" type="string" value="'+folderName +'" />\n';
    content += '<Parameter name="reference_image_index" type="int" value="'+$("#startIndex").val()+'" />\n';
    content += '<Parameter name="start_image_index" type="int" value="'+$("#startIndex").val()+'" />\n';
    content += '<Parameter name="end_image_index" type="int" value="'+$("#endIndex").val()+'" />\n';
    content += '<Parameter name="skip_image_index" type="int" value="'+$("#skipIndex").val()+'" />\n';
    content += '<Parameter name="num_file_suffix_digits" type="int" value="'+$("#numDigits").val()+'" />\n';
    content += '<Parameter name="image_file_extension" type="string" value="'+$("#imageExtension").val()+'" />\n';
    content += '<Parameter name="image_file_prefix" type="string" value="'+$("#imagePrefix").val()+'" />\n';
    content += '<Parameter name="stereo_left_suffix" type="string" value="'+$("#stereoLeftSuffix").val()+'"/>\n';
    content += '<Parameter name="stereo_right_suffix" type="string" value="'+$("#stereoRightSuffix").val()+'"/>\n';
    content += '<Parameter name="cal_target_has_adaptive" type="bool" value="';
    var thresh = 0;
    if($("#adaptiveThreshCheck")[0].checked){
        content += 'true';
        thresh = $("#calAdaptiveThreshConstant").val();
    }
    else{
        content += 'false';
        thresh = $("#calThreshConstant").val();
    }
    content += '"/>\n';    
    content += '<Parameter name="cal_target_binary_constant" type="double" value="'+thresh+'"/>\n';
    content += '<Parameter name="cal_target_block_size" type="double" value="75"/>\n'; // for now this is fixed
    content += '<Parameter name="cal_target_is_inverted" type="bool" value="';
    if($("#calMode").val()=="vic3dDark"){
        content += 'true';
    }
    else{
        content += 'false';
    }
    content += '"/>\n';
    if($("#calMode").val()=="checkerboard"){
        content += '<Parameter name="cal_mode" type="int" value="0"/>\n';
        content += '<Parameter name="cal_target_width" type="int" value="'+$("#calWidth").val()+'"/>\n';
        content += '<Parameter name="cal_target_height" type="int" value="'+$("#calHeight").val()+'"/>\n';
    }
    else if($("#calMode").val()=="vic3d")
        content += '<Parameter name="cal_mode" type="int" value="1"/>\n';
    else if($("#calMode").val()=="vic3dDark"){
        content += '<Parameter name="cal_mode" type="int" value="2"/>\n';
    }
    content += '<Parameter name="cal_target_spacing_size" type="double" value="'+$("#targetSpacingSize").val()+'"/>\n';
    // turn off any images that have been manually turned off

    var hasManualOffs = false;
    $('#selectable .ui-selected').each(function() {
        if(!hasManualOffs){
            content += '<ParameterList name="cal_manual_skip_images">\n';
        }
        // convert the list id to an index and add it to the params
        content += '<Parameter name="skip_'+$(this).attr('id').split('_').pop()+'" type="bool" value="true"/>\n';
        hasManualOffs = true;
    })
    if(hasManualOffs){
        content += '</ParameterList>\n';
    }
    content += '</ParameterList>\n';
    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message);
            return;
         }
        console.log('cal_input.xml file has been successfully saved');
        callCalExec();
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
    outName += 'cal.txt';
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
                            if(resDataLines[i].includes("RMS error=")){
                                var outputString = resDataLines[i].substring(resDataLines[i].indexOf("=")+1,resDataLines[i].length);
                                $('#rmsPreview span').text(outputString);
                            }
                            else if(resDataLines[i].includes("epipolar")){
                                var outputString = resDataLines[i].substring(resDataLines[i].indexOf("=")+1,resDataLines[i].length);
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
                        var resDataLines = dataS.toString().split(/\r?\n/);
                        console.log(resDataLines);
                        var numImages = $('#selectable li').length;
                        if(numImages==resDataLines.length-1){
                            // remove all the exiting error notes
                            $('.error-span').html('');
                            var lineIndex = 0;
                            $('#selectable li').each(function() {
                                // update the string in each list item for the images
                                $(this).append('<span class="error-span" style="float:right;">'+resDataLines[lineIndex]+'<\span>');
                                lineIndex++;
                             })
                        }
                        else{
                            console.log('could not update image errors ' + numImages + ' ' + resDataLines.length);
                        }
                    }); // end read cal_error.txt file
                } // end null err
                else{
                    console.log("error: could not open the cal error file " + errorName);
                }
            }); // end stat
        } // end else
    });
}
