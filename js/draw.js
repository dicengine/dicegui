$("#addLivePlotPts").click(function(){
    if(addLivePlotPtsActive==false){
        addLivePlotPtsActive = true;
        addROIsActive = false;
        addObstructedActive = false;
        addExcludedActive = false;
        $("#addLivePlotPts").css('color','#33ccff');
        $("#addROIs").css('color','rgba(0, 0, 0, 0.5)');
        $("#addExcludeds").css('color','rgba(0, 0, 0, 0.5)');
        $("#addObstructed").css('color','rgba(0, 0, 0, 0.5)');
        //deactivateEpipolar();
        //$("#drawEpipolar").css('color','rgba(0, 0, 0, 0.5)');
        // TODO abort any excluded shapes in progress
    }else{
        //$("#addROIs").css('background-color','transparent');
        $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
        addLivePlotPtsActive = false;
        // TODO abort any ROIS in progress
    }
});

$("#addLivePlotLine").click(function(){
    if(addLivePlotLineActive==false){
        addLivePlotLineActive = true;
        $("#addLivePlotLine").css('color','#33ccff');
    }else{
        addLivePlotLineActive = false;
        $("#addLivePlotLine").css('color','rgba(0, 0, 0, 0.5)');
    }
    drawROIs();
});

$("#resetLivePlotPts").click(function(){
    if (confirm('reset all live plots?')) {
        resetLivePlots();
        // clear the drawn ROIs
        clearDrawnROIs();
        drawROIs();
    } else {
        // Do nothing!
    }
});

function resetLivePlots(){
    clearLivePlotPts();
    addLivePlotPtsActive = false;
    addLivePlotLineActive = false;
    $("#addLivePlotLine").css('color','rgba(0, 0, 0, 0.5)');
    $("#addLivePlotPts").css('color','rgba(0, 0, 0, 0.5)');
}

function clearLivePlotPts () {
    livePlotPtsX = [];
    livePlotPtsY = [];
    livePlotLineXOrigin = refImageWidth / 2;
    livePlotLineYOrigin = 0.75*refImageHeigh / 2;
    livePlotLineXAxis = 1.5*refImageWidth / 2;
    livePlotLineYAxis = 0.75*refImageHeight / 2;
}

$("#bestFitCheck").change(function(){
//    drawROIs();
});
