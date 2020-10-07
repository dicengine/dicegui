var nIntervIdTracklib;
var firstPlotTracklib = true;
var dataObjsTracklib = [];
var currentTableTracklib = 0;
var plottingPausedTracklib = false;

function livePlotTracklibRepeat() {
//  updateTracklibResults();
    nIntervIdTracklib = setInterval(function(){
//      updateTracklibResults();
        if($("#runLoader").hasClass('post-loader-success')){
            $("#resultsButton").trigger( "click" );
            updateTracklibResults();
            clearInterval(nIntervIdTracklib);
        }
    }, 5000);
}

function tracklibDataPopulated(){
    if(dataObjsTracklib.length>=1) return true;
    else return false;
}

function updateTracklibResults(){
    var workingDir = localStorage.getItem("workingDirectory");
    var resultsFile;
    if(os.platform()=='win32'){
        resultsFile = workingDir + '\\results\\fragments.txt'; 
    }else{
        resultsFile = workingDir + '/results/fragments.txt'; 
    }
    console.log('updating tracklib results with file: ' + resultsFile);
    dataObjsTracklib = [];
    dataObjsTracklib.push({fileName:resultsFile,roi_id:-1,headings:[],data:[],initialized:false});
    var promise = fileToDataObj(dataObjsTracklib,0); // should only be one results file
    promise.then(function(response) {
    if(response[0]=="file read failed!"||response=="file read failed!"){
        console.log('failed to load tracklib results file ' + resultsFile);
        return;
    }
        console.log("fileToDataObj succeeded!", response);
        if(firstPlotTracklib){
            for(i=0;i<dataObjsTracklib[0].headings.length;++i){
                var liID = "li_livePlot_" + i;
                var liTitle = dataObjsTracklib[0].headings[i];
                $("#livePlotFieldSelect").append(new Option(liTitle, liID));
            }
            $('#livePlotFieldSelect :nth-child(7)').prop('selected', true); // To select via index
            firstPlotTracklib = false;
        }
        plotTracklibDataTable();
    },function(error) {
        console.error("fileToDataObj failed!", error);
    });
}

$(".update-tracklib-plots").keypress(function(event) { 
    if (event.keyCode === 13) { 
        plotTracklibDataTable();
    } 
}); 


$(".update-tracklib-plots").change(function () {
    plotTracklibDataTable();
});


function plotTracklibDataTable(){
    // clear the divs and clear the plots
    $('#livePlots').empty();
    // create a div on the page:
    currentTableTracklib = Number($("#livePlotFieldSelect option:selected").val().split("_").pop());
    
    // get the max global id from the set
    if(dataObjsTracklib.length<1) return;
    if(dataObjsTracklib[0].data.length<6) return;
    
    var maxGID = 0;
    for(i=0;i<dataObjsTracklib[0].data[5].length;++i){ // 5 is global id
        if(dataObjsTracklib[0].data[5][i] > maxGID){
            maxGID = dataObjsTracklib[0].data[5][i];
        }
    }
    console.log('max GID: ' + maxGID);

    // collect all the data for the selected id (global or local)
    var id_index = 5;
    var alert_text = " global ";
    if($("#idTypeSelect").val()=='leftID'){
        id_index = 3;
        alert_text = " left ";
    }
    else if($("#idTypeSelect").val()=='rightID'){
        id_index = 4;
        alert_text = " right ";
    }
    var id_val = parseInt($("#trackID").val());

    var tmp_data = {x:[],y:[],z:[],gid:-1,type:'scatter3d'};

    var color = '#1f77b4';
    var highlight_color = '#b41f71';
    var dataMap = new Array(maxGID+1);
    // initialize the data container
    for(i=0;i<dataMap.length;++i){
        dataMap[i] = {x:[],y:[],z:[],type:'scatter3d',
                marker: {
                    color: color,
                    size: 2,
                    symbol: 'circle'
                        },
        };
    }
    // retrieve the data for each point and organize by id
    for(i=0;i<dataObjsTracklib[0].data[5].length;++i){ // 5 is global id
        var gid = dataObjsTracklib[0].data[5][i];
        var lid = dataObjsTracklib[0].data[id_index][i];
        if(gid<0) continue;
        if(lid==id_val){
            dataMap[gid].marker.color = highlight_color;
        }
        dataMap[gid].name = 'gid ' + gid;
        dataMap[gid].x.push(dataObjsTracklib[0].data[10][i]);
        dataMap[gid].y.push(dataObjsTracklib[0].data[11][i]);
        dataMap[gid].z.push(dataObjsTracklib[0].data[12][i]);
    }
    // plot 3d of all valid global points
    var divID3D = "div_livePlot3d";
    $("#livePlot3D").append('<div id="' + divID3D + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var layout3D = {
            xaxis: {
                title: {
                    text: 'X',
                },
            },
            yaxis: {
                title: {
                    text: 'Y',
                }
            },
            zaxis: {
                title: {
                    text: 'Z',
                }
            },
            margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0,
                pad: 4,
            },
            showlegend: false
    };
//    var plotlyData3D = {x:[],y:[],z:[],type:'scatter',gid:-1};
//    for(i=0;i<dataObjsTracklib[0].data[5].length;++i){ // 5 is global id
//        if(dataObjsTracklib[0].data[5][i]>=0){
//            plotlyData3D.x.push(dataObjsTracklib[0].data[10][i]);
//            plotlyData3D.y.push(dataObjsTracklib[0].data[11][i]);
//            plotlyData3D.z.push(dataObjsTracklib[0].data[12][i]);
//        }
//    }
//    Plotly.plot(document.getElementById(divID3D),[plotlyData3D],layout3D);
    Plotly.plot(document.getElementById(divID3D),dataMap,layout3D);
    
    var divID = "div_livePlot_" + currentTableTracklib;
    $("#livePlots").append('<div id="' + divID + '" class="plot_div" style="height:100%; width:100%; float:left;" ></div>');
    var liID = "li_livePlot_" + currentTableTracklib;
    var liTitle = dataObjsTracklib[0].headings[currentTableTracklib];
    var layout = {
            xaxis: {
                title: {
                    text: 'Frame',
                },
            },
            yaxis: {
//                autorange: 'true',
//                fixedrange: 'false',
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
    
    var plotlyData = {x:[],y:[],type:'scatter'};
    for(i=0;i<dataObjsTracklib[0].data[id_index].length;++i){
        if(dataObjsTracklib[0].data[id_index][i]==id_val){
            plotlyData.x.push(dataObjsTracklib[0].data[0][i]);
            plotlyData.y.push(dataObjsTracklib[0].data[currentTableTracklib][i]);
        }
    }
    if(plotlyData.x.length<1||plotlyData.y.length<1){
        alert('Invalid' + alert_text + 'id: ' + id_val.toString());
        return;
    }
    Plotly.plot(document.getElementById(divID),[plotlyData],layout);
}
