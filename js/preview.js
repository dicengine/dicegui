$(window).load(function(){
});

var plotlyMarginL = 40;
var plotlyMarginR = 5;
var plotlyMarginB = 20;
var plotlyMarginT = 30;

function resizePreview(){
    console.log('resizing the plotly previews');
    var pvs = [document.getElementById("plotlyViewerLeft"),
        document.getElementById("plotlyViewerRight")];
    for(var i=0;i<pvs.length;++i){
        var pv = pvs[i];
        if(pv.layout){
            Plotly.Plots.resize(pv);
            if(pv.layout.images){
                var imW = pv.layout.images[0].sizex;
                var imH = pv.layout.images[0].sizey;
                var update = { 'xaxis.range': [0,imW], 'yaxis.range': [imH,0] };
                Plotly.relayout(pv, update);
            }
        }
    }
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
            margin: {l: plotlyMarginL,r: plotlyMarginR,b: plotlyMarginB,t: plotlyMarginT},
            hovermode: 'closest',
    };
    if($("#analysisModeSelect").val()=="subset"||$("#analysisModeSelect").val()=="global"){
        _layout.newshape = {line: {color: 'yellow'},fillcolor:'cyan',opacity:0.4};
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
    let deleteLivePlotPtsIcon = {
            'width': 24,
            'height': 24,
            'path': "M7,11v2h10v-2H7z M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10c5.52,0,10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z"
    }
    var deleteLivePlotPtsButton = {
            name: 'Delete live plot pts',
            icon: deleteLivePlotPtsIcon,
            click: () => { deleteLivePlotPts();}
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
                'drawline',
                showSubsetLocationsButton,
                importSubsetLocationsButton,
                deleteLivePlotPtsButton];
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
    return obj;
}

function updatePreview(filePath,dest,data=[],argsIn,debugConsoleDivId,cb){
    cb = cb || $.noop;
    if(dest!='left'&&dest!='right'&&dest!='cal_left'&&dest!='cal_right'){
        console.log('error: invalid destination ' + dest);
        return;
    }
    if(data) console.log(data);

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
        for(var i=0;i<div.data.length;++i){
            if(div.data[i].name=='subsetCoordinates')
                data.push(div.data[i]);
            if(div.data[i].name=='livePlotPts')
                data.push(div.data[i]);
        }
    
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
    // add tracklines for tracklib
    addPreviewTracks(obj.layout,data);
    
    // add a heatmap 
    updateCoordsHeatmap(spec.width,spec.height);
    data.unshift(coordsHeatmap);
    // TODO call restyle or relayout instead of newPlot each time?
    Plotly.newPlot(div,data,obj.layout,obj.config);
    if(spec.dest=='left'&&$("#analysisModeSelect").val()=="subset"){
        drawRepresentativeSubset();
        if(showStereoPane==1)
            drawBestFitLine();
    }
    var posDiv = document.getElementById('leftPos');
    if(spec.dest=='right')
        posDiv = document.getElementById('rightPos');
    
    div.on('plotly_hover', function(data){
        if(spec.dest!='left' && spec.dest!='right') return;
        var infotext = data.points.map(function(d){
            return ('['+d.x+','+d.y+']');
        });
        posDiv.innerText = infotext;
    });
    div.on('plotly_click', function(data){
        if(spec.dest!='left' && spec.dest!='right') return;
        //console.log(data);
        if(data.points[0].data.name==='tracklibPreviewScatter'){
            drawNeighCircle(spec.dest,data.points[0].x,data.points[0].y);
            updateNeighInfoTrace(spec.dest,data.points[0].pointIndex);
            drawEpipolarLine(spec.dest,data.points[0].pointIndex);
        }
    });
    
    if(spec.dest=='left' && $("#analysisModeSelect").val()=="subset"){
        div.on('plotly_click', function(data){
            if(spec.dest!='left') return;
            if(data.event.button!=2) return;// right click only 
            addLivePlotPts([data.points[0].x],[data.points[0].y]);
        });
    }
}

function livePlotDims(){
    var result = {numLivePlotPts:0,
            livePlotLineActive: false};
    if($("#analysisModeSelect").val()!="subset") return result;
    var data = document.getElementById("plotlyViewerLeft").data;
    var livePlotPtsTraceId = data.findIndex(obj => { 
        return obj.name === "livePlotPts";
    });
    if(livePlotPtsTraceId>=0){
        result.numLivePlotPts = data[livePlotPtsTraceId].x.length;
    }
    var lineShapes = getPlotlyShapes('livePlotLine')
    result.livePlotLineActive = lineShapes.length==1;
    return result;
}

function addLivePlotLine(ox,oy,px,py){
    // check if live plot points have been defined
    if($("#analysisModeSelect").val()!="subset") return;
    var lineShape = {
            type: 'line',
            x0: ox,
            x1: px,
            y0: oy,
            y1: py,
            line: {color: 'yellow', width: 3},
            name: 'livePlotLine',
            editable: true,
            opacity: 0.8
    };
    var existingShapes = getPlotlyShapes();
    existingShapes.push(lineShape);
    var update = {'shapes' : existingShapes}
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
}

function addLivePlotPts(ptsX,ptsY){
    // check if live plot points have been defined
    if($("#analysisModeSelect").val()!="subset") return;
    var data = document.getElementById("plotlyViewerLeft").data;
    if(!data){
        alert('error: plotly viewer left data has not been defined');
        return;
    }
    for(var i=0;i<ptsX.length;++i)
        console.log('add live plot point @' + ptsX[i] + ',' + ptsY[i]);
    var livePlotPtsTraceId = data.findIndex(obj => { 
        return obj.name === "livePlotPts";
    });
    console.log('livePlotPtsTraceId ' + livePlotPtsTraceId);
    var x = [];
    var y = [];
    var text = [];
    if(livePlotPtsTraceId>=0){
        // update the points by adding one to it
        x = data[livePlotPtsTraceId].x;
        y = data[livePlotPtsTraceId].y;
        text = data[livePlotPtsTraceId].text;
    }
    var pointId = x.length;
    for(var i=0;i<ptsX.length;++i){
        x.push(ptsX[i]);
        y.push(ptsY[i]);
        text.push('live plot pt: ' + pointId.toString());
        pointId++;
    }
    if(livePlotPtsTraceId>0){
        var update = {
                x: [x],
                y: [y],
                text: [text]
        }
        Plotly.restyle(document.getElementById("plotlyViewerLeft"), update, livePlotPtsTraceId);
    }
    else{
        var coords = {x:x,y:y};
        var color = 'yellow'; //'#00ff00';
        var previewTrace = pointsToScatterTrace(coords,'livePlotPts',color,text);
        previewTrace.visible = true;
        Plotly.addTraces(document.getElementById("plotlyViewerLeft"),previewTrace);
    }
}

function deleteLivePlotPts(){
    console.log('deleteLivePlotPts()');
    var allTraces = document.getElementById("plotlyViewerLeft").data;
    var previewResult = allTraces.findIndex(obj => { 
        return obj.name === "livePlotPts";
    });
    if(previewResult>=0){
        Plotly.deleteTraces(document.getElementById("plotlyViewerLeft"), previewResult);
    }
    // TODO delete line info as well
}

function removeSubsetPreview(){
    console.log('removeSubsetPreview()');
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
    console.log('drawSubsetCoordinates()')
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

function getPlotlyShapes(name,strict=false){
    var returnShapes = [];
    var plotlyDivLeft = document.getElementById("plotlyViewerLeft");
    if(plotlyDivLeft.layout){
        if(plotlyDivLeft.layout.shapes){
            var shapes = plotlyDivLeft.layout.shapes;
            for(var i=0;i<shapes.length;++i){
                //if(shapes[i].type=='path')
                    if(name){
                        if(!strict&&shapes[i].name.includes(name))
                            returnShapes.push(shapes[i]);
                        else if(shapes[i].name==name)
                            returnShapes.push(shapes[i]);
                    }else{
                        returnShapes.push(shapes[i]);
                    }
            }
        }
    }
    return returnShapes;
}

$("#plotlyViewerLeft").on('plotly_relayout', function(){
    console.log('plotly_relayout event begin');
    if(updateLivePlotLine() ||
            assignShapeNames() ||
            checkForInternalShapes()){
        var update = {'shapes' : getPlotlyShapes()}
        Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
    }
    
    // update the subset coordinates trace
    var shapes = getPlotlyShapes('ROI');
    if(shapes.length<=0){
        checkValidInput();
        return;
    }
    
    // check if subset coordinates have already been defined
    
    var centroids = shapesToCentroids(shapes);
    var text = [];
    if(centroids.x)
        for(var i=0;i<centroids.x.length;++i){
            var shapeId = shapes[i].name.split('_').pop();
            text.push('id: ' + shapeId.toString());
        }
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
        Plotly.addTraces(document.getElementById("plotlyViewerLeft"),pointsToScatterTrace(centroids));
    }
    checkValidInput();
    console.log('plotly_relayout event end');
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

function drawRepresentativeSubset(){
    if(!$("#analysisModeSelect").val()=="subset") return;
    var pv = document.getElementById("plotlyViewerLeft");
    if(!pv.layout) return;
    var cx = refImageWidth/2;
    var cy = refImageHeight/2;
    var subsetSize = $("#subsetSize").val();
    // check if representative subset already exists and get it's points
    var existingShapes = [];
    if(pv.layout.shapes){
        existingShapes = pv.layout.shapes;
    }
    var existingBoxIndex = existingShapes.findIndex(obj => { 
        return obj.name === "representativeSubset";
    });
    if(existingBoxIndex>=0){
        var boxPoints = pathShapeToPoints(existingShapes[existingBoxIndex]);
        cx = (boxPoints.x[0] + boxPoints.x[1])/2;
        cy = (boxPoints.y[0] + boxPoints.y[3])/2;
    }
    var points = {x:[cx-subsetSize/2,cx+subsetSize/2,cx+subsetSize/2,cx-subsetSize/2],
            y:[cy-subsetSize/2,cy-subsetSize/2,cy+subsetSize/2,cy+subsetSize/2]};
    var path = 'M';
    for(var i=0;i<points.x.length;++i){
        path+= points.x[i] + ',' + points.y[i];
        if(i<points.x.length-1)
            path +='L';
    }
    path += 'Z';
    if(existingBoxIndex>=0){
        existinShapes[existingBoxIndex].path = path;
        existinShapes[existingBoxIndex].visible = true;
    }else{
        var shape = {};
        shape.name = 'representativeSubset';
        shape.type = 'path';
        shape.path = path;
        shape.line = {color: 'yellow', width:2}
        shape.opacity = 1.0;
        shape.visible = true;
        shape.editable = true;
        existingShapes.push(shape);
    }
    var update = {'shapes' : existingShapes}
    Plotly.relayout(pv,update);
}

function drawNeighCircle(dest,cx,cy){
    if(!$("#analysisModeSelect").val()=="tracking"||showStereoPane!=1) return;
    var pv = document.getElementById("plotlyViewerLeft");
    if(dest=='right'){
        var pv = document.getElementById("plotlyViewerRight");
        undrawShape('left','neighCircle');
    }else{
        undrawShape('right','neighCircle');
    }
    var pvl = pv.layout;
    if(!pvl) return;
//    var cx = refImageWidth/2;
//    var cy = refImageHeight/2;

    // check if representative subset already exists and get it's points
    var existingShapes = [];
    var existingCircleIndex = -1;
    var existingCircleLineXIndex = -1;
    var existingCircleLineYIndex = -1;
    if(pvl.shapes)
        existingShapes = pvl.shapes;
    
    for(var i=0;i<existingShapes.length;++i){
        if(existingShapes[i].name){
            if(existingShapes[i].name=='neighCircle')
                existingCircleIndex = i;
            if(existingShapes[i].name=='neighCircleLineX')
                existingCircleLineXIndex = i;
            if(existingShapes[i].name=='neighCircleLineY')
                existingCircleLineYIndex = i;
        }
    }
    var circleSize = Number($("#neighborRadius").val());
    if(existingCircleIndex>=0){
        existingShapes[existingCircleIndex].x0 = cx - circleSize;
        existingShapes[existingCircleIndex].x1 = cx + circleSize;
        existingShapes[existingCircleIndex].y0 = cy - circleSize;
        existingShapes[existingCircleIndex].y1 = cy + circleSize;
        existingShapes[existingCircleIndex].visible = true;
    }else{
        var circle = {
                type:'circle',
                x0: cx - circleSize,
                x1: cx + circleSize,
                y0: cy - circleSize,
                y1: cy + circleSize,
                line: {color: 'red', width:2},
                opacity: 0.5,
                editable: false,
                visible: true,
                name: 'neighCircle'
        };
        existingShapes.push(circle);
    }
    if(existingCircleLineXIndex>=0){
        if(existingCircleLineYIndex<0) 
            console.log('error: drawing neigh circle failed');
        existingShapes[existingCircleLineXIndex].x0 = cx - circleSize;
        existingShapes[existingCircleLineXIndex].x1 = cx + circleSize;
        existingShapes[existingCircleLineXIndex].y0 = cy;
        existingShapes[existingCircleLineXIndex].y1 = cy;
        existingShapes[existingCircleLineYIndex].x0 = cx;
        existingShapes[existingCircleLineYIndex].x1 = cx;
        existingShapes[existingCircleLineYIndex].y0 = cy - circleSize;
        existingShapes[existingCircleLineYIndex].y1 = cy + circleSize;
        existingShapes[existingCircleLineXIndex].visible = true;
        existingShapes[existingCircleLineYIndex].visible = true;
    }else{
        var lineX = {
                type: 'line',
                x0: cx - circleSize,
                x1: cx + circleSize,
                y0: cy,
                y1: cy,
                line: {color: 'red', width: 1, dash:'dash'},
                name: 'neighCircleLineX',
                editable: false,
                visible: true,
                opacity: 0.5
        };
        var lineY = {
                type: 'line',
                x0: cx,
                x1: cx,
                y0: cy - circleSize,
                y1: cy + circleSize,
                line: {color: 'red', width: 1, dash:'dash'},
                name: 'neighCircleLineY',
                editable: false,
                visible: true,
                opacity: 0.5
        };
        existingShapes.push(lineX);
        existingShapes.push(lineY);
    }
    var update = {'shapes' : existingShapes}
    Plotly.relayout(pv,update);
}

function numROIShapes(){
    return getPlotlyShapes('ROI').length;
}

function deleteShape(index){
    if(document.getElementById("plotlyViewerLeft").layout)
        if(document.getElementById("plotlyViewerLeft").layout.shapes)
            if(document.getElementById("plotlyViewerLeft").layout.shapes.length>index)
                document.getElementById("plotlyViewerLeft").layout.shapes.splice(index,1);
}

function updateLivePlotLine(){
    var relayoutNeeded = false;
    var shapes = getPlotlyShapes(); // get all shapes, not just ROIs
    var oldLineIndex = -1;
    var newLineIndex = -1;
    for(var i=0;i<shapes.length;++i){
        if(shapes[i].type==='line'){
            if(shapes[i].name){
                if(oldLineIndex>=0)
                    alert('error in update live plot line, too many existing lines found');
                if(shapes[i].name==='livePlotLine')
                    oldLineIndex = i;
            }
            else{
                if(newLineIndex>=0)
                    alert('error in update live plot line, too many new lines found');
                newLineIndex = i;
            }
        }
    }
    if(newLineIndex>=0){
        shapes[newLineIndex].name='livePlotLine';
        shapes[newLineIndex].line = {color: 'yellow', width: 3};
        shapes[newLineIndex].opacity = 0.8;
        relayoutNeeded = true;
    }
    if(oldLineIndex>=0&&newLineIndex>=0){
        deleteShape(oldLineIndex);
    }
    return relayoutNeeded;
}

function assignShapeNames(){
    var relayoutNeeded = false;
    var shapes = getPlotlyShapes(); // get all shapes, not just ROIs
    var ROICount = 0;
    var i = shapes.length;
    while (i--) {
        if(shapes[i].name===undefined&&shapes[i].type==='path'){
            if($("#showDeformedCheck")[0].checked){
                alert('cannot add ROIs while show tracked ROIs is active');
                deleteShape(i);
                relayoutNeeded = true;
                continue;
            }else{
                shapes[i].name='ROI_' + ROICount.toString();
                ROICount++;
            }
        }
    }
    return relayoutNeeded;
//    for(var i=0;i<shapes.length;i++){
//        if(shapes[i].name===undefined&&shapes[i].type==='path'){
//            if($("#showDeformedCheck")[0].checked){
//                alert('cannot add ROIs while show tracked ROIs is active');
//                deleteShape(i);
//                continue;
//            }else{
//                shapes[i].name='ROI_' + ROICount.toString();
//                ROICount++;
//            }
//        }
//    }
}

function checkForInternalShapes(){
    var relayoutNeeded = false;
    console.log('checkForInternalShapes()');
    var shapes = getPlotlyShapes(); // get all shapes, not just ROIs
    if(shapes.length<=0) return;
    var centroids = shapesToCentroids(shapes);
    // loop through the shapes to
    // iterate the shapes backwards because the exclusions are always added after the base shape
    for(var i=centroids.x.length-1;i>=0;i--){
        if(!shapes[i].name.includes('ROI')) continue;
        //console.log('checking shape ' + shapes[i].name);
        var cx = centroids.x[i];
        var cy = centroids.y[i];
        //console.log('checking shape ' + cx + ' ' + cy);
        for(var j=0;j<shapes.length;j++){
            if(j==i) continue;
            if(!shapes[j].name.includes('ROI'))continue;
            var inShapeId = shapes[j].name.split('_').pop();
            if(isInShape(cx,cy,shapes[j])){
                shapes[i].name = 'excluded_' + inShapeId;
                shapes[i].line = {color: 'red'};
                shapes[i].fillcolor = 'red';
                shapes[i].opacity = 0.2;
                relayoutNeeded = true;
                break;
            }
        }
    }
    return relayoutNeeded;
}

function removeAllPlotlyShapesAndTraces(){
    console.log('removeAllPlotlyShapesAndTraces()');
    if(!document.getElementById("plotlyViewerLeft").layout) return;
    // remove the shapes
    var lineColor = 'yellow';
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
        for(var i=0;i<numTraces;++i){
            Plotly.deleteTraces(document.getElementById("plotlyViewerLeft"),0);
        }
    }
}

function addSubsetSSSIGPreviewTrace(locsFile){
    console.log('addSubsetSSSIGPreviewTrace()');
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
                var previewTrace = pointsToScatterTrace(coords,'subsetPreview');
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


function heatmapNeedsUpdate(width,height){
    if(jQuery.isEmptyObject(coordsHeatmap)) return true;
    if(!coordsHeatmap.x) return true;
    if(!coordsHeatmap.y) return true;
    if(coordsHeatmap.x.length!=width) return true;
    if(coordsHeatmap.y.length!=height) return true;
    return false;
}


function updateCoordsHeatmap(width,height){
    if(!heatmapNeedsUpdate(width,height)) return;
    console.log('updating the coords heatmap');
    var hmX = [];
    var hmY = [];
    var hmZ = [];
    for(var i = 0; i < height; i++){
        hmY.push(i);
        var temp = [];
        for(var j = 0; j < width; j++)
            temp.push(0);
        hmZ.push(temp);
    }
    for(var j = 0; j < width; j++)
        hmX.push(j);
    coordsHeatmap = {
            name: 'coordsHeatmap',
            x: hmX,
            y: hmY,
            z: hmZ,
            showlegend: false,
            
            opacity: 0.0,
            type: 'heatmap',
//            colorscale: [["0.0", "rgb(255, 255, 255, 0.5)"], ["1.0", "rgb(255, 255, 255, 0.5)"]],  
            xgap: 1,
            ygap: 1,
            hoverinfo: 'none',
            showscale: false
    };
}

var coordsHeatmap = {};

function showBestFitLine(){
    var shapes = getPlotlyShapes();
    if(shapes.length==0) return;
    for(var i=0;i<shapes.length;++i)
        if(shapes[i].name)
            if(shapes[i].name==='bestFitLine')
                    shapes[i].visible = ($("#bestFitCheck")[0].checked&&showStereoPane==1);
    var update = {'shapes' : shapes}
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
}

function drawBestFitLine(ox,oy,px,py){
    // check if shapes already include a bestfit line
    var pv = document.getElementById("plotlyViewerLeft");
    if(!pv.layout) return;
    if(!pv.layout.images) return;
    var existingShapes = getPlotlyShapes();
    var bestFitLineIndex = -1;
    for(var i=0;i<existingShapes.length;++i){
        if(existingShapes[i].name)
            if(existingShapes[i].name==='bestFitLine')
                bestFitLineIndex = i;
    }
    if(bestFitLineIndex>=0&&!ox) return;
    if(bestFitLineIndex<0){
        var imW = pv.layout.images[0].sizex;
        var imH = pv.layout.images[0].sizey;
        if(!ox) ox = 0.3*imW;
        if(!oy) oy = 0.8*imH;
        if(!px) px = 0.7*imW;
        if(!py) py = 0.8*imH;
        var bestFitLine = {
                type: 'line',
                x0: ox,
                x1: px,
                y0: oy,
                y1: py,
                line: {color: 'blue', width: 3},
                name: 'bestFitLine',
                editable: true,
                opacity: 0.8,
                visible: $("#bestFitCheck")[0].checked
        };
        existingShapes.push(bestFitLine);
    }else{
        existingShapes[bestFitLineIndex].x0 = ox;
        existingShapes[bestFitLineIndex].y0 = oy;
        existingShapes[bestFitLineIndex].x1 = px;
        existingShapes[bestFitLineIndex].y1 = py;
    }
    var update = {'shapes' : existingShapes}
    Plotly.relayout(pv,update);
}

function addPreviewTracks(layout,data){
    if($('#analysisModeSelect').val()!="tracking"||showStereoPane!=1) return;
    var scatterTraceId = data.findIndex(obj => { 
        return obj.name === "tracklibPreviewScatter";
    });
    if(scatterTraceId<0) return;
    var px = data[scatterTraceId].x;
    var py = data[scatterTraceId].y;
    var fwdNeighId = data[scatterTraceId].fwdNeighId;
    // draw lines between all the points that have neighbors
    // remove all old track_lines
    if(!layout) return;
    if(!layout.shapes) layout.shapes = [];
    var i = layout.shapes.length;
    while (i--) {
        if(layout.shapes[i].name)
            if(layout.shapes[i].name==='trackLine')
                layout.shapes.splice(i,1);
    }
    for(var i=0;i<px.length;++i){
        if(fwdNeighId[i]<0) continue;
        var track_line = {
                name: 'trackLine',
                type:'line',
                x0: px[i],
                x1: px[fwdNeighId[i]],
                y0: py[i],
                y1: py[fwdNeighId[i]],
                line: {color: 'yellow', width:2},
                opacity: 0.8,
                editable: false,
                visible: true
        };
        layout.shapes.push(track_line);
    }
}

function updateNeighInfoTrace(dest,index){
    if(dest!='left'&&dest!='right') return;
    var pv = document.getElementById("plotlyViewerLeft");
    var pvStereo = document.getElementById("plotlyViewerRight");
    if(dest==='right'){
        pv = document.getElementById("plotlyViewerRight");
        pvStereo = document.getElementById("plotlyViewerLeft");
    }
    if(pvStereo.data){ // remove the stereo neigh scatter trace if it exists
        var updateStereo = {visible:false};
        var scatterId = pvStereo.data.findIndex(obj => { 
            return obj.name === "tracklibNeighScatter";
        });
        if(scatterId>=0)
            Plotly.restyle(pvStereo,updateStereo,scatterId);
        var stereoScatterId = pv.data.findIndex(obj => { // remove any stereo neigh scatters from clicks in the othe image 
            return obj.name === "tracklibStereoNeighScatter";
        });
        if(stereoScatterId>=0)
            Plotly.restyle(pv,updateStereo,stereoScatterId);
    }
    if(!pvStereo.data) return;
    var scatterTraceIdStereo = pvStereo.data.findIndex(obj => { 
        return obj.name === "tracklibPreviewScatter";
    });
    if(scatterTraceIdStereo<0) return; // use the neighbor scatter trace to get info for potential stereo neighbors
    
    if(!pv.data) return;
    var scatterTraceId = pv.data.findIndex(obj => { 
        return obj.name === "tracklibPreviewScatter";
    });
    if(scatterTraceId<0) return;
    if(!pv.data[scatterTraceId].neighInfo) return;
    if(pv.data[scatterTraceId].neighInfo.length<=index) return;
    var ids = pv.data[scatterTraceId].neighInfo[index].ids;
    if(!ids) return;

    if(!pv.data[scatterTraceId].stereoNeighInfo) return;
    if(pv.data[scatterTraceId].stereoNeighInfo.length<=index) return;
    var stereoIds = pv.data[scatterTraceId].stereoNeighInfo[index].ids;
    if(!stereoIds) return;
    
    var areas = pv.data[scatterTraceId].neighInfo[index].areas;
    var diffAreas = pv.data[scatterTraceId].neighInfo[index].diffAreas;
    var dists = pv.data[scatterTraceId].neighInfo[index].distances;
    var disparities = pv.data[scatterTraceId].neighInfo[index].disparities;
    var failCodes = pv.data[scatterTraceId].neighInfo[index].failCodes;
    var frames = pv.data[scatterTraceId].neighInfo[index].frames;
    var angles = pv.data[scatterTraceId].neighInfo[index].angles;
    var diffDists = pv.data[scatterTraceId].neighInfo[index].diffDists;
    var grays = pv.data[scatterTraceId].neighInfo[index].grays;
    var diffGrays = pv.data[scatterTraceId].neighInfo[index].diffGrays;
    var px = pv.data[scatterTraceId].x;
    var py = pv.data[scatterTraceId].y;
    var myFrame = pv.data[scatterTraceId].frame[index];
    
    // collect the x and y points from the neighbors
    var x = [];
    var y = [];
    var text = [];
    for(var i=0;i<ids.length;++i){
        var failCode = failCodes[i];
        if(failCode.length==0) failCode = "none";
        x.push(px[ids[i]]);
        y.push(py[ids[i]]);
        text.push('('+px[ids[i]]+','+py[ids[i]]+') <br>'
                + 'frame: ' + frames[i] + '<br>'
                + 'area: ' + areas[i] + ' (Δ:'+diffAreas[i]+', '+ parseFloat(diffAreas[i]*100.0/(areas[i]-diffAreas[i])).toPrecision(3) + '%)' + '<br>'
                + 'gray: ' + grays[i] + ' (Δ:'+diffGrays[i]+', ' + parseFloat(diffGrays[i]*100.0/255.0).toPrecision(3) + '%)' + '<br>'
                + 'dist: ' + parseFloat(dists[i]).toPrecision(2) + ' (Δ:'+parseFloat(diffDists[i]).toPrecision(2)+', '+parseFloat(diffDists[i]*100.0/(dists[i]-diffDists[i])).toPrecision(3) + '%)' + '<br>'
                + 'angle: ' + parseFloat(angles[i]).toPrecision(3) + '<br>'
                + 'disparity: ' + parseFloat(disparities[i]).toPrecision(3) + '<br>'
                + 'fail: '+failCode);
    }
    var neighTraceId = pv.data.findIndex(obj => { 
        return obj.name === "tracklibNeighScatter";
    });
    if(neighTraceId<0){
        var scatterTrace = {
                name: 'tracklibNeighScatter',
                hovertemplate : '%{text}<extra></extra>',
                visible: true,
                type:'scatter',
                x:x,
                y:y,
                text: text,
                mode:'markers',
                showlegend: false,
                marker: {color: 'blue'},
        };
        Plotly.addTraces(pv,scatterTrace);
    }else{
        var update = {x:[x],y:[y],text:[text],visible:true};
        Plotly.restyle(pv,update,neighTraceId);
    }
    
    if(dest!='left') return; // stereo neighbor info is only one way (left to right) no stereo neigh info for right
    
    var stereoAreas = pv.data[scatterTraceId].stereoNeighInfo[index].areas;
    var stereoDiffAreas = pv.data[scatterTraceId].stereoNeighInfo[index].diffAreas;
    var stereoEpiDists = pv.data[scatterTraceId].stereoNeighInfo[index].distsFromEpi;
    var stereoDisparities = pv.data[scatterTraceId].stereoNeighInfo[index].disparities;
    var stereoFailCodes = pv.data[scatterTraceId].stereoNeighInfo[index].failCodes;
    var stereoPx = pvStereo.data[scatterTraceIdStereo].x;
    var stereoPy = pvStereo.data[scatterTraceIdStereo].y;
    
    // collect the x and y points from the neighbors
    var stereoX = [];
    var stereoY = [];
    var stereoText = [];
    for(var i=0;i<stereoIds.length;++i){
        var failCode = stereoFailCodes[i];
        if(failCode.length==0) failCode = "none";
        stereoX.push(stereoPx[stereoIds[i]]);
        stereoY.push(stereoPy[stereoIds[i]]);
        stereoText.push('('+stereoPx[stereoIds[i]]+','+stereoPy[stereoIds[i]]+') <br>'
                + 'frame: ' + myFrame + '<br>'
                + 'area: ' + stereoAreas[i] + ' (Δ:'+stereoDiffAreas[i]+', '+ parseFloat(stereoDiffAreas[i]*100.0/(stereoAreas[i]-stereoDiffAreas[i])).toPrecision(3) + '%)' + '<br>'
                + 'dist from epi: ' + parseFloat(stereoEpiDists[i]).toPrecision(2) + '<br>'
                + 'stereo disparity: ' + parseFloat(stereoDisparities[i]).toPrecision(3) + '<br>'
                + 'fail: '+failCode);
    }
    var stereoNeighTraceId = pvStereo.data.findIndex(obj => { 
        return obj.name === "tracklibStereoNeighScatter";
    });
    if(stereoNeighTraceId<0){
        var stereoScatterTrace = {
                name: 'tracklibStereoNeighScatter',
                hovertemplate : '%{text}<extra></extra>',
                visible: true,
                type:'scatter',
                x:stereoX,
                y:stereoY,
                text: stereoText,
                mode:'markers',
                showlegend: false,
                marker: {color: 'green'},
        };
        Plotly.addTraces(pvStereo,stereoScatterTrace);
    }else{
        var stereoUpdate = {x:[stereoX],y:[stereoY],text:[stereoText],visible:true};
        Plotly.restyle(pvStereo,stereoUpdate,stereoNeighTraceId);
    }
}

function drawEpipolarLine(dest,index){ 
    // *** NOTE for this method, dest is where the click event ocurred,
    //          the line should appear in the opposite image
    if(!$("#analysisModeSelect").val()=="tracking"||showStereoPane!=1) return;
    var pvIn = document.getElementById("plotlyViewerLeft");
    var pvOut = document.getElementById("plotlyViewerRight");
    if(dest=='right'){
        var pvIn = document.getElementById("plotlyViewerRight");
        var pvOut = document.getElementById("plotlyViewerLeft");
    }
    undrawShape('','epipolarLine');
    var pvl = pvOut.layout;
    if(!pvl) return;
    
    
    var scatterTraceId = pvIn.data.findIndex(obj => { 
        return obj.name === "tracklibPreviewScatter";
    });
    if(scatterTraceId<0) return;
    if(index>=pvIn.data[scatterTraceId].epiY0.length) return;
    var y0 = pvIn.data[scatterTraceId].epiY0[index];
    var y1 = pvIn.data[scatterTraceId].epiY1[index];
    
    // check if epipolar line exists and get it's points
    var existingShapes = [];
    var existingEpipolarIndex = -1;
    if(pvl.shapes)
        existingShapes = pvl.shapes;
    for(var i=0;i<existingShapes.length;++i){
        if(existingShapes[i].name){
            if(existingShapes[i].name=='epipolarLine')
                existingEpipolarIndex = i;
        }
    }
    if(existingEpipolarIndex>=0){
        existingShapes[existingEpipolarIndex].y0 = y0;
        existingShapes[existingEpipolarIndex].y1 = y1;
        existingShapes[existingEpipolarIndex].visible = true;
    }else{
        var x0 = 0;
        var x1 = pvl.images[0].sizex;
        var epiLine = {
                name: 'epipolarLine',
                type:'line',
                x0: x0,
                x1: x1,
                y0: y0,
                y1: y1,
                line: {color: 'red', width:2},
                opacity: 0.2,
                editable: false,
                visible: true
        };
        existingShapes.push(epiLine);
    }
    var update = {'shapes' : existingShapes}
    Plotly.relayout(pvOut,update);
}

function undrawShape(dest,name){
    if(dest.length==0 || dest=='left')
        undrawShapeImpl(document.getElementById("plotlyViewerLeft"),name);
    if(dest.length==0 || dest=='right')
        undrawShapeImpl(document.getElementById("plotlyViewerRight"),name);
}

function undrawShapeImpl(pv,name){
    if(!pv.layout)return;
    if(!pv.layout.shapes)return;
    var shapes = pv.layout.shapes;
    for(var i=0;i<shapes.length;++i){
        if(shapes[i].name)
            if(shapes[i].name.includes(name)){
                shapes[i].visible = false;
            }
    }
    var update = {'shapes' : shapes}
    Plotly.relayout(pv,update);
}
