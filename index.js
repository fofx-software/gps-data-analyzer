$.get('6.1-6.5_am', function(data) {

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

var routeRows = [];

splitLines.forEach(function(line) {
  var obj = {}, line = line.split(',');
  if(line[0]) {
    headers.forEach(function(header, index) {
      obj[header] = line[index];
    });
    routeRows.push(obj);
  }
});

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
  if(date1 instanceof Date && date2 instanceof Date) {
    millis = date1 - date2;
    return millis / 1000 / 60;
  }
}

var mean = function(nums) {
  var sum = nums.reduce(function(prev, curr) {
    curr = (curr && curr == curr) ? curr : 0; 
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

var table = document.createElement('table');
var header = document.createElement('tr');
var emptyHeader = $(document.createElement('th'));
var timeFromLastHeader = $(document.createElement('th'));
$(header).append(emptyHeader).append(timeFromLastHeader.text('Time from Last Stop'));
$(table).append(header).appendTo(document.body);

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
      if(lastRow) {
        var lastDate = makeDate(lastRow.scheduled).getDate();
        if(!(makeDate(row.scheduled) instanceof Date)) { console.log(row, index); }
        var thisDate = makeDate(row.scheduled).getDate();
        if(lastDate === thisDate) {
          timeFromLast = getMinDiff(row.arrival, lastRow.arrival);
        }
      }
      var arrivalMinusScheduled = getMinDiff(row.arrival, row.scheduled);
      var departureMinusScheduled = getMinDiff(row.departure, row.scheduled);
      if(timeFromLast) stopData[stop].timeFromLast.push(timeFromLast);
      if(arrivalMinusScheduled) stopData[stop].arrivalMinusScheduled.push(arrivalMinusScheduled);
      if(departureMinusScheduled) stopData[stop].departureMinusScheduled.push(departureMinusScheduled);
    }
    lastRow = row;
  });
  var tr = $(document.createElement('tr'));
  var td = $(document.createElement('td'));
  tr.append(td.text(stop)).appendTo(table);
  var meanTFL = Math.ceil(mean(stopData[stop].timeFromLast));
  var medianTFL = Math.ceil(median(stopData[stop].timeFromLast));
  var td = $(document.createElement('td')).appendTo(tr);
  td.text(meanTFL);
});

});
