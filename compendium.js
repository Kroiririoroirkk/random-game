"use strict";
$(document).ready(function() {
  $.getJSON("compendium.json", function(data) {
    var items = [];
    Object.keys(data).forEach(function(terrekin, i) {
      items.push($("<div/>", {
        "class": "terrekin",
        text: `#${i+1}) ${terrekin}`,
        click: function() {
          $("#info").text(data[terrekin]);
        }
      }));
    });
    $("#sidebar").append(items);
  });
});
