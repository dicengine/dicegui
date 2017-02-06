const fs = require('fs');
const os = require('os');

$(document).ready(function(){
    google.charts.load('current', {'packages':['scatter']});
    google.charts.setOnLoadCallback(drawChart);

    drawChart();
});


function drawChart () {

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'Speckle size (px)');
    data.addColumn('number', 'Image coverage (%)');

    // read the output files
    var fileName = '.dice-res-info.js';
    fs.stat(fileName, function(err, stat) {
        if(err == null) {
            console.log('loading resolution info from ' + fileName);
            $.getScript( fileName )
                .done(function( s, Status ) {
                    console.warn( Status );
                    var speckleFile = workingDirectory;
                    if(os.platform()=='win32'){                                                                                  
                        speckleFile += '\\synthetic_results\\speckle_stats.txt';
                    }else{                                                                                                       
                        speckleFile += '/synthetic_results/speckle_stats.txt';     
                    }                                                                                                            
                    fs.stat(speckleFile, function(err, stat) {                                
                        if(err == null) {                                     
                             fs.readFile(speckleFile, 'utf8', function (err,dataS) {                                       
                                 if (err) {                                                                                    
                                     return console.log(err);                                                                  
                                 }
                                 else{
                                     console.log(dataS);
                                 }
                                 var speckleData = dataS.toString().split(/\s+/g).map(Number);
                                 console.log(speckleData);
                                 var i = 0;
                                 while(i < speckleData.length){
                                     data.addRow([speckleData[i*3+0],speckleData[i*3+1]]);
                                     i +=3;
                                 }
    var options = {
        width: 800,
        height: 500,
        chart: {
            title: 'Speckle size estimation',
            subtitle: ''
        },
        hAxis: {title: 'Speckle size (px)'},
        vAxis: {title: 'Image coverage (%)'}
    };

    var chart = new google.charts.Scatter(document.getElementById('scatterchart_material'));

    chart.draw(data, google.charts.Scatter.convertOptions(options));
                                 
                                 //if(positions.length >= 16){                                                                  
                                 //    for(i=0;i<16;i+=4)                                                                       
                                 //    crossLeftX[i/4] = positions[i];                                                          
                                 //    crossLeftY[i/4] = positions[i+1];                                                        
                                 //    crossRightX[i/4] = positions[i+2];                                                       
                                 //    crossRightY[i/4] = positions[i+3];                                                       
                                 //}
                             }); // end readFile
                        } // end null
                        else{
                            alert("could not read speckle_stats.txt");
                            return;
                        }
                    }); // end stat
                }); // end done
        } // end err
    }); // end stat
                                
    
//    data.addRows([
//          [0, 67], [1, 88], [2, 77],
//          [3, 93], [4, 85], [5, 91],
//          [6, 71], [7, 78], [8, 93],
//          [9, 80], [10, 82],[0, 75],
//          [5, 80], [3, 90], [1, 72],
//          [5, 75], [6, 68], [7, 98],
//          [3, 82], [9, 94], [2, 79],
//          [2, 95], [2, 86], [3, 67],
//          [4, 60], [2, 80], [6, 92],
//          [2, 81], [8, 79], [9, 83],
//          [3, 75], [1, 80], [3, 71],
//          [3, 89], [4, 92], [5, 85],
//          [6, 92], [7, 78], [6, 95],
//          [3, 81], [0, 64], [4, 85],
//          [2, 83], [3, 96], [4, 77],
//          [5, 89], [4, 89], [7, 84],
//          [4, 92], [9, 98]
//    ]);

}
