function localizePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const msg = chrome.i18n.getMessage(key);
        if (msg) el.textContent = msg;
    });
}

function showStatus(msg, type = 'success') {
    const el = document.getElementById('status-msg');
    el.textContent = msg;
    el.className = type;
    el.style.opacity = 1;
    setTimeout(() => {
        el.style.opacity = 0;
    }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => {
    localizePage();

    const formatSelect = document.getElementById('copy-format');
    const pasteSelect = document.getElementById('paste-behavior');
    
    // Load settings
    const data = await chrome.storage.local.get({
        copyFormat: 'text',
        pasteBehavior: 'current'
    });

    formatSelect.value = data.copyFormat;
    pasteSelect.value = data.pasteBehavior;

    // Save functions
    const save = async (obj) => {
        await chrome.storage.local.set(obj);
        showStatus(chrome.i18n.getMessage("saved") || "Saved");
    };

    formatSelect.addEventListener('change', () => save({ copyFormat: formatSelect.value }));
    pasteSelect.addEventListener('change', () => save({ pasteBehavior: pasteSelect.value }));
});