function addTracklibFieldstoFieldSelect(cb){
    $("#livePlotFieldSelect").empty();
    $("#livePlotFieldSelect").append(new Option('world coord x','x'));
    $("#livePlotFieldSelect").append(new Option('world coord y','y'));
    $("#livePlotFieldSelect").append(new Option('world coord z','z'));
    $("#livePlotFieldSelect").append(new Option('area','area'));
    $("#livePlotFieldSelect").append(new Option('gray','gray'));
    $("#livePlotFieldSelect").append(new Option('Δx/frame','velX'));
    $("#livePlotFieldSelect").append(new Option('Δy/frame','velY'));
    $("#livePlotFieldSelect").append(new Option('Δz/frame','velZ'));
    cb = cb || $.noop;
    cb();
}

$("#trackGID").change(function() {
    if($('#trackGID').val()<0){
        $('#trackGID').val(0);
        alert('invalid global id');
    }
    updateTracklib2dScatter();
});


$("#trackGID").keypress(function(event) { 
    if (event.keyCode === 13) { 
        if($('#trackGID').val()<0){
            $('#trackGID').val(0);
            alert('invalid global id');
        }
        updateTracklib2dScatter();
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
        $("#trackGID").val(0);
        // purge the 2d results
        Plotly.purge(document.getElementById("livePlots"));
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
                        text: 'X',
                    },
                },
                yaxis: {
                    scaleanchor: 'x',
                    title: {
                        text: 'Y',
                    }
                },
                zaxis: {
                    scaleanchor: 'x',
                    title: {
                        text: 'Z',
                    }
                },
                camera: {
//                    center: camera.center, 
//                    eye: camera.eye, 
//                    up: camera.up,
                  center: {x: 0, y: 0, z: 0}, 
                  eye: {x: 0, y: 0, z:-3}, 
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
            return;
        }
        update = {
                'marker.color': '#316395',
                'line.color': '#316395',
                'line.width': 4
        }
        Plotly.restyle("livePlot3d", update,curveNum);
        addClickedPointTrace(curveNum,ptIndex);
        addClickedPointTrace2d(curveNum,ptIndex);
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
    if($('#trackGID').val()!=curveNum);
        $('#trackGID').val(curveNum).change();
    
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
    if(!data[scatterTraceId].frame) return;
    var frame = data[scatterTraceId].frame[index2d];
    if(!data[scatterTraceId].stereoGlobalId) return;
    var stereoGlobalId = data[scatterTraceId].stereoGlobalId[index2d];
    if(stereoGlobalId<0) return;
    // detemine the 3d index based on the frame #
    var traceName = "3dScatterTrace_" + stereoGlobalId.toString();
    var data3d = document.getElementById("livePlot3d").data;
    var curveNum = data3d.findIndex(obj => { 
        return obj.name === traceName;
    });
//    if(curveNum<0)return;
    var index3d = -1;
    for(var i=0;i<data3d[curveNum].frame.length;++i)
        if(data3d[curveNum].frame[i]==frame){
            index3d = i;
            break;
        }
//    if(index3d<0) return;
    highlightTrack(curveNum,index3d);
}