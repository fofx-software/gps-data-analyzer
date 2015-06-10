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

var stopData = splitLines.map(function(line) {
  var obj = {}, line = line.split(',');
  headers.forEach(function(header, index) {
    obj[header] = line[index];
  });
  return obj;
});

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

var allStops = stopData.map(function(row, index) {
  if(row.stop) {
    return row.stop;
  } else { console.log(stopData[index-1]); }
}).filter(onlyUnique);

console.log(allStops);

});
