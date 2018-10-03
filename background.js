chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'www.youtube.com'},
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
  });

var youtubeTabsAudio = {};

function removeIfClosed(tabs){
  Object.keys(youtubeTabsAudio).forEach(function(youtubetab){
    //console.log("Checking if tab " + youtubetab + " exists");
    var foundID = false;
    tabs.forEach(function(tab){
      if(youtubetab === (tab.id).toString()){
        foundID = true;
        return true;
      }
    });
    if(!foundID){
      console.log("Closed tab "+ youtubetab);
      delete youtubeTabsAudio[youtubetab];
      return true;
    }
  });
}

function getSeconds(duration){
  var durSplit = duration.split(":");
  if(durSplit.length == 3){
    var hours = parseInt(durSplit[0]) * 60 * 60;
    var mins = parseInt(durSplit[1]) * 60;
    return hours + mins + parseInt(durSplit[2]);
  }
  else if(durSplit.length == 2){
    var mins = parseInt(durSplit[0]) * 60;
    return mins + parseInt(durSplit[1]);
  }
  else{
    console.log("Unrecognized time");
  }
}

function setupNewVideo(tab, tabID){
  youtubeTabsAudio[tabID].canBeProcessed = false;
  youtubeTabsAudio[tabID].url = tab.url;
  chrome.tabs.sendMessage(tab.id, { gimme : "times", tabid : tabID }, function(response){
    if(response){
      var dur = getSeconds(response.duration);
      var curr = getSeconds(response.current);
      youtubeTabsAudio[response.tabid].current = curr;
      youtubeTabsAudio[response.tabid].duration = dur;
      youtubeTabsAudio[response.tabid].started = new Date().getTime();
      console.log("Changed video");
    }
  });
}

function processTabAlreadyExists(tab, tabID){
  if(tab.url !== youtubeTabsAudio[tabID].url){
    setupNewVideo(tab, tabID);
  }
  else if(!tab.audible && youtubeTabsAudio[tabID].canBeProcessed){
    var timeWatching = Math.floor((new Date().getTime() - youtubeTabsAudio[tabID].started + youtubeTabsAudio[tabID].current) / 1000);
    console.log("Stopped and time " + timeWatching + " / " + youtubeTabsAudio[tabID].duration);
    if(timeWatching < youtubeTabsAudio[tabID].duration){
      console.log("stopped before finish");
      //TODO stopped before finishing
      if(!tab.active){ //TODO make this work for multiple tabs in multiple windows, because active means active in its current window but may not be the topmost
        chrome.tabs.sendMessage(tab.id, { gimme : "click" });
        youtubeTabsAudio[tabID].canBeProcessed = false;
      }
      else{
        chrome.tabs.sendMessage(tab.id, { gimme : "confirm" });
      }
    }
  }
}

function processTabDoesntExist(tab, tabID){
  console.log("Adding tab "+ tabID);
  youtubeTabsAudio[tabID] = {};
  setupNewVideo(tab, tabID);
}

//TODO consider ads with class videoAdUi
function processTab(tab){
  var tabID = tab.id.toString();
  if(youtubeTabsAudio[tabID]){
    processTabAlreadyExists(tab, tabID);
  }
  else if(tab.audible){
    processTabDoesntExist(tab, tabID);
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.inform === "clicked"){
      console.log(sender.tab.id + " was clicked");
      youtubeTabsAudio[sender.tab.id].canBeProcessed = false;
    }
    else if(request.inform === "idle"){
      console.log(sender.tab.id + " is idle");
      youtubeTabsAudio[sender.tab.id].canBeProcessed = true;
    }
  });

setInterval(function(){
  chrome.tabs.query({"url" : "https://www.youtube.com/*", "status" : "complete"}, function(tabs) {
    removeIfClosed(tabs);
    tabs.forEach(function(tab){
      processTab(tab);
    });
  });
}, 1000);
