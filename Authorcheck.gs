// ============================================================================
// AUTHOR CHECK ? Grammatik- & Terminologieprüfung (Docs / Sheets / Slides)
// ============================================================================

const AUTHORCHECK_DEFAULT_PROMPT =
'Du bist ein Lektorats-Assistent für Kärcher-Texte (Hersteller von Reinigungsgeräten: ' +
'Hochdruckreiniger, Kehrmaschinen, Sauger, Zubehör).\n\n' +
'Prüfe den folgenden Text (Sprache: {sourceLang}) auf diese Fehlerarten:\n' +
'1. GRAMMATIK- UND RECHTSCHREIBFEHLER\n' +
'2. FALSCHE ODER UNEINHEITLICHE KÄRCHER-FACHBEGRIFFE ? vergleiche mit dieser Liste ' +
'"falscher Begriff ? korrekter Begriff":\n{termList}\n' +
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

// ??? ANSICHTEN: CHECKS IN DER SEITENLEISTE / RULES IM POPUP ???????????????
function showAuthorCheckSidebar(e) {
  PropertiesService.getUserProperties().deleteProperty('AUTHORCHECK_IS_RULES_ONLY');
  var ui = HtmlService.createHtmlOutputFromFile('AuthorCheck')
    .setTitle('Kärcher Author Check')
    .setWidth(350);

  _getUiSafe_(e).showSidebar(ui);
}

function apiOpenRulesModal(e) {
  PropertiesService.getUserProperties().setProperty('AUTHORCHECK_IS_RULES_ONLY', 'true');
  var ui = HtmlService.createHtmlOutputFromFile('AuthorCheck')
    .setTitle('Rules & Custom Prompts')
    .setWidth(1350)
    .setHeight(900);

  _getUiSafe_(e).showModalDialog(ui, 'Rules & Custom Prompts');
}

function apiMarkRulesHelpSeen() {
  PropertiesService.getUserProperties().setProperty('AUTHORCHECK_RULES_HELP_SEEN', 'true');
  return true;
}

/**
 * Hilfsfunktion: Ermittelt sicher das UI für Docs, Sheets oder Slides
 * ohne Permission-Exceptions abzuwerfen.
 * @param {Object} e Das Event-Objekt der Card-Action (enthält hostApp/docs/sheets/slides)
 */
function _getUiSafe_(e) {
  var hostApp = e && (e.hostApp || (e.docs && 'docs') || (e.sheets && 'sheets') || (e.slides && 'slides'));

  try {
    if (hostApp === 'docs') return DocumentApp.getUi();
    if (hostApp === 'sheets') return SpreadsheetApp.getUi();
    if (hostApp === 'slides') return SlidesApp.getUi();
  } catch (err) {
    Logger.log('_getUiSafe_: getUi() ueber hostApp "' + hostApp + '" fehlgeschlagen: ' + err);
  }

  try {
    if (typeof DocumentApp !== 'undefined' && DocumentApp.getActiveDocument()) return DocumentApp.getUi();
  } catch (err) { Logger.log('_getUiSafe_: Docs Fallback fehlgeschlagen: ' + err); }

  try {
    if (typeof SpreadsheetApp !== 'undefined' && SpreadsheetApp.getActiveSpreadsheet()) return SpreadsheetApp.getUi();
  } catch (err) { Logger.log('_getUiSafe_: Sheets Fallback fehlgeschlagen: ' + err); }

  try {
    if (typeof SlidesApp !== 'undefined' && SlidesApp.getActivePresentation()) return SlidesApp.getUi();
  } catch (err) { Logger.log('_getUiSafe_: Slides Fallback fehlgeschlagen: ' + err); }

  throw new Error('Could not determine active Workspace App UI. hostApp=' + hostApp);
}

// ??? GLOSSAR AUS DEN TERMBASES BAUEN ???????????????????????????????????????
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

// ??? GLOSSAR + REGELTEXT FÜR DEN PROMPT (geteilt zwischen Docs/Sheets/Slides
// und dem Drive-PDF-Check, damit eine Anpassung nicht an zwei Stellen gepflegt
// werden muss) ?????????????????????????????????????????????????????????????
// "labels" laesst jeden Aufrufer seine bisherige Formulierung (EN/DE) behalten,
// damit dieses Refactoring den tatsaechlich an die KI gesendeten Text nicht
// veraendert.
function _buildAuthorCheckPromptParts_(lang, labels) {
  var glossary = _buildTerminologyGlossary_(lang);
  var termListStr = glossary.length
    ? glossary.map(function (p) { return '- ' + p.wrong + ' ? ' + p.correct; }).join('\n')
    : labels.noGlossary;

  var allRules = apiGetRulesConfig(lang);
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

// ??? HAUPTPRÜFUNG ????????????????????????????????????????????????????????
function apiRunAuthorCheck(sourceLang, checkScope) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
  if (!apiKey) throw new Error('AI inspection is not configured (Gemini API Key missing).');

  var text = apiExtractTextFromCurrentApp(checkScope);
  if (!text || !text.trim()) {
    var errMsg = (checkScope === 'selection') ? 'No text selected. Please highlight text first.' : 'No text found in active document.';
    throw new Error(errMsg);
  }

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
  var prompt = promptTemplate
    .replace(/\{sourceLang\}/g, lang)
    .replace(/\{termList\}/g, termListStr)
    .replace(/\{styleRules\}/g, rulesStr)
    .replace(/\{text\}/g, text.replace(/"""/g, "'''"));

  var call = _buildGeminiRequest_(apiUrl, model, apiKey, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: temperature }
  });

  var res = _fetchGeminiWithRetry_(call.url, {
    method: 'post', contentType: 'application/json',
    headers: call.headers, payload: JSON.stringify(call.body), muteHttpExceptions: true
  });

  var issues = _parseGeminiIssuesResponse_(res, 'AI request failed');
  issues.forEach(function (issue, i) {
    issue.id = 'ac_' + i;
    if (issue.type !== 'terminology' && issue.type !== 'style') issue.type = 'grammar';
  });

  logAuditEvent_(getUserEmail_(), 'AUTHOR_CHECK_RUN', 'Found ' + issues.length + ' issue(s), lang=' + lang);
  return { issues: issues, wordCount: text.trim().split(/\s+/).length, glossarySize: glossary.length };
}

// ??? KORREKTUR IM DOKUMENT ANWENDEN ????????????????????????????????????????
function apiApplyAuthorCheckFix(original, suggestion) {
  var count = 0;
  // Sicherheitsgrenze: falls "suggestion" das "original"-Muster selbst enthaelt
  // (z.B. Erweiterung eines Kompositums), wuerde findText() es nach dem Einfuegen
  // sofort wieder finden -> ohne Obergrenze eine Endlosschleife bis zum
  // Apps-Script-Timeout.
  var MAX_REPLACEMENTS = 200;

  if (DocumentApp.getActiveDocument()) {
    var body = DocumentApp.getActiveDocument().getBody();
    var found = body.findText(_escapeRegexAC_(original));
    while (found && count < MAX_REPLACEMENTS) {
      var el = found.getElement().asText();
      var start = found.getStartOffset();
      var end = found.getEndOffsetInclusive();
      var attrs = el.getAttributes(start);
      el.deleteText(start, end);
      el.insertText(start, suggestion);
      var newEnd = start + suggestion.length - 1;
      if (newEnd >= start) el.setAttributes(start, newEnd, attrs);
      count++;
      found = body.findText(_escapeRegexAC_(original));
    }
  } else if (SpreadsheetApp.getActiveSpreadsheet()) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var range = sheet.getDataRange();
    var values = range.getValues();
    var regex = new RegExp(_escapeRegexAC_(original), 'g');
    for (var r = 0; r < values.length; r++) {
      for (var c = 0; c < values[r].length; c++) {
        var cell = String(values[r][c]);
        if (regex.test(cell)) {
          values[r][c] = cell.replace(regex, suggestion);
          count++;
        }
      }
    }
    range.setValues(values);
  } else if (SlidesApp.getActivePresentation()) {
    var slides = SlidesApp.getActivePresentation().getSlides();
    slides.forEach(function (slide) {
      slide.getShapes().forEach(function (shape) {
        if (shape.getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
          var tr = shape.getText();
          if (tr.asString().indexOf(original) !== -1) {
            tr.replaceAllText(_escapeRegexAC_(original), suggestion);
            count++;
          }
        }
      });
    });
  }

  if (count === 0) throw new Error('Text passage "' + original + '" was not found anymore.');
  logAuditEvent_(getUserEmail_(), 'AUTHOR_CHECK_FIX_APPLIED', original + ' ? ' + suggestion + ' (' + count + 'x)');
  return { success: true, count: count };
}

function _escapeRegexAC_(str) {
  return String(str)
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
}

// ??? INTERAKTION: ZUR TEXTSTELLE SPRINGEN ?????????????????????????????????
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
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var found = sheet.createTextFinder(searchText).findNext();
    if (found) { found.activate(); return true; }
  } else if (SlidesApp.getActivePresentation()) {
    var pres = SlidesApp.getActivePresentation();
    var slides = pres.getSlides();
    var cleanSearch = String(searchText).replace(/&nbsp;/g, ' ').replace(/ /g, ' ');
    for (var i = 0; i < slides.length; i++) {
      var shapes = slides[i].getShapes();
      for (var j = 0; j < shapes.length; j++) {
        if (shapes[j].getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
          var txt = shapes[j].getText().asString();
          if (txt.indexOf(searchText) !== -1 || txt.indexOf(cleanSearch) !== -1) {
            slides[i].selectAsCurrentPage();
            shapes[j].select();
            return true;
          }
        }
      }
    }
  }
  return false;
}

// ??? INTERAKTION: NOTIZ / KOMMENTAR EXAKT AN TEXTSTELLE VERKNÜPFEN ?????????
function apiCommentIssue(originalText, suggestion, explanation) {
  var commentText = "TermCheck Suggestion:\n" + suggestion + "\n\nExplanation: " + (explanation || "");
  var cleanOriginal = String(originalText).replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
  
  if (DocumentApp.getActiveDocument()) {
    var doc = DocumentApp.getActiveDocument();
    var found = doc.getBody().findText(_escapeRegexAC_(cleanOriginal));
    
    // Fallback falls die flexible Suche fehlschlägt: Exakter Treffer
    if (!found) {
      try { found = doc.getBody().findText(_escapeRegexAC_(originalText)); } catch(e) {}
    }

    if (found) {
      var rangeBuilder = doc.newRange();
      rangeBuilder.addElement(found.getElement(), found.getStartOffset(), found.getEndOffsetInclusive());
      doc.setSelection(rangeBuilder.build());
      
      try {
        var docId = doc.getId();
        Drive.Comments.create({ 
          content: commentText, 
          context: { type: 'text/plain', value: cleanOriginal } 
        }, docId, {fields: '*'});
        return true;
      } catch(e) { 
        Logger.log('apiCommentIssue: Drive.Comments.create fehlgeschlagen: ' + e);
        return true; // Auswertung/Selektion hat geklappt, selbst wenn Drive Comments offline sind
      }
    }
  } else if (SpreadsheetApp.getActiveSpreadsheet()) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var found = sheet.createTextFinder(cleanOriginal).findNext();
    if (!found) found = sheet.createTextFinder(originalText).findNext();
    
    if (found) {
      found.activate();
      found.setNote(commentText);
      return true; 
    }
  } else if (SlidesApp.getActivePresentation()) {
    var slides = SlidesApp.getActivePresentation().getSlides();
    for (var i = 0; i < slides.length; i++) {
      var shapes = slides[i].getShapes();
      for (var j = 0; j < shapes.length; j++) {
        if (shapes[j].getShapeType() === SlidesApp.ShapeType.TEXT_BOX) {
          var txt = shapes[j].getText().asString();
          if (txt.indexOf(originalText) !== -1 || txt.indexOf(cleanOriginal) !== -1) {
            slides[i].selectAsCurrentPage();
            shapes[j].select();
            return true;
          }
        }
      }
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