window.onload = function() {

var routeRows = [], allStops = [];

data.forEach(function(row) {
  var arriveDiff = getMinDiff(row.arrivalTime, row.scheduledTime);

  if(typeof arriveDiff !== 'number' || arriveDiff != arriveDiff) arriveDiff = null;

  routeRows.push({
    scheduledTime: row.scheduledTime.split(' ')[1].replace(/:00/,''),
    stopName: row.stopName,
    arriveDiff: arriveDiff,
    arrivalDate: row.arrivalTime ? row.arrivalTime.split(' ')[0].replace(/:00/,'') : '',
    arrivalTime: row.arrivalTime ? row.arrivalTime.split(' ')[1].replace(/:00/,'') : ''
  });
  if(allStops.indexOf(row.stopName + row.scheduledTime.split(' ')[1]) === -1)
    allStops.push(row.stopName + row.scheduledTime.split(' ')[1]);
});

function getMinDiff(date1, date2) {
  date1 = new Date(date1);
  date2 = new Date(date2);
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

var table = $('<table>').css('border-collapse', 'collapse').appendTo(document.body);

routeRows.forEach(function(row) {
  var trId = row.stopName.toLowerCase().replace(/ /,'') + row.scheduledTime.replace(/:/,'');
  var tr = $(document.getElementById(trId));
  var td1 = tr.find('td').eq(1);
  var td2 = tr.find('td').eq(2);

  if(!tr.length) {
    tr = $(document.createElement('tr')).attr('id', trId);
    var td = $(document.createElement('td'));
    tr.append(td.append('<b>' + row.scheduledTime + '</b> ' + row.stopName)).appendTo(table);
  
    if(row.stopName === 'Vienna Metro') tr.css({ borderTop: '1px solid black' });
  
    td1 = $(document.createElement('td')).css({ position: 'relative' });
    td2 = $(document.createElement('td')).css({ position: 'relative' });
    tr.append(td1).append(td2);
  }

  if(row.arriveDiff !== null) {
    var addTo = row.arriveDiff < 0 ? td1 : td2;

    var bar = td2.find('div[data-arrive-diff="' + row.arriveDiff + '"]');
    if(!bar.length) {
      var x, diam = 10;
      if(row.arriveDiff < 0) {
        x = (row.arriveDiff - 1) * diam + diam / 2;
      } else {
        x = row.arriveDiff * diam - diam / 2;
      }

      bar = $(document.createElement('div')).css({
        position: 'absolute',
        height: '100%',
        width: diam,
        top: 0,
        left: x,
        display: 'inline-block'
      }).attr('data-arrive-diff', row.arriveDiff).appendTo(td2);

      if(Math.abs(row.arriveDiff) * diam > addTo.width())
        addTo.width(Math.abs(row.arriveDiff) * diam);

      bar.on({
        mouseenter: function(e) {
          $(this).find('.tooltip').show();
        },
        mouseleave: function() {
          $(this).find('.tooltip').hide();
        }
      });
    }

    var toolTip = bar.find('.tooltip');
    if(!toolTip.length) {
      toolTip = $(document.createElement('div')).css({
        position: 'absolute',
        left: 10,
        top: 10,
        backgroundColor: 'black',
        color: 'white',
        'z-index': 1000,
        padding: 5,
        textAlign:'center'
      }).addClass('tooltip')
        .append($('<div>').text(row.arrivalTime))
        .appendTo(bar).hide();
    }
    toolTip.append($('<div>').text(row.arrivalDate));

    var quant = 255 - Math.round((toolTip.find('div').length - 1) / (routeRows.length / allStops.length) * 255);
    bar.css('background-color', 'rgba(' +
      (row.arriveDiff < 0 ? 0 : 255) + ',0,' +
      (row.arriveDiff < 0 ? 255 : 0) + ',' +
      (255 - quant) / 255 + ')'
    );
  }
});

}
