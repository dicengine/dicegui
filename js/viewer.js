$(".panzoom-elements").panzoom();

// Pass options
$("a.panzoom-elements").panzoom({
    minScale: 0,
    $zoomRange: $("input[type='range']")
});

$("#panzoom").panzoom({
    $zoomIn: $(".zoom-in"),
    $zoomOut: $(".zoom-out"),
    $zoomRange: $(".zoom-range"),
    $reset: $(".reset")
});

$('.left').click(function () {
    $("#panzoom").panzoom("goTo", true);
});

$('.right').click(function () {
    $("#panzoom").panzoom("resetPan", true);
});

$('.panLeft').click(function () {
    $("#panzoom").panzoom("pan", -250, 0, {
        relative: true,
        animate: true
    });
});

$('.panRight').click(function () {
    $("#panzoom").panzoom("pan", 250, 0, {
        relative: true,
        animate: true
    });
});
