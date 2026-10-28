# Changelog

## 1.5 – 2026-10-28

### Added
- Interface language selector in the settings header: **Auto (browser language)** or any of the 19 included languages. The choice also applies to the tab context menu.
- Live **example** under the copy settings that shows exactly what will be copied, built with the same formatter the context menu uses.
- New copy format **Title – URL** and a **separator** setting: new line, empty line, space or comma.
- Pasting: **Switch to the first opened tab**, **Skip repeated links** (on by default), **Skip links that are already open**.
- **Ask before opening many links**: a small confirmation window appears when the clipboard holds more links than the threshold (20 by default, 0 turns it off).
- **Show “Open from clipboard” in the tab menu** option.

### Changed
- Links are now found anywhere in the clipboard text, including inside Markdown `[title](url)` and HTML `<a href="…">`, so anything the extension copies can be pasted back.
- Pasted links open in the window where you right-clicked.
- Markdown and HTML output escape special characters in titles and addresses.
- Settings page redesigned to match the other extensions: grouped sections, two-column selects, descriptions under every option.

### Fixed
- Belarusian translation: the context menu items were missing (English was shown), and the old extension name and description were outdated.
