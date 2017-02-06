const os = require('os');

// Global variables:

// working directory
var workingDirectory = "undefined";

var execPath
if(os.platform()=='win32'){
    execPath =  "C:\\Program Files (x86)\\Digital Image Correlation Engine\\dice.exe";
    execCrossInitPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_CrossInit.exe';
    execCineStatPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_CineStat.exe';
    execCineToTiffPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_CineToTiff.exe';
}else{
    execPath = '/Users/dzturne/code/KDICe/build_global_release/bin/dice';
    execCrossInitPath = '/Users/dzturne/code/KDICe/build_global_release/bin/DICe_CrossInit';
    execCineStatPath = '/Users/dzturne/code/KDICe/build_global_release/bin/DICe_CineStat';
    execCineToTiffPath = '/Users/dzturne/code/KDICe/build_global_release/bin/DICe_CineToTiff';
    //var execPath =  "/Applications/DICe.app/Contents/MacOS/dice";
}

// image sets
var refImagePathLeft = "undefined";
var refImagePathRight = "undefined";
var defImagePathsLeft = new Array();
var defImagePathsRight = new Array();
var cinePathLeft = "undefined";
var cinePathRight = "undefined";
var cineFirstFrame = 0;
var calPath = "undefined";

// reference image dimensions
var refImageWidthLeft = 0;
var refImageHeightLeft = 0;
var refImageWidthRight = 0;
var refImageHeightRight = 0;

// regions of interest
var ROIDefsX = [[]];
var ROIDefsY = [[]];
var excludedDefsX = [[]];
var excludedDefsY = [[]];
var firstClick = true;
var shapeInProgress = false;
var addROIsActive = false;
var addExcludedActive = false;
var currentROIIndex = 0;
var currentExcludedIndex = 0;

// state of windows etc. in interface
var showPrefPane = true;
var showStereoPane = false;
var viewersStacked = false;
var showConsole = true;
var paraviewMsg = true;
