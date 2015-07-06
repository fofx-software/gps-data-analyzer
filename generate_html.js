var fs = require('fs');
var moment = require('moment-timezone');
var cheerio = require('cheerio');

// node generate_html.js mitre [nodata]

var contract = process.argv[2];
var contractInfo = require('./' + contract + '/contract_info.js');
var stopData = require('./' + contract + '/stop_data.js').stopData;

var minDiffEven = contractInfo.minDiff % 2 ? contractInfo.minDiff - 1 : contractInfo.minDiff;
var maxDiffEven = contractInfo.maxDiff % 2 ? contractInfo.maxDiff + 1 : contractInfo.maxDiff;

var $ = cheerio.load(fs.readFileSync('./index.html', 'utf-8'));

if(process.argv[3] === 'nodata') {
  var table = cheerio.load(fs.readFileSync('./' + contract + '/index.html', 'utf-8'))('#data-table');
  $('#data-table').html(table.html());
} else {
  var table = $('#data-table');
  var td = $('<td>');
  var dateRange = stopData[0].scheduledTime.format('M/D/YY') + ' - ' + stopData.slice(-1)[0].scheduledTime.format('M/D/YY');
  td.append($('<b>').text(dateRange));
  var tr = $('<tr>').append(td);
  for(var diff = minDiffEven; diff <= maxDiffEven; diff += 2) {
    var sign = diff < 0 ? '-' : diff ? '+' : '';
    var td = $('<td class="diff-td">').append(sign + '<br>' + Math.abs(diff));
    if(diff) {
      td.attr({ style: 'min-width:23px;max-width:23px;', colspan: '2' });
    } else {
      td.addClass('no-diff');
    }
    tr.append(td);
  }
  table.append(tr).append(tr.clone());
  
  var goodData = 0;

  stopData.forEach(function(stopDescr, index) {
    var display = function(time) { return time.format('h:mm A'); }
    var camelizeName = function(stopName) { return stopName.toLowerCase().replace(/ /g,'_'); }
  
    var trId = camelizeName(stopDescr.stopName) + stopDescr.scheduledTime.format('HHmm');
    var tr = $('#' + trId);
  
    if(!tr.length) {
      tr = $('<tr>').attr({
        id: trId,
        'data-stop': camelizeName(stopDescr.stopName)
      });
      if(index) {
        tr.attr('data-prevstop', camelizeName(stopData[index - 1].stopName));
      }
      var td = $('<td>');
      table.append(tr.append(td.append('<b>' + display(stopDescr.scheduledTime) + '</b> ' + stopDescr.stopName)));
   
      for(var i = minDiffEven; i <= maxDiffEven; i++) {
        var diffTd = $('<td>').attr({ class: 'diff-td', 'data-diff': i });
        if(i < 0) diffTd.addClass('neg-diff');
        if(!i) diffTd.addClass('no-diff');
        if(i > 0) diffTd.addClass('pos-diff');
        tr.append(diffTd);
      }
    }
 
    if(typeof stopDescr.arriveDiff !== 'undefined') {
      goodData++;

      var diffTd = tr.find('[data-diff=' + stopDescr.arriveDiff + ']');
  
      var toolTip = diffTd.find('.tooltip');
      if(!toolTip.length) {
        toolTip = $('<div>').addClass('tooltip').append($('<div>').text(stopDescr.arrivalTime.format('h:mma')));
        diffTd.append(toolTip);
      }
      toolTip.append($('<div class="date-listing">').text(stopDescr.arrivalTime.format('M/D/YY')));
  
      var allPct = toolTip.find('.date-listing').length / (stopData.length / contractInfo.allStops.length);
      if(allPct >= 1) allPct = "1.0";
      diffTd.css('background-color', 'rgba(' +
        (stopDescr.arriveDiff > 0 ? 255 : 0) + ',' +
        (stopDescr.arriveDiff ? 0 : 255) + ',' +
        (stopDescr.arriveDiff < 0 ? 255 : 0) + ',' +
        allPct + ')'
      ).attr('data-darken-by-all', allPct);
    }
  });

  $('#data-consistency').find('span').text(String(Math.floor(goodData / stopData.length * 100)));
}

fs.writeFile(['.', contract, 'index.html'].join('/'), $.html());
