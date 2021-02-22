resultsDataObjs = [];

// draw the deformed subsets on tracking images if selected
$("#showDeformedCheck").change(function() {
    if(this.checked) {
        showDeformedROIs();
    }else{
        turnOffDeformedShapesAndROIsOn();
    }
});

function loadTrackingResultsIntoMemory(cb){
    console.log('loading tracked roi results into memory');
    cb = cb || $.noop;
    // see if a results file exists for each subset
    // check how many subsets there are
    resultsDataObjs = [];
    var numROIs = numROIShapes();
    if(numROIs==0) return;
    var numDigitsTotal = integerLength(numROIs);
    var fileNames = [];
    for(i=0;i<numROIs;++i){
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
    }

    // create copy shapes for each deformed ROI
    var allShapes = getPlotlyShapes();
    // remove any exising deformed shapes
    for(var i=0;i<allShapes.length;i++){
        if(!allShapes[i].name) continue;
        if(allShapes[i].name.includes('deformed'))
            allShapes.splice(i,1);
    }
    if(allShapes.length<=0) return;
    var initialLength = allShapes.length;
    for(var i=0;i<initialLength;i++){
        if(!allShapes[i].name.includes('ROI')) continue;
        var deformedShape = cloneShape(allShapes[i]);
        var shapeId = allShapes[i].name.split('_').pop();
        deformedShape.name = 'deformed_' + shapeId;
        deformedShape.line = {color: 'green'};
        deformedShape.fillcolor = 'yellow';
        deformedShape.visible = false;
        allShapes.push(deformedShape);
    }
    var update = {
            'shapes' : allShapes,
    }
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
    
    var promises = [];
    resultsDataObjs = [];
    for(fileIt=0;fileIt<fileNames.length;++fileIt){
        resultsDataObjs.push({fileName:fileNames[fileIt],roi_id:-1,headings:[],data:[],initialized:false});
    }
    for(fileIt=0;fileIt<fileNames.length;++fileIt){
        var promise = fileToDataObj(resultsDataObjs,fileIt);;
        promises.push(promise);
    }
    Promise.all(promises).then(function(response) {
        //console.log("fileToDataObj succeeded!", response);
        if(response[0]=="file read failed!"){
            alert('failed to load results files (could be due to subset locations being modified without re-running the analysis)');
            $("#showDeformedCheck").prop("checked", false);
            return;
        }
        cb();
        resultsFresh = false;
    },function(error) {
        console.error("fileToDataObj() failed!", error);
        return;
    });
}

function turnOffDeformedShapesAndROIsOn(){
    // create copy shapes for each deformed ROI
    var allShapes = getPlotlyShapes();
    for(var i=0;i<allShapes.length;++i){
        if(!allShapes[i].name) continue;
        if(allShapes[i].name.includes('deformed')){
            allShapes[i].visible = false;
        }
        if(allShapes[i].name.includes('ROI')||allShapes[i].name.includes('excluded')){
            allShapes[i].visible = true;
        }
    }
    // call relayout
    var update = {
            'shapes' : allShapes
    }
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
}

function showDeformedROIs(){
    console.log('showDeformedROIs(): showDeformedCheck ' + $("#showDeformedCheck")[0].checked);
    if(!$("#showDeformedCheck")[0].checked) return;
    if(!($("#analysisModeSelect").val()=="tracking"&&showStereoPane==0)) return;
    if(resultsDataObjs.length==0){
        loadTrackingResultsIntoMemory(function(){updateDeformedROIs();});
    }
    else{
        updateDeformedROIs();
    }
}

function updateDeformedROIs(){
    console.log('updateDeformedROIs():');
    var frame = $("#frameScroller").val();
    var headers = resultsDataObjs[0].headings;
    var frameRowID=-1;
    var coordsXID=-1;
    var coordsYID=-1;
    var dispXID=-1;
    var dispYID=-1;
    var rotationID=-1;
    var sigmaID=-1;
    for(i=0;i<headers.length;++i){
        if(headers[i]=="FRAME")frameRowID=i;
        if(headers[i]=="COORDINATE_X")coordsXID=i;
        if(headers[i]=="COORDINATE_Y")coordsYID=i;
        if(headers[i]=="DISPLACEMENT_X")dispXID=i;
        if(headers[i]=="DISPLACEMENT_Y")dispYID=i;
        if(headers[i]=="ROTATION_Z")rotationID=i;
        if(headers[i]=="SIGMA")sigmaID=i;
    }
//    console.log('FrameID ' + frameRowID);
//    console.log('CoordsXID ' + coordsXID);
//    console.log('CoordsYID ' + coordsYID);
//    console.log('DispXID ' + dispXID);
//    console.log('DispYID ' + dispYID);
//    console.log('RotationID ' + rotationID);
    if(frameRowID<0||coordsXID<0||coordsYID<0||dispXID<0||dispYID<0||rotationID<0||sigmaID<0)return;
    // test that the frame number is valid
    var frameCol = -1;
    for(i=0;i<resultsDataObjs[0].data[frameRowID].length;++i){
        if(resultsDataObjs[0].data[frameRowID][i]==frame)frameCol = i;
    }
    //console.log(resultsDataObjs[roi].data[frameRow]);
//    console.log('frame col ' + frameCol);
    if(frameCol<0)return;
    
    // create copy shapes for each deformed ROI
    var allShapes = getPlotlyShapes();
    for(var i=0;i<allShapes.length;++i){
        if(!allShapes[i].name) continue;
        if(allShapes[i].name.includes('deformed')){
            var id = allShapes[i].name.split('_').pop();
            // figure out which results data obj to use since they are not loaded in order
            var dataId = -1;
            for(var j=0;j<resultsDataObjs.length;++j){
                if(resultsDataObjs[j].roi_id==id)
                    dataId = j;
            }
            // update this shape's coordinates based on 
            // the file associated with its id
            var cx    = resultsDataObjs[dataId].data[coordsXID][frameCol];
            var cy    = resultsDataObjs[dataId].data[coordsYID][frameCol];
            var u     = resultsDataObjs[dataId].data[dispXID][frameCol];
            var v     = resultsDataObjs[dataId].data[dispYID][frameCol];
            var theta = resultsDataObjs[dataId].data[rotationID][frameCol];
            var sigma = resultsDataObjs[dataId].data[sigmaID][frameCol];
            var cost = Math.cos(theta);
            var sint = Math.sin(theta);
            
            var originalShape = getPlotlyShapes('ROI_' + id,true);
            if(originalShape.length!=1){
                console.log('error: could not find original path shape for ROI_' + id);
                return;
            }
            var originalPoints = pathShapeToPoints(originalShape[0]);
            var points = {x:[],y:[]}; //pathShapeToPoints(allShapes[i]);
            
            for(pt=0;pt<originalPoints.x.length;++pt){
                var dx = originalPoints.x[pt] - cx;
                var dy = originalPoints.y[pt] - cy;
                points.x.push(cost*dx - sint*dy + u + cx);
                points.y.push(sint*dx + cost*dy + v + cy); 
            }
            var newShape = pointsToPathShape(points,allShapes[i].name)
            newShape.line = {color: 'green'};
            if(sigma<0.0)
                newShape.line = {color: 'red'};
            newShape.fillcolor = 'yellow';
            newShape.visible = allShapes[i].visible;
            allShapes[i] = newShape;
        }
    }
    var visible = $("#showDeformedCheck")[0].checked;
    for(var i=0;i<allShapes.length;++i){
        if(allShapes[i].name.includes('deformed')){
            allShapes[i].visible = visible;
        }
        if(allShapes[i].name.includes('ROI')||allShapes[i].name.includes('excluded')){
            allShapes[i].visible = !visible;
        }
    }
    // call relayout
    var update = {
            'shapes' : allShapes,
    }
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
}
