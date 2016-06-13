var API_DOMAIN = "https://api.instagram.com/v1";
var RECENT_MEDIA_PATH = "/users/self/media/recent";
var NUMBER_OF_PICS;
var total_sentiment = 0;
var caption_count = 0;
var all_scores = [];
// what do you think a variable in all caps means?

$(document).ready(function() {
  var token = window.location.hash;
  if (!token) {
    window.location.replace("./login.html");
  }
  token = token.replace("#", "?"); // Prepare for query parameter
  var mediaUrl = API_DOMAIN + RECENT_MEDIA_PATH + token;

  //Call the instagram api
  $.ajax({
    method: "GET",
    url: mediaUrl,
    dataType: "jsonp",
    success: function(response)
      { 
        handleResponse(response);
        handleSentiment(response); 
      },
    error: function() {
      alert("there has been an error...")
    }
  });
}); 

function handleResponse(response) {
  // console.log(response);

  //Get number of pictures
  NUMBER_OF_PICS = response.data.length;

  //Show the pictures with captions
  for (var i = 0; i < response.data.length; i++) {
    var link = response.data[i].images.standard_resolution.url;
    var newImage = $("<img class=img-fluid img-center>").attr("src", link);
    // newImage.attr("id", "pic-" + i);
    $("#list").append(newImage);
    if (response.data[i].caption != null) {
      var caption = $("<div class=caption></div>").html(response.data[i].caption.text)
    }
    else {
      var caption = $("<div class=caption></div>").html("");
    }
    caption.attr("id", "pic-" + i);
    $("#list").append(caption);
  }

  /* GENERATE STATS
  * 1. EGO SCORE:
  *   1) For each photo, see if the user has liked the photo
  *   2) Divide the number of likes found by total number of
  *      photos
  */

  var selfLikes = 0;
  for (var i = 0; i < NUMBER_OF_PICS; i++) {
    if (response.data[i].user_has_liked) 
      selfLikes++;
  }
  var egoScore = Math.floor((selfLikes / NUMBER_OF_PICS) * 100);

  
  /* 2. POPULARITY SCORE:
  *   1) Sum total number of likes from each photo
  *   2) Divide sum by number of photos on page and return
  *      average
  */
  var likeTotal = 0;
  for (var i = 0; i < NUMBER_OF_PICS; i++) {
    likeTotal += response.data[i].likes.count;
  }
  var popularityScore = Math.round(likeTotal / NUMBER_OF_PICS);

  /* 3. ACTIVE DAYS:
  *   1) Create an array of seven integers
  *   2) for each pic, see which day it was posted on, 
  *      and increment the corresponding integer
  *   3) Return the most popular day
  */

  var days = [0, 0, 0, 0, 0, 0, 0];
  var week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (var i = 0; i < NUMBER_OF_PICS; i++) {
    var time = parseInt(response.data[i].created_time);
    var date = new Date(time * 1000);
    days[date.getDay()]++;
  }
  var mostActiveDay = week[(Math.max.apply(Math, days))];

  /* 4. BREVITY:
  *   1) Sum the length of every caption
  *   2) Divide by number of captions and return average
  */
  var captionLength = 0;
  for (var i = 0; i < NUMBER_OF_PICS; i++) {
    if (response.data[i].caption != null) {
      captionLength += response.data[i].caption.text.length;
    }
  }
  var brevity = Math.round(captionLength / NUMBER_OF_PICS);

  /* 5. THIRST SCORE:
  *   1) Sum the number of hashtags in all the pictures
  *   2) Divide sum by number of pictures and return average
  */
  var hashtagCount = 0;
  for (var i = 0; i < NUMBER_OF_PICS; i++) {
      hashtagCount += response.data[i].tags.length;
      // console.log(hashtagCount);
  }
  // var thirstScore = Math.round(hashtagCount / NUMBER_OF_PICS);
  var thirstScore = (hashtagCount / NUMBER_OF_PICS);

  //Add the stats to the page
  $("#ego").append(egoScore);
  $("#pop").append(popularityScore);
  $("#days").append(mostActiveDay);
  $("#brevity").append(brevity);
  $("#thirst").append(thirstScore);
}

function handleSentiment (response) {
  $.each(response.data, function(i, val) {
    if (val.caption != null)
      var caption = val.caption.text; 
    else var caption = "";
    // Make call to the sentiment API
    var sentURL = "https://twinword-sentiment-analysis.p.mashape.com/analyze/"
    $.ajax({
      method: "POST",
      url: sentURL,
      headers: { "X-Mashape-Key": "vRCyNb1GSDmshH1wdJ4YRG5QM8oVp10uWfwjsnzere3HiJYfCq" },
      data: { text : caption},
      success: function (response) {
        sentimentAnalysis(response, i);
      },
      error: function(response) {
        alert("there has been an error...");
      }
    });
  });
}

function sentimentAnalysis(data, index) {
  console.log(data);
  var newScore = $("<div class=sent></div>").html("Sentiment Score: " + data.score);
  $("#pic-" + index).append(newScore);
  all_scores.push(newScore);
  addSentiment(data.score);
}

function addSentiment(score) {
  caption_count++;
  total_sentiment = (total_sentiment * caption_count) + score;
  total_sentiment /= caption_count;
  $("#sentiment").html(total_sentiment);
}