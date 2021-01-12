//

function fullPath(folder,file){
    if(typeof workingDirectory === 'undefined' || workingDirectory === null || workingDirectory == 'undefined'){
        workingDirectory = localStorage.getItem("workingDirectory");
        console.log('fullPath(): getting workingDirectory from local storage');
    }
    var filePath = workingDirectory;
    if(folder!=''){
        if(os.platform()=='win32'){
            filePath += '\\' + folder;
        }else{
            filePath += '/' + folder;
        }
    }
    if(os.platform()=='win32'){
        filePath += '\\' + file;
    }else{
        filePath += '/' + file;
    }
    console.log('fullPath(): ',filePath);
    return filePath;
}

function autoDetectImageSequence(folderPath,cb){
    fs.readdir(folderPath, (err,dir) => {
        if(!dir) return;
        
        // remove any hidden files from the dir list
        var i = dir.length;
        while (i--) {
            if(dir[i].charAt(0)==='.')
                dir.splice(i,1);
        }
        
        // only mono and stereo implemented at this point, no trinocular
        
        // supported image file naming patterns:
        // CASE A (stereo)        leftPrefix_image# and rightPrefix_image#               example left00034.jpeg and right00034.jpeg
        // CASE B (single camera) prefix_image#                                          example cal-sys-a-00034.tif
        // CASE C (stereo)        prefix_image#_leftSuffix and prefix_image#_rightSuffix example cal-sys-a-00034_0.tif and cal-sys-a-00034_1.tif
        // CASE D (single camera) prefix_image#_leftSuffix (no right files, this case is from using only the left images of a stetero naming convention)
        
        // note the prefix can be empty such as this CASE C example 00034_0.tif 00034_1.tif
        
        // split the filenames up into tokens to figure out the pattern
        var extension = '';
        var delim = '';
        imageTokens = [];
        for(var i = 0; i < dir.length; i++) {
            // skip any file that doesn't have an image file extension
            ext = dir[i].split('.').pop();
            if(extension=='')
                if(ext=='tif'||ext=='TIF'||ext=='TIFF'||ext=='tiff'||ext=='JPG'||ext=='JPEG'||ext=='jpeg'||ext=='jpg'||ext=='png'||ext=='PNG'||ext=='bmp'||ext=='BMP')
                    extension = ext;
            if(ext==extension){ // take the first image extension and skip any files that don't have this extension
                // split up the name into components:
                trimName = dir[i];
                // remove the extension
                trimName = trimName.substr(0,trimName.length - ext.length - 1); // minus 1 to get rid of the dot
                //console.log('trim name: ' + trimName);
                // next grab the numbers at the end of the file name which either indicate the camera number or the frame number
                // if its not a number on the end return
                if(!$.isNumeric(trimName.slice(-1))) return;
                lastToken = trimName.split(/[\D]/).pop(); // delimiter is any non-number character
                //console.log('lastToken: ' + lastToken);
                preName = trimName.substr(0,trimName.length - lastToken.length)
                // remove an underscore or minus if it exists
                delim = '';
                if(preName.slice(-1)=='-'){
                    delim = '-';
                    preName = preName.slice(0,-1);
                }
                if(preName.slice(-1)=='_'){
                    delim = '_';
                    preName = preName.slice(0,-1);
                }
                //console.log('preName: ' + preName);
                // what's left should either be a text prefix or a number or a prefix and number
                middleToken = preName.split(/[\D]/).pop(); // delimiter is any non-number character
                //console.log('middleToken: ' + middleToken);
                if(middleToken.length==0||middleToken.length==preName.length) // no number so its a prefix only, or number only so no prefix
                    imageTokens.push([lastToken,preName])
                else{
                    firstToken = preName.substr(0,preName.length - middleToken.length);
                    imageTokens.push([lastToken,middleToken,firstToken]);
                }
            }
        }
        extension = '.' + extension;
        //console.log(imageTokens);

        // now figure out what the file naming pattern is:
        if(imageTokens.length<3) return; // needs at least three files found in this folder
        var prefix = '';
        var startIndex = 0;
        var endIndex = 0;
        var numDigits = 0;
        var suffix = '';
        var leftSuffix = '';
        var rightSuffix = '';
        var rightPrefix = '';
        var leftPrefix = '';
        var frameInterval = 1;
        // the last token should either be an image number or a camera number
        testLastToken = imageTokens[0][0];
        numRepeats = 0;
        patternCase = 'A';
        for(i=1;i<imageTokens.length;++i)
            if(imageTokens[i][0]==testLastToken)
                numRepeats++;
        //console.log('numRepeats: ' + numRepeats);
        if(numRepeats>1){ //not an image number, must be a suffix
            if(imageTokens[0].length == 2){
                if(numRepeats==dir.length-1)
                    patternCase = 'D';
                else
                    patternCase = 'C';
            }
            else{
                // could be case B with a number in the prefix so test for this
                testMiddleToken = imageTokens[0][1];
                numMiddleRepeats = 0;
                for(i=1;i<imageTokens.length;++i)
                    if(imageTokens[i][1]==testMiddleToken)
                        numMiddleRepeats++;
                //console.log('numMiddleRepeats: ' + numMiddleRepeats);
                if(numMiddleRepeats > 1){
                    //console.log('I am case B with a number in the prefix');
                    patternCase = 'B';
                }else{
                    if(numRepeats==dir.length-1)
                        patternCase = 'D';
                    else
                        patternCase = 'C';
                }
            }
        } else {
            // if the prefixes are all the same it's case B, otherwise case A
            allPrefixesTheSame = true;
            testPrefix = imageTokens[0][imageTokens[0].length-1]
            for(i=1;i<imageTokens.length;++i){
                if(imageTokens[i][imageTokens[0].length-1]!=testPrefix){
                    allPrefixesTheSame = false;
                    break;
                }
            }
            if(allPrefixesTheSame){
                patternCase = 'B';
            }else{
                patternCase = 'A';
            }
        }
        
        // determine the parts of the naming pattern given the case
        firstRow = imageTokens[0];
        secondRow = imageTokens[1];
        lastRow = imageTokens[imageTokens.length-1];
        numberCol = 0;
        switch(patternCase) {
        case 'A':
            console.log('file naming convention case A');
            leftPrefix = firstRow[firstRow.length-1] + delim; // add delimeter
            rightPrefix = lastRow[firstRow.length-1] + delim; // add delimeter
            if(firstRow.length>2){ // catch the case where there is a number in the prefix
                leftPrefix = firstRow[firstRow.length-1] + firstRow[firstRow.length-2] + delim;
                rightPrefix = lastRow[firstRow.length-1] + lastRow[lastRow.length-2] + delim;
            }
            break;
        case 'B':
            console.log('file naming convention case B');
            prefix = firstRow[firstRow.length-1] + delim;
            if(firstRow.length>2) // catch the case where there is a number in the prefix
             prefix = firstRow[firstRow.length-1] + firstRow[firstRow.length-2] + delim;
            break;
        case 'C':
            console.log('file naming convention case C');
            numberCol = 1;
            // prefix can be empty
            if(firstRow.length>2) // if there is no prefix the row length is 2
                prefix = firstRow[firstRow.length-1];
            leftSuffix = delim + firstRow[0];
            rightSuffix = delim + lastRow[0];
            break;
        case 'D':
            console.log('file naming convention case D');
            numberCol = 1;
            // prefix can be empty
            if(firstRow.length>2) // if there is no prefix the row length is 2
                prefix = firstRow[firstRow.length-1];
            suffix = delim + firstRow[0];
            break;
        default:
            //console.log('default case');
            return;
            // code block
        }
        startIndex = Number(firstRow[numberCol]);
        endIndex = Number(lastRow[numberCol]);
        numDigits = lastRow[numberCol].length;
        if(patternCase=='C')
            frameInterval = Number(imageTokens[2][numberCol]) - Number(firstRow[numberCol]);
        else
            frameInterval = Number(secondRow[numberCol]) - Number(firstRow[numberCol]);
        
        console.log('auto file detection successful');
        console.log('extension:   ' + extension);
        console.log('delim:       ' + delim);
        console.log('prefix:      ' + prefix);
        console.log('startIndex:  ' + startIndex);
        console.log('endIndex:    ' + endIndex);
        console.log('numDigits:   ' + numDigits);
        console.log('frameInt:    ' + frameInterval);
        console.log('suffix:      ' + suffix);
        console.log('leftSuffix:  ' + leftSuffix);
        console.log('rightSuffix: ' + rightSuffix);
        console.log('leftPrefix:  ' + leftPrefix);
        console.log('rightPrefix: ' + rightPrefix);
        
        var obj = {
            extension: extension,
            prefix: prefix,
            suffix: suffix,
            startIndex: startIndex,
            endIndex: endIndex,
            numDigits: numDigits,
            frameInterval: frameInterval,
            leftSuffix: leftSuffix,
            rightSuffix: rightSuffix,
            leftPrefix: leftPrefix,
            rightPrefix: rightPrefix
        };
        cb(obj);
    });
}

function deleteFileIfExists(fileName,cb){
    cb = cb || $.noop;
    fs.readdir(workingDirectory, (err,dir) => {
        if(!dir)return;
        for(var i = 0; i < dir.length; i++) {
            (function(i) {
                filePath = dir[i];
                if(filePath.includes(fileName)){
                    console.log('attempting to delete file ' + filePath);
                    fullFilePath = fullPath('',filePath);
                    fs.stat(fullFilePath, function(err, stat) {
                        console.log('stat called on file ' + fullFilePath);
                        if(err == null) {
                            fs.unlink(fullFilePath, (err) => {
                                if (err) throw err;
                                console.log('successfully deleted '+fullFilePath);
                                cb();
                                return;
                            });
                        }else{
                            // no-op
                        }
                    }); // end stat
                } //end includes
            })(i);
        } // end dir loop
        cb(); // call the callback if the file wasn't found
    });
}


