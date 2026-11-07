/**
 * Forka Hiring - server (erp.forka.com/hiring and apply.forka.com)
 * Data lives in this Google Sheet (one tab per kind of record) and CVs in a private Drive folder.
 * The team signs in at erp.forka.com; this script asks the Forka Apps accounts server who they are.
 * Job applicants need no account: apply.forka.com can only read open jobs and send an application.
 *
 * INSTALL (10 minutes):
 *  1. Create a new Google Sheet named "Forka Hiring". Extensions -> Apps Script -> paste this file -> Save.
 *  2. Run  setup  once and approve the permissions (Sheets, Drive, send email, connect to Forka Apps).
 *     It creates the tabs and a private Drive folder "Forka Hiring - CVs".
 *  3. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone -> copy the /exec URL.
 *     Send that URL to Claude: it goes into config.js as HIRING_URL.
 *  Optional Script properties: HR_EMAILS (comma separated) = who gets an email for each new application.
 */
const ACCOUNTS_URL = 'https://script.google.com/macros/s/AKfycbwUO5mC1oZrKiSJfF-kpeIFUPjfzB5VToNVn9EH-ecmDadFs9xsU1oDFHTgJ2FSg6vP/exec';
// Each kind of record has its own tab. "apps" = applications sent from apply.forka.com.
const COLS = { reqs: 'Hiring requests', jobs: 'Posted jobs', pipe: 'Candidates', apps: 'Applications', config: 'Settings' };
const HEAD = ['Id', 'Title / name', 'Status', 'Updated', 'Updated by', 'data (do not edit)'];
const MAX_CELL = 48000;                  // a Google Sheet cell holds 50,000 characters
const CV_TYPES = /^(application\/pdf|image\/(jpeg|png|webp)|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/;
const CV_MAX = 5 * 1024 * 1024;

function props_() { return PropertiesService.getScriptProperties(); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function ss_() { const id = props_().getProperty('SHEET_ID'); return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive(); }
function key_(e) { return String(e || '').trim().toLowerCase(); }
function stamp_() { return props_().getProperty('HVER') || '0'; }
function bump_() { props_().setProperty('HVER', Date.now().toString(36) + Math.random().toString(36).slice(2, 6)); }

function tab_(col) {
  const name = COLS[col];
  let sh = ss_().getSheetByName(name);
  if (!sh) sh = ss_().insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(HEAD); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold'); }
  return sh;
}
function folder_() {
  let id = props_().getProperty('CV_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Forka Hiring - CVs');   // private: only the Sheet owner can open it
  props_().setProperty('CV_FOLDER_ID', f.getId());
  return f;
}

function setup() {
  Object.keys(COLS).forEach(tab_);
  folder_();
  UrlFetchApp.fetch(ACCOUNTS_URL, { muteHttpExceptions: true });   // asks for the "connect to Forka Apps" permission now
  return 'Done. Now Deploy -> New deployment -> Web app (Execute as: Me, Who has access: Anyone).';
}

/* ---------------- records ---------------- */
function readAll_(col) {
  const sh = tab_(col), n = sh.getLastRow() - 1, o = {};
  if (n < 1) return o;
  sh.getRange(2, 1, n, HEAD.length).getValues().forEach(r => { if (!r[0]) return; try { o[r[0]] = JSON.parse(r[5] || '{}'); } catch (e) {} });
  return o;
}
function readOne_(col, id) {
  const sh = tab_(col), f = sh.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
  if (!f || f.getRow() < 2) return null;
  try { return JSON.parse(sh.getRange(f.getRow(), 6).getValue() || '{}'); } catch (e) { return null; }
}
function label_(col, d) {
  if (col === 'apps') { const l = Object.values(d.list || {})[0] || {}; return [l.name || '', l.jobTitle || '']; }
  return [d.title || d.name || d.jobTitle || '', d.status || d.stage || (d.open === false ? 'closed' : d.open ? 'open' : '')];
}
function write_(col, id, d, by) {
  const json = JSON.stringify(d);
  if (json.length > MAX_CELL) return { ok: false, error: 'big' };
  const sh = tab_(col), f = sh.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
  const lb = label_(col, d), row = [String(id), lb[0], lb[1], new Date(), by || '', json];
  if (f && f.getRow() > 1) sh.getRange(f.getRow(), 1, 1, HEAD.length).setValues([row]); else sh.appendRow(row);
  return { ok: true };
}
function remove_(col, id) {
  const sh = tab_(col), f = sh.getRange('A:A').createTextFinder(String(id)).matchEntireCell(true).findNext();
  if (f && f.getRow() > 1) sh.deleteRow(f.getRow());
}

/* ---------------- who is this ---------------- */
// Asks Forka Apps once every 5 minutes per sign-in.
function erpWho_(tok) {
  tok = String(tok || '');
  if (!/^[A-Za-z0-9-]{20,120}$/.test(tok)) return null;
  const c = CacheService.getScriptCache(), k = 'erp:' + tok, hit = c.get(k);
  if (hit) return JSON.parse(hit);
  const ask = action => { const r = UrlFetchApp.fetch(ACCOUNTS_URL, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: action, token: tok }), muteHttpExceptions: true, followRedirects: true });
    try { return JSON.parse(r.getContentText()); } catch (e) { return { ok: false, error: 'bad' }; } };
  let j = ask('who');                                                     // light answer; older accounts servers only know "me"
  if (!j.ok && (j.error === 'action' || j.error === 'role' || j.error === 'bad')) j = ask('me');
  if (!j.ok || !j.me) return null;
  const me = { email: key_(j.me.email), name: j.me.name || '', ceo: j.me.level === 'ceo', hire: !!(j.me.apps && j.me.apps.hire) };
  c.put(k, JSON.stringify(me), 300);
  return me;
}
// Hiring role: the CEO is HR + CEO. Others need Hiring ticked in Forka Apps AND a place on the hiring team (Settings > team).
function role_(me) {
  if (!me) return null;
  if (me.ceo) return { role: 'hr', ceo: true, dept: null };
  if (!me.hire) return null;
  const team = (readOne_('config', 'team') || {}).members || {};
  const m = team[me.email];
  return m && (m.role === 'hr' || m.role === 'head') ? { role: m.role, ceo: false, dept: m.dept || null } : null;
}

/* ---------------- public: apply.forka.com ---------------- */
function publicJobs_() {
  const jobs = readAll_('jobs'), out = [];
  Object.keys(jobs).forEach(id => {
    const j = jobs[id]; if (!j.open) return;
    const r = readOne_('reqs', id) || {};
    out.push({ id: id, title: j.title || '', dept: j.dept || '', branch: j.branch || '', summary: j.summary || '', jd: j.jd || '',
      ad: r.ad || '', adAr: r.adAr || '', knockout: j.knockout || [], postedAt: j.postedAt || null });
  });
  out.sort((a, b) => (b.postedAt || 0) - (a.postedAt || 0));
  const brand = (readOne_('config', 'brand')) || null;
  return { ok: true, jobs: out, brand: brand };
}
function clean_(v, n) { return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n); }
function apply_(b) {
  if (b.website) return { ok: true };                                     // hidden field: only robots fill it in
  const job = readOne_('jobs', clean_(b.job, 60));
  if (!job || !job.open) return { ok: false, error: 'closed' };
  const name = clean_(b.name, 80), email = key_(clean_(b.email, 120)), phone = clean_(b.phone, 40);
  const bad = [];
  if (!name) bad.push('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push('email');
  if (!/^[+\d][\d\s-]{6,}$/.test(phone)) bad.push('phone');
  if (b.consent !== true) bad.push('consent');
  if (bad.length) return { ok: false, error: 'need', fields: bad };
  const c = CacheService.getScriptCache(), rk = 'apply:' + email + ':' + b.job;
  if (c.get(rk)) return { ok: false, error: 'again' };                    // same person, same job: once per hour
  const n = +(c.get('apply:count') || 0);
  if (n > 300) return { ok: false, error: 'busy' };                       // more than 300 an hour = something is wrong
  let cvFile = null;
  if (b.cv && b.cv.data) {
    const type = String(b.cv.type || '');
    if (!CV_TYPES.test(type)) return { ok: false, error: 'cvtype' };
    const bytes = Utilities.base64Decode(String(b.cv.data));
    if (bytes.length > CV_MAX) return { ok: false, error: 'cvbig' };
    const nm = Utilities.formatDate(new Date(), 'Asia/Dubai', 'yyyyMMdd-HHmm') + ' ' + name.replace(/[\\/:*?"<>|]/g, '') + ' - ' + clean_(b.cv.name, 80).replace(/[\\/:*?"<>|]/g, '');
    const f = folder_().createFile(Utilities.newBlob(bytes, type, nm));
    cvFile = { id: f.getId(), drive: true, name: clean_(b.cv.name, 120), size: bytes.length, type: type };
  }
  const ko = Array.isArray(job.knockout) ? job.knockout : [];
  const answers = ko.map((q, i) => [String(q), (b.answers || [])[i] === 'Yes' ? 'Yes' : 'No']);
  const aid = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const a = { req: clean_(b.job, 60), jobTitle: job.title || '', name: name, email: email, phone: phone, location: clean_(b.location, 80),
    years: Math.max(0, Math.min(60, +b.years || 0)), notice: b.notice === '' || b.notice == null ? null : Math.max(0, Math.min(365, +b.notice || 0)),
    salary: b.salary === '' || b.salary == null ? null : Math.max(0, +b.salary || 0), visa: clean_(b.visa, 60), cvText: clean_(b.cvText, 8000),
    answers: answers, knockout: answers.filter(x => x[1] === 'No').map(x => x[0]), consent: true, cvFile: cvFile,
    source: clean_(b.source, 40) || 'Careers page', lang: b.lang === 'ar' ? 'ar' : 'en', createdAt: Date.now(), status: 'applied' };
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try { write_('apps', aid, { web: true, list: { [aid]: a } }, 'apply.forka.com'); bump_(); } finally { lock.releaseLock(); }
  c.put(rk, '1', 3600); c.put('apply:count', String(n + 1), 3600);
  const to = String(props_().getProperty('HR_EMAILS') || '').split(/[,\s]+/).filter(Boolean);
  if (to.length) { try { MailApp.sendEmail({ to: to.join(','), subject: 'New application: ' + a.jobTitle + ' - ' + name, name: 'Forka Hiring',
    body: name + ' applied for ' + a.jobTitle + (job.branch ? ' (' + job.branch + ')' : '') + '.\n' + (a.knockout.length ? 'Did not meet: ' + a.knockout.join('; ') + '\n' : '') + '\nOpen Hiring: https://erp.forka.com/hiring/' }); } catch (e) {} }
  return { ok: true, ref: aid.slice(-6).toUpperCase() };
}

/* ---------------- web app ---------------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.jobs) return out_(publicJobs_());
  return out_({ ok: true, service: 'forka-hiring' });
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad' }); }
  try { return out_(handle_(b)); }
  catch (err) { return out_({ ok: false, error: 'server', detail: String(err).slice(0, 200) }); }
}

function handle_(b) {
  const a = String(b.action || '');
  if (a === 'jobs') return publicJobs_();
  if (a === 'apply') return apply_(b);

  /* team only */
  const me = erpWho_(b.token);
  if (!me) return { ok: false, error: 'session' };
  const r = role_(me);
  if (!r) return { ok: false, error: 'noaccess', me: { email: me.email, name: me.name } };
  const who = { email: me.email, name: me.name, role: r.role, ceo: r.ceo, dept: r.dept };

  if (a === 'load') {
    if (b.ver && b.ver === stamp_()) return { ok: true, same: true, ver: b.ver, me: who };
    const data = {};
    Object.keys(COLS).forEach(c => { data[c] = readAll_(c); });
    return { ok: true, ver: stamp_(), me: who, data: data };
  }
  if (a === 'put' || a === 'del') {
    const col = String(b.col || ''), id = String(b.id || '');
    if (!COLS[col] || !/^[A-Za-z0-9_\-.:@]{1,80}$/.test(id)) return { ok: false, error: 'bad' };
    if (col === 'config' && r.role !== 'hr') return { ok: false, error: 'role' };           // team list and careers words: HR / CEO
    if (col === 'jobs' && r.role !== 'hr') return { ok: false, error: 'role' };             // posting jobs: HR / CEO
    if (col === 'config' && id === 'team' && !r.ceo) return { ok: false, error: 'role' };   // who is on the team: CEO only
    const lock = LockService.getScriptLock(); lock.waitLock(15000);
    try {
      if (a === 'del') { remove_(col, id); bump_(); return { ok: true, ver: stamp_() }; }
      const w = write_(col, id, b.data || {}, me.email);
      if (!w.ok) return w;
      bump_(); return { ok: true, ver: stamp_() };
    } finally { lock.releaseLock(); }
  }
  if (a === 'upload') {
    const u = b.file || {}, type = String(u.type || '');
    if (!CV_TYPES.test(type) || !u.data) return { ok: false, error: 'cvtype' };
    const bytes = Utilities.base64Decode(String(u.data));
    if (bytes.length > CV_MAX) return { ok: false, error: 'cvbig' };
    const f = folder_().createFile(Utilities.newBlob(bytes, type, Utilities.formatDate(new Date(), 'Asia/Dubai', 'yyyyMMdd-HHmm') + ' ' + clean_(u.name, 100).replace(/[\\/:*?"<>|]/g, '')));
    return { ok: true, file: { id: f.getId(), drive: true, name: clean_(u.name, 120), size: bytes.length, type: type } };
  }
  if (a === 'cv') {                                       // CVs stay private in Drive; the team gets the file through here
    const id = String(b.id || '');
    if (!/^[A-Za-z0-9_-]{10,100}$/.test(id)) return { ok: false, error: 'bad' };
    let f; try { f = DriveApp.getFileById(id); } catch (e) { return { ok: false, error: 'missing' }; }
    const parents = f.getParents(); let inFolder = false;
    while (parents.hasNext()) { if (parents.next().getId() === folder_().getId()) inFolder = true; }
    if (!inFolder) return { ok: false, error: 'missing' };
    const blob = f.getBlob();
    return { ok: true, name: f.getName(), type: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
  }
  return { ok: false, error: 'action' };
}
