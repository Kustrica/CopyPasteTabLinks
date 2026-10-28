if (typeof browser === "undefined") {
    var browser = chrome;
}

const { DEFAULT_SETTINGS, formatTabs } = window.CopyPasteFormat;

const SAMPLE_TABS = [
    { title: "Firefox – Mozilla", url: "https://www.mozilla.org/firefox/" },
    { title: "MDN Web Docs", url: "https://developer.mozilla.org/" }
];

function resolvedLanguage(uiLang) {
    const lang = uiLang === "auto" ? (browser.i18n?.getUILanguage?.() || "en") : uiLang;
    return lang.replace("_", "-");
}

function localizePage(uiLang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const msg = getMessage(el.getAttribute("data-i18n"));
        if (msg) el.textContent = msg;
    });
    const titleMsg = getMessage("optionsTitle");
    if (titleMsg) document.title = titleMsg;
    const lang = resolvedLanguage(uiLang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang.toLowerCase().startsWith("ar") ? "rtl" : "ltr";
}

function showStatus(msg) {
    const el = document.getElementById("status-msg");
    el.textContent = msg;
    el.className = "success";
    el.style.opacity = 1;
    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(() => {
        el.style.opacity = 0;
    }, 2000);
}

function renderPreview() {
    const preview = document.getElementById("copy-preview");
    preview.textContent = formatTabs(SAMPLE_TABS, {
        copyFormat: document.getElementById("copy-format").value,
        copySeparator: document.getElementById("copy-separator").value
    });
}

async function save(values) {
    await browser.storage.local.set(values);
    showStatus(getMessage("saved") || "Saved");
}

document.addEventListener("DOMContentLoaded", async () => {
    const { ui_language } = await browser.storage.local.get({ ui_language: "auto" });
    const langSelect = document.getElementById("ui-language-select");
    langSelect.value = ui_language || "auto";

    await window.initI18n();
    localizePage(langSelect.value);

    langSelect.addEventListener("change", async () => {
        await browser.storage.local.set({ ui_language: langSelect.value });
        await window.initI18n();
        showStatus(getMessage("languageUpdated") || "Language updated. Reloading...");
        setTimeout(() => location.reload(), 800);
    });

    const settings = await browser.storage.local.get(DEFAULT_SETTINGS);

    const selects = {
        "copy-format": "copyFormat",
        "copy-separator": "copySeparator",
        "paste-behavior": "pasteBehavior"
    };
    for (const [id, key] of Object.entries(selects)) {
        const el = document.getElementById(id);
        el.value = settings[key];
        if (!el.value) el.value = DEFAULT_SETTINGS[key];
        el.addEventListener("change", () => {
            if (id.startsWith("copy-")) renderPreview();
            save({ [key]: el.value });
        });
    }

    const checkboxes = {
        "paste-activate": "pasteActivate",
        "paste-skip-duplicates": "pasteSkipDuplicates",
        "paste-skip-open": "pasteSkipOpen",
        "show-paste-menu": "showPasteMenu"
    };
    for (const [id, key] of Object.entries(checkboxes)) {
        const el = document.getElementById(id);
        el.checked = Boolean(settings[key]);
        el.addEventListener("change", () => save({ [key]: el.checked }));
    }

    const threshold = document.getElementById("confirm-threshold");
    threshold.value = String(settings.confirmThreshold);
    threshold.addEventListener("change", () => {
        let value = parseInt(threshold.value, 10);
        if (!Number.isFinite(value) || value < 0) value = 0;
        if (value > 999) value = 999;
        threshold.value = String(value);
        save({ confirmThreshold: value });
    });

    renderPreview();
});
