if (typeof browser === "undefined") {
    var browser = chrome;
}

const { DEFAULT_SETTINGS, formatTabs, extractUrls, uniqueUrls, normalizeUrl } = window.CopyPasteFormat;

const COPY_MENU_ID = "copy-selected-tabs";
const PASTE_MENU_ID = "paste-and-open-tabs";
const PENDING_PREFIX = "pendingOpen_";

let i18nReady = window.initI18n().catch(() => {});

async function getSettings() {
    return browser.storage.local.get(DEFAULT_SETTINGS);
}

// Initialize menus
async function initMenus() {
    await i18nReady;
    await browser.menus.removeAll();

    browser.menus.create({
        id: COPY_MENU_ID,
        title: getMessage("copyUrlSingular"),
        contexts: ["tab"]
    });

    const { showPasteMenu } = await getSettings();
    browser.menus.create({
        id: PASTE_MENU_ID,
        title: getMessage("openUrlSingular"),
        contexts: ["tab"],
        visible: showPasteMenu !== false
    });
}

browser.runtime.onInstalled.addListener(initMenus);
browser.runtime.onStartup.addListener(initMenus);
browser.action.onClicked.addListener(() => {
    browser.runtime.openOptionsPage().catch(() => {});
});

// Re-label the menu right away when the interface language or the menu setting changes.
browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.ui_language) {
        i18nReady = window.initI18n().catch(() => {});
        i18nReady.then(() => {
            browser.menus.update(COPY_MENU_ID, { title: getMessage("copyUrlSingular") }).catch(() => {});
            browser.menus.update(PASTE_MENU_ID, { title: getMessage("openUrlSingular") }).catch(() => {});
        });
    }
    if (changes.showPasteMenu) {
        browser.menus.update(PASTE_MENU_ID, { visible: changes.showPasteMenu.newValue !== false }).catch(() => {});
    }
});

// Update menu titles dynamically based on selection/clipboard
browser.menus.onShown.addListener(async (info, tab) => {
    if (!info.contexts || !info.contexts.includes("tab")) return;
    await i18nReady;
    const settings = await getSettings();

    try {
        const tabsToCopy = await getTabsToCopy(tab);
        const copyTitleKey = tabsToCopy.length > 1 ? "copyUrlPlural" : "copyUrlSingular";
        await browser.menus.update(COPY_MENU_ID, { title: getMessage(copyTitleKey) });
    } catch (e) {
        console.error("Error updating copy menu:", e);
    }

    if (settings.showPasteMenu === false) {
        await browser.menus.update(PASTE_MENU_ID, { visible: false }).catch(() => {});
    } else {
        try {
            const text = await navigator.clipboard.readText();
            const urls = extractUrls(text);
            const pasteTitleKey = urls.length > 1 ? "openUrlPlural" : "openUrlSingular";
            await browser.menus.update(PASTE_MENU_ID, {
                title: getMessage(pasteTitleKey),
                enabled: urls.length > 0,
                visible: true
            });
        } catch (e) {
            // Clipboard could not be read here: keep the item enabled and try again on click.
            await browser.menus.update(PASTE_MENU_ID, {
                title: getMessage("openUrlSingular"),
                enabled: true,
                visible: true
            }).catch(() => {});
        }
    }

    browser.menus.refresh();
});

// Handle menu clicks
browser.menus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === COPY_MENU_ID) {
        await copySelectedTabs(tab);
    } else if (info.menuItemId === PASTE_MENU_ID) {
        await pasteAndOpenTabs(tab);
    }
});

// Highlighted tabs of the window, or only the clicked tab when it is not part of the selection.
async function getTabsToCopy(clickedTab) {
    const query = clickedTab && clickedTab.windowId != null
        ? { highlighted: true, windowId: clickedTab.windowId }
        : { highlighted: true, currentWindow: true };
    const highlightedTabs = await browser.tabs.query(query);
    if (clickedTab && !highlightedTabs.some(t => t.id === clickedTab.id)) return [clickedTab];
    return highlightedTabs;
}

/**
 * Copies URLs of all highlighted tabs (or the clicked tab) to the clipboard.
 */
async function copySelectedTabs(clickedTab) {
    try {
        const tabs = await getTabsToCopy(clickedTab);
        const content = formatTabs(tabs, await getSettings());
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
        } catch (err) {
            console.warn("navigator.clipboard failed in background, trying fallback", err);
            copyToClipboardFallback(content);
        }
    } catch (err) {
        console.error("Copy failed:", err);
    }
}

/**
 * Fallback for copying to clipboard using execCommand.
 */
function copyToClipboardFallback(text) {
    const input = document.createElement("textarea");
    input.style.position = "fixed";
    input.style.opacity = "0";
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand("copy");
    } catch (e) {
        console.error("execCommand copy failed:", e);
    } finally {
        document.body.removeChild(input);
    }
}

/**
 * Reads the clipboard, filters the links according to the settings and opens them,
 * asking first when there are more links than the confirmation threshold.
 */
async function pasteAndOpenTabs(clickedTab) {
    try {
        const text = await navigator.clipboard.readText();
        const settings = await getSettings();
        let urls = extractUrls(text);
        if (settings.pasteSkipDuplicates) urls = uniqueUrls(urls);
        if (settings.pasteSkipOpen && urls.length) {
            const openTabs = await browser.tabs.query({});
            const openSet = new Set(openTabs.map(t => normalizeUrl(t.url)));
            urls = urls.filter(url => !openSet.has(normalizeUrl(url)));
        }
        if (!urls.length) return;

        const windowId = clickedTab && clickedTab.windowId != null ? clickedTab.windowId : null;
        const threshold = Number(settings.confirmThreshold) || 0;
        if (threshold > 0 && urls.length > threshold) {
            await askToOpen(urls, windowId);
            return;
        }
        await openUrls(urls, windowId, settings);
    } catch (err) {
        console.error("Paste failed:", err);
    }
}

// Keeps the pending list in session storage, so it survives the event page going idle.
async function askToOpen(urls, windowId) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await browser.storage.session.set({ [PENDING_PREFIX + id]: { urls, windowId } });
    await browser.windows.create({
        url: browser.runtime.getURL(`confirm.html?id=${encodeURIComponent(id)}`),
        type: "popup",
        width: 440,
        height: 230
    });
}

async function takePending(id) {
    const key = PENDING_PREFIX + id;
    const data = await browser.storage.session.get(key);
    await browser.storage.session.remove(key);
    return data[key] || null;
}

browser.runtime.onMessage.addListener((message) => {
    if (!message || typeof message.id !== "string") return;
    if (message.action === "CONFIRM_OPEN") {
        return takePending(message.id).then(async pending => {
            if (pending) await openUrls(pending.urls, pending.windowId, await getSettings());
            return true;
        });
    }
    if (message.action === "CANCEL_OPEN") {
        return takePending(message.id).then(() => true);
    }
});

/**
 * Opens a list of URLs according to settings.
 */
async function openUrls(urls, windowId, settings) {
    if (!urls || urls.length === 0) return;

    if (settings.pasteBehavior === "new") {
        const win = await browser.windows.create({ url: urls[0] });
        for (let i = 1; i < urls.length; i++) {
            await browser.tabs.create({ windowId: win.id, url: urls[i], active: false });
        }
        return;
    }

    let targetWindow = windowId;
    if (targetWindow != null) {
        try {
            await browser.windows.get(targetWindow);
        } catch (_) {
            targetWindow = null;
        }
    }
    for (let i = 0; i < urls.length; i++) {
        const props = { url: urls[i], active: Boolean(settings.pasteActivate) && i === 0 };
        if (targetWindow != null) props.windowId = targetWindow;
        await browser.tabs.create(props);
    }
}
