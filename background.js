chrome.storage.session.setAccessLevel({
  accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
});

function postData(url = "", data = {}) {
  url = "http://localhost:3000/extension" + url;
  // url = 'https://getwarmer.co/extension' + url;
  console.log(`posting data ${JSON.stringify(data)} to ${url}`);
  return fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
  });
}

const sendRecent = async (msg) => {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  chrome.tabs.sendMessage(tabs[0].id, msg);
};

const timeout = () => 4000 + 2000 * Math.random();
const wait = () => new Promise((resolve) => setTimeout(resolve, timeout()));

const executeSlowly = async (fs) => {
  let i = 0;
  while (i < fs.length - 1) {
    fs[i]();
    await wait();
    i++;
  }
  fs[i]();
};

const pr_str = (s) => JSON.stringify(s);

const injectOtherTabs = async () => {
  const tabs = await chrome.tabs.query({
    url: "https://www.linkedin.com/in/*",
  });
  if (tabs.length) {
    const titles = tabs.map((tab) => tab.title);
    sendRecent(pr_str(titles));
    executeSlowly(
      tabs.map(
        (tab) => () =>
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["scrape-page-remote.js"],
          })
      )
    );
  } else {
    sendRecent("{}");
  }
};

function invokeDedicated(tabId) {
  warmer.bot.dedicated_tab(tabId);
}

const injectNew = async (url) => {
  // open url in a new tab scrapes and sends to the backend using post
  const tab = await chrome.tabs.create({ url, active: false });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: [],
  });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: invokeDedicated,
    args: [tab.id],
  });
};

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg === "scrape-open-pages") {
    injectOtherTabs();
  } else if (msg.startsWith("post")) {
    const resp = await postData("/linkedin", { data: msg.substring(4) });
    if (resp.status === 401) {
      sendRecent("logged-out");
    }
  } else if (msg.startsWith("open")) {
    injectNew(msg.substring(4));
  } else if (msg.startsWith("close")) {
    const tabId = Number(msg.substring(5));
    chrome.tabs.remove(tabId);
  } else {
    // it's just feeding back into getwarmer panel
    sendRecent(msg);
  }
});

chrome.action.onClicked.addListener(
  console.log("EXTENSION CLICKED Hello Hello")
);
