// Statische Prüfung des Apps-Script-Projekts (läuft in GitHub Actions, ohne Abhängigkeiten).
// - jede .gs-Datei muss sich als JavaScript (V8) übersetzen lassen
// - appsscript.json muss gültiges JSON sein
// - keine Funktion darf in zwei .gs-Dateien definiert sein (Apps Script legt alle
//   Dateien in einen gemeinsamen Scope, die spätere überschreibt still die frühere)
// - jede Server-Funktion, die aus einer HTML-Seite (google.script.run), einer Card
//   (setFunctionName) oder dem Manifest (runFunction) aufgerufen wird, muss
//   existieren und darf nicht privat sein (Name endet auf "_")
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

let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(root, 'appsscript.json'), 'utf8'));
} catch (err) {
  errors.push(`appsscript.json: ${err.message}`);
}

// Aufgerufene Server-Funktionen einsammeln: { name: [Fundstellen] }
const called = {};
const addCall = (name, where) => { (called[name] = called[name] || []).push(where); };
const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html')).sort();
for (const file of htmlFiles) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  // Direkt: google.script.run.name(  |  in Ketten: .withSuccessHandler(...).apiName(
  for (const m of src.matchAll(/google\.script\.run\s*\.\s*([A-Za-z0-9_$]+)\s*\(/g)) {
    if (!/^with(SuccessHandler|FailureHandler|UserObject)$/.test(m[1])) addCall(m[1], file);
  }
  for (const m of src.matchAll(/\.\s*(api[A-Za-z0-9_$]*)\s*\(/g)) addCall(m[1], file);
}
for (const file of gsFiles) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  for (const m of src.matchAll(/setFunctionName\(\s*['"]([A-Za-z0-9_$]+)['"]/g)) addCall(m[1], file);
}
(function walk(obj, where) {
  if (!obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'runFunction' && typeof v === 'string') addCall(v, where);
    else walk(v, where);
  }
})(manifest, 'appsscript.json');
for (const [name, where] of Object.entries(called)) {
  const uniq = [...new Set(where)].join(', ');
  if (!defined[name]) errors.push(`Server-Funktion ${name} wird aufgerufen (${uniq}), ist aber nirgends definiert`);
  else if (name.endsWith('_')) errors.push(`Server-Funktion ${name} ist privat (endet auf "_") und kann nicht aufgerufen werden (${uniq})`);
}

if (errors.length) {
  console.error(errors.join('\n\n'));
  process.exit(1);
}
console.log(`OK: ${gsFiles.length} .gs-Dateien, ${Object.keys(defined).length} Funktionen, ${Object.keys(called).length} aufgerufene Server-Funktionen gefunden, appsscript.json gültig.`);
