//trigger popup example
//https://www.youtube.com/watch?v=6gN0LFriw9E&t=5769

var ynsTag = "[Youtube NonStop] ";
var clickTimeThreshold = 3000;
var lastClickTime = new Date().getTime();
var fakeClick = false;
var confirmActed = 0;
var videoActed = 0;

$(document).click(function() {
  if(!fakeClick){
    lastClickTime = new Date().getTime();
  }
  else{
    fakeClick = false;
  }
});

function hasPoppedAfterTimeThreshold(){
  var currTime = new Date().getTime();
  if(currTime - lastClickTime <= clickTimeThreshold){
    lastClickTime = new Date().getTime();
    return false;
  }
  return true;
}

function tryClickPaperDialog(){
  var paperDialog = $('ytd-popup-container').find('paper-dialog');
  if(paperDialog.length){
    if(paperDialog.css('display') != 'none'){
      if(!hasPoppedAfterTimeThreshold()){
        return;
      }
      if(paperDialog.find('#confirm-button').length){
        fakeClick = true;
        paperDialog.find('#confirm-button').click();
        confirmActed = new Date().getTime();
        console.debug(ynsTag + "Confirmed watching in dialog!");
      }
    }
  }
}

function tryClickPausedVideo(){
  if($('.html5-video-player').hasClass("paused-mode")){
    if(!hasPoppedAfterTimeThreshold()){
      return;
    }
    fakeClick = true;
    $("video").click();
    videoActed = new Date().getTime();
    console.debug(ynsTag + "Detected paused video and clicked it to continue!");
  }
}

if (typeof(Worker) !== "undefined") {

  var response = `var ynsIntervalTimer = 500;

  setInterval(whipWorker, ynsIntervalTimer);
  postMessage("Monitoring YouTube for confirmation popup...");

  function whipWorker(){
    postMessage("whip");
  }`;

  var blob;
  try {
      blob = new Blob([response], {type: 'application/javascript'});
  } catch (e) { // Backwards-compatibility
      blob = new BlobBuilder();
      blob.append(response);
      blob = blob.getBlob();
  }

  var worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = function(e){
      if(e.data === "whip"){
        if(new Date().getTime() - confirmActed >= 2000){
          tryClickPaperDialog();
        }
        if(new Date().getTime() - videoActed >= 2000 && new Date().getTime() - confirmActed >= 2000){
          tryClickPausedVideo();
        }
      }
      else{
        console.log(ynsTag + e.data);
      }
    };
}
else {
    console.error(ynsTag + "Sorry, your browser doesn't support Web Workers! :/");
}
