var nIntervIdLine;
var firstPlotLine = true;
var dataTablesLine = [];
var dataObjsLine = [];
var currentTableLine = 0;
var plottingPausedLine = false;
var currentVAxisMax = 0;
var currentVAxisMin = 0;

function livePlotLineRepeat() {
    livePlotLine();
        nIntervIdLine = setInterval(function(){
            livePlotLine();
            if(!$("#runLoader").hasClass('loader')){
                clearInterval(nIntervIdLine);
            }
        }, 5000);
}

$("#livePlotLineFieldSelect").on('change',function() {
    currentTableLine = Number($("#livePlotLineFieldSelect option:selected").val().split("_").pop());
    plotLineDataTable();
});

$( "#stepSelect" ).change(function() {
    var workingDir = localStorage.getItem("workingDirectory");
    plottingPausedLine = true;
    var lineFile;
    if(os.platform()=='win32'){
        lineFile = workingDir + '\\'; 
    }else{
        lineFile = workingDir + '/'; 
    }    
    lineFile += 'live_plot_line_step_' + $(this).val() + '.txt';
    console.log('live plot line file: ' + lineFile);
    plotLine(lineFile);
});

$('#stepForward').click(function() {
    nextStep = Number($("#stepSelect option:selected").val()) + 2;
    $('#stepSelect :nth-child(' + nextStep +')').prop('selected', true); // To select via index
    $('#stepSelect').trigger('change');
});

$('#stepBackward').click(function() {
    prevStep = Number($("#stepSelect option:selected").val());
    $('#stepSelect :nth-child(' + prevStep +')').prop('selected', true); // To select via index
    $('#stepSelect').trigger('change');
});

function livePlotLine(){
    var workingDir = localStorage.getItem("workingDirectory");
    // find all the live plot line files and select the most recent one:
    var latestLineFileIndex = 0;
    var lineFile;
    if(os.platform()=='win32'){
        lineFile = workingDir + '\\'; 
    }else{
        lineFile = workingDir + '/'; 
    }
    // clear the selectable list
    var currentStep = $('#stepSelect').val();
    $('#stepSelect').empty();
    var steps = [];
    fs.readdirSync(workingDir).forEach(file => {
        // check if the file matches the syntax
        if(file.indexOf('live_plot_line_step_') !== -1){
            // grab the index of the file
            var suffixAndExt = file.split("_").pop();
            var suffix = suffixAndExt.substr(0, suffixAndExt.indexOf('.'));
            var stepID = Number(suffix);
            steps.push(stepID);
            if(stepID > latestLineFileIndex)
                latestLineFileIndex = stepID;
        }
    });
    steps.sort(function(a, b){return a-b});
    var selectOptions = [];
    for(i=0;i<steps.length;++i)
      selectOptions.push('<option value="'+ steps[i] +'">'+ steps[i] +'</option>');
    $('#stepSelect').html(selectOptions.join(''));
    $('#stepSelect').val(currentStep);
    if(plottingPausedLine) return;
    if(currentStep!=latestLineFileIndex)
        $('#stepSelect').val(latestLineFileIndex);
    lineFile += 'live_plot_line_step_' + latestLineFileIndex + '.txt';
    console.log('live plot line file: ' + lineFile);
    plotLine(lineFile);
}

function plotLine(lineFile){
    dataObjsLine = [];
    dataObjsLine.push({fileName:lineFile,roi_id:-1,headings:[],data:[],initialized:false});
    var promise = fileToDataObj(dataObjsLine,0); // should only be one line plot file
    promise.then(function(response) {
    if(response[0]=="file read failed!"||response=="file read failed!"){
        console.log('failed to load live_plot_line files');
        return;
    }
        console.log("fileToDataObj succeeded!", response);
        if(firstPlotLine){
            for(i=0;i<dataObjsLine[0].headings.length;++i){
                var liID = "li_livePlotLine_" + i;
                var liTitle = dataObjsLine[0].headings[i];
                $("#livePlotLineFieldSelect").append(new Option(liTitle, liID));
            }
            $('#livePlotLineFieldSelect :nth-child(4)').prop('selected', true); // To select via index
            currentTableLine = Number($("#livePlotLineFieldSelect option:selected").val().split("_").pop());
            firstPlotLine = false;
        }
        plotLineDataTable();
    },function(error) {
        console.error("fileToDataObj failed!", error);
    });
}

function plotLineDataTable(){
    // clear the divs and clear the plots
    $('#livePlotLine').empty();
    // create a div on the page:
    var divID = "div_livePlotLine_" + currentTableLine;
    
    $("#livePlotLine").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlotLine_" + currentTableLine;
    var liTitle = dataObjsLine[0].headings[currentTableLine];
    
    var layout = {
            xaxis: {
                title: {
                    text: 'Arc-length along line (px)',
                },
            },
            yaxis: {
//                autorange: 'true',
//                fixedrange: 'false',
                title: {
                    text: liTitle,
                }
            },
            margin: {
                l: 60,
                r: 50,
                b: 40,
                t: 10,
                pad: 4,
            },
    };
//    if($("#fixAxisCheck")[0].checked){
////        layout.yaxis.fixedrange = 'true';
//        layout.yaxis.autorange = 'false';
//    }
    var plotlyData = {x:[],y:[],type:'scatter'};
    plotlyData.x = dataObjsLine[0].data[0];
    plotlyData.y = dataObjsLine[0].data[currentTableLine];
    Plotly.plot(document.getElementById(divID),[plotlyData],layout);
}
