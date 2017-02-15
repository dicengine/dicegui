$(window).load(function(){
  workingDirectory = localStorage.getItem("workingDirectory");
  $("#calibrateButton").prop("disabled",true);
});
               
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
    }
    else if($(this).val()=="vic3d"){
        $("#boardImage").attr("src","./images/MarkerCalExample.png");
        $("#patternNote").show();
    }
});

$("#changeImageFolder").click(function(){
    var path =  dialog.showOpenDialog({defaultPath: workingDirectory, properties: ['openDirectory']});
    if(path){
        $('#imageFolder span').text(path[0]);
        updateImageSequencePreview();
    }
});

$("#imagePrefix,#startIndex,#numDigits,#imageExtension,#stereoLeftSuffix,#stereoRightSuffix").on('keyup',function(){
    updateImageSequencePreview();
});


function concatImageSequenceName(){
    var fullImageName = "";
    $('#imageSequencePreview span').text('');    
    fullImageName = $("#imageFolderSpan").text();
    if(os.platform()=='win32'){
        fullImageName += '\\';
    }else{
        fullImageName += '/';
    }
    fullImageName += $("#imagePrefix").val();
    // get the number of digits in the ref index
    var tmpNum = Number($("#startIndex").val());
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
    fullImageName += $("#startIndex").val();
    fullImageName += $("#stereoLeftSuffix").val();                                                       
    fullImageName += $("#imageExtension").val();
    return fullImageName;
}


function updateImageSequencePreview(){
    var fullImageName = concatImageSequenceName();
    $('#imageSequencePreview span').text(fullImageName);

    // see if the file exists:
    fs.stat(fullImageName, function(err, stat) {
        if(err == null) {
            $("#imageSequencePreview").css({color:"#009933"})
            $("#calibrateButton").prop("disabled",false);
        }
        else{
            $("#imageSequencePreview").css({color:"#ff0000"})            
            $("#calibrateButton").prop("disabled",true);
        }
    });
}

$("#calibrateButton").on('click',function(){
    writeInputFile(); 
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
    content += '<Parameter name="cal_target_spacing_size" type="double" value="'+$("#targetSpacingSize").val()+'"/>\n';
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
    proc.on('close', (code) => {
        console.log(`cal process exited with code ${code}`);
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
