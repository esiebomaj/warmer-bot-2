let tabId;
const scrapeCurrentProfile = () => {
  console.log("Injecting content script");
  return chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true,
    },
    function (tabs) {
      if (tabs.length) {
        tabId = tabs[0].id;
        chrome.scripting.executeScript({
          target: { tabId },
          files: ["scrape-page.js"],
        });
      }
    }
  );
};

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

const scrapeOpenProfiles = async () => {
  const tabs = await chrome.tabs.query({
    url: "https://www.linkedin.com/in/*",
  });
  if (tabs.length) {
    executeSlowly(
      tabs.map(
        (tab) => () =>
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["scrape-page.js"],
          })
      )
    );
  } else {
    sendRecent("{}");
  }
};

const scrapeAllProfile = async () => {
  console.log("Injecting content script");
  return chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true,
    },
    function (tabs) {
      if (tabs.length) {
        tabId = tabs[0].id;
        chrome.scripting.executeScript({
          target: { tabId },
          files: ["initial-multi-scrap.js"],
        });
      }
    }
  );
};

document
  .getElementById("scrapeProfile")
  .addEventListener("click", scrapeCurrentProfile);

document
  .getElementById("scrapeOpenProfiles")
  .addEventListener("click", scrapeOpenProfiles);

document
  .getElementById("scrapeSearch")
  .addEventListener("click", scrapeAllProfile);
