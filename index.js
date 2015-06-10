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

if(typeof stopData.slice(-1)[0].route === 'undefined') stopData.pop();

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

var allStops = stopData.map(function(row, index) {
  return row.stop;
}).filter(onlyUnique);

console.log(allStops);

});
