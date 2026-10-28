# Changelog

1.5
- Interface language selector in the Options header, as in Workspaces and Highlight Opened Tabs: Auto (browser language) or any of the 19 languages. The chosen language is applied to the Options page, the tab context menu and the confirmation window, without restarting Firefox.
- Live example under the copy settings that shows exactly what will be copied, built with the same formatter the context menu uses.
- New copy format "Title – URL" and a separator setting: new line, blank line, space or comma.
- New paste settings:
  - Switch to the first opened tab.
  - Skip duplicate links (on by default).
  - Skip links that are already open in a tab.
  - Ask before opening many links: a small confirmation window appears when the clipboard holds more links than the threshold (20 by default, 0 turns it off).
  - Show or hide the "Open links" item in the tab menu.
- Links are found anywhere in the clipboard text, including inside Markdown [title](url) and HTML <a href="…">, so anything the extension copies can be pasted back. Trailing punctuation is trimmed.
- Pasted links open in the window where you right-clicked; the "Open links" item is disabled when the clipboard contains no links.
- Markdown and HTML output escape special characters in titles and addresses.
- Redesigned Options page in the same style as the other extensions: grouped sections, two-column selects and a description under every option.
- Fixed the Belarusian translation: the context menu items were missing (English was shown) and the extension name and description were outdated.
- Added locale and formatter tests.

1.4
- Fixed the toolbar icon.

1.3
- Clicking the toolbar icon opens the Options page.

1.2
- Updated the extension description in English and Russian.

1.1
- Options page with the copy format (plain URL, Markdown or HTML) and the paste behavior (open links in the current or in a new window), plus support links.
- Right-clicking a tab that is not part of the selection copies only that tab.
- Context menu items are recreated on every Firefox start.
- Toolbar button title changed to "Copy Paste Tab Links".

1.0.0
- First release: tab context menu items to copy the addresses of the selected tabs and to open links from the clipboard in new tabs.
- Localized interface.
