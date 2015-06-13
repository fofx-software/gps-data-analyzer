var fs = require('fs');

var filename = './6.1-6.5_am';

fs.readFile(filename, 'utf-8', function(err, file) {
  var splitLines = file.split('\n');
  var splitCommas = [];
  splitLines.slice(1).forEach(function(line) {
    if(line.trim()) {
      var splitLine = line.split(',');
      splitCommas.push({
        routeName: splitLine[1].replace(/[0-9]+\) /,''),
        stopName: splitLine[5],
        vehicleName: splitLine[11],
        arrivalTime: splitLine[12],
        departureTime: splitLine[13],
        scheduledTime: splitLine[14]
      });
    }
  });
  var json = JSON.stringify(splitCommas).replace(/{/g,'{\n').replace(/},/g,'\n},\n')
  fs.writeFile(filename + '.js', json);
});
