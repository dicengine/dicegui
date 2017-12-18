//const os = require('os');

// Global variables:

// working directory
var workingDirectory = "undefined";
var linux_path = "";

var execPath
if(os.platform()=='win32'){
    execPath =  "C:\\Program Files (x86)\\Digital Image Correlation Engine\\dice.exe";
    execCrossInitPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_CrossInit.exe';
    execCineStatPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_CineStat.exe';
    execCineToTiffPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_CineToTiff.exe';
    execCalPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_Cal.exe';
    execOpenCVServerPath = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\DICe_OpenCVServer.exe';
}else if(os.platform()=='linux'){
    execPath = linux_path+'dice';
    execCrossInitPath = linux_path+'DICe_CrossInit';
    execCineStatPath = linux_path+'DICe_CineStat';
    execCineToTiffPath = linux_path+'DICe_CineToTiff';
    execCalPath = linux_path+'DICe_Cal';
    execOpenCVServerPath = linux_path+'DICe_OpenCVServer';    
}else{
    execPath = '/Applications/DICe.app/Contents/Resources/app/bin/dice';
    execCrossInitPath = '/Applications/DICe.app/Contents/Resources/app/bin/DICe_CrossInit';
    execCineStatPath = '/Applications/DICe.app/Contents/Resources/app/bin/DICe_CineStat';
    execCineToTiffPath = '/Applications/DICe.app/Contents/Resources/app/bin/DICe_CineToTiff';
    execCalPath = '/Applications/DICe.app/Contents/Resources/app/bin/DICe_Cal';
    execOpenCVServerPath = '/Applications/DICe.app/Contents/Resources/app/bin/DICe_OpenCVServer';
}

// image sets
var refImagePathLeft = "undefined";
var refImagePathRight = "undefined";
var refImagePathMiddle = "undefined";
var defImagePathsLeft = new Array();
var defImagePathsRight = new Array();
var defImagePathsMiddle = new Array();
var cinePathLeft = "undefined";
var cinePathRight = "undefined";
var cinePathMiddle = "undefined";
var cineFirstFrame = 0;
var calPath = "undefined";

// reference image dimensions
var refImageWidthLeft = 0;
var refImageHeightLeft = 0;
var refImageWidthRight = 0;
var refImageHeightRight = 0;
var refImageWidthMiddle = 0;
var refImageHeightMiddle = 0;

// best fit plane locations
var bestFitXOrigin = 0;
var bestFitYOrigin = 0;
var bestFitXAxis = 0;
var bestFitYAxis = 0;

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
var showStereoPane = 0;
var viewersStacked = false;
var showConsole = true;
var paraviewMsg = true;
