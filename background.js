/**
 * Author: Kustrica (Telegram: @Kustrica)
 * Version: 1.0.0
 */

// Initialize menus on installation
browser.runtime.onInstalled.addListener(() => {
  browser.menus.create({
    id: "copy-selected-tabs",
    title: browser.i18n.getMessage("copyUrlSingular"),
    contexts: ["tab"]
  });

  browser.menus.create({
    id: "paste-and-open-tabs",
    title: browser.i18n.getMessage("openUrlSingular"),
    contexts: ["tab"]
  });
});

// Update menu titles dynamically based on selection/clipboard
browser.menus.onShown.addListener(async (info, tab) => {
  // Update Copy menu
  try {
    const tabs = await browser.tabs.query({ highlighted: true, currentWindow: true });
    const isMultiple = tabs.length > 1;
    const copyTitleKey = isMultiple ? "copyUrlPlural" : "copyUrlSingular";
    
    await browser.menus.update("copy-selected-tabs", {
      title: browser.i18n.getMessage(copyTitleKey)
    });
  } catch (e) {
    console.error("Error updating copy menu:", e);
  }

  // Update Paste menu
  try {
    const text = await navigator.clipboard.readText();
    const urls = text ? text.split(/\s+/).filter(line => isValidUrl(line)) : [];
    const isMultipleUrls = urls.length > 1;
    const pasteTitleKey = isMultipleUrls ? "openUrlPlural" : "openUrlSingular";
    
    await browser.menus.update("paste-and-open-tabs", {
      title: browser.i18n.getMessage(pasteTitleKey),
      enabled: urls.length > 0 
    });
  } catch (e) {
    // Fallback if clipboard read fails
    browser.menus.update("paste-and-open-tabs", {
      title: browser.i18n.getMessage("openUrlSingular"),
      enabled: true
    });
  }
  
  browser.menus.refresh();
});

// Handle menu clicks
browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "copy-selected-tabs") {
    await copySelectedTabs();
  } else if (info.menuItemId === "paste-and-open-tabs") {
    await pasteAndOpenTabs();
  }
});

/**
 * Copies URLs of all highlighted tabs in the current window.
 */
async function copySelectedTabs() {
  try {
    const tabs = await browser.tabs.query({ highlighted: true, currentWindow: true });
    
    if (tabs.length === 0) return;

    const urls = tabs.map(t => t.url).join("\n");
    await navigator.clipboard.writeText(urls);
  } catch (err) {
    console.error("Copy failed:", err);
  }
}

/**
 * Reads clipboard, validates URLs, and opens them in new tabs.
 */
async function pasteAndOpenTabs() {
  try {
    const text = await navigator.clipboard.readText();
    
    if (!text) return;

    const lines = text.split(/\s+/).filter(line => line.trim().length > 0);

    for (const line of lines) {
      if (isValidUrl(line)) {
        await browser.tabs.create({ url: line, active: false });
      }
    }
  } catch (err) {
    console.error("Paste failed:", err);
  }
}

/**
 * Validates if the string is a valid HTTP/HTTPS URL.
 */
function isValidUrl(string) {
  if (!string || string.length > 2048) return false;
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}
