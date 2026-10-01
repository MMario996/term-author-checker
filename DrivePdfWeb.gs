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
      // Eigener, voller Tab statt kleinem Overlay-Fenster: Verlauf, Filter und
      // Fehlerliste haben so genug Platz. Das Ergebnis bietet der Seitenbereich
      // beim naechsten Oeffnen der Datei unter "Letzte Pruefung" an.
      .setOpenAs(CardService.OpenAs.FULL_SIZE))
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
  var out = { stateId: job.stateId || null, fileName: job.fileName, phase: job.phase, done: !!status.done,
              timeline: job.tl || {}, checkLog: job.checkLog || [] };
  var parts = job.parts || [];
  if (job.phase === 'check' || status.done) {
    out.pagesTotal = parts.length ? parts[parts.length - 1].to : 0;
    out.partsTotal = parts.length;
  }
  if (status.done) {
    out.result = {
      resultId: status.resultId, issues: job.issues, docResult: job.docResult || null,
      info: { fileSize: job.fileSize, imagesRemoved: job.imagesRemoved, imagesKept: job.imagesKept,
              failedRanges: job.failedRanges, annotateSteps: job.fileSize > DRIVE_PDF_ANNOTATE_MAX_BYTES,
              pagesTotal: out.pagesTotal, partsTotal: out.partsTotal }
    };
    return out;
  }
  if (job.phase === 'check') {
    out.pagesDone = job.next > 0 ? parts[job.next - 1].to : 0;
    out.partsDone = job.next;
    out.issuesSoFar = job.issues.length;
    // Seiten fertig, jetzt die Gesamtdokument-Prompts (DocPrompts.gs).
    if (job.docPhase) out.docPrompts = (job.docPrompts || []).length;
    // 0-100 fuer den Balken: Vorbereitung zaehlt 30 %, die Pruefung 70 %.
    out.pct = 30 + Math.round(70 * job.next / Math.max(1, parts.length));
  } else {
    out.pct = Math.round(30 * _drivePdfPrepPercent_(job) / 100);
  }
  out.fileMb = _driveMb_(job.fileSize);
  out.etaSec = _drivePdfWebEta_(job);
  out.step = job.phase === 'check' ? 2 : 1;
  return out;
}

// ─── RESTZEIT-SCHAETZUNG ───────────────────────────────────────────────────
// Aus den gemessenen Dauern der bisherigen Einheiten/Etappen (job.prep.ms,
// job.lastBatchMs) plus Erfahrungswerten fuer das, was noch nicht gemessen ist.
// Bewusst grob ("ca."): die Antwortzeit von Gemini schwankt.
var DRIVE_PDF_WEB_BATCH_MS_DEFAULT = 15000;   // eine Pruef-Etappe (bis 8 Pakete parallel)
var DRIVE_PDF_WEB_DOC_MS_DEFAULT = 120000;    // Gesamtdokument-Prompts (eine Anfrage ueber die ganze PDF)
var DRIVE_PDF_WEB_CALL_OVERHEAD = 0.08;       // Laden/Speichern des Zwischenstands pro Aufruf

// Anzahl Seitenpakete: bekannt ab dem Aufteilen, vorher grob aus der Dateigroesse.
function _drivePdfEstParts_(job) {
  if (job.phase === 'check') return (job.parts || []).length;
  var sp = job.prep && job.prep.split;
  if (sp) return Math.max(1, Math.ceil(sp.n / Math.max(1, sp.per)));
  return Math.min(DRIVE_PDF_MAX_PARTS, Math.max(1, Math.round(job.fileSize / (2 * 1024 * 1024))));
}

function _drivePdfWebEta_(job) {
  var prep = job.prep || {}, m = prep.ms || {}, D = DRIVE_PREP_DEFAULT_MS;
  var order = ['plan', 'fetch', 'full', 'assemble', 'split', 'check'];
  var idx = order.indexOf(job.phase || 'check');
  var ms = 0;
  if (idx <= 0) ms += m.plan || D.plan;
  if (idx <= 1) {
    var ranges = prep.plan && prep.plan.ranges;
    var fetchUnits = ranges
      ? Math.ceil(Math.max(0, ranges.length - (prep.nextRange || 0)) / (prep.fetchBatch || DRIVE_PREP_FETCH_BATCH))
      : Math.max(1, Math.ceil(job.fileSize / (40 * 1024 * 1024)));
    ms += fetchUnits * (m.fetch || D.fetch);
  }
  if (idx <= 2) {
    var fullUnits = 1;
    if (prep.fullNeeded) {
      var rem = 0;
      for (var i = prep.fullNext || 0; i < prep.fullNeeded.length; i++) rem += prep.fullNeeded[i][2] - prep.fullNeeded[i][1];
      fullUnits = Math.ceil(rem / (prep.fullBatchBytes || DRIVE_PREP_FULL_BATCH_BYTES));
    }
    ms += fullUnits * (m.full || D.full);
  }
  if (idx <= 3) ms += m.assemble || D.assemble;
  var parts = _drivePdfEstParts_(job);
  if (idx <= 4) ms += Math.max(0, parts - ((prep.split && prep.split.next) ? Math.ceil(prep.split.next / prep.split.per) : 0)) * (m.split || D.split);
  var partsLeft = Math.max(0, parts - (idx === 5 ? (job.next || 0) : 0));
  ms += Math.ceil(partsLeft / (job.batch || DRIVE_PDF_BATCH_PARTS)) * (job.lastBatchWallMs || job.lastBatchMs || DRIVE_PDF_WEB_BATCH_MS_DEFAULT);
  if (job.docPrompts && job.docPrompts.length && !job.docReports) ms += DRIVE_PDF_WEB_DOC_MS_DEFAULT;
  return Math.round(ms * (1 + DRIVE_PDF_WEB_CALL_OVERHEAD) / 1000);
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
  var size = file.getSize();
  // Erste grobe Restzeit, bevor die erste Etappe zurueckkommt.
  var eta = _drivePdfWebEta_({ phase: 'plan', prep: {}, parts: [], fileSize: size, batch: DRIVE_PDF_BATCH_PARTS });
  return { name: file.getName(), mb: _driveMb_(size), isPdf: file.getMimeType() === 'application/pdf', etaSec: eta };
}

// Export nur fuer die im Fenster angehakten Kategorien (types: z. B.
// ['terminology', 'style']). Ohne Auswahl (null) alle Fehler.
function _drivePdfFilterIssues_(issues, types) {
  if (!Array.isArray(types)) return issues;
  return (issues || []).filter(function(issue) {
    var type = (issue.type === 'terminology' || issue.type === 'grammar') ? issue.type : 'style';
    return types.indexOf(type) !== -1;
  });
}

/** Seite: Ergebnis als Google Sheet (optional nur ausgewaehlte Kategorien). */
function apiPdfWebExportSheet(resultId, types) {
  var data = _loadDrivePdfResult_(resultId);
  return _buildDrivePdfReportSheet_(_drivePdfFilterIssues_(data.issues, types), data.fileName, data.language);
}

/**
 * Seite: kommentierte PDF erzeugen. Kleine Dateien in einem Aufruf, grosse
 * stueckweise ({ done: false, state, pct } -> apiPdfWebAnnotateContinue).
 */
function apiPdfWebAnnotate(resultId, types) {
  var started = Date.now();
  var data = _loadDrivePdfResult_(resultId);
  data.issues = _drivePdfFilterIssues_(data.issues, types);
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
