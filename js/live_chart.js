google.charts.load('current', {'packages':['corechart','line']});
google.charts.setOnLoadCallback(liveChartRepeat);


var nIntervId;
 
function liveChartRepeat() {
    drawLiveChart();
    nIntervId = setInterval(drawLiveChart, 5000);
}
  
//function stopTextColor() {
//  clearInterval(nIntervId);
//}

function drawLiveChart () {

    var chart = new google.visualization.LineChart(document.getElementById('liveChart'));
    var chartOptions = {
        title: 'LIVE CHART',
        hAxis: {title:'Step'},
        vAxis: {title:'Value'},
        legend: 'right',
        explorer: {},
    };

    // check that all the local storage items are set properly:
    if(localStorage.getItem("workingDirectory") === null||
       localStorage.getItem("liveChartFiles") === null ||
       localStorage.getItem("liveChartColumns") === null||
       localStorage.getItem("liveChartXTitle") === null ||
       localStorage.getItem("liveChartYTitle") === null ){
        alert("Error, not all the required local storage variables are set");
    }   
    
    // list the files selected
    var liveChartFiles = localStorage.getItem("liveChartFiles");
    // split the string up into separate files
    var liveChartFilesArray = liveChartFiles.split(/\s+/g);
    // read the columns to plot, first is always the x column, next are y cols
    var liveChartColumns = localStorage.getItem("liveChartColumns");
    var liveChartColumnsArray = liveChartColumns.split(/\s+/g);
    // make sure the arrays are not size 0
    if(liveChartFilesArray.length < 1){
        alert("Error, no results files specified");
    }
    if(liveChartColumnsArray.length != 2){
        alert("Error, improper number of columns specified");
    }
    var xCol = liveChartColumnsArray[0]; // -1 means count by ones
    var yCol = liveChartColumnsArray[1];
    var xTitle = localStorage.getItem("liveChartXTitle");
    var yTitle = localStorage.getItem("liveChartYTitle");
    chartOptions.title = yTitle + " vs " + xTitle;
    chartOptions.hAxis.title = xTitle;
    chartOptions.vAxis.title = yTitle;

    var chartData = new google.visualization.DataTable();
    chartData.addColumn('number', xTitle);
    for(i=0;i<liveChartFilesArray.length;++i){
        chartData.addColumn('number', yTitle + "_" + i);
    }

    // NOTE: this assumes that all files have the same number of rows and the rows for each correspond to the same step
    
    for(i=0;i<liveChartFilesArray.length;++i){
        var resFile = localStorage.getItem("workingDirectory");
        if(os.platform()=='win32'){
            resFile += '\\test_charts\\';
        }else{
            resFile += '/test_charts/';
        }
        resFile += liveChartFilesArray[i];
        //alert("live chart file: " + resFile);
        if(i==liveChartFilesArray.length-1)
            addResultToChart(i,resFile,chartData,xCol,yCol,updateChart);
        else
            addResultToChart(i,resFile,chartData,xCol,yCol);
    }

    function updateChart(){
        chart.draw(chartData,chartOptions);
    }
}

// function to convert a text file to a set of data points
function addResultToChart (index,resFile,data,xCol,yCol,cb) {
    cb = cb || $.noop;
    //alert("reading file" + resFile);
    fs.stat(resFile, function(err, stat) {                                
        if(err == null) {                                     
            fs.readFile(resFile, 'utf8', function (err,dataS) {                                       
                if (err) {                                                                                    
                    return console.log(err);                                                                  
                }
                var resDataLines = dataS.toString().split(/\r?\n/);
                var resData = [];
                for(i=0;i<resDataLines.length;++i){
                    var thisLineSplit = resDataLines[i].split(/[ ,]+/);        
                    // get rid of any lines of data that are non-numeric
                    if(!isNaN(thisLineSplit[0]))
                        resData.push(resDataLines[i].split(/[ ,]+/).map(Number));
                }
                if(resData[0].length<xCol||resData[0].length<yCol){
                    alert("Error, invalid data column");
                    return;
                }
                for(i=0;i<resData.length-1;++i){
                    if(data.getNumberOfRows()<=i){
                        data.addRow();
                    }
                    if(xCol<0&&index==0){
                        data.setCell(i,0,i);
                    }else if(index==0){
                        data.setCell(i,0,resData[i][xCol]);
                    }
                    data.setCell(i,index+1,resData[i][yCol]);
                }
                cb();
           });
        } // end null
        else{
            // fail quietly if the file does not exist
            //alert("could not read results file: " + resFile);
            //return;
        }   
    }); // end stat    
} // end function


