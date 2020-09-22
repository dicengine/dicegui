function getFirstValidIndex(dataObjs){
    var firstValidIndex = 0;
    for(i=0;i<dataObjs.length;++i){
        if(!dataObjs[i].initialized)
            firstValidIndex++;
        else
            break;
    }
    return firstValidIndex;
}

function fileToDataObj(file,dataObjs) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        console.log("reading file " + file);
        var obj = {fileName:file,roi_id:-1,headings:[],data:[],initialized:false}
        var ext = file.split('.').pop();
        // split up the name into components:
	var trimName = file.substr(0,file.length - ext.length - 1);
	//console.log('trim name: ' + trimName);
        var subset_id = trimName.split('_').pop();
        //console.log('susbset id ' + subset_id);
        //alert('file ' + file + ' subset_id ' + subset_id);
        obj.roi_id = subset_id;
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
                        if(thisLineSplit[0]=='#')continue;
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
                console.log(err);
                resolve('file read failed!');
                //reject('file read failure!');        
            }
        }); // end stat
    });
}

// take an array of DataObjs and turn them into an array of data tables for X,Y point locations
function dataObjsToDataTables(dataObjs,dataTables){
    // sanity check the data
    if(dataObjs.length<1){
        console.log('dataObjsToDataTables: error, dataObjs.length < 1');
        return;
    }
    // get the first valid dataObj
    var firstValidIndex = getFirstValidIndex(dataObjs);
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
        //console.log('DATA TABLE SIZE ' + numRows + ' x ' + dataTables[dt].getNumberOfColumns());
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

// take an array of DataObjs and turn them into an array of data tables
// for line data
function dataObjsToLineDataTables(dataObjs,dataTables){
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