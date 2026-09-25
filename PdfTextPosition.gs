// ============================================================================
// TEXTPOSITION IN EINER PDF-SEITE FINDEN (für exakt platzierte Notizen)
// ============================================================================
// Baut auf PdfInflate.gs auf: dekomprimiert den Content-Stream jeder Seite
// (die Zeichenbefehle, die bestimmen, welcher Text WO auf der Seite steht) und
// interpretiert die textbezogenen PDF-Operatoren inklusive der Schriften:
//
//  - ToUnicode-CMaps / Encodings (/Differences, WinAnsi) werden ausgewertet,
//    damit auch PDFs mit eingebetteten CID-Schriften (Type0/Identity-H - so
//    gut wie jedes PDF aus Word, InDesign, Chrome, LibreOffice ...) lesbaren
//    Text liefern. Ohne das bestehen die Textausgaben nur aus Glyph-Nummern
//    und kein Zitat kann gefunden werden.
//  - Zeichenbreiten (/Widths, /W, Standard-14-Metriken) werden pro Glyph
//    mitgerechnet, sodass für JEDES Zeichen ein Rechteck im Seitenraum
//    bekannt ist - nicht nur die Höhe der Zeile.
//  - Form-XObjects (Do) und Objekte in komprimierten Object Streams werden
//    ebenfalls gelesen.
//
// Das von Gemini zitierte "original" wird im so rekonstruierten Seitentext
// gesucht; das Ergebnis sind die Rechtecke (eins pro Textzeile) exakt um die
// betroffenen Wörter, die in PdfAnnotate.gs als Highlight-Annotation
// geschrieben werden.
//
// Alles hier ist eine Verbesserung "on top": nicht unterstützte Konstrukte
// (z.B. LZW-komprimierte Streams) führen zu einem sauberen "kein Treffer",
// nie zu falschen Koordinaten - die Notiz landet dann wie bisher oben links
// auf der von Gemini genannten Seite (siehe DriveAddon.gs).

// ─── 2D-AFFINE MATRIX-HILFSFUNKTIONEN (PDF: [a b c d e f], Zeilenvektoren) ──
function _pdfMatIdentity_() { return [1, 0, 0, 1, 0, 0]; }
// "A dann B": kombinierte Matrix, als würde erst A und danach B angewendet.
function _pdfMatMul_(A, B) {
  return [
    A[0] * B[0] + A[1] * B[2],
    A[0] * B[1] + A[1] * B[3],
    A[2] * B[0] + A[3] * B[2],
    A[2] * B[1] + A[3] * B[3],
    A[4] * B[0] + A[5] * B[2] + B[4],
    A[4] * B[1] + A[5] * B[3] + B[5]
  ];
}
// Position des Textursprungs (0,0 in Textraum) nach Anwendung von M im Seitenraum.

// ─── STREAM-BYTES EINES OBJEKTS LADEN (Dict + Rohdaten) ────────────────────
function _pdfGetStreamData_(text, offsets, objNum) {
  if (!(objNum in offsets)) return null;
  var range = _pdfExtractDictText_(text, offsets[objNum]);
  if (!range) return null;
  var dictText = text.slice(range.start, range.end);

  var streamKwIdx = text.indexOf('stream', range.end);
  if (streamKwIdx === -1) return null;
  var dataStart = streamKwIdx + 6;
  if (text.charAt(dataStart) === '\r') dataStart++;
  if (text.charAt(dataStart) === '\n') dataStart++;

  var lengthM = /\/Length\s+(\d+)\b(?!\s+\d+\s+R)/.exec(dictText);
  var dataEnd;
  if (lengthM) {
    dataEnd = dataStart + parseInt(lengthM[1], 10);
  } else {
    var endIdx = text.indexOf('endstream', dataStart);
    if (endIdx === -1) return null;
    dataEnd = endIdx;
    while (dataEnd > dataStart && (text.charAt(dataEnd - 1) === '\n' || text.charAt(dataEnd - 1) === '\r')) dataEnd--;
  }

  var rawSlice = text.slice(dataStart, dataEnd);
  var rawBytes = new Array(rawSlice.length);
  for (var i = 0; i < rawSlice.length; i++) {
    var code = rawSlice.charCodeAt(i) & 0xFF;
    rawBytes[i] = code > 127 ? code - 256 : code;
  }

  var filterM = /\/Filter\s*\/(\w+)/.exec(dictText);
  var filterArrM = /\/Filter\s*\[([\s\S]*?)\]/.exec(dictText);
  var filters = [];
  if (filterM) filters.push(filterM[1]);
  else if (filterArrM) {
    var fm = /\/(\w+)/g, fmatch;
    while ((fmatch = fm.exec(filterArrM[1]))) filters.push(fmatch[1]);
  }

  return { dictText: dictText, rawBytes: rawBytes, filters: filters };
}

// ASCII85 (PDF-Variante, Ende "~>", "z" = 4 Nullbytes). Ein-/Ausgabe: signed Bytes.
function _pdfDecodeAscii85_(bytes) {
  var out = [];
  var group = [];
  function flush(n) {
    var v = 0;
    for (var k = 0; k < 5; k++) v = v * 85 + (k < group.length ? group[k] : 84);
    var b = [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
    for (var j = 0; j < n; j++) out.push(b[j] > 127 ? b[j] - 256 : b[j]);
    group = [];
  }
  for (var i = 0; i < bytes.length; i++) {
    var c = bytes[i] & 0xFF;
    if (c === 0x7E) break;                          // "~>" = Ende
    if (c <= 0x20) continue;                        // Whitespace
    if (c === 0x7A && group.length === 0) { out.push(0, 0, 0, 0); continue; } // "z"
    if (c < 0x21 || c > 0x75) throw new Error('Invalid ASCII85 data.');
    group.push(c - 33);
    if (group.length === 5) flush(4);
  }
  if (group.length) flush(group.length - 1);
  return out;
}

function _pdfDecodeAsciiHex_(bytes) {
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var ch = String.fromCharCode(bytes[i] & 0xFF);
    if (ch === '>') break;
    if (/[0-9a-fA-F]/.test(ch)) hex += ch;
  }
  if (hex.length % 2) hex += '0';
  var out = [];
  for (var j = 0; j < hex.length; j += 2) {
    var b = parseInt(hex.substr(j, 2), 16);
    out.push(b > 127 ? b - 256 : b);
  }
  return out;
}

// Dekomprimiert einen Stream zu Klartext (Binärstring, 1 Zeichen = 1 Byte).
// Wirft, wenn ein nicht unterstützter Filter benutzt wird - Aufrufer fängt das ab.
function _pdfDecodeStreamToText_(streamData) {
  var bytes = streamData.rawBytes;
  streamData.filters.forEach(function(f) {
    if (f === 'FlateDecode' || f === 'Fl') {
      bytes = inflateZlib_(bytes).map(function(b) { return b > 127 ? b - 256 : b; });
    } else if (f === 'ASCII85Decode' || f === 'A85') {
      // z.B. von ReportLab erzeugte PDFs: [/ASCII85Decode /FlateDecode]
      bytes = _pdfDecodeAscii85_(bytes);
    } else if (f === 'ASCIIHexDecode' || f === 'AHx') {
      bytes = _pdfDecodeAsciiHex_(bytes);
    } else {
      throw new Error('Unsupported stream filter: ' + f);
    }
  });
  return _pdfBytesToBinaryString_(bytes);
}


// ─── STRING-LITERALE (Content-Streams und Objekte) ─────────────────────────
// Liest einen literalen String "(...)" inkl. Escapes/verschachtelter Klammern,
// beginnend bei text[i] === '('. Gibt {value, next} zurück.
function _pdfReadLiteralString_(text, i) {
  var depth = 0, out = [];
  do {
    var ch = text.charAt(i);
    if (ch === '\\') {
      var next = text.charAt(i + 1);
      if (next === 'n') { out.push('\n'); i += 2; }
      else if (next === 'r') { out.push('\r'); i += 2; }
      else if (next === 't') { out.push('\t'); i += 2; }
      else if (next === 'b' || next === 'f') { i += 2; }
      else if (next === '\n') { i += 2; }
      else if (next === '\r') { i += 2; if (text.charAt(i) === '\n') i++; }
      else if (/[0-7]/.test(next)) {
        var oct = next; i += 2;
        for (var k = 0; k < 2 && /[0-7]/.test(text.charAt(i)); k++) { oct += text.charAt(i); i++; }
        out.push(String.fromCharCode(parseInt(oct, 8) & 0xFF));
      } else { out.push(next); i += 2; }
      continue;
    }
    if (ch === '(') { depth++; if (depth > 1) out.push(ch); i++; continue; }
    if (ch === ')') { depth--; if (depth > 0) out.push(ch); i++; continue; }
    out.push(ch); i++;
  } while (depth > 0 && i < text.length);
  return { value: out.join(''), next: i };
}

function _pdfReadHexString_(text, i) {
  var end = text.indexOf('>', i);
  if (end === -1) end = text.length;
  var hex = text.slice(i + 1, end).replace(/\s+/g, '');
  if (hex.length % 2) hex += '0';
  var out = [];
  for (var k = 0; k < hex.length; k += 2) out.push(String.fromCharCode(parseInt(hex.substr(k, 2), 16) || 0));
  return { value: out.join(''), next: end + 1 };
}

// ─── MINIMALER PDF-OBJEKTPARSER ────────────────────────────────────────────
// Werte-Darstellung: Zahl -> number, Name -> {n}, String -> {s} (Bytes als
// Binärstring), Array -> Array, Dictionary -> {d: {...}}, Referenz -> {r},
// Operator/Schlüsselwort (nur in Content-Streams) -> {op}.
function _pdfIsWs_(c) { return c === 32 || c === 10 || c === 13 || c === 9 || c === 12 || c === 0; }
function _pdfIsDelim_(c) {
  return c === 40 || c === 41 || c === 60 || c === 62 || c === 91 || c === 93 ||
         c === 123 || c === 125 || c === 47 || c === 37;
}

function _pdfSkipWs_(s, i) {
  var n = s.length;
  while (i < n) {
    var c = s.charCodeAt(i);
    if (_pdfIsWs_(c)) { i++; continue; }
    if (c === 37) { while (i < n && s.charCodeAt(i) !== 10 && s.charCodeAt(i) !== 13) i++; continue; }
    break;
  }
  return i;
}

var _PDF_REF_RE_ = /\s+(\d+)\s+R(?![^\s\/\[\]<>()%])/y;

// Liest einen Wert ab Position i. allowRefs: "N G R" als Referenz erkennen
// (in Content-Streams gibt es keine Referenzen).
function _pdfParseValue_(s, i, allowRefs) {
  i = _pdfSkipWs_(s, i);
  var n = s.length;
  if (i >= n) return { v: undefined, next: n };
  var c = s.charCodeAt(i);

  if (c === 40) { // (
    var lit = _pdfReadLiteralString_(s, i);
    return { v: { s: lit.value }, next: lit.next };
  }
  if (c === 60) { // <
    if (s.charCodeAt(i + 1) === 60) {
      var d = {};
      i += 2;
      while (true) {
        i = _pdfSkipWs_(s, i);
        if (i >= n) break;
        if (s.charCodeAt(i) === 62 && s.charCodeAt(i + 1) === 62) { i += 2; break; }
        var key = _pdfParseValue_(s, i, allowRefs);
        if (key.next <= i) { i++; continue; }
        if (!key.v || key.v.n === undefined) { i = key.next; continue; } // defekter Eintrag: überspringen
        var val = _pdfParseValue_(s, key.next, allowRefs);
        d[key.v.n] = val.v;
        i = val.next;
      }
      return { v: { d: d }, next: i };
    }
    var hx = _pdfReadHexString_(s, i);
    return { v: { s: hx.value }, next: hx.next };
  }
  if (c === 91) { // [
    var arr = [];
    i++;
    while (true) {
      i = _pdfSkipWs_(s, i);
      if (i >= n) break;
      if (s.charCodeAt(i) === 93) { i++; break; }
      var el = _pdfParseValue_(s, i, allowRefs);
      if (el.next <= i) { i++; continue; }
      if (el.v !== undefined && !(el.v && el.v.op !== undefined)) arr.push(el.v);
      i = el.next;
    }
    return { v: arr, next: i };
  }
  if (c === 47) { // /Name
    var j = i + 1;
    while (j < n) { var cj = s.charCodeAt(j); if (_pdfIsWs_(cj) || _pdfIsDelim_(cj)) break; j++; }
    var name = s.slice(i + 1, j).replace(/#([0-9A-Fa-f]{2})/g, function(m, h) { return String.fromCharCode(parseInt(h, 16)); });
    return { v: { n: name }, next: j };
  }
  if ((c >= 48 && c <= 57) || c === 43 || c === 45 || c === 46) {
    var j2 = i + 1, isInt = c !== 46;
    while (j2 < n) {
      var c2 = s.charCodeAt(j2);
      if (c2 >= 48 && c2 <= 57) { j2++; continue; }
      if (c2 === 46) { isInt = false; j2++; continue; }
      break;
    }
    var num = parseFloat(s.slice(i, j2));
    if (isNaN(num)) num = 0;
    if (allowRefs && isInt && c !== 43 && c !== 45) {
      _PDF_REF_RE_.lastIndex = j2;
      var rm = _PDF_REF_RE_.exec(s);
      if (rm) return { v: { r: num }, next: _PDF_REF_RE_.lastIndex };
    }
    return { v: num, next: j2 };
  }
  // Schlüsselwort / Operator
  var k = i;
  while (k < n) { var ck = s.charCodeAt(k); if (_pdfIsWs_(ck) || _pdfIsDelim_(ck)) break; k++; }
  if (k === i) return { v: undefined, next: i + 1 }; // verirrtes ")", ">", "{" ...
  var word = s.slice(i, k);
  if (word === 'true') return { v: true, next: k };
  if (word === 'false') return { v: false, next: k };
  if (word === 'null') return { v: null, next: k };
  return { v: { op: word }, next: k };
}

// ─── DOKUMENT-ZUGRIFF (Objekte auflösen, auch aus Object Streams) ─────────
function _pdfOpenDoc_(text, offsets) {
  return { text: text, offsets: offsets, objCache: {}, streamCache: {}, objStm: null, fontCache: {} };
}

function _pdfDocObjStmIndex_(doc) {
  if (doc.objStm) return doc.objStm;
  var index = {};
  var t = doc.text;
  var re = /\/Type\s*\/ObjStm\b/g, m;
  while ((m = re.exec(t))) {
    var objIdx = t.lastIndexOf('obj', m.index);
    if (objIdx === -1) continue;
    var head = /(\d+)\s+\d+\s+$/.exec(t.slice(Math.max(0, objIdx - 24), objIdx));
    if (!head) continue;
    try {
      var sd = _pdfGetStreamData_(t, doc.offsets, parseInt(head[1], 10));
      if (!sd) continue;
      var dec = _pdfDecodeStreamToText_(sd);
      var nM = /\/N\s+(\d+)/.exec(sd.dictText), fM = /\/First\s+(\d+)/.exec(sd.dictText);
      if (!nM || !fM) continue;
      var first = parseInt(fM[1], 10), count = parseInt(nM[1], 10);
      var nums = dec.slice(0, first).replace(/^\s+|\s+$/g, '').split(/\s+/);
      for (var k = 0; k + 1 < nums.length && k / 2 < count; k += 2) {
        index[parseInt(nums[k], 10)] = { text: dec, pos: first + parseInt(nums[k + 1], 10) };
      }
    } catch (e) { /* nicht dekodierbarer Object Stream: Objekte darin bleiben unbekannt */ }
  }
  doc.objStm = index;
  return index;
}

function _pdfDocObj_(doc, num) {
  if (doc.objCache.hasOwnProperty(num)) return doc.objCache[num];
  var v;
  if (doc.offsets.hasOwnProperty(num)) {
    var p = doc.text.indexOf('obj', doc.offsets[num]);
    if (p !== -1) v = _pdfParseValue_(doc.text, p + 3, true).v;
  } else {
    var loc = _pdfDocObjStmIndex_(doc)[num];
    if (loc) v = _pdfParseValue_(loc.text, loc.pos, true).v;
  }
  if (v === undefined || (v && v.op !== undefined)) v = null;
  doc.objCache[num] = v;
  return v;
}

// Folgt Referenzen, bis ein direkter Wert vorliegt.
function _pdfDocRes_(doc, v) {
  for (var guard = 0; v && typeof v === 'object' && v.r !== undefined && guard < 32; guard++) v = _pdfDocObj_(doc, v.r);
  return v;
}

function _pdfDocGet_(doc, dict, key) {
  dict = _pdfDocRes_(doc, dict);
  if (!dict || !dict.d || !dict.d.hasOwnProperty(key)) return undefined;
  return _pdfDocRes_(doc, dict.d[key]);
}

function _pdfNum_(v, dflt) { return typeof v === 'number' ? v : dflt; }
function _pdfName_(v) { return v && v.n !== undefined ? v.n : null; }

// Dekodierter Inhalt eines Stream-Objekts (per Referenz), oder null.
function _pdfDocStreamText_(doc, ref) {
  if (!ref || ref.r === undefined) return null;
  var num = ref.r;
  if (doc.streamCache.hasOwnProperty(num)) return doc.streamCache[num];
  var out = null;
  try {
    var sd = _pdfGetStreamData_(doc.text, doc.offsets, num);
    if (sd) out = _pdfDecodeStreamToText_(sd);
  } catch (e) {
    Logger.log('_pdfDocStreamText_: Stream ' + num + ' nicht dekodierbar: ' + e.message);
  }
  doc.streamCache[num] = out;
  return out;
}

// ─── SCHRIFTEN: CODE -> UNICODE + BREITE ──────────────────────────────────
// Breiten der Standard-14-Schriften (Codes 32..255 in WinAnsi, 1/1000 em; 0 = unbekannt) für PDFs, die
// eine dieser Schriften ohne /Widths verwenden.
var _PDF_STD_WIDTHS_ = {
  'Helvetica': '278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500',
  'Helvetica-Bold': '278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556',
  'Times-Roman': '250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,0,500,0,333,500,444,1000,500,500,333,1000,556,333,889,0,611,0,0,333,333,444,444,350,500,1000,333,980,389,333,722,0,444,722,250,333,500,500,500,500,200,500,333,760,276,500,564,333,760,333,400,564,300,300,333,500,453,250,333,300,310,500,750,750,750,444,722,722,722,722,722,722,889,667,611,611,611,611,333,333,333,333,722,722,722,722,722,722,722,564,722,722,722,722,722,722,556,500,444,444,444,444,444,444,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,564,500,500,500,500,500,500,500,500',
  'Times-Bold': '250,333,555,500,500,1000,833,278,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,556,556,444,389,333,556,500,722,500,500,444,394,220,394,520,0,500,0,333,500,500,1000,500,500,333,1000,556,333,1000,0,667,0,0,333,333,500,500,350,500,1000,333,1000,389,333,722,0,444,722,250,333,500,500,500,500,220,500,333,747,300,500,570,333,747,333,400,570,300,300,333,556,540,250,333,300,330,500,750,750,750,500,722,722,722,722,722,722,1000,722,667,667,667,667,389,389,389,389,722,722,778,778,778,778,778,570,778,722,722,722,722,722,611,556,500,500,500,500,500,500,722,444,444,444,444,444,278,278,278,278,500,556,500,500,500,500,500,570,500,556,556,556,556,500,556,500'
};

function _pdfStdWidthsFor_(baseFont) {
  var b = String(baseFont || '').replace(/^[A-Z]{6}\+/, '');
  if (/Courier/i.test(b)) return { fixed: 600 };
  var key = null;
  if (/Helvetica|Arial/i.test(b)) key = /Bold/i.test(b) ? 'Helvetica-Bold' : 'Helvetica';
  else if (/Times/i.test(b)) key = /Bold/i.test(b) ? 'Times-Bold' : 'Times-Roman';
  if (!key) return null;
  var arr = _PDF_STD_WIDTHS_[key].split(',');
  var map = {};
  for (var i = 0; i < arr.length; i++) map[32 + i] = parseInt(arr[i], 10);
  return { map: map };
}

// Windows-1252-Bereich 0x80-0x9F (WinAnsiEncoding); Rest = Latin-1.
var _PDF_WINANSI_80_ = '€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž�' +
                       '�‘’“”•–—˜™š›œ�žŸ';

function _pdfBaseEncodingTable_(encName) {
  var t = new Array(256);
  for (var c = 0; c < 256; c++) {
    if (c < 32) t[c] = '';
    else if (c >= 0x80 && c <= 0x9F) t[c] = _PDF_WINANSI_80_.charAt(c - 0x80);
    else t[c] = String.fromCharCode(c);
  }
  if (encName === 'StandardEncoding') { t[0x27] = '’'; t[0x60] = '‘'; }
  t[0xAD] = '-';
  return t;
}

var _PDF_GLYPH_NAMES_ = null;
function _pdfGlyphNameTable_() {
  if (_PDF_GLYPH_NAMES_) return _PDF_GLYPH_NAMES_;
  var t = {
    space: ' ', exclam: '!', quotedbl: '"', numbersign: '#', dollar: '$', percent: '%', ampersand: '&',
    quotesingle: "'", quoteright: '’', quoteleft: '‘', parenleft: '(', parenright: ')', asterisk: '*',
    plus: '+', comma: ',', hyphen: '-', minus: '-', period: '.', slash: '/', colon: ':', semicolon: ';',
    less: '<', equal: '=', greater: '>', question: '?', at: '@', bracketleft: '[', backslash: '\\',
    bracketright: ']', asciicircum: '^', underscore: '_', grave: '`', braceleft: '{', bar: '|',
    braceright: '}', asciitilde: '~', exclamdown: '¡', cent: '¢', sterling: '£',
    currency: '¤', yen: '¥', brokenbar: '¦', section: '§', dieresis: '¨',
    copyright: '©', ordfeminine: 'ª', guillemotleft: '«', logicalnot: '¬',
    registered: '®', macron: '¯', degree: '°', plusminus: '±', twosuperior: '²',
    threesuperior: '³', acute: '´', mu: 'µ', paragraph: '¶', periodcentered: '·',
    cedilla: '¸', onesuperior: '¹', ordmasculine: 'º', guillemotright: '»',
    onequarter: '¼', onehalf: '½', threequarters: '¾', questiondown: '¿',
    multiply: '×', divide: '÷', germandbls: 'ß', AE: 'Æ', ae: 'æ',
    Oslash: 'Ø', oslash: 'ø', OE: 'Œ', oe: 'œ', Lslash: 'Ł', lslash: 'ł',
    Eth: 'Ð', eth: 'ð', Thorn: 'Þ', thorn: 'þ', dotlessi: 'ı',
    endash: '–', emdash: '—', quotedblleft: '“', quotedblright: '”',
    quotesinglbase: '‚', quotedblbase: '„', dagger: '†', daggerdbl: '‡',
    bullet: '•', ellipsis: '…', perthousand: '‰', guilsinglleft: '‹',
    guilsinglright: '›', Euro: '€', trademark: '™', fi: 'fi', fl: 'fl', ff: 'ff',
    ffi: 'ffi', ffl: 'ffl', nbspace: ' ', nonbreakingspace: ' ', sfthyphen: '-', softhyphen: '-',
    florin: 'ƒ', circumflex: 'ˆ', tilde: '˜',
    zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9'
  };
  // Akzentbuchstaben (eacute, Adieresis, scaron, ...) aus der Unicode-Zerlegung ableiten.
  var accents = { 0x301: 'acute', 0x300: 'grave', 0x302: 'circumflex', 0x308: 'dieresis', 0x303: 'tilde',
    0x30A: 'ring', 0x327: 'cedilla', 0x30C: 'caron', 0x328: 'ogonek', 0x306: 'breve', 0x304: 'macron',
    0x307: 'dotaccent', 0x30B: 'hungarumlaut' };
  for (var cp = 0xC0; cp <= 0x17F; cp++) {
    var ch = String.fromCharCode(cp);
    var nfd = ch.normalize ? ch.normalize('NFD') : ch;
    if (nfd.length === 2 && accents[nfd.charCodeAt(1)]) t[nfd.charAt(0) + accents[nfd.charCodeAt(1)]] = ch;
  }
  _PDF_GLYPH_NAMES_ = t;
  return t;
}

function _pdfGlyphNameToUnicode_(name) {
  if (!name) return '';
  var base = name.split('.')[0];
  if (!base) return '';
  var parts = base.split('_');
  if (parts.length > 1) return parts.map(_pdfGlyphNameToUnicode_).join('');
  if (/^[A-Za-z]$/.test(base)) return base;
  var t = _pdfGlyphNameTable_();
  if (t.hasOwnProperty(base)) return t[base];
  var m = /^uni((?:[0-9A-Fa-f]{4})+)$/.exec(base);
  if (m) {
    var out = '';
    for (var i = 0; i < m[1].length; i += 4) out += String.fromCharCode(parseInt(m[1].substr(i, 4), 16));
    return out;
  }
  m = /^u([0-9A-Fa-f]{4,6})$/.exec(base);
  if (m) {
    var cp = parseInt(m[1], 16);
    if (cp <= 0xFFFF) return String.fromCharCode(cp);
    cp -= 0x10000;
    return String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
  }
  return '';
}

function _pdfUtf16HexToString_(hex) {
  hex = hex.replace(/\s+/g, '');
  if (hex.length <= 2) return hex ? String.fromCharCode(parseInt(hex, 16)) : '';
  var out = '';
  for (var i = 0; i + 4 <= hex.length; i += 4) out += String.fromCharCode(parseInt(hex.substr(i, 4), 16));
  return out;
}

// Parst eine CMap (ToUnicode oder eingebettetes Encoding): bfchar/bfrange ->
// Unicode-Zuordnung, codespacerange -> Länge der Zeichencodes.
function _pdfParseCMap_(cmapText) {
  var map = {}, codespace = [];
  var block, m;

  var csRe = /begincodespacerange([\s\S]*?)endcodespacerange/g;
  while ((block = csRe.exec(cmapText))) {
    var pairRe = /<([0-9A-Fa-f\s]*)>\s*<([0-9A-Fa-f\s]*)>/g;
    while ((m = pairRe.exec(block[1]))) {
      var lo = m[1].replace(/\s+/g, '');
      codespace.push({ len: Math.max(1, Math.ceil(lo.length / 2)), lo: parseInt(lo, 16), hi: parseInt(m[2].replace(/\s+/g, ''), 16) });
    }
  }

  var charRe = /beginbfchar([\s\S]*?)endbfchar/g;
  while ((block = charRe.exec(cmapText))) {
    var cRe = /<([0-9A-Fa-f\s]*)>\s*<([0-9A-Fa-f\s]*)>/g;
    while ((m = cRe.exec(block[1]))) map[parseInt(m[1].replace(/\s+/g, ''), 16)] = _pdfUtf16HexToString_(m[2]);
  }

  var rangeRe = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((block = rangeRe.exec(cmapText))) {
    var rRe = /<([0-9A-Fa-f\s]*)>\s*<([0-9A-Fa-f\s]*)>\s*(<[0-9A-Fa-f\s]*>|\[[^\]]*\])/g;
    while ((m = rRe.exec(block[1]))) {
      var start = parseInt(m[1].replace(/\s+/g, ''), 16), end = parseInt(m[2].replace(/\s+/g, ''), 16);
      if (isNaN(start) || isNaN(end) || end < start || end - start > 65535) continue;
      if (m[3].charAt(0) === '[') {
        var items = m[3].match(/<[0-9A-Fa-f\s]*>/g) || [];
        for (var k = 0; k < items.length && start + k <= end; k++) map[start + k] = _pdfUtf16HexToString_(items[k].slice(1, -1));
      } else {
        var baseStr = _pdfUtf16HexToString_(m[3].slice(1, -1));
        if (!baseStr) continue;
        var prefix = baseStr.slice(0, -1), lastCode = baseStr.charCodeAt(baseStr.length - 1);
        for (var c = start; c <= end; c++) map[c] = prefix + String.fromCharCode(lastCode + (c - start));
      }
    }
  }
  return { map: map, codespace: codespace };
}

function _pdfLoadFont_(doc, fontRef) {
  var key = fontRef && fontRef.r !== undefined ? 'r' + fontRef.r : null;
  if (key && doc.fontCache.hasOwnProperty(key)) return doc.fontCache[key];
  var font;
  try {
    font = _pdfBuildFont_(doc, _pdfDocRes_(doc, fontRef));
  } catch (e) {
    Logger.log('_pdfLoadFont_: Schrift nicht auswertbar: ' + e.message);
    font = _pdfBuildFont_(doc, null);
  }
  if (key) doc.fontCache[key] = font;
  return font;
}

function _pdfBuildFont_(doc, fontDict) {
  var font = {
    type0: false, widths: {}, dw: 1000, missingWidth: 0, std: null,
    scale: 0.001, asc: 0.8, desc: -0.2, toUni: null, encTable: null, codespace: null, unicodeCodes: false
  };
  if (!fontDict || !fontDict.d) { font.encTable = _pdfBaseEncodingTable_('WinAnsiEncoding'); font.missingWidth = 500; return font; }

  var subtype = _pdfName_(_pdfDocGet_(doc, fontDict, 'Subtype'));
  var baseFont = _pdfName_(_pdfDocGet_(doc, fontDict, 'BaseFont'));
  var descriptor = null;

  if (subtype === 'Type0') {
    font.type0 = true;
    var descs = _pdfDocGet_(doc, fontDict, 'DescendantFonts');
    var cid = Array.isArray(descs) && descs.length ? _pdfDocRes_(doc, descs[0]) : null;
    if (cid && cid.d) {
      font.dw = _pdfNum_(_pdfDocGet_(doc, cid, 'DW'), 1000);
      var w = _pdfDocGet_(doc, cid, 'W');
      if (Array.isArray(w)) {
        for (var i = 0; i < w.length;) {
          var first = _pdfDocRes_(doc, w[i]), next = _pdfDocRes_(doc, w[i + 1]);
          if (typeof first !== 'number') break;
          if (Array.isArray(next)) {
            for (var j = 0; j < next.length; j++) font.widths[first + j] = _pdfNum_(_pdfDocRes_(doc, next[j]), font.dw);
            i += 2;
          } else {
            var last = next, width = _pdfNum_(_pdfDocRes_(doc, w[i + 2]), font.dw);
            if (typeof last !== 'number' || last - first > 65535) break;
            for (var c = first; c <= last; c++) font.widths[c] = width;
            i += 3;
          }
        }
      }
      descriptor = _pdfDocGet_(doc, cid, 'FontDescriptor');
    }
    var enc = fontDict.d.Encoding;
    var encName = _pdfName_(_pdfDocRes_(doc, enc));
    if (encName) {
      // Vordefinierte Unicode-CMaps (z.B. UniGB-UCS2-H): Code = UTF-16-Wert.
      if (/^Uni.*(UCS2|UTF16)/.test(encName)) font.unicodeCodes = true;
    } else if (enc && enc.r !== undefined) {
      var encText = _pdfDocStreamText_(doc, enc);
      if (encText) {
        var cs = _pdfParseCMap_(encText).codespace;
        if (cs.length) font.codespace = cs;
      }
    }
  } else {
    var firstChar = _pdfNum_(_pdfDocGet_(doc, fontDict, 'FirstChar'), 0);
    var widths = _pdfDocGet_(doc, fontDict, 'Widths');
    if (Array.isArray(widths)) {
      for (var k = 0; k < widths.length; k++) {
        var wv = _pdfDocRes_(doc, widths[k]);
        if (typeof wv === 'number') font.widths[firstChar + k] = wv;
      }
    } else {
      font.std = _pdfStdWidthsFor_(baseFont);
    }
    if (subtype === 'Type3') {
      var fm = _pdfDocGet_(doc, fontDict, 'FontMatrix');
      if (Array.isArray(fm) && typeof fm[0] === 'number' && fm[0]) font.scale = Math.abs(fm[0]);
    }
    descriptor = _pdfDocGet_(doc, fontDict, 'FontDescriptor');

    var encV = _pdfDocGet_(doc, fontDict, 'Encoding');
    var baseEnc = 'WinAnsiEncoding', diffs = null;
    if (_pdfName_(encV)) baseEnc = _pdfName_(encV);
    else if (encV && encV.d) {
      baseEnc = _pdfName_(_pdfDocGet_(doc, encV, 'BaseEncoding')) || baseEnc;
      diffs = _pdfDocGet_(doc, encV, 'Differences');
    }
    font.encTable = _pdfBaseEncodingTable_(baseEnc);
    if (Array.isArray(diffs)) {
      var code = 0;
      diffs.forEach(function(item) {
        item = _pdfDocRes_(doc, item);
        if (typeof item === 'number') code = item;
        else if (item && item.n !== undefined) { if (code >= 0 && code < 256) font.encTable[code] = _pdfGlyphNameToUnicode_(item.n) || '�'; code++; }
      });
    }
  }

  if (descriptor && descriptor.d) {
    var asc = _pdfNum_(_pdfDocGet_(doc, descriptor, 'Ascent'), 0) / 1000;
    var dsc = _pdfNum_(_pdfDocGet_(doc, descriptor, 'Descent'), 0) / 1000;
    if (asc > 0.5 && asc < 1.2) font.asc = asc;
    if (dsc < 0 && dsc > -0.5) font.desc = dsc;
    font.missingWidth = _pdfNum_(_pdfDocGet_(doc, descriptor, 'MissingWidth'), 0);
  }
  if (!font.missingWidth) font.missingWidth = font.type0 ? font.dw : 500;

  var tu = fontDict.d.ToUnicode;
  if (tu && tu.r !== undefined) {
    var tuText = _pdfDocStreamText_(doc, tu);
    if (tuText) font.toUni = _pdfParseCMap_(tuText).map;
  }
  return font;
}

// Liest den nächsten Zeichencode ab str[i] (1 Byte bei einfachen Schriften,
// bei Type0 laut Codespace, standardmäßig 2 Byte wie bei Identity-H).
function _pdfNextCode_(font, str, i) {
  if (!font.type0) return { code: str.charCodeAt(i) & 0xFF, len: 1 };
  if (font.codespace) {
    for (var len = 1; len <= 4 && i + len <= str.length; len++) {
      var code = 0;
      for (var b = 0; b < len; b++) code = code * 256 + (str.charCodeAt(i + b) & 0xFF);
      for (var r = 0; r < font.codespace.length; r++) {
        var cs = font.codespace[r];
        if (cs.len === len && code >= cs.lo && code <= cs.hi) return { code: code, len: len };
      }
    }
  }
  if (i + 1 >= str.length) return { code: str.charCodeAt(i) & 0xFF, len: 1 };
  return { code: ((str.charCodeAt(i) & 0xFF) << 8) | (str.charCodeAt(i + 1) & 0xFF), len: 2 };
}

function _pdfGlyphUnicode_(font, code) {
  if (font.toUni && font.toUni.hasOwnProperty(code)) return font.toUni[code];
  if (font.type0) return font.unicodeCodes ? String.fromCharCode(code) : '�';
  return font.encTable ? font.encTable[code] : String.fromCharCode(code);
}

// Breite in Textraum-Einheiten (bei Schriftgröße 1).
function _pdfGlyphWidth_(font, code) {
  var w;
  if (font.widths.hasOwnProperty(code)) w = font.widths[code];
  else if (font.std) w = font.std.fixed || font.std.map[code] || font.missingWidth;
  else w = font.type0 ? font.dw : font.missingWidth;
  return w * font.scale;
}

// ─── CONTENT-STREAM INTERPRETIEREN -> GLYPHEN MIT POSITION ────────────────
/**
 * Liefert alle Glyphen einer Seite in Zeichenreihenfolge des Content-Streams:
 * { u: Unicode-Text, ox/oy: Ursprung, ex/ey: Ende (nach Vorschub),
 *   box: [x0, y0, x1, y1] im Seitenraum, h: effektive Schrifthöhe }.
 * page: Seitenobjekt aus _pdfCollectPages_ (braucht .num).
 */
function _pdfExtractPageGlyphs_(doc, page) {
  var pageObj = _pdfDocObj_(doc, page.num);
  if (!pageObj || !pageObj.d) return null;

  // /Resources kann vom Pages-Elternknoten geerbt sein.
  var resources = null, node = pageObj;
  for (var depth = 0; node && depth < 32 && !resources; depth++) {
    resources = _pdfDocGet_(doc, node, 'Resources') || null;
    node = _pdfDocGet_(doc, node, 'Parent');
  }

  var contents = pageObj.d.Contents;
  var refs = [];
  var resolved = _pdfDocRes_(doc, contents);
  if (contents && contents.r !== undefined && !Array.isArray(resolved)) refs.push(contents);
  else if (Array.isArray(resolved)) resolved.forEach(function(r) { if (r && r.r !== undefined) refs.push(r); });
  if (!refs.length) return [];

  var parts = [];
  for (var i = 0; i < refs.length; i++) {
    var t = _pdfDocStreamText_(doc, refs[i]);
    if (t === null) return null; // unvollständiger Inhalt -> lieber kein Ergebnis als ein falsches
    parts.push(t);
  }
  var glyphs = [];
  _pdfRunContent_(doc, parts.join('\n'), resources, _pdfMatIdentity_(), glyphs, 0);
  return glyphs;
}

function _pdfRunContent_(doc, content, resources, baseCtm, glyphs, depth) {
  var gs = { ctm: baseCtm, font: null, size: 0, tc: 0, tw: 0, th: 1, tl: 0, rise: 0 };
  var stack = [];
  var tm = _pdfMatIdentity_(), tlm = _pdfMatIdentity_();
  var operands = [];
  var n = content.length, i = 0;
  var fontsDict = _pdfDocGet_(doc, resources, 'Font');
  var xobjDict = _pdfDocGet_(doc, resources, 'XObject');
  var fallbackFont = null;

  function num(k) { var v = operands[operands.length - k]; return typeof v === 'number' ? v : 0; }
  function copyGs() {
    return { ctm: gs.ctm, font: gs.font, size: gs.size, tc: gs.tc, tw: gs.tw, th: gs.th, tl: gs.tl, rise: gs.rise };
  }
  function moveLine(tx, ty) { tlm = _pdfMatMul_([1, 0, 0, 1, tx, ty], tlm); tm = tlm; }

  function showString(str) {
    var font = gs.font;
    if (!font) { if (!fallbackFont) fallbackFont = _pdfBuildFont_(doc, null); font = fallbackFont; }
    var size = gs.size || 1;
    var k = 0;
    while (k < str.length) {
      var cc = _pdfNextCode_(font, str, k);
      k += cc.len;
      var w0 = _pdfGlyphWidth_(font, cc.code);
      var u = _pdfGlyphUnicode_(font, cc.code);
      var trm = _pdfMatMul_(_pdfMatMul_([size * gs.th, 0, 0, size, 0, gs.rise], tm), gs.ctm);
      var pts = [[0, font.desc], [w0, font.desc], [w0, font.asc], [0, font.asc]];
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (var p = 0; p < 4; p++) {
        var px = trm[0] * pts[p][0] + trm[2] * pts[p][1] + trm[4];
        var py = trm[1] * pts[p][0] + trm[3] * pts[p][1] + trm[5];
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
      glyphs.push({
        u: u,
        ox: trm[4], oy: trm[5],
        ex: trm[0] * w0 + trm[4], ey: trm[1] * w0 + trm[5],
        dx: trm[0], dy: trm[1],
        h: Math.sqrt(trm[2] * trm[2] + trm[3] * trm[3]),
        box: [x0, y0, x1, y1]
      });
      var isSpace = cc.len === 1 && cc.code === 32;
      var tx = (w0 * size + gs.tc + (isSpace ? gs.tw : 0)) * gs.th;
      tm = _pdfMatMul_([1, 0, 0, 1, tx, 0], tm);
    }
  }

  while (true) {
    i = _pdfSkipWs_(content, i);
    if (i >= n) break;
    var r = _pdfParseValue_(content, i, false);
    if (r.next <= i) { i++; continue; }
    i = r.next;
    var v = r.v;
    if (v === undefined) continue;
    if (!(v && v.op !== undefined)) { operands.push(v); continue; }

    var op = v.op;
    switch (op) {
      case 'q': stack.push(copyGs()); break;
      case 'Q': if (stack.length) gs = stack.pop(); break;
      case 'cm':
        if (operands.length >= 6) gs.ctm = _pdfMatMul_([num(6), num(5), num(4), num(3), num(2), num(1)], gs.ctm);
        break;
      case 'BT': tm = _pdfMatIdentity_(); tlm = _pdfMatIdentity_(); break;
      case 'Tf': {
        var fname = operands[operands.length - 2];
        gs.size = num(1);
        var fref = fname && fname.n !== undefined && fontsDict && fontsDict.d ? fontsDict.d[fname.n] : null;
        gs.font = fref ? _pdfLoadFont_(doc, fref) : null;
        break;
      }
      case 'Tc': gs.tc = num(1); break;
      case 'Tw': gs.tw = num(1); break;
      case 'Tz': gs.th = num(1) / 100; break;
      case 'TL': gs.tl = num(1); break;
      case 'Ts': gs.rise = num(1); break;
      case 'Tm':
        if (operands.length >= 6) { tm = [num(6), num(5), num(4), num(3), num(2), num(1)]; tlm = tm; }
        break;
      case 'Td': if (operands.length >= 2) moveLine(num(2), num(1)); break;
      case 'TD': if (operands.length >= 2) { gs.tl = -num(1); moveLine(num(2), num(1)); } break;
      case 'T*': moveLine(0, -gs.tl); break;
      case 'Tj': {
        var s1 = operands[operands.length - 1];
        if (s1 && s1.s !== undefined) showString(s1.s);
        break;
      }
      case "'": {
        moveLine(0, -gs.tl);
        var s2 = operands[operands.length - 1];
        if (s2 && s2.s !== undefined) showString(s2.s);
        break;
      }
      case '"': {
        if (operands.length >= 3) { gs.tw = num(3); gs.tc = num(2); }
        moveLine(0, -gs.tl);
        var s3 = operands[operands.length - 1];
        if (s3 && s3.s !== undefined) showString(s3.s);
        break;
      }
      case 'TJ': {
        var arr = operands[operands.length - 1];
        if (Array.isArray(arr)) {
          arr.forEach(function(item) {
            if (typeof item === 'number') tm = _pdfMatMul_([1, 0, 0, 1, -item / 1000 * (gs.size || 1) * gs.th, 0], tm);
            else if (item && item.s !== undefined) showString(item.s);
          });
        }
        break;
      }
      case 'Do': {
        var xname = operands[operands.length - 1];
        if (depth < 6 && xname && xname.n !== undefined && xobjDict && xobjDict.d && xobjDict.d[xname.n]) {
          var xref = xobjDict.d[xname.n];
          var xobj = _pdfDocRes_(doc, xref);
          if (xobj && xobj.d && _pdfName_(_pdfDocGet_(doc, xobj, 'Subtype')) === 'Form') {
            var formText = _pdfDocStreamText_(doc, xref);
            if (formText) {
              var fmx = _pdfDocGet_(doc, xobj, 'Matrix');
              var formCtm = Array.isArray(fmx) && fmx.length === 6 ? _pdfMatMul_(fmx, gs.ctm) : gs.ctm;
              _pdfRunContent_(doc, formText, _pdfDocGet_(doc, xobj, 'Resources') || resources, formCtm, glyphs, depth + 1);
            }
          }
        }
        break;
      }
      case 'BI': {
        // Inline-Bild: Binärdaten bis zum "EI" überspringen statt zu parsen.
        var idIdx = content.indexOf('ID', i);
        var p = idIdx === -1 ? n : idIdx + 3;
        var eiRe = /\sEI(?=[\s]|$)/g;
        eiRe.lastIndex = p;
        var eim = eiRe.exec(content);
        i = eim ? eiRe.lastIndex : n;
        break;
      }
      default: break; // alle anderen Operatoren sind für die Textposition irrelevant
    }
    operands = [];
  }
}

// ─── SEITENTEXT AUFBAUEN UND ZITAT SUCHEN ─────────────────────────────────
// Liegt zwischen zwei Glyphen eine sichtbare Lücke oder ein Zeilenwechsel,
// wird ein Leerzeichen eingefügt (viele PDFs enthalten keine echten
// Leerzeichen, sondern positionieren Wörter nur).
function _pdfBuildPageModel_(glyphs) {
  var chars = [], map = [];
  var prev = null;
  var minX = Infinity, maxX = -Infinity;
  for (var g = 0; g < glyphs.length; g++) {
    var gl = glyphs[g];
    if (!gl.u) continue;
    if (gl.box[0] < minX) minX = gl.box[0];
    if (gl.box[2] > maxX) maxX = gl.box[2];
    if (prev) {
      var len = Math.sqrt(prev.dx * prev.dx + prev.dy * prev.dy) || 1;
      var ux = prev.dx / len, uy = prev.dy / len;
      var ddx = gl.ox - prev.ex, ddy = gl.oy - prev.ey;
      var along = ddx * ux + ddy * uy, perp = -ddx * uy + ddy * ux;
      var h = Math.max(prev.h, 1);
      var gap = Math.abs(perp) > h * 0.5 || along < -h * 0.5 || along > h * 0.15;
      if (gap && !/\s$/.test(chars[chars.length - 1]) && !/^\s/.test(gl.u)) { chars.push(' '); map.push(-1); }
    }
    chars.push(gl.u);
    map.push(g);
    prev = gl;
  }
  return { glyphs: glyphs, chars: chars, map: map, norm: {}, textLeft: minX, textRight: maxX };
}

function _pdfNormChar_(ch) {
  if (ch.normalize) ch = ch.normalize('NFKC');
  return ch.toLowerCase()
    .replace(/[‘’‚‛′´`]/g, "'")
    .replace(/[“”„‟″«»]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/­/g, '')
    .replace(/[\s  -​ ]/g, ' ');
}

// strip=false: Whitespace zusammengefasst. strip=true: Whitespace und
// Bindestriche komplett entfernt (Silbentrennung am Zeilenende, Kerning-Artefakte).
function _pdfNormalizeChars_(chars, map, strip) {
  var out = [], outMap = [];
  for (var k = 0; k < chars.length; k++) {
    var t = _pdfNormChar_(chars[k]);
    for (var c = 0; c < t.length; c++) {
      var ch = t.charAt(c);
      if (ch === ' ') {
        if (strip || !out.length || out[out.length - 1] === ' ') continue;
      } else if (strip && ch === '-') continue;
      out.push(ch);
      outMap.push(map ? map[k] : k);
    }
  }
  while (out.length && out[out.length - 1] === ' ') { out.pop(); outMap.pop(); }
  return { s: out.join(''), m: outMap };
}

function _pdfPageNorm_(model, strip) {
  var key = strip ? 'strip' : 'ws';
  if (!model.norm[key]) model.norm[key] = _pdfNormalizeChars_(model.chars, model.map, strip);
  return model.norm[key];
}

function _pdfFindNth_(hay, needle, from, occurrence) {
  var pos = -1, found = [];
  while (found.length <= occurrence) {
    pos = hay.indexOf(needle, pos === -1 ? from : pos + 1);
    if (pos === -1) break;
    found.push(pos);
  }
  return found.length ? found[Math.min(occurrence, found.length - 1)] : -1;
}

/**
 * Sucht quote auf einer Seite (model aus _pdfBuildPageModel_). occurrence
 * (0-basiert) wählt bei mehrfach vorkommendem Zitat das n-te Vorkommen.
 * Liefert { boxes: [[x0,y0,x1,y1], ...] (ein Rechteck pro Textzeile),
 * exact: bool } oder null.
 */
function _pdfFindQuoteOnPage_(model, quote, occurrence) {
  occurrence = occurrence || 0;
  var modes = [false, true];
  for (var mi = 0; mi < modes.length; mi++) {
    var strip = modes[mi];
    var q = _pdfNormalizeChars_(String(quote || '').split(''), null, strip).s.replace(/^\s+/, '');
    if (q.length < (strip ? 4 : 2)) continue;
    var page = _pdfPageNorm_(model, strip);
    if (!page.s) continue;

    var start = _pdfFindNth_(page.s, q, 0, occurrence), end = -1, exact = true;
    if (start !== -1) {
      end = start + q.length - 1;
    } else if (q.length >= 30) {
      // Zitat weicht leicht ab (Gemini paraphrasiert gelegentlich in der Mitte):
      // Anfang und Ende getrennt suchen und den Bereich dazwischen markieren.
      exact = false;
      var head = q.slice(0, 20), tail = q.slice(-20);
      start = _pdfFindNth_(page.s, head, 0, occurrence);
      if (start !== -1) {
        var tailPos = page.s.indexOf(tail, start + head.length);
        end = (tailPos !== -1 && tailPos + tail.length - start <= q.length * 1.5)
          ? tailPos + tail.length - 1
          : start + head.length - 1;
      }
    }
    if (start === -1) continue;

    var glyphIdx = [];
    for (var p = start; p <= end; p++) {
      var gi = page.m[p];
      if (gi >= 0 && glyphIdx[glyphIdx.length - 1] !== gi) glyphIdx.push(gi);
    }
    var boxes = _pdfGlyphLineBoxes_(model.glyphs, glyphIdx);
    if (boxes.length) return { boxes: boxes, exact: exact };
  }
  return null;
}

// Fasst die Glyphen zu einem Rechteck pro Textzeile zusammen.
function _pdfGlyphLineBoxes_(glyphs, idxList) {
  var boxes = [], cur = null, lineRef = null;
  idxList.forEach(function(gi) {
    var g = glyphs[gi];
    if (!g.u || /^\s+$/.test(g.u)) return;
    var newLine = true;
    if (lineRef) {
      var len = Math.sqrt(lineRef.dx * lineRef.dx + lineRef.dy * lineRef.dy) || 1;
      var perp = (-(g.ox - lineRef.ox) * lineRef.dy + (g.oy - lineRef.oy) * lineRef.dx) / len;
      var along = ((g.ox - lineRef.ox) * lineRef.dx + (g.oy - lineRef.oy) * lineRef.dy) / len;
      newLine = Math.abs(perp) > Math.max(lineRef.h, 1) * 0.5 || along < -Math.max(lineRef.h, 1);
    }
    if (newLine) {
      cur = g.box.slice();
      boxes.push(cur);
      lineRef = g;
    } else {
      cur[0] = Math.min(cur[0], g.box[0]); cur[1] = Math.min(cur[1], g.box[1]);
      cur[2] = Math.max(cur[2], g.box[2]); cur[3] = Math.max(cur[3], g.box[3]);
    }
  });
  return boxes;
}
