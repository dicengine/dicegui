google.charts.load('current', {'packages':['corechart','line']});
google.charts.setOnLoadCallback(livePlotRepeat);

var nIntervId;
var firstPlot = true;
var dataTables = [];
var dataObjs = [];
var currentTable = 0;
var chartOptions = {
    hAxis: {title:'Step'},
    vAxis: {title:'Value'},
    legend: 'right',
    explorer: {},
};    

function livePlotRepeat() {

    var workingDir = localStorage.getItem("workingDirectory");
    var fileNameStr = localStorage.getItem("livePlotFiles"); 
    var fileNames = fileNameStr.split(/[ ,]+/);
    for(i=0;i<fileNames.length;++i)
        if(os.platform()=='win32'){
            fileNames[i] = workingDir + '\\' +fileNames[i]; 
        }else{
            fileNames[i] = workingDir + '/' +fileNames[i]; 
        }
    var lineFile = localStorage.getItem("livePlotLineFile");
    if(os.platform()=='win32'){
        lineFile = workingDir + '\\' + lineFile; 
    }else{
        lineFile = workingDir + '/' + lineFile; 
    }
    console.log('livePlot point filenames' + fileNames);
    console.log('livePlot line filename' + lineFile);
    livePlot(fileNames);
    nIntervId = setInterval(function(){livePlot(fileNames);}, 5000);
}

function stopLivePlot() {
  clearInterval(nIntervId);
}

$("#livePlotUL").on('click', 'li', function() {
    currentTable = Number($(this).attr('id').split("_").pop());
    plotDataTable();
});

function livePlot(fileNames){
    dataObjs = [];
    var promises = [];
    for(fileIt=0;fileIt<fileNames.length;++fileIt){
        var promise = fileToDataObj(fileNames[fileIt],dataObjs);
        promises.push(promise);
    }
    Promise.all(promises).then(function(response) {
        if(response[0]=="file read failed!"||response=="file read failed!"){
            console.log('failed to load live_plot files');
            return;
        }
        console.log("fileToDataObj succeeded!", response);
        dataObjsToDataTables(dataObjs,dataTables);
        var firstValidIndex = getFirstValidIndex(dataObjs);
        if(firstPlot){
            for(i=0;i<dataTables.length;++i){
                var liID = "li_livePlot_" + i;
                var liTitle = dataObjs[firstValidIndex].headings[i];
                $("#livePlotUL").append('<li id="' + liID + '" class="action-li plot_li"><span>' + liTitle + '</span></li>');
            }
            firstPlot = false;
        }
        plotDataTable();
    },function(error) {
        console.error("fileToDataObj failed!", error);
    });
}

function plotDataTable(){
    // clear the divs and clear the plots
    $('#livePlots').empty();    
    // create a div on the page:
    var divID = "div_livePlot_" + currentTable;
    $("#livePlots").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlot_" + currentTable;
    var firstValidIndex = getFirstValidIndex(dataObjs);
    var liTitle = dataObjs[firstValidIndex].headings[currentTable];
    var chart = new google.visualization.LineChart(document.getElementById(divID));
    chartOptions.hAxis.title = 'Step';
    chartOptions.vAxis.title = liTitle;
    // turn off the empty columns
    var view = new google.visualization.DataView(dataTables[currentTable]);
    var hideCols = [];
    for(i=0;i<dataObjs.length;++i){
        if(dataObjs[i].initialized) continue;
        var suffixAndExt = dataObjs[i].fileName.split("_").pop();
        var suffix = suffixAndExt.substr(0, suffixAndExt.indexOf('.'));
        var col = Number(suffix) + 1;
        hideCols.push(col);
    }
    view.hideColumns(hideCols); //here you set the columns you want to display
    chart.draw(view, chartOptions);
    //chart.draw(dataTables[currentTable],chartOptions);
}