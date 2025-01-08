console.log("HELLO WORLD FROM WARMER");

function delay() {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (3000 - 1000) + 1000)
  );
}

function ariaRegex(r) {
  const buttons = document.evaluate(
    "//button[@aria-label]",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
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
  const spans = document.evaluate(
    "//span[@aria-hidden]",
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  for (let i = 0; i < spans.snapshotLength; i++) {
    const span = spans.snapshotItem(i);
    const text = span.innerText;
    if (text.includes(substring)) {
      return text.trim();
    }
  }
  return null;
}

function extractContactInfo(doc) {
  // Object to store our contact info
  const contacts = {};

  // Find all contact sections
  const sections = doc.querySelectorAll(".pv-contact-info__contact-type");

  sections.forEach((section) => {
    // Get the header/type of contact
    const header = section
      .querySelector(".pv-contact-info__header")
      ?.textContent.trim();

    switch (header) {
      case "Email":
        contacts["Email"] = section.querySelector("a")?.textContent.trim();
        break;

      case "Phone":
        contacts["Phone"] = section
          .querySelector(".t-14.t-black.t-normal")
          ?.textContent.trim();
        break;

      case "Address":
        contacts["Address"] = section.querySelector("a")?.textContent.trim();
        break;

      case "Websites":
        contacts["Website"] = section.querySelector("a")?.href;
        contacts["Websites"] = Array.from(section.querySelectorAll("a")).map(
          (a) => a.href
        );

      case "Birthday":
        contacts["Birthday"] = section
          .querySelector(".t-14.t-black.t-normal")
          ?.textContent.trim();
        break;

      default:
        if (header?.includes("Profile")) {
          console.log("Profile", section);
          contacts["LinkedIn"] = section.querySelector("a")?.textContent.trim();
        }
        break;
    }
  });

  return contacts;
}

async function scrapeLinkedIn(trigger) {
  console.log("SCRAPING LINKEDIN", trigger);
  const contactsLoadedClass = ".pv-profile-section__section-info.section-info";
  const companyRegex = /Current company: (.+). Click to/;
  const educationRegex = /Education: (.+). Click to/;

  const bioHref = `${window.location.pathname}overlay/about-this-profile/`;
  const contactHref = `${window.location.pathname}overlay/contact-info/`;
  const linkedin = window.location.pathname.split("/")[2];

  const names = document
    .evaluate(
      `//a[@href='${bioHref}']`,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    .singleNodeValue?.innerText.trim();
  const bio = document
    .evaluate(
      `//a[@href='${bioHref}']/../../following-sibling::div`,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    .singleNodeValue?.innerText.trim();
  const summaryLocation = document
    .evaluate(
      `//a[@href='${contactHref}']/../preceding-sibling::span`,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    .singleNodeValue?.innerText.trim();
  const contactLink = document.evaluate(
    `//a[@href='${contactHref}']`,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (contactLink) {
    contactLink.click();

    // Poll function that keeps checking until condition is met
    async function poll(msg, f) {
      let result;
      while (!result) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        result = f();
      }
      console.log(msg, result);
      return result;
    }

    // Query selector wrapper
    function querySelector(s) {
      const ele = document.querySelector(s);
      if (!ele || !ele.children.length) return null;
      return ele;
    }

    await poll("contacts appear", () => querySelector(contactsLoadedClass));

    // Usage example:
    const contacts = extractContactInfo(querySelector(contactsLoadedClass));
    console.log(contacts);

    const sendToBackend = trigger === "local" || typeof trigger === "number";

    const data = {
      names,
      bio,
      contacts: contacts,
      linkedin,
      "summary-location": summaryLocation,
      "current-company": ariaRegex(companyRegex),
      education: ariaRegex(educationRegex),
      mutuals: spanSubstring("mutual connection"),
      title: document.title,
    };

    console.log(data);
    const jsonData = sendToBackend
      ? "post" + JSON.stringify(data)
      : JSON.stringify(data);
    const res = await chrome.runtime.sendMessage(jsonData);
    console.log(res);

    window.history.back();
  }
}

scrapeLinkedIn(1);
