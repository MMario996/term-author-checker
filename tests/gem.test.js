// Prueft alles, was der Gemini-Gem "Kärcher Regel-Importer" liefert bzw. braucht:
//  - jede JSON-Datei in gemini-gem/ (und optional weitere als Argument, z. B.
//    eine frisch vom Gem erzeugte Datei) laesst sich mit dem ECHTEN Import aus
//    AuthorCheck.html ohne uebersprungene Eintraege importieren
//  - KI-Prompt-Regeln enthalten nichts, was zur Pruefzeit nicht funktioniert
//    (Platzhalter, Gem-Wissensdateien, Logs, Links) und passen in 50.000 Zeichen
//  - JSON-Beispiele in gem-anweisungen.md sind gueltig
//  - die Wissensdateien standardregeln_*.md passen zu Rules.gs
//
// Aufruf: node tests/gem.test.js [weitere.json ...]
const fs = require('fs');
const path = require('path');
const { createSim } = require('./lib/gas-sim');
const { loadImporter } = require('./lib/rules-import');

const GEM = path.resolve(__dirname, '..', 'gemini-gem');
const importJson = loadImporter();
const sim = createSim();

const results = [];
function test(name, fn) {
  try { fn(); results.push(true); console.log('PASS ' + name); }
  catch (e) { results.push(false); console.log('FAIL ' + name + '\n     ' + String(e && e.message || e).split('\n').join('\n     ')); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

// Was zur Pruefzeit nicht funktioniert (siehe gem-anweisungen.md, Modus P, Teil 3).
const NOT_AT_CHECK_TIME = [
  [/\[F[ÜU]GE HIER/i, 'Platzhalter "[FÜGE HIER ...]"'],
  [/in (dir|diesem Gem) hinterlegt|Wissensdatei|Wissensbasis|knowledge file/i, 'Verweis auf eine Gem-Wissensdatei'],
  [/Prozess- und Zustands-Log|vorgelagerten Seiten-Audit/i, 'Verweis auf ein vorgelagertes Log'],
  [/Basis-URL|#page=/i, 'Basis-URL/Links (das Tool gibt Seiten als "Seite X von Y" an)']
];

function checkRuleFile(file) {
  const lang = /_en\.json$/i.test(file) ? 'en' : 'de';
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { throw new Error('kein gültiges JSON: ' + e.message); }
  ok(Array.isArray(data) && data.length, 'erwartet: Liste [ ... ] mit mindestens einer Regel');
  const defaults = sim.ctx.apiGetRulesConfig(lang);
  const r = importJson(defaults, data);
  ok(r.res.skipped === 0, r.res.skipped + ' Eintrag/Einträge würden beim Import übersprungen ' +
    '(Name mit Sonderzeichen, fehlende Description oder unbekannte Standardregel)');
  const problems = [];
  const names = {};
  data.forEach((e, i) => {
    const where = '#' + (i + 1) + ' ' + e.Name;
    if (names[e.Name]) problems.push(where + ': Name doppelt');
    names[e.Name] = true;
    const isStd = defaults.some((d) => d.Name === e.Name);
    if (!isStd && !/^CUSTOM_[A-Z0-9_]+$/.test(e.Name)) problems.push(where + ': Name muss mit CUSTOM_ beginnen und nur A-Z 0-9 _ enthalten');
    if (isStd) return;
    if (['RULE', 'PROMPT'].indexOf(e.RuleKind) === -1) problems.push(where + ': RuleKind muss "RULE" oder "PROMPT" sein');
    if (e.RuleKind === 'RULE' && e.CustomPrompt) problems.push(where + ': RULE mit CustomPrompt (wird dann als Prompt behandelt)');
    if (e.PromptScope && (e.PromptScope !== 'DOCUMENT' || e.RuleKind !== 'PROMPT')) problems.push(where + ': PromptScope "DOCUMENT" nur bei RuleKind "PROMPT"');
    if (String(e.Description || '').length > 1000) problems.push(where + ': Description länger als 1.000 Zeichen (wird gekürzt)');
    if (e.RuleKind === 'PROMPT') {
      const p = String(e.CustomPrompt || '');
      if (!p.trim()) problems.push(where + ': PROMPT ohne CustomPrompt');
      if (p.length > 50000) problems.push(where + ': CustomPrompt länger als 50.000 Zeichen (wird gekürzt)');
      NOT_AT_CHECK_TIME.forEach(([re, what]) => { if (re.test(p)) problems.push(where + ': ' + what + ' funktioniert zur Prüfzeit nicht'); });
      const imp = r.imported.find((x) => x.Name === e.Name);
      if (!imp || imp.CustomPrompt !== p) problems.push(where + ': Prompt kommt nach dem Import nicht unverändert an');
      if (e.PromptScope === 'DOCUMENT' && (!imp || imp.PromptScope !== 'DOCUMENT')) problems.push(where + ': Geltungsbereich "Gesamtdokument" geht beim Import verloren');
    }
  });
  ok(!problems.length, problems.join('\n'));
  return r.res;
}

const jsonFiles = fs.readdirSync(GEM).filter((f) => f.endsWith('.json')).map((f) => path.join(GEM, f))
  .concat(process.argv.slice(2).map((f) => path.resolve(f)));
jsonFiles.forEach((file) => {
  test('Gem-JSON importierbar: ' + path.relative(process.cwd(), file), () => checkRuleFile(file));
});

test('Prüfregeln erkennen den Original-Prompt aus dem Fachbereich (mit Gem-Wissensdatei, Log, Basis-URL)', () => {
  const original = 'Dir liegen vor: 1. Unser offizieller "Redaktionsleitfaden" — dieser ist als Wissensdatei fest in dir (diesem Gem) hinterlegt. ' +
    '2. Ein vollständiges "Prozess- und Zustands-Log". [FÜGE HIER OPTIONAL DIE BASIS-URL EIN: Basis-URL = ...]';
  const hits = NOT_AT_CHECK_TIME.filter(([re]) => re.test(original)).length;
  ok(hits === NOT_AT_CHECK_TIME.length, 'nur ' + hits + ' von ' + NOT_AT_CHECK_TIME.length + ' Mustern erkannt');
});

test('gem-anweisungen.md: JSON-Beispiele sind gültig', () => {
  const md = fs.readFileSync(path.join(GEM, 'gem-anweisungen.md'), 'utf8');
  const blocks = [...md.matchAll(/```json\n([\s\S]*?)```/g)].map((m) => m[1]);
  const bad = [];
  blocks.forEach((b, i) => { try { JSON.parse(b); } catch (e) { if (!/…|\.\.\./.test(b)) bad.push('Block ' + (i + 1) + ': ' + e.message); } });
  ok(!bad.length, bad.join('\n'));
});

test('gem-anweisungen.md: beschreibt PromptScope, CUSTOM_-Namen und die Leitfaden-Referenz zur Prüfzeit', () => {
  const md = fs.readFileSync(path.join(GEM, 'gem-anweisungen.md'), 'utf8');
  ['PromptScope', '"DOCUMENT"', 'CUSTOM_', 'CustomPrompt'].forEach((w) => ok(md.indexOf(w) !== -1, 'fehlt: ' + w));
  ok(/eigenen Regeln.*als Referenz/i.test(md), 'Hinweis fehlt, dass importierte Leitfaden-Regeln dem Prompt als Referenz mitgegeben werden');
});

test('Wissensdateien standardregeln_de.md / _en.md passen zu Rules.gs', () => {
  const gen = require('../gemini-gem/generate-standardregeln.js');
  const stale = ['de', 'en'].filter((lang) => fs.readFileSync(gen.file(lang), 'utf8') !== gen.render(lang).text);
  ok(!stale.length, 'veraltet: ' + stale.map((l) => 'standardregeln_' + l + '.md').join(', ') +
    ' - "node gemini-gem/generate-standardregeln.js" ausführen und die Dateien im Gem ersetzen');
});

const failed = results.filter((x) => !x).length;
console.log(failed ? '\n' + failed + ' Test(s) fehlgeschlagen.' : '\nAlle ' + results.length + ' Gem-Tests bestanden.');
process.exit(failed ? 1 : 0);
