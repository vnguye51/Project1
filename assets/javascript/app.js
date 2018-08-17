var map;
var location;

var initMap


console.log('test')
var queryURL = "http://www.zillow.com/webservice/GetSearchResults.htm?zws-id=X1-ZWz18f1y9es74b_7x5fi&address=2114+Bigelow+Ave&citystatezip=Seattle%2C+WA";
$.ajax({
  url: queryURL,
  method: "GET",
})
  .then(function(response) {
    var data = response.data;
    console.log(response)
  })


  var queryURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=New York,NY&key=AIzaSyAZn90iyzUTnVjifVYvQh7uWUczvW-UsMo'
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function(response) {
      var location = response.results[0].geometry.location;
      initMap = function(){
        map = new google.maps.Map(document.getElementById('map'), {
          center: location,
          zoom: 8
        });
        var marker = new google.maps.Marker({
          position: location,
          map: map,
          title: 'Hello World!'
        });

        var trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
        
      }
    })
  