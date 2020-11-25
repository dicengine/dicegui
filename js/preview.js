$(window).load(function(){
});

function updatePreview(file_obj){
    imageSpec = [];
    imageSpec.fileObj = file_obj;
    imageSpec.displayPath = fullPath('.dice','.display_image.png');
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
        // TODO
        // collect buffer output to set height and width
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


//// test to print out the shapes in the image every 10 sec
//window.setInterval(function(){
//    var divID = "plotlyDiv";
//    console.log(document.getElementById(divID).layout.shapes);
//}, 10000);

function updateImage(imageSpec){
    console.log('updateImage(): image path ' + imageSpec.displayPath);
    var layout = {
            xaxis: {
                range: [0,imageSpec.width],
                showgrid: false,
                zeroline: false,
                showline: false,
            },
            yaxis: {
                range: [imageSpec.height,0],
                scaleanchor: 'x',
                showgrid: false,
                zeroline: false,
                showline: false,
            },
            margin: {l: 40,r: 5,b: 20,t: 30},
            newshape: {line: {color: 'cyan'},fillcolor:'cyan',opacity:0.4},
            images: [
                {
                    source: imageSpec.displayPath,
                    xref: 'x',
                    yref: 'y',
                    x: 0,
                    y: 0,
                    sizex: imageSpec.width,
                    sizey: imageSpec.height,
                    layer: 'below',
                }],
    };
    var config = {
            displaylogo: false,
            scrollZoom: true,
            responsive: true,
            modeBarButtonsToRemove: [
                'autoScale2d'
                ],
            modeBarButtonsToAdd: [//'drawline',
                //'drawopenpath',
                'drawclosedpath',
                //'drawcircle',
                //'drawrect',
                'eraseshape']
    }
    var divID = "plotlyDiv";
    if( $('#plotlyViewerLeft').is(':empty') ) {
        $("#plotlyViewerLeft").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    }
    
    var data = [ {
//        z: [0, 0, 1, 1],
//        x: [50, 100, 100, 0],
//        y: [0, 0, 100, 100],
        z: [0.65,0.6,0.7,0.6,0.72,0.72,1.0,0.7,0.5],
        x: [180,230,360,100,180,300,350,45,110],
        y: [510,100,515,300,760,600,900,810,80],
        type: 'contour',
        opacity: 0.6,
        colorscale: 'Jet',
        showscale: true,
        autocontour: true,
      }];
    
    // TODO call restyle or relayout instead of newPlot each time?
    Plotly.newPlot(document.getElementById(divID),data,layout,config);
}