$("#panzoomLeft").mousemove(function(){
    if(shapeInProgress){
        // get the position of the last point
        if(addROIsActive || addExcludedActive || addObstructedActive){
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var viewX = event.pageX - $(this).offset().left;
            var viewY = event.pageY - $(this).offset().top;
            var imgX = Math.round(viewX / scale);
            var imgY = Math.round(viewY / scale);
            if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
                // remove the last svg
                if(firstClick==false){
                    clearLastDrawnROI();
                }
                firstClick = false;
                var draw = SVG('panzoomLeft').size(refImageWidthLeft, refImageHeightLeft);
                // add all the existing points in the polygon
                var coordsString = '';
                var ROIX;
                var ROIY;
                if(addROIsActive){
                    ROIX = ROIDefsX[ROIDefsX.length - 1];
                    ROIY = ROIDefsY[ROIDefsY.length - 1];
                }else if(addExcludedActive){
                    ROIX = excludedDefsX[excludedDefsX.length - 1];
                    ROIY = excludedDefsY[excludedDefsY.length - 1];
                }
                else{
                    ROIX = obstructedDefsX[obstructedDefsX.length - 1];
                    ROIY = obstructedDefsY[obstructedDefsY.length - 1];
                }
                coordsString += ' M ';
                for(var j = 0, jl = ROIX.length; j < jl; j++) {
                    if(j==0){
                        coordsString += ROIX[j] + ' ' + ROIY[j];
                    }else{
                        coordsString += ' L ' + ROIX[j] + ' ' + ROIY[j];
                    }
                }
                // add the current point
                coordsString += ' L ' + imgX + ' ' + imgY + ' Z';
                if(addROIsActive){
                    var polygon = draw.path(coordsString).attr({ fill: '#00ff00', 'fill-opacity': '0.4', stroke: '#00ff00', 'stroke-opacity': '1','stroke-width': '2', 'stroke-linecap':'round' });
                }else if(addExcludedActive){
                    var outline = draw.path(coordsString).attr({ 'fill-opacity':'0', stroke: '#f06', 'stroke-opacity': '1','stroke-width': '2', 'stroke-linecap':'round' });
                }else{
                    var polygon = draw.path(coordsString).attr({ fill: '#00ffff', 'fill-opacity': '0.4', stroke: '#00ffff', 'stroke-opacity': '1','stroke-width': '2', 'stroke-linecap':'round' });
                }
                draw.style('z-index',2);
                draw.style('position','absolute');
            }
        }
    }
});

$("#panzoomRight").mousedown(function(){
    // add point to shapeon left click
    scale = $("#panzoomRight").panzoom("getMatrix")[0];
    viewX = event.pageX - $(this).offset().left;
    viewY = event.pageY - $(this).offset().top;
    imgX = Math.round(viewX / scale);
    imgY = Math.round(viewY / scale);
    if(event.button == 0 && drawEpipolarActive){
        drawEpipolarLine(false,imgX,imgY)
    }
});

$("#panzoomLeft").mousedown(function(){
    // add point to shapeon left click
    scale = $("#panzoomLeft").panzoom("getMatrix")[0];
    viewX = event.pageX - $(this).offset().left;
    viewY = event.pageY - $(this).offset().top;
    imgX = Math.round(viewX / scale);
    imgY = Math.round(viewY / scale);
    if(event.button == 0){
        if(drawEpipolarActive){
            drawEpipolarLine(true,imgX,imgY)
        }
        else if(addROIsActive){
            if(shapeInProgress==false && currentROIIndex > 0){
                ROIDefsX.push([]);
                ROIDefsY.push([]);
            }
            shapeInProgress = true;
            $("#ROIProgress").text("ROI in progress");
            if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
                ROIDefsX[currentROIIndex].push(imgX);
                ROIDefsY[currentROIIndex].push(imgY);
                //printROIDefs();
            }
        }
        if(addExcludedActive){
            if(shapeInProgress==false && currentExcludedIndex > 0){
                excludedDefsX.push([]);
                excludedDefsY.push([]);
                excludedAssignments.push(-1);
            }
            shapeInProgress = true;
            $("#ROIProgress").text("exclusion in progress");
            if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
                //var shapeIndex = 0;
                excludedDefsX[currentExcludedIndex].push(imgX);
                excludedDefsY[currentExcludedIndex].push(imgY);
                //printExcludedDefs();
            }
        }
        if(addObstructedActive){
            if(shapeInProgress==false && currentObstructedIndex > 0){
                obstructedDefsX.push([]);
                obstructedDefsY.push([]);
            }
            shapeInProgress = true;
            $("#ROIProgress").text("obstruction in progress");
            if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
                //var shapeIndex = 0;
                obstructedDefsX[currentObstructedIndex].push(imgX);
                obstructedDefsY[currentObstructedIndex].push(imgY);
                //printExcludedDefs();
            }
        }
        if(addLivePlotPtsActive){
            if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
                livePlotPtsX.push(imgX);
                livePlotPtsY.push(imgY);
            }
            drawROIs();
        }
    }
    // end shape if right click
    else if(event.button == 2 && shapeInProgress){
        completeShape();
    }
});

function completeShape(){
    if(shapeInProgress==false) return;
    shapeInProgress = false;
    ROIsChanged = true;
    $("#showDeformedCheck").prop("checked", false);
    // validate the polygon
    var validPolygon = validatePolygon();
    if(validPolygon){
        if(addROIsActive){
            if($("#analysisModeSelect").val()=="tracking"){
                centroid = centroidOfPolygon(ROIDefsX[currentROIIndex],ROIDefsY[currentROIIndex]);
                subsetCoordinatesX.push(centroid.x);
                subsetCoordinatesY.push(centroid.y);
            }
            currentROIIndex += 1;
        }else if(addExcludedActive){
            currentExcludedIndex += 1;
        }else{
            currentObstructedIndex += 1;
        }
    }
    else{ // delete the last shape
        if(addROIsActive){
            removeLastROI();
        }else if(addExcludedActive){
            removeLastExcluded();
        }else{
            removeLastObstructed();
        }
    }
    $("#ROIProgress").text("");
    drawROIs();
    firstClick = true;
}

$("#addLivePlotPts").click(function(){
    if(addLivePlotPtsActive==false){
        addLivePlotPtsActive = true;
        addROIsActive = false;
        addObstructedActive = false;
        addExcludedActive = false;
        $("#addLivePlotPts").css('color','#33ccff');
        $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
        $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
        $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
        deactivateEpipolar();
        //$("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
        // TODO abort any excluded shapes in progress
    }else{
        //$("#addROIs").css('background-color','transparent');
        $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
        addLivePlotPtsActive = false;
        // TODO abort any ROIS in progress
    }
});

$("#addLivePlotLine").click(function(){
    if(addLivePlotLineActive==false){
        addLivePlotLineActive = true;
        $("#addLivePlotLine").css('color','#33ccff');
    }else{
        addLivePlotLineActive = false;
        $("#addLivePlotLine").css('color','rgba(0, 0, 0, 0.5)');
    }
    drawROIs();
});

$("#addROIs").click(function(){
    if(subsetCoordinatesX.length>0&&$("#analysisModeSelect").val()=="subset"){
        if (confirm('Subset locations have been defined by loading a subset file. Defining ROIs will reset these. Continue?')) {
            subsetCoordinatesX = [];
            subsetCoordinatesY = [];
            clearDrawnROIs();
        }else{
            return false;
        }
    }
    completeShape();
    if(addROIsActive==false){
        addROIsActive = true;
        addExcludedActive = false;
        addObstructedActive = false;
        addLivePlotPtsActive = false;
        //$("#addROIs").css('background-color','#33ccff');
        $("#addROIs").css('color','#33ccff');
        //$("#addExcludeds").css('background-color','transparent');
        $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
        $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
        $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
        //$("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
        deactivateEpipolar();
        // TODO abort any excluded shapes in progress
    }else{
        //$("#addROIs").css('background-color','transparent');
        $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
        addROIsActive = false;
        // TODO abort any ROIS in progress
    }
});

$("#addObstructed").click(function(){
    completeShape();
    if(addObstructedActive==false){
        addROIsActive = false;
        addLivePlotPtsActive = false;
        addObstructedActive = true;
        addExcludedActive = false;
        $("#addObstructed").css('color','#33ccff');
        $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
        $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
        $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
        //$("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
        deactivateEpipolar();
        // TODO abort any ROI shapes in progress
    }else{
        $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
        addObstructedActive = false;
    }
});

$("#addExcludeds").click(function(){
    completeShape();
    if(addExcludedActive==false){
        addROIsActive = false;
        addLivePlotPtsActive = false;
        addExcludedActive = true;
        addObstructedActive = false;
        //$("#addExcludeds").css('background-color','#33ccff');
        $("#addExcludeds").css('color','#33ccff');
        //$("#addROIs").css('background-color','transparent');
        $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
        $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
        $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
        //$("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
        deactivateEpipolar();
        // TODO abort any ROI shapes in progress
    }else{
        //$("#addExcludeds").css('background-color','transparent');
        $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
        addExcludedActive = false;
        // TODO abort any excluded in progress
    }
});


function printROIDefs () {
    if(ROIDefsX && ROIDefsY){
        // NOTE assumes x and y are of the same length
        // TODO test for this
        console.log("Number of ROIs: " + ROIDefsX.length)
        for(var i = 0, l = ROIDefsX.length; i < l; i++) {
            var ROIx = ROIDefsX[i];
            var ROIy = ROIDefsY[i];
            console.log("ROI id " + i + " size " + ROIx.length);
            for(var j = 0, jl = ROIx.length; j < jl; j++) {
                console.log("  x " + ROIx[j] + " y " + ROIy[j] );
            }
        }
    }
}

function printExcludedDefs () {
    if(excludedDefsX && excludedDefsY){
        // NOTE assumes x and y are of the same length
        // TODO test for this
        console.log("Number of exclusions: " + excludedDefsX.length)
        for(var i = 0, l = excludedDefsX.length; i < l; i++) {
            var excludedX = excludedDefsX[i];
            var excludedY = excludedDefsY[i];
            console.log("exclusion id " + i + " size " + excludedX.length);
            for(var j = 0, jl = excludedX.length; j < jl; j++) {
                console.log("  x " + excludedX[j] + " y " + excludedY[j] );
            }
        }
    }
}

$("#resetROIs").click(function(){
    if (confirm('reset all included and excluded regions?')) {
        clearROIs();
        clearExcluded();
        clearObstructed();
        // clear the drawn ROIs
        clearDrawnROIs();
        drawROIs();
        //drawDefaultROI();
    } else {
        // Do nothing!
    }
});

$("#resetLivePlotPts").click(function(){
    if (confirm('reset all live plots?')) {
        resetLivePlots();
        // clear the drawn ROIs
        clearDrawnROIs();
        drawROIs();
    } else {
        // Do nothing!
    }
});
function resetLivePlots(){
    clearLivePlotPts();
    addLivePlotPtsActive = false;
    addLivePlotLineActive = false;
    $("#addLivePlotLine").css('color','rgba(0, 0, 0, 0.5)');
    $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
}

function clearLivePlotPts () {
    livePlotPtsX = [];
    livePlotPtsY = [];
    livePlotLineXOrigin = refImageWidthLeft / 2;
    livePlotLineYOrigin = 0.75*refImageHeightLeft / 2;
    livePlotLineXAxis = 1.5*refImageWidthLeft / 2;
    livePlotLineYAxis = 0.75*refImageHeightLeft / 2;
}

function clearROIs () {
    ROIDefsX = [[]];
    ROIDefsY = [[]];
    subsetCoordinatesX = [];
    subsetCoordinatesY = [];
    currentROIIndex = 0;
}

function clearExcluded () {
    excludedDefsX = [[]];
    excludedDefsY = [[]];
    excludedAssignments = [];
    currentExcludedIndex = 0;
}

function clearObstructed () {
    obstructedDefsX = [[]];
    obstructedDefsY = [[]];
    currentObstructedIndex = 0;
}

function drawROIs(){
    // clear the old ROIs
    clearDrawnROIs();
    var hasExcluded = false;
    var hasROI = false;
    var draw = SVG('panzoomLeft').size(refImageWidthLeft, refImageHeightLeft);
    draw.style('z-index',2);
    draw.style('position','absolute');
    var polygon;
    var obstructed;
    var excluded;
    // draw existing ROIs using the svg element:
    if(ROIDefsX && ROIDefsY){
        var coordsString = '';
        for(var i = 0, l = 1; i < ROIDefsX.length; i++) {
            var ROIX = ROIDefsX[i];
            var ROIY = ROIDefsY[i];
            coordsString += ' M ';
            for(var j = 0, jl = ROIX.length; j < jl; j++) {
                if(j==0){
                    coordsString += ROIX[j] + ' ' + ROIY[j];
                }else if(j!=ROIX.length-1){
                    coordsString += ' L ' + ROIX[j] + ' ' + ROIY[j];
                }
                else{
                    coordsString += ' L ' + ROIX[j] + ' ' + ROIY[j] + ' Z';
                }
            }
        }
        //console.log(coordsString);
        if(coordsString!=' M '){
            hasROI = true;
            polygon = draw.path(coordsString).attr({ fill: '#00ff00', 'fill-opacity': '0.4', stroke: '#00ff00', 'stroke-opacity': '1','stroke-width': '2', 'stroke-linecap':'round' });
        }
    }
    // draw existing Obstructions using the svg element:
    if(obstructedDefsX && obstructedDefsY && $("#analysisModeSelect").val()=="tracking"){
        var coordsString = '';
        for(var i = 0, l = 1; i < obstructedDefsX.length; i++) {
            var ROIX = obstructedDefsX[i];
            var ROIY = obstructedDefsY[i];
            coordsString += ' M ';
            for(var j = 0, jl = ROIX.length; j < jl; j++) {
                if(j==0){
                    coordsString += ROIX[j] + ' ' + ROIY[j];
                }else if(j!=ROIX.length-1){
                    coordsString += ' L ' + ROIX[j] + ' ' + ROIY[j];
                }
                else{
                    coordsString += ' L ' + ROIX[j] + ' ' + ROIY[j] + ' Z';
                }
            }
        }
        //console.log(coordsString);
        if(coordsString!=' M '){
            obstructed = draw.path(coordsString).attr({ fill: '#00ffff', 'fill-opacity': '0.4', stroke: '#00ffff', 'stroke-opacity': '1','stroke-width': '2', 'stroke-linecap':'round' });
        }
    }
    // draw existing exclusions using the svg element:
    // draw excluded first because this serves as the mask
    if(excludedDefsX && excludedDefsY){
        var coordsString = '';
        for(var i = 0, l = 1; i < excludedDefsX.length; i++) {
            var ROIX = excludedDefsX[i];
            var ROIY = excludedDefsY[i];
            coordsString += ' M ';
            for(var j = 0, jl = ROIX.length; j < jl; j++) {
                if(j==0){
                    coordsString += ROIX[j] + ' ' + ROIY[j];
                }else if(j!=ROIX.length-1){
                    coordsString += ' L ' + ROIX[j] + ' ' + ROIY[j];
                }
                else{
                    coordsString += ' L ' + ROIX[j] + ' ' + ROIY[j] + ' Z';
                }
            }
        }
        //console.log(coordsString);
        if(coordsString!=' M '){
            hasExcluded = true;
            if(hasROI){
                excluded = draw.path(coordsString).attr({fill: 'black'});
            }
            var outline = draw.path(coordsString).attr({ 'fill-opacity':'0', stroke: '#f06', 'stroke-opacity': '1','stroke-width': '2', 'stroke-linecap':'round' });
        }
    }
    // mask the included ROI with the excluded region
    if(hasExcluded && hasROI){
        var backMask = draw.rect(refImageWidthLeft,refImageHeightLeft).attr({fill: 'white'});
        var mask = draw.mask().add(backMask).add(excluded);
        polygon.maskWith(mask);
    }
    // draw all the live plot points on the image:
    for(i=0;i<livePlotPtsX.length;i++){
        var hsize = 7;
        var pt_cross = draw.polyline([[livePlotPtsX[i],livePlotPtsY[i]-hsize],[livePlotPtsX[i],livePlotPtsY[i]+hsize],[livePlotPtsX[i],livePlotPtsY[i]],[livePlotPtsX[i]-hsize,livePlotPtsY[i]],[livePlotPtsX[i]+hsize,livePlotPtsY[i]]]).attr({ fill : 'none', stroke: '#ff33cc', 'stroke-opacity': '1.0','stroke-width': '3', 'stroke-linecap':'round' });
        var text = draw.text(i.toString()).attr({x:livePlotPtsX[i],y:livePlotPtsY[i], fill:'#ffffff'});
    }
    /// draw all the subset IDs on the image:                   
    if($("#analysisModeSelect").val()=="tracking"){
        var hsize = 7;
        for(var i = 0, l = ROIDefsX.length; i < l; i++) {
            if(ROIDefsX[i].length<3) continue;
            var centroid = centroidOfPolygon(ROIDefsX[i],ROIDefsY[i]);
            var pt_cross = draw.polyline([[centroid.x,centroid.y-hsize],
                              [centroid.x,centroid.y+hsize],
                              [centroid.x,centroid.y],
                              [centroid.x-hsize,centroid.y],
                              [centroid.x+hsize,centroid.y]]).attr({ fill:'none',
                                        stroke: '#ff33cc', 
                                        'stroke-opacity': '1.0',
                                        'stroke-width': '3', 
                                        'stroke-linecap':'round' });
            var text = draw.text(i.toString()).attr({x:centroid.x,y:centroid.y, fill:'#ffffff'});
        }    
    }

    // draw a default subset on the image in the center
    if($("#analysisModeSelect").val()=="subset"){
        var ss_size = $("#subsetSize").val();
        polygon = draw.rect(ss_size,ss_size).move(refImageWidthLeft/2 - ss_size/2,refImageHeightLeft/2 - ss_size/2).attr({ fill: 'none', stroke: '#ffff00', 'stroke-opacity': '0.8','stroke-width': '3', 'stroke-linecap':'round' }).id('subsetBox');    
        polygon.draggable().on('dragmove',function(e){
            e.preventDefault();
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var imgX = Math.round(e.detail.p.x / scale);
            var imgY = Math.round(e.detail.p.y / scale);
            this.move(imgX,imgY);
        });
    }

    // draw the axis for best fit plane if that is enabled
    if($("#bestFitCheck")[0].checked && (showStereoPane==1||showStereoPane==2)){
        var hsize = 11;
         cross_line = draw.polyline([[bestFitXOrigin,bestFitYOrigin],[bestFitXAxis,bestFitYAxis]]).attr({ stroke: '#ffffff', 'stroke-opacity': '0.8','stroke-width': '3', 'stroke-linecap':'round' });
        cross_origin = draw.polyline([[bestFitXOrigin,bestFitYOrigin-hsize],[bestFitXOrigin,bestFitYOrigin+hsize],[bestFitXOrigin,bestFitYOrigin],[bestFitXOrigin-hsize,bestFitYOrigin],[bestFitXOrigin+hsize,bestFitYOrigin]]).attr({ fill : 'none', stroke: '#00ff00', 'stroke-opacity': '1.0','stroke-width': '3', 'stroke-linecap':'round' });
        cross_origin.draggable().on('dragmove',function(e){
            e.preventDefault();
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var imgX = Math.round(e.detail.p.x / scale);
            var imgY = Math.round(e.detail.p.y / scale);
            this.move(imgX-hsize,imgY-hsize);
            bestFitXOrigin = imgX;
            bestFitYOrigin = imgY;
            cross_line.plot([[bestFitXOrigin,bestFitYOrigin],[bestFitXAxis,bestFitYAxis]]);
        });    
        cross_axis = draw.polyline([[bestFitXAxis,bestFitYAxis-hsize],[bestFitXAxis,bestFitYAxis+hsize],[bestFitXAxis,bestFitYAxis],[bestFitXAxis-hsize,bestFitYAxis],[bestFitXAxis+hsize,bestFitYAxis]]).attr({ fill : 'none', stroke: '#ff0000', 'stroke-opacity': '1.0','stroke-width': '3', 'stroke-linecap':'round' });
        cross_axis.draggable().on('dragmove',function(e){
            e.preventDefault();
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var imgX = Math.round(e.detail.p.x / scale);
            var imgY = Math.round(e.detail.p.y / scale);
            this.move(imgX-hsize,imgY-hsize);
            bestFitXAxis = imgX;
            bestFitYAxis = imgY;
            cross_line.plot([[bestFitXOrigin,bestFitYOrigin],[bestFitXAxis,bestFitYAxis]]);
        });    
    }

    // draw the axis for live plot line if enabled
    if(addLivePlotLineActive){
        var hsize = 7;
         live_plot_line = draw.polyline([[livePlotLineXOrigin,livePlotLineYOrigin],[livePlotLineXAxis,livePlotLineYAxis]]).attr({ stroke: '#ff33cc', 'stroke-opacity': '0.8','stroke-width': '3', 'stroke-linecap':'round' });
        live_plot_line_origin = draw.polyline([[livePlotLineXOrigin,livePlotLineYOrigin-hsize],[livePlotLineXOrigin,livePlotLineYOrigin+hsize],[livePlotLineXOrigin,livePlotLineYOrigin],[livePlotLineXOrigin-hsize,livePlotLineYOrigin],[livePlotLineXOrigin+hsize,livePlotLineYOrigin]]).attr({ fill : 'none', stroke: '#00ff00', 'stroke-opacity': '1.0','stroke-width': '3', 'stroke-linecap':'round' });
        live_plot_line_origin.draggable().on('dragmove',function(e){
            e.preventDefault();
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var imgX = Math.round(e.detail.p.x / scale);
            var imgY = Math.round(e.detail.p.y / scale);
            this.move(imgX-hsize,imgY-hsize);
            livePlotLineXOrigin = imgX;
            livePlotLineYOrigin = imgY;
            live_plot_line.plot([[livePlotLineXOrigin,livePlotLineYOrigin],[livePlotLineXAxis,livePlotLineYAxis]]);
        });    
        live_plot_line_axis = draw.polyline([[livePlotLineXAxis,livePlotLineYAxis-hsize],[livePlotLineXAxis,livePlotLineYAxis+hsize],[livePlotLineXAxis,livePlotLineYAxis],[livePlotLineXAxis-hsize,livePlotLineYAxis],[livePlotLineXAxis+hsize,livePlotLineYAxis]]).attr({ fill : 'none', stroke: '#ff0000', 'stroke-opacity': '1.0','stroke-width': '3', 'stroke-linecap':'round' });
        live_plot_line_axis.draggable().on('dragmove',function(e){
            e.preventDefault();
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var imgX = Math.round(e.detail.p.x / scale);
            var imgY = Math.round(e.detail.p.y / scale);
            this.move(imgX-hsize,imgY-hsize);
            livePlotLineXAxis = imgX;
            livePlotLineYAxis = imgY;
            live_plot_line.plot([[livePlotLineXOrigin,livePlotLineYOrigin],[livePlotLineXAxis,livePlotLineYAxis]]);
        });    
    } // end live plot line
}

$("#bestFitCheck").change(function(){
    drawROIs();
});

function clearDrawnROIs(){
    $('#panzoomLeft > svg').each(function(){
        $(this).remove();
    });
}

function clearLastDrawnROI(){
    var cells = $("#panzoomLeft").find('svg');
    var length = cells.length;
    cells.each(function(i) {
        if(i!=length-1){
        }else{
            $(this).remove();
        }
    });
}

$("#removeLastROI").click(function(){
    if(ROIDefsX[0].length<3) return;
    if (confirm('remove last drawn ROI?')) {
        removeLastROI();
        if(currentROIIndex > 0){
            currentROIIndex -= 1;
        }
        drawROIs();
    }
});
function removeLastROI(){
    if(ROIDefsX && ROIDefsY){
        if(ROIDefsX.length > 1){
            ROIDefsX.pop();
            ROIDefsY.pop();
            subsetCoordinatesX.pop();
            subsetCoordinatesY.pop();
        }else{
            ROIDefsX=[[]];
            ROIDefsY=[[]];
            subsetCoordinatesX = [];
            subsetCoordinatesY = [];
        }
    }
}
$("#removeLastExcluded").click(function(){
    if(excludedDefsX[0].length<3) return;
    if (confirm('remove last excluded region?')) {
        removeLastExcluded();
        if(currentExcludedIndex > 0){
            currentExcludedIndex -= 1;
        }
        drawROIs();
    }
});
function removeLastExcluded(){
    if(excludedDefsX && excludedDefsY){
        if(excludedDefsX.length > 1){
            excludedDefsX.pop();
            excludedDefsY.pop();
        }else{
            excludedDefsX=[[]];
            excludedDefsY=[[]];
        }
        if(excludedAssignments.length > 1){
            excludedAssignments.pop();
        }else{
            excludedAssignments = [];
        }
    }
}
$("#removeLastObstructed").click(function(){
    if(obstructedDefsX[0].length<3) return;
    if (confirm('remove last obstructed region?')) {
        removeLastObstructed();
        if(currentObstructedIndex > 0){
            currentObstructedIndex -= 1;
        }
        drawROIs();
    }
});
function removeLastObstructed(){
    if(obstructedDefsX && obstructedDefsY){
        if(obstructedDefsX.length > 1){
            obstructedDefsX.pop();
            obstructedDefsY.pop();
        }else{
            obstructedDefsX=[[]];
            obstructedDefsY=[[]];
        }
    }
}

function centroidOfPolygon(ROIx,ROIy){
    var centroid = {x:0,y:0}; 
    if(ROIx.length!=ROIy.length||ROIx.length<3){
        return centroid;
    }
    var cx = 0.0;
    var cy = 0.0;
    for(var j = 0, jl = ROIx.length; j < jl; j++) {
        cx += ROIx[j];
        cy += ROIy[j];
    }
    cx /= ROIx.length;
    cy /= ROIx.length;
    centroid.x = Math.round(cx);
    centroid.y = Math.round(cy);
    return centroid;
}

function isInPolygon(x,y,vertices_x,vertices_y){
    if(vertices_x.length<3||vertices_y.length!=vertices_x.length)
        return false;

    var num_vertices = vertices_x.length;
    // repeat the first vertex as the last vertex
    var verts_x = vertices_x.slice();    
    verts_x.push(vertices_x[0]);
    var verts_y = vertices_y.slice();
    verts_y.push(vertices_y[0]);
    
    var angle=0.0;
    for (i=0;i<num_vertices;i++) {
      // get the two end points of the polygon side and construct
      // a vector from the point to each one:
      dx1 = verts_x[i] - x;
      dy1 = verts_y[i] - y;
      dx2 = verts_x[i+1] - x;
      dy2 = verts_y[i+1] - y;
      angle += angle_2d(dx1,dy1,dx2,dy2);
    }
    // if the angle is greater than 2PI, the point is in the polygon
    if(Math.abs(angle) >= 2.0*Math.PI){
        return true;
    }else{
        return false;
    }
}

function angle_2d(x1,y1,x2,y2){
    var dtheta=0.0;
    var theta1=0.0;
    var theta2=0.0;
    theta1 = Math.atan2(y1,x1);
    theta2 = Math.atan2(y2,x2);
    dtheta = theta2 - theta1;
    while (dtheta > Math.PI)
        dtheta -= 2.0*Math.PI;
    while (dtheta < -1.0*Math.PI)
        dtheta += 2.0*Math.PI;
    return(dtheta);
}

function validatePolygon(){
    var tol = 1.0E-3;
    var polysX;
    var polysY;
    if(addROIsActive){
        polysX = ROIDefsX;
        polysY = ROIDefsY;
    }else if(addExcludedActive){
        polysX = excludedDefsX;
        polysY = excludedDefsY;
    }else{
        polysX = obstructedDefsX;
        polysY = obstructedDefsY;
    }
    if(polysX && polysY){
        var numPolys = polysX.length;
        var numPoints = polysX[numPolys-1].length;
        var pointsX = polysX[numPolys-1];
        var pointsY = polysY[numPolys-1];
        // check that there are more than 2 points
        if(numPoints < 3){
            alert('Invalid polygon: not enough vertices');
            return false;
        }
        // check for degenerate points
        if(Math.abs(pointsX[0]-pointsX[numPoints-1]) + Math.abs(pointsY[0]-pointsY[numPoints-1]) < tol){
            alert('Invalid polygon: first and last point of the polygon are too close');
            return false;
        }
        for(var i = 1, l = numPoints; i < l; i++) {
            if(Math.abs(pointsX[i]-pointsX[i-1]) + Math.abs(pointsY[i]-pointsY[i-1]) < tol){
                alert('Invalid polygon: co-located vertices detected');
                return false;
            }
        }
        // check for intersections
        for(var i = 0, l = numPoints; i < l; i++) {
            var ipt  = [pointsX[i],pointsY[i]]
            var iqpt = i == numPoints-1 ? [pointsX[0],pointsY[0]] : [pointsX[i+1],pointsY[i+1]];
            for(var j = 0, jl = numPoints; j < jl; j++) {
                if( (j==i||j==i+1||j==i-1) ||
                    (i==0&&j==numPoints-1) ||
                    (i==numPoints-1&&j==0)){}
                else{
                    var jpt = [pointsX[j],pointsY[j]];
                    var jqpt = j == numPoints-1 ? [pointsX[0],pointsY[0]] : [pointsX[j+1],pointsY[j+1]];
                    if(isIntersecting(ipt,iqpt,jpt,jqpt)){
                        alert('Invalid polygon: self-intersecting');
                        return false;
                    }
                }
            }
        }
        // if excluded region and tracking method is on, the excluded region has to have
        // a centroid inside an existing ROI, that is the ROI this excluded region is associated with 
        if(addExcludedActive&&$("#analysisModeSelect").val()=="tracking"){
            // compute the centroid of the excluded region
            var centroid = centroidOfPolygon(pointsX,pointsY);
            //alert('centroid of excluded polygon ' + centroid.x + ' ' + centroid.y);
            
            // test if this centroid is inside one of the ROIs
            var roi_id = -1;
            for(i=0;i<ROIDefsX.length;++i){
                //console.log('checking ROI ' + i);
                if(isInPolygon(centroid.x,centroid.y,ROIDefsX[i],ROIDefsY[i]))
                    roi_id = i;
            }
            if(roi_id<0){
                alert('centroid of excluded polygon is not inside a valid ROI');
                return false;
            }
            //alert('centroid of excluded is in ROI ' + roi_id);
            // assign the excluded region to an ROI
            excludedAssignments[currentExcludedIndex] = roi_id;
        } // end validate excluded regions
    } // end array not undefined
    return true;
}

function clockwise(a,b,c){
    var valueDbl = ((b[0]-a[0])*(c[1]-a[1]) - (c[0]-a[0])*(b[1]-a[1]));
    var value = valueDbl > 0.0 ? 1 : valueDbl < 0.0 ? -1 : 0;
    if(value!=0&&value!=1&&value!=-1) {
        alert("ERROR: invalid clockwise vlaue");
    }
    return value;
}

function isIntersecting(ap,aq,bp,bq){
    if (clockwise(ap,aq,bp)*clockwise(ap,aq,bq)>0) return false;
    if (clockwise(bp,bq,ap)*clockwise(bp,bq,aq)>0) return false;
    return true;
}

function drawDefaultROI(){
    // add a default region of the image selected
    var buf = 20; // pixels
    ROIDefsX[0] = [buf, refImageWidthLeft-buf, refImageWidthLeft-buf,buf];
    ROIDefsY[0] = [buf,buf,refImageHeightLeft-buf,refImageHeightLeft-buf];
    currentROIIndex += 1;
    drawROIs();
}

function drawDotsAndBoxesForSubsets(locsFile){
    drawROIs();
    // get the current step value
    var stepSize = $("#stepSize").val();
    //var locsFile = fullPath('','.subset_locs.txt');
    fs.stat(locsFile, function(err, stat) {
        if(err == null) {
            fs.readFile(locsFile, 'utf8', function (err,dataS) {
                if (err) {
                   return console.log(err);
                }
                //else{
                   //console.log(dataS);
                //}
                if($("#analysisModeSelect").val()=="tracking" && dataS.toString().toUpperCase().includes("REGION_OF_INTEREST")){
                    alert('Error, invalid susbset definition file: REGION_OF_INTEREST should not be defined for tracking mode. CONFORMAL_SUBSET should be defined');
                    clearROIs();
                    clearExcluded();
                    clearObstructed();
                    // clear the drawn ROIs
                    clearDrawnROIs();
                    drawROIs();
                }
                if($("#analysisModeSelect").val()=="tracking" && !dataS.toString().toUpperCase().includes("SUBSET_COORDINATES")){
                    alert('Error, invalid susbset definition file: SUBSET_COORDINATES block should be defined');
                    clearROIs();
                    clearExcluded();
                    clearObstructed();
                    // clear the drawn ROIs
                    clearDrawnROIs();
                    drawROIs();
                }
                if($("#analysisModeSelect").val()=="subset" && dataS.toString().toUpperCase().includes("CONFORMAL_SUBSET")){
                    alert('Error, invalid susbset definition file: CONFORMAL_SUBSET should not be defined for full-field mode.');
                    clearROIs();
                    clearExcluded();
                    clearObstructed();
                    // clear the drawn ROIs
                    clearDrawnROIs();
                    drawROIs();
                }
                if($("#analysisModeSelect").val()=="subset" && dataS.toString().toUpperCase().includes("SUBSET_COORDINATES") && dataS.toString().toUpperCase().includes("REGION_OF_INTEREST")){
                    alert('Error, invalid susbset definition file: Only SUBSET_COORDINATES or REGION_OF_INTEREST can be defined alone, not both.');
                    clearROIs();
                    clearExcluded();
                    clearObstructed();
                    // clear the drawn ROIs
                    clearDrawnROIs();
                    drawROIs();
                }
                if(dataS.toString().toUpperCase().includes("CONFORMAL_SUBSET") && dataS.toString().toUpperCase().includes("REGION_OF_INTEREST")){
                    alert('Error, invalid susbset definition file: CONFORMAL_SUBSET and REGION_OF_INTEREST cannot be defined together.');
                    clearROIs();
                    clearExcluded();
                    clearObstructed();
                    // clear the drawn ROIs
                    clearDrawnROIs();
                    drawROIs();
                }
                
                
                if(!dataS.toString().toUpperCase().includes("SUBSET_COORDINATES")||dataS.toString().toUpperCase().includes("CONFORMAL_SUBSET")){
                    //alert('invalid subset locations file syntax ' + locsFile);
                    return;
                }
                var locsData = dataS.toString().split(/\s+/g).map(Number);
                //console.log(locsData);
                var draw = SVG('panzoomLeft').size(refImageWidthLeft, refImageHeightLeft);
                var stride = 2;
                if(stepSize <=3) stride = 4; // striding is used so that for small step sizes, it's not too crowded
                if(stepSize <=2) stride = 6;
                if(stepSize <=1) stride = 8;
                for(i=0;i<locsData.length-1;i+=stride){
                    if(isNaN(locsData[i])) continue;
                    var x = locsData[i]-2.5;
                    var y = locsData[i+1]-2.5;
                    var dot = draw.circle(5).move(x,y).fill('#ffff00');
                }
                draw.style('opacity',0.75);
                draw.style('z-index',2);
                draw.style('position','absolute');
            }); // end readFile
        } // end null
        else{
            alert("could not read subset_locs.txt");
            return;
	}
    }); 
}
