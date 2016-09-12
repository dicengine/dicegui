const electron = require('electron');
const shell = electron.shell;
const {dialog} = electron.remote;
const os = require('os');
const homeDir = os.homedir()
const fs = require('fs');

// tasks for when window loads
$(window).load(function(){
    // see if the .dice file exists:
    fileName = homeDir;
    if(os.platform()=='win32'){
        fileName += '\\.dice.js';
    }else{
        fileName += '/.dice.js';
    }

    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            $('#consoleWindow').append('loading GUI state and preferences from ' + fileName + ' <br/>');
            $.getScript(fileName, function(){
                if(showPrefPaneState){
                    showParams();
                }else{
                    hideParams();
                }
                if(showStereoPaneState){
                    $('#runLi span').text('run stereo');
                    showStereoViewer();
                }else{
                    $('#runLi span').text('run 2d');
                    hideStereoViewer();
                }
                if(viewersStackedState){
                    stackViews();
                }else{
                    unstackViews();
                }
                if(showConsoleState){
                    defaultConsole();
                }else{
                    showConsole = false;
                    defaultConsole();
                }
            });
        } else if(err.code == 'ENOENT') {
            // file does not exist
            $('#consoleWindow').append('no previous state or preferences saved <br/>');
            showParams();
            $('#runLi span').text('run 2d');
            hideStereoViewer();
            unstackViews();
        } else {
            $('#consoleWindow').append('error occurred trying to load previous state <br/>');
        }
    });
    // resize the full div elements
    resizeAll();
    // set the default working dir to the home dir
    workingDirectory = homeDir;
    updateWorkingDirLabel();
});

// last items before closing browser
$(window).bind("beforeunload", function() {
    saveStateFile();
    //return confirm("Do you really want to close?");
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
    }
});

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
    
}

// toggle the params menu on or off
document.getElementById("paramsButton").onclick = function(){
    if($('#innerFluidRightCol').css('display')=='none'){
        showParams();
    }
    else {
        hideParams();
    }
};
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
document.getElementById("clearConsoleIcon").onclick = function() {eraseText("consoleWindow")};
function eraseText(object_id) {
    document.getElementById(object_id).innerHTML = "Console output:" + '<br/><br/>';
}

// resize the full divs on window resize
window.addEventListener('resize', function(){resizeAll();}, true);

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
        $("#consoleToggle").parent().parent('div').parent('div').outerHeight("auto");
        $("#consoleToggle").parent().parent('div').css('border-radius','5px 5px 0px 0px');
    }else{
        $("#consoleToggle").parent().parent('div').parent('div').outerHeight(bannerH + "px");
        $("#consoleToggle").parent().parent('div').css('border-radius','5px');
    }
    resizeAll();
}


// resize all columns and inner-columns to make fill-divs fill the column
function resizeAll(){
    resizeFullDivs("#innerFluidLeftCol");
    resizeFullDivs("#innerFluidRightCol");
    resizeFullDivs("#subFillDivLeft");
    resizeFullDivs("#subFillDivRight");
    $("#panzoomLeft").panzoom("resetDimensions");
    $("#panzoomRight").panzoom("resetDimensions");
}

// resize the elements within the target div
function resizeFullDivs(targetDiv){
    // total height of all divs in the targetDiv
    var sumHeight = 0;
    $(targetDiv + '> div').each(function() {
        sumHeight += $(this).outerHeight(true);
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
    // get the current state of stereo on or off:
    var oldText = $('#runLi span').text();
    if(oldText=='run 2d'){
        $('#runLi span').text('run stereo');
        $('#x1x2').text('x 2');
        showStereoViewer();
    }else{
        $('#runLi span').text('run 2d');
        $('#x1x2').text('x 1');
        hideStereoViewer();
    }
    resizeAll();
});

$("#stackButton").click(function(){
    if(viewersStacked==false){
        stackViews();
    }else{
        unstackViews();
    }
});

function stackViews(){
    $('#stackIcon').css('transform','rotate(90deg)'); 
    $('#subFillDivRight').css('width','100%');
    $('#subFillDivLeft').css('width','100%');
    if(showStereoPane){
        $('#subFillDivRight').css('height','50%');
        $('#subFillDivLeft').css('height','50%');
    }
    else{
        $('#subFillDivLeft').css('height','100%');
    }
    viewersStacked = true;
    resizeAll();    
}
function unstackViews(){
    $('#stackIcon').css('transform','rotate(0deg)');
    if(showStereoPane){
        $('#subFillDivRight').css('width','50%');
        $('#subFillDivLeft').css('width','50%');
    }
    else{
        $('#subFillDivLeft').css('height','100%');
    }
    $('#subFillDivRight').css('height','100%');
    $('#subFillDivLeft').css('height','100%');
    viewersStacked = false;
    resizeAll();    
}

function hideStereoViewer(){
    $('#subFillDivRight').css('display','none');
    $('#subFillDivLeft').css('width','100%');
    $('#subFillDivLeft').css('height','100%');
    $(".nav-two-cam").css('display','none');
    $("#stackButton").css('display','none');
    showStereoPane = false;
    $('#runLi span').text('run 2d');
}

function showStereoViewer(){
    $('#subFillDivRight').css('display','inline-block');
    $('#subFillDivRight').css('width','50%');
    $('#subFillDivLeft').css('width','50%');
    $(".nav-two-cam").css('display','block');
    $("#stackButton").css('display','block');
    showStereoPane = true;
    if(viewersStacked){
        stackViews();
    }
    else {
        unstackViews();
    }
}

$("#subsetSize").on('input',function(){
    $("#subsetSizeLabel").text($(this).val());
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

function saveStateFile() {  
    fileName = homeDir;
    if(os.platform()=='win32'){
        fileName += '\\.dice.js';
    }else{
        fileName += '/.dice.js';
    }
    $('#consoleWindow').append('saving GUI state and preferences to ' + fileName + ' <br/>');
    var content = '';
    if(showPrefPane){
        content += 'var showPrefPaneState = true;\n';
    }else{
        content += 'var showPrefPaneState = false;\n';
    }
    if(showStereoPane){
        content += 'var showStereoPaneState = true;\n';
    }else{
        content += 'var showStereoPaneState = false;\n';
    }
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
    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("ERROR: an error ocurred creating the file "+ err.message)
        }
        $('#consoleWindow').append('.dice.js file has been successfully saved <br/>');
    });
}
