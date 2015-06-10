$.get('6.1-6.5_cypress.txt', function(data) {

var splitLines = data.split('\n').slice(1);

var headers = [
  'date',
  'route',
  'stop',
  'vehicle',
  'arrival',
  'departure',
  'scheduled'
];

var routeRows = splitLines.map(function(line) {
  var obj = {}, line = line.split(',');
  if(line) {
    headers.forEach(function(header, index) {
      obj[header] = line[index];
    });
    return obj;
  }
});

if(!routeRows.slice(-1)[0]) routeRows.pop();

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

var allStops = routeRows.map(function(row) {
  return row.stop;
}).filter(onlyUnique);

var stopData = {};

var makeDate = function(datestr) {
  var date = datestr.split(' ')[0];
  var time = datestr.split(' ')[1];
  var year = date.split('/')[2];
  var month = date.split('/')[0];
  var day = date.split('/')[1];
  var hour = time.split(':')[0];
  var minute = time.split(':')[1];
  return new Date(year, month, day, hour, minute);
}

allStops.forEach(function(stop) {
  stopData[stop] = {
    timeFromLast: [],
    arrivalMinusScheduled: [],
    departureMinusScheduled: []
  };
  var lastRow;
  routeRows.forEach(function(row, index) {
    if(row.stop === stop) {
      var timeFromLast = makeDate(row.arrival) - makeDate(lastRow.arrival);
      var arrivalMinusScheduled = makeDate(row.arrival) - makeDate(row.scheduled);
      var departureMinusScheduled = makeDate(row.departure) - makeDate(row.scheduled);
      stopData[stop].timeFromLast.push(timeFromLast);
      stopDate[stop].arrivalMinusScheduled.push(arrivalMinusScheduled);
      stopData[stop].departureMinusScheduled.push(departureMinusScheduled);
    }
    lastRow = row;
  });
});

console.log(stopData[0]);

});
