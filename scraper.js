console.log("HELLO WORLD FROM WARMER")


function delay() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * (3000 - 1000) + 1000));
}

function ariaRegex(r) {
    const buttons = document.evaluate("//button[@aria-label]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < buttons.snapshotLength; i++) {
        const button = buttons.snapshotItem(i);
        const match = button.ariaLabel.match(r);
        if (match) {
            return match[1]; // Return the captured group
        }
    }
    return null;
}

function spanSubstring(substring) {
    const spans = document.evaluate("//span[@aria-hidden]", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0; i < spans.snapshotLength; i++) {
        const span = spans.snapshotItem(i);
        const text = span.innerText;
        if (text.includes(substring)) {
            return text.trim();
        }
    }
    return null;
}

async function scrapeLinkedIn(trigger) {
    const contactsLoadedClass = ".pv-profile-section__section-info.section-info";
    const companyRegex = /Current company: (.+). Click to/;
    const educationRegex = /Education: (.+). Click to/;

    const bioHref = `${window.location.pathname}overlay/about-this-profile/`;
    const contactHref = `${window.location.pathname}overlay/contact-info/`;
    const linkedin = window.location.pathname.split("/")[2];

    const names = document.evaluate(`//a[@href='${bioHref}']`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.innerText.trim();
    const bio = document.evaluate(`//a[@href='${bioHref}']/../../following-sibling::div`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.innerText.trim();
    const summaryLocation = document.evaluate(`//a[@href='${contactHref}']/../preceding-sibling::span`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue?.innerText.trim();
    const contactLink = document.evaluate(`//a[@href='${contactHref}']`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // const submitFromBackend = (trigger === 'local' || typeof trigger === 'number');

    if (contactLink) {
        contactLink.click();
        await new Promise(resolve => {
            const checkContactsLoaded = setInterval(() => {
                if (document.querySelector(contactsLoadedClass)) {
                    clearInterval(checkContactsLoaded);
                    resolve();
                }
            }, 100);
        });

        const data = {
            names,
            bio,
            contacts: document.querySelectorAll(contactsLoadedClass),
            linkedin,
            summaryLocation,
            currentCompany: ariaRegex(companyRegex),
            education: ariaRegex(educationRegex),
            mutuals: spanSubstring("mutual connection"),
            title: document.title
        };

        console.log(data)
        const res = await chrome.runtime.sendMessage("post" + JSON.stringify(data))
        console.log(res)

        window.history.back();
    }
}

scrapeLinkedIn()