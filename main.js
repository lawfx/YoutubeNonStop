var ynsTag = "[Youtube NonStop] ";
window.onload=function(){
  if (typeof(Worker) !== "undefined") {
    // URL.createObjectURL
    window.URL = window.URL || window.webkitURL;
    var response = `var ynsInterval = null;
    var ynsIntervalTimer = 1000;
    var clickTimeThreshold = 3000;
    var lastClickTime = null;

    lastClickTime = new Date().getTime();
    //ynsInterval = setInterval(autoClicker, ynsIntervalTimer);
    postMessage("Monitoring YouTube for confirmation popup...");

    function hasPoppedAfterTimeThreshold(){
      var currTime = new Date().getTime();
      if(currTime - lastClickTime <= clickTimeThreshold){
        lastClickTime = new Date().getTime();
        return false;
      }
      return true;
    }

    function tryClickPaperToast(parent){
      if(parent.find("paper-toast.paper-toast-open").find("#action-button").length){
        if(!hasPoppedAfterTimeThreshold()){
          return;
        }
        parent.find("paper-toast.paper-toast-open").find("#action-button").click();
        postMessage("Confirmed watching in toast!");
      }
    }

    function tryClickPaperDialog(parent){
      var paperDialog = parent.find("paper-dialog");
      if(paperDialog.length){
        if(paperDialog.css("display") != "none"){
          if(!hasPoppedAfterTimeThreshold()){
            return;
          }
          if(paperDialog.find("#confirm-button").length){
            paperDialog.find("#confirm-button").click();
            postMessage("Confirmed watching in dialog!");
          }
        }
      }
    }

    self.onmessage = function(e){
      postMessage(e.data);
    };

    function autoClicker() {
      if(window.location.pathname === "/watch"){
        var parent = $("ytd-popup-container");
        //tryClickPaperToast(parent);
        tryClickPaperDialog(parent);
      }
    }`;
    var blob;
    try {
        blob = new Blob([response], {type: 'application/javascript'});
    } catch (e) { // Backwards-compatibility
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(response);
        blob = blob.getBlob();
    }
    var worker = new Worker(URL.createObjectURL(blob));
      console.log("test");
      worker.onmessage = function(e){
        console.log(ynsTag + e.data);
      };

      $(document).click(function() {
        lastClickTime = new Date().getTime();
        worker.postMessage(lastClickTime);
      });
  } else {
      console.error(ynsTag + "Sorry, your browser doesn't support Web Workers! :/");
  }
}
