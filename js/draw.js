$("#panzoomLeft").mousedown(function(){
    // add point to shapeon left click
    if(event.button == 0){
        if(addROIsActive){
            if(shapeInProgress==false && currentROIIndex > 0){
                ROIDefsX.push([]);
                ROIDefsY.push([]);
            }
            shapeInProgress = true;
            $("#ROIProgress").text("ROI in progress");
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var viewX = event.pageX - $(this).offset().left;
            var viewY = event.pageY - $(this).offset().top;
            var imgX = Math.round(viewX / scale);
            var imgY = Math.round(viewY / scale);
            if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
                ROIDefsX[currentROIIndex].push(imgX);
                ROIDefsY[currentROIIndex].push(imgY);
                printROIDefs();
            }
        }
        if(addExcludedActive){
            if(shapeInProgress==false && currentExcludedIndex > 0){
                excludedDefsX.push([]);
                excludedDefsY.push([]);
            }
            shapeInProgress = true;
            $("#ROIProgress").text("exclusion in progress");
            var scale = $("#panzoomLeft").panzoom("getMatrix")[0];
            var viewX = event.pageX - $(this).offset().left;
            var viewY = event.pageY - $(this).offset().top;
            var imgX = Math.round(viewX / scale);
            var imgY = Math.round(viewY / scale);
            if(imgX>=0&&imgX<refImageWidthLeft&&imgY>=0&&imgY<refImageHeightLeft){
                var shapeIndex = 0;
                excludedDefsX[currentExcludedIndex].push(imgX);
                excludedDefsY[currentExcludedIndex].push(imgY);
                printExcludedDefs();
            }
         }
    }
    // end shape if right click
    else if(event.button == 2 && shapeInProgress){
        console.log("end shape");
        shapeInProgress = false;
        if(addROIsActive){
            currentROIIndex += 1;
        }else{
            currentExcludedIndex += 1;
        }
        $("#ROIProgress").text("");
    }
});

$("#addROIs").click(function(){
    if(addROIsActive==false){
        addROIsActive = true;
        addExcludedActive = false;
        $("#addROIs").css('background-color','#33ccff');
        $("#addExcludeds").css('background-color','transparent');
        // TODO abort any excluded shapes in progress
    }else{
        $("#addROIs").css('background-color','transparent');
        addROIsActive = false;
        // TODO abort any ROIS in progress
    }    
    // change the background color of the icon
});

$("#addExcludeds").click(function(){
    if(addExcludedActive==false){
        addROIsActive = false;
        addExcludedActive = true;
        $("#addExcludeds").css('background-color','#33ccff');
        $("#addROIs").css('background-color','transparent');
        // TODO abort any ROI shapes in progress
    }else{
        $("#addExcludeds").css('background-color','transparent');
        addExcludedActive = false;
        // TODO abort any excluded in progress
    }    
    // change the background color of the icon
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
    if (confirm('Are you sure you want to clear all ROIs?')) {
        clearROIs();
        clearExcluded();
        // clear the drawn ROIs
        clearDrawnROIs();
    } else {
        // Do nothing!
    }
});

function clearROIs () {
    ROIDefsX = [[]];
    ROIDefsY = [[]];
    currentROIIndex = 0;
}
function clearExcluded () {
    excludedDefsX = [[]];
    excludedDefsY = [[]];
    currentExcludedIndex = 0;
}


function drawROIs(){
    // clear the old ROIs
    clearDrawnROIs();
    var draw = SVG('panzoomLeft').size(refImageWidthLeft, refImageHeightLeft);
    // draw existing ROIs using the svg element:
    if(ROIDefsX && ROIDefsY){
        for(var i = 0, l = 1; i < ROIDefsX.length; i++) {
            var coordsString = '';
            var ROIX = ROIDefsX[i];
            var ROIY = ROIDefsY[i];
            for(var j = 0, jl = ROIX.length; j < jl; j++) {
                coordsString += ROIX[j] + ',' + ROIY[j];
                if(j!=ROIX.length-1){
                    coordsString += ' ';
                }
            }
            var polygon = draw.polygon(coordsString).attr({ fill: '#00ff00', 'fill-opacity': '0.4', stroke: '#00ff00', 'stroke-opacity': '1','stroke-width': '4', 'stroke-dasharray': '10,8', 'stroke-linecap':'round' });
        }
    }
    // draw existing exclusions using the svg element:
    if(excludedDefsX && excludedDefsY){
        for(var i = 0, l = 1; i < excludedDefsX.length; i++) {
            var coordsString = '';
            var ROIX = excludedDefsX[i];
            var ROIY = excludedDefsY[i];
            for(var j = 0, jl = ROIX.length; j < jl; j++) {
                coordsString += ROIX[j] + ',' + ROIY[j];
                if(j!=ROIX.length-1){
                    coordsString += ' ';
                }
            }
            var polygon = draw.polygon(coordsString).attr({ 'fill-opacity':'0', stroke: '#f06', 'stroke-opacity': '1','stroke-width': '4', 'stroke-dasharray': '10,8', 'stroke-linecap':'round' });
        }
    }
    draw.style('z-index',2);
    draw.style('position','absolute');    
}

$("#showShapes").click(function(){
    drawROIs();
});

function clearDrawnROIs(){
    $('#panzoomLeft > svg').each(function(){
        $(this).html('');
    });
}

function removeLastROI(){
    if(ROIDefsX && ROIDefsY){
        if(ROIDefsX.length > 1){
            ROIDefsX.pop();
            ROIDefsY.pop();
        }else{
            ROIDefsX=[[]];
            ROIDefsY=[[]];
        }
    }
}

function removeLastExcluded(){
    if(excludedDefsX && excludedDefsY){
        if(excludedDefsX.length > 1){
            excludedDefsX.pop();
            excludedDefsY.pop();
        }else{
            excludedDefsY=[[]];
        }
    }
}
$("#removeLastROI").click(function(){
    removeLastROI();
    if(currentROIIndex > 0){
        currentROIIndex -= 1;
    }
    drawROIs();
});
$("#removeLastExcluded").click(function(){
    removeLastExcluded();
    if(currentExcludedIndex > 0){
        currentExcludedIndex -= 1;
    }
    drawROIs();
});
