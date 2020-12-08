$(window).load(function(){
});

function resizePreview(){
    console.log('resizing the plotly previews');
    Plotly.Plots.resize(document.getElementById("plotlyViewerLeft"));
    Plotly.Plots.resize(document.getElementById("plotlyViewerRight"));
}

function getPreviewLayout(){
    var _layout = {
            xaxis: {
                showgrid: false,
                zeroline: false,
                showline: false,
            },
            yaxis: {
                scaleanchor: 'x',
                showgrid: false,
                zeroline: false,
                showline: false,
            },
            margin: {l: 40,r: 5,b: 20,t: 30},
            hovermode: 'closest',
    };
    if($("#analysisModeSelect").val()=="subset"||$("#analysisModeSelect").val()=="global"){
        _layout.newshape = {line: {color: 'cyan'},fillcolor:'cyan',opacity:0.4};
    }
    if($("#analysisModeSelect").val()=="tracking"){
        _layout.newshape = {line: {color: 'purple'},fillcolor:'green',opacity:0.4};
    }
    return _layout;
}

function getPreviewConfig(dest){
    // include the show subset locations button // TODO hide this for tracklib
    let dotsIcon = {
            'width': 24,
            'height': 24,
            'path': "M7,11c1.657,0,3,1.343,3,3c0,1.656-1.343,3-3,3s-3-1.344-3-3C4,12.343,5.343,11,7,11z M11,3c1.656,0,3,1.343,3,3s-1.344,3-3,3C9.343,9,8,7.657,8,6S9.343,3,11,3z M16.6,14.6c1.657,0,3,1.344,3,3c0,1.657-1.343,3-3,3c-1.656,0-3-1.343-3-3C13.6,15.943,14.943,14.6,16.6,14.6z"
            //'transform': 'matrix(0.75 0 0 -0.75 0 1000)'
    }
    var showSubsetLocationsButton = {
            name: 'Show subset locations',
            icon: dotsIcon,
            click: () => { drawSubsetCoordinates(); }
    }
    let importIcon = {
            'width': 24,
            'height': 24,
            'path': "M12,16.5l4-4h-3v-9h-2v9H8L12,16.5z M21,3.5h-6v1.99h6V19.52H3V5.49h6V3.5H3c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2v-14C23,4.4,22.1,3.5,21,3.5z"
    }
    var importSubsetLocationsButton = {
            name: 'Import subset file',
            icon: importIcon,
            click: () => {$('#loadSubsetFileInputIcon').click();}
    }
    var _config = {
            displaylogo: false,
            scrollZoom: true,
            responsive: true,
            modeBarButtonsToRemove: [
                'autoScale2d',
                'select2d',
                'lasso2d'
                ],
    };
    if($("#analysisModeSelect").val()=="subset"||$("#analysisModeSelect").val()=="global"){
        if(dest=='left'){
            _config.modeBarButtonsToAdd = [
                'drawclosedpath',
                'eraseshape',
                showSubsetLocationsButton,
                importSubsetLocationsButton];
        }
    }
    if($("#analysisModeSelect").val()=="tracking"){
        if(showStereoPane==1){ // signifies tracklib (stereo tracking)
            _config.modeBarButtonsToRemove.push('drawclosedpath');
            _config.modeBarButtonsToRemove.push('eraseshape');
        }else if(dest=='left'){
            _config.modeBarButtonsToAdd = [
                'drawclosedpath',
                'eraseshape',
                showSubsetLocationsButton,
                importSubsetLocationsButton];
        }
    }
    return _config;
}

function getPreviewLayoutConfig(dest){
    // NOTE mode bar buttons are persistent so if the user
    // changes the analysis type some buttons may need to be removed
    
    // possible destinations: left, right, cal_left, cal_right
    var _layout = getPreviewLayout();
    var _config = getPreviewConfig(dest);
    var obj = {
            layout : _layout,
            config : _config
    }
//    console.log('getPreviewConfig called');
//    console.log(obj);
    return obj;
}

function updatePreview(filePath,dest,data=[],argsIn,debugConsoleDivId,cb){
    cb = cb || $.noop;
    if(dest!='left'&&dest!='right'&&dest!='cal_left'&&dest!='cal_right'){
        console.log('error: invalid destination ' + dest);
        return;
    }

    var spec = [];
    spec.srcPath = filePath;
    if(dest=='left'){
        spec.destPath = fullPath('.dice','.preview_left.png');
        spec.destDivId = "plotlyViewerLeft";
    }
    else if(dest=='right'){
        spec.destPath = fullPath('.dice','.preview_right.png');
        spec.destDivId = "plotlyViewerRight";
    }
    else if(dest=='cal_left'){
        spec.destPath = fullPath('.dice','.preview_cal_left.png');
        spec.destDivId = "plotlyViewerCalLeft";
    }
    else if(dest=='cal_right'){
        spec.destPath = fullPath('.dice','.preview_cal_right.png');
        spec.destDivId = "plotlyViewerCalRight";
    }
    spec.dest = dest;
    if(0 === spec.srcPath.length){
        console.log('clearing the display image for dest ' + dest);
        Plotly.purge(document.getElementById(spec.destDivId));
        //updateImage(spec,[]);
        return;
    }
    
    // if there is already a data entry for the subset coordinates, automatically push that to the data array
    var div = document.getElementById(spec.destDivId);
    if(div.data)
        for(var i=0;i<div.data.length;++i)
            if(div.data[i].name=='subsetCoordinates')
                data.push(div.data[i]);
    
    // set up the arguments to call the DICe opencv server which will convert whatever the input image
    // is to png so that it can be displayed in the viewer
    args = [];
    args.push(spec.srcPath);
    args.push(spec.destPath);
    var hasArgs = false;
    if(argsIn!==undefined)
        if(argsIn.length > 0)
            hasArgs = true;
    if(hasArgs){
        for(var i=0;i<argsIn.length;++i)
            args.push(argsIn[i]);
    }else
        args.push('filter:none'); // no filter applied, but non .png images are converted to png
    
    console.log(args);
    
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc = child_process.spawn(execOpenCVServerPath,args,{cwd:workingDirectory});//,maxBuffer:1024*1024});
    proc.on('error', function(){
        alert('DICe OpenCVServer failed: invalid executable: ' + execOpenCVServerPath);
    });
    proc.on('close', (code) => {
        console.log(`OpenCVServer exited with code ${code}`);
        // execute call back with error code
        cb(code);
        if(code>=0&&code<4){
            console.log("updatePreview(): src path " + spec.srcPath);
            console.log("updatePreview(): dest path " + spec.destPath);
            fs.stat(spec.destPath, function(err, stat) {
                if(err == null) {
                    updateImage(spec,data);
                    if(dest=='left'||dest=='right')
                        checkValidInput();
                }
            });
        }else{
            console.log('error ocurred ' + code);
        }
    });
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        //console.log(line);
        if(debugConsoleDivId){
            if(debugConsoleDivId.length > 0){
                $(debugConsoleDivId).append(line + '</br>');
                $(debugConsoleDivId).scrollTop($(debugConsoleDivId).get(0).scrollHeight);
            }
        }else{
            console.log(line);
        }
        // collect buffer output to set height and width of the image
        // this gets printed to the cout buffer by the opencv server while
        // converting the image to .png format
        if(line.includes("BUFFER_OUT")&&line.includes("IMAGE_WIDTH")){
            console.log('setting image width to ' + line.split(' ').pop());
            spec.width = Number(line.split(' ').pop());
            if(dest=='left')
                refImageWidth = spec.width;
        }
        if(line.includes("BUFFER_OUT")&&line.includes("IMAGE_HEIGHT")){
            console.log('setting image height to ' + line.split(' ').pop());
            spec.height = Number(line.split(' ').pop());
            if(dest=='left')
                refImageHeight = spec.height;
        }
    });
}

function updateImage(spec,data){
    console.log('updateImage(): path ' + spec.destPath + ' in div '  + spec.destDivId);
    var obj = getPreviewLayoutConfig(spec.dest);
    // see if there is an existing plotly plot and if so keep the x and y axis ranges (same zoom)
    // also keep the shapes if they exist
    var div = document.getElementById(spec.destDivId);
    if(div.layout){
        if(div.layout.xaxis){ // TODO test for xaxis defined?
            obj.layout.xaxis.range = [div.layout.xaxis.range[0],div.layout.xaxis.range[1]];
            obj.layout.yaxis.range = [div.layout.yaxis.range[0],div.layout.yaxis.range[1]];
        }
        if(div.layout.shapes){
            obj.layout.shapes = div.layout.shapes;
        }
    }else{
        obj.layout.xaxis.range = [0,spec.width];
        obj.layout.yaxis.range = [spec.height,0];
    }
    if(spec.srcPath.length>0){
        obj.layout.images = [{
            source: spec.destPath,
            xref: 'x',
            yref: 'y',
            x: 0,
            y: 0,
            sizex: spec.width,
            sizey: spec.height,
            layer: 'below',
        }];
    }
//    var data = [ {
//        z: [0.65,0.6,0.7,0.6,0.72,0.72,1.0,0.7,0.5],
//        x: [180,230,360,100,180,300,350,45,110],
//        y: [510,100,515,300,760,600,900,810,80],
//        type: 'contour',
//        opacity: 0.6,
//        colorscale: 'Jet',
//        showscale: true,
//        autocontour: true,
//      }];
    // TODO call restyle or relayout instead of newPlot each time?
    Plotly.newPlot(div,data,obj.layout,obj.config);
}

function removeSubsetPreview(){
    var allTraces = document.getElementById("plotlyViewerLeft").data;
    var previewResult = allTraces.findIndex(obj => { 
        return obj.name === "subsetPreview";
    });
    if(previewResult>=0){
        Plotly.deleteTraces(document.getElementById("plotlyViewerLeft"), previewResult);
    }
    return(previewResult>=0); // return value is true if the trace existed
}

// draw the subset coordinates or remove them if they exist
function drawSubsetCoordinates(){
    var allTraces = document.getElementById("plotlyViewerLeft").data;
    var result = allTraces.findIndex(obj => { 
     return obj.name === "subsetCoordinates";
    });
    var newFlag = true;
    if(result>=0){
        newFlag = !allTraces[result].visible;
        Plotly.restyle(document.getElementById("plotlyViewerLeft"), {"visible": newFlag}, [result]);
    }else if($("#analysisModeSelect").val()=="subset"){ // if doing subset analysis and custom coodinates are not defined, preview where the subsets will end up
        // check if the subset preview exists, if so turn it off
        var traceExisted = removeSubsetPreview();
//        var previewResult = allTraces.findIndex(obj => { 
//            return obj.name === "subsetPreview";
//        });
//        if(previewResult>=0){
//            Plotly.deleteTraces(document.getElementById("plotlyViewerLeft"), previewResult);
//            return;
//        }
        // if not rebuild it
        if(!traceExisted){
            startProgress();
            writeInputFile(false,false,true);
        }
    }
}

function getPlotlyData(){
    return document.getElementById("plotlyViewerLeft").data;
}
function getSubsetCoordinatesTrace(){
    var allTraces = getPlotlyData();
    var result = allTraces.findIndex(obj => { 
     return obj.name === "subsetCoordinates";
    });
    if(result>=0)
        return allTraces[result];
    else
        return {};
}

function getPlotlyPathShapes(name){
    var pathShapes = [];
    var plotlyDivLeft = document.getElementById("plotlyViewerLeft");
    if(plotlyDivLeft.layout.shapes){
        var shapes = plotlyDivLeft.layout.shapes;
        for(var i=0;i<shapes.length;++i){
            if(shapes[i].type=='path')
                if(name){
                    if(shapes[i].name.includes(name))
                        pathShapes.push(shapes[i]);
                }else{
                    pathShapes.push(shapes[i]);
                }
        }
    }
    return pathShapes;
}

$("#plotlyViewerLeft").on('plotly_relayout', function(){
    checkForInternalShapes();
    // update the subset coordinates trace
    var shapes = getPlotlyPathShapes('ROI');
    if(shapes.length<=0)return;
    var centroids = shapesToCentroids(shapes);
    var text = [];
    if(centroids.x)
        for(var i=0;i<centroids.x.length;++i)
            text.push('id: ' + i.toString());
    var coordsTraceId = document.getElementById("plotlyViewerLeft").data.findIndex(obj => { 
        return obj.name === "subsetCoordinates";
    });
    if(coordsTraceId>=0&&centroids.x){
        if(document.getElementById("plotlyViewerLeft").data[coordsTraceId].x.length>0){
            var update = {
                    x: [centroids.x],
                    y: [centroids.y],
                    text: [text]
            }
            Plotly.restyle(document.getElementById("plotlyViewerLeft"), update, coordsTraceId);
        }
    }
    // the subset coordinates trace may not exist, if not and the analsis mode is tracking add one
    else if(centroids.x&&$("#analysisModeSelect").val()=="tracking"&&showStereoPane==0){
        Plotly.addTraces(document.getElementById("plotlyViewerLeft"),pointsToSubsetLocationTrace(centroids));
    }
});

function isInShape(cx,cy,shape){
    var points = pathShapeToPoints(shape);
    var vertices_x = points.x;
    var vertices_y = points.y;
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
      dx1 = verts_x[i] - cx;
      dy1 = verts_y[i] - cy;
      dx2 = verts_x[i+1] - cx;
      dy2 = verts_y[i+1] - cy;
      angle += angle2d(dx1,dy1,dx2,dy2);
    }
    // if the angle is greater than 2PI, the point is in the polygon
    if(Math.abs(Math.abs(angle) - 2.0*Math.PI) < 1.0E-4){
        return true;
    }else{
        return false;
    }
}

function angle2d(x1,y1,x2,y2){
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

function checkForInternalShapes(){
    var shapes = getPlotlyPathShapes(); // get all shapes, not just ROIs
    if(shapes.length<=0) return;
    //console.log(shapes);
    var centroids = shapesToCentroids(shapes);
    //console.log(centroids);
    var changesMade = false;
    for(var i=0;i<centroids.x.length;i++){
        if(shapes[i].name===undefined) shapes[i].name='ROI';
        if(shapes[i].name!='ROI') continue;
        var cx = centroids.x[i];
        var cy = centroids.y[i];
        // iterate the shapes backwards because the exclusions are always added after the base shape
        for(var j=shapes.length-1;j>=0;j--){
            if(j==i) continue;
            if(shapes[j].name!='ROI')continue;
            if(isInShape(cx,cy,shapes[j])){
                shapes[i].name = 'excluded_' + j;
                shapes[i].line = {color: 'red'};
                shapes[i].fillcolor = 'red';
                shapes[i].opacity = 0.2;
                changesMade = true;
                break;
            }
        }
    }
    if(changesMade){
        var update = {
                'shapes' : shapes,
        }
        Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
    }
}

function removeAllPlotlyShapesAndTraces(){
    if(!document.getElementById("plotlyViewerLeft").layout) return;
    // remove the shapes
    var lineColor = 'cyan';
    var fillColor = 'cyan';
    if($("#analysisModeSelect").val()=="tracking"){
        lineColor =  'purple';
        fillColor = 'green';
    }
    var update = {
            'shapes' : [],
            'newshape.fillcolor' : fillColor,
            'newshape.line.color' : lineColor
    }
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
    // remove any subset coordinates or conformal rois
    var numTraces = 0;
    if(document.getElementById("plotlyViewerLeft").data)
        numTraces = document.getElementById("plotlyViewerLeft").data.length;
    if(numTraces>0){
        for(var i=0;i<numTraces;++i)
            Plotly.deleteTraces(document.getElementById("plotlyViewerLeft"),i);
    }
}

function addSubsetSSSIGPreviewTrace(locsFile){
    // expects a listing of all the subset locations x and y coordinates
    fs.stat(locsFile, function(err, stat) {
        if(err == null) {
            fs.readFile(locsFile, 'utf8', function (err,dataS) {
                if (err) {
                    return console.log(err);
                }
                var coords = {x:[],y:[]};
                var locsData = dataS.toString().split(/\s+/g).map(Number);
                for(i=0;i<locsData.length-1;i++){
                    if(isNaN(locsData[i])) continue;
                    coords.x.push(locsData[i++]);
                    coords.y.push(locsData[i]);
                }
                var previewTrace = pointsToSubsetLocationTrace(coords,'subsetPreview');
                previewTrace.visible = true;
                Plotly.addTraces(document.getElementById("plotlyViewerLeft"),previewTrace);
            }); // end readFile
        } // end null
        else{
            alert("failed to read " + locsFile);
            return;
        }
    }); 
}





