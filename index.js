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

var routeRows2 = routeRows.slice();
routeRows = [];

for(var i = 0; i < routeRows2.length; i += allStops.length) {
  if(routeRows2[i].stop === allStops[0]) {
    var found = false;
    for(var j = 0; j < routeRows.length && !found; j += allStops.length) {
      var date1 = makeDate(routeRows[j].scheduled);
      var date2 = makeDate(routeRows2[i].scheduled);
      var time1 = date1.getHours() * 100 + date1.getMinutes();
      var time2 = date2.getHours() * 100 + date2.getMinutes();
      if(time1 > time2) {
        var removed = routeRows2.slice(i, i + allStops.length);
        routeRows.splice.apply(routeRows, [j, 0].concat(removed));
        found = true;
      }
    }
    if(!found) {
      routeRows = routeRows.concat(routeRows2.slice(i, i + allStops.length));
    }
  }
}

function makeDate(datestr) {
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

var stopData = {}, loopStart;

routeRows.forEach(function(row, index) {
  var thisStop = stopData[row.stop] = stopData[row.stop] || {
    travelTimes: {},
    arriveDiffs: {}
  };
  if(!(index % allStops.length)) {
    loopStart = row.scheduled.split(' ')[1];
  }
  var travelTimes = thisStop.travelTimes[loopStart] = thisStop.travelTimes[loopStart] || [];
  var arriveDiffs = thisStop.arriveDiffs[loopStart] = thisStop.arriveDiffs[loopStart] ||  [];
  if(index) {
    var lastRow = routeRows[index - 1];
    var lastDate = makeDate(lastRow.scheduled).getDate();
    var thisDate = makeDate(row.scheduled).getDate();
    if(lastDate === thisDate) {
      var travelTime = getMinDiff(row.arrival, lastRow.arrival);
      if(travelTime) {
        travelTimes.push(travelTime);
      }
    }
  }
  var arriveDiff = getMinDiff(row.arrival, row.scheduled);
  if(arriveDiff) {
    arriveDiffs.push(arriveDiff);
  }
});

var table = $(document.createElement('table')).attr('border', '1').css('border-collapse', 'collapse');
var header = $(document.createElement('tr'));
var emptyHeader = $(document.createElement('th')).appendTo(header);
$(table).append(header).appendTo(document.body);

allStops.forEach(function(stop, stopIndex) {
  var tr = $(document.createElement('tr'));
  var td = $(document.createElement('td'));
  tr.append(td.text(stop)).appendTo(table);
  
  var arriveDiffs = stopData[stop].arriveDiffs;
  
  Object.keys(arriveDiffs).forEach(function(stopTime) {
    if(!stopIndex) {
      var th = $(document.createElement('th'));
      header.append(th.text(stopTime).attr('colspan', 2));
    }
    var td1 = $(document.createElement('td'));
    var td2 = $(document.createElement('td'));
    tr.append(td1).append(td2);
    
    arriveDiffs[stopTime].forEach(function(diff) {
      var addTo = diff < 0 ? td1 : td2;
      addTo.text(addTo.text() + diff);
    });
    
  });
});    

/*
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
*/

}
