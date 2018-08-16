$.ajax({
    url:"https://jobs.github.com/positions.json?description=python&location=new+york",
    method: "GET"
  }).then(function(response) {
    console.log(response);
  });