
function parse_input_xml_file(filename){
    console.log("parsing input file " + filename);
    fs.stat(filename, function(err, stat) {
        if(err == null) {
            $.ajax({
                type: "GET",
    	        url: filename,
	        dataType: "xml",
	        success: function(xml) {
                    impl_input_xml_file(xml);
	        }, // end success
            }); // end ajax
        }else{ // file doesn't exist
        }
    }); // end stat
}

function impl_input_xml_file(xml){
    // read the subset file if it exists:
    // check if a subset file is used to define ROIs
    subset_file = xml_get(xml,"subset_file");
    if(subset_file){
        console.log('reading subset file: ' + subset_file);
        fs.stat(subset_file, function(err, stat) {
            if(err == null) {
                fs.readFile(subset_file,'utf8',function(err,data){
                    if(err){
                    }else{
                        // check if this is a custom subset points file or not
                        subsetFileString = data.toString();
                        if((subsetFileString.includes("BEGIN SUBSET_COORDINATES")&&!subsetFileString.includes("BEGIN CONFROMAL_SUBSET"))||
                                (subsetFileString.includes("begin subset_coordinates")&&!subsetFileString.includes("begin conformal_subset"))){
                            subsetLocationsFile = subset_file;
                            $("#loadSubsetFileInputIcon").css('color','#33ccff');
                        }else
                            read_subset_file(data);
                    }
                }); // end readfile
            }else{ // file doesn't exist
            }
        }); // end stat subset file
    }  // end has subset_file

    // set the step size
    step_size = xml_get(xml,"step_size");
    console.log('step_size: ' + step_size);
    if(step_size){
        $("#stepSize").val(step_size);
        $("#stepSizeLabel").text(step_size);
    }
    // set the subset size
    subset_size = xml_get(xml,"subset_size");
    console.log('subset_size: ' + subset_size);
    if(subset_size){
        $("#subsetSize").val(subset_size);
        $("#subsetSizeLabel").text(subset_size);
    }
    if(step_size || subset_size){
        // override the method if there is a step size or subset size
        $("#analysisModeSelect").val("subset").change();
    }

    // set the mesh size
    mesh_size = xml_get(xml,"mesh_size");
    console.log('mesh_size: ' + mesh_size);
    if(mesh_size){
        $("#meshSize").val(mesh_size);
        $("#meshSizeLabel").text(mesh_size);
    }
    if(mesh_size){
        // override the method if there is a step size or subset size
        $("#analysisModeSelect").val("global").change();
    }
    
    // no text output files produced
    noText = xml_get(xml,"no_text_output_files");
    if(noText == "true"){
        $("#omitTextCheck")[0].checked = true;
    }

    // read the images (one of three options 1: sequence of images, 2: cine file, or 3: list of images
    image_folder = xml_get(xml,"image_folder");
    // cine
    cine_file = xml_get(xml,"cine_file");
    if(cine_file){
        console.log('reading cine file: ' + image_folder + cine_file);
        $("#fileSelectMode").val("cine");
        $("#fileSelectMode").change();
        stereo_cine_file = xml_get(xml,"stereo_cine_file");
        if(stereo_cine_file) showStereoViewer();
        else show2DViewer();
        full_name = image_folder + cine_file;
        getFileObject(full_name, function (fileObject) {
            $("#panzoomLeft").html('');
            callCineStatExec(fileObject,0,false,function(){update_cine_indices(xml)});
        });
        if(stereo_cine_file){
            console.log('reading stereo cine file: ' + image_folder + stereo_cine_file);
            stereo_full_name = image_folder + stereo_cine_file;
            getFileObject(stereo_full_name, function (fileObject) {
                $("#panzoomRight").html('');
                callCineStatExec(fileObject,1,false);
            });
        }
    }else{
        // list
        ref_image = xml_get(xml,"reference_image");
        if(ref_image){
            console.log('reading reference image: ' + image_folder + ref_image);
            $("#fileSelectMode").val("list");
            $("#fileSelectMode").change();
            stereo_ref_image = xml_get(xml,"stereo_reference_image");
            if(stereo_ref_image) showStereoViewer();
            else show2DViewer();
            // load the ref image
            full_name = image_folder + ref_image;
            name_splits = full_name.split(/[\\\/]/);
            $("#refImageText span").text(name_splits[name_splits.length-1]);
            getFileObject(full_name, function (fileObject) {
                loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,false,"","",true);
            });
            // load the deformed image list
            deformed_list = $(xml).find('ParameterList[name="deformed_images"]');
            if(deformed_list){
                $("#defImageListLeft").empty();
                defImagePathsLeft = [];
                $(deformed_list).find('Parameter').each(function(){
                    full_def_name = image_folder + $(this).attr('name');
                    console.log('deformed image left: ' + full_def_name);
                    def_name_split = full_def_name.split(/[\\\/]/);
                    current_length_li = $("#defImageListLeft").size();
                    $("#defImageListLeft").append("<li class='defListLi' id='defListLi_"+current_length_li+"'>" + def_name_split[def_name_split.length-1] + "</li>");
                    getFileObject(full_def_name, function (fileObject) {
                        defImagePathsLeft.push(fileObject);
                        // sort the defImagePathsLeft in case the asynch getFileObject re-ordered the list
                        defImagePathsLeft.sort(function(a, b) {
                            return (a.name > b.name) - (a.name < b.name);
                        });
                    });        
                });
            }
            // load the stereo ref image
            if(stereo_ref_image){
                stereo_full_name = image_folder + stereo_ref_image;
                stereo_name_splits = stereo_full_name.split(/[\\\/]/);
                $("#refImageTextRight span").text(stereo_name_splits[stereo_name_splits.length-1]);
                getFileObject(stereo_full_name, function (fileObject) {
                    loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","",true);
                });
            }
            // load the stereo deformed image list
            stereo_deformed_list = $(xml).find('ParameterList[name="stereo_deformed_images"]');
            if(stereo_deformed_list){
                $("#defImageListRight").empty();
                defImagePathsRight = [];
                $(stereo_deformed_list).find('Parameter').each(function(){
                    full_def_name = image_folder + $(this).attr('name');
                    console.log('deformed image right: ' + full_def_name);
                    def_name_split = full_def_name.split(/[\\\/]/);
                    current_length_li = $("#defImageListRight").size();
                    $("#defImageListRight").append("<li class='defListLi' id='defListLi_"+current_length_li+"'>" + def_name_split[def_name_split.length-1] + "</li>");
                    getFileObject(full_def_name, function (fileObject) {
                        defImagePathsRight.push(fileObject);
                        // sort the defImagePathsRight in case the asynch getFileObject re-ordered the list
                        defImagePathsRight.sort(function(a, b) {
                            return (a.name > b.name) - (a.name < b.name);
                        });
                    });        
                });
            }
        }
        // sequence
        else{
            console.log('image folder for sequence: ' + image_folder);
            $("#fileSelectMode").val("sequence");
            $("#fileSelectMode").change();
            $("#imageFolderSpan").text(image_folder);
            stereo_right_suffix = xml_get(xml,"stereo_right_suffix");
            if(stereo_right_suffix) showStereoViewer();
            else show2DViewer();
            ref_image_index = xml_get(xml,"reference_image_index");
            console.log('ref image index: ' + ref_image_index);
            if(ref_image_index) $("#refIndex").val(ref_image_index);
            end_image_index = xml_get(xml,"end_image_index");
            console.log('last image index: ' + end_image_index);
            if(end_image_index) $("#endIndex").val(end_image_index);
            start_image_index = xml_get(xml,"start_image_index");
            console.log('start image inde: ' + start_image_index);
            if(start_image_index) $("#startIndex").val(start_image_index);
            skip_image_index = xml_get(xml,"skip_image_index");
            console.log('skip image index: ' + skip_image_index);
            if(skip_image_index) $("#skipIndex").val(skip_image_index);
            stereo_left_suffix = xml_get(xml,"stereo_left_suffix");
            console.log('strereo left suffix: ' + stereo_left_suffix);
            if(stereo_left_suffix) $("#stereoLeftSuffix").val(stereo_left_suffix);
            console.log('stereo right suffix: ' + stereo_right_suffix);
            if(stereo_right_suffix) $("#stereoRightSuffix").val(stereo_right_suffix);
            num_digits = xml_get(xml,"num_file_suffix_digits");
            if(num_digits) $("#numDigits").val(num_digits);
            image_prefix = xml_get(xml,"image_file_prefix");
            if(image_prefix) $("#imagePrefix").val(image_prefix);
            image_ext = xml_get(xml,"image_file_extension");
            if(image_ext) $("#imageExtension").val(image_ext);
            load_image_sequence(false);
        }
    }

    // see if there is a "best_fit_plane.dat" file in the folder
    var bestFitFileName = fullPath('','best_fit_plane.dat');
    fs.stat(bestFitFileName, function(err, stat) {
        if(err == null) {
            fs.readFile(bestFitFileName,'utf8',function(err,data){
                if(err){
                }else{
                    //var pre_coord_data = data.toString().split(/\s+/g).map(Number);
                    var lines = data.toString().split('\n');
                    var coord_data = [];
                    for(var line = 0; line < lines.length; line++){
                        if(lines[line].charAt(0)=='#') continue;
                        var tokens = lines[line].split(/\s+/g).map(Number);
                        for(i=0;i<tokens.length;++i){
                            if(!isNaN(tokens[i])&&tokens[i]!=0) coord_data.push(tokens[i]);
                        }            
                    }
                    console.log('best fit coord data: ' + coord_data);
                    // set the coordinates
                    bestFitXOrigin = coord_data[0];
                    bestFitYOrigin = coord_data[1];
                    bestFitXAxis = coord_data[2];
                    bestFitYAxis = coord_data[3];
                    $("#bestFitCheck")[0].checked = true;
                    // check for YAXIS
                    if(data.toString().includes("YAXIS")){
                        $("#bestFitYAxisCheck")[0].checked = true;
                    }
                    drawROIs();
                }                
            }); // end readfile
        }else{
            $("#bestFitCheck")[0].checked = false;
        }
    });
    
    // see if there is a "live_plot.dat" file in the folder
    var LPFileName = fullPath('','live_plot.dat');
    fs.stat(LPFileName, function(err, stat) {
        if(err == null) {
            fs.readFile(LPFileName,'utf8',function(err,data){
                if(err){
                }else{
                    var lines = data.toString().split('\n');
                    for(var line = 0; line < lines.length; line++){
                        if(lines[line].charAt(0)=='#') continue;
                        var tokens = lines[line].split(/\s+/g).map(Number);
                        if(isNaN(tokens[0]))continue;
                        //console.log("tokens: " + tokens);
                        //console.log("token length " +  tokens.length);
                        if(tokens.length==2){
                            livePlotPtsX.push(tokens[0]);
                            livePlotPtsY.push(tokens[1]);
                        }else if(tokens.length==4){
                            livePlotLineXOrigin = tokens[0];
                            livePlotLineYOrigin = tokens[1];
                            livePlotLineXAxis = tokens[2];
                            livePlotLineYAxis = tokens[3];
                            addLivePlotLineActive = true;
                            $("#addLivePlotLine").css('color','#33ccff');
                        }else{
                            //alert("Error reading live plot data: invalid line in file");
                        }
                    }
                    // set the coordinates
                    drawROIs();
                }                
            }); // end readfile
        }
    });

    // see if there is a calibration parameters file
    calPath = xml_get(xml,"calibration_parameters_file");
    console.log('has calibration file: ' + calPath);
    if(calPath && calPath !== 'null' && calPath != 'undefined'){
        $("#calList").empty();
        // pull off the file name from the above path
        //substrs = calPath.split(/[\\\/]/);
        //console.log(substrs);
        var calFileName = calPath.split(/[\\\/]/).pop();
        //console.log('cal file name is ' + calFileName);
        $("#calList").append("<li class='calListLi'>" + calFileName + "</li>");
    }
    
    // see if there is a parameters file
    paramsFile = xml_get(xml,"correlation_parameters_file");
    if(paramsFile){
        parse_params_xml_file(paramsFile);
    }
    checkValidInput();
}


// note: the read_susbset_file does not read the
// subset_id for a conformal subset, instead it assumes that the
// subsets are always saved in order from 0 to n.
// note: obstructed regions are copied in all subsets, as such only the
// obstructed regions from the firs subeset are loaded
function read_subset_file(data){
    hierarchy = [];
    clearROIs();
    clearExcluded();
    clearObstructed();
    var max_vertices = 500;
    var lines = data.toString().split('\n');
    for(line = 0;line < lines.length; line++){
        var split_line = lines[line].match(/\S+/g);
        if(split_line){
            console.log('split line: ' + split_line);
            if(split_line[0]=='begin'){
                hierarchy.push(split_line[1]);
                
                // see if this is a set of vertices
                if(split_line[1]=='vertices'){
                    // read the sets of vertices
                    var vertex = 0;
                    var vertex_x = [];
                    var vertex_y = [];
                    while(vertex < max_vertices){
                        num_line = lines[line+1+vertex].match(/\S+/g).map(Number);
                        if(isNaN(num_line[0])) break;
                        vertex++;
                        vertex_x.push(num_line[0]);
                        vertex_y.push(num_line[1]);
                    }
                    line+=vertex;
                    console.log('vertex x: ' + vertex_x);
                    console.log('vertex y: ' + vertex_y);
                    if(hierarchy[hierarchy.length-3]=='boundary'){
                        //console.log('ciurrent ROI index is ' + currentROIIndex);
                        //console.log(ROIDefsX);
                        if(currentROIIndex!=0){
                            ROIDefsX.push([]);
                            ROIDefsY.push([]);
                        }
                        for(i=0;i<vertex_x.length;i++){
                            ROIDefsX[ROIDefsX.length-1].push(vertex_x[i]);
                            ROIDefsY[ROIDefsY.length-1].push(vertex_y[i]);
                        }
                        currentROIIndex += 1;
                    }
                    else if(hierarchy[hierarchy.length-3]=='excluded'){
                        if(currentExcludedIndex!=0){
                            excludedDefsX.push([]);
                            excludedDefsY.push([]);
                        }
                        for(i=0;i<vertex_x.length;i++){
                            excludedDefsX[excludedDefsX.length-1].push(vertex_x[i]);
                            excludedDefsY[excludedDefsY.length-1].push(vertex_y[i]);
                        }
                        excludedAssignments.push(currentROIIndex-1);
                        currentExcludedIndex += 1;
                    }
                    else if(hierarchy[hierarchy.length-3]=='obstructed'&&currentROIIndex==1){
                        if(currentObstructedIndex!=0){
                            obstructedDefsX.push([]);
                            obstructedDefsY.push([]);
                        }
                        for(i=0;i<vertex_x.length;i++){
                            obstructedDefsX[obstructedDefsX.length-1].push(vertex_x[i]);
                            obstructedDefsY[obstructedDefsY.length-1].push(vertex_y[i]);
                        }
                        currentObstructedIndex += 1;
                    }
                }
            }
            else if(split_line[0]=='end' && hierarchy.length > 0){
                hierarchy.pop();
            }
        } // end split_line
    } // end lines
    console.log('ROIDefsX:');
    console.log(ROIDefsX);
    console.log('ROIDefsY:');
    console.log(ROIDefsY);
    console.log('ExcludedDefsX:');
    console.log(excludedDefsX);
    console.log('ExcludedDefsY:');
    console.log(excludedDefsY);
    console.log('excludedAssignments');
    console.log(excludedAssignments);
    console.log('obstructedDefsX:');
    console.log(obstructedDefsX);
    console.log('obstructedDefsY:');
    console.log(obstructedDefsY);
    drawROIs();
}

function update_cine_indices(xml){
    cine_start_index = xml_get(xml,"cine_start_index");
    if(cine_start_index!='undefined') $("#cineStartIndex").val(cine_start_index);
    cine_end_index = xml_get(xml,"cine_end_index");
    if(cine_end_index!='undefined') $("#cineEndIndex").val(cine_end_index);
    cine_skip_index = xml_get(xml,"cine_skip_index");
    if(cine_skip_index!='undefined') $("#cineSkipIndex").val(cine_skip_index);
    cine_ref_index = xml_get(xml,"cine_ref_index");
    if(cine_ref_index!='undefined') $("#cineRefIndex").val(cine_ref_index);
    $("#frameScroller").val(cine_ref_index);
}

function parse_params_xml_file(filename){
    console.log("parsing correlation parameters file " + filename);
    $.ajax({
        type: "GET",
	url: filename,
	dataType: "xml",
	success: function(xml) {
            impl_params_xml_file(xml);
	} // end success
    }); // end ajax
}

function impl_params_xml_file(xml){
    // set the initialization method
    init_method = xml_get(xml,"initialization_method");
    console.log('init_method: ' + init_method);
    if(init_method=="USE_FEATURE_MATCHING"){
        $("#initSelect").val("featureMatching");
    }
    if(init_method=="USE_FIELD_VALUES"){
        $("#initSelect").val("fieldValues");
    }
    if(init_method=="USE_NEIGHBOR_VALUES"){
        $("#initSelect").val("neighborValues");
    }
    if(init_method=="USE_IMAGE_REGISTRATION"){
        $("#initSelect").val("imageRegistration");
    }
    // set the sssig threshold
    sssig = xml_get(xml,"sssig_threshold");
    console.log('sssig_threshold: ' + sssig);
    if(sssig!='undefined'){
        $("#sssigThresh").val(sssig);
        $("#sssigLabel").text(sssig);
    }
    // set the shape functions
    trans = xml_get(xml,"enable_translation");
    console.log('enable translation: ' + trans);
    if(trans == "true"){
        $("#translationCheck")[0].checked = true;
    }else{
        $("#translationCheck")[0].checked = false;
    }
    rotation = xml_get(xml,"enable_rotation");
    console.log('enable rotation: ' + rotation);
    if(rotation == "true"){
        $("#rotationCheck")[0].checked = true;
    }else{
        $("#rotationCheck")[0].checked = false;
    }
    normal = xml_get(xml,"enable_normal_strain");
    console.log('enable normal: ' + normal);
    if(normal == "true"){
        $("#normalStrainCheck")[0].checked = true;
    }else{
        $("#normalStrainCheck")[0].checked = false;
    }
    shear = xml_get(xml,"enable_shear_strain");
    console.log('enable shear: ' + shear);
    if(shear == "true"){
        $("#shearStrainCheck")[0].checked = true;
    }else{
        $("#shearStrainCheck")[0].checked = false;
    }
    // gauss filtering of images
    filter = xml_get(xml,"gauss_filter_images");
    console.log('gauss filtering: ' + filter);
    if(filter == "true"){
        $("#filterCheck")[0].checked = true;
        filter_size = xml_get(xml,"gauss_filter_mask_size");
        console.log('gauss filter mask size ' + filter_size);
        if(filter_size){
            $("#filterSize").val(filter_size);
            $("#filterSizeLabel").text(filter_size);
        }
    }
    // vsg strain
    vsg_strain = $(xml).find('ParameterList[name="post_process_vsg_strain"]').find('Parameter[name="strain_window_size_in_pixels"]').attr("value");
    console.log('vsg strain window size: ' + vsg_strain);
    if(vsg_strain){
        $("#strainCheck")[0].checked = true;
        $("#strainGaugeSize").val(vsg_strain);
        $("#strainGaugeSizeLabel").text(vsg_strain);
    }
    // global parameters
    reg_constant = xml_get(xml,"global_regularization_alpha");
    console.log('global regularization alpha ' + reg_constant);
    if(reg_constant){
        $("#regularizationConstant").val(reg_constant);
        $("#regularizationConstantLabel").text(reg_constant);
    }

    checkValidInput();
}

function xml_get(xml,param_name){
    return $(xml).find('Parameter[name="'+param_name+'"]').attr("value");
}

//function xml_has(xml,param_name){
//    console.log($(xml).find('Parameter[name="'+param_name+'"]'))
//    var obj = $(xml).find('Parameter[name="'+param_name+'"]');
//    return obj && obj !== 'null' && obj !== 'undefined';
//}

    
//    var request = new XMLHttpRequest();
//    request.open("GET", filename, false);
//    request.send();
//    var xml = request.responseXML;
//    //console.log(xml);
//    var xml_params = xml.getElementsByTagName('Parameter');
//    console.log(xml_params);
//    parse_input_file(xml_params);
//    var params = xml.getElementsByTagName('ParameterList');
//    for(var i = 0; i < params.length; i++) {
//        var sub_params = xml.getElementsByTagName('ParameterList');
//            for(var i = 0; i < sub_params.length; i++) {
//                var name = sub_params[i].getAttribute('name');
//                var type = sub_params[i].getAttribute('type');
//                var value = sub_params[i].getAttribute('value');
//                console.log("sub_parameterlist name " + name);
//                var param = sub_params[i].getElementsByTagName('Parameter');
//                for(var i = 0; i < param.length; i++) {
//                    var name = sub_params[i].getAttribute('name');
//                    var type = sub_params[i].getAttribute('type');
//                    var value = sub_params[i].getAttribute('value');
//                    console.log("sub_parameter name " + name + " type " + type + " value " + value);
//                }
//            }
//    }
//}

//function parse_input_file(xml_params){
//    // set the subset size:
//    for(var i=0;i<params.length;i++){
//        console.log
//    }
//    
//}
