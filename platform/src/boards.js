// Forka Boards (erp.forka.com/boards). Port of server/Boards.gs to PostgreSQL: same requests, same answers, same rules
// for who sees and changes what. Every board, list, card, message and goal is one row in boards.docs.
// Faster than Apps Script: the rows are kept in memory and re-read only when something changed, so a refresh
// (and the chat) costs one tiny query.
import { randomUUID } from 'node:crypto';
import { q, tx } from './db.js';
import { whoByToken, directory, inviteFrom } from './accounts.js';
import { putFile, getFile } from './files.js';

const APP_URL = 'https://erp.forka.com/boards/';
const KINDS = ['board', 'list', 'card', 'goal', 'port', 'msg', 'note', 'user', 'prof', 'member', 'cap', 'tpl', 'ctpl', 'space'];
const DELETABLE = ['board', 'list', 'card', 'goal', 'port', 'tpl', 'ctpl', 'space'];
const DEPTS = ['adm', 'ops', 'mkt', 'proc', 'fin', 'hr', 'mnt', 'dev', 'oman'];
const EMAIL_KINDS = { assign: 'gave you a task', mention: 'mentioned you', req: 'sent a request to your department', done: 'finished your request', subassign: 'gave you a subtask',
  unblocked: 'a task you were waiting for is done', ap_approved: 'approved', ap_changes: 'asked for changes', ap_rejected: 'rejected', chat: 'mentioned you in a chat' };
const MAX_JSON = 45000;
const MAX_FILE = 5 * 1024 * 1024;
const key = e => String(e || '').trim().toLowerCase();
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------------- the data, kept in memory ----------------
const rowToDoc = r => ({ id: r.id, kind: r.kind, scope: r.scope, json: r.json, at: Number(r.at), by: r.by_, del: r.del });
let cache = null; // { stamp, all }
async function readAll(db = q) { const out = {}; (await db('select * from boards.docs')).rows.forEach(r => { out[r.id] = rowToDoc(r); }); return out; }
async function allCached() {
  const s = (await q('select coalesce(max(at),0)::text || \':\' || count(*) as s from boards.docs')).rows[0].s;
  if (!cache || cache.stamp !== s) cache = { stamp: s, all: await readAll() };
  return cache.all;
}
async function writeDoc(db, d) {
  await db(`insert into boards.docs (id, kind, scope, json, at, by_, del) values ($1,$2,$3,$4,$5,$6,$7)
    on conflict (id) do update set kind=excluded.kind, scope=excluded.scope, json=excluded.json, at=excluded.at, by_=excluded.by_, del=excluded.del`,
  [d.id, d.kind, d.scope, d.del ? null : JSON.stringify(d.json), d.at, d.by, d.del]);
}

// ---------------- who may see and change what (same rules as Boards.gs) ----------------
function depts(m) { if (!m) return {}; if (m.depts && typeof m.depts === 'object') return m.depts; return m.dept ? { [m.dept]: m.role === 'head' ? 'head' : 'staff' } : {}; }
function deptOk(x, id) { return DEPTS.includes(id) || (!!x.all['space:' + id] && !x.all['space:' + id].del); }
function ctx(me, all) {
  const mem = {};
  Object.values(all).forEach(d => { if (d.kind === 'member' && !d.del && d.json) mem[d.scope] = d.json; });
  const x = { me: me.email, ceo: !!me.ceo, depts: depts(mem[me.email]), mem, all, bol: {}, mine: {} };
  Object.values(all).forEach(d => { if (d.kind === 'board' && !d.del && d.json) (d.json.lists || []).forEach(l => { x.bol[l] = d; }); });
  Object.values(all).forEach(d => { if (d.kind === 'card' && !d.del && d.json && cardMine(x, d.json)) x.mine[d.json.l] = true; });
  return x;
}
const headOf = (x, dep) => x.ceo || x.depts[dep] === 'head';
const headAny = x => Object.keys(x.depts).some(k => x.depts[k] === 'head');
function boardOk(x, b) {
  if (!b) return false;
  return x.ceo || headOf(x, b.dept) || (b.members || []).includes(x.me) || (!!b.allDept && !!x.depts[b.dept]);
}
function cardMine(x, c) { return !!c && (c.requester === x.me || (c.members || []).includes(x.me) || (c.follow || []).includes(x.me)); }
const boardOfList = (x, lid) => x.bol[lid] || null;
function chanOk(x, k) { return k === 'all' || (k.indexOf('dm:') === 0 ? k.slice(3).split('|').includes(x.me) : x.ceo || !!x.depts[k]); }
function visible(x, d) {
  const j = d.json || {};
  switch (d.kind) {
    case 'board': return boardOk(x, j) || (j.lists || []).some(l => x.mine[l]);
    case 'list': { const b = boardOfList(x, d.id); return (b && boardOk(x, b.json)) || (j.cards || []).some(id => { const c = x.all[id]; return c && !c.del && cardMine(x, c.json); }); }
    case 'card': { const b = boardOfList(x, j.l); return (b && boardOk(x, b.json)) || cardMine(x, j); }
    case 'goal': return x.ceo || j.lvl === 'company' || !!x.depts[j.lvl];
    case 'port': return x.ceo || j.owner === x.me;
    case 'msg': return chanOk(x, d.scope);
    case 'note': case 'user': return d.scope === x.me;
    default: return true; // prof, member, cap, tpl, ctpl
  }
}
function mayWrite(x, d, old) {
  const j = d.json || {}, o = old && !old.del ? old.json || {} : null;
  switch (d.kind) {
    case 'board':
      if (!o) return j.kind === 'requests' ? deptOk(x, j.dept) : headOf(x, j.dept) && deptOk(x, j.dept);
      return headOf(x, o.dept) && (d.del || j.dept === o.dept || x.ceo);
    case 'list': {
      const b = boardOfList(x, d.id);
      if (!b) return !o;
      return boardOk(x, b.json) || b.json.kind === 'requests' || (!!o && (o.cards || []).some(id => { const c = x.all[id]; return c && cardMine(x, c.json); }));
    }
    case 'card': {
      if (o && (boardOk(x, (boardOfList(x, o.l) || {}).json) || cardMine(x, o))) return true;
      const b = boardOfList(x, j.l);
      return !o && (!b || boardOk(x, b.json) || b.json.kind === 'requests');
    }
    case 'goal': { const lv = o ? o.lvl : j.lvl; return x.ceo || (lv !== 'company' && lv === j.lvl && headOf(x, lv)); }
    case 'port': return x.ceo || ((o ? o.owner : j.owner) === x.me && j.owner === x.me);
    case 'msg': return !o && j.by === x.me && chanOk(x, d.scope);
    case 'note': return o ? d.scope === x.me : j.by === x.me;
    case 'user': return d.scope === x.me;
    case 'prof': return d.scope === x.me || x.ceo;
    case 'cap': { const m = depts(x.mem[d.scope]); return x.ceo || Object.keys(m).some(k => headOf(x, k)); }
    case 'member': {
      if (x.ceo) return true;
      const was = depts(o), now = depts(j), keys = Object.keys(Object.assign({}, was, now));
      return keys.every(k => {
        if (was[k] === now[k]) return true;
        const sp = x.all['space:' + k];
        if (d.scope === x.me && now[k] === 'head' && !was[k] && sp && !sp.del && sp.by === x.me) return true;
        if (was[k] === 'head' || now[k] === 'head') return false;
        return headOf(x, k) && (!now[k] || now[k] === 'staff');
      });
    }
    case 'space': return o ? (x.ceo || headOf(x, d.id.slice(6))) && (!d.del || x.ceo) : (x.ceo || headAny(x)) && d.id === 'space:' + j.id && /^[a-z0-9]{3,30}$/.test(String(j.id)) && !DEPTS.includes(j.id);
    case 'tpl': case 'ctpl': return !o || old.by === x.me || x.ceo;
  }
  return false;
}
function scopeOf(kind, id, j) {
  if (kind === 'msg') return String(j.k || '');
  if (kind === 'note') return key(j.to);
  if (kind === 'user' || kind === 'prof' || kind === 'member' || kind === 'cap') return key(id.split(':').slice(1).join(':'));
  if (kind === 'board') return String(j.dept || '');
  return '';
}

// ---------------- API ----------------
export function makeBoards({ mailer = defaultMailer } = {}) {
  return async function handle(b) {
    const a = String(b?.action || '');
    if (a === 'importFile') return importFile(b);            // one-time copy of the old Drive files (needs the bridge key)
    const who = await whoByToken(b.token);
    if (!who || who.status !== 'active') return { ok: false, error: 'session' };
    const me = { email: who.email, name: who.name, ceo: who.level === 'ceo' };
    if (a === 'save') return save(me, b.docs || [], mailer);
    const x = ctx(me, await allCached());
    if (a === 'load') return load(x, +b.since || 0);
    if (a === 'upload') return upload(x, b);
    if (a === 'file') return file(x, String(b.id || ''));
    return { ok: false, error: 'action' };
  };
}

async function load(x, since) {
  const docs = [];
  Object.values(x.all).forEach(d => {
    if (since && d.at < since - 5000) return; // a 5-second overlap, so a change saved during a refresh is never missed
    if (d.del) { if (since) docs.push({ id: d.id, kind: d.kind, del: true, at: d.at }); return; }
    if (visible(x, d)) docs.push({ id: d.id, kind: d.kind, json: d.json, at: d.at, by: d.by });
  });
  const o = { ok: true, now: Date.now(), docs, me: { email: x.me, ceo: x.ceo, depts: x.depts } };
  if (!since) o.people = (await directory()).map(p => ({ email: p.email, name: p.name, title: p.title, ceo: p.ceo, invited: p.status === 'pending' }));
  return o;
}

async function save(me, docs, mailer) {
  if (!Array.isArray(docs) || docs.length > 400) return { ok: false, error: 'bad' };
  const invites = [], mails = [];
  let result;
  try {
    result = await tx(async db => {
      const x = ctx(me, await readAll(db)), now = Date.now(), bad = [];
      const rank = k => ({ space: 0, member: 1, board: 2, list: 3 })[k] ?? 4;
      docs = docs.slice().sort((p1, p2) => rank(p1.kind) - rank(p2.kind));
      for (const n of docs) {
        const id = String(n.id || '').slice(0, 120), kind = String(n.kind || '');
        if (!id || !KINDS.includes(kind)) { bad.push(id); continue; }
        const old = x.all[id] || null, del = !!n.del;
        if (old && old.kind !== kind) { bad.push(id); continue; }
        if (del && !DELETABLE.includes(kind)) { bad.push(id); continue; }
        const json = del ? (old ? old.json : null) : n.json;
        if (!del && (json === null || typeof json !== 'object')) { bad.push(id); continue; }
        if (!del && JSON.stringify(json).length > MAX_JSON) { bad.push(id); continue; }
        const d = { id, kind, scope: del && old ? old.scope : scopeOf(kind, id, json || {}), json, at: now, by: x.me, del };
        if (!mayWrite(x, d, old)) { bad.push(id); continue; }
        await writeDoc(db, d);
        x.all[id] = d;
        if (kind === 'board' && !del) (json.lists || []).forEach(l => { x.bol[l] = d; });
        if (kind === 'member') { x.mem[d.scope] = json; if (d.scope === x.me) x.depts = depts(json); }
        if (kind === 'card' && !del && cardMine(x, json)) x.mine[json.l] = true;
        if (kind === 'member' && json && json.inv && !old) invites.push([d.scope, json.inv]);
        if (kind === 'note' && !old && json && EMAIL_KINDS[json.k]) mails.push(json);
      }
      return { ok: true, now, rejected: bad, x };
    }, 'boards');
  } finally { cache = null; }
  const x = result.x; delete result.x;
  // after the save is safe: invites go to Forka Apps as "To confirm", alerts go out by email (never slow down the answer)
  for (const [email, inv] of invites) await inviteFrom(me.email, email, inv.name, inv.title).catch(() => {});
  if (mails.length) emailNotes(x, mails, mailer).catch(() => {});
  return result;
}

async function emailNotes(x, notes, mailer) {
  const names = {}; (await directory()).forEach(p => { names[p.email] = p.name || p.email; });
  const out = [];
  for (const n of notes) {
    const to = key(n.to);
    if (!to || to === x.me) continue;
    const u = x.all['user:' + to];
    if (u && !u.del && u.json && u.json.emailOff) continue;
    const card = n.card && x.all[n.card] && x.all[n.card].json, title = card ? card.title : '';
    const who = names[x.me] || x.me, what = EMAIL_KINDS[n.k];
    const link = APP_URL + (n.card ? '#card=' + encodeURIComponent(n.card) : n.ch ? '#chat=' + encodeURIComponent(n.ch) : '');
    out.push({ to, subject: 'Forka Boards: ' + who + ' ' + what + (title ? ' - ' + title : ''), name: 'Forka Boards',
      htmlBody: '<p>' + esc(who) + ' ' + esc(what) + (title ? ': <b>' + esc(title) + '</b>' : '') + '.</p><p><a href="' + link + '">Open in Forka Boards</a></p>' +
        '<p style="color:#888;font-size:12px">You can turn these emails off in Forka Boards (the bell, "Also email me").</p>' });
  }
  if (out.length) await mailer(out);
}

// Emails still leave through the old Boards Apps Script (it has the Gmail permission): it accepts only calls with the bridge key.
async function defaultMailer(mails) {
  const url = process.env.BOARDS_MAIL_URL, k = process.env.BRIDGE_KEY;
  if (!url || !k) return;
  await fetch(url, { method: 'POST', redirect: 'follow', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ action: 'bridgeMail', key: k, mails }) });
}

// ---------------- files (private; only people who can see the card can open them) ----------------
function cardVisible(x, cid) { const c = x.all[cid]; return !!c && !c.del && c.kind === 'card' && visible(x, c); }
async function upload(x, b) {
  const cid = String(b.card || '');
  if (!cardVisible(x, cid)) return { ok: false, error: 'role' };
  const bytes = Buffer.from(String(b.data || ''), 'base64');
  if (!bytes.length || bytes.length > MAX_FILE) return { ok: false, error: 'size' };
  const type = /^[\w.+-]+\/[\w.+-]+$/.test(String(b.type || '')) ? String(b.type) : 'application/octet-stream';
  const id = randomUUID();
  await putFile('boards/g/' + id, bytes, type, { card: cid, name: String(b.name || 'file').slice(0, 120) });
  return { ok: true, id: 'g:' + id };
}
async function file(x, id) {
  let name;
  if (/^g:[0-9a-f-]{36}$/.test(id)) name = 'boards/g/' + id.slice(2);          // uploaded on the new server
  else if (/^d:[A-Za-z0-9_-]{10,200}$/.test(id)) name = 'boards/d/' + id.slice(2); // copied from the old Drive folder
  else return { ok: false, error: 'bad' };
  const f = await getFile(name);
  if (!f) return { ok: false, error: 'gone' };
  if (!cardVisible(x, String(f.meta.card || ''))) return { ok: false, error: 'role' };
  return { ok: true, type: f.type, data: Buffer.from(f.bytes).toString('base64') };
}
async function importFile(b) {
  const k = process.env.BRIDGE_KEY;
  if (!k || String(b.key || '') !== k) return { ok: false, error: 'role' };
  const id = String(b.id || '');
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) return { ok: false, error: 'bad' };
  const bytes = Buffer.from(String(b.data || ''), 'base64');
  if (!bytes.length || bytes.length > MAX_FILE) return { ok: false, error: 'size' };
  await putFile('boards/d/' + id, bytes, String(b.type || 'application/octet-stream'), { card: String(b.card || ''), name: String(b.name || '').slice(0, 120) });
  return { ok: true };
}
