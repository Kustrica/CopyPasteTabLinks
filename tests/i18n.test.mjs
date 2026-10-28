// Every localized string must render without leftover placeholders, both through Firefox's
// own rules and through the manual-language path in i18n.js (same check as in Workspaces).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = rel => readFileSync(new URL(rel, root), 'utf8').replace(/^\ufeff/, '');
const locales = readdirSync(new URL('_locales/', root)).filter(d => statSync(new URL(`_locales/${d}`, root)).isDirectory());
const dicts = Object.fromEntries(locales.map(l => [l, JSON.parse(read(`_locales/${l}/messages.json`))]));
const en = dicts.en;
assert.equal(locales.length, 19, 'expected 19 locales');

const named = message => [...message.matchAll(/\$([A-Za-z0-9_@]+)\$/g)].map(m => m[1].toLowerCase()).sort();
const positional = message => [...message.matchAll(/\$(\d)/g)].map(m => m[1]).sort();
for (const [loc, dict] of Object.entries(dicts)) {
    assert.deepEqual(Object.keys(dict).sort(), Object.keys(en).sort(), `${loc}: key set differs from en`);
    for (const [key, entry] of Object.entries(dict)) {
        assert.ok(typeof entry.message === 'string' && entry.message.trim(), `${loc}.${key}: empty message`);
        const defined = Object.keys(entry.placeholders || {}).map(n => n.toLowerCase());
        for (const name of named(entry.message)) assert.ok(defined.includes(name), `${loc}.${key}: $${name.toUpperCase()}$ has no placeholder definition`);
        assert.deepEqual(named(entry.message), named(en[key].message), `${loc}.${key}: named placeholders differ from en`);
        assert.deepEqual(positional(entry.message), positional(en[key].message), `${loc}.${key}: $1/$2 differ from en`);
    }
}
console.log('ok 19 locales share keys and placeholder definitions');

// Every data-i18n key used by the pages exists in en.
for (const page of ['options.html', 'confirm.html']) {
    for (const m of read(page).matchAll(/data-i18n(?:-title)?="([^"]+)"/g)) {
        assert.ok(en[m[1]], `${page}: unknown key ${m[1]}`);
    }
}
for (const file of ['background.js', 'options.js', 'confirm.js']) {
    for (const m of read(file).matchAll(/getMessage\("([A-Za-z0-9_]+)"/g)) {
        assert.ok(en[m[1]], `${file}: unknown key ${m[1]}`);
    }
}
console.log('ok pages and scripts only use existing keys');

const storage = { ui_language: 'en' };
const context = vm.createContext({
    browser: {
        storage: { local: { async get() { return { ...storage }; } }, onChanged: { addListener() {} } },
        runtime: { getURL: p => p },
        i18n: { getMessage: () => 'FALLBACK' }
    },
    fetch: async url => ({ json: async () => JSON.parse(read(url)) })
});
context.window = context;
vm.runInContext(read('i18n.js'), context);
for (const loc of locales) {
    storage.ui_language = loc;
    await context.initI18n();
    assert.ok(context.i18nDict, `${loc}: dictionary did not load`);
    for (const key of Object.keys(en)) {
        const text = context.getMessage(key, ['7']);
        assert.ok(!/\$[A-Za-z0-9_@]+\$|\$\d/.test(text), `${loc}.${key}: unsubstituted placeholder in "${text}"`);
    }
    assert.ok(context.getMessage('confirmMessage', ['25']).includes('25'), `${loc}: confirmMessage lost its count`);
}
storage.ui_language = 'en';
await context.initI18n();
assert.equal(context.getMessage('confirmMessage', ['25']), '25 links will be opened in new tabs.');
storage.ui_language = 'auto';
await context.initI18n();
assert.equal(context.i18nDict, null, 'Auto must fall back to the browser language');
assert.equal(context.getMessage('confirmMessage', ['25']), 'FALLBACK');
console.log('ok every message renders without leftover placeholders in all locales');
