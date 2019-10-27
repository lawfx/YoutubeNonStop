const ynsTag = `[Youtube NonStop v${chrome.runtime.getManifest().version}]`;
const isYoutubeMusic = window.location.hostname === 'music.youtube.com';
const considerIdleTime = 3000; //time to pass without interaction to consider the page idle
const resetActedTime = 1000; //time to pass to reconsider unpausing again
const checkIfPausedTime = 2000; //timeout time to check if the video is paused after interaction
const tryClickTime = 500; //timeout time to make sure the unpausing takes place after events are fired
let isHoldingMouseDown = false; //to avoid taking action when mouse is being held down
let lastClickTime = new Date().getTime();
let dialogActed = false;
let videoActed = false;
let observingVideo = false;
let observingDialog = false;
let isPausedManually = false;
const videoPlayerElement = '.html5-video-player'; //the element that changes the -mode, playing-mode <-> paused-mode
let confirmDialogElement = 'yt-confirm-dialog-renderer'; //the element that contains the confirm dialog
let unpauseElement = isYoutubeMusic ? '.ytp-unmute' : 'video'; //the element to click to unpause the video
let informedAboutSearchingForVideo = false;
let informedAboutSearchingForDialog = false;
const MutationObserver =
  window.MutationObserver || window.WebKitMutationObserver;

function log(message) {
  console.log(`${ynsTag} ${message}`);
}

function debug(message) {
  console.debug(`${ynsTag} ${message}`);
}

function getTimestamp() {
  let dt = new Date();
  let time = dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();
  return time;
}

log(
  `Monitoring YouTube ${
    isYoutubeMusic ? 'Music ' : ''
  }for 'Confirm watching?' action...`
);

document.addEventListener('click', e => {
  if (e.isTrusted) {
    lastClickTime = new Date().getTime();
    isPausedManually = true;
    setTimeout(checkIfPaused, checkIfPausedTime);
  }
});

document.addEventListener('mousedown', e => {
  if (e.isTrusted) {
    isHoldingMouseDown = true;
    setTimeout(() => (isHoldingMouseDown = false), 10000); //as a last resort because depending on the action of the user the mouseup might not get fired
  }
});

document.addEventListener('mouseup', e => {
  if (e.isTrusted) {
    isHoldingMouseDown = false;
  }
});

document.addEventListener('keydown', e => {
  if (e.isTrusted) {
    lastClickTime = new Date().getTime();
    isPausedManually = true;
    setTimeout(checkIfPaused, checkIfPausedTime);
  }
});

function checkIfPaused() {
  const el = document.querySelector(videoPlayerElement);
  debug('Checking if video is paused after user action...');
  if (el !== null && !el.classList.contains('paused-mode')) {
    debug('Found not paused...');
    isPausedManually = false;
  }
}

function hasHappenedAfterTimeThreshold() {
  let currTime = new Date().getTime();
  debug(
    `\ntime passed: ${currTime -
      lastClickTime}\npausedManually: ${isPausedManually}\nholdingMouse: ${isHoldingMouseDown}`
  );
  if (
    currTime - lastClickTime <= considerIdleTime ||
    isPausedManually ||
    isHoldingMouseDown
  ) {
    lastClickTime = new Date().getTime();
    return false;
  }
  return true;
}

let videoPlayerObserver = new MutationObserver((mutations, observer) => {
  if (document.hidden) {
    tryClickVideoPlayer();
  } else {
    setTimeout(tryClickVideoPlayer, tryClickTime);
  }
});

let dialogObserver = new MutationObserver((mutations, observer) => {
  setTimeout(tryClickDialog, tryClickTime * 2);
});

let documentObserver = new MutationObserver((mutations, observer) => {
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
    if (!informedAboutSearchingForVideo) {
      debug('Searching for video player...');
      informedAboutSearchingForVideo = true;
    }
    return false;
  }
}

function tryObserveDialog() {
  const el = document.querySelectorAll(confirmDialogElement);
  if (el.length === 1) {
    dialogObserver.observe(el[0].parentElement, { attributeFilter: ['style'] }); //we want to observe the paper-dialog
    debug('Observing confirm dialog!');
    return true;
  } else if (el.length > 1) {
    debug('YouTube changed something in the dialogs...better take a look!');
  } else {
    if (!informedAboutSearchingForDialog) {
      //this is to display the message just once
      debug('Searching for confirm dialog...');
      informedAboutSearchingForDialog = true;
    }
  }
  return false;
}

function tryClickVideoPlayer() {
  if (
    document
      .querySelector(videoPlayerElement)
      .classList.contains('paused-mode') &&
    !videoActed
  ) {
    debug('Detected video paused!');
    if (!hasHappenedAfterTimeThreshold()) {
      return;
    }
    document.querySelector(unpauseElement).click();
    videoActed = true;
    setTimeout(() => (videoActed = false), resetActedTime);
    debug('Clicked video!');
  }
}

function tryClickDialog() {
  if (
    document.querySelector(confirmDialogElement).parentElement.style.display !==
      'none' &&
    !dialogActed
  ) {
    debug('Detected confirm dialog!');
    if (!hasHappenedAfterTimeThreshold()) {
      return;
    }
    document
      .querySelector(confirmDialogElement)
      .querySelector('yt-button-renderer[dialog-confirm]')
      .click();
    dialogActed = true;
    setTimeout(() => (dialogActed = false), resetActedTime);
    debug('Clicked dialog!');
  }
}
