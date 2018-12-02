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
    execPath =  win_path + 'dice.exe';
    execCrossInitPath = win_path + 'DICe_CrossInit.exe';
    execCineStatPath = win_path + 'DICe_CineStat.exe';
    execCineToTiffPath = win_path + 'DICe_CineToTiff.exe';
    execCalPath = win_path + 'DICe_Cal.exe';
    execOpenCVServerPath = win_path + 'DICe_OpenCVServer.exe';
    execTrackingMoviePath = win_path + 'DICe_TrackingMovieMaker.exe';
}else if(os.platform()=='linux' || os.platform()=='darwin'){
    if(os.platform()=='darwin')
        linux_path = darwin_path;
    execPath = linux_path+'dice';
    execCrossInitPath = linux_path+'DICe_CrossInit';
    execCineStatPath = linux_path+'DICe_CineStat';
    execCineToTiffPath = linux_path+'DICe_CineToTiff';
    execCalPath = linux_path+'DICe_Cal';
    execOpenCVServerPath = linux_path+'DICe_OpenCVServer';    
    execTrackingMoviePath = linux_path+'DICe_TrackingMovieMaker';    
}

// true if debugging messages are turned on for the dice executable
var diceDebugMsgOn = false;

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
var livePlotPtsX = [];
var livePlotPtsY = [];
var excludedDefsX = [[]];
var excludedDefsY = [[]];
var excludedAssignments = [];
var obstructedDefsX = [[]];
var obstructedDefsY = [[]];
var firstClick = true;
var shapeInProgress = false;
var addROIsActive = false;
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