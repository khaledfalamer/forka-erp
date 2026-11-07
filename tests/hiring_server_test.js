// Runs Hiring.gs against simulated Google services. node tests/hiring_server_test.js
const fs = require('fs'), vm = require('vm'), crypto = require('crypto'), path = require('path');
class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() { const o = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push((this.sh.d[this.r - 1 + i] || [])[this.c - 1 + j] ?? ''); o.push(row); } return o; }
  getValue() { return this.getValues()[0][0]; }
  setValues(v) { v.forEach((row, i) => { const R = this.sh.d[this.r - 1 + i] = this.sh.d[this.r - 1 + i] || []; row.forEach((x, j) => R[this.c - 1 + j] = x); }); return this; }
  setFontWeight() { return this; }
  createTextFinder(txt) { const sh = this.sh; return { matchEntireCell() { return this; }, findNext() { const i = sh.d.findIndex(r => String(r[0]) === txt); return i < 0 ? null : { getRow: () => i + 1 }; } }; }
}
class Sheet {
  constructor(n) { this.n = n; this.d = []; }
  getName() { return this.n; } getLastRow() { return this.d.length; }
  getRange(r, c, nr, nc) { if (typeof r === 'string') return new Range(this, 1, 1, this.d.length, 1); return new Range(this, r, c, nr || 1, nc || 1); }
  appendRow(r) { this.d.push(r.slice()); } setFrozenRows() {} deleteRow(n) { this.d.splice(n - 1, 1); }
}
const sheets = {}; const ss = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = new Sheet(n)) };
const props = {}, cache = {}, files = {}, mails = [];
const folder = { getId: () => 'FOLDER1', createFile: blob => { const id = 'file' + crypto.randomBytes(8).toString('hex'); files[id] = { blob, parent: 'FOLDER1' }; return { getId: () => id }; } };
// fake Forka Apps accounts server
const SESS = { 'TOKCEO-0000000000000000000': { email: 'ceo@forka.com', name: 'Khaled', level: 'ceo', apps: { hire: 1 } },
  'TOKJEN-0000000000000000000': { email: 'jennifer@forka.com', name: 'Jennifer', level: 'manager', apps: { hire: 1 } },
  'TOKCHEF-000000000000000000': { email: 'chef@kuwaitikitchen.com', name: 'Head Chef', level: 'manager', apps: { hire: 1 } },
  'TOKHAM-0000000000000000000': { email: 'store@kuwaitikitchen.com', name: 'Hamim', level: 'staff', apps: { hire: 0 } } };
let accountsCalls = 0;
const ctx = {
  SpreadsheetApp: { getActive: () => ss, openById: () => ss },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  CacheService: { getScriptCache: () => ({ put: (k, v) => cache[k] = v, get: k => cache[k] ?? null, remove: k => delete cache[k] }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, t }), MimeType: { JSON: 1 } },
  UrlFetchApp: { fetch: (u, o) => { accountsCalls++; const b = o && o.payload ? JSON.parse(o.payload) : {}; const me = SESS[b.token];
    return { getContentText: () => JSON.stringify(me && b.action === 'who' ? { ok: true, me } : { ok: false, error: 'session' }) }; } },
  DriveApp: { createFolder: () => folder, getFolderById: () => folder,
    getFileById: id => { const f = files[id]; if (!f) throw new Error('no'); let done = false;
      return { getName: () => f.blob.name, getBlob: () => ({ getContentType: () => f.blob.type, getBytes: () => f.blob.bytes }), getParents: () => ({ hasNext: () => !done, next: () => { done = true; return { getId: () => f.parent }; } }) }; } },
  MailApp: { sendEmail: m => mails.push(m) },
  Utilities: { base64Decode: s => [...Buffer.from(s, 'base64')], base64Encode: b => Buffer.from(b).toString('base64'), formatDate: () => '20261107-0900',
    newBlob: (bytes, type, name) => ({ bytes, type, name }) },
  console, Date, JSON, Math
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../server/Hiring.gs'), 'utf8') + ';this.setup=setup;this.doPost=doPost;this.doGet=doGet;', ctx);
const call = o => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }).t);
const get = p => JSON.parse(ctx.doGet({ parameter: p }).t);
const res = []; const ck = (n, ok, i) => { res.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' - ' + JSON.stringify(i))); };
const CEO = 'TOKCEO-0000000000000000000', JEN = 'TOKJEN-0000000000000000000', CHEF = 'TOKCHEF-000000000000000000', HAM = 'TOKHAM-0000000000000000000';

ctx.setup();
ck('Setup creates the five tabs', ['Hiring requests', 'Posted jobs', 'Candidates', 'Applications', 'Settings'].every(n => sheets[n] && sheets[n].d.length === 1));
let r = call({ action: 'load', token: CEO });
ck('CEO opens Hiring as HR + CEO', r.ok && r.me.role === 'hr' && r.me.ceo === true && r.data && r.data.reqs, r);
ck('Someone not signed in at Forka Apps is refused', call({ action: 'load', token: 'nope-00000000000000000000' }).error === 'session');
ck('Hiring not ticked in Forka Apps = no access', call({ action: 'load', token: HAM }).error === 'noaccess');
ck('Ticked but not on the hiring team = no access', call({ action: 'load', token: JEN }).error === 'noaccess');
r = call({ action: 'put', token: CEO, col: 'config', id: 'team', data: { members: { 'jennifer@forka.com': { name: 'Jennifer', role: 'hr' }, 'chef@kuwaitikitchen.com': { name: 'Head Chef', role: 'head', dept: 'Kitchen' } } } });
ck('CEO adds HR and a department head', r.ok);
ck('HR now opens Hiring as HR', call({ action: 'load', token: JEN }).me.role === 'hr');
ck('Head opens Hiring as Kitchen head', (x => x.me.role === 'head' && x.me.dept === 'Kitchen')(call({ action: 'load', token: CHEF })));
ck('Only the CEO changes the hiring team', call({ action: 'put', token: JEN, col: 'config', id: 'team', data: { members: {} } }).error === 'role');
ck('A head cannot post jobs', call({ action: 'put', token: CHEF, col: 'jobs', id: 'r1', data: { open: true } }).error === 'role');
ck('A head can raise a hiring request', call({ action: 'put', token: CHEF, col: 'reqs', id: 'r1', data: { title: 'Line Cook', dept: 'Kitchen', status: 'requested' } }).ok);
const ver1 = call({ action: 'load', token: JEN }).ver;
ck('Refresh with the same stamp downloads nothing', (x => x.same && !x.data)(call({ action: 'load', token: JEN, ver: ver1 })));
call({ action: 'put', token: CEO, col: 'reqs', id: 'r1', data: { title: 'Line Cook', status: 'open', ad: 'Cook with us', adAr: 'اطبخ معنا', knockout: ['2 years in a kitchen?'] } });
ck('A change gives everyone the new data', (x => !x.same && x.data.reqs.r1.status === 'open')(call({ action: 'load', token: JEN, ver: ver1 })));
ck('Sheet row shows title and status in plain columns', sheets['Hiring requests'].d[1][1] === 'Line Cook' && sheets['Hiring requests'].d[1][2] === 'open');
call({ action: 'put', token: JEN, col: 'jobs', id: 'r1', data: { title: 'Line Cook', dept: 'Kitchen', branch: 'Sharjah', knockout: ['2 years in a kitchen?'], open: true, postedAt: 1 } });
call({ action: 'put', token: JEN, col: 'jobs', id: 'r2', data: { title: 'Old job', open: false } });
r = get({ jobs: '1' });
ck('Careers page sees only open jobs, with English and Arabic ads', r.ok && r.jobs.length === 1 && r.jobs[0].adAr === 'اطبخ معنا', r);
ck('Careers page sees no candidates, scores or team', !JSON.stringify(r).match(/members|pipe|jennifer/));
const pdf = Buffer.from('%PDF-1.4 test').toString('base64');
r = call({ action: 'apply', job: 'r1', name: '', email: 'x', phone: '1', consent: false });
ck('Missing name, bad email, bad phone and no consent are all refused', r.error === 'need' && ['name', 'email', 'phone', 'consent'].every(f => r.fields.includes(f)), r);
ck('Closed job refuses applications', call({ action: 'apply', job: 'r2', name: 'A', email: 'a@b.co', phone: '0501234567', consent: true }).error === 'closed');
ck('Word-macro or other file types refused', call({ action: 'apply', job: 'r1', name: 'A', email: 'a@b.co', phone: '0501234567', consent: true, cv: { name: 'x.exe', type: 'application/x-msdownload', data: pdf } }).error === 'cvtype');
props.HR_EMAILS = 'hr@forka.com';
r = call({ action: 'apply', job: 'r1', name: 'Sara Ali', email: 'Sara@Mail.com', phone: '+971 50 123 4567', consent: true, answers: ['No'], years: '3', cv: { name: 'sara.pdf', type: 'application/pdf', data: pdf } });
ck('Application with CV accepted, reference returned', r.ok && /^[A-Z0-9]{6}$/.test(r.ref), r);
ck('CV saved in the private CVs folder', Object.values(files).some(f => f.blob.type === 'application/pdf'));
ck('HR emailed about the new application', mails.length === 1 && /Sara Ali/.test(mails[0].subject));
ck('Same person, same job, same hour: refused politely', call({ action: 'apply', job: 'r1', name: 'Sara Ali', email: 'sara@mail.com', phone: '+971501234567', consent: true }).error === 'again');
ck('Robot that fills the hidden field gets "ok" but nothing is saved', call({ action: 'apply', job: 'r1', name: 'Bot', email: 'b@b.co', phone: '0501234567', consent: true, website: 'spam' }).ok && sheets.Applications.d.length === 2);
const load = call({ action: 'load', token: JEN }); const app = Object.values(load.data.apps)[0].list; const a = Object.values(app)[0];
ck('HR sees the application with knockout answer flagged', a.name === 'Sara Ali' && a.email === 'sara@mail.com' && a.knockout[0] === '2 years in a kitchen?' && a.cvFile.drive, a);
r = call({ action: 'cv', token: JEN, id: a.cvFile.id });
ck('HR opens the CV through the server', r.ok && Buffer.from(r.data, 'base64').toString().startsWith('%PDF'));
ck('No CV without a sign-in', call({ action: 'cv', id: a.cvFile.id }).error === 'session');
files.outside = { blob: { name: 'private.pdf', type: 'application/pdf', bytes: [1] }, parent: 'OTHER' };
ck('Files outside the CVs folder can never be opened', call({ action: 'cv', token: CEO, id: 'outside' }).error === 'bad' || call({ action: 'cv', token: CEO, id: 'outside' }).error === 'missing');
r = call({ action: 'upload', token: JEN, file: { name: 'walkin.pdf', type: 'application/pdf', data: pdf } });
ck('HR uploads a walk-in CV', r.ok && r.file.drive && r.file.name === 'walkin.pdf');
ck('Records too big for a Sheet cell are refused, not cut', call({ action: 'put', token: JEN, col: 'pipe', id: 'big', data: { cvText: 'x'.repeat(60000) } }).error === 'big');
ck('Bad record ids refused', call({ action: 'put', token: JEN, col: 'pipe', id: '../x y', data: {} }).error === 'bad');
ck('HR deletes a record', call({ action: 'del', token: JEN, col: 'reqs', id: 'r1' }).ok && !call({ action: 'load', token: JEN }).data.reqs.r1);
// ---- department heads: only their own department leaves the server ----
call({ action: 'put', token: CEO, col: 'reqs', id: 'rk', data: { title: 'Grill Cook', dept: 'Kitchen', status: 'open' } });
call({ action: 'put', token: CEO, col: 'reqs', id: 'rs', data: { title: 'Waiter', dept: 'Service', status: 'open' } });
call({ action: 'put', token: CEO, col: 'jobs', id: 'rs', data: { title: 'Waiter', open: true } });
call({ action: 'put', token: CEO, col: 'pipe', id: 'ck', data: { req: 'rk', name: 'Kitchen Cand', salary: 3000, phone: '0501', cvFile: { id: 'fileKITCHEN00001', drive: true } } });
call({ action: 'put', token: CEO, col: 'pipe', id: 'cs', data: { req: 'rs', name: 'Service Cand', salary: 4500, phone: '0502', cvFile: { id: 'fileSERVICE00001', drive: true } } });
files.fileKITCHEN00001 = { blob: { name: 'k.pdf', type: 'application/pdf', bytes: [37] }, parent: 'FOLDER1' };
files.fileSERVICE00001 = { blob: { name: 's.pdf', type: 'application/pdf', bytes: [37] }, parent: 'FOLDER1' };
call({ action: 'apply', job: 'rs', name: 'Waiter Applicant', email: 'w@a.co', phone: '0501234567', consent: true });
{ const h = call({ action: 'load', token: CHEF }), txt = JSON.stringify(h.data);
  ck('Head receives only Kitchen requests and candidates', h.data.reqs.rk && !h.data.reqs.rs && h.data.pipe.ck && !h.data.pipe.cs, Object.keys(h.data.pipe));
  ck('Other departments\' names, phones and salaries never reach the head', !/Service Cand|Waiter Applicant|4500|0502/.test(txt));
  ck('Head does not receive the careers settings beyond names', !h.data.config.team.members['jennifer@forka.com'].email && h.data.config.team.members['jennifer@forka.com'].name === 'Jennifer');
  const hr = call({ action: 'load', token: JEN }); ck('HR still receives every department', hr.data.pipe.cs && hr.data.pipe.ck); }
ck('Head moves a Kitchen candidate', call({ action: 'put', token: CHEF, col: 'pipe', id: 'ck', data: { req: 'rk', name: 'Kitchen Cand', stage: 'interview', cvFile: { id: 'fileKITCHEN00001', drive: true } } }).ok);
ck('Head cannot change a Service candidate', call({ action: 'put', token: CHEF, col: 'pipe', id: 'cs', data: { req: 'rs', name: 'x', stage: 'rejected' } }).error === 'role');
ck('Head cannot move a Service candidate into Kitchen', call({ action: 'put', token: CHEF, col: 'pipe', id: 'cs', data: { req: 'rk', name: 'x' } }).error === 'role');
ck('Head cannot delete anything', call({ action: 'del', token: CHEF, col: 'pipe', id: 'ck' }).error === 'role');
ck('Head cannot raise a request for another department', call({ action: 'put', token: CHEF, col: 'reqs', id: 'rx', data: { title: 'Cashier', dept: 'Service' } }).error === 'role');
ck('Head cannot change a Service request', call({ action: 'put', token: CHEF, col: 'reqs', id: 'rs', data: { title: 'Waiter', dept: 'Kitchen' } }).error === 'role');
ck('Head opens a Kitchen CV', call({ action: 'cv', token: CHEF, id: 'fileKITCHEN00001' }).ok);
ck('Head cannot open a Service CV', !call({ action: 'cv', token: CHEF, id: 'fileSERVICE00001' }).ok);
{ const appId = Object.keys(call({ action: 'load', token: JEN }).data.apps).find(k => JSON.stringify(call({ action: 'load', token: JEN }).data.apps[k]).includes('Waiter Applicant'));
  const doc = call({ action: 'load', token: JEN }).data.apps[appId]; const aid = Object.keys(doc.list)[0];
  const d2 = JSON.parse(JSON.stringify(doc)); d2.list[aid].status = 'interview';
  ck('Head cannot touch a Service application', call({ action: 'put', token: CHEF, col: 'apps', id: appId, data: d2 }).error === 'role');
  call({ action: 'put', token: CEO, col: 'jobs', id: 'rk', data: { title: 'Grill Cook', open: true } });
  call({ action: 'apply', job: 'rk', name: 'Grill Applicant', email: 'g@a.co', phone: '0501234567', consent: true });
  const all = call({ action: 'load', token: JEN }).data.apps, kid = Object.keys(all).find(k => JSON.stringify(all[k]).includes('Grill Applicant'));
  const k2 = JSON.parse(JSON.stringify(all[kid])), ka = Object.keys(k2.list)[0];
  k2.list[ka].status = 'shortlist';
  ck('Head updates the stage shown to a Kitchen applicant', call({ action: 'put', token: CHEF, col: 'apps', id: kid, data: k2 }).ok);
  k2.list[ka].salary = 1; ck('...but cannot change anything else in it', call({ action: 'put', token: CHEF, col: 'apps', id: kid, data: k2 }).error === 'role'); }
const n0 = accountsCalls; call({ action: 'load', token: JEN }); call({ action: 'load', token: JEN });
ck('Forka Apps asked at most once per 5 minutes per sign-in', accountsCalls === n0);
console.log(`${res.filter(Boolean).length}/${res.length} hiring server checks passed`); process.exit(res.every(Boolean) ? 0 : 1);
