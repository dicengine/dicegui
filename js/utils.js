document.getElementById("clearConsoleIcon").onclick = function() {eraseText("consoleWindow")};

function eraseText(object_id) {
    document.getElementById(object_id).innerHTML = "Console output:" + '<br/><br/>';
}

$('#viewerControlPanel').on('shown.bs.collapse', function () {
    resizeView();
})
$('#viewerControlPanel').on('hidden.bs.collapse', function () {
    resizeView();
})
$('#consolePanel').on('shown.bs.collapse', function () {
    resizeView();
})
$('#consolePanel').on('hidden.bs.collapse', function () {
    resizeView();
})

function resizeView() {
    var viewerControlHeight = document.getElementById("viewerControlPanel").offsetHeight;
    var consoleHeight = document.getElementById("consolePanel").offsetHeight;
    var totalHeight = document.getElementById("innerFluidLeftCol").clientHeight;
    console.log(totalHeight);
    console.log(viewerControlHeight);
    console.log(consoleHeight);
    document.getElementById("viewerPanel").style.height = totalHeight - viewerControlHeight - consoleHeight - 20 + "px";
}


$(".inner-fluid-left-col > div").click(function(){
    // if you need element's ID
    var divID = this.id;
    alert("I Clicked this id: " + divID);
});

// toggle boxes up and down
$(".toggler").click(function(){
    var H = $(this).parent().parent('div').parent('div').outerHeight();
    var bannerH = $(this).parent().parent('div').outerHeight();
    if(H==bannerH){
        $(this).parent().parent('div').parent('div').outerHeight("auto");
    }else{
        $(this).parent().parent('div').parent('div').outerHeight(bannerH + "px");
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
    
});
