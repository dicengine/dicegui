$(window).load(function(){
});

function resizePreview(){
    console.log('resizing the plotly previews');
    Plotly.Plots.resize(document.getElementById("plotlyViewerLeft"));
    Plotly.Plots.resize(document.getElementById("plotlyViewerRight"));
}

function getPreviewConfig(dest){
    // possible destinations: left, right, cal_left, cal_right
    var _layout = {
            xaxis: {
                showgrid: false,
                zeroline: false,
                showline: false,
            },
            yaxis: {
                showgrid: false,
                zeroline: false,
                showline: false,
            },
            margin: {l: 40,r: 5,b: 20,t: 30},
    };
    var _config = {
            displaylogo: false,
            scrollZoom: true,
            responsive: true,
            modeBarButtonsToRemove: [
                'autoScale2d'
                ],
    };
    if($("#analysisModeSelect").val()=="subset"){
        _layout.newshape = {line: {color: 'cyan'},fillcolor:'cyan',opacity:0.4};
        if(dest=='left'){
            console.log('setting the mode bar buttons');
            _config.modeBarButtonsToAdd = [
                'drawclosedpath',
                'eraseshape'];
        }
    }
    if($("#analysisModeSelect").val()=="tracking"&&showStereoPane==1){ // signifies tracklib enabled and in stereo tracking
        _config.modeBarButtonsToRemove.push('drawclosedpath');
        _config.modeBarButtonsToRemove.push('eraseshape');
    }
    var obj = {
            layout : _layout,
            config : _config
    }
    console.log('getPreviewConfig called');
    console.log(obj);
    return obj;
}

function updatePreview(filePath,dest,argsIn,debugConsoleDivId,cb){
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
        updateImage(spec);
        return;
    }
    
    // set up the arguments to call the DICe opencv server which will convert whatever the input image
    // is to png so that it can be displayed in the viewer
    args = [];
    args.push(spec.srcPath);
    args.push(spec.destPath);
    if(argsIn!==undefined){
        for(i=0;i<argsIn.length;++i)
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
        if(code==0){
            console.log("updatePreview(): src path " + spec.srcPath);
            console.log("updatePreview(): dest path " + spec.destPath);
            fs.stat(spec.destPath, function(err, stat) {
                if(err == null) {
                    updateImage(spec);
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
        }
        if(line.includes("BUFFER_OUT")&&line.includes("IMAGE_HEIGHT")){
            console.log('setting image height to ' + line.split(' ').pop());
            spec.height = Number(line.split(' ').pop());
        }
    });
}

function updateImage(spec){
    console.log('updateImage(): path ' + spec.destPath + ' in div '  + spec.destDivId);
    var obj = getPreviewConfig(spec.dest);
    obj.layout.xaxis.range = [0,spec.width];
    obj.layout.yaxis.range = [spec.height,0];
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
    Plotly.newPlot(document.getElementById(spec.destDivId),[],obj.layout,obj.config);
}