
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


function parseSubsetFile(xml){
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
                        readSubsetFile(data);
                    }
                }); // end readfile
            }else{ // file doesn't exist
                readLivePlotFile();
                readBestFitFile();
                checkSubsetJsonFileExists();
            }
        }); // end stat subset file
    }  // end has subset_file
    else{
        readLivePlotFile();
        readBestFitFile();
        checkSubsetJsonFileExists();
    }
}

function impl_input_xml_file(xml){

    is_subset_or_global = false;
    
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
        drawRepresentativeSubset();
    }
    if(step_size || subset_size){
        is_subset_or_global = true;
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
        is_subset_or_global = true;
        // override the method if there is a step size or subset size
        $("#analysisModeSelect").val("global").change();
    }

    if(!is_subset_or_global){
        // override the method if there is a step size or subset size
        $("#analysisModeSelect").val("tracking").change();
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
        stereo_cine_file = xml_get(xml,"stereo_cine_file");
        if(stereo_cine_file){
            showStereoViewer();
        }
        else show2DViewer();
        $("#fileSelectMode").change();
        full_name = image_folder + cine_file;
        getFileObject(full_name, function (fileObject) {
            callCineStatExec(fileObject,0,function(){update_cine_indices(xml); parseSubsetFile(xml);});
        });
        if(stereo_cine_file){
            console.log('reading stereo cine file: ' + image_folder + stereo_cine_file);
            stereo_full_name = image_folder + stereo_cine_file;
            getFileObject(stereo_full_name, function (fileObject) {
                callCineStatExec(fileObject,1);
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
            updatePreviewImage({srcPath:full_name,dest:'left'},function(){parseSubsetFile(xml); refImagePathLeft = full_name;});
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
                        updateFrameScrollerRange();
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
                updatePreviewImage({srcPath:stereo_full_name,dest:'right'},function(){refImagePathRight = stereo_full_name;});
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
            image_suffix = xml_get(xml,"file_suffix");
            if(image_suffix) $("#imageSuffix").val(image_suffix);
            image_ext = xml_get(xml,"image_file_extension");
            if(image_ext) $("#imageExtension").val(image_ext);
            updateFrameScrollerRange();
            loadImageSequence(function(){parseSubsetFile(xml);});
        }
    }
    
    // see if there is a calibration parameters file
    calPath = xml_get(xml,"camera_system_file");
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

function readBestFitFile(){
    // see if there is a "best_fit_plane.dat" file in the folder
    var bestFitFileName = fullPath('','best_fit_plane.dat');
    var ox = 0;
    var oy = 0;
    var px = 0;
    var py = 0;
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
                        for(var i=0;i<tokens.length;++i){
                            if(!isNaN(tokens[i])&&tokens[i]!=0) coord_data.push(tokens[i]);
                        }
                    }
                    console.log('best fit coord data: ' + coord_data);
                    // set the coordinates
                    ox = coord_data[0];
                    oy = coord_data[1];
                    px = coord_data[2];
                    py = coord_data[3];
                    $("#bestFitCheck")[0].checked = true;
                    // check for YAXIS
                    if(data.toString().includes("YAXIS")){
                        $("#bestFitYAxisCheck")[0].checked = true;
                    }
                    drawBestFitLine(ox,oy,px,py);
                    //drawROIs();
                }
            }); // end readfile
        }else{
            $("#bestFitCheck")[0].checked = false;
        }
    });

}

function readLivePlotFile(){
    // see if there is a "live_plot.dat" file in the folder
    var LPFileName = fullPath('','live_plot.dat');
    var livePlotPtsX = [];
    var livePlotPtsY = [];
    var ox = 0;
    var oy = 0;
    var px = 0;
    var py = 0;
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
                            ox = tokens[0];
                            oy = tokens[1];
                            px = tokens[2];
                            py = tokens[3];
                        }else{
                            //alert("Error reading live plot data: invalid line in file");
                        }
                    }
                    // set the coordinates
                    addLivePlotPts(livePlotPtsX,livePlotPtsY);
                    if(ox!=0||oy!=0||px!=0||py!=0)
                        addLivePlotLine(ox,oy,px,py);
                    showLivePlots();
                }
            }); // end readfile
        }
    });
}

// note: the read_susbset_file does not read the
// subset_id for a conformal subset, instead it assumes that the
// subsets are always saved in order from 0 to n.
// note: obstructed regions are copied in all subsets, as such only the
// obstructed regions from the first subeset are loaded
function readSubsetFile(data){
    hierarchy = [];
    //clearROIs();
    //clearExcluded();
    //clearObstructed();
    var currentROI = 0;
    // if a representative subset shape exists, keep it
    var shapes = getPlotlyShapes('representativeSubset');
    var subsetLocations = {x:[],y:[]};
    var max_vertices = 500;
    var lines = data.toString().split('\n');
    for(line = 0;line < lines.length; line++){
        var split_line = lines[line].match(/\S+/g);
        if(split_line){
            //console.log('split line: ' + split_line);
            if(split_line[0].toUpperCase()=='BEGIN'){
                hierarchy.push(split_line[1]);
                if(split_line[1].toUpperCase()=='SUBSET_COORDINATES'){
                    vertex = 0;
                    while(vertex < max_vertices){
                        num_line = lines[line+1+vertex].match(/\S+/g).map(Number);
                        if(isNaN(num_line[0])) break;
                        vertex++;
                        // if this is a tracking analysis, this could potentially be skipped since this info is stored in the shape centroids
                        subsetLocations.x.push(num_line[0]);
                        subsetLocations.y.push(num_line[1]);
                    }
                    line+=vertex;
                }
                // TODO check for valid input file (for example prevent loading a conformal subset for subset mode or an ROI for tracking)
                // see if this is a set of vertices
                if(split_line[1].toUpperCase()=='VERTICES'){
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
                    var points = {x:vertex_x,y:vertex_y};
                    if(hierarchy[hierarchy.length-3].toUpperCase()=='BOUNDARY'){
                        var shape = pointsToPathShape(points,'ROI_' + currentROI.toString());
                        shapes.push(shape);
                        currentROI += 1;
                    }
                    else if(hierarchy[hierarchy.length-3].toUpperCase()=='EXCLUDED'){
                        var excludedId = currentROI - 1;
                        var shape = pointsToPathShape(points,'excluded_' + excludedId.toString());
                        shapes.push(shape);
                    }
//                    else if((hierarchy[hierarchy.length-3].toUpperCase()=='OBSTRUCTED')&&currentROIIndex==1){
//                        if(currentObstructedIndex!=0){
//                            obstructedDefsX.push([]);
//                            obstructedDefsY.push([]);
//                        }
//                        for(var i=0;i<vertex_x.length;i++){
//                            obstructedDefsX[obstructedDefsX.length-1].push(vertex_x[i]);
//                            obstructedDefsY[obstructedDefsY.length-1].push(vertex_y[i]);
//                        }
//                        currentObstructedIndex += 1;
//                    }
                }
            }
            else if(split_line[0]=='end' && hierarchy.length > 0){
                hierarchy.pop();
            }
        } // end split_line
    } // end lines
    // assuming here that the plotly div already exists
    var update = {shapes: shapes};
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
    if(subsetLocations.x.length>0){
        var scatterTrace = {
                name: 'subsetCoordinates',
                visible: false,
                type:'scatter',
                x:subsetLocations.x,
                y:subsetLocations.y,
                hovertemplate : '(%{x},%{y})<extra></extra>',
                mode:'markers',
                marker: {
                    color: 'yellow',
                    size: 3
                },
        };
        Plotly.addTraces(document.getElementById("plotlyViewerLeft"),scatterTrace);
    }
    readLivePlotFile();
    readBestFitFile();
    checkSubsetJsonFileExists();
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
    // tracking parameters
    thresh_left = xml_get(xml,"thresh_left");
    console.log('thresh_left: ' + thresh_left);
    if(thresh_left)
        $("#threshLeft").val(thresh_left);
    thresh_right = xml_get(xml,"thresh_right");
    console.log('thresh_right: ' + thresh_right);
    if(thresh_right)
        $("#threshRight").val(thresh_right);
    max_pt_density = xml_get(xml,"max_pt_density");
    console.log('max_pt_density: ' + max_pt_density);
    if(max_pt_density)
        $("#maxPtDensity").val(max_pt_density);
    min_area = xml_get(xml,"min_area");
    console.log('min_area: ' + min_area);
    if(min_area)
        $("#minArea").val(min_area);
    max_area = xml_get(xml,"max_area");
    console.log('max_area: ' + max_area);
    if(max_area)
        $("#maxArea").val(max_area);
    colocation_tol = xml_get(xml,"colocation_tol");
    console.log('colocation_tol: ' + colocation_tol);
    if(colocation_tol)
        $("#colocationTol").val(colocation_tol);
    neighbor_radius = xml_get(xml,"neighbor_radius");
    console.log('neighbor_radius: ' + neighbor_radius);
    if(neighbor_radius)
        $("#neighborRadius").val(neighbor_radius);
    min_pts_per_track = xml_get(xml,"min_pts_per_track");
    console.log('min_pts_per_track: ' + min_pts_per_track);
    if(min_pts_per_track)
        $("#minPtsPerTrack").val(min_pts_per_track);
    num_search_frames = xml_get(xml,"num_search_frames");
    console.log('num_search_frames: ' + num_search_frames);
    if(num_search_frames)
        $("#numSearchFrames").val(num_search_frames);
    num_background = xml_get(xml,"num_background_frames");
    console.log('num_background_frames: ' + num_background);
    if(num_background)
        $("#numBackgroundFrames").val(num_background);

    stereo_area_tol = xml_get(xml,"stereo_area_tol");
    console.log('stereo_area_tol: ' + stereo_area_tol);
    if(stereo_area_tol)
        $("#stereoAreaTol").val(stereo_area_tol);

    stereo_area_weight = xml_get(xml,"stereo_area_weight");
    console.log('stereo_area_weight: ' + stereo_area_weight);
    if(stereo_area_weight)
        $("#stereoAreaWeight").val(stereo_area_weight);
    
    dist_from_epi_tol = xml_get(xml,"dist_from_epi_tol");
    console.log('dist_from_epi_tol: ' + dist_from_epi_tol);
    if(dist_from_epi_tol)
        $("#distFromEpiTol").val(dist_from_epi_tol);
    
    dist_from_epi_weight = xml_get(xml,"dist_from_epi_weight");
    console.log('dist_from_epi_weight: ' + dist_from_epi_weight);
    if(dist_from_epi_weight)
        $("#distFromEpiWeight").val(dist_from_epi_weight);
    
    dist_weight = xml_get(xml,"dist_weight");
    console.log('dist_weight: ' + dist_weight);
    if(dist_weight)
        $("#distWeight").val(dist_weight);
    
    area_tol = xml_get(xml,"area_tol");
    console.log('area_tol: ' + area_tol);
    if(area_tol)
        $("#areaTol").val(area_tol);
    
    area_weight = xml_get(xml,"area_weight");
    console.log('area_weight: ' + area_weight);
    if(area_weight)
        $("#areaWeight").val(area_weight);
    
    gray_tol = xml_get(xml,"gray_tol");
    console.log('gray_tol: ' + gray_tol);
    if(gray_tol)
        $("#grayTol").val(gray_tol);
    
    gray_weight = xml_get(xml,"gray_weight");
    console.log('gray_weight: ' + gray_weight);
    if(gray_weight)
        $("#grayWeight").val(gray_weight);
    
    angle_tol = xml_get(xml,"angle_tol");
    console.log('angle_tol: ' + angle_tol);
    if(angle_tol)
        $("#angleTol").val(angle_tol);
    
    angle_weight = xml_get(xml,"angle_weight");
    console.log('angle_weight: ' + angle_weight);
    if(angle_weight)
        $("#angleWeight").val(angle_weight);
    
    checkValidInput();
    checkHasOutput();
}

function xml_get(xml,param_name){
    return $(xml).find('Parameter[name="'+param_name+'"]').attr("value");
}

function cloneShape(shape){
    var newShape = {};
    newShape.type = shape.type;
    newShape.path = shape.path;
    newShape.line = {color: shape.line.color, width: shape.line.width};
    newShape.fillcolor = shape.fillcolor;
    newShape.opacity = shape.opacity;
    newShape.editable = shape.editable;
    newShape.name = shape.name;
    return newShape;
}

function shapesToCentroids(shapes){
    var centroids = {x:[],y:[]};
    if(shapes.length==0) return;
    // iterate the shapes and for each path shape, compute the centroid
    for(var i=0;i<shapes.length;++i){
        var cx = 0.0; var cy = 0.0;
        if(shapes[i].type=='line'){
            cx = (shapes[i].x0 + shapes[i].x1)/2;
            cy = (shapes[i].y0 + shapes[i].y1)/2;
        }else if(shapes[i].type=='path'){
            var points = pathShapeToPoints(shapes[i]);
            var j = 0;
            var det = 0.0;
            for (var ii = 0; ii < points.x.length; ii++){
                // closed polygon
                if (ii + 1 == points.x.length)
                    j = 0;
                else
                    j = ii + 1;
                // compute the determinant
                var tempDet = points.x[ii] * points.y[j] - points.x[j]*points.y[ii];
                det += tempDet;
                cx += (points.x[ii] + points.x[j])*tempDet;
                cy += (points.y[ii] + points.y[j])*tempDet;
            }
            // divide by the total mass of the polygon
            cx /= 3.0*det;
            cy /= 3.0*det;
        }else{
            // cx = 0 cy = 0
        }
        centroids.x.push(Math.floor(cx));
        centroids.y.push(Math.floor(cy));
    }
    return centroids;
}

function pointsToPathShape(points,name){
    var shape = {};
    shape.type = 'path';
    if(points.x.length!=points.y.length){
        alert('invalid points array');
        return '';
    }
    var path = 'M';
    for(var i=0;i<points.x.length;++i){
        path+= points.x[i] + ',' + points.y[i];
        if(i<points.x.length-1)
            path +='L';
    }
    path += 'Z';
    shape.path = path;
    // color the shape:
    if($("#analysisModeSelect").val()=="subset"||$("#analysisModeSelect").val()=="global"){
        shape.line = {color: 'cyan', width:4}
        shape.fillcolor = 'cyan'
        shape.opacity = 0.4;
    }
    else{
        shape.line = {color: 'purple', width:4}
        shape.fillcolor = 'green';
        shape.opacity =0.4;
    }
    shape.editable = true;
    if(name){
        shape.name = name;
        if(name.includes('excluded')){
            shape.line = {color: 'red'};
            shape.fillcolor = 'red';
            shape.opacity = 0.2;
        }
    }
    return shape;
}

function pathShapeToPoints(shape){
    if(shape.type!='path'){
        alert('invalid shape (non-path)');
        return;
    }
    var pathString = shape.path;
    var points = {x:[],y:[]};
    var array = pathString.split(/(?:[A-Z,])/g);
    array.shift(); // get rid of the empty elements at the start and end of the array
    array.pop();
    for(var i=0;i<array.length;i++){
        points.x.push(parseInt(array[i++]));
        points.y.push(parseInt(array[i]));
    }
    return points;
}
