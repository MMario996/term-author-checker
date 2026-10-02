// Erzeugt die Wissensdateien des Gemini-Gems (standardregeln_de.md / _en.md) aus
// Rules.gs, damit der Gem weiß, welche Regeln der Author Check schon kennt.
// Aufruf: node gemini-gem/generate-standardregeln.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const ctx = { console, PropertiesService: {}, CacheService: {}, DriveApp: {}, Utilities: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'src', 'Rules.gs'), 'utf8'), ctx, { filename: 'Rules.gs' });

const variants = [
  ['de', 'Standardregeln (Regelsprache Deutsch)',
    'Diese Regeln sind im Author Check bereits eingebaut. Keine eigenen Regeln erzeugen, die dasselbe prüfen – stattdessen im Bericht auf die Standardregel (Name) verweisen, damit sie im Popup eingeschaltet werden kann.'],
  ['en', 'Standard rules (rule language English)',
    'These rules are already built into Author Check. Do not create custom rules that check the same thing – instead mention the standard rule (Name) in the report so it can be enabled in the popup.']
];

// Inhalt der Wissensdatei fuer eine Regelsprache (auch fuer die CI, die prueft,
// ob die eingecheckten Dateien zu Rules.gs passen).
function render(lang) {
  const [, title, intro] = variants.find((v) => v[0] === lang);
  const rules = ctx._getDefaultRulesForLanguage_(lang);
  const bySection = {};
  for (const r of rules) {
    const m = ctx._ruleForMapping_(r);
    const section = ctx._getSectionForRule_(m);
    (bySection[section] = bySection[section] || []).push({ r, sub: ctx._getSubsectionForRule_(m) });
  }
  let out = '# ' + title + '\n\n' + intro + '\n\nFormat: `Name` | Typ | Unterabschnitt | Beschreibung' +
    (lang === 'en' ? ' (Name | Type | Subsection | Description)' : '') + '\n';
  for (const section of Object.keys(bySection).sort()) {
    out += '\n## ' + section + '\n\n';
    for (const { r, sub } of bySection[section]) {
      out += '- `' + r.Name + '` | ' + r.Type + ' | ' + sub + ' | ' + String(r.Description).replace(/\s+/g, ' ').trim() + '\n';
    }
  }
  return { text: out, count: rules.length };
}

module.exports = { render, file: (lang) => path.join(__dirname, 'standardregeln_' + lang + '.md') };

if (require.main === module) {
  for (const [lang] of variants) {
    const r = render(lang);
    fs.writeFileSync(module.exports.file(lang), r.text);
    console.log('standardregeln_' + lang + '.md: ' + r.count + ' Regeln');
  }
}
