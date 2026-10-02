// Fuehrt den ECHTEN JSON-Import aus AuthorCheck.html (importOneRule) in Node aus,
// damit die CI dieselben Regeln anwendet wie das Regel-Popup.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = fs.readFileSync(path.resolve(__dirname, '..', '..', 'src', 'AuthorCheck.html'), 'utf8');

// Top-Level-Funktion aus dem Skript der Seite: endet beim ersten "}" am Zeilenanfang.
function extractFunction(name) {
  const start = HTML.indexOf('\nfunction ' + name + '(');
  if (start === -1) throw new Error('AuthorCheck.html: function ' + name + ' not found');
  const end = HTML.indexOf('\n}\n', start);
  return HTML.slice(start + 1, end + 2);
}

function loadImporter() {
  const safe = /var SAFE_RULE_NAME = (\/.+\/);/.exec(HTML);
  if (!safe) throw new Error('AuthorCheck.html: SAFE_RULE_NAME not found');
  const types = /var RULE_TYPES = (\[[^\]]*\]);/.exec(HTML);
  const src = ['isCustomRule', 'safeHref', 'importOneRule'].map(extractFunction).join('\n') +
    '\nvar RULE_TYPES = ' + types[1] + ';\nvar SAFE_RULE_NAME = ' + safe[1] + ';';
  const ctx = { _currentRulesData: [], _importedRules: [], _pendingNewCustomRules: [] };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'AuthorCheck.html (import)' });

  // Wie importRulesFile: Liste importieren, Ergebnis wie im Popup zaehlen.
  return function importJson(currentRules, imported) {
    ctx._currentRulesData = currentRules.map((r) => Object.assign({}, r));
    ctx._importedRules = [];
    ctx._pendingNewCustomRules = [];
    const res = { std: 0, added: 0, updated: 0, skipped: 0 };
    (Array.isArray(imported) ? imported : [imported]).forEach((imp) => ctx.importOneRule(imp, ctx.SAFE_RULE_NAME, res));
    return { rules: JSON.parse(JSON.stringify(ctx._currentRulesData)), res, imported: JSON.parse(JSON.stringify(ctx._importedRules)) };
  };
}

module.exports = { loadImporter };
