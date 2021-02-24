function addTracklibFieldstoFieldSelect(cb){
    $("#livePlotFieldSelect").empty();
    $("#livePlotFieldSelect").append(new Option('world coord x (world dim)','x'));
    $("#livePlotFieldSelect").append(new Option('world coord y (world dim)','y'));
    $("#livePlotFieldSelect").append(new Option('world coord z (world dim)','z'));
    $("#livePlotFieldSelect").append(new Option('area (px)','area'));
    $("#livePlotFieldSelect").append(new Option('gray (counts)','gray'));
    $("#livePlotFieldSelect").append(new Option('Δx(world)/frame','velX'));
    $("#livePlotFieldSelect").append(new Option('Δy(world)/frame','velY'));
    $("#livePlotFieldSelect").append(new Option('Δz(world)/frame','velZ'));
    cb = cb || $.noop;
    cb();
}

$("#trackGID").change(function() {
    if($('#trackGID').val()<0){
        alert('invalid global id: ' + $("#trackGID").val());
        $('#trackGID').val(0);
    }
    updateInspectors('left',-1);
    $("#trackDisplayModeSelect").trigger("change");
//    updateTracklib2dScatter();
});


$("#trackGID").keypress(function(event) { 
    if (event.keyCode === 13) { 
        if($('#trackGID').val()<0){
            alert('invalid global id: ' + $("#trackGID").val());
            $('#trackGID').val(0);
        }
        updateInspectors('left',-1);
//        updateTracklib2dScatter();
    }
}); 

function updateTracklib2dScatter(){
    var div = document.getElementById("livePlots");
    var data = document.getElementById("livePlot3d").data; // grab the data that is stored on the 3d plot
    if(!data) return;
    var fieldText = $("#livePlotFieldSelect option:selected" ).text();
    var field = $("#livePlotFieldSelect option:selected" ).val();
    var id = parseInt($("#trackGID").val());
    // pull the 2d information from the 3d scatter trace
    var traceName = "3dScatterTrace_" + id.toString();
    var curveNum = data.findIndex(obj => { 
        return obj.name === traceName;
    });
    if(curveNum<0){
        alert('invalid global id: ' + $("#trackGID").val());
        $("#trackGID").val(0).change();
        // purge the 2d results
//        Plotly.purge(document.getElementById("livePlots"));
//        updateTracklib2dScatter();
        return;
    }
    if(!data[curveNum].hasOwnProperty(field)){
        alert('error: invalid 2d field requested: ' + fieldText);
        return;
    }
    var layout = {
            xaxis: {title: {text: 'frame'}},
            yaxis: {title: {text: fieldText}},
            margin: {l:60,r:50,b:40,t:10,pad:4},
            autosize: true,
            hovermode: 'closest',
    };
    var config = {
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
    var data2d = {
            name: '2dScatterTrace',
            hovertemplate : '(%{x},%{y})<extra></extra>',
            visible: true,
            type:'scatter',
            mode:'lines+markers',
            showlegend: false,
            line: {color: '#316395', width: 2},
            marker: {color: '#316395', size: 7},
            x: data[curveNum].frame,
            y: data[curveNum][field],
            leftIndex: data[curveNum].leftIndex
    }
    Plotly.newPlot(div,[data2d],layout,config);
    div.on('plotly_click', function(data){
        if(data.points[0].data.name==='2dScatterTrace'){
            var index2d = data.points[0].data.leftIndex[data.points[0].pointIndex];
            updateInspectors('left',index2d);
        }
    });
}

function updateTracklib3dScatter(data,camera,cb){
    var div = document.getElementById("livePlot3d");
    // according to the docs, the camera position is not in terms of the data coordinate system
    // but some other frame of reference where the center is the "center of the 3d domain" (whatever that means)
    // the up vector needs to be flipped upside down because in DIC and computer vision Y is down
    // The z coodinate of the eye vector is set to -2 to try and view the whole field of view of results,
    // this might need to be adjusted later.
    var layout3d = {
            scene : {
                aspectmode: 'data',
                xaxis: {
                    title: {
                        text: 'world coord x',
                    },
                },
                yaxis: {
                    scaleanchor: 'x',
                    title: {
                        text: 'world coord y',
                    }
                },
                zaxis: {
                    scaleanchor: 'x',
                    title: {
                        text: 'world coord z',
                    }
                },
                camera: {
//                    center: camera.center, 
//                    eye: camera.eye, 
//                    up: camera.up,
                  center: {x: 0, y: 0, z: 0}, 
                  eye: {x: 0, y: 0, z:-2.8}, 
                  up: {x: 0, y: -1, z: 0},
                },
            },
            margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0,
                pad: 4,
            }
    };
    var config = {
            displaylogo: false,
            scrollZoom: true,
            responsive: true,
            modeBarButtonsToRemove: [
                'hoverCompareCartesian',
                'hoverClosestCartesian',
                ],
    };
    // TODO add configuration
    Plotly.newPlot(div,data,layout3d,config);
    cb = cb || $.noop;
    cb();

    div.on('plotly_click', function(data){
//      console.log(data);
        // NOTE: in 3d trace the point id is pointNumber not pointIndex like it is for 2d
        if(data.points[0].data.name.includes('3dScatterTrace_')){
            var ptNum = data.points[0].pointNumber;
            var leftIndex  = data.points[0].data.leftIndex[ptNum];
            updateInspectors('left',leftIndex);//,data.points[0].curveNumber,ptNum);
        }
    });
}

function highlightTrack(curveNum,ptIndex){
    // color all the trace lines back to the default
    var update = {
            'marker.color': '#FB00D1',
            'marker.size' : 4,
            'line.color': '#FB00D1',
            'line.width': 2
    };
    setTimeout(function(){
        Plotly.restyle("livePlot3d", update);
        // color the trace for this point
        if(ptIndex<0||curveNum<0){
            // turn off any selected points
            var div3d = document.getElementById("livePlot3d");
            var traceId3d = div3d.data.findIndex(obj => { 
                return obj.name === "selected3dPoint";
            });
            if(traceId3d>=0)
                Plotly.deleteTraces(div3d,traceId3d);
            var div2d = document.getElementById("livePlots");
            var traceId2d = div2d.data.findIndex(obj => { 
                return obj.name === "selected2dPoint";
            });
            if(traceId2d>=0)
                Plotly.deleteTraces(div2d,traceId2d);
        }
        update = {
                'marker.color': '#316395',
                'line.color': '#316395',
                'line.width': 4
        }
        if(curveNum>=0){
            Plotly.restyle("livePlot3d", update,curveNum);
            if(ptIndex>=0){
                addClickedPointTrace(curveNum,ptIndex);
                addClickedPointTrace2d(curveNum,ptIndex);
            }
        }
    },200); // BUG in Plotly requires this timeout
}

function addClickedPointTrace(curveNum,ptIndex){
    var div = document.getElementById("livePlot3d");
    var x = [div.data[curveNum].x[ptIndex]];
    var y = [div.data[curveNum].y[ptIndex]];
    var z = [div.data[curveNum].z[ptIndex]];
    var text = [div.data[curveNum].text[ptIndex]];
    var traceId = div.data.findIndex(obj => { 
        return obj.name === "selected3dPoint";
    });
    if(traceId<0){
        var trace = {
                name: 'selected3dPoint',
                hovertemplate : '(%{x},%{y},%{z})<br>%{text}<extra></extra>',
                visible: true,
                type:'scatter3d',
                x:x,
                y:y,
                z:z,
                text: text,
                mode:'markers',
                showlegend: false,
                marker: {color: '#316395', size: 8},
        };
        Plotly.addTraces(div,trace);
    }else{
        var update = {x:[x],y:[y],z:[z],text:[text],visible:true,marker: {color: '#316395', size: 8}};
        Plotly.restyle(div,update,traceId);
    }
}

function addClickedPointTrace2d(curveNum,ptIndex){
    if($('#trackGID').val()!=curveNum){
        $('#trackGID').val(curveNum);//.change();
        updateTracklib2dScatter();
    }
    
    var div = document.getElementById("livePlots");
    if(!div.data) return;
    if(ptIndex<0||ptIndex>=div.data[0].x.length) return;
    var x = [div.data[0].x[ptIndex]];
    var y = [div.data[0].y[ptIndex]];
    var traceId = div.data.findIndex(obj => { 
        return obj.name === "selected2dPoint";
    });
    if(traceId<0){
        var trace = {
                name: 'selected2dPoint',
                visible: true,
                type:'scatter',
                x:x,
                y:y,
                mode:'markers',
                showlegend: false,
                marker: {color: '#316395', size: 14},
                hovertemplate : '(%{x},%{y})<extra></extra>',
        };
        Plotly.addTraces(div,trace);
    }else{
        var update = {x:[x],y:[y],visible:true,marker: {color: '#316395', size: 14}};
        Plotly.restyle(div,update,traceId);
    }
}

function setTrackingVisibility(){
    var dataVisible = $('#showTrackingCheck')[0].checked || isResultsMode();
    var linesVisible = ($('#showTrackingCheck')[0].checked && $("#numPreviewFrames").val()>1) || isResultsMode();
    if(linesVisible){
        $(".track-plot").show();
    }
    else {
        $(".track-plot").hide();
    }
    var update = {visible:dataVisible};
    var pvl = document.getElementById("plotlyViewerLeft");
    var pvr = document.getElementById("plotlyViewerRight");
    if(pvl.data){
        var ids = [];
        for(var i=0;i<pvl.data.length;++i){
            if(pvl.data[i].name.includes('tracklibPreviewScatter')) // includes the filtered scatter too
                ids.push(i);
        }
        Plotly.restyle(pvl,update,ids);
    }
    if(pvr.data){
        var ids = [];
        for(var i=0;i<pvr.data.length;++i){
            if(pvr.data[i].name.includes('tracklibPreviewScatter')) // includes the filtered scatter too
                ids.push(i);
        }
        Plotly.restyle(pvr,update,ids);
    }
}

function updateInspectors(dest,index2d){//,stereoGlobalId,index3d){
    drawNeighCircle(dest,index2d);
    updateNeighInfoTrace(dest,index2d);
    drawEpipolarLine(dest,index2d);
    // deterine the stereoGlobalId
    var data = document.getElementById("plotlyViewerLeft").data;
    if(dest==='right')
        data = document.getElementById("plotlyViewerRight").data;
    // find the tracklivepreview trace
    var scatterTraceId = data.findIndex(obj => { 
        return obj.name === "tracklibPreviewScatter";
    });
    if(scatterTraceId<0) return;
    var stereoGlobalId = 0;
    if(index2d<0) stereoGlobalId = Number($("#trackGID").val());
    else{ // get the stereo GID from the clicked point data
        if(!data[scatterTraceId].frame) return;
        var frame = data[scatterTraceId].frame[index2d];
        if(!data[scatterTraceId].stereoGlobalId) return;
        stereoGlobalId = data[scatterTraceId].stereoGlobalId[index2d];
        if(stereoGlobalId<0) return;
    }
    // detemine the 3d index based on the frame #
    var traceName = "3dScatterTrace_" + stereoGlobalId.toString();
    var curveNum = -1;
    var index3d = -1;
    var data3d = document.getElementById("livePlot3d").data;
    if(!data3d) return;
    curveNum = data3d.findIndex(obj => { 
        return obj.name === traceName;
    });
    if(curveNum<0){
        alert('invalid global id: ' + $("#trackGID").val());
        curveNum = 0;
        $("#trackGID").val(curveNum);
    }
//  if(curveNum<0)return;
    if(index2d>0){
        for(var i=0;i<data3d[curveNum].frame.length;++i)
            if(data3d[curveNum].frame[i]==frame){
                index3d = i;
                break;
            }
    }
//    if(index3d<0) return;
    highlightTrack(curveNum,index3d);
}
$("#showSegmentationCheck").click(function(){
    reloadCineImages($("#frameScroller").val());
});

$("#showTrackingCheck").click(function(){
    updateInspectors('left',-1);
    setTrackingVisibility();
});

function clearDebugUtils(){
    undrawShape('','neighCircle');
    undrawShape('','epipolarLine');
    deletePlotlyTraces('left','Neigh');
    deletePlotlyTraces('right','Neigh');
}

function loadPlotlyJsonOutput(source){
    if(source!='preview'&&source!='results') return;
    var displayLeft = "";
    if(os.platform()=='win32'){
        displayLeft = '.dice\\.preview_left.png';
    }else{
        displayLeft = '.dice/.preview_left.png';
    }
    var displayRight = "";
    if(os.platform()=='win32'){
        displayRight = '.dice\\.preview_right.png';
    }else{
        displayRight = '.dice/.preview_right.png';
    }
    fs.stat(fullPath('',displayLeft), function(err, stat) {
        if(err == null) {
            Plotly.d3.json(fullPath('.dice','.' + source + '_left.json'), function(jsonErr, fig) {
                if(jsonErr==null){
                    if(fig.data)
                        if(fig.data[0].x)
                            if(fig.data[0].x.length==0)
                                alert('Warning: Tracking results are empty in the LEFT image \n(this may indicate the segmentation \nparameters need to be adjusted\n or there is nothing to track in this frame)');
                    updatePreviewImage({srcPath:fullPath('',displayLeft),dest:'left'},function(){
                        clearDebugUtils();
                        replacePlotlyData('left',fig.data);
                        //addPreviewTracks('left');
                        setTrackingVisibility();
                    });
                    showLivePlots();
                }else{
                    console.log(jsonErr);
                    alert('error: reading json file failed');
                }
            });
            // add the tracks from json files
            Plotly.d3.json(fullPath('.dice','.' + source + '_left_tracks.json'), function(jsonErr, fig) {
                if(jsonErr==null){
                    // add the track traces to the plot
                    deletePlotlyTraces('left','Tracks');
                    replacePlotlyData('left',fig.data);
                }else{
                    console.log(jsonErr);
                    alert('error: reading json tracks file failed');
                }
            });
            Plotly.d3.json(fullPath('.dice','.' + source + '_3d.json'), function(jsonErr, fig) {
                if(jsonErr==null){
                    updateTracklib3dScatter(fig.data,fig.camera,function(){
                        addTracklibFieldstoFieldSelect(function(){updateTracklib2dScatter();});
                    });
                }else{
                    console.log(jsonErr);
                    Plotly.purge(document.getElementById("livePlot3d"));
                    Plotly.purge(document.getElementById("livePlots"));
                }
            });
        }else{
        }
    });
    fs.stat(fullPath('',displayRight), function(err, stat) {
        if(err == null) {
            Plotly.d3.json(fullPath('.dice','.' + source + '_right.json'), function(jsonErr, fig) {
                if(jsonErr==null){
                    if(fig.data)
                        if(fig.data[0].x)
                            if(fig.data[0].x.length==0)
                                alert('Warning: Tracking results are empty in the RIGHT image \n(this may indicate the segmentation \nparameters need to be adjusted\n or there is nothing to track in this frame)');
                    updatePreviewImage({srcPath:fullPath('',displayRight),dest:'right'},function(){
                        replacePlotlyData('right',fig.data);
                        //addPreviewTracks('right');
                        setTrackingVisibility();
                    });
                }else{
                    alert('error: reading json file failed');
                    console.log(jsonErr);
                }
            });
            // add the tracks from json files
            Plotly.d3.json(fullPath('.dice','.' + source + '_right_tracks.json'), function(jsonErr, fig) {
                if(jsonErr==null){
                    // add the track traces to the plot
                    deletePlotlyTraces('right','Tracks');
                    replacePlotlyData('right',fig.data);
                }else{
                    console.log(jsonErr);
                    alert('error: reading json tracks file failed');
                }
            });
        }else{
        }
    });
}

function loadPlotlyFilteredJsonOutput(){
    Plotly.d3.json(fullPath('.dice','.preview_left_filtered.json'), function(jsonErr, fig) {
        if(jsonErr==null){
            replacePlotlyData('left',fig.data);
            setTrackingVisibility();
        }else{
            console.log(jsonErr);
            alert('error: reading json file failed');
        }
    });
    Plotly.d3.json(fullPath('.dice','.preview_right_filtered.json'), function(jsonErr, fig) {
        if(jsonErr==null){
            replacePlotlyData('right',fig.data);
            setTrackingVisibility();
        }else{
            console.log(jsonErr);
            alert('error: reading json file failed');
        }
    });
}


//function addPreviewTracks(dest){
//    var div = destToPlotlyDiv(dest);
//    var data = div.data;
//    var layout = div.layout;
//    if(!data||!layout) return;
//    
//    if($('#analysisModeSelect').val()!="tracking"||showStereoPane!=1) return;
//    var scatterTraceId = data.findIndex(obj => { 
//        return obj.name === "tracklibPreviewScatter";
//    });
//    if(scatterTraceId<0) return;
//    var px = data[scatterTraceId].x;
//    var py = data[scatterTraceId].y;
//    var fwdNeighId = data[scatterTraceId].fwdNeighId;
//    // draw lines between all the points that have neighbors
//    // remove all old track_lines
//    if(!layout.shapes) layout.shapes = [];
//    var i = layout.shapes.length;
//    while (i--) {
//        if(layout.shapes[i].name)
//            if(layout.shapes[i].name==='trackLine')
//                layout.shapes.splice(i,1);
//    }
//    for(var i=0;i<px.length;++i){
//        if(fwdNeighId[i]<0) continue;
//        var track_line = {
//                name: 'trackLine',
//                type:'line',
//                x0: px[i],
//                x1: px[fwdNeighId[i]],
//                y0: py[i],
//                y1: py[fwdNeighId[i]],
//                line: {color: 'yellow', width:2},
//                opacity: 0.8,
//                editable: false,
//                visible: true
//        };
//        layout.shapes.push(track_line);
//    }
//}