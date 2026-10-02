// Erzeugt Test-PDFs fuer die CI: Seiten mit Text (Helvetica, WinAnsi, auch
// Umlaute), optional grosse Bilder (wie Fotos in einer Anleitung) und ein
// grosser eingebetteter Schrift-Stream (wie eingebettete Schriften, die beim
// Verkleinern erhalten bleiben). Klassische xref-Tabelle.
//
// makePdf({ pages: [['Zeile 1', 'Zeile 2'], ...], images: [bytes, ...], fontBytes })
// -> Buffer. Bild i liegt auf Seite i % Seitenzahl.
const crypto = require('crypto');

// Bytes >= 0x80: enthalten nie "endstream"/"endobj" und sehen aus wie JPEG-Daten.
function filler(n, seed) {
  const out = Buffer.alloc(n);
  let h = crypto.createHash('sha256').update(String(seed)).digest();
  for (let i = 0; i < n; i += 32) {
    h = crypto.createHash('sha256').update(h).digest();
    h.copy(out, i, 0, Math.min(32, n - i));
  }
  for (let i = 0; i < n; i++) out[i] |= 0x80;
  return out;
}

function pdfString(s) {
  return '(' + Buffer.from(String(s), 'latin1').toString('latin1').replace(/[\\()]/g, (c) => '\\' + c) + ')';
}

function makePdf(spec) {
  const pages = spec.pages;
  const images = spec.images || [];
  const objs = []; // [num, Buffer]
  let next = 1;
  const alloc = () => next++;

  const catalog = alloc(), pagesNum = alloc(), font = alloc();
  const fontFile = spec.fontBytes ? alloc() : null;
  const imageNums = images.map(() => alloc());
  const pageNums = pages.map(() => ({ page: alloc(), content: alloc() }));

  const add = (num, head, stream) => {
    const parts = [Buffer.from(num + ' 0 obj\n' + head, 'latin1')];
    if (stream) parts.push(Buffer.from('\nstream\n', 'latin1'), stream, Buffer.from('\nendstream', 'latin1'));
    parts.push(Buffer.from('\nendobj\n', 'latin1'));
    objs.push([num, Buffer.concat(parts)]);
  };

  add(catalog, '<< /Type /Catalog /Pages ' + pagesNum + ' 0 R >>');
  add(pagesNum, '<< /Type /Pages /Count ' + pages.length + ' /Kids [' + pageNums.map((p) => p.page + ' 0 R').join(' ') + '] /MediaBox [0 0 595 842] >>');
  add(font, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding' +
    (fontFile ? ' /FontDescriptor << /Type /FontDescriptor /FontName /Helvetica /FontFile3 ' + fontFile + ' 0 R >>' : '') + ' >>');
  if (fontFile) {
    const data = filler(spec.fontBytes, 'font');
    add(fontFile, '<< /Subtype /Type1C /Length ' + data.length + ' >>', data);
  }
  images.forEach((size, i) => {
    const data = filler(size, 'img' + i);
    add(imageNums[i], '<< /Type /XObject /Subtype /Image /Width 800 /Height 600 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + data.length + ' >>', data);
  });
  pages.forEach((lines, pi) => {
    const mine = images.map((_, i) => i).filter((i) => i % pages.length === pi);
    const xobj = mine.length ? ' /XObject << ' + mine.map((i) => '/Im' + i + ' ' + imageNums[i] + ' 0 R').join(' ') + ' >>' : '';
    let content = 'BT /F1 11 Tf 14 TL 50 790 Td\n' + lines.map((l, li) => (li ? 'T* ' : '') + pdfString(l) + ' Tj').join('\n') + '\nET\n';
    content += mine.map((i) => 'q 200 0 0 150 300 ' + (60 + 160 * (i % 3)) + ' cm /Im' + i + ' Do Q').join('\n');
    const buf = Buffer.from(content, 'latin1');
    add(pageNums[pi].content, '<< /Length ' + buf.length + ' >>', buf);
    add(pageNums[pi].page, '<< /Type /Page /Parent ' + pagesNum + ' 0 R /Contents ' + pageNums[pi].content + ' 0 R /Resources << /Font << /F1 ' + font + ' 0 R >>' + xobj + ' >> >>');
  });

  objs.sort((a, b) => a[0] - b[0]);
  const chunks = [Buffer.from('%PDF-1.7\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  let pos = chunks[0].length;
  const offsets = {};
  for (const [num, buf] of objs) { offsets[num] = pos; chunks.push(buf); pos += buf.length; }
  let xref = 'xref\n0 ' + next + '\n0000000000 65535 f \n';
  for (let n = 1; n < next; n++) xref += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
  xref += 'trailer\n<< /Size ' + next + ' /Root ' + catalog + ' 0 R >>\nstartxref\n' + pos + '\n%%EOF\n';
  chunks.push(Buffer.from(xref, 'latin1'));
  return Buffer.concat(chunks);
}

// Kleine Betriebsanleitung (BTA) mit eingebauten Fehlern fuer den Cross-Check:
// Widerspruch Seite 2 <-> Seite 5 (abgesetzt vs. auf dem LKW) und Ausschalten
// (Seite 3) vor der Inbetriebnahme (Seite 4).
function btaPages(n) {
  const pages = [
    ['Betriebsanleitung Hochdruckreiniger HD 9/20', 'Inhalt', '1 Sicherheit', '2 Inbetriebnahme', '3 Betrieb'],
    ['1 Sicherheit', 'Die Anlage nur im abgesetzten Zustand betreiben.', 'Vor allen Arbeiten den Netzstecker ziehen.'],
    ['2 Ausschalten', 'Anlage ausschalten: Hauptschalter auf 0 stellen.', 'Wasserzulauf schließen.'],
    ['3 Inbetriebnahme', 'Anlage in Betrieb nehmen: Hauptschalter auf I stellen.', 'Handspritzpistole entriegeln.'],
    ['4 Betrieb auf dem LKW', 'Wie betreibe ich die Anlage auf dem LKW?', 'Die Anlage kann während der Fahrt betrieben werden.']
  ];
  for (let i = pages.length; i < n; i++) pages.push(['Kapitel ' + (i + 1), 'Pflege und Wartung, Abschnitt ' + (i + 1) + '.', 'Düse regelmäßig reinigen.']);
  return pages.slice(0, Math.max(n, 1));
}

module.exports = { makePdf, btaPages };
