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
  const team = (readOne_('config', 'team') || {}).members || {};
  const m = team[me.email];
  if (me.hire && m && (m.role === 'hr' || m.role === 'head')) return { role: m.role, ceo: false, dept: m.dept || null };
  // anyone with a Forka Apps account who was invited onto an interview panel: sees only those candidates
  return panelIds_(me.email).length ? { role: 'panel', ceo: false, dept: null } : null;
}
function panelIds_(email) { const pipe = readAll_('pipe'); return Object.keys(pipe).filter(id => (pipe[id].panel || {})[email] && ['rejected', 'pool', 'hired'].indexOf(pipe[id].stage) < 0); }
// What an invited interviewer receives: their candidates (no salary, scores, notes or HR call), the job's questions, names for the history.
function panelView_(data, who) {
  const pipe = {}, reqs = {};
  const KEEP = ['id', 'req', 'name', 'jobTitle', 'location', 'years', 'notice', 'visa', 'cvFile', 'cvText', 'answers', 'stage', 'stageAt', 'books', 'panel', 'iv', 'lang'];
  Object.keys(data.pipe).forEach(id => {
    const c = data.pipe[id];
    if (!(c.panel || {})[who.email] || ['rejected', 'pool', 'hired'].indexOf(c.stage) >= 0) return;
    const o = {}; KEEP.forEach(k => { if (c[k] !== undefined) o[k] = c[k]; });
    if (c.personality) o.personality = { summary: c.personality.summary || '', qs: c.personality.qs || '' };
    pipe[id] = o;
    const r = data.reqs[c.req];
    if (r) reqs[c.req] = { id: c.req, reqId: r.reqId || '', title: r.title || '', dept: r.dept || '', branch: r.branch || '', testQs: r.testQs || [], practical: r.practical || '', practicals: r.practicals || null, mustHaves: r.mustHaves || [], traits: r.traits || [], status: r.status || '' };
  });
  const team = {}; const M = ((data.config.team || {}).members) || {};
  Object.keys(M).forEach(k => { team[k] = { name: M[k].name || '', role: M[k].role }; });
  return { reqs: reqs, pipe: pipe, jobs: {}, apps: {}, config: { team: { members: team } } };
}

/* ---------------- department heads see and change only their own department ---------------- */
// A hiring request belongs to a head if it is for their department, or they raised it.
function reqMine_(req, who) { return !!req && (req.dept === who.dept || req.createdBy === who.email); }
// Everything a head may see, built on the server: other departments' files never leave it.
function headView_(data, who) {
  const reqs = {}, ok = {};
  Object.keys(data.reqs).forEach(id => { if (reqMine_(data.reqs[id], who)) { reqs[id] = data.reqs[id]; ok[id] = true; } });
  const pick = o => { const r = {}; Object.keys(o).forEach(id => { if (ok[o[id].req]) r[id] = o[id]; }); return r; };
  const jobs = {}; Object.keys(data.jobs).forEach(id => { if (ok[id]) jobs[id] = data.jobs[id]; });
  const apps = {};
  Object.keys(data.apps).forEach(id => {
    const list = {}, L = data.apps[id].list || {};
    Object.keys(L).forEach(a => { if (ok[L[a].req]) list[a] = L[a]; });
    if (Object.keys(list).length) apps[id] = Object.assign({}, data.apps[id], { list: list });
  });
  const team = {}; const M = ((data.config.team || {}).members) || {};
  Object.keys(M).forEach(k => { team[k] = { name: M[k].name || '', role: M[k].role, dept: M[k].dept || null }; });  // names for the history, nothing else
  return { reqs: reqs, pipe: pick(data.pipe), jobs: jobs, apps: apps, config: { team: { members: team }, brand: data.config.brand || null } };
}
function headMayWrite_(col, id, d, who) {
  if (col === 'reqs') {
    const old = readOne_('reqs', id);
    return (!old || reqMine_(old, who)) && (d.dept === who.dept || (old && old.createdBy === who.email));
  }
  if (col === 'pipe') {
    const old = readOne_('pipe', id), req = readOne_('reqs', d.req);
    return (!old || reqMine_(readOne_('reqs', old.req), who)) && reqMine_(req, who);
  }
  if (col === 'apps') {                         // only the stage shown back to the applicant, for their own department
    const old = readOne_('apps', id); if (!old) return false;
    return Object.keys(d.list || {}).every(a => { const o = (old.list || {})[a]; return o && reqMine_(readOne_('reqs', o.req), who) && JSON.stringify(Object.assign({}, o, { status: d.list[a].status })) === JSON.stringify(d.list[a]); })
      && Object.keys(old.list || {}).length === Object.keys(d.list || {}).length;
  }
  return false;                                 // jobs, settings: HR / CEO only
}
function cvAllowed_(id, data) {
  const has = o => o && o.cvFile && o.cvFile.id === id;
  if (Object.keys(data.pipe).some(k => has(data.pipe[k]))) return true;
  return Object.keys(data.apps).some(k => Object.keys(data.apps[k].list || {}).some(a => has(data.apps[k].list[a])));
}
/* ---------------- interview scorecards: blind until you submit, nobody edits anyone else's ---------------- */
const IV_STAGES = ['applied', 'screening', 'personality', 'shortlist', 'interview'];
function ivOpen_(c) { return IV_STAGES.indexOf(c.stage) >= 0; }     // still at or before the interview
// What a person may see of the panel's scorecards on one candidate.
function blindOne_(c, who) {
  if (!c || !c.iv) return c;
  const mine = c.iv[who.email];
  const seeAll = !ivOpen_(c) || (mine && mine.done) || (who.ceo && !mine);
  if (seeAll) return c;
  const iv = {};
  Object.keys(c.iv).forEach(k => {
    const s = c.iv[k] || {};
    iv[k] = k === who.email ? s : { who: s.who || '', done: !!s.done, at: s.at || null, hidden: true };
  });
  return Object.assign({}, c, { iv: iv });
}
function blind_(pipe, who) { const o = {}; Object.keys(pipe).forEach(id => { o[id] = blindOne_(pipe[id], who); }); return o; }
// On save: keep everyone else's scorecard as stored; your own is locked once submitted or after the interview stage.
// Booking links are written only by the server (invite / book), never by a save.
function mergePipe_(id, d, who) {
  const old = readOne_('pipe', id);
  const iv = Object.assign({}, (old && old.iv) || {});
  const mine = (d.iv || {})[who.email], had = iv[who.email];
  if (mine && !(had && had.done) && (!old || ivOpen_(old))) {
    const m = Object.assign({}, mine); delete m.hidden;
    m.who = who.role === 'head' ? 'head' : who.role === 'panel' ? 'panel' : 'hr';
    if (m.done) m.at = m.at || Date.now();
    iv[who.email] = m;
  }
  const out = Object.assign({}, d, { iv: iv });
  if (!Object.keys(iv).length) delete out.iv;
  if (old && old.books) out.books = old.books; else delete out.books;
  if (old && old.panel) out.panel = old.panel; else delete out.panel;
  return out;
}

/* ---------------- booking: candidate picks an interview or HR-call time ---------------- */
const BOOK_KINDS = { call: { en: 'HR call', ar: 'مكالمة مع الموارد البشرية' }, interview: { en: 'Interview', ar: 'مقابلة' } };
function applyBase_() { return String(props_().getProperty('APPLY_URL') || 'https://apply.forka.com/').replace(/\/?$/, '/'); }
function findBook_(token) {
  token = String(token || '');
  if (!/^[A-Za-z0-9-]{20,60}$/.test(token)) return null;
  const pipe = readAll_('pipe');
  for (const id of Object.keys(pipe)) {
    const B = pipe[id].books || {};
    for (const k of Object.keys(B)) if (B[k] && B[k].token === token) return { id: id, c: pipe[id], kind: k, b: B[k], pipe: pipe };
  }
  return null;
}
// A time is taken if the same interviewer already has another candidate booked at it.
function takenBy_(pipe, b, t, selfId) {
  return Object.keys(pipe).some(id => id !== selfId && Object.keys(pipe[id].books || {}).some(k => { const x = pipe[id].books[k]; return x && x.by === b.by && x.pick === t; }));
}
function when_(t, lang) {
  const d = new Date(t + 4 * 3600000);                     // UAE and Oman: UTC+4 all year
  const DAYS = { en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getUTCHours(), m = ('0' + d.getUTCMinutes()).slice(-2);
  return DAYS[lang === 'ar' ? 'ar' : 'en'][d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ', ' + ((h + 11) % 12 + 1) + ':' + m + (h < 12 ? ' AM' : ' PM') + ' (UAE time)';
}
function icsStamp_(t) { return new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function ics_(b, c, uidv) {
  const e = s => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Forka//Hiring//EN', 'METHOD:PUBLISH', 'BEGIN:VEVENT', 'UID:' + uidv + '@forka.com', 'DTSTAMP:' + icsStamp_(Date.now()),
    'DTSTART:' + icsStamp_(b.pick), 'DTEND:' + icsStamp_(b.pick + (b.mins || 30) * 60000),
    'SUMMARY:' + e(BOOK_KINDS[b.kind].en + ' - ' + c.name + ' - ' + (c.jobTitle || '')), 'LOCATION:' + e(b.mode + (b.place ? ' - ' + b.place : '')),
    'DESCRIPTION:' + e(b.note || ''), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}
function gcal_(b, c) {
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(BOOK_KINDS[b.kind].en + ' - ' + c.name) +
    '&dates=' + icsStamp_(b.pick) + '/' + icsStamp_(b.pick + (b.mins || 30) * 60000) + '&location=' + encodeURIComponent(b.mode + (b.place ? ' - ' + b.place : ''));
}
function invite_(b, who) {
  const id = String(b.id || ''), kind = String(b.kind || '');
  if (!BOOK_KINDS[kind] || !/^[A-Za-z0-9_\-.:@]{1,80}$/.test(id)) return { ok: false, error: 'bad' };
  const c = readOne_('pipe', id); if (!c) return { ok: false, error: 'missing' };
  if (kind === 'call' && who.role !== 'hr') return { ok: false, error: 'role' };
  if (who.role === 'head' && !reqMine_(readOne_('reqs', c.req), who)) return { ok: false, error: 'role' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email || '')) return { ok: false, error: 'email' };
  const soon = Date.now() + 3600000;
  const slots = (Array.isArray(b.slots) ? b.slots : []).map(Number).filter(t => isFinite(t) && t > soon && t < Date.now() + 90 * 864e5)
    .filter((t, i, a) => a.indexOf(t) === i).sort((x, y) => x - y).slice(0, 30);
  if (!slots.length) return { ok: false, error: 'slots' };
  const MODES = ['In person', 'Phone', 'Video call'];
  const bk = { token: Utilities.getUuid(), kind: kind, slots: slots, mins: Math.max(15, Math.min(180, +b.mins || 30)), mode: MODES.indexOf(b.mode) >= 0 ? b.mode : 'In person',
    place: clean_(b.place, 160), note: clean_(b.note, 400), by: who.email, byName: who.name || who.email, at: Date.now(), pick: null };
  const lang = c.lang === 'ar' ? 'ar' : 'en', link = applyBase_() + '#book=' + bk.token, job = c.jobTitle || (readOne_('reqs', c.req) || {}).title || '';
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    const cur = readOne_('pipe', id);
    cur.books = Object.assign({}, cur.books || {}, { [kind]: bk });
    (cur.history = cur.history || []).push({ t: Date.now(), by: who.email, m: BOOK_KINDS[kind].en + ' booking link sent (' + slots.length + ' times)' });
    write_('pipe', id, cur, who.email); bump_();
  } finally { lock.releaseLock(); }
  let mailed = false;
  if (b.email !== false) {
    const first = String(c.name || '').split(' ')[0];
    const body = lang === 'ar'
      ? 'مرحباً ' + first + '،\n\nشكراً لاهتمامك بوظيفة ' + job + ' في فوركا. نود ترتيب ' + BOOK_KINDS[kind].ar + ' معك.\nاختر الوقت المناسب لك من هذا الرابط:\n' + link + '\n\n' + (bk.note ? bk.note + '\n\n' : '') + 'فريق التوظيف - فوركا'
      : 'Hello ' + first + ',\n\nThank you for your interest in the ' + job + ' role at Forka. We would like to arrange an ' + BOOK_KINDS[kind].en.toLowerCase() + ' with you.\nPlease pick a time that suits you here:\n' + link + '\n\n' + (bk.note ? bk.note + '\n\n' : '') + 'Forka Hiring team';
    try { MailApp.sendEmail({ to: c.email, subject: (lang === 'ar' ? 'اختر موعد ' + BOOK_KINDS[kind].ar + ' - ' : 'Pick a time for your ' + BOOK_KINDS[kind].en.toLowerCase() + ' - ') + job, name: 'Forka Hiring', replyTo: who.email, body: body }); mailed = true; } catch (e) {}
  }
  return { ok: true, ver: stamp_(), link: link, mailed: mailed, book: bk };
}
const SHEETS = ['head', 'hr', 'both'];
function panelSet_(b, who) {
  const id = String(b.id || ''), email = key_(clean_(b.email, 120));
  if (!/^[A-Za-z0-9_\-.:@]{1,80}$/.test(id) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'bad' };
  const c = readOne_('pipe', id); if (!c) return { ok: false, error: 'missing' };
  if (who.role === 'head' && !reqMine_(readOne_('reqs', c.req), who)) return { ok: false, error: 'role' };
  if (['rejected', 'pool', 'hired'].indexOf(c.stage) >= 0) return { ok: false, error: 'closed' };
  const lock = LockService.getScriptLock(); lock.waitLock(15000); let added = false, entry = null;
  try {
    const cur = readOne_('pipe', id); cur.panel = Object.assign({}, cur.panel || {});
    if (b.remove) {
      if (!cur.panel[email]) return { ok: true, ver: stamp_() };
      delete cur.panel[email];
      (cur.history = cur.history || []).push({ t: Date.now(), by: who.email, m: 'Removed ' + email + ' from the interview panel' });
    } else {
      added = !cur.panel[email];
      entry = cur.panel[email] = { name: clean_(b.name, 80) || email.split('@')[0], sheet: SHEETS.indexOf(b.sheet) >= 0 ? b.sheet : 'head', by: who.email, at: Date.now() };
      if (added) (cur.history = cur.history || []).push({ t: Date.now(), by: who.email, m: 'Invited ' + entry.name + ' to the interview panel' });
    }
    if (!Object.keys(cur.panel).length) delete cur.panel;
    write_('pipe', id, cur, who.email); bump_();
    var bk = (cur.books || {}).interview, job = cur.jobTitle || (readOne_('reqs', cur.req) || {}).title || '';
  } finally { lock.releaseLock(); }
  let mailed = false;
  if (added && b.email !== false) {
    try { MailApp.sendEmail({ to: email, name: 'Forka Hiring', replyTo: who.email, subject: 'Interview panel: ' + c.name + ' - ' + job,
      body: 'Hello ' + entry.name + ',\n\n' + (who.name || who.email) + ' added you to the interview panel for ' + c.name + ' (' + job + ').\n' +
        (bk && bk.pick ? 'Interview: ' + when_(bk.pick, 'en') + ' - ' + bk.mode + (bk.place ? ' - ' + bk.place : '') + '\n' : 'The interview time will be sent to you once the candidate books it.\n') +
        '\nYour scorecard (questions, scores and notes) is here - sign in with your Forka Apps account:\nhttps://erp.forka.com/hiring/#c=' + id + '\n\nPlease score on your own and submit before talking to the other interviewers.\n\nForka Hiring' }); mailed = true; } catch (e) {}
  }
  return { ok: true, ver: stamp_(), mailed: mailed, panel: entry };
}
function slotInfo_(b) {
  const f = findBook_(b.token); if (!f) return { ok: false, error: 'missing' };
  const c = f.c, k = f.b, now = Date.now();
  if (['rejected', 'pool', 'hired'].indexOf(c.stage) >= 0) return { ok: false, error: 'closed' };
  const req = readOne_('reqs', c.req) || {};
  return { ok: true, kind: f.kind, name: String(c.name || '').split(' ')[0], job: c.jobTitle || req.title || '', jobAr: req.titleAr || '', lang: c.lang || 'en',
    mins: k.mins, mode: k.mode, place: k.place, note: k.note, pick: k.pick,
    slots: k.slots.map(t => ({ t: t, free: t > now + 3600000 && (t === k.pick || !takenBy_(f.pipe, k, t, f.id)) })) };
}
function book_(b) {
  const lock = LockService.getScriptLock(); lock.waitLock(15000);
  let f, t;
  try {
    f = findBook_(b.token); if (!f) return { ok: false, error: 'missing' };
    if (['rejected', 'pool', 'hired'].indexOf(f.c.stage) >= 0) return { ok: false, error: 'closed' };
    t = Number(b.t);
    if (f.b.slots.indexOf(t) < 0 || t <= Date.now() + 3600000) return { ok: false, error: 'slot' };
    if (f.b.pick && f.b.pick < Date.now() + 2 * 3600000) return { ok: false, error: 'late' };
    if (takenBy_(f.pipe, f.b, t, f.id)) return { ok: false, error: 'taken' };
    const c = f.c; c.books[f.kind] = Object.assign({}, f.b, { pick: t, pickedAt: Date.now() });
    (c.history = c.history || []).push({ t: Date.now(), by: 'candidate', m: BOOK_KINDS[f.kind].en + (f.b.pick ? ' moved to ' : ' booked for ') + when_(t, 'en') });
    write_('pipe', f.id, c, 'apply.forka.com'); bump_();
    f.b = c.books[f.kind];
  } finally { lock.releaseLock(); }
  const c = f.c, k = f.b, lang = c.lang === 'ar' ? 'ar' : 'en', job = c.jobTitle || '';
  const file = () => Utilities.newBlob(ics_(k, c, k.token), 'text/calendar', 'forka-' + k.kind + '.ics');
  const where = k.mode + (k.place ? ' - ' + k.place : '');
  try { MailApp.sendEmail({ to: c.email, name: 'Forka Hiring', replyTo: k.by, attachments: [file()],
    subject: (lang === 'ar' ? 'تم تأكيد ' + BOOK_KINDS[k.kind].ar + ' - ' : 'Confirmed: your ' + BOOK_KINDS[k.kind].en.toLowerCase() + ' - ') + job,
    body: (lang === 'ar' ? 'تم تأكيد موعدك: ' : 'You are booked for ') + when_(t, lang) + '\n' + where + '\n\n' + (k.note ? k.note + '\n\n' : '') +
      (lang === 'ar' ? 'لتغيير الموعد استخدم نفس الرابط: ' : 'Need to change it? Use the same link: ') + applyBase_() + '#book=' + k.token + '\n\nForka Hiring' }); } catch (e) {}
  const to = [k.by].concat(k.kind === 'interview' ? Object.keys(c.panel || {}) : []).concat(String(props_().getProperty('HR_EMAILS') || '').split(/[,\s]+/)).filter((x, i, a) => x && a.indexOf(x) === i);
  try { MailApp.sendEmail({ to: to.join(','), name: 'Forka Hiring', attachments: [file()],
    subject: BOOK_KINDS[k.kind].en + ' booked: ' + c.name + ' - ' + when_(t, 'en'),
    body: c.name + ' (' + job + ') picked ' + when_(t, 'en') + '.\n' + where + '\n\nAdd to Google Calendar: ' + gcal_(k, c) + '\nOpen Hiring: https://erp.forka.com/hiring/' }); } catch (e) {}
  return { ok: true, pick: t, when: when_(t, lang) };
}
function allData_() { const d = {}; Object.keys(COLS).forEach(c => { d[c] = readAll_(c); }); return d; }

/* ---------------- public: apply.forka.com ---------------- */
function publicJobs_() {
  const jobs = readAll_('jobs'), out = [];
  Object.keys(jobs).forEach(id => {
    const j = jobs[id]; if (!j.open) return;
    const r = readOne_('reqs', id) || {};
    out.push({ id: id, title: j.title || '', dept: j.dept || '', branch: j.branch || '', summary: j.summary || '', jd: j.jd || '',
      ad: r.ad || '', adAr: r.adAr || '', titleAr: r.titleAr || '', knockout: j.knockout || [], knockoutAr: r.knockoutAr || [], postedAt: j.postedAt || null });
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
  if (a === 'slot') return slotInfo_(b);
  if (a === 'book') return book_(b);

  /* team only */
  const me = erpWho_(b.token);
  if (!me) return { ok: false, error: 'session' };
  const r = role_(me);
  if (!r) return { ok: false, error: 'noaccess', me: { email: me.email, name: me.name } };
  const who = { email: me.email, name: me.name, role: r.role, ceo: r.ceo, dept: r.dept };

  if (a === 'load') {
    if (b.ver && b.ver === stamp_()) return { ok: true, same: true, ver: b.ver, me: who };
    const data = allData_();
    const view = r.role === 'head' ? headView_(data, who) : r.role === 'panel' ? panelView_(data, who) : data;
    view.pipe = blind_(view.pipe, who);
    return { ok: true, ver: stamp_(), me: who, data: view };
  }
  if (a === 'put' || a === 'del') {
    const col = String(b.col || ''), id = String(b.id || '');
    if (!COLS[col] || !/^[A-Za-z0-9_\-.:@]{1,80}$/.test(id)) return { ok: false, error: 'bad' };
    if (col === 'config' && r.role !== 'hr') return { ok: false, error: 'role' };           // team list and careers words: HR / CEO
    if (col === 'jobs' && r.role !== 'hr') return { ok: false, error: 'role' };             // posting jobs: HR / CEO
    if (col === 'config' && id === 'team' && !r.ceo) return { ok: false, error: 'role' };   // who is on the team: CEO only
    if (r.role === 'head' && (a === 'del' || !headMayWrite_(col, id, b.data || {}, who))) return { ok: false, error: 'role' };
    if (r.role === 'panel') {                     // an invited interviewer only fills in their own scorecard
      if (a === 'del' || col !== 'pipe' || panelIds_(who.email).indexOf(id) < 0) return { ok: false, error: 'role' };
      const old = readOne_('pipe', id);
      b.data = Object.assign({}, old, { iv: (b.data || {}).iv || {} });
    }
    const lock = LockService.getScriptLock(); lock.waitLock(15000);
    try {
      if (a === 'del') { remove_(col, id); bump_(); return { ok: true, ver: stamp_() }; }
      const w = write_(col, id, col === 'pipe' ? mergePipe_(id, b.data || {}, who) : (b.data || {}), me.email);
      if (!w.ok) return w;
      bump_(); return { ok: true, ver: stamp_() };
    } finally { lock.releaseLock(); }
  }
  if (a === 'invite') return r.role === 'panel' ? { ok: false, error: 'role' } : invite_(b, who);
  if (a === 'panel') return r.role === 'panel' ? { ok: false, error: 'role' } : panelSet_(b, who);
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
    if (r.role === 'head' && !cvAllowed_(id, headView_(allData_(), who))) return { ok: false, error: 'missing' };
    if (r.role === 'panel' && !cvAllowed_(id, panelView_(allData_(), who))) return { ok: false, error: 'missing' };
    let f; try { f = DriveApp.getFileById(id); } catch (e) { return { ok: false, error: 'missing' }; }
    const parents = f.getParents(); let inFolder = false;
    while (parents.hasNext()) { if (parents.next().getId() === folder_().getId()) inFolder = true; }
    if (!inFolder) return { ok: false, error: 'missing' };
    const blob = f.getBlob();
    return { ok: true, name: f.getName(), type: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
  }
  return { ok: false, error: 'action' };
}
