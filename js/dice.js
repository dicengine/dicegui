document.getElementById("runLi").onclick = function() {
   // check if any of the results files exist, if so warn user
    // see if the results folder exists:
    var fileName = fullPath('results','');
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            if (confirm('existing results files found in the working directory, overwrite?')) {
                // delete any existing results files
                fs.readdirSync(fullPath('results','')).forEach(file => {
                    // check if the file matches the syntax         
                    if(file.indexOf('DICe_solution_') !== -1){
                        fs.unlink(fullPath('results',file), (err) => {
                            if (err) throw err;
                            console.log('successfully deleted existing results file'+file);
                        });
                    }
                });
                // all the input file writes are chained via callbacks with the
                // last callback executing DICe
                startProgress();
                writeInputFile(false);
                $("#abortLi").show();
                $("#sssigPreview").hide();
            }else{
                return false;
            }
        }else {
            // all the input file writes are chained via callbacks with the
            // last callback executing DICe
            startProgress();
            writeInputFile(false);
            $("#abortLi").show();
            $("#sssigPreview").hide();
        }
    });
};

document.getElementById("writeLi").onclick = function() {
    writeInputFile(true);
};

function integerLength(integer) {
    return integer.toString().length;
}

function showLivePlots(){
    //var online = navigator.onLine;
    // disable live plots when working offline
    //if(!online){
	//alert('Live plots are disabled when working offline');
    //    return;
    //}
    localStorage.clear();
    localStorage.setItem("workingDirectory",workingDirectory);
    if($("#analysisModeSelect").val()=="tracking"){
        if(diceTrackLibOn && showStereoPane==1){
            livePlotTracklibRepeat();
        }else{
            var numROI = numROIShapes();
            var livePlotFiles = '';
            var numDigitsTotal = integerLength(numROI);
            // set up the files to read
            for(var i=0;i<numROI;++i){
                if(os.platform()=='win32'){
                    livePlotFiles += 'results\\';
                }else{
                    livePlotFiles += 'results/';
                }
                var currentDigits = integerLength(i);
                var numZeros = Number(numDigitsTotal) - Number(currentDigits);
                livePlotFiles += 'DICe_solution_';
                for(var j=0;j<numZeros;++j)
                    livePlotFiles += '0';
                livePlotFiles += i + '.txt';
                if(i<numROI-1)
                    livePlotFiles += ' ';
            }
            localStorage.setItem("livePlotFiles", livePlotFiles);
            $("#resultsButton").trigger( "click" );
            livePlotRepeat();
        }
        return;
    }
//    livePlotContourRepeat();
    var livePlotInfo = livePlotDims();
    if(livePlotInfo.numLivePlotPts<=0 && !livePlotInfo.livePlotLineActive) return;
    if(livePlotInfo.numLivePlotPts >0){
        var livePlotFiles = ""
        // TODO set up the files to read
        //livePlotFiles = "DICe_solution_0.txt DICe_solution_1.txt DICe_solution_2.txt DICe_solution_3.txt DICe_solution_4.txt DICe_solution_5.txt DICe_solution_6.txt";
        for(var i=0;i<livePlotInfo.numLivePlotPts;++i){
            livePlotFiles += 'live_plot_pt_' + i + '.txt';
            if(i<livePlotInfo.numLivePlotPts-1)
                livePlotFiles += ' ';
        }
        localStorage.setItem("livePlotFiles", livePlotFiles);
        $("#resultsButton").trigger( "click" );
        livePlotRepeat();
    }
    if(livePlotInfo.livePlotLineActive){
        $("#resultsButton").trigger( "click" );
        livePlotLineRepeat();
    }
}

function resetWorkingDirectory(){
    $("#frameScroller").attr('max',0);
    $("#frameScroller").attr('min',0);
    $("#frameScroller").val(0);
    $("#currentPreviewSpan").text('');

    $("#refImageText span").text('');
    $("#refImageTextRight span").text('');
    $("#defImageListLeft").empty();
    $("#defImageListRight").empty();

    $("#imageFolderSpan").text('');
    $("#imageSequencePreviewSpan").text('');
    $("#imagePrefix").val('');
    $("#refIndex").val(0);
    $("#startIndex").val(0);
    $("#endIndex").val(0);
    $("#skipIndex").val(1);
    $("#numDigits").val(1);
    $("#stereoLeftSuffix").val('_0');
    $("#stereoRightSuffix").val('_1');
    $("#imageExtension").val('');

    $("#cineLeftPreviewSpan").text('');
    $("#cineRightPreviewSpan").text('');
    $("#startPreviewSpan").text('');
    $("#endPreviewSpan").text('');
    $("#cineRefIndex").val(0);
    $("#cineStartIndex").val(0);
    $("#cineEndIndex").val(0);
    $("#cineSkipIndex").val(1);
    $("#cineFrameRatePreviewSpan").text("");
    $("#cineGoToIndex").val("");

    $("#calList").empty();
    $("#runLoader").removeClass('post-loader-success');
    $("#runLoader").removeClass('post-loader-fail');
    $("#runLoader").removeClass('loader');

    updatePreview('','left');
    updatePreview('','right');
    
    refImagePathLeft = "undefined";
    refImagePathRight = "undefined";
    cinePathLeft = "undefined";
    cinePathRight = "undefined";
    calPath = "undefined";
    defImagePathsLeft = [];
    defImagePathsRight = [];

    deleteDisplayImageFiles(0);
    deleteDisplayImageFiles(1);
    deleteDisplayImageFiles(2);

    deleteHiddenFiles('keypoints');
    deleteHiddenFiles('background');
}

document.getElementById("clearLi").onclick = function() {
    if (confirm('clear working directory?\n\nThis action will clear the reference and deformed images, remove all ROIs, and reset the calibration file. Saved input files in this working directory will not be erased.')) {
        resetWorkingDirectory();
    }else{
        return false;
    }
};

//document.getElementById("previewCross").onclick = function() {
//    callCrossInitExec();
//}
function callDICeExec(resolution,ss_locs) {

    // load the live plot viewer if there are any live plots:
//    if($("#analysisModeSelect").val()=="tracking"&&showStereoPane==1){ // signifies tracklib
//    }else
    if(!ss_locs)
        showLivePlots();
    
    // nuke the old line plot and point live plot files
    fs.readdirSync(workingDirectory).forEach(file => {
        // check if the file matches the syntax                                                                       
        if(file.indexOf('live_plot_line_step_') !== -1 || file.indexOf('live_plot_pt_') !== -1){
            fs.unlink(fullPath('',file), (err) => {
                if (err) throw err;
                console.log('successfully deleted old line plot file'+file);
            });
        }
    });

    var inputFile = fullPath('','input.xml');
    var child_process = require('child_process');
    var readline = require('readline');

    var child;// = child_process.spawn('<process>', [<arg1>, <arg2>]);
    if(ss_locs)
        child = child_process.spawn(execPath, ['-i',inputFile,'-v','-t','--ss_locs'],{cwd:workingDirectory});
    else
        child = child_process.spawn(execPath, ['-i',inputFile,'-v','-t'],{cwd:workingDirectory});

    child.stdout.on('data', function (data) {
        if(diceDebugMsgOn){
            consoleMsg(data.toString());
        }
    });

    if(!diceDebugMsgOn){
        readline.createInterface({
            input     : child.stdout,
            terminal  : false
        }).on('line', function(line) {
            consoleMsg(line);
        });
    }

    child.on('error', function(){
        alert('DICe execution failed: invalid executable: ' + execPath);
        endProgress(false);
        $("#abortLi").hide();
        $("#sssigPreview").show();
    });

    $("#abortLi").on('click',function(){
        child.kill();
        $("#abortLi").hide();
    });

    child.stderr.on('data', function (data) {
        consoleMsg(data);
        alert('DICe execution failed: invalid executable: ' + execPath);
        endProgress(false);
        $("#abortLi").hide();
        $("#sssigPreview").show();
    });

    child.on('close', function (code) {
        console.log(`child process exited with code ${code}`);
        updateResultsFilesList();
        $("#abortLi").hide();
        $("#sssigPreview").show();
        if(code!=0){
            alert('DICe execution failed (see console for details)');
            endProgress(false);
        }
        else{
            endProgress(true);
            resultsFresh = true;
            if(resolution){
                localStorage.setItem("workingDirectory",workingDirectory);
                var win = new BrowserWindow({ 
                webPreferences: {
		    nodeIntegration: true
		},
                width: 850, height: 1000 });
                win.on('closed', () => {
                    win = null
                })
                win.loadURL('file://' + __dirname + '/resolution.html');
                //win.webContents.openDevTools()
            }else if(ss_locs){
                addSubsetSSSIGPreviewTrace(fullPath('.dice','.subset_locs.txt'));
//                drawDotsAndBoxesForSubsets(fullPath('.dice','.subset_locs.txt'));
            }else{
                postExecTasks();
            }
        }
    });
}

function updateCineDisplayImage(fileName,index,dest,cb){
    cb = cb || $.noop;
    // construct the file name with the indes
    // this assumes that fileName is not alredy decorated
    var decoratedFile = fileName.replace('.'+fileName.split('.').pop(),'_'+index+'.cine');
    console.log('updating cine display image: ' + decoratedFile);
    updatePreview(decoratedFile,dest,[],[],"",cb);
}

function callCineStatExec(file,mode,callback) {

    callback = callback || $.noop;
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc;

    var fileName = file.path;
    console.log('loading cine file: ' + file.path)
    fs.stat(fileName, function(err, stat) {
        if(err != null) {
            alert("could not find .cine file: " + fileName);
            return false;
        }
        else{
            console.log("getting frame range of cine file: " + fileName);
            var proc = child_process.spawn(execCineStatPath, [fileName],{cwd:workingDirectory});//,maxBuffer:1024*1024})
        }
        readline.createInterface({
            input     : proc.stdout,
            terminal  : false
        }).on('line', function(line) {
            console.log(line);
        });
        proc.on('error', function(){
            alert('DICe .cine file stat failed: invalid executable: ' + execCineStatPath);
            return false;
        });
        proc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if(code!=0){
                alert('DICe .cine file stat failed');
                return false;
            }
            else{
                // read the output file:
                var statFileName = fullPath('.dice','.cine_stats.dat');
                fs.stat(statFileName, function(err, stat) {
                    if(err != null) {
                        alert("could not find .cine stats file: " + statFileName);
                        return false;
                    }else{
                         fs.readFile(statFileName, 'utf8', function (err,data) {
                             if (err) {
                                 console.log(err);
                                 return false;
                             }
                             var stats = data.toString().split(/\s+/g).map(Number);
                             //alert(stats[0]);
                             //alert(stats[1]);
                             //alert(stats[2]);
                             // check that the two cine files have valid frame ranges
                             if($("#startPreviewSpan").text()!=""||$("#endPreviewSpan").text()!="")
                                 if($("#startPreviewSpan").text()!=stats[1]||$("#endPreviewSpan").text()!=stats[2]){
                                     alert("Error, all .cine files need to have matching frame ranges");
                                     return false;
                                 }
                             cineFirstFrame = stats[1];
                             $("#startPreviewSpan").text(stats[1]);
                             $("#currentPreviewSpan").text(stats[1]);
                             $("#endPreviewSpan").text(stats[2]);
                             $("#cineGoToIndex").val(stats[1]);
                             $("#cineFrameRatePreviewSpan").text(stats[3]);
                             if(mode==0){
                                 $("#cineRefIndex").val(stats[1]);
                                 $("#cineStartIndex").val(stats[1]);
                                 $("#cineEndIndex").val(stats[2]);
                                 $("#frameScroller").attr('max',stats[2]);
                                 $("#frameScroller").attr('min',stats[1]);
                                 $("#frameScroller").val(stats[1]);
                             }
                             // convert the cine to tiff
                             // always start with the ref index for the initial display
                             if(mode==0){
                                 cinePathLeft = file.path;
                                 $("#cineLeftPreview span").text(file.name);
                                 updateCineDisplayImage(fileName,stats[1],'left',callback); // only execute the callback after the left image is updated
                             }else if(mode==1){
                                 cinePathRight = file.path;
                                 $("#cineRightPreview span").text(file.name);
                                 updateCineDisplayImage(fileName,stats[1],'right');
                             }
                             deleteHiddenFiles('keypoints');
                             return true;
                         }); // end else
                    }
                });
            }
        }); // end proc.on    
    }); // end fileName fs.stat
}

//function deactivateEpipolar(){
//    $("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
//    drawEpipolarActive = false;
//    drawEpipolarLine(false,0,0,true);
//}

function updateTracklibDisplayImages(index){
    console.log('updateTracklibDisplayImages()');
    if(cinePathLeft=="undefined"||cinePathRight=="undefined"){
        alert('cannot update tracklib image preview since the paths are not defined');
        console.log('left path ' + cinePathLeft + ' right path ' + cinePathRight);
        return;
    }
    if(calPath=="undefined"){
        alert('calibration file must be set to preview');
        return;
    }
    
    // set up the arguments for the OpenCVServer
    args = [];
    
    // push the arguments to opencvserver
    args.push('tracklib');

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

    args.push('display_file_left');
    args.push(displayLeft);
    args.push('display_file_right');
    args.push(displayRight);
    
    args.push('cine_file');
    args.push(cinePathLeft);
    args.push('stereo_cine_file');
    args.push(cinePathRight);

    args.push('cine_ref_index');
    args.push($("#cineRefIndex").val());
    
    args.push('cine_start_index');
    var startFrame = Number($("#currentPreviewSpan").text()) - ($("#numPreviewFrames").val()-1)*$("#cineSkipIndex").val();
    if(startFrame < Number($("#startPreviewSpan").text()))
        startFrame = Number($("#startPreviewSpan").text());
    args.push(startFrame);
    // overload the start frame as the current frame since the preview begins
    // with the current frame
//    args.push($("#cineStartIndex").val());
//    args.push($("#currentPreviewSpan").text());
    
    // the end frame is the start frame plus num_frames * skips
    args.push('cine_end_index');
    args.push($("#currentPreviewSpan").text());
//    var endFrame = Number($("#currentPreviewSpan").text()) + ($("#numPreviewFrames").val()-1)*$("#cineSkipIndex").val();
//    if(endFrame > Number($("#endPreviewSpan").text()))
//        endFrame = Number($("#endPreviewSpan").text());
//    args.push(endFrame);
    
    args.push('cine_skip_index');
    args.push($("#cineSkipIndex").val());
    
    args.push('camera_system_file');
    args.push(calPath);
    
    args.push('thresh_left');
    args.push(parseInt($("#threshLeft").val()));

    args.push('thresh_right');
    args.push(parseInt($("#threshRight").val()));
    
    args.push('min_area');
    args.push(parseInt($("#minArea").val()));
    
    args.push('max_area');
    args.push(parseInt($("#maxArea").val()));
    
    args.push('max_pt_density'); // needs to be a double value
    if($("#maxPtDensity").val().includes('.')){
        args.push($("#maxPtDensity").val());
    }else{
        args.push($("#maxPtDensity").val()  +'.0');
    }
    
    args.push('colocation_tol'); // needs to be a double value
    if($("#colocationTol").val().includes('.')){
        args.push($("#colocationTol").val());
    }else{
        args.push($("#colocationTol").val()  +'.0');
    }
    
    args.push('match_tol');
    if($("#matchTol").val().includes('.')){
        args.push($("#matchTol").val());
    }else{
        args.push($("#matchTol").val()  +'.0');
    }
    
    args.push('cross_match_tol');
    if($("#crossMatchTol").val().includes('.')){
        args.push($("#crossMatchTol").val());
    }else{
        args.push($("#crossMatchTol").val()  +'.0');
    }
    
    args.push('neighbor_radius');
    if($("#neighborRadius").val().includes('.')){
        args.push($("#neighborRadius").val());
    }else{
        args.push($("#neighborRadius").val()  +'.0');
    }

    args.push('min_pts_per_track');
    args.push(parseInt($("#minPtsPerTrack").val()));

    args.push('max_track_gap');
    if(parseInt($("#maxTrackGap").val())>=1){
        args.push(parseInt($("#minPtsPerTrack").val()));
    }else{
        args.push('1');
    }

    args.push('num_background_frames');
    var numBackgroundFrames = parseInt($("#numBackgroundFrames").val());
    if(numBackgroundFrames<1||numBackgroundFrames > ($("#cineEndIndex").val()-$("#cineStartIndex").val())){
        numBackgroundFrames = 1;
        $("#numBackgroundFrames").val(1);
    }
    args.push(numBackgroundFrames);
    
    console.log(args);
    var child_process = require('child_process');
    var readline      = require('readline');
    var proc = child_process.spawn(execOpenCVServerPath,args,{cwd:workingDirectory});//,maxBuffer:1024*1024});
    proc.on('error', function(){
        alert('DICe OpenCVServer failed: invalid executable: ' + execOpenCVServerPath);
    });
    //setTimeout( proc.kill(), 40000);
    proc.on('close', (code) => {
        console.log(`OpenCVServer exited with code ${code}`);
        if(code==0){
            fs.stat(fullPath('',displayLeft), function(err, stat) {
                if(err == null) {
                    Plotly.d3.json(fullPath('.dice','.preview_left.json'), function(jsonErr, fig) {
                        if(jsonErr==null){
                            updatePreview(fullPath('',displayLeft),'left',fig.data,[],"",function(){undrawShape('','neighCircle');undrawShape('','epipolarLine');});
                        }else{
                            alert('error: reading json file failed');
                        }
                      });
                }else{
                }
            });
            fs.stat(fullPath('',displayRight), function(err, stat) {
                if(err == null) {
                    Plotly.d3.json(fullPath('.dice','.preview_right.json'), function(jsonErr, fig) {
//                        console.log(fig);
                        if(jsonErr==null){
                            updatePreview(fullPath('',displayRight),'right',fig.data);
                        }else{
                            alert('error: reading json file failed');
                            console.log(jsonErr);
                        }
                      });
                }else{
                }
            });
        }else{
            console.log('error ocurred while applying filter: ' + code);
        }
    });
    readline.createInterface({
        input     : proc.stdout,
        terminal  : false
    }).on('line', function(line) {
        consoleMsg(line);
    });
    
}

//function drawEpipolarLine(isLeft,dot_x,dot_y,reset=false) {
//    //if($("#analysisModeSelect").val()!="tracking") return;
//    // check to see that there is at least one image selected:
//    if(refImagePathLeft=='undefined'&&refImagePathRight=='undefined') return;
//    // generate the command line
//    args = [];
//    leftName = '';
//    leftNameFilter = '';
//    rightName = '';
//    rightNameFilter = '';
//    hiddenDir = fullPath('.dice','');
//    fs.readdir(hiddenDir, (err,dir) => {
//        for(var i = 0; i < dir.length; i++) {
//            if(dir[i].includes('.display_image_left')&&!dir[i].includes('filter')&&!dir[i].includes('epipolar')){
//                leftName = fullPath('.dice',dir[i]);
//                leftNameFilter = fullPath('.dice',dir[i].replace('.'+dir[i].split('.').pop(),"_filter.png"));
//                leftNameEpipolar = fullPath('.dice',dir[i].replace('.'+dir[i].split('.').pop(),"_epipolar.png"));
//            }else if(dir[i].includes('.display_image_right')&&!dir[i].includes('filter')&&!dir[i].includes('epipolar')){
//                rightName = fullPath('.dice',dir[i]);
//                rightNameFilter = fullPath('.dice',dir[i].replace('.'+dir[i].split('.').pop(),"_filter.png"));
//                rightNameEpipolar = fullPath('.dice',dir[i].replace('.'+dir[i].split('.').pop(),"_epipolar.png"));
//            }
//        }
//        if(reset){
//            getFileObject(leftName, function (fileObject) {
//                loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,false,"","",false);
//            });
//            getFileObject(rightName, function (fileObject) {
//                loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","",false);
//            });
//            return;
//        }
//        if($("#segPreviewCheck")[0].checked || $("#showTracksCheck")[0].checked)
//            args.push(leftNameFilter);
//        else
//            args.push(leftName);
//        args.push(leftNameEpipolar);
//        if($("#segPreviewCheck")[0].checked || $("#showTracksCheck")[0].checked)
//            args.push(rightNameFilter);
//        else
//            args.push(rightName);
//        args.push(rightNameEpipolar);
//        args.push('filter:epipolar_line');
//        args.push('frame_number');
//        args.push($("#currentPreviewSpan").text());
//        args.push('epipolar_is_left');
//        if(isLeft)
//            args.push('true');
//        else
//            args.push('false');
//        args.push('epipolar_dot_x');
//        args.push(dot_x);
//        args.push('epipolar_dot_y');
//        args.push(dot_y);
//        args.push('cal_file');
//        args.push(fullPath('','cal.xml'));
//        consoleMsg('calling OpenCVServerExec with args ' + args);
//
//        // call the filter exec
//        var child_process = require('child_process');
//        var readline      = require('readline');
//        var proc = child_process.spawn(execOpenCVServerPath,args,{cwd:workingDirectory});//,maxBuffer:1024*1024});
//
//        proc.on('error', function(){
//            alert('DICe OpenCVServer failed for epipolar line: invalid executable: ' + execOpenCVServerPath);
//        });
//        proc.on('close', (code) => {
//            console.log(`OpenCVServer exited with code ${code}`);
//            if(code!=0){
//                alert('OpenCVServer failed');
//            }
//            else{
//                // load new preview images
//                fs.stat(fullPath('.dice','.display_image_left_epipolar.png'), function(err, stat) {
//                    if(err == null) {
//                        getFileObject(fullPath('.dice','.display_image_left_epipolar.png'), function (fileObject) {
//                            loadImage(fileObject,"#panzoomLeft","auto","auto",1,false,false,"","",false);
//                        });
//                    }else{
//                    }
//                });
//                fs.stat(fullPath('.dice','.display_image_right_epipolar.png'), function(err, stat) {
//                    if(err == null) {
//                        getFileObject(fullPath('.dice','.display_image_right_epipolar.png'), function (fileObject) {
//                            loadImage(fileObject,"#panzoomRight","auto","auto",1,false,false,"","",false);
//                        });
//                    }else{
//                    }
//                });
//            }
//        });
//        readline.createInterface({
//            input     : proc.stdout,
//            terminal  : false
//        }).on('line', function(line) {
//            consoleMsg(line);
//        });
//    })
//}

function callCrossInitExec() {

    var child_process = require('child_process');
    var readline      = require('readline');
    var proc;

    // see if the projection_points.dat file exists:
    var fileName = fullPath('','projection_points.dat');
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            console.log("found nonlinear seed file: projection_points.dat in the execution directory, enabling nonlinear warp");
            proc = child_process.spawn(execCrossInitPath, [refImagePathLeft,refImagePathRight,'1'],{cwd:workingDirectory});//,maxBuffer:1024*1024})
            startProgress();
        }
        else{
            console.log("nonlinear seed file projection_points.dat not found");
            proc = child_process.spawn(execCrossInitPath, [refImagePathLeft,refImagePathRight,'0'],{cwd:workingDirectory});//,maxBuffer:1024*1024})
            startProgress();
        }
        proc.stdout.on('data', function (data) {
            if(diceDebugMsgOn){
                consoleMsg(data.toString());
            }
        });
        if(!diceDebugMsgOn){
            readline.createInterface({
                input     : proc.stdout,
                terminal  : false
            }).on('line', function(line) {
                consoleMsg(line);
            });
        }
        //readline.createInterface({
        //    input     : proc.stdout,
        //    terminal  : false
        //}).on('line', function(line) {                
        //    consoleMsg(line);
        //});
        proc.on('error', function(){
            alert('DICe cross correlation initialization failed: invalid executable: ' + execCrossInitPath);
            endProgress(false);
        });
        proc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            updateResultsFilesList();
            if(code!=0){
                alert('DICe cross correlation initialization failed (may need to seed a nonlinear warp for this image set)');
                endProgress(false);
             }
            else{
                endProgress(true);
                // loadpreview window ...
                openPreviewCross();
             }
        });    
    });
}

function postExecTasks(){
    if(paraviewMsg){
        alert('Analysis successful\n\nView the results files using ParaView\nwhich can be freely downloaded at\nwww.paraview.org');
        paraviewMsg = false;
    }
    if($("#exportMovieCheck")[0].checked){
        consoleMsg('writing results movie to results folder');
        var child_process = require('child_process');
        var proc = child_process.spawn(execTrackingMoviePath,['input.xml'],{cwd:workingDirectory});
    }
    // if this is a mono tracking run, load the results files into memory in case the user wants to view the tracked results
    if($("#analysisModeSelect").val()=="tracking" && showStereoPane==0){
        loadTrackingResultsIntoMemory();
    }
}

function startProgress (){
    $("#runLoader").removeClass('post-loader-success');
    $("#runLoader").removeClass('post-loader-fail');
    $("#runLoader").addClass('loader');
}
function endProgress (success){
    $("#runLoader").removeClass('loader');
    if(success){
        $("#runLoader").addClass('post-loader-success');
    }
    else {
        $("#runLoader").addClass('post-loader-fail');
    }
}


function writeInputFile(only_write,resolution=false,ss_locs=false) {
    fileName     = fullPath('','input.xml');
    outputFolder = fullPath('results','');
    paramsFile   = fullPath('','params.xml');
    subsetFile   = fullPath('','subset_defs.txt'); // defines the ROIs
    consoleMsg('writing input file ' + fileName);
    var content = '';
    content += '<!-- Auto generated input file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    content += '<Parameter name="output_folder" type="string" value="' + outputFolder + '" /> \n';
    content += '<Parameter name="correlation_parameters_file" type="string" value="' + paramsFile + '" />\n';

    var ROIShapes = getPlotlyShapes('ROI');
    var numROIs = ROIShapes.length;
    //  for global if no ROI has been defined, define a default one
    if(numROIs==0&&$("#analysisModeSelect").val()=="global"){
        // if no ROIs are defined for global, define one large ROI
        var points = {x:[20,refImageWidth-20,refImageWidth-20,20],
                y:[20,20,refImageHeight,refImageHeight]};
        var shape = pointsToPathShape(points,'ROI_0');
        ROIShapes.push(shape);
        var update = {shapes: ROIShapes};
        Plotly.relayout(document.getElementById("plotlyViewerLeft"),update);
//        plotlyDivLeft.layout.shapes.push(shape);
        numROIs++;
    }
    console.log('writeInputFile(): num ROIs ' + numROIs);
    var subsetCoordinates = getSubsetCoordinatesTrace();
    var numSubsets = 0;
    if(subsetCoordinates.x)
        numSubsets = subsetCoordinates.x.length;
    console.log('writeInputFile(): num custom(or conformal) subsets ' + numSubsets);
    
    // check that some ROIs have been defined if this is the tracking mode
    if($("#analysisModeSelect").val()=="tracking" && showStereoPane==0 && numROIs==0 && !only_write){
        alert('tracking subsets must be defined');
        endProgress(false);
        $("#abortLi").hide();
        $("#sssigPreview").show();
        return;
    }
    if(numROIs>0||numSubsets>0){
        content += '<Parameter name="subset_file" type="string" value="' + subsetFile + '" />\n';
    }
    
    if($("#analysisModeSelect").val()=="subset"){
        content += '<Parameter name="subset_size" type="int" value="'+$("#subsetSize").val()+'" />\n';
        if(numSubsets==0)
            content += '<Parameter name="step_size" type="int" value="'+$("#stepSize").val()+'" />\n';
        content += '<Parameter name="separate_output_file_for_each_subset" type="bool" value="false" />\n';
    }else if($("#analysisModeSelect").val()=="tracking"){
        content += '<Parameter name="separate_output_file_for_each_subset" type="bool" value="true" />\n';
        if(showStereoPane==1){
            content += '<Parameter name="use_tracklib" type="bool" value="true" />\n';
        }
    }else{
        content += '<Parameter name="mesh_size" type="double" value="'+$("#meshSize").val()+'" />\n';
    }
    content += '<Parameter name="create_separate_run_info_file" type="bool" value="true" />\n';
    if($("#omitTextCheck")[0].checked&&$("#analysisModeSelect").val()=="subset"){
        content += '<Parameter name="no_text_output_files" type="bool" value="true" />\n';
    }
    if((showStereoPane==1||showStereoPane==2)&&!resolution&&!ss_locs&&$("#analysisModeSelect").val()!="global"){
        content += '<Parameter name="camera_system_file" type="string" value="' + calPath + '" />\n';
    }
    if(showStereoPane==0&&$("#calibrationCheck")[0].checked){
        content += '<Parameter name="camera_system_file" type="string" value="' + calPath + '" />\n';
    }
    var fileSelectMode = $("#fileSelectMode").val();
    if(fileSelectMode=="list"){
      content += '<Parameter name="image_folder" type="string" value="" />\n';
      content += '<Parameter name="reference_image" type="string" value="' + refImagePathLeft + '" />\n';
      content += '<ParameterList name="deformed_images">\n';
        // add the deformed images
        if(resolution||ss_locs){
            content += '<Parameter name="'+refImagePathLeft+'" type="bool" value="true" />\n';
        }
        else{
            for(var i = 0, l = defImagePathsLeft.length; i < l; i++) {
                content += '<Parameter name="'+defImagePathsLeft[i].path+'" type="bool" value="true" />\n';
            }
        }
      content += '</ParameterList>\n';
      if((showStereoPane==1||showStereoPane==2)&&!resolution&&!ss_locs&&$("#analysisModeSelect").val()!="global"){
          content += '<Parameter name="stereo_reference_image" type="string" value="' + refImagePathRight + '" />\n';
          content += '<ParameterList name="stereo_deformed_images">\n';
          // add the deformed images
          for(var i = 0, l = defImagePathsRight.length; i < l; i++) {
              content += '<Parameter name="'+defImagePathsRight[i].path+'" type="bool" value="true" />\n';
          }
          content += '</ParameterList>\n';
      }
    }
    else if(fileSelectMode=="sequence"){
        var folderName = $("#imageFolderSpan").text();
        if(os.platform()=='win32'){
            folderName += '\\';
        }else{
            folderName += '/';
        }
        content += '<Parameter name="image_folder" type="string" value="'+folderName +'" />\n';
        content += '<Parameter name="reference_image_index" type="int" value="'+$("#refIndex").val()+'" />\n';
        content += '<Parameter name="start_image_index" type="int" value="'+$("#startIndex").val()+'" />\n';
        content += '<Parameter name="end_image_index" type="int" value="'+$("#endIndex").val()+'" />\n';
        content += '<Parameter name="skip_image_index" type="int" value="'+$("#skipIndex").val()+'" />\n';
        content += '<Parameter name="num_file_suffix_digits" type="int" value="'+$("#numDigits").val()+'" />\n';
        content += '<Parameter name="image_file_extension" type="string" value="'+$("#imageExtension").val()+'" />\n';
        content += '<Parameter name="image_file_prefix" type="string" value="'+$("#imagePrefix").val()+'" />\n';
        if((showStereoPane==1||showStereoPane==2)){
            content += '<Parameter name="stereo_left_suffix" type="string" value="'+$("#stereoLeftSuffix").val()+'"/>\n';
            content += '<Parameter name="stereo_right_suffix" type="string" value="'+$("#stereoRightSuffix").val()+'" />\n';
        }
    }
    else if(fileSelectMode=="cine"){
        content += '<Parameter name="image_folder" type="string" value="" />\n';
        content += '<Parameter name="cine_file" type="string" value="'+cinePathLeft+'" />\n';
        content += '<Parameter name="cine_ref_index" type="int" value="'+$("#cineRefIndex").val()+'" />\n';
        content += '<Parameter name="cine_start_index" type="int" value="'+$("#cineStartIndex").val()+'" />\n';
        content += '<Parameter name="cine_skip_index" type="int" value="'+$("#cineSkipIndex").val()+'" />\n';
        content += '<Parameter name="cine_end_index" type="int" value="'+$("#cineEndIndex").val()+'" />\n';
        if((showStereoPane==1||showStereoPane==2)&&!resolution&&!ss_locs){
            content += '<Parameter name="stereo_cine_file" type="string" value="'+cinePathRight+'" />\n';
        }
    }
    content += '</ParameterList>\n';
    fs.writeFile(fileName, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message)
         }
        consoleMsg('input.xml file has been successfully saved');
        writeParamsFile(only_write,resolution,ss_locs);
    });
}

function writeBestFitFile() {
    if(!$("#bestFitCheck")[0].checked||$("#analysisModeSelect").val()!="subset"||showStereoPane!=1) return;
    var bestFitShapes = getPlotlyShapes('bestFitLine');
    if(bestFitShapes.length==0) return;
    var bestFitFile = fullPath('','best_fit_plane.dat');
    consoleMsg('writing best fit plane file ' + bestFitFile);
    var BFcontent = '';
    BFcontent += '# origin of the coordinate system\n';
    BFcontent += Math.floor(bestFitShapes[0].x0) + ' ' + Math.floor(bestFitShapes[0].y0) + '\n'
    BFcontent += '# point on the axis \n';
    BFcontent += Math.floor(bestFitShapes[0].x1) + ' ' + Math.floor(bestFitShapes[0].y1);
    if($("#bestFitYAxisCheck")[0].checked){
        BFcontent += ' YAXIS ';
    }
    BFcontent += '\n';
    fs.writeFile(bestFitFile, BFcontent, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message)
        }
        consoleMsg('best_fit_plane.dat file has been successfully saved');
    });
}

function writeLivePlotsFile() {
    if($("#analysisModeSelect").val()!="subset") return;
    var data = document.getElementById("plotlyViewerLeft").data;
    if(!data) return;
    var livePlotPtsTraceId = data.findIndex(obj => { 
        return obj.name === "livePlotPts";
    });
    console.log('writeLivePlotsFile(): livePlotPtsTraceId ' + livePlotPtsTraceId);
    if(livePlotPtsTraceId<0) return;
    var x = data[livePlotPtsTraceId].x;
    var y = data[livePlotPtsTraceId].y;
    var lineShapes = getPlotlyShapes('livePlotLine');
    if(lineShapes.length>1){
        alert('error ocurred in determining live plot line shapes');
    }
    if(x.length > 0||lineShapes.length==1){
        var livePlotFile = fullPath('','live_plot.dat');
        console.log('writing live plot data file ' + livePlotFile);
        var LPcontent = '';
        LPcontent += '# two numbers is a point four numbers is a line\n';
        for(var i=0;i<x.length;++i){
            LPcontent += x[i] + ' ' + y[i] + '\n'
        }
        if(lineShapes.length==1)
            LPcontent += Math.floor(lineShapes[0].x0) + ' ' + Math.floor(lineShapes[0].y0) + 
            ' ' + Math.floor(lineShapes[0].x1) + ' ' + Math.floor(lineShapes[0].y1) + '\n'
        // TODO should we allow multiple lines?
        fs.writeFile(livePlotFile, LPcontent, function (err) {
            if(err){
                 alert("Error: an error ocurred creating the file "+ err.message)
            }
            consoleMsg('live_plot.dat file has been successfully saved');
        });
    }
}


function writeParamsFile(only_write,resolution,ss_locs) {
    // delete the best_fit_plane.dat file if it exists
    var fileName = fullPath('','best_fit_plane.dat');
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            fs.unlink(fileName, (err) => {
                if (err) throw err;
                console.log('successfully deleted '+fileName);
            });
            updateResultsFilesList();
            writeBestFitFile();
            // create a best_fit_plane.dat file if requested
        }else{
            writeBestFitFile();
        }
    });
    // delete the live_plot.dat file if it exists
    var LPFileName = fullPath('','live_plot.dat');
    fs.stat(LPFileName, function(err, stat) {
        if(err == null) {
            fs.unlink(LPFileName, (err) => {
                if (err) throw err;
                console.log('successfully deleted '+LPFileName);
            });
            updateResultsFilesList();
            writeLivePlotsFile();
        }else{
            writeLivePlotsFile();
        }
    });
    
    var paramsFile = fullPath('','params.xml');
    consoleMsg('writing parameters file ' + paramsFile);
    var content = '';
    content += '<!-- Auto generated parameters file from DICe GUI -->\n';
    content += '<ParameterList>\n';
    if(resolution){
        // add estimate spatial resoltion options
        content += '<Parameter name="estimate_resolution_error" type="bool" value="true" />\n';
        content += '<Parameter name="estimate_resolution_error_min_period" type="double" value="10.0" />\n';
        content += '<Parameter name="estimate_resolution_error_period_factor" type="double" value="0.73" />\n';
        content += '<Parameter name="estimate_resolution_error_min_amplitude" type="double" value="1.0" />\n';
        content += '<Parameter name="estimate_resolution_error_max_amplitude" type="double" value="1.0" />\n';
        content += '<Parameter name="estimate_resolution_error_amplitude_step" type="double" value="1.0" />\n';
    }
    if($("#analysisModeSelect").val()=="tracking"&&showStereoPane==1){ // signifies tracklib
        content += '<Parameter name="thresh_left" type="int" value="' + parseInt($("#threshLeft").val()) +'" />\n';
        content += '<Parameter name="thresh_right" type="int" value="' + parseInt($("#threshRight").val()) +'" />\n';
        content += '<Parameter name="min_area" type="int" value="' + parseInt($("#minArea").val()) +'" />\n';
        content += '<Parameter name="max_area" type="int" value="' + parseInt($("#maxArea").val()) +'" />\n';
        if(parseInt($("#minPtsPerTrack").val())<2){
            alert('min pts per track must be 2 or larger');
            endProgress(false);
            return;
        }
        content += '<Parameter name="min_pts_per_track" type="int" value="' + parseInt($("#minPtsPerTrack").val()) +'" />\n';
        if(parseInt($("#maxTrackGap").val())<1){
            alert('max track gap must be 1 or larger');
            endProgress(false);
            return;
        }
        content += '<Parameter name="max_track_gap" type="int" value="' + parseInt($("#maxTrackGap").val()) +'" />\n';
        content += '<Parameter name="max_pt_density" type="double" value="';
        if($("#maxPtDensity").val().includes('.')){
            content += $("#maxPtDensity").val();
        }else{
            content += $("#maxPtDensity").val()  +'.0';
        }
        content += '" />\n';
        content += '<Parameter name="colocation_tol" type="double" value="';
        if($("#colocationTol").val().includes('.')){
            content += $("#colocationTol").val();
        }else{
            content += $("#colocationTol").val()  +'.0';
        }
        content += '" />\n';
        content += '<Parameter name="match_tol" type="double" value="';
        if($("#matchTol").val().includes('.')){
            content += $("#matchTol").val();
        }else{
            content += $("#matchTol").val()  +'.0';
        }
        content += '" />\n';
        content += '<Parameter name="cross_match_tol" type="double" value="';
        if($("#crossMatchTol").val().includes('.')){
            content += $("#crossMatchTol").val();
        }else{
            content += $("#crossMatchTol").val()  +'.0';
        }
        content += '" />\n';
        content += '<Parameter name="neighbor_radius" type="double" value="';
        if($("#neighborRadius").val().includes('.')){
            content += $("#neighborRadius").val();
        }else{
            content += $("#neighborRadius").val()  +'.0';
        }
        content += '" />\n';
        var numBackgroundFrames = parseInt($("#numBackgroundFrames").val());
        if(numBackgroundFrames<0||numBackgroundFrames > ($("#cineEndIndex").val()-$("#cineStartIndex").val())){
            alert('warning: invalid num background frames (needs to be an integer value between 0 and the total num frames in the cine file)\nSetting num background frames to 0');
            numBackgroundFrames = 0;
            $("#numBackgroundFrames").val(0);
        }
        content += '<Parameter name="num_background_frames" type="int" value="' + numBackgroundFrames +'" />\n';
    }else{
        content += '<Parameter name="interpolation_method" type="string" value="KEYS_FOURTH" />\n';
        if($("#analysisModeSelect").val()=="subset"){
            var validShapeFunctions = false;
            content += '<Parameter name="sssig_threshold" type="double" value="'+$("#sssigThresh").val()+'" />\n';
            content += '<Parameter name="optimization_method" type="string" value="GRADIENT_BASED" />\n';
            var initMode = $("#initSelect").val();
            if(initMode=="featureMatching"){
                content += '<Parameter name="initialization_method" type="string" value="USE_FEATURE_MATCHING" />\n';
            }
            if(initMode=="featureMatchingWThresh"){
                content += '<Parameter name="initialization_method" type="string" value="USE_FEATURE_MATCHING" />\n';
                content += '<Parameter name="threshold_block_size" type="int" value="' + $("#threshBlockSize").val() + '" />\n';
            }
            else if(initMode=="fieldValues"){
                content += '<Parameter name="initialization_method" type="string" value="USE_FIELD_VALUES" />\n';
            }
            else if(initMode=="imageRegistration"){
                content += '<Parameter name="initialization_method" type="string" value="USE_IMAGE_REGISTRATION" />\n';
            }
            else if(initMode=="neighborValues"){
                content += '<Parameter name="initialization_method" type="string" value="USE_NEIGHBOR_VALUES" />\n';
            }
            if($("#translationCheck")[0].checked){
                validShapeFunctions = true;
                content += '<Parameter name="enable_translation" type="bool" value="true" />\n';
            }else{
                content += '<Parameter name="enable_translation" type="bool" value="false" />\n';
            }
            if($("#rotationCheck")[0].checked){
                validShapeFunctions = true;
                content += '<Parameter name="enable_rotation" type="bool" value="true" />\n';
            }else{
                content += '<Parameter name="enable_rotation" type="bool" value="false" />\n';
            }
            if($("#normalStrainCheck")[0].checked){
                validShapeFunctions = true;
                content += '<Parameter name="enable_normal_strain" type="bool" value="true" />\n';
            }else{
                content += '<Parameter name="enable_normal_strain" type="bool" value="false" />\n';
            }  
            if($("#shearStrainCheck")[0].checked){
                validShapeFunctions = true;
                content += '<Parameter name="enable_shear_strain" type="bool" value="true" />\n';
            }else{
                content += '<Parameter name="enable_shear_strain" type="bool" value="false" />\n';
            }
            if($("#strainCheck")[0].checked){
                content += '<ParameterList name="post_process_vsg_strain">\n';
                content += '<Parameter name="strain_window_size_in_pixels" type="int" value="'+$("#strainGaugeSize").val()+'" />\n';
                content += '</ParameterList>\n';
            }
            if(!validShapeFunctions){
                alert('Error: no shape functions selected');
                return;
            }
        }else if($("#analysisModeSelect").val()=="global"){
            content += '<Parameter name="max_solver_iterations_fast" type="int" value="500" />\n';
            content += '<Parameter name="global_solver" type="string" value="gmres_solver" />\n';
            content += '<Parameter name="global_formulation" type="string" value="horn_schunck" />\n';
            content += '<Parameter name="global_regularization_alpha" type="double" value="'+$("#regularizationConstant").val()+'" />\n';
            if($("#elementTypeSelect").val()=="TRI3"){
                content += '<Parameter name="global_element_type" type="string" value="TRI3" />\n';
            }else{
                content += '<Parameter name="global_element_type" type="string" value="TRI6" />\n';
            }
        }else{ // assume tracking at this point
            content += '<Parameter name="use_tracking_default_params" type="bool" value="true" />\n';
            content += '<Parameter name="normalize_gamma_with_active_pixels" type="bool" value="true" />\n';
            content += '<Parameter name="filter_failed_cine_pixels" type="bool" value="true" />\n';
            content += '<Parameter name="use_search_initialization_for_failed_steps" type="bool" value="true" />\n';
            content += '<Parameter name="obstruction_skin_factor" type="double" value="1.0" />\n';
            if($("#optModeSelect").val()=="simplex"){
                content += '<Parameter name="optimization_method" type="string" value="SIMPLEX" />\n';
                content += '<Parameter name="compute_image_gradients" type="bool" value="false" />\n';
            }else{
                content += '<Parameter name="compute_image_gradients" type="bool" value="true" />\n';
                content += '<Parameter name="optimization_method" type="string" value="GRADIENT_BASED_THEN_SIMPLEX" />\n';
            }
        }
        if($("#filterCheck")[0].checked){
            content += '<Parameter name="gauss_filter_images" type="bool" value="true" />\n';
            content += '<Parameter name="gauss_filter_mask_size" type="int" value="'+$("#filterSize").val()+'" />\n';
        }
        content += '<Parameter name="output_delimiter" type="string" value="," />\n'
            content += '<ParameterList name="output_spec"> \n';
        content += '<Parameter name="COORDINATE_X" type="bool" value="true" />\n';
        content += '<Parameter name="COORDINATE_Y" type="bool" value="true" />\n';
        content += '<Parameter name="DISPLACEMENT_X" type="bool" value="true" />\n';
        content += '<Parameter name="DISPLACEMENT_Y" type="bool" value="true" />\n';
        if((showStereoPane==1||showStereoPane==2)&&$("#analysisModeSelect").val()=="subset"||(showStereoPane==0&&$("#calibrationCheck")[0].checked)){
            content += '<Parameter name="MODEL_COORDINATES_X" type="bool" value="true" />\n';
            content += '<Parameter name="MODEL_COORDINATES_Y" type="bool" value="true" />\n';
            content += '<Parameter name="MODEL_COORDINATES_Z" type="bool" value="true" />\n';
            content += '<Parameter name="MODEL_DISPLACEMENT_X" type="bool" value="true" />\n';
            content += '<Parameter name="MODEL_DISPLACEMENT_Y" type="bool" value="true" />\n';
            content += '<Parameter name="MODEL_DISPLACEMENT_Z" type="bool" value="true" />\n';
        }
        if($("#analysisModeSelect").val()=="subset" && $("#initSelect").val()=="imageRegistration"){
            content += '<Parameter name="ROTATION_Z" type="bool" value="true" />\n';
        }
        if($("#analysisModeSelect").val()=="subset"){
            content += '<Parameter name="SIGMA" type="bool" value="true" />\n';
            content += '<Parameter name="GAMMA" type="bool" value="true" />\n';
            content += '<Parameter name="BETA" type="bool" value="true" />\n';
            content += '<Parameter name="STATUS_FLAG" type="bool" value="true" />\n';
            content += '<Parameter name="UNCERTAINTY" type="bool" value="true" />\n';
            if($("#strainCheck")[0].checked){
                content += '<Parameter name="VSG_STRAIN_XX" type="bool" value="true" />\n';
                content += '<Parameter name="VSG_STRAIN_YY" type="bool" value="true" />\n';
                content += '<Parameter name="VSG_STRAIN_XY" type="bool" value="true" />\n';
            }
        }else{
            content += '<Parameter name="ROTATION_Z" type="bool" value="true" />\n';
            content += '<Parameter name="SIGMA" type="bool" value="true" />\n';
            content += '<Parameter name="GAMMA" type="bool" value="true" />\n';
            content += '<Parameter name="BETA" type="bool" value="true" />\n';    
        }
        content += '</ParameterList>\n';
    }
    content += '</ParameterList>\n';
    fs.writeFile(paramsFile, content, function (err) {
        if(err){
            alert("Error: an error ocurred creating the file "+ err.message)
         }
        consoleMsg('params.xml file has been successfully saved');
        writeSubsetFile(only_write,resolution,ss_locs);
    });
}

function writeSubsetFile(only_write,resolution,ss_locs){

    if($("#analysisModeSelect").val()=="tracking"&&showStereoPane==1){ // for tracklib, no subset file needs to be written
        callDICeExec(resolution,ss_locs);
        return;
    }
    
    var subsetFile = fullPath('','subset_defs.txt');
    consoleMsg('writing subset file ' + subsetFile);

    var pathShapes = getPlotlyShapes('ROI');
    var numROIs = pathShapes.length;
    var excludedShapes = getPlotlyShapes('excluded');
    var numExcluded = excludedShapes.length;
    
    var content = '';
    content += '# Auto generated subset file from DICe GUI\n';

    var subsetCoordinates = getSubsetCoordinatesTrace();
    var numSubsets = 0;
    if(subsetCoordinates.x)
        numSubsets = subsetCoordinates.x.length;
    if(numSubsets>0){
        if($("#analysisModeSelect").val()=="global"){
          alert('Custom subset locations cannot be defined for global method.');
          endProgress(false);
          return;
        }
        content += 'begin subset_coordinates\n';
        for(i = 0; i < numSubsets; i++) {
            content += subsetCoordinates.x[i] + ' ' + subsetCoordinates.y[i] + '\n';
        }
        content += 'end subset_coordinates\n';
    }

    if(($("#analysisModeSelect").val()=="subset"||$("#analysisModeSelect").val()=="global")&&numROIs>0){
        // in this case the pathshapes define an ROI, not conformal subsets
        content += 'begin region_of_interest\n';
        content += '  begin boundary\n';
        for(var i=0;i<numROIs;++i){
            content += '    begin polygon\n';
            content += '      begin vertices\n';
            var points = pathShapeToPoints(pathShapes[i]);
            for(var j=0;j<points.x.length;j++){
                content += '        ' +  points.x[j] + ' ' + points.y[j] + '\n';
            }
            content += '      end vertices\n';
            content += '    end polygon\n';
        }
        content += '  end boundary\n';
        
        // TODO deal with obstructued (if we decide to continue supporting this

        if(numExcluded>0){
            content += '  begin excluded\n';
            for(var i = 0; i < numExcluded; i++) {
                content += '    begin polygon\n';
                content += '      begin vertices\n';
                var points = pathShapeToPoints(excludedShapes[i]);
                for(var j=0;j<points.x.length;j++){
                    content += '        ' +  points.x[j] + ' ' + points.y[j] + '\n';
                }
                content += '      end vertices\n';
                content += '    end polygon\n';
            }
            content += '  end excluded\n';
        }
        content += 'end region_of_interest\n';
        
    }else if($("#analysisModeSelect").val()=="tracking"&&numROIs>0){ // tracking mode

        // add a polygon for each ROI
        for(var i = 0; i < numROIs; i++) {
            content += 'begin conformal_subset\n';
            content += '  subset_id ' + i + '\n';
            content += '  begin boundary\n';
            content += '    begin polygon\n'; 
            content += '      begin vertices\n';
            var points = pathShapeToPoints(pathShapes[i]);
            for(var j=0;j<points.x.length;j++){
                content += '        ' +  points.x[j] + ' ' + points.y[j] + '\n';
            }
            content += '      end vertices\n';
            content += '    end polygon\n';
            content += '  end boundary\n';
            
            // TODO deal with obstructed
            
            // excluded
            var hasExcluded = false;
            for(var j = 0; j < numExcluded; j++) {
                var excludedId = parseInt(excludedShapes[j].name.split('_').pop());
                if(excludedId == i)
                    hasExcluded = true;
            }
            if(hasExcluded){
                content += '  begin excluded\n';
            }
            for(var j = 0; j < numExcluded; j++) {
                var excludedId = parseInt(excludedShapes[j].name.split('_').pop());
                if(excludedId == i){
                    content += '    begin polygon\n'; 
                    content += '      begin vertices\n';
                    var points = pathShapeToPoints(excludedShapes[j]);
                    for(var k=0;k<points.x.length;k++){
                        content += '        ' +  points.x[k] + ' ' + points.y[k] + '\n';
                    }
                    content += '      end vertices\n';
                    content += '    end polygon\n';
                }
            }
            if(hasExcluded){
                content += '  end excluded\n';
            }
            content += 'end conformal_subset\n';
        }
        // for each ROI add the excluded regions with the excludedAssignment = to the ROI id
        // add all obstructions to all ROIs
    }
    if(numROIs>0||subsetCoordinates.x){
        fs.writeFile(subsetFile, content, function (err) {
            if(err){
                alert("Error: an error ocurred creating the file "+ err.message)
             }
            consoleMsg('subset_defs.txt file has been successfully saved');
            if(!only_write)
                callDICeExec(resolution,ss_locs);
        });
    }else{
        if(!only_write)
            callDICeExec(resolution,ss_locs);
    }
}

function checkValidInput() {
//    consoleMsg('checking if input requirements met to enable running DICe ...');
    var validInput = true;
    var enableCross = true;
    //var enableResolution = true;
    var isSequence = $("#fileSelectMode").val()=='sequence';
    var isCine =  $("#fileSelectMode").val()=='cine';
    var isList = $("#fileSelectMode").val()=='list';
    var isStereo = showStereoPane==1||showStereoPane==2;
    var calRequired = isStereo || $("#calibrationCheck")[0].checked;
    
    // clear the ul and add relevant items for this type of analysis
    $("#taskList").empty();
    if(isList){
        $("#taskList").append('<li id=\"listLoadRefLi\" class=\"task-list-item\";>load ref image</li>');
        $("#taskList").append('<li id=\"listLoadDefLi\" class=\"task-list-item\";>load def image(s)</li>');
        if(isStereo){
            $("#taskList").append('<li id=\"listLoadStereoRefLi\" class=\"task-list-item\";>load stereo ref image</li>');
            $("#taskList").append('<li id=\"listLoadStereoDefLi\" class=\"task-list-item\";>load stereo def image(s)</li>');
        }
    }else if(isSequence){
        $("#taskList").append('<li id=\"seqLoadLi\" class=\"task-list-item\";>load image sequence</li>');
    }else if(isCine){
        $("#taskList").append('<li id=\"cineLoadLi\" class=\"task-list-item\";>load cine</li>');
        if(isStereo){
            $("#taskList").append('<li id=\"cineLoadStereoLi\" class=\"task-list-item\";>load stereo cine</li>');
        }
    }
    if(calRequired)
        $("#taskList").append('<li id=\"loadCalLi\" class=\"task-list-item\";>perform or load cal</li>');
    // catch tracking with no ROIs defined
    if($("#analysisModeSelect").val()=="tracking"&&!isStereo){
        $("#taskList").append('<li id=\"defineROIsLi\" class=\"task-list-item\";>define tracking subsets</li>');
      var ROIShapes = getPlotlyShapes('ROI');
      var numROIs = ROIShapes.length;
      if(numROIs<=0){
          $('#defineROIsLi').removeClass('task-list-item-done');
          validInput = false;
      }else
          $('#defineROIsLi').addClass('task-list-item-done');
    }
    if(calRequired){
        if(!calPath || calPath=='undefined'){
            validInput = false;
            $('#loadCalLi').removeClass('task-list-item-done');
        }else
            $('#loadCalLi').addClass('task-list-item-done');
    }
    if(isCine){
        if(cinePathLeft=="undefined"){
            validInput = false;
            enableCross = false;
            $('#cineLoadLi').removeClass('task-list-item-done');
        }else{
            $('#cineLoadLi').addClass('task-list-item-done');
        }
        if(isStereo){
            if(cinePathRight=="undefined"){
                validInput = false;
                enableCross = false;
                $('#cineLoadStereoLi').removeClass('task-list-item-done');
            }else
                $('#cineLoadStereoLi').addClass('task-list-item-done');
        }
    }
    else if(isSequence){
        // see if the left reference image is set:
        if(refImagePathLeft=='undefined'||!defImagePathsLeft[0]) {
//            consoleMsg('left reference image not set yet');
            validInput = false;
            enableCross = false;
            $('#seqLoadLi').removeClass('task-list-item-done');
        }else
            $('#seqLoadLi').addClass('task-list-item-done');
        // nothing really changes for is stereo for sequence
    }
    else{ // assume list
        // see if the left reference image is set:
        if(refImagePathLeft=='undefined') {
//            consoleMsg('left reference image not set yet');
            validInput = false;
            enableCross = false;
            $('#listLoadRefLi').removeClass('task-list-item-done');
        }else
            $('#listLoadRefLi').addClass('task-list-item-done');
            
        // TODO check that the image extensions all match?
        //var refExtension = refImagePathLeft.split('.').pop().toLowerCase();
        if(!defImagePathsLeft[0]){
//            consoleMsg('deformed images have not been defined yet');
            validInput = false;
            $('#listLoadDefLi').removeClass('task-list-item-done');
        }else
            $('#listLoadDefLi').addClass('task-list-item-done');
        // see if the right reference image is set:
        if(isStereo){
            console.log(refImagePathRight);
            if(refImagePathRight=='undefined') {
                enableCross = false;
//                consoleMsg('right reference image not set yet');
                validInput = false;
                $('#listLoadStereoRefLi').removeClass('task-list-item-done');
            }else
                $('#listLoadStereoRefLi').addClass('task-list-item-done');
            if(!defImagePathsRight[0]){
//                consoleMsg('right deformed images have not been defined yet');
                validInput = false;
                $('#listLoadStereoDefLi').removeClass('task-list-item-done');
            }else
                $('#listLoadStereoDefLi').addClass('task-list-item-done');
        }
    } // end list file input
        
        
    // TODO see if the left and right ref have the same dimensions
    // TODO check the number of def images left and right

    if(validInput){
        $("#runLi").show();
        $("#writeLi").show();
//        consoleMsg("input requirements successful");
    }else{
        $("#runLi").hide();
        $("#writeLi").hide();
    }
    if(enableCross){
        $("#previewCross").show();
        $("#initCross").show();
    }else{
        $("#previewCross").hide();
        $("#initCross").hide();
    }
}
