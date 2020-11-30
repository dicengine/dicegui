$(window).load(function(){
});

function resizePreview(){
    console.log('resizing the plotly previews');
    Plotly.Plots.resize(document.getElementById("plotlyViewerLeft"));
    Plotly.Plots.resize(document.getElementById("plotlyViewerRight"));
}

function getPreviewConfig(dest){
    var _layout = {};
    var _config = {};
    if($("#analysisModeSelect").val()=="subset"){
        _layout = {
                xaxis: {
                    showgrid: false,
                    zeroline: false,
                    showline: false,
                },
                yaxis: {
//                  scaleanchor: 'x',
                    showgrid: false,
                    zeroline: false,
                    showline: false,
                },
                margin: {l: 40,r: 5,b: 20,t: 30},
                newshape: {line: {color: 'cyan'},fillcolor:'cyan',opacity:0.4},
        };
        _config = {
                displaylogo: false,
                scrollZoom: true,
                responsive: true,
                modeBarButtonsToRemove: [
                    'autoScale2d'
                    ],
        }
        if(dest=='left')
            _config.modeBarButtonsToAdd = [
                'drawclosedpath',
                'eraseshape'];
    }else{
        alert("error invalid configuration");
    }
    var obj = {
            layout : _layout,
            config : _config
    }
    return obj;
}

function updatePreview(file,dest){
    if(dest!='left'&&dest!='right'){
        console.log('error: invalid destination ' + dest);
        return;
    }
    var spec = [];
    spec.fileObj = file;
    if(dest=='left'){
        spec.displayPath = fullPath('.dice','.preview_left.png');
        spec.parentDiv = "plotlyViewerLeft";
    }
    else{
        spec.displayPath = fullPath('.dice','.preview_right.png');
        spec.parentDiv = "plotlyViewerRight";
    }
    spec.dest = dest;
    // set up the arguments to call the DICe opencv server which will convert whatever the input image
    // is to png so that it can be displayed in the viewer
    args = [];
    args.push(spec.fileObj.path);
    args.push(spec.displayPath);
    args.push('filter:none');
    console.log(args);
    
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc = child_process.spawn(execOpenCVServerPath,args,{cwd:workingDirectory});//,maxBuffer:1024*1024});
    proc.on('error', function(){
        alert('DICe OpenCVServer failed: invalid executable: ' + execOpenCVServerPath);
    });
    proc.on('close', (code) => {
        console.log(`OpenCVServer exited with code ${code}`);
        if(code==0){
            console.log("updatePreview(): image path " + spec.fileObj.path);
            fs.stat(spec.displayPath, function(err, stat) {
                if(err == null) {
                    updateImage(spec);
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
        consoleMsg(line);
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
    console.log('updateImage(): path ' + spec.displayPath + ' in div '  + spec.parentDiv);
    var obj = getPreviewConfig(spec.dest);
    obj.layout.xaxis.range = [0,spec.width];
    obj.layout.yaxis.range = [spec.height,0];
    obj.layout.images = [{
        source: spec.displayPath,
        xref: 'x',
        yref: 'y',
        x: 0,
        y: 0,
        sizex: spec.width,
        sizey: spec.height,
        layer: 'below',
    }],
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
    Plotly.newPlot(document.getElementById(spec.parentDiv),[],obj.layout,obj.config);
}