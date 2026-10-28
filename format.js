// Shared by the background script (context menu) and the options page (live preview),
// so the preview always shows exactly what will be copied.
(function (root) {
    const SEPARATORS = {
        newline: "\n",
        blankLine: "\n\n",
        space: " ",
        comma: ", "
    };

    const DEFAULT_SETTINGS = {
        copyFormat: "text",          // text | markdown | html | titleUrl
        copySeparator: "newline",    // newline | blankLine | space | comma
        pasteBehavior: "current",    // current | new
        pasteActivate: false,        // switch to the first opened tab
        pasteSkipDuplicates: true,   // open each address from the clipboard only once
        pasteSkipOpen: false,        // skip addresses that are already open in a tab
        confirmThreshold: 20,        // ask before opening more links than this; 0 = never
        showPasteMenu: true          // show the "Open ... from Clipboard" tab menu item
    };

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function escapeMarkdownText(value) {
        return String(value).replace(/([\\\[\]])/g, "\\$1");
    }

    function escapeMarkdownUrl(value) {
        return String(value).replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/ /g, "%20");
    }

    function formatTab(tab, format) {
        const url = tab.url || "";
        const title = (tab.title || "").trim() || url;
        switch (format) {
            case "markdown":
                return `[${escapeMarkdownText(title)}](${escapeMarkdownUrl(url)})`;
            case "html":
                return `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`;
            case "titleUrl":
                return title === url ? url : `${title} – ${url}`;
            default:
                return url;
        }
    }

    function formatTabs(tabs, options = {}) {
        const format = options.copyFormat || DEFAULT_SETTINGS.copyFormat;
        const separator = SEPARATORS[options.copySeparator] ?? SEPARATORS.newline;
        return (tabs || []).filter(t => t && t.url).map(t => formatTab(t, format)).join(separator);
    }

    function isValidUrl(value) {
        if (!value || value.length > 2048) return false;
        try {
            const url = new URL(value);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
            return false;
        }
    }

    function normalizeUrl(value) {
        try {
            return new URL(value).href;
        } catch (_) {
            return value;
        }
    }

    // Finds http(s) links in any text: one per line, inside Markdown [title](url),
    // inside HTML href="..." or in the middle of a sentence.
    function extractUrls(text) {
        if (!text) return [];
        const found = [];
        const pattern = /https?:\/\/[^\s<>"'`\[\]{}|\\^]+/gi;
        for (const match of String(text).matchAll(pattern)) {
            let url = match[0].replace(/&amp;/gi, "&");
            while (/[.,;:!?)'»”’]$/.test(url)) {
                if (url.endsWith(")")) {
                    const open = (url.match(/\(/g) || []).length;
                    const close = (url.match(/\)/g) || []).length;
                    if (close <= open) break;
                }
                url = url.slice(0, -1);
            }
            if (isValidUrl(url)) found.push(url);
        }
        return found;
    }

    function uniqueUrls(urls) {
        const seen = new Set();
        const result = [];
        for (const url of urls) {
            const key = normalizeUrl(url);
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(url);
        }
        return result;
    }

    root.CopyPasteFormat = {
        SEPARATORS,
        DEFAULT_SETTINGS,
        formatTab,
        formatTabs,
        isValidUrl,
        normalizeUrl,
        extractUrls,
        uniqueUrls
    };
})(typeof window !== "undefined" ? window : globalThis);
