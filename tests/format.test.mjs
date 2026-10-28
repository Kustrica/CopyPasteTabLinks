import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const context = vm.createContext({ URL });
context.window = context;
vm.runInContext(readFileSync(new URL('../format.js', import.meta.url), 'utf8'), context);
const { formatTabs, extractUrls, uniqueUrls } = context.CopyPasteFormat;

const tabs = [
    { title: 'Firefox – Mozilla', url: 'https://www.mozilla.org/firefox/' },
    { title: 'A [b] <c> & "d"', url: 'https://example.com/a(b)?x=1&y=2' }
];
assert.equal(formatTabs(tabs, {}), 'https://www.mozilla.org/firefox/\nhttps://example.com/a(b)?x=1&y=2');
assert.equal(formatTabs(tabs, { copySeparator: 'comma' }), 'https://www.mozilla.org/firefox/, https://example.com/a(b)?x=1&y=2');
assert.equal(formatTabs(tabs, { copySeparator: 'blankLine' }).split('\n\n').length, 2);
assert.equal(formatTabs(tabs, { copyFormat: 'markdown' }),
    '[Firefox – Mozilla](https://www.mozilla.org/firefox/)\n[A \\[b\\] <c> & "d"](https://example.com/a%28b%29?x=1&y=2)');
assert.equal(formatTabs(tabs, { copyFormat: 'html' }),
    '<a href="https://www.mozilla.org/firefox/">Firefox – Mozilla</a>\n<a href="https://example.com/a(b)?x=1&amp;y=2">A [b] &lt;c&gt; &amp; &quot;d&quot;</a>');
assert.equal(formatTabs([{ title: '', url: 'https://a.com/' }], { copyFormat: 'titleUrl' }), 'https://a.com/');
assert.equal(formatTabs(tabs, { copyFormat: 'titleUrl', copySeparator: 'space' }),
    'Firefox – Mozilla – https://www.mozilla.org/firefox/ A [b] <c> & "d" – https://example.com/a(b)?x=1&y=2');

// Round trip: everything the extension copies can be pasted back.
for (const copyFormat of ['text', 'markdown', 'html', 'titleUrl']) {
    for (const copySeparator of ['newline', 'blankLine', 'space', 'comma']) {
        const urls = extractUrls(formatTabs(tabs, { copyFormat, copySeparator }));
        assert.equal(urls.length, 2, `${copyFormat}/${copySeparator}: ${urls}`);
        assert.equal(new URL(urls[0]).href, 'https://www.mozilla.org/firefox/');
        assert.equal(decodeURIComponent(new URL(urls[1]).pathname), '/a(b)');
        assert.equal(new URL(urls[1]).search, '?x=1&y=2');
    }
}

assert.deepEqual([...extractUrls('See https://en.wikipedia.org/wiki/Fox_(disambiguation). And (https://a.com/x), ftp://no.pe, www.no.com')],
    ['https://en.wikipedia.org/wiki/Fox_(disambiguation)', 'https://a.com/x']);
assert.deepEqual([...uniqueUrls(['https://a.com', 'https://a.com/', 'https://b.com'])], ['https://a.com', 'https://b.com']);
assert.deepEqual([...extractUrls('')], []);
console.log('ok formats, separators, escaping and paste round trip');
