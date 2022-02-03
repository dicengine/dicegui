//const os = require('os');

// Global variables:

// working directory
var workingDirectory = "undefined";
var linux_path = '';
var darwin_path = '/Applications/DICe.app/Contents/Resources/app/bin/';
var win_path = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\';

var execPath;
var execCrossInitPath;
var execVideoStatPath;
var execCalPath;
var execOpenCVServerPath;
var execTrackingMoviePath;
var execEpilinePath;

if(os.platform()=='win32'){
    setExecPaths(win_path);
}else if(os.platform()=='linux'){
    setExecPaths(linux_path);
}else if(os.platform()=='darwin'){
    setExecPaths(darwin_path);
}
// the exec paths above can be overridden by setting a execPathOverride
// valiable in .dice.js, if that variable exists the paths get 
// updated in utils.js

// true if debugging messages are turned on for the dice executable
var diceDebugMsgOn = false;
var diceTrackLibOn = false;

// image sets
var refImagePathLeft = "undefined";
var refImagePathRight = "undefined";
var defImagePathsLeft = [];
var defImagePathsRight = [];
var videoPathLeft = "undefined";
var videoPathRight = "undefined";
var videoFirstFrame = 0;
var calPath = "undefined";

// blocking subsets (used for legacy tracking code)
var blockingSubsets = [[]];
var roiType = 'ROI';

// reference image dimensions
var refImageWidth = 0;
var refImageHeight = 0;

// best fit plane locations
var bestFitXOrigin = 0;
var bestFitYOrigin = 0;
var bestFitXAxis = 0;
var bestFitYAxis = 0;

// regions of interest
var drawEpilineActive = false;

// state of windows etc. in interface
var showPrefPane = true;
var showStereoPane = 0;
var viewersStacked = false;
var showConsole = true;
//var paraviewMsg = true;

// state of the results files
var resultsFresh = false;

function setExecPaths(path){
  if(os.platform()=='win32'){
    execPath =  path + 'dice.exe';
    execCrossInitPath = path + 'DICe_CrossInit.exe';
    execVideoStatPath = path + 'DICe_VideoStat.exe';
    execCalPath = path + 'DICe_Cal.exe';
    execOpenCVServerPath = path + 'DICe_OpenCVServer.exe';
    execEpilinePath = path + 'DICe_Epiline.exe';
    execTrackingMoviePath = path + 'DICe_TrackingMovieMaker.exe';
  }else if(os.platform()=='linux' || os.platform()=='darwin'){
    execPath = path + 'dice';
    execCrossInitPath = path + 'DICe_CrossInit';
    execVideoStatPath = path + 'DICe_VideoStat';
    execCalPath = path + 'DICe_Cal';
    execOpenCVServerPath = path + 'DICe_OpenCVServer';
    execEpilinePath = path + 'DICe_Epiline';
    execTrackingMoviePath = path + 'DICe_TrackingMovieMaker';
  }
}
