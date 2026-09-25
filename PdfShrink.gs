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
var PDF_SHRINK_PEEK = 4096;                // so viel wird von jedem Objekt vorab gelesen

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

/**
 * Baut aus der PDF (über reader, siehe _pdfDriveRangeReader_) eine Kopie ohne
 * Bilder und eingebettete Dateianhänge. Liefert
 * { text: Binärstring der neuen PDF, imagesRemoved, bytesRead }.
 */
function shrinkPdfForCheck_(reader) {
  var xr = _pdfShrinkReadXref_(reader);
  var objs = [], maxNum = 0;
  for (var key in xr.entries) {
    if (!xr.entries.hasOwnProperty(key)) continue;
    var num = parseInt(key, 10), e = xr.entries[key];
    if (num > maxNum) maxNum = num;
    if (e.t === 1 && num > 0) objs.push({ num: num, off: e.off, gen: e.gen });
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

  // Lesefenster: lädt fortlaufend in PDF_SHRINK_CHUNK-Blöcken nach und springt
  // über Bereiche, die nicht gebraucht werden (Bilddaten).
  var win = '', winStart = 0, bytesRead = 0;
  function get(a, b) {
    if (a < winStart || a > winStart + win.length) { win = ''; winStart = a; }
    else if (a > winStart) { win = win.slice(a - winStart); winStart = a; }
    while (winStart + win.length < b) {
      var from = winStart + win.length;
      var chunk = reader.read(from, Math.min(reader.size, from + PDF_SHRINK_CHUNK));
      if (!chunk) break;
      bytesRead += chunk.length;
      win += chunk;
    }
    return win.slice(0, b - winStart);
  }

  var kept = {}, imagesRemoved = 0;
  objs.forEach(function(o) {
    var head = get(o.off, Math.min(o.end, o.off + PDF_SHRINK_PEEK));
    var hm = /^\s*(\d+)\s+(\d+)\s+obj\b/.exec(head);
    if (!hm || parseInt(hm[1], 10) !== o.num) throw new Error('Object ' + o.num + ' not found at its xref offset.');

    var parsed = _pdfParseValue_(head, hm[0].length, true);
    var d = parsed.v && parsed.v.d;
    var isStream = d && /^\s*stream/.test(head.slice(parsed.next));
    var subtype = d && d.Subtype && d.Subtype.n, type = d && d.Type && d.Type.n;

    if (isStream && subtype === 'Image') {
      // Unsichtbarer Platzhalter: 1x1-Stencil-Maske, deren einziges Pixel nicht malt.
      kept[o.num] = o.num + ' ' + o.gen + ' obj\n<< /Type /XObject /Subtype /Image /ImageMask true /Width 1 /Height 1' +
        ' /BitsPerComponent 1 /Length 1 >>\nstream\nÿ\nendstream\nendobj\n';
      imagesRemoved++;
      return;
    }
    if (isStream && type === 'EmbeddedFile') {
      kept[o.num] = o.num + ' ' + o.gen + ' obj\n<< /Type /EmbeddedFile /Length 0 >>\nstream\n\nendstream\nendobj\n';
      return;
    }
    var full = get(o.off, o.end);
    var endIdx = full.lastIndexOf('endobj');
    kept[o.num] = (endIdx !== -1 ? full.slice(0, endIdx + 6) : full).replace(/^\s+/, '') + '\n';
  });

  // Neue Datei: Kopf + Objekte + Cross-Reference-Stream (unkomprimiert). Ein
  // xref-STREAM ist nötig, weil Objekte in Object Streams (Typ 2) nur dort
  // eingetragen werden können.
  var header = '%PDF-1.7\n%âãÏÓ\n';
  var out = [header], pos = header.length, newOff = {};
  var nums = Object.keys(kept).map(Number).sort(function(a, b) { return a - b; });
  nums.forEach(function(n) { newOff[n] = pos; out.push(kept[n]); pos += kept[n].length; });

  var sizeM = /\/Size\s+(\d+)/.exec(xr.trailer);
  var xrefNum = Math.max(maxNum + 1, sizeM ? parseInt(sizeM[1], 10) : 0);
  var xrefOff = pos;
  function be(v, w) { var s = ''; for (var i = w - 1; i >= 0; i--) s += String.fromCharCode(Math.floor(v / Math.pow(256, i)) & 255); return s; }
  var rows = [];
  for (var n = 0; n <= xrefNum; n++) {
    var ent = xr.entries[n];
    if (n === xrefNum) rows.push('\u0001' + be(xrefOff, 4) + be(0, 2));
    else if (n === 0) rows.push('\u0000' + be(0, 4) + be(65535, 2));
    else if (newOff.hasOwnProperty(n)) rows.push('\u0001' + be(newOff[n], 4) + be(ent ? ent.gen : 0, 2));
    else if (ent && ent.t === 2) rows.push('\u0002' + be(ent.stm, 4) + be(ent.idx, 2));
    else rows.push('\u0000' + be(0, 4) + be(0, 2));
  }
  var xdata = rows.join('');
  var rootM = /\/Root\s+\d+\s+\d+\s+R/.exec(xr.trailer);
  if (!rootM) throw new Error('No /Root in the PDF trailer.');
  var infoM = /\/Info\s+\d+\s+\d+\s+R/.exec(xr.trailer);
  var encM = /\/Encrypt\s+\d+\s+\d+\s+R/.exec(xr.trailer);
  var idM = /\/ID\s*\[[^\]]*\]/.exec(xr.trailer);
  out.push(xrefNum + ' 0 obj\n<< /Type /XRef /Size ' + (xrefNum + 1) + ' /W [1 4 2] /Index [0 ' + (xrefNum + 1) + '] ' +
    rootM[0] + (infoM ? ' ' + infoM[0] : '') + (encM ? ' ' + encM[0] : '') + (idM ? ' ' + idM[0] : '') +
    ' /Length ' + xdata.length + ' >>\nstream\n' + xdata + '\nendstream\nendobj\n' +
    'startxref\n' + xrefOff + '\n%%EOF\n');

  return { text: out.join(''), imagesRemoved: imagesRemoved, bytesRead: bytesRead };
}
