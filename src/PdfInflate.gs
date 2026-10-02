// ============================================================================
// RAW DEFLATE/ZLIB-INFLATE IN REINEM JS (RFC 1950/1951)
// ============================================================================
// Apps Script hat kein eingebautes zlib/raw-inflate (Utilities.ungzip
// erwartet das GZIP-Containerformat, nicht den in PDF-Streams verwendeten
// nackten zlib/Deflate-Stream) und keine Möglichkeit, externe Bibliotheken
// zu laden. PDF-Content-Streams (der Zeichenbefehls-Text jeder Seite) sind
// so gut wie immer mit /Filter /FlateDecode komprimiert - ohne Inflate kann
// also nicht ermittelt werden, WO auf einer Seite ein bestimmter Text
// tatsächlich steht. Diese Datei implementiert Inflate deshalb von Hand,
// exakt nach RFC 1951 (Deflate) + RFC 1950 (zlib-Hülle drumherum).
//
// Wird ausschließlich zum LESEN benutzt (PDF-Struktur/Content-Streams
// dekomprimieren); erzeugte/angehängte neue Objekte in PdfAnnotate.gs
// bleiben unkomprimierter Klartext, es wird also nirgends selbst komprimiert.

// Feste Huffman-Codelängen für Block-Typ 1 (RFC 1951 §3.2.6).
function _inflateBuildFixedTrees_() {
  var litLens = new Array(288);
  var i;
  for (i = 0; i <= 143; i++) litLens[i] = 8;
  for (i = 144; i <= 255; i++) litLens[i] = 9;
  for (i = 256; i <= 279; i++) litLens[i] = 7;
  for (i = 280; i <= 287; i++) litLens[i] = 8;
  var distLens = new Array(30);
  for (i = 0; i < 30; i++) distLens[i] = 5;
  return { lit: _inflateBuildHuffmanTable_(litLens), dist: _inflateBuildHuffmanTable_(distLens) };
}

// Baut aus einem Array von Codelängen (Index = Symbol) eine Decoder-Tabelle
// nach dem kanonischen Huffman-Verfahren aus RFC 1951 §3.2.2.
function _inflateBuildHuffmanTable_(lengths) {
  var maxBits = 0, i;
  for (i = 0; i < lengths.length; i++) if (lengths[i] > maxBits) maxBits = lengths[i];
  var blCount = new Array(maxBits + 1);
  for (i = 0; i <= maxBits; i++) blCount[i] = 0;
  for (i = 0; i < lengths.length; i++) if (lengths[i] > 0) blCount[lengths[i]]++;
  var nextCode = new Array(maxBits + 1);
  var code = 0;
  blCount[0] = 0;
  for (var bits = 1; bits <= maxBits; bits++) {
    code = (code + blCount[bits - 1]) << 1;
    nextCode[bits] = code;
  }
  // codes[symbol] = {code, len}; wird beim Decodieren linear durchsucht
  // (Bitweise Lookup-Tabellen wären schneller, aber für PDF-Seitengrößen
  // reicht das und bleibt einfacher nachvollziehbar/prüfbar).
  var codes = [];
  for (var sym = 0; sym < lengths.length; sym++) {
    var len = lengths[sym];
    if (len > 0) {
      codes.push({ symbol: sym, code: nextCode[len], len: len });
      nextCode[len]++;
    }
  }
  // Nach Länge gruppiert für schnelleres Decodieren.
  var byLen = {};
  codes.forEach(function(c) {
    if (!byLen[c.len]) byLen[c.len] = {};
    byLen[c.len][c.code] = c.symbol;
  });
  return { byLen: byLen, maxBits: maxBits };
}

function _InflateBitReader_(bytes, startByteOffset) {
  this.bytes = bytes;
  this.pos = startByteOffset; // Byte-Index
  this.bitBuf = 0;
  this.bitCount = 0;
}
_InflateBitReader_.prototype.getBit = function() {
  if (this.bitCount === 0) {
    var b = this.bytes[this.pos++];
    if (b === undefined) throw new Error('Unexpected end of DEFLATE stream.');
    this.bitBuf = b < 0 ? b + 256 : b;
    this.bitCount = 8;
  }
  var bit = this.bitBuf & 1;
  this.bitBuf >>= 1;
  this.bitCount--;
  return bit;
};
_InflateBitReader_.prototype.getBits = function(n) {
  var v = 0;
  for (var i = 0; i < n; i++) v |= this.getBit() << i;
  return v;
};
_InflateBitReader_.prototype.alignToByte = function() {
  this.bitBuf = 0;
  this.bitCount = 0;
};
// Decodiert genau ein Symbol per kanonischer Huffman-Tabelle, MSB-first
// akkumuliert (Huffman-Codes werden in DEFLATE bitweise MSB-first gelesen,
// im Unterschied zu den LSB-first gepackten "normalen" Werten wie extra bits).
_InflateBitReader_.prototype.readSymbol = function(table) {
  var code = 0;
  for (var len = 1; len <= table.maxBits; len++) {
    code = (code << 1) | this.getBit();
    var group = table.byLen[len];
    if (group && Object.prototype.hasOwnProperty.call(group, code)) {
      return group[code];
    }
  }
  throw new Error('Invalid Huffman code in DEFLATE stream.');
};

var INFLATE_LENGTH_BASE = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
var INFLATE_LENGTH_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
var INFLATE_DIST_BASE = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
var INFLATE_DIST_EXTRA = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
var INFLATE_CLCODE_ORDER = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];

/**
 * Raw DEFLATE (RFC 1951) decoder. bytes: signed byte array. Returns a plain
 * array of unsigned byte values (0..255).
 */
function inflateRaw_(bytes, startByteOffset) {
  var reader = new _InflateBitReader_(bytes, startByteOffset || 0);
  var out = [];
  var fixedTrees = null;
  var final = 0;
  do {
    final = reader.getBit();
    var type = reader.getBits(2);
    if (type === 0) {
      reader.alignToByte();
      var len = (reader.bytes[reader.pos] < 0 ? reader.bytes[reader.pos] + 256 : reader.bytes[reader.pos]) |
                ((reader.bytes[reader.pos + 1] < 0 ? reader.bytes[reader.pos + 1] + 256 : reader.bytes[reader.pos + 1]) << 8);
      reader.pos += 4; // LEN (2 bytes) + NLEN (2 bytes, ones' complement, ignored)
      for (var s = 0; s < len; s++) {
        var b = reader.bytes[reader.pos++];
        out.push(b < 0 ? b + 256 : b);
      }
    } else if (type === 1 || type === 2) {
      var trees;
      if (type === 1) {
        if (!fixedTrees) fixedTrees = _inflateBuildFixedTrees_();
        trees = fixedTrees;
      } else {
        trees = _inflateReadDynamicTrees_(reader);
      }
      _inflateDecodeBlock_(reader, trees.lit, trees.dist, out);
    } else {
      throw new Error('Invalid DEFLATE block type (corrupt or unsupported stream).');
    }
  } while (!final);
  return out;
}

function _inflateReadDynamicTrees_(reader) {
  var hlit = reader.getBits(5) + 257;
  var hdist = reader.getBits(5) + 1;
  var hclen = reader.getBits(4) + 4;

  var clLens = new Array(19);
  for (var i = 0; i < 19; i++) clLens[i] = 0;
  for (i = 0; i < hclen; i++) clLens[INFLATE_CLCODE_ORDER[i]] = reader.getBits(3);
  var clTable = _inflateBuildHuffmanTable_(clLens);

  var lens = [];
  while (lens.length < hlit + hdist) {
    var sym = reader.readSymbol(clTable);
    if (sym <= 15) {
      lens.push(sym);
    } else if (sym === 16) {
      var repeat = reader.getBits(2) + 3;
      var prev = lens[lens.length - 1];
      for (var r = 0; r < repeat; r++) lens.push(prev);
    } else if (sym === 17) {
      var repeat0 = reader.getBits(3) + 3;
      for (var r2 = 0; r2 < repeat0; r2++) lens.push(0);
    } else { // 18
      var repeat00 = reader.getBits(7) + 11;
      for (var r3 = 0; r3 < repeat00; r3++) lens.push(0);
    }
  }
  var litLens = lens.slice(0, hlit);
  var distLens = lens.slice(hlit, hlit + hdist);
  return { lit: _inflateBuildHuffmanTable_(litLens), dist: _inflateBuildHuffmanTable_(distLens) };
}

function _inflateDecodeBlock_(reader, litTable, distTable, out) {
  for (;;) {
    var sym = reader.readSymbol(litTable);
    if (sym < 256) {
      out.push(sym);
    } else if (sym === 256) {
      return; // Block-Ende
    } else {
      var lenIdx = sym - 257;
      var length = INFLATE_LENGTH_BASE[lenIdx] + reader.getBits(INFLATE_LENGTH_EXTRA[lenIdx]);
      var distSym = reader.readSymbol(distTable);
      var distance = INFLATE_DIST_BASE[distSym] + reader.getBits(INFLATE_DIST_EXTRA[distSym]);
      var start = out.length - distance;
      if (start < 0) throw new Error('Invalid back-reference distance in DEFLATE stream.');
      for (var k = 0; k < length; k++) out.push(out[start + k]);
    }
  }
}

/**
 * zlib-Wrapper (RFC 1950) um inflateRaw_: überspringt den 2-Byte-Header
 * (CMF/FLG) und die 4-Byte-Adler32-Prüfsumme am Ende wird ignoriert (kein
 * Sicherheitsproblem - wir lesen nur, um Textpositionen zu finden; ein
 * Prüfsummenfehler würde ohnehin schon beim Huffman-Decodieren selbst als
 * Exception auffallen).
 */
function inflateZlib_(bytes) {
  return inflateRaw_(bytes, 2);
}
