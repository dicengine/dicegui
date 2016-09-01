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
    // total height of all divs in the inner fluid right col
    var sumHeight = 0;
    $(".inner-fluid-right-col > div").each(function() {
        sumHeight += $(this).outerHeight();
    });
    //alert("sum: " + sumHeight + 'px');
    var currentFillHeight = $('.fill-div').outerHeight();
    //alert("fill current: " + currentFillHeight);
    sumHeight -= currentFillHeight;
    var totalHeight = $('.inner-fluid-right-col').outerHeight();
    //alert("total: " + totalHeight);
    var resizeHeight = totalHeight - sumHeight - 20;
    $('.fill-div').outerHeight(resizeHeight);
}

//$(".inner-fluid-left-col > div").click(function(){
//    // if you need element's ID
//    var divID = this.id;
//    alert("I Clicked this id: " + divID);
//});

// toggle boxes up and down
$(".toggler").click(function(){resizeView(this);});
