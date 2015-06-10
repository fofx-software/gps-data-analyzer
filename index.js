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
  if(datestr) {
    var date = datestr.split(' ')[0];
    var time = datestr.split(' ')[1];
    var year = parseInt(date.split('/')[2]);
    var month = parseInt(date.split('/')[0]) - 1;
    var day = parseInt(date.split('/')[1]);
    var hour = parseInt(time.split(':')[0]);
    var minute = parseInt(time.split(':')[1]);
    return new Date(year, month, day, hour, minute);
  }
}

var getMinDiff = function(date1, date2) {
  date1 = makeDate(date1);
  date2 = makeDate(date2);
  millis = date1 - date2;
  return millis / 1000 / 60;
}

var mean = function(nums) {
  var sum = nums.reduce(function(prev, curr) {
    curr = curr == curr ? curr : 0; 
    return prev + curr;
  }, 0);
  return sum / nums.length;
}

var median = function(nums) {
  nums.sort();
  var above = Math.ceil(nums.length / 2);
  var below = Math.floor(nums.length / 2);
  return mean([nums[above], nums[below]]);
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
      var timeFromLast;
      if(lastRow && makeDate(lastRow.scheduled).getDate() === makeDate(row.scheduled).getDate()) {
        timeFromLast = getMinDiff(row.arrival, lastRow.arrival);
      }
      var arrivalMinusScheduled = getMinDiff(row.arrival, row.scheduled);
      var departureMinusScheduled = getMinDiff(row.departure, row.scheduled);
      stopData[stop].timeFromLast.push(timeFromLast);
      stopData[stop].arrivalMinusScheduled.push(arrivalMinusScheduled);
      stopData[stop].departureMinusScheduled.push(departureMinusScheduled);
    }
    lastRow = row;
  });
  var div = document.createElement('div');
  var meanTFL = Math.ceil(mean(stopData[stop].timeFromLast));
  var medianTFL = Math.ceil(median(stopData[stop].timeFromLast));
  div.textContent = stop + ': { timeFromLast: { mean: ' + meanTFL + ', median: ' + medianTFL + ' } }';
  document.body.appendChild(div);
});

});
