var ynsInterval = null;
var ynsIntervalTimer = 1000;

window.onload=function(){
  ynsInterval = setInterval(ynsAutoClicker, ynsIntervalTimer);
}

function ynsAutoClicker() {
  var searchText = "Video paused. Continue watching?"; //text to look for
  var questionElement = $("yt-formatted-string:contains("+searchText+")");
  if(questionElement.length){
    questionElement.each(function() {
      var parents = $(this).parents('paper-dialog');
      if(!parents.length){ //if no parents search next element
        return true;
      }
      if(parents.first().css('display') == 'none'){ //if found but is hidden all good
        return false;
      }
      parents.first().find("#confirm-button").click(); //bye bye
      console.log("Just confirmed");
      return false;
    });
  }
}
