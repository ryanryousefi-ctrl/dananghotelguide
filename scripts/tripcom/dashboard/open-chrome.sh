#!/bin/bash
# Opens an ORDINARY Chrome window for signing in to the Trip.com Partners dashboard.
# - Separate profile folder (~/.dnhg-tripcom-chrome), so it never touches your everyday Chrome profile.
# - DevTools port 9222 is bound to localhost only and lets the driver attach AFTER you have signed in.
# - No automation flags, no spoofing, no security features disabled. Sign in yourself.
# Close this window (or run: touch /tmp/tc-driver/STOP) when finished; delete ~/.dnhg-tripcom-chrome to forget the session.
mkdir -p "$HOME/.dnhg-tripcom-chrome" && chmod 700 "$HOME/.dnhg-tripcom-chrome"
open -na "Google Chrome" --args --user-data-dir="$HOME/.dnhg-tripcom-chrome" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --no-first-run "https://www.trip.com/partners/index?locale=en_xx"
