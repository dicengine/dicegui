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


function transpose(a) {

    // Calculate the width and height of the Array
    var w = a.length || 0;
    var h = a[0] instanceof Array ? a[0].length : 0;
    // In case it is a zero matrix, no transpose routine needed.
    if(h === 0 || w === 0) { return []; }
    /**
     * @var {Number} i Counter
     * @var {Number} j Counter
     * @var {Array} t Transposed data is stored in this array.
     */
    var i, j, t = [];
    // Loop through every item in the outer array (height)
    for(i=0; i<h; i++) {
      // Insert a new row (array)
      t[i] = [];
      // Loop through every item per item in outer array (width)
      for(j=0; j<w; j++) {
        // Save transposed data.
        t[i][j] = a[j][i];
      }
    }
    return t;
  }

function fileToDataObj(dataObjs,fileIt) {
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        var file = dataObjs[fileIt].fileName;
        console.log("reading file " + file);
//        var obj = {fileName:file,roi_id:-1,headings:[],data:[],initialized:false}
        var ext = file.split('.').pop();
        // split up the name into components:
        var trimName = file.substr(0,file.length - ext.length - 1);
        //console.log('trim name: ' + trimName);
        var subset_id = trimName.split('_').pop();
        //console.log('susbset id ' + subset_id);
        //alert('file ' + file + ' subset_id ' + subset_id);
        dataObjs[fileIt].roi_id = subset_id;
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
                            dataObjs[fileIt].data.push(thisLineSplit.map(Number));
                            //obj.data.push(resDataLines[i].split(/[ ,]+/).map(Number)); 
                        else{ // read the previous line as the header and decrement i
                            foundHeaders = true;
                            if(i>=1){
                                //console.log('prevLine ' + prevLine);
                                dataObjs[fileIt].headings = prevLine;
                                //obj.headings = resDataLines[i-1].split(/[ ,]+/);
                            }
                            i--;
                        }
                        prevLine = thisLineSplit;
                    }
                    dataObjs[fileIt].initialized = true;
                    console.log('file read was successful ' + file);
                    dataObjs[fileIt].data = transpose(dataObjs[fileIt].data);
//                    obj.data.map((_, colIndex) => obj.data.map(row => row[colIndex]));
//                    console.log(obj);
//                    dataObjs.push(obj);
                    resolve('file read success!');
                });
            }// end null
            else{ // always resolve ...
//                dataObjs.push(obj);
                console.log('file read failed ' + file);
                console.log(err);
                resolve('file read failed!');
                //reject('file read failure!');
            }
        }); // end stat
    });
}