// ============================================================================
// DRIVE-PDF-CHECK: ETAPPENWEISE VORBEREITUNG
// ----------------------------------------------------------------------------
// Eine Add-on-Aktion wird nach ca. 30 s hart abgebrochen. Frueher lief die
// komplette Vorbereitung (grosse PDF verkleinern, neu aufbauen, in Seitenpakete
// teilen, Zwischendatei schreiben) in EINER Aktion - bei einer 68-MB-Anleitung
// dauerte allein das Verkleinern ~30 s, die Aktion brach ab, bevor ueberhaupt ein
// "Weiter"-Button erscheinen konnte.
//
// Jetzt ist die Vorbereitung in Einheiten zerlegt, die einzeln gemessen werden:
//   plan      Cross-Reference lesen, Lesebereiche planen            (_pdfShrinkPlan_)
//   fetch     Lesebereiche laden und einordnen, je 64 parallel      (_pdfShrinkClassify_)
//             danach Bilder auswaehlen                              (_pdfShrinkSelectImages_)
//   full      grosse, benoetigte Objekte komplett nachladen
//   assemble  neue PDF schreiben                                    (_pdfShrinkFinish_)
//   split     Seitenpakete fuer die parallele Gemini-Pruefung bauen (pdfPageSplitter_)
//   check     eigentliche Pruefung (siehe _drivePdfWork_ in DriveAddon.gs)
// Eine neue Einheit startet nur, solange ihre (gemessene bzw. geschaetzte) Dauer
// sicher in die Restzeit der Aktion passt. Gelesene Objekte werden pro Aktion in
// eine Temp-Datei geschrieben ("Store"), der Zwischenstand liegt in der
// State-Datei des Jobs. "Weiter" setzt genau dort fort.
// ============================================================================

var DRIVE_PREP_START_BEFORE_MS = 14000;   // nach dieser Zeit keine neue Einheit mehr beginnen ...
var DRIVE_PREP_LIMIT_MS = 21000;          // ... und nur, wenn sie voraussichtlich bis hierhin fertig ist
var DRIVE_PREP_FETCH_BATCH = 64;          // Lesebereiche pro fetch-Einheit (parallel)
var DRIVE_PREP_FULL_BATCH_BYTES = 16 * 1024 * 1024; // so viele Bytes pro full-Einheit
// Geschaetzte Dauer, solange fuer eine Einheit noch keine Messung vorliegt (ms).
var DRIVE_PREP_DEFAULT_MS = { plan: 4000, fetch: 7000, full: 6000, assemble: 9000, split: 1500 };
var DRIVE_PDF_PAGES_PER_PART = 4;
var DRIVE_PDF_MAX_PARTS = 60;

/**
 * Fuehrt Vorbereitungs-Einheiten aus, bis die Vorbereitung fertig ist oder die
 * Zeit (lim, siehe _drivePdfLimits_) nicht mehr reicht. Liefert { done: false }
 * (Zwischenstand gespeichert) oder - wenn gleich weitergeprueft und fertig
 * wurde - { done: true, resultId }.
 */
function _drivePdfAdvance_(job, started, lim) {
  var prep = job.prep;
  // Ist die letzte Aktion mitten in der Vorbereitung abgebrochen (Zeitlimit)?
  // Dann diesmal kleinere Einheiten.
  if (prep.inflight) {
    prep.fetchBatch = Math.max(8, Math.floor((prep.fetchBatch || DRIVE_PREP_FETCH_BATCH) / 2));
    prep.fullBatchBytes = Math.max(512 * 1024, Math.floor((prep.fullBatchBytes || DRIVE_PREP_FULL_BATCH_BYTES) / 2));
    prep.ms = {}; // alte Messungen waren offensichtlich zu optimistisch
    Logger.log('_drivePdfAdvance_: letzte Vorbereitungs-Aktion abgebrochen -> ' + prep.fetchBatch + ' Bereiche / ' +
      _driveMb_(prep.fullBatchBytes) + ' MB pro Einheit');
  }
  if (job.stateId) { prep.inflight = true; _drivePdfSaveJob_(job); }

  var ctx = { started: started, reader: null, store: [], storeLen: 0, splitBuf: [], splitLen: 0, splitEntries: [] };
  var units = 0;
  try {
    while (job.phase !== 'check') {
      var elapsed = Date.now() - started;
      var estimate = (prep.ms && prep.ms[job.phase]) || DRIVE_PREP_DEFAULT_MS[job.phase] || 5000;
      // Am Ende der Aktion muessen die gesammelten Daten noch nach Drive
      // geschrieben werden (Store/Pakete + Zwischenstand) - das mit einplanen.
      var flushMs = _drivePdfFlushEstimate_(ctx);
      // Die erste Einheit einer Aktion laeuft immer (dafuer ist der Klick da).
      if (units > 0 && (elapsed > lim.prepStart ||
          elapsed + estimate * 1.3 + flushMs > lim.prepLimit)) break;
      var phase = job.phase, t0 = Date.now();
      _drivePdfPrepUnit_(job, ctx);
      prep.ms = prep.ms || {};
      prep.ms[phase] = Date.now() - t0;
      units++;
      Logger.log('_drivePdfAdvance_: Einheit "' + phase + '" dauerte ' + Math.round(prep.ms[phase] / 100) / 10 +
        ' s (nach ' + Math.round((Date.now() - started) / 100) / 10 + ' s)');
    }
  } catch (err) {
    // Ungewoehnlich aufgebaute, aber kleine PDF: unveraendert am Stueck an Gemini
    // schicken (wie frueher) - direkt aus der Originaldatei gelesen.
    if (job.fileSize <= DRIVE_PDF_MAX_BYTES && job.phase !== 'split') {
      Logger.log('_drivePdfAdvance_: Neuaufbau fehlgeschlagen, sende Original: ' + (err.message || err));
      _drivePdfPrepDiscard_(job, ctx);
      job.parts = [{ from: 0, to: 0, start: 0, len: job.fileSize, file: job.fileId }];
      job.phase = 'check';
    } else if (job.fileSize > DRIVE_PDF_MAX_BYTES && /^(plan|fetch|full|assemble)$/.test(job.phase)) {
      Logger.log('_drivePdfAdvance_: Verkleinern fehlgeschlagen: ' + (err.message || err));
      _drivePdfPrepDiscard_(job, ctx);
      _drivePdfCleanupJob_(job);
      throw new Error('The PDF file is too large (' + _driveMb_(job.fileSize) + ' MB) and could not be reduced automatically. Please reduce its size (e.g. Acrobat "Reduce File Size") or split it.');
    } else {
      _drivePdfPrepDiscard_(job, ctx);
      _drivePdfCleanupJob_(job);
      throw err;
    }
  }
  _drivePdfFlushStore_(job, ctx);
  _drivePdfFlushSplit_(job, ctx);
  prep.inflight = false;

  if (job.phase === 'check') {
    job.prep = { ms: prep.ms }; // Vorbereitungsdaten werden nicht mehr gebraucht
    var parts = job.parts, elapsedNow = Date.now() - started;
    // Gleich in dieser Aktion weiterpruefen: im PDF-Fenster, solange Zeit ist;
    // im Seitenbereich nur bei einer kleinen, schnell vorbereiteten PDF.
    if (lim.web ? elapsedNow < lim.checkStart
                : (parts.length === 1 && parts[0].len <= DRIVE_PDF_DIRECT_MAX_BYTES && elapsedNow < DRIVE_PDF_DIRECT_BEFORE_MS)) {
      return _drivePdfCheckStep_(job, started, lim);
    }
  }
  _drivePdfSaveJob_(job);
  return { done: false };
}

// Eine Einheit der Vorbereitung ausfuehren (siehe Kopfkommentar).
function _drivePdfPrepUnit_(job, ctx) {
  var prep = job.prep;
  var reader = ctx.reader || (ctx.reader = _pdfDriveRangeReader_(job.fileId, job.fileSize));

  if (job.phase === 'plan') {
    var plan = _pdfShrinkPlan_(reader);
    prep.plan = plan;
    prep.nextRange = 0;
    prep.images = {};
    prep.fullNeeded = [];
    prep.index = {};        // num -> [Store-Datei-Nr., Start, Laenge]
    prep.storeFiles = [];
    prep.bytesRead = 0;
    job.phase = 'fetch';
    return;
  }

  if (job.phase === 'fetch') {
    var ranges = prep.plan.ranges;
    var batch = ranges.slice(prep.nextRange, prep.nextRange + (prep.fetchBatch || DRIVE_PREP_FETCH_BATCH));
    var texts = reader.readMany(batch.map(function(r) { return [r[0], r[1]]; }));
    batch.forEach(function(r, i) {
      prep.bytesRead += texts[i].length;
      var c = _pdfShrinkClassify_(r, texts[i]);
      for (var k in c.kept) if (c.kept.hasOwnProperty(k)) _drivePdfStorePut_(job, ctx, k, c.kept[k]);
      for (var n in c.images) {
        if (!c.images.hasOwnProperty(n)) continue;
        var img = c.images[n];
        if (img.text !== null) _drivePdfStorePut_(job, ctx, n, img.text);
        prep.images[n] = { o: img.o, size: img.size, smask: img.smask, ref: img.text !== null ? 1 : null };
      }
      Array.prototype.push.apply(prep.fullNeeded, c.fullNeeded);
    });
    prep.nextRange += batch.length;
    if (prep.nextRange >= ranges.length) {
      // Bilder auswaehlen: bis 15 MB alle behalten, sonst nur bis DRIVE_PDF_IMAGE_BUDGET.
      var budget = job.fileSize <= DRIVE_PDF_MAX_BYTES ? Infinity : DRIVE_PDF_IMAGE_BUDGET;
      var sel = _pdfShrinkSelectImages_(prep.images, budget);
      for (var pk in sel.kept) if (sel.kept.hasOwnProperty(pk)) _drivePdfStorePut_(job, ctx, pk, sel.kept[pk]);
      Array.prototype.push.apply(prep.fullNeeded, sel.fullNeeded);
      job.imagesKept = sel.imagesKept;
      job.imagesRemoved = sel.imagesRemoved;
      prep.images = null;
      prep.plan.ranges = null; // gross und nicht mehr gebraucht
      prep.fullNext = 0;
      job.phase = 'full';
    }
    return;
  }

  if (job.phase === 'full') {
    var objs = [], bytes = 0, maxBytes = prep.fullBatchBytes || DRIVE_PREP_FULL_BATCH_BYTES;
    while (prep.fullNext + objs.length < prep.fullNeeded.length) {
      var o = prep.fullNeeded[prep.fullNext + objs.length];
      if (objs.length && bytes + (o[2] - o[1]) > maxBytes) break;
      objs.push(o);
      bytes += o[2] - o[1];
    }
    if (objs.length) {
      var full = _pdfShrinkFullRanges_(objs);
      var partsRead = reader.readMany(full.ranges);
      var joined = objs.map(function() { return []; });
      partsRead.forEach(function(t, k) { prep.bytesRead += t.length; joined[full.owners[k]].push(t); });
      objs.forEach(function(ob, idx) { _drivePdfStorePut_(job, ctx, ob[0], _pdfShrinkKeepText_(joined[idx].join(''))); });
      prep.fullNext += objs.length;
    }
    if (prep.fullNext >= prep.fullNeeded.length) job.phase = 'assemble';
    return;
  }

  if (job.phase === 'assemble') {
    _drivePdfFlushStore_(job, ctx);
    var kept = {};
    var fileTexts = prep.storeFiles.map(function(id) { return _driveReadTempString_(id); });
    for (var num in prep.index) {
      if (!prep.index.hasOwnProperty(num)) continue;
      var loc = prep.index[num];
      kept[num] = fileTexts[loc[0]].substr(loc[1], loc[2]);
    }
    fileTexts = null;
    var model = _pdfShrinkFinish_(prep.plan, kept);
    kept = null;
    prep.rebuiltId = _driveTempFileFromString_(model.text);
    job.extraFiles.push(prep.rebuiltId);
    prep.model = { offsets: model.offsets, compressed: model.compressed, rootNum: model.rootNum,
                   maxNum: model.maxNum, encrypted: model.encrypted, length: model.text.length };
    ctx.modelText = model.text;
    // Store-Dateien werden nicht mehr gebraucht.
    prep.storeFiles.forEach(function(id) {
      try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {}
      job.extraFiles = job.extraFiles.filter(function(x) { return x !== id; });
    });
    prep.storeFiles = [];
    prep.index = null;
    prep.fullNeeded = null;
    if (job.imagesRemoved) {
      logAuditEvent_(getUserEmail_(), 'DRIVE_PDF_SHRUNK', job.fileName + ' - ' + _driveMb_(job.fileSize) + ' MB -> ' +
        _driveMb_(model.text.length) + ' MB, images kept ' + job.imagesKept + ', removed ' + job.imagesRemoved +
        ', downloaded ' + _driveMb_(prep.bytesRead) + ' MB');
    }
    job.phase = 'split';
    return;
  }

  if (job.phase === 'split') {
    var text = ctx.modelText || (ctx.modelText = _driveReadTempString_(prep.rebuiltId));
    var whole = function() {
      if (prep.model.length > DRIVE_PDF_MAX_BYTES) {
        throw new Error('The PDF is still ' + _driveMb_(prep.model.length) + ' MB after reduction (limit: ' + _driveMb_(DRIVE_PDF_MAX_BYTES) + ' MB). Please split the PDF.');
      }
      ctx.splitBuf = []; ctx.splitLen = 0; ctx.splitEntries = [];
      job.parts = [{ from: 0, to: (prep.split && prep.split.n) || 0, start: 0, len: prep.model.length, file: prep.rebuiltId }];
      job.phase = 'check';
    };
    if (!ctx.splitter) {
      try {
        var m = prep.model;
        ctx.splitter = pdfPageSplitter_({ text: text, offsets: m.offsets, compressed: m.compressed, rootNum: m.rootNum,
                                          maxNum: m.maxNum, encrypted: m.encrypted });
      } catch (e) {
        Logger.log('_drivePdfPrepUnit_: nicht aufteilbar: ' + e.message);
        return whole();
      }
    }
    if (!prep.split) {
      var n = ctx.splitter.pageCount;
      var count = Math.min(Math.ceil(n / DRIVE_PDF_PAGES_PER_PART), DRIVE_PDF_MAX_PARTS);
      prep.split = { n: n, per: Math.ceil(n / Math.max(1, count)), next: 0 };
      if (count <= 1) return whole();
    }
    var sp = prep.split;
    var from = sp.next, to = Math.min(sp.n, from + sp.per), piece;
    try { piece = ctx.splitter.build(from, to); }
    catch (e2) {
      Logger.log('_drivePdfPrepUnit_: Aufteilen fehlgeschlagen: ' + e2.message);
      job.parts = [];
      return whole();
    }
    if (piece.length > DRIVE_PDF_MAX_BYTES) {
      throw new Error('Pages ' + (from + 1) + '-' + to + ' are still ' + _driveMb_(piece.length) + ' MB after reduction (limit: ' + _driveMb_(DRIVE_PDF_MAX_BYTES) + ' MB). Please split the PDF.');
    }
    ctx.splitEntries.push({ from: from, to: to, start: ctx.splitLen, len: piece.length });
    ctx.splitBuf.push(piece);
    ctx.splitLen += piece.length;
    sp.next = to;
    if (sp.next >= sp.n) {
      _drivePdfFlushSplit_(job, ctx);
      job.phase = 'check';
      job.next = 0;
    }
    return;
  }
  throw new Error('Unknown preparation step: ' + job.phase);
}

// Geschaetzte Dauer fuer das Schreiben am Aktionsende: Store- und Paket-Puffer
// (vorsichtig mit 2 MB/s gerechnet) plus Speichern des Zwischenstands.
function _drivePdfFlushEstimate_(ctx) {
  var bytes = ctx.storeLen + ctx.splitLen;
  return 1500 + (bytes ? 1500 + bytes / (2 * 1024 * 1024) * 1000 : 0);
}

// ─── STORE: gelesene Objekttexte pro Aktion in einer Temp-Datei sammeln ─────
function _drivePdfStorePut_(job, ctx, num, text) {
  // Datei-Nr. wird beim Schreiben (_drivePdfFlushStore_) eingesetzt: -1 = noch im Puffer.
  job.prep.index[num] = [-1, ctx.storeLen, text.length];
  ctx.store.push(text);
  ctx.storeLen += text.length;
}

function _drivePdfFlushStore_(job, ctx) {
  if (!ctx.store.length) return;
  var id = _driveTempFileFromString_(ctx.store.join(''));
  job.extraFiles.push(id);
  var fileNo = job.prep.storeFiles.length;
  job.prep.storeFiles.push(id);
  var index = job.prep.index;
  for (var num in index) if (index.hasOwnProperty(num) && index[num][0] === -1) index[num][0] = fileNo;
  ctx.store = [];
  ctx.storeLen = 0;
}

function _drivePdfFlushSplit_(job, ctx) {
  if (!ctx.splitBuf.length) return;
  var id = _driveTempFileFromString_(ctx.splitBuf.join(''));
  job.extraFiles.push(id);
  ctx.splitEntries.forEach(function(en) { en.file = id; job.parts.push(en); });
  ctx.splitBuf = []; ctx.splitLen = 0; ctx.splitEntries = [];
}

// Puffer dieser Aktion verwerfen (bei Fehler); schon geschriebene Temp-Dateien
// raeumt _drivePdfCleanupJob_ auf.
function _drivePdfPrepDiscard_(job, ctx) {
  ctx.store = []; ctx.storeLen = 0;
  ctx.splitBuf = []; ctx.splitLen = 0; ctx.splitEntries = [];
  if (job.prep && job.prep.index) {
    for (var num in job.prep.index) if (job.prep.index.hasOwnProperty(num) && job.prep.index[num][0] === -1) delete job.prep.index[num];
  }
}

// Binaerstring (1 Zeichen = 1 Byte) direkt als Temp-Datei speichern bzw. lesen.
// ISO-8859-1 bildet die Zeichen 0..255 1:1 auf Bytes ab - viel schneller als die
// Umwandlung in ein Byte-Array Zeichen fuer Zeichen.
function _driveTempFileFromString_(str) {
  var blob = Utilities.newBlob('', 'application/octet-stream', '.authorcheck-temp-' + Utilities.getUuid() + '.bin');
  blob.setDataFromString(str, 'ISO-8859-1');
  return _getOrCreateExportFolder_().createFile(blob).getId();
}

function _driveReadTempString_(id) {
  return DriveApp.getFileById(id).getBlob().getDataAsString('ISO-8859-1');
}

// Fortschritt der Vorbereitung in Prozent (grobe Gewichtung der Einheiten).
function _drivePdfPrepPercent_(job) {
  var p = job.prep;
  switch (job.phase) {
    case 'plan': return 2;
    case 'fetch': return 5 + Math.round(55 * (p.nextRange || 0) / Math.max(1, (p.plan && p.plan.ranges && p.plan.ranges.length) || 1));
    case 'full': return 60 + Math.round(20 * (p.fullNext || 0) / Math.max(1, (p.fullNeeded && p.fullNeeded.length) || 1));
    case 'assemble': return 80;
    case 'split': return 85 + Math.round(14 * ((p.split && p.split.next) || 0) / Math.max(1, (p.split && p.split.n) || 1));
  }
  return 99;
}

function _buildDrivePdfPrepCard_(job) {
  var card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('⏳ ' + _ct_('d.preparing')).setSubtitle(job.fileName));
  var section = CardService.newCardSection();
  section.addWidget(CardService.newTextParagraph().setText(
    _ct_('d.prepProgress', { mb: _driveMb_(job.fileSize), pct: _drivePdfPrepPercent_(job) }) + '<br>' +
    _ct_('d.stepsHelp', { btn: _ct_('d.continue') })));
  section.addWidget(CardService.newTextButton()
    .setText('⏩ ' + _ct_('d.continue'))
    .setOnClickAction(CardService.newAction()
      .setFunctionName('apiCheckDrivePdfContinue')
      .setParameters({ stateId: job.stateId })
      .setLoadIndicator(CardService.LoadIndicator.SPINNER)));
  card.addSection(section);
  return card.build();
}
