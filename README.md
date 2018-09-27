# YoutubeNonStop
Autoclicker for Youtube's latest "feature" - Video paused. Continue watching?

You can find the extension in the Chrome Web Store <a href="https://chrome.google.com/webstore/detail/youtube-nonstop/nlkaejimjacpillmajjnopmpbkbnocid" target="_blank">here</a>.

It is developed based on the assumption that if we get a popup but we haven't interacted with YouTube for the past 3 seconds, it's the "Continue watching?" confirmation.

It works only if the YouTube tab is in some way visible in the screen. If the tab is minimized or otherwise not visible, the DOM doesn't get updated with the popup, the detection never happens, and of course this extension doesn't work.
