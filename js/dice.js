document.getElementById("runLi").onclick = function() {
    // all the input file writes are chained via callbacks with the
    // last callback executing DICe
    startProgress();
    writeInputFile();
};

function callDICeExec() {

    var inputFile = workingDirectory;
    if(os.platform()=='win32'){
        inputFile += '\\input.xml';
    }else{
        inputFile += '/input.xml';
    }   
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc          = child_process.execFile(execPath, ['-i',inputFile,'-v','-t']);

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
            showParaviewMsg();
        }
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

function writeInputFile() {
    fileName = workingDirectory;
    outputFolder = workingDirectory;
    paramsFile = workingDirectory;
    subsetFile = workingDirectory;
    if(os.platform()=='win32'){
        fileName += '\\input.xml';
        outputFolder += '\\results\\';
        paramsFile += '\\params.xml';
        subsetFile += '\\subset_defs.txt';
    }else{
        fileName += '/input.xml';
        outputFolder += '/results/';
        paramsFile += '/params.xml';
        subsetFile += '/subset_defs.txt';
    }
    consoleMsg('writing input file ' + fileName);
    var content = '';
    content += '<!-- Auto generated input file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    content += '<Parameter name="output_folder" type="string" value="' + outputFolder + '" /> \n';
    content += '<Parameter name="image_folder" type="string" value="" />\n';
    content += '<Parameter name="correlation_parameters_file" type="string" value="' + paramsFile + '" />\n';
    content += '<Parameter name="subset_file" type="string" value="' + subsetFile + '" />\n';
    content += '<Parameter name="subset_size" type="int" value="'+$("#subsetSize").val()+'" />\n';
    content += '<Parameter name="step_size" type="int" value="'+$("#stepSize").val()+'" />\n';
    content += '<Parameter name="separate_output_file_for_each_subset" type="bool" value="false" />\n';
    content += '<Parameter name="create_separate_run_info_file" type="bool" value="true" />\n';
    content += '<Parameter name="reference_image" type="string" value="' + refImagePathLeft + '" />\n';
    content += '<ParameterList name="deformed_images">\n';
    // add the deformed images
    for(var i = 0, l = defImagePathsLeft.length; i < l; i++) {
        content += '<Parameter name="'+defImagePathsLeft[i].path+'" type="bool" value="true" />\n';        
    }
    content += '</ParameterList>\n';
    content += '</ParameterList>\n';
    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message)
         }
        consoleMsg('input.xml file has been successfully saved');
        writeParamsFile();
    });
}

function writeParamsFile() {
    paramsFile = workingDirectory;
    if(os.platform()=='win32'){
        paramsFile += '\\params.xml';
    }else{
        paramsFile += '/params.xml';
    }
    consoleMsg('writing parameters file ' + paramsFile);
    var content = '';
    content += '<!-- Auto generated parameters file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    content += '<Parameter name="interpolation_method" type="string" value="KEYS_FOURTH" />\n';
    content += '<Parameter name="optimization_method" type="string" value="GRADIENT_BASED" />\n';
    content += '<Parameter name="initialization_method" type="string" value="USE_FIELD_VALUES" />\n';
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
        writeSubsetFile();
    });
}

function writeSubsetFile(){
    subsetFile = workingDirectory;
    if(os.platform()=='win32'){
        subsetFile += '\\subset_defs.txt';
    }else{
        subsetFile += '/subset_defs.txt';
    }
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
        callDICeExec();
    });
}

function checkValidInput() {
    consoleMsg('checking if input requirements met to enable running DICe ...');
    var validInput = true;
    // see if the left reference image is set:
    if(refImagePathLeft=='undefined') {
        consoleMsg('reference image not set yet');
        validInput = false;
    }
    // check that the image extensions all match
    var refExtension = refImagePathLeft.split('.').pop().toLowerCase();
    if(!defImagePathsLeft[0]){
        consoleMsg('deformed images have not been defined yet');
        validInput = false;
    }
    // check all the deformed images
    for(var i = 0, l = defImagePathsLeft.length; i < l; i++) {
        var defExtension = defImagePathsLeft[i].name.split('.').pop().toLowerCase();
        if(refExtension!=defExtension){
            consoleMsg('deformed image ' + defImagePathsLeft[i].name + ' extension does not match ref extension');
            validInput = false;
        }
    }

    if(showStereoPane){
        consoleMsg('running in stereo has not been enabled yet');
        validInput = false;
    }
    
    // TODO check right images ...
    // TODO see if the left and right ref have the same dimensions
    // TODO check the number of def images left and right
    
    if(validInput){       
        $("#runLi").show();
    }else{
        $("#runLi").hide();
    }
}
