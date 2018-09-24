var ynsInterval = null;
var ynsIntervalTimer = 1000;
var clickTimeThreshold = 3000;
var ynsTag = "[YouTube NonStop] ";
var lastClickTime = null;

window.onload=function(){
  lastClickTime = new Date().getTime();
  ynsInterval = setInterval(autoClicker, ynsIntervalTimer);
  console.info(ynsTag + "Monitoring YouTube for confirmation popup...");
}

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

function tryClickPaperToast(parent){
  if(parent.find('paper-toast.paper-toast-open').find('#action-button').length){
    if(!hasPoppedAfterTimeThreshold()){
      return;
    }
    parent.find('paper-toast.paper-toast-open').find('#action-button').click();
    console.debug(ynsTag + "Confirmed watching in toast!");
  }
}

function tryClickPaperDialog(parent){
  var paperDialog = parent.find('paper-dialog');
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

function autoClicker() {
  if(window.location.pathname === '/watch'){
    var parent = $('ytd-popup-container');
    tryClickPaperToast(parent);
    tryClickPaperDialog(parent);
  }
}
