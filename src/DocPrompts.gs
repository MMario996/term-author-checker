// ============================================================================
// GESAMTDOKUMENT-PROMPTS (KI-Prompt-Regeln mit PromptScope = 'DOCUMENT')
// ----------------------------------------------------------------------------
// Normale KI-Prompt-Regeln werden als eine Zeile ("SPECIFIC CHECK ...") in den
// Grammatik-Prompt eingebaut und pro Abschnitt (PDF: je 4 Seiten) geprueft; die
// Antwort muss ins Schema {"issues":[{original, suggestion}]} passen. Ein Prompt,
// der das GANZE Dokument braucht (z. B. Widersprueche zwischen Seite 3 und 90)
// und ein eigenes Ausgabeformat vorgibt, ging dort unter - Gemini lieferte nur
// Grammatikfunde.
//
// Regeln mit PromptScope 'DOCUMENT' laufen deshalb getrennt: eine eigene Anfrage
// pro Regel mit dem vollstaendigen Dokument (PDF bzw. Text), der Prompt wird
// unveraendert gesendet, kein JSON-Zwang. Die Antworten (Markdown) landen in
// einem Google Doc ("Bericht"), das im Ergebnis verlinkt wird.
// ============================================================================

var DOC_PROMPT_SCOPE = 'DOCUMENT';
var DOC_PROMPT_MAX = 5; // so viele Gesamtdokument-Prompts pro Pruefung (parallel)
// Groesste PDF, die einem Gesamtdokument-Prompt direkt beiliegt. Gemini nimmt
// hoechstens 20 MB pro Anfrage, Base64 macht aus 13 MB ~17,3 MB, dazu kommt der
// Prompt (bis 50.000 Zeichen). Frueher galt hier dieselbe Grenze wie fuer die
// Seitenpakete (15 MB, als Base64 ~20 MB): grosse Anleitungen lagen nach dem
// Verkleinern knapp darunter, die Anfrage mit der ganzen PDF scheiterte (am
// Limit oder am Proxy davor) und der Prompt fehlte im Ergebnis.
// Skripteigenschaft DOC_PROMPT_PDF_MAX_MB setzt einen anderen Wert (z. B. wenn
// ein Proxy weniger annimmt). Groessere PDFs laufen ueber den Seitentext, eine
// abgelehnte Anfrage mit PDF wird mit dem Seitentext wiederholt (DriveAddon.gs).
var DOC_PROMPT_PDF_MAX_BYTES = 13 * 1024 * 1024;
// So viel Text aus den uebrigen eigenen Regeln (z. B. importierter
// Redaktionsleitfaden) geht als Referenz mit.
var DOC_PROMPT_GUIDE_MAX_CHARS = 30000;

function _docPromptPdfMaxBytes_() {
  var mb = parseFloat(PropertiesService.getScriptProperties().getProperty('DOC_PROMPT_PDF_MAX_MB') || '');
  return mb > 0 ? Math.round(mb * 1024 * 1024) : DOC_PROMPT_PDF_MAX_BYTES;
}

function _isDocScopePrompt_(r) {
  return !!(r && r.PromptScope === DOC_PROMPT_SCOPE && (r.RuleKind === 'PROMPT' || r.CustomPrompt));
}

// Aktive Gesamtdokument-Prompts einer Regelliste (nur Felder, die gebraucht werden).
// guide: die uebrigen aktiven eigenen Regeln als Referenz (siehe _docPromptGuide_).
function _docPromptsFromRules_(rules) {
  var guide = _docPromptGuide_(rules);
  return (rules || []).filter(function(r) { return r.IsEnabled && _isDocScopePrompt_(r); })
    .slice(0, DOC_PROMPT_MAX)
    .map(function(r) {
      return { name: r.Name, title: String(r.Description || r.Name || 'Prompt'), prompt: String(r.CustomPrompt || r.Description || ''), guide: guide };
    });
}

// Ein Prompt aus einem Gem verweist oft auf den "hinterlegten Redaktionsleitfaden".
// Zur Pruefzeit gibt es keine Gem-Wissensdateien - die aus dem Leitfaden
// importierten eigenen Regeln liegen aber im Regelwerk. Sie gehen deshalb als
// Referenz mit (nur eigene Regeln, keine Standardregeln, keine Gesamtdokument-Prompts).
function _docPromptGuide_(rules) {
  var lines = [], len = 0, more = 0;
  (rules || []).forEach(function(r) {
    if (!r || !r.IsEnabled || _isDocScopePrompt_(r) || String(r.Name || '').indexOf('CUSTOM_') !== 0) return;
    var head = [r.Section, r.Subsection].filter(function(x) { return x && x !== 'General'; }).join(' > ');
    var line = '- ' + (head ? '[' + head + '] ' : '') + String(r.Description || '').replace(/\s+/g, ' ').trim();
    var p = r.RuleKind === 'PROMPT' && r.CustomPrompt && r.CustomPrompt !== r.Description
      ? String(r.CustomPrompt).replace(/\s+/g, ' ').trim() : '';
    if (p) line += ' -- ' + p;
    if (len + line.length > DOC_PROMPT_GUIDE_MAX_CHARS) { more++; return; }
    lines.push(line);
    len += line.length + 1;
  });
  if (more) lines.push('- (' + more + ' further rules omitted for length)');
  return lines.join('\n');
}

// Hinweise, warum bei einer Pruefung kein (oder nicht jeder) Gesamtdokument-Prompt
// lief. Frueher lief die Pruefung dann einfach ohne - fuer den Nutzer sah es aus,
// als sei der importierte Prompt ignoriert worden. Liefert Texte in der UI-Sprache.
function _docPromptNotes_(lang, rules) {
  var notes = [];
  var mine = (rules || []).filter(function(r) { return r && String(r.Name || '').indexOf('CUSTOM_') === 0 && r.RuleKind === 'PROMPT'; });
  if (!_rulesLanguageSupported_(lang)) {
    var other = [];
    ['de', 'en'].forEach(function(l) {
      try {
        apiGetRulesConfig(l).forEach(function(r) { if (r.IsEnabled && _isDocScopePrompt_(r)) other.push(r.Description || r.Name); });
      } catch (e) {}
    });
    if (other.length) notes.push(_ct_('d.docNoteLang', { lang: String(lang || '').toUpperCase(), names: other.join(', ') }));
    return notes;
  }
  var active = mine.filter(function(r) { return r.IsEnabled && _isDocScopePrompt_(r); });
  if (active.length > DOC_PROMPT_MAX) {
    notes.push(_ct_('d.docNoteMax', { n: active.length, max: DOC_PROMPT_MAX,
      names: active.slice(DOC_PROMPT_MAX).map(function(r) { return r.Description || r.Name; }).join(', ') }));
  }
  mine.forEach(function(r) {
    if (!r.IsEnabled && _isDocScopePrompt_(r)) notes.push(_ct_('d.docNoteDisabled', { name: r.Description || r.Name }));
    // Lange Pruefanweisungen mit eigenem Berichtsformat gehen "pro Abschnitt"
    // (je 4 Seiten, nur Funde im Listenformat) praktisch unter.
    else if (r.IsEnabled && !_isDocScopePrompt_(r) && String(r.CustomPrompt || '').length > 2000) {
      notes.push(_ct_('d.docNotePassage', { name: r.Description || r.Name }));
    }
  });
  if (!active.length) {
    var otherLang = lang === 'de' ? 'en' : 'de', there = [];
    try {
      apiGetRulesConfig(otherLang).forEach(function(r) { if (r.IsEnabled && _isDocScopePrompt_(r)) there.push(r.Description || r.Name); });
    } catch (e) {}
    if (there.length) {
      notes.push(_ct_('d.docNoteOtherLang', { lang: lang.toUpperCase(), other: otherLang.toUpperCase(), names: there.join(', ') }));
    }
  }
  return notes;
}

// Rahmen um den Prompt: nur Fakten, die das Modell sonst nicht kennt (Datum,
// Dateiname, Seitenzahl). Der Prompt selbst bleibt unveraendert und bestimmt
// Vorgehen und Ausgabeformat.
// ctx: { fileName, pages, isPdf, text, fromPdf } - fromPdf: der Text wurde aus
// einer PDF gelesen, die fuer eine Anfrage zu gross war (Seitenmarken im Text).
function _docPromptText_(dp, ctx) {
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Berlin', 'dd.MM.yyyy');
  var facts = [
    'Check date (today): ' + today,
    'Document: ' + (ctx.fileName || '(unnamed)'),
    ctx.pages ? 'Total pages: ' + ctx.pages : '',
    ctx.isPdf ? 'The complete original document is attached as a PDF. Page numbers refer to the PDF pages.'
      : ctx.fromPdf ? 'The PDF was too large to attach. Its complete text (all pages, extracted page by page, without images) ' +
                      'follows after the instructions between """ markers. Each page starts with a line "=== Page N of M ==="; ' +
                      'page numbers refer to these markers. Text in images or drawings is not available - mark findings that depend on it as uncertain.'
      : 'The complete document text follows after the instructions between """ markers.'
  ].filter(String).join('\n');
  var guide = dp.guide
    ? '=== REFERENCE: RULES FROM THE USER\'S RULE SET ===\n' +
      'These are the custom rules active in the user\'s rule set (for example imported from the editorial style guide / ' +
      'Redaktionsleitfaden). If the instructions refer to a style guide, Redaktionsleitfaden or knowledge file, ' +
      'use these rules as that reference. Knowledge files of a Gemini Gem are not available.\n' +
      dp.guide + '\n=== END OF REFERENCE ===\n\n'
    : '';
  return 'CONTEXT (provided by the tool):\n' + facts + '\n\n' +
    'Follow the instructions below exactly. Work on the WHOLE document, not on single pages. ' +
    'Write your answer in Markdown, in the output format the instructions define.\n\n' +
    '=== INSTRUCTIONS ===\n' + dp.prompt + '\n=== END OF INSTRUCTIONS ===\n\n' + guide +
    DOC_PROMPT_FINDINGS_RULES +
    (ctx.isPdf ? '' : '\n\n"""\n' + String(ctx.text || '').replace(/"""/g, "'''") + '\n"""');
}

// Zusatz des Tools (hat Vorrang vor "antworte ausschliesslich mit ..." im Prompt):
// nach dem Bericht dieselben Befunde maschinenlesbar, damit sie als Kommentar an
// der richtigen Stelle im Dokument landen (kommentierte PDF, Notiz in Docs/
// Sheets/Slides). Jede beteiligte Stelle eines Befunds wird ein eigener Eintrag.
var DOC_PROMPT_MARKER = '===TERMCHECK_FINDINGS===';
var DOC_PROMPT_FINDINGS_RULES =
  'TOOL REQUIREMENT (takes precedence over any "answer only with ..." rule above): after your complete answer, ' +
  'add a line containing only ' + DOC_PROMPT_MARKER + ' and then valid JSON (no markdown, no code block) in exactly this structure:\n' +
  '{"issues":[{"location":"...","original":"...","suggestion":"...","explanation":"...","replaceable":false}]}\n' +
  'Rules for this JSON:\n' +
  '- One entry per affected passage. A finding that involves several pages (e.g. a contradiction between page 3 and page 90) ' +
  'gets one entry for EACH involved passage, so every passage can be commented in the document.\n' +
  '- "original": an EXACT, contiguous, verbatim quote from the document (a few words up to one sentence, ' +
  'copied character by character, no ellipsis, no paraphrase), so it can be found in the document text.\n' +
  '- "location": page number as "Page N" (PDF) or the section/heading, if identifiable.\n' +
  '- "suggestion": the concrete correction for this passage (replacement text if the passage itself should be reworded, ' +
  'otherwise a short instruction).\n' +
  '- "explanation": the finding in the language of the instructions, including the other involved pages/passages ' +
  '(e.g. "Contradiction 1: contradicts page 105 ...").\n' +
  '- "replaceable": true ONLY if "suggestion" is a drop-in replacement text for "original", otherwise false.\n' +
  '- No findings: {"issues":[]}.';

// Trennt die Antwort in Bericht (Markdown) und Befunde (JSON nach dem Marker).
function _splitDocPromptAnswer_(text) {
  var idx = text.lastIndexOf(DOC_PROMPT_MARKER);
  var report = idx === -1 ? text : text.slice(0, idx);
  var tail = idx === -1 ? '' : text.slice(idx + DOC_PROMPT_MARKER.length);
  var issues = [];
  if (tail) {
    var clean = tail.replace(/```json/gi, '').replace(/```/g, '').trim();
    var start = clean.indexOf('{'), end = clean.lastIndexOf('}');
    try {
      var parsed = JSON.parse(clean.slice(start, end + 1));
      issues = Array.isArray(parsed.issues) ? parsed.issues : [];
    } catch (e) {
      Logger.log('_splitDocPromptAnswer_: Befunde nicht lesbar: ' + (e.message || e));
    }
  }
  return { report: report.trim(), issues: issues };
}

// Befunde eines Gesamtdokument-Prompts in das normale Issue-Format bringen
// (Typ "prompt", Regelname fuer Anzeige und Kommentar).
function _docPromptIssues_(dp, raw) {
  return (raw || []).filter(function(i) { return i && i.original && String(i.original).trim(); }).map(function(i) {
    return {
      type: 'prompt',
      rule: dp.title,
      location: String(i.location || ''),
      original: String(i.original).trim(),
      suggestion: String(i.suggestion || '').trim() || '–',
      explanation: String(i.explanation || ''),
      replaceable: i.replaceable === true
    };
  });
}

// Alle Befunde aus den Berichten (fuer die Issue-Liste).
function _docPromptAllIssues_(reports) {
  var out = [];
  (reports || []).forEach(function(r) { (r.issues || []).forEach(function(i) { out.push(i); }); });
  return out;
}

// Baut die UrlFetch-Anfrage fuer einen Gesamtdokument-Prompt. pdfBytes ODER text.
function _docPromptRequest_(cfg, dp, ctx, pdfBytes) {
  var parts = [{ text: _docPromptText_(dp, ctx) }];
  if (pdfBytes) parts.push({ inlineData: { mimeType: 'application/pdf', data: Utilities.base64Encode(pdfBytes) } });
  var call = _buildGeminiRequest_(cfg.apiUrl, cfg.model, cfg.apiKey, {
    contents: [{ role: 'user', parts: parts }],
    generationConfig: { temperature: cfg.temperature }
  });
  return { url: call.url, method: 'post', contentType: 'application/json',
           headers: call.headers, payload: JSON.stringify(call.body), muteHttpExceptions: true };
}

// Antwort -> { title, markdown } oder { title, error }.
function _docPromptResult_(dp, res) {
  try {
    var code = res.getResponseCode();
    if (code !== 200) return { title: dp.title, error: 'AI request failed (' + code + ').', code: code };
    var data = JSON.parse(res.getContentText());
    var cand = data.candidates && data.candidates[0];
    var text = cand && cand.content && cand.content.parts
      ? cand.content.parts.map(function(p) { return p.text || ''; }).join('') : '';
    if (!text.trim()) return { title: dp.title, error: 'Empty AI response' + (cand && cand.finishReason ? ' (' + cand.finishReason + ')' : '') + '.' };
    var split = _splitDocPromptAnswer_(text);
    var out = { title: dp.title, markdown: split.report || text, issues: _docPromptIssues_(dp, split.issues) };
    if (cand.finishReason === 'MAX_TOKENS') out.truncated = true;
    return out;
  } catch (e) {
    return { title: dp.title, error: 'Unexpected AI response: ' + (e.message || e) };
  }
}

// Fuehrt alle Gesamtdokument-Prompts parallel aus.
function _runDocPrompts_(cfg, docPrompts, ctx, pdfBytes) {
  if (!docPrompts.length) return [];
  var requests = docPrompts.map(function(dp) { return _docPromptRequest_(cfg, dp, ctx, pdfBytes); });
  var responses = requests.length === 1
    ? [_fetchGeminiWithRetry_(requests[0].url, requests[0], 2)]
    : UrlFetchApp.fetchAll(requests);
  return responses.map(function(res, i) {
    if (requests.length > 1 && GEMINI_RETRYABLE_CODES.indexOf(res.getResponseCode()) !== -1) {
      res = _fetchGeminiWithRetry_(requests[i].url, requests[i], 2);
    }
    return _docPromptResult_(docPrompts[i], res);
  });
}

// ─── BERICHT ALS GOOGLE DOC ────────────────────────────────────────────────
// Das Add-on hat nur documents.currentonly (kein DocumentApp.create). Der Bericht
// wird deshalb als HTML ueber die Drive-API hochgeladen und dabei in ein Google
// Doc umgewandelt (Scope drive ist vorhanden). Liefert die URL.
function _buildDocPromptReport_(fileName, reports, folderKey) {
  var ok = reports.filter(function(r) { return r.markdown; });
  if (!ok.length) return '';
  var title = 'TermCheck_Report_' + String(fileName || 'Document').replace(/\.pdf$/i, '').slice(0, 60) + '_' +
    Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Europe/Berlin', 'yyyy-MM-dd_HH-mm');
  var body = reports.map(function(r, i) {
    var head = reports.length > 1 ? '<h1>' + _mdEsc_(r.title) + '</h1>' : '';
    if (r.error) return head + '<p><i>' + _mdEsc_(r.error) + '</i></p>';
    return head + (r.note ? '<p><i>' + _mdEsc_(r.note) + '</i></p>' : '') + _markdownToHtml_(r.markdown) +
      (r.truncated ? '<p><i>The AI answer was cut off at the maximum output length.</i></p>' : '') +
      (i < reports.length - 1 ? '<hr>' : '');
  }).join('');
  var html = '<html><head><meta charset="utf-8"></head><body>' + body + '</body></html>';

  var boundary = 'tc' + Utilities.getUuid().replace(/-/g, '');
  var meta = { name: title, mimeType: 'application/vnd.google-apps.document', parents: [_tcFolder_(folderKey || 'reports').getId()] };
  var payload = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(meta) +
    '\r\n--' + boundary + '\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n' + html + '\r\n--' + boundary + '--';
  var res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink', {
    method: 'post',
    contentType: 'multipart/related; boundary=' + boundary,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: Utilities.newBlob(payload, 'multipart/related', 'report').getBytes(),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Report could not be created (HTTP ' + res.getResponseCode() + ').');
  var file = JSON.parse(res.getContentText());
  return file.webViewLink || ('https://docs.google.com/document/d/' + file.id + '/edit');
}

// Berichte erzeugen und Fehler beim Anlegen des Docs nicht die ganze Pruefung
// kippen lassen. Liefert { url, items: [{ title, error, truncated }], notes }.
// notes (optional): Hinweise in der UI-Sprache (siehe _docPromptNotes_).
function _finishDocPromptReports_(fileName, reports, folderKey, notes) {
  var out = { url: '', notes: notes || [], items: reports.map(function(r) {
    return { title: r.title, error: r.error || '', note: r.note || '', truncated: !!r.truncated, findings: (r.issues || []).length };
  }) };
  if (!reports.length) return out;
  try { out.url = _buildDocPromptReport_(fileName, reports, folderKey); }
  catch (e) {
    Logger.log('_finishDocPromptReports_: ' + (e.message || e));
    out.error = e.message || String(e);
  }
  logAuditEvent_(getUserEmail_(), 'DOC_PROMPT_RUN', fileName + ' - ' + reports.length + ' prompt(s), ' +
    reports.filter(function(r) { return r.error; }).length + ' failed');
  return out;
}

// ─── MARKDOWN -> HTML (fuer die Umwandlung in ein Google Doc) ────────────────
// Bewusst klein: Ueberschriften, Listen (verschachtelt per Einrueckung),
// Trennlinien, Tabellen, **fett**, *kursiv*, `code`, [Link](url), Absaetze.
function _mdEsc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _mdInline_(s) {
  var out = _mdEsc_(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/__([^_]+)__/g, '<b>$1</b>');
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  return out;
}

function _markdownToHtml_(md) {
  var lines = String(md || '').replace(/\r\n?/g, '\n').replace(/^```[a-z]*\n?|```$/gim, '').split('\n');
  var html = [], para = [], stack = []; // stack: Einrueckungen offener <ul>/<ol>
  function flushPara() { if (para.length) { html.push('<p>' + para.map(_mdInline_).join('<br>') + '</p>'); para = []; } }
  function closeLists(toDepth) { while (stack.length > toDepth) html.push('</' + stack.pop().tag + '>'); }

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var m;
    if (!line.trim()) { flushPara(); continue; }
    if ((m = line.match(/^\s*(#{1,6})\s+(.*)$/))) {
      flushPara(); closeLists(0);
      var lvl = Math.min(6, m[1].length);
      html.push('<h' + lvl + '>' + _mdInline_(m[2].replace(/\s#+\s*$/, '')) + '</h' + lvl + '>');
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); closeLists(0); html.push('<hr>'); continue; }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushPara(); closeLists(0);
      var rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i++; }
      i--;
      html.push('<table border="1" cellpadding="4" style="border-collapse:collapse">' + rows.filter(function(r) {
        return !/^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/.test(r);
      }).map(function(r, ri) {
        var cells = r.trim().replace(/^\||\|$/g, '').split('|');
        var tag = ri === 0 ? 'th' : 'td';
        return '<tr>' + cells.map(function(c) { return '<' + tag + '>' + _mdInline_(c.trim()) + '</' + tag + '>'; }).join('') + '</tr>';
      }).join('') + '</table>');
      continue;
    }
    if ((m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/))) {
      flushPara();
      var indent = m[1].replace(/\t/g, '    ').length;
      var tag = /\d/.test(m[2]) ? 'ol' : 'ul';
      while (stack.length && stack[stack.length - 1].indent > indent) html.push('</' + stack.pop().tag + '>');
      if (!stack.length || stack[stack.length - 1].indent < indent) {
        html.push('<' + tag + '>'); stack.push({ indent: indent, tag: tag });
      } else if (stack[stack.length - 1].tag !== tag) {
        html.push('</' + stack.pop().tag + '>'); html.push('<' + tag + '>'); stack.push({ indent: indent, tag: tag });
      }
      html.push('<li>' + _mdInline_(m[3]) + '</li>');
      continue;
    }
    if (stack.length && /^\s+\S/.test(line)) { html.push('<li style="list-style:none">' + _mdInline_(line.trim()) + '</li>'); continue; }
    closeLists(0);
    para.push(line.trim());
  }
  flushPara(); closeLists(0);
  return html.join('\n');
}

// Name der geoeffneten Datei (Docs/Sheets/Slides) fuer Bericht und Prompt-Kontext.
function _activeFileName_() {
  try {
    var f = DocumentApp.getActiveDocument() || SpreadsheetApp.getActiveSpreadsheet() || SlidesApp.getActivePresentation();
    return f ? f.getName() : 'Document';
  } catch (e) {
    return 'Document';
  }
}

// Anzeige-Kategorie eines Fundes: terminology, grammar, prompt (Gesamtdokument-
// Prompt) oder style (alles andere).
function _issueTypeKey_(issue) {
  var t = issue && issue.type;
  return (t === 'terminology' || t === 'grammar' || t === 'prompt') ? t : 'style';
}
