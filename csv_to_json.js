var fs = require('fs');
var moment = require('moment-timezone');

var filename = './fairlakes/6.1-6.12_pm';

fs.readFile(filename, 'utf-8', function(err, file) {
  var splitLines = file.split('\n');
  var stopRecords = [];
  splitLines.slice(1).forEach(function(line) {
    if(line.trim()) {
      var splitLine = line.split(',');
      var stopRecord = {
        routeName: splitLine[1].replace(/[0-9]+\) /,''),
        stopName: splitLine[5],
        vehicleName: splitLine[11],
        scheduledTime: moment.tz(splitLine[14], 'M/D/YYYY h:mm:ss A', 'America/New_York')
      };
      [[12, 'arrivalTime'], [13, 'departureTime']].forEach(function(subarr) {
        if(splitLine[subarr[0]]) {
          stopRecord[subarr[1]] = moment.tz(splitLine[subarr[0]], 'M/D/YYYY h:mm:ss A', 'America/New_York');
        } else {
          stopRecord[subarr[1]] = undefined;
        }
      });
      if(stopRecord.arrivalTime) {
        stopRecord.arriveDiff = stopRecord.arrivalTime.diff(stopRecord.scheduledTime, 'minutes');
      } else {
        stopRecord.arriveDiff = undefined;
      }
      stopRecords.push(stopRecord);
    }
  });
  var newFile = 'var moment = require(\'moment\');\n\nexports.stopData = [\n';
  stopRecords.forEach(function(row, rowInd) {
    newFile += '{\n';
    Object.keys(row).forEach(function(key, keyInd, keys) {
      newFile += '  ' + key + ': ';
      if(moment.isMoment(row[key])) {
        newFile += 'moment("' + row[key].toISOString() + '")';
      } else {
        if(typeof row[key] === 'string') {
          newFile += '"' + row[key] + '"';
        } else {
          newFile += row[key];
        }
      }
      newFile += (keyInd === keys.length - 1 ? '\n' : ',\n');
    });
    newFile += '}' + (rowInd === stopRecords.length - 1 ? '];' : ',\n');
  });
  
  fs.writeFile(filename + '.js', newFile);
});
