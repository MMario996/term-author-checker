// Statische Prüfung des Apps-Script-Projekts (läuft in GitHub Actions, ohne Abhängigkeiten).
// - jede .gs-Datei muss sich als JavaScript (V8) übersetzen lassen
// - appsscript.json muss gültiges JSON sein
// - keine Funktion darf in zwei .gs-Dateien definiert sein (Apps Script legt alle
//   Dateien in einen gemeinsamen Scope, die spätere überschreibt still die frühere)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const errors = [];

const gsFiles = fs.readdirSync(root).filter((f) => f.endsWith('.gs')).sort();
const defined = {};
for (const file of gsFiles) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  try {
    new vm.Script(src, { filename: file });
  } catch (err) {
    errors.push(`${file}: ${err.message}\n${(err.stack || '').split('\n').slice(0, 3).join('\n')}`);
  }
  for (const m of src.matchAll(/^function\s+([A-Za-z0-9_$]+)\s*\(/gm)) {
    (defined[m[1]] = defined[m[1]] || []).push(file);
  }
}
for (const [name, files] of Object.entries(defined)) {
  if (files.length > 1) errors.push(`Funktion ${name} ist mehrfach definiert: ${files.join(', ')}`);
}

try {
  JSON.parse(fs.readFileSync(path.join(root, 'appsscript.json'), 'utf8'));
} catch (err) {
  errors.push(`appsscript.json: ${err.message}`);
}

if (errors.length) {
  console.error(errors.join('\n\n'));
  process.exit(1);
}
console.log(`OK: ${gsFiles.length} .gs-Dateien, ${Object.keys(defined).length} Funktionen, appsscript.json gültig.`);
