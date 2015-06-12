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
      for(var k = i, found = false; k > oldi - allStops.length && found; k--) {
        if(routeRows2[k].stop === allStops[0]) i = k - allStops.length, found = true;
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

var table = $(document.createElement('table')).attr('border', '1').css('border-collapse', 'collapse');
var header = $(document.createElement('tr'));
['stop', 'early arrival', 'late arrival'].forEach(function(thText) {
  $(document.createElement('th')).text(thText).appendTo(header);
});
$(table).append(header).appendTo(document.body);

routeRows.forEach(function(row) {
  var scheduled = row.scheduled.split(' ')[1];
  var trId = row.stop + scheduled.replace(/:/,'');
  var tr = $(document.getElementById(trId));
  var td1 = tr.find('td').eq(1);
  var td2 = tr.find('td').eq(2);
  var svgNS = 'http://www.w3.org/2000/svg';

  if(!tr.length) {
    tr = $(document.createElement('tr')).attr('id', trId);
    var td = $(document.createElement('td'));
    tr.append(td.text(scheduled + ' ' + row.stop)).appendTo(table);
  
    if(row.stop === 'Vienna Metro') tr.css('background-color', 'yellow');
  
    td1 = $(document.createElement('td'));
    td2 = $(document.createElement('td'));
    tr.append(td1).append(td2);
  
    [td1, td2].forEach(function(td) {
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('height', 10);
      svg.setAttribute('width', 0);
      td[0].appendChild(svg);
    });
  }

  var arriveDiff = getMinDiff(row.arrival, row.scheduled);
  if(typeof arriveDiff === 'number' && arriveDiff == arriveDiff) {
    var addTo = arriveDiff < 0 ? td1 : td2;
    var svg = addTo.find('svg');
    if(Math.abs(arriveDiff) * 10 > parseInt(svg.attr('width'))) { 
      svg.attr('width', Math.abs(arriveDiff) * 10);
    }
    
    var x;
    if(arriveDiff < 0) {
      x = parseInt(svg.attr('width')) + (arriveDiff * 10) + 5;
    } else {
      x = arriveDiff * 10 - 5;
    }
    
    var circle = svg.find('circle[cx="' + x + '"]');
    if(!circle.length) {
      circle = $(document.createElementNS(svgNS, 'circle')).attr({
        cx: x, cy: 5, r: 5
      }).appendTo(svg);
    }
    
    var toolTip = addTo.find('div[data-circle="' + x + '"]');
    if(!toolTip.length) {
      toolTip = $(document.createElement('div')).css({
        position: 'fixed',
        backgroundColor: 'black',
        color: 'white'
      }).attr('data-circle', x).text(row.arrival).appendTo(addTo).hide();
    } else {
      toolTip.append('<br/>' + row.arrival);
    }
    
    $(circle).on({
      mousemove: function(e) {
        toolTip.css({
          left: $(e).pageX, top: $(e).pageY
        }).show();
      },
      mouseout: function() {
        toolTip.hide();
      }
    });    
  }
});

}
