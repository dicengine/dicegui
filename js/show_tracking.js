resultsDataObjs = [];

// draw the deformed subsets on tracking images if selected
$("#showDeformedCheck").change(function() {
    if(this.checked) {
        if(ROIsChanged){
            alert('ROIs have been modified since the results were generated');
            $("#showDeformedCheck").prop("checked", false);
	    return;
        }
        if(resultsDataObjs.length==0||resultsFresh==true){
	    loadResultsFiles();
	}else{
            updateDeformedCoords();
	}
    }else{
	// clear the drawn subsets
        clearDrawnROIs();
        // reset the frame to the reference frame
	var startIndex = $("#cineStartIndex").val();
	$("#frameScroller").val(startIndex);
        $('#cineRefIndex').val(startIndex);
	$("#cineCurrentPreviewSpan").text(startIndex);         
        drawROIs();
    }
});

function loadResultsFiles(){
    // see if a results file exists for each subset
    // check how many subsets there are
    var num_ROIs = ROIDefsX.length;
    if(num_ROIs==0) return;
    if(ROIDefsX[0].length==0) return;
    //alert('there are ' +  num_ROIs + ' ROIs');

    // see if a results file exists for all subsets:
    var numDigitsTotal = integerLength(num_ROIs);
    var fileNames = [];
    for(i=0;i<num_ROIs;++i){
        var resultsFileName = '';
	if(os.platform()=='win32'){
	    resultsFileName += workingDirectory + '\\results\\';
	}else{
	    resultsFileName += workingDirectory + '/results/';
	}
	var currentDigits = integerLength(i);
	var numZeros = Number(numDigitsTotal) - Number(currentDigits);
	resultsFileName += 'DICe_solution_';
	for(j=0;j<numZeros;++j)
	    resultsFileName += '0';
	resultsFileName += i + '.txt';
        fileNames.push(resultsFileName);
        //alert('results file ' + resultsFileName);
    }
    //console.log(fileNames);

    var promises = [];
    resultsDataObjs = [];
    for(fileIt=0;fileIt<fileNames.length;++fileIt){
        var promise = fileToDataObj(fileNames[fileIt],resultsDataObjs);;
        promises.push(promise);
    }
    Promise.all(promises).then(function(response) {
    	    console.log("fileToDataObj succeeded!", response);
            if(response[0]=="file read failed!"){
                alert('failed to load results files');
                $("#showDeformedCheck").prop("checked", false);
                return;
	    }
            resultsFresh = false;
            updateDeformedCoords();
    	},function(error) {
    	    console.error("fileToDataObj() failed!", error);
            return;
    	});
}


function updateDeformedCoords(){
    //alert('I am in updateDeformedCoords');
    var frame =  $("#frameScroller").val();
    //alert('frame is ' + frame);

   // test that there is a frame, coords, disp, and rotation header
    var num_files = resultsDataObjs.length
    if(num_files<=0)return;
    if(num_files!=ROIDefsX.length)return;

    var num_ROIs = ROIDefsX.length;
    // reset the deformed ROI coordinates
    var deformedROIDefsX = [ROIDefsX[0].slice()];
    var deformedROIDefsY = [ROIDefsY[0].slice()];
    for(roi=1;roi<num_ROIs;++roi){
        deformedROIDefsX.push(ROIDefsX[roi].slice());
        deformedROIDefsY.push(ROIDefsY[roi].slice());
    }
    var num_excluded = excludedDefsX.length;
    var statusVec = [true];
    for(i=0;i<num_ROIs-1;++i){
	statusVec.push(true);
    }
    var deformedExcludedDefsX = [excludedDefsX[0].slice()];
    var deformedExcludedDefsY = [excludedDefsY[0].slice()];
    for(roi=1;roi<num_excluded;++roi){
        deformedExcludedDefsX.push(excludedDefsX[roi].slice());
        deformedExcludedDefsY.push(excludedDefsY[roi].slice());
    }

    for(roi=0;roi<num_files;++roi){
        var headers = resultsDataObjs[roi].headings;
        var frameColID=-1;
        var coordsXColID=-1;
        var coordsYColID=-1;
        var dispXColID=-1;
        var dispYColID=-1;
        var rotationColID=-1;
        var sigmaColID=-1;
        for(i=0;i<headers.length;++i){
	    if(headers[i]=="FRAME")frameColID=i;
	    if(headers[i]=="COORDINATE_X")coordsXColID=i;
	    if(headers[i]=="COORDINATE_Y")coordsYColID=i;
	    if(headers[i]=="DISPLACEMENT_X")dispXColID=i;
	    if(headers[i]=="DISPLACEMENT_Y")dispYColID=i;
	    if(headers[i]=="ROTATION_Z")rotationColID=i;        
	    if(headers[i]=="SIGMA")sigmaColID=i;        
        }
        //console.log('FrameColID ' + frameColID);
        //console.log('CoordsXColID ' + coordsXColID);
        //console.log('CoordsYColID ' + coordsYColID);
        //console.log('DispXColID ' + dispXColID);
        //console.log('DispYColID ' + dispYColID);
        //console.log('RotationColID ' + rotationColID);
        if(frameColID<0||coordsXColID<0||coordsYColID<0||dispXColID<0||dispYColID<0||rotationColID<0||sigmaColID<0)return;    

        // test that the frame number is valid
        var frameRow = -1;
        for(i=0;i<resultsDataObjs[roi].data.length;++i){
            if(resultsDataObjs[roi].data[i][frameColID]==frame)frameRow = i;
        }
        //console.log(resultsDataObjs[roi].data[frameRow]);
        console.log('frame was found in this index ' + frameRow);
        if(frameRow<0)return;

        var cx    = resultsDataObjs[roi].data[frameRow][coordsXColID];
        var cy    = resultsDataObjs[roi].data[frameRow][coordsYColID];
        var u     = resultsDataObjs[roi].data[frameRow][dispXColID];
        var v     = resultsDataObjs[roi].data[frameRow][dispYColID];
        var theta = resultsDataObjs[roi].data[frameRow][rotationColID];
        var sigma = resultsDataObjs[roi].data[frameRow][sigmaColID];
        var cost = Math.cos(theta);
        var sint = Math.sin(theta);
        // note the data objs may not have been loaded in order (asynch) so check the subset id
        var roi_id = resultsDataObjs[roi].roi_id;
        if(sigma < 0.0){
            statusVec[roi_id] = false;
	}
        //alert('file ' + resultsDataObjs[roi].fileName + ' roi_id ' + roi_id);

        for(pt=0;pt<deformedROIDefsX[roi_id].length;++pt){
	    var ptx = deformedROIDefsX[roi_id][pt];
	    var pty = deformedROIDefsY[roi_id][pt];
            var dx = ptx - cx;
            var dy = pty - cy;
            //console.log('before x ' + ptx + ' y ' + pty); 
	    deformedROIDefsX[roi_id][pt] = cost*dx - sint*dy + u + cx;
	    deformedROIDefsY[roi_id][pt] = sint*dx + cost*dy + v + cy; 
            //console.log('after x ' + deformedROIDefsX[roi_id][pt] + ' y ' + deformedROIDefsY[roi_id][pt]); 
	}
	for(var j = 0, jl = excludedAssignments.length; j < jl; j++) {
	    if(excludedAssignments[j]==roi_id){
              for(pt=0;pt<deformedExcludedDefsX[j].length;++pt){
  	        var ptx = deformedExcludedDefsX[j][pt];
	        var pty = deformedExcludedDefsY[j][pt];
                var dx = ptx - cx;
                var dy = pty - cy;
                //console.log('before x ' + ptx + ' y ' + pty); 
	        deformedExcludedDefsX[j][pt] = cost*dx - sint*dy + u + cx;
	        deformedExcludedDefsY[j][pt] = sint*dx + cost*dy + v + cy;
	      } 
	    }
	}
    }
    //console.log(deformedROIDefsX);
    //console.log(deformedROIDefsY);
    //console.log(statusVec);
    drawDeformedROIs(deformedROIDefsX,deformedROIDefsY,deformedExcludedDefsX,deformedExcludedDefsY,statusVec);
    return;
}

function drawDeformedROIs(deformedROIDefsX,deformedROIDefsY,deformedExcludedDefsX,deformedExcludedDefsY,statusVec){
    clearDrawnROIs();
    var draw = SVG('panzoomLeft').size(refImageWidthLeft, refImageHeightLeft);
    var polygon;
    var excluded;
    var hasExcluded = false;
    var hasROI = false;
    var coordsString = '';
    for(var i = 0, l = 1; i < deformedROIDefsX.length; i++) {
        var ROIX = deformedROIDefsX[i];
        var ROIY = deformedROIDefsY[i];
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
    if(coordsString!=' M '){
        hasROI = true;
        polygon = draw.path(coordsString).attr({fill:'#FFFF00','fill-opacity':'0.4',stroke:'#FFFF00','stroke-opacity':'1',
                       'stroke-width':'2','stroke-linecap':'round' });
    }
    coordsString = '';
    /// draw all the subset IDs on the image:                        
    for(var i = 0, l = 1; i < deformedExcludedDefsX.length; i++) {
	var ROIX = deformedExcludedDefsX[i];
	var ROIY = deformedExcludedDefsY[i];
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
    // mask the included ROI with the excluded region                                                                                               
    if(hasExcluded && hasROI){
        var backMask = draw.rect(refImageWidthLeft,refImageHeightLeft).attr({fill: 'white'});
        var mask = draw.mask().add(backMask).add(excluded);
        polygon.maskWith(mask);
    }
    for(var i = 0, l = 1; i < deformedROIDefsX.length; i++) {
        var hsize = 7;
        var color_id = '#ffffff';
        if(statusVec[i]==false){
            color_id = '#ff0000';
	}
        var centroid = centroidOfPolygon(deformedROIDefsX[i],deformedROIDefsY[i]);
        var pt_cross = draw.polyline([[centroid.x,centroid.y-hsize],
				      [centroid.x,centroid.y+hsize],
				      [centroid.x,centroid.y],
				      [centroid.x-hsize,centroid.y],
				      [centroid.x+hsize,centroid.y]]).attr({ fill:'none',
									     stroke: '#ff33cc',
									     'stroke-opacity': '1.0',
									     'stroke-width': '3',
									     'stroke-linecap':'round' });
        var text = draw.text(i.toString()).attr({x:centroid.x,y:centroid.y, fill:color_id});
    }
    draw.style('z-index',2);
    draw.style('position','absolute');
}
