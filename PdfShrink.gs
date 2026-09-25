// ============================================================================
// GROSSE PDFs FÜR DEN CHECK VERKLEINERN (Bilder entfernen)
// ============================================================================
// Gemini nimmt eine PDF nur bis ca. 20 MB pro Anfrage an, und Apps Script kann
// Dateien über 50 MB gar nicht als Ganzes laden. Große Anleitungen sind aber
// fast immer wegen der BILDER so groß - für Grammatik/Terminologie/Stil werden
// die nicht gebraucht.
//
// Vorgehen:
//  1. Nur das Ende der Datei laden und daraus die Cross-Reference-Tabelle lesen
//     (Verzeichnis: welches Objekt steht an welcher Byte-Position).
//  2. Die Objekte der Reihe nach per HTTP-Range-Anfrage direkt aus Drive lesen.
//     Von jedem Objekt werden zuerst nur die ersten Bytes geholt: ist es ein
//     Bild (oder ein eingebetteter Dateianhang), wird der Rest gar nicht erst
//     heruntergeladen, sondern durch einen unsichtbaren 1x1-Platzhalter ersetzt.
//  3. Alle übrigen Objekte (Text, Schriften, Seitenaufbau) werden Byte für Byte
//     unverändert übernommen, dazu eine neue Cross-Reference geschrieben.
//
// Die Objektnummern bleiben gleich, dadurch bleiben alle Verweise innerhalb der
// PDF gültig. Das Ergebnis dient NUR dem Check (wird an Gemini geschickt) und
// wird nirgends gespeichert.

var PDF_SHRINK_CHUNK = 8 * 1024 * 1024;   // Größe einer Range-Anfrage an Drive
var PDF_SHRINK_PEEK = 4096;                // so viel wird von großen Objekten vorab gelesen
var PDF_SHRINK_BIG = 128 * 1024;           // ab dieser Größe: erst anschauen, dann ggf. überspringen
var PDF_SHRINK_PARALLEL = 64;              // gleichzeitige Range-Anfragen

/**
 * Liest Byte-Bereiche einer Drive-Datei per HTTP-Range, ohne die ganze Datei zu
 * laden. read(start, end) liefert [start, end) als Binärstring (1 Zeichen = 1 Byte).
 */
function _pdfDriveRangeReader_(fileId, size) {
  var url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) +
    '?alt=media&supportsAllDrives=true';
  var token = ScriptApp.getOAuthToken();
  return {
    size: size,
    read: function(start, end) {
      end = Math.min(end, size);
      if (start >= end) return '';
      var res = UrlFetchApp.fetch(url, {
        headers: { Authorization: 'Bearer ' + token, Range: 'bytes=' + start + '-' + (end - 1) },
        muteHttpExceptions: true
      });
      var code = res.getResponseCode();
      if (code !== 206 && code !== 200) throw new Error('Drive download failed (HTTP ' + code + ').');
      // ISO-8859-1 bildet jedes Byte 1:1 auf ein Zeichen 0..255 ab.
      var s = res.getContentText('ISO-8859-1');
      if (code === 200 && s.length > end - start) s = s.slice(start, end); // Range ignoriert
      return s;
    },
    // Mehrere Bereiche PARALLEL laden (UrlFetchApp.fetchAll) - [[start, end], ...].
    readMany: function(ranges) {
      var out = [];
      for (var i = 0; i < ranges.length; i += PDF_SHRINK_PARALLEL) {
        var batch = ranges.slice(i, i + PDF_SHRINK_PARALLEL);
        var responses = UrlFetchApp.fetchAll(batch.map(function(r) {
          return { url: url, headers: { Authorization: 'Bearer ' + token, Range: 'bytes=' + r[0] + '-' + (Math.min(r[1], size) - 1) },
                   muteHttpExceptions: true };
        }));
        responses.forEach(function(res, k) {
          var code = res.getResponseCode();
          if (code !== 206) throw new Error('Drive download failed (HTTP ' + code + ').');
          var txt = res.getContentText('ISO-8859-1');
          if (txt.length !== Math.min(batch[k][1], size) - batch[k][0]) throw new Error('Drive download returned an unexpected length.');
          out.push(txt);
        });
      }
      return out;
    }
  };
}

// PNG-Prädiktor rückgängig machen (xref-Streams nutzen fast immer /Predictor 12).
function _pdfPngUnpredict_(data, columns) {
  var rowLen = columns + 1, out = [];
  var prev = [];
  for (var k = 0; k < columns; k++) prev.push(0);
  for (var r = 0; r + rowLen <= data.length; r += rowLen) {
    var type = data.charCodeAt(r), row = new Array(columns);
    for (var i = 0; i < columns; i++) {
      var x = data.charCodeAt(r + 1 + i);
      var a = i > 0 ? row[i - 1] : 0, b = prev[i], c = i > 0 ? prev[i - 1] : 0, v;
      if (type === 1) v = x + a;
      else if (type === 2) v = x + b;
      else if (type === 3) v = x + ((a + b) >> 1);
      else if (type === 4) {
        var p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = x + ((pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c));
      } else v = x;
      row[i] = v & 255;
    }
    for (var j = 0; j < columns; j++) out.push(String.fromCharCode(row[j]));
    prev = row;
  }
  return out.join('');
}

function _pdfStringToSignedBytes_(s) {
  var out = new Array(s.length);
  for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i) & 0xFF; out[i] = c > 127 ? c - 256 : c; }
  return out;
}

/**
 * Liest die komplette Cross-Reference (klassische Tabelle und/oder xref-Stream,
 * inkl. /Prev-Kette früherer Revisionen). Liefert
 * { entries: {num: {t:0|1|2, off, gen, stm, idx}}, trailer: dictText, sections: [offsets] }.
 */
function _pdfShrinkReadXref_(reader) {
  var tailLen = Math.min(reader.size, 64 * 1024);
  var tail = reader.read(reader.size - tailLen, reader.size);
  var re = /startxref\s+(\d+)/g, m, last = null;
  while ((m = re.exec(tail))) last = m;
  if (!last) throw new Error('startxref not found.');

  var entries = {}, trailer = null, sections = [], seen = {};
  var queue = [parseInt(last[1], 10)];

  // Liest ab off, bis marker (inkl. etwas Nachlauf) im Fenster steht.
  function readUntil(off, marker) {
    var len = 64 * 1024, s;
    while (true) {
      s = reader.read(off, off + len);
      var idx = s.indexOf(marker);
      if (idx !== -1 && idx + marker.length + 4096 <= s.length) return s;
      if (off + len >= reader.size) return s;
      len *= 4;
      if (len > 64 * 1024 * 1024) throw new Error('Cross-reference section too large.');
    }
  }
  function setEntry(num, e) { if (!entries.hasOwnProperty(num)) entries[num] = e; }

  while (queue.length) {
    var off = queue.shift();
    if (seen[off] || off < 0 || off >= reader.size) continue;
    seen[off] = true;
    sections.push(off);

    var head = reader.read(off, off + 16);
    var dictText;
    if (/^\s*xref/.test(head)) {
      var s = readUntil(off, 'trailer');
      var tIdx = s.indexOf('trailer');
      if (tIdx === -1) throw new Error('xref table without trailer.');
      var table = s.slice(s.indexOf('xref') + 4, tIdx);
      // Tokens: "erste anzahl" (Unterabschnitt) oder "offset gen n|f" (Eintrag).
      var tokRe = /\s*(\d+)\s+(\d+)(?:[ \t]+([nf]))?/y, tm, cur = 0;
      while ((tm = tokRe.exec(table))) {
        if (tm[3] === 'n') setEntry(cur++, { t: 1, off: parseInt(tm[1], 10), gen: parseInt(tm[2], 10) });
        else if (tm[3] === 'f') setEntry(cur++, { t: 0 });
        else cur = parseInt(tm[1], 10);
      }
      var dStart = s.indexOf('<<', tIdx);
      var dict = _pdfParseValue_(s, dStart, true);
      dictText = s.slice(dStart, dict.next);
      if (!trailer) trailer = dictText;
      var xrefStmM = /\/XRefStm\s+(\d+)/.exec(dictText);
      if (xrefStmM) queue.unshift(parseInt(xrefStmM[1], 10)); // hybride Datei: Stream-Einträge zuerst
    } else {
      var so = readUntil(off, 'endstream');
      var objKw = so.indexOf('obj');
      var dStart2 = so.indexOf('<<', objKw);
      var parsed = _pdfParseValue_(so, dStart2, true);
      dictText = so.slice(dStart2, parsed.next);
      var d = parsed.v && parsed.v.d;
      if (!d || !d.Type || d.Type.n !== 'XRef') throw new Error('startxref does not point to a cross-reference.');
      if (!trailer) trailer = dictText;

      var sKw = so.indexOf('stream', parsed.next);
      var dataStart = sKw + 6;
      if (so.charAt(dataStart) === '\r') dataStart++;
      if (so.charAt(dataStart) === '\n') dataStart++;
      var dataEnd = typeof d.Length === 'number' ? dataStart + d.Length : so.indexOf('endstream', dataStart);
      var filters = [];
      if (d.Filter && d.Filter.n) filters.push(d.Filter.n);
      else if (Array.isArray(d.Filter)) d.Filter.forEach(function(f) { if (f && f.n) filters.push(f.n); });
      var data = _pdfDecodeStreamToText_({ rawBytes: _pdfStringToSignedBytes_(so.slice(dataStart, dataEnd)), filters: filters });

      var W = d.W || [1, 2, 1];
      var rowW = W[0] + W[1] + W[2];
      var parms = Array.isArray(d.DecodeParms) ? d.DecodeParms[0] : d.DecodeParms;
      if (parms && parms.d && parms.d.Predictor >= 10) data = _pdfPngUnpredict_(data, parms.d.Columns || rowW);

      var index = Array.isArray(d.Index) ? d.Index : [0, d.Size];
      var p = 0;
      function field(w, dflt) {
        if (!w) return dflt;
        var v = 0;
        for (var b = 0; b < w; b++) v = v * 256 + data.charCodeAt(p++);
        return v;
      }
      for (var ii = 0; ii + 1 < index.length; ii += 2) {
        for (var n = 0; n < index[ii + 1]; n++) {
          if (p + rowW > data.length) break;
          var type = field(W[0], 1), f2 = field(W[1], 0), f3 = field(W[2], 0);
          var num = index[ii] + n;
          if (type === 1) setEntry(num, { t: 1, off: f2, gen: f3 });
          else if (type === 2) setEntry(num, { t: 2, stm: f2, idx: f3 });
          else setEntry(num, { t: 0 });
        }
      }
    }
    var prevM = /\/Prev\s+(\d+)/.exec(dictText);
    if (prevM) queue.push(parseInt(prevM[1], 10));
  }
  return { entries: entries, trailer: trailer || '', sections: sections };
}

/** Leser für eine PDF, die schon als Binärstring im Speicher liegt. */
function _pdfStringReader_(text) {
  return {
    size: text.length,
    read: function(a, b) { return text.slice(a, Math.min(b, text.length)); },
    readMany: function(ranges) { return ranges.map(function(r) { return text.slice(r[0], Math.min(r[1], text.length)); }); }
  };
}

// Unsichtbarer Platzhalter für ein entferntes Bild: 1x1-Stencil-Maske, deren
// einziges Pixel nicht malt. Für Soft-Masks (/SMask) stattdessen ein deckendes
// 1x1-Graustufenbild, weil eine SMask ein Graustufenbild sein muss.
function _pdfImagePlaceholder_(num, gen, asSoftMask) {
  var dict = asSoftMask
    ? '<< /Type /XObject /Subtype /Image /ColorSpace /DeviceGray /BitsPerComponent 8 /Width 1 /Height 1 /Length 1 >>'
    : '<< /Type /XObject /Subtype /Image /ImageMask true /Width 1 /Height 1 /BitsPerComponent 1 /Length 1 >>';
  return num + ' ' + gen + ' obj\n' + dict + '\nstream\n\u00FF\nendstream\nendobj\n';
}

/**
 * Baut die PDF (gelesen über reader, siehe _pdfDriveRangeReader_ /
 * _pdfStringReader_) als saubere, einteilige Datei neu auf. Bilder werden nach
 * Größe aufsteigend behalten, solange sie zusammen in opts.imageBudget (Bytes,
 * Standard: alle) passen - kleine Bilder wie Piktogramme und Warnsymbole
 * bleiben also zuerst erhalten, große Fotos fallen zuerst weg. Eingebettete
 * Dateianhänge werden immer entfernt.
 *
 * Liefert ein "Modell" der neuen Datei:
 * { text, offsets: {num: pos}, compressed: {num: {stm, idx}}, rootNum, maxNum,
 *   trailerExtra, imagesRemoved, imagesKept, bytesRead }
 */
function pdfRebuild_(reader, opts) {
  opts = opts || {};
  var budget = opts.imageBudget === undefined ? Infinity : opts.imageBudget;
  var xr = _pdfShrinkReadXref_(reader);
  var objs = [], maxNum = 0, compressed = {};
  for (var key in xr.entries) {
    if (!xr.entries.hasOwnProperty(key)) continue;
    var num = parseInt(key, 10), e = xr.entries[key];
    if (num > maxNum) maxNum = num;
    if (e.t === 1 && num > 0) objs.push({ num: num, off: e.off, gen: e.gen });
    else if (e.t === 2) compressed[num] = { stm: e.stm, idx: e.idx };
  }
  if (!objs.length) throw new Error('No objects found in the PDF.');

  // Ende jedes Objekts = Beginn des nächsten bekannten Abschnitts.
  var bounds = objs.map(function(o) { return o.off; }).concat(xr.sections, [reader.size]);
  bounds.sort(function(a, b) { return a - b; });
  objs.sort(function(a, b) { return a.off - b.off; });
  var bi = 0;
  objs.forEach(function(o) {
    while (bi < bounds.length && bounds[bi] <= o.off) bi++;
    o.end = bi < bounds.length ? bounds[bi] : reader.size;
  });

  // Lesestrategie (Laufzeit!): aufeinanderfolgende kleine Objekte werden zu
  // einem Bereich zusammengefasst; ein großes Objekt schließt den Bereich mit
  // nur seinen ersten PDF_SHRINK_PEEK Bytes ab. Alle Bereiche werden parallel
  // geladen. Große Objekte werden erst danach - und nur falls sie gebraucht
  // werden - komplett nachgeladen. Entfernte Bilder werden nie heruntergeladen.
  var ranges = [], cur = null;
  objs.forEach(function(o) {
    var big = o.end - o.off > PDF_SHRINK_BIG;
    var need = big ? o.off + PDF_SHRINK_PEEK : o.end;
    if (cur && cur.end === o.off && need - cur.start <= PDF_SHRINK_CHUNK) {
      cur.end = big ? o.end : need; // bei "big" ist der Bereich danach abgeschlossen
      cur.readEnd = need;
      cur.objs.push(o);
    } else {
      cur = { start: o.off, end: big ? o.end : need, readEnd: need, objs: [o] };
      ranges.push(cur);
    }
    if (big) cur = null;
  });
  var texts = reader.readMany(ranges.map(function(r) { return [r.start, r.readEnd]; }));
  var bytesRead = 0;
  texts.forEach(function(t) { bytesRead += t.length; });

  var kept = {};          // num -> vollständiger Objekttext
  var images = {};        // num -> {o, size, smask, text?}
  var fullNeeded = [];    // große Nicht-Bild-Objekte

  function keepText(o, full) {
    var endIdx = full.lastIndexOf('endobj');
    return (endIdx !== -1 ? full.slice(0, endIdx + 6) : full).replace(/^\s+/, '') + '\n';
  }

  ranges.forEach(function(r, ri) {
    var t = texts[ri];
    r.objs.forEach(function(o) {
      var avail = t.slice(o.off - r.start, Math.min(o.end, r.readEnd) - r.start);
      var complete = o.end <= r.readEnd;
      var head = avail.slice(0, PDF_SHRINK_PEEK);
      var hm = /^\s*(\d+)\s+(\d+)\s+obj\b/.exec(head);
      if (!hm || parseInt(hm[1], 10) !== o.num) throw new Error('Object ' + o.num + ' not found at its xref offset.');
      var parsed = _pdfParseValue_(head, hm[0].length, true);
      var d = parsed.v && parsed.v.d;
      var isStream = d && /^\s*stream/.test(head.slice(parsed.next));
      var subtype = d && d.Subtype && d.Subtype.n, type = d && d.Type && d.Type.n;
      if (isStream && subtype === 'Image') {
        images[o.num] = { o: o, size: o.end - o.off, smask: d.SMask && d.SMask.r, text: complete ? keepText(o, avail) : null };
      } else if (isStream && type === 'EmbeddedFile') {
        kept[o.num] = o.num + ' ' + o.gen + ' obj\n<< /Type /EmbeddedFile /Length 0 >>\nstream\n\nendstream\nendobj\n';
      } else if (complete) {
        kept[o.num] = keepText(o, avail);
      } else {
        fullNeeded.push(o);
      }
    });
  });

  // Bilder auswählen: Bild + zugehörige Soft-Mask zählen gemeinsam.
  var isSoftMask = {};
  for (var ik in images) if (images.hasOwnProperty(ik) && images[ik].smask && images[images[ik].smask]) isSoftMask[images[ik].smask] = true;
  var candidates = [];
  for (var ik2 in images) {
    if (!images.hasOwnProperty(ik2) || isSoftMask[ik2]) continue;
    var img = images[ik2];
    var sm = img.smask && images[img.smask] ? images[img.smask] : null;
    candidates.push({ main: img, mask: sm, size: img.size + (sm ? sm.size : 0) });
  }
  candidates.sort(function(a, b) { return a.size - b.size; });
  var used = 0, imagesKept = 0, imagesRemoved = 0;
  candidates.forEach(function(c) {
    var members = c.mask ? [c.main, c.mask] : [c.main];
    if (used + c.size <= budget) {
      used += c.size;
      imagesKept++;
      members.forEach(function(m) { if (m.text) kept[m.o.num] = m.text; else fullNeeded.push(m.o); });
    } else {
      imagesRemoved++;
      members.forEach(function(m) { kept[m.o.num] = _pdfImagePlaceholder_(m.o.num, m.o.gen, m === c.mask); });
    }
  });
  // Soft-Masks ohne auffindbares Elternbild: wie ein normales Bild behandeln (behalten).
  for (var ik3 in images) {
    if (images.hasOwnProperty(ik3) && !kept.hasOwnProperty(ik3) && fullNeeded.indexOf(images[ik3].o) === -1) {
      if (images[ik3].text) kept[ik3] = images[ik3].text; else fullNeeded.push(images[ik3].o);
    }
  }

  // Große Objekte, die gebraucht werden, komplett nachladen (ggf. in mehreren Teilen).
  var fullRanges = [], owners = [];
  fullNeeded.forEach(function(o, idx) {
    for (var p = o.off; p < o.end; p += PDF_SHRINK_CHUNK) {
      fullRanges.push([p, Math.min(o.end, p + PDF_SHRINK_CHUNK)]);
      owners.push(idx);
    }
  });
  var parts = fullRanges.length ? reader.readMany(fullRanges) : [];
  var joined = fullNeeded.map(function() { return []; });
  parts.forEach(function(t, k) { bytesRead += t.length; joined[owners[k]].push(t); });
  fullNeeded.forEach(function(o, idx) { kept[o.num] = keepText(o, joined[idx].join('')); });

  var rootM = /\/Root\s+(\d+)\s+\d+\s+R/.exec(xr.trailer);
  if (!rootM) throw new Error('No /Root in the PDF trailer.');
  var infoM = /\/Info\s+\d+\s+\d+\s+R/.exec(xr.trailer);
  var encM = /\/Encrypt\s+\d+\s+\d+\s+R/.exec(xr.trailer);
  var idM = /\/ID\s*\[[^\]]*\]/.exec(xr.trailer);
  var sizeM = /\/Size\s+(\d+)/.exec(xr.trailer);
  maxNum = Math.max(maxNum, sizeM ? parseInt(sizeM[1], 10) - 1 : 0);
  var trailerExtra = (infoM ? ' ' + infoM[0] : '') + (encM ? ' ' + encM[0] : '') + (idM ? ' ' + idM[0] : '');

  var written = _pdfWriteObjects_(kept, compressed, parseInt(rootM[1], 10), trailerExtra, maxNum);
  return {
    text: written.text, offsets: written.offsets, compressed: compressed,
    rootNum: parseInt(rootM[1], 10), maxNum: maxNum, trailerExtra: trailerExtra, encrypted: !!encM,
    imagesRemoved: imagesRemoved, imagesKept: imagesKept, bytesRead: bytesRead
  };
}

/**
 * Schreibt eine vollständige PDF: objTexts {num: "N G obj ... endobj\n"},
 * compressed {num: {stm, idx}} (Objekte in Object Streams), dazu ein
 * Cross-Reference-STREAM (nur der kann Object-Stream-Einträge aufnehmen).
 */
function _pdfWriteObjects_(objTexts, compressed, rootNum, trailerExtra, maxNum) {
  var header = '%PDF-1.7\n%\u00E2\u00E3\u00CF\u00D3\n';
  var out = [header], pos = header.length, offsets = {}, gens = {};
  var nums = Object.keys(objTexts).map(Number).sort(function(a, b) { return a - b; });
  nums.forEach(function(n) {
    offsets[n] = pos;
    var gm = /^\s*\d+\s+(\d+)\s+obj/.exec(objTexts[n]);
    gens[n] = gm ? parseInt(gm[1], 10) : 0;
    out.push(objTexts[n]);
    pos += objTexts[n].length;
    if (n > maxNum) maxNum = n;
  });
  for (var c in compressed) if (compressed.hasOwnProperty(c) && +c > maxNum) maxNum = +c;
  var xrefNum = maxNum + 1;
  function be(v, w) { var s = ''; for (var i = w - 1; i >= 0; i--) s += String.fromCharCode(Math.floor(v / Math.pow(256, i)) & 255); return s; }
  var rows = [];
  for (var n = 0; n <= xrefNum; n++) {
    if (n === xrefNum) rows.push('\u0001' + be(pos, 4) + be(0, 2));
    else if (n === 0) rows.push('\u0000' + be(0, 4) + be(65535, 2));
    else if (offsets.hasOwnProperty(n)) rows.push('\u0001' + be(offsets[n], 4) + be(gens[n], 2));
    else if (compressed.hasOwnProperty(n)) rows.push('\u0002' + be(compressed[n].stm, 4) + be(compressed[n].idx, 2));
    else rows.push('\u0000' + be(0, 4) + be(0, 2));
  }
  var xdata = rows.join('');
  out.push(xrefNum + ' 0 obj\n<< /Type /XRef /Size ' + (xrefNum + 1) + ' /W [1 4 2] /Index [0 ' + (xrefNum + 1) + ']' +
    ' /Root ' + rootNum + ' 0 R' + trailerExtra + ' /Length ' + xdata.length + ' >>\nstream\n' + xdata +
    '\nendstream\nendobj\nstartxref\n' + pos + '\n%%EOF\n');
  return { text: out.join(''), offsets: offsets };
}

// ============================================================================
// PDF IN SEITENPAKETE AUFTEILEN (für parallele Gemini-Anfragen)
// ============================================================================
// Eine Add-on-Aktion darf nur ca. 30-45 Sekunden laufen. Ein ganzes Handbuch in
// EINER Gemini-Anfrage dauert länger - deshalb wird die PDF in Seitenpakete
// aufgeteilt, die gleichzeitig geprüft werden. Jedes Paket ist eine eigene,
// kompakte PDF mit nur den Objekten, die seine Seiten tatsächlich brauchen
// (Schriften, Bilder, ...). Geerbte Seiteneigenschaften (/Resources,
// /MediaBox ...) werden in die Seiten übernommen, weil sie einen neuen
// Elternknoten bekommen; Verweise auf andere Seiten (Links /Annots,
// Lesezeichen, Strukturbaum) werden weggelassen, damit nicht das ganze
// Dokument mitgezogen wird.

function _pdfSerialize_(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(Math.round(v * 1e6) / 1e6);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return '[' + v.map(_pdfSerialize_).join(' ') + ']';
  if (v.r !== undefined) return v.r + ' 0 R';
  if (v.n !== undefined) {
    return '/' + v.n.replace(/[^!-~]|[#()<>\[\]{}\/%]/g, function(c) {
      var h = c.charCodeAt(0).toString(16); return '#' + (h.length < 2 ? '0' + h : h);
    });
  }
  if (v.s !== undefined) {
    var hex = '';
    for (var i = 0; i < v.s.length; i++) { var h2 = (v.s.charCodeAt(i) & 255).toString(16); hex += h2.length < 2 ? '0' + h2 : h2; }
    return '<' + hex + '>';
  }
  if (v.d) {
    var parts = [];
    for (var k in v.d) if (v.d.hasOwnProperty(k)) parts.push(_pdfSerialize_({ n: k }) + ' ' + _pdfSerialize_(v.d[k]));
    return '<< ' + parts.join(' ') + ' >>';
  }
  return 'null';
}

/**
 * Teilt die neu aufgebaute PDF (model aus pdfRebuild_) in Seitenpakete.
 * Liefert { pageCount, build(from, to) -> Binärstring } (Seiten 0-basiert, to exklusiv).
 */
function pdfPageSplitter_(model) {
  if (model.encrypted) throw new Error('Encrypted PDFs cannot be split.');
  var text = model.text;
  var doc = _pdfOpenDoc_(text, model.offsets);
  var pages = _pdfCollectPages_(text, model.offsets, model.rootNum, doc);

  // Verweise, die ein Objekt enthält (bei Streams nur im Dictionary).
  function refsIn(s) {
    var out = [], re = /(\d+)\s+(\d+)\s+R(?![A-Za-z])/g, m;
    while ((m = re.exec(s))) out.push(parseInt(m[1], 10));
    return out;
  }
  var refCache = {};
  function refsOf(num) {
    if (refCache.hasOwnProperty(num)) return refCache[num];
    var refs = [];
    if (model.offsets.hasOwnProperty(num)) {
      var start = model.offsets[num];
      var objKw = text.indexOf('obj', start);
      var val = _pdfParseValue_(text, objKw + 3, true);
      refs = refsIn(text.slice(objKw + 3, val.next));
    } else if (model.compressed.hasOwnProperty(num)) {
      var loc = _pdfDocObjStmIndex_(doc)[num];
      if (loc) refs = refsIn(loc.text.slice(loc.pos, _pdfParseValue_(loc.text, loc.pos, true).next));
    }
    refCache[num] = refs;
    return refs;
  }
  function objText(num) {
    var start = model.offsets[num];
    var end = text.indexOf('endobj', start);
    return text.slice(start, end + 6) + '\n';
  }

  var INHERITED = ['Resources', 'MediaBox', 'CropBox', 'Rotate'];
  function pageDictFor(page, newParent) {
    var pageObj = _pdfDocObj_(doc, page.num);
    var dict = page.dictText
      .replace(/\/Parent\s+\d+\s+\d+\s+R/, '/Parent ' + newParent + ' 0 R')
      .replace(/\/(Annots|B|Thumb)\s+\d+\s+\d+\s+R/g, '')
      .replace(/\/(Annots|B)\s*\[[^\]]*\]/g, '');
    var extra = '';
    INHERITED.forEach(function(key) {
      if (pageObj && pageObj.d && pageObj.d.hasOwnProperty(key)) return;
      var node = pageObj ? _pdfDocGet_(doc, pageObj, 'Parent') : null;
      for (var depth = 0; node && depth < 32; depth++) {
        if (node.d && node.d.hasOwnProperty(key)) { extra += ' /' + key + ' ' + _pdfSerialize_(node.d[key]); return; }
        node = _pdfDocGet_(doc, node, 'Parent');
      }
    });
    return dict.slice(0, -2) + extra + ' >>';
  }

  return {
    pageCount: pages.length,
    build: function(from, to) {
      var pagesNum = model.maxNum + 1, catNum = model.maxNum + 2;
      var overrides = {}, kids = [];
      for (var i = from; i < to && i < pages.length; i++) {
        kids.push(pages[i].num + ' 0 R');
        overrides[pages[i].num] = pages[i].num + ' 0 obj\n' + pageDictFor(pages[i], pagesNum) + '\nendobj\n';
      }
      overrides[pagesNum] = pagesNum + ' 0 obj\n<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + kids.length + ' >>\nendobj\n';
      overrides[catNum] = catNum + ' 0 obj\n<< /Type /Catalog /Pages ' + pagesNum + ' 0 R >>\nendobj\n';

      // Alle von den Seiten aus erreichbaren Objekte einsammeln.
      var objTexts = {}, comp = {}, seen = {}, queue = [catNum];
      while (queue.length) {
        var n = queue.pop();
        if (seen[n]) continue;
        seen[n] = true;
        var refs;
        if (overrides.hasOwnProperty(n)) {
          objTexts[n] = overrides[n];
          refs = refsIn(overrides[n].slice(overrides[n].indexOf('obj') + 3));
        } else if (model.offsets.hasOwnProperty(n)) {
          objTexts[n] = objText(n);
          refs = refsOf(n);
        } else if (model.compressed.hasOwnProperty(n)) {
          comp[n] = model.compressed[n];
          refs = refsOf(n).concat([model.compressed[n].stm]);
        } else continue;
        for (var r = 0; r < refs.length; r++) if (!seen[refs[r]]) queue.push(refs[r]);
      }
      return _pdfWriteObjects_(objTexts, comp, catNum, '', catNum).text;
    }
  };
}
