var nIntervId;
var firstPlot = true;
var dataObjs = [];
var currentTable = 0;

function livePlotRepeat() {
    var workingDir = localStorage.getItem("workingDirectory");
    var fileNameStr = localStorage.getItem("livePlotFiles"); 
    var fileNames = fileNameStr.split(/[ ,]+/);
    for(i=0;i<fileNames.length;++i)
        if(os.platform()=='win32'){
            fileNames[i] = workingDir + '\\' +fileNames[i]; 
        }else{
            fileNames[i] = workingDir + '/' +fileNames[i]; 
        }
//    var lineFile = localStorage.getItem("livePlotLineFile");
//    if(os.platform()=='win32'){
//        lineFile = workingDir + '\\' + lineFile; 
//    }else{
//        lineFile = workingDir + '/' + lineFile; 
//    }
    console.log('livePlot point filenames' + fileNames);
//    console.log('livePlot line filename' + lineFile);
    livePlot(fileNames);
    nIntervId = setInterval(function(){
        livePlot(fileNames);
        if(!$("#runLoader").hasClass('loader')){
            clearInterval(nIntervId);
        }
    }, 5000);
}

$("#livePlotFieldSelect").on('change',function() {
    if($("#analysisModeSelect").val()=="tracking" && diceTrackLibOn && showStereoPane==1)
        updateTracklib2dScatter();
    else{
        currentTable = Number($("#livePlotFieldSelect option:selected").val().split("_").pop());
        plotDataTable();
    }
});

function livePlot(fileNames){
    dataObjs = [];
    for(fileIt=0;fileIt<fileNames.length;++fileIt){
        dataObjs.push({fileName:fileNames[fileIt],roi_id:-1,headings:[],data:[],initialized:false});
    }
    var promises = [];
    for(fileIt=0;fileIt<fileNames.length;++fileIt){
        var promise = fileToDataObj(dataObjs,fileIt);
        promises.push(promise);
    }
    Promise.all(promises).then(function(response) {
        if(response[0]=="file read failed!"||response=="file read failed!"){
            console.log('failed to load live_plot files');
            return;
        }
        console.log("fileToDataObj succeeded!", response);
        var firstValidIndex = getFirstValidIndex(dataObjs);
        if(firstPlot){
            $("#livePlotFieldSelect").empty();
            for(i=0;i<dataObjs[firstValidIndex].headings.length;++i){
                var liID = "li_livePlot_" + i;
                var liTitle = dataObjs[firstValidIndex].headings[i];
                $("#livePlotFieldSelect").append(new Option(liTitle, liID));
            }
            if($("#analysisModeSelect").val()=="tracking")
                $('#livePlotFieldSelect :nth-child(4)').prop('selected', true); // To select via index
            else
                $('#livePlotFieldSelect :nth-child(2)').prop('selected', true); // To select via index
            currentTable = Number($("#livePlotFieldSelect option:selected").val().split("_").pop());
            firstPlot = false;
        }
        plotDataTable();
    },function(error) {
        console.error("fileToDataObj failed!", error);
    });
}

function plotDataTable(){
    // clear the divs and clear the plots
    $('#livePlots').empty();
    // create a div on the page:
    var divID = "div_livePlot_" + currentTable;
    $("#livePlots").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlot_" + currentTable;
    var firstValidIndex = getFirstValidIndex(dataObjs);
    var liTitle = dataObjs[firstValidIndex].headings[currentTable];
    var layout = {
            xaxis: {
                title: {
                    text: 'Frame',
                },
            },
            yaxis: {
                title: {
                    text: liTitle,
                }
            },
            margin: {
                l: 60,
                r: 50,
                b: 40,
                t: 10,
                pad: 4,
            },
    };
    var plotlyData = [];
    for(i=0;i<dataObjs.length;++i){
        var tmp_data = {x:[],y:[],name:'pt_',type:'scatter'};
        plotlyData.push(tmp_data);
    }
    for(i=0;i<dataObjs.length;++i){
        plotlyData[i].x = dataObjs[i].data[0];
        plotlyData[i].y = dataObjs[i].data[currentTable];
        plotlyData[i].name = plotlyData[i].name + String(i);
    }
    Plotly.plot(document.getElementById(divID),plotlyData,layout);
}