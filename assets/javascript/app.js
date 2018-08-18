
var map;
var location;

var initMap

var jobTitle
var responseArray =[]





var jobTitle;
var jobLocation;
var jobType;
var jobCompany;
var jobPosted;

$("#search").on("click", function (event){ 
  event.preventDefault()
  
  var jobSearch = $("#jsearchInput").val().trim() 
  var jobState = $("#stateInput").val().trim() 
  console.log(jobSearch,jobState) 

  $.ajax({
    url: "https://cors-anywhere.herokuapp.com/" + "https://jobs.github.com/positions.json?description="+jobSearch+"&location="+jobState,
    method: "GET"
  }).then(function (response) {
    console.log("https://cors-anywhere.herokuapp.com/" + "https://jobs.github.com/positions.json?description="+jobSearch+"&location="+jobState)
    responseArray = []
    //grab data from ajax respone and you can see it in console
    //loop through resonse so dont have to type twice
    console.log('asdf')
    for (var i = 0; i < response.length; i++) {
      jobTitle = response[i]['title']
      jobLocation = response[i]["location"]
      jobType = response[i]["type"]
      jobCompany = response[i]["company"]
      jobPosted = response[i]["created_at"]
  
      responseArray.push(response[i])
   //add row
      var newRow = $('<tr>')
      newRow.append("<td>" + jobPosted.slice(0,10) + "</td>","<td>" + jobType + "</td>","<td>" + jobTitle + "</td>", '<td>' + jobLocation + '</td>',"<td>" + jobCompany + "</td>")
      newRow.addClass('jobEntry')
      // newRow.attr('data', response[i])
      $('tbody').append(newRow)



    }$(document).on('click','.jobEntry',function(){ 
 sessionStorage.responseArray = JSON.stringify(responseArray); 
   window.open('detailTab.html', '_blank'); 

  }) 
})
  
 
