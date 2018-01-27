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
        console.log("fileToDataObj succeeded!", response);
        dataObjsToDataTables(dataObjs,dataTables);
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

function fileToDataObj(file,dataObjs) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        console.log("reading file " + file);
        var obj = {fileName:file,headings:[],data:[],initialized:false}
        fs.stat(file, function(err, stat) {
            if(err == null) {                                     
                fs.readFile(file, 'utf8', function (err,dataS) {                                       
                    if (err) {                                                                                    
                        return console.log(err);                                                                  
                    }
                    var resDataLines = dataS.toString().split(/\r?\n/);
                    var foundHeaders = false;
                    var prevLine;
                    for(i=0;i<resDataLines.length;++i){
                        var thisLineSplit = resDataLines[i].split(/[ ,]+/);
                        if(thisLineSplit[thisLineSplit.length-1]=='') // remove effects of trailing commas if they exist
                            thisLineSplit.splice(thisLineSplit.length-1,1);
                        // if(thisLineSplit[0]=='#')continue;
                        // if this is the column headings then append them
                        if(isNaN(thisLineSplit[0])){
                            prevLine = thisLineSplit;
                            continue;
                        }
                        else if(foundHeaders) // if the header row has already been found read a line of data
                            obj.data.push(thisLineSplit.map(Number));
                            //obj.data.push(resDataLines[i].split(/[ ,]+/).map(Number)); 
                        else{ // read the previous line as the header and decrement i
                            foundHeaders = true;
                            if(i>=1){
                                //console.log('prevLine ' + prevLine);
                                obj.headings = prevLine;
                                //obj.headings = resDataLines[i-1].split(/[ ,]+/);
                            }
                            i--;
                        }
                        prevLine = thisLineSplit;
                    }
                    obj.initialized = true;
                    console.log('file read is successful ' + file);
                    dataObjs.push(obj);
                    resolve('file read success!');
                });
            }// end null
            else{ // always resolve ...
                dataObjs.push(obj);
                console.log('file read failed ' + file);
                //resolve('file read success!');
                reject('file read failure!');        
            }
        }); // end stat
    });
}

// take an array of DataObjs and turn them into an array of data tables
function dataObjsToDataTables(dataObjs,dataTables){
    // sanity check the data
    if(dataObjs.length!=1){
        console.log('dataObjsToDataTables: error, dataObjs.length != 1');
        return;
    }
    // get the first valid dataObj
    if(dataObjs[0].data.length<=0){
        console.log('dataObjsToDataTables: error, data.length < 1')
        return;
    }
    if(dataObjs[0].headings.length<=0){
        console.log('dataObjsToDataTables: error, headings.length < 1')
        return;
    }
    if(dataObjs[0].data[0].length<=0){
        console.log('dataObjsToDataTables: error, data[0].length < 1')
        return;
    }    
    var numHeadings = dataObjs[0].headings.length;
    var numCols = dataObjs[0].data[0].length;
    var numRows = dataObjs[0].data.length;
    var headings = dataObjs[0].headings;
    var numDataTables = numHeadings;
    console.log('numHeadings ' + numHeadings + ' numCols ' + numCols + ' numRows ' + numRows + ' headings ' + headings);
    if(numCols!=numHeadings){
        console.log('dataObjsToDataTables: error, numCols!=numHeadings');
        return;
    }
    // figure out the source of the line plot
    var xSource = dataObjs[0].data[0][0];
    var ySource = dataObjs[0].data[0][1];
    for(dt=0;dt<numDataTables;++dt){
        if(dataTables.length<dt+1){
            dataTables.push(new google.visualization.DataTable());
            dataTables[dt].addColumn('number', 'Arc-length');
            dataTables[dt].addColumn('number', headings[dt]);//dataObjColIndex[obj]);
        }
        var dataTable = dataTables[dt];
        dataTable.removeRows(0,dataTable.getNumberOfRows());
        dataTable.addRows(numRows);
        //console.log('DATA TABLE SIZE ' + numRows + ' x ' + dataTables[dt].getNumberOfColumns());
        // set the x labels
        for(row=0;row<numRows;++row){
            dataTable.setCell(row,0,row);
        }
        // copy all the dataObjs data into this dataTable
        for(row=0;row<numRows;++row){
            if(dataObjs[0].initialized){
                var dx = dataObjs[0].data[row][0] - xSource;
                var dy = dataObjs[0].data[row][1] - ySource;
                var arcLength = Math.sqrt(dx*dx + dy*dy);
                dataTable.setCell(row,0,arcLength);                
                dataTable.setCell(row,1,dataObjs[0].data[row][dt]);
            }
        }
    }
}
