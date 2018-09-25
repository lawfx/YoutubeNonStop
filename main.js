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
    ynsInterval = setInterval(function() { getFromWorker("pathname"); }, ynsIntervalTimer);
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
        if(paperDialog.css("display") !== "none"){
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
      var msg = e.data;
      if(msg.pathname){
        getFromWorker("container");
      }
      else if(msg.container){
        //todo see what to do with container
        postMessage(e.data.container);
      }
      //postMessage(e.data);
    };

    function getPathname() {
      postMessage("pathname");
      /*if(window.location.pathname === "/watch"){
        var parent = $("ytd-popup-container");
        //tryClickPaperToast(parent);
        tryClickPaperDialog(parent);
      }*/
    }

    function getFromWorker(data){
      postMessage(data);
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
      worker.onmessage = function(e){
        var msg = e.data;
        if(msg === "pathname"){
          worker.postMessage({ pathname : window.location.pathname });
        }
        else if(msg === "container"){
          worker.postMessage({ container : $("ytd-popup-container").length });
        }
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
