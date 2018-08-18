console.log(JSON.parse(sessionStorage.responseArray))

var jobInfo = JSON.parse(sessionStorage.responseArray)

$('#jobInfo').append(jobInfo.company, jobInfo.title,jobInfo.description,jobInfo.location)

var map;
var geocoder
var address = jobInfo.location
var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();
function initMap() {

    var chicago = new google.maps.LatLng(41.850033, -87.6500523);
    var mapOptions = {
      zoom:7,
      center: chicago
    }
    geocoder = new google.maps.Geocoder()
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    directionsDisplay.setMap(map);
  }

  function geocodeAddress(address, geocoder, resultsMap) {
    geocoder.geocode({'address': address}, function(results, status) {
      if (status === 'OK') {
        resultsMap.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
          map: resultsMap,
          position: results[0].geometry.location
        });
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  }
  
function calcRoute() {
    var request = {
        origin: 'UC Berkeley',
        destination: jobInfo.location,
        travelMode: 'DRIVING',
        drivingOptions: {
            departureTime: new Date(Date.now()),  // for the time N milliseconds from now.
            trafficModel: 'optimistic'
        }
        }
    directionsService.route(request, function(response, status) {
        if (status == 'OK') {
        directionsDisplay.setDirections(response);
        }
    });
}

initMap()
geocodeAddress(address,geocoder,map)
calcRoute()