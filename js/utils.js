$(window).load(function(){
    // TODO  set the default show/hide positions for toggles    
    // set the stereo toggle to off
    $('#runLi span').text('run 2d');
    hideStereoViewer();
    // resize the full div elements
    resizeAll();
});

// launch external links in the default browser not the frame
const shell = require('electron').shell;
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

// toggle the params menu on or off
document.getElementById("paramsButton").onclick = function(){
    if($('#innerFluidRightCol').css('display')=='none'){
        $('#innerFluidRightCol').css('display','inline-block');
        $('#innerFluidRightCol').css('width','30%');
        $('#innerFluidLeftCol').css('width','70%');
    }
    else {
        $('#innerFluidRightCol').css('display','none');
        $('#innerFluidLeftCol').css('width','100%');
    }
    resizeAll();
};

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
    }
}

// resize all columns and inner-columns to make fill-divs fill the column
function resizeAll(){
    resizeFullDivs("#innerFluidLeftCol");
    resizeFullDivs("#innerFluidRightCol");
    resizeFullDivs("#subFillDivLeft");
    resizeFullDivs("#subFillDivRight");
}

// resize the elements within the target div
function resizeFullDivs(targetDiv){
    // total height of all divs in the inner fluid right col
    var sumHeight = 0;
    $(targetDiv + '> div').each(function() {
        sumHeight += $(this).outerHeight();
    });
    var currentFillHeight = $(targetDiv).find('.fill-div').outerHeight();
    sumHeight -= currentFillHeight;
    var totalHeight = $(targetDiv).outerHeight();
    var resizeHeight = totalHeight - sumHeight - 10;
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

function hideStereoViewer(){
    $('#subFillDivRight').css('display','none');
    $('#subFillDivLeft').css('width','100%');
    $(".nav-two-cam").css('display','none');
}

function showStereoViewer(){
    $('#subFillDivRight').css('display','inline-block');
    $('#subFillDivRight').css('width','50%');
    $('#subFillDivLeft').css('width','50%');
    $(".nav-two-cam").css('display','block');
}
