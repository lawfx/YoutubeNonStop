var ynsInjection =
  '(' +
  function () {
    const tag = '[Youtube NonStop]';
    const isYoutubeMusic = window.location.hostname === 'music.youtube.com';

    const popupEventNodename = isYoutubeMusic ? 'YTMUSIC-YOU-THERE-RENDERER' : 'YT-CONFIRM-DIALOG-RENDERER';

    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    let appObserver = null;
    const appName = isYoutubeMusic ? 'ytmusic-app' : 'ytd-app';
    const popupContainer = isYoutubeMusic ? 'ytmusic-popup-container' : 'ytd-popup-container';

    let pauseRequested = false;
    let pauseRequestedTimeout;
    const pauseRequestedTimeoutMillis = 5000;
    const idleTimeoutMillis = 5000;
    let lastInteractionTime = new Date().getTime();

    let videoElement = null;

    function log(message) {
      console.log(`${tag}[${getTimestamp()}] ${message}`);
    }

    function debug(message) {
      console.debug(`${tag}[${getTimestamp()}] ${message}`);
    }

    function asDoubleDigit(value) {
      return value < 10 ? '0' + value : value;
    }

    function getTimestamp() {
      let dt = new Date();
      let time = asDoubleDigit(dt.getHours()) + ':' + asDoubleDigit(dt.getMinutes()) + ':' + asDoubleDigit(dt.getSeconds());
      return time;
    }

    function isIdle() {
      return getIdleTime() >= idleTimeoutMillis;
    }

    function getIdleTime() {
      return new Date().getTime() - lastInteractionTime;
    }

    function listenForMediaKeys() {
      if (navigator.mediaSession === undefined) {
        log("Your browser doesn't seem to support navigator.mediaSession yet :/");
        return;
      }
      debug('Listening to "pause" media key...');
      navigator.mediaSession.setActionHandler('pause', () => {
        debug('Paused due to [media key pause]');
        pauseVideo();
      });
    }

    function listenForMouse() {
      const eventName = window.PointerEvent ? 'pointer' : 'mouse';
      debug(`Using ${eventName} events`);
      document.addEventListener(eventName + 'down', (e) => {
        processInteraction(eventName + 'down');
      });

      document.addEventListener(eventName + 'up', (e) => {
        processInteraction(eventName + 'up');
      });
    }

    function listenForKeyboard() {
      document.addEventListener('keydown', (e) => {
        processInteraction('keydown');
      });

      document.addEventListener('keyup', (e) => {
        processInteraction('keyup');
      });
    }

    function processInteraction(action) {
      if (pauseRequested) {
        debug(`Paused due to [${action}]`);
        pauseVideo();
        return;
      }
      lastInteractionTime = new Date().getTime();
    }

    function observeApp() {
      debug(`Observing ${appName}...`);
      appObserver = new MutationObserver((mutations, observer) => {
        overrideVideoPause();
      });

      appObserver.observe(document.querySelector(appName), {
        childList: true,
        subtree: true
      });
    }

    function listenForPopupEvent() {
      debug('Listening for popup event...');
      document.addEventListener('yt-popup-opened', (e) => {
        if (isIdle() && e.detail.nodeName === popupEventNodename) {
          debug('[closing popup]');
          document.querySelector(popupContainer).handleClosePopupAction_();
          pauseVideo();
          videoElement.play();
        }
      });
    }

    function overrideVideoPause() {
      if (videoElement?.yns_pause !== undefined) return;
      if (document.querySelector('video') === null) return;

      videoElement = document.querySelector('video');
      listenForMediaKeys();
      debug('Overriding video pause...');
      videoElement.yns_pause = videoElement.pause;
      videoElement.pause = () => {
        debug('Video pause requested');
        if (!isIdle()) {
          debug('Paused due to [pause]');
          pauseVideo();
          return;
        }
        pauseRequested = true;
        setPauseRequestedTimeout();
      };
    }

    function setPauseRequestedTimeout(justClear = false) {
      clearTimeout(pauseRequestedTimeout);
      if (justClear) return;
      pauseRequestedTimeout = setTimeout(() => {
        pauseRequested = false;
      }, pauseRequestedTimeoutMillis);
    }

    function pauseVideo() {
      videoElement?.yns_pause();
      pauseRequested = false;
      setPauseRequestedTimeout(true);
    }

    listenForMouse();
    listenForKeyboard();

    listenForPopupEvent();
    observeApp();

    log(`Monitoring YouTube ${isYoutubeMusic ? 'Music ' : ''}for 'Confirm watching?' action...`);
  } +
  ')();';

console.log(`[Youtube NonStop v${chrome.runtime.getManifest().version}]`);

var script = document.createElement('script');
script.textContent = ynsInjection;
(document.head || document.documentElement).appendChild(script);
script.remove();
