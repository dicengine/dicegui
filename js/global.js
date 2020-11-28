//const os = require('os');

// Global variables:

// working directory
var workingDirectory = "undefined";
var linux_path = '';
var darwin_path = '/Applications/DICe.app/Contents/Resources/app/bin/';
var win_path = 'C:\\Program Files (x86)\\Digital Image Correlation Engine\\';

var execPath;
var execCrossInitPath;
var execCineStatPath;
var execCineToTiffPath;
var execCalPath;
var execOpenCVServerPath;
var execTrackingMoviePath;

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

// best fit plane locations
var bestFitXOrigin = 0;
var bestFitYOrigin = 0;
var bestFitXAxis = 0;
var bestFitYAxis = 0;

// regions of interest
var ROIDefsX = [[]];
var ROIDefsY = [[]];
var livePlotPtsX = [];
var livePlotPtsY = [];
var excludedDefsX = [[]];
var excludedDefsY = [[]];
var excludedAssignments = [];
var obstructedDefsX = [[]];
var obstructedDefsY = [[]];
var subsetCoordinatesX = [];
var subsetCoordinatesY = [];
var firstClick = true;
var shapeInProgress = false;
var addROIsActive = false;
var drawEpipolarActive = false;
var addExcludedActive = false;
var addObstructedActive = false;
var currentROIIndex = 0;
var currentExcludedIndex = 0;
var currentObstructedIndex = 0;
var addLivePlotPtsActive = false;
var addLivePlotLineActive = false;
var livePlotLineXOrigin = 0;
var livePlotLineYOrigin = 0;
var livePlotLineXAxis = 0;
var livePlotLineYAxis = 0;

// state of windows etc. in interface
var showPrefPane = true;
var showStereoPane = 0;
var viewersStacked = false;
var showConsole = true;
var paraviewMsg = true;

// state of the results files
var resultsFresh = false;
var ROIsChanged = false;

function setExecPaths(path){
  if(os.platform()=='win32'){
    execPath =  path + 'dice.exe';
    execCrossInitPath = path + 'DICe_CrossInit.exe';
    execCineStatPath = path + 'DICe_CineStat.exe';
    execCineToTiffPath = path + 'DICe_CineToTiff.exe';
    execCalPath = path + 'DICe_Cal.exe';
    execOpenCVServerPath = path + 'DICe_OpenCVServer.exe';
    execTrackingMoviePath = path + 'DICe_TrackingMovieMaker.exe';
  }else if(os.platform()=='linux' || os.platform()=='darwin'){
    execPath = path + 'dice';
    execCrossInitPath = path + 'DICe_CrossInit';
    execCineStatPath = path + 'DICe_CineStat';
    execCineToTiffPath = path + 'DICe_CineToTiff';
    execCalPath = path + 'DICe_Cal';
    execOpenCVServerPath = path + 'DICe_OpenCVServer';
    execTrackingMoviePath = path + 'DICe_TrackingMovieMaker';    
  }
}
