document.getElementById("runLi").onclick = function() {
   // check if any of the results files exist, if so warn user
    // see if the results folder exists:
    var fileName = fullPath('results','');
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            if (confirm('existing results files found in the working directory, overwrite?')) {
                // all the inpu file writes are chained via callbacks with the
                // last callback executing DICe
                startProgress();
                writeInputFile(false);
            }else{
                return false;
            }
        }
        // all the input file writes are chained via callbacks with the
        // last callback executing DICe
        startProgress();
        writeInputFile(false);
    });
};
document.getElementById("resolutionLi").onclick = function() {
    // check if there are existing results
    var fileName = fullPath('synthetic_results','spatial_resolution.txt');
    fs.stat(fileName, function(err, stat) {
        if(err == null) {            
            if (confirm('existing results found, click "OK" to plot these results or "Cancel" to recompute')) {
                localStorage.setItem("workingDirectory",workingDirectory);
                var win = new BrowserWindow({ width: 850, height: 1000 });
                win.on('closed', () => {
                    win = null
                })
                win.loadURL('file://' + __dirname + '/resolution.html');                
            }else{
                fs.unlink(fileName, (err) => {
                    if (err) throw err;
                    console.log('successfully deleted '+fileName);
                    startProgress();
                    writeInputFile(false,true);
                }) // end unlink                
            } // end else confirm
        } // end null
        else{ // files don't exist to run the analysis
            startProgress();
            writeInputFile(false,true);
        }
    }); // end stat
};

document.getElementById("sssigPreview").onclick = function() {
    if(refImagePathLeft=="undefined") return;
    else{
        startProgress();
        writeInputFile(false,false,true);
    }
};


document.getElementById("writeLi").onclick = function() {
    writeInputFile(true);
};

document.getElementById("previewCross").onclick = function() {
    callCrossInitExec();
}
document.getElementById("clearCross").onclick = function() {
    var fileName = fullPath('','projection_points.dat');
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            if (confirm('delete nonlinear warp seed file ' + fileName +'?')) {
                fs.unlink(fileName, (err) => {
                    if (err) throw err;
                    console.log('successfully deleted '+fileName);
                });
                updateResultsFilesList();
            }else{
                return false;
            }
        }
    });
}
function callDICeExec(resolution,ss_locs) {

    var inputFile = fullPath('','input.xml');
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc;
    if(ss_locs)
        proc = child_process.execFile(execPath, ['-i',inputFile,'-v','-t','--ss_locs'],{cwd:workingDirectory});
    else
        proc = child_process.execFile(execPath, ['-i',inputFile,'-v','-t'],{cwd:workingDirectory});
        
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {                
        //console.log(line);
        consoleMsg(line);
    });
    
//    proc.stderr.on('data', (data) => {
//        console.log(`stderr: ${data}`);
//        alert('DICe execution failed (see console for details)');
//    });

    proc.on('error', function(){
        alert('DICe execution failed: invalid executable: ' + execPath);
        endProgress(false);
    });
    
    proc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        updateResultsFilesList();
        if(code!=0){
            alert('DICe execution failed (see console for details)');
            endProgress(false);
        }
        else{
            endProgress(true);
            if(resolution){
                localStorage.setItem("workingDirectory",workingDirectory);
                var win = new BrowserWindow({ width: 850, height: 1000 });
                win.on('closed', () => {
                    win = null
                })
                win.loadURL('file://' + __dirname + '/resolution.html');
                //win.webContents.openDevTools()
            }else if(ss_locs){
                drawDotsAndBoxesForSubsets();
            }else{
                showParaviewMsg();
            }
        }
    });    
}

function updateCineDisplayImage(fileName,index,left){
    var child_process = require('child_process');
    var readline      = require('readline');
    var tiffImageName = fullPath('','cine_to_tif');
    if(left)
        tiffImageName += '_left.tif';
    else
        tiffImageName += '_right.tif';
    consoleMsg("converting file " + fileName + " to .tif for display");
    var procConv = child_process.execFile(execCineToTiffPath, [fileName,index,index,tiffImageName],{cwd:workingDirectory})
        readline.createInterface({
            input     : procConv.stdout,
            terminal  : false
        }).on('line', function(line) {
            consoleMsg(line);
        });
        procConv.on('error', function(){
            alert('DICe .cine file converstion to .tiff failed: invalid executable: ' + execCineToTiffPath);
        });
        procConv.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if(code!=0){
                 alert('DICe .cine file conversion to .tiff failed');
            }
            else{
		if(left){
                    getFileObject(tiffImageName, function (fileObject) {
                        loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,true,"","");
                    });
                }else{
                    getFileObject(tiffImageName, function (fileObject) {
                        loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","");
                    });
                }
            }
        });
}


function callCineStatExec(file,left) {

    var child_process = require('child_process');
    var readline      = require('readline');
    var proc;

    var fileName = file.path;
    fs.stat(fileName, function(err, stat) {
        if(err != null) {
            alert("could not find .cine file: " + fileName);
            return false;
        }
        else{
            console.log("getting frame range of cine file: " + fileName);
            var proc = child_process.execFile(execCineStatPath, [fileName],{cwd:workingDirectory})
        }
        readline.createInterface({
            input     : proc.stdout,
            terminal  : false
        }).on('line', function(line) {                
            consoleMsg(line);
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
                             //alert(stats[0]);
                             //alert(stats[1]);
                             //alert(stats[2]);
                             // check that the two cine files have valid frame ranges
                             if($("#cineStartPreview span").text()!=""||$("#cineEndPreview span").text()!="")
                                 if($("#cineStartPreview span").text()!=stats[1]||$("#cineEndPreview span").text()!=stats[2]){
                                     alert("Error, left and right .cine files need to have matching frame ranges");
                                     return false;
                                 }
                             cineFirstFrame = stats[1];
                             $("#cineStartPreview span").text(stats[1]);
                             $("#cineEndPreview span").text(stats[2]);
                             if(left){
                                 $("#cineRefIndex").val(stats[1]);
                                 $("#cineStartIndex").val(stats[1]);
                                 $("#cineEndIndex").val(stats[2]);
                             }
                             // convert the cine to tiff
                             // always start with the ref index for the initial display
                             if(left){
                                 cinePathLeft = file.path;
                                 $("#cineLeftPreview span").text(file.name);
                             }
                             else{
                                 cinePathRight = file.path;
                                 $("#cineRightPreview span").text(file.name);
                             }
                             updateCineDisplayImage(fileName,"0",left);
                                 return true;
                         }); // end else                           
                    }
                });
            }
        }); // end proc.on    
    }); // end fileName fs.stat
}


function callCrossInitExec() {

    var child_process = require('child_process');
    var readline      = require('readline');
    var proc;

    // see if the projection_points.dat file exists:
    var fileName = fullPath('','projection_points.dat');
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            console.log("found nonlinear seed file: projection_points.dat in the execution directory, enabling nonlinear warp");
            proc = child_process.execFile(execCrossInitPath, [refImagePathLeft,refImagePathRight,'1'],{cwd:workingDirectory})
            startProgress();
        }
        else{
            console.log("nonlinear seed file projection_points.dat not found");
            proc = child_process.execFile(execCrossInitPath, [refImagePathLeft,refImagePathRight,'0'],{cwd:workingDirectory})
            startProgress();
        }
        readline.createInterface({
            input     : proc.stdout,
            terminal  : false
        }).on('line', function(line) {                
            consoleMsg(line);
        });
        proc.on('error', function(){
            alert('DICe cross correlation initialization failed: invalid executable: ' + execCrossInitPath);
            endProgress(false);
        });
        proc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            updateResultsFilesList();
            if(code!=0){
                alert('DICe cross correlation initialization failed (may need to seed a nonlinear warp for this image set)');
                endProgress(false);
             }
            else{
                endProgress(true);
                // loadpreview window ...
                openPreviewCross();
             }
        });    
    });
}

function showParaviewMsg(){
    if(paraviewMsg){
        alert('Analysis successful\n\nView the results files using ParaView\nwhich can be freely downloaded at\nwww.paraview.org');
        paraviewMsg = false;
    }
}

function startProgress (){
    $("#runLoader").removeClass('post-loader-success');
    $("#runLoader").removeClass('post-loader-fail');
    $("#runLoader").addClass('loader');    
}
function endProgress (success){
    $("#runLoader").removeClass('loader');
    if(success){
        $("#runLoader").addClass('post-loader-success');
    }
    else {
        $("#runLoader").addClass('post-loader-fail');
    }
}

function writeInputFile(only_write,resolution=false,ss_locs=false) {
    fileName     = fullPath('','input.xml');
    outputFolder = fullPath('results','');
    paramsFile   = fullPath('','params.xml');
    subsetFile   = fullPath('','subset_defs.txt');
    consoleMsg('writing input file ' + fileName);
    var content = '';
    content += '<!-- Auto generated input file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    content += '<Parameter name="output_folder" type="string" value="' + outputFolder + '" /> \n';
    content += '<Parameter name="correlation_parameters_file" type="string" value="' + paramsFile + '" />\n';
    if(ROIDefsX[0].length>=3){
        content += '<Parameter name="subset_file" type="string" value="' + subsetFile + '" />\n';
    }
    content += '<Parameter name="subset_size" type="int" value="'+$("#subsetSize").val()+'" />\n';
    content += '<Parameter name="step_size" type="int" value="'+$("#stepSize").val()+'" />\n';
    content += '<Parameter name="separate_output_file_for_each_subset" type="bool" value="false" />\n';
    content += '<Parameter name="create_separate_run_info_file" type="bool" value="true" />\n';
    if($("#omitTextCheck")[0].checked){
        content += '<Parameter name="no_text_output_files" type="bool" value="true" />\n';
    }
    if(showStereoPane&&!resolution&&!ss_locs){
        content += '<Parameter name="calibration_parameters_file" type="string" value="' + calPath + '" />\n';
    }
    var fileSelectMode = $("#fileSelectMode").val();
    if(fileSelectMode=="list"){
      content += '<Parameter name="image_folder" type="string" value="" />\n';
      content += '<Parameter name="reference_image" type="string" value="' + refImagePathLeft + '" />\n';
      content += '<ParameterList name="deformed_images">\n';
        // add the deformed images
        if(resolution||ss_locs){
            content += '<Parameter name="'+refImagePathLeft+'" type="bool" value="true" />\n';        
        }
        else{
            for(var i = 0, l = defImagePathsLeft.length; i < l; i++) {
                content += '<Parameter name="'+defImagePathsLeft[i].path+'" type="bool" value="true" />\n';        
            }
        }
      content += '</ParameterList>\n';
      if(showStereoPane&&!resolution&&!ss_locs){
          content += '<Parameter name="stereo_reference_image" type="string" value="' + refImagePathRight + '" />\n';
          content += '<ParameterList name="stereo_deformed_images">\n';
          // add the deformed images
          for(var i = 0, l = defImagePathsRight.length; i < l; i++) {
              content += '<Parameter name="'+defImagePathsRight[i].path+'" type="bool" value="true" />\n';        
          }
          content += '</ParameterList>\n';
      }
    }
    else if(fileSelectMode=="sequence"){
        var folderName = $("#imageFolderSpan").text();
        if(os.platform()=='win32'){
            folderName += '\\';
        }else{
            folderName += '/';
        }
        content += '<Parameter name="image_folder" type="string" value="'+folderName +'" />\n';
        content += '<Parameter name="reference_image_index" type="int" value="'+$("#refIndex").val()+'" />\n';
        content += '<Parameter name="start_image_index" type="int" value="'+$("#startIndex").val()+'" />\n';
        content += '<Parameter name="end_image_index" type="int" value="'+$("#endIndex").val()+'" />\n';
        content += '<Parameter name="skip_image_index" type="int" value="'+$("#skipIndex").val()+'" />\n';
        content += '<Parameter name="num_file_suffix_digits" type="int" value="'+$("#numDigits").val()+'" />\n';
        content += '<Parameter name="image_file_extension" type="string" value="'+$("#imageExtension").val()+'" />\n';
        content += '<Parameter name="image_file_prefix" type="string" value="'+$("#imagePrefix").val()+'" />\n';
        if(showStereoPane){
            content += '<Parameter name="stereo_left_suffix" type="string" value="'+$("#stereoLeftSuffix").val()+'"/>\n';
            content += '<Parameter name="stereo_right_suffix" type="string" value="'+$("#stereoRightSuffix").val()+'" />\n';
        }
    }
    else if(fileSelectMode=="cine"){
        content += '<Parameter name="image_folder" type="string" value="" />\n';
        content += '<Parameter name="cine_file" type="string" value="'+cinePathLeft+'" />\n';
        content += '<Parameter name="cine_ref_index" type="int" value="'+$("#cineRefIndex").val()+'" />\n';
        content += '<Parameter name="cine_start_index" type="int" value="'+$("#cineStartIndex").val()+'" />\n';
        content += '<Parameter name="cine_skip_index" type="int" value="'+$("#cineSkipIndex").val()+'" />\n';
        content += '<Parameter name="cine_end_index" type="int" value="'+$("#cineEndIndex").val()+'" />\n';
        if(showStereoPane&&!resolution&&!ss_locs){
            content += '<Parameter name="stereo_cine_file" type="string" value="'+cinePathRight+'" />\n';
        }
    }
    content += '</ParameterList>\n';
    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message)
         }
        consoleMsg('input.xml file has been successfully saved');
        writeParamsFile(only_write,resolution,ss_locs);
    });
}

function writeParamsFile(only_write,resolution,ss_locs) {
    var paramsFile = fullPath('','params.xml');
    consoleMsg('writing parameters file ' + paramsFile);
    var content = '';
    content += '<!-- Auto generated parameters file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    if(resolution){
        // add estimate spatial resoltion options
        content += '<Parameter name="estimate_resolution_error" type="bool" value="true" />\n';
        content += '<Parameter name="estimate_resolution_error_min_period" type="double" value="10.0" />\n';
        content += '<Parameter name="estimate_resolution_error_period_factor" type="double" value="0.73" />\n';
        content += '<Parameter name="estimate_resolution_error_min_amplitude" type="double" value="1.0" />\n';
        content += '<Parameter name="estimate_resolution_error_max_amplitude" type="double" value="1.0" />\n';
        content += '<Parameter name="estimate_resolution_error_amplitude_step" type="double" value="1.0" />\n';
    }
    content += '<Parameter name="sssig_threshold" type="double" value="'+$("#sssigThresh").val()+'" />\n';
    content += '<Parameter name="interpolation_method" type="string" value="KEYS_FOURTH" />\n';
    content += '<Parameter name="optimization_method" type="string" value="GRADIENT_BASED" />\n';
    var initMode = $("#initSelect").val();
    if(initMode=="featureMatching"){
        content += '<Parameter name="initialization_method" type="string" value="USE_FEATURE_MATCHING" />\n';
    }
    else if(initMode=="fieldValues"){
        content += '<Parameter name="initialization_method" type="string" value="USE_FIELD_VALUES" />\n';
    }
    else if(initMode=="neighborValues"){
        content += '<Parameter name="initialization_method" type="string" value="USE_NEIGHBOR_VALUES" />\n';
    }
    if($("#translationCheck")[0].checked){
        content += '<Parameter name="enable_translation" type="bool" value="true" />\n';
    }else{
        content += '<Parameter name="enable_translation" type="bool" value="false" />\n';
    }
    if($("#rotationCheck")[0].checked){
        content += '<Parameter name="enable_rotation" type="bool" value="true" />\n';
    }else{
        content += '<Parameter name="enable_rotation" type="bool" value="false" />\n';
    }
    if($("#normalStrainCheck")[0].checked){
        content += '<Parameter name="enable_normal_strain" type="bool" value="true" />\n';
    }else{
        content += '<Parameter name="enable_normal_strain" type="bool" value="false" />\n';
    }
    if($("#shearStrainCheck")[0].checked){
        content += '<Parameter name="enable_shear_strain" type="bool" value="true" />\n';
    }else{
        content += '<Parameter name="enable_shear_strain" type="bool" value="false" />\n';
    }
    if($("#filterCheck")[0].checked){
        content += '<Parameter name="gauss_filter_images" type="bool" value="true" />\n';
        content += '<Parameter name="gauss_filter_mask_size" type="int" value="'+$("#filterSize").val()+'" />\n';
    }
    if($("#strainCheck")[0].checked){
        content += '<ParameterList name="post_process_vsg_strain">\n';
        content += '<Parameter name="strain_window_size_in_pixels" type="int" value="'+$("#strainGaugeSize").val()+'" />\n';
        content += '</ParameterList>\n';
    }
    content += '<Parameter name="output_delimiter" type="string" value="," />\n'
    content += '<ParameterList name="output_spec"> \n';
    content += '<Parameter name="COORDINATE_X" type="bool" value="true" />\n';
    content += '<Parameter name="COORDINATE_Y" type="bool" value="true" />\n';
    content += '<Parameter name="DISPLACEMENT_X" type="bool" value="true" />\n';
    content += '<Parameter name="DISPLACEMENT_Y" type="bool" value="true" />\n';
    content += '<Parameter name="SIGMA" type="bool" value="true" />\n';
    content += '<Parameter name="GAMMA" type="bool" value="true" />\n';
    content += '<Parameter name="BETA" type="bool" value="true" />\n';
    content += '<Parameter name="STATUS_FLAG" type="bool" value="true" />\n';
    if($("#strainCheck")[0].checked){
        content += '<Parameter name="VSG_STRAIN_XX" type="bool" value="true" />\n';
        content += '<Parameter name="VSG_STRAIN_YY" type="bool" value="true" />\n';
        content += '<Parameter name="VSG_STRAIN_XY" type="bool" value="true" />\n';
    }
    content += '</ParameterList>\n';
    content += '</ParameterList>\n';
    fs.writeFile(paramsFile, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message)
         }
        consoleMsg('params.xml file has been successfully saved');
        writeSubsetFile(only_write,resolution,ss_locs);
    });
}

function writeSubsetFile(only_write,resolution,ss_locs){
  if(ROIDefsX[0].length>=3){
      var subsetFile = fullPath('','subset_defs.txt');
    consoleMsg('writing subset file ' + subsetFile);
    var content = '';
    content += '# Auto generated subset file from DICe GUI\n';
    if(ROIDefsX[0].length < 3 || ROIDefsY[0].length < 3){
        alert('Error: subset file creation failed, invalid vertices for region of interest');
        return false;
    }
    content += 'begin region_of_interest\n';
    content += '  begin boundary\n';
    // write all the boundary shapes
    for(var i = 0, l = ROIDefsX.length; i < l; i++) {
        var ROIx = ROIDefsX[i];
        var ROIy = ROIDefsY[i];
        content += '    begin polygon\n';
        content += '      begin vertices\n';
        for(var j = 0, jl = ROIx.length; j < jl; j++) {
            content += '        ' +  ROIx[j] + ' ' + ROIy[j] + '\n';
        }
        content += '      end vertices\n';
        content += '    end polygon\n';
    }
    content += '  end boundary\n';
    if(excludedDefsX.length>0){
        if(excludedDefsX[0].length > 2){
            content += '  begin excluded\n';
            for(var i = 0, l = excludedDefsX.length; i < l; i++) {
                var ROIx = excludedDefsX[i];
                var ROIy = excludedDefsY[i];
                content += '    begin polygon\n';
                content += '      begin vertices\n';
                for(var j = 0, jl = ROIx.length; j < jl; j++) {
                    content += '        ' + ROIx[j] + ' ' + ROIy[j] + '\n';
                }
                content += '      end vertices\n';
                content += '    end polygon\n';
            }
            content += '  end excluded\n';
        } // excluded[0].length > 2
    } // excluded defs > 0
    content += 'end region_of_interest\n';
    fs.writeFile(subsetFile, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message)
         }
        consoleMsg('subset_defs.txt file has been successfully saved');
        if(!only_write)
            callDICeExec(resolution,ss_locs);
    });
  }else{
      if(!only_write)
          callDICeExec(resolution,ss_locs);
  }
}

function checkValidInput() {
    consoleMsg('checking if input requirements met to enable running DICe ...');
    var validInput = true;
    var enableCross = true;
    var enableResolution = true;
    var isSequence = $("#fileSelectMode").val()=='sequence';
    var isCine =  $("#fileSelectMode").val()=='cine';

    if(isCine){
        if(cinePathLeft=="undefined"){
            validInput = false;
            enableResolution = false;
            enableCross = false;
        }
        if(showStereoPane){
            if(cinePathRight=="undefined"){
                validInput = false;
                enableCross = false;
            }
            if(calPath=='undefined'){
                validInput = false;
            }
        }
    }
    else{
    // see if the left reference image is set:
    if(refImagePathLeft=='undefined'||(refImagePathLeft=='sequence' && !isSequence)) {
        consoleMsg('left reference image not set yet');
        validInput = false;
        enableCross = false;
        enableResolution = false;
    }
    // check that the image extensions all match
    var refExtension = refImagePathLeft.split('.').pop().toLowerCase();
    if(!defImagePathsLeft[0]){
        consoleMsg('deformed images have not been defined yet');
        validInput = false;
    }
    // check all the deformed images
    if(!isSequence){
      for(var i = 0, l = defImagePathsLeft.length; i < l; i++) {
        var defExtension = defImagePathsLeft[i].name.split('.').pop().toLowerCase();
        if(refExtension!=defExtension){
            consoleMsg('deformed image ' + defImagePathsLeft[i].name + ' extension does not match ref extension');
            validInput = false;
        }
      }
    }

    if(showStereoPane){
      if(calPath=='undefined')
          validInput = false;
      if(!isSequence){
        for(var i = 0, l = defImagePathsRight.length; i < l; i++) {
          var defExtension = defImagePathsRight[i].name.split('.').pop().toLowerCase();
          if(refExtension!=defExtension){
              consoleMsg('deformed image ' + defImagePathsRight[i].name + ' extension does not match ref extension');
              validInput = false;
          }
        }
      }
    }
    
    // TODO check right images ...
    // see if the right reference image is set:
    if(refImagePathRight=='undefined'||(refImagePathRight=='sequence' && !isSequence)) {
        consoleMsg('right reference image not set yet');
        enableCross = false;
        if(showStereoPane)
            validInput = false;
    }
    if(!isSequence&&defImagePathsRight.length<1)
        if(showStereoPane)
          validInput = false;
    } // end else (not cine)
    // TODO see if the left and right ref have the same dimensions
    // TODO check the number of def images left and right
    
    if(validInput){       
        $("#runLi").show();
        $("#writeLi").show();
    }else{
        $("#runLi").hide();
        $("#writeLi").hide();
    }
    if(enableCross){
        $("#previewCross").show();
        $("#initCross").show();
    }else{
        $("#previewCross").hide();
        $("#initCross").hide();
    }
    if(enableResolution){
        $("#resolutionLi").show();                
    }else{
        $("#resolutionLi").hide();                
    }
}
