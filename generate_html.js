var fs = require('fs');
var moment = require('moment-timezone');
var cheerio = require('cheerio');

var routeInfo = {
  contract: 'fairlakes',
  sortByRoute: true,
  stopData: [],
  allStops: [],
  minDiff: 0,
  maxDiff: 0,
  earliestDate: undefined,
  latestDate: undefined
};

fs.readdirSync(routeInfo.contract).forEach(function(filename) {
  if(/js$/.test(filename)) {
    var loaded = require('./' + routeInfo.contract + '/' + filename).stopData;
    routeInfo.stopData = routeInfo.stopData.concat(loaded);
  }
});

routeInfo.stopData.sort(function(a, b) {
  if(routeInfo.sortByRoute) {
    if(a.routeName > b.routeName) return 1;
    if(a.routeName < b.routeName) return -1;
  }
  if(a.scheduledTime.isAfter(b.scheduledTime)) return 1;
  if(b.scheduledTime.isAfter(a.scheduledTime)) return -1;
  return 0;
});

routeInfo.stopData.forEach(function(stopDescr) {
  var stopNameTime = stopDescr.stopName + stopDescr.scheduledTime.format('Hmm');
  if(!(routeInfo.allStops.indexOf(stopNameTime) > -1)) {
    routeInfo.allStops.push(stopNameTime);
  }
  routeInfo.minDiff = Math.min(stopDescr.arriveDiff || 0, routeInfo.minDiff);
  routeInfo.maxDiff = Math.max(stopDescr.arriveDiff || 0, routeInfo.maxDiff);

  if(!routeInfo.earliestDate) {
    routeInfo.earliestDate = stopDescr.scheduledTime;
  } else if(routeInfo.earliestDate.isAfter(stopDescr.scheduledTime)) {
    routeInfo.earliestDate = stopDescr.scheduledTime;
  }

  if(!routeInfo.latestDate) {
    routeInfo.latestDate = stopDescr.scheduledTime;
  } else if(stopDescr.scheduledTime.isAfter(routeInfo.latestDate)) {
    routeInfo.latestDate = stopDescr.scheduledTime;
  }
});

var $ = cheerio.load(fs.readFileSync('./index.html', 'utf-8'));
var table = $('#data-table');
var thText = 'Date range: ' + routeInfo.earliestDate.format('M/D/YY') + '-' + routeInfo.latestDate.format('M/D/YY');
var th = $('<th>').attr('colspan', routeInfo.maxDiff - routeInfo.minDiff + 2).text(thText);
table.append($('<tr>').append(th));

routeInfo.stopData.forEach(function(stopDescr) {
  var display = function(time) { return time.format('h:mm A'); }

  var trId = stopDescr.stopName.toLowerCase().replace(/ /g,'_') + stopDescr.scheduledTime.format('HHmm');
  var tr = $('#' + trId);

  if(!tr.length) {
    tr = $('<tr>').attr('id', trId);
    var td = $('<td>');
    table.append(tr.append(td.append('<b>' + display(stopDescr.scheduledTime) + '</b> ' + stopDescr.stopName)));
 
    if(stopDescr.stopName === 'Vienna Metro') tr.addClass('border-top');

    for(var i = routeInfo.minDiff; i < routeInfo.maxDiff; i++) {
      var diffTd = $('<td>').attr({ class: 'diff-td', 'data-diff': i });
      tr.append(diffTd);
    }
  }

  if(typeof stopDescr.arriveDiff !== 'undefined') {
    var diffTd = tr.find('[data-diff=' + stopDescr.arriveDiff + ']');

    var toolTip = diffTd.find('.tooltip');
    if(!toolTip.length) {
      toolTip = $('<div>').addClass('tooltip').append($('<div>').text(stopDescr.arrivalTime.format('h:mma')));
      diffTd.append(toolTip);
    }
    toolTip.append($('<div>').text(stopDescr.arrivalTime.format('M/D/YY')));

    var quant = (toolTip.find('div').length - 1) / (routeInfo.stopData.length / routeInfo.allStops.length);
    diffTd.css('background-color', 'rgba(' +
      (stopDescr.arriveDiff < 0 ? 0 : 255) + ',0,' +
      (stopDescr.arriveDiff < 0 ? 255 : 0) + ',' +
      quant + ')'
    );
  }
});

fs.writeFile(['.', routeInfo.contract, 'index.html'].join('/'), $.html());
