// Runs Boards.gs against simulated Google services. node tests/boards_server_test.js
const fs = require('fs'), vm = require('vm'), crypto = require('crypto'), path = require('path');
class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
  getValues() { const o = []; for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push((this.sh.d[this.r - 1 + i] || [])[this.c - 1 + j] ?? ''); o.push(row); } return o; }
  setValues(v) { v.forEach((row, i) => { const R = this.sh.d[this.r - 1 + i] = this.sh.d[this.r - 1 + i] || []; row.forEach((x, j) => R[this.c - 1 + j] = x); }); return this; }
  setFontWeight() { return this; }
}
class Sheet {
  constructor(n) { this.n = n; this.d = []; }
  getLastRow() { return this.d.length; } getRange(r, c, nr, nc) { return new Range(this, r, c, nr || 1, nc || 1); }
  appendRow(r) { this.d.push(r.slice()); } setFrozenRows() {}
}
const mkSS = () => { const sheets = {}; return { sheets, getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = new Sheet(n)) }; };
const ss = mkSS(), acc = mkSS();
const ap = acc.insertSheet('People');
ap.d = [['Email', 'Name', 'Job title', 'Clearance', 'Status'],
  ['ceo@forka.com', 'Khaled Alamer', 'CEO', 'ceo', 'active'], ['admin@forka.com', 'Ruby Ann Margate', 'Admin', 'staff', 'active'],
  ['mkt@forka.com', 'Marketing Head', '', 'manager', 'active'], ['design@forka.com', 'Designer', '', 'staff', 'active'],
  ['store@kuwaitikitchen.com', 'Hamim', '', 'staff', 'active'], ['mnt@forka.com', 'Maintenance Head', '', 'manager', 'active'], ['gone@forka.com', 'Blocked', '', 'staff', 'blocked']];
const props = {}, cache = {}, files = {}, mails = [];
const folder = { getId: () => 'FOLDER1', createFile: blob => { const id = 'f' + crypto.randomBytes(6).toString('hex'); files[id] = { blob, desc: '' }; return { getId: () => id, setDescription: d => { files[id].desc = d; } }; } };
const SESS = { CEO: ['ceo@forka.com', 'ceo'], RUBY: ['admin@forka.com', 'staff'], MKT: ['mkt@forka.com', 'manager'], DES: ['design@forka.com', 'staff'], STORE: ['store@kuwaitikitchen.com', 'staff'], MNT: ['mnt@forka.com', 'manager'] };
const tok = k => 'TOK' + k + '-'.repeat(24 - k.length);
const ctx = {
  SpreadsheetApp: { getActive: () => ss, openById: () => acc },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = v; } }) },
  CacheService: { getScriptCache: () => ({ put: (k, v) => cache[k] = v, get: k => cache[k] ?? null, remove: k => delete cache[k] }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: t => ({ setMimeType() { return this; }, t }), MimeType: { JSON: 1 } },
  // Pretend accounts server: "who", plus "directory" and "invite" (Boards no longer reads the accounts Sheet itself).
  UrlFetchApp: { fetch: (u, o) => { const b = o && o.payload ? JSON.parse(o.payload) : {}; const k = Object.keys(SESS).find(k => tok(k) === b.token);
    let ans = { ok: false, error: 'session' };
    if (k && b.action === 'who') ans = { ok: true, me: { email: SESS[k][0], name: k, level: SESS[k][1], status: 'active' } };
    if (k && b.action === 'directory') ans = { ok: true, people: ap.d.slice(1).map(r => ({ email: r[0], name: r[1], title: r[2], ceo: r[3] === 'ceo', status: r[4] })).filter(p => p.status === 'active' || p.status === 'pending') };
    if (k && b.action === 'invite') { if (!ap.d.some(r => r[0] === b.email)) ap.d.push([b.email, b.name, b.title, 'staff', 'pending', false, '', false, false, 'google', '', 'Boards: ' + SESS[k][0], new Date(), SESS[k][0]]); ans = { ok: true }; }
    return { getContentText: () => JSON.stringify(ans) }; } },
  DriveApp: { createFolder: () => folder, getFolderById: () => folder,
    getFileById: id => { const f = files[id]; if (!f) throw new Error('no'); let n = 0;
      return { getDescription: () => f.desc, getBlob: () => ({ getContentType: () => f.blob.type, getBytes: () => f.blob.bytes }), getParents: () => ({ hasNext: () => n++ === 0, next: () => ({ getId: () => 'FOLDER1' }) }) }; } },
  MailApp: { sendEmail: m => mails.push(m), getRemainingDailyQuota: () => 1500 },
  Utilities: { base64Decode: s => [...Buffer.from(s, 'base64')], base64Encode: b => Buffer.from(b).toString('base64'), newBlob: (bytes, type, name) => ({ bytes, type, name }) },
  console, Date, JSON, Math
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../server/Boards.gs'), 'utf8') + ';this.setup=setup;this.doPost=doPost;this.doGet=doGet;', ctx);
const call = o => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(o) } }).t);
const res = []; const ck = (n, ok, i) => { res.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' - ' + JSON.stringify(i).slice(0, 300))); };
const load = (k, since) => call({ action: 'load', token: tok(k), since });
const save = (k, docs) => call({ action: 'save', token: tok(k), docs });
const ids = r => (r.docs || []).map(d => d.id);

ctx.setup();
ck('Setup makes the Data tab and the private files folder', ss.sheets.Data && ss.sheets.Data.d.length === 1 && props.FOLDER_ID === 'FOLDER1');
ck('A wrong or missing sign-in is refused', load('NOBODY').error === 'session' && call({ action: 'load' }).error === 'session');
let r = load('CEO');
ck('CEO opens Boards: people come from Forka Apps (blocked people left out)', r.ok && r.me.ceo && r.people.length === 6 && !r.people.some(p => p.email === 'gone@forka.com'), r);

// the CEO sets departments and heads
r = save('CEO', [{ id: 'member:admin@forka.com', kind: 'member', json: { dept: 'adm', role: 'head' } }, { id: 'member:mkt@forka.com', kind: 'member', json: { dept: 'mkt', role: 'head' } },
  { id: 'member:design@forka.com', kind: 'member', json: { dept: 'mkt', role: 'staff' } }, { id: 'member:mnt@forka.com', kind: 'member', json: { dept: 'mnt', role: 'head' } }]);
ck('CEO makes Ruby head of Executive & Administration, and sets the Marketing team (older one-department rows still work)', r.ok && !r.rejected.length && load('RUBY').me.depts.adm === 'head', load('RUBY').me);
r = save('MKT', [{ id: 'member:store@kuwaitikitchen.com', kind: 'member', json: { dept: 'mkt', role: 'head' } }]);
ck('A head cannot make someone else a head', r.rejected.length === 1, r);

// boards
const board = (id, dept, members, lists, extra) => ({ id, kind: 'board', json: Object.assign({ id, dept, name: 'B ' + id, members, lists, status: null }, extra || {}) });
r = save('MKT', [board('b1', 'mkt', ['design@forka.com'], ['l1']), { id: 'l1', kind: 'list', json: { id: 'l1', name: 'To do', cards: ['c1'] } },
  { id: 'c1', kind: 'card', json: { id: 'c1', l: 'l1', title: 'Shoot the new dishes', members: ['design@forka.com'], labels: [], check: [], log: [] } }]);
ck('Marketing head creates a Marketing board with a list and a card', r.ok && !r.rejected.length, r);
r = save('MKT', [board('b2', 'fin', [], [])]);
ck('...but not a board in another department', r.rejected[0] === 'b2', r);
r = save('DES', [board('b3', 'mkt', [], [])]);
ck('Staff cannot create boards', r.rejected[0] === 'b3', r);
ck('The designer added to the board sees it, its list and card', ['b1', 'l1', 'c1'].every(i => ids(load('DES')).includes(i)));
ck('Someone not on it sees nothing of it', !['b1', 'l1', 'c1'].some(i => ids(load('STORE')).includes(i)));
ck('The CEO sees every board', ids(load('CEO')).includes('b1'));
r = save('DES', [{ id: 'c1', kind: 'card', json: { id: 'c1', l: 'l1', title: 'Shoot the new dishes', members: ['design@forka.com'], labels: [], check: [{ t: 'Lights', d: true }], log: [] } },
  { id: 'c2', kind: 'card', json: { id: 'c2', l: 'l1', title: 'Menu photos', members: [], labels: [], check: [], log: [] } }, { id: 'l1', kind: 'list', json: { id: 'l1', name: 'To do', cards: ['c1', 'c2'] } }]);
ck('Staff on the board can change and add cards', r.ok && !r.rejected.length, r);
r = save('STORE', [{ id: 'c1', kind: 'card', json: { id: 'c1', l: 'l1', title: 'hacked', members: [] } }]);
ck('Someone not on the board cannot change its cards', r.rejected[0] === 'c1', r);
r = save('DES', [{ id: 'b1', kind: 'board', json: { id: 'b1', dept: 'mkt', name: 'Renamed', members: [], lists: ['l1'] } }]);
ck('Staff cannot change the board itself (name, team)', r.rejected[0] === 'b1', r);

// a request to another department
r = save('STORE', [board('rq', 'mnt', [], ['rl1'], { kind: 'requests', name: '' }), { id: 'rl1', kind: 'list', json: { id: 'rl1', name: 'New requests', sys: 'newreq', cards: ['rc1'] } },
  { id: 'rc1', kind: 'card', json: { id: 'rc1', l: 'rl1', title: 'Fix the shelf', members: [], requester: 'store@kuwaitikitchen.com', fromDept: 'ops', log: [] } }]);
ck('Anyone can send a request to another department', r.ok && !r.rejected.length, r);
ck('The Maintenance head sees it', ['rq', 'rl1', 'rc1'].every(i => ids(load('MNT')).includes(i)));
ck('The person who asked can follow it', ['rq', 'rl1', 'rc1'].every(i => ids(load('STORE')).includes(i)));
ck('Others cannot', !ids(load('DES')).includes('rc1'));

// chat
r = save('DES', [{ id: 'm1', kind: 'msg', json: { id: 'm1', k: 'mkt', by: 'design@forka.com', at: 1, t: 'Drafts are ready' } }, { id: 'm2', kind: 'msg', json: { id: 'm2', k: 'fin', by: 'design@forka.com', at: 1, t: 'hi' } },
  { id: 'm3', kind: 'msg', json: { id: 'm3', k: 'all', by: 'mkt@forka.com', at: 1, t: 'pretending' } }]);
ck('Chat: own department channel yes; another department or someone else\'s name no', r.rejected.join() === 'm2,m3', r);
r = save('DES', [{ id: 'm4', kind: 'msg', json: { id: 'm4', k: 'dm:ceo@forka.com|design@forka.com', by: 'design@forka.com', at: 1, t: 'Can we talk?' } }]);
ck('Direct messages are seen only by the two people', !r.rejected.length && ids(load('CEO')).includes('m4') && !ids(load('MKT')).includes('m4') && ids(load('MKT')).includes('m1'));
r = save('DES', [{ id: 'm1', kind: 'msg', del: true }]);
ck('Messages cannot be deleted or changed', r.rejected[0] === 'm1', r);

// alerts and email
mails.length = 0;
r = save('MKT', [{ id: 'n1', kind: 'note', json: { id: 'n1', to: 'design@forka.com', by: 'mkt@forka.com', k: 'assign', card: 'c2', at: 1, read: false } },
  { id: 'n2', kind: 'note', json: { id: 'n2', to: 'design@forka.com', by: 'mkt@forka.com', k: 'comment', card: 'c2', at: 1, read: false } }]);
ck('An alert is saved for the person and emailed (comments are not emailed)', !r.rejected.length && mails.length === 1 && mails[0].to === 'design@forka.com' && /Menu photos/.test(mails[0].subject) && /#card=c2/.test(mails[0].htmlBody), mails);
ck('Only the person sees their alerts', ids(load('DES')).includes('n1') && !ids(load('STORE')).includes('n1'));
save('DES', [{ id: 'user:design@forka.com', kind: 'user', json: { emailOff: true } }]); mails.length = 0;
save('MKT', [{ id: 'n3', kind: 'note', json: { id: 'n3', to: 'design@forka.com', by: 'mkt@forka.com', k: 'mention', card: 'c2', at: 1 } }]);
ck('"Also email me" switched off: no email', mails.length === 0, mails);
r = save('STORE', [{ id: 'user:design@forka.com', kind: 'user', json: { emailOff: false } }, { id: 'n1', kind: 'note', json: { read: true, to: 'design@forka.com' } }]);
ck('Nobody can change someone else\'s settings or alerts', r.rejected.length === 2, r);

// goals, portfolios
r = save('MKT', [{ id: 'goal:g1', kind: 'goal', json: { id: 'g1', lvl: 'company', title: 'x' } }, { id: 'goal:g2', kind: 'goal', json: { id: 'g2', lvl: 'mkt', title: 'Grow December sales' } }]);
ck('Heads set goals for their department only (company goals: CEO)', r.rejected.join() === 'goal:g1', r);
ck('Staff see their department\'s goals; other departments do not', ids(load('DES')).includes('goal:g2') && !ids(load('STORE')).includes('goal:g2'));
save('MKT', [{ id: 'port:p1', kind: 'port', json: { id: 'p1', name: 'Mine', owner: 'mkt@forka.com', items: [] } }]);
ck('Portfolios are private to their owner (and the CEO)', ids(load('MKT')).includes('port:p1') && !ids(load('DES')).includes('port:p1') && ids(load('CEO')).includes('port:p1'));

// invites
r = save('MKT', [{ id: 'member:sara@forka.com', kind: 'member', json: { dept: 'mkt', role: 'staff', inv: { name: 'Sara Ahmed' } } }]);
const row = ap.d.find(x => x[0] === 'sara@forka.com');
ck('A head invites someone new: added to Forka Apps as "To confirm" for the CEO', !r.rejected.length && row && row[4] === 'pending' && row[11] === 'Boards: mkt@forka.com', row);
ck('...and shows as invited', load('CEO').people.some(p => p.email === 'sara@forka.com' && p.invited));

// deltas and deletes
ss.sheets.Data.d.slice(1).forEach(r => { r[4] -= 60000; });   // everything so far happened a minute ago
const t0 = load('DES').now;
save('MKT', [{ id: 'c2', kind: 'card', del: true }]);
r = load('DES', t0);
ck('Only what changed since last time comes back, including deletions', r.docs.length >= 1 && r.docs.every(d => d.at >= t0 - 5000) && r.docs.some(d => d.id === 'c2' && d.del) && !r.docs.some(d => d.id === 'b1'), r.docs);
ck('Deleted cards are gone on a fresh load', !ids(load('DES')).includes('c2'));

// several departments per person, and spaces
r = save('CEO', [{ id: 'member:design@forka.com', kind: 'member', json: { depts: { mkt: 'staff', adm: 'staff' } } }]);
ck('The CEO puts someone in two departments', !r.rejected.length && load('DES').me.depts.adm === 'staff' && load('DES').me.depts.mkt === 'staff');
save('RUBY', [board('ba', 'adm', [], [], { allDept: true })]);
ck('...they see boards open to everyone in either department', ids(load('DES')).includes('ba') && ids(load('DES')).includes('b1'));
r = save('MKT', [{ id: 'member:design@forka.com', kind: 'member', json: { depts: { mkt: 'staff' } } }]);
ck('A head cannot take someone out of another head\'s department', r.rejected.length === 1, r);
r = save('RUBY', [{ id: 'member:store@kuwaitikitchen.com', kind: 'member', json: { depts: { adm: 'staff' } } }]);
ck('A head adds someone to their own department', !r.rejected.length && load('STORE').me.depts.adm === 'staff', r);
r = save('MKT', [{ id: 'space:events', kind: 'space', json: { id: 'events', en: 'Events', ar: 'الفعاليات', by: 'mkt@forka.com' } },
  { id: 'member:mkt@forka.com', kind: 'member', json: { depts: { mkt: 'head', events: 'head' } } }, board('bev', 'events', [], [])]);
ck('A head creates a new space, becomes its head and adds a board in it', !r.rejected.length && load('MKT').me.depts.events === 'head' && ids(load('MKT')).includes('bev'), r);
r = save('DES', [{ id: 'space:mine', kind: 'space', json: { id: 'mine', en: 'Mine' } }]);
ck('Staff cannot create spaces', r.rejected[0] === 'space:mine', r);
r = save('RUBY', [{ id: 'member:admin@forka.com', kind: 'member', json: { depts: { adm: 'head', events: 'head' } } }]);
ck('Nobody can make themselves head of a space someone else created', r.rejected.length === 1, r);
r = save('RUBY', [{ id: 'space:events', kind: 'space', json: { id: 'events', en: 'Hacked' } }]);
ck('Only the space\'s head (or the CEO) can rename it', r.rejected.length === 1 && !save('MKT', [{ id: 'space:events', kind: 'space', json: { id: 'events', en: 'Events & Catering', by: 'mkt@forka.com' } }]).rejected.length);
r = save('STORE', [board('rq2', 'events', [], ['rq2l'], { kind: 'requests', name: '' }), { id: 'rq2l', kind: 'list', json: { id: 'rq2l', name: 'New requests', cards: [] } }]);
ck('Anyone can send a request to a new space too', !r.rejected.length, r);
ck('Everyone sees the list of spaces', ids(load('STORE')).includes('space:events'));
r = save('MKT', [{ id: 'space:events', kind: 'space', del: true }]);
ck('Only the CEO removes a space', r.rejected.length === 1 && !save('CEO', [{ id: 'space:events', kind: 'space', del: true }]).rejected.length);

// files
r = call({ action: 'upload', token: tok('DES'), card: 'c1', name: 'shot.png', type: 'image/png', data: Buffer.from('PNGDATA').toString('base64') });
ck('Upload a photo to a card you can see (private Drive folder)', r.ok && /^d:/.test(r.id), r);
const fid = r.id;
r = call({ action: 'file', token: tok('MKT'), id: fid });
ck('People who can see the card can open it', r.ok && Buffer.from(r.data, 'base64').toString() === 'PNGDATA' && r.type === 'image/png', r);
ck('Others cannot', call({ action: 'file', token: tok('STORE'), id: fid }).error === 'role');
ck('No upload to a card you cannot see', call({ action: 'upload', token: tok('STORE'), card: 'c1', name: 'x', data: 'AAAA' }).error === 'role');
ck('Too-big text is refused', save('MKT', [{ id: 'c9', kind: 'card', json: { l: 'l1', title: 'x'.repeat(50000) } }]).rejected[0] === 'c9');
ck('Unknown kinds are refused', save('CEO', [{ id: 'x1', kind: 'secret', json: {} }]).rejected[0] === 'x1');

// --- Apps Script bridge (this script only sends emails for the Forka Apps server now) ---
mails.length = 0;
ck('Bridge emails are refused without the right key', call({ action: 'bridgeMail', key: 'x', mails: [{ to: 'a@b.com', subject: 's', htmlBody: 'h' }] }).error === 'role' && mails.length === 0);
props.BRIDGE_KEY = 'k-123';
r = call({ action: 'bridgeMail', key: 'k-123', mails: [{ to: 'design@forka.com', subject: 'Forka Boards: test', htmlBody: '<p>x</p>' }, { to: 'not-an-email', subject: 's' }] });
ck('...and sent with it (bad addresses skipped)', r.ok && r.sent === 1 && mails.length === 1 && mails[0].to === 'design@forka.com', r);
console.log(`${res.filter(Boolean).length}/${res.length} boards server checks passed`);
process.exit(res.every(Boolean) ? 0 : 1);
