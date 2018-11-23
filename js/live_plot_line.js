google.charts.load('current', {'packages':['corechart','line']});
google.charts.setOnLoadCallback(livePlotLineRepeat);

var nIntervId;
var firstPlot = true;
var dataTables = [];
var dataObjs = [];
var currentTable = 0;
var plottingPaused = false;
var currentVAxisMax = 0;
var currentVAxisMin = 0;
var chartOptions = {
    hAxis: {title:'Arc-length'},
    vAxis: {title:'Value'},
    legend: 'right',
    explorer: {},
};    

function livePlotLineRepeat() {
    livePlotLine();
    nIntervId = setInterval(function(){livePlotLine();}, 5000);
}

$("#livePlotLineUL").on('click', 'li', function() {
    currentTable = Number($(this).attr('id').split("_").pop());
    plotLineDataTable();
});

// clearInterval(nIntervID);

$( "#stepSelect" ).change(function() {
    var workingDir = localStorage.getItem("workingDirectory");
    plottingPaused = true;
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
    if(plottingPaused) return;
    if(currentStep!=latestLineFileIndex)
        $('#stepSelect').val(latestLineFileIndex);
    lineFile += 'live_plot_line_step_' + latestLineFileIndex + '.txt';
    console.log('live plot line file: ' + lineFile);
    plotLine(lineFile);
}

function plotLine(lineFile){
    dataObjs = [];
    var promise = fileToDataObj(lineFile,dataObjs);
    promise.then(function(response) {
	if(response[0]=="file read failed!"||response=="file read failed!"){
	    console.log('failed to load live_plot_line files');
	    return;
	}
        console.log("fileToDataObj succeeded!", response);
        dataObjsToLineDataTables(dataObjs,dataTables);
        if(firstPlot){
            for(i=0;i<dataTables.length;++i){
                var liID = "li_livePlotLine_" + i;
                var liTitle = dataObjs[0].headings[i];
                $("#livePlotLineUL").append('<li id="' + liID + '" class="action-li plot_li"><span>' + liTitle + '</span></li>');
            }
            firstPlot = false;
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
    var divID = "div_livePlotLine_" + currentTable;
    $("#livePlotLine").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlotLine_" + currentTable;
    var liTitle = dataObjs[0].headings[currentTable];

    //chartOptions.hAxis.title = 'Arc-length';
    //chartOptions.vAxis.title = liTitle;
    //var view = new google.visualization.DataView(dataTables[currentTable]);
    //var wrapper = new google.visualization.ChartWrapper({
    //    chartType: 'LineChart',
    //    containerId: divID,
    //    options: chartOptions,
    //    dataTable: view
    //});
    //google.visualization.events.addListener(wrapper, 'ready', function(){
    //    //alert("minvalue " + chartOptions.vAxis.minValue);
    //   alert('Min ViewWindow: ' + wrapper.getOption('vAxis.viewWindow.min') + ', Max: ' + wrapper.getOption('vAxis.viewWindow.max'));
    //});     
    //wrapper.draw();
    
    var chart = new google.visualization.LineChart(document.getElementById(divID));
    chartOptions.hAxis.title = 'Arc-length';
    chartOptions.vAxis.title = liTitle;
    //chartOptions.vAxis.viewWindow.max = 'auto';
    //chartOptions.vAxis.viewWindow.min = 'auto';

    if($("#fixAxisCheck")[0].checked&&!(currentVAxisMax==0&&currentVAxisMin==0)){
        //chartOptions.vAxis.maxValue = currentVAxisMax;
        //chartOptions.vAxis.minValue = currentVAxisMin;
        chartOptions.vAxis.viewWindow = {max:currentVAxisMax, min:currentVAxisMin};
    }
    else{
        chartOptions.vAxis.viewWindow = {max:'auto', min:'auto'};
    }
    var view = new google.visualization.DataView(dataTables[currentTable]);
    google.visualization.events.addListener(chart, 'ready', function(){
        //alert("minvalue " + chartOptions.vAxis.minValue);
        //alert('Min ViewWindow: ' + chart.getChart().getOption('vAxis.viewWindow.min') + ', Max: ' + chart.getChart().getOption('vAxis.viewWindow.max'));
        if(!$("#fixAxisCheck")[0].checked){
            var top = chart.getChartLayoutInterface().getChartAreaBoundingBox().top;
            var bottom = top + chart.getChartLayoutInterface().getChartAreaBoundingBox().height;
            currentVAxisMax = chart.getChartLayoutInterface().getVAxisValue(top);
            currentVAxisMin = chart.getChartLayoutInterface().getVAxisValue(bottom);
        }
    }); 
    chart.draw(view, chartOptions);
    //chart.draw(dataTables[currentTable],chartOptions);
}
