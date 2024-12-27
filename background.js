chrome.storage.session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});

function postData(url = "", data = {}) {
    url = 'http://localhost:3000/extension' + url;
    return fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
  }

// client.js

const sendRecent = async msg => {
    const tabs = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    });
    chrome.tabs.sendMessage(tabs[0].id, msg);
};

const timeout = () => 4000 + 2000 * Math.random();
const wait = () => new Promise(resolve => setTimeout(resolve, timeout()));

const executeSlowly = async fs => {
    let i = 0;
    while (i < fs.length - 1) {
        fs[i]();
        await wait();
        i++;
    }
    fs[i]();
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log("Message received:", message, "from", sender);
     if (message.startsWith('post')) {
        console.log(`sending ${{data: message.substring(4)}} to the backend`)
            const resp = await postData('/linkedin', {data: message.substring(4)});
            console.log(resp.status)
            if (resp.status === 401) {
                sendResponse('logged-out');
            }
        } else {
            sendResponse("Not handled");
        }
});

chrome.action.onClicked.addListener(
    console.log("EXTENSION CLICKED")
);