$(window).load(function(){
});

function resizePreview(){
    console.log('resizing the plotly previews');
    Plotly.Plots.resize(document.getElementById("plotlyViewerLeft"));
    Plotly.Plots.resize(document.getElementById("plotlyViewerRight"));
}

function getPreviewConfig(){
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
                    modeBarButtonsToAdd: [
                        'drawclosedpath',
                        'eraseshape']
        }
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
    imageSpec = [];
    imageSpec.fileObj = file;
    if(dest=='left'){
        imageSpec.displayPath = fullPath('.dice','.preview_left.png');
        imageSpec.parentDiv = "plotlyViewerLeft";
    }
    else{
        imageSpec.displayPath = fullPath('.dice','.preview_right.png');
        imageSpec.parentDiv = "plotlyViewerRight";
    }
    // set up the arguments to call the DICe opencv server which will convert whatever the input image
    // is to png so that it can be displayed in the viewer
    args = [];
    args.push(imageSpec.fileObj.path);
    args.push(imageSpec.displayPath);
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
            console.log("updatePreview(): image path " + imageSpec.fileObj.path);
            fs.stat(imageSpec.displayPath, function(err, stat) {
                if(err == null) {
                    updateImage(imageSpec);
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
            imageSpec.width = Number(line.split(' ').pop());
        }
        if(line.includes("BUFFER_OUT")&&line.includes("IMAGE_HEIGHT")){
            console.log('setting image height to ' + line.split(' ').pop());
            imageSpec.height = Number(line.split(' ').pop());
        }
    });
}

function updateImage(imageSpec){
    console.log('updateImage(): image path ' + imageSpec.displayPath + ' in div '  + imageSpec.parentDiv);
    var obj = getPreviewConfig();
    obj.layout.xaxis.range = [0,imageSpec.width];
    obj.layout.yaxis.range = [imageSpec.height,0];
    obj.layout.images = [{
        source: imageSpec.displayPath,
        xref: 'x',
        yref: 'y',
        x: 0,
        y: 0,
        sizex: imageSpec.width,
        sizey: imageSpec.height,
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
    Plotly.newPlot(document.getElementById(imageSpec.parentDiv),[],obj.layout,obj.config);
}