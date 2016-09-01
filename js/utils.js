$(window).load(function(){
    // resize the full div elements
    resizeFullDivs();
});

window.addEventListener('resize', function(){resizeFullDivs();}, true);

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
    // now find any fill divs and resize them
    resizeFullDivs();
}

function resizeFullDivs(){
    // total height of all divs in the inner fluid right col
    var sumHeight = 0;
    $(".inner-fluid-right-col > div").each(function() {
        sumHeight += $(this).outerHeight();
    });
    var currentFillHeight = $('.fill-div').outerHeight();
    sumHeight -= currentFillHeight;
    var totalHeight = $('.inner-fluid-right-col').outerHeight();
    var resizeHeight = totalHeight - sumHeight - 20;
    $('.fill-div').outerHeight(resizeHeight);    
}

// toggle boxes up and down
$(".toggler").click(function(){resizeView(this);});
