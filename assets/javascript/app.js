
var map;
var location;
var initMap;
var jobTitle;
var responseArray = [];
var jobTitle;
var jobLocation;
var jobType;
var jobCompany;
var jobPosted;

$("#search").on("click", function (event) {
  event.preventDefault();
  var jobSearch = $("#jsearchInput").val().trim();
  var jobState = $("#stateInput").val().trim();
  $("#jsearchInput").val("");
  $("#stateInput").val("California");

  $.ajax({
    url: "https://cors-anywhere.herokuapp.com/" + "https://jobs.github.com/positions.json?description=" + jobSearch + "&location=" + jobState,
    method: "GET"
  }).then(function (response) {
    
    responseArray = [];
    //grab data from ajax respone and you can see it in console-ak
    //loop through resonse so dont have to type twice-ak
    $("tbody").empty();

    if (response.length < 1 || response === undefined) {
      var newDiv = $("<div>").addClass("card bg-success h3 text-center mx-auto").text("No Results Found")
      $("#noResult").empty();
      $("#noResult").append(newDiv)
    } else {
      $("#noResult").empty();

    }
    for (var i = 0; i < response.length; i++) {
      jobTitle = response[i]['title'];
      jobLocation = response[i]["location"];
      jobType = response[i]["type"];
      jobCompany = response[i]["company"];
      jobPosted = response[i]["created_at"];

      responseArray.push(response[i]);


      //add row-ak
      var newRow = $('<tr>')
      newRow.append("<td class='toBeHiddenMobile'>" + jobPosted.slice(0, 10) + "</td>", "<td>" + jobType + "</td>", "<td>" + jobTitle + "</td>", '<td>' + jobLocation + '</td>', "<td class='toBeHiddenMobile'>" + jobCompany + "</td>")
      newRow.addClass('jobEntry')
      newRow.attr('data', i)
      $('tbody').append(newRow)
      $('tbody').addClass("animated bounceInUp")
      }
})
  
    $(document).on('click', '.jobEntry', function () {
    sessionStorage.responseArray = JSON.stringify(responseArray[+$(this).attr('data')]);
    window.open('detailTab.html', '_blank');
  })
})


