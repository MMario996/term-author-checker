// ============================================================================
// ORDNERSTRUKTUR IM EIGENEN DRIVE
// ----------------------------------------------------------------------------
// Alles, was das Add-on anlegt, liegt in EINEM Ordner mit Unterordnern:
//
//   Kärcher TermCheck/
//     Rules/          aktive Regeldatei(en) (frueher Ordner "TermCheck Rules")
//     JSON Export/    "JSON Export" der Regeln (rules_export_….json)
//     Checked PDFs/   Ergebnisse der PDF-Pruefung: kommentierte PDF, Sheet, Bericht
//     Reports/        Audit-Sheets aus Docs/Sheets/Slides, Regeluebersicht,
//                     Exporte der Terminologiesuche
//     _Temp/          Zwischenstaende und .bin-Dateien laufender Pruefungen -
//                     werden danach endgueltig geloescht (nicht Papierkorb)
//
// Frueher lagen Exporte und Temp-Dateien im Ordner "Terminology" bzw. im
// Hauptverzeichnis, die Regeln in "TermCheck Rules". Der Regelordner wird beim
// ersten Zugriff hierher verschoben (siehe _tcRulesFolder_).
// Die Ordner-IDs werden pro Nutzer gemerkt, damit nicht bei jeder Temp-Datei
// eine Drive-Suche noetig ist.
// ============================================================================

var TC_ROOT_FOLDER_NAME = 'Kärcher TermCheck';
var TC_SUBFOLDERS = {
  rules:   'Rules',
  json:    'JSON Export',
  pdfs:    'Checked PDFs',
  reports: 'Reports',
  temp:    '_Temp'
};
var TC_LEGACY_RULES_FOLDER = 'TermCheck Rules';
var TC_LEGACY_EXPORT_FOLDER = 'Terminology';
var TC_TEMP_PREFIX = '.authorcheck-';          // .authorcheck-state-….json / .authorcheck-temp-….bin
var TC_TEMP_MAX_AGE_MS = 6 * 3600 * 1000;      // aeltere Temp-Dateien gehoeren zu abgebrochenen Pruefungen

function _tcFolderPropKey_(key) { return 'TC_FOLDER_ID_' + key; }

// Gemerkter Ordner, sofern er noch existiert und nicht im Papierkorb liegt.
function _tcCachedFolder_(key) {
  var id = PropertiesService.getUserProperties().getProperty(_tcFolderPropKey_(key));
  if (!id) return null;
  try {
    var f = DriveApp.getFolderById(id);
    return f.isTrashed() ? null : f;
  } catch (e) {
    return null;
  }
}

function _tcRememberFolder_(key, folder) {
  try { PropertiesService.getUserProperties().setProperty(_tcFolderPropKey_(key), folder.getId()); } catch (e) {}
  return folder;
}

// Nur eigene Ordner: ein geteilter Ordner gleichen Namens darf nie verwendet werden.
function _tcFindOwnFolder_(name, parent) {
  var q = 'title = "' + name.replace(/"/g, '\\"') + '" and "me" in owners and trashed = false';
  var it = parent ? parent.searchFolders(q) : DriveApp.searchFolders(q);
  return it.hasNext() ? it.next() : null;
}

function _tcRootFolder_() {
  var cached = _tcCachedFolder_('root');
  if (cached) return cached;
  var folder = _tcFindOwnFolder_(TC_ROOT_FOLDER_NAME, null) || DriveApp.createFolder(TC_ROOT_FOLDER_NAME);
  return _tcRememberFolder_('root', folder);
}

/** Unterordner (key aus TC_SUBFOLDERS), wird bei Bedarf angelegt. */
function _tcFolder_(key) {
  if (key === 'rules') return _tcRulesFolder_();
  var cached = _tcCachedFolder_(key);
  if (cached) return cached;
  var root = _tcRootFolder_();
  var name = TC_SUBFOLDERS[key];
  if (!name) throw new Error('Unknown folder: ' + key);
  var folder = _tcFindOwnFolder_(name, root) || root.createFolder(name);
  return _tcRememberFolder_(key, folder);
}

// Regelordner: bestehenden Ordner "TermCheck Rules" (mit active_rules_….json)
// verschieben und umbenennen, damit niemand seine Regeln verliert. Alte
// JSON-Exporte daraus kommen nach "JSON Export".
function _tcRulesFolder_() {
  var cached = _tcCachedFolder_('rules');
  if (cached) return cached;
  var root = _tcRootFolder_();
  var folder = _tcFindOwnFolder_(TC_SUBFOLDERS.rules, root);
  if (!folder) {
    var legacy = _tcFindOwnFolder_(TC_LEGACY_RULES_FOLDER, null);
    if (legacy) {
      try {
        legacy.moveTo(root);
        legacy.setName(TC_SUBFOLDERS.rules);
        folder = legacy;
        var json = _tcFolder_('json');
        var files = legacy.getFiles();
        while (files.hasNext()) {
          var f = files.next();
          if (/^rules_export_/.test(f.getName())) f.moveTo(json);
        }
        logAuditEvent_(getUserEmail_(), 'TERMCHECK_FOLDERS_MIGRATED', TC_LEGACY_RULES_FOLDER + ' -> ' + TC_ROOT_FOLDER_NAME + '/' + TC_SUBFOLDERS.rules);
      } catch (e) {
        // Verschieben nicht moeglich (z. B. geteiltes Laufwerk): alten Ordner weiter nutzen.
        Logger.log('_tcRulesFolder_: Migration fehlgeschlagen: ' + (e.message || e));
        return _tcRememberFolder_('rules', legacy);
      }
    }
  }
  if (!folder) folder = root.createFolder(TC_SUBFOLDERS.rules);
  return _tcRememberFolder_('rules', folder);
}

/** Datei (z. B. frisch angelegtes Sheet aus SpreadsheetApp.create) in einen Unterordner verschieben. */
function _tcMoveToFolder_(fileId, key) {
  try { DriveApp.getFileById(fileId).moveTo(_tcFolder_(key)); }
  catch (e) { Logger.log('_tcMoveToFolder_(' + key + '): ' + (e.message || e)); }
}

// ─── TEMP-DATEIEN ───────────────────────────────────────────────────────────
/** Temp-Datei endgueltig loeschen (nicht Papierkorb). Fallback: Papierkorb. */
function _tcDeleteFile_(id) {
  if (!id) return;
  try {
    var res = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(id) + '?supportsAllDrives=true', {
      method: 'delete', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true
    });
    var code = res.getResponseCode();
    if (code === 204 || code === 200 || code === 404) return;
    DriveApp.getFileById(id).setTrashed(true);
  } catch (e) {
    try { DriveApp.getFileById(id).setTrashed(true); } catch (e2) {}
  }
}

/**
 * Raeumt Temp-Dateien abgebrochener Pruefungen auf (Fenster geschlossen, Abbruch):
 * alles mit Praefix ".authorcheck-" aelter als TC_TEMP_MAX_AGE_MS im Temp-Ordner
 * und im alten Ordner "Terminology". Laeuft beim Start einer neuen PDF-Pruefung.
 */
function _tcSweepTempFiles_() {
  var cutoff = Date.now() - TC_TEMP_MAX_AGE_MS, removed = 0;
  var folders = [];
  try { folders.push(_tcFolder_('temp')); } catch (e) {}
  try { var legacy = _tcFindOwnFolder_(TC_LEGACY_EXPORT_FOLDER, null); if (legacy) folders.push(legacy); } catch (e) {}
  folders.forEach(function(folder) {
    var files = folder.getFiles();
    var n = 0;
    while (files.hasNext() && n < 200) {
      var f = files.next();
      n++;
      if (f.getName().indexOf(TC_TEMP_PREFIX) !== 0) continue;
      if (f.getLastUpdated().getTime() > cutoff) continue;
      _tcDeleteFile_(f.getId());
      removed++;
    }
  });
  if (removed) Logger.log('_tcSweepTempFiles_: ' + removed + ' alte Temp-Datei(en) geloescht');
  return removed;
}
