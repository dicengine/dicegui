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
    // add a heatmap 

    updateCoordsHeatmap(spec.width,spec.height);
    data.push(coordsHeatmap);
    // TODO call restyle or relayout instead of newPlot each time?
    Plotly.newPlot(div,data,obj.layout,obj.config);
    if(spec.dest=='left'&&$("#analysisModeSelect").val()=="subset")
        drawRepresentativeSubset();
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
    if(spec.dest=='left'){
        div.on('plotly_click', function(data){
            if(spec.dest!='left') return;
            if(data.event.button!=2) return;// right click only 
            addLivePlotPts([data.points[0].x],[data.points[0].y]);
//            alert('i was clicked');
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
    if(!document.getElementById("plotlyViewerLeft").layout) return;
    
    var cx = refImageWidth/2;
    var cy = refImageHeight/2;

    // check if representative subset already exists and get it's points
    var existingBox = getPlotlyShapes('representativeSubset');
    if(existingBox.length>0){
        var boxPoints = pathShapeToPoints(existingBox[0]);
        cx = (boxPoints.x[0] + boxPoints.x[1])/2;
        cy = (boxPoints.y[0] + boxPoints.y[3])/2;
        undrawRepresentativeSubset();
    }
    var subsetSize = $("#subsetSize").val();
    var shape = {};
    shape.type = 'path';
    var points = {x:[cx-subsetSize/2,cx+subsetSize/2,cx+subsetSize/2,cx-subsetSize/2],
                  y:[cy-subsetSize/2,cy-subsetSize/2,cy+subsetSize/2,cy+subsetSize/2]};
    var path = 'M';
    for(var i=0;i<points.x.length;++i){
        path+= points.x[i] + ',' + points.y[i];
        if(i<points.x.length-1)
            path +='L';
    }
    path += 'Z';
    shape.path = path;
    shape.line = {color: 'yellow', width:2}
    shape.opacity = 1.0;
    shape.editable = true;
    shape.name = 'representativeSubset';

    var existingShapes = [];
    if(document.getElementById("plotlyViewerLeft").layout.shapes){
        existingShapes = document.getElementById("plotlyViewerLeft").layout.shapes;
    }
    existingShapes.push(shape);
    var update = {
            'shapes' : existingShapes,
    }
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
}
function undrawRepresentativeSubset(){
    console.log('undrawRepresentativeSubset()');
    if(!document.getElementById("plotlyViewerLeft").layout)return;
    var shapes = [];
    if(document.getElementById("plotlyViewerLeft").layout.shapes){
        shapes = document.getElementById("plotlyViewerLeft").layout.shapes;
    }
    for(var i=0;i<shapes.length;++i){
        if(shapes[i].name=='representativeSubset'){
            shapes.splice(i,1);
            break;
        }
    }
    var update = {
            'shapes' : shapes,
    }
    Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
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
    console.log('checkForInternalShapes');
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
    console.log(document.getElementById("plotlyViewerLeft").data);
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

//$("#plotlyViewerLeft").on('plotly_hover', function(data){
//    console.log(data);
////    var infotext = data.points.map(function(d){
////        return ('['+d.x+','+d.y+']');
////    });
////    $('#rightPos').innerHTML = infotext;
//})
