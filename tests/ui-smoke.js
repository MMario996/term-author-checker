// UI-Smoke-Test fuer die Terminologiesuche (CI).
//
// Fuehrt den ECHTEN Server-Code (alle .gs-Dateien, v. a. _searchCore_) in Node
// aus - nur Phrase-API, Cache und Properties sind simuliert - und bedient die
// Suche in TermSearch.html (Web-App) und Sidebar.html (Editor-Seitenleiste) in
// einem echten Chromium. So faellt auf, wenn Server-Antwort und Oberflaeche
// nicht mehr zusammenpassen (09/2026: Suche blieb bei "Filtering translations…"
// haengen, weil die Seite die neue Antwortform nicht verarbeiten konnte).
//
// Aufruf: node tests/ui-smoke.js   (braucht das npm-Paket "playwright" + Chromium;
// optional CHROMIUM_PATH=/pfad/zu/chromium)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

// ─── Server: alle .gs-Dateien mit simulierten Google-Diensten ────────────
let phraseMode = 'ok'; // 'ok' | 'down'
const TERMS = [
  [{ text: 'Akku', lang: 'de', status: 'APPROVED' }, { text: 'battery', lang: 'en' }, { text: 'batterie', lang: 'fr' }],
  [{ text: 'Akkuladegerät', lang: 'de' }, { text: 'battery charger', lang: 'en' }],
  [{ text: 'Abbau', lang: 'de' }, { text: 'dismantling', lang: 'en' }]
];
function phraseBrowse(req) {
  if (phraseMode === 'down') return { code: 503, body: '{}' };
  const body = JSON.parse(req.payload);
  const core = String(body.query).replace(/\*/g, '').toLowerCase();
  const hits = TERMS.filter((terms) => terms.some((t) => t.lang === body.queryLang && t.text.toLowerCase().includes(core)))
    .map((terms, i) => ({ conceptId: 'c' + i + '_' + terms[0].text, terms: terms.map((t) => [t]) }));
  return { code: 200, body: JSON.stringify({ searchResults: hits }) };
}
const response = (r) => ({ getResponseCode: () => r.code, getContentText: () => r.body });
const noop = () => {};
const ctx = {
  console: { log: noop, warn: noop, error: console.error, info: noop },
  Logger: { log: noop },
  PropertiesService: {
    getScriptProperties: () => ({ getProperty: (k) => (k === 'PHRASE_API_TOKEN' ? 'ApiToken test' : null), setProperty: noop }),
    getUserProperties: () => ({ getProperty: () => null, setProperty: noop })
  },
  CacheService: { getScriptCache: () => ({ get: () => null, put: noop, remove: noop }), getUserCache: () => ({ get: () => null, put: noop, remove: noop }) },
  UrlFetchApp: { fetchAll: (reqs) => reqs.map((r) => response(phraseBrowse(r))), fetch: (url, r) => response(phraseBrowse(r)) },
  Utilities: {
    DigestAlgorithm: { MD5: 'md5' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, s) => Array.from(crypto.createHash('md5').update(String(s)).digest()),
    base64EncodeWebSafe: (b) => Buffer.from(b).toString('base64url'),
    base64Encode: (b) => Buffer.from(b).toString('base64'),
    sleep: noop,
    gzip: () => { throw new Error('no gzip in CI'); },
    newBlob: () => ({})
  },
  Session: { getActiveUser: () => ({ getEmail: () => 'ci@example.com' }), getScriptTimeZone: () => 'Europe/Berlin' }
};
vm.createContext(ctx);
for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.gs')).sort()) {
  vm.runInContext(read(f), ctx, { filename: f });
}
ctx._getTargetTermbases_ = () => [
  { uid: 'tb-hng', name: 'HNG', category: 'HNG', label: 'Home and Garden', langs: ['de', 'en', 'fr'] },
  { uid: 'tb-prof', name: 'PROF', category: 'PROF', label: 'Professional', langs: ['de', 'en'] }
];
const realSearch = ctx.apiSearchTerms;
let searchImpl = realSearch;
const server = {
  apiSearchTerms: (...a) => searchImpl(...a),
  apiGetContext: () => ({ isAdmin: false, webAppUrl: 'https://script.google.com/macros/s/test/exec' })
};

// ─── Seiten wie HtmlService sie ausliefert ───────────────────────────────
function page(file) {
  const i18n = read('I18n.html');
  return read(file)
    .replace("<?!= include('I18n'); ?>", i18n)
    .replace('<?!= JSON.stringify(uiLang) ?>', '"en"')
    .replace('<?!= JSON.stringify(hostApp) ?>', '"docs"')
    .replace(/<\?[\s\S]*?\?>/g, 'null');
}
// google.script.run: ruft den Server in Node auf, Antwort wie bei Apps Script
// als JSON-Kopie (Fehler -> withFailureHandler).
const STUB = `<script>
window.google = { script: {
  history: { replace: function(){}, push: function(){}, setChangeHandler: function(){} },
  url: { getLocation: function(cb){ cb({ parameter: {}, parameters: {}, hash: '' }); } },
  host: { close: function(){} },
  run: (function mk(h){ return new Proxy({}, { get: function(_, name){
    if (name === 'withSuccessHandler') return function(f){ return mk(Object.assign({}, h, { ok: f })); };
    if (name === 'withFailureHandler') return function(f){ return mk(Object.assign({}, h, { fail: f })); };
    if (name === 'withUserObject') return function(){ return mk(h); };
    return function(){
      window.__serverCall(name, JSON.stringify([].slice.call(arguments))).then(function(r){
        if (r.error) { if (h.fail) h.fail(new Error(r.error)); }
        else if (h.ok) h.ok(r.value === undefined ? undefined : JSON.parse(r.value));
      });
    };
  }}); })({})
}};
</script>`;

(async () => {
  const results = [];
  const check = (name, ok, info) => { results.push({ name, ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? ' – ' + info : '')); };
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  async function open(file, inputSel) {
    const p = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.exposeFunction('__serverCall', (name, args) => {
      const fn = server[name];
      if (!fn) return { value: JSON.stringify(null) };
      try { return { value: JSON.stringify(fn(...JSON.parse(args))) }; } catch (e) { return { error: e.message }; }
    });
    await p.route('**/*', (r) => (r.request().url() === 'http://test.local/' + file
      ? r.fulfill({ contentType: 'text/html', body: page(file).replace('<head>', '<head>' + STUB) })
      : r.abort()));
    await p.goto('http://test.local/' + file);
    await p.waitForTimeout(300);
    return { p, errors, inputSel };
  }
  async function search(s, q) {
    await s.p.fill(s.inputSel, q);
    await s.p.press(s.inputSel, 'Enter');
    await s.p.waitForTimeout(1500);
    const txt = await s.p.evaluate(() => document.body.textContent);
    const loading = await s.p.$$eval('.loading-state', (els) => els.length);
    const cards = await s.p.$$eval('.concept-card, .result-card, .card', (els) => els.length);
    return { txt, loading, cards };
  }

  for (const [file, input] of [['TermSearch.html', '#query'], ['Sidebar.html', '#query']]) {
    const s = await open(file, input);
    if (!(await s.p.$(input))) { check(file + ': Suchfeld ' + input + ' vorhanden', false); continue; }

    searchImpl = realSearch; phraseMode = 'ok';
    let r = await search(s, 'Akku*');
    check(file + ': Suche liefert Treffer', r.loading === 0 && /battery/.test(r.txt), 'Karten: ' + r.cards);

    r = await search(s, 'xyzunbekannt');
    check(file + ': keine Treffer -> Hinweis statt Ladeanzeige', r.loading === 0);

    searchImpl = (...a) => realSearch(...a).concepts; // alter Server: reine Liste
    r = await search(s, 'Akku');
    check(file + ': alte Antwortform (Liste) wird angezeigt', r.loading === 0 && /battery/.test(r.txt));

    searchImpl = () => ({ concepts: [null, {}, { sourceTerm: null }] }); // kaputte Daten
    r = await search(s, 'Abbau');
    check(file + ': ungültige Daten -> keine hängende Ladeanzeige', r.loading === 0);

    searchImpl = realSearch; phraseMode = 'down'; // Phrase nicht erreichbar
    r = await search(s, 'Abbau');
    check(file + ': Serverfehler wird angezeigt', r.loading === 0 && /Phrase|rate limit|Error|Fehler/i.test(r.txt));
    phraseMode = 'ok';

    check(file + ': keine JavaScript-Fehler', s.errors.length === 0, s.errors.join(' | '));
    await s.p.close();
  }
  await browser.close();
  const failed = results.filter((x) => !x.ok).length;
  console.log(failed ? '\n' + failed + ' Test(s) fehlgeschlagen.' : '\nAlle ' + results.length + ' UI-Tests bestanden.');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
