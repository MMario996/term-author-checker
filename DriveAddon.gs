// ============================================================================
// DRIVE ADD-ON - PDF-Check (Grammatik/Terminologie/Stil, wie Author Check in
// Docs/Sheets/Slides). Ergebnis-Ausgabe nur als Sheet-Export, da Drive für PDFs
// keine sichtbaren Kommentare unterstützt (siehe _buildDrivePdfResultsCard_).
// ============================================================================
var DRIVE_PDF_MAX_BYTES = 15 * 1024 * 1024; // Sicherheitsgrenze, ca. 15 MB (Gemini-Anfrage max. ~20 MB)
// Größere PDFs werden vor dem Check ohne Bilder neu aufgebaut (PdfShrink.gs);
// bis zu dieser Dateigröße wird das versucht.
var DRIVE_PDF_SHRINK_MAX_BYTES = 300 * 1024 * 1024;
// Apps Script kann Dateien nur bis 50 MB als Ganzes laden - darüber gibt es
// keine annotierte Kopie (dafür müsste die Original-PDF inkl. Bildern geladen werden).
var DRIVE_PDF_ANNOTATE_MAX_BYTES = 50 * 1024 * 1024;
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
  var fileId = e.parameters.fileId;
  var fileName = e.parameters.fileName || 'PDF';
  var language = (e.formInput && e.formInput.language) || 'de';

  try {
    try { PropertiesService.getUserProperties().setProperty(DRIVE_PDF_LAST_LANG_KEY, language); } catch (propErr) {}
    var props = PropertiesService.getScriptProperties();
    var apiKey = (props.getProperty('GEMINI_API_KEY') || '').trim();
    if (!apiKey) throw new Error('AI inspection is not configured (Gemini API Key missing).');

    var file = DriveApp.getFileById(fileId);
    var fileSize = file.getSize();
    var pdfText, imagesRemoved = null; // pdfText: PDF als Binärstring (1 Zeichen = 1 Byte)
    if (fileSize <= DRIVE_PDF_MAX_BYTES) {
      pdfText = _pdfBytesToBinaryString_(file.getBlob().getBytes());
    } else {
      // Zu groß für Gemini: Kopie ohne Bilder bauen (nur für den Check, wird nicht gespeichert).
      if (fileSize > DRIVE_PDF_SHRINK_MAX_BYTES) {
        throw new Error('The PDF file is too large (' + _driveMb_(fileSize) + ' MB, limit: ' + _driveMb_(DRIVE_PDF_SHRINK_MAX_BYTES) + ' MB). Please split it, e.g. into the pages of one language.');
      }
      var shrunk;
      try {
        shrunk = shrinkPdfForCheck_(_pdfDriveRangeReader_(fileId, fileSize));
      } catch (shrinkErr) {
        Logger.log('apiCheckDrivePdf: Verkleinern fehlgeschlagen: ' + (shrinkErr.message || shrinkErr));
        throw new Error('The PDF file is too large (' + _driveMb_(fileSize) + ' MB) and could not be reduced automatically. Please reduce its size (e.g. Acrobat "Reduce File Size") or split it.');
      }
      if (shrunk.text.length > DRIVE_PDF_MAX_BYTES) {
        throw new Error('Even without images the PDF is ' + _driveMb_(shrunk.text.length) + ' MB (limit: ' + _driveMb_(DRIVE_PDF_MAX_BYTES) + ' MB). Please split it, e.g. into the pages of one language.');
      }
      pdfText = shrunk.text;
      imagesRemoved = shrunk.imagesRemoved;
      logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_SHRUNK', fileName + ' - ' + _driveMb_(fileSize) + ' MB -> ' + _driveMb_(shrunk.text.length) + ' MB, ' + imagesRemoved + ' image(s) removed');
    }

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
      (imagesRemoved !== null ? 'NOTE: To reduce the file size, all images were removed from this PDF. Empty areas where images used to be are expected - do not report them; check only the text.\n\n' : '') +
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

    // Seitenpakete parallel prüfen (eine Add-on-Aktion darf nur ca. 30 s laufen).
    var parts = _drivePdfPlanParts_(pdfText);
    pdfText = null;
    var requests = parts.map(function(part) {
      var partPrompt = prompt;
      if (parts.length > 1) {
        partPrompt += '\n\nThis file contains only pages ' + (part.from + 1) + ' to ' + part.to + ' of the original document ' +
          '(the first page in this file is page ' + (part.from + 1) + '). In "location", always use these ORIGINAL page numbers.';
      }
      var call = _buildGeminiRequest_(apiUrl, model, apiKey, {
        contents: [{
          role: 'user',
          parts: [
            { text: partPrompt },
            { inlineData: { mimeType: 'application/pdf', data: Utilities.base64Encode(_pdfBinaryStringToBytes_(part.text)) } }
          ]
        }],
        generationConfig: { temperature: temperature }
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
        Logger.log('apiCheckDrivePdf: Seiten ' + (parts[idx].from + 1) + '-' + parts[idx].to + ' fehlgeschlagen: ' + partErr.message);
      }
    });
    if (failedParts === responses.length) throw firstError;

    logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_CHECK_RUN', fileName + ' - ' + issues.length + ' issue(s), ' + parts.length + ' part(s)' + (failedParts ? ', failed pages ' + failedRanges.join(',') : ''));

    var resultId = Utilities.getUuid();
    var cachePayload = { fileId: fileId, fileName: fileName, language: language, issues: issues, fileSize: fileSize };
    try {
      CacheService.getUserCache().put(_drivePdfResultCacheKey_(resultId), JSON.stringify(cachePayload), DRIVE_PDF_RESULT_CACHE_TTL);
    } catch (cacheErr) {
      Logger.log('apiCheckDrivePdf: result cache failed (result possibly too large): ' + cacheErr);
    }

    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(_buildDrivePdfResultsCard_(resultId, fileName, issues, { fileSize: fileSize, imagesRemoved: imagesRemoved, failedRanges: failedRanges })))
      .build();

  } catch (err) {
    var errCard = CardService.newCardBuilder();
    errCard.setHeader(CardService.newCardHeader().setTitle('Error'));
    errCard.addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText(_escapeCardHtml_(err.message || String(err)))));
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().updateCard(errCard.build()))
      .build();
  }
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
// info (optional): { fileSize, imagesRemoved } - imagesRemoved !== null heißt,
// die PDF wurde für den Check ohne Bilder neu aufgebaut (PdfShrink.gs).
function _buildDrivePdfResultsCard_(resultId, fileName, issues, info) {
  info = info || {};
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader()
    .setTitle(issues.length + ' issue(s) found')
    .setSubtitle(fileName));

  var topSection = CardService.newCardSection();
  if (info.imagesRemoved !== null && info.imagesRemoved !== undefined) {
    topSection.addWidget(CardService.newTextParagraph().setText(
      '<i>This PDF (' + _driveMb_(info.fileSize) + ' MB) was too large to send as is, so it was checked without its images (' +
      info.imagesRemoved + ' removed). The text was checked completely.</i>'));
  }
  if (info.failedRanges && info.failedRanges.length) {
    topSection.addWidget(CardService.newTextParagraph().setText(
      '<b>Note:</b> pages ' + _escapeCardHtml_(info.failedRanges.join(', ')) + ' could not be checked (AI request failed). Please run the check again.'));
  }
  var canAnnotate = !(info.fileSize > DRIVE_PDF_ANNOTATE_MAX_BYTES);
  if (!issues.length) {
    topSection.addWidget(CardService.newTextParagraph().setText('No errors found for the selected language.'));
    card.addSection(topSection);
    return card.build();
  }

  if (canAnnotate) {
    topSection.addWidget(CardService.newTextButton()
      .setText('Open Annotated PDF')
      .setOnClickAction(CardService.newAction()
        .setFunctionName('apiExportDrivePdfAnnotated')
        .setParameters({ resultId: resultId })
        .setLoadIndicator(CardService.LoadIndicator.SPINNER)));
  }
  topSection.addWidget(CardService.newTextButton()
    .setText('Export as Sheet')
    .setOnClickAction(CardService.newAction().setFunctionName('apiExportDrivePdfResultToSheet').setParameters({ resultId: resultId })));
  topSection.addWidget(CardService.newTextParagraph()
    .setText(!canAnnotate
      ? '<i>An annotated PDF is not available for files over ' + _driveMb_(DRIVE_PDF_ANNOTATE_MAX_BYTES) + ' MB. Please use "Export as Sheet".</i>'
      : '<i>"Open Annotated PDF" creates a copy of this file in which each finding is highlighted in yellow directly on the affected words, with a sticky-note comment in the margin next to it (Google Drive itself does not support visible comments on PDFs). Placement is best-effort - if the exact spot can’t be located, the note falls back to the top of its best-guess page; the full original quote is always in the note text either way.</i>'));
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
// Teilt die PDF in Seitenpakete auf, die parallel an Gemini gehen. Liefert
// [{from, to, text}] (Seiten 0-basiert, to exklusiv). Kleine PDFs oder PDFs, die
// sich nicht aufteilen lassen, gehen unverändert als ein Paket raus.
var DRIVE_PDF_PAGES_PER_PART = 15;
var DRIVE_PDF_MAX_PARTS = 10;
var DRIVE_PDF_MAX_TOTAL_PAYLOAD = 60 * 1024 * 1024; // Summe aller Pakete (Speicher)
function _drivePdfPlanParts_(pdfText) {
  var whole = [{ from: 0, to: 0, text: pdfText }];
  var splitter;
  try { splitter = pdfPageSplitter_(pdfText); }
  catch (e) { Logger.log('_drivePdfPlanParts_: nicht aufteilbar: ' + e.message); return whole; }
  var n = splitter.pageCount;
  whole[0].to = n;
  var count = Math.min(Math.ceil(n / DRIVE_PDF_PAGES_PER_PART), DRIVE_PDF_MAX_PARTS,
                       Math.max(1, Math.floor(DRIVE_PDF_MAX_TOTAL_PAYLOAD / pdfText.length)));
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
  try {
    var data = _loadDrivePdfResult_(e.parameters.resultId);
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
      Logger.log('_buildAnnotatedPdfFile_: Seite ' + pageIdx + ' - Content-Stream nicht auswertbar: ' + e.message);
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

  var newBytes = buildAnnotatedPdfBytes_(bytes, pageAnnotations);
  var outName = fileName.replace(/\.pdf$/i, '') + ' (annotated).pdf';
  var newBlob = Utilities.newBlob(newBytes, 'application/pdf', outName);
  var file = DriveApp.createFile(newBlob);
  logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_ANNOTATED', fileName + ' - ' + capped.length + ' annotation(s), ' + positioned + ' precisely positioned -> ' + file.getId());
  return file.getUrl();
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
