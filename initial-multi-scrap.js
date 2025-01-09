async function getAllProfileLinks() {
  console.log("mr");
  const ulElement = document.evaluate(
    `//*[@class="search-results-container"]/div/div/ul`,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  console.log(ulElement);

  if (!ulElement) {
    console.error("Target <ul> element not found.");
    return [];
  }
  console.log(ulElement);

  // Extract profile links
  return Array.from(ulElement.querySelectorAll("a[data-test-app-aware-link]"))
    .filter((node) => node.classList.contains("scale-down"))
    .map((link) => link.href);
}

const scrapeSearch = async () => {
  const page_links = await getAllProfileLinks();
  page_links.map((url) => chrome.runtime.sendMessage("open" + url));
};

scrapeSearch();
