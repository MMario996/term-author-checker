// ============================================================================
// DRIVE ADD-ON - PDF-Check (Grammatik/Terminologie/Stil, wie Author Check in
// Docs/Sheets/Slides). Ergebnis-Ausgabe nur als Sheet-Export, da Drive für PDFs
// keine sichtbaren Kommentare unterstützt (siehe _buildDrivePdfResultsCard_).
// ============================================================================
var DRIVE_PDF_MAX_BYTES = 15 * 1024 * 1024; // Sicherheitsgrenze, ca. 15 MB
var DRIVE_PDF_RESULT_CACHE_TTL = 3600; // 1h, reicht für eine interaktive Session in Drive
var DRIVE_PDF_MAX_CARD_ISSUES = 25; // Card-UI bleibt sonst zu groß/langsam

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
    .setSubtitle('PDF check'));
  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
      .setText('Select a single PDF file in Google Drive to check it against the Author Check rules. Other file types are not supported yet.')));
  return card.build();
}

function onDriveItemsSelected(e) {
  var items = (e.drive && e.drive.selectedItems) || [];

  if (items.length !== 1) {
    return _buildDriveInfoCard_('Please select exactly one file', 'Select a single PDF file in Drive - not multiple files, and no folders.');
  }

  var item = items[0];
  if (item.mimeType !== 'application/pdf') {
    return _buildDriveInfoCard_('Only PDF is supported', 'The file "' + item.title + '" is not a PDF. This check currently only works for PDF files.');
  }

  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle('Kärcher Author Check')
    .setSubtitle(item.title));

  var section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph()
    .setText('Checks the entire content of this PDF against the Author Check rules (grammar, terminology, style) - the same as Author Check in Docs, Sheets and Slides.'));
  section.addWidget(CardService.newTextParagraph()
    .setText('<i>Rules are personal to you and shared across Docs, Sheets, Slides and Drive. To view or change them, open Author Check in a Google Doc, Sheet or Slide deck and click "Rules".</i>'));

  var langSelect = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Language')
    .setFieldName('language');
  DRIVE_PDF_LANGUAGES.forEach(function(pair) {
    langSelect.addItem(pair[1], pair[0], pair[0] === 'de');
  });
  section.addWidget(langSelect);

  var action = CardService.newAction()
    .setFunctionName('apiCheckDrivePdf')
    .setParameters({ fileId: item.id, fileName: item.title })
    .setLoadIndicator(CardService.LoadIndicator.SPINNER);

  section.addWidget(CardService.newTextButton()
    .setText('Check PDF')
    .setOnClickAction(action));

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
 * direkt interaktiv an (wie die Issue-Karten im Author-Check-Sidebar). Das
 * Ergebnis wird gecacht (siehe _drivePdfResultCacheKey_), damit "Export as
 * Sheet" es ohne erneuten Gemini-Call weiterverwenden kann.
 */
function apiCheckDrivePdf(e) {
  var fileId = e.parameters.fileId;
  var fileName = e.parameters.fileName || 'PDF';
  var language = (e.formInput && e.formInput.language) || 'de';

  try {
    var props = PropertiesService.getScriptProperties();
    var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
    if (!apiKey) throw new Error('AI inspection is not configured (Gemini API Key missing).');

    var blob = DriveApp.getFileById(fileId).getBlob();
    if (blob.getBytes().length > DRIVE_PDF_MAX_BYTES) {
      throw new Error('The PDF file is too large (limit: ' + (DRIVE_PDF_MAX_BYTES / (1024*1024)) + ' MB).');
    }
    var base64 = Utilities.base64Encode(blob.getBytes());

    var promptParts = _buildAuthorCheckPromptParts_(language, {
      noGlossary: '(no specific entries found for this language)',
      valueLabel: 'Value',
      specificCheckPrefix: 'SPECIFIC CHECK',
      noStandardRules: '(No standard rules)',
      additionalChecksHeader: 'ADDITIONAL SPECIFIC PROMPTS/CHECKS'
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
      Logger.log('apiCheckDrivePdf: result cache failed (result possibly too large): ' + cacheErr);
    }

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(_buildDrivePdfResultsCard_(resultId, fileName, issues)))
      .build();

  } catch (err) {
    var errCard = CardService.newCardBuilder();
    errCard.setHeader(CardService.newCardHeader().setTitle('Error'));
    errCard.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(err.message || String(err))));
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(errCard.build()))
      .build();
  }
}

/**
 * Baut die interaktive Ergebnis-Card: Zusammenfassung oben, darunter pro Fund
 * eine Mini-"Issue-Card" mit Original -> Vorschlag, Erklärung.
 *
 * WICHTIG: Es gibt hier bewusst KEINEN "Add Note"-Button. Laut Googles eigener
 * Drive-API-Doku ("Kommentare und Antworten verwalten") unterstützt die Drive
 * API für Blob-Dateien (u.a. PDFs) grundsätzlich keine verankerten Kommentare,
 * und selbst nicht verankerte Kommentare werden in der PDF-Vorschau von Drive
 * NIE angezeigt (nur über die API abrufbar). Ein "Note"-Button würde hier also
 * etwas erzeugen, das der Nutzer im Drive-UI nie zu sehen bekommt - daher bleibt
 * "Export as Sheet" der einzige Ausgabeweg für die PDF-Prüfung. Für Docs/Slides
 * (keine Blob-Dateien) funktioniert die Note-Funktion in Authorcheck.gs normal.
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
  topSection.addWidget(CardService.newTextParagraph()
    .setText('<i>Google Drive does not support visible comments on PDF files, so results here are read-only. Use "Export as Sheet" to get a shareable list.</i>'));
  card.addSection(topSection);

  var shown = issues.slice(0, DRIVE_PDF_MAX_CARD_ISSUES);
  shown.forEach(function(issue) {
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
    rows.push(["-", "-", "No errors found.", "-", "-"]);
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
