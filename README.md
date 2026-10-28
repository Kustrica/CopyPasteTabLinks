# Copy Paste Tab Links

[![Firefox Add-on](https://img.shields.io/badge/Firefox-Get%20the%20add--on-FF7139?logo=firefoxbrowser&logoColor=white)](https://addons.mozilla.org/firefox/addon/copy-paste-tab-links/)

A lightweight Firefox extension for working with many tabs: copy the URLs of several selected tabs at once, and open lists of links straight from your clipboard.

**[Install from addons.mozilla.org](https://addons.mozilla.org/firefox/addon/copy-paste-tab-links/)**

## Screenshots

| | |
|:---:|:---:|
| <a href="screenshots/amo/01_copy_selected_tabs.png"><img src="screenshots/amo/01_copy_selected_tabs.png" alt="Select several tabs, right-click any of them and choose Copy Page Addresses" width="420"></a><br><sub>Select several tabs, right-click any of them and choose Copy Page Addresses – all URLs go to the clipboard.</sub> | <a href="screenshots/amo/02_open_from_clipboard.png"><img src="screenshots/amo/02_open_from_clipboard.png" alt="Right-click a tab and choose Open Page Addresses from Clipboard" width="420"></a><br><sub>Right-click a tab and choose Open Page Addresses from Clipboard – every copied link opens in its own tab.</sub> |

## Features
- **Copy selected tabs** – select tabs with **Ctrl** or **Shift + click**, right-click any of them and choose **Copy Page Addresses**. Right-click a single tab outside the selection to copy just that tab.
- **Copy formats** – plain URL, **Title – URL**, **Markdown** `[Title](Url)` or **HTML** `<a href="Url">Title</a>`, separated by a new line, an empty line, a space or a comma. A live example in the settings shows exactly what will be copied.
- **Open links from the clipboard** – right-click a tab and choose **Open Page Addresses from Clipboard**. Every http/https link in the clipboard text is found, even inside Markdown, HTML or a regular paragraph, and opens in its own tab.
- **Interface language** – follow the browser language or pick any of the 19 included languages. The choice applies to the settings and the tab menu.

## Options
| Setting | What it does | Default |
|---|---|---|
| Copy format | URL, Title – URL, Markdown or HTML | URL |
| Separator between links | New line, empty line, space or comma | New line |
| Open links in | Current window or a new window | Current window |
| Switch to the first opened tab | Otherwise links open in background tabs | Off |
| Skip repeated links | Each address from the clipboard opens only once | On |
| Skip links that are already open | Addresses already open in a tab are not opened again | Off |
| Ask before opening many links | Confirmation when the clipboard has more links than this number (0 – never ask) | 20 |
| Show “Open from clipboard” in the tab menu | Hide the item if you only copy links | On |

## Technical details
- Manifest V3, event-based: no background activity when idle
- Permissions: `tabs` (addresses and titles of the tabs you copy), `clipboardRead` / `clipboardWrite` (copy and paste links), `menus` (tab context menu), `storage` (settings)
- **No data collection**, tracking, or analytics

## Localization
Translated into **19 languages**: English, Spanish, German, French, Russian, Belarusian, Chinese (Simplified and Traditional), Japanese, Portuguese, Italian, Korean, Polish, Dutch, Turkish, Ukrainian, Indonesian, Arabic, and Vietnamese.

## Support
[Telegram](https://t.me/kustric) · [Ko-fi](https://ko-fi.com/kustrica) · [Patreon](https://www.patreon.com/kustrica) · [Boosty](https://boosty.to/kustrica)
