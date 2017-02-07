$("#panzoomLeft").mousemove(function(){
    if(shapeInProgress){
        // get the position of the last point
        if(addROIsActive || addExcludedActive){
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
                }else{
                    ROIX = excludedDefsX[excludedDefsX.length - 1];
                    ROIY = excludedDefsY[excludedDefsY.length - 1];
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
                }else{
                    var outline = draw.path(coordsString).attr({ 'fill-opacity':'0', stroke: '#f06', 'stroke-opacity': '1','stroke-width': '2', 'stroke-linecap':'round' });
                }
                draw.style('z-index',2);
                draw.style('position','absolute');
            }
        }
    }
});

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
                //printROIDefs();
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
                //printExcludedDefs();
            }
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
    // validate the polygon
    var validPolygon = validatePolygon();
    if(validPolygon){
        if(addROIsActive){
            currentROIIndex += 1;
        }else{
            currentExcludedIndex += 1;
        }
    }
    else{ // delete the last shape
        if(addROIsActive){
            removeLastROI();
        }else{
            removeLastExcluded();
        }
    }
    $("#ROIProgress").text("");
    drawROIs();
    firstClick = true;
}

$("#addROIs").click(function(){
    completeShape();
    if(addROIsActive==false){
        addROIsActive = true;
        addExcludedActive = false;
        //$("#addROIs").css('background-color','#33ccff');
        $("#addROIs").css('color','#33ccff');
        //$("#addExcludeds").css('background-color','transparent');
        $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
        // TODO abort any excluded shapes in progress
    }else{
        //$("#addROIs").css('background-color','transparent');
        $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
        addROIsActive = false;
        // TODO abort any ROIS in progress
    }
});

$("#addExcludeds").click(function(){
    completeShape();
    if(addExcludedActive==false){
        addROIsActive = false;
        addExcludedActive = true;
        //$("#addExcludeds").css('background-color','#33ccff');
        $("#addExcludeds").css('color','#33ccff');
        //$("#addROIs").css('background-color','transparent');
        $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
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
        // clear the drawn ROIs
        clearDrawnROIs();
        //drawDefaultROI();
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
    var hasExcluded = false;
    var hasROI = false;
    var draw = SVG('panzoomLeft').size(refImageWidthLeft, refImageHeightLeft);
    var polygon;
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
    draw.style('z-index',2);
    draw.style('position','absolute');    
}

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
            excludedDefsX=[[]];
            excludedDefsY=[[]];
        }
    }
}
$("#removeLastROI").click(function(){
    if (confirm('remove last drawn ROI?')) {
        removeLastROI();
        if(currentROIIndex > 0){
            currentROIIndex -= 1;
        }
        drawROIs();
    }
});
$("#removeLastExcluded").click(function(){
    if (confirm('remove last excluded region?')) {
        removeLastExcluded();
        if(currentExcludedIndex > 0){
            currentExcludedIndex -= 1;
        }
        drawROIs();
    }
});


function validatePolygon(){
    var tol = 1.0E-3;
    var polysX;
    var polysY;
    if(addROIsActive){
        polysX = ROIDefsX;
        polysY = ROIDefsY;
    }else{
        polysX = excludedDefsX;
        polysY = excludedDefsY;            
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
        // TODO check for degenerate points
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
        // TODO check for intersections
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

function drawDotsAndBoxesForSubsets(){
    drawROIs();
    // get the current step value
    var stepSize = $("#stepSize").val();
    var locsFile = workingDirectory;
    if(os.platform()=='win32'){
        locsFile += '\\subset_locs.txt';
    }else{
        locsFile += '/subset_locs.txt';
    }
    fs.stat(locsFile, function(err, stat) {
        if(err == null) {
            fs.readFile(locsFile, 'utf8', function (err,dataS) {
                if (err) {
                   return console.log(err);
                }
                //else{
                   //console.log(dataS);
                //}
                var locsData = dataS.toString().split(/\s+/g).map(Number);
                //console.log(locsData);
                var draw = SVG('panzoomLeft').size(refImageWidthLeft, refImageHeightLeft);
                var stride = 2;
                if(stepSize <=3) stride = 4;
                if(stepSize <=2) stride = 6;
                if(stepSize <=1) stride = 8;
                for(i=0;i<locsData.length-1;i+=stride){
                    var x = locsData[i];
                    var y = locsData[i+1];
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
