var map;
var jobTitle
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 8
  });
}

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

  $.ajax({
    url:"https://jobs.github.com/positions.json?description=python&location=new+york",
    method: "GET"
  }).then(function(response) {
    console.log(response,);
    jobTitle = response[0]['title']
    jobLocation = response[0]["location"]
    jobType = response[0]["type"]
    jobCompany = response[0]["company"]

  })
    
  function myCreateFunction() {
   var row = joblist.insertRow(0)
$("#joblist")