var csv;

$.get('6.1-6.5_am', function(data) { csv = data; })
 .done(processData);

function processData() { 

var splitLines = csv.split('\n').slice(1);

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

var allStops = [];

routeRows.some(function(row) {
 if(allStops.indexOf(row.stop) > -1) {
   return true;
 } else {
   allStops.push(row.stop);
 }
});

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
  if(nums.length % 2) {
   return nums[(nums.length - 1) / 2];
  } else {
    var above = nums.length / 2 + 1;
    var below = nums.length / 2;
    return mean([nums[above], nums[below]]);
  }
}

var table = $(document.createElement('table')).attr('border', 1);
var header = $(document.createElement('tr'));
var emptyHeader = $(document.createElement('th')).appendTo(header);
var timeFromLastHeader = $(document.createElement('th')).attr('colspan', 4);
header.append(timeFromLastHeader.text('Time from Last Stop'));
var arrivalMinusScheduledHeader = $(document.createElement('th')).attr('colspan', 3);
header.append(arrivalMinusScheduledHeader.text('Arrival Minus Scheduled'));
$(table).append(header).appendTo(document.body);

allStops.forEach(function(stop) {
  stopData = {
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
          timeFromLast = getMinDiff(row.arrival, lastRow.departure);
          if(!stopData.scheduledTime) {
            stopData.scheduledTime = getMinDiff(row.scheduled, lastRow.scheduled);
          }
        }
      }
      var arrivalMinusScheduled = getMinDiff(row.arrival, row.scheduled);
      var departureMinusScheduled = getMinDiff(row.departure, row.scheduled);
      if(timeFromLast) stopData.timeFromLast.push(timeFromLast);
      if(arrivalMinusScheduled) stopData.arrivalMinusScheduled.push(arrivalMinusScheduled);
      if(departureMinusScheduled) stopData.departureMinusScheduled.push(departureMinusScheduled);
    }
    lastRow = row;
  });
  var tr = $(document.createElement('tr'));
  var td = $(document.createElement('td'));
  tr.append(td.text(stop)).appendTo(table);
  var meanTFL = Math.ceil(mean(stopData.timeFromLast));
  var medianTFL = Math.ceil(median(stopData.timeFromLast));

  (function appendTd(text) {
    var td = $(document.createElement('td')).appendTo(tr);
    td.text(text);
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttributeNS(svgNS, 'width', '200');
    svg.setAttributeNS(svgNS, 'height', '200');
    td.append(svg);
    return appendTd;
  })('median: ' + medianTFL)
    ('mean: ' + meanTFL)
    ('scheduled: ' + stopData.scheduledTime)
    ('data points: ' + stopData.timeFromLast.length)
    ('median: ' + Math.ceil(median(stopData.arrivalMinusScheduled)))
    ('mean: ' + Math.ceil(mean(stopData.arrivalMinusScheduled)))
    ('data points: ' + stopData.arrivalMinusScheduled.length);
    
});

}
