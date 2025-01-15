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

async function sendConnectionRequest() {
  try {
    // First click the "More" button to open the dropdown
    const moreButton = document.querySelector(
      'button[aria-label="More actions"]'
    );
    if (!moreButton) {
      console.log("More button not found");
      return;
    }
    moreButton.click();

    // Wait for dropdown and look for connect button
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Look for the Connect button in the dropdown
    const connectButton1 = document.querySelector(
      'button[aria-label^="Invite"][aria-label$="to connect"]'
    );
    const connectButton2 = document.querySelector(
      'div[aria-label^="Invite"][aria-label$="to connect"][role="button"]'
    );

    const connectButton = connectButton1 || connectButton2;

    if (connectButton) {
      // Click connect buttonwhy does it
      connectButton.click();

      // Wait for the connection modal to appear
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Look for and click the "Send without a note" button
      const sendWithoutNoteButton = document.querySelector(
        'button[aria-label="Send without a note"]'
      );
      if (sendWithoutNoteButton) {
        sendWithoutNoteButton.click();

        // Wait for the confirmation modal to appear
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        console.log("Send without note button not found");
      }
      // Close the confirmation modal by clicking the dismiss button
      const modal = document.querySelector(
        'div[role="dialog"][data-test-modal]'
      );
      if (modal) {
        const dismissButton = modal.querySelector(
          'button[aria-label="Dismiss"]'
        );
        if (dismissButton) {
          dismissButton.click();
          console.log("Dismissed the confirmation modal.");
        } else {
          console.log("Dismiss button not found in the modal.");
        }
      } else {
        console.log("Modal not found.");
      }
    } else {
      // Close dropdown if no connect button found
      moreButton.click();
      console.log(
        "Connection request already sent or connect button not found"
      );
    }
  } catch (error) {
    console.error("Error sending connection request:", error);
  }
}

function getMutuals() {
  const mutualElement = document.querySelector(
    'a[href*="facetNetwork"][href*="facetConnectionOf"]'
  );

  if (!mutualElement) {
    return null;
  }

  const mutualText = mutualElement
    .querySelector(".t-normal.t-black--light.t-14")
    ?.textContent.trim();
  const mutualLink = mutualElement.href;
  const match = mutualText?.match(/(\d+) other mutual connection/);
  const numMutuals = match ? parseInt(match[1]) + 2 : 0;

  return {
    text: mutualText,
    count: numMutuals,
    link: mutualLink,
  };
}

function getProfilesWithDegree() {
  // First find the section with "More profiles for you" heading
  const moreProfilesSection = Array.from(document.querySelectorAll("h2"))
    .find((h2) => h2.textContent.includes("More profiles for you"))
    ?.closest("section");

  if (!moreProfilesSection) {
    return [];
  }

  // Now look for profile cards within this specific section
  const profileCards = moreProfilesSection.querySelectorAll(
    ".artdeco-list__item"
  );

  const profiles = [];

  profileCards.forEach((card) => {
    // Get the profile link
    const profileLink = card
      .querySelector('a[href*="/in/"]')
      ?.href?.split("?")[0];

    const name = card.querySelector(".t-bold")?.textContent?.trim();

    const degreeMatch = card
      .querySelector(".t-black--light")
      ?.textContent?.match(/(1st|2nd|3rd)/);
    const degree = degreeMatch ? degreeMatch[1].charAt(0) : null;

    if (profileLink) {
      profiles.push({
        name,
        profileLink,
        degree: parseInt(degree),
      });
    }
  });

  return profiles.sort((a, b) => a.degree - b.degree);
}

async function scrapeLinkedIn(trigger) {
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
    const mutuals = getMutuals();
    console.log(mutuals);
    const warmestProfiles = getProfilesWithDegree().slice(0, 5);
    console.log(warmestProfiles);

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
      "mutuals-obj": mutuals,
      "warmest-links": warmestProfiles.map((p) => p.profileLink),
      "warmest-profiles": warmestProfiles,
    };

    console.log(data);
    const jsonData = sendToBackend
      ? "post" + JSON.stringify(data)
      : JSON.stringify(data);
    const res = await chrome.runtime.sendMessage(jsonData);
    console.log(res);

    if (trigger === "warmer") {
      await delay();
    }
    if (typeof trigger === "number") {
      chrome.runtime.sendMessage("close" + trigger);
    }
    window.history.back();
  }
}

scrapeLinkedIn("warmer");
