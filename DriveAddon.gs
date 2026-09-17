// ============================================================================
// DRIVE ADD-ON - PDF-Check mit Notes/Highlights (Feature-Parität zu Docs/Sheets/Slides)
// ============================================================================
var DRIVE_PDF_MAX_BYTES = 15 * 1024 * 1024; // Sicherheitsgrenze, ca. 15 MB
var DRIVE_PDF_RESULT_CACHE_TTL = 3600; // 1h, reicht für eine interaktive Session in Drive
var DRIVE_PDF_MAX_CARD_ISSUES = 25; // Card-UI bleibt sonst zu groß/langsam
var DRIVE_PDF_MAX_BULK_NOTES = 40; // Obergrenze für "Add All as Notes" (Drive-API-Calls, Laufzeit)

// Gleiche Sprachliste wie im Author-Check-Sidebar (AuthorCheck.html), damit die
// PDF-Prüfung aus Google Drive dieselben Sprachen wie Docs/Sheets/Slides anbietet.
var DRIVE_PDF_LANGUAGES = [
  ['de', 'German'], ['en', 'English'], ['es', 'Spanish'], ['sv', 'Swedish'],
  ['pt', 'Portuguese'], ['ru', 'Russian'], ['it', 'Italian'], ['fr', 'French'],
  ['nl', 'Dutch'], ['hu', 'Hungarian'], ['sk', 'Slovak'], ['hr', 'Croatian'],
  ['tr', 'Turkish'], ['pl', 'Polish'], ['fi', 'Finnish'], ['sr', 'Serbian'],
  ['ar', 'Arabic'], ['bg', 'Bulgarian'], ['el', 'Greek'], ['ko', 'Korean'],
  ['da', 'Danish'], ['ja', 'Japanese'], ['vi', 'Vietnamese'], ['zh', 'Chinese'],
  ['lv', 'Latvian'], ['cs', 'Czech'], ['uk', 'Ukrainian'], ['ro', 'Romanian'],
  ['et', 'Estonian'], ['sl', 'Slovenian'], ['nb', 'Norwegian']
];

function onDriveHomepage(e) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle('Kärcher Author Check')
    .setSubtitle('PDF-Prüfung'));
  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
      .setText('Wähle in Google Drive eine einzelne PDF-Datei aus, um sie gegen die Author-Check-Regeln zu prüfen. Andere Dateitypen werden aktuell nicht unterstützt.')));
  return card.build();
}

function onDriveItemsSelected(e) {
  var items = (e.drive && e.drive.selectedItems) || [];

  if (items.length !== 1) {
    return _buildDriveInfoCard_('Bitte genau eine Datei auswählen', 'Wähle genau eine einzelne PDF-Datei in Drive aus, nicht mehrere und keine Ordner.');
  }

  var item = items[0];
  if (item.mimeType !== 'application/pdf') {
    return _buildDriveInfoCard_('Nur PDF wird unterstützt', 'Die Datei "' + item.title + '" ist kein PDF. Diese Prüfung funktioniert aktuell ausschließlich für PDF-Dateien.');
  }

  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle('Kärcher Author Check')
    .setSubtitle(item.title));

  var section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph()
    .setText('Prüft den kompletten Inhalt dieser PDF-Datei gegen die Author-Check-Regeln (Grammatik, Terminologie, Stil) - genau wie Author Check in Docs, Sheets und Slides.'));

  var langSelect = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Sprache')
    .setFieldName('language');
  DRIVE_PDF_LANGUAGES.forEach(function(pair) {
    langSelect.addItem(pair[1], pair[0], pair[0] === 'de');
  });
  section.addWidget(langSelect);

  var action = CardService.newAction()
    .setFunctionName('apiCheckDrivePdf')
    .setParameters({ fileId: item.id, fileName: item.title });

  section.addWidget(CardService.newTextButton()
    .setText('PDF prüfen')
    .setOnClickAction(action)
    .setLoadIndicator(CardService.LoadIndicator.SPINNER));

  card.addSection(section);
  return card.build();
}

function _buildDriveInfoCard_(title, message) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle(title));
  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(message)));
  return card.build();
}

function _drivePdfLanguageName_(code) {
  var match = DRIVE_PDF_LANGUAGES.find(function(p) { return p[0] === code; });
  return match ? match[1] : code;
}

function _drivePdfResultCacheKey_(resultId) {
  return 'DRIVE_PDF_RESULT_' + resultId;
}

/**
 * Card-Action: prüft die ausgewählte PDF-Datei per Gemini und zeigt die Treffer
 * direkt interaktiv an (wie die Issue-Karten im Author-Check-Sidebar), statt nur
 * ein separates Sheet zu erzeugen. Von hier aus können pro Fund oder für alle
 * Funde auf einmal echte, an der Textstelle "verankerte" Drive-Kommentare
 * (Highlights) auf der PDF selbst angelegt werden - siehe apiAddDrivePdfNote /
 * apiAddAllDrivePdfNotes.
 */
function apiCheckDrivePdf(e) {
  var fileId = e.parameters.fileId;
  var fileName = e.parameters.fileName || 'PDF';
  var language = (e.formInput && e.formInput.language) || 'de';

  try {
    var props = PropertiesService.getScriptProperties();
    var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
    if (!apiKey) throw new Error('AI-Prüfung ist nicht konfiguriert (Gemini API Key fehlt).');

    var blob = DriveApp.getFileById(fileId).getBlob();
    if (blob.getBytes().length > DRIVE_PDF_MAX_BYTES) {
      throw new Error('Die PDF-Datei ist zu groß (Limit: ' + (DRIVE_PDF_MAX_BYTES / (1024*1024)) + ' MB).');
    }
    var base64 = Utilities.base64Encode(blob.getBytes());

    var promptParts = _buildAuthorCheckPromptParts_(language, {
      noGlossary: '(keine spezifischen Einträge für diese Sprache gefunden)',
      valueLabel: 'Wert',
      specificCheckPrefix: 'SPEZIFISCHE PRÜFUNG',
      noStandardRules: '(Keine Standardregeln)',
      additionalChecksHeader: 'ZUSÄTZLICHE SPEZIFISCHE PRÜFUNGEN'
    });
    var termListStr = promptParts.termListStr;
    var rulesStr = promptParts.rulesStr;

    var targetLanguageName = _drivePdfLanguageName_(language);

    var prompt =
      'You are a proofreading assistant for Kärcher texts (manufacturer of cleaning equipment: ' +
      'high-pressure cleaners, sweepers, vacuum cleaners, accessories).\n\n' +
      'IMPORTANT: The attached PDF document may contain text in multiple languages (e.g. a multilingual manual with several language sections). ' +
      'Check ONLY the passages that are written in ' + targetLanguageName + '. ' +
      'Completely ignore and skip any passages written in other languages, even if they appear right next to or interleaved with ' + targetLanguageName + ' text. ' +
      'Do not report any issue whose "original" quote is not itself in ' + targetLanguageName + '.\n\n' +
      'Within the ' + targetLanguageName + ' passages, check for these error types:\n' +
      '1. GRAMMAR AND SPELLING ERRORS\n' +
      '2. INCORRECT OR INCONSISTENT KÄRCHER TERMINOLOGY - compare against this list ' +
      '"incorrect term -> correct term":\n' + termListStr + '\n' +
      '3. SPECIFIC WRITING AND STYLE RULES:\n' + rulesStr + '\n\n' +
      'Respond EXCLUSIVELY with valid JSON in exactly this structure, without markdown formatting, without code block:\n' +
      '{"issues":[{"type":"grammar|terminology|style","location":"...","original":"...","suggestion":"...","explanation":"..."}]}\n\n' +
      'Rules:\n' +
      '- "type" is either "grammar", "terminology" or "style".\n' +
      '- "location" is a short hint where in the document the passage can be found (e.g. page number, chapter, or language section), if identifiable, otherwise leave empty.\n' +
      '- "original" must be an EXACT, contiguous quote from the document, and must itself be written in ' + targetLanguageName + '.\n' +
      '- Only return genuine errors found in ' + targetLanguageName + ' passages. If no errors are found, return {"issues":[]}.';

    var rawUrl = props.getProperty('GEMINI_API_URL') || 'https://34-111-99-134.nip.io/gemini/v1beta/models/';
    var apiUrl = rawUrl.split(']')[0].replace('[', '').trim();
    var model = (props.getProperty('AI_MODEL') || 'gemini-3.6-flash').trim();
    var temperature = parseFloat(props.getProperty('AI_TEMPERATURE')) || 0.2;

    var call = _buildGeminiRequest_(apiUrl, model, apiKey, {
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'application/pdf', data: base64 } }
        ]
      }],
      generationConfig: { temperature: temperature }
    });

    var res = _fetchGeminiWithRetry_(call.url, {
      method: 'post', contentType: 'application/json',
      headers: call.headers, payload: JSON.stringify(call.body), muteHttpExceptions: true
    });
    var issues = _parseGeminiIssuesResponse_(res, 'AI request failed');

    logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_CHECK_RUN', fileName + ' - ' + issues.length + ' issue(s)');

    var resultId = Utilities.getUuid();
    var cachePayload = { fileId: fileId, fileName: fileName, language: language, issues: issues };
    try {
      CacheService.getUserCache().put(_drivePdfResultCacheKey_(resultId), JSON.stringify(cachePayload), DRIVE_PDF_RESULT_CACHE_TTL);
    } catch (cacheErr) {
      Logger.log('apiCheckDrivePdf: Ergebnis-Cache fehlgeschlagen (Ergebnis evtl. zu groß): ' + cacheErr);
    }

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(_buildDrivePdfResultsCard_(resultId, fileName, issues)))
      .build();

  } catch (err) {
    var errCard = CardService.newCardBuilder();
    errCard.setHeader(CardService.newCardHeader().setTitle('Fehler'));
    errCard.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(err.message || String(err))));
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(errCard.build()))
      .build();
  }
}

/**
 * Baut die interaktive Ergebnis-Card: Zusammenfassung + Bulk-Aktionen oben,
 * darunter pro Fund eine Mini-"Issue-Card" mit Original -> Vorschlag, Erklärung
 * und einem "Notiz hinzufügen"-Button, der einen echten, hervorgehobenen
 * Drive-Kommentar auf der PDF anlegt (siehe _createHighlightedDriveComment_ in
 * Authorcheck.gs) - dieselbe "Note"-Aktion wie im Docs/Sheets/Slides-Sidebar.
 */
function _buildDrivePdfResultsCard_(resultId, fileName, issues) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle(issues.length + ' issue(s) found')
    .setSubtitle(fileName));

  var topSection = CardService.newCardSection();
  if (!issues.length) {
    topSection.addWidget(CardService.newTextParagraph().setText('No errors found for the selected language.'));
    card.addSection(topSection);
    return card.build();
  }

  topSection.addWidget(CardService.newTextButton()
    .setText('Export as Sheet')
    .setOnClickAction(CardService.newAction().setFunctionName('apiExportDrivePdfResultToSheet').setParameters({ resultId: resultId })));
  topSection.addWidget(CardService.newTextButton()
    .setText('Add All as Notes')
    .setOnClickAction(CardService.newAction().setFunctionName('apiAddAllDrivePdfNotes').setParameters({ resultId: resultId }))
    .setLoadIndicator(CardService.LoadIndicator.SPINNER));
  card.addSection(topSection);

  var shown = issues.slice(0, DRIVE_PDF_MAX_CARD_ISSUES);
  shown.forEach(function(issue, idx) {
    var section = CardService.newCardSection();
    var typeLabel = (issue.type || 'style').toUpperCase();
    var locationLabel = issue.location ? ' - ' + issue.location : '';
    section.addWidget(CardService.newTextParagraph()
      .setText('<b>' + _escapeCardHtml_(typeLabel) + '</b>' + _escapeCardHtml_(locationLabel)));
    section.addWidget(CardService.newTextParagraph()
      .setText('<s>' + _escapeCardHtml_(issue.original) + '</s> &rarr; ' + _escapeCardHtml_(issue.suggestion)));
    if (issue.explanation) {
      section.addWidget(CardService.newTextParagraph().setText(_escapeCardHtml_(issue.explanation)));
    }
    section.addWidget(CardService.newTextButton()
      .setText('Add Note')
      .setOnClickAction(CardService.newAction()
        .setFunctionName('apiAddDrivePdfNote')
        .setParameters({ resultId: resultId, issueIndex: String(idx) })));
    card.addSection(section);
  });

  if (issues.length > shown.length) {
    var moreSection = CardService.newCardSection();
    moreSection.addWidget(CardService.newTextParagraph()
      .setText('+ ' + (issues.length - shown.length) + ' more issue(s). Use "Export as Sheet" for the full list.'));
    card.addSection(moreSection);
  }

  return card.build();
}

// CardService-TextParagraph unterstützt ein kleines HTML-Subset (b/s/i/...),
// daher hier - analog zu esc() in den Sidebar-HTMLs - Nutzertext/KI-Text vor der
// Einbettung escapen, statt rohen Text in setText() zu interpolieren.
function _escapeCardHtml_(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _loadDrivePdfResult_(resultId) {
  var raw = CacheService.getUserCache().get(_drivePdfResultCacheKey_(resultId));
  if (!raw) throw new Error('This result has expired. Please run the PDF check again.');
  return JSON.parse(raw);
}

/**
 * Fügt für EINEN Fund einen echten, an der Textstelle verankerten Drive-Kommentar
 * (Highlight) auf der PDF hinzu - das PDF-Äquivalent zum "Note"-Button in
 * Docs/Sheets/Slides.
 */
function apiAddDrivePdfNote(e) {
  var resultId = e.parameters.resultId;
  var issueIndex = parseInt(e.parameters.issueIndex, 10);
  var notifText;
  try {
    var data = _loadDrivePdfResult_(resultId);
    var issue = data.issues[issueIndex];
    if (!issue) throw new Error('Issue not found.');
    var commentText = 'TermCheck Suggestion:\n' + issue.suggestion + '\n\nExplanation: ' + (issue.explanation || '');
    _createHighlightedDriveComment_(data.fileId, issue.original, commentText);
    logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_NOTE_ADDED', data.fileName + ' - issue #' + issueIndex);
    notifText = 'Note added.';
  } catch (err) {
    notifText = 'Error: ' + (err.message || String(err));
  }
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(notifText))
    .build();
}

/**
 * Fügt Notizen für alle (bis zu DRIVE_PDF_MAX_BULK_NOTES) Funde eines Ergebnisses
 * hinzu - das PDF-Äquivalent zum "Note All"-Bulk-Button im Author-Check-Sidebar.
 */
function apiAddAllDrivePdfNotes(e) {
  var resultId = e.parameters.resultId;
  var added = 0, failed = 0;
  try {
    var data = _loadDrivePdfResult_(resultId);
    var toProcess = data.issues.slice(0, DRIVE_PDF_MAX_BULK_NOTES);
    toProcess.forEach(function(issue) {
      try {
        var commentText = 'TermCheck Suggestion:\n' + issue.suggestion + '\n\nExplanation: ' + (issue.explanation || '');
        _createHighlightedDriveComment_(data.fileId, issue.original, commentText);
        added++;
      } catch (err) {
        failed++;
      }
    });
    logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_NOTE_ADDED_ALL', data.fileName + ' - ' + added + ' note(s), ' + failed + ' failed');
  } catch (err) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Error: ' + (err.message || String(err))))
      .build();
  }
  var msg = added + ' note(s) added' + (failed ? ', ' + failed + ' failed' : '') +
    (added >= DRIVE_PDF_MAX_BULK_NOTES ? ' (limit reached, run again or use Export as Sheet for the rest)' : '') + '.';
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(msg))
    .build();
}

/**
 * Card-Action-Variante von _buildDrivePdfReportSheet_: nutzt das bereits
 * gecachte Prüfergebnis (kein erneuter Gemini-Call nötig) und öffnet das Sheet.
 */
function apiExportDrivePdfResultToSheet(e) {
  try {
    var data = _loadDrivePdfResult_(e.parameters.resultId);
    var sheetUrl = _buildDrivePdfReportSheet_(data.issues, data.fileName, data.language);
    return CardService.newActionResponseBuilder()
      .setOpenLink(CardService.newOpenLink().setUrl(sheetUrl))
      .build();
  } catch (err) {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Error: ' + (err.message || String(err))))
      .build();
  }
}

/**
 * Erstellt den Audit-Report für eine geprüfte PDF-Datei als Google Sheet
 * (inklusive Location-Spalte, da im PDF nichts automatisch ersetzt werden kann)
 * und gibt die URL zurück.
 */
function _buildDrivePdfReportSheet_(issues, fileName, language) {
  var title = "AuthorCheck_PDF_" + fileName.replace(/\.pdf$/i, '').slice(0, 60) + "_" + new Date().toISOString().slice(0, 10);
  var ss = SpreadsheetApp.create(title);
  var sheet = ss.getActiveSheet();
  sheet.setName("PDF Audit Report");

  var headers = ["Type", "Location", "Original Passage", "Suggestion", "Explanation"];
  var rows = [headers];

  if (!issues.length) {
    var noIssuesText = language === 'en' ? "No errors found." : "Keine Fehler gefunden.";
    rows.push(["-", "-", noIssuesText, "-", "-"]);
  } else {
    issues.forEach(function(issue) {
      rows.push([
        (issue.type || "style").toUpperCase(),
        issue.location || "",
        issue.original || "",
        issue.suggestion || "",
        issue.explanation || ""
      ]);
    });
  }

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
  sheet.getRange(2, numCols, numRows - 1, 1).setWrap(true);
  sheet.autoResizeColumns(1, numCols - 1);
  sheet.setColumnWidth(numCols, 350);

  return ss.getUrl();
}
