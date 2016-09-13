const os = require('os');

// Global variables:

// working directory
var workingDirectory = "undefined";

var execPath
if(os.platform()=='win32'){
    execPath =  "C:\\Program Files (x86)\\Digital Image Correlation Engine\\dice.exe";
}else{
    execPath = '/Users/dzturne/code/KDICe/build_serial_release/bin/dice';
    //var execPath =  "/Applications/DICe.app/Contents/MacOS/dice";
}

// image sets
var refImagePathLeft = "undefined";
var refImagePathRight = "undefined";
var defImagePathsLeft = new Array();
var defImagePathsRight = new Array();

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
