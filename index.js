$.get('6.1-6.5_cypress.txt', function(data) {

var splitLines = data.split('\n');

var headers = splitLines.shift().split(',');

var stopData = splitLines.map(function(line) {
  var obj = {};
  headers.forEach(function(header, index) {
    obj[header] = line[index];
  });
  return obj;
});

console.log(stopData[0]);

});
