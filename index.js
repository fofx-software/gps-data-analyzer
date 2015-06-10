$.get('6.1-6.5_cypress.txt', function(data) {

var splitLines = data.split('\n');
console.log(splitLines[0]);

});
