$(window).load(function(){
    // resize the full div elements
    resizeAll();
});

window.addEventListener('resize', function(){resizeAll();}, true);

document.getElementById("clearConsoleIcon").onclick = function() {eraseText("consoleWindow")};

function eraseText(object_id) {
    document.getElementById(object_id).innerHTML = "Console output:" + '<br/><br/>';
}

function resizeView(toggler) {
    var H = $(toggler).parent().parent('div').parent('div').outerHeight();
    var bannerH = $(toggler).parent().parent('div').outerHeight();
    if(H==bannerH){
        $(toggler).parent().parent('div').parent('div').outerHeight("auto");
    }else{
        $(toggler).parent().parent('div').parent('div').outerHeight(bannerH + "px");
    }
    // now find any fill divs and resize the
    resizeFullDivs("#" + $(toggler).parent().parent('div').parent('div').parent('div').attr('id'));
}

function resizeAll(){
    resizeFullDivs("#innerFluidLeftCol");
    resizeFullDivs("#innerFluidRightCol");
}

function resizeFullDivs(targetDiv){
    // total height of all divs in the inner fluid right col
    var sumHeight = 0;
    $(targetDiv + '> div').each(function() {
        sumHeight += $(this).outerHeight();
    });
    var currentFillHeight = $(targetDiv).find('.fill-div').outerHeight();
    sumHeight -= currentFillHeight;
    var totalHeight = $(targetDiv).outerHeight();
    var resizeHeight = totalHeight - sumHeight - 20;
    // NOTE assumes only one div in the targetDiv should fill the leftover space
    $(targetDiv).find('.fill-div').each(function() {        
        $(this).outerHeight(resizeHeight);
    })
}

// toggle boxes up and down
$(".toggler").click(function(){resizeView(this);});
