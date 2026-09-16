// ============================================================================
// DRIVE ADD-ON ? PDF-Check mit automatischem Report
// ============================================================================
var DRIVE_PDF_MAX_BYTES = 15 * 1024 * 1024; // Sicherheitsgrenze, ca. 15 MB

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
    .setText('Prüft den kompletten Inhalt dieser PDF-Datei gegen die Author-Check-Regeln und erstellt automatisch einen Report als Google Sheet.'));

  var langSelect = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Sprache')
    .setFieldName('language')
    .addItem('German', 'de', true)
    .addItem('English', 'en', false);
  section.addWidget(langSelect);

  var action = CardService.newAction()
    .setFunctionName('apiCheckDrivePdf')
    .setParameters({ fileId: item.id, fileName: item.title });

  section.addWidget(CardService.newTextButton()
    .setText('PDF prüfen')
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

/**
 * Card-Action: prüft die ausgewählte PDF-Datei per Gemini und erstellt automatisch
 * einen Report als Google Sheet, der direkt geöffnet wird.
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

    var languageNames = { de: 'German', en: 'English' };
    var targetLanguageName = languageNames[language] || language;

    var prompt =
      'You are a proofreading assistant for Kärcher texts (manufacturer of cleaning equipment: ' +
      'high-pressure cleaners, sweepers, vacuum cleaners, accessories).\n\n' +
      'IMPORTANT: The attached PDF document may contain text in multiple languages (e.g. a multilingual manual with several language sections). ' +
      'Check ONLY the passages that are written in ' + targetLanguageName + '. ' +
      'Completely ignore and skip any passages written in other languages, even if they appear right next to or interleaved with ' + targetLanguageName + ' text. ' +
      'Do not report any issue whose "original" quote is not itself in ' + targetLanguageName + '.\n\n' +
      'Within the ' + targetLanguageName + ' passages, check for these error types:\n' +
      '1. GRAMMAR AND SPELLING ERRORS\n' +
      '2. INCORRECT OR INCONSISTENT KÄRCHER TERMINOLOGY ? compare against this list ' +
      '"incorrect term ? correct term":\n' + termListStr + '\n' +
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

    logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_CHECK_RUN', fileName + ' ? ' + issues.length + ' issue(s)');

    var sheetUrl = _buildDrivePdfReportSheet_(issues, fileName, language);

    var doneCard = CardService.newCardBuilder();
    doneCard.setHeader(CardService.newCardHeader().setTitle('Done'));
    doneCard.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText(issues.length + ' issue(s) found in "' + fileName + '". Opening the report.')));

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(doneCard.build()))
      .setOpenLink(CardService.newOpenLink().setUrl(sheetUrl))
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