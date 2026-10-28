if (typeof browser === "undefined") {
    var browser = chrome;
}

const PENDING_PREFIX = "pendingOpen_";
const id = new URLSearchParams(location.search).get("id") || "";
let answered = false;

async function closeSelf() {
    try {
        const win = await browser.windows.getCurrent();
        await browser.windows.remove(win.id);
    } catch (_) {
        window.close();
    }
}

async function answer(action) {
    if (answered) return;
    answered = true;
    try {
        await browser.runtime.sendMessage({ action, id });
    } catch (_) {}
    closeSelf();
}

document.addEventListener("DOMContentLoaded", async () => {
    await window.initI18n();
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const msg = getMessage(el.getAttribute("data-i18n"));
        if (msg) el.textContent = msg;
    });
    const title = getMessage("confirmTitle");
    if (title) document.title = title;

    const data = await browser.storage.session.get(PENDING_PREFIX + id);
    const pending = data[PENDING_PREFIX + id];
    if (!pending) {
        closeSelf();
        return;
    }
    document.getElementById("confirm-message").textContent =
        getMessage("confirmMessage", [String(pending.urls.length)]);

    document.getElementById("open-btn").addEventListener("click", () => answer("CONFIRM_OPEN"));
    document.getElementById("cancel-btn").addEventListener("click", () => answer("CANCEL_OPEN"));
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") answer("CANCEL_OPEN");
        if (e.key === "Enter") answer("CONFIRM_OPEN");
    });
    document.getElementById("open-btn").focus();
});

// Closing the window without answering cancels the request.
window.addEventListener("pagehide", () => {
    if (!answered) browser.runtime.sendMessage({ action: "CANCEL_OPEN", id }).catch(() => {});
});
