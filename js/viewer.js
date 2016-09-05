// initialize panzoom
$("#panzoom").panzoom({
    $zoomIn: $(".zoom-in"),
    $zoomOut: $(".zoom-out"),
    $zoomRange: $(".zoom-range"),
    $reset: $(".reset")
});

// write panzoom transform to console
$("#zoomInfo").click(function(){
    console.log($("#panzoom").panzoom("getTransform"));
});

// show position coordinates in console when mouse over panzoom
//$("#panzoom").mousemove(function( event ) {
//    var msg = "Handler for .mousemove() called at ";
//    msg += event.pageX + ", " + event.pageY;
//    console.log(msg);
//});

// compute the image coordiate of a mouse click in the viewer
$("#panzoom").click(function( event ) {
    var X = event.pageX - this.offsetLeft;
    var Y = event.pageY - this.offsetTop;
    console.log("x = " + X + " y = " + Y);
});

// zoom on focal point from mousewheel    
$("#panzoom").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoom").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});
      
