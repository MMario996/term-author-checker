// End-to-End-Test: Gem-Prompt (Gesamtdokument) + Redaktionsleitfaden gegen eine PDF.
//
// Spielt den kompletten Weg durch, den der Fachbereich geht - mit dem ECHTEN
// Server-Code (alle .gs-Dateien) und dem ECHTEN JSON-Import aus AuthorCheck.html:
//   1. JSON-Dateien des Gems importieren (Cross-Check-Prompt + Leitfaden-Regeln)
//   2. Regeln speichern (Drive-JSON + Properties) und wieder laden
//   3. PDF im PDF-Fenster pruefen (apiPdfWebStart / apiPdfWebContinue)
//   4. Bericht (Google Doc), Befunde in der Liste, kommentierte PDF
// Drive und Gemini sind simuliert (tests/lib/gas-sim.js); Gemini lehnt wie die
// echte API Anfragen ueber 20 MB ab.
//
// Aufruf: node tests/doc-prompt.test.js
const fs = require('fs');
const path = require('path');
const { createSim, MB } = require('./lib/gas-sim');
const { makePdf, btaPages } = require('./lib/make-pdf');
const { loadImporter } = require('./lib/rules-import');

const ROOT = path.resolve(__dirname, '..');
const GEM_PROMPT = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-gem/beispiel_prompt_crosscheck_de.json'), 'utf8'));
const GEM_GUIDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'gemini-gem/beispiel_RL2026_de.json'), 'utf8'));
const importJson = loadImporter();

const results = [];
function test(name, fn) {
  try { fn(); results.push(true); console.log('PASS ' + name); }
  catch (e) { results.push(false); console.log('FAIL ' + name + '\n     ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n     ') : e)); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function eq(a, b, msg) { if (a !== b) throw new Error((msg || 'expected equal') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)); }

// Antwort von "Gemini": Seitenpakete -> keine Funde; Gesamtdokument-Prompt ->
// Bericht im Format des Prompts + maschinenlesbare Befunde (wie verlangt).
const REPORT = [
  '## Cross-Check-Audit: Widersprüche und Prozesslogik', '',
  '* **Gesamtumfang:** 12 Seiten', '', '---', '### Widersprüche', '#### Widerspruch 1',
  '- **Beteiligte Stellen:**',
  '  * **Seite A (S. 2 von 12):** 1 Sicherheit',
  '    * **Aussage A:** "Die Anlage nur im abgesetzten Zustand betreiben."',
  '  * **Seite B (S. 5 von 12):** 4 Betrieb auf dem LKW',
  '    * **Aussage B:** "Die Anlage kann während der Fahrt betrieben werden."',
  '- **Widerspruch:** Seite 2 verbietet, was Seite 5 beschreibt.',
  '### Prozesslogik-Verstöße', '#### Verstoß 1',
  '- **Betroffene Seite(n):** S. 3 bis 4 (von insgesamt 12 Seiten)',
  '- **Verstoß:** Ausschalten vor Inbetriebnahme.',
  '# Finale Zusammenfassung des Cross-Check-Audits', '- **Gefundene Widersprüche:** 1'
].join('\n');
const FINDINGS = { issues: [
  { location: 'Page 2', original: 'Die Anlage nur im abgesetzten Zustand betreiben.', suggestion: 'Ausnahme für den Betrieb auf dem LKW ergänzen.', explanation: 'Widerspruch 1: widerspricht Seite 5.', replaceable: false },
  { location: 'Page 5', original: 'Die Anlage kann während der Fahrt betrieben werden.', suggestion: 'Streichen oder auf den abgesetzten Zustand beschränken.', explanation: 'Widerspruch 1: widerspricht Seite 2.', replaceable: false },
  { location: 'Page 3', original: 'Anlage ausschalten: Hauptschalter auf 0 stellen.', suggestion: 'Kapitel nach der Inbetriebnahme einordnen.', explanation: 'Verstoß 1: Ausschalten vor Inbetriebnahme (Seite 4).', replaceable: false }
] };
function geminiBta(call) {
  if (call.text.indexOf('=== INSTRUCTIONS ===') !== -1) return { text: REPORT + '\n\n===TERMCHECK_FINDINGS===\n' + JSON.stringify(FINDINGS) };
  return { text: '{"issues":[]}' };
}
const isDocCall = (c) => !c.rejected && c.text.indexOf('=== INSTRUCTIONS ===') !== -1;

// Regeln wie im Popup: aktuelle Regeln laden, JSON importieren, speichern.
function importAndSave(sim, lang, jsonList) {
  let rules = sim.ctx.apiGetRulesConfig(lang);
  const summary = [];
  jsonList.forEach((json) => {
    const r = importJson(rules, json);
    rules = r.rules;
    summary.push(r.res);
  });
  sim.ctx.apiSaveRulesConfig(rules, lang);
  return summary;
}

function runPdfWindow(sim, fileId, lang) {
  let st = sim.ctx.apiPdfWebStart(fileId, lang);
  for (let i = 0; !st.done && i < 200; i++) st = JSON.parse(JSON.stringify(sim.ctx.apiPdfWebContinue(st.stateId)));
  ok(st.done, 'PDF check did not finish');
  return st.result;
}

function smallBta() { return makePdf({ pages: btaPages(12), images: [40000, 60000] }); }
// 26 MB wie eine echte Anleitung: Fotos + eingebettete Schrift. Nach dem
// Verkleinern ~14,4 MB -> als Base64 zu gross fuer eine Gesamtdokument-Anfrage.
function largeBta() {
  return makePdf({ pages: btaPages(12), images: [2.9, 2.9, 2.9, 2.9, 6, 6].map((m) => Math.round(m * MB)), fontBytes: Math.round(2.8 * MB) });
}

// ─── 1. Import ───────────────────────────────────────────────────────────
test('Import: Gem-Prompt und Leitfaden-Regeln werden vollständig übernommen', () => {
  const sim = createSim();
  const [p, g] = importAndSave(sim, 'de', [GEM_PROMPT, GEM_GUIDE]);
  eq(p.skipped, 0, 'prompt skipped'); eq(p.added, 1, 'prompt added');
  eq(g.skipped, 0, 'guide skipped'); eq(g.std, 1, 'standard rule override');
  const rules = sim.ctx.apiGetRulesConfig('de');
  const cc = rules.find((r) => r.Name === GEM_PROMPT[0].Name);
  ok(cc, 'cross-check rule missing after reload');
  eq(cc.PromptScope, 'DOCUMENT', 'scope');
  eq(cc.CustomPrompt, GEM_PROMPT[0].CustomPrompt, 'prompt was changed or cut');
  eq(rules.filter((r) => /^CUSTOM_RL2026_/.test(r.Name)).length, 5, 'guide rules after reload');
});

// ─── 2. Kleine PDF: Prompt läuft mit der PDF ─────────────────────────────
test('PDF-Fenster (kleine PDF): Gesamtdokument-Prompt läuft mit PDF, Bericht + Befunde + kommentierte PDF', () => {
  const sim = createSim();
  importAndSave(sim, 'de', [GEM_PROMPT, GEM_GUIDE]);
  sim.gemini = geminiBta;
  const id = sim.addFile('BTA_HD_9-20.pdf', smallBta(), 'application/pdf');
  const res = runPdfWindow(sim, id, 'de');

  const docCalls = sim.geminiCalls.filter(isDocCall);
  eq(docCalls.length, 1, 'whole-document requests');
  ok(docCalls[0].pdf && docCalls[0].pdf.slice(0, 5).toString() === '%PDF-', 'PDF not attached');
  ok(docCalls[0].text.indexOf(GEM_PROMPT[0].CustomPrompt) !== -1, 'prompt not sent unchanged');
  ok(/Total pages: 12/.test(docCalls[0].text), 'page count missing');
  ok(docCalls[0].text.indexOf('Zahlen von eins bis zwölf') !== -1, 'style guide rules not passed as reference');
  // Seitenpakete: Leitfaden-Regeln ja, Cross-Check-Prompt nein.
  const partCalls = sim.geminiCalls.filter((c) => !isDocCall(c));
  ok(partCalls.length >= 1, 'no page requests');
  partCalls.forEach((c) => {
    ok(c.text.indexOf('Zahlen von eins bis zwölf') !== -1, 'guide rule missing in page request');
    ok(c.text.indexOf('Cross-Check-Audit') === -1, 'whole-document prompt leaked into page request');
  });

  const doc = res.docResult;
  ok(doc && doc.url, 'no report link');
  eq(doc.items.length, 1); eq(doc.items[0].error, ''); eq(doc.items[0].findings, 3);
  eq(doc.notes.length, 0, 'unexpected notes: ' + JSON.stringify(doc.notes));
  const report = sim.filesIn('Checked PDFs').find((f) => /^TermCheck_Report_BTA_HD_9-20_/.test(f.name));
  ok(report, 'report doc not created in "Checked PDFs"');
  ok(/Widerspruch 1/.test(report.buf.toString('utf8')), 'report content missing');

  const prompt = res.issues.filter((i) => i.type === 'prompt');
  eq(prompt.length, 3, 'prompt findings in list');
  ok(prompt.every((i) => i.rule === GEM_PROMPT[0].Description), 'rule name on findings');

  const ann = sim.ctx.apiPdfWebAnnotate(res.resultId, null);
  ok(ann.done && ann.url, 'annotated PDF not created');
  const annotated = sim.filesIn('Checked PDFs').find((f) => f.mime === 'application/pdf');
  ok(annotated, 'annotated PDF file missing');
  const txt = annotated.buf.toString('latin1');
  eq((txt.match(/\/Subtype\s*\/Highlight/g) || []).length, 3, 'highlights at the quoted passages');
  ok(sim.geminiCalls.every((c) => !c.rejected), 'a request exceeded the size limit');
  eq(sim.filesIn('_Temp').length, 0, 'temporary files left behind');
});

// ─── 3. Große PDF (Fall aus dem Fachbereich) ─────────────────────────────
test('PDF-Fenster (26-MB-PDF, Bilder entfernt): Prompt läuft trotzdem - mit dem Text aller Seiten', () => {
  const sim = createSim();
  importAndSave(sim, 'de', [GEM_PROMPT, GEM_GUIDE]);
  sim.gemini = geminiBta;
  const id = sim.addFile('BTA_gross.pdf', largeBta(), 'application/pdf');
  const res = runPdfWindow(sim, id, 'de');

  ok(res.info.imagesRemoved > 0, 'large PDF was not reduced');
  const docCalls = sim.geminiCalls.filter(isDocCall);
  eq(docCalls.length, 1, 'whole-document requests');
  ok(!docCalls[0].pdf, 'PDF should not be attached (too large)');
  ok(/=== Page 1 of 12 ===/.test(docCalls[0].text) && /=== Page 12 of 12 ===/.test(docCalls[0].text), 'page markers missing');
  ok(docCalls[0].text.indexOf('Die Anlage kann während der Fahrt betrieben werden.') !== -1, 'page text (with umlauts) missing');
  ok(docCalls[0].text.indexOf(GEM_PROMPT[0].CustomPrompt) !== -1, 'prompt not sent unchanged');
  ok(sim.geminiCalls.every((c) => !c.rejected), 'a request exceeded the size limit');

  const doc = res.docResult;
  ok(doc.url, 'no report link');
  eq(doc.items[0].error, '', 'prompt failed');
  ok(/nicht an eine KI-Anfrage anhängen/.test(doc.items[0].note), 'text-mode note missing (DE UI)');
  eq(res.issues.filter((i) => i.type === 'prompt').length, 3, 'prompt findings in list');
  const report = sim.filesIn('Checked PDFs').find((f) => /^TermCheck_Report_/.test(f.name));
  ok(/vollständigen Text aller 12 Seiten/.test(report.buf.toString('utf8')), 'note missing in report');
});

// Proxy vor Gemini mit kleinerer Grenze (Apigee: oft 10 MB): die Seitenpakete
// gehen durch, die Anfrage mit der ganzen PDF nicht. Mit dem alten Code fehlte
// der Prompt dann im Ergebnis ("AI request failed (413)").
[400, 413, 502].forEach((code) => {
  test('Proxy lehnt die ganze PDF ab (HTTP ' + code + '): automatischer zweiter Versuch mit dem Seitentext', () => {
    const sim = createSim({ geminiLimit: 10 * MB, geminiRejectCode: code });
    importAndSave(sim, 'de', [GEM_PROMPT, GEM_GUIDE]);
    sim.gemini = geminiBta;
    // 18 MB -> verkleinert ~11 MB: unter der PDF-Grenze fuer Gesamtdokument-Prompts, ueber der des Proxys.
    const pdf = makePdf({ pages: btaPages(12), images: [2.2, 2.2, 2.2, 2.2, 9].map((m) => Math.round(m * MB)), fontBytes: Math.round(1.5 * MB) });
    const res = runPdfWindow(sim, sim.addFile('BTA.pdf', pdf, 'application/pdf'), 'de');
    ok(res.info.imagesRemoved > 0, 'expected reduction');
    ok(sim.geminiCalls.some((c) => c.rejected), 'expected a rejected PDF request');
    const docCalls = sim.geminiCalls.filter(isDocCall);
    eq(docCalls.length, 1);
    ok(!docCalls[0].pdf && /=== Page 5 of 12 ===/.test(docCalls[0].text), 'retry with text expected');
    eq(res.docResult.items[0].error, '');
    ok(res.docResult.url, 'no report');
    eq(res.issues.filter((i) => i.type === 'prompt').length, 3, 'prompt findings in list');
  });
});

test('Proxy lehnt die PDF erst nach langer Wartezeit ab: zweiter Versuch im nächsten Aufruf (6-min-Limit)', () => {
  const sim = createSim();
  importAndSave(sim, 'de', [GEM_PROMPT]);
  let deferred = false;
  sim.gemini = (call) => {
    if (call.text.indexOf('=== INSTRUCTIONS ===') !== -1 && call.pdf) { sim.advance(200000); return { code: 504, body: 'Gateway Timeout' }; }
    return geminiBta(call);
  };
  const id = sim.addFile('BTA.pdf', smallBta(), 'application/pdf');
  let st = sim.ctx.apiPdfWebStart(id, 'de');
  for (let i = 0; !st.done && i < 50; i++) {
    if (st.docPrompts) deferred = deferred || sim.geminiCalls.some((c) => c.pdf && isDocCall(c));
    st = sim.ctx.apiPdfWebContinue(st.stateId);
  }
  ok(st.done, 'not finished');
  ok(deferred, 'text retry should run in a separate call');
  const docCalls = sim.geminiCalls.filter(isDocCall);
  ok(docCalls.length >= 2 && !docCalls[docCalls.length - 1].pdf, 'last whole-document request should use the page text');
  eq(st.result.docResult.items[0].error, '', 'prompt failed');
  ok(st.result.docResult.url, 'no report');
});

test('Gescannte PDF ohne Text, zu groß: verständliche Meldung statt stillem Fehlen', () => {
  const sim = createSim({ scriptProps: { DOC_PROMPT_PDF_MAX_MB: '0.5' } });
  importAndSave(sim, 'de', [GEM_PROMPT]);
  sim.gemini = geminiBta;
  const id = sim.addFile('Scan.pdf', makePdf({ pages: [[], [], []], images: [300000, 300000, 300000] }), 'application/pdf');
  const res = runPdfWindow(sim, id, 'de');
  ok(/keinen lesbaren Text/.test(res.docResult.items[0].error), 'scan message: ' + JSON.stringify(res.docResult));
});

// ─── 4. Hinweise, wenn der Prompt nicht läuft ────────────────────────────
test('Prompt nur unter Regelsprache EN gespeichert, Prüfung DE: Hinweis im Ergebnis', () => {
  const sim = createSim();
  importAndSave(sim, 'en', [GEM_PROMPT]);
  sim.gemini = geminiBta;
  const res = runPdfWindow(sim, sim.addFile('BTA.pdf', smallBta(), 'application/pdf'), 'de');
  eq(sim.geminiCalls.filter(isDocCall).length, 0);
  ok(res.docResult && res.docResult.notes.some((n) => /Regelsprache EN/.test(n) && n.indexOf(GEM_PROMPT[0].Description) !== -1),
    'notes: ' + JSON.stringify(res.docResult));
});

test('Prüfsprache ohne Regelwerk (FR): Hinweis, dass eigene Regeln nur für DE/EN gelten', () => {
  const sim = createSim();
  importAndSave(sim, 'de', [GEM_PROMPT]);
  const res = runPdfWindow(sim, sim.addFile('BTA.pdf', smallBta(), 'application/pdf'), 'fr');
  ok(res.docResult && res.docResult.notes.some((n) => /nur bei Prüfsprache Deutsch oder Englisch/.test(n)), JSON.stringify(res.docResult));
});

test('Langer Prompt mit Geltungsbereich "Pro Abschnitt": Hinweis auf "Gesamtdokument"', () => {
  const sim = createSim();
  const passage = [Object.assign({}, GEM_PROMPT[0], { PromptScope: '' })];
  importAndSave(sim, 'de', [passage]);
  const res = runPdfWindow(sim, sim.addFile('BTA.pdf', smallBta(), 'application/pdf'), 'de');
  ok(res.docResult && res.docResult.notes.some((n) => /„Pro Abschnitt“/.test(n)), JSON.stringify(res.docResult));
});

test('Ausgeschalteter Gesamtdokument-Prompt: Hinweis', () => {
  const sim = createSim();
  importAndSave(sim, 'de', [[Object.assign({}, GEM_PROMPT[0], { IsEnabled: false })]]);
  const res = runPdfWindow(sim, sim.addFile('BTA.pdf', smallBta(), 'application/pdf'), 'de');
  ok(res.docResult && res.docResult.notes.some((n) => /ausgeschaltet/.test(n)), JSON.stringify(res.docResult));
});

test('Drive-Seitenbereich (30 s): Gesamtdokument-Prompt meldet, dass er nur im PDF-Fenster läuft', () => {
  const sim = createSim();
  importAndSave(sim, 'de', [GEM_PROMPT]);
  sim.gemini = geminiBta;
  const id = sim.addFile('BTA.pdf', smallBta(), 'application/pdf');
  const job = sim.ctx._drivePdfNewJob_(id, 'BTA.pdf', 'de');
  let st = sim.ctx._drivePdfAdvance_(job, Date.now(), sim.ctx._drivePdfLimits_(false));
  for (let i = 0; !st.done && i < 100; i++) st = sim.ctx._drivePdfContinue_(job, Date.now(), sim.ctx._drivePdfLimits_(false));
  ok(/only run in the PDF window/.test(job.docResult.items[0].error), JSON.stringify(job.docResult));
});

// ─── 5. Docs/Sheets/Slides ───────────────────────────────────────────────
test('Docs: Gesamtdokument-Prompt läuft mit dem ganzen Text, Leitfaden als Referenz', () => {
  const sim = createSim();
  importAndSave(sim, 'de', [GEM_PROMPT, GEM_GUIDE]);
  sim.gemini = geminiBta;
  const text = btaPages(12).map((p) => p.join('\n')).join('\n\n');
  sim.ctx.apiExtractTextFromCurrentApp = () => text;
  sim.ctx._clearCheckScope_ = () => null;
  const res = sim.ctx.apiRunAuthorCheck('de', 'document');
  const docCalls = sim.geminiCalls.filter(isDocCall);
  eq(docCalls.length, 1);
  ok(docCalls[0].text.indexOf('Die Anlage nur im abgesetzten Zustand betreiben.') !== -1, 'document text missing');
  ok(docCalls[0].text.indexOf('Zahlen von eins bis zwölf') !== -1, 'guide reference missing');
  ok(res.reports && res.reports.url, 'report missing');
  eq(res.issues.filter((i) => i.type === 'prompt').length, 3);
});

// ─── 6. Bausteine ────────────────────────────────────────────────────────
test('Antwort ohne Befund-Block: Bericht bleibt erhalten, keine Befunde', () => {
  const sim = createSim();
  const r = sim.ctx._splitDocPromptAnswer_('## Bericht\nkein Marker');
  eq(r.issues.length, 0); ok(/kein Marker/.test(r.report));
  const r2 = sim.ctx._splitDocPromptAnswer_('A\n===TERMCHECK_FINDINGS===\n```json\n{"issues":[{"original":"x"}]}\n```');
  eq(r2.issues.length, 1); eq(r2.report, 'A');
});

test('Leitfaden-Referenz: nur aktive eigene Regeln, gekürzt bei Überlänge', () => {
  const sim = createSim();
  const rules = [
    { Name: 'CUSTOM_A', Description: 'Regel A', IsEnabled: true, RuleKind: 'RULE', Section: 'Custom: L', Subsection: 'K1' },
    { Name: 'CUSTOM_B', Description: 'Regel B', IsEnabled: false, RuleKind: 'RULE' },
    { Name: '711de', Description: 'Standard', IsEnabled: true },
    { Name: 'CUSTOM_DOC', Description: 'Doc', IsEnabled: true, RuleKind: 'PROMPT', PromptScope: 'DOCUMENT', CustomPrompt: 'x' }
  ];
  const g = sim.ctx._docPromptGuide_(rules);
  eq(g, '- [Custom: L > K1] Regel A');
  const many = [];
  for (let i = 0; i < 400; i++) many.push({ Name: 'CUSTOM_' + i, Description: 'x'.repeat(200), IsEnabled: true, RuleKind: 'RULE' });
  const g2 = sim.ctx._docPromptGuide_(many);
  ok(g2.length <= sim.ctx.DOC_PROMPT_GUIDE_MAX_CHARS + 100 && /further rules omitted/.test(g2), 'guide not capped');
});

test('Markdown-Bericht: Überschriften, Listen, Fett und HTML-Escaping', () => {
  const sim = createSim();
  const html = sim.ctx._markdownToHtml_('## Titel\n- **A** <b>\n  * B\n---');
  ok(/<h2>Titel<\/h2>/.test(html) && /<b>A<\/b> &lt;b&gt;/.test(html) && /<hr>/.test(html), html);
});

const failed = results.filter((x) => !x).length;
console.log(failed ? '\n' + failed + ' Test(s) fehlgeschlagen.' : '\nAlle ' + results.length + ' Gesamtdokument-Tests bestanden.');
process.exit(failed ? 1 : 0);
