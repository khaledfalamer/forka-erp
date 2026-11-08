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
const props = {}, cache = {}, files = {}, mails = [], triggers = []; let mailQuota = 1500;
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
  LockService: { getScriptLock: () => ({ waitLock() {}, tryLock() { return true; }, releaseLock() {} }) },
  ScriptApp: { getProjectTriggers: () => triggers, newTrigger: fn => ({ timeBased: () => ({ everyMinutes: m => ({ create: () => triggers.push({ fn, m, getHandlerFunction: () => fn }) }) }) }) },
  ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, t }), MimeType: { JSON: 1 } },
  UrlFetchApp: { fetch: (u, o) => { accountsCalls++; const b = o && o.payload ? JSON.parse(o.payload) : {}; const me = SESS[b.token];
    return { getContentText: () => JSON.stringify(me && b.action === 'who' ? { ok: true, me } : { ok: false, error: 'session' }) }; } },
  DriveApp: { createFolder: () => folder, getFolderById: () => folder,
    getFileById: id => { const f = files[id]; if (!f) throw new Error('no'); let done = false;
      return { getName: () => f.blob.name, getBlob: () => ({ getContentType: () => f.blob.type, getBytes: () => f.blob.bytes }), getParents: () => ({ hasNext: () => !done, next: () => { done = true; return { getId: () => f.parent }; } }) }; } },
  MailApp: { sendEmail: m => mails.push(m), getRemainingDailyQuota: () => mailQuota },
  Utilities: { base64Decode: s => [...Buffer.from(s, 'base64')], base64Encode: b => Buffer.from(b).toString('base64'), formatDate: () => '20261107-0900',
    newBlob: (bytes, type, name) => ({ bytes, type, name }), getUuid: () => crypto.randomUUID() },
  console, Date, JSON, Math
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../server/Hiring.gs'), 'utf8') + ';this.setup=setup;this.doPost=doPost;this.doGet=doGet;this.hrDigest=hrDigest;', ctx);
const call = o => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }).t);
const get = p => JSON.parse(ctx.doGet({ parameter: p }).t);
const res = []; const ck = (n, ok, i) => { res.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' - ' + JSON.stringify(i))); };
const CEO = 'TOKCEO-0000000000000000000', JEN = 'TOKJEN-0000000000000000000', CHEF = 'TOKCHEF-000000000000000000', HAM = 'TOKHAM-0000000000000000000';

ctx.setup(); ctx.setup();
ck('Setup creates the five tabs', ['Hiring requests', 'Posted jobs', 'Candidates', 'Applications', 'Settings'].every(n => sheets[n] && sheets[n].d.length === 1));
ck('Setup adds the 15-minute HR email round once (running it again adds no second one)', triggers.length === 1 && triggers[0].fn === 'hrDigest' && triggers[0].m === 15, triggers);
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
call({ action: 'put', token: CEO, col: 'reqs', id: 'r1', data: { title: 'Line Cook', status: 'open', ad: 'Cook with us', adAr: 'اطبخ معنا', titleAr: 'طباخ', knockout: ['2 years in a kitchen?'], knockoutAr: ['سنتان في مطبخ؟'] } });
ck('A change gives everyone the new data', (x => !x.same && x.data.reqs.r1.status === 'open')(call({ action: 'load', token: JEN, ver: ver1 })));
ck('Sheet row shows title and status in plain columns', sheets['Hiring requests'].d[1][1] === 'Line Cook' && sheets['Hiring requests'].d[1][2] === 'open');
call({ action: 'put', token: JEN, col: 'jobs', id: 'r1', data: { title: 'Line Cook', dept: 'Kitchen', branch: 'Sharjah', knockout: ['2 years in a kitchen?'], open: true, postedAt: 1 } });
call({ action: 'put', token: JEN, col: 'jobs', id: 'r2', data: { title: 'Old job', open: false } });
r = get({ jobs: '1' });
ck('Careers page sees only open jobs, with English and Arabic ads', r.ok && r.jobs.length === 1 && r.jobs[0].adAr === 'اطبخ معنا' && r.jobs[0].titleAr === 'طباخ' && r.jobs[0].knockoutAr[0] === 'سنتان في مطبخ؟', r);
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

/* ---------- interview scorecards: blind, each person's own ---------- */
call({ action: 'put', token: CEO, col: 'reqs', id: 'rk2', data: { title: 'Grill Cook', dept: 'Kitchen', status: 'open', testQs: ['Grill'] } });
call({ action: 'put', token: JEN, col: 'pipe', id: 'iv1', data: { req: 'rk2', name: 'Omar Cook', email: 'omar@mail.com', jobTitle: 'Grill Cook', stage: 'interview', lang: 'ar' } });
call({ action: 'put', token: CHEF, col: 'pipe', id: 'iv1', data: { req: 'rk2', name: 'Omar Cook', email: 'omar@mail.com', jobTitle: 'Grill Cook', stage: 'interview', lang: 'ar', iv: { 'chef@kuwaitikitchen.com': { tech: [4], comp: [4, 4], rec: 'Hire', n: { 'tech.0': 'clean grill work' } } } } });
{ const h = call({ action: 'load', token: JEN }).data.pipe.iv1;
  ck('HR cannot see the head\'s scores before submitting their own', h.iv['chef@kuwaitikitchen.com'].hidden && !h.iv['chef@kuwaitikitchen.com'].tech && !JSON.stringify(h).includes('clean grill'), h.iv);
  const c = call({ action: 'load', token: CEO }).data.pipe.iv1;
  ck('CEO (not on this panel) sees every scorecard', c.iv['chef@kuwaitikitchen.com'].tech[0] === 4, c.iv);
  // HR saves the record it received (with the hidden stub) plus its own card
  h.iv['jennifer@forka.com'] = { tech: [], comp: [2, 3], hr: [3], rec: 'No hire', n: { 'comp.0': 'vague answers' } };
  call({ action: 'put', token: JEN, col: 'pipe', id: 'iv1', data: h });
  const s1 = call({ action: 'load', token: CEO }).data.pipe.iv1.iv;
  ck('Saving with a hidden card does not wipe the other interviewer\'s scores', s1['chef@kuwaitikitchen.com'].tech[0] === 4 && s1['jennifer@forka.com'].comp[0] === 2 && s1['jennifer@forka.com'].who === 'hr' && s1['chef@kuwaitikitchen.com'].who === 'head', s1);
  const h2 = JSON.parse(JSON.stringify(h)); h2.iv['chef@kuwaitikitchen.com'] = { tech: [1], comp: [1, 1], done: true };
  call({ action: 'put', token: JEN, col: 'pipe', id: 'iv1', data: h2 });
  ck('Nobody can change another interviewer\'s scorecard', call({ action: 'load', token: CEO }).data.pipe.iv1.iv['chef@kuwaitikitchen.com'].tech[0] === 4); }
{ const c = call({ action: 'load', token: CHEF }).data.pipe.iv1; c.iv['chef@kuwaitikitchen.com'].done = true;
  call({ action: 'put', token: CHEF, col: 'pipe', id: 'iv1', data: c });
  const after = call({ action: 'load', token: CHEF }).data.pipe.iv1;
  ck('After submitting, the head sees HR\'s scores and notes', after.iv['jennifer@forka.com'].comp[0] === 2 && after.iv['jennifer@forka.com'].n['comp.0'] === 'vague answers', after.iv);
  after.iv['chef@kuwaitikitchen.com'].tech = [1];
  call({ action: 'put', token: CHEF, col: 'pipe', id: 'iv1', data: after });
  ck('A submitted scorecard is locked', call({ action: 'load', token: CEO }).data.pipe.iv1.iv['chef@kuwaitikitchen.com'].tech[0] === 4); }

/* ---------- booking links ---------- */
const DAY = 864e5, T0 = Date.now(), s1 = T0 + 2 * DAY, s2 = T0 + 3 * DAY, s3 = T0 + 4 * DAY;
mails.length = 0;
ck('A head cannot book an HR call', call({ action: 'invite', token: CHEF, id: 'iv1', kind: 'call', slots: [s1] }).error === 'role');
ck('No times = refused', call({ action: 'invite', token: JEN, id: 'iv1', kind: 'interview', slots: [T0 - DAY] }).error === 'slots');
let inv = call({ action: 'invite', token: CHEF, id: 'iv1', kind: 'interview', slots: [s1, s2, s3], mins: 45, mode: 'In person', place: 'Sharjah branch' });
ck('Head sends an interview booking link', inv.ok && /^https:\/\/apply\.forka\.com\/#book=[\w-]{20,}$/.test(inv.link) && inv.mailed, inv);
ck('Candidate gets the link by email, in Arabic when they applied in Arabic', mails.length === 1 && mails[0].to === 'omar@mail.com' && mails[0].body.includes(inv.link) && /مقابلة/.test(mails[0].body), mails[0]);
const tok = inv.link.split('#book=')[1];
let si = call({ action: 'slot', token: tok });
ck('Booking page shows the times, job and place, nothing private', si.ok && si.slots.length === 3 && si.slots.every(x => x.free) && si.place === 'Sharjah branch' && si.name === 'Omar' && !JSON.stringify(si).match(/chef@|jennifer|iv|tech/), si);
ck('A made-up link shows nothing', call({ action: 'slot', token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }).error === 'missing');
ck('A time that was not offered is refused', call({ action: 'book', token: tok, t: s1 + 60000 }).error === 'slot');
mails.length = 0;
let bk = call({ action: 'book', token: tok, t: s2 });
ck('Candidate picks a time', bk.ok && bk.pick === s2, bk);
ck('Candidate and interviewer both get a confirmation with a calendar file', mails.length === 2 && mails.every(m => m.attachments && /BEGIN:VEVENT/.test(m.attachments[0].bytes || m.attachments[0].data || '')) && mails[1].to.includes('chef@kuwaitikitchen.com') && mails[1].to.includes('hr@forka.com') && /calendar\.google\.com/.test(mails[1].body), mails.map(m => [m.to, m.subject]));
{ const p = call({ action: 'load', token: CEO }).data.pipe.iv1;
  ck('The pick shows in Hiring with a history line', p.books.interview.pick === s2 && /Interview booked for/.test(p.history.slice(-1)[0].m), p.books);
  p.books.interview.pick = s3; call({ action: 'put', token: CEO, col: 'pipe', id: 'iv1', data: p });
  ck('A normal save cannot change a booking', call({ action: 'load', token: CEO }).data.pipe.iv1.books.interview.pick === s2); }
call({ action: 'put', token: JEN, col: 'pipe', id: 'iv2', data: { req: 'rk2', name: 'Second Cook', email: 'two@mail.com', jobTitle: 'Grill Cook', stage: 'interview' } });
const inv2 = call({ action: 'invite', token: CHEF, id: 'iv2', kind: 'interview', slots: [s1, s2] }), tok2 = inv2.link.split('#book=')[1];
ck('A time another candidate already booked with the same interviewer shows as taken', (x => x.slots.find(y => y.t === s2).free === false && x.slots.find(y => y.t === s1).free)(call({ action: 'slot', token: tok2 })));
ck('...and cannot be booked twice', call({ action: 'book', token: tok2, t: s2 }).error === 'taken');
ck('Candidate can move to another free time', call({ action: 'book', token: tok, t: s3 }).ok && call({ action: 'book', token: tok2, t: s2 }).ok);
{ const p = call({ action: 'load', token: CEO }).data.pipe.iv1; p.stage = 'rejected'; call({ action: 'put', token: CEO, col: 'pipe', id: 'iv1', data: p });
  ck('Once rejected, the booking link closes', call({ action: 'slot', token: tok }).error === 'closed' && call({ action: 'book', token: tok, t: s1 }).error === 'closed'); }
const n0 = accountsCalls; call({ action: 'load', token: JEN }); call({ action: 'load', token: JEN });
ck('Forka Apps asked at most once per 5 minutes per sign-in', accountsCalls === n0);
/* ---------------- a big job ad: hundreds of applications ---------------- */
call({ action: 'put', token: JEN, col: 'jobs', id: 'rbig', data: { title: 'Waiter', open: true, branch: 'Sharjah' } });
Object.keys(cache).forEach(k => { if (k.startsWith('hrmail:')) delete cache[k]; });
mails.length = 0; cache['apply:count'] = '400';                         // the old limit was 300 an hour
const rows0 = sheets.Applications.d.length;
let okN = 0; for (let i = 0; i < 250; i++) if (call({ action: 'apply', job: 'rbig', name: 'Applicant ' + i, email: 'a' + i + '@mail.com', phone: '+97150000' + String(i).padStart(4, '0'), consent: true }).ok) okN++;
ck('250 applications in a row are all saved (past the old 300-an-hour limit)', okN === 250 && sheets.Applications.d.length === rows0 + 250, okN);
ck('HR gets one email for the first, not 250 emails', mails.length === 1 && /Applicant 0/.test(mails[0].subject), mails.length);
delete cache['hrmail:sent']; ctx.hrDigest();
ck('15 minutes later one summary email lists the rest', mails.length === 2 && /249 new applications/.test(mails[1].subject) && mails[1].body.includes('Applicant 249') && mails[1].body.includes('more'), mails[1] && mails[1].subject);
ctx.hrDigest(); ck('Nothing new = no extra email', mails.length === 2);
mailQuota = 40; delete cache['hrmail:sent'];
call({ action: 'apply', job: 'rbig', name: 'Late Applicant', email: 'late@mail.com', phone: '+971500009999', consent: true });
ck('When few emails are left today, HR emails wait so candidates still get theirs', mails.length === 2);
mailQuota = 1500; ctx.hrDigest(); ck('...and are sent once emails are available', mails.length === 3 && /Late Applicant/.test(mails[2].subject));
cache['apply:count'] = '3001';
ck('Far more than people can send in an hour is refused (robots)', call({ action: 'apply', job: 'rbig', name: 'Bot', email: 'bot@mail.com', phone: '+971500001111', consent: true }).error === 'busy');
delete cache['apply:count'];

{ const n = get({ jobs: 1 }).jobs.length;
  ck('The careers job list is kept for a minute (thousands of visitors do not each read the Sheet)', !!cache.pubjobs && get({ jobs: 1 }).jobs.length === n);
  call({ action: 'put', token: JEN, col: 'jobs', id: 'rnew', data: { title: 'Barista', open: true } });
  ck('...and a new or changed job shows on the careers page at once', get({ jobs: 1 }).jobs.some(j => j.id === 'rnew')); }

/* ---------------- a refresh downloads only what changed ---------------- */
{ const full = call({ action: 'load', token: JEN }), nApps = Object.keys(full.data.apps).length;
  ck('A full load gives the time and the viewer key for later refreshes', full.now > 0 && full.vk && !full.delta && nApps > 250, nApps);
  const t0 = Date.now(); while (Date.now() <= full.now + 1) {}
  call({ action: 'put', token: JEN, col: 'pipe', id: 'dz1', data: { req: 'rbig', name: 'Delta Person', stage: 'applied' } });
  const d = call({ action: 'load', token: JEN, ver: full.ver, since: full.now, vk: full.vk });
  ck('After one change the refresh sends just that record, not every application', d.delta && Object.keys(d.data.pipe).join() === 'dz1' && !Object.keys(d.data.apps).length && d.ids.apps.length === nApps, d.delta && Object.keys(d.data.apps).length);
  call({ action: 'del', token: JEN, col: 'pipe', id: 'dz1' });
  const d2 = call({ action: 'load', token: JEN, ver: d.ver, since: d.now, vk: d.vk });
  ck('A deleted record drops out of the id list', d2.delta && !d2.ids.pipe.includes('dz1'));
  ck('Another person\'s viewer key never gets a partial refresh', !call({ action: 'load', token: CEO, ver: d2.ver + 'x', since: d2.now, vk: d2.vk }).delta);
  const h = call({ action: 'load', token: CHEF }); while (Date.now() <= h.now + 1) {}
  call({ action: 'put', token: JEN, col: 'reqs', id: 'rz', data: { title: 'New role', dept: 'Kitchen', status: 'open' } });
  ck('A department head gets everything again when hiring requests change', (x => !x.delta && x.data.reqs.rz)(call({ action: 'load', token: CHEF, ver: h.ver, since: h.now, vk: h.vk }))); }
console.log(`${res.filter(Boolean).length}/${res.length} hiring server checks passed`); process.exit(res.every(Boolean) ? 0 : 1);
