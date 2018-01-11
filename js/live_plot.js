google.charts.load('current', {'packages':['corechart','line']});
google.charts.setOnLoadCallback(livePlotRepeat);

var nIntervId;
var firstPlot = true;

function livePlotRepeat() {
    livePlot();
    nIntervId = setInterval(livePlot, 5000);
}

function stopLivePlot() {
  clearInterval(nIntervId);
}

$("#livePlotUL").on('click', 'li', function() {
    var n = $(this).attr('id').indexOf("_");
    var divID = '#div_' + $(this).attr('id').substring(n+1);
    // hide all the divs in the list
    $(".plot_div").each(function(){
        $(this).hide();
    });
    // show the div associated with this list item
    $(divID).show();
});

function livePlot(){

    var chartOptions = {
        hAxis: {title:'Step'},
        vAxis: {title:'Value'},
        legend: 'right',
        explorer: {},
    };    
    var dataObjs = [];
    var dataTables = [];
    var fileName = '/Users/dzturne/dice_working_dir/test_charts/DICe_solution_0_test.txt';
    fileToDataObj(fileName,dataObjs).then(function(response) {
        console.log("fileToDataObj succeeded!", response);
        dataObjsToDataTables(dataObjs,dataTables);
        // plot the tables in the html page
        
        // for each entry in the data tables, create a plot
        for(i=0;i<dataTables.length;++i){
            // create a div on the page:
            var divID = "div_livePlot_" + i;
            if(firstPlot)
                $("#livePlots").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
            var liID = "li_livePlot_" + i;
            var liTitle = dataObjs[0].headings[i];
            if(firstPlot)
                $("#livePlotUL").append('<li id="' + liID + '" class="action-li plot_li"><span>' + liTitle + '</span></li>');            
            var chart = new google.visualization.LineChart(document.getElementById(divID));
            chartOptions.hAxis.title = 'Step';
            chartOptions.vAxis.title = liTitle;
            // if the chart is hidden, show it, then draw and hide it again
            var decDivID = '#' + divID;
            if($(decDivID).is(":visible"))
                chart.draw(dataTables[i],chartOptions);
            else{
               $(decDivID).show();
               chart.draw(dataTables[i],chartOptions);
               $(decDivID).hide();
            }
            // hide all but the first div
            if(i>0 && firstPlot)
               $(decDivID).hide();
        }
        firstPlot = false;
    },function(error) {
        console.error("fileToDataObj failed!", error);
    });
}

function fileToDataObj(file,dataObjs) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // Do stuff
        var obj = {fileName:file,headings:[],data:[]}
        fs.stat(file, function(err, stat) {                                
            if(err == null) {                                     
                fs.readFile(file, 'utf8', function (err,dataS) {                                       
                    if (err) {                                                                                    
                        return console.log(err);                                                                  
                    }
                    var resDataLines = dataS.toString().split(/\r?\n/);
                    var foundHeaders = false;
                    for(i=0;i<resDataLines.length;++i){
                        var thisLineSplit = resDataLines[i].split(/[ ,]+/);
                        // if(thisLineSplit[0]=='#')continue;
                        // if this is the column headings then append them
                        if(isNaN(thisLineSplit[0]))
                            continue;
                        else if(foundHeaders) // if the header row has already been found read a line of data
                            obj.data.push(resDataLines[i].split(/[ ,]+/).map(Number));
                        else{ // read the previous line as the header and decrement i
                            foundHeaders = true;
                            if(i>=1)
                                obj.headings = resDataLines[i-1].split(/[ ,]+/);
                            i--;
                        }
                    }
                    dataObjs.push(obj);
                    // make part of a file name list and call resolve when the list is complete
                    resolve('file read success!');
                });
            }// end null
            else{
                reject('file read failure!');
            }
        }); // end stat
    });
}

// take an array of DataObjs and turn them into an array of data tables
function dataObjsToDataTables(dataObjs,dataTables){
    // sanity check the data
    if(dataObjs.length<1){
        console.log('dataObjsToDataTables: error, dataObjs.length < 1');
        return;
    }
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
    var numObjs = dataObjs.length;
    console.log('numHeadings ' + numHeadings + ' nuCols ' + numCols + ' numRows ' + numRows + ' headings ' + headings);
    if(numCols!=numHeadings){
        console.log('dataObjsToDataTables: error, numCols!=numHeadings');
        return;
    }
    // first check that the dataObjs are compatible    
    for(i=0;i<dataObjs.length;++i){
        if(dataObjs[i].headings.length!=numHeadings){
            console.log('dataObjsToDataTables: error, ' + dataObjs[i].fileName + ' has an invalid number of headings');
            return;
        }
        if(dataObjs[i].data[0].length!=numCols){
            console.log('dataObjsToDataTables: error, ' + dataObjs[i].fileName + ' has an invalid number of columns');
            return;
        }
        for(j=0;j<numHeadings;++j){
            if(dataObjs[i].headings[j]!=headings[j]){
                console.log('dataObjsToDataTables: error, ' + dataObjs[i].fileName + ' headings do not match');
                return;
            }
        }
    }
    // collate the data objects data into a data table for each column
    // one dataTable for every heading with a column for every dataObj
    for(dt=0;dt<numDataTables;++dt){
        var dataTable = new google.visualization.DataTable();
        dataTable.addColumn('number', 'step');
        for(obj=0;obj<numObjs;++obj){
            // strip the filename to everything between the last underscore and the file extension
            var suffixAndExt = dataObjs[obj].fileName.split("_").pop();
            var suffix = suffixAndExt.substr(0, suffixAndExt.indexOf('.')); 
            dataTable.addColumn('number', "pt_" + suffix);
        }
        dataTable.addRows(numRows);
        // set the x labels
        for(row=0;row<numRows;++row){
            dataTable.setCell(row,0,row);
        }
        // copy all the dataObjs data into this dataTable
        for(row=0;row<numRows;++row){
            for(obj=0;obj<numObjs;++obj){
                dataTable.setCell(row,obj+1,dataObjs[obj].data[row][dt]);
            }
        }
        dataTables.push(dataTable);
    }
    //console.log(dataObjs);
    //console.log(dataTables);
}
