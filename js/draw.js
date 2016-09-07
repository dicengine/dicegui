// compute the image coordiates of the mouse in the left viewer
$("#panzoomLeft").click(function( event ) {
    console.log(refImagePathLeft);
    var draw = SVG('panzoomLeft').size(300, 300);
    //var draw = SVG('svgLeft');
    //var image = draw.image(refImagePathLeft);
    //var image = draw.image(refImagePathLeft);
    var rect = draw.rect(100, 100).attr({ fill: '#f06' });
    draw.style('z-index',2);
    draw.style('position','absolute');
});
