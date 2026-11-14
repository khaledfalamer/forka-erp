// Demo mode only: a stand-in for the accounts server with made-up people, kept in this browser.
// It follows the same rules as platform/src/accounts.js so the screens behave the same in tests.
import type { AccessRequest, ActivityItem, Answer, Person } from './types';
import { SIDES } from './types';
import { ceoAll, isCeo, key, validEmail } from './people';

interface Db { people: Person[]; pins: Record<string, string>; requests: AccessRequest[]; activity: ActivityItem[]; sessions: Record<string, string>; ver: string }

const SEED: Omit<Person, 'method'>[] = [
  { email: 'ceo@forka.com', name: 'Khaled Alamer', title: 'CEO', level: 'ceo', status: 'active', apps: { proc: 1, hire: 1, branch: 1 }, sides: ['plan', 'ops', 'fin', 'dept', 'ceo'] },
  { email: 'ops.manager@example.com', name: 'Sample Manager', title: 'Operations Manager', level: 'manager', status: 'pending', apps: { proc: 1, hire: 1, branch: 1 }, sides: ['ops'] },
  { email: 'buyer@example.com', name: 'Sample Buyer', title: 'Purchasing', level: 'staff', status: 'active', apps: { proc: 1, hire: 0, branch: 0 }, sides: ['plan'] },
  { email: 'hr@example.com', name: 'Sample HR', title: 'HR', level: 'manager', status: 'active', apps: { proc: 0, hire: 1, branch: 0 }, sides: [] },
];

const STORE = 'fa-demo';
const now = () => new Date().toISOString();
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function load(): Db {
  try { const s = localStorage.getItem(STORE); if (s) return JSON.parse(s) as Db; } catch { /* ignore */ }
  const db: Db = { people: SEED.map(p => ({ ...p, method: 'google' })), pins: {}, requests: [], activity: [], sessions: {}, ver: rid() };
  db.people.push({ email: 'pin-store', name: 'Sample Store Keeper', title: 'Store', level: 'staff', status: 'active', apps: { proc: 1, hire: 0, branch: 0 }, sides: ['ops'], method: 'pin', hasPin: true });
  db.pins['pin-store'] = '4321';
  return db;
}
const save = (db: Db) => { db.ver = rid(); try { localStorage.setItem(STORE, JSON.stringify(db)); } catch { /* ignore */ } };
const log = (db: Db, by: string, verb: string, target = '', extra = '') => db.activity.unshift({ at: now(), by, verb, target, extra });

function bundle(db: Db, me: Person, token?: string): Answer {
  const o: Answer = { ok: true, me: ceoAll(me), ver: db.ver };
  if (token) o.token = token;
  if (isCeo(me)) { o.people = db.people.map(ceoAll); o.requests = db.requests.slice(); o.activity = db.activity.slice(0, 300); }
  return o;
}
function session(db: Db, email: string) { const t = rid() + rid(); db.sessions[t] = email; return t; }

export async function demoServer(b: Record<string, unknown>): Promise<Answer> {
  await new Promise(r => setTimeout(r, 120));
  const db = load();
  const a = String(b.action || '');
  const find = (e: string) => db.people.find(p => p.email === key(e));
  if (a === 'google') {
    const email = key(b.demoEmail);
    if (!validEmail(email)) return { ok: false, error: 'badMail' };
    const p = find(email);
    if (p) {
      if (p.status === 'active') { log(db, p.email, 'signin'); const t = session(db, p.email); save(db); return bundle(db, p, t); }
      return { ok: false, status: p.status, email };
    }
    const r = db.requests.filter(x => x.email === email).pop();
    if (r?.state === 'waiting') return { ok: false, status: 'waiting', email };
    if (r?.state === 'rejected') return { ok: false, status: 'rejected', email, reason: r.reason };
    return { ok: false, status: 'unknown', email, name: '' };
  }
  if (a === 'pin') {
    const pin = String(b.pin || '').trim();
    const id = Object.keys(db.pins).find(k => db.pins[k] === pin);
    const p = id ? find(id) : undefined;
    if (!p || p.status !== 'active' || p.method !== 'pin') return { ok: false, error: 'pin' };
    log(db, p.email, 'signin'); const t = session(db, p.email); save(db); return bundle(db, p, t);
  }
  if (a === 'request') {
    const email = key(b.demoEmail), name = String(b.name || '').trim(), why = String(b.why || '').trim();
    if (!name || !why) return { ok: false, error: 'need' };
    db.requests.push({ email, name, title: String(b.title || ''), why, at: now(), state: 'waiting' });
    log(db, email, 'req'); save(db); return { ok: true, status: 'waiting' };
  }
  const me = find(db.sessions[String(b.token || '')] || '');
  if (!me || me.status !== 'active') return { ok: false, error: 'session' };
  if (a === 'me') return b.ver && b.ver === db.ver ? { ok: true, same: true, ver: db.ver, me: ceoAll(me) } : bundle(db, me);
  if (a === 'signout') { delete db.sessions[String(b.token)]; log(db, me.email, 'signout'); save(db); return { ok: true }; }
  if (a === 'open') { log(db, me.email, 'open', '', String(b.app || '')); save(db); return { ok: true }; }
  if (!isCeo(me)) return { ok: false, error: 'role' };
  if (a === 'savePerson') {
    const x = b.person as Person & { pinNew?: string }; const id = key(b.id);
    const p: Person = { email: key(x.email), name: String(x.name || '').trim(), title: String(x.title || '').trim(), level: x.level, status: x.status,
      apps: { proc: x.apps.proc ? 1 : 0, hire: x.apps.hire ? 1 : 0, branch: x.apps.branch ? 1 : 0 }, sides: SIDES.filter(s => x.sides.includes(s)), method: x.method };
    if (!p.apps.proc) p.sides = [];
    if (!p.name) return { ok: false, error: 'need', fields: ['name'] };
    if (p.method === 'google' && !validEmail(p.email)) return { ok: false, error: 'need', fields: ['email'] };
    if (p.method === 'pin' && !p.email) p.email = 'pin-' + rid();
    const old = id ? find(id) : undefined;
    if (!old && find(p.email)) return { ok: false, error: 'dupe' };
    if (old) p.email = old.email;
    const pin = String(x.pinNew || '').trim();
    if (p.method === 'pin') {
      if (pin && !/^\d{4,8}$/.test(pin)) return { ok: false, error: 'pinBad' };
      if (!pin && !db.pins[p.email]) return { ok: false, error: 'pinBad' };
      if (pin && Object.entries(db.pins).some(([k, v]) => v === pin && k !== p.email)) return { ok: false, error: 'pinDupe' };
      if (pin) db.pins[p.email] = pin;
      p.hasPin = true;
    } else delete db.pins[p.email];
    if (old && isCeo(old) && !(p.level === 'ceo' && p.status === 'active') && db.people.filter(isCeo).length < 2) return { ok: false, error: 'lastCeo' };
    if (old) Object.assign(old, p); else db.people.push(p);
    if (b.fromReq) { const r = db.requests.filter(q => q.email === key(b.fromReq) && q.state === 'waiting').pop(); if (r) r.state = 'approved'; log(db, me.email, 'allow', p.email); }
    else log(db, me.email, old ? 'edit' : 'add', p.email);
    save(db); return bundle(db, find(me.email)!);
  }
  if (a === 'setStatus') {
    const p = find(String(b.id)); const st = String(b.status) as Person['status'];
    if (!p) return { ok: false, error: 'missing' };
    if (isCeo(p) && st !== 'active' && db.people.filter(isCeo).length < 2) return { ok: false, error: 'lastCeo' };
    const was = p.status; p.status = st;
    log(db, me.email, st === 'active' ? (was === 'blocked' ? 'unblock' : 'confirm') : 'block', p.email);
    save(db); return bundle(db, find(me.email)!);
  }
  if (a === 'reject') {
    const r = db.requests.filter(q => q.email === key(b.id) && q.state === 'waiting').pop();
    if (!r) return { ok: false, error: 'missing' };
    r.state = 'rejected'; r.reason = String(b.reason || ''); log(db, me.email, 'reject', r.email, r.reason);
    save(db); return bundle(db, find(me.email)!);
  }
  return { ok: false, error: 'action' };
}
