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

allStops.forEach(function(stop) {
  stopData[stop] = {
    timeFromLast: [],
    arrivalMinusScheduled: [],
    departureMinusScheduled: []
  };
  var lastRow;
  routeRows.forEach(function(row, index) {
    var timeFromLast = row.arrival - lastRow.arrival;
    var arrivalMinusScheduled = row.arrival - row.scheduled;
    var departureMinusScheduled = row.departure - row.scheduled;
    lastRow = row;
  });
});

});
