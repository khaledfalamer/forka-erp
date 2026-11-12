// Forka Apps - accounts (erp.forka.com). Port of server/Accounts.gs to PostgreSQL.
// Same requests and same answers as the Apps Script version, so the websites only change the server address.
// Google sign-in (company emails) + PIN for staff without email, access requests, CEO-only people & clearance, activity log.
import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { q, tx } from './db.js';

export const GOOGLE_CLIENT_ID_DEFAULT = '443945615318-21aveveme3c8n41fepp4gmof3vnrs8if.apps.googleusercontent.com';
const SIDES = ['plan', 'ops', 'fin', 'dept', 'ceo', 'oman'];
const LEVELS = ['staff', 'manager', 'ceo'];
const STATUSES = ['active', 'pending', 'blocked'];
const SESSION_SECONDS = 6 * 60 * 60;
const MAX_PIN_TRIES = 10;
const WRITES = ['request', 'savePerson', 'setStatus', 'reject', 'invite'];
const key = e => String(e || '').trim().toLowerCase();

// ---------------- Google sign-in ----------------
// verify can be swapped in tests; in production it asks Google to check the sign-in token.
export function makeGoogleVerifier(fetchImpl = fetch) {
  return async idToken => {
    const clientId = process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_DEFAULT;
    if (!idToken || String(idToken).length > 5000) return { error: 'token' };
    let r;
    try { r = await fetchImpl('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)); }
    catch { return { error: 'token' }; }
    if (r.status !== 200) return { error: 'token' };
    const t = await r.json();
    if (t.aud !== clientId) return { error: 'token' };
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(t.iss)) return { error: 'token' };
    if (String(t.email_verified) !== 'true') return { error: 'unverified' };
    if (+t.exp * 1000 < Date.now()) return { error: 'expired' };
    return { email: key(t.email), name: t.name || '' };
  };
}

// ---------------- people ----------------
const rowToPerson = r => ceoAll({
  email: r.email, name: r.name, title: r.title, level: r.level, status: r.status,
  apps: { proc: r.app_proc ? 1 : 0, hire: r.app_hire ? 1 : 0, branch: r.app_branch ? 1 : 0 },
  sides: SIDES.filter(s => (r.sides || []).includes(s)),
  method: r.method, hasPin: !!r.pin_hash, pinHash: r.pin_hash,
  addedBy: r.added_by, updatedAt: new Date(r.updated_at).toISOString(), updatedBy: r.updated_by,
});
// An active CEO opens every app and every section automatically, including ones added later.
function ceoAll(p) {
  if (p.level === 'ceo' && p.status === 'active') { p.apps = { proc: 1, hire: 1, branch: 1 }; p.sides = SIDES.slice(); }
  return p;
}
const people = async db => (await db('select * from accounts.people order by id')).rows.map(rowToPerson);
const findPerson = async (db, email) => {
  const r = (await db('select * from accounts.people where email = $1', [key(email)])).rows[0];
  return r ? rowToPerson(r) : null;
};
const publicPerson = p => { const o = { ...p }; delete o.pinHash; return o; };
const isCeo = p => p && p.level === 'ceo' && p.status === 'active';

// ---------------- settings, stamp, salt ----------------
const getSetting = async (db, k) => (await db('select value from accounts.settings where key = $1', [k])).rows[0]?.value ?? null;
const setSetting = (db, k, v) => db('insert into accounts.settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value', [k, String(v)]);
const stamp = async db => (await getSetting(db, 'VER')) || '0';
const bump = db => setSetting(db, 'VER', Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
async function salt(db) {
  let s = await getSetting(db, 'SALT');
  if (!s) { s = randomUUID(); await setSetting(db, 'SALT', s); }
  return s;
}
// Same recipe as Apps Script (SHA-256 of salt:pin, hex), so PINs carried over keep working once SALT is copied.
const hashPin = (s, pin) => createHash('sha256').update(s + ':' + String(pin)).digest('hex');

// ---------------- activity ----------------
async function log(db, who, action, about = '', details = '') {
  await db('insert into accounts.activity (who, action, about, details) values ($1, $2, $3, $4)', [who || '', action, about || '', details || '']);
  await bump(db);
}
const activity = async (db, limit = 500) => (await db('select * from accounts.activity order by id desc limit $1', [limit])).rows
  .map(r => ({ at: new Date(r.at).toISOString(), by: r.who, verb: r.action, target: r.about, extra: r.details }));

// ---------------- requests ----------------
const requests = async db => (await db('select * from accounts.requests order by id')).rows.map(r => ({
  email: r.email, name: r.name, title: r.title, why: r.why, at: new Date(r.at).toISOString(), state: r.state,
  decidedBy: r.decided_by, reason: r.note, _id: r.id,
}));
const lastRequest = async (db, email) => (await requests(db)).filter(r => r.email === key(email)).pop() || null;
const cleanReq = r => { const x = { ...r }; delete x._id; return x; };

// ---------------- sessions ----------------
const tokHash = t => createHash('sha256').update(String(t)).digest('hex');
async function newSession(db, email) {
  const tok = randomUUID() + randomBytes(16).toString('hex');
  await db('insert into accounts.sessions (token_hash, email, expires_at) values ($1, $2, now() + make_interval(secs => $3))', [tokHash(tok), email, SESSION_SECONDS]);
  await db('delete from accounts.sessions where expires_at < now()');
  return tok;
}
async function sessionPerson(db, tok) {
  if (!tok) return null;
  const s = (await db('select email from accounts.sessions where token_hash = $1 and expires_at > now()', [tokHash(tok)])).rows[0];
  if (!s) return null;
  const p = await findPerson(db, s.email);
  return p && p.status === 'active' ? p : null;
}

// ---------------- what each person receives ----------------
async function bundle(db, me, tok) {
  const o = { ok: true, me: publicPerson(me), ver: await stamp(db) };
  if (tok) o.token = tok;
  if (isCeo(me)) {
    o.people = (await people(db)).map(publicPerson);
    o.requests = (await requests(db)).map(cleanReq);
    o.activity = await activity(db, 300);
  }
  return o;
}

// ---------------- API ----------------
// One entry point, like doPost in Apps Script. Writes run one at a time; reads never wait.
export function makeAccounts({ verifyGoogle = makeGoogleVerifier() } = {}) {
  return async function handle(b) {
    const a = String(b?.action || '');
    if (WRITES.includes(a)) return tx(db => route(db, a, b), 'accounts');
    return route(q, a, b);
  };

  async function route(db, a, b) {
    if (a === 'google') {
      const g = await verifyGoogle(b.idToken);
      if (g.error) return { ok: false, error: g.error };
      const p = await findPerson(db, g.email);
      if (p) {
        if (p.status === 'active') { await log(db, p.email, 'signin'); return bundle(db, p, await newSession(db, p.email)); }
        return { ok: false, status: p.status, email: p.email };
      }
      const r = await lastRequest(db, g.email);
      if (r && r.state === 'waiting') return { ok: false, status: 'waiting', email: g.email };
      if (r && r.state === 'rejected') return { ok: false, status: 'rejected', email: g.email, reason: r.reason };
      return { ok: false, status: 'unknown', email: g.email, name: g.name };
    }
    if (a === 'pin') return pinSignIn(b);
    if (a === 'request') {
      const g = await verifyGoogle(b.idToken);
      if (g.error) return { ok: false, error: g.error };
      if (await findPerson(db, g.email)) return { ok: false, error: 'exists' };
      const name = String(b.name || '').trim().slice(0, 80), why = String(b.why || '').trim().slice(0, 500);
      if (!name || !why) return { ok: false, error: 'need' };
      const r = await lastRequest(db, g.email);
      if (r && r.state === 'waiting') return { ok: true, status: 'waiting' };
      await db('insert into accounts.requests (email, name, title, why) values ($1, $2, $3, $4)', [g.email, name, String(b.title || '').slice(0, 80), why]);
      await log(db, g.email, 'req');
      return { ok: true, status: 'waiting' };
    }

    // everything below needs a session
    const me = await sessionPerson(db, b.token);
    if (!me) return { ok: false, error: 'session' };
    if (a === 'me') {
      const v = await stamp(db);
      if (b.ver && b.ver === v) return { ok: true, same: true, ver: b.ver, me: publicPerson(me) };
      return bundle(db, me);
    }
    // Light answer for other Forka apps (Procurement, Hiring, Boards): who is this and what may they open.
    if (a === 'who') return { ok: true, me: publicPerson(me) };
    if (a === 'signout') { await db('delete from accounts.sessions where token_hash = $1', [tokHash(b.token)]); await log(db, me.email, 'signout'); return { ok: true }; }
    if (a === 'open') { await log(db, me.email, 'open', '', String(b.app || '').slice(0, 40)); return { ok: true }; }
    // For Boards: everyone with an account (active, or "To confirm"), names only - no apps, no sign-in details.
    if (a === 'directory') {
      const list = (await people(db)).filter(p => p.status === 'active' || p.status === 'pending')
        .map(p => ({ email: p.email, name: p.name, title: p.title, ceo: p.level === 'ceo', status: p.status }));
      return { ok: true, people: list };
    }
    // For Boards: a department head invites someone new. They are added as "To confirm" with no apps; the CEO confirms them.
    if (a === 'invite') {
      const email = key(b.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.startsWith('pin-')) return { ok: false, error: 'need' };
      if (await findPerson(db, email)) return { ok: true, exists: true };
      await writePerson(db, { email, name: String(b.name || '').trim().slice(0, 80) || email, title: String(b.title || '').trim().slice(0, 80),
        level: 'staff', status: 'pending', apps: { proc: 0, hire: 0, branch: 0 }, sides: [], method: 'google', pinHash: '',
        addedBy: 'Boards: ' + me.email }, me.email, true);
      await log(db, me.email, 'invite', email, 'Boards');
      return { ok: true };
    }

    // CEO only
    if (!isCeo(me)) return { ok: false, error: 'role' };
    if (a === 'savePerson') return savePerson(db, me, b);
    if (a === 'setStatus') return setStatus(db, me, key(b.id), String(b.status || ''));
    if (a === 'reject') return reject(db, me, key(b.id), String(b.reason || '').slice(0, 300));
    return { ok: false, error: 'action' };
  }

  // PIN tries are counted and locked inside one transaction so parallel guesses cannot slip past the limit.
  async function pinSignIn(b) {
    return tx(async db => {
      const fails = +(await getSetting(db, 'PIN_FAILS')) || 0, until = +(await getSetting(db, 'PIN_LOCK')) || 0;
      if (Date.now() < until) return { ok: false, error: 'locked' };
      const pin = String(b.pin || '').trim();
      const h = /^\d{4,8}$/.test(pin) ? hashPin(await salt(db), pin) : '';
      const p = h ? (await people(db)).find(x => x.method === 'pin' && x.pinHash === h && x.status === 'active') : null;
      if (!p) {
        if (fails + 1 >= MAX_PIN_TRIES) { await setSetting(db, 'PIN_LOCK', Date.now() + 10 * 60 * 1000); await setSetting(db, 'PIN_FAILS', 0); }
        else await setSetting(db, 'PIN_FAILS', fails + 1);
        return { ok: false, error: 'pin' };
      }
      await setSetting(db, 'PIN_FAILS', 0);
      await log(db, p.email, 'signin');
      return bundle(db, p, await newSession(db, p.email));
    }, 'accounts-pin');
  }
}

function cleanPerson(x) {
  const apps = x.apps || {};
  const p = {
    email: key(x.email), name: String(x.name || '').trim().slice(0, 80), title: String(x.title || '').trim().slice(0, 80),
    level: LEVELS.includes(x.level) ? x.level : 'staff', status: STATUSES.includes(x.status) ? x.status : 'pending',
    apps: { proc: apps.proc ? 1 : 0, hire: apps.hire ? 1 : 0, branch: apps.branch ? 1 : 0 },
    sides: (x.sides || []).filter(s => SIDES.includes(s)), method: x.method === 'pin' ? 'pin' : 'google',
  };
  if (!p.apps.proc) p.sides = [];
  return p;
}

async function writePerson(db, p, by, isNew) {
  const v = [p.email, p.name, p.title || '', p.level, p.status, !!p.apps.proc, p.sides || [], !!p.apps.hire, !!p.apps.branch, p.method, p.pinHash || '', p.addedBy || by, by];
  if (isNew) await db(`insert into accounts.people (email, name, title, level, status, app_proc, sides, app_hire, app_branch, method, pin_hash, added_by, updated_by)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, v);
  else await db(`update accounts.people set name=$2, title=$3, level=$4, status=$5, app_proc=$6, sides=$7, app_hire=$8, app_branch=$9, method=$10,
    pin_hash=$11, added_by=$12, updated_by=$13, updated_at=now() where email=$1`, v);
  await bump(db);
}

async function savePerson(db, me, b) {
  const x = cleanPerson(b.person || {}), id = key(b.id);
  const all = await people(db);
  if (!x.name) return { ok: false, error: 'need', fields: ['name'] };
  if (x.method === 'google' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)) return { ok: false, error: 'need', fields: ['email'] };
  if (x.method === 'pin' && !x.email) x.email = 'pin-' + randomUUID().slice(0, 8);
  const old = id ? all.find(p => p.email === id) : null;
  if (!old && all.some(p => p.email === x.email)) return { ok: false, error: 'dupe' };
  if (old) x.email = old.email; // the email of an existing person never changes
  const pin = String((b.person || {}).pinNew || '').trim();
  if (x.method === 'pin') {
    if (pin && !/^\d{4,8}$/.test(pin)) return { ok: false, error: 'pinBad' };
    if (!pin && !(old && old.pinHash)) return { ok: false, error: 'pinBad' };
    if (pin) { const h = hashPin(await salt(db), pin); if (all.some(p => p.pinHash === h && p.email !== x.email)) return { ok: false, error: 'pinDupe' }; x.pinHash = h; }
    else x.pinHash = old.pinHash;
  } else x.pinHash = '';
  if (old && isCeo(old) && !(x.level === 'ceo' && x.status === 'active') && all.filter(isCeo).length < 2) return { ok: false, error: 'lastCeo' };
  x.addedBy = old ? old.addedBy : me.email;
  await writePerson(db, x, me.email, !old);
  if (b.fromReq) {
    const r = (await requests(db)).filter(q2 => q2.email === key(b.fromReq) && q2.state === 'waiting').pop();
    if (r) await db("update accounts.requests set state='approved', decided_by=$2, decided_at=now() where id=$1", [r._id, me.email]);
    await log(db, me.email, 'allow', x.email);
  } else if (!old) await log(db, me.email, 'add', x.email);
  else await log(db, me.email, 'edit', x.email, diff(old, x));
  return bundle(db, await findPerson(db, me.email));
}

function diff(a, b) {
  const out = [];
  if (a.level !== b.level) out.push(a.level + ' > ' + b.level);
  if (a.status !== b.status) out.push(a.status + ' > ' + b.status);
  ['proc', 'hire', 'branch'].forEach(k => { if (!!a.apps[k] !== !!b.apps[k]) out.push((b.apps[k] ? '+ ' : '- ') + k); });
  SIDES.forEach(s => { const x = a.sides.includes(s), y = b.sides.includes(s); if (x !== y) out.push((y ? '+ ' : '- ') + s); });
  if (a.method !== b.method) out.push('sign-in ' + b.method);
  return out.join(', ');
}

async function setStatus(db, me, id, st) {
  if (!STATUSES.includes(st)) return { ok: false, error: 'bad' };
  const all = await people(db), p = all.find(x => x.email === id);
  if (!p) return { ok: false, error: 'missing' };
  if (isCeo(p) && st !== 'active' && all.filter(isCeo).length < 2) return { ok: false, error: 'lastCeo' };
  const raw = (await db('select * from accounts.people where email=$1', [id])).rows[0];
  const was = raw.status;
  await db('update accounts.people set status=$2, updated_by=$3, updated_at=now() where email=$1', [id, st, me.email]);
  await bump(db);
  if (st !== 'active') await db('delete from accounts.sessions where email=$1', [id]); // a blocked person is signed out everywhere at once
  await log(db, me.email, st === 'active' ? (was === 'blocked' ? 'unblock' : 'confirm') : 'block', id);
  return bundle(db, await findPerson(db, me.email));
}

async function reject(db, me, id, reason) {
  const r = (await requests(db)).filter(q2 => q2.email === id && q2.state === 'waiting').pop();
  if (!r) return { ok: false, error: 'missing' };
  await db("update accounts.requests set state='rejected', decided_by=$2, decided_at=now(), note=$3 where id=$1", [r._id, me.email, reason]);
  await log(db, me.email, 'reject', id, reason);
  return bundle(db, await findPerson(db, me.email));
}

// ---------------- first-time setup (same starting people as the Apps Script setup) ----------------
export const SEED = [
  ['ceo@forka.com', 'Khaled Alamer', 'CEO', 'ceo', 'active', true, 'plan,ops,fin,dept,ceo', true, true],
  ['abu.ali@forka.com', 'Mohammad Abu Ali', 'Operations Manager', 'manager', 'pending', true, 'ops', true, true],
  ['mohammed@kuwaitikitchen.com', 'Mohammed Abdelrahman', 'Purchasing', 'staff', 'pending', true, 'plan', false, false],
  ['store@kuwaitikitchen.com', 'Hamim', 'Store / Purchasing', 'staff', 'pending', true, 'plan', false, false],
  ['arman@kuwaitikitchen.com', 'Arman', 'Operations', 'staff', 'pending', true, 'ops', false, false],
  ['tahani@forka.com', 'Tahani Alamer', '', 'manager', 'pending', true, 'dept', true, true],
  ['jennifer@forka.com', 'Jennifer Tudara', 'HR', 'manager', 'pending', false, '', true, false],
  ['admin@forka.com', 'Ruby Ann Margate', 'Admin', 'staff', 'pending', true, 'dept', true, false],
  ['hr@kuwaitikitchen.com', 'HR Officer (Kuwaiti Kitchen)', 'HR', 'staff', 'pending', false, '', true, false],
  ['operations@kuwaitikitchen.com', 'Operations (Kuwaiti Kitchen)', 'Operations', 'staff', 'pending', true, 'ops', false, true],
];
export async function seedIfEmpty() {
  const n = +(await q('select count(*) from accounts.people')).rows[0].count;
  if (n) return false;
  for (const s of SEED) await q(`insert into accounts.people (email, name, title, level, status, app_proc, sides, app_hire, app_branch, method, added_by, updated_by)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'google','Setup','Setup')`, [s[0], s[1], s[2], s[3], s[4], s[5], s[6] ? s[6].split(',') : [], s[7], s[8]]);
  return true;
}

// ---------------- for other apps on this server (Boards) ----------------
export async function whoByToken(tok) {
  const p = await sessionPerson(q, tok);
  return p ? publicPerson(p) : null;
}
export async function directory() {
  return (await people(q)).filter(p => p.status === 'active' || p.status === 'pending')
    .map(p => ({ email: p.email, name: p.name, title: p.title, ceo: p.level === 'ceo', status: p.status }));
}
export async function inviteFrom(byEmail, email, name, title) {
  email = key(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.startsWith('pin-')) return false;
  return tx(async db => {
    if (await findPerson(db, email)) return false;
    await writePerson(db, { email, name: String(name || '').trim().slice(0, 80) || email, title: String(title || '').trim().slice(0, 80),
      level: 'staff', status: 'pending', apps: { proc: 0, hire: 0, branch: 0 }, sides: [], method: 'google', pinHash: '',
      addedBy: 'Boards: ' + byEmail }, byEmail, true);
    await log(db, byEmail, 'invite', email, 'Boards');
    return true;
  }, 'accounts');
}
