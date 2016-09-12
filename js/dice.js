document.getElementById("runLi").onclick = function() {
    writeInputFile();
    writeParamsFile();
    callDICeExec();
};

function callDICeExec() {
    
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc          = child_process.spawn('/Users/dzturne/code/KDICe/build_global/bin/dice', ['--version']);
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        console.log(line);
        $('#consoleWindow').append(line + '<br/>');
    });

    proc.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });
    
    proc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        // move the scroll on the console to the bottom
        var objDiv = document.getElementById("consoleWindow");
        objDiv.scrollTop = objDiv.scrollHeight;
    });    
}

function writeInputFile() {
    fileName = workingDirectory;
    outputFolder = workingDirectory;
    paramsFile = workingDirectory;
    if(os.platform()=='win32'){
        fileName += '\\input.xml';
        outputFolder += '\\results\\';
        paramsFile += '\\params.xml';
    }else{
        fileName += '/input.xml';
        outputFolder += '/restuls/';
        paramsFile += '/params.xml';
    }
    $('#consoleWindow').append('writing input file ' + fileName + '<br/>');
    var content = '';
    content += '<!-- Auto generated input file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    content += '<Parameter name="output_folder" type="string" value="' + outputFolder + '" /> \n';
    content += '<Parameter name="image_folder" type="string" value="" />\n';
    content += '<Parameter name="correlation_parameters_file" type="string" value="' + paramsFile + '" />\n';
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
            alert("ERROR: an error ocurred creating the file "+ err.message)
         }
        $('#consoleWindow').append('input.xml file has been successfully saved <br/>');
    });
}

function writeParamsFile() {
    paramsFile = workingDirectory;
    if(os.platform()=='win32'){
        paramsFile += '\\params.xml';
    }else{
        paramsFile += '/params.xml';
    }
    $('#consoleWindow').append('writing parameters file ' + paramsFile + '<br/>');
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
    content += '</ParameterList>\n';
    content += '</ParameterList>\n';
    fs.writeFile(paramsFile, content, function (err) {
        if(err){
            alert("ERROR: an error ocurred creating the file "+ err.message)
         }
        $('#consoleWindow').append('params.xml file has been successfully saved <br/>');
    });
}

