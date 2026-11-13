/**
 * Forka Boards - server (erp.forka.com/boards)
 * People sign in at erp.forka.com (Forka Apps). This script asks the Forka Apps accounts server who they are,
 * keeps every board, list, card, message and goal as one row in the "Data" tab, and sends each person only
 * what they may see. Files go to a private Google Drive folder. Alerts are also emailed.
 *
 * INSTALL (once):
 *  1. Make a new Google Sheet called "Forka Boards". Extensions > Apps Script. Name the project "Forka Boards server".
 *  2. Replace Code.gs with this file. Save.
 *  3. Choose the function  setup  and press Run. Approve the permissions (Sheets, Drive, email, connect to Forka Apps).
 *  4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone. Copy the /exec address.
 *     (Only this first time "New deployment". Later updates: Deploy > Manage deployments > pencil > New version.)
 *  5. The /exec address goes into config.js as BOARDS_URL.
 * Nothing secret is in this file.
 */
const ACCOUNTS_URL = 'https://forka-apps-443945615318.me-central1.run.app/accounts';
const APP_URL = 'https://erp.forka.com/boards/';
const DATA_TAB = 'Data';
const D_HEAD = ['Id', 'Kind', 'Scope', 'Json', 'At', 'By', 'Deleted'];
const KINDS = ['board', 'list', 'card', 'goal', 'port', 'msg', 'note', 'user', 'prof', 'member', 'cap', 'tpl', 'ctpl', 'space'];
const DELETABLE = ['board', 'list', 'card', 'goal', 'port', 'tpl', 'ctpl', 'space'];
const DEPTS = ['adm', 'ops', 'mkt', 'proc', 'fin', 'hr', 'mnt', 'dev', 'oman'];
const EMAIL_KINDS = { assign: 'gave you a task', mention: 'mentioned you', req: 'sent a request to your department', done: 'finished your request', subassign: 'gave you a subtask',
  unblocked: 'a task you were waiting for is done', ap_approved: 'approved', ap_changes: 'asked for changes', ap_rejected: 'rejected', chat: 'mentioned you in a chat' };
const BOARD_KICK = { assign: 'New task', mention: 'You were mentioned', req: 'New request', done: 'Request finished', subassign: 'New subtask',
  unblocked: 'Ready to start', ap_approved: 'Approved', ap_changes: 'Changes asked', ap_rejected: 'Not approved', chat: 'Chat' };
const MAX_JSON = 45000;          // one cell holds 50,000 characters
const MAX_FILE = 5 * 1024 * 1024;

function props_() { return PropertiesService.getScriptProperties(); }
function ss_() { return SpreadsheetApp.getActive(); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function key_(e) { return String(e || '').trim().toLowerCase(); }
function tab_(name, head) {
  let sh = ss_().getSheetByName(name);
  if (!sh) { sh = ss_().insertSheet(name); sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}

function setup() {
  tab_(DATA_TAB, D_HEAD);
  folder_();
  UrlFetchApp.fetch(ACCOUNTS_URL, { muteHttpExceptions: true });   // asks for the "connect to Forka Apps" permission now
  MailApp.getRemainingDailyQuota();
  return 'Done. Now Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).';
}
function folder_() {
  const id = props_().getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Forka Boards files (private)');
  props_().setProperty('FOLDER_ID', f.getId());
  return f;
}

/* ---------------- who is this ---------------- */
function erpWho_(tok) {
  tok = String(tok || '');
  if (!/^[A-Za-z0-9-]{20,120}$/.test(tok)) return null;
  const c = CacheService.getScriptCache(), k = 'erp:' + tok, hit = c.get(k);
  if (hit) return JSON.parse(hit);
  const r = UrlFetchApp.fetch(ACCOUNTS_URL, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: 'who', token: tok }), muteHttpExceptions: true, followRedirects: true });
  let j; try { j = JSON.parse(r.getContentText()); } catch (e) { return null; }
  if (!j.ok || !j.me) return null;
  const me = { email: key_(j.me.email), name: j.me.name || '', ceo: j.me.level === 'ceo' && (j.me.status || 'active') === 'active' };
  c.put(k, JSON.stringify(me), 300);
  return me;
}
/* Everyone with a Forka Apps account (active, or "To confirm" for people a head invited), asked from the accounts server
   with the signed-in person's own session. Kept for 5 minutes. */
function accounts_(tok) {
  const c = CacheService.getScriptCache(), hit = c.get('acc:v2');
  if (hit) { try { return JSON.parse(hit); } catch (e) {} }
  if (!tok) return [];
  const r = UrlFetchApp.fetch(ACCOUNTS_URL, { method: 'post', contentType: 'text/plain', payload: JSON.stringify({ action: 'directory', token: tok }), muteHttpExceptions: true, followRedirects: true });
  let j; try { j = JSON.parse(r.getContentText()); } catch (e) { return []; }
  if (!j.ok || !j.people) return [];
  const all = j.people.map(p => ({ email: key_(p.email), name: String(p.name || ''), title: String(p.title || ''), ceo: !!p.ceo, status: String(p.status || '') }))
    .filter(p => p.email && (p.status === 'active' || p.status === 'pending'));
  try { c.put('acc:v2', JSON.stringify(all), 300); } catch (e) {}
  return all;
}

/* ---------------- the data: one row per thing ---------------- */
function readAll_() {
  const sh = tab_(DATA_TAB, D_HEAD), n = sh.getLastRow() - 1, out = {};
  if (n < 1) return out;
  sh.getRange(2, 1, n, D_HEAD.length).getValues().forEach((r, i) => {
    const id = String(r[0]); if (!id) return;
    let j = null; try { j = JSON.parse(String(r[3] || 'null')); } catch (e) {}
    out[id] = { id, kind: String(r[1]), scope: String(r[2]), json: j, at: +r[4] || 0, by: String(r[5]), del: r[6] === true || String(r[6]).toUpperCase() === 'TRUE', _row: i + 2 };
  });
  return out;
}
function writeRow_(sh, d) {
  const row = [d.id, d.kind, d.scope, d.del ? '' : JSON.stringify(d.json), d.at, d.by, d.del ? true : ''];
  if (d._row) sh.getRange(d._row, 1, 1, D_HEAD.length).setValues([row]);
  else { sh.appendRow(row); d._row = sh.getLastRow(); }
}

/* ---------------- who may see and change what ---------------- */
/* A person can be in several departments, with a role in each: { ops: 'staff', mkt: 'head' }. Older rows had one dept + role. */
function depts_(m) { if (!m) return {}; if (m.depts && typeof m.depts === 'object') return m.depts; return m.dept ? { [m.dept]: m.role === 'head' ? 'head' : 'staff' } : {}; }
function deptOk_(x, id) { return DEPTS.indexOf(id) >= 0 || (!!x.all['space:' + id] && !x.all['space:' + id].del); }
function ctx_(me, all) {
  const mem = {};
  Object.values(all).forEach(d => { if (d.kind === 'member' && !d.del && d.json) mem[d.scope] = d.json; });
  const x = { me: me.email, ceo: !!me.ceo, depts: depts_(mem[me.email]), mem, all, bol: {}, mine: {} };
  Object.values(all).forEach(d => { if (d.kind === 'board' && !d.del && d.json) (d.json.lists || []).forEach(l => { x.bol[l] = d; }); });
  Object.values(all).forEach(d => { if (d.kind === 'card' && !d.del && d.json && cardMine_(x, d.json)) x.mine[d.json.l] = true; });
  return x;
}
const headOf_ = (x, dep) => x.ceo || x.depts[dep] === 'head';
const headAny_ = x => Object.keys(x.depts).some(k => x.depts[k] === 'head');
function boardOk_(x, b) {
  if (!b) return false;
  return x.ceo || headOf_(x, b.dept) || (b.members || []).indexOf(x.me) >= 0 || (!!b.allDept && !!x.depts[b.dept]);
}
function cardMine_(x, c) { return !!c && (c.requester === x.me || (c.members || []).indexOf(x.me) >= 0 || (c.follow || []).indexOf(x.me) >= 0); }
function boardOfList_(x, lid) { return x.bol[lid] || null; }
function chanOk_(x, k) { return k === 'all' || (k.indexOf('dm:') === 0 ? k.slice(3).split('|').indexOf(x.me) >= 0 : x.ceo || !!x.depts[k]); }
function visible_(x, d) {
  const j = d.json || {};
  switch (d.kind) {
    case 'board': return boardOk_(x, j) || (j.lists || []).some(l => x.mine[l]);
    case 'list': { const b = boardOfList_(x, d.id); return (b && boardOk_(x, b.json)) || (j.cards || []).some(id => { const c = x.all[id]; return c && !c.del && cardMine_(x, c.json); }); }
    case 'card': { const b = boardOfList_(x, j.l); return (b && boardOk_(x, b.json)) || cardMine_(x, j); }
    case 'goal': return x.ceo || j.lvl === 'company' || !!x.depts[j.lvl];
    case 'port': return x.ceo || j.owner === x.me;
    case 'msg': return chanOk_(x, d.scope);
    case 'note': case 'user': return d.scope === x.me;
    default: return true;   // prof, member, cap, tpl, ctpl
  }
}
function mayWrite_(x, d, old) {
  const j = d.json || {}, o = old && !old.del ? old.json || {} : null;
  switch (d.kind) {
    case 'board':
      if (!o) return j.kind === 'requests' ? deptOk_(x, j.dept) : headOf_(x, j.dept) && deptOk_(x, j.dept);
      return headOf_(x, o.dept) && (d.del || j.dept === o.dept || x.ceo);
    case 'list': {
      const b = boardOfList_(x, d.id);
      if (!b) return !o;                                     // a new list, saved together with its board
      return boardOk_(x, b.json) || b.json.kind === 'requests' || (!!o && (o.cards || []).some(id => { const c = x.all[id]; return c && cardMine_(x, c.json); }));
    }
    case 'card': {
      if (o && (boardOk_(x, (boardOfList_(x, o.l) || {}).json) || cardMine_(x, o))) return true;
      const b = boardOfList_(x, j.l);
      return !o && (!b || boardOk_(x, b.json) || b.json.kind === 'requests');
    }
    case 'goal': { const lv = o ? o.lvl : j.lvl; return x.ceo || (lv !== 'company' && lv === j.lvl && headOf_(x, lv)); }
    case 'port': return x.ceo || ((o ? o.owner : j.owner) === x.me && j.owner === x.me);
    case 'msg': return !o && j.by === x.me && chanOk_(x, d.scope);
    case 'note': return o ? d.scope === x.me : j.by === x.me;
    case 'user': return d.scope === x.me;
    case 'prof': return d.scope === x.me || x.ceo;
    case 'cap': { const m = depts_(x.mem[d.scope]); return x.ceo || Object.keys(m).some(k => headOf_(x, k)); }
    case 'member': {
      if (x.ceo) return true;
      /* Heads add or remove staff in the departments they lead. Only the CEO makes someone a head,
         except that whoever creates a space becomes its head. */
      const was = depts_(o), now = depts_(j), keys = Object.keys(Object.assign({}, was, now));
      return keys.every(k => {
        if (was[k] === now[k]) return true;
        const sp = x.all['space:' + k];
        if (d.scope === x.me && now[k] === 'head' && !was[k] && sp && !sp.del && sp.by === x.me) return true;
        if (was[k] === 'head' || now[k] === 'head') return false;
        return headOf_(x, k) && (!now[k] || now[k] === 'staff');
      });
    }
    case 'space': return o ? (x.ceo || headOf_(x, d.id.slice(6))) && (!d.del || x.ceo) : (x.ceo || headAny_(x)) && d.id === 'space:' + j.id && /^[a-z0-9]{3,30}$/.test(String(j.id)) && DEPTS.indexOf(j.id) < 0;
    case 'tpl': case 'ctpl': return !o || old.by === x.me || x.ceo;
  }
  return false;
}
function scopeOf_(kind, id, j) {
  if (kind === 'msg') return String(j.k || '');
  if (kind === 'note') return key_(j.to);
  if (kind === 'user' || kind === 'prof' || kind === 'member' || kind === 'cap') return key_(id.split(':').slice(1).join(':'));
  if (kind === 'board') return String(j.dept || '');
  return '';
}

/* ---------------- API ---------------- */
function doGet() { return out_({ ok: true, service: 'forka-boards' }); }
function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad' }); }
  const writes = ['save', 'upload'].indexOf(String(b.action || '')) >= 0;
  const lock = writes ? LockService.getScriptLock() : null;
  if (lock) { try { lock.waitLock(20000); } catch (err) { return out_({ ok: false, error: 'busy' }); } }
  try { return out_(handle_(b)); }
  catch (err) { return out_({ ok: false, error: 'server', detail: String(err).slice(0, 200) }); }
  finally { if (lock) lock.releaseLock(); }
}
function handle_(b) {
  const a = String(b.action || '');
  const me = erpWho_(b.token);
  if (!me) return { ok: false, error: 'session' };
  const all = readAll_(), x = ctx_(me, all);
  x.tok = String(b.token || '');
  if (a === 'load') return load_(x, +b.since || 0);
  if (a === 'save') return save_(x, b.docs || []);
  if (a === 'upload') return upload_(x, b);
  if (a === 'file') return file_(x, String(b.id || ''));
  return { ok: false, error: 'action' };
}
function load_(x, since) {
  const docs = [];
  Object.values(x.all).forEach(d => {
    if (since && d.at < since - 5000) return;          // a 5-second overlap, so a change saved during a refresh is never missed
    if (d.del) { if (since) docs.push({ id: d.id, kind: d.kind, del: true, at: d.at }); return; }
    if (visible_(x, d)) docs.push({ id: d.id, kind: d.kind, json: d.json, at: d.at, by: d.by });
  });
  const o = { ok: true, now: Date.now(), docs, me: { email: x.me, ceo: x.ceo, depts: x.depts } };
  if (!since) o.people = accounts_(x.tok).map(p => ({ email: p.email, name: p.name, title: p.title, ceo: p.ceo, invited: p.status === 'pending' }));
  return o;
}
function save_(x, docs) {
  const sh = tab_(DATA_TAB, D_HEAD), now = Date.now(), bad = [], mails = [];
  if (!Array.isArray(docs) || docs.length > 400) return { ok: false, error: 'bad' };
  // boards first, so a new board's lists and cards find it
  const rank = k => ({ space: 0, member: 1, board: 2, list: 3 })[k] ?? 4;   // a new space, then who is in it, then boards, lists and cards
  docs = docs.slice().sort((p, q) => rank(p.kind) - rank(q.kind));
  docs.forEach(n => {
    const id = String(n.id || '').slice(0, 120), kind = String(n.kind || '');
    if (!id || KINDS.indexOf(kind) < 0) { bad.push(id); return; }
    const old = x.all[id] || null, del = !!n.del;
    if (old && old.kind !== kind) { bad.push(id); return; }
    if (del && DELETABLE.indexOf(kind) < 0) { bad.push(id); return; }
    const json = del ? (old ? old.json : null) : n.json;
    if (!del && (json === null || typeof json !== 'object')) { bad.push(id); return; }
    const str = del ? '' : JSON.stringify(json);
    if (str.length > MAX_JSON) { bad.push(id); return; }
    const d = { id, kind, scope: del && old ? old.scope : scopeOf_(kind, id, json || {}), json, at: now, by: x.me, del };
    if (!mayWrite_(x, d, old)) { bad.push(id); return; }
    if (old) d._row = old._row;
    writeRow_(sh, d);
    x.all[id] = d;
    if (kind === 'board' && !del) (json.lists || []).forEach(l => { x.bol[l] = d; });
    if (kind === 'member') { x.mem[d.scope] = json; if (d.scope === x.me) x.depts = depts_(json); }
    if (kind === 'card' && !del && cardMine_(x, json)) x.mine[json.l] = true;
    if (kind === 'member' && json && json.inv && !old) invite_(x, d.scope, json.inv);
    if (kind === 'note' && !old && json && EMAIL_KINDS[json.k]) mails.push(json);
  });
  if (mails.length) emailNotes_(x, mails);
  return { ok: true, now, rejected: bad };
}
/* A department head invites someone new: they are added to Forka Apps as "To confirm"; the CEO confirms them in People and access. */
function invite_(x, email, inv) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  if (accounts_(x.tok).some(p => p.email === email)) return;
  UrlFetchApp.fetch(ACCOUNTS_URL, { method: 'post', contentType: 'text/plain', muteHttpExceptions: true, followRedirects: true,
    payload: JSON.stringify({ action: 'invite', token: x.tok, email: email, name: String(inv.name || '').slice(0, 80), title: String(inv.title || '').slice(0, 80) }) });
  CacheService.getScriptCache().remove('acc:v2');
}
function emailNotes_(x, notes) {
  let left = 0; try { left = MailApp.getRemainingDailyQuota(); } catch (e) { return; }
  const names = {}; accounts_(x.tok).forEach(p => { names[p.email] = p.name || p.email; });
  notes.forEach(n => {
    const to = key_(n.to);
    if (!to || to === x.me || left < 20) return;
    const u = x.all['user:' + to];
    if (u && !u.del && u.json && u.json.emailOff) return;
    const card = n.card && x.all[n.card] && x.all[n.card].json, title = card ? card.title : '';
    const who = names[x.me] || x.me, what = EMAIL_KINDS[n.k];
    const link = APP_URL + (n.card ? '#card=' + encodeURIComponent(n.card) : n.ch ? '#chat=' + encodeURIComponent(n.ch) : '');
    const head = n.k === 'unblocked' ? 'A task you were waiting for is done' : who + ' ' + what;
    try {
      MailApp.sendEmail({ to, name: 'Forka Board', subject: 'Forka Board: ' + head + (title ? ' - ' + title : ''),
        body: head + (title ? ': ' + title : '') + '.\n\nOpen in Board: ' + link + '\n\nYou can turn these emails off in Board (the bell, "Also email me").',
        htmlBody: fkMail_({ c: '#397F8F', logo: 'https://erp.forka.com/logos/forka-board-logo.png', alt: 'Forka Board', lang: 'en',
          kick: BOARD_KICK[n.k] || 'Board', title: head, hi: names[to] ? 'Hello ' + String(names[to]).split(' ')[0] + ',' : '',
          rows: title ? [[n.ch && !n.card ? 'Chat' : 'Task', title]] : [], btn: 'Open in Board', url: link,
          foot: 'You get this email because you use Forka App.\nTurn these emails off in Board: the bell, then "Also email me".' }) });
      left--;
    } catch (e) {}
  });
}
function esc_(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* ---------------- files (private Drive folder; only people who can see the card can open them) ---------------- */
function cardVisible_(x, cid) { const c = x.all[cid]; return !!c && !c.del && c.kind === 'card' && visible_(x, c); }
function upload_(x, b) {
  const cid = String(b.card || '');
  if (!cardVisible_(x, cid)) return { ok: false, error: 'role' };
  const bytes = Utilities.base64Decode(String(b.data || ''));
  if (!bytes.length || bytes.length > MAX_FILE) return { ok: false, error: 'size' };
  const type = /^[\w.+-]+\/[\w.+-]+$/.test(String(b.type || '')) ? String(b.type) : 'application/octet-stream';
  const f = folder_().createFile(Utilities.newBlob(bytes, type, String(b.name || 'file').slice(0, 120)));
  try { f.setDescription('card:' + cid); } catch (e) {}
  return { ok: true, id: 'd:' + f.getId() };
}
function file_(x, id) {
  if (id.indexOf('d:') !== 0) return { ok: false, error: 'bad' };
  let f; try { f = DriveApp.getFileById(id.slice(2)); } catch (e) { return { ok: false, error: 'gone' }; }
  const parents = f.getParents(); let inFolder = false; const fid = props_().getProperty('FOLDER_ID');
  while (parents.hasNext()) if (parents.next().getId() === fid) inFolder = true;
  const cid = String((f.getDescription && f.getDescription()) || '').replace(/^card:/, '');
  if (!inFolder || !cardVisible_(x, cid)) return { ok: false, error: 'role' };
  const bl = f.getBlob();
  return { ok: true, type: bl.getContentType(), data: Utilities.base64Encode(bl.getBytes()) };
}

/* ---------------- Email design "Paper letter" (Khaled, 13 Nov 2026) ----------------
   Warm paper background, white card, the app logo on top, a thin line and the button in the app colour.
   o = { c: app colour, logo: logo URL, alt, lang: 'en'|'ar', kick, title, hi, body, quote, rows: [[label, value]], btn, url, after, foot } */
function fkMail_(o) {
  const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const ar = o.lang === 'ar', al = ar ? 'right' : 'left', dir = ar ? 'rtl' : 'ltr';
  const font = ar ? "'IBM Plex Sans Arabic',Tahoma,Arial,sans-serif" : "'Inter Tight',Arial,Helvetica,sans-serif";
  const head = ar ? font : "'EB Garamond',Georgia,'Times New Roman',serif";
  const para = s => e(s).replace(/\n/g, '<br>');
  const rows = (o.rows || []).filter(r => r && r[1] !== '' && r[1] != null).map(r =>
    '<tr><td style="padding:9px 0;border-top:1px solid #eee8de;font-size:13px;color:#8a8378;width:38%;text-align:' + al + ';vertical-align:top">' + e(r[0]) + '</td>' +
    '<td style="padding:9px 0;border-top:1px solid #eee8de;font-size:14.5px;font-weight:600;color:#2B2B2B;text-align:' + al + '">' + para(r[1]) + '</td></tr>').join('');
  return '<!DOCTYPE html><html dir="' + dir + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
    '<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600&family=Inter+Tight:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet"></head>' +
    '<body style="margin:0;padding:0;background:#f6f3ee">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ee"><tr><td align="center" style="padding:28px 14px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e7e1d7;border-top:4px solid ' + o.c + ';border-radius:18px;font-family:' + font + ';text-align:' + al + '" dir="' + dir + '">' +
    '<tr><td style="padding:26px 34px 6px"><img src="' + o.logo + '" height="34" alt="' + e(o.alt || 'Forka') + '" style="display:block;height:34px;width:auto;border:0"></td></tr>' +
    '<tr><td style="padding:18px 34px 30px">' +
    (o.kick ? '<div style="font-size:12px;font-weight:700;letter-spacing:' + (ar ? '0' : '.08em') + ';text-transform:uppercase;color:' + o.c + '">' + e(o.kick) + '</div>' : '') +
    '<div style="font-family:' + head + ';font-size:' + (ar ? '24px' : '30px') + ';font-weight:' + (ar ? 700 : 600) + ';line-height:1.2;color:#2B2B2B;margin:6px 0 14px">' + e(o.title) + '</div>' +
    ((o.hi || o.body) ? '<div style="font-size:15px;line-height:1.6;color:#4a4640">' + (o.hi ? e(o.hi) + '<br>' : '') + para(o.body) + '</div>' : '') +
    (o.quote ? '<div style="margin:16px 0 4px;padding:14px 16px;background:#f6f3ee;border-radius:12px;font-size:15px;line-height:1.55;color:#2B2B2B">' + para(o.quote) + '</div>' : '') +
    (rows ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0 22px">' + rows + '<tr><td colspan="2" style="border-top:1px solid #eee8de;font-size:0;line-height:0">&nbsp;</td></tr></table>' : '<div style="height:18px"></div>') +
    (o.url ? '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:' + o.c + '"><a href="' + e(o.url) + '" style="display:inline-block;padding:13px 26px;font-weight:600;font-size:15px;color:#ffffff;text-decoration:none;border-radius:999px">' + e(o.btn) + ' ' + (ar ? '&larr;' : '&rarr;') + '</a></td></tr></table>' : '') +
    (o.after || '') +
    '</td></tr></table>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;font-family:' + font + ';text-align:center" dir="' + dir + '"><tr><td style="padding:18px 20px;font-size:12px;line-height:1.6;color:#8a8378">' +
    para(o.foot || '') + '<br>Forka Collective</td></tr></table>' +
    '</td></tr></table></body></html>';
}
