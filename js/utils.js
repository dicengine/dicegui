//const electron = require('electron');
//const shell = electron.shell;
//const {dialog} = electron.remote;
//const homeDir = os.homedir();
//const fs = require('fs');

$(window).load(function(){
    initialize_gui(true);
});

// tasks for when window loads
function initialize_gui(load_existing){
    // see if the .dice file exists:
    fileName = homeDir;
    if(os.platform()=='win32'){
        fileName += '\\.dice.js';
    }else{
        fileName += '/.dice.js';
    }
    // resize the full div elements
    resizeAll();
    // hide the run button until the input is valid
    $("#runLi").hide();
    $("#abortLi").hide();
    $("#writeLi").hide();
    // hide the stereo utilities
    $("#previewCross").hide();
    $("#initCross").hide();
    // hide the tracking tools
    $(".tracking").hide();
    // hide the thresholding option
    $(".feature-thresh").hide();
    // hide the global tools
    $(".global").hide();
    $(".cal-options").hide();
    //$("#trackingParams").hide();
    $("#analysisModeSelect").val("subset").change();

    // hide the minimized bars for closed views
    $("#leftMinimized").hide();
    $("#rightMinimized").hide();

    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            consoleMsg('loading GUI state and preferences from ' + fileName);
            $.getScript(fileName, function(){
                if(showPrefPaneState){
                    showParams();
                }else{
                    hideParams();
                }
                $("#fileSelectMode").val(fileSelectMode).change();
                $("#analysisModeSelect").val(analysisModeSelect).change();
                //if($("#analysisModeSelect").val()=='tracking')
                //    showStereoPaneState=0;
                if($("#analysisModeSelect").val()=='global')
                    showStereoPaneState=0;
                if(showStereoPaneState==1){
                    showStereoViewer();
                }else if(showStereoPaneState==0){
                    show2DViewer();
                }
                if(omitTextState){
                    $("#omitTextCheck").prop("checked",true);
                }
                else{
                    $("#omitTextCheck").prop("checked",false);
                }
                if(showConsoleState){
                    defaultConsole();
                }else{
                    showConsole = false;
                    defaultConsole();
                }
                if(viewersStackedState){
                    stackViews();
                }else{
                    unstackViews();
                }
                if(typeof execPathOverride === 'undefined'){}
                else{
                    if(execPathOverride!=''){
                        alert('setting the exec path to: ' + execPathOverride);
                        setExecPaths(execPathOverride);
                    }
                }
//                paraviewMsg = paraviewMsgState;
                workingDirectory = WD;
                if (fs.existsSync(workingDirectory)) {
                    createHiddenDir();
                    updateWorkingDirLabel();
                    if(load_existing){
                        // load the existing input file if there is one in this directory:
                        var existing_input = fullPath('','input.xml');
                        console.log('loading existing input file if it exists: ' + existing_input);
                        deleteHiddenFiles('cine_stats');
                        parse_input_xml_file(existing_input);
                    }
                }else{
                    workingDirectory = homeDir;
                    if(os.platform()=='win32'){
                        workingDirectory += '\\dice_working_dir';
                    }else{
                        workingDirectory += '/dice_working_dir';
                    }
                    fs.mkdir(workingDirectory,function(e){
                        if(!e || (e && e.code === 'EEXIST')){
                        } else {
                            console.log(e);
                        }
                        createHiddenDir();
                    });
                    updateWorkingDirLabel();
                }
                // remove all the display images:
                deleteHiddenFiles('.preview_left');
                deleteHiddenFiles('.preview_right');
                deleteHiddenFiles('keypoints');
                deleteHiddenFiles('background');
                // test if debugging messages are turned on or off
                testForDebugMsg();
            });
        } else if(err.code == 'ENOENT') {
            // file does not exist
            consoleMsg('no previous state or preferences saved');
            showParams();
            $('#runLi span').text('run 2d');
            show2DViewer();
            unstackViews();
            workingDirectory = homeDir;
            if(os.platform()=='win32'){
                workingDirectory += '\\dice_working_dir';
            }else{
                workingDirectory += '/dice_working_dir';
            }
            fs.mkdir(workingDirectory,function(e){
                if(!e || (e && e.code === 'EEXIST')){
                } else {
                    console.log(e);
                }
                createHiddenDir();
            });
            updateWorkingDirLabel();
            // remove all the display images:
            deleteHiddenFiles('.preview_left');
            deleteHiddenFiles('.preview_right');
            deleteHiddenFiles('keypoints');
            deleteHiddenFiles('background');
            // test if debugging messages are turned on or off
            testForDebugMsg();
        } else {
            consoleMsg('error occurred trying to load previous state');
        }
        return;
    });
    checkValidInput();
    populateContourFields();
};

function createHiddenDir(){
    // create a hidden folder for all of the file input output between the GUI and the analysis exec
    hiddenDir = workingDirectory;
    if(os.platform()=='win32'){
        hiddenDir += '\\.dice';
    }else{
        hiddenDir += '/.dice';
    }
    fs.mkdir(hiddenDir,function(e){
        if(!e || (e && e.code === 'EEXIST')){
        } else {
            console.log(e);
        }
    });
}

function testForDebugMsg() {
    // test if the dice exectuable path exists
    exec_check = require('fs');
    exec_check.access(execPath, (err) => {
        if (err) {
            alert("DICe executable path does not exist. Did you set the path in global.js?\nPlease select the correct path in the following dialog.");
            dialog.showOpenDialog({
                properties: ['openDirectory']
            }, function (folder) {
                if (folder != 'undefined'){
                    if(os.platform()=='win32'){
                        folder = folder +"\\";
                    }else if(os.platform()=='linux' || os.platform()=='darwin'){
                        folder = folder +"/";
                    }
                    execPathOverride = folder;
                    alert('setting the exec path to: ' + execPathOverride);
                    setExecPaths(execPathOverride);
                }
            });
        } else {
            // test if debugging messages are turned on or off
            child_process = require('child_process');
            proc = child_process.execFile(execPath, ['-d'], { cwd: workingDirectory });
            proc.on('error', function () {
                alert('Error! invalid DICe executable: ' + execPath);
            });
            proc.on('close', (code) => {
                console.log(`DICe test for debug messages exited with code ${code}`);
                if (code == 0) {
                    console.log("debug messages are on");
                    diceDebugMsgOn = true;
                }
            });
            // test if the tracking library is available
            proc = child_process.execFile(execPath, ['--tracklib'], { cwd: workingDirectory });
            proc.on('error', function () {
                alert('Error! invalid DICe executable: ' + execPath);
            });
            proc.on('close', (code) => {
                console.log(`DICe test for tracklib exited with code ${code}`);
                if (code == 0) {
                    console.log("tracklib is on");
                    alert("Copyright 2020 National Technology & Engineering Solutions of Sandia, LLC (NTESS).\n"
                     +"Under the terms of Contract DE-NA0003525 with NTESS, there is a non-exclusive license\n"
                     +"for use of this work by or on behalf of the U.S. Government. Export of this data may\n"
                     +"require a license from the United States Government.\n"
                     +"For five (5) years from 6/11/2020, the United States Government is granted for itself\n"
                     +"and others acting on its behalf a paid-up, nonexclusive, irrevocable worldwide license\n"
                     +"in this data to reproduce, prepare derivative works, and perform publicly and display\n"
                     +"publicly, by or on behalf of the Government. There is provision for the possible\n"
                     +"extension of the term of this license. Subsequent to that period or any extension\n"
                     +"granted, the United States Government is granted for itself and others acting on its\n"
                     +"behalf a paid-up, nonexclusive, irrevocable worldwide license in this data to reproduce,\n"
                     +"prepare derivative works, distribute copies to the public, perform publicly and display\n"
                     +"publicly, and to permit others to do so. The specific term of the license can be\n"
                     +"identified by inquiry made to National Technology and Engineering Solutions of\n"
                     +"Sandia, LLC or DOE.\n"
                     +"NEITHER THE UNITED STATES GOVERNMENT, NOR THE UNITED STATES DEPARTMENT OF ENERGY,\n"
                     +"NOR NATIONAL TECHNOLOGY AND ENGINEERING SOLUTIONS OF SANDIA, LLC, NOR ANY OF THEIR\n"
                     +"EMPLOYEES, MAKES ANY WARRANTY, EXPRESS OR IMPLIED, OR ASSUMES ANY LEGAL\n"
                     +"RESPONSIBILITY FOR THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY INFORMATION,\n"
                     +"APPARATUS, PRODUCT, OR PROCESS DISCLOSED, OR REPRESENTS THAT ITS USE WOULD NOT\n"
                     +"INFRINGE PRIVATELY OWNED RIGHTS.\n"
                     +"Any licensee of DICe::Tracklib has the obligation and responsibility to abide\n"
                     +"by the applicable export control laws, regulations, and general prohibitions\n"
                     +"relating to the export of technical data. Failure to obtain an export control license\n"
                     +"or other authority from the Government may result in criminal liability under U.S. laws.");
                    diceTrackLibOn = true;
                    if (showStereoPaneState == 1 && $("#analysisModeSelect").val() == 'tracking') {
                        $(".non-tracklib-tools").hide();
                        $(".tracklib-tools").show();
                        $(".results-right").show();
                        showStereoViewer();
                    }
                }
            });
        }
    });
}

// last items before closing browser
$(window).bind("beforeunload", function() {
    saveStateFile();
});

// launch external links in the default browser not the frame
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

$("#changeWorkingDirLi").click(function(){
    var path =  dialog.showOpenDialog({defaultPath: workingDirectory, properties: ['openDirectory','createDirectory']});
    if(path){
        workingDirectory = path[0];
        updateWorkingDirLabel();
        createHiddenDir();
        resetWorkingDirectory();
        var fileName = fullPath('','input.xml');
        fs.stat(fileName, function(err, stat) {
            if(err == null) {
                if (confirm('load the existing input files in this working directory?')) {
                    console.log('loading existing input file if it exists: ' + fileName);
                    parse_input_xml_file(fileName);
                    checkValidInput();
                }else{
                    return false;
                }
            }else {
                checkValidInput();
            }
        });
        
    }
});

$("#changeImageFolder").click(function(){
    var path =  dialog.showOpenDialog({defaultPath: workingDirectory, properties: ['openDirectory']});
    if(path){
        autoDetectImageSequence(path[0],updateSequenceLabels);
        $('#imageFolder span').text(path[0]);
    }
});

function updateSequenceLabels(stats){
    $("#imagePrefix").val(stats.prefix);
    $("#imageSuffix").val(stats.suffix);
    $("#refIndex").val(stats.startIndex);
    $("#startIndex").val(stats.startIndex);
    $("#endIndex").val(stats.endIndex);
    $("#skipIndex").val(stats.frameInterval);
    $("#numDigits").val(stats.numDigits);
    $("#stereoLeftSuffix").val(stats.leftSuffix);
    $("#stereoRightSuffix").val(stats.rightSuffix);
    $("#imageExtension").val(stats.extension);
    updateFrameScrollerRange();
    updateImageSequencePreview(true);
}

$("#startIndex,#endIndex,#skipIndex,#imagePrefix,#numDigits,#imageExtension,#stereoLeftSuffix,#stereoRightSuffix").keypress(function(event) { 
    if(!$('#fileSelectMode').val()=="sequence") return;
    if (event.keyCode === 13) { 
        if($('#skipIndex').val()<0)
            $('#skipIndex').val(0);
        updateFrameScrollerRange();
        updateImageSequencePreview(true);
    }
}); 

function concatImageSequenceName(stereoImageFlag){
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
    var tmpNum = Number($("#currentPreviewSpan").text());//Number($("#refIndex").val());
    var defDig = 0;
    if(tmpNum==0)
        defDig = 1;
    else{
        while (tmpNum) {tmpNum = Math.floor(tmpNum / 10); defDig++;}
    }
    var digits = Number($("#numDigits").val());
    if(digits > 1)
        for(var j=0;j<digits - defDig;++j){
            fullImageName += "0";
        }
    fullImageName += $("#currentPreviewSpan").text();//$("#refIndex").val();
    if((showStereoPane==1||showStereoPane==2)&&stereoImageFlag==0){
        fullImageName += $("#stereoLeftSuffix").val();
    }else if((showStereoPane==1||showStereoPane==2)&&stereoImageFlag==1){
        fullImageName += $("#stereoRightSuffix").val();
    }
    if(showStereoPane==0)
        fullImageName += $("#imageSuffix").val();
    fullImageName += $("#imageExtension").val();
    return fullImageName;
}


function updateImageSequencePreview(loadImage){
    var fullImageName = concatImageSequenceName(0);
    $('#imageSequencePreview span').text(fullImageName);

    // see if the file exists:
    fs.stat(fullImageName, function(err, stat) {
        if(err == null) {
            $("#imageSequencePreview").css({color:"#009933"})
            if(loadImage)
                loadImageSequence();
        }
        else{
            $("#imageSequencePreview").css({color:"#ff0000"})
        }
    });    
}

function updateWorkingDirLabel(){
    $("#workingDirLabel").text(workingDirectory);
    updateResultsFilesList();
}

function updateResultsFilesList(){
    $("#resultsFilesList").text("");
    var workingDir = workingDirectory;
    if(os.platform()=='win32'){
        workingDir += '\\results';
    }else{
        workingDir += '/results';       
    }
    fs.readdir(workingDir, function(err,dir) {
        if(dir){
            for(var i = 0, l = dir.length; i < l; i++) {
                var filePath = dir[i];
                $("#resultsFilesList").append(filePath + '</br>');
            }
        }
    });

    function appendFile(inputName){
        var fileName = workingDirectory;
        if(os.platform()=='win32'){
            fileName += '\\';
        }else{
            fileName += '/';
        }
        fileName += inputName
        fs.stat(fileName, function(err, stat) {
            if(err == null) {                
                $("#resultsFilesList").append(inputName + '</br>');
            }
        });
    }

    // add any .dat files from the working directory to the list
    appendFile("projection_points.dat");
    appendFile("projection_out.dat");
    appendFile("best_fit_plane.dat");
    appendFile("best_fit_plane_out.dat");
}

// toggle the params menu on or off
$("#paramsButton").click(function(){
    if($('#innerFluidRightCol').css('display')=='none'){
        showParams();
    }
    else {
        hideParams();
    }
});
function showParams(){
    $('#innerFluidRightCol').css('display','inline-block');
    $('#innerFluidRightCol').css('width','25%');
    $('#innerFluidLeftCol').css('width','75%');
    resizeAll();
    showPrefPane = true;
}
function hideParams(){
    $('#innerFluidRightCol').css('display','none');
    $('#innerFluidLeftCol').css('width','100%');
    resizeAll();
    showPrefPane = false;
}

// clear the console text
$("#clearConsoleIcon").click(function() {
    eraseText("consoleWindow")
});
function eraseText(object_id) {
    document.getElementById(object_id).innerHTML = "Console output:" + '<br/><br/>';
};

function consoleMsg(string){
    //document.getElementById("consoleWindow").append(string + '</br>');
    //document.getElementById("consoleWindow").scrollTop = document.getElementById("consoleWindow").scrollHeight
    $("#consoleWindow").append(string + '</br>');
    $("#consoleWindow").scrollTop($("#consoleWindow").get(0).scrollHeight);
}

// resize the full divs on window resize
window.addEventListener('resize', function(){resizeAll();}, true);

// toggle columns open or closed
$(".pane-opener").click(function(){
    // show the correct panel
    var myId = $(this).parent().parent().parent().attr('id');
    if(myId=="leftMinimized"){
        $("#subFillDivLeft").show();
    }else if(myId=="rightMinimized"){
        $("#subFillDivRight").show();
    }
    // hide this element
    $(this).parent().parent().parent().hide();

    resizeAll();
});

$(".pane-closer").click(function(){
    // gather the outer height and width of all columns
    var widths = [];
    var heights = [];
    $(".pane-closer").each(function( index ) {
        heights.push($(this).parent().parent('div').parent('div').parent('div').outerHeight());
        widths.push($(this).parent().parent('div').parent('div').parent('div').outerWidth());
        console.log('column height ' + heights[heights.length-1] + ' width ' + widths[widths.length - 1]);
    });

    // hide this pannel
    $(this).parent().parent('div').parent('div').parent('div').hide();

    var parentId = $(this).parent().parent('div').parent('div').parent('div').attr('id');
    if(parentId=="subFillDivLeft"){    
        $("#leftMinimized").show();
    }else if(parentId=="subFillDivRight"){    
        $("#rightMinimized").show();
    }
    resizeAll();
})

// toggle boxes up and down
$(".toggler").click(function(){resizeView(this);});

// resize the divs to fill the column when called from a toggle button
function resizeView(toggler) {
    var H = $(toggler).parent().parent('div').parent('div').outerHeight();
    var bannerH = $(toggler).parent().parent('div').outerHeight();
    if(H==bannerH){ // toggle will show
        $(toggler).parent().parent('div').parent('div').outerHeight("auto");
        // change the border radius
        $(toggler).parent().parent('div').css('border-radius','5px 5px 0px 0px');
    }else{ // toggle will hide
        $(toggler).parent().parent('div').parent('div').outerHeight(bannerH + "px");
        // change the border radius
        $(toggler).parent().parent('div').css('border-radius','5px');
    }
    // now find any fill divs and resize the
    // NOTE assumes that top level div has an id (TODO address this)
    resizeFullDivs("#" + $(toggler).parent().parent('div').parent('div').parent('div').attr('id'));

    // the console tag should call the resize method here
    if($(toggler).attr('id')=='consoleToggle'){
        resizeAll();
        showConsole = !showConsole;
    }
}

function defaultConsole(){
    var bannerH = $("#consoleToggle").parent().parent('div').outerHeight();
    if(showConsole){
        $("#consoleToggle").parent().parent('div').parent('div').outerHeight("40%");
        $("#consoleToggle").parent().parent('div').css('border-radius','5px 5px 0px 0px');
    }else{
        $("#consoleToggle").parent().parent('div').parent('div').outerHeight(bannerH + "px");
        $("#consoleToggle").parent().parent('div').css('border-radius','5px');
    }
    resizeAll();
}


// resize all columns and inner-columns to make fill-divs fill the column
function resizeAll(){
    resizeViewerFillDivs();
    resizeFullDivs("#innerFluidLeftCol");
    resizeFullDivs("#innerFluidRightCol");
    resizeFullDivs("#subFillDivLeft");
    resizeFullDivs("#subFillDivRight");
    resizePreview();
}

// resize the elements within the target div
function resizeFullDivs(targetDiv){
    // total height of all divs in the targetDiv
    var sumHeight = 0;
    $(targetDiv + '> div').each(function() {
        if($(this).is(":visible")){
            sumHeight += $(this).outerHeight(true);
        }
    });
    var currentFillHeight = $(targetDiv).find('.fill-div').outerHeight();
    sumHeight -= currentFillHeight;
    var totalHeight = $(targetDiv).outerHeight(true);
    var resizeHeight = totalHeight - sumHeight - 8;
    // NOTE assumes only one div in the targetDiv should fill the leftover space
    $(targetDiv).find('.fill-div').each(function() {
        $(this).outerHeight(resizeHeight);
    })
}

// toggle boxes up and down
$("#stereoButton").click(function(){
    // if tracking mode is selected button is disabled:
    if($("#analysisModeSelect").val()=='tracking'&&!diceTrackLibOn)return;
    if($("#analysisModeSelect").val()=='global') return;
    
    // get the current state of stereo on or off:
    var oldText = $('#runLi span').text();
    if(oldText=='run 2d'){
        showStereoViewer();
        $(".results-right").show();
        if($("#analysisModeSelect").val()=='tracking'&&showStereoPane==1){
            resetPlotlyViewer('left',true);
            resetPlotlyViewer('right',true);
            $(".non-tracklib-tools").hide();
            $(".tracklib-tools").show();
            if($("#fileSelectMode").val()!="cine")
                $("#fileSelectMode").val("cine").change();
        }else{
            $(".non-tracklib-tools").show();
            $(".tracklib-tools").hide();
        }
    }else{
        show2DViewer();
        if($("#analysisModeSelect").val()=='tracking')
            $(".results-right").hide();
        $(".non-tracklib-tools").show();
        $(".tracklib-tools").hide();
        $(".results-right").hide();
    }
    populateContourFields();
    checkValidInput();
//    showBestFitLine();
//    resizeAll();
});

function resizeViewerFillDivs(){
    // get the total height and width of the viewer
    var totalHeight = $("#viewerFillDiv").outerHeight();
    var totalWidth = $("#viewerFillDiv").outerWidth();
    // iterate the divs inside the viewer currently being displayed
    var numActiveDivs = 0;
    var numTotalDivs = 0;
    $("#viewerFillDiv" + '> div').each(function() {
        if($(this).is(":visible")){
            numTotalDivs++;
            if($(this).hasClass("sub-fill-div")){
                numActiveDivs++;
            }
        }
    });
    var numMinimized = numTotalDivs - numActiveDivs;    
    if(viewersStacked){
        var newHeight = Math.floor((totalHeight - numMinimized*32-1)/numActiveDivs);
        $("#viewerFillDiv" + '> div').each(function() {
            if($(this).is(":visible")&&$(this).hasClass("sub-fill-div")){
                $(this).css('width','100%');
                $(this).css('height',newHeight);
            }
        });
    }else{
        // each inactive view is 32 pixels wide
        var newWidth = Math.floor((totalWidth - numMinimized*32-1)/numActiveDivs);
        $("#viewerFillDiv" + '> div').each(function() {
            if($(this).is(":visible")&&$(this).hasClass("sub-fill-div")){
                $(this).css('width',newWidth);
                $(this).css('height','100%');
            }
        });
    }
}


$("#stackButton").click(function(){
    if(viewersStacked==false){
        stackViews();
    }else{
        unstackViews();
    }
});

function stackViews(){
    $('#stackIcon').css('transform','rotate(90deg)');
    $('.pane-opener').css('transform','rotate(180deg)')
    //$('.pane-opener').parent('div').css('padding','0px 3px 0px 0px');    
    $('.pane-closer').css('transform','rotate(0deg)');
    $("#viewerFillDiv" + '> div').each(function() {
       if($(this).hasClass("minimized-bar")){
            $(this).css('width','100%');
            $(this).css('height','32px');
        }
    });
    viewersStacked = true;
    resizeAll();
}
function unstackViews(){
    $('#stackIcon').css('transform','rotate(0deg)');
    $('.pane-opener').css('transform','rotate(90deg)');    
    //$('.pane-opener').parent().css('padding','3px 3px 0px 0px');    
    $('.pane-closer').css('transform','rotate(270deg)');    
    $("#viewerFillDiv" + '> div').each(function() {
        if($(this).hasClass("minimized-bar")){
            $(this).css('height','100%');
            $(this).css('width','32px');
        }
    });
    viewersStacked = false;
    resizeAll();
}

function show2DViewer(){
    $('#subFillDivLeft').css('display','inline-block');
    $('#subFillDivRight').css('display','none');
    $("#rightMinimized").hide();
    $("#leftMinimized").hide();
    $("#leftPaneToggle").hide();
    $('#subFillDivLeft').css('width','100%');
    $('#subFillDivLeft').css('height','100%');
    $(".nav-two-cam").css('display','none');
    $(".nav-one-cam").show();
    if($("#calibrationCheck")[0].checked){
        $(".cal-options").show();
    }else{
        $(".cal-options").hide();
    }
    $(".nav-three-cam").css('display','none');
    $("#stackButton").css('display','none');
    showStereoPane = 0;
    $('#runLi span').text('run 2d');
    $("#stereoParams").hide();
    $('#x1x2').text('x 1');
    //deactivateEpipolar();
    $(".tracklib-tools").hide();
    resizeAll();
    checkValidInput();
}

function showStereoViewer(){
    $('#subFillDivLeft').css('display','inline-block');
    $('#subFillDivRight').css('display','inline-block');
    $('#subFillDivRight').css('width','50%');
    $('#subFillDivLeft').css('width','50%');
    $(".nav-one-cam").hide();
    $(".cal-options").show();
    $("#rightMinimized").hide();
    $("#leftMinimized").hide();
    $("#leftPaneToggle").show();
    $(".nav-two-cam").css('display','block');
    $(".nav-three-cam").css('display','none');
    $("#stackButton").css('display','block');
    showStereoPane = 1;
//    if(viewersStacked){
//        stackViews();
//    }
//    else {
//        unstackViews();
//    }
    $("#stereoParams").show();
    $('#runLi span').text('run stereo');
    $('#x1x2').text('x 2');
    drawBestFitLine();
    resizeAll();
    checkValidInput();
}

function updateFrameScrollerRange(){
    if($("#fileSelectMode").val()=="list"){
        $("#startPreviewSpan").text("ref");
        $("#endPreviewSpan").text(defImagePathsLeft.length-1);
        $("#currentPreviewSpan").text("ref");
        $("#frameScroller").attr('max',defImagePathsLeft.length-1);
        $("#frameScroller").attr('min',-1);
        $("#frameScroller").val(-1);
    }else if($("#fileSelectMode").val() == "sequence"){
        $("#startPreviewSpan").text($("#startIndex").val());
        $("#endPreviewSpan").text($("#endIndex").val());
        $("#currentPreviewSpan").text($("#startIndex").val());
        $("#frameScroller").attr('max',$("#endIndex").val());
        $("#frameScroller").attr('min',$("#startIndex").val());
        $("#frameScroller").val($("#startIndex").val());
        $("#frameScroller").attr('step',$("#skipIndex").val());
    }
}

$("#trackDisplayModeSelect").on('change',function(){
    if($("#analysisModeSelect").val()!="tracking"||showStereoPane!=1) return;
    if($("#trackDisplayModeSelect").val()=="all-tracks"){
        transparentPlotlyTraces('left','tracklibPreviewScatter','all','all');
        transparentPlotlyTraces('right','tracklibPreviewScatter','all','all');
    }else if($("#trackDisplayModeSelect").val()=="in-frame-only"){
        transparentPlotlyTraces('left','tracklibPreviewScatter',$("#frameScroller").val(),'all');
        transparentPlotlyTraces('right','tracklibPreviewScatter',$("#frameScroller").val(),'all');
    }else{ // by-id
        transparentPlotlyTraces('left','tracklibPreviewScatter','all',$('#trackGID').val());
        transparentPlotlyTraces('right','tracklibPreviewScatter','all',$('#trackGID').val());
    }
});

$("#analysisModeSelect").on('change',function() {
    $("#showRepSubsetCheck").prop("checked",false);
    $("#bestFitCheck").prop("checked",false);
    if($(this).val()=="subset"){
        $(".full-field").show();
        $(".full-field-global").show();
        $(".full-field-and-tracking").show();
        $(".global").hide();
        $(".non-tracklib-tools").show();
        $(".results-right").show();
        $(".tracklib-tools").hide();
        $(".tracking").hide();
//        drawRepresentativeSubset();
        //$("#subsetParams").show();
        //$("#trackingParams").hide();
        //$("#sssigPreview").show();
    }
    else if($(this).val()=="tracking"){
        $(".full-field").hide();
        $(".full-field-global").hide();
        $(".full-field-and-tracking").show();
        $(".global").hide();
        $(".tracking").show();
        // force 2D
        if(!diceTrackLibOn){
            show2DViewer();
            $(".non-tracklib-tools").show();
            $(".tracklib-tools").hide();
            $(".results-right").hide();
        }else{
            if(showStereoPane==1){
                $(".results-right").show();
                $(".non-tracklib-tools").hide();
                $(".tracklib-tools").show();
                if($("#fileSelectMode").val()!="cine")
                    $("#fileSelectMode").val("cine").change();
            }
            else{
                $(".results-right").hide();
                $(".non-tracklib-tools").show();
                $(".tracklib-tools").hide();
            }
        }
    }
    else if($(this).val()=="global"){
        $(".full-field").hide();
        $(".full-field-global").show();
        $(".full-field-and-tracking").hide();
        $(".global").show();
        $(".non-tracklib-tools").show();
        $(".tracklib-tools").hide();
        $(".tracking").hide();
        // force 2D
        show2DViewer();
    }
    if(!($(this).val()=="tracking"&&showStereoPane==1&&diceTrackLibOn)){
        // if this is tracklib, the reset is called by the fileselectmode change
        resetPlotlyViewer('left',true);
        resetPlotlyViewer('right',true);
    }
    drawBestFitLine();
    resizeAll();
    populateContourFields();
    checkValidInput();
});

$("#fileSelectMode").on('change',function (){
    if($(this).val()=="sequence"){
        $(".nav-sequence").css('display','block');
        $(".nav-list").css('display','none');
        $(".nav-cine").css('display','none');
    }
    else if($(this).val()=="list"){
        $("#skipIndex").val(1);
        $(".nav-sequence").css('display','none');
        $(".nav-list").css('display','block');
        $(".nav-cine").css('display','none');
    }
    else if($(this).val()=="cine"){
        $(".nav-sequence").css('display','none');
        $(".nav-list").css('display','none');
        $(".nav-cine").css('display','block');
    }
    resetWorkingDirectory();
    checkValidInput();
});

$("#initSelect").on('change',function (){
    if($(this).val()=="featureMatchingWThresh")
        $(".feature-thresh").show();
    else
        $(".feature-thresh").hide();
});


$("#subsetSize").on('input',function(){
    var ss_size =  $(this).val();
    $("#subsetSizeLabel").text(ss_size);
    drawRepresentativeSubset();
});

$("#sssigThresh").on('input',function(){
    $("#sssigLabel").text($(this).val());
});

$("#meshSize").on('input',function(){
    $("#meshSizeLabel").text($(this).val());
});

$("#regularizationConstant").on('input',function(){
    $("#regularizationConstantLabel").text($(this).val());
});

$("#stepSize").on('input',function(){
    $("#stepSizeLabel").text($(this).val());
});

$("#stepSize").change(function(){
    var value = $(this).val();
    $("#strainGaugeSize").attr('min',Math.round(value*1));
    $("#strainGaugeSize").attr('max',Math.round(value*10));
    $("#strainGaugeSize").attr('step',value);
    $("#strainGaugeSize").val(Math.round(value*3));
    $("#strainGaugeSizeLabel").text(Math.round(value*3));
});

$("#strainGaugeSize").on('input',function(){
    $("#strainGaugeSizeLabel").text($(this).val());
});

$("#filterSize").on('input',function(){
    $("#filterSizeLabel").text($(this).val());
});

$("#brightnessBeta").on('input',function(){
    $("#brightnessLabel").text($(this).val());
});

$("#binaryThreshBlockSize").on('input',function(){
    $("#binaryThreshBlockSizeLabel").text($(this).val());
});

$("#binaryThreshConstant").on('input',function(){
    $("#binaryThreshConstantLabel").text($(this).val());
});

function saveStateFile() {
    fileName = homeDir;
    if(os.platform()=='win32'){
        fileName += '\\.dice.js';
    }else{
        fileName += '/.dice.js';
    }
    consoleMsg('saving GUI state and preferences to ' + fileName);
    var content = '';
    var WD = workingDirectory;
    if(os.platform()=='win32'){
        WD = WD.replace(/\\/g,"\\\\");
    }    
    content += 'var WD = "' + WD + '";\n';
    if(showPrefPane){
        content += 'var showPrefPaneState = true;\n';
    }else{
        content += 'var showPrefPaneState = false;\n';
    }
    content += 'var showStereoPaneState = ' + showStereoPane + ';\n';
    if(viewersStacked){
        content += 'var viewersStackedState = true;\n';
    }else{
        content += 'var viewersStackedState = false;\n';
    }
    if(showConsole){
        content += 'var showConsoleState = true;\n';
    }else{
        content += 'var showConsoleState = false;\n';
    }
    content += 'var fileSelectMode = "'+$("#fileSelectMode").val() +'";\n';
    content += 'var analysisModeSelect = "'+$("#analysisModeSelect").val() +'";\n';
    if($("#omitTextCheck")[0].checked){
        content += 'var omitTextState = true;\n';
    }
    else{
        content += 'var omitTextState = false;\n';
    }
//    if(paraviewMsg){
//        content += 'var paraviewMsgState = true;\n';
//    }else{
//        content += 'var paraviewMsgState = false;\n';
//    }
    if(typeof execPathOverride === 'undefined'){
    }else{
        if(execPathOverride!=''){
            content += 'var execPathOverride = "'+ execPathOverride +'";\n';
        }
    }
    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("ERROR: an error ocurred creating the file "+ err.message)
        }
        consoleMsg('.dice.js file has been successfully saved');
    });
}

