// ============================================================================
// PDF-ANNOTATIONEN OHNE FREMDBIBLIOTHEK ("echte" Notizen direkt in der PDF)
// ============================================================================
// Google Drive selbst unterstützt für PDFs (Blob-Dateien) keine sichtbaren
// Kommentare (siehe DriveAddon.gs). Der einzige Weg zu Notizen, die beim
// Öffnen der PDF selbst (Drive-Vorschau, Adobe Acrobat, ...) sichtbar sind,
// ist ein echtes PDF-Annotation-Objekt (/Subtype /Text, "Sticky Note"),
// direkt in die PDF-Bytes geschrieben.
//
// Apps Script hat keine PDF-Bibliothek und keine Möglichkeit, beliebige
// npm-/Java-Bibliotheken zu laden. Deshalb wird hier ein "Incremental Update"
// von Hand erzeugt - exakt die Technik, mit der auch Adobe Acrobat selbst
// Kommentare zu einer PDF hinzufügt: die Original-Bytes bleiben unverändert,
// am Dateiende werden neue Objekte (die Annotation + die aktualisierte
// Seiten-Definition mit erweitertem /Annots-Array) sowie eine neue,
// eigenständige Cross-Reference-Tabelle mit /Prev-Verweis auf die alte
// angehängt. Das ist laut PDF-Spezifikation (ISO 32000) ein regulärer,
// unterstützter Vorgang, keine Umgehung.
//
// GRENZE (bewusst, mit klarer Fehlermeldung statt stiller Beschädigung):
// Objekte, die in einem komprimierten Object Stream (/Type /ObjStm) liegen
// -  eine von vielen PDF-Produzenten genutzte Zusatzkompression, v. a. bei
// stark optimierten PDFs - können ohne echte Inflate/Zlib-Dekompression
// (die Apps Script nicht eingebaut hat) nicht gefunden werden. Trifft das
// zu, wird ein Error geworfen statt eine kaputte Datei zu erzeugen; der
// Aufrufer fängt das ab und bietet stattdessen "Export as Sheet" an.
// Cross-Reference-STREAMS (der Mechanismus selbst, PDF 1.5+) sind dagegen
// unterstützt, weil deren Dictionary immer Klartext ist - nur die eigentliche
// Streamdaten sind komprimiert, und die werden hier gar nicht gebraucht.

var PDF_ANNOT_MAX_PER_PDF = 60; // Sicherheitsgrenze: Dateigröße/Laufzeit

// ??? BYTE/STRING-KONVERTIERUNG ????????????????????????????????????????????
// Blob.getBytes() liefert VORZEICHENBEHAFTETE Bytes (-128..127, Java-Erbe der
// Apps-Script-Blob-API). Für die regex-basierte Verarbeitung wird daraus ein
// "Binärstring" gebaut (1 Zeichen = 1 Byte, 0..255, wie Latin-1) - das erlaubt,
// dieselbe Logik wie im Python-Prototyp 1:1 zu verwenden, inklusive exakter
// Byte-Offsets für die xref-Tabelle.
function _pdfBytesToBinaryString_(bytes) {
  var CHUNK = 8192;
  var parts = [];
  for (var i = 0; i < bytes.length; i += CHUNK) {
    var end = Math.min(i + CHUNK, bytes.length);
    var chunk = new Array(end - i);
    for (var j = i; j < end; j++) {
      var b = bytes[j];
      chunk[j - i] = b < 0 ? b + 256 : b;
    }
    parts.push(String.fromCharCode.apply(null, chunk));
  }
  return parts.join('');
}

function _pdfBinaryStringToBytes_(str) {
  var len = str.length;
  var bytes = new Array(len);
  for (var i = 0; i < len; i++) {
    var b = str.charCodeAt(i) & 0xFF;
    bytes[i] = b > 127 ? b - 256 : b;
  }
  return bytes;
}

// UTF-16BE-Hexstring mit BOM (z.B. <FEFF0041...>) - unterstützt jede Sprache
// (Kyrillisch/CJK/Arabisch/...), nicht nur Latin-1, und braucht kein Escaping,
// da ein PDF-Hexstring nur aus Hexziffern und Whitespace bestehen kann.
function _pdfHexString_(s) {
  s = String(s || '').replace(/\r\n/g, '\n');
  var out = ['FEFF'];
  for (var i = 0; i < s.length; i++) {
    var code = s.charCodeAt(i);
    var hex = code.toString(16);
    while (hex.length < 4) hex = '0' + hex;
    out.push(hex);
  }
  return '<' + out.join('') + '>';
}

// ??? MINIMALES, KLARTEXT-BASIERTES PDF-PARSING ?????????????????????????????
function _pdfFindRootRef_(text) {
  var trailerRe = /trailer\s*<</g;
  var m, last = null, lastEnd = null;
  // WICHTIG: .lastIndex wird von exec() bei einem fehlgeschlagenen Match (Ende
  // der Schleife) automatisch auf 0 zurückgesetzt - der Endpunkt des letzten
  // ERFOLGREICHEN Matches muss daher schon WÄHREND der Schleife gesichert
  // werden, nicht erst danach über trailerRe.lastIndex gelesen werden.
  while ((m = trailerRe.exec(text))) { last = m; lastEnd = trailerRe.lastIndex; }
  if (last) {
    var start = lastEnd - 2; // Position von "<<"
    var i = start, depth = 0;
    while (i < text.length) {
      if (text.substr(i, 2) === '<<') { depth++; i += 2; continue; }
      if (text.substr(i, 2) === '>>') { depth--; i += 2; if (depth === 0) break; continue; }
      i++;
    }
    var dictText = text.slice(start, i);
    var rm = /\/Root\s+(\d+)\s+(\d+)\s+R/.exec(dictText);
    if (rm) return parseInt(rm[1], 10);
  }
  // Fallback: PDFs mit Cross-Reference-STREAM statt klassischer xref-Tabelle
  // haben keinen "trailer"-Block; ihr Trailer-Dictionary steckt stattdessen
  // im xref-Stream-Objekt selbst (/Type /XRef ... /Root ...). Dieses
  // Dictionary ist immer Klartext, nur die Stream-DATEN dahinter sind
  // komprimiert - wir brauchen hier also keine Dekompression.
  var xrefObjRe = /\/Type\s*\/XRef\b/g;
  var xm, lastXm = null;
  while ((xm = xrefObjRe.exec(text))) lastXm = xm;
  if (lastXm) {
    var winStart = Math.max(0, lastXm.index - 2000);
    var winEnd = Math.min(text.length, lastXm.index + 2000);
    var window = text.slice(winStart, winEnd);
    var rm2 = /\/Root\s+(\d+)\s+(\d+)\s+R/.exec(window);
    if (rm2) return parseInt(rm2[1], 10);
  }
  throw new Error('Could not locate /Root in the PDF trailer.');
}

function _pdfScanObjectOffsets_(text) {
  var offsets = {};
  var re = /(\d+)[ \t]+(\d+)[ \t]+obj\b/g;
  var m;
  while ((m = re.exec(text))) {
    // Spätere Vorkommen (spätere Revision desselben Objekts, z.B. bei bereits
    // inkrementell aktualisierten PDFs) überschreiben frühere - korrektes
    // Verhalten laut PDF-Spezifikation.
    offsets[parseInt(m[1], 10)] = m.index;
  }
  return offsets;
}

function _pdfExtractDictText_(text, objStart) {
  var objKwIdx = text.indexOf('obj', objStart);
  if (objKwIdx === -1) return null;
  var i = objKwIdx + 3;
  while (' \n\r\t'.indexOf(text.charAt(i)) !== -1) i++;
  if (text.substr(i, 2) !== '<<') return null;
  var start = i, depth = 0;
  while (i < text.length) {
    if (text.substr(i, 2) === '<<') { depth++; i += 2; continue; }
    if (text.substr(i, 2) === '>>') { depth--; i += 2; if (depth === 0) break; continue; }
    i++;
  }
  return { start: start, end: i };
}

function _pdfGetDictValueRef_(dictText, key) {
  var re = new RegExp('\\/' + key + '\\s+(\\d+)\\s+(\\d+)\\s+R');
  var m = re.exec(dictText);
  return m ? parseInt(m[1], 10) : null;
}

function _pdfGetDictArray_(dictText, key) {
  var re = new RegExp('\\/' + key + '\\s*\\[([\\s\\S]*?)\\]');
  var m = re.exec(dictText);
  return m ? m[1] : null;
}

function _pdfGetMediaBox_(dictText) {
  var m = /\/MediaBox\s*\[\s*([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s*\]/.exec(dictText);
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
}

function _pdfResolveObject_(text, offsets, num) {
  if (!(num in offsets)) {
    throw new Error('Object ' + num + ' not found as plain text (likely inside a compressed object stream). This PDF\'s internal structure is not supported for direct annotation.');
  }
  var range = _pdfExtractDictText_(text, offsets[num]);
  if (!range) throw new Error('Object ' + num + ' has no dictionary.');
  return { num: num, start: range.start, end: range.end, dictText: text.slice(range.start, range.end) };
}

function _pdfCollectPages_(text, offsets, rootNum) {
  var catalog = _pdfResolveObject_(text, offsets, rootNum);
  var pagesNum = _pdfGetDictValueRef_(catalog.dictText, 'Pages');
  if (pagesNum === null) throw new Error('Catalog has no /Pages.');

  var pages = [];
  var visited = {};
  function walk(nodeNum, inheritedMediaBox) {
    if (visited[nodeNum]) return; // Schutz vor Zyklen in kaputten PDFs
    visited[nodeNum] = true;
    var node = _pdfResolveObject_(text, offsets, nodeNum);
    var mediaBox = _pdfGetMediaBox_(node.dictText) || inheritedMediaBox;
    var typeM = /\/Type\s*\/(\w+)/.exec(node.dictText);
    var nodeType = typeM ? typeM[1] : null;
    if (nodeType === 'Page') {
      node.mediaBox = mediaBox;
      pages.push(node);
      return;
    }
    var kidsRaw = _pdfGetDictArray_(node.dictText, 'Kids');
    if (kidsRaw === null) throw new Error('Pages node ' + nodeNum + ' has no /Kids and is not a /Page.');
    var kidRe = /(\d+)\s+(\d+)\s+R/g;
    var km;
    while ((km = kidRe.exec(kidsRaw))) walk(parseInt(km[1], 10), mediaBox);
  }
  walk(pagesNum, null);
  return pages;
}

/**
 * pageAnnotations: { pageIndex(0-based): [ {rect?:[x,y,x,y], contents:str, title?:str}, ... ] }
 * "rect" is optional - if omitted, annotations are stacked in the page's top-left
 * corner using its actual /MediaBox, so callers don't need to know page dimensions.
 * bytes: signed byte array (as returned by Blob.getBytes()).
 * Returns a signed byte array for the new, annotated PDF (Utilities.newBlob-ready).
 * Throws Error with a clear message if the PDF's structure can't be located in
 * plain text (see file header comment) - callers should catch this and fall
 * back to another output (e.g. the Sheet export).
 */
function buildAnnotatedPdfBytes_(bytes, pageAnnotations) {
  var text = _pdfBytesToBinaryString_(bytes);

  var rootNum = _pdfFindRootRef_(text);
  var offsets = _pdfScanObjectOffsets_(text);
  var pages = _pdfCollectPages_(text, offsets, rootNum);

  var sxRe = /startxref\s+(\d+)/g;
  var sxMatch, lastSx = null;
  while ((sxMatch = sxRe.exec(text))) lastSx = sxMatch;
  if (!lastSx) throw new Error('Could not find startxref.');
  var prevXrefOffset = parseInt(lastSx[1], 10);

  var maxObjNum = 0;
  for (var k in offsets) { if (offsets.hasOwnProperty(k)) maxObjNum = Math.max(maxObjNum, parseInt(k, 10)); }
  var nextNum = maxObjNum + 1;

  var newObjects = [];     // [{num, body}]
  var updatedPages = {};   // objNum -> newDictText

  var pageIndexes = [];
  for (var pIdx in pageAnnotations) { if (pageAnnotations.hasOwnProperty(pIdx)) pageIndexes.push(parseInt(pIdx, 10)); }
  pageIndexes.sort(function(a, b) { return a - b; });

  pageIndexes.forEach(function(pageIndex) {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    var page = pages[pageIndex];
    var anns = pageAnnotations[pageIndex];
    var existingAnnotsRaw = _pdfGetDictArray_(page.dictText, 'Annots') || '';
    var newAnnotRefs = [];

    var mediaBox = page.mediaBox || [0, 0, 612, 792]; // US-Letter-Fallback, falls kein /MediaBox auffindbar war
    anns.forEach(function(ann, idxOnPage) {
      var annotNum = nextNum++;
      // Rect wird, falls vom Aufrufer nicht explizit vorgegeben, relativ zur
      // tatsächlichen Seitengröße oben links gestapelt platziert (ein
      // 20x20pt "Sprechblasen"-Icon pro Fund, mit 26pt Abstand).
      var rect = ann.rect;
      if (!rect) {
        var iconSize = 20, gap = 26, margin = 16;
        var x = mediaBox[0] + margin;
        var y = mediaBox[3] - margin - iconSize - (idxOnPage * gap);
        if (y < mediaBox[1] + margin) y = mediaBox[1] + margin; // nicht unten aus der Seite laufen
        rect = [x, y, x + iconSize, y + iconSize];
      }
      var contentsHex = _pdfHexString_(ann.contents);
      var titleHex = _pdfHexString_(ann.title || 'Author Check');
      var rectStr = rect.map(function(v) { return v.toFixed(2); }).join(' ');
      var body =
        '<< /Type /Annot /Subtype /Text /Rect [' + rectStr + '] /Contents ' + contentsHex +
        ' /T ' + titleHex + ' /Name /Comment /Open false /C [1 0.93 0] >>';
      newObjects.push({ num: annotNum, body: body });
      newAnnotRefs.push(annotNum);
    });

    var combinedRefs = existingAnnotsRaw.replace(/^\s+|\s+$/g, '');
    var addRefs = newAnnotRefs.map(function(n) { return n + ' 0 R'; }).join(' ');
    var newAnnotsArray = (combinedRefs + ' ' + addRefs).replace(/^\s+|\s+$/g, '');

    var newPageDict;
    if (page.dictText.indexOf('/Annots') !== -1) {
      newPageDict = page.dictText.replace(/\/Annots\s*\[[\s\S]*?\]/, '/Annots [' + newAnnotsArray + ']');
    } else {
      newPageDict = page.dictText.slice(0, -2) + ' /Annots [' + newAnnotsArray + '] ' + page.dictText.slice(-2);
    }
    updatedPages[page.num] = newPageDict;
  });

  if (!newObjects.length) throw new Error('No matching pages to annotate.');

  var out = [text];
  if (text.charAt(text.length - 1) !== '\n') out.push('\n');

  var offsetsNew = {};
  var curLen = text.length + (text.charAt(text.length - 1) !== '\n' ? 1 : 0);

  newObjects.forEach(function(o) {
    offsetsNew[o.num] = curLen;
    var chunk = o.num + ' 0 obj\n' + o.body + '\nendobj\n';
    out.push(chunk);
    curLen += chunk.length;
  });
  for (var pageNumKey in updatedPages) {
    if (!updatedPages.hasOwnProperty(pageNumKey)) continue;
    var pageNum = parseInt(pageNumKey, 10);
    offsetsNew[pageNum] = curLen;
    var chunk2 = pageNum + ' 0 obj\n' + updatedPages[pageNumKey] + '\nendobj\n';
    out.push(chunk2);
    curLen += chunk2.length;
  }

  var allNewNums = [];
  for (var nk in offsetsNew) { if (offsetsNew.hasOwnProperty(nk)) allNewNums.push(parseInt(nk, 10)); }
  allNewNums.sort(function(a, b) { return a - b; });

  var xrefOffset = curLen;
  var size = Math.max(maxObjNum, allNewNums[allNewNums.length - 1]) + 1;

  var xrefChunk = 'xref\n';
  var i = 0;
  while (i < allNewNums.length) {
    var j = i;
    while (j + 1 < allNewNums.length && allNewNums[j + 1] === allNewNums[j] + 1) j++;
    var runStart = allNewNums[i], runLen = j - i + 1;
    xrefChunk += runStart + ' ' + runLen + '\n';
    for (var n = runStart; n < runStart + runLen; n++) {
      var offStr = String(offsetsNew[n]);
      while (offStr.length < 10) offStr = '0' + offStr;
      xrefChunk += offStr + ' 00000 n \n';
    }
    i = j + 1;
  }
  xrefChunk += 'trailer\n<< /Size ' + size + ' /Root ' + rootNum + ' 0 R /Prev ' + prevXrefOffset + ' >>\n';
  xrefChunk += 'startxref\n' + xrefOffset + '\n%%EOF';
  out.push(xrefChunk);

  var finalText = out.join('');
  return _pdfBinaryStringToBytes_(finalText);
}

/**
 * Best-effort: liest aus dem von Gemini gelieferten "location"-Hinweis
 * (z.B. "page 2", "Seite 3", "p. 4") eine Seitenzahl heraus. Liefert einen
 * 0-basierten Seitenindex oder null, wenn nichts Brauchbares gefunden wurde
 * (Aufrufer verteilt solche Fälle dann z.B. auf die erste Seite).
 */
function _pdfGuessPageIndex_(location) {
  if (!location) return null;
  var m = /(?:page|seite|s\.|p\.)\s*(\d+)/i.exec(location);
  if (!m) m = /(\d+)/.exec(location);
  if (!m) return null;
  var n = parseInt(m[1], 10);
  return (isNaN(n) || n < 1) ? null : (n - 1);
}
