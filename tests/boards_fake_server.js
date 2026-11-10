// A local stand-in for Google that runs server/Boards.gs, for the live browser test. node tests/boards_fake_server.js PORT
const fs = require('fs'), vm = require('vm'), crypto = require('crypto'), path = require('path'), http = require('http');
class Range { constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() { const o = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push((this.sh.d[this.r - 1 + i] || [])[this.c - 1 + j] ?? ''); o.push(row); } return o; }
  setValues(v) { v.forEach((row, i) => { const R = this.sh.d[this.r - 1 + i] = this.sh.d[this.r - 1 + i] || []; row.forEach((x, j) => R[this.c - 1 + j] = x); }); return this; } setFontWeight() { return this; } }
class Sheet { constructor() { this.d = []; } getLastRow() { return this.d.length; } getRange(r, c, nr, nc) { return new Range(this, r, c, nr || 1, nc || 1); } appendRow(r) { this.d.push(r.slice()); } setFrozenRows() {} }
const mkSS = () => { const sheets = {}; return { sheets, getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = new Sheet()) }; };
const ss = mkSS(), acc = mkSS(); const ap = acc.insertSheet('People');
ap.d = [['Email', 'Name', 'Job title', 'Clearance', 'Status'], ['ceo@forka.com', 'Khaled Alamer', 'CEO', 'ceo', 'active'], ['admin@forka.com', 'Ruby Ann Margate', 'Executive Administrator', 'staff', 'active'],
  ['tahani.alamer@forka.com', 'Tahani Alamer', '', 'manager', 'active'], ['design@forka.com', 'Sara Designer', '', 'staff', 'active'], ['abu.ali@forka.com', 'Mohammad Abu Ali', 'Operations Manager', 'manager', 'active']];
const props = {}, cache = {}, files = {}, mails = [];
const folder = { getId: () => 'F1', createFile: b => { const id = 'f' + crypto.randomBytes(6).toString('hex'); files[id] = { b, desc: '' }; return { getId: () => id, setDescription: d => { files[id].desc = d; } }; } };
const T = { 'TOKCEO-00000000000000000000': ['ceo@forka.com', 'ceo'], 'TOKRUBY-0000000000000000000': ['admin@forka.com', 'staff'], 'TOKTAH-00000000000000000000': ['tahani.alamer@forka.com', 'manager'], 'TOKDES-00000000000000000000': ['design@forka.com', 'staff'] };
const ctx = { SpreadsheetApp: { getActive: () => ss, openById: () => acc },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  CacheService: { getScriptCache: () => ({ put: (k, v) => cache[k] = v, get: k => cache[k] ?? null, remove: k => delete cache[k] }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, t }), MimeType: { JSON: 1 } },
  UrlFetchApp: { fetch: (u, o) => { const b = o && o.payload ? JSON.parse(o.payload) : {}; const m = T[b.token]; return { getContentText: () => JSON.stringify(m ? { ok: true, me: { email: m[0], level: m[1], status: 'active' } } : { ok: false, error: 'session' }) }; } },
  DriveApp: { createFolder: () => folder, getFolderById: () => folder, getFileById: id => { const f = files[id]; let n = 0; return { getDescription: () => f.desc, getBlob: () => ({ getContentType: () => f.b.type, getBytes: () => f.b.bytes }), getParents: () => ({ hasNext: () => n++ === 0, next: () => ({ getId: () => 'F1' }) }) }; } },
  MailApp: { sendEmail: m => mails.push(m), getRemainingDailyQuota: () => 1500 },
  Utilities: { base64Decode: s => [...Buffer.from(s, 'base64')], base64Encode: b => Buffer.from(b).toString('base64'), newBlob: (bytes, type, name) => ({ bytes, type, name }) }, console, Date, JSON, Math };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../server/Boards.gs'), 'utf8') + ';this.setup=setup;this.doPost=doPost;', ctx);
ctx.setup();
http.createServer((req, res) => {
  const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.url === '/mails') { res.writeHead(200, h); return res.end(JSON.stringify(mails)); }
  if (req.method !== 'POST') { res.writeHead(200, h); return res.end('{"ok":true}'); }
  let body = ''; req.on('data', c => body += c); req.on('end', () => { res.writeHead(200, h); res.end(ctx.doPost({ postData: { contents: body } }).t); });
}).listen(+process.argv[2] || 8791, '127.0.0.1');
