google.charts.load('current', {'packages':['corechart','line']});
//google.charts.setOnLoadCallback(livePlotLineRepeat);

//window.addEventListener('resize', livePlotLine());

var nIntervIdLine;
var firstPlotLine = true;
var dataTablesLine = [];
var dataObjsLine = [];
var plotlyDataObjsLine = [];
var currentTableLine = 0;
var plottingPausedLine = false;
var currentVAxisMax = 0;
var currentVAxisMin = 0;
var chartOptionsLine = {
    hAxis: {title:'Arc-length'},
    vAxis: {title:'Value'},
    legend: 'right',
    explorer: {},
};

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
    plotPlotlyLineDataTable();
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
    $('#stepSelect option:selected').next().attr('selected', 'selected');
    $('#stepSelect').trigger('change');
});

$('#stepBackward').click(function() {
    $('#stepSelect option:selected').prev().attr('selected', 'selected');
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
    plotlyDataObjsLine = [];
    var promisePlotly = fileToPlotlyDataObj(lineFile,plotlyDataObjsLine);
    promisePlotly.then(function(response) {
    if(response[0]=="plotly file read failed!"||response=="plotly file read failed!"){
        console.log('plotly failed to load live_plot_line files');
        return;
    }
        console.log("fileToPlotlyDataObj succeeded!", response);
//        dataObjsToLineDataTables(dataObjsLine,dataTablesLine);
        if(firstPlotLine){
            for(i=0;i<plotlyDataObjsLine[0].headings.length;++i){
                var liID = "li_livePlotLine_" + i;
                var liTitle = plotlyDataObjsLine[0].headings[i];
                console.log('liID is ' + liID + ' liTitle is ' + liTitle);
                $("#livePlotLineFieldSelect").append(new Option(liTitle, liID));
            }
            firstPlotLine = false;
        }
        plotPlotlyLineDataTable();
    },function(error) {
        console.error("fileToPlotlyDataObj failed!", error);
    });
    
    

//    dataObjsLine = [];
//    var promise = fileToDataObj(lineFile,dataObjsLine);
//    promise.then(function(response) {
//        if(response[0]=="file read failed!"||response=="file read failed!"){
//            console.log('failed to load live_plot_line files');
//            return;
//        }
//        console.log("fileToDataObj succeeded!", response);
//        dataObjsToLineDataTables(dataObjsLine,dataTablesLine);
//        if(firstPlotLine){
//            for(i=0;i<dataTablesLine.length;++i){
//                var liID = "li_livePlotLine_" + i;
//                var liTitle = dataObjsLine[0].headings[i];
//                $("#livePlotLineFieldSelect").append(new Option(liTitle, liID));
//            }
//            firstPlotLine = false;
//        }
//        plotLineDataTable();
//    },function(error) {
//        console.error("fileToDataObj failed!", error);
//    });    
}

function plotPlotlyLineDataTable(){
    // clear the divs and clear the plots
    $('#livePlotLine').empty();
    // create a div on the page:
    var divID = "div_livePlotLine_" + currentTableLine;
    
    $("#livePlotLine").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlotLine_" + currentTableLine;
    var liTitle = plotlyDataObjsLine[0].headings[currentTableLine];
    
    var layout = {
            xaxis: {
                title: {
                    text: 'Arc-length along line (px)',
                },
            },
            yaxis: {
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
    
    
    
    var plotlyData = {x:[],y:[],type:'scatter'};
    plotlyData.x = plotlyDataObjsLine[0].data[0];
    plotlyData.y = plotlyDataObjsLine[0].data[currentTableLine];
    Plotly.plot(document.getElementById(divID),[plotlyData],layout);
}

function plotLineDataTable(){
    // clear the divs and clear the plots
    $('#livePlotLine').empty();
    // create a div on the page:
    var divID = "div_livePlotLine_" + currentTableLine;
    $("#livePlotLine").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlotLine_" + currentTableLine;
    var liTitle = dataObjsLine[0].headings[currentTableLine];

    //chartOptionsLine.hAxis.title = 'Arc-length';
    //chartOptionsLine.vAxis.title = liTitle;
    //var view = new google.visualization.DataView(dataTablesLine[currentTableLine]);
    //var wrapper = new google.visualization.ChartWrapper({
    //    chartType: 'LineChart',
    //    containerId: divID,
    //    options: chartOptionsLine,
    //    dataTable: view
    //});
    //google.visualization.events.addListener(wrapper, 'ready', function(){
    //    //alert("minvalue " + chartOptionsLine.vAxis.minValue);
    //   alert('Min ViewWindow: ' + wrapper.getOption('vAxis.viewWindow.min') + ', Max: ' + wrapper.getOption('vAxis.viewWindow.max'));
    //});     
    //wrapper.draw();
    
    var chart = new google.visualization.LineChart(document.getElementById(divID));
    chartOptionsLine.hAxis.title = 'Arc-length';
    chartOptionsLine.vAxis.title = liTitle;
    //chartOptionsLine.vAxis.viewWindow.max = 'auto';
    //chartOptionsLine.vAxis.viewWindow.min = 'auto';

    if($("#fixAxisCheck")[0].checked&&!(currentVAxisMax==0&&currentVAxisMin==0)){
        //chartOptionsLine.vAxis.maxValue = currentVAxisMax;
        //chartOptionsLine.vAxis.minValue = currentVAxisMin;
        chartOptionsLine.vAxis.viewWindow = {max:currentVAxisMax, min:currentVAxisMin};
    }
    else{
        chartOptionsLine.vAxis.viewWindow = {max:'auto', min:'auto'};
    }
    var view = new google.visualization.DataView(dataTablesLine[currentTableLine]);
    google.visualization.events.addListener(chart, 'ready', function(){
        //alert("minvalue " + chartOptionsLine.vAxis.minValue);
        //alert('Min ViewWindow: ' + chart.getChart().getOption('vAxis.viewWindow.min') + ', Max: ' + chart.getChart().getOption('vAxis.viewWindow.max'));
        if(!$("#fixAxisCheck")[0].checked){
            var top = chart.getChartLayoutInterface().getChartAreaBoundingBox().top;
            var bottom = top + chart.getChartLayoutInterface().getChartAreaBoundingBox().height;
            currentVAxisMax = chart.getChartLayoutInterface().getVAxisValue(top);
            currentVAxisMin = chart.getChartLayoutInterface().getVAxisValue(bottom);
        }
    }); 
    chart.draw(view, chartOptionsLine);
    //chart.draw(dataTablesLine[currentTableLine],chartOptionsLine);
}
