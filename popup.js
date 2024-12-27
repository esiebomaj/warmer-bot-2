let tabId;

const injectContentScript = () => {
    console.log("Injecting content script")

    return (
    chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    }, function(tabs) {
        if (tabs.length) {
            // chrome.runtime.onMessage.addListener(postToSubframe);

            tabId = tabs[0].id;
            chrome.scripting.executeScript({
                target: {tabId},
                files: [ 'scraper.js']
            });
        }
    })
);}


   document.getElementById('scrapeProfile').addEventListener('click', injectContentScript);