var ynsInterval = null;
var ynsIntervalTimer = 1000;
var clickTimeThreshold = 3000;
var ynsTag = "[YouTube Non-Stop] ";
var lastClickTime = null;

window.onload=function(){
  ynsInterval = setInterval(autoClicker, ynsIntervalTimer);
  console.info(ynsTag + "Monitoring YouTube for confirmation popup...");
}

$(document).click(function() {
  lastClickTime = new Date().getTime();
});

function tryClickPaperToast(){
  if($('paper-toast.paper-toast-open').find('#action-button').length){
    $('paper-toast.paper-toast-open').find('#action-button').click();
    console.debug(ynsTag+"Confirmed watching in toast!");
  }
}

function tryClickPaperDialog(){
  var paperDialogs = $('paper-dialog').filter(function(){
    return $(this).css('display') != 'none';
  });
  paperDialogs.each(function() {
    if($(this).find('#confirm-button').length){
      $(this).find('#confirm-button').click();
      console.debug(ynsTag + "Confirmed watching in dialog!");
    }
  });
}

function autoClicker() {
  if(window.location.pathname === '/watch'){
    var currTime = new Date().getTime();
    if(currTime - lastClickTime <= clickTimeThreshold){
      lastClickTime = new Date().getTime();
      return;
    }
    tryClickPaperToast();
    tryClickPaperDialog();
  }
}
