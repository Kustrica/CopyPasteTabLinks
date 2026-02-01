if (typeof browser === "undefined") {
    var browser = chrome;
}

/**
 * Author: Kustrica (Telegram: @Kustrica)
 * Version: 1.1.0
 */

// Initialize menus
async function initMenus() {
  await browser.menus.removeAll();
  
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
}

browser.runtime.onInstalled.addListener(initMenus);
browser.runtime.onStartup.addListener(initMenus);

// Update menu titles dynamically based on selection/clipboard
browser.menus.onShown.addListener(async (info, tab) => {
  // Update Copy menu
  try {
    const highlightedTabs = await browser.tabs.query({ highlighted: true, currentWindow: true });
    let targetCount = 0;
    
    // Logic to determine what we are copying
    if (tab) {
         const isHighlighted = highlightedTabs.some(t => t.id === tab.id);
         if (isHighlighted) {
             targetCount = highlightedTabs.length;
         } else {
             targetCount = 1;
         }
    } else {
        targetCount = highlightedTabs.length;
    }

    const isMultiple = targetCount > 1;
    const copyTitleKey = isMultiple ? "copyUrlPlural" : "copyUrlSingular";
    
    await browser.menus.update("copy-selected-tabs", {
      title: browser.i18n.getMessage(copyTitleKey)
    });
  } catch (e) {
    console.error("Error updating copy menu:", e);
  }

  // Update Paste menu
  try {
    // In background scripts, reading clipboard might require user interaction or permission.
    // We try here; if it fails, we default to enabled.
    // Note: 'clipboardRead' permission is present.
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
    await copySelectedTabs(tab);
  } else if (info.menuItemId === "paste-and-open-tabs") {
    await pasteAndOpenTabs();
  }
});

/**
 * Generates the string content for selected tabs based on format settings.
 */
async function getSelectedTabsContent(clickedTab) {
  try {
    const highlightedTabs = await browser.tabs.query({ highlighted: true, currentWindow: true });
    
    let tabsToCopy = highlightedTabs;
    
    if (clickedTab) {
        const isHighlighted = highlightedTabs.some(t => t.id === clickedTab.id);
        if (!isHighlighted) {
            tabsToCopy = [clickedTab];
        }
    }
    
    if (tabsToCopy.length === 0) return "";

    const { copyFormat } = await browser.storage.local.get({ copyFormat: 'text' });
    
    if (copyFormat === 'markdown') {
        return tabsToCopy.map(t => `[${t.title || t.url}](${t.url})`).join("\n");
    } else if (copyFormat === 'html') {
        return tabsToCopy.map(t => `<a href="${t.url}">${t.title || t.url}</a>`).join("\n");
    } else {
        return tabsToCopy.map(t => t.url).join("\n");
    }
  } catch (err) {
    console.error("Error getting tab content:", err);
    return "";
  }
}

/**
 * Copies URLs of all highlighted tabs (or clicked tab) to clipboard.
 * Used by Context Menu (background context).
 */
async function copySelectedTabs(clickedTab) {
    const content = await getSelectedTabsContent(clickedTab);
    if (!content) return;
    
    // Try modern API
    try {
        await navigator.clipboard.writeText(content);
    } catch (err) {
        console.warn("navigator.clipboard failed in background, trying fallback", err);
        copyToClipboardFallback(content);
    }
}

/**
 * Fallback for copying to clipboard using execCommand.
 */
function copyToClipboardFallback(text) {
    const input = document.createElement('textarea');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand('copy');
    } catch (e) {
        console.error("execCommand copy failed:", e);
    } finally {
        document.body.removeChild(input);
    }
}

/**
 * Reads clipboard and opens tabs.
 * Used by Context Menu.
 */
async function pasteAndOpenTabs() {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) return;
    
    const lines = text.split(/\s+/).filter(line => line.trim().length > 0);
    const validUrls = lines.filter(isValidUrl);
    
    await openUrls(validUrls);
  } catch (err) {
    console.error("Paste failed:", err);
  }
}

/**
 * Opens a list of URLs according to settings.
 */
async function openUrls(validUrls) {
    if (!validUrls || validUrls.length === 0) return;

    const { pasteBehavior } = await browser.storage.local.get({ pasteBehavior: 'current' });

    if (pasteBehavior === 'new') {
        const win = await browser.windows.create({ url: validUrls[0] });
        for (let i = 1; i < validUrls.length; i++) {
            await browser.tabs.create({ windowId: win.id, url: validUrls[i], active: false });
        }
    } else {
        for (const url of validUrls) {
            await browser.tabs.create({ url: url, active: false });
        }
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