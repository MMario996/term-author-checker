// Simulierte Google-Apps-Script-Umgebung fuer die CI.
//
// Laedt ALLE .gs-Dateien unveraendert in einen Node-vm-Kontext und stellt die
// benutzten Google-Dienste im Speicher bereit: Drive (Dateien, Ordner, Range-
// Downloads, Multipart-Upload als Google Doc, Loeschen), Script-/User-
// Properties, Cache, Utilities, Session, ScriptApp. Anfragen an Gemini gehen an
// einen austauschbaren Handler (sim.gemini), der wie die echte API ein Limit
// fuer die Anfragegroesse hat (Standard 20 MB) - so faellt auf, wenn eine
// Anfrage in der Praxis abgelehnt wuerde.
//
// Aufruf: const sim = createSim(); sim.ctx.apiPdfWebStart(...)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const zlib = require('zlib');
const crypto = require('crypto');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const MB = 1024 * 1024;

function createSim(opts) {
  opts = opts || {};
  const logs = [];
  const quiet = (...a) => logs.push(a.map(String).join(' '));

  // ─── Bytes wie in Apps Script: signed byte[] ───────────────────────────
  const toBuf = (b) => {
    if (Buffer.isBuffer(b)) return b;
    if (typeof b === 'string') return Buffer.from(b, 'utf8');
    if (b instanceof Int8Array) return Buffer.from(b.buffer, b.byteOffset, b.byteLength);
    return Buffer.from(Int8Array.from(b).buffer);
  };
  const toSigned = (buf) => new Int8Array(buf.buffer, buf.byteOffset, buf.length);

  // ─── Blob ──────────────────────────────────────────────────────────────
  function makeBlob(data, mime, name) {
    let buf = data == null ? Buffer.alloc(0) : toBuf(data);
    const blob = {
      getBytes: () => toSigned(Buffer.from(buf)),
      getDataAsString: (cs) => buf.toString(/^iso-8859-1$/i.test(cs || '') ? 'latin1' : 'utf8'),
      setDataFromString: (s, cs) => { buf = Buffer.from(s, /^iso-8859-1$/i.test(cs || '') ? 'latin1' : 'utf8'); return blob; },
      getContentType: () => mime || 'application/octet-stream',
      getName: () => name || '',
      setName: (n) => { name = n; return blob; },
      _buf: () => buf
    };
    return blob;
  }

  // ─── Drive im Speicher ─────────────────────────────────────────────────
  let seq = 0;
  const files = new Map();   // id -> { id, name, mime, buf, parent, trashed, updated }
  const folders = new Map(); // id -> { id, name, parent, trashed }
  const newId = (p) => p + (++seq).toString(36) + crypto.randomBytes(4).toString('hex');

  function fileApi(f) {
    return {
      getId: () => f.id,
      getName: () => f.name,
      getSize: () => f.buf.length,
      getMimeType: () => f.mime,
      getBlob: () => makeBlob(f.buf, f.mime, f.name),
      getUrl: () => 'https://drive.google.com/file/d/' + f.id + '/view',
      setContent: (s) => { f.buf = Buffer.from(String(s), 'utf8'); f.updated = new Date(); return fileApi(f); },
      setTrashed: (t) => { f.trashed = !!t; return fileApi(f); },
      isTrashed: () => !!f.trashed,
      getLastUpdated: () => f.updated,
      moveTo: (folder) => { f.parent = folder.getId(); return fileApi(f); },
      setName: (n) => { f.name = n; return fileApi(f); }
    };
  }
  const iter = (arr) => { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; };
  function nameFromQuery(q) { const m = /title = "((?:[^"\\]|\\.)*)"/.exec(q); return m ? m[1].replace(/\\"/g, '"') : null; }

  function folderApi(d) {
    const api = {
      getId: () => d.id,
      getName: () => d.name,
      isTrashed: () => !!d.trashed,
      setName: (n) => { d.name = n; return api; },
      moveTo: (p) => { d.parent = p.getId(); return api; },
      createFolder: (name) => folderApi(addFolder(name, d.id)),
      searchFolders: (q) => iter([...folders.values()].filter((x) => x.parent === d.id && !x.trashed && x.name === nameFromQuery(q)).map(folderApi)),
      getFiles: () => iter([...files.values()].filter((x) => x.parent === d.id && !x.trashed).map(fileApi)),
      getFilesByName: (n) => iter([...files.values()].filter((x) => x.parent === d.id && !x.trashed && x.name === n).map(fileApi)),
      createFile: (a, content, mime) => {
        if (a && typeof a === 'object' && a._buf) return fileApi(addFile(a.getName() || 'blob', a._buf(), a.getContentType(), d.id));
        return fileApi(addFile(String(a), Buffer.from(String(content == null ? '' : content), 'utf8'), mime || 'text/plain', d.id));
      }
    };
    return api;
  }
  function addFolder(name, parent) {
    const d = { id: newId('fo'), name, parent: parent || null, trashed: false };
    folders.set(d.id, d);
    return d;
  }
  function addFile(name, buf, mime, parent) {
    const f = { id: newId('fi'), name, mime: mime || 'application/octet-stream', buf: toBuf(buf), parent: parent || null, trashed: false, updated: new Date() };
    files.set(f.id, f);
    return f;
  }
  const DriveApp = {
    getFileById: (id) => { const f = files.get(id); if (!f) throw new Error('File not found: ' + id); return fileApi(f); },
    getFolderById: (id) => { const d = folders.get(id); if (!d) throw new Error('Folder not found: ' + id); return folderApi(d); },
    searchFolders: (q) => iter([...folders.values()].filter((x) => !x.parent && !x.trashed && x.name === nameFromQuery(q)).map(folderApi)),
    createFolder: (name) => folderApi(addFolder(name, null)),
    getRootFolder: () => folderApi(rootFolder)
  };
  const rootFolder = addFolder('My Drive', null);

  // ─── HTTP: Drive-API und Gemini ────────────────────────────────────────
  const geminiCalls = [];
  const sim = {
    logs, files, folders, geminiCalls, MB,
    geminiLimit: opts.geminiLimit || 20 * MB,
    // Antwort auf zu grosse Anfragen: Gemini selbst 400, ein Proxy davor oft 413 oder 502.
    geminiRejectCode: opts.geminiRejectCode || 400,
    // Standard-Antwort: keine Funde. Tests ersetzen sim.gemini.
    gemini: () => ({ code: 200, body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"issues":[]}' }] }, finishReason: 'STOP' }] }) })
  };
  function response(code, body, headers) {
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body == null ? '' : body), 'utf8');
    return {
      getResponseCode: () => code,
      getContentText: (cs) => buf.toString(/^iso-8859-1$/i.test(cs || '') ? 'latin1' : 'utf8'),
      getContent: () => toSigned(Buffer.from(buf)),
      getHeaders: () => headers || {},
      getBlob: () => makeBlob(buf)
    };
  }
  function http(url, o) {
    o = o || {};
    const method = String(o.method || 'get').toLowerCase();
    let m;
    if ((m = /^https:\/\/www\.googleapis\.com\/drive\/v3\/files\/([^/?]+)\?alt=media/.exec(url))) {
      const f = files.get(decodeURIComponent(m[1]));
      if (!f || f.trashed) return response(404, 'not found');
      const range = o.headers && o.headers.Range && /bytes=(\d+)-(\d+)/.exec(o.headers.Range);
      if (!range) return response(200, f.buf);
      const a = parseInt(range[1], 10), b = Math.min(parseInt(range[2], 10), f.buf.length - 1);
      return response(206, f.buf.subarray(a, b + 1));
    }
    if ((m = /^https:\/\/www\.googleapis\.com\/drive\/v3\/files\/([^/?]+)/.exec(url)) && method === 'delete') {
      const id = decodeURIComponent(m[1]);
      if (!files.has(id)) return response(404, '');
      files.delete(id);
      return response(204, '');
    }
    if (/^https:\/\/www\.googleapis\.com\/upload\/drive\/v3\/files\?uploadType=multipart/.test(url)) {
      const body = toBuf(o.payload).toString('utf8');
      const meta = JSON.parse(/\r\n\r\n(\{[\s\S]*?\})\r\n--/.exec(body)[1]);
      const html = body.split('Content-Type: text/html; charset=UTF-8\r\n\r\n')[1].replace(/\r\n--[^\r\n]*--\s*$/, '');
      const f = addFile(meta.name, Buffer.from(html, 'utf8'), meta.mimeType, (meta.parents || [])[0]);
      return response(200, JSON.stringify({ id: f.id, webViewLink: 'https://docs.google.com/document/d/' + f.id + '/edit' }));
    }
    if (/:generateContent$/.test(url) && opts.live) {
      // Live-Check: echte Anfrage (synchron wie UrlFetchApp), Kopfzeilen wie vom Code gesetzt.
      const tmp = path.join(os.tmpdir(), 'gemini-' + crypto.randomUUID() + '.json');
      fs.writeFileSync(tmp, String(o.payload || ''));
      const args = ['-sS', '-X', 'POST', '--max-time', '360', '-H', 'Content-Type: application/json', '--data-binary', '@' + tmp, '-w', '\n%{http_code}'];
      Object.entries(o.headers || {}).forEach(([k, v]) => args.push('-H', k + ': ' + v));
      const t0 = Date.now();
      let out;
      try { out = execFileSync('curl', args.concat([url]), { maxBuffer: 64 * MB }).toString('utf8'); }
      catch (e) { out = String(e.stdout || '') + '\n0'; }
      finally { fs.unlinkSync(tmp); }
      const cut = out.lastIndexOf('\n');
      const code = parseInt(out.slice(cut + 1), 10) || 0;
      geminiCalls.push({ url, size: Buffer.byteLength(String(o.payload || '')), code, ms: Date.now() - t0,
        text: (JSON.parse(o.payload).contents[0].parts.find((p) => p.text) || {}).text || '' });
      return response(code, out.slice(0, cut));
    }
    if (/:generateContent$/.test(url)) {
      const payload = String(o.payload || '');
      const size = Buffer.byteLength(payload);
      if (size > sim.geminiLimit) {
        geminiCalls.push({ url, size, rejected: true });
        return response(sim.geminiRejectCode, JSON.stringify({ error: { code: sim.geminiRejectCode, message: 'Request payload size exceeds the limit: ' + sim.geminiLimit + ' bytes.' } }));
      }
      const req = JSON.parse(payload);
      const parts = req.contents[0].parts;
      const call = {
        url, size, headers: o.headers,
        text: parts.filter((p) => p.text).map((p) => p.text).join('\n'),
        pdf: parts.filter((p) => p.inlineData).map((p) => Buffer.from(p.inlineData.data, 'base64'))[0] || null
      };
      geminiCalls.push(call);
      const r = sim.gemini(call);
      if (r.text !== undefined) {
        return response(200, JSON.stringify({ candidates: [{ content: { parts: [{ text: r.text }] }, finishReason: r.finishReason || 'STOP' }] }));
      }
      return response(r.code || 200, r.body || '');
    }
    throw new Error('Unexpected URL in CI: ' + method.toUpperCase() + ' ' + url);
  }
  const UrlFetchApp = {
    fetch: (url, o) => http(url, o),
    fetchAll: (reqs) => reqs.map((r) => http(r.url, r))
  };

  // ─── Properties, Cache ─────────────────────────────────────────────────
  function store(init) {
    const m = new Map(Object.entries(init || {}));
    return {
      getProperty: (k) => (m.has(k) ? m.get(k) : null),
      setProperty: (k, v) => { m.set(k, String(v)); },
      setProperties: (o) => { for (const k of Object.keys(o)) m.set(k, String(o[k])); },
      deleteProperty: (k) => { m.delete(k); },
      getProperties: () => Object.fromEntries(m),
      _map: m
    };
  }
  const scriptProps = store(Object.assign({ PHRASE_API_TOKEN: 'ApiToken ci-token', GEMINI_API_KEY: 'ci-key', GEMINI_API_URL: 'https://gemini.ci.local/v1beta/models/' }, opts.scriptProps));
  const userProps = store(Object.assign({ UI_LANG: opts.uiLang || 'de' }, opts.userProps));
  function cache() {
    const m = new Map();
    return { get: (k) => (m.has(k) ? m.get(k) : null), put: (k, v) => { m.set(k, String(v)); }, remove: (k) => { m.delete(k); }, removeAll: (ks) => ks.forEach((k) => m.delete(k)) };
  }
  const userCache = cache(), scriptCache = cache();

  const pad = (n) => String(n).padStart(2, '0');
  const ctx = {
    console: { log: quiet, info: quiet, warn: quiet, error: quiet },
    Logger: { log: quiet },
    PropertiesService: { getScriptProperties: () => scriptProps, getUserProperties: () => userProps },
    CacheService: { getUserCache: () => userCache, getScriptCache: () => scriptCache },
    DriveApp,
    UrlFetchApp,
    MimeType: { PLAIN_TEXT: 'text/plain', PDF: 'application/pdf', GOOGLE_DOCS: 'application/vnd.google-apps.document' },
    Session: {
      getActiveUser: () => ({ getEmail: () => 'ci@example.com' }),
      getEffectiveUser: () => ({ getEmail: () => 'ci@example.com' }),
      getScriptTimeZone: () => 'Europe/Berlin'
    },
    ScriptApp: { getOAuthToken: () => 'ci-token' },
    Utilities: {
      DigestAlgorithm: { MD5: 'md5', SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      getUuid: () => crypto.randomUUID(),
      sleep: () => {},
      formatDate: (d, tz, fmt) => fmt
        .replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate()))
        .replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes())).replace('ss', pad(d.getSeconds())),
      base64Encode: (b) => toBuf(b).toString('base64'),
      base64EncodeWebSafe: (b) => toBuf(b).toString('base64url'),
      base64Decode: (s) => toSigned(Buffer.from(String(s), 'base64')),
      computeDigest: (alg, s) => Array.from(crypto.createHash(alg).update(String(s)).digest()).map((x) => (x > 127 ? x - 256 : x)),
      newBlob: (data, mime, name) => makeBlob(data, mime, name),
      gzip: (blob) => makeBlob(zlib.gzipSync(blob._buf()), 'application/x-gzip'),
      ungzip: (blob) => makeBlob(zlib.gunzipSync(blob._buf()))
    }
  };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.gs')).sort()) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  // Ohne Phrase: kein Terminologie-Glossar.
  ctx._getTargetTermbases_ = () => [];
  // Uhr fuer Zeitlimits: sim.advance(ms) laesst eine Anfrage "lange dauern".
  ctx.__clockOffset = 0;
  vm.runInContext('(function(){ var real = Date.now; Date.now = function(){ return real() + __clockOffset; }; })();', ctx);

  Object.assign(sim, {
    ctx, scriptProps, userProps, userCache, scriptCache,
    advance: (ms) => { ctx.__clockOffset += ms; },
    addFile: (name, buf, mime) => addFile(name, buf, mime, rootFolder.id).id,
    fileText: (id) => files.get(id).buf.toString('utf8'),
    // Datei, die das Tool in einem Unterordner von "Kärcher TermCheck" angelegt hat.
    filesIn: (sub) => {
      const root = [...folders.values()].find((d) => d.name === 'Kärcher TermCheck');
      const dir = root && [...folders.values()].find((d) => d.parent === root.id && d.name === sub);
      return dir ? [...files.values()].filter((f) => f.parent === dir.id) : [];
    }
  });
  return sim;
}

module.exports = { createSim, MB };
