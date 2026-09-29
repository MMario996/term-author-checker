// ============================================================================
// DRIVE-PDF-CHECK IM EIGENEN FENSTER (Web-App-Seite PdfCheck.html)
// ----------------------------------------------------------------------------
// Karten im Drive-Seitenbereich koennen keine Aktion selbst ausloesen - jede
// Etappe brauchte dort einen Klick auf "Weiter". Die Drive-Karte oeffnet deshalb
// dieses Fenster (Web-App, ?page=pdfcheck). Dort ruft JavaScript die Etappen
// automatisch nacheinander auf; jeder Aufruf darf bis zu 6 Minuten laufen (statt
// 30 s), es sind also auch viel weniger Etappen noetig. Der Prüfkern ist derselbe
// wie im Seitenbereich (_drivePdfAdvance_ / _drivePdfCheckStep_), nur mit
// groesserem Zeitbudget (_drivePdfLimits_(true)).
//
// Voraussetzung: Web-App mit "Ausfuehren als: Nutzer, der zugreift" und Zugriff
// fuer die Domain (appsscript.json). Die URL kommt aus der Skripteigenschaft
// WEBAPP_URL (…/exec der Bereitstellung), sonst aus ScriptApp.getService().
// ============================================================================

var DRIVE_PDF_WEB_ANNOTATE_BUDGET_MS = 200000; // kommentierte PDF: Upload-Stuecke bis ca. 3,3 min pro Aufruf

// URL der Web-App (…/exec) oder '' - dann bleibt es bei der Pruefung im Seitenbereich.
// Bewusst NUR aus der Skripteigenschaft WEBAPP_URL: ScriptApp.getService().getUrl()
// lieferte im Add-on die Adresse einer Bereitstellung ohne Web-App-Zugang, das
// Fenster zeigte dann Googles 404-Seite ("Sorry, unable to open the file").
function _drivePdfWebAppUrl_() {
  // Ein versehentlich mitkopierter Zusatz (?page=pdfcheck, #...) wird abgeschnitten.
  var url = String(PropertiesService.getScriptProperties().getProperty('WEBAPP_URL') || '').trim().replace(/[?#].*$/, '');
  // Nur eine veroeffentlichte Bereitstellung (/exec) taugt fuer alle Nutzer.
  return /^https:\/\/script\.google\.com\/.+\/exec$/.test(url) ? url : '';
}

// Zum Pruefen der Einrichtung im Skript-Editor ausfuehren (Protokoll ansehen).
function checkPdfWindowSetup() {
  var raw = PropertiesService.getScriptProperties().getProperty('WEBAPP_URL');
  var url = _drivePdfWebAppUrl_();
  Logger.log('WEBAPP_URL (Skripteigenschaft): ' + (raw || '(nicht gesetzt)'));
  Logger.log(url ? 'OK: Das PDF-Fenster wird mit dieser Adresse geoeffnet. Test im Browser: ' + url + '?page=pdfcheck'
                 : 'Nicht nutzbar - die Drive-Pruefung laeuft im Seitenbereich (mit "Weiter"). Wert muss eine .../exec-Adresse einer Web-App-Bereitstellung sein.');
}

// Card-Action "PDF prüfen": oeffnet das PDF-Fenster. Ohne Web-App-URL: wie
// bisher schrittweise im Seitenbereich.
function apiOpenDrivePdfWindow(e) {
  var base = _drivePdfWebAppUrl_();
  if (!base) return apiCheckDrivePdf(e);
  var language = (e.formInput && e.formInput.language) || 'de';
  try { PropertiesService.getUserProperties().setProperty(DRIVE_PDF_LAST_LANG_KEY, language); } catch (propErr) {}
  var url = base + '?page=pdfcheck&fileId=' + encodeURIComponent(e.parameters.fileId) + '&lang=' + encodeURIComponent(language);
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(url)
      .setOpenAs(CardService.OpenAs.OVERLAY)
      // Nach dem Schliessen laedt der Seitenbereich neu und bietet "Letztes Ergebnis" an.
      .setOnClose(CardService.OnClose.RELOAD))
    .build();
}

// Aus doGet (Code.gs): Seite fuer ?page=pdfcheck ausliefern.
function _renderPdfCheckPage_(e) {
  var p = (e && e.parameter) || {};
  var lang = DRIVE_PDF_LANGUAGES.some(function(pair) { return pair[0] === p.lang; }) ? p.lang : 'de';
  var tpl = HtmlService.createTemplateFromFile('PdfCheck');
  tpl.uiLang = getUiLangPref_();
  tpl.fileId = String(p.fileId || '');
  tpl.checkLang = lang;
  tpl.checkLangName = _ctLangName_(lang, _drivePdfLanguageName_(lang));
  tpl.texts = _drivePdfWebTexts_();
  return tpl.evaluate()
    .setTitle('Kärcher TermCheck – PDF')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Alle Kartentexte in der UI-Sprache (englische Texte als Fallback).
function _drivePdfWebTexts_() {
  var lang = 'en';
  try { lang = getUiLangPref_(); } catch (e) {}
  var out = {};
  var en = CARD_I18N.en, cur = CARD_I18N[lang] || {};
  for (var k in en) if (en.hasOwnProperty(k)) out[k] = cur.hasOwnProperty(k) ? cur[k] : en[k];
  return out;
}

// Status fuer die Seite: Fortschritt oder fertiges Ergebnis.
function _drivePdfWebStatus_(job, status) {
  var out = { stateId: job.stateId || null, fileName: job.fileName, phase: job.phase, done: !!status.done };
  if (status.done) {
    out.result = {
      resultId: status.resultId, issues: job.issues,
      info: { fileSize: job.fileSize, imagesRemoved: job.imagesRemoved, imagesKept: job.imagesKept,
              failedRanges: job.failedRanges, annotateSteps: job.fileSize > DRIVE_PDF_ANNOTATE_MAX_BYTES }
    };
    return out;
  }
  if (job.phase === 'check') {
    var parts = job.parts || [];
    out.pagesTotal = parts.length ? parts[parts.length - 1].to : 0;
    out.pagesDone = job.next > 0 ? parts[job.next - 1].to : 0;
    out.partsTotal = parts.length;
    out.partsDone = job.next;
    out.issuesSoFar = job.issues.length;
    // 0-100 fuer den Balken: Vorbereitung zaehlt 30 %, die Pruefung 70 %.
    out.pct = 30 + Math.round(70 * job.next / Math.max(1, parts.length));
  } else {
    out.pct = Math.round(30 * _drivePdfPrepPercent_(job) / 100);
  }
  out.fileMb = _driveMb_(job.fileSize);
  return out;
}

/** Seite: Pruefung starten (erster Aufruf). */
function apiPdfWebStart(fileId, language) {
  var started = Date.now();
  if (!fileId) throw new Error('No file selected.');
  if (!DRIVE_PDF_LANGUAGES.some(function(pair) { return pair[0] === language; })) language = 'de';
  _driveGeminiConfig_(); // bricht früh ab, wenn kein API-Key konfiguriert ist
  var job = _drivePdfNewJob_(fileId, DriveApp.getFileById(fileId).getName(), language);
  return _drivePdfWebStatus_(job, _drivePdfAdvance_(job, started, _drivePdfLimits_(true)));
}

/** Seite: naechste Etappe(n). */
function apiPdfWebContinue(stateId) {
  var started = Date.now();
  var job = _drivePdfLoadJob_(stateId);
  return _drivePdfWebStatus_(job, _drivePdfContinue_(job, started, _drivePdfLimits_(true)));
}

/** Seite: Name der Datei fuer die Anzeige (vor dem Start). */
function apiPdfWebFileInfo(fileId) {
  var file = DriveApp.getFileById(fileId);
  return { name: file.getName(), mb: _driveMb_(file.getSize()), isPdf: file.getMimeType() === 'application/pdf' };
}

/** Seite: Ergebnis als Google Sheet. */
function apiPdfWebExportSheet(resultId) {
  var data = _loadDrivePdfResult_(resultId);
  return _buildDrivePdfReportSheet_(data.issues, data.fileName, data.language);
}

/**
 * Seite: kommentierte PDF erzeugen. Kleine Dateien in einem Aufruf, grosse
 * stueckweise ({ done: false, state, pct } -> apiPdfWebAnnotateContinue).
 */
function apiPdfWebAnnotate(resultId) {
  var started = Date.now();
  var data = _loadDrivePdfResult_(resultId);
  try {
    if (data.fileSize > DRIVE_PDF_ANNOTATE_MAX_BYTES) {
      return _drivePdfWebAnnotateStatus_(_driveLargeAnnotatedStart_(data.fileId, data.fileName, data.issues, started, DRIVE_PDF_WEB_ANNOTATE_BUDGET_MS));
    }
    return { done: true, url: _buildAnnotatedPdfFile_(data.fileId, data.fileName, data.issues) };
  } catch (err) {
    Logger.log('apiPdfWebAnnotate: ' + (err.message || err));
    throw new Error(_ct_('d.annotFailed'));
  }
}

function apiPdfWebAnnotateContinue(stateJson) {
  var started = Date.now();
  try {
    return _drivePdfWebAnnotateStatus_(_driveLargeAnnotatedContinue_(JSON.parse(stateJson), started, DRIVE_PDF_WEB_ANNOTATE_BUDGET_MS));
  } catch (err) {
    Logger.log('apiPdfWebAnnotateContinue: ' + (err.message || err));
    throw new Error(_ct_('d.annotContinueFailed', { msg: err.message || err }));
  }
}

function _drivePdfWebAnnotateStatus_(r) {
  if (r.done) return { done: true, url: r.url };
  return { done: false, state: JSON.stringify(r.state), pct: Math.floor(r.state.offset / r.state.total * 100) };
}
