# TabTamer browser extension

The extension popup saves the active browser tab to the running TabTamer library. It fills in the page title and URL, then lets you choose a collection and add optional tags and a note.

## Load it in Chrome or Edge

1. Start the TabTamer app at `http://localhost:3000` and leave its server running.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose this `extension` folder.
5. Pin TabTamer from the extensions menu. Open any regular webpage, click the TabTamer icon, and save it.

The popup connects to the local TabTamer API at `http://localhost:3000`. The app stores saved links in its JSON data file, so the server must be running and its project folder must be writable. This prototype is intended for a local, single-user app. It does not provide shared cloud accounts or sync between different people’s computers.
