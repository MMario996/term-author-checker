// Live-Check mit dem echten Gemini (optional, nur mit Zugangsdaten).
//
// Fuehrt die komplette PDF-Pruefung aus dem PDF-Fenster mit dem ECHTEN Server-
// Code und dem ECHTEN Gemini aus (Drive bleibt simuliert): Regeln aus den
// Gem-JSON-Dateien importieren, PDF pruefen, Gesamtdokument-Bericht erzeugen.
// Ergebnis landet in ci-output/ (Bericht als Markdown, Befunde als JSON,
// Zusammenfassung) - in GitHub Actions als Artefakt zum Herunterladen.
//
// Standard-PDF: die Test-BTA aus ci/lib/make-pdf.js mit zwei eingebauten Fehlern
// (Widerspruch Seite 2 <-> 5, Ausschalten vor Inbetriebnahme). Der Check schlaegt
// fehl, wenn der Gesamtdokument-Prompt nicht laeuft oder keinen der beiden findet.
//
// Umgebung: GEMINI_API_KEY (Pflicht), GEMINI_API_URL, AI_MODEL (optional, sonst
// wie im Code), LIVE_PDF=pfad.pdf (eigene PDF, dann ohne Erwartung an die Funde),
// LIVE_RULES=a.json,b.json (Standard: gemini-gem/beispiel_*_de.json),
// LIVE_LANG=de, LIVE_LARGE=1 (26-MB-Test-BTA: Weg ueber den Seitentext).
// Aufruf: GEMINI_API_KEY=... node ci/live-check.js
const fs = require('fs');
const path = require('path');
const { createSim, MB } = require('./lib/gas-sim');
const { makePdf, btaPages } = require('./lib/make-pdf');
const { loadImporter } = require('./lib/rules-import');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'ci-output');
const env = process.env;

if (!env.GEMINI_API_KEY) {
  console.log('GEMINI_API_KEY fehlt - Live-Check übersprungen.');
  process.exit(0);
}

const lang = env.LIVE_LANG || 'de';
const ruleFiles = (env.LIVE_RULES ? env.LIVE_RULES.split(',') : ['gemini-gem/beispiel_prompt_crosscheck_de.json', 'gemini-gem/beispiel_RL2026_de.json'])
  .map((f) => path.resolve(ROOT, f.trim()));
const scriptProps = { GEMINI_API_KEY: env.GEMINI_API_KEY };
if (env.GEMINI_API_URL) scriptProps.GEMINI_API_URL = env.GEMINI_API_URL;
if (env.AI_MODEL) scriptProps.AI_MODEL = env.AI_MODEL;

const sim = createSim({ live: true, uiLang: 'de', scriptProps });
const importJson = loadImporter();
let rules = sim.ctx.apiGetRulesConfig(lang);
for (const f of ruleFiles) {
  const r = importJson(rules, JSON.parse(fs.readFileSync(f, 'utf8')));
  if (r.res.skipped) throw new Error(path.basename(f) + ': ' + r.res.skipped + ' Einträge übersprungen');
  rules = r.rules;
}
sim.ctx.apiSaveRulesConfig(rules, lang);

const ownPdf = env.LIVE_PDF ? path.resolve(env.LIVE_PDF) : null;
const pdf = ownPdf ? fs.readFileSync(ownPdf)
  : makePdf(env.LIVE_LARGE
    ? { pages: btaPages(12), images: [2.9, 2.9, 2.9, 2.9, 6, 6].map((m) => Math.round(m * MB)), fontBytes: Math.round(2.8 * MB) }
    : { pages: btaPages(12) });
const fileName = ownPdf ? path.basename(ownPdf) : 'Test-BTA.pdf';
const fileId = sim.addFile(fileName, pdf, 'application/pdf');

console.log('Prüfe ' + fileName + ' (' + (pdf.length / MB).toFixed(1) + ' MB, Regelsprache ' + lang + ') mit ' +
  sim.ctx._driveGeminiConfig_().model + ' ...');
const t0 = Date.now();
let st = sim.ctx.apiPdfWebStart(fileId, lang);
for (let i = 0; !st.done && i < 500; i++) st = sim.ctx.apiPdfWebContinue(st.stateId);
if (!st.done) throw new Error('Prüfung nicht fertig geworden');
const res = st.result;

fs.mkdirSync(OUT, { recursive: true });
const docCalls = sim.geminiCalls.filter((c) => c.text.indexOf('=== INSTRUCTIONS ===') !== -1);
const report = sim.filesIn('Checked PDFs').find((f) => /^TermCheck_Report_/.test(f.name));
fs.writeFileSync(path.join(OUT, 'findings.json'), JSON.stringify(res.issues, null, 2));
if (report) fs.writeFileSync(path.join(OUT, 'report.html'), report.buf);
const prompt = res.issues.filter((i) => i.type === 'prompt');
const doc = res.docResult || { items: [], notes: [] };
const lines = [
  '## Live-Check: ' + fileName,
  '',
  '| | |', '|---|---|',
  '| Dauer | ' + Math.round((Date.now() - t0) / 1000) + ' s |',
  '| Gemini-Anfragen | ' + sim.geminiCalls.length + ' (HTTP ' + [...new Set(sim.geminiCalls.map((c) => c.code))].join(', ') + ') |',
  '| Gesamtdokument-Anfrage | ' + (docCalls.length ? docCalls.map((c) => (c.size / MB).toFixed(1) + ' MB, ' + Math.round(c.ms / 1000) + ' s, ' + (/=== Page 1 of/.test(c.text) ? 'Seitentext' : 'PDF')).join('; ') : '-') + ' |',
  '| Bilder entfernt | ' + (res.info.imagesRemoved || 0) + ' |',
  '| Funde gesamt | ' + res.issues.length + ' |',
  '| Funde des Prompts | ' + prompt.length + ' |',
  '| Bericht | ' + (report ? 'ci-output/report.html' : '-') + ' |',
  ''
].concat(doc.items.map((it) => '- ' + it.title + ': ' + (it.error ? 'FEHLER ' + it.error : 'ok' + (it.note ? ' (' + it.note + ')' : '')))
).concat((doc.notes || []).map((n) => '- Hinweis: ' + n)).concat(['', '### Funde des Prompts', '']).concat(
  prompt.map((i) => '- **' + (i.location || '?') + '** "' + i.original + '" -> ' + i.suggestion + ' _(' + i.explanation + ')_'));
fs.writeFileSync(path.join(OUT, 'summary.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');

const problems = [];
if (!docCalls.length) problems.push('Der Gesamtdokument-Prompt wurde nicht ausgeführt.');
doc.items.filter((it) => it.error).forEach((it) => problems.push(it.title + ': ' + it.error));
if (!report) problems.push('Kein Bericht erzeugt.');
if (!ownPdf) {
  const text = prompt.map((i) => i.original + ' ' + i.explanation).join(' ');
  if (!/abgesetzt|LKW|Fahrt|ausschalten|Inbetriebnahme|Hauptschalter/i.test(text)) {
    problems.push('Keiner der eingebauten Fehler der Test-BTA wurde als Befund gemeldet.');
  }
}
if (problems.length) {
  console.error('\nLive-Check fehlgeschlagen:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('\nLive-Check bestanden.');
