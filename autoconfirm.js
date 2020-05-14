const ynsTag = `[Youtube NonStop v${chrome.runtime.getManifest().version}]`;
const isYoutubeMusic = window.location.hostname === 'music.youtube.com';
const checkIfPausedTimeout = 2000; //timeout time to check if the video is paused after interaction
const idleTimeout = 3000; //time to pass without interaction to consider the page idle
const resetActedTime = 1000; //to avoid spamming clicks on the dialog
let lastInteractionTime = new Date().getTime();
let hasActedOnDialog = false;
let videoElement = null;
let isPausedByUser = false;
let documentObserver = null;
let isHoldingMouseDown = false; //to avoid taking action when mouse is being held down
let confirmDialogElement = isYoutubeMusic
  ? 'ytmusic-you-there-renderer'
  : 'yt-confirm-dialog-renderer'; //the element that contains the confirm dialog
let isObservingDialog = false;
let dialogObserver = null;

const MutationObserver =
  window.MutationObserver || window.WebKitMutationObserver;

function getTimestamp() {
  let dt = new Date();
  let time = dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds();
  return time;
}

function log(message) {
  console.log(`${ynsTag}[${getTimestamp()}] ${message}`);
}

function debug(message) {
  console.debug(`${ynsTag}[${getTimestamp()}] ${message}`);
}

/* INTERACTION LISTENERS */

function listenForMediaKeys() {
  if (navigator.mediaSession === undefined) {
    log("Your browser doesn't seem to support navigator.mediaSession yet :/");
    return;
  }
  log('Listening for media keys...');
  navigator.mediaSession.setActionHandler('pause', () => {
    lastInteractionTime = new Date().getTime();
    isPausedByUser = true;
    if (videoElement !== null) {
      videoElement.pause();
    }
  });

  navigator.mediaSession.setActionHandler('play', () => {
    lastInteractionTime = new Date().getTime();
    if (videoElement !== null) {
      videoElement.play();
    }
  });
}

function listenForMouse() {
  document.addEventListener('click', (e) => {
    if (e.isTrusted) {
      lastInteractionTime = new Date().getTime();
      isPausedByUser = true;
      setTimeout(resetInteractionIfNotPaused, checkIfPausedTimeout);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (e.isTrusted) {
      isHoldingMouseDown = true;
      setTimeout(() => (isHoldingMouseDown = false), 10000); //as a last resort because depending on the action of the user the mouseup might not get fired
    }
  });

  document.addEventListener('mouseup', (e) => {
    if (e.isTrusted) {
      isHoldingMouseDown = false;
    }
  });
}

function listenForKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.isTrusted) {
      lastInteractionTime = new Date().getTime();
      isPausedByUser = true;
      setTimeout(resetInteractionIfNotPaused, checkIfPausedTimeout);
    }
  });
}

function isIdle() {
  let currTime = new Date().getTime();
  debug(
    `\ntime passed: ${
      currTime - lastInteractionTime
    }\nisPausedByUser: ${isPausedByUser}\nisHoldingMouseDown: ${isHoldingMouseDown}`
  );
  if (
    currTime - lastInteractionTime <= idleTimeout ||
    isPausedByUser ||
    isHoldingMouseDown
  ) {
    lastInteractionTime = new Date().getTime();
    return false;
  }
  return true;
}

function resetInteractionIfNotPaused() {
  if (videoElement == null) return;
  if (!videoElement.paused) {
    isPausedByUser = false;
  }
}

/* ACTIONS */

function clickDialog() {
  if (
    document.querySelector(confirmDialogElement).parentElement.style.display !==
      'none' &&
    !hasActedOnDialog
  ) {
    debug('Detected confirm dialog');
    if (!isIdle()) return;

    document
      .querySelector(confirmDialogElement)
      .querySelector('yt-button-renderer[dialog-confirm]')
      .click();
    hasActedOnDialog = true;
    setTimeout(() => (hasActedOnDialog = false), resetActedTime);
    debug('Clicked dialog!');
  }
}

function unpauseVideo() {
  if (!isIdle()) return;

  videoElement.play();
  debug('Unpaused video!');
}

/* OBSERVERS */

function observeElements() {
  documentObserver = new MutationObserver((mutations, observer) => {
    observeVideoElement();
    observeDialog();
    if (videoElement !== null && isObservingDialog) {
      documentObserver.disconnect();
    }
  });

  documentObserver.observe(document, {
    childList: true,
    subtree: true,
  });
}

function observeDialog() {
  if (dialogObserver == null) {
    dialogObserver = new MutationObserver((mutations, observer) => {
      clickDialog();
    });
  }

  if (!isObservingDialog) {
    const el = document.querySelectorAll(confirmDialogElement);
    if (el.length === 1) {
      dialogObserver.observe(el[0].parentElement, {
        attributeFilter: ['style'],
      }); //we want to observe the paper-dialog
      debug('Monitoring confirmation dialog...');
      isObservingDialog = true;
    } else if (el.length > 1) {
      log(
        'YouTube changed something in the dialogs...!\nIf you see this message, contact the developer at ioannounikosdev@gmail.com'
      );
    }
  }
}

function observeVideoElement() {
  if (videoElement !== null) return;
  if (document.querySelector('video') !== null) {
    videoElement = document.querySelector('video');
    listenForMediaKeys();
    log('Monitoring video for pauses...');
    videoElement.onpause = () => {
      if (videoElement.ended) return;
      debug('Detected paused video');
      unpauseVideo();
    };
    videoElement.onplay = () => {
      isPausedByUser = false;
    };
  }
}

log(
  `Monitoring YouTube ${
    isYoutubeMusic ? 'Music ' : ''
  }for 'Confirm watching?' action...`
);

listenForMouse();
listenForKeyboard();

observeElements();
