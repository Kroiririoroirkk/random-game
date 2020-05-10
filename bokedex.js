"use strict";
$(document).ready(function() {
  $.getJSON("bokedex.json", function(data) {
    var items = [];
    Object.keys(data).forEach(function(bokemon, i) {
      items.push($("<div/>", {
        "class": "bokemon",
        text: `#${i+1}) ${bokemon}`,
        click: function() {
          $("#info").text(data[bokemon]);
        }
      }));
    });
    $("#sidebar").append(items);
  });
});
