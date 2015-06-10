$.get('6.1-6.5_cypress.txt', function(data) {
  var div = document.createElement('div');
  document.body.appendChild(div);
  div.textContent = data;
})
