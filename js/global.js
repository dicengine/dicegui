// Global variables:

// working directory
var workingDirectory = "undefined";

// image sets
var refImagePathLeft = "undefined";
var refImagePathRight = "undefined";
var defImagePathsLeft = new Array();
var defImagePathsRight = new Array();

// determines if the image viewers are stacked on top of each other when stereo is in use
var viewersStacked = false;

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
var shapeInProgress = false;
var addROIsActive = false;
var addExcludedActive = false;
var currentROIIndex = 0;
var currentExcludedIndex = 0;
