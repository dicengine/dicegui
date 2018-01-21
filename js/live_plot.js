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
    console.log(fileNames);
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
        console.log("fileToDataObj succeeded!", response);
        dataObjsToDataTables(dataObjs,dataTables);
        var firstValidIndex = getFirstValidIndex();
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
        buildDataTables();
    });
}

function getFirstValidIndex(){
    var firstValidIndex = 0;
    for(i=0;i<dataObjs.length;++i){
        if(!dataObjs[i].initialized)
            firstValidIndex++;
        else
            break;
    }
    return firstValidIndex;
}

function plotDataTable(){
    // clear the divs and clear the plots
    $('#livePlots').empty();    
    // create a div on the page:
    var divID = "div_livePlot_" + currentTable;
    $("#livePlots").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlot_" + currentTable;
    var firstValidIndex = getFirstValidIndex();
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
                    obj.initialized = true;
                    console.log('file read is successful ' + file);
                    dataObjs.push(obj);
                    resolve('file read success!');
                });
            }// end null
            else{ // always resolve ...
                dataObjs.push(obj);
                console.log('file read failed ' + file);
                resolve('file read success!');
                //reject('file read failure!');        
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
    // get the first valid dataObj
    var firstValidIndex = getFirstValidIndex();
    if(dataObjs[firstValidIndex].data.length<=0){
        console.log('dataObjsToDataTables: error, data.length < 1')
        return;
    }
    if(dataObjs[firstValidIndex].headings.length<=0){
        console.log('dataObjsToDataTables: error, headings.length < 1')
        return;
    }
    if(dataObjs[firstValidIndex].data[0].length<=0){
        console.log('dataObjsToDataTables: error, data[0].length < 1')
        return;
    }    
    var numHeadings = dataObjs[firstValidIndex].headings.length;
    var numCols = dataObjs[firstValidIndex].data[0].length;
    var numRows = dataObjs[firstValidIndex].data.length;
    var headings = dataObjs[firstValidIndex].headings;
    var numDataTables = numHeadings;
    var numObjs = dataObjs.length;
    console.log('numHeadings ' + numHeadings + ' nuCols ' + numCols + ' numRows ' + numRows + ' headings ' + headings);
    if(numCols!=numHeadings){
        console.log('dataObjsToDataTables: error, numCols!=numHeadings');
        return;
    }
    // set up the mapping from a dataObj's index in the vector to the dataTable column index
    var dataObjColIndex = [];
    for(obj=0;obj<numObjs;++obj){
        var suffixAndExt = dataObjs[obj].fileName.split("_").pop();
        var suffix = suffixAndExt.substr(0, suffixAndExt.indexOf('.'));
        dataObjColIndex.push(Number(suffix));
    }
    // first check that the dataObjs are compatible
    for(i=0;i<dataObjs.length;++i){
        if(!dataObjs[i].initialized) continue;
        var fileName = dataObjs[i].filename
        if(dataObjs[i].headings.length!=numHeadings){
            console.log('dataObjsToDataTables: error, ' + fileName + ' has an invalid number of headings');
            return;
        }
        if(dataObjs[i].data[0].length!=numCols){
            console.log('dataObjsToDataTables: error, ' + fileName + ' has an invalid number of columns');
            return;
        }
        // get the column number from the filename        
        for(j=0;j<numHeadings;++j){
            if(dataObjs[i].headings[j]!=headings[j]){
                console.log('dataObjsToDataTables: error, ' + fileName + ' headings do not match');
                return;
            }
        }
    }
    // collate the data objects data into a data table for each column
    // one dataTable for every heading with a column for every dataObj

    for(dt=0;dt<numDataTables;++dt){
        if(dataTables.length<dt+1){
            dataTables.push(new google.visualization.DataTable());
            dataTables[dt].addColumn('number', 'step');
            for(obj=0;obj<numObjs;++obj){
                // strip the filename to everything between the last underscore and the file extension
                //var suffixAndExt = dataObjs[obj].fileName.split("_").pop();
                //var suffix = suffixAndExt.substr(0, suffixAndExt.indexOf('.')); 
                dataTables[dt].addColumn('number', "pt_" + obj);//dataObjColIndex[obj]);
            }
        }
        var dataTable = dataTables[dt];
        dataTable.removeRows(0,dataTable.getNumberOfRows());
        dataTable.addRows(numRows);
        // set the x labels
        for(row=0;row<numRows;++row){
            dataTable.setCell(row,0,row);
        }
        // copy all the dataObjs data into this dataTable
        for(row=0;row<numRows;++row){
            for(obj=0;obj<numObjs;++obj){
                if(dataObjs[obj].initialized)
                    dataTable.setCell(row,dataObjColIndex[obj]+1,dataObjs[obj].data[row][dt]);
                    //dataTable.setCell(row,obj+1,dataObjs[obj].data[row][dt]);
            }
        }
        // remove the columns for points that failed:
        //for(obj=0;obj<numObjs;++obj){
        //    if(!dataObjs[obj].initialized)
        //       dataTable.hideColumns(dataObjColIndex[obj]+1);
        //}
    }
}
