//

function fullPath(folder,file){
    if(typeof workingDirectory === 'undefined')
        workingDirectory = localStorage.getItem("workingDirectory");
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
    return filePath;
}

function autoDetectImageSequence(folderPath,cb){
    fs.readdir(folderPath, (err,dir) => {
        if(!dir) return;
        var success = true;
        var leftImageIndex = -1;
        var rightImageIndex = -1;
        var middleImageIndex = -1;
        var secondInSeriesIndex = -1;
        var extension = '';
        // if multiple image file types are found, this routine should fail
        var prefix = '';
        var startIndex = 0;
        var endIndex = 0;
        var numDigits = 0;
        var leftSuffix = '';
        var rightSuffix = '';
        var middleSuffix = '';
        var frameInterval = 1;
        for(var i = 0; i < dir.length; i++) {
            var nameLen = dir[i].length;
            // grab the first image file that comes along...                                                          
            var ext = dir[i].split('.').pop();
            //console.log('file in dir: ' + dir[i]);
            if(ext=='tif'||ext=='TIF'||ext=='TIFF'||ext=='tiff'||ext=='JPG'||ext=='JPEG'||ext=='jpeg'||ext=='jpg'||ext=='png'||ext=='PNG'||ext=='bmp'||ext=='BMP'){
                // split up the name into components:
                var trimName = dir[i];
                // remove the extension                                                                           
                trimName = trimName.substr(0,trimName.length - ext.length - 1); // minus 1 to get rid of the dot
                //console.log('trim name: ' + trimName);
                var suffix = '_' + trimName.split('_').pop();
                //console.log('suffix: ' + suffix);
                trimName = trimName.substr(0,trimName.length - suffix.length);
                //console.log('trim name: ' + trimName);
                var digits = trimName.split(/[ \-_]+/).pop();
                //console.log('digits: ' + digits);
                var index = Number(digits);
                //console.log('index: ' + index);
                var tag = trimName.substr(0,trimName.length - digits.length);
                if(tag=="") return;
                //console.log('tag: ' + tag);
                // always update the endIndex
                endIndex = Number(digits);
                if(leftImageIndex==-1){
                    leftImageIndex = i;
                    extension ='.'+ ext;
                    console.log('auto detect sequence: extension ' + extension);
                    leftSuffix = suffix;
                    console.log('auto detect sequence: left suffix ' + leftSuffix);
                    startIndex = Number(digits);
                    console.log('auto detect sequence: startIndex ' + startIndex);
                    numDigits = digits.length;
                    console.log('auto detect sequence: numDigits ' + numDigits);
                    prefix = tag;
                    console.log('auto detect sequence: prefix ' + prefix);
                }
                // not the left image, assume it's the right image  
                else if(rightImageIndex==-1){
                    // check that the right image has the same suffix:
                    if(extension != '.'+ext){
                        console.log('multiple image file types found, cannot auto detect sequence');
                        return;
                    }
                    rightImageIndex = i;
                    rightSuffix = suffix;
                    console.log('auto detect sequence: right suffix ' + rightSuffix);
                }
                // not the left image or the right, assume it's the middle image if the suffix doesn't match the left or right
                else if(middleImageIndex==-1){
                    if(suffix!=leftSuffix&&suffix!=rightSuffix){
                        middleImageIndex = i;
                        middleSuffix = suffix;
                        console.log('auto detect sequence: middle suffix ' + middleSuffix);
                    }else if(secondInSeriesIndex==-1){
                        secondInSeriesIndex = i;
                        currentIndex = Number(digits);
                        frameInterval = currentIndex - startIndex;
                        console.log('auto detect sequence: frameInterval ' + frameInterval);
                    }
                }
                else if(secondInSeriesIndex==-1){
                    secondInSeriesIndex = i;
                    currentIndex = Number(digits);
                    frameInterval = currentIndex - startIndex;
                    console.log('auto detect sequence: frameInterval ' + frameInterval);
                }
            }
        } // end dir iterator
        console.log('auto detect sequence: endIndex ' + endIndex);
        if(leftImageIndex==-1) success=false;
        if(rightImageIndex==-1) success=false;
        if(success){
            console.log('auto file detection successful');
            var obj = {
                extension: extension,
                prefix: prefix,
                startIndex: startIndex,
                endIndex: endIndex,
                frameInterval: frameInterval,
                numDigits: numDigits,
                leftSuffix: leftSuffix,
                rightSuffix: rightSuffix,
                middleSuffix: middleSuffix
            };
            cb(obj);
            return;
        }else{
            return;
        }
    });
}
