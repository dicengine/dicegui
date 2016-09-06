// initialize panzoom
$("#panzoomLeft").panzoom({
    $zoomIn: $(".zoom-in-left"),
    $zoomOut: $(".zoom-out-left"),
    $zoomRange: $(".zoom-range-left"),
    $reset: $(".reset-left"),
    $which: 3
});
$("#panzoomLeft").panzoom("option", "which", 3);
$("#panzoomLeft").panzoom("option", "cursor", "pointer");
$("#panzoomRight").panzoom({
    $zoomIn: $(".zoom-in-right"),
    $zoomOut: $(".zoom-out-right"),
    $zoomRange: $(".zoom-range-right"),
    $reset: $(".reset-right"),
    $which: 3
});
$("#panzoomRight").panzoom("option", "which", 3);
$("#panzoomRight").panzoom("option", "cursor", "pointer");

// write panzoom transform to console
$("#zoomInfoLeft").click(function(){
    console.log($("#panzoomLeft").panzoom("getTransform"));
});

//$("#zoomInRight").on("click", function( e ) { e.preventDefault(); $("#panzoomRight").panzoom("zoom"); });
//$("#zoomOutRight").on("click", function( e ) { e.preventDefault(); $("#panzoomRight").panzoom("zoom",true); });
//$("#rightZoomRange").on("click", function( e ) { e.preventDefault(); $("#panzoomRight").panzoom("zoom",true); });

// show position coordinates in console when mouse over panzoom
//$("#panzoom").mousemove(function( event ) {
//    var msg = "Handler for .mousemove() called at ";
//    msg += event.pageX + ", " + event.pageY;
//    console.log(msg);
//});

// compute the image coordiate of a mouse click in the viewer
$("#panzoomLeft").click(function( event ) {
    var X = event.pageX - this.offsetLeft;
    var Y = event.pageY - this.offsetTop;
    console.log("x = " + X + " y = " + Y);
});

// zoom on focal point from mousewheel    
$("#panzoomLeft").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomLeft").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});

// zoom on focal point from mousewheel    
$("#panzoomRight").parent().on('mousewheel.focal', function( e ) {
    e.preventDefault();
    var delta = e.delta || e.originalEvent.wheelDelta;
    var zoomOut = delta ? delta < 0 : e.originalEvent.deltaY > 0;
    $("#panzoomRight").panzoom('zoom', zoomOut, {
        increment: 0.1,
        animate: false,
        focal: e
    });
});


function loadRefImage(evt, parentEl, viewer) {
        //var fileTypes = ['jpg', 'jpeg', 'png'];  //acceptable file types
    var fileTypes = ['tiff','tif','TIFF','TIF'];  //acceptable file types
    //var parentEl = $(this).parent();
    var tgt = evt.target || window.event.srcElement,
        files = tgt.files;

    if (FileReader && files && files.length) {
        var fr = new FileReader();
        var extension = files[0].name.split('.').pop().toLowerCase();
        fr.onload = function(e) {
            success = fileTypes.indexOf(extension) > -1;
            if (success) {
                //Using tiff.min.js library - https://github.com/seikichi/tiff.js/tree/master
                $('#consoleWindow').append('Parsing reference TIFF image ...<br/>');
                //console.debug("Parsing TIFF image...");
                //initialize with 100MB for large files
                Tiff.initialize({
                    TOTAL_MEMORY: 100000000
                });
                var tiff = new Tiff({
                    buffer: e.target.result
                });
                var tiffCanvas = tiff.toCanvas();
                $(tiffCanvas).css({
                    "width": "auto",
                    "max-width": "1500px",
                    "height": "auto",
                    "overflow": "hidden",
                    "display": "block",
                    "padding": "0px"
                }).addClass("preview");
                $(viewer).html(tiffCanvas);
                //$(parentEl).append(tiffCanvas);
            }

        }
        fr.onloadend = function(e) {
            $('#consoleWindow').append('reference TIFF image load complete <br/>');
            //console.debug("Load End");
        }
        fr.readAsArrayBuffer(files[0]);
    }
    
    // FileReader support
    //if (FileReader && files && files.length) {
    //    var fr = new FileReader();
    //    var extension = files[0].name.split('.').pop().toLowerCase();
    //    fr.onload = function (e) {
    //        success = fileTypes.indexOf(extension) > -1;
    //        if(success)
    //            $(parentEl).append('<img src="' + fr.result + '" class="preview"/>');
    //    }
    //    fr.onloadend = function(e){
    //        console.debug("Load End");
    //    }
    //    fr.readAsDataURL(files[0]);
    //}
}

$("#rightRefInput").change(function (evt) {
    loadRefImage(evt,$(this).parent(),"#panzoomRight");
});

$("#leftRefInput").change(function (evt) {
    loadRefImage(evt,$(this).parent(),"#panzoomLeft");
});
