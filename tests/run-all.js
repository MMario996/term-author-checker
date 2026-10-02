// Alle CI-Pruefungen lokal nacheinander (wie in .github/workflows/ci.yml).
// Aufruf: node tests/run-all.js   - Browser-Tests nur, wenn "playwright" installiert ist;
// Live-Check nur mit GEMINI_API_KEY.
const { spawnSync } = require('child_process');
const path = require('path');

let hasPlaywright = true;
try { require.resolve('playwright'); } catch (e) { hasPlaywright = false; }
const steps = [
  ['Statische Prüfung', 'check.js'],
  ['Standard: Syntax, Manifest, Namensraum', 'gas.syntax.test.js'],
  ['Gem-Dateien', 'gem.test.js'],
  ['Gesamtdokument-Prompts (End-to-End)', 'doc-prompt.test.js'],
  ['UI Terminologiesuche', 'ui-smoke.js', hasPlaywright],
  ['UI PDF-Fenster', 'ui-pdfcheck.js', hasPlaywright],
  ['Live-Check mit Gemini', 'live-check.js', !!process.env.GEMINI_API_KEY]
];
let failed = 0;
for (const [name, file, enabled] of steps) {
  if (enabled === false) { console.log('\n=== ' + name + ': übersprungen'); continue; }
  console.log('\n=== ' + name);
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}
console.log(failed ? '\n' + failed + ' Prüfschritt(e) fehlgeschlagen.' : '\nAlle Prüfschritte bestanden.');
process.exit(failed ? 1 : 0);
