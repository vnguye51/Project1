var map;
var jobTitle
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8
  });
}

console.log('test')
var queryURL = "http://www.zillow.com/webservice/GetSearchResults.htm?zws-id=X1-ZWz18f1y9es74b_7x5fi&address=2114+Bigelow+Ave&citystatezip=Seattle%2C+WA";
$.ajax({
  url: queryURL,
  method: "GET",
})
  .then(function (response) {
    var data = response.data;
    console.log(response)
  })
//gave variable
var jobTitle;
var jobLocation;
var jobType;
var jobCompany;
var jobPosted;

$.ajax({
  url: "https://jobs.github.com/positions.json?description=python&location=new+york",
  method: "GET"
}).then(function (response) {
  console.log(response );
  //grab data from ajax respone and you can see it in console
  //loop through resonse so dont have to type twice
  for (var i = 0; i < response.length; i++) {
  jobTitle = response[i]['title']
  jobLocation = response[i]["location"]
  jobType = response[i]["type"]
  jobCompany = response[i]["company"]
  jobPosted = response[i]["created_at"]
  //add row
  $("tbody").append("<tr><td>" + jobPosted + "<td>" + jobType + "</td><td>" + jobTitle + "</td><td>" + jobLocation + "</td><td>" + jobCompany + "</td></tr>")
  console.log(jobPosted)
}})


  