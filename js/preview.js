var coordsXaxisLeft = {};
var coordsYaxisLeft = {};
var coordsLeftLeft = 0;
var coordsTopLeft = 0;
var coordsXaxisRight = {};
var coordsYaxisRight = {};
var coordsLeftRight = 0;
var coordsTopRight = 0;

var plotlyColors = [
    '#1f77b4',  // muted blue
    '#ff7f0e',  // safety orange
    '#2ca02c',  // cooked asparagus green
    '#d62728',  // brick red
    '#9467bd',  // muted purple
    '#8c564b',  // chestnut brown
    '#e377c2',  // raspberry yogurt pink
    '#7f7f7f',  // middle gray
    '#bcbd22',  // curry yellow-green
    '#17becf'   // blue-teal
];

// plotly's default colors (after 10 it repeats):
function plotlyDefaultColor(index){
    index = index%10;
    return plotlyColors[index];
}

$(window).load(function(){
    if(document.getElementById("plotlyViewerLeft")){
        resetPlotlyViewer('left');
        resetPlotlyViewer('right');
    }else if(document.getElementById("plotlyViewerCalLeft")){
        resetPlotlyViewer('cal_left');
        resetPlotlyViewer('cal_right');
    }
});

function resetPlotlyViewer(dest,keepImage=false){
    console.log('resetPlotlyViewer(): dest ' + dest + ' keepImage ' + keepImage);
    var params = getPreviewLayoutConfig(dest);
    var div = destToPlotlyDiv(dest);
    if(!div) return;
    if(keepImage)
        if(div.layout)
            if(div.layout.images){
                params.layout.images = div.layout.images;
                var shapes = [{name:'viewBox',type:'rect',
                    x0:0,y0:0,x1:div.layout.images[0].sizex,y1:div.layout.images[0].sizey,line:{width:0}}];
                params.layout.shapes = shapes;
            }
    // dummy data to get double click to reset view and the reset view button working properly
    // (it doesn't work if there is no data in the plot)
    var data = [{type:'scatter',x:[0],y:[0],visible:false,name:'dummyData',showlegend:false,mode:'none'}];
    Plotly.purge(div); // need to call purge, otherwise the mode bar buttons won't update
    Plotly.newPlot(div,data,params.layout,params.config);
    
    div.on('plotly_click', function(data){
        if(dest!='left'&&dest!='right') return;
        if(!data.points) return;
        if(data.points[0].data.name==='tracklibPreviewScatter'){
            var index2d = data.points[0].pointIndex;
            updateInspectors(dest,index2d);
        }
    });
}

function destToPlotlyDiv(dest){
    if(dest==='left'){
        return document.getElementById("plotlyViewerLeft");
    }else if(dest==='right'){
        return document.getElementById("plotlyViewerRight");
    }else if(dest==='cal_left'){
        return document.getElementById("plotlyViewerCalLeft");
    }else if(dest==='cal_right'){
        return document.getElementById("plotlyViewerCalRight");
    }else
        return null;
}

function deletePlotlyTraces(dest,name){
    var div = destToPlotlyDiv(dest);
    if(!div.data) return;
    var ids = [];
    for(var i=0;i<div.data.length;++i){
        if(div.data[i].name)
            if(div.data[i].name.includes(name))
                ids.push(i);
    }
    if(ids.length>0){
        Plotly.deleteTraces(div,ids);
        // trigger relayout since for some reason deleting traces from plotly doesn't
        $("#plotlyViewerLeft").trigger("plotly_relayout");
        $("#plotlyViewerRight").trigger("plotly_relayout");
    }
}

// delete the existing trace if it exists
// and add a new one
// mainly for small scatter traces with extra information
// stored in the trace such as extra objects or arrays other than x,y,z, and text
function replacePlotlyData(dest,data,cb){
    cb = cb || $.noop;
    var div = destToPlotlyDiv(dest);
    // search for existing traces with the same name as the data being added
    // if they exist, delete them before adding the new data
    if(!div.data){
        Plotly.addTraces(div,data);
    }else{
        var ids = [];
        for(var i=0;i<data.length;++i){
            if(data[i].name){
                for(var j=0;j<div.data.length;++j){
                    if(div.data[j].name){
                        if(div.data[j].name==data[i].name){
                            ids.push(j);
                        }
                    }
                }
            }
        }
        if(ids.length>0){
            Plotly.deleteTraces(div,ids);
        }
        Plotly.addTraces(div,data);
    }
    cb();
}

// used to update existing traces by updating the x,y,z, and text
// arrays. Does not copy other objects inside the data aside from x,y,z, and text
// this is more useful for heavy-weight traces like contours
function updatePlotlyData(dest,data,cb){
    cb = cb || $.noop;
    var div = destToPlotlyDiv(dest);
    // search for existing traces with the same name as the data being added
    // if they exist, delete them before adding the new data
    if(!div.data){
        Plotly.addTraces(div,data);
    }else{
        for(var i=0;i<data.length;++i){
            var replaced = false;
            if(data[i].name){
                for(var j=0;j<div.data.length;++j){
                    if(div.data[j].name){
                        if(div.data[j].name==data[i].name){
                            console.log('replacing data for ' + data[i].name);
                            var update = {};
                            for (const prop in data[i]) {
                                if(prop==='x'||prop==='y'||prop==='z'||prop==='text'){
                                    update[prop] = [data[i][prop]];
                                }
                            }
//                            console.log('update',update);
                            Plotly.restyle(div,update,j);
                            replaced = true;
                            continue;
                        } // names match
                    } // object has name
                } // end loop over existing data
            } // object has name
            if(!replaced){
                Plotly.addTraces(div,[data[i]]);
            }
        } // end loop over input data objects
    } // end else
    cb();
}

function addPlotlyData(dest,data){
    Plotly.addTraces(destToPlotlyDiv(dest),data);
}

function updatePreviewImage(update,cb){
    // This function only replaces the images of a plotly layout using plotly.relayout, it does nothing to the data
    // or layout shapes
    // Before updating the plotly layout image, it runs the opencvserver to convert any non-png images to png for 
    // display, and also can be used to decorate the display image with for example segmentation results, etc.

    cb = cb || $.noop;
    var dest = update.dest;
    var srcPath = update.srcPath || "";
    var destPath = fullPath('.dice','.preview_' + dest + '.png');
    var imgWidth = -1;
    var imgHeigh = -1;
//  if(dest!='left'&&dest!='right'&&dest!='cal_left'&&dest!='cal_right'){
//  console.log('error: invalid destination ' + dest);
//  return;
//}
    var argsIn = update.argsIn || [];
    var debugConsoleDivId = update.debugConsoleDivId || "";
    var div = destToPlotlyDiv(dest);
    
    // set up the arguments to call the DICe opencv server which will convert whatever the input image
    // is to png so that it can be displayed in the viewer
    args = [];
    args.push(srcPath);
    args.push(destPath);
    if(argsIn.length > 0){
        for(var i=0;i<argsIn.length;++i)
            args.push(argsIn[i]);
    }else
        args.push('filter:none'); // no filter applied, but non .png images are converted to png
//    console.log(args);
    
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc = child_process.spawn(execOpenCVServerPath,args,{cwd:workingDirectory});//,maxBuffer:1024*1024});
    proc.on('error', function(){
        alert('DICe OpenCVServer failed: invalid executable: ' + execOpenCVServerPath);
    });
    proc.on('close', (code) => {
        console.log(`OpenCVServer exited with code ${code}`);
        // execute call back with error code
        if(code>=0&&code<4){
            console.log("updatePreviewImage(): src path " + srcPath);
            console.log("updatePreviewImage(): dest path " + destPath);
            fs.stat(destPath, function(err, stat) {
                if(err == null) {
                    var layoutUpdate = {};
                    if(div.layout.images){
                        layoutUpdate['xaxis.range'] = [div.layout.xaxis.range[0],div.layout.xaxis.range[1]];
                        layoutUpdate['yaxis.range'] = [div.layout.yaxis.range[0],div.layout.yaxis.range[1]];
                    }else{
                        layoutUpdate['xaxis.range'] = [0,imgWidth];
                        layoutUpdate['yaxis.range'] = [imgHeight,0];
                    }
                    layoutUpdate.images = [{
                        source: destPath,
                        xref: 'x',
                        yref: 'y',
                        x: 0,
                        y: 0,
                        sizex: imgWidth,
                        sizey: imgHeight,
                        layer: 'below',
                    }];
                    // add a shape around the image to get the reset axes button working
                    // TODO come up with a better solution for this, for now it seems that
                    // since the preview is created before the image is drawn, the reset x and y axes ranges
                    // are not updated
                    var existingShapes = [];
                    if(div.layout)
                        if(div.layout.shapes)
                            existingShapes = div.layout.shapes;
                    var viewBoxIndex = -1;
                    for(var i=0;i<existingShapes.length;++i)
                        if(existingShapes[i].name)
                            if(existingShapes[i].name==='viewBox')
                                viewBoxIndex = i;
                    if(viewBoxIndex<0){
                        existingShapes.push({name:'viewBox',type:'rect',x0:0,y0:0,x1:imgWidth,y1:imgHeight,line:{width:0}});
                        layoutUpdate.shapes = existingShapes;
                    }
                    Plotly.relayout(div,layoutUpdate);
                    cb(code);
                    if(dest=='left'||dest=='right')
                        checkValidInput();
                }
            });
        }else{
            cb(code);
            console.log('error ocurred ' + code);
        }
    });
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        //console.log(line);
        if(debugConsoleDivId.length>0){
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
            imgWidth = Number(line.split(' ').pop());
            if(dest=='left')
                refImageWidth = imgWidth;
        }
        if(line.includes("BUFFER_OUT")&&line.includes("IMAGE_HEIGHT")){
            console.log('setting image height to ' + line.split(' ').pop());
            imgHeight = Number(line.split(' ').pop());
            if(dest=='left')
                refImageHeight = imgHeight;
        }
    });
}

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
            margin: {l:40,r:5,b:20,t:30},
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
            name: 'showSubsets',
            title: 'Show subsets',
            icon: dotsIcon,
            click: () => {if(!$("#runLi").is(":visible")) return;drawSubsetCoordinates(); }
    }
    let importIcon = {
            'width': 24,
            'height': 24,
            'path': "M12,16.5l4-4h-3v-9h-2v9H8L12,16.5z M21,3.5h-6v1.99h6V19.52H3V5.49h6V3.5H3c-1.1,0-2,0.9-2,2v14c0,1.1,0.9,2,2,2h18c1.1,0,2-0.9,2-2v-14C23,4.4,22.1,3.5,21,3.5z"
    }
    var importSubsetLocationsButton = {
            name: 'importSubsets',
            title: 'Import subset locations',
            icon: importIcon,
            click: () => {if(!$("#runLi").is(":visible"))return;$('#loadSubsetFileInputIcon').click();}
    }
    let deleteLivePlotPtsIcon = {
            'width': 24,
            'height': 24,
            'path': "M7,11v2h10v-2H7z M12,2C6.48,2,2,6.48,2,12c0,5.52,4.48,10,10,10c5.52,0,10-4.48,10-10C22,6.48,17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z"
    }
    var deleteLivePlotPtsButton = {
            name: 'deleteLivePlotPts',
            title: 'Delete live plot pts',
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
                'lasso2d',
                'hoverCompareCartesian',
                'hoverClosestCartesian'
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
            _config.modeBarButtonsToRemove.push('drawline');
            _config.modeBarButtonsToRemove.push('showSubsets');
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

function livePlotDims(){
    var result = {numLivePlotPts:0,
            livePlotLineActive: false};
    if($("#analysisModeSelect").val()!="subset") return result;
    var data = document.getElementById("plotlyViewerLeft").data;
    var livePlotPtsTraceId = data.findIndex(obj => { 
        return obj.name === "live plot pts";
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
    var lineColor = plotlyDefaultColor(9);
    var lineShape = {
            type: 'line',
            x0: ox,
            x1: px,
            y0: oy,
            y1: py,
            line: {color: lineColor, width: 3},
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
        return obj.name === "live plot pts";
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
        var color = plotlyColors.concat(plotlyColors).concat(plotlyColors);// 'yellow'; //'#00ff00';
        var previewTrace = {
                name: 'live plot pts',
                visible: true,
                type:'scatter',
                x:x,
                y:y,
                text:text,
                hovertemplate : '(%{x},%{y})<br>%{text}<extra></extra>',
                mode:'markers',
                marker: {
                    color: color,
                    size: 8,
                    line: {color:'white',width:1}
                },
        };
        Plotly.addTraces(document.getElementById("plotlyViewerLeft"),previewTrace);
    }
}

function deleteLivePlotPts(){
    console.log('deleteLivePlotPts()');
    var allTraces = document.getElementById("plotlyViewerLeft").data;
    var previewResult = allTraces.findIndex(obj => { 
        return obj.name === "live plot pts";
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
        return obj.name === 'subset preview';
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
    if($("#analysisModeSelect").val()=="subset" && $("#showContourCheck")[0].checked){
        // TODO update the subset trace to show or not show
        var result = allTraces.findIndex(obj => { 
         return obj.name === "subset results";
        });
        if(result>=0){
            var newFlag = !allTraces[result].visible;
            Plotly.restyle(document.getElementById("plotlyViewerLeft"), {"visible": newFlag}, [result]);
        }
        resizePreview();
    }else if($("#frameScroller").val()==$("#frameScroller").attr('min')){
        var result = allTraces.findIndex(obj => { 
            return obj.name === "subsetCoordinates";
        });
        if(result>=0){
            var newFlag = !allTraces[result].visible;
            Plotly.restyle(document.getElementById("plotlyViewerLeft"), {"visible": newFlag}, [result]);
        }else if($("#analysisModeSelect").val()=="subset"){ // if doing subset analysis and custom coordinates are not defined, preview where the subsets will end up
            // check if the subset preview exists, if so turn it off
            var traceExisted = removeSubsetPreview();
//          var previewResult = allTraces.findIndex(obj => { 
//          return obj.name === "subsetPreview";
//          });
//          if(previewResult>=0){
//          Plotly.deleteTraces(document.getElementById("plotlyViewerLeft"), previewResult);
//          return;
//          }
            // if not rebuild it
            if(!traceExisted){
                startProgress();
                writeInputFile(false,false,true);
            }
        }
    }
}

function getSubsetCoordinatesTrace(){
    var allTraces = document.getElementById("plotlyViewerLeft").data;
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
    console.log('plotly_relayout left event begin');
    var div = document.getElementById("plotlyViewerLeft");
    // reset the global variables that hold the arangement of the plot on the screen to calculate the pixel coords
    coordsXaxisLeft = div._fullLayout.xaxis;
    coordsYaxisLeft = div._fullLayout.yaxis;
    coordsLeftLeft = div._fullLayout.margin.l;
    coordsTopLeft = div._fullLayout.margin.t;
    
    if(updateLivePlotLine() ||
            assignShapeNames() ||
            checkForInternalShapes()){
        var update = {'shapes' : getPlotlyShapes()}
        Plotly.relayout(div,update);
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
    var coordsTraceId = div.data.findIndex(obj => { 
        return obj.name === "subsetCoordinates";
    });
    if(coordsTraceId>=0&&centroids.x){
        if(div.data[coordsTraceId].x.length>0){
            var update = {
                    x: [centroids.x],
                    y: [centroids.y],
                    text: [text]
            }
            Plotly.restyle(div, update, coordsTraceId);
        }
    }
    // the subset coordinates trace may not exist, if not and the analsis mode is tracking add one
    else if(centroids.x&&$("#analysisModeSelect").val()=="tracking"&&showStereoPane==0){
        var scatterTrace = {
                name: 'subsetCoordinates',
                visible: false,
                type:'scatter',
                x:centroids.x,
                y:centroids.y,
                hovertemplate : '(%{x},%{y})<extra></extra>',
                mode:'markers',
                marker: {
                    color: 'yellow'
                },
        };
        Plotly.addTraces(div,scatterTrace);
    }
    checkValidInput();
    console.log('plotly_relayout event end');
});

$("#plotlyViewerRight").on('plotly_relayout', function(){
    console.log('plotly_relayout right event begin');
    var div = document.getElementById("plotlyViewerRight");
    // reset the global variables that hold the arangement of the plot on the screen to calculate the pixel coords
    coordsXaxisRight = div._fullLayout.xaxis;
    coordsYaxisRight = div._fullLayout.yaxis;
    coordsLeftRight = div._fullLayout.margin.l;
    coordsTopRight = div._fullLayout.margin.t;
});

$("#plotlyViewerLeft").mousemove(function( event ) {
    if(!coordsXaxisLeft.p2c) return;
//    // TODO if outside image width/height return without updating
    var xInDataCoord = parseInt(coordsXaxisLeft.p2c(event.offsetX - coordsLeftLeft));
    var yInDataCoord = parseInt(coordsYaxisLeft.p2c(event.offsetY - coordsTopLeft));
    document.getElementById('leftPos').innerText = '['+xInDataCoord+','+yInDataCoord+']';
});

$("#plotlyViewerRight").mousemove(function( event ) {
    if(!coordsXaxisRight.p2c) return;
//    // TODO if outside image width/height return without updating
    var xInDataCoord = parseInt(coordsXaxisRight.p2c(event.offsetX - coordsLeftRight));
    var yInDataCoord = parseInt(coordsYaxisRight.p2c(event.offsetY - coordsTopRight));
    document.getElementById('rightPos').innerText = '['+xInDataCoord+','+yInDataCoord+']';
});

$("#plotlyViewerLeft").on('click', function(event){ // note: not plotly_click, to register clicks anywhere in the DOM, not just on a plotly plot
    if($("#analysisModeSelect").val()=="subset"&&event.which==2){
        var xInDataCoord = parseInt(coordsXaxisLeft.p2c(event.offsetX - coordsLeftLeft));
        var yInDataCoord = parseInt(coordsYaxisLeft.p2c(event.offsetY - coordsTopLeft));
        addLivePlotPts([xInDataCoord],[yInDataCoord]);
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
    var visibility = $("#showRepSubsetCheck")[0].checked;
    if(existingBoxIndex>=0){
        existingShapes[existingBoxIndex].path = path;
        existingShapes[existingBoxIndex].visible = visibility;
    }else{
        var shape = {};
        shape.name = 'representativeSubset';
        shape.type = 'path';
        shape.path = path;
        shape.line = {color: 'yellow', width:2}
        shape.opacity = 1.0;
        shape.visible = visibility;
        shape.editable = true;
        existingShapes.push(shape);
    }
    var update = {'shapes' : existingShapes}
    Plotly.relayout(pv,update);
}

function drawNeighCircle(dest,index){
    if(!$("#analysisModeSelect").val()=="tracking"||showStereoPane!=1) return;
    var pv = document.getElementById("plotlyViewerLeft");
    if(dest=='right'||index<0){
        var pv = document.getElementById("plotlyViewerRight");
        undrawShape('left','neighCircle');
    }
    if(dest=='left'||index<0){
        undrawShape('right','neighCircle');
    }
    var pvl = pv.layout;
    if(!pvl) return;
    
    if(!pv.data) return;
    var scatterTraceId = pv.data.findIndex(obj => { 
        return obj.name === "tracklibPreviewScatter";
    });
    if(scatterTraceId<0) return;
    if(index<0||index>=pv.data[scatterTraceId].x.length) return;
    var cx = pv.data[scatterTraceId].x[index];
    var cy = pv.data[scatterTraceId].y[index];

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

function toggleLivePlotVisibility(visibility){
    // collect indices of live plot points and the line
    var div = document.getElementById("plotlyViewerLeft");
    if(!div) return;
    var data = div.data;
    if(!data) return;
    var livePlotPtsTraceId = data.findIndex(obj => { 
        return obj.name === "live plot pts";
    });
    if(livePlotPtsTraceId>=0)
        Plotly.restyle(div,{visible:visibility},livePlotPtsTraceId);
    var layout = div.layout;
    if(!layout) return;
    var shapes = layout.shapes;
    if(!shapes) return;
    var shapesIndex = -1;
    for(var i=0;i<shapes.length;++i){
        if(shapes[i].name)
            if(shapes[i].name==='livePlotLine')
                shapesIndex = i;
    }
    if(shapesIndex >=0){
        var key = 'shapes[' + shapesIndex + '].visible';
        var update = {};
        update[key] = visibility;
        Plotly.relayout(div,update);
    }
}

function updateLivePlotLine(){
    var relayoutNeeded = false;
    var shapes = getPlotlyShapes(); // get all shapes, not just ROIs
    var oldLineIndex = -1;
    var newLineIndex = -1;
    for(var i=0;i<shapes.length;++i){
        if(shapes[i].type==='line'){
            if(shapes[i].name){ // if it has a name it was a previousl drawn live plot line
//                if(oldLineIndex>=0)
//                    alert('error in update live plot line, too many existing lines found');
                if(shapes[i].name==='livePlotLine')
                    oldLineIndex = i;
            }
            else{ // otherwise it's a new line
                if(newLineIndex>=0)
                    alert('error in update live plot line, too many new lines found');
                newLineIndex = i;
            }
        }
    }
    if(oldLineIndex>=0&&newLineIndex>=0){
        deleteShape(oldLineIndex);
    }
    if(newLineIndex>=0){
        var lineColor = plotlyDefaultColor(9);
        shapes[newLineIndex].name='livePlotLine';
        shapes[newLineIndex].line = {color: lineColor, width: 3};
        shapes[newLineIndex].opacity = 0.8;
        relayoutNeeded = true;
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
                var previewTrace = {
                        name: 'subset preview',
                        visible: true,
                        type:'scatter',
                        x:coords.x,
                        y:coords.y,
                        hovertemplate : '(%{x},%{y})<extra></extra>',
                        mode:'markers',
                        marker: {
                            color: 'yellow',
                            size: 3
                        },
                };
                Plotly.addTraces(document.getElementById("plotlyViewerLeft"),previewTrace);
                resizePreview();
            }); // end readFile
        } // end null
        else{
            alert("failed to read " + locsFile);
            return;
        }
    }); 
}

function drawBestFitLine(ox,oy,px,py){
    if(!$("#analysisModeSelect").val()=="subset"||showStereoPane!=1) return;
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
    if(bestFitLineIndex>=0&&!ox){
        existingShapes[bestFitLineIndex].visible = $("#bestFitCheck")[0].checked;
    }else if(bestFitLineIndex<0){
        var imW = pv.layout.images[0].sizex;
        var imH = pv.layout.images[0].sizey;
        if(!ox) ox = 0.3*imW;
        if(!oy) oy = 0.8*imH;
        if(!px) px = 0.7*imW;
        if(!py) py = 0.8*imH;
        console.log('best fit line points ',ox,oy,px,py);
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
        existingShapes[bestFitLineIndex].visible = $("#bestFitCheck")[0].checked;
    }
    var update = {'shapes' : existingShapes}
    Plotly.relayout(pv,update);
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
        var scatterIds = [];
        var scatterId = pvStereo.data.findIndex(obj => { 
            return obj.name === "tracklibNeighScatter";
        });
        if(scatterId>=0) scatterIds.push(scatterId);
        if(index<0){ // means turn off the neigh info trace
            scatterId = pvStereo.data.findIndex(obj => { 
                return obj.name === "tracklibStereoNeighScatter";
            });
            if(scatterId>=0) scatterIds.push(scatterId);
        }
        if(scatterIds.length>0)
            Plotly.restyle(pvStereo,updateStereo,scatterIds);
        
        var stereoScatterIds = [];
        var stereoScatterId = pv.data.findIndex(obj => { // remove any stereo neigh scatters from clicks in the othe image 
            return obj.name === "tracklibStereoNeighScatter";
        });
        if(stereoScatterId>=0) stereoScatterIds.push(stereoScatterId);
        if(index<0){
            stereoScatterId = pv.data.findIndex(obj => { // remove any stereo neigh scatters from clicks in the othe image 
                return obj.name === "tracklibNeighScatter";
            });
            if(stereoScatterId>=0) stereoScatterIds.push(stereoScatterId);
        }
        if(stereoScatterIds.length>0)
            Plotly.restyle(pv,updateStereo,stereoScatterIds);
    }
    if(!pvStereo.data) return;
    var scatterTraceIdStereo = pvStereo.data.findIndex(obj => { 
        return obj.name === "tracklibPreviewScatter";
    });
    if(scatterTraceIdStereo<0) return; // use the neighbor scatter trace to get info for potential stereo neighbors
    if(index<0) return;
    
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
                + 'Δangle: ' + parseFloat(angles[i]).toPrecision(3) + '<br>'
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
                + 'stereo id: ' + pvStereo.data[scatterTraceIdStereo].stereoGlobalId[stereoIds[i]] + '<br>'
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
    if(index<0||index>=pvIn.data[scatterTraceId].epiY0.length) return;
    var y0 = pvIn.data[scatterTraceId].epiY0[index];
    var y1 = pvIn.data[scatterTraceId].epiY1[index];
    var w = pvl.images[0].sizex;
    
    // compute the offsets for the dist from epi tol
    var lineLength = Math.sqrt((y1-y0)*(y1-y0) + w*w);
    var epiTol = Number($("#distFromEpiTol").val());
    var deltaY = epiTol * lineLength/w;
    
    // check if epipolar line exists and get it's points
    var existingShapes = [];
    var existingEpipolarIndex = -1;
    var existingEpipolarIndexTop = -1;
    var existingEpipolarIndexBottom = -1;
    if(pvl.shapes)
        existingShapes = pvl.shapes;
    for(var i=0;i<existingShapes.length;++i){
        if(existingShapes[i].name){
            if(existingShapes[i].name==='epipolarLine')
                existingEpipolarIndex = i;
            if(existingShapes[i].name==='epipolarLineTop')
                existingEpipolarIndexTop = i;
            if(existingShapes[i].name==='epipolarLineBottom')
                existingEpipolarIndexBottom = i;
        }
    }
    if(existingEpipolarIndex>=0){ // assume if one exists all three exist
        existingShapes[existingEpipolarIndex].y0 = y0;
        existingShapes[existingEpipolarIndex].y1 = y1;
        existingShapes[existingEpipolarIndex].visible = true;
        existingShapes[existingEpipolarIndexTop].y0 = y0 + deltaY;
        existingShapes[existingEpipolarIndexTop].y1 = y1 + deltaY;
        existingShapes[existingEpipolarIndexTop].visible = true;
        existingShapes[existingEpipolarIndexBottom].y0 = y0 - deltaY;
        existingShapes[existingEpipolarIndexBottom].y1 = y1 - deltaY;
        existingShapes[existingEpipolarIndexBottom].visible = true;
    }else{
        var x0 = 0;
        var x1 = w;
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
        var epiLineTop = {
                name: 'epipolarLineTop',
                type:'line',
                x0: x0,
                x1: x1,
                y0: y0 + deltaY,
                y1: y1 + deltaY,
                line: {color: 'red', width:2, dash:'dash'},
                opacity: 0.2,
                editable: false,
                visible: true
        };
        existingShapes.push(epiLineTop);
        var epiLineBottom = {
                name: 'epipolarLineBottom',
                type:'line',
                x0: x0,
                x1: x1,
                y0: y0 - deltaY,
                y1: y1 - deltaY,
                line: {color: 'red', width:2, dash:'dash'},
                opacity: 0.2,
                editable: false,
                visible: true
        };
        existingShapes.push(epiLineBottom);
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
