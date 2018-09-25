var ynsTag = "[Youtube NonStop] ";
var clickTimeThreshold = 3000;
var lastClickTime = new Date().getTime();

$(document).click(function() {
  lastClickTime = new Date().getTime();
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
        paperDialog.find('#confirm-button').click();
        console.debug(ynsTag + "Confirmed watching in dialog!");
      }
    }
  }
}

window.onload=function(){
  if (typeof(Worker) !== "undefined") {

    var response = `var ynsInterval = null;
    var ynsIntervalTimer = 1000;

    ynsInterval = setInterval(whipWorker, ynsIntervalTimer);
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
          tryClickPaperDialog();
        }
        else{
          console.log(ynsTag + e.data);
        }
      };
  }
  else {
      console.error(ynsTag + "Sorry, your browser doesn't support Web Workers! :/");
  }
}
