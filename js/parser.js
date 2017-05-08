$("#readInput").click(function(){
    parse_input_xml_file("/Users/dzturne/problems/born_qual/dogbone_experimental/Stereo/input.xml");
    //parse_input_xml_file("/Users/dzturne/problems/born_qual/dogbone_experimental/Stereo/input_seq.xml");
    //parse_input_xml_file("/Users/dzturne/problems/born_qual/dogbone_experimental/Stereo/input_cine.xml");
});



function parse_input_xml_file(filename){
    console.log("parsing input file " + filename);
    $.ajax({
        type: "GET",
	url: filename,
	dataType: "xml",
	success: function(xml) {
            impl_input_xml_file(xml);
	} // end success
    }); // end ajax
}

function impl_input_xml_file(xml){
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
    // see if there is a calibration parameters file
    calPath = xml_get(xml,"calibration_parameters_file");
    if(calPath && calPath !== 'null' && calPath != 'undefined'){
        $("#calList").empty();
        // pull off the file name from the above path
        substrs = calPath.split(/[\\\/]/);
        $("#calList").append("<li class='calListLi'>" + substrs[substrs.length-1] + "</li>");
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
    }else{
        // list
        ref_image = xml_get(xml,"reference_image");
        if(ref_image){
            console.log('reading reference image: ' + image_folder + ref_image);
            $("#fileSelectMode").val("list");
            $("#fileSelectMode").change();
            // load the ref image
            full_name = image_folder + ref_image;
            name_splits = full_name.split(/[\\\/]/);
            $("#refImageText span").text(name_splits[name_splits.length-1]);
            getFileObject(full_name, function (fileObject) {
                loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,true,"","");
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
                    });        
                });
            }
            // load the stereo ref image
            stereo_ref_image = xml_get(xml,"stereo_reference_image");
            if(stereo_ref_image){
                stereo_full_name = image_folder + stereo_ref_image;
                stereo_name_splits = stereo_full_name.split(/[\\\/]/);
                $("#refImageTextRight span").text(stereo_name_splits[stereo_name_splits.length-1]);
                getFileObject(stereo_full_name, function (fileObject) {
                    loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","");
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
                    });        
                });
            }
        }
        // sequence
        else{
            ref_img_index = xml_get(xml,"reference_image_index");
            console.log('image folder: ' + image_folder);
            console.log('reference image index: ' + ref_img_index);
            $("#fileSelectMode").val("sequence");
            $("#fileSelectMode").change();
        }
    }


    
    // see if there is a parameters file
    paramsFile = xml_get(xml,"correlation_parameters_file");
    if(paramsFile){
        parse_params_xml_file(paramsFile);
    }
    
    checkValidInput();
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
    // set the sssig threshold
    sssig = xml_get(xml,"sssig_threshold");
    console.log('sssig_threshold: ' + sssig);
    if(sssig){
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
