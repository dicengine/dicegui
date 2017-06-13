$(window).load(function(){
    workingDirectory = localStorage.getItem("workingDirectory"); 
    localStorage.setItem("calFileName","");
    $("#calibrateButton").prop("disabled",true);
    $("#acceptButton").prop("disabled",true);
    $("#cancelButton").hide();

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

    // .load the images if they exist
    refreshCalDisplayImages();

    // detect a change to any of the image files and update display
    fs.watchFile(fullPath('','.cal_left.png'), (curr, prev) => {
        refreshCalDisplayImages();
    });
});

$( "#selectable" ).selectable();

$("#calFrameScroller").change(function(){
    $("#frameCurrentPreviewSpan").text($(this).val());
});

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
        $("#patternNote").hide();
        $("#binaryThresh").val(30);
        $("#binaryLabel").text($("#binaryThresh").val());
    }
    else if($(this).val()=="vic3d"){
        $("#boardImage").attr("src","./images/MarkerCalExample.png");
        $("#patternNote").show();
        $("#binaryThresh").val(30);
        $("#binaryLabel").text($("#binaryThresh").val());
    }
    else if($(this).val()=="vic3dDark"){
        $("#boardImage").attr("src","./images/DarkMarkerCalExample.png");
        $("#patternNote").show();
        $("#binaryThresh").val(100);
        $("#binaryLabel").text($("#binaryThresh").val());
    }
});

function updateSequenceLabels(stats){
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
   
}

$("#changeImageFolder").on("click",function () {
    this.value = null;
});

$("#changeImageFolder").click(function(){
    var path =  dialog.showOpenDialog({defaultPath: workingDirectory, properties: ['openDirectory']});
    if(path){
        autoDetectImageSequence(path[0],updateSequenceLabels);
        $('#imageFolder span').text(path[0]);    
    }
});

$("#imagePrefix,#startIndex,#endIndex,#skipIndex,#numDigits,#imageExtension,#stereoLeftSuffix,#stereoRightSuffix").on('keyup',function(){
    updateImageSequencePreview();
    updateSelectableList();
});

$("#binaryThresh").on('input',function(){
    $("#binaryLabel").text($(this).val());
});

function concatImageSequenceName(frame){
    var fullImageName = "";
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
    fullImageName += $("#stereoLeftSuffix").val();                                                       
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
    for(i=si;i<=ei;i+=step){
        fileName = concatImageSequenceName(i);
        // strip off everything before the last slash or backslash
        fileName = fileName.split(/[\\\/]/).pop();
        $("#selectable").append('<li class="ui-widget-content">'+fileName+'</li>');
    }
}

function updateImageSequencePreview(){
    var fullImageName = concatImageSequenceName();
    $('#imageSequencePreview span').text(fullImageName);

    // see if the file exists:
    fs.stat(fullImageName, function(err, stat) {
        if(err == null) {
            $("#imageSequencePreview").css({color:"#009933"})
            $("#calibrateButton").prop("disabled",false);
            $("#cancelButton").show();
        }
        else{
            $("#imageSequencePreview").css({color:"#ff0000"})            
            $("#calibrateButton").prop("disabled",true);
            $("#acceptButton").prop("disabled",true);
        }
    });
}

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
    content += '<Parameter name="cal_target_width" type="int" value="'+$("#calWidth").val()+'"/>\n';
    content += '<Parameter name="cal_target_height" type="int" value="'+$("#calHeight").val()+'"/>\n';
    if($("#calMode").val()=="checkerboard")
        content += '<Parameter name="cal_mode" type="int" value="0"/>\n';
    else if($("#calMode").val()=="vic3d")
        content += '<Parameter name="cal_mode" type="int" value="1"/>\n';
    else if($("#calMode").val()=="vic3dDark"){
        content += '<Parameter name="cal_mode" type="int" value="2"/>\n';
    }
    content += '<Parameter name="cal_target_spacing_size" type="double" value="'+$("#targetSpacingSize").val()+'"/>\n';
    content += '<Parameter name="cal_binary_threshold" type="int" value="'+$("#binaryThresh").val()+'"/>\n';
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
    var fileName = workingDirectory;
    var logName = workingDirectory;
    var outName = workingDirectory;
    if(os.platform()=='win32'){
        fileName += '\\';
        logName += '\\';
        outName += '\\';
    }else{
        fileName += '/';
        logName += '/';
        outName += '/';
    }
    fileName += 'cal_input.xml';
    logName += 'cal.log';
    outName += 'cal.txt';
    console.log('running ' + execCalPath +' with input file: ' + fileName);
    var child_process = require('child_process');
    var readline      = require('readline');
    var logStream = fs.createWriteStream(logName, {flags: 'w'});
    var proc = child_process.execFile(execCalPath, [fileName,outName],{cwd:workingDirectory});
    proc.stdout.pipe(logStream);
    proc.stderr.pipe(logStream);
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        //console.log(line);                                                                                          
        console.log(line);    
    });
    $("#cancelButton").on('click',function(){
        proc.kill(); 
    });
    proc.on('close', (code) => {
        console.log(`cal process exited with code ${code}`);
        $("#acceptButton").prop("disabled",false);
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
        } // end else
    });
}
