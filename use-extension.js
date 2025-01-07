let linkedinPages = [];

function convertToEDN(data) {
    if (Array.isArray(data)) {
        return `[${data.map(convertToEDN).join(' ')}]`;
    }
    if (data === null) {
        return 'nil';
    }
    if (typeof data === 'object') {
        const entries = Object.entries(data)
            .map(([k, v]) => `:${k} ${convertToEDN(v)}`)
            .join(' ');
        return `{${entries}}`;
    }
    if (typeof data === 'string') {
        return `"${data}"`;
    }
    return String(data);
}

function updatePage() {
    const linkedinDataInput = document.querySelector('#linkedin-data');
    const submitButton = document.querySelector('#linkedin-submit');
    
    if (linkedinDataInput && submitButton) {
        console.log("linkedinPages", linkedinPages)
        linkedinDataInput.value = convertToEDN(linkedinPages);
        submitButton.click();
    }
}

function insertPage(pages, newPage) {
    return pages.map(page => 
        page === newPage.title ? newPage : page
    );
}

function listenForBackgroundEvents() {
    chrome.runtime.onMessage.addListener((message) => {
        try {
            const data = JSON.parse(message);
            if (Array.isArray(data)) {
                linkedinPages = data;
                updatePage();
            } else if (data.title) {
                linkedinPages = insertPage(linkedinPages, data);
                updatePage();
            } else if (data === 'logged-out') {
                alert('Please log into getwarmer to save data');
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });
}

if (document.querySelector('#linkedin-data')) {
    listenForBackgroundEvents();
    chrome.runtime.sendMessage('scrape-open-pages');
}
