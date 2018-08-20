// console.log(JSON.parse(sessionStorage.responseArray))
///////Grab data from local storage based on link clicked on previous tab
var jobAddress
var jobInfo = JSON.parse(sessionStorage.responseArray)
var initialLoad = true
// console.log(jobInfo)
$('#jobInfo').append(jobInfo.description)
$('#company-jobTitle').append(jobInfo.company + ': ' + jobInfo.title)
var divPointers = []

$(document).on('click','.housing',function(event){
  setMapOnAll(null)
  directionsDisplay.setDirections($(this).data())
})

$('#housingInfo').on('dataAdded',function(event,index){
  //Insert the new div in sorted order
  //This is needed because the table divs are produced dynamically as google finishes their api calls
  //TODO sort by divpointer and rearrange the divs in the preferred sort
  var addedDiv = $('#housingInfo').children().last().detach()
  // addedDiv.insertAfter("#"+index)
  var placed = false
  for(var i = 0;i<divPointers.length;i++){
    if(divPointers[i] > +index){
      divPointers.splice(i,0,+index)
      addedDiv.insertBefore('#'+divPointers[i+1])
      placed = true
      return
    } 
  }
  divPointers.push(index)
  $('#housingInfo').append(addedDiv)
})

function callWeather(address){//Grab monthly weather data from World Weather Online
  var ZIP = address[2].slice(3,8)
  var queryURL = "https://cors-anywhere.herokuapp.com/"+"http://api.worldweatheronline.com/premium/v1/weather.ashx?key=c93c25b0d0834362bec82456181808&q="+ZIP+"&mca=yes&format=json"
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function (response) {
       var monthArray = response.data.ClimateAverages[0].month
       var averages = []
       for (var i = 0;i<monthArray.length;i++){
         var temp = Math.round(((+monthArray[i].absMaxTemp_F) + (+monthArray[i].avgMinTemp_F))/2) //Tale the average of the min/max of each month
         averages.push({temp: temp, month: monthArray[i].name, rain: +monthArray[i].avgDailyRainfall})
       }

       var seasonalAverage = []
       seasonalAverage.push({name: 'Spring', temp: Math.round((averages[2].temp+averages[3].temp+averages[4].temp)/3), rain: Math.round((averages[2].rain+averages[3].rain+averages[4].rain)/3*100)/100})
       seasonalAverage.push({name: 'Summer',temp: Math.round((averages[5].temp+averages[6].temp+averages[7].temp)/3), rain: Math.round((averages[5].rain+averages[6].rain+averages[7].rain)/3*100)/100})
       seasonalAverage.push({name: 'Fall', temp: Math.round((averages[8].temp+averages[9].temp+averages[10].temp)/3), rain: Math.round((averages[8].rain+averages[9].rain+averages[10].rain)/3*100)/100})
       seasonalAverage.push({name: 'Winter', temp: Math.round((averages[11].temp+averages[0].temp+averages[1].temp)/3), rain: Math.round((averages[11].rain+averages[0].rain+averages[1].rain)/3*100)/100})
       for(var i = 0; i<seasonalAverage.length; i++){
         if(seasonalAverage[i].rain > 3 && seasonalAverage[i].temp <= 40){
           seasonalAverage[i].icon = 'snow'
         }
         else if(seasonalAverage[i].rain > 4){
          seasonalAverage[i].icon = 'heavyrain'
         }
         else if(seasonalAverage[i].rain > 3){
           seasonalAverage[i].icon = 'moderaterain'
         }
         else if (seasonalAverage[i].rain > 2){
           seasonalAverage[i].icon = 'lightrain'
         }
         else {
           seasonalAverage[i].icon = 'sunny'
         }
         $('#weather').append($('<div>').html(seasonalAverage[i].icon + seasonalAverage[i].name + seasonalAverage[i].temp))
       }

       
    })
}

/////ZILLOW API///////////
//Zillow gets region info and the median price of home sales in that area
//To get rent info we have to access one of zillow's other APIs using the id that this one gives us
function callZillow(address){
  var street = address[0]
  var city = address[1]
  var state = address[2]
  var country = address[3]
  var businessAddress = street + " " + city + " " + state
  var queryURL = "https://cors-anywhere.herokuapp.com/" + "http://www.zillow.com/webservice/GetRegionChildren.htm?zws-id=X1-ZWz18f1y9es74b_7x5fi&state=" + state + "&city=" + city + "&childtype=neighborhood";
  console.log(queryURL)
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function (response) {
      console.log(response)
      // var json = xmlToJson(response)
      // console.log(json)
      // var data = json["RegionChildren:regionchildren"].response.list.region
      data = parseZillowXML(response)

      sortArrBy(data,'price')

      // function parseElement(element){//Grab data of interest from array
      //   return {
      //     name: element.name['#text'],
      //     // url: element.url['#text'],
      //     zindex: element.zindex['#text']
      //   }
      // }

      var homeCandidates = []
      homeCandidates.push(data[0])
      console.log(data)
      var d = (data.length-2)/4.0//TODO: Let the 4 be a user input variable later on and move the data array to the global scope
      var i = 1
      while(i*d<data.length-2){//
        homeCandidates.push(data[Math.round(i*d - 1)])
        i += 1
      }
      homeCandidates.push(data[data.length-1])
      
      for(var i = 0; i<homeCandidates.length;i++){
        homeCandidates[i].index = i
        var homeAddress = homeCandidates[i].name + " " + city + ' ' + state
        calcRoute(homeCandidates[i],homeAddress,businessAddress)
      }

      // var businessAddress = street + " " + city + " " + state
      // var homeAddress = name + " " + city + ' ' + state

      
    })
  }

// /GOOGLE MAPS JSON API/////
// Purpose of this AJAX is to search for the address of the company
// Google geocoding is probably redundant with this 
// /THIS AJAX CALL ALSO RETURNS AN IMAGE OF THE COMPANY MIGHT BE USEFUL TO ADD
query = jobInfo.location + " " + jobInfo.company
function callGoogle(query,secondPass){
  
  queryURL = "https://cors-anywhere.herokuapp.com/" + "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + query + "&key=AIzaSyAZn90iyzUTnVjifVYvQh7uWUczvW-UsMo"
  // console.log(queryURL)
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function (response) {
      // console.log(response)
      if(response.results[0]){
        var address = parseGoogleAddress(response.results[0].formatted_address)
      }
      else if (secondPass == false){
        callGoogle(jobInfo.location,true)
      }
      else{
        return 'Error: No homes matched'
      }
      callZillow(address)//Call zillow to find houses near this area when the google call is done
      callWeather(address)//Determine weather in the area
      callRestaurants(address)
    })
}
// function callRestaurants(query){
//   queryURL = "https://cors-anywhere.herokuapp.com/" + "https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+near+" + query + "&key=AIzaSyAZn90iyzUTnVjifVYvQh7uWUczvW-UsMo"
//   console.log(queryURL)
//   $.ajax({
//     url: queryURL,
//     method: "GET",
//   })
//     .then(function(response){
//       console.log(response)
//       for(var i = 0; i<response.results.length && i<5;i++){
//         //TODO place a marker at each lat and lon
//         var newRestaurant = $('<div>')
//         newRestaurant.append(response.results[i].name)
//         newRestaurant.append(response.results[i].price_level)
//         newRestaurant.append(response.results[i].rating)
//         newRestaurant.attr('id','restaurant'+i)
//         callImage($('#restaurant'+i),response.results[i].photos[0].photo_reference)
//         $('#restaurants').append(newRestaurant)
//       }
//     })
// }
function callRestaurants(query){
    queryURL = "https://cors-anywhere.herokuapp.com/" + "https://api.yelp.com/v3/businesses/search?&term=restaurants&location=" + query + "&sort_by=review_count&radius=1000"
    console.log(queryURL)
    $.ajax({
      url: queryURL,
      method: "GET",
      headers: {
        'Authorization': 'Bearer 39gMve0deRFdd0qGL2vFqZy8aAHYc69RlyFPR631QYuffuWibybqZlVEBs8Lxa_J1bPqAxtn1d3vBgPYD6wGmICH1mMQ3W3mI4aqQCLZtxVy4B4queBgqXadlBZ6W3Yx',
      },
    })
      .then(function(response){
        console.log(response)
        for(var i = 0; i<response.businesses.length && i<3;i++){
          //TODO place a marker at each lat and lon
          var newRestaurant = $('<div>')
          var newImage = $('<img>').attr('src',response.businesses[i].image_url).addClass('foodImage')

          newRestaurant.append(newImage)
          newRestaurant.append(response.businesses[i].alias)
          newRestaurant.append(response.businesses[i].price)
          newRestaurant.append(response.businesses[i].rating)

          newRestaurant.attr('id','restaurant'+i)

          $('#restaurants').append(newRestaurant)
        }
      })
  }


function callImage(targetDiv,ID){
  queryURL = "https://cors-anywhere.herokuapp.com/" + "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&maxheight=400&photoreference=" + ID + "&key=AIzaSyAZn90iyzUTnVjifVYvQh7uWUczvW-UsMo"
  console.log(queryURL)
  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function(response){
      console.log(response)
    })
  // targetDiv.append($('<img>').attr('src',''))
}

function parseGoogleAddress(address){
  //1234 street, San Francisco, CA 94523, USA
  //Due to some places not providing a street address both cases must be handled
  formatted = address.split(', ')
  if (formatted.length == 4){
    return formatted
  }
  if (formatted.length == 3){
    return ['',formatted[0],formatted[1],formatted[2]]
  }
}

callGoogle(query)



///////GOOGLE MAPS EMBEDDED API//////////////
var map;
var markers = []
var geocoder
var address = jobInfo.location + " " + jobInfo.company
var directionsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();
function initMap() {

    var chicago = new google.maps.LatLng(41.850033, -87.6500523);//Chicago is just a placeholder that the map defaults to if no geocode address is found
    var mapOptions = {
      zoom:14,
      center: chicago
    }
    geocoder = new google.maps.Geocoder()
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    directionsDisplay.setMap(map);
    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
  }

function geocodeAddress(address, geocoder, resultsMap) {
  geocoder.geocode({'address': address}, function(results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
        map: resultsMap,
        position: results[0].geometry.location,
        zIndex: 100,
      });
      markers.push(marker)
      var infowindow = new google.maps.InfoWindow({
        content: jobInfo.company,
      })
    infowindow.open(resultsMap,marker)
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}



function calcRoute(homeObject,origin,destination) {
    var request = { //Request Info from google
        origin: origin,
        destination: destination,
        travelMode: 'DRIVING',
        drivingOptions: {
            departureTime: new Date(Date.now()),  // for the time N milliseconds from now. //Change this to traffic hours later
            trafficModel: 'optimistic'
        }
      }
    directionsService.route(request, function(response, status) { //Duration
        // if (!response){
        //   console.log(request,status)
        //   return
        // }
        console.log(response)
        if (status == 'OK') {
          var duration = response.routes[0].legs[0].duration.text
          var distance = response.routes[0].legs[0].distance.text
          // var marker = new google.maps.Marker({
          //   map: resultsMap,
          //   position: results[0].geometry.location,
          //   zIndex: 100,
          // });



          var newRow = $('<div>').attr('id',homeObject.index).addClass('row').addClass(
            'housing')
          newRow.data(response)
          newRow.append($("<div>").html(homeObject.name).addClass('col-md-3'))
          newRow.append($("<div>").html('$'+homeObject.zindex).addClass('col-md-3'))
          newRow.append($("<div>").html(distance).addClass('col-md-3'))
          newRow.append($("<div>").html(duration).addClass('col-md-3'))
          $('#housingInfo').append(newRow)
          $('#housingInfo').trigger('dataAdded',homeObject.index)
        if (initialLoad == true){
          initialLoad = false
          $('#houseLoad').remove()
        }
          // directionsDisplay.setDirections(response); 
        }
        else{
          $('#neighborhoods').append('<div>Error Calculating Home Info</div>')
        }
    });
}

function displayRoute(route,status){
    setMapOnAll(null);
    directionsDisplay.setDirections(route)
    directionsDisplay.infoWindow.open()
}
initMap()
geocodeAddress(address,geocoder,map)
// calcRoute()

//UTILITY FUNCTIONS//

function xmlToJson(xml) {//Obtained from davidwalsh.name/convert-xml-json
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};



//This function is used in the Zillow API call to sort neighborhood candidates
function sortArrBy(arr,sort){//sort is a string that determines what to sort by
  if (sort == 'price'){
  
    arr.sort(function(a,b){
      if(b.zindex && a.zindex){ //Check if both regions have a pricing, if not put it at the bottom
      return a.zindex- b.zindex
      }
      else if(a.zindex){return -1}
      else{return 1}
    })
  }
  for(var i = arr.length-1;i>=0;i--){//Remove all values from the array that do not have pricing
    if (!arr[i].zindex){
      arr.pop()
    }
    else{return}
  }
}
  // SORT BY DISTANCE INCOMPLETE
//   if (sort == 'distance'){
//     arr.sort(function(a,b){
//       return (+a.latitude['#text'] - +b.zindex['#text']
//     })
//   }
// }

function parseZillowXML(xml){
  var data = xml.activeElement.children[2].children[2]
  var count = data.children.length
  var neighborHoodArray = []
  for(var i = 1;i<count;i++){
    var neighborhood = {}
      neighborhood.name = data.children[i].children[1].innerHTML
      if (data.children[i].children[2].nodeName == ('zindex')){
        neighborhood.zindex = +data.children[i].children[2].innerHTML
      }
    neighborHoodArray.push(neighborhood)
  }
  return neighborHoodArray
}

