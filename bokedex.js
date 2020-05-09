$(document).ready(function() {
  $.getJSON('bokedex.json', function(data) {
    var items = [];
    $.each(data, function(bokemon, desc) {
      items.push($('<div/>', {
        'class': 'bokemon',
        text: bokemon,
        click: function() {
          $('#info').text(desc);
        }
      }));
    });
    $('#sidebar').append(items);
  });
});
