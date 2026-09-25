// ============================================================================
// AUTHOR CHECK — Grammatik- & Terminologieprüfung (Docs / Sheets / Slides)
// ============================================================================

const AUTHORCHECK_DEFAULT_PROMPT =
'Du bist ein Lektorats-Assistent für Kärcher-Texte (Hersteller von Reinigungsgeräten: ' +
'Hochdruckreiniger, Kehrmaschinen, Sauger, Zubehör).\n\n' +
'Prüfe den folgenden Text (Sprache: {sourceLang}) auf diese Fehlerarten:\n' +
'1. GRAMMATIK- UND RECHTSCHREIBFEHLER\n' +
'2. FALSCHE ODER UNEINHEITLICHE KÄRCHER-FACHBEGRIFFE – vergleiche mit dieser Liste ' +
'"falscher Begriff → korrekter Begriff":\n{termList}\n' +
'3. SPEZIFISCHE SCHREIB- UND STILREGELN:\n{styleRules}\n\n' +
'Text:\n"""\n{text}\n"""\n\n' +
'Antworte AUSSCHLIESSLICH mit validem JSON in exakt dieser Struktur, ohne Markdown-Formatierung, ' +
'ohne Codeblock:\n' +
'{"issues":[{"type":"grammar|terminology|style","original":"...","suggestion":"...","explanation":"..."}]}\n\n' +
'Regeln:\n' +
'- "type" ist entweder "grammar", "terminology" oder "style".\n' +
'- "original" muss ein EXAKTES, zusammenhängendes Zitat aus dem Originaltext sein.\n' +
'- Ignoriere Passagen, die nicht in der Sprache {sourceLang} verfasst sind (z. B. fremdsprachige Abschnitte in einem mehrsprachigen Dokument); melde dort keine Fehler.\n' +
'- Gib nur echte Fehler zurück, basierend auf den Vorgaben. Wenn keine Fehler gefunden werden, gib {"issues":[]} zurück.';

// ─── ANSICHTEN: CHECKS IN DER SEITENLEISTE / RULES IM POPUP ───────────────
function showAuthorCheckSidebar(e) {
  PropertiesService.getUserProperties().deleteProperty('AUTHORCHECK_IS_RULES_ONLY');
  var host = _resolveHost_(e);
  var ui = renderWithI18n_('AuthorCheck', host.app)
    .setTitle('Kärcher Author Check')
    .setWidth(350);

  host.ui.showSidebar(ui);
}

// hostApp: 'docs' | 'sheets' | 'slides' - wird von der Seitenleiste mitgeschickt
// (HOST_APP), weil google.script.run kein Event-Objekt liefert.
function apiOpenRulesModal(hostApp) {
  PropertiesService.getUserProperties().setProperty('AUTHORCHECK_IS_RULES_ONLY', 'true');
  var host = _resolveHost_(hostApp);
  var ui = renderWithI18n_('AuthorCheck', host.app)
    .setTitle('Rules & Custom Prompts')
    .setWidth(1350)
    .setHeight(900);

  host.ui.showModalDialog(ui, 'Rules & Custom Prompts');
}

function apiMarkRulesHelpSeen() {
  PropertiesService.getUserProperties().setProperty('AUTHORCHECK_RULES_HELP_SEEN', 'true');
  return true;
}

/**
 * Liest aus dem, was der Aufrufer mitgibt, in welcher Editor-App das Add-on
 * läuft. Mögliche Quellen:
 *  - ein String ('docs' / 'sheets' / 'slides'), den die HTML-Seitenleiste per
 *    google.script.run mitschickt (dort gibt es kein Event-Objekt),
 *  - das Event-Objekt einer Card-Action: e.commonEventObject.hostApp ("DOCS", ...)
 *    bzw. die ältere Form e.hostApp oder e.docs / e.sheets / e.slides.
 */
function _detectHostApp_(e) {
  var h = null;
  if (typeof e === 'string') h = e;
  else if (e) h = (e.commonEventObject && e.commonEventObject.hostApp) || e.hostApp ||
                  (e.docs && 'docs') || (e.sheets && 'sheets') || (e.slides && 'slides');
  h = h ? String(h).toLowerCase() : null;
  return (h === 'docs' || h === 'sheets' || h === 'slides') ? h : null;
}

/**
 * Ermittelt, in welcher Editor-App (Docs/Sheets/Slides) das Add-on läuft, und
 * liefert { app, ui }. Reihenfolge: ausdrückliche Angabe des Aufrufers, dann das
 * aktive Dokument, zuletzt ein direkter getUi()-Versuch pro App - getUi() wirft
 * nur, wenn man sich NICHT in dieser App befindet, und funktioniert auch dann,
 * wenn (noch) kein Zugriff auf das aktive Dokument erteilt wurde.
 * @param {Object|string} e Event-Objekt einer Card-Action oder hostApp-String
 */
function _resolveHost_(e) {
  var hostApp = _detectHostApp_(e);
  var apps = {
    docs:   function() { return DocumentApp; },
    sheets: function() { return SpreadsheetApp; },
    slides: function() { return SlidesApp; }
  };

  if (hostApp) {
    try { return { app: hostApp, ui: apps[hostApp]().getUi() }; }
    catch (err) { Logger.log('_resolveHost_: getUi() ueber hostApp "' + hostApp + '" fehlgeschlagen: ' + err); }
  }

  try { if (DocumentApp.getActiveDocument()) return { app: 'docs', ui: DocumentApp.getUi() }; }
  catch (err) { Logger.log('_resolveHost_: Docs-Fallback fehlgeschlagen: ' + err); }
  try { if (SpreadsheetApp.getActiveSpreadsheet()) return { app: 'sheets', ui: SpreadsheetApp.getUi() }; }
  catch (err) { Logger.log('_resolveHost_: Sheets-Fallback fehlgeschlagen: ' + err); }
  try { if (SlidesApp.getActivePresentation()) return { app: 'slides', ui: SlidesApp.getUi() }; }
  catch (err) { Logger.log('_resolveHost_: Slides-Fallback fehlgeschlagen: ' + err); }

  var names = ['docs', 'sheets', 'slides'];
  for (var i = 0; i < names.length; i++) {
    try { return { app: names[i], ui: apps[names[i]]().getUi() }; }
    catch (err) { /* nicht diese App */ }
  }

  throw new Error('Could not detect whether this is Google Docs, Sheets or Slides (hostApp=' + hostApp + '). ' +
    'Please close the side panel, reload the file and open Kärcher TermCheck again.');
}

// ─── GLOSSAR AUS DEN TERMBASES BAUEN ───────────────────────────────────────
var AUTHORCHECK_GLOSSARY_TTL = 21600;
var AUTHORCHECK_GLOSSARY_MAX_PAIRS = 400;  
var AUTHORCHECK_GLOSSARY_MAX_PAGES = 20;   

function _buildTerminologyGlossary_(sourceLang) {
  var lang = String(sourceLang || 'de').trim();
  var cacheKey = 'AUTHORCHECK_GLOSSARY_' + lang;
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch (e) {} }

  var termbases = _getTargetTermbases_();
  var auth = _phraseAuth_();
  var pairs = [];

  termbases.forEach(function (tb) {
    var pageNumber = 0;
    while (pageNumber < AUTHORCHECK_GLOSSARY_MAX_PAGES) {
      var body = { pageNumber: pageNumber, pageSize: 50, queryLang: lang };
      var res;
      try {
        res = UrlFetchApp.fetch(PHRASE_V1 + '/termBases/' + encodeURIComponent(tb.uid) + '/browse', {
          method: 'post', contentType: 'application/json',
          headers: { Authorization: auth }, payload: JSON.stringify(body), muteHttpExceptions: true
        });
      } catch (e) { break; }
      if (res.getResponseCode() !== 200) break;

      var data;
      try { data = JSON.parse(res.getContentText()); } catch (e) { break; }
      var concepts = data.searchResults || data.concepts || [];
      if (!concepts.length) break;

      concepts.forEach(function (concept) {
        var allTerms = [];
        (concept.terms || []).forEach(function (ti) {
          (Array.isArray(ti) ? ti : [ti]).forEach(function (t) { allTerms.push(t); });
        });
        var sameLang = allTerms.filter(function (t) { return (t.lang || t.language || '') === lang; });
        var forbidden = sameLang.filter(function (t) { return t.forbidden === true; });
        var approved = sameLang.filter(function (t) { return t.forbidden !== true; });
        if (forbidden.length && approved.length) {
          forbidden.forEach(function (f) {
            var wrong = String(f.text || f.term || '').trim();
            var correct = String(approved[0].text || approved[0].term || '').trim();
            if (wrong && correct) pairs.push({ wrong: wrong, correct: correct });
          });
        }
      });

      if (concepts.length < 50) break;
      pageNumber++;
    }
  });

  var seen = {};
  var unique = pairs.filter(function (p) {
    var k = p.wrong.toLowerCase();
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  }).slice(0, AUTHORCHECK_GLOSSARY_MAX_PAIRS);

  try { cache.put(cacheKey, JSON.stringify(unique), AUTHORCHECK_GLOSSARY_TTL); } catch (e) {}
  return unique;
}

// ─── GLOSSAR + REGELTEXT FÜR DEN PROMPT (geteilt zwischen Docs/Sheets/Slides
// und dem Drive-PDF-Check, damit eine Anpassung nicht an zwei Stellen gepflegt
// werden muss) ─────────────────────────────────────────────────────────────
// "labels" laesst jeden Aufrufer seine bisherige Formulierung (EN/DE) behalten,
// damit dieses Refactoring den tatsaechlich an die KI gesendeten Text nicht
// veraendert.
function _buildAuthorCheckPromptParts_(lang, labels) {
  var glossary = _buildTerminologyGlossary_(lang);
  var termListStr = glossary.length
    ? glossary.map(function (p) { return '- ' + p.wrong + ' → ' + p.correct; }).join('\n')
    : labels.noGlossary;

  // Regelwerke gibt es nur fuer DE und EN. Frueher bekamen alle anderen Sprachen
  // (FR, ES, SV ...) die deutschen Stilregeln - dann lieber gar keine
  // sprachspezifischen Stilregeln und nur Grammatik/Terminologie pruefen.
  var allRules = _rulesLanguageSupported_(lang) ? apiGetRulesConfig(lang) : [];
  var activeRules = allRules.filter(function(r) { return r.IsEnabled; });

  var standardRulesStr = activeRules
    .filter(function(r) { return r.RuleKind !== 'PROMPT' && !r.CustomPrompt; })
    .map(function(r) {
      var param = (r.IsConfigurable && r.Parameter !== "-1" && r.Parameter !== null) ? " (" + labels.valueLabel + ": " + r.Parameter + ")" : "";
      return "- [" + r.Type + "] " + r.Description + param;
    }).join('\n');

  var customPromptsStr = activeRules
    .filter(function(r) { return r.RuleKind === 'PROMPT' || (r.CustomPrompt && r.CustomPrompt.trim().length > 0); })
    .map(function(r) {
      return "- " + labels.specificCheckPrefix + " [" + (r.Type || "Custom") + " -> " + r.Description + "]: " + r.CustomPrompt;
    }).join('\n');

  var rulesStr = (standardRulesStr || labels.noStandardRules) +
    (customPromptsStr ? '\n\n' + labels.additionalChecksHeader + ':\n' + customPromptsStr : '');

  return { glossary: glossary, termListStr: termListStr, rulesStr: rulesStr };
}

// Parst die Gemini-Antwort im {"issues":[...]} Format, gemeinsam genutzt von
// apiRunAuthorCheck (Docs/Sheets/Slides) und apiCheckDrivePdf (Drive-Add-on).
function _parseGeminiIssuesResponse_(res, requestFailedMessage) {
  var code = res.getResponseCode();
  if (code !== 200) throw new Error(requestFailedMessage + ' (' + code + ').');

  var data = JSON.parse(res.getContentText());
  var respText;
  try { respText = data.candidates[0].content.parts[0].text; }
  catch (e) { throw new Error('Unexpected AI response structure.'); }

  var clean = String(respText).replace(/```json/gi, '').replace(/```/g, '').trim();
  var parsed;
  try { parsed = JSON.parse(clean); }
  catch (e) { throw new Error('AI response was not valid JSON.'); }

  var issues = Array.isArray(parsed.issues) ? parsed.issues : [];
  return issues.filter(function (i) { return i && i.original && i.suggestion; });
}

// ─── HAUPTPRÜFUNG ────────────────────────────────────────────────────────────
// Lange Dokumente werden nicht mehr stillschweigend nach 15.000 Zeichen
// abgeschnitten, sondern in Abschnitte zerlegt, die parallel geprüft werden.
var AUTHORCHECK_CHUNK_CHARS = 12000;
var AUTHORCHECK_MAX_CHARS = 60000; // max. 5 parallele KI-Anfragen, bleibt deutlich unter dem Apps-Script-Zeitlimit

// Teilt Text an Absatz-, sonst Satz-, sonst Wortgrenzen in Stücke <= maxLen.
function _splitTextIntoChunks_(text, maxLen) {
  var chunks = [];
  var rest = String(text || '');
  while (rest.length > maxLen) {
    var cut = rest.lastIndexOf('\n', maxLen);
    if (cut < maxLen * 0.5) cut = rest.lastIndexOf('. ', maxLen) + 1;
    if (cut < maxLen * 0.5) cut = rest.lastIndexOf(' ', maxLen);
    if (cut <= 0) cut = maxLen;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.trim()) chunks.push(rest);
  return chunks;
}

function apiRunAuthorCheck(sourceLang, checkScope) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
  if (!apiKey) throw new Error('AI inspection is not configured (Gemini API Key missing).');

  var fullText = apiExtractTextFromCurrentApp(checkScope, AUTHORCHECK_MAX_CHARS + 1);
  if (!fullText || !fullText.trim()) {
    var errMsg = (checkScope === 'selection') ? 'No text selected. Please highlight text first.' : 'No text found in active document.';
    throw new Error(errMsg);
  }
  var truncated = fullText.length > AUTHORCHECK_MAX_CHARS;
  var text = truncated ? fullText.slice(0, AUTHORCHECK_MAX_CHARS) : fullText;

  var lang = sourceLang || 'de';
  var promptParts = _buildAuthorCheckPromptParts_(lang, {
    noGlossary: '(no specific entries found for this language)',
    valueLabel: 'Value',
    specificCheckPrefix: 'SPECIFIC CHECK',
    noStandardRules: '(No standard rules)',
    additionalChecksHeader: 'ADDITIONAL SPECIFIC PROMPTS/CHECKS'
  });
  var glossary = promptParts.glossary;
  var termListStr = promptParts.termListStr;
  var rulesStr = promptParts.rulesStr;

  var rawUrl = props.getProperty('GEMINI_API_URL') || 'https://34-111-99-134.nip.io/gemini/v1beta/models/';
  var apiUrl = rawUrl.split(']')[0].replace('[', '').trim();
  var model = (props.getProperty('AI_MODEL') || 'gemini-3.6-flash').trim();
  var temperature = parseFloat(props.getProperty('AI_TEMPERATURE')) || 0.2;
  var promptTemplate = props.getProperty('AUTHORCHECK_PROMPT') || AUTHORCHECK_DEFAULT_PROMPT;

  // Funktions-Ersetzungen statt Strings, damit "$&", "$1" usw. in Dokumenttext
  // oder Glossar nicht als Ersetzungsmuster interpretiert werden.
  function buildPrompt(chunkText) {
    return promptTemplate
      .replace(/\{sourceLang\}/g, function () { return lang; })
      .replace(/\{termList\}/g, function () { return termListStr; })
      .replace(/\{styleRules\}/g, function () { return rulesStr; })
      .replace(/\{text\}/g, function () { return chunkText.replace(/"""/g, "'''"); });
  }

  var chunks = _splitTextIntoChunks_(text, AUTHORCHECK_CHUNK_CHARS);
  var requests = chunks.map(function (chunk) {
    var call = _buildGeminiRequest_(apiUrl, model, apiKey, {
      contents: [{ role: 'user', parts: [{ text: buildPrompt(chunk) }] }],
      generationConfig: { temperature: temperature }
    });
    return {
      url: call.url, method: 'post', contentType: 'application/json',
      headers: call.headers, payload: JSON.stringify(call.body), muteHttpExceptions: true
    };
  });

  var responses = requests.length === 1
    ? [_fetchGeminiWithRetry_(requests[0].url, requests[0])]
    : UrlFetchApp.fetchAll(requests);

  var issues = [];
  var seen = {};
  var failedParts = 0;
  var firstError = null;
  responses.forEach(function (res, idx) {
    // Transiente Fehler (429/5xx) eines einzelnen Abschnitts gezielt nachholen.
    if (requests.length > 1 && GEMINI_RETRYABLE_CODES.indexOf(res.getResponseCode()) !== -1) {
      res = _fetchGeminiWithRetry_(requests[idx].url, requests[idx], 2);
    }
    try {
      _parseGeminiIssuesResponse_(res, 'AI request failed').forEach(function (issue) {
        var key = issue.original + '\u0000' + issue.suggestion;
        if (seen[key]) return;
        seen[key] = true;
        issues.push(issue);
      });
    } catch (e) {
      failedParts++;
      if (!firstError) firstError = e;
    }
  });
  if (failedParts === responses.length) throw firstError;

  issues.forEach(function (issue, i) {
    issue.id = 'ac_' + i;
    if (issue.type !== 'terminology' && issue.type !== 'style') issue.type = 'grammar';
  });

  logAuditEvent_(getUserEmail_(), 'AUTHOR_CHECK_RUN', 'Found ' + issues.length + ' issue(s), lang=' + lang + ', parts=' + chunks.length + (failedParts ? ', failed=' + failedParts : ''));
  return {
    issues: issues,
    wordCount: text.trim().split(/\s+/).length,
    glossarySize: glossary.length,
    parts: chunks.length,
    failedParts: failedParts,
    truncated: truncated,
    maxChars: AUTHORCHECK_MAX_CHARS
  };
}

// ─── KORREKTUR IM DOKUMENT ANWENDEN ─────────────────────────────────────────
// Ersetzt NUR das erste Vorkommen der gemeldeten Passage. Frueher wurden alle
// Vorkommen ersetzt, und wenn der Vorschlag das Original enthielt (z.B.
// "Sauger" -> "Nass-Trockensauger"), wurde der eingefuegte Text immer wieder
// gefunden und bis zu 200x verschachtelt ersetzt. Zurueckgegeben wird
// zusaetzlich, wie viele weitere Vorkommen noch im Dokument stehen.
function apiApplyAuthorCheckFix(original, suggestion) {
  original = String(original || '');
  suggestion = String(suggestion == null ? '' : suggestion);
  if (!original.trim()) throw new Error('Nothing to replace.');
  var pattern = _escapeRegexAC_(original);
  var count = 0, remaining = 0;

  if (DocumentApp.getActiveDocument()) {
    var body = DocumentApp.getActiveDocument().getBody();
    var found = body.findText(pattern);
    if (found) {
      var el = found.getElement().asText();
      var start = found.getStartOffset();
      var end = found.getEndOffsetInclusive();
      var attrs = el.getAttributes(start);
      el.deleteText(start, end);
      if (suggestion) {
        el.insertText(start, suggestion);
        el.setAttributes(start, start + suggestion.length - 1, attrs);
      }
      count = 1;
      remaining = _countDocMatches_(body, pattern);
    }
  } else if (SpreadsheetApp.getActiveSpreadsheet()) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var re = new RegExp(pattern);          // ohne "g": test() ist so zustandslos
    var reAll = new RegExp(pattern, 'g');  // nur fuer match()
    var active = ss.getActiveSheet();
    var sheets = [active].concat(_sheetsVisibleSheets_(ss).filter(function (sh) { return sh.getSheetId() !== active.getSheetId(); }));
    sheets.forEach(function (sheet) {
      var range = sheet.getDataRange();
      var values = range.getValues();
      // Formeln NIE anfassen: frueher schrieb setValues() den ganzen Bereich als
      // Werte zurueck und zerstoerte damit alle Formeln im Blatt.
      var formulas = range.getFormulas();
      for (var r = 0; r < values.length; r++) {
        for (var c = 0; c < values[r].length; c++) {
          var v = values[r][c];
          if (formulas[r][c] || typeof v !== 'string' || !re.test(v)) continue;
          if (count === 0) {
            var newVal = v.replace(re, function () { return suggestion; });
            range.getCell(r + 1, c + 1).setValue(_sheetSafe_(newVal));
            count = 1;
            remaining += (newVal.match(reAll) || []).length;
          } else {
            remaining += (v.match(reAll) || []).length;
          }
        }
      }
    });
  } else if (SlidesApp.getActivePresentation()) {
    // TextRange.find() arbeitet mit regulaeren Ausdruecken. replaceAllText() mit
    // dem Regex-String suchte dagegen woertlich nach "\s+" usw. und fand nichts.
    _slidesAllTextTargets_(SlidesApp.getActivePresentation()).forEach(function (t) {
      var matches = t.textRange.find(pattern);
      if (!matches.length) return;
      if (count === 0) {
        if (suggestion) matches[0].setText(suggestion); else matches[0].clear();
        count = 1;
        remaining += t.textRange.find(pattern).length;
      } else {
        remaining += matches.length;
      }
    });
  }

  if (count === 0) throw new Error('Text passage "' + original + '" was not found anymore.');
  // Vorkommen innerhalb des gerade eingefuegten Vorschlags nicht als "offen" zaehlen.
  var inSuggestion = (suggestion.match(new RegExp(pattern, 'g')) || []).length;
  remaining = Math.max(0, remaining - inSuggestion);
  logAuditEvent_(getUserEmail_(), 'AUTHOR_CHECK_FIX_APPLIED', original + ' -> ' + suggestion + ' (remaining ' + remaining + ')');
  return { success: true, count: count, remaining: remaining };
}

function _countDocMatches_(body, pattern) {
  var n = 0;
  var found = body.findText(pattern);
  while (found && n < 500) {
    n++;
    found = body.findText(pattern, found);
  }
  return n;
}

function _escapeRegexAC_(str) {
  return String(str)
    .replace(/&nbsp;/g, ' ')
    .replace(/ /g, ' ')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
}

// Slides: erste Fundstelle in allen Formen, Tabellen und Gruppen suchen.
// Liefert { target, match } oder null.
function _slidesFindFirst_(pres, text) {
  var pattern = _escapeRegexAC_(text);
  var targets = _slidesAllTextTargets_(pres);
  for (var i = 0; i < targets.length; i++) {
    var matches = targets[i].textRange.find(pattern);
    if (matches.length) return { target: targets[i], match: matches[0] };
  }
  return null;
}

function _slidesSelectHit_(pres, hit) {
  pres.getSlides()[hit.target.slideIndex].selectAsCurrentPage();
  try { hit.match.select(); } catch (e) { hit.target.element.select(); }
}

// Sheets: in allen Tabellenblaettern suchen, nicht nur im aktiven.
function _sheetsFindFirst_(text) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var clean = String(text).replace(/&nbsp;/g, ' ').replace(/ /g, ' ');
  return ss.createTextFinder(clean).findNext() || ss.createTextFinder(String(text)).findNext();
}

// ─── INTERAKTION: ZUR TEXTSTELLE SPRINGEN ───────────────────────────────────
function apiJumpToIssue(searchText) {
  if (DocumentApp.getActiveDocument()) {
    var doc = DocumentApp.getActiveDocument();
    var found = doc.getBody().findText(_escapeRegexAC_(searchText));
    if (found) {
      var rangeBuilder = doc.newRange();
      rangeBuilder.addElement(found.getElement(), found.getStartOffset(), found.getEndOffsetInclusive());
      doc.setSelection(rangeBuilder.build());
      return true;
    }
  } else if (SpreadsheetApp.getActiveSpreadsheet()) {
    var cell = _sheetsFindFirst_(searchText);
    if (cell) { cell.activate(); return true; }
  } else if (SlidesApp.getActivePresentation()) {
    var pres = SlidesApp.getActivePresentation();
    var hit = _slidesFindFirst_(pres, searchText);
    if (hit) { _slidesSelectHit_(pres, hit); return true; }
  }
  return false;
}

// ─── INTERAKTION: NOTIZ / KOMMENTAR EXAKT AN TEXTSTELLE VERKNÜPFEN ──────────
// Erzeugt einen an der Textstelle "verankerten" Drive-Kommentar (Highlight),
// so wie beim manuellen "Kommentar hinzufügen" in Docs/Slides.
// WICHTIG: Die Drive Advanced Service läuft auf v3 (siehe appsscript.json). In
// Drive API v3 heißt das Anker-Feld "quotedFileContent" (mimeType/value), NICHT
// "context" (Feldschema von Drive API v2, wird von v3 stillschweigend ignoriert).
// Für Google Docs matcht der Drive-Client den quotedFileContent-Text gegen den
// Dokumenttext und zeigt den Kommentar als Highlight an der passenden Stelle.
function _createHighlightedDriveComment_(fileId, quotedText, commentText) {
  var comment = Drive.Comments.create({
    content: commentText,
    quotedFileContent: { mimeType: 'text/plain', value: quotedText }
  }, fileId, { fields: '*' });
  comment._anchored = !!(comment.quotedFileContent && comment.quotedFileContent.value);
  if (!comment._anchored) {
    Logger.log('_createHighlightedDriveComment_: quotedFileContent wurde von Drive nicht uebernommen (fileId=' + fileId + ', id=' + comment.id + ') - Kommentar existiert, ist aber vermutlich nicht an der Textstelle markiert.');
  }
  return comment;
}

function apiCommentIssue(originalText, suggestion, explanation) {
  var commentText = "TermCheck Suggestion:\n" + suggestion + "\n\nExplanation: " + (explanation || "");
  var cleanOriginal = String(originalText).replace(/&nbsp;/g, ' ').replace(/ /g, ' ');

  if (DocumentApp.getActiveDocument()) {
    var doc = DocumentApp.getActiveDocument();
    var found = doc.getBody().findText(_escapeRegexAC_(cleanOriginal));
    if (found) {
      var rangeBuilder = doc.newRange();
      rangeBuilder.addElement(found.getElement(), found.getStartOffset(), found.getEndOffsetInclusive());
      doc.setSelection(rangeBuilder.build());
      try {
        _createHighlightedDriveComment_(doc.getId(), cleanOriginal, commentText);
      } catch(e) {
        // Frueher wurde hier trotzdem "Note Added" gemeldet, obwohl kein Kommentar
        // existierte - jetzt geht der Fehler an die Oberflaeche.
        Logger.log('apiCommentIssue: Drive.Comments.create fehlgeschlagen: ' + e);
        throw new Error('Could not create the comment: ' + (e.message || e));
      }
      return true;
    }
  } else if (SpreadsheetApp.getActiveSpreadsheet()) {
    var cell = _sheetsFindFirst_(originalText);
    if (cell) {
      cell.activate();
      // Vorhandene Notiz nicht ueberschreiben, sondern ergaenzen.
      var existing = cell.getNote();
      cell.setNote(existing ? existing + '\n\n---\n' + commentText : commentText);
      return true;
    }
  } else if (SlidesApp.getActivePresentation()) {
    var pres = SlidesApp.getActivePresentation();
    var hit = _slidesFindFirst_(pres, cleanOriginal);
    if (hit) {
      _slidesSelectHit_(pres, hit);
      // Slides unterstuetzt keinen Anker auf eine Textstelle innerhalb einer
      // Form, daher zusaetzlich die Foliennummer im Kommentartext nennen.
      var slideCommentText = commentText + '\n\n(Slide ' + (hit.target.slideIndex + 1) + ')';
      try {
        _createHighlightedDriveComment_(pres.getId(), cleanOriginal, slideCommentText);
      } catch(e) {
        Logger.log('apiCommentIssue: Drive.Comments.create (Slides) fehlgeschlagen: ' + e);
        throw new Error('Could not create the comment: ' + (e.message || e));
      }
      return true;
    }
  }
  return false;
}

function apiBackToHomepage() {
  return true;
}

/**
 * Exportiert die komplette Regel-Übersicht (aktuelle Sprache) als Google Sheet,
 * sortiert und filterbar nach Section/Unterthema.
 */
function apiExportRulesOverview(rules) {
  if (!rules || !rules.length) throw new Error("No rules to export.");

  var title = "AuthorCheck_Rules_Overview_" + new Date().toISOString().slice(0, 10);
  var ss = SpreadsheetApp.create(title);
  var sheet = ss.getActiveSheet();
  sheet.setName("Rules Overview");

  var headers = ["Section", "Subsection", "Type", "Name", "Enabled", "Configurable", "Parameter", "Rule Kind", "Description", "Reference URL"];
  var rows = [headers];

  rules
    .slice()
    .sort(function(a, b) {
      var sa = (a.Section || "") + "|" + (a.Subsection || "");
      var sb = (b.Section || "") + "|" + (b.Subsection || "");
      return sa.localeCompare(sb);
    })
    .forEach(function(r) {
      rows.push([
        r.Section || "",
        r.Subsection || "",
        r.Type || "",
        r.Name || "",
        r.IsEnabled ? "Yes" : "No",
        r.IsConfigurable ? "Yes" : "No",
        r.Parameter != null ? String(r.Parameter) : "",
        r.RuleKind || "",
        r.Description || "",
        r.ReferenceUrl || ""
      ]);
    });

  rows = _sheetSafeRows_(rows);
  var numRows = rows.length;
  var numCols = headers.length;
  var range = sheet.getRange(1, 1, numRows, numCols);
  range.setValues(rows);

  sheet.getRange(1, 1, 1, numCols)
    .setFontWeight("bold")
    .setBackground("#FFED00")
    .setFontColor("#3A3A3A");
  sheet.setFrozenRows(1);
  range.setVerticalAlignment("top")
    .setBorder(true, true, true, true, true, true, "#DDDDDD", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(1, 1, numRows, numCols).createFilter();
  sheet.autoResizeColumns(1, numCols - 1);
  sheet.setColumnWidth(numCols - 1, 350);
  sheet.setColumnWidth(numCols, 250);

  return ss.getUrl();
}

/**
 * Erstellt ein formatierest Google Sheet mit dem Audit Report der Korrekturen.
 */
function apiExportAuditReport(issues) {
  if (!issues || !issues.length) throw new Error("No issues available to export.");

  var title = "TermCheck_Audit_Report_" + new Date().toISOString().slice(0, 10);
  var ss = SpreadsheetApp.create(title);
  var sheet = ss.getActiveSheet();
  sheet.setName("Audit Report");

  // Tabellen-Header
  var headers = ["Type", "Original Passage", "Suggestion", "Explanation"];
  var rows = [headers];

  issues.forEach(function(issue) {
    rows.push([
      (issue.type || "style").toUpperCase(),
      issue.original || "",
      issue.suggestion || "",
      issue.explanation || ""
    ]);
  });

  rows = _sheetSafeRows_(rows);
  var numRows = rows.length;
  var numCols = headers.length;
  var range = sheet.getRange(1, 1, numRows, numCols);
  range.setValues(rows);

  // Header-Styling
  sheet.getRange(1, 1, 1, numCols)
    .setFontWeight("bold")
    .setBackground("#FFED00")
    .setFontColor("#3A3A3A");
  
  sheet.setFrozenRows(1);
  range.setVerticalAlignment("top")
    .setBorder(true, true, true, true, true, true, "#DDDDDD", SpreadsheetApp.BorderStyle.SOLID);

  sheet.getRange(2, 4, numRows - 1, 1).setWrap(true);
  sheet.autoResizeColumns(1, numCols - 1);
  sheet.setColumnWidth(4, 350);

  return ss.getUrl();
}