// ============================================================================
// DRIVE ADD-ON ? PDF-Check mit automatischem Report
// ============================================================================
var DRIVE_PDF_MAX_BYTES = 15 * 1024 * 1024; // Sicherheitsgrenze, ca. 15 MB

function onDriveHomepage(e) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle('K?rcher Author Check')
    .setSubtitle('PDF-Pr?fung'));
  card.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextParagraph()
      .setText('W?hle in Google Drive eine einzelne PDF-Datei aus, um sie gegen die Author-Check-Regeln zu pr?fen. Andere Dateitypen werden aktuell nicht unterst?tzt.')));
  return card.build();
}

function onDriveItemsSelected(e) {
  var items = (e.drive && e.drive.selectedItems) || [];

  if (items.length !== 1) {
    return _buildDriveInfoCard_('Bitte genau eine Datei ausw?hlen', 'W?hle genau eine einzelne PDF-Datei in Drive aus, nicht mehrere und keine Ordner.');
  }

  var item = items[0];
  if (item.mimeType !== 'application/pdf') {
    return _buildDriveInfoCard_('Nur PDF wird unterst?tzt', 'Die Datei "' + item.title + '" ist kein PDF. Diese Pr?fung funktioniert aktuell ausschlie?lich f?r PDF-Dateien.');
  }

  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle('K?rcher Author Check')
    .setSubtitle(item.title));

  var section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph()
    .setText('Pr?ft den kompletten Inhalt dieser PDF-Datei gegen die Author-Check-Regeln und erstellt automatisch einen Report als Google Sheet.'));

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
    .setText('PDF pr?fen')
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
 * Card-Action: pr?ft die ausgew?hlte PDF-Datei per Gemini und erstellt automatisch
 * einen Report als Google Sheet, der direkt ge?ffnet wird.
 */
function apiCheckDrivePdf(e) {
  var fileId = e.parameters.fileId;
  var fileName = e.parameters.fileName || 'PDF';
  var language = (e.formInput && e.formInput.language) || 'de';

  try {
    var props = PropertiesService.getScriptProperties();
    var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
    if (!apiKey) throw new Error('AI-Pr?fung ist nicht konfiguriert (Gemini API Key fehlt).');

    var blob = DriveApp.getFileById(fileId).getBlob();
    if (blob.getBytes().length > DRIVE_PDF_MAX_BYTES) {
      throw new Error('Die PDF-Datei ist zu gro? (Limit: ' + (DRIVE_PDF_MAX_BYTES / (1024*1024)) + ' MB).');
    }
    var base64 = Utilities.base64Encode(blob.getBytes());

    var glossary = _buildTerminologyGlossary_(language);
    var termListStr = glossary.length
      ? glossary.map(function (p) { return '- ' + p.wrong + ' ? ' + p.correct; }).join('\n')
      : '(keine spezifischen Eintr?ge f?r diese Sprache gefunden)';

    var allRules = apiGetRulesConfig(language);
    var activeRules = allRules.filter(function(r) { return r.IsEnabled; });
    var standardRulesStr = activeRules
      .filter(function(r) { return r.RuleKind !== 'PROMPT' && !r.CustomPrompt; })
      .map(function(r) {
        var param = (r.IsConfigurable && r.Parameter !== "-1" && r.Parameter !== null) ? " (Wert: " + r.Parameter + ")" : "";
        return "- [" + r.Type + "] " + r.Description + param;
      }).join('\n');
    var customPromptsStr = activeRules
      .filter(function(r) { return r.RuleKind === 'PROMPT' || (r.CustomPrompt && r.CustomPrompt.trim().length > 0); })
      .map(function(r) {
        return "- SPEZIFISCHE PR?FUNG [" + (r.Type || "Custom") + " -> " + r.Description + "]: " + r.CustomPrompt;
      }).join('\n');
    var rulesStr = (standardRulesStr || '(Keine Standardregeln)') +
      (customPromptsStr ? '\n\nZUS?TZLICHE SPEZIFISCHE PR?FUNGEN:\n' + customPromptsStr : '');

    var languageNames = { de: 'German', en: 'English' };
    var targetLanguageName = languageNames[language] || language;

    var prompt =
      'You are a proofreading assistant for K?rcher texts (manufacturer of cleaning equipment: ' +
      'high-pressure cleaners, sweepers, vacuum cleaners, accessories).\n\n' +
      'IMPORTANT: The attached PDF document may contain text in multiple languages (e.g. a multilingual manual with several language sections). ' +
      'Check ONLY the passages that are written in ' + targetLanguageName + '. ' +
      'Completely ignore and skip any passages written in other languages, even if they appear right next to or interleaved with ' + targetLanguageName + ' text. ' +
      'Do not report any issue whose "original" quote is not itself in ' + targetLanguageName + '.\n\n' +
      'Within the ' + targetLanguageName + ' passages, check for these error types:\n' +
      '1. GRAMMAR AND SPELLING ERRORS\n' +
      '2. INCORRECT OR INCONSISTENT K?RCHER TERMINOLOGY ? compare against this list ' +
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

    var res = UrlFetchApp.fetch(call.url, {
      method: 'post', contentType: 'application/json',
      headers: call.headers, payload: JSON.stringify(call.body), muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) throw new Error('AI request failed (' + res.getResponseCode() + ').');

    var data = JSON.parse(res.getContentText());
    var respText;
    try { respText = data.candidates[0].content.parts[0].text; }
    catch (err) { throw new Error('Unexpected AI response structure.'); }

    var clean = String(respText).replace(/```json/gi, '').replace(/```/g, '').trim();
    var parsed;
    try { parsed = JSON.parse(clean); }
    catch (err) { throw new Error('AI response was not valid JSON.'); }

    var issues = Array.isArray(parsed.issues) ? parsed.issues : [];
    issues = issues.filter(function (i) { return i && i.original && i.suggestion; });

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
 * Erstellt den Audit-Report f?r eine gepr?fte PDF-Datei als Google Sheet
 * (inklusive Location-Spalte, da im PDF nichts automatisch ersetzt werden kann)
 * und gibt die URL zur?ck.
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