// this function is to insert commas on the housing amounts
function numberWithCommas(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
///////Grab data from local storage based on link clicked on previous tab
var jobAddress;
var jobInfo = JSON.parse(sessionStorage.responseArray);
var initialLoad = true;

//  added animation to entry - IMR
$('#jobInfo').append(jobInfo.description).addClass("animated bounceInUp");
$('#company-jobTitle').append(jobInfo.company + ': ' + jobInfo.title);
var divPointers = []
$(document).on('click', '.housing', function (event) {
  setMapOnAll(null);
  directionsDisplay.setDirections($(this).data());
})

$('#housingInfo').on('dataAdded', function (event, index) {
  //Insert the new div in sorted order
  //This is needed because the table divs are produced dynamically as google finishes their api calls
  var addedDiv = $('#housingInfo').children().last().detach();
  // added animation to loan onto page - IMR
  addedDiv.addClass("animated bounceInUp");
  var placed = false

  for (var i = 0; i < divPointers.length; i++) {//Loop through the divs and place new divs in sorted order by price
    if (divPointers[i] > +index) {
      divPointers.splice(i, 0, +index);
      addedDiv.insertBefore('#' + divPointers[i + 1]);
      placed = true;
      return;
    }
  }

  divPointers.push(index);
  $('#housingInfo').append(addedDiv);
})

function callWeather(address) {//Grab monthly weather data from World Weather Online
  var ZIP = address[2].slice(3, 8);
  var queryURL = "https://cors-anywhere.herokuapp.com/" + "http://api.worldweatheronline.com/premium/v1/weather.ashx?key=c93c25b0d0834362bec82456181808&q=" + ZIP + "&mca=yes&format=json";
  $.ajax({
    url: queryURL,
    method: "GET",
    error: function(){$('#houseLoad2').remove();$('#weather').empty(); $('#weather').append($('<div>').html('No weather data found'))}
  })
    .then(function (response) {
       var monthArray = response.data.ClimateAverages[0].month
       var averages = []
       for (var i = 0;i<monthArray.length;i++){
         var temp = Math.round(((+monthArray[i].absMaxTemp_F) + (+monthArray[i].avgMinTemp_F))/2) //Tale the average of the min/max of each month
         averages.push({temp: temp, month: monthArray[i].name, rain: +monthArray[i].avgDailyRainfall})
       }
       $('#houseLoad2').remove()
       var seasonalAverage = []
       seasonalAverage.push({name: 'Spring', temp: Math.round((averages[2].temp+averages[3].temp+averages[4].temp)/3), rain: Math.round((averages[2].rain+averages[3].rain+averages[4].rain)/3*100)/100})
       seasonalAverage.push({name: 'Summer',temp: Math.round((averages[5].temp+averages[6].temp+averages[7].temp)/3), rain: Math.round((averages[5].rain+averages[6].rain+averages[7].rain)/3*100)/100})
       seasonalAverage.push({name: 'Fall', temp: Math.round((averages[8].temp+averages[9].temp+averages[10].temp)/3), rain: Math.round((averages[8].rain+averages[9].rain+averages[10].rain)/3*100)/100})
       seasonalAverage.push({name: 'Winter', temp: Math.round((averages[11].temp+averages[0].temp+averages[1].temp)/3), rain: Math.round((averages[11].rain+averages[0].rain+averages[1].rain)/3*100)/100})
       for(var i = 0; i<seasonalAverage.length; i++){
        var seasonCol = $("<div>").addClass("col-md-3").append(seasonalAverage[i].name +"<br>"+ seasonalAverage[i].temp+"&deg"+" F");
        // adding style to weather - IMR
        seasonCol.addClass("h5 text-dark my-auto text-center weatherStrip")


         $('#weather').append(seasonCol)
       }

       
    })
}

/////ZILLOW API///////////
//Zillow gets region info and the median price of home sales in that area
//To get rent info we have to access one of zillow's other APIs using the id that this one gives us
function callZillow(address) {
  var street = address[0];
  var city = address[1];
  var state = address[2];
  var country = address[3];
  var businessAddress = street + " " + city + " " + state;
  var queryURL = "https://cors-anywhere.herokuapp.com/" + "http://www.zillow.com/webservice/GetRegionChildren.htm?zws-id=X1-ZWz18f1y9es74b_7x5fi&state=" + state + "&city=" + city + "&childtype=neighborhood";
  $.ajax({
    url: queryURL,
    method: "GET",
    error: function(){$('#houseLoad').remove();$('#housingInfo').append("Error connecting to Zillow database")}
  })
    .then(function (response) {
      data = parseZillowXML(response);
      if(!data){
        $('#houseLoad').remove();
        $('#housingInfo').append('Housing Info Available for Major US Cities Only')
        return
      }
      sortArrBy(data, 'price');
      var homeCandidates = [];
      homeCandidates.push(data[0]);
      var d = (data.length - 2) / 4.0;
      var i = 1;

      while (i * d < data.length - 2) {
        homeCandidates.push(data[Math.round(i * d - 1)]);
        i += 1;
      }
      homeCandidates.push(data[data.length - 1]);
      if (!homeCandidates[0]){
        $('#houseLoad').remove();
        $('#housingInfo').append('Housing Info Available for Major US Cities Only')
        return
      }

      for (var i = 0; i < homeCandidates.length; i++) {
        homeCandidates[i].index = i;
        var homeAddress = homeCandidates[i].name + " " + city + ' ' + state;
        calcRoute(homeCandidates[i], homeAddress, businessAddress);
      }
    })
}

// /GOOGLE MAPS JSON API/////
// Purpose of this AJAX is to search for the address of the company
// /THIS AJAX CALL ALSO RETURNS AN IMAGE OF THE COMPANY MIGHT BE USEFUL TO ADD
query = jobInfo.location + " " + jobInfo.company;
function callGoogle(query, secondPass) {
  queryURL = "https://cors-anywhere.herokuapp.com/" + "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + query + "&key=AIzaSyAZn90iyzUTnVjifVYvQh7uWUczvW-UsMo"
  $.ajax({
    url: queryURL,
    method: "GET",
    error: function(){console.log('Error connecting to Google Places')}
  })
    .then(function (response) {
      if (response.results[0]) {
        var address = parseGoogleAddress(response.results[0].formatted_address);
      }
      else if (secondPass == false) {
        callGoogle(jobInfo.location, true);
      }
      else {
        return 'Error: No homes matched';
      }
      callZillow(address);//Call zillow to find houses near this area when the google call is done
      callWeather(address);//Determine weather in the area
      callRestaurants(address);//Generate restaurants in the area
    })
}

function callRestaurants(query) {
  queryURL = "https://cors-anywhere.herokuapp.com/" + "https://api.yelp.com/v3/businesses/search?&term=restaurants&location=" + query + "&sort_by=review_count&radius=1000";
  $.ajax({
    url: queryURL,
    method: "GET",
    headers: {
      'Authorization': 'Bearer 39gMve0deRFdd0qGL2vFqZy8aAHYc69RlyFPR631QYuffuWibybqZlVEBs8Lxa_J1bPqAxtn1d3vBgPYD6wGmICH1mMQ3W3mI4aqQCLZtxVy4B4queBgqXadlBZ6W3Yx',
    },
    error: function(){ $('#restaurants').empty(); $('#restaurants').append('Error connecting to Yelp database')}
  })
    .then(function (response) {
      $("#houseLoad3").remove();
      if (response.total == 0){
        
        $('#restaurants').append("NO RESTAURANTS FOUND");
        return;
      }
      for (var i = 0; i < response.businesses.length && i < 3; i++) {
        var newRestaurant = $('<div>').addClass("row border mt-2 pt-2 pb-2");
        var newImage = $('<img>').attr('src', response.businesses[i].image_url).addClass('col-md-4 rounded foodImage');
        var alias = response.businesses[i].alias.replace(/-/g,' ');
        var aliasDiv = $("<div>").addClass("col-md-2 text-center h3 my-auto").html('<a href=' + response.businesses[i].url + " target='_blank'>" + alias + "</a>").css('text-transform','capitalize');
        var priceDiv = $("<div>").addClass("col-md-2 text-center h3 my-auto").append(response.businesses[i].price);
        
        var rating = response.businesses[i].rating
        var ratingImage = $("<img>")
        if (rating == 5){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_5.png')}
        else if (rating == 4.5){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_4_half.png')}
        else if (rating == 4){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_4.png')}
        else if (rating == 3.5){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_3_half.png')}
        else if (rating == 3){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_3.png')}
        else if (rating == 2.5){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_2_half.png')}
        else if (rating == 2){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_2.png')}
        else if (rating == 1.5){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_1_half.png')}
        else if (rating == 1){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_1.png')}
        else if (rating == 0){ratingImage.attr('src','assets/images/Yelp/extra_large/extra_large_0.png')}

        var ratingDiv = $("<div>").addClass("col-md-3 text-center h3 my-auto")
        ratingDiv.append(ratingImage)
        ratingDiv.append($('<div>').html(response.businesses[i].review_count + " reviews").css('font-size','24px'));
       
        newRestaurant.append(newImage);
        newRestaurant.append(aliasDiv);
        newRestaurant.append(priceDiv);
        newRestaurant.append(ratingDiv);
        newRestaurant.attr('id', 'restaurant' + i);

        $('#restaurants').append(newRestaurant);
      }
    })
}


function parseGoogleAddress(address) {
  //1234 street, San Francisco, CA 94523, USA
  //Due to some places not providing a street address both cases must be handled
  formatted = address.split(', ');
  if (formatted.length == 4) {
    return formatted;
  }
  if (formatted.length == 3) {
    return ['', formatted[0], formatted[1], formatted[2]];
  }
}

callGoogle(query)

///////GOOGLE MAPS EMBEDDED API//////////////
var map;
var markers = [];
var geocoder;
var address = jobInfo.location + " " + jobInfo.company;
var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();

function initMap() {
  var chicago = new google.maps.LatLng(41.850033, -87.6500523);//Chicago is just a placeholder that the map defaults to if no geocode address is found
  var mapOptions = {
    zoom: 14,
    center: chicago
  };
  geocoder = new google.maps.Geocoder();
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  directionsDisplay.setMap(map);
  var trafficLayer = new google.maps.TrafficLayer();
  trafficLayer.setMap(map);
}

function geocodeAddress(address, geocoder, resultsMap) {
  geocoder.geocode({ 'address': address }, function (results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
        map: resultsMap,
        position: results[0].geometry.location,
        zIndex: 100,
      });
      markers.push(marker);
      var infowindow = new google.maps.InfoWindow({
        content: jobInfo.company,
      })
      infowindow.open(resultsMap, marker)
    } else {
      console.log('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function calcRoute(homeObject, origin, destination) {
  var request = { //Request Info from google
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING',
    drivingOptions: {
      departureTime: new Date(Date.now()),  // for the time N milliseconds from now. //Change this to traffic hours later
      trafficModel: 'optimistic'
    }
  }
  directionsService.route(request, function (response, status) { //Duration

    if (status == 'OK') {
      var duration = response.routes[0].legs[0].duration.text;
      var distance = response.routes[0].legs[0].distance.text;

      var newRow = $('<div>').attr('id', homeObject.index).addClass('row housing');
      newRow.data(response);
      console.log('<a href='+homeObject.url+' target="_blank">'+homeObject.name+'</a>')
      newRow.append($("<div>").html('<a href='+homeObject.url+' target="_blank">'+homeObject.name+'</a>').addClass('col-md-3'));
      newRow.append($("<div>").html('$ ' + numberWithCommas(homeObject.zindex)).addClass('col-md-3'));
      newRow.append($("<div>").html(distance).addClass('col-md-3'));
      newRow.append($("<div>").html(duration).addClass('col-md-3'));
      $('#housingInfo').append(newRow);
      $('#housingInfo').trigger('dataAdded', homeObject.index);

      if (initialLoad == true) {//If its the first load remove the loadbar
        initialLoad = false;
        $('#houseLoad').remove();
      }
    }
    else {
      $('#housingInfo').append('<div>Error Calculating Home Info</div>');
    }
  });
}

function displayRoute(route, status) {
  setMapOnAll(null);
  directionsDisplay.setDirections(route);
  directionsDisplay.infoWindow.open();
}

initMap();
geocodeAddress(address, geocoder, map);


//UTILITY FUNCTIONS//
//This function is used in the Zillow API call to sort neighborhood candidates
function sortArrBy(arr, sort) {//sort is a string that determines what to sort by
  if (sort == 'price') {

    arr.sort(function (a, b) {
      if (b.zindex && a.zindex) { //Check if both regions have a pricing, if not put it at the bottom
        return a.zindex - b.zindex
      }
      else if (a.zindex) { return -1 }
      else { return 1 }
    });
  };
  for (var i = arr.length - 1; i >= 0; i--) {//Remove all values from the array that do not have pricing
    if (!arr[i].zindex) {
      arr.pop()
    }
    else { return }
  };
};

function parseZillowXML(xml) {
  ///Move through the XML object. Only works in firefox.
  consolexml = xml;
  if (xml.activeElement.children[2] == undefined){
    return
  }
  var data = xml.activeElement.children[2].children[2];
  var count = data.children.length;
  var neighborHoodArray = [];
  
  for (var i = 1; i < count; i++) {
    var neighborhood = {};
    neighborhood.name = data.children[i].children[1].innerHTML;
    neighborhood.url = data.children[i].children[3].innerHTML;
    if (data.children[i].children[2].nodeName == ('zindex')) {
      neighborhood.zindex = +data.children[i].children[2].innerHTML;
    }
    neighborHoodArray.push(neighborhood);
  }
  return neighborHoodArray;
};

