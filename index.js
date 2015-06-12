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
  } else {
    if(routeRows2.length - i >= allStops.length) {
      var oldi = i;
      for(var k = i; k > oldi - allStops.length; k--) {
        if(routeRows2[k].stop === allStops[0]) i = k - allStops.length;
      }
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

allStops.forEach(function(stop) {
  stopData[stop] = {
    travelTimes: {},
    arriveDiffs: {}
  }
});

routeRows.forEach(function(row, index) {
  if(!(index % allStops.length)) {
    loopStart = row.scheduled.split(' ')[1];
  }
  if(!stopData[row.stop].travelTimes[loopStart]) stopData[row.stop].travelTimes[loopStart] = [];
  if(!stopData[row.stop].arriveDiffs[loopStart]) stopData[row.stop].arriveDiffs[loopStart] = [];
  if(index) {
    var lastRow = routeRows[index - 1];
    var lastDate = makeDate(lastRow.scheduled).getDate();
    var thisDate = makeDate(row.scheduled).getDate();
    if(lastDate === thisDate) {
      var travelTime = getMinDiff(row.arrival, lastRow.arrival);
      if(travelTime) {
        stopData[row.stop].travelTimes[loopStart].push(travelTime);
      }
    }
  }
  var arriveDiff = getMinDiff(row.arrival, row.scheduled);
  if(typeof arriveDiff === 'number' && arriveDiff == arriveDiff) {
    stopData[row.stop].arriveDiffs[loopStart].push(arriveDiff);
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
    
    var svgNS = 'http://www.w3.org/2000/svg';
      
    [td1, td2].forEach(function(td) {
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('height', 10);
      svg.setAttribute('width', 0);
      td[0].appendChild(svg);
    });
    
    arriveDiffs[stopTime].forEach(function(diff) {
      var addTo = diff < 0 ? td1 : td2;
      var svg = addTo.find('svg')[0];
      if(Math.abs(diff) > parseInt(svg.getAttribute('width'))) svg.setAttribute('width', Math.abs(diff));
      var circle = document.createElementNS(svgNS, 'circle');
      var x = (parseInt(svg.getAttribute('width')) + diff) * 5;
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', 5);
      circle.setAttribute('r', 5);
      svg.appendChild(circle);
    });
    
  });
});

}
