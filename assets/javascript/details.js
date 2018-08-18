// console.log(JSON.parse(sessionStorage.responseArray))
///////Grab data from local storage based on link clicked on previous tab
var jobAddress
var jobInfo = JSON.parse(sessionStorage.responseArray)
$('#jobInfo').append(jobInfo.company, jobInfo.title,jobInfo.description,jobInfo.location)

var divPointers = []

$('#neighborhoods').on('dataAdded',function(event,index){
  //Insert the new div in sorted order
  //This is needed because the table divs are produced dynamically as google finishes their api calls
  //TODO sort by divpointer and rearrange the divs in the preferred sort
  console.log(index)
  var addedDiv = $('#neighborhoods').children().last().detach()
  console.log(addedDiv)
  // addedDiv.insertAfter("#"+index)
  var placed = false
  for(var i = 0;i<divPointers.length;i++){
    if(divPointers[i] > +index){
      divPointers.splice(i,0,+index)
      console.log('hi',divPointers[i+1],'#'+divPointers[i+1])
      console.log(addedDiv)
      addedDiv.insertBefore('#'+divPointers[i+1])
      placed = true
      return
    } 
  }
  divPointers.push(index)
  $('#neighborhoods').append(addedDiv)
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
       var averageTemp = []
       for (var i = 0;i<monthArray.length;i++){
         var average = Math.round(((+monthArray[i].absMaxTemp_F) + (+monthArray[i].avgMinTemp_F))/2) //Tale the average of the min/max of each month
         averageTemp.push({average: average,month: monthArray[i].name})
       }
       console.log(averageTemp)
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

  $.ajax({
    url: queryURL,
    method: "GET",
  })
    .then(function (response) {
      var json = xmlToJson(response)
      var data = json["RegionChildren:regionchildren"].response.list.region

      sortArrBy(data,'price')

      function parseElement(element){//Grab data of interest from array
        return {
          name: element.name['#text'],
          url: element.url['#text'],
          zindex: element.zindex['#text']
        }
      }

      var homeCandidates = []
      homeCandidates.push(parseElement(data[0]))
      console.log(data)
      var d = (data.length-2)/4.0//TODO: Let the 4 be a user input variable later on and move the data array to the global scope
      var i = 1
      while(i*d<data.length-2){//
        console.log(i*d)
        homeCandidates.push(parseElement(data[Math.round(i*d - 1)]))
        i += 1
      }
      homeCandidates.push(parseElement(data[data.length-1]))
      
      for(var i = 0; i<homeCandidates.length;i++){
        homeCandidates[i].index = i
        console.log(homeCandidates[i].name)
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
queryURL = "https://cors-anywhere.herokuapp.com/" + "https://maps.googleapis.com/maps/api/place/textsearch/json?query=" + query + "&key=AIzaSyAZn90iyzUTnVjifVYvQh7uWUczvW-UsMo"
$.ajax({
  url: queryURL,
  method: "GET",
})
  .then(function (response) {
    var address = parseGoogleAddress(response.results[0].formatted_address)
    callZillow(address)//Call zillow to find houses near this area when the google call is done
    callWeather(address)
  })

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
  }

function geocodeAddress(address, geocoder, resultsMap) {
  geocoder.geocode({'address': address}, function(results, status) {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
        map: resultsMap,
        position: results[0].geometry.location
      });
      markers.push(marker)
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
        var duration = response.routes[0].legs[0].duration.text
        var distance = response.routes[0].legs[0].distance.text
        if (status == 'OK') {
          $('#neighborhoods').append('<div id='+homeObject.index+'>'+homeObject.name + homeObject.url+'Median Value: $' + homeObject.zindex+ 'Duration: '+duration + 'Distance: ' + distance + '</div>' )
          $('#neighborhoods').trigger('dataAdded',homeObject.index)
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

function parseGoogleAddress(address){
  return address.split(', ')
}

//This function is used in the Zillow API call to sort neighborhood candidates
function sortArrBy(arr,sort,jobLocation){//sort is a string that determines what to sort by
  if (sort == 'price'){
  
    arr.sort(function(a,b){
      if(b.zindex && a.zindex){ //Check if both regions have a pricing, if not put it at the bottom
      return +a.zindex['#text'] - +b.zindex['#text']
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