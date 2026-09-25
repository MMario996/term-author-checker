// ============================================================================
// DRIVE ADD-ON - PDF-Check (Grammatik/Terminologie/Stil, wie Author Check in
// Docs/Sheets/Slides). Ergebnis-Ausgabe nur als Sheet-Export, da Drive für PDFs
// keine sichtbaren Kommentare unterstützt (siehe _buildDrivePdfResultsCard_).
// ============================================================================
var DRIVE_PDF_MAX_BYTES = 15 * 1024 * 1024; // Sicherheitsgrenze, ca. 15 MB (Gemini-Anfrage max. ~20 MB)
// Größere PDFs werden vor dem Check ohne Bilder neu aufgebaut (PdfShrink.gs);
// bis zu dieser Dateigröße wird das versucht.
var DRIVE_PDF_SHRINK_MAX_BYTES = 300 * 1024 * 1024;
// Apps Script kann Dateien nur bis 50 MB als Ganzes laden - darüber wird die
// annotierte Kopie stückweise geschrieben (siehe _driveLargeAnnotatedStart_).
var DRIVE_PDF_ANNOTATE_MAX_BYTES = 45 * 1024 * 1024;
// Bei verkleinerten PDFs: so viel Bilddaten bleiben insgesamt erhalten (kleinste
// Bilder zuerst - Piktogramme/Warnsymbole vor großen Fotos).
var DRIVE_PDF_IMAGE_BUDGET = 12 * 1024 * 1024;
// Dauert die Vorbereitung länger, wird die Prüfung als zweiter Schritt gestartet.
var DRIVE_PDF_PREP_BUDGET_MS = 15000;
var DRIVE_PDF_RESULT_CACHE_TTL = 3600; // 1h, reicht für eine interaktive Session in Drive
var DRIVE_PDF_MAX_CARD_ISSUES = 25; // Card-UI bleibt sonst zu groß/langsam
var DRIVE_PDF_LAST_LANG_KEY = 'DRIVE_PDF_LAST_LANGUAGE';

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
    return _buildDriveInfoCard_('Only PDF is supported', 'The file "' + _escapeCardHtml_(item.title) + '" is not a PDF. This check currently only works for PDF files.');
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
  // Zuletzt verwendete Sprache vorauswaehlen statt immer DE.
  var lastLang = PropertiesService.getUserProperties().getProperty(DRIVE_PDF_LAST_LANG_KEY) || 'de';
  DRIVE_PDF_LANGUAGES.forEach(function(pair) {
    langSelect.addItem(pair[1], pair[0], pair[0] === lastLang);
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
  var started = Date.now();
  var fileId = e.parameters.fileId;
  var fileName = e.parameters.fileName || 'PDF';
  var language = (e.formInput && e.formInput.language) || 'de';

  try {
    try { PropertiesService.getUserProperties().setProperty(DRIVE_PDF_LAST_LANG_KEY, language); } catch (propErr) {}
    _driveGeminiConfig_(); // bricht früh ab, wenn kein API-Key konfiguriert ist

    var prep = _drivePdfPrepare_(fileId, fileName);
    var job = { fileId: fileId, fileName: fileName, language: language, fileSize: prep.fileSize,
                imagesRemoved: prep.imagesRemoved, imagesKept: prep.imagesKept };
    var parts = _drivePdfPlanParts_(prep);
    prep = null;
    parts.forEach(function(part) {
      if (part.text.length > DRIVE_PDF_MAX_BYTES) {
        throw new Error('Pages ' + (part.from + 1) + '-' + part.to + ' are still ' + _driveMb_(part.text.length) + ' MB after reduction (limit: ' + _driveMb_(DRIVE_PDF_MAX_BYTES) + ' MB). Please split the PDF.');
      }
    });

    // Sicherheitsnetz: hat die Vorbereitung schon zu viel vom Zeitbudget der
    // Aktion verbraucht, werden die fertigen Seitenpakete zwischengespeichert
    // (hintereinander in EINER Temp-Datei, Positionen in job.parts) und die
    // Prüfung in einer zweiten Aktion ("Continue check") mit frischem Budget
    // gestartet - dort wird dann nur noch Gemini aufgerufen.
    if (Date.now() - started > DRIVE_PDF_PREP_BUDGET_MS) {
      var pos = 0;
      job.parts = parts.map(function(part) {
        var entry = { from: part.from, to: part.to, start: pos, len: part.text.length };
        pos += part.text.length;
        return entry;
      });
      var tmp = _getOrCreateExportFolder_().createFile(Utilities.newBlob(
        _pdfBinaryStringToBytes_(parts.map(function(part) { return part.text; }).join('')), 'application/octet-stream',
        '.authorcheck-temp-' + Utilities.getUuid() + '.bin'));
      job.tmpId = tmp.getId();
      return CardService.newActionResponseBuilder()
        .setNavigation(CardService.newNavigation().updateCard(_buildDrivePdfContinueCard_(job)))
        .build();
    }
    return _drivePdfRunCheck_(job, parts);
  } catch (err) {
    return _drivePdfErrorResponse_(err);
  }
}

/** Card-Action: zweiter Schritt nach dem Zwischenspeichern (siehe apiCheckDrivePdf). */
function apiCheckDrivePdfContinue(e) {
  var job;
  try {
    job = JSON.parse(e.parameters.job);
    var all = _pdfBytesToBinaryString_(DriveApp.getFileById(job.tmpId).getBlob().getBytes());
    var parts = job.parts.map(function(p) { return { from: p.from, to: p.to, text: all.substr(p.start, p.len) }; });
    all = null;
    return _drivePdfRunCheck_(job, parts);
  } catch (err) {
    return _drivePdfErrorResponse_(err);
  } finally {
    if (job && job.tmpId) { try { DriveApp.getFileById(job.tmpId).setTrashed(true); } catch (trashErr) {} }
  }
}

function _drivePdfErrorResponse_(err) {
  var errCard = CardService.newCardBuilder();
  errCard.setHeader(CardService.newCardHeader().setTitle('Error'));
  errCard.addSection(CardService.newCardSection()
    .addWidget(CardService.newTextParagraph().setText(_escapeCardHtml_(err.message || String(err)))));
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(errCard.build()))
    .build();
}

function _buildDrivePdfContinueCard_(job) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('PDF prepared').setSubtitle(job.fileName));
  var section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph().setText(
    'This PDF (' + _driveMb_(job.fileSize) + ' MB) took a while to prepare' +
    (job.imagesRemoved ? ' (' + job.imagesKept + ' images kept, ' + job.imagesRemoved + ' large images left out)' : '') +
    '. Click <b>Continue check</b> to send it to the AI.'));
  section.addWidget(CardService.newTextButton()
    .setText('Continue check')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('apiCheckDrivePdfContinue')
      .setParameters({ job: JSON.stringify(job) })
      .setLoadIndicator(CardService.LoadIndicator.SPINNER)));
  card.addSection(section);
  return card.build();
}

function _driveGeminiConfig_() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
  if (!apiKey) throw new Error('AI inspection is not configured (Gemini API Key missing).');
  var rawUrl = props.getProperty('GEMINI_API_URL') || 'https://34-111-99-134.nip.io/gemini/v1beta/models/';
  return {
    apiKey: apiKey,
    apiUrl: rawUrl.split(']')[0].replace('[', '').trim(),
    model: (props.getProperty('AI_MODEL') || 'gemini-3.6-flash').trim(),
    temperature: parseFloat(props.getProperty('AI_TEMPERATURE')) || 0.2
  };
}

/**
 * Lädt die PDF und baut sie neu auf (PdfShrink.gs). Bis DRIVE_PDF_MAX_BYTES
 * bleibt alles inkl. aller Bilder erhalten; größere Dateien werden stückweise
 * per Range-Anfrage gelesen und behalten Bilder nur bis DRIVE_PDF_IMAGE_BUDGET
 * (kleine zuerst). Liefert { fileSize, model | text, imagesRemoved, imagesKept }.
 */
function _drivePdfPrepare_(fileId, fileName) {
  var file = DriveApp.getFileById(fileId);
  var fileSize = file.getSize();
  if (fileSize > DRIVE_PDF_SHRINK_MAX_BYTES) {
    throw new Error('The PDF file is too large (' + _driveMb_(fileSize) + ' MB, limit: ' + _driveMb_(DRIVE_PDF_SHRINK_MAX_BYTES) + ' MB). Please split it, e.g. into the pages of one language.');
  }
  if (fileSize <= DRIVE_PDF_MAX_BYTES) {
    var text = _pdfBytesToBinaryString_(file.getBlob().getBytes());
    try {
      var m = pdfRebuild_(_pdfStringReader_(text));
      return { fileSize: fileSize, model: m, imagesRemoved: 0, imagesKept: m.imagesKept };
    } catch (e) {
      // Ungewöhnlich aufgebaute PDF: unverändert und am Stück an Gemini schicken (wie früher).
      Logger.log('_drivePdfPrepare_: Neuaufbau fehlgeschlagen, sende Original: ' + e.message);
      return { fileSize: fileSize, text: text, imagesRemoved: 0, imagesKept: 0 };
    }
  }

  var model;
  try {
    model = pdfRebuild_(_pdfDriveRangeReader_(fileId, fileSize), { imageBudget: DRIVE_PDF_IMAGE_BUDGET });
  } catch (err) {
    Logger.log('_drivePdfPrepare_: Verkleinern fehlgeschlagen: ' + (err.message || err));
    throw new Error('The PDF file is too large (' + _driveMb_(fileSize) + ' MB) and could not be reduced automatically. Please reduce its size (e.g. Acrobat "Reduce File Size") or split it.');
  }
  logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_SHRUNK', fileName + ' - ' + _driveMb_(fileSize) + ' MB -> ' + _driveMb_(model.text.length) +
    ' MB, images kept ' + model.imagesKept + ', removed ' + model.imagesRemoved + ', downloaded ' + _driveMb_(model.bytesRead) + ' MB');
  return { fileSize: fileSize, model: model, imagesRemoved: model.imagesRemoved, imagesKept: model.imagesKept };
}

/** Schickt die Seitenpakete (parallel) an Gemini und zeigt das Ergebnis. */
function _drivePdfRunCheck_(job, parts) {
  var cfg = _driveGeminiConfig_();
  var language = job.language;
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
    (job.imagesRemoved ? 'NOTE: To reduce the file size, some large images were removed from this PDF. Empty areas where images used to be are expected - do not report them.\n\n' : '') +
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

  // Seitenpakete parallel prüfen (eine Add-on-Aktion darf nur ca. 30-45 s laufen).
  var requests = parts.map(function(part) {
    var partPrompt = prompt;
    if (parts.length > 1) {
      partPrompt += '\n\nThis file contains only pages ' + (part.from + 1) + ' to ' + part.to + ' of the original document ' +
        '(the first page in this file is page ' + (part.from + 1) + '). In "location", always use these ORIGINAL page numbers.';
    }
    var call = _buildGeminiRequest_(cfg.apiUrl, cfg.model, cfg.apiKey, {
      contents: [{
        role: 'user',
        parts: [
          { text: partPrompt },
          { inlineData: { mimeType: 'application/pdf', data: Utilities.base64Encode(_pdfBinaryStringToBytes_(part.text)) } }
        ]
      }],
      generationConfig: { temperature: cfg.temperature }
    });
    part.text = null;
    return {
      url: call.url, method: 'post', contentType: 'application/json',
      headers: call.headers, payload: JSON.stringify(call.body), muteHttpExceptions: true
    };
  });
  var responses = requests.length === 1
    ? [_fetchGeminiWithRetry_(requests[0].url, requests[0])]
    : UrlFetchApp.fetchAll(requests);

  var issues = [], seen = {}, failedParts = 0, firstError = null, failedRanges = [];
  responses.forEach(function(res, idx) {
    if (requests.length > 1 && GEMINI_RETRYABLE_CODES.indexOf(res.getResponseCode()) !== -1) {
      res = _fetchGeminiWithRetry_(requests[idx].url, requests[idx], 2);
    }
    try {
      _parseGeminiIssuesResponse_(res, 'AI request failed').forEach(function(issue) {
        var key = issue.original + '\u0000' + issue.suggestion;
        if (seen[key]) return;
        seen[key] = true;
        issues.push(issue);
      });
    } catch (partErr) {
      failedParts++;
      if (!firstError) firstError = partErr;
      failedRanges.push((parts[idx].from + 1) + '-' + parts[idx].to);
      Logger.log('_drivePdfRunCheck_: Seiten ' + (parts[idx].from + 1) + '-' + parts[idx].to + ' fehlgeschlagen: ' + partErr.message);
    }
  });
  if (failedParts === responses.length) throw firstError;

  logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_CHECK_RUN', job.fileName + ' - ' + issues.length + ' issue(s), ' + parts.length + ' part(s)' + (failedParts ? ', failed pages ' + failedRanges.join(',') : ''));

  var resultId = Utilities.getUuid();
  var cachePayload = { fileId: job.fileId, fileName: job.fileName, language: language, issues: issues, fileSize: job.fileSize };
  try {
    CacheService.getUserCache().put(_drivePdfResultCacheKey_(resultId), JSON.stringify(cachePayload), DRIVE_PDF_RESULT_CACHE_TTL);
  } catch (cacheErr) {
    Logger.log('_drivePdfRunCheck_: result cache failed (result possibly too large): ' + cacheErr);
  }

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(_buildDrivePdfResultsCard_(resultId, job.fileName, issues,
      { fileSize: job.fileSize, imagesRemoved: job.imagesRemoved, imagesKept: job.imagesKept, failedRanges: failedRanges })))
    .build();
}

/**
 * Baut die interaktive Ergebnis-Card: Zusammenfassung oben, darunter pro Fund
 * eine Mini-"Issue-Card" mit Original -> Vorschlag, Erklärung.
 *
 * WICHTIG: Es gibt hier bewusst KEINEN "Add Note"-Button (Drive-API-Kommentare).
 * Laut Googles eigener Drive-API-Doku unterstützt die Drive API für Blob-Dateien
 * (u.a. PDFs) grundsätzlich keine verankerten Kommentare, und selbst nicht
 * verankerte Kommentare werden in der PDF-Vorschau von Drive NIE angezeigt (nur
 * über die API abrufbar) - ein Kommentar über die Drive-API wäre also für den
 * Nutzer unsichtbar. Stattdessen gibt es "Open Annotated PDF": das schreibt
 * echte PDF-Annotationsobjekte direkt in eine Kopie der PDF-Bytes (siehe
 * PdfAnnotate.gs) - diese Notizen SIND beim Öffnen der Datei sichtbar, in
 * jedem PDF-Viewer, weil sie Teil des Dateiformats selbst sind, nicht von
 * Drive verwaltete Metadaten. "Export as Sheet" bleibt als tabellarische
 * Alternative bestehen.
 */
// info (optional): { fileSize, imagesRemoved, imagesKept, failedRanges } -
// imagesRemoved > 0 heißt, die PDF wurde für den Check verkleinert (PdfShrink.gs).
function _buildDrivePdfResultsCard_(resultId, fileName, issues, info) {
  info = info || {};
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle(issues.length + ' issue(s) found')
    .setSubtitle(fileName));

  var topSection = CardService.newCardSection();
  if (info.imagesRemoved) {
    topSection.addWidget(CardService.newTextParagraph().setText(
      '<i>This PDF (' + _driveMb_(info.fileSize) + ' MB) was too large to send as is. It was checked with ' + info.imagesKept +
      ' images; ' + info.imagesRemoved + ' large images (e.g. photos) were left out. The text was checked completely.</i>'));
  }
  if (info.failedRanges && info.failedRanges.length) {
    topSection.addWidget(CardService.newTextParagraph().setText(
      '<b>Note:</b> pages ' + _escapeCardHtml_(info.failedRanges.join(', ')) + ' could not be checked (AI request failed). Please run the check again.'));
  }
  if (!issues.length) {
    topSection.addWidget(CardService.newTextParagraph().setText('No errors found for the selected language.'));
    card.addSection(topSection);
    return card.build();
  }

  topSection.addWidget(CardService.newTextButton()
    .setText('Open Annotated PDF')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('apiExportDrivePdfAnnotated')
      .setParameters({ resultId: resultId })
      .setLoadIndicator(CardService.LoadIndicator.SPINNER)));
  topSection.addWidget(CardService.newTextButton()
    .setText('Export as Sheet')
    .setOnClickAction(CardService.newAction().setFunctionName('apiExportDrivePdfResultToSheet').setParameters({ resultId: resultId })));
  topSection.addWidget(CardService.newTextParagraph()
    .setText('<i>"Open Annotated PDF" creates a copy of this file in which each finding is highlighted in yellow directly on the affected words, with a sticky-note comment in the margin next to it (Google Drive itself does not support visible comments on PDFs). Placement is best-effort - if the exact spot can’t be located, the note falls back to the top of its best-guess page; the full original quote is always in the note text either way.' +
      (info.fileSize > DRIVE_PDF_ANNOTATE_MAX_BYTES ? ' For large files like this one it may take a few steps (click "Continue").' : '') + '</i>'));
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
// Teilt die vorbereitete PDF in kompakte Seitenpakete auf, die parallel an
// Gemini gehen (jedes Paket enthält nur Schriften/Bilder seiner Seiten).
// Liefert [{from, to, text}] (Seiten 0-basiert, to exklusiv). Kleine PDFs oder
// PDFs, die sich nicht aufteilen lassen, gehen als ein Paket raus.
// Kleine Pakete = kurze Antwortzeit pro Gemini-Anfrage (alle laufen parallel).
var DRIVE_PDF_PAGES_PER_PART = 6;
var DRIVE_PDF_MAX_PARTS = 25;
function _drivePdfPlanParts_(prep) {
  if (!prep.model) return [{ from: 0, to: 0, text: prep.text }];
  var whole = [{ from: 0, to: 0, text: prep.model.text }];
  var splitter;
  try { splitter = pdfPageSplitter_(prep.model); }
  catch (e) { Logger.log('_drivePdfPlanParts_: nicht aufteilbar: ' + e.message); return whole; }
  var n = splitter.pageCount;
  whole[0].to = n;
  var count = Math.min(Math.ceil(n / DRIVE_PDF_PAGES_PER_PART), DRIVE_PDF_MAX_PARTS);
  if (count <= 1) return whole;
  var per = Math.ceil(n / count), parts = [];
  try {
    for (var from = 0; from < n; from += per) {
      var to = Math.min(n, from + per);
      parts.push({ from: from, to: to, text: splitter.build(from, to) });
    }
  } catch (e2) {
    Logger.log('_drivePdfPlanParts_: Aufteilen fehlgeschlagen: ' + e2.message);
    return whole;
  }
  return parts;
}

function _driveMb_(bytes) {
  return (Math.round(bytes / (1024 * 1024) * 10) / 10).toString();
}

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
 * Card-Action: erzeugt eine ANNOTIERTE KOPIE der PDF (echte, im Viewer sichtbare
 * PDF-Kommentare, siehe PdfAnnotate.gs) und öffnet sie. Nutzt das bereits
 * gecachte Prüfergebnis (kein erneuter Gemini-Call nötig), lädt aber die
 * Original-PDF-Bytes erneut, da diese - anders als das Textergebnis - nicht
 * mit in den Cache passen.
 */
function apiExportDrivePdfAnnotated(e) {
  var started = Date.now();
  try {
    var data = _loadDrivePdfResult_(e.parameters.resultId);
    if (data.fileSize > DRIVE_PDF_ANNOTATE_MAX_BYTES) {
      var r = _driveLargeAnnotatedStart_(data.fileId, data.fileName, data.issues, started);
      if (!r.done) {
        return CardService.newActionResponseBuilder()
          .setNavigation(CardService.newNavigation().pushCard(_buildDrivePdfAnnotateProgressCard_(r.state)))
          .build();
      }
      return CardService.newActionResponseBuilder().setOpenLink(CardService.newOpenLink().setUrl(r.url)).build();
    }
    var pdfUrl = _buildAnnotatedPdfFile_(data.fileId, data.fileName, data.issues);
    return CardService.newActionResponseBuilder()
      .setOpenLink(CardService.newOpenLink().setUrl(pdfUrl))
      .build();
  } catch (err) {
    // Bewusst kein technischer Rohtext (z.B. "compressed object stream") in der
    // Notification, nur eine Zeile plus Alternative - der Grund landet im Log.
    Logger.log('apiExportDrivePdfAnnotated: ' + (err.message || err));
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText(
        'Could not create an annotated PDF for this file (unsupported internal PDF structure). Please use "Export as Sheet" instead.'))
      .build();
  }
}

/**
 * Lädt die Original-PDF-Bytes erneut und sucht pro Fund issue.original im
 * rekonstruierten Seitentext (PdfTextPosition.gs: Schriften inkl. ToUnicode
 * und Zeichenbreiten werden ausgewertet). Bei einem Treffer werden genau die
 * betroffenen Wörter gelb markiert (Highlight-Annotation, eine Box pro
 * Textzeile) und die Sticky-Note sitzt auf Höhe der Stelle im Seitenrand
 * daneben. Wenn keine Textposition gefunden wird (z.B. gescannte Seite ohne
 * Textebene, nicht unterstützter Stream-Filter, oder das Zitat kommt so im
 * Dokument nicht vor), fällt die einzelne Notiz automatisch auf die alte
 * Stapel-oben-links-Platzierung auf der von Gemini genannten Seite zurück
 * (siehe buildAnnotatedPdfBytes_ in PdfAnnotate.gs) - nie ein harter Fehler.
 * Legt das Ergebnis als neue Datei in Drive ab und gibt deren URL zurück.
 * Wirft weiter, wenn die PDF-Struktur selbst nicht auffindbar war (siehe
 * PdfAnnotate.gs) - der Aufrufer fängt das ab.
 */
function _buildAnnotatedPdfFile_(fileId, fileName, issues) {
  var blob = DriveApp.getFileById(fileId).getBlob();
  var bytes = blob.getBytes();
  var text = _pdfBytesToBinaryString_(bytes);

  var rootNum = _pdfFindRootRef_(text);
  var offsets = _pdfScanObjectOffsets_(text);
  var doc = _pdfOpenDoc_(text, offsets);
  var pages = _pdfCollectPages_(text, offsets, rootNum, doc);
  var result = _drivePdfComputeAnnotations_(doc, pages, issues);

  var newBytes = buildAnnotatedPdfBytes_(bytes, result.pageAnnotations);
  var outName = fileName.replace(/\.pdf$/i, '') + ' (annotated).pdf';
  var newBlob = Utilities.newBlob(newBytes, 'application/pdf', outName);
  var file = DriveApp.createFile(newBlob);
  logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_ANNOTATED', fileName + ' - ' + result.count + ' annotation(s), ' + result.positioned + ' precisely positioned -> ' + file.getId());
  return file.getUrl();
}

/**
 * Sucht jeden Fund im Seitentext (PdfTextPosition.gs) und baut daraus die
 * Annotationen pro Seite. doc/pages: siehe _pdfOpenDoc_ / _pdfCollectPages_.
 * Liefert { pageAnnotations, count, positioned }.
 */
function _drivePdfComputeAnnotations_(doc, pages, issues) {
  // Pro Seite wird der Content-Stream nur EINMAL dekomprimiert/interpretiert
  // und dann für alle Funde wiederverwendet (Laufzeit).
  var pageModelCache = {};
  function getPageModel(pageIdx) {
    if (pageIdx in pageModelCache) return pageModelCache[pageIdx];
    var model = null;
    try {
      var glyphs = _pdfExtractPageGlyphs_(doc, pages[pageIdx]);
      if (glyphs && glyphs.length) model = _pdfBuildPageModel_(glyphs);
    } catch (e) {
      Logger.log('_drivePdfComputeAnnotations_: Seite ' + pageIdx + ' - Content-Stream nicht auswertbar: ' + e.message);
    }
    pageModelCache[pageIdx] = model;
    return model;
  }

  var capped = issues.slice(0, PDF_ANNOT_MAX_PER_PDF);
  var pageAnnotations = {};
  var iconsOnPage = {};     // pageIdx -> bereits belegte Icon-Rechtecke
  var occurrenceUsed = {};  // gleiches Zitat mehrfach gemeldet -> nächstes Vorkommen nehmen
  var positioned = 0;

  capped.forEach(function(issue) {
    var guessedPage = _pdfGuessPageIndex_(issue.location);
    if (guessedPage === null || guessedPage < 0 || guessedPage >= pages.length) guessedPage = 0;

    // Erst die von Gemini genannte Seite versuchen, danach alle anderen -
    // der tatsächliche Textinhalt ist zuverlässiger als Geminis Seitenangabe.
    var matchedPage = null, hit = null;
    var searchOrder = [guessedPage];
    for (var p = 0; p < pages.length; p++) { if (p !== guessedPage) searchOrder.push(p); }
    for (var si = 0; si < searchOrder.length && issue.original; si++) {
      var model = getPageModel(searchOrder[si]);
      if (!model) continue;
      var occKey = searchOrder[si] + '|' + String(issue.original).toLowerCase();
      var h = _pdfFindQuoteOnPage_(model, issue.original, occurrenceUsed[occKey] || 0);
      if (h) {
        matchedPage = searchOrder[si];
        hit = h;
        occurrenceUsed[occKey] = (occurrenceUsed[occKey] || 0) + 1;
        break;
      }
    }

    var pageIdx = matchedPage !== null ? matchedPage : guessedPage;

    var typeLabel = (issue.type || 'style').toUpperCase();
    var contents = '[' + typeLabel + ']\n' + issue.original + '\n\n-> ' + issue.suggestion +
      (issue.explanation ? '\n\n' + issue.explanation : '') +
      (issue.location ? '\n\n(AI-reported location: ' + issue.location + ')' : '');
    var ann = { contents: contents, title: 'Author Check (' + typeLabel + ')' };

    if (hit) {
      positioned++;
      ann.highlight = hit.boxes;
      if (!iconsOnPage[pageIdx]) iconsOnPage[pageIdx] = [];
      ann.rect = _pdfPlaceNoteIcon_(pages[pageIdx].mediaBox || [0, 0, 612, 792],
        getPageModel(pageIdx), hit.boxes[0], iconsOnPage[pageIdx]);
    } // sonst: kein rect -> automatischer Stapel-Fallback oben links

    if (!pageAnnotations[pageIdx]) pageAnnotations[pageIdx] = [];
    pageAnnotations[pageIdx].push(ann);
  });

  return { pageAnnotations: pageAnnotations, count: capped.length, positioned: positioned };
}

// ─── ANNOTIERTE KOPIE GROSSER PDFs (über 50 MB) ───────────────────────────
// Apps Script kann Dateien über 50 MB weder komplett laden noch als Ganzes
// speichern. Ein Incremental Update hängt aber nur Daten ans ENDE der
// unveränderten Original-PDF an. Deshalb:
//  1. Positionen der Funde aus der verkleinerten Fassung berechnen (gleiche
//     Objektnummern wie das Original, Bilder werden dafür nicht gebraucht) und
//     daraus den Anhang bauen (pdfAnnotationUpdate_ in PdfAnnotate.gs).
//  2. Das Original stückweise per Range-Anfrage lesen und über die "resumable
//     upload"-Schnittstelle von Drive stückweise als neue Datei hochladen, am
//     Ende den Anhang dazu.
// Reicht die Zeit einer Aktion nicht, wird der Upload in der nächsten Aktion
// fortgesetzt ("Continue"), die Upload-Sitzung bleibt bei Google eine Woche gültig.
var DRIVE_UPLOAD_CHUNK = 16 * 1024 * 1024;     // Vielfaches von 256 KiB (Vorgabe von Drive)
var DRIVE_ACTION_BUDGET_MS = 25000;            // danach Fortsetzung in der nächsten Aktion

function _driveLargeAnnotatedStart_(fileId, fileName, issues, started) {
  var fileSize = DriveApp.getFileById(fileId).getSize();
  var reader = _pdfDriveRangeReader_(fileId, fileSize);
  var model = pdfRebuild_(reader, { imageBudget: 0 });
  var doc = _pdfOpenDoc_(model.text, model.offsets);
  var pages = _pdfCollectPages_(model.text, model.offsets, model.rootNum, doc);
  var result = _drivePdfComputeAnnotations_(doc, pages, issues);

  var appended = pdfAnnotationUpdate_({
    baseLength: fileSize,
    endsWithNewline: reader.read(fileSize - 1, fileSize) === '\n',
    prevXref: model.origStartxref,
    trailerDict: model.origTrailer,
    rootNum: model.rootNum,
    pages: pages,
    maxObjNum: model.maxNum,
    readAnnotsArray: function(num) { return _pdfReadArrayObject_(model.text, model.offsets, num, doc); }
  }, result.pageAnnotations);

  // Der Anhang (wenige KB) wird bis zum Ende des Uploads als Temp-Datei geparkt.
  var tmp = _getOrCreateExportFolder_().createFile(Utilities.newBlob(
    _pdfBinaryStringToBytes_(appended), 'application/octet-stream', '.authorcheck-temp-' + Utilities.getUuid() + '.bin'));

  var total = fileSize + appended.length;
  var outName = fileName.replace(/\.pdf$/i, '') + ' (annotated).pdf';
  var init = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
    method: 'post', contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': 'application/pdf', 'X-Upload-Content-Length': String(total) },
    payload: JSON.stringify({ name: outName, mimeType: 'application/pdf' }),
    muteHttpExceptions: true
  });
  if (init.getResponseCode() !== 200) throw new Error('Drive upload could not be started (HTTP ' + init.getResponseCode() + ').');
  var hdrs = init.getHeaders();
  var sessionUri = hdrs.Location || hdrs.location;
  if (!sessionUri) throw new Error('Drive upload could not be started (no session).');

  var state = { srcId: fileId, fileName: fileName, fileSize: fileSize, total: total, offset: 0,
                session: sessionUri, tmpId: tmp.getId(), count: result.count, positioned: result.positioned };
  return _driveLargeAnnotatedContinue_(state, started);
}

/**
 * Lädt weitere Stücke hoch, bis fertig oder das Zeitbudget der Aktion erreicht
 * ist. Liefert { done: true, url } oder { done: false, state }.
 */
function _driveLargeAnnotatedContinue_(state, started) {
  var token = ScriptApp.getOAuthToken();
  var srcUrl = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(state.srcId) + '?alt=media&supportsAllDrives=true';
  var appended = null;

  while (state.offset < state.total) {
    if (Date.now() - started > DRIVE_ACTION_BUDGET_MS) return { done: false, state: state };
    var end = Math.min(state.total, state.offset + DRIVE_UPLOAD_CHUNK);
    var chunk = [];
    if (state.offset < state.fileSize) {
      var srcEnd = Math.min(end, state.fileSize);
      var dl = UrlFetchApp.fetch(srcUrl, {
        headers: { Authorization: 'Bearer ' + token, Range: 'bytes=' + state.offset + '-' + (srcEnd - 1) },
        muteHttpExceptions: true
      });
      if (dl.getResponseCode() !== 206) throw new Error('Drive download failed (HTTP ' + dl.getResponseCode() + ').');
      chunk = dl.getContent();
      if (chunk.length !== srcEnd - state.offset) throw new Error('Drive download returned an unexpected length.');
    }
    if (end > state.fileSize) {
      if (!appended) appended = DriveApp.getFileById(state.tmpId).getBlob().getBytes();
      var from = Math.max(0, state.offset - state.fileSize);
      chunk = chunk.concat(appended.slice(from, end - state.fileSize));
    }
    var up = UrlFetchApp.fetch(state.session, {
      method: 'put', contentType: 'application/pdf', payload: chunk,
      headers: { 'Content-Range': 'bytes ' + state.offset + '-' + (end - 1) + '/' + state.total },
      muteHttpExceptions: true
    });
    var code = up.getResponseCode();
    if (code === 200 || code === 201) {
      var fileId = JSON.parse(up.getContentText()).id;
      try { DriveApp.getFileById(state.tmpId).setTrashed(true); } catch (trashErr) {}
      logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_ANNOTATED', state.fileName + ' - ' + state.count + ' annotation(s), ' +
        state.positioned + ' precisely positioned, ' + _driveMb_(state.total) + ' MB (streamed) -> ' + fileId);
      return { done: true, url: 'https://drive.google.com/file/d/' + fileId + '/view' };
    }
    if (code !== 308) throw new Error('Drive upload failed (HTTP ' + code + ').');
    // Drive meldet, bis wohin es angekommen ist ("Range: bytes=0-N").
    var h = up.getHeaders(), range = h.Range || h.range;
    var rm = range ? /bytes=0-(\d+)/.exec(range) : null;
    state.offset = rm ? parseInt(rm[1], 10) + 1 : end;
  }
  throw new Error('Drive upload ended without a file.');
}

function _buildDrivePdfAnnotateProgressCard_(state) {
  var pct = Math.floor(state.offset / state.total * 100);
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('Creating annotated PDF').setSubtitle(state.fileName));
  var section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph().setText(
    'This PDF is large (' + _driveMb_(state.fileSize) + ' MB), so the annotated copy is written in several steps. ' +
    'Progress: <b>' + pct + ' %</b>. Click <b>Continue</b> to go on.'));
  section.addWidget(CardService.newTextButton()
    .setText('Continue')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('apiExportDrivePdfAnnotatedContinue')
      .setParameters({ state: JSON.stringify(state) })
      .setLoadIndicator(CardService.LoadIndicator.SPINNER)));
  card.addSection(section);
  return card.build();
}

function _buildDrivePdfAnnotatedDoneCard_(fileName, url) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('Annotated PDF ready').setSubtitle(fileName));
  card.addSection(CardService.newCardSection().addWidget(CardService.newTextButton()
    .setText('Open Annotated PDF')
    .setOpenLink(CardService.newOpenLink().setUrl(url))));
  return card.build();
}

/** Card-Action: setzt den Upload einer großen annotierten PDF fort. */
function apiExportDrivePdfAnnotatedContinue(e) {
  var started = Date.now();
  try {
    var state = JSON.parse(e.parameters.state);
    var r = _driveLargeAnnotatedContinue_(state, started);
    var nav = CardService.newNavigation().updateCard(r.done
      ? _buildDrivePdfAnnotatedDoneCard_(state.fileName, r.url)
      : _buildDrivePdfAnnotateProgressCard_(r.state));
    return CardService.newActionResponseBuilder().setNavigation(nav).build();
  } catch (err) {
    Logger.log('apiExportDrivePdfAnnotatedContinue: ' + (err.message || err));
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification().setText('Could not create the annotated PDF: ' + (err.message || err)))
      .build();
  }
}

/**
 * Platziert das Sticky-Note-Icon im Seitenrand auf Höhe der ersten markierten
 * Zeile (im breiteren Rand neben dem Textblock), damit es keinen Text
 * verdeckt. Ist die Stelle schon durch ein anderes Icon belegt, wird der
 * gegenüberliegende Rand genommen, danach schrittweise tiefer.
 */
function _pdfPlaceNoteIcon_(mediaBox, model, lineBox, placed) {
  var size = 20, gap = 4, edge = 2;
  var yMid = (lineBox[1] + lineBox[3]) / 2;
  var y = Math.min(mediaBox[3] - size - edge, Math.max(mediaBox[1] + edge, yMid - size / 2));
  var leftX = Math.max(mediaBox[0] + edge, model.textLeft - size - gap);
  var rightX = Math.min(mediaBox[2] - size - edge, model.textRight + gap);
  // Linker Rand bevorzugt; ist er zu schmal (oder schon belegt), der rechte.
  var columns = (model.textLeft - mediaBox[0] >= mediaBox[2] - model.textRight) ? [leftX, rightX] : [rightX, leftX];

  function overlaps(r) {
    return placed.some(function(o) { return r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]; });
  }
  var rect = null;
  // Beide Ränder auf Zeilenhöhe probieren, danach schrittweise tiefer.
  for (var row = 0; row < 20 && !rect; row++) {
    var ry = Math.max(mediaBox[1] + edge, y - row * (size + 2));
    for (var c = 0; c < columns.length && !rect; c++) {
      var cand = [columns[c], ry, columns[c] + size, ry + size];
      if (!overlaps(cand)) rect = cand;
    }
  }
  if (!rect) rect = [columns[0], y, columns[0] + size, y + size];
  placed.push(rect);
  return rect;
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
  sheet.getRange(2, numCols, numRows - 1, 1).setWrap(true);
  sheet.autoResizeColumns(1, numCols - 1);
  sheet.setColumnWidth(numCols, 350);

  return ss.getUrl();
}
