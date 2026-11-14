// The Apps Script Boards checks (tests/boards_server_test.js), run against the new Forka Apps server on PostgreSQL.
// The check lines are read from boards_server_test.js itself, so both versions are held to exactly the same rules.
// Needs a throwaway database: TEST_DATABASE_URL=postgres://... node tests/platform_boards_test.mjs (skips without it).
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';

const url = process.env.TEST_DATABASE_URL;
if (!url) { console.log('platform boards checks skipped (no TEST_DATABASE_URL)'); process.exit(0); }
const here = path.dirname(new URL(import.meta.url).pathname), root = path.join(here, '..');
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
process.env.PGOPTIONS = '-c client_min_messages=warning';
const sql = s => execFileSync('psql', [url, '-qAtc', s], { encoding: 'utf8' }).trim();

// fresh tables
sql('drop schema if exists boards cascade; drop schema if exists accounts cascade');
for (const f of ['001_accounts.sql', '002_boards.sql']) execFileSync('psql', [url, '-q', '-f', path.join(root, 'platform/migrations', f)]);
// the same people and sign-ins as the Apps Script test
const PEOPLE = [['ceo@forka.com', 'Khaled Alamer', 'CEO', 'ceo', 'active'], ['admin@forka.com', 'Ruby Ann Margate', 'Admin', 'staff', 'active'],
  ['mkt@forka.com', 'Marketing Head', '', 'manager', 'active'], ['design@forka.com', 'Designer', '', 'staff', 'active'],
  ['store@kuwaitikitchen.com', 'Hamim', '', 'staff', 'active'], ['mnt@forka.com', 'Maintenance Head', '', 'manager', 'active'], ['gone@forka.com', 'Blocked', '', 'staff', 'blocked']];
const SESS = { CEO: 'ceo@forka.com', RUBY: 'admin@forka.com', MKT: 'mkt@forka.com', DES: 'design@forka.com', STORE: 'store@kuwaitikitchen.com', MNT: 'mnt@forka.com' };
const tok = k => 'TOK' + k + '-'.repeat(24 - k.length);
const lit = v => "'" + String(v).replace(/'/g, "''") + "'";
for (const p of PEOPLE) sql(`insert into accounts.people (email, name, title, level, status) values (${p.map(lit).join(',')})`);
for (const [k, e] of Object.entries(SESS)) sql(`insert into accounts.sessions values (${lit(createHash('sha256').update(tok(k)).digest('hex'))}, ${lit(e)}, now() + interval '1 hour')`);

// an email catcher standing in for the Apps Script mail bridge, and the server itself
const dir = mkdtempSync(path.join(tmpdir(), 'fb-')), mailFile = path.join(dir, 'mails.jsonl');
const MAILPORT = 18700 + Math.floor(Math.random() * 200), PORT = MAILPORT + 300;
const sink = spawn(process.execPath, ['-e', `require('http').createServer((q,s)=>{let b='';q.on('data',c=>b+=c);q.on('end',()=>{const j=JSON.parse(b);
  if(j.action==='bridgeMail'&&j.key==='test-bridge')j.mails.forEach(m=>require('fs').appendFileSync(${JSON.stringify(mailFile)},JSON.stringify(m)+'\\n'));s.end('{"ok":true}')})}).listen(${MAILPORT})`], { stdio: 'ignore' });
const u = new URL(url);
const srv = spawn(process.execPath, [path.join(root, 'platform/src/server.js')], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, DATABASE_URL: url, PORT: String(PORT),
  MIGRATE_ON_START: '0', BOARDS_MAIL_URL: `http://127.0.0.1:${MAILPORT}/`, BRIDGE_KEY: 'test-bridge', FILES_DIR: path.join(dir, 'files'), PGHOST: u.hostname } });
const stop = () => { srv.kill(); sink.kill(); };
for (let i = 0; i < 60; i++) { try { execFileSync('curl', ['-sf', `http://127.0.0.1:${PORT}/health`]); break; } catch { sleep(250); } }

// the Apps Script test's helpers, now over HTTP to the new server (synchronous, so the check lines run unchanged)
const call = o => JSON.parse(execFileSync('curl', ['-s', '-H', 'content-type: text/plain;charset=utf-8', '--data-binary', '@-', `http://127.0.0.1:${PORT}/boards`], { input: JSON.stringify(o), encoding: 'utf8', maxBuffer: 1 << 26 }));
const res = []; const ck = (n, ok, i) => { res.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' - ' + JSON.stringify(i).slice(0, 300))); };
const load = (k, since) => call({ action: 'load', token: tok(k), since });
const save = (k, docs) => call({ action: 'save', token: tok(k), docs });
const ids = r => (r.docs || []).map(d => d.id);
const clearMails = () => writeFileSync(mailFile, '');
const readMails = () => { sleep(400); return existsSync(mailFile) ? readFileSync(mailFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []; };
const accountRow = e => { const r = sql(`select email, name, title, level, status, app_proc, '', app_hire, app_branch, method, '', added_by from accounts.people where email=${lit(e)}`); return r ? r.split('|') : null; };

// The check lines from tests/boards_server_test.js, with the few lines that looked inside the Google Sheet replaced by database look-ups.
let body = readFileSync(path.join(here, 'boards_server_test.js'), 'utf8');
body = body.slice(body.indexOf("ck('A wrong or missing sign-in is refused'"), body.indexOf('// --- Apps Script bridge'));
const swap = (a, b) => { if (!body.includes(a)) { console.log('FAIL test line not found: ' + a); res.push(false); } body = body.split(a).join(b); };
swap('mails.length = 0', 'clearMails()');
body = body.replace(/\bmails\b(?!\()/g, 'readMails()');
swap("const row = ap.d.find(x => x[0] === 'sara@forka.com');", "const row = accountRow('sara@forka.com');");
swap('ss.sheets.Data.d.slice(1).forEach(r => { r[4] -= 60000; });', "sql('update boards.docs set at = at - 60000');");
// task rules (14 Nov 2026): read a stored card, and put in a card saved before the rule (no creator), straight from the database
swap("const drow = id => { const r = ss.sheets.Data.d.find(x => x[0] === id); return r && r[3] ? JSON.parse(r[3]) : null; };",
  "const drow = id => { const r = sql(`select json::text from boards.docs where id=${lit(id)} and not del`); return r ? JSON.parse(r) : null; };");
swap("const legacy = (id, json) => ss.sheets.Data.d.push([id, 'card', '', JSON.stringify(json), 1, 'x', '']);",
  "const legacy = (id, json) => sql(`insert into boards.docs (id, kind, scope, json, at, by_, del) values (${lit(id)}, 'card', '', ${lit(JSON.stringify(json))}, 1, 'x', false)`);");
swap("ck('Upload a photo to a card you can see (private Drive folder)', r.ok && /^d:/.test(r.id), r);", "ck('Upload a photo to a card you can see (private storage)', r.ok && /^g:/.test(r.id), r);");
try { new Function('ck', 'call', 'load', 'save', 'ids', 'tok', 'clearMails', 'readMails', 'accountRow', 'sql', 'lit', 'Buffer', body)(ck, call, load, save, ids, tok, clearMails, readMails, accountRow, sql, lit, Buffer); }
catch (e) { console.log('FAIL the checks stopped: ' + e.message); res.push(false); }

// New checks for the server version
{
  const r1 = call({ action: 'load', token: tok('DES') }), t1 = Date.now(); for (let i = 0; i < 10; i++) call({ action: 'load', token: tok('DES'), since: r1.now }); const per = (Date.now() - t1) / 10;
  ck(`A chat refresh is quick (${per.toFixed(0)} ms each here, including starting curl)`, per < 400, per);
  const fileId = 'AbCdEfGhIjKlMn123';
  ck('Old Drive files can be copied in only with the bridge key', call({ action: 'importFile', key: 'wrong', id: fileId, card: 'c1', data: 'QUJD' }).error === 'role'
    && call({ action: 'importFile', key: 'test-bridge', id: fileId, card: 'c1', type: 'text/plain', data: Buffer.from('OLD').toString('base64') }).ok);
  const f = call({ action: 'file', token: tok('DES'), id: 'd:' + fileId });
  ck('...and then open with their old "d:" id for people who can see the card, not for others', f.ok && Buffer.from(f.data, 'base64').toString() === 'OLD' && call({ action: 'file', token: tok('STORE'), id: 'd:' + fileId }).error === 'role', f);
}
console.log(`${res.filter(Boolean).length}/${res.length} platform boards checks passed`);
stop();
process.exit(res.every(Boolean) ? 0 : 1);
