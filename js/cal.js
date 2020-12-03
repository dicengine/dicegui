$(window).load(function(){
    workingDirectory = localStorage.getItem("workingDirectory"); 
    localStorage.setItem("calFileName","");
    calFixIntrinsic = "false";
    calUseIntrinsic = "true";
    calUseExtrinsic = "false";
    calFixPrincipal = "false";
    calFixAspect = "false";
    calSameFocalLength = "false";
    calZeroTangentDist = "true";
    calFixK1 ="false";
    calFixK2 = "false";
    calFixK3 = "false";
    execCalPath = localStorage.getItem("execCalPath");
    execCineStatPath = localStorage.getItem("execCineStatPath");
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

    deleteCalDisplayImageFiles();
    
    // see if there is a cal_target.xml file in the working directory, if so, load it:
    targetFile = fullPath('','cal_target.xml');
    fs.stat(targetFile, function(err, stat) {
        if(err == null) {
            parse_target_xml_file(targetFile);
        }
    });
});

hiddenDir = localStorage.getItem("workingDirectory");
if(os.platform()=='win32'){
    hiddenDir+="\\.dice";
}else{
    hiddenDir+="/.dice";
}

fs.watch(hiddenDir, (eventType, filename) => {
    if($("#cancelButton").is(":hidden"))
        return;
    if(filename==".preview_cal_left.png"){
        updatePreview(filename,'cal_left');
//        $("#leftPreviewBody").css('border', '');
    }
    if(filename==".preview_cal_right.png"){
        updatePreview(filename,'cal_right');
//        $("#rightPreviewBody").css('border', '');
    }
})

$("#calFileSelectMode").on('change',function (){
    if($(this).val()=="sequence"){
        if(localStorage.getItem("showStereoPane")!=0){
            $(".stereoPrefix").show();
        }
        $(".sequence-input").show();
        $(".cine-input").hide();
        calFixIntrinsic = "false";
        calUseIntrinsic = "true";
        calUseExtrinsic = "false";
        calFixPrincipal = "false";
        calFixAspect = "false";
        calSameFocalLength = "false";
        calZeroTangentDist = "true";
        calFixK1 ="false";
        calFixK2 = "false";
        calFixK3 = "false";
    }
    else if($(this).val()=="cine"){
        $(".sequence-input").hide();
        $(".cine-input").show();
        calFixIntrinsic = "false";
        calUseIntrinsic = "true";
        calUseExtrinsic = "false";
        calFixPrincipal = "true";
        calFixAspect = "false";
        calSameFocalLength = "false";
        calZeroTangentDist = "true";
        calFixK1 ="true";
        calFixK2 = "true";
        calFixK3 = "true";
    }
    if(localStorage.getItem("showStereoPane")==0){
        $(".stereoOption").hide();
    }else{
        $(".stereoOption").show();
    }
});


$("#calSaveTargetButton").on("click",function () {
    targetFile = fullPath('','cal_target.xml');
    console.log('writing target file ' + targetFile);
    content = '';
    content += '<!-- Calibration target definition file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    content += '<Parameter name="xml_file_format" type="string" value="DICe_xml_cal_target_definition_file" />\n';
    content += '<Parameter name="total_pattern_width" type="int" value="'+ $("#calWidth").val() +'" />\n';
    content += '<Parameter name="total_pattern_height" type="int" value="'+ $("#calHeight").val() +'" />\n';
    content += '<Parameter name="inner_pattern_width" type="int" value="'+ $("#calInnerWidth").val() +'" />\n';
    content += '<Parameter name="inner_pattern_height" type="int" value="'+ $("#calInnerHeight").val() +'" />\n';
    content += '<Parameter name="origin_offset_x" type="int" value="'+ $("#calOriginX").val() +'" />\n';
    content += '<Parameter name="origin_offset_y" type="int" value="'+ $("#calOriginY").val() +'" />\n';
    content += '<Parameter name="cal_target_spacing_size" type="double" value="'+$("#targetSpacingSize").val()+'"/>\n';
    if($("#calMode").val()=="checkerboard")
        content += '<Parameter name="cal_target_type" type="string" value="CHECKER_BOARD"/>\n';
    else if($("#calMode").val()=="vic3d")
        content += '<Parameter name="cal_target_type" type="string" value="BLACK_ON_WHITE_W_DONUT_DOTS"/>\n';
    else if($("#calMode").val()=="vic3dDark")
        content += '<Parameter name="cal_target_type" type="string" value="WHITE_ON_BLACK_W_DONUT_DOTS"/>\n';
    content += '</ParameterList>\n';
    fs.writeFile(targetFile, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the target definition file "+ err.message)
         }
        console.log('cal_target.xml file has been successfully saved');
    });
    alert('Cal pattern saved to file: ' + targetFile);
});

$("#calTargetInput").change(function (evt) {
    var tgt = evt.target || window.event.srcElement,
        file = tgt.files[0];
    if(file){
        fs.stat(file.path, function(err, stat) {
            if(err == null) {
                parse_target_xml_file(file.path);
            }
        });
    }
});

function parse_target_xml_file(filename){
    console.log("parsing target file " + filename);
    fs.stat(filename, function(err, stat) {
        if(err == null) {
            $.ajax({
                type: "GET",
                url: filename,
            dataType: "xml",
            success: function(xml) {
                    impl_target_xml_file(xml);
            }, // end success
            }); // end ajax
        }else{ // file doesn't exist
        }
    }); // end stat
}

function impl_target_xml_file(xml){
    file_format = xml_get(xml,"xml_file_format");
    console.log('file format: ' + file_format);
    if(file_format!="DICe_xml_cal_target_definition_file"){
        alert("Invalid calibration target definition xml file");
        return;
    }
    total_pattern_width = xml_get(xml,"total_pattern_width");
    console.log('total pattern width: ' + total_pattern_width);
    $("#calWidth").val(total_pattern_width);
    total_pattern_height = xml_get(xml,"total_pattern_height");
    console.log('total pattern height: ' + total_pattern_height);
    $("#calHeight").val(total_pattern_height);
    inner_pattern_width = xml_get(xml,"inner_pattern_width");
    console.log('inner pattern width: ' + inner_pattern_width);
    $("#calInnerWidth").val(inner_pattern_width);
    inner_pattern_height = xml_get(xml,"inner_pattern_height");
    console.log('inner pattern height: ' + inner_pattern_height);
    $("#calInnerHeight").val(inner_pattern_height);
    origin_offset_x = xml_get(xml,"origin_offset_x");
    console.log('origin offset x: ' + origin_offset_x);
    $("#calOriginX").val(origin_offset_x);
    origin_offset_y = xml_get(xml,"origin_offset_y");
    console.log('origin offset y: ' + origin_offset_y);
    $("#calOriginY").val(origin_offset_y);
    pattern_spacing = xml_get(xml,"cal_target_spacing_size");
    console.log('spacing_size: ' + pattern_spacing);
    $("#targetSpacingSize").val(pattern_spacing);
    target_type = xml_get(xml,"cal_target_type");
    console.log('target_type: ' + target_type);
    if(target_type=="CHECKER_BOARD")
        $("#calMode").val("checkerboard");
    else if(target_type=="BLACK_ON_WHITE_W_DONUT_DOTS")
        $("#calMode").val("vic3d");
    else if(target_type=="WHITE_ON_BLACK_W_DONUT_DOTS")
        $("#calMode").val("vic3dDark");
    else
        alert("Inavlid calibration target type");
    $("#calMode").trigger("change");
}

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
                    fs.stat($("#cineCalRightPreview span").text(), function(err2, stat) { // only update the preview if both cine files are defined
                        if(err2 == null) {
                            callCalCineStatExec(file.path,function(){updateSelectableList();updateCalPreview(true)});
                        }
                    });
                }else{
                    callCalCineStatExec(file.path,function(){updateSelectableList();updateCalPreview(true)});
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
                        callCalCineStatExec(file.path,function(){updateSelectableList();updateCalPreview(true)});
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

$( "#selectable").selectable();

$("#calFrameScroller").on('input', function () {
        $("#frameCurrentPreviewSpan").text($(this).val());
    }).change(function(){
    $("#frameCurrentPreviewSpan").text($(this).val());
    updateCalPreview();
});

function calConsoleMsg(string){
    $("#calConsoleWindow").append(string + '</br>');
    $("#calConsoleWindow").scrollTop($("#calConsoleWindow").get(0).scrollHeight);
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
                var statFileName = fullPath('.dice','.cine_stats.dat');
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

function updateCalPreview(firstLoad=false){
    console.log('updateCalPreview() called');

    // get the calibration preview arguments to pass to the openCVServer
    var args = [];
    if(firstLoad){
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
    } // end dot target

    var decObj = decorateFileNames();
    if($("#calFileSelectMode").val()=="cine"){
        $("#calibrateButton").prop("disabled",false);
    }
    console.log("updateCalPreview: left file " + decObj.decoratedLeft);
    console.log("updateCalPreview: right file " + decObj.decoratedRight);
    startProgress();
    updatePreview(decObj.decoratedLeft,'cal_left',[],args,"#calConsoleWindow",function (code) {respondToOpenCVErrorCode(code);});
    updatePreview(decObj.decoratedRight,'cal_right',[],args,"#calConsoleWindow",function (code) {respondToOpenCVErrorCode(code);});
}

function decorateFileNames(){
    var obj = {};
    obj.decoratedLeft = "";
    obj.decoratedRight = "";
    if($("#calFileSelectMode").val()=="cine"){
        var cineLeft = $("#cineCalLeftPreview span").text();
        var cineRight = $("#cineCalRightPreview span").text();
        var index = $("#calFrameScroller").val();
        obj.decoratedLeft = cineLeft.replace('.'+cineLeft.split('.').pop(),'_'+index+'.cine');
        obj.decoratedRight = cineRight.replace('.'+cineRight.split('.').pop(),'_'+index+'.cine');
        // enable the cal execute button since it wasn't enabled when the list of images was created
    }else{
        if(localStorage.getItem("showStereoPane")==0)
            obj.decoratedLeft = concatImageSequenceName($("#calFrameScroller").val(),3); // use mode 3 to avoid the stereo suffix
        else
            obj.decoratedLeft = concatImageSequenceName($("#calFrameScroller").val(),0);
        if(localStorage.getItem("showStereoPane")==1){
            obj.decoratedRight = concatImageSequenceName($("#calFrameScroller").val(),1);
        }
    }
    return obj;
}

function respondToOpenCVErrorCode(code){
    if(code==0){
        endProgress(true);
//        if(firstLoad){
//            $("#leftPreviewBody").css('border', '');
//            $("#rightPreviewBody").css('border', '');
//        }
//        else{
//            $("#leftPreviewBody").css('border', '3px solid #00cc00');
//            $("#rightPreviewBody").css('border', '3px solid #00cc00');
//        }
        $("#previewLeftSpan").text("");
        $("#previewRightSpan").text("");
    }else{
//        $("#leftPreviewBody").css('border', '3px solid red');
//        $("#rightPreviewBody").css('border', '3px solid red');
        $("#previewLeftSpan").text("");
        $("#previewRightSpan").text("");
        endProgress(false);
        if(code==1||code==2||code==3){
            // remove border on preview windows
//            updatePreview(decObj.decoratedLeft,'cal_left');
//            updatePreview(decObj.decoratedRight,'cal_right');
            $("#previewLeftSpan").text("marker location failed");
            $("#previewRightSpan").text("marker location failed");
        }else if(code==4){
            // clear the preview images
            updatePreview('','cal_left');
            updatePreview('','cal_right');
            $("#previewLeftSpan").text("image load failure");
            $("#previewRightSpan").text("image load failure");
        }else{
            // reset the preview images
            var decObj = decorateFileNames();
            updatePreview(decObj.decoratedLeft,'cal_left');
            updatePreview(decObj.decoratedRight,'cal_right');
            $("#previewLeftSpan").text("preview failure (try adjusting threshold)");
            $("#previewRightSpan").text("preview failure (try adjusting threshold)");
        }
    }
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

    updateCalPreview(true);
}

$("#changeImageFolder").on("click",function () {
    this.value = null;
});

$("#previewCal").on("click",function () {
    updateCalPreview();
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
        invalid = false;
        if(Number($("#startIndex").val())>Number($("#endIndex").val())){
            invalid = true;
        }else if(Number($("#endIndex").val())<Number($("#startIndex").val())){
            invalid = true;
        }else if(Number($("#endIndex").val())>Number($("#cineCalEndSpan").text())){
            invalid = true;
        }else if(Number($("#startIndex").val())<Number($("#cineCalStartSpan").text())){
            invalid = true;
        }
        if(invalid){
            $("#startIndex").val(Number($("#cineCalStartSpan").text()));
            $("#endIndex").val(Number($("#cineCalEndSpan").text()));
        }
    }
    $("#calFrameScroller").attr('min',$("#startIndex").val());
    $("#calFrameScroller").attr('max',$("#endIndex").val());
    $("#calFrameScroller").attr('step',$("#skipIndex").val());
    $("#frameStartPreviewSpan").text($("#startIndex").val());
    $("#frameCurrentPreviewSpan").text($("#startIndex").val());
    $("#frameEndPreviewSpan").text($("#endIndex").val());
    $("#calFrameScroller").val($("#startIndex").val());
}

$("#startIndex,#endIndex,#skipIndex").on('focusout',function(e){
    updateFrameScroller();
    updateImageSequencePreview(function(){updateSelectableList;updateCalPreview(true)});
});

$("#imagePrefix,#startIndex,#endIndex,#skipIndex,#numDigits,#imageExtension,#stereoLeftSuffix,#stereoRightSuffix").keypress(function(e){
    if(e.which!=13) return;
    updateFrameScroller();
    updateImageSequencePreview(function(){updateSelectableList;updateCalPreview(true)});
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
    }
    fullImageName += $("#imageExtension").val();
    return fullImageName;
}

$("#calOptionsButton").click(function () {
    localStorage.setItem("workingDirectory",workingDirectory);
    localStorage.setItem("calFixIntrinsic",calFixIntrinsic);
    localStorage.setItem("calUseIntrinsic",calUseIntrinsic);
    localStorage.setItem("calUseExtrinsic",calUseExtrinsic);
    localStorage.setItem("calFixPrincipal",calFixPrincipal);
    localStorage.setItem("calFixAspect",calFixAspect);
    localStorage.setItem("calSameFocalLength",calSameFocalLength);
    localStorage.setItem("calZeroTangentDist",calZeroTangentDist);
    localStorage.setItem("calFixK1",calFixK1);
    localStorage.setItem("calFixK2",calFixK2);
    localStorage.setItem("calFixK3",calFixK3);
    var win = new BrowserWindow({ webPreferences: {
		nodeIntegration: true
	    },width: 500, height: 650});
    win.on('closed', () => {
        calFixIntrinsic = localStorage["calFixIntrinsic"];
        calUseIntrinsic = localStorage["calUseIntrinsic"];
        calUseExtrinsic = localStorage["calUseExtrinsic"];
        calFixPrincipal = localStorage["calFixPrincipal"];
        calFixAspect = localStorage["calFixAspect"];
        calSameFocalLength = localStorage["calSameFocalLength"];
        calZeroTangentDist = localStorage["calZeroTangentDist"];
        calFixK1 = localStorage["calFixK1"];
        calFixK2 = localStorage["calFixK2"];
        calFixK3 = localStorage["calFixK3"];
        console.log("calibration options set to \n"
                + "fix intrinsic " + calFixIntrinsic + "\n"
                + "use intrinsic " + calUseIntrinsic + "\n"
                + "use extrinsic  " + calUseExtrinsic + "\n"
                + "fix principal  " + calFixPrincipal + "\n"
                + "fix aspect " + calFixAspect + "\n"
                + "same focal " + calSameFocalLength + "\n"
                + "zero tangent " + calZeroTangentDist + "\n"
                + "fix K1 " + calFixK1 + "\n"
                + "fix K2 " + calFixK2 + "\n"
                + "fix K3 " + calFixK3 + "\n");
        win = null
    })
    win.loadURL('file://' + __dirname + '/cal_options.html');
    //win.webContents.openDevTools()
});

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
        fileName = "";
        if($("#calFileSelectMode").val()=="cine"){
            fileName = "frame_" + i;
        }else{
            if(localStorage.getItem("showStereoPane")==1||localStorage.getItem("showStereoPane")==2)
                fileName = concatImageSequenceName(i);
            else
                fileName = concatImageSequenceName(i,3);
            // strip off everything before the last slash or backslash
            fileName = fileName.split(/[\\\/]/).pop();
        }
        $("#selectable").append('<li style="display:block;" id="calListItem_'+index+'" class="ui-widget-content"><span style="float:left;">'+fileName+'</span></li>');
        index++;
    }
}

function updateImageSequencePreview(cb){
    var fullImageName='';
    
    if($("#calFileSelectMode").val()=="cine"){
        $("#calibrateButton").prop("disabled",false);
        updateSelectableList();
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
            pose_index = Number($("#imagePoseIndex").val()) - Number($("#startIndex").val());
            content += '<Parameter name="pose_estimation_index" type="int" value="'+pose_index+'" />\n';
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
    content += '<Parameter name="draw_intersection_image" type="bool" value="true"/>\n';
    outName = localStorage.getItem("workingDirectory");
    if(os.platform()=='win32'){
        outName += '\\';
    }else{
        outName += '/';
    }
    content += '<Parameter name="cal_debug_folder" type="string" value="' + outName + '"/>\n';
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
    content += '<ParameterList name="cal_opencv_options">\n';
      content += '<Parameter name="CALIB_FIX_INTRINSIC" type="bool" value="'+calFixIntrinsic+'"/>\n';
      content += '<Parameter name="CALIB_USE_INTRINSIC" type="bool" value="'+calUseIntrinsic+'"/>\n';
      content += '<Parameter name="CALIB_USE_EXTRINSIC" type="bool" value="'+calUseExtrinsic+'"/>\n';
      content += '<Parameter name="CALIB_FIX_PRINCIPAL_POINT" type="bool" value="'+calFixPrincipal+'"/>\n';
      content += '<Parameter name="CALIB_FIX_ASPECT_RATIO" type="bool" value="'+calFixAspect+'"/>\n';
      content += '<Parameter name="CALIB_SAME_FOCAL_LENGTH" type="bool" value="'+calSameFocalLength+'"/>\n';
      content += '<Parameter name="CALIB_ZERO_TANGENT_DIST" type="bool" value="'+calZeroTangentDist+'"/>\n';
      content += '<Parameter name="CALIB_FIX_K1" type="bool" value="'+calFixK1+'"/>\n';
      content += '<Parameter name="CALIB_FIX_K2" type="bool" value="'+calFixK2+'"/>\n';
      content += '<Parameter name="CALIB_FIX_K3" type="bool" value="'+calFixK3+'"/>\n';
    content += '</ParameterList>\n';
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
        calLog = "";
        calErrors = "";
        if(os.platform()=='win32'){
            calLog += '\\.dice\\cal.log';
            calErrors += '\\.dice\\cal_errors.txt';
         }else{
             calLog += '/.dice/cal.log';
             calErrors += '/.dice/cal_errors.txt';
         }
        deleteFileIfExists(calLog,function(){deleteFileIfExists(calErrors,callCalExec())});
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
        logName += '\\.dice\\';
        outName += '\\';
        errorName += '\\.dice\\';
    }else{
        fileName += '/';
        logName += '/.dice/';
        outName += '/';
        errorName += '/.dice/';
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
                                var outputString = resDataLines[i].substring(resDataLines[i].lastIndexOf(":")+1,resDataLines[i].length);
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

function deleteCalDisplayImageFiles(cb){
    var cbCalled = false;
    cb = cb || $.noop;
    filesToRemove = [];
    filesToRemove.push('.preview_cal_left.png');
    filesToRemove.push('.preview_cal_right.png');
    filesToRemove.push('cal.log');
    filesToRemove.push('cal_errors.txt');
    filesToRemove.push('.cine_stats.dat');
    console.log('removing any existing calibration files');
    hiddenDir = fullPath('.dice','');
    fs.readdir(hiddenDir, (err,dir) => {
        // es5
        // count up the number of potential files to delete
        numExistingFiles = 0;
        if(!dir)return;
        for(i=0; i<dir.length; i++) {
            for(j=0;j<filesToRemove.length;j++)
                if(dir[i].includes(filesToRemove[j]))
                    numExistingFiles++;
        }
        console.log(numExistingFiles + ' display image files exist');
        if(numExistingFiles==0){
            cb();
            return;
        }
        for(i=0; i<dir.length;i++) {
            (function(i) {
                filePath = dir[i];
                for(j=0;j<filesToRemove.length;j++){
                    if(filePath.includes(filesToRemove[j])){
                        numExistingFiles--;
                        console.log('attempting to delete file ' + filePath);
                        var fullFilePath = fullPath('.dice',filePath);
                        fs.stat(fullFilePath, function(err, stat) {
                            console.log('stat called on file ' + fullFilePath);
                            if(err == null) {
                                fs.unlink(fullFilePath, (err) => {
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
                }
            })(i);
        }
    });
}

