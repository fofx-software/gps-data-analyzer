var fs = require('fs');
var moment = require('moment-timezone');

var contract = process.argv[2];

var stopData = require('./' + contract + '/stop_data.js').stopData || [];
if(process.argv.slice(-1)[0] === 'clear') stopData = [];

var dataFiles = process.argv.slice(3, -1);
if(!dataFiles[0] || dataFiles[0] === 'all') {
  dataFiles = fs.readdirSync('./' + contract).filter(function(filename) {
    var datePart = /^[0-9]{1,2}\.[0-9]{1,2}\-[0-9]{1,2}\.[0-9]{1,2}/.exec(filename);
    if(datePart && !dataFiles[0]) {
      var lastDate = stopData.slice(-1)[0].scheduledTime.format('M.D').split('.');
      var thisDate = datePart[0].split('-')[0].split('.');
      return thisDate[0] > lastDate[0] || (thisDate[0] === lastDate[0] && thisDate[1] > lastDate[1])
    } else {
      return !!datePart;
    }
  });
}

var contractInfo = require('./' + contract + '/contract_info.js');
if(!contractInfo.hasOwnProperty('sortByRoute')) contractInfo.sortByRoute = true;
contractInfo.minDiff = contractInfo.minDiff || 0;
contractInfo.maxDiff = contractInfo.maxDiff || 0;
contractInfo.allStops = contractInfo.allStops || [];
contractInfo.goodData = contractInfo.goodData || 0;

dataFiles.forEach(function(filename) {
  var file = fs.readFileSync('./' + contract + '/' + filename, 'utf-8');
  var splitLines = file.split('\n');
  splitLines.slice(1).forEach(function(line) {
    if(line.trim()) {
      var splitLine = line.split(',');
      var stopRecord = {
        routeName: splitLine[1].replace(/[0-9]+\) /,''),
        stopName: splitLine[5],
        vehicleName: splitLine[11],
        scheduledTime: moment.tz(splitLine[14], 'M/D/YYYY h:mm:ss A', 'America/New_York')
      };
      // create arrivalTime & departureTime
      [[12, 'arrivalTime'], [13, 'departureTime']].forEach(function(subarr) {
        if(splitLine[subarr[0]]) {
          stopRecord[subarr[1]] = moment.tz(splitLine[subarr[0]], 'M/D/YYYY h:mm:ss A', 'America/New_York');
          stopRecord[subarr[1]].set('second', 0);
        } else {
          stopRecord[subarr[1]] = undefined;
        }
      });
      // create arriveDiff, update maxDiff & minDiff
      if(stopRecord.arrivalTime) {
        stopRecord.arriveDiff = stopRecord.arrivalTime.diff(stopRecord.scheduledTime, 'minutes');
        if(stopRecord.arriveDiff > contractInfo.maxDiff) contractInfo.maxDiff = stopRecord.arriveDiff;
        if(stopRecord.arriveDiff < contractInfo.minDiff) contractInfo.minDiff = stopRecord.arriveDiff;
        contractInfo.goodData += 1;
      } else {
        stopRecord.arriveDiff = undefined;
      }
      // populate allStops:
      var stopNameAndTime = stopRecord.stopName + stopRecord.scheduledTime.format('Hmm');
      if(contractInfo.allStops.indexOf(stopNameAndTime) === -1) {
        contractInfo.allStops.push(stopNameAndTime);
      }
      stopData.push(stopRecord);
    }
  });
});

stopData.sort(function(a, b) {
  if(contractInfo.sortByRoute) {
    if(a.routeName > b.routeName) return 1;
    if(a.routeName < b.routeName) return -1;
  }
  if(a.scheduledTime.isAfter(b.scheduledTime)) return 1;
  if(b.scheduledTime.isAfter(a.scheduledTime)) return -1;
  return 0;
});

var newFile = 'var moment = require(\'moment\');\n\nexports.stopData = [\n' +
  stopData.map(function(row) {
      return '{' +
        Object.keys(row).map(function(key) {
          var str = key + ':';
          if(moment.isMoment(row[key])) {
            return str + 'moment("' + row[key].toISOString() + '")';
          } else if(typeof row[key] === 'string') {
            return str + '"' + row[key] + '"';
          } else {
            return str + row[key];
          }
        }).join(',')
      + '}';
    }).join(',\n') +
'\n];'

fs.writeFile('./' + contract + '/stop_data.js', newFile);

var newContractInfo = Object.keys(contractInfo).map(function(key) {
  var str = 'exports.' + key + ' = ';
  str += (function representValue(value) {
    if(typeof value === 'string') {
      return '"' + value + '"';
    } else if(Array.isArray(value)) {
      return '[\n  ' + value.map(function(inner) {
        return representValue(inner);
      }).join(',\n  ') + '\n]';
    } else {
      return value;
    }
  })(contractInfo[key]);
  return str + ';';
}).join('\n');

fs.writeFile('./' + contract + '/contract_info.js', newContractInfo);
