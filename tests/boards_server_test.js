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
const res = []; const ck = (n, ok, i) => { res.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' - ' + String(JSON.stringify(i)).slice(0, 300))); };
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
  { id: 'c1', kind: 'card', json: { id: 'c1', l: 'l1', title: 'Shoot the new dishes', members: ['design@forka.com'], labels: [], check: [{ t: 'Lights', d: false }], log: [] } }]);
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
ck('Staff on the board can do their work on a card given to them and add cards', r.ok && !r.rejected.length, r);
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
ck('Board emails come from the company no-reply address, not the CEO account', mails.length === 1 && mails[0].noReply === true, mails[0]);
ck('Board email uses the Forka design (Board logo, teal button, link to the card)', /forka-board-logo\.png/.test(mails[0].htmlBody) && /#397F8F/.test(mails[0].htmlBody) && /Open in Board/.test(mails[0].htmlBody) && !/Hello ,/.test(mails[0].htmlBody));
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

// ---------------- task rules (Khaled, 14 Nov 2026) ----------------
const drow = id => { const r = ss.sheets.Data.d.find(x => x[0] === id); return r && r[3] ? JSON.parse(r[3]) : null; };
const legacy = (id, json) => ss.sheets.Data.d.push([id, 'card', '', JSON.stringify(json), 1, 'x', '']);   // a card saved before the rule
const C0 = { id: 'r1', l: 'rl', title: 'Print the menus', desc: 'A5, two sides', members: ['design@forka.com'], owner: 'design@forka.com', due: 1000, labels: [], follow: [],
  check: [{ t: 'Proof', d: false }], subs: [{ id: 's1', t: 'Order paper', who: '', due: null, done: false }], log: [{ at: 1, by: 'mkt@forka.com', k: 'l_added', a: 'To do' }] };
let cur = JSON.parse(JSON.stringify(C0));
const edit = (k, f) => { const j = JSON.parse(JSON.stringify(cur)); f(j); const r = save(k, [{ id: 'r1', kind: 'card', json: j }]); if (!r.rejected.length) cur = drow('r1'); return r; };
const ok = r => r.ok && !r.rejected.length, no = r => r.ok && r.rejected[0] === 'r1';
r = save('MKT', [board('rb', 'mkt', ['design@forka.com', 'store@kuwaitikitchen.com'], ['rl', 'rl2']), { id: 'rl', kind: 'list', json: { id: 'rl', name: 'To do', cards: ['r1'] } },
  { id: 'rl2', kind: 'list', json: { id: 'rl2', name: 'Doing', cards: [] } }, { id: 'r1', kind: 'card', json: Object.assign({}, C0, { by: 'design@forka.com' }) }]);
cur = drow('r1');
ck('Rules: a new card always carries its creator, set by the server (a wrong "by" is overridden)', ok(r) && cur.by === 'mkt@forka.com', cur);
ck('Rules: the assigned person cannot change the title', no(edit('DES', j => { j.title = 'Mine now'; })));
ck('Rules: ...nor the description', no(edit('DES', j => { j.desc = 'changed'; })));
ck('Rules: ...nor the due date, priority, type or repeat', [j => { j.due = 2000; }, j => { j.priority = 'urgent'; }, j => { j.type = 'milestone'; }, j => { j.repeat = 'daily'; }].every(f => no(edit('DES', f))));
ck('Rules: ...nor add, rename or remove checklist and subtask items', [j => { j.check.push({ t: 'More', d: false }); }, j => { j.check[0].t = 'X'; }, j => { j.subs = []; }, j => { j.subs[0].who = 'design@forka.com'; }].every(f => no(edit('DES', f))));
ck('Rules: ...nor labels, custom fields or waiting on', [j => { j.labels = ['urg']; }, j => { j.f = { cost: '5' }; }, j => { j.waits = ['c1']; }].every(f => no(edit('DES', f))));
ck('Rules: ...nor change who created it', no(edit('DES', j => { j.by = 'design@forka.com'; })));
ck('Rules: ...nor archive it directly', no(edit('DES', j => { j.archived = true; j.archivedAt = 5; })));
ck('Rules: ...nor delete it', save('DES', [{ id: 'r1', kind: 'card', del: true }]).rejected[0] === 'r1');
ck('Rules: the assigned person ticks the checklist and a subtask', ok(edit('DES', j => { j.check[0].d = true; j.subs[0].done = true; j.subs[0].doneAt = 9; })));
ck('Rules: ...moves it to another list and comments', ok(edit('DES', j => { j.l = 'rl2'; j.log.push({ at: 2, by: 'design@forka.com', k: 'l_moved', a: 'To do', b: 'Doing' }, { at: 3, by: 'design@forka.com', c: 'Proof sent' }); })));
ck('Rules: ...marks it complete and attaches a file', ok(edit('DES', j => { j.done = true; j.doneAt = 10; j.atts = [{ id: 'd:x', name: 'proof.pdf', by: 'design@forka.com' }]; })));
ck('Rules: someone on the board but not given the task cannot tick, move or complete it', [j => { j.check[0].d = false; }, j => { j.l = 'rl'; }, j => { j.done = false; }, j => { j.atts = []; }].every(f => no(edit('STORE', f))));
ck('Rules: ...but can comment and follow', ok(edit('STORE', j => { j.log.push({ at: 4, by: 'store@kuwaitikitchen.com', c: 'Looks good' }); })) && ok(edit('STORE', j => { j.follow = ['store@kuwaitikitchen.com']; })));
ck('Rules: ...cannot add someone else as follower, or rewrite the history', no(edit('STORE', j => { j.follow.push('mnt@forka.com'); })) && no(edit('STORE', j => { j.log[0].by = 'store@kuwaitikitchen.com'; })));
ck('Rules: "Ask to archive" only by someone given the task, for themselves', no(edit('STORE', j => { j.arq = { by: 'store@kuwaitikitchen.com', at: 5 }; })) && no(edit('DES', j => { j.arq = { by: 'mkt@forka.com', at: 5 }; }))
  && ok(edit('DES', j => { j.arq = { by: 'design@forka.com', at: 5, why: 'Done already' }; })));
ck('Rules: redirect only to someone in your own team', no(edit('DES', j => { j.members = ['mnt@forka.com']; j.owner = 'mnt@forka.com'; })));
ck('Rules: someone not given the task cannot redirect it', no(edit('STORE', j => { j.members = ['store@kuwaitikitchen.com']; j.owner = 'store@kuwaitikitchen.com'; })));
ck('Rules: the assigned person redirects it to a teammate (they share Executive & Administration)', ok(edit('DES', j => { j.members = ['store@kuwaitikitchen.com']; j.owner = 'store@kuwaitikitchen.com'; j.log.push({ at: 6, by: 'design@forka.com', k: 'l_redir', a: 'design@forka.com', b: 'store@kuwaitikitchen.com' }); })) && cur.members[0] === 'store@kuwaitikitchen.com');
ck('Rules: ...after that the old assignee can no longer do the work', no(edit('DES', j => { j.done = false; })));
ck('Rules: supervisor: not by someone outside the task, not from another team', no(edit('DES', j => { j.sup = 'admin@forka.com'; })) && no(edit('STORE', j => { j.sup = 'mnt@forka.com'; })));
ck('Rules: the new assignee sets a supervisor from their team', ok(edit('STORE', j => { j.sup = 'admin@forka.com'; })));
ck('Rules: the supervisor sees the card without being on the board', ids(load('RUBY')).includes('r1') && !ids(load('MNT')).includes('r1'));
ck('Rules: a head of another department (even as supervisor) cannot change the details', no(edit('RUBY', j => { j.title = 'Ruby was here'; })));
mails.length = 0;
r = save('DES', [{ id: 'n9', kind: 'note', json: { id: 'n9', to: 'store@kuwaitikitchen.com', by: 'design@forka.com', k: 'redir', card: 'r1', at: 1 } }, { id: 'n10', kind: 'note', json: { id: 'n10', to: 'mkt@forka.com', by: 'design@forka.com', k: 'archreq', card: 'r1', at: 1 } }]);
ck('Rules: redirect and archive-request alerts are emailed', ok(r) && mails.length === 2 && /redirected a task to you/.test(mails[0].subject) && /asked to archive/.test(mails[1].subject), mails.map(m => m.subject));
ck('Rules: the creator (also head) changes the details', ok(edit('MKT', j => { j.title = 'Print the December menus'; j.desc = 'A4'; j.check.push({ t: 'Deliver', d: false }); })));
ck('Rules: the creator accepts the archive request (archives it)', ok(edit('MKT', j => { j.archived = true; j.archivedAt = 7; delete j.arq; })) && cur.archived);
ck('Rules: the assignee cannot restore it; the head or the CEO can', no(edit('STORE', j => { j.archived = false; })) && ok(edit('CEO', j => { j.archived = false; })));
r = save('DES', [{ id: 'r2', kind: 'card', json: { id: 'r2', l: 'rl', title: 'Designer task', members: ['design@forka.com'], log: [] } }]);
ck('Rules: a staff member creates a card: they are its creator and can change it', ok(r) && drow('r2').by === 'design@forka.com' && !save('DES', [{ id: 'r2', kind: 'card', json: Object.assign(drow('r2'), { title: 'Designer task 2' }) }]).rejected.length);
ck('Rules: the department head changes details of a card someone else created', !save('MKT', [{ id: 'r2', kind: 'card', json: Object.assign(drow('r2'), { due: 5000 }) }]).rejected.length);
ck('Rules: a head of another department cannot', save('RUBY', [{ id: 'r2', kind: 'card', json: Object.assign(drow('r2'), { members: ['design@forka.com'], sup: 'admin@forka.com' }) }]).rejected.length === 1 && save('MNT', [{ id: 'r2', kind: 'card', json: Object.assign(drow('r2'), { title: 'x' }) }]).rejected.length === 1);
// cards saved before the rule have no creator
legacy('r3', { id: 'r3', l: 'rl', title: 'Old card', members: ['design@forka.com'], log: [{ at: 9, by: 'design@forka.com', c: 'hi' }, { at: 1, by: 'store@kuwaitikitchen.com', k: 'l_added' }] });
legacy('r4', { id: 'r4', l: 'rl', title: 'Older card', members: ['design@forka.com'], log: [] });
r = save('STORE', [{ id: 'r3', kind: 'card', json: Object.assign(drow('r3'), { title: 'Old card, renamed' }) }]);
ck('Rules: an old card without a creator: the first history entry ("added") counts, and is then kept on the card', ok({ ok: r.ok, rejected: r.rejected }) && drow('r3').by === 'store@kuwaitikitchen.com', r);
ck('Rules: ...the assigned person still cannot change it', save('DES', [{ id: 'r3', kind: 'card', json: Object.assign(drow('r3'), { title: 'nope' }) }]).rejected.length === 1);
ck('Rules: an old card with no history: the department head counts as creator', save('DES', [{ id: 'r4', kind: 'card', json: Object.assign(drow('r4'), { title: 'nope' }) }]).rejected.length === 1
  && !save('MKT', [{ id: 'r4', kind: 'card', json: Object.assign(drow('r4'), { title: 'Older card, renamed' }) }]).rejected.length && !drow('r4').by);
ck('Rules: the CEO can do everything (details, creator, delete)', !save('CEO', [{ id: 'r3', kind: 'card', json: Object.assign(drow('r3'), { title: 'CEO', by: 'ceo@forka.com' }) }]).rejected.length && !save('CEO', [{ id: 'r3', kind: 'card', del: true }]).rejected.length);
ck('Rules: the head deletes a card in their department', !save('MKT', [{ id: 'r4', kind: 'card', del: true }]).rejected.length);


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

// "Open in Board" from Procurement: one card per purchase request, asked by the Procurement server with a shared key
{
  const KEY = 'k'.repeat(12) + 'PROC-BOARD-TEST-KEY-1234567890';
  const pc = o => call(Object.assign({ action: 'procCard', key: KEY, token: tok('RUBY'),
    req: { id: 'R-abc1', no: 'PRQ-261114-01', title: 'Menu board logo', kind: 'Design or creative', qty: '1', unit: 'PCS', needBy: '2026-11-20', dept: 'Marketing', branch: 'AMK Sharjah', details: 'Need the new logo files', url: 'https://procurement.forka.com/#rq=R-abc1' },
    requester: { email: 'store@kuwaitikitchen.com', name: 'Hamim' }, buyer: null, by: { email: 'admin@forka.com', name: 'Ruby' } }, o || {}));
  const docsOf = kind => ss.sheets.Data.d.slice(1).filter(r => r[1] === kind && !r[6]).map(r => JSON.parse(r[3]));
  ck('procCard: without PROC_BOARD_KEY set it answers "not set up yet"', pc().error === 'nosetup');
  props.PROC_BOARD_KEY = KEY;
  ck('procCard: a wrong or missing key is refused, nothing is written', pc({ key: KEY.slice(0, -1) + 'X' }).error === 'key' && pc({ key: '' }).error === 'key' && pc({ key: KEY + 'X' }).error === 'key' && !docsOf('board').some(b => b.procReq));
  ck('procCard: a sign-in token alone (no key) is not enough', call({ action: 'procCard', token: tok('CEO'), req: { id: 'R-x', no: 'PRQ-x' }, by: { email: 'ceo@forka.com' } }).error === 'key');
  const m0 = mails.length;
  let p = pc();
  const pb = docsOf('board').filter(b => b.procReq), card = docsOf('card').find(c => c.id === p.cardId);
  const L = pb[0] ? pb[0].lists.map(l => docsOf('list').find(x => x.id === l)) : [];
  ck('procCard: makes the board "Purchase requests" in Procurement once, open to the department, with Needs info / In progress / Done',
    p.ok && p.created && pb.length === 1 && pb[0].dept === 'proc' && pb[0].name === 'Purchase requests' && pb[0].allDept && L.map(l => l && l.name).join('|') === 'Needs info|In progress|Done' && p.boardId === pb[0].id, [p, pb, L]);
  ck('procCard: the card is in Needs info, titled "<no> · <title>", with the details and the link back to the request',
    card && card.l === L[0].id && L[0].cards.includes(card.id) && card.title === 'PRQ-261114-01 · Menu board logo' && /Need the new logo files/.test(card.desc) && /https:\/\/procurement\.forka\.com\/#rq=R-abc1/.test(card.desc)
    && card.proc.id === 'R-abc1' && card.proc.no === 'PRQ-261114-01' && card.proc.url === 'https://procurement.forka.com/#rq=R-abc1' && card.labels.join() === 'preq' && p.url === 'https://erp.forka.com/boards/#card=' + card.id, card);
  ck('procCard: members = the requester; owner = the requester (no buyer yet); creator = the person who pressed; history entry',
    card.members.join() === 'store@kuwaitikitchen.com' && card.owner === 'store@kuwaitikitchen.com' && card.by === 'admin@forka.com' && card.log.length === 1 && card.log[0].k === 'l_added' && card.log[0].by === 'admin@forka.com', card);
  ck('procCard: the requester gets the usual "gave you a task" alert and email', docsOf('note').some(n => n.to === 'store@kuwaitikitchen.com' && n.k === 'assign' && n.card === card.id) && mails.length === m0 + 1 && mails[mails.length - 1].to === 'store@kuwaitikitchen.com', mails.slice(m0));
  let p2 = pc();
  ck('procCard: pressing again gives the same card (one card per request, one board)', p2.ok && !p2.created && p2.cardId === p.cardId && docsOf('card').filter(c => c.proc && c.proc.id === 'R-abc1').length === 1 && docsOf('board').filter(b => b.procReq).length === 1 && mails.length === m0 + 1, p2);
  p2 = pc({ buyer: { email: '', name: 'Ruby Ann Margate' } });
  const c2 = docsOf('card').find(c => c.id === p.cardId);
  ck('procCard: a buyer given since is added (found by name among Forka Apps people), becomes the owner and is told', p2.cardId === p.cardId && c2.members.includes('admin@forka.com') && c2.members.includes('store@kuwaitikitchen.com') && c2.owner === 'admin@forka.com' && c2.by === 'admin@forka.com', c2);
  const p3 = pc({ req: { id: 'R-abc2', no: 'PRQ-261114-02', title: 'Takeaway bags print' }, requester: { email: 'nobody@else.com', name: 'X' }, buyer: { email: 'design@forka.com', name: 'Designer' }, by: { email: 'ceo@forka.com' } });
  const c3 = docsOf('card').find(c => c.id === p3.cardId);
  ck('procCard: a second request is a second card on the same board; people without a Forka Apps account are left out; buyer is owner', p3.ok && p3.cardId !== p.cardId && p3.boardId === p.boardId && c3.members.join() === 'design@forka.com' && c3.owner === 'design@forka.com' && c3.by === 'ceo@forka.com', c3);
  ck('procCard: a bad request (no number or no presser) is refused', pc({ req: { id: 'R-abc9', no: '' } }).error === 'bad' && pc({ by: { email: 'x' } }).error === 'bad');
  props.PROC_BOARD_DEPT = 'nosuchdept';
  ck('procCard: PROC_BOARD_DEPT set to an unknown department gives a clear error', pc({ req: { id: 'R-abc8', no: 'PRQ-8', title: 'x' } }).error === 'dept');
  delete props.PROC_BOARD_DEPT;
  // the requester works on the card (board rules): sees it, attaches, comments, moves it; cannot change details
  r = load('STORE');
  ck('Requester sees the card, its list and the board (through the card)', [p.cardId, L[0].id, p.boardId].every(i => ids(r).includes(i)) && !ids(r).includes(p3.cardId), ids(r));
  ck('Someone not on the request does not see it', !ids(load('DES')).includes(p.cardId) && ids(load('DES')).includes(p3.cardId));
  let cc = JSON.parse(JSON.stringify(docsOf('card').find(c => c.id === p.cardId)));
  cc.atts = [{ id: 'd:x1', name: 'logo.png', type: 'image/png', size: 2000, by: 'store@kuwaitikitchen.com', at: Date.now() }]; cc.log.push({ at: Date.now(), by: 'store@kuwaitikitchen.com', c: 'Here is the logo @Ruby' });
  r = save('STORE', [{ id: cc.id, kind: 'card', json: cc }]);
  ck('Requester attaches a logo and comments', r.ok && !r.rejected.length, r);
  ck('Requester uploads the file to the card', call({ action: 'upload', token: tok('STORE'), card: cc.id, name: 'logo.png', type: 'image/png', data: Buffer.from('LOGO').toString('base64') }).ok);
  const moved = Object.assign({}, cc, { l: L[1].id });
  r = save('STORE', [{ id: cc.id, kind: 'card', json: moved }, { id: L[0].id, kind: 'list', json: Object.assign({}, L[0], { cards: [] }) }, { id: L[1].id, kind: 'list', json: Object.assign({}, L[1], { cards: [cc.id] }) }]);
  ck('Requester moves the card to In progress', r.ok && !r.rejected.length, r);
  r = save('STORE', [{ id: cc.id, kind: 'card', json: Object.assign({}, moved, { title: 'Changed' }) }]);
  ck('...but cannot change the card details (title)', r.rejected.join() === cc.id, r);
  cc = docsOf('card').find(c => c.id === p.cardId);
  r = save('RUBY', [{ id: cc.id, kind: 'card', json: Object.assign({}, cc, { title: cc.title + ' (3 sizes)' }) }]);
  ck('The person who opened it (creator) changes the details', r.ok && !r.rejected.length, r);
}

console.log(`${res.filter(Boolean).length}/${res.length} boards server checks passed`);
process.exit(res.every(Boolean) ? 0 : 1);
