# YoutubeNonStop
Autoclicker for Youtube's latest "feature" - Video paused. Continue watching?

It is developed based on the assumption that if we get a popup but we haven't interacted with YouTube for the past 3 seconds, it's the "Continue watching?" confirmation.

**If the tab is not hidden, it clicks the dialog. If the tab is hidden, it reloads the page keeping in mind the timestamp.**

*More info: When the tab is hidden, the click event fires but it's not registered as it should, effectively not actually closing the dialog. So, reloading is the best alternative I could think of.*
