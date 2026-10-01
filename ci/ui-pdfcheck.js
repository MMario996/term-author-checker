// UI-Test fuer das PDF-Fenster (PdfCheck.html) mit dem ECHTEN Server-Code.
//
// Die Seite laeuft in Chromium; jeder google.script.run-Aufruf geht an die
// .gs-Dateien in Node (ci/lib/gas-sim.js: Drive und Gemini simuliert). Geprueft
// wird, was der Fachbereich sieht: Fortschritt bis zum Ende, Hinweis zu
// entfernten Bildern, Link zum Gesamtdokument-Bericht, Hinweise, wenn der
// Prompt mit dem Seitentext lief oder gar nicht lief, Befunde des Prompts in
// der Liste und keine JavaScript-Fehler.
//
// Aufruf: node ci/ui-pdfcheck.js   (braucht das npm-Paket "playwright" + Chromium;
// optional CHROMIUM_PATH=/pfad/zu/chromium)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createSim, MB } = require('./lib/gas-sim');
const { makePdf, btaPages } = require('./lib/make-pdf');

const ROOT = path.resolve(__dirname, '..');
const GEM_PROMPT = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-gem/beispiel_prompt_crosscheck_de.json'), 'utf8'));

function geminiBta(call) {
  if (call.text.indexOf('=== INSTRUCTIONS ===') === -1) return { text: '{"issues":[]}' };
  return { text: '## Cross-Check-Audit\n#### Widerspruch 1\nSeite 2 vs. Seite 5\n===TERMCHECK_FINDINGS===\n' + JSON.stringify({ issues: [
    { location: 'Page 2', original: 'Die Anlage nur im abgesetzten Zustand betreiben.', suggestion: 'Ausnahme ergänzen.', explanation: 'Widerspruch 1: widerspricht Seite 5.' },
    { location: 'Page 5', original: 'Die Anlage kann während der Fahrt betrieben werden.', suggestion: 'Streichen.', explanation: 'Widerspruch 1: widerspricht Seite 2.' }
  ] }) };
}

const STUB = `<script>
window.google = { script: {
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
  const check = (name, ok, info) => { results.push(ok); console.log((ok ? 'PASS ' : 'FAIL ') + name + (info && !ok ? ' – ' + info : '')); };
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  // Eine Pruefung im Fenster komplett durchlaufen lassen.
  async function runWindow(name, setup) {
    const sim = createSim({ uiLang: 'de' });
    sim.gemini = geminiBta;
    const fileId = setup(sim);
    const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.exposeFunction('__serverCall', (fn, args) => {
      if (typeof sim.ctx[fn] !== 'function' || /_$/.test(fn)) return { error: 'Unknown server function ' + fn };
      try { return { value: JSON.stringify(sim.ctx[fn](...JSON.parse(args))) }; } catch (e) { return { error: e.message }; }
    });
    const html = fs.readFileSync(path.join(ROOT, 'PdfCheck.html'), 'utf8')
      .replace('<?!= JSON.stringify(fileId) ?>', JSON.stringify(fileId))
      .replace('<?!= JSON.stringify(checkLang) ?>', JSON.stringify('de'))
      .replace('<?!= JSON.stringify(checkLangName) ?>', JSON.stringify('Deutsch'))
      .replace('<?!= JSON.stringify(texts) ?>', JSON.stringify(sim.ctx._drivePdfWebTexts_()))
      .replace(/<\?[\s\S]*?\?>/g, 'null')
      .replace('<head>', '<head>' + STUB);
    await page.route('**/*', (r) => (r.request().url() === 'http://test.local/pdf'
      ? r.fulfill({ contentType: 'text/html', body: html }) : r.abort()));
    await page.goto('http://test.local/pdf');
    try { await page.waitForFunction(() => document.getElementById('summary').textContent.trim().length > 0, null, { timeout: 60000 }); }
    catch (e) { check(name + ': Prüfung im Fenster läuft bis zum Ergebnis', false, (await page.evaluate(() => document.body.innerText)).slice(0, 400)); }
    const view = await page.evaluate(() => ({
      notes: document.getElementById('notes').innerText,
      reportLink: (document.querySelector('#notes a.btn') || {}).href || '',
      body: document.body.innerText
    }));
    return { page, errors, view, sim };
  }

  // 1. Große PDF wie im Fachbereich: Bilder entfernt, Prompt läuft mit Seitentext.
  {
    const r = await runWindow('Große PDF', (sim) => {
      sim.ctx.apiSaveRulesConfig(sim.ctx.apiGetRulesConfig('de').concat(GEM_PROMPT), 'de');
      return sim.addFile('BTA_gross.pdf', makePdf({ pages: btaPages(12), images: [2.9, 2.9, 2.9, 2.9, 6, 6].map((m) => Math.round(m * MB)), fontBytes: Math.round(2.8 * MB) }), 'application/pdf');
    });
    check('Große PDF: Hinweis auf weggelassene Bilder', /große Bilder/.test(r.view.notes), r.view.notes);
    check('Große PDF: Link zum Gesamtdokument-Bericht', /docs\.google\.com\/document/.test(r.view.reportLink), r.view.notes);
    check('Große PDF: Hinweis, dass der Prompt mit dem Text aller Seiten lief', /vollständigen Text aller 12 Seiten/.test(r.view.notes), r.view.notes);
    check('Große PDF: Befunde des Prompts in der Liste', /Widerspruch 1: widerspricht Seite 5/.test(r.view.body), r.view.body.slice(0, 600));
    check('Große PDF: keine JavaScript-Fehler', r.errors.length === 0, r.errors.join(' | '));
    await r.page.close();
  }

  // 2. Prompt nur unter EN gespeichert, geprüft wird DE: Hinweis statt Schweigen.
  {
    const r = await runWindow('Falsche Regelsprache', (sim) => {
      sim.ctx.apiSaveRulesConfig(sim.ctx.apiGetRulesConfig('en').concat(GEM_PROMPT), 'en');
      return sim.addFile('BTA.pdf', makePdf({ pages: btaPages(6) }), 'application/pdf');
    });
    check('Falsche Regelsprache: Hinweis im Ergebnis', /Regelsprache EN/.test(r.view.notes), r.view.notes);
    check('Falsche Regelsprache: kein Bericht-Link', !r.view.reportLink, r.view.reportLink);
    check('Falsche Regelsprache: keine JavaScript-Fehler', r.errors.length === 0, r.errors.join(' | '));
    await r.page.close();
  }

  await browser.close();
  const failed = results.filter((x) => !x).length;
  console.log(failed ? '\n' + failed + ' Test(s) fehlgeschlagen.' : '\nAlle ' + results.length + ' UI-Tests (PDF-Fenster) bestanden.');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
