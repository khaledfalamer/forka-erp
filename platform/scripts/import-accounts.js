// Copies the "Forka Apps - Accounts" Sheet into PostgreSQL, once, at go-live.
//
// 1. In the Sheet: File > Download > Comma-separated values (.csv), once for each tab: People, Requests, Activity.
// 2. In the Apps Script project "Forka Apps - Accounts server": Project settings > Script properties > copy the value of SALT.
//    (Without it, PIN sign-in would stop working: PINs are stored as salted hashes.)
// 3. Run (Cloud Shell, with the database reachable):
//      DATABASE_URL=... SALT=... node scripts/import-accounts.js People.csv Requests.csv Activity.csv
// Safe to run again: it refuses if the database already has people, unless you add --replace.
import { readFileSync } from 'node:fs';
import { pool, tx } from '../src/db.js';

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const replace = process.argv.includes('--replace');
if (args.length < 1) { console.log('usage: node scripts/import-accounts.js People.csv [Requests.csv] [Activity.csv] [--replace]'); process.exit(1); }
if (!process.env.SALT) { console.error('Set SALT (from the Apps Script Script properties) so PINs keep working.'); process.exit(1); }

// Small CSV reader (quotes, commas and line breaks inside quotes), enough for Google Sheets exports.
function csv(text) {
  const rows = []; let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') inQ = false; else cell += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ''));
}
const read = f => { const r = csv(readFileSync(f, 'utf8')); return { head: r[0], rows: r.slice(1) }; };
const yes = v => String(v).trim().toUpperCase() === 'TRUE';
const when = v => { const d = new Date(v); return isNaN(d) ? new Date() : d; };
const key = e => String(e || '').trim().toLowerCase();
const pick = (lst, v, def) => (lst.includes(String(v).toLowerCase()) ? String(v).toLowerCase() : def);

const people = read(args[0]);
const reqs = args[1] ? read(args[1]) : { rows: [] };
const acts = args[2] ? read(args[2]) : { rows: [] };

let n;
try { n = await tx(async db => {
  const have = +(await db('select count(*) from accounts.people')).rows[0].count;
  if (have && !replace) throw new Error(`The database already has ${have} people. Add --replace to wipe and copy again.`);
  if (replace) await db('truncate accounts.people, accounts.requests, accounts.activity, accounts.sessions restart identity');
  // People columns: Email, Name, Job title, Clearance, Status, Procurement, Procurement sections, Hiring, Branch Check, Sign-in, PIN hash, Added by, Updated, Updated by
  for (const r of people.rows) {
    if (!key(r[0])) continue;
    await db(`insert into accounts.people (email, name, title, level, status, app_proc, sides, app_hire, app_branch, method, pin_hash, added_by, updated_at, updated_by)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
      key(r[0]), r[1] || '', r[2] || '', pick(['staff', 'manager', 'ceo'], r[3], 'staff'), pick(['active', 'pending', 'blocked'], r[4], 'pending'),
      yes(r[5]), String(r[6] || '').toLowerCase().split(/[,\s]+/).filter(s => ['plan', 'ops', 'fin', 'dept', 'ceo', 'oman'].includes(s)),
      yes(r[7]), yes(r[8]), String(r[9]).toLowerCase() === 'pin' ? 'pin' : 'google', r[10] || '', r[11] || '', when(r[12]), r[13] || '']);
  }
  // Requests: Email, Name, Job title, Reason, Requested, State, Decided by, Decided, Note
  for (const r of reqs.rows) {
    if (!key(r[0])) continue;
    await db(`insert into accounts.requests (email, name, title, why, at, state, decided_by, decided_at, note) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
      key(r[0]), r[1] || '', r[2] || '', r[3] || '', when(r[4]), pick(['waiting', 'approved', 'rejected'], r[5], 'waiting'), r[6] || '', r[7] ? when(r[7]) : null, r[8] || '']);
  }
  // Activity: When, Who, Action, About, Details (oldest first, as in the Sheet)
  for (const r of acts.rows) await db('insert into accounts.activity (at, who, action, about, details) values ($1,$2,$3,$4,$5)', [when(r[0]), r[1] || '', r[2] || '', r[3] || '', r[4] || '']);
  await db("insert into accounts.settings (key, value) values ('SALT', $1) on conflict (key) do update set value = excluded.value", [process.env.SALT]);
  await db("insert into accounts.settings (key, value) values ('VER', $1) on conflict (key) do update set value = excluded.value", [Date.now().toString(36)]);
  return +(await db('select count(*) from accounts.people')).rows[0].count;
}, 'accounts'); } catch (e) { console.error(e.message); await pool.end(); process.exit(1); }
console.log(`Copied ${n} people, ${reqs.rows.length} requests, ${acts.rows.length} activity lines. Everyone signs in once again after the switch.`);
await pool.end();
