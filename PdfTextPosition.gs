// ============================================================================
// TEXTPOSITION IN EINER PDF-SEITE FINDEN (für präziser platzierte Notizen)
// ============================================================================
// Baut auf PdfInflate.gs auf: dekomprimiert den Content-Stream jeder Seite
// (die Zeichenbefehle, die bestimmen, welcher Text WO auf der Seite steht),
// interpretiert die dafür relevante Teilmenge der PDF-Content-Stream-Operatoren
// (Textmatrix/Zeilenwechsel, Textausgabe) und liefert pro Textausgabe-Befehl
// dessen Y-Position im Seitenkoordinatensystem. Der von Gemini zitierte
// "original"-Text wird darin gesucht, um die Notiz auf Höhe des tatsächlichen
// Fundorts statt generisch oben links zu platzieren.
//
// Bewusst NICHT unterstützt (führt zu einem sauberen "kein Treffer", nie zu
// falschen Koordinaten): Inline-Bilder-Binärdaten werden übersprungen statt
// geparst; nicht unterstützte Stream-Filter (z.B. LZWDecode, ASCII85Decode)
// führen zum Abbruch für den betroffenen Content-Stream. Das gesamte Matching
// ist ohnehin nur eine Verbesserung "on top" der bestehenden, garantiert
// funktionierenden Fallback-Platzierung (siehe DriveAddon.gs) - schlägt es
// fehl, wird einfach wie bisher oben links gestapelt.

// ??? 2D-AFFINE MATRIX-HILFSFUNKTIONEN (PDF: [a b c d e f], Zeilenvektoren) ??
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
function _pdfMatOrigin_(M) { return [M[4], M[5]]; }

// ??? STREAM-BYTES EINES OBJEKTS LADEN (Dict + Rohdaten) ????????????????????
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

  var lengthM = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dictText);
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

// Dekomprimiert einen Stream zu Klartext (Binärstring, 1 Zeichen = 1 Byte).
// Wirft, wenn ein nicht unterstützter Filter benutzt wird - Aufrufer fängt das ab.
function _pdfDecodeStreamToText_(streamData) {
  var bytes = streamData.rawBytes;
  streamData.filters.forEach(function(f) {
    if (f === 'FlateDecode' || f === 'Fl') {
      bytes = inflateZlib_(bytes).map(function(b) { return b > 127 ? b - 256 : b; });
    } else {
      throw new Error('Unsupported stream filter: ' + f);
    }
  });
  return _pdfBytesToBinaryString_(bytes);
}

// ??? CONTENT-STREAM EINER SEITE ALS KLARTEXT HOLEN ?????????????????????????
function _pdfGetPageContentText_(text, offsets, pageDictText) {
  var singleRef = /\/Contents\s+(\d+)\s+(\d+)\s+R/.exec(pageDictText);
  var objNums = [];
  if (singleRef) {
    objNums.push(parseInt(singleRef[1], 10));
  } else {
    var arrRaw = _pdfGetDictArray_(pageDictText, 'Contents');
    if (arrRaw === null) return null;
    var re = /(\d+)\s+(\d+)\s+R/g, m;
    while ((m = re.exec(arrRaw))) objNums.push(parseInt(m[1], 10));
  }
  if (!objNums.length) return null;

  var parts = [];
  for (var i = 0; i < objNums.length; i++) {
    var sd = _pdfGetStreamData_(text, offsets, objNums[i]);
    if (!sd) return null;
    parts.push(_pdfDecodeStreamToText_(sd));
  }
  return parts.join('\n');
}

// ??? CONTENT-STREAM-TOKENIZER (nur die für Textposition relevante Teilmenge) ?
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

/**
 * Interpretiert die textbezogenen Operatoren eines Content-Streams (q/Q/cm,
 * BT/ET, Tf, Tm, Td, TD, T*, TL, Tj, TJ, ', ") und liefert pro Textausgabe
 * {y: Seitenraum-Y-Koordinate, text: gezeigter Text} in Dokumentreihenfolge.
 * Bewusst ohne Font-Metriken (kein Zeichenbreiten-Tracking) - ausreichend, um
 * die richtige ZEILE zu finden, nicht um ein pixelgenaues Rechteck um jedes
 * Wort zu legen.
 */
function _pdfExtractTextRuns_(content) {
  var runs = [];
  var ctmStack = [_pdfMatIdentity_()];
  var ctm = _pdfMatIdentity_();
  var tm = _pdfMatIdentity_(), tlm = _pdfMatIdentity_();
  var leading = 0;
  var inText = false;
  var operands = [];
  var i = 0, n = content.length;

  function showText(str) {
    var origin = _pdfMatOrigin_(_pdfMatMul_(tm, ctm));
    if (str && str.replace(/\s+/g, '').length) runs.push({ y: origin[1], text: str });
  }
  function moveLine(tx, ty) {
    tlm = _pdfMatMul_([1, 0, 0, 1, tx, ty], tlm);
    tm = tlm;
  }

  while (i < n) {
    var ch = content.charAt(i);
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f') { i++; continue; }
    if (ch === '%') { while (i < n && content.charAt(i) !== '\n' && content.charAt(i) !== '\r') i++; continue; }

    if (ch === '(') {
      var lit = _pdfReadLiteralString_(content, i);
      operands.push({ t: 'str', v: lit.value });
      i = lit.next;
      continue;
    }
    if (ch === '<' && content.charAt(i + 1) !== '<') {
      var hex = _pdfReadHexString_(content, i);
      operands.push({ t: 'str', v: hex.value });
      i = hex.next;
      continue;
    }
    if (ch === '<' && content.charAt(i + 1) === '<') {
      // Inline-Dict (z.B. BDC-Operanden) - überspringen, wird hier nicht ausgewertet.
      var depth = 0, j = i;
      while (j < n) {
        if (content.substr(j, 2) === '<<') { depth++; j += 2; continue; }
        if (content.substr(j, 2) === '>>') { depth--; j += 2; if (depth === 0) break; continue; }
        j++;
      }
      i = j;
      continue;
    }
    if (ch === '[') {
      var arr = [], j2 = i + 1;
      while (j2 < n && content.charAt(j2) !== ']') {
        var c2 = content.charAt(j2);
        if (c2 === ' ' || c2 === '\n' || c2 === '\r' || c2 === '\t') { j2++; continue; }
        if (c2 === '(') { var l2 = _pdfReadLiteralString_(content, j2); arr.push({ t: 'str', v: l2.value }); j2 = l2.next; continue; }
        if (c2 === '<') { var h2 = _pdfReadHexString_(content, j2); arr.push({ t: 'str', v: h2.value }); j2 = h2.next; continue; }
        var numM = /^[+\-]?[\d.]+/.exec(content.slice(j2));
        if (numM) { arr.push({ t: 'num', v: parseFloat(numM[0]) }); j2 += numM[0].length; continue; }
        j2++; // Unbekanntes Zeichen im Array: überspringen statt hängenzubleiben.
      }
      operands.push({ t: 'arr', v: arr });
      i = j2 + 1;
      continue;
    }
    if (ch === '/') {
      var nameM = /^\/[^\s()<>\[\]\/%]*/.exec(content.slice(i));
      operands.push({ t: 'name', v: nameM[0].slice(1) });
      i += nameM[0].length;
      continue;
    }
    if (/[+\-.\d]/.test(ch)) {
      var numM2 = /^[+\-]?[\d.]+/.exec(content.slice(i));
      if (numM2) { operands.push({ t: 'num', v: parseFloat(numM2[0]) }); i += numM2[0].length; continue; }
    }
    // Operator-Schlüsselwort (Buchstaben/Sternchen/Anführungszeichen).
    var opM = /^[A-Za-z*'"]+/.exec(content.slice(i));
    if (!opM) { i++; continue; } // unbekanntes Zeichen, robust überspringen

    var op = opM[0];
    i += op.length;

    if (op === 'BI') {
      // Inline-Bild: rohe Binärdaten bis "EI" überspringen statt zu parsen.
      var eiIdx = content.indexOf('EI', i);
      i = eiIdx === -1 ? n : eiIdx + 2;
      operands = [];
      continue;
    }

    switch (op) {
      case 'q': ctmStack.push(ctm); break;
      case 'Q': if (ctmStack.length > 1) ctm = ctmStack.pop(); break;
      case 'cm':
        if (operands.length >= 6) {
          var m = [operands[operands.length-6].v, operands[operands.length-5].v, operands[operands.length-4].v,
                    operands[operands.length-3].v, operands[operands.length-2].v, operands[operands.length-1].v];
          ctm = _pdfMatMul_(m, ctm);
        }
        break;
      case 'BT': inText = true; tm = _pdfMatIdentity_(); tlm = _pdfMatIdentity_(); break;
      case 'ET': inText = false; break;
      case 'Tm':
        if (operands.length >= 6) {
          tm = [operands[operands.length-6].v, operands[operands.length-5].v, operands[operands.length-4].v,
                operands[operands.length-3].v, operands[operands.length-2].v, operands[operands.length-1].v];
          tlm = tm;
        }
        break;
      case 'TL': if (operands.length >= 1) leading = operands[operands.length-1].v; break;
      case 'Td':
        if (operands.length >= 2) moveLine(operands[operands.length-2].v, operands[operands.length-1].v);
        break;
      case 'TD':
        if (operands.length >= 2) { leading = -operands[operands.length-1].v; moveLine(operands[operands.length-2].v, operands[operands.length-1].v); }
        break;
      case 'T*': moveLine(0, -leading); break;
      case 'Tj':
        if (operands.length >= 1 && operands[operands.length-1].t === 'str') showText(operands[operands.length-1].v);
        break;
      case "'":
        moveLine(0, -leading);
        if (operands.length >= 1 && operands[operands.length-1].t === 'str') showText(operands[operands.length-1].v);
        break;
      case '"':
        moveLine(0, -leading);
        if (operands.length >= 1 && operands[operands.length-1].t === 'str') showText(operands[operands.length-1].v);
        break;
      case 'TJ':
        if (operands.length >= 1 && operands[operands.length-1].t === 'arr') {
          var buf = [];
          operands[operands.length-1].v.forEach(function(item) {
            if (item.t === 'str') buf.push(item.v);
            else if (item.t === 'num' && item.v < -100) buf.push(' '); // grober Wortzwischenraum-Heuristik
          });
          showText(buf.join(''));
        }
        break;
      default: break; // alle anderen Operatoren sind für die Textposition irrelevant
    }
    operands = [];
  }
  return runs;
}

/**
 * Normalisiert Text für den Textabgleich (Whitespace vereinheitlichen,
 * Kleinschreibung) - die Extraktion aus dem Content-Stream und Geminis Zitat
 * unterscheiden sich oft in Zeilenumbrüchen/doppelten Leerzeichen/&nbsp;.
 */
function _pdfNormalizeForMatch_(s) {
  return String(s || '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Baut aus den runs einen durchsuchbaren Gesamttext plus eine Zuordnung
// [charPos -> run-Index] zurück. "stripped" entfernt zusätzlich JEDEN
// Whitespace/Bindestrich - deckt den Fall ab, dass Kerning-Zahlen in TJ-Arrays
// (z.B. zwischen einzelnen Buchstaben eines Wortes oder um einen Bindestrich
// herum) fälschlich als Wortzwischenraum interpretiert wurden und "Frame-Maker"
// so zu "Frame - Maker" wird, während Geminis Zitat "Frame-Maker" bleibt.
function _pdfBuildSearchIndex_(runs, stripped) {
  var combined = '', index = [];
  runs.forEach(function(run, runIdx) {
    var normRun = _pdfNormalizeForMatch_(run.text);
    if (stripped) normRun = normRun.replace(/[\s\-]+/g, '');
    if (!normRun) return;
    if (!stripped && combined.length) { combined += ' '; index.push(-1); }
    for (var k = 0; k < normRun.length; k++) index.push(runIdx);
    combined += normRun;
  });
  return { combined: combined, index: index };
}

function _pdfResolveRunIdxAtPos_(index, pos) {
  if (pos === -1 || pos >= index.length) return -1;
  var runIdx = index[pos];
  if (runIdx === -1) {
    for (var p = pos; p < index.length; p++) { if (index[p] !== -1) return index[p]; }
    return -1;
  }
  return runIdx;
}

/**
 * Sucht quote in den Textausgaben EINER Seite (runs, aus _pdfExtractTextRuns_)
 * und gibt die Y-Position des am besten passenden Fundorts zurück, oder null.
 */
function _pdfFindQuoteYOnPage_(runs, quote) {
  var normQuote = _pdfNormalizeForMatch_(quote);
  if (!normQuote) return null;

  var idx1 = _pdfBuildSearchIndex_(runs, false);
  if (idx1.combined) {
    var pos = idx1.combined.indexOf(normQuote);
    if (pos === -1) {
      // Kürzeres Präfix versuchen (Gemini-Zitat evtl. länger als eine einzelne
      // Textzeile im Content-Stream) - erste ~40 Zeichen genügen, um die
      // richtige Zeile zu finden.
      var prefix = normQuote.slice(0, 40);
      if (prefix.length >= 15) pos = idx1.combined.indexOf(prefix);
    }
    var runIdx1 = _pdfResolveRunIdxAtPos_(idx1.index, pos);
    if (runIdx1 !== -1) return runs[runIdx1].y;
  }

  // Fallback: Whitespace/Bindestriche auf beiden Seiten entfernen (Kerning-
  // Artefakte, siehe oben).
  var strippedQuote = normQuote.replace(/[\s\-]+/g, '');
  if (strippedQuote.length < 8) return null; // zu kurz, um verlässlich zu sein
  var idx2 = _pdfBuildSearchIndex_(runs, true);
  if (!idx2.combined) return null;
  var pos2 = idx2.combined.indexOf(strippedQuote);
  if (pos2 === -1) {
    var prefix2 = strippedQuote.slice(0, 30);
    if (prefix2.length >= 10) pos2 = idx2.combined.indexOf(prefix2);
  }
  var runIdx2 = _pdfResolveRunIdxAtPos_(idx2.index, pos2);
  return runIdx2 !== -1 ? runs[runIdx2].y : null;
}
