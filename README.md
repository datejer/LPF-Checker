# LPF Checker

> ❗ This is still under heavy development. Lots of bad code, janky shit, hardcoded values.

Basically just snipes every Steam /app/ URL on the page and checks for: Profile Features Limited, is DLC?, Already Owned, or missing Steam Store page.

If you want to use this for yourself, you'll need to take a look at the very top of the `content-script.js` file and adjust that accordingly :P

Also, game statuses and your library all get cached after first request. This is to prevent request spam, which was especially evident (painful) when just browsing and switching pages forwards/backwards. You can flush the cache using the popup (click on extension icon - steam logo), which I recommend doing after activating some keys or just once in a while in case Steam updates one of the games' status.
