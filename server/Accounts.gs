/**
 * Forka Apps - accounts server (erp.forka.com)
 * Google sign-in (company emails) + PIN for staff without email, access requests,
 * CEO-only people & clearance, activity log.
 *
 * INSTALL (standalone Apps Script project):
 *  1. Paste this file -> Save.
 *  2. Set ACCOUNTS_SHEET_ID and GOOGLE_CLIENT_ID below (or the same names as Script properties).
 *  3. Run  setup  once and approve the permissions. It creates the People / Requests / Activity tabs.
 *  4. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone -> copy the /exec URL into config.js.
 * Nothing secret goes to GitHub: PINs are stored here only as salted hashes, sessions live in the script cache.
 */
/* Not secret: the Sheet is private to its owner, and the sign-in client id is public by design (it is also in config.js). */
const ACCOUNTS_SHEET_ID = '1YkqcYwtKcm4mOz-wJGLvSPAeEYGzPxqLep_SzRGOCCA';
const GOOGLE_CLIENT_ID = '';   // filled in once the Google sign-in client exists
const TABS = { people: 'People', req: 'Requests', act: 'Activity' };
const P_HEAD = ['Email', 'Name', 'Job title', 'Clearance', 'Status', 'Procurement', 'Procurement sections', 'Hiring', 'Branch Check', 'Sign-in', 'PIN hash', 'Added by', 'Updated', 'Updated by'];
const R_HEAD = ['Email', 'Name', 'Job title', 'Reason', 'Requested', 'State', 'Decided by', 'Decided', 'Note'];
const A_HEAD = ['When', 'Who', 'Action', 'About', 'Details'];
const SIDES = ['plan', 'ops', 'fin', 'dept', 'ceo'];
const LEVELS = ['staff', 'manager', 'ceo'];
const STATUSES = ['active', 'pending', 'blocked'];
const SESSION_SECONDS = 6 * 60 * 60;
const MAX_PIN_TRIES = 10;
const SEED = [
  ['ceo@forka.com', 'Khaled Alamer', 'CEO', 'ceo', 'active', true, 'plan,ops,fin,dept,ceo', true, true],
  ['abu.ali@forka.com', 'Mohammad Abu Ali', 'Operations Manager', 'manager', 'pending', true, 'ops', true, true],
  ['mohammed@kuwaitikitchen.com', 'Mohammed Abdelrahman', 'Purchasing', 'staff', 'pending', true, 'plan', false, false],
  ['store@kuwaitikitchen.com', 'Hamim', 'Store / Purchasing', 'staff', 'pending', true, 'plan', false, false],
  ['arman@kuwaitikitchen.com', 'Arman', 'Operations', 'staff', 'pending', true, 'ops', false, false],
  ['tahani@forka.com', 'Tahani Alamer', '', 'manager', 'pending', true, 'dept', true, true],
  ['jennifer@forka.com', 'Jennifer Tudara', 'HR', 'manager', 'pending', false, '', true, false],
  ['admin@forka.com', 'Ruby Ann Margate', 'Admin', 'staff', 'pending', true, 'dept', true, false],
  ['hr@kuwaitikitchen.com', 'HR Officer (Kuwaiti Kitchen)', 'HR', 'staff', 'pending', false, '', true, false],
  ['operations@kuwaitikitchen.com', 'Operations (Kuwaiti Kitchen)', 'Operations', 'staff', 'pending', true, 'ops', false, true]
];

function props_() { return PropertiesService.getScriptProperties(); }
function ss_() { const id = props_().getProperty('SHEET_ID') || ACCOUNTS_SHEET_ID; return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActive(); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function key_(e) { return String(e || '').trim().toLowerCase(); }
function now_() { return new Date(); }

function tab_(name, head) {
  let sh = ss_().getSheetByName(name);
  if (!sh) sh = ss_().insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(head); sh.setFrozenRows(1); sh.getRange(1, 1, 1, head.length).setFontWeight('bold'); }
  return sh;
}

function setup() {
  const p = tab_(TABS.people, P_HEAD); tab_(TABS.req, R_HEAD); tab_(TABS.act, A_HEAD);
  if (p.getLastRow() < 2) {
    const t = now_();
    p.getRange(2, 1, SEED.length, P_HEAD.length).setValues(SEED.map(s => [s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], 'google', '', 'Setup', t, 'Setup']));
  }
  if (!props_().getProperty('SALT')) props_().setProperty('SALT', Utilities.getUuid());
  return 'Done. Set GOOGLE_CLIENT_ID in Script properties, then Deploy as a web app.';
}

/* ---------------- people ---------------- */
function rowToPerson_(r) {
  return {
    email: key_(r[0]), name: String(r[1]), title: String(r[2]),
    level: LEVELS.indexOf(String(r[3]).toLowerCase()) >= 0 ? String(r[3]).toLowerCase() : 'staff',
    status: STATUSES.indexOf(String(r[4]).toLowerCase()) >= 0 ? String(r[4]).toLowerCase() : 'pending',
    apps: { proc: r[5] === true || String(r[5]).toUpperCase() === 'TRUE' ? 1 : 0, hire: r[7] === true || String(r[7]).toUpperCase() === 'TRUE' ? 1 : 0, branch: r[8] === true || String(r[8]).toUpperCase() === 'TRUE' ? 1 : 0 },
    sides: String(r[6]).toLowerCase().split(/[,\s]+/).filter(s => SIDES.indexOf(s) >= 0),
    method: String(r[9]).toLowerCase() === 'pin' ? 'pin' : 'google',
    hasPin: !!String(r[10]), pinHash: String(r[10]),
    addedBy: String(r[11]), updatedAt: r[12] instanceof Date ? r[12].toISOString() : String(r[12]), updatedBy: String(r[13])
  };
}
function people_() {
  const sh = tab_(TABS.people, P_HEAD), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, P_HEAD.length).getValues().map((r, i) => Object.assign(rowToPerson_(r), { _row: i + 2 })).filter(p => p.email);
}
function findPerson_(email) { const e = key_(email); return people_().find(p => p.email === e) || null; }
function publicPerson_(p) { const o = Object.assign({}, p); delete o.pinHash; delete o._row; return o; }
function isCeo_(p) { return p && p.level === 'ceo' && p.status === 'active'; }

function hash_(pin) {
  const salt = props_().getProperty('SALT') || '';
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + String(pin))
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function writePerson_(p, by, isNew) {
  const sh = tab_(TABS.people, P_HEAD);
  const row = [p.email, p.name, p.title || '', p.level, p.status, !!p.apps.proc, (p.sides || []).join(','), !!p.apps.hire, !!p.apps.branch, p.method, p.pinHash || '', p.addedBy || by, now_(), by];
  if (isNew) sh.appendRow(row); else sh.getRange(p._row, 1, 1, row.length).setValues([row]);
}

/* ---------------- activity ---------------- */
function log_(who, action, about, details) {
  tab_(TABS.act, A_HEAD).appendRow([now_(), who || '', action, about || '', details || '']);
}
function activity_(limit) {
  const sh = tab_(TABS.act, A_HEAD), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const k = Math.min(limit || 500, n);
  return sh.getRange(sh.getLastRow() - k + 1, 1, k, 5).getValues().reverse()
    .map(r => ({ at: new Date(r[0]).toISOString(), by: String(r[1]), verb: String(r[2]), target: String(r[3]), extra: String(r[4]) }));
}

/* ---------------- requests ---------------- */
function requests_() {
  const sh = tab_(TABS.req, R_HEAD), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, R_HEAD.length).getValues().map((r, i) => ({
    email: key_(r[0]), name: String(r[1]), title: String(r[2]), why: String(r[3]),
    at: r[4] instanceof Date ? r[4].toISOString() : String(r[4]), state: String(r[5]) || 'waiting',
    decidedBy: String(r[6]), reason: String(r[8]), _row: i + 2
  }));
}
function lastRequest_(email) { const e = key_(email); return requests_().filter(r => r.email === e).pop() || null; }

/* ---------------- Google sign-in ---------------- */
function verifyGoogle_(idToken) {
  const clientId = props_().getProperty('GOOGLE_CLIENT_ID') || GOOGLE_CLIENT_ID;
  if (!clientId) return { error: 'noclient' };
  if (!idToken || String(idToken).length > 5000) return { error: 'token' };
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return { error: 'token' };
  const t = JSON.parse(r.getContentText());
  if (t.aud !== clientId) return { error: 'token' };
  if (['accounts.google.com', 'https://accounts.google.com'].indexOf(t.iss) < 0) return { error: 'token' };
  if (String(t.email_verified) !== 'true') return { error: 'unverified' };
  if (+t.exp * 1000 < Date.now()) return { error: 'expired' };
  return { email: key_(t.email), name: t.name || '' };
}

/* ---------------- sessions ---------------- */
function newSession_(email) {
  const tok = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('s:' + tok, email, SESSION_SECONDS);
  return tok;
}
function sessionPerson_(tok) {
  if (!tok) return null;
  const email = CacheService.getScriptCache().get('s:' + tok);
  if (!email) return null;
  const p = findPerson_(email);
  return p && p.status === 'active' ? p : null;
}

/* ---------------- what each person receives ---------------- */
function bundle_(me, tok) {
  const o = { ok: true, me: publicPerson_(me) };
  if (tok) o.token = tok;
  if (isCeo_(me)) {
    o.people = people_().map(publicPerson_);
    o.requests = requests_().map(r => { const x = Object.assign({}, r); delete x._row; return x; });
    o.activity = activity_(500);
  }
  return o;
}

/* ---------------- API ---------------- */
function doGet() { return out_({ ok: true, service: 'forka-apps-accounts' }); }

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad' }); }
  const lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch (err) { return out_({ ok: false, error: 'busy' }); }
  try { return out_(handle_(b)); }
  catch (err) { return out_({ ok: false, error: 'server', detail: String(err).slice(0, 200) }); }
  finally { lock.releaseLock(); }
}

function handle_(b) {
  const a = String(b.action || '');
  if (a === 'google') {
    const g = verifyGoogle_(b.idToken);
    if (g.error) return { ok: false, error: g.error };
    const p = findPerson_(g.email);
    if (p) {
      if (p.status === 'active') { log_(p.email, 'signin'); return bundle_(p, newSession_(p.email)); }
      return { ok: false, status: p.status, email: p.email };
    }
    const r = lastRequest_(g.email);
    if (r && r.state === 'waiting') return { ok: false, status: 'waiting', email: g.email };
    if (r && r.state === 'rejected') return { ok: false, status: 'rejected', email: g.email, reason: r.reason };
    return { ok: false, status: 'unknown', email: g.email, name: g.name };
  }
  if (a === 'pin') {
    const fails = +props_().getProperty('PIN_FAILS') || 0, until = +props_().getProperty('PIN_LOCK') || 0;
    if (Date.now() < until) return { ok: false, error: 'locked' };
    const pin = String(b.pin || '').trim();
    const h = /^\d{4,8}$/.test(pin) ? hash_(pin) : '';
    const p = h ? people_().find(x => x.method === 'pin' && x.pinHash === h && x.status === 'active') : null;
    if (!p) {
      if (fails + 1 >= MAX_PIN_TRIES) { props_().setProperty('PIN_LOCK', String(Date.now() + 10 * 60 * 1000)); props_().setProperty('PIN_FAILS', '0'); }
      else props_().setProperty('PIN_FAILS', String(fails + 1));
      return { ok: false, error: 'pin' };
    }
    props_().setProperty('PIN_FAILS', '0');
    log_(p.email, 'signin');
    return bundle_(p, newSession_(p.email));
  }
  if (a === 'request') {
    const g = verifyGoogle_(b.idToken);
    if (g.error) return { ok: false, error: g.error };
    if (findPerson_(g.email)) return { ok: false, error: 'exists' };
    const name = String(b.name || '').trim().slice(0, 80), why = String(b.why || '').trim().slice(0, 500);
    if (!name || !why) return { ok: false, error: 'need' };
    const r = lastRequest_(g.email);
    if (r && r.state === 'waiting') return { ok: true, status: 'waiting' };
    tab_(TABS.req, R_HEAD).appendRow([g.email, name, String(b.title || '').slice(0, 80), why, now_(), 'waiting', '', '', '']);
    log_(g.email, 'req', '', '');
    return { ok: true, status: 'waiting' };
  }

  /* everything below needs a session */
  const me = sessionPerson_(b.token);
  if (!me) return { ok: false, error: 'session' };
  if (a === 'me') return bundle_(me);
  if (a === 'signout') { CacheService.getScriptCache().remove('s:' + b.token); log_(me.email, 'signout'); return { ok: true }; }
  if (a === 'open') { log_(me.email, 'open', '', String(b.app || '').slice(0, 40)); return { ok: true }; }

  /* CEO only */
  if (!isCeo_(me)) return { ok: false, error: 'role' };
  if (a === 'savePerson') return savePerson_(me, b);
  if (a === 'setStatus') return setStatus_(me, key_(b.id), String(b.status || ''));
  if (a === 'reject') return reject_(me, key_(b.id), String(b.reason || '').slice(0, 300));
  return { ok: false, error: 'action' };
}

function cleanPerson_(x) {
  const apps = x.apps || {};
  const p = {
    email: key_(x.email), name: String(x.name || '').trim().slice(0, 80), title: String(x.title || '').trim().slice(0, 80),
    level: LEVELS.indexOf(x.level) >= 0 ? x.level : 'staff', status: STATUSES.indexOf(x.status) >= 0 ? x.status : 'pending',
    apps: { proc: apps.proc ? 1 : 0, hire: apps.hire ? 1 : 0, branch: apps.branch ? 1 : 0 },
    sides: (x.sides || []).filter(s => SIDES.indexOf(s) >= 0), method: x.method === 'pin' ? 'pin' : 'google'
  };
  if (!p.apps.proc) p.sides = [];
  return p;
}

function savePerson_(me, b) {
  const x = cleanPerson_(b.person || {}), id = key_(b.id);
  const all = people_();
  if (!x.name) return { ok: false, error: 'need', fields: ['name'] };
  if (x.method === 'google' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)) return { ok: false, error: 'need', fields: ['email'] };
  if (x.method === 'pin' && !x.email) x.email = 'pin-' + Utilities.getUuid().slice(0, 8);
  const old = id ? all.find(p => p.email === id) : null;
  if (!old && all.some(p => p.email === x.email)) return { ok: false, error: 'dupe' };
  if (old) x.email = old.email;                                   // the email of an existing person never changes
  const pin = String((b.person || {}).pinNew || '').trim();
  if (x.method === 'pin') {
    if (pin && !/^\d{4,8}$/.test(pin)) return { ok: false, error: 'pinBad' };
    if (!pin && !(old && old.pinHash)) return { ok: false, error: 'pinBad' };
    if (pin) { const h = hash_(pin); if (all.some(p => p.pinHash === h && p.email !== x.email)) return { ok: false, error: 'pinDupe' }; x.pinHash = h; }
    else x.pinHash = old.pinHash;
  } else x.pinHash = '';
  if (old && isCeo_(old) && !(x.level === 'ceo' && x.status === 'active') && all.filter(isCeo_).length < 2) return { ok: false, error: 'lastCeo' };
  x.addedBy = old ? old.addedBy : me.email; x._row = old ? old._row : 0;
  writePerson_(x, me.email, !old);
  if (b.fromReq) {
    const r = requests_().filter(q => q.email === key_(b.fromReq) && q.state === 'waiting').pop();
    if (r) tab_(TABS.req, R_HEAD).getRange(r._row, 6, 1, 3).setValues([['approved', me.email, now_()]]);
    log_(me.email, 'allow', x.email);
  } else if (!old) log_(me.email, 'add', x.email);
  else log_(me.email, 'edit', x.email, diff_(old, x));
  return bundle_(findPerson_(me.email));
}

function diff_(a, b) {
  const out = [];
  if (a.level !== b.level) out.push(a.level + ' > ' + b.level);
  if (a.status !== b.status) out.push(a.status + ' > ' + b.status);
  ['proc', 'hire', 'branch'].forEach(k => { if (!!a.apps[k] !== !!b.apps[k]) out.push((b.apps[k] ? '+ ' : '- ') + k); });
  SIDES.forEach(s => { const x = a.sides.indexOf(s) >= 0, y = b.sides.indexOf(s) >= 0; if (x !== y) out.push((y ? '+ ' : '- ') + s); });
  if (a.method !== b.method) out.push('sign-in ' + b.method);
  return out.join(', ');
}

function setStatus_(me, id, st) {
  if (STATUSES.indexOf(st) < 0) return { ok: false, error: 'bad' };
  const all = people_(), p = all.find(x => x.email === id);
  if (!p) return { ok: false, error: 'missing' };
  if (isCeo_(p) && st !== 'active' && all.filter(isCeo_).length < 2) return { ok: false, error: 'lastCeo' };
  const was = p.status; p.status = st;
  writePerson_(p, me.email, false);
  log_(me.email, st === 'active' ? (was === 'blocked' ? 'unblock' : 'confirm') : 'block', id);
  return bundle_(findPerson_(me.email));
}

function reject_(me, id, reason) {
  const r = requests_().filter(q => q.email === id && q.state === 'waiting').pop();
  if (!r) return { ok: false, error: 'missing' };
  tab_(TABS.req, R_HEAD).getRange(r._row, 6, 1, 4).setValues([['rejected', me.email, now_(), reason]]);
  log_(me.email, 'reject', id, reason);
  return bundle_(findPerson_(me.email));
}
