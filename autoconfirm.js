//https://www.youtube.com/watch?v=XukwvHZTqPk&t=5769 triggers the popup - link might be dead after a while

const ynsTag = '[Youtube NonStop v0.6.0]';
const considerIdleTime = 3000; //time to pass without interaction to consider the page idle
const resetActedTime = 1000; //time to pass to reconsider unpausing again
const checkIfPausedTime = 1000; //timeout time to check if the video is paused after interaction
const tryClickTime = 500; //timeout time to make sure the unpausing takes place after events are fired
let lastClickTime = new Date().getTime();
let fakeClick = false;
let dialogActed = false;
let videoActed = false;
let observingVideo = false;
let observingDialog = false;
let isPausedManually = false;
const videoPlayerElement = '.html5-video-player';
let dialogElement;
let unpauseElement;
if (window.location.hostname === 'music.youtube.com') {
  unpauseElement = '.ytp-unmute';
  dialogElement = 'ytmusic-popup-container';
} else {
  unpauseElement = 'video';
  dialogElement = 'ytd-popup-container';
}
dialogElement += ' paper-dialog';
let informedVideo = false;
let informedDialog = false;
const MutationObserver =
  window.MutationObserver || window.WebKitMutationObserver;

function log(message) {
  console.log(ynsTag + ' ' + message);
}

function debug(message) {
  console.debug(ynsTag + ' ' + message);
}

function getTimestamp() {
  let dt = new Date();
  let time = dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();
  return time;
}

log("Monitoring YouTube for 'Confirm watching?' action...");

document.addEventListener('click', function() {
  if (!fakeClick) {
    lastClickTime = new Date().getTime();
    isPausedManually = true;
    setTimeout(checkIfPaused, checkIfPausedTime);
  } else {
    fakeClick = false;
  }
});

document.addEventListener('mousedown', function() {
  lastClickTime = new Date().getTime();
});

document.addEventListener('keydown', function() {
  lastClickTime = new Date().getTime();
  isPausedManually = true;
  setTimeout(checkIfPaused, checkIfPausedTime);
});

function checkIfPaused() {
  if (
    !document
      .querySelector(videoPlayerElement)
      .classList.contains('paused-mode')
  ) {
    isPausedManually = false;
  }
}

function hasPoppedAfterTimeThreshold() {
  var currTime = new Date().getTime();
  if (currTime - lastClickTime <= considerIdleTime || isPausedManually) {
    lastClickTime = new Date().getTime();
    return false;
  }
  return true;
}

let videoPlayerObserver = new MutationObserver(function(mutations, observer) {
  if (document.hidden) {
    tryClickVideoPlayer();
  } else {
    setTimeout(tryClickVideoPlayer, tryClickTime);
  }
});

let dialogObserver = new MutationObserver(function(mutations, observer) {
  setTimeout(tryClickDialog, tryClickTime * 2);
});

let documentObserver = new MutationObserver(function(mutations, observer) {
  if (!observingVideo) {
    videoPlayerObserver.disconnect();
    if (tryObserveVideoPlayer()) {
      observingVideo = true;
    }
  }
  if (!observingDialog) {
    dialogObserver.disconnect();
    if (tryObserveDialog()) {
      observingDialog = true;
    }
  }
  if (observingVideo && observingDialog) {
    documentObserver.disconnect();
  }
});

documentObserver.observe(document, {
  childList: true,
  subtree: true
});

function tryObserveVideoPlayer() {
  if (document.querySelectorAll(videoPlayerElement).length) {
    videoPlayerObserver.observe(
      document.querySelectorAll(videoPlayerElement)[0],
      {
        attributeFilter: ['class']
      }
    );
    debug('Observing video player!');
    return true;
  } else {
    if (!informedVideo) {
      debug('Searching for video player...');
      informedVideo = true;
    }
    return false;
  }
}

function tryObserveDialog() {
  if (document.querySelectorAll(dialogElement).length) {
    dialogObserver.observe(document.querySelectorAll(dialogElement)[0], {
      attributeFilter: ['style']
    });
    debug('Observing confirm dialog!');
    return true;
  } else {
    if (!informedDialog) {
      debug('Searching for confirm dialog...');
      informedDialog = true;
    }
    return false;
  }
}

function tryClickVideoPlayer() {
  if (
    document
      .querySelector(videoPlayerElement)
      .classList.contains('paused-mode') &&
    !videoActed
  ) {
    if (!hasPoppedAfterTimeThreshold()) {
      return;
    }
    fakeClick = true;
    document.querySelector(unpauseElement).click();
    videoActed = true;
    setTimeout(function() {
      videoActed = false;
    }, resetActedTime);
    debug(
      getTimestamp() +
        ' ' +
        document.querySelector('head title').innerHTML +
        ' Detected paused video and clicked it to continue!'
    );
  }
}

function tryClickDialog() {
  if (
    document.querySelector(dialogElement).style.display !== 'none' &&
    !dialogActed
  ) {
    if (!hasPoppedAfterTimeThreshold()) {
      return;
    }
    fakeClick = true;
    document
      .querySelector(dialogElement)
      .querySelector('yt-button-renderer[dialog-confirm]')
      .click();
    dialogActed = true;
    setTimeout(function() {
      dialogActed = false;
    }, resetActedTime);
    debug(
      getTimestamp() +
        ' ' +
        document.querySelector('head title').innerHTML +
        ' Confirmed watching in dialog!'
    );
  }
}
