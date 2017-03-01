//const fs = require('fs');
//const os = require('os');

google.charts.load('current', {'packages':['corechart','line']});
google.charts.setOnLoadCallback(drawChart);

function drawChart () {

    var data = new google.visualization.DataTable();
    data.addColumn('number', 'Speckle size (px)');
    data.addColumn('number', 'Image coverage (%)');
    var dataRes = new google.visualization.DataTable();
    dataRes.addColumn('number', 'Motion period (px)');
    dataRes.addColumn('number', 'Displacement error (%)');
    dataRes.addColumn('number', 'Displacement std. dev. (%)');
    dataRes.addColumn('number', 'Strain error (%)');
    dataRes.addColumn('number', 'Strain std. dev. (%)');

    // read the output files
    var speckleFile = localStorage.getItem("workingDirectory");
    var resFile = localStorage.getItem("workingDirectory");
    if(os.platform()=='win32'){
        speckleFile += '\\synthetic_results\\speckle_stats.txt';
        resFile += '\\synthetic_results\\spatial_resolution.txt';
    }else{
        speckleFile += '/synthetic_results/speckle_stats.txt';
        resFile += '/synthetic_results/spatial_resolution.txt';
    }
    fs.stat(speckleFile, function(err, stat) {                                
        if(err == null) {                                     
        fs.readFile(speckleFile, 'utf8', function (err,dataS) {                                       
            if (err) {
                alert('Error, cannot read file: ' + speckleFile);
                return console.log(err);                                                                  
            }
            //else{
            //   console.log(dataS);
            //}
            var speckleData = dataS.toString().split(/\s+/g).map(Number);
            //console.log(speckleData);
            var i = 0;
            while(i < speckleData.length){
                data.addRow([speckleData[i+0],speckleData[i+1]*100.0]);
                i += 3;
            }
            var options = {
                width: 800,
                height: 500,
                title: 'SPECKLE SIZE CHARACTERIZATION',
                hAxis: {title: 'Speckle size (px)', ticks: [0,2,4,6,8,10,12,14,16,18,20,22]},
                vAxis: {title: 'Image coverage (%)',ticks:[0.0,10,20,30,40,50,60,70,80,90,100]},
                legend: {position: 'none'}
             };
             var chart = new google.visualization.LineChart(document.getElementById('speckleChart'));
             chart.draw(data, options);
         }); // end readFile
         } // end null
         else{
             alert("could not read speckle_stats.txt");
             return;
         }
    }); // end stat
    fs.stat(resFile, function(err, stat) {                                
        if(err == null) {                                     
            fs.readFile(resFile, 'utf8', function (err,dataS) {                                       
            if (err) {                                                                                    
                return console.log(err);                                                                  
            }
            //else{
            //    console.log(dataS);
            //}
            var resDataLines = dataS.toString().split(/\r?\n/);
            // get rid of the first string with the column titles
            resDataLines.splice(0,1);
            //console.log(resDataLines);
            var resData = [];
            for(i=0;i<resDataLines.length;++i){
                 resData.push(resDataLines[i].split(/\s+/g).map(Number));
            }
            console.log(resData);
            for(i=0;i<resData.length-1;++i){
                 dataRes.addRow([resData[i][6],resData[i][16],resData[i][17],resData[i][32],resData[i][33]]);
            }
            var options = {
                width: 800,
                height: 500,
                title: 'SPATIAL RESOLUTION CHARACTERIZATION',
                hAxis: {title:'Motion period (px)',direction: '-1'},// ticks:[0,20,40,60,80,100,120,140,160,180,200],direction:'-1'},
                vAxis: {title:'Relative error (%)',ticks:[0,10,20,30,40,50,60,70,80,90,100]},
                //legend: {position: 'none'}
            };
            var chart = new google.visualization.LineChart(document.getElementById('resChart'));
                chart.draw(dataRes, options);
            }); // end readFile
        } // end null
        else{
            alert("could not read spatial_resolution.txt");
            return;
        }
    }); // end stat
}
