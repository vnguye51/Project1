
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



$.ajax({
  url: "https://cors-anywhere.herokuapp.com/" + "https://jobs.github.com/positions.json?description=python&location=new+york",
  method: "GET"
}).then(function (response) {
  responseArray = []
  //grab data from ajax respone and you can see it in console
  //loop through resonse so dont have to type twice
  for (var i = 0; i < response.length; i++) {
    jobTitle = response[i]['title']
    jobLocation = response[i]["location"]
    jobType = response[i]["type"]
    jobCompany = response[i]["company"]
    jobPosted = (response[i]["created_at"]).slice(0,10)
    responseArray.push(response[i])
  //add row
  var newRow = $('<tr>')
  newRow.append("<td>" + jobPosted + "</td>","<td>" + jobType + "</td>","<td><a href='detailTab.html' target='_blank'>" + jobTitle + "</a></td>", '<td>' + jobLocation + '</td>',"<td>" + jobCompany + "</td>")
  newRow.addClass('jobEntry')
  newRow.attr('data', i)
  $('tbody').append(newRow)
}})

// $(document).on('click','.jobEntry',function(){
//   sessionStorage.responseArray = JSON.stringify(responseArray[+$(this).attr('data')]);
//   window.open('detailTab.html', '_blank');

// })

