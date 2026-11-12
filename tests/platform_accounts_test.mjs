// The Apps Script accounts checks (tests/server_test.js), run against the new Forka Apps server on PostgreSQL.
// Needs a throwaway database: TEST_DATABASE_URL=postgres://... node tests/platform_accounts_test.mjs
// Without TEST_DATABASE_URL the checks are skipped (so the GitHub Pages checks keep working without a database).
const url = process.env.TEST_DATABASE_URL;
if (!url) { console.log('platform accounts checks skipped (no TEST_DATABASE_URL)'); process.exit(0); }
process.env.DATABASE_URL = url;
process.env.GOOGLE_CLIENT_ID = 'CID.apps.googleusercontent.com';

const { pool, q } = await import('../platform/src/db.js');
const { readFileSync, readdirSync } = await import('node:fs');
const mig = new URL('../platform/migrations/', import.meta.url);
await q('drop schema if exists accounts cascade');
for (const f of readdirSync(mig).filter(f => f.endsWith('.sql')).sort()) await q(readFileSync(new URL(f, mig), 'utf8'));
const { makeAccounts, makeGoogleVerifier, seedIfEmpty } = await import('../platform/src/accounts.js');
const { buildApp } = await import('../platform/src/app.js');

// Pretend Google: the same test tokens as the Apps Script checks.
const tokens = { 'tok-ceo': { email: 'ceo@forka.com' }, 'tok-hamim': { email: 'store@kuwaitikitchen.com' }, 'tok-new': { email: 'new.person@forka.com', name: 'Sara' }, 'tok-other': { email: 'other@forka.com' }, 'tok-badaud': { email: 'ceo@forka.com', aud: 'X' }, 'tok-unver': { email: 'ceo@forka.com', ev: 'false' } };
const fakeFetch = async u => {
  const x = tokens[decodeURIComponent(u.split('id_token=')[1])];
  if (!x) return { status: 400, json: async () => ({}) };
  return { status: 200, json: async () => ({ aud: x.aud || 'CID.apps.googleusercontent.com', iss: 'https://accounts.google.com', email: x.email, email_verified: x.ev || 'true', exp: String(Math.floor(Date.now() / 1000) + 600), name: x.name || '' }) };
};
const app = buildApp({ accounts: makeAccounts({ verifyGoogle: makeGoogleVerifier(fakeFetch) }), logger: false });
// Every call goes over HTTP exactly as the website sends it (text/plain JSON).
const call = async o => JSON.parse((await app.inject({ method: 'POST', url: '/accounts', headers: { 'content-type': 'text/plain;charset=utf-8' }, payload: JSON.stringify(o) })).body);

const res = []; const ck = (n, ok, i) => { res.push(!!ok); console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' - ' + JSON.stringify(i))); };
await seedIfEmpty();
ck('Setup creates the 10 starting people', +(await q('select count(*) from accounts.people')).rows[0].count === 10);
let r = await call({ action: 'google', idToken: 'tok-ceo' }); ck('CEO signs in with Google', r.ok && r.token && r.me.level === 'ceo', r);
const ceo = r.token;
ck('CEO opens every app and every Procurement section without ticking (Oman included)', r.me.apps.proc && r.me.apps.hire && r.me.apps.branch && ['plan', 'ops', 'fin', 'dept', 'ceo', 'oman'].every(x => r.me.sides.includes(x)), r.me);
{ const w = await call({ action: 'who', token: r.token }); ck('Procurement "who" gives the CEO every section', w.ok && w.me.sides.includes('oman'), w); }
ck('CEO receives people, requests and activity', Array.isArray(r.people) && r.people.length === 10 && Array.isArray(r.activity));
ck('No PIN hashes ever sent to the browser', !JSON.stringify(r).includes('pinHash'));
ck('Wrong client id refused', (await call({ action: 'google', idToken: 'tok-badaud' })).error === 'token');
ck('Unverified email refused', (await call({ action: 'google', idToken: 'tok-unver' })).error === 'unverified');
ck('Forged token refused', (await call({ action: 'google', idToken: 'forged' })).error === 'token');
r = await call({ action: 'google', idToken: 'tok-hamim' }); ck('To-confirm person cannot enter', !r.ok && r.status === 'pending', r);
r = await call({ action: 'setStatus', token: ceo, id: 'store@kuwaitikitchen.com', status: 'active' }); ck('CEO confirms Hamim', r.ok && r.people.find(p => p.email === 'store@kuwaitikitchen.com').status === 'active');
r = await call({ action: 'google', idToken: 'tok-hamim' }); const ham = r.token; ck('Hamim signs in after confirm', r.ok && r.me.name === 'Hamim', r);
ck('Staff get only themselves (no people list, no activity)', !r.people && !r.activity && !r.requests);
ck('Staff cannot change people', (await call({ action: 'setStatus', token: ham, id: 'ceo@forka.com', status: 'blocked' })).error === 'role');
r = await call({ action: 'google', idToken: 'tok-new' }); ck('Unknown email -> request form', r.status === 'unknown' && r.email === 'new.person@forka.com', r);
ck('Request needs name and reason', (await call({ action: 'request', idToken: 'tok-new', name: '', why: '' })).error === 'need');
r = await call({ action: 'request', idToken: 'tok-new', name: 'Sara Ali', title: 'Accountant', why: 'Payments' }); ck('Request saved', r.ok && r.status === 'waiting');
ck('Asking again shows waiting', (await call({ action: 'google', idToken: 'tok-new' })).status === 'waiting');
await call({ action: 'request', idToken: 'tok-other', name: 'Omar', why: 'x' });
r = await call({ action: 'me', token: ceo }); ck('CEO sees 2 waiting requests', r.requests.filter(x => x.state === 'waiting').length === 2, r.requests);
r = await call({ action: 'savePerson', token: ceo, id: '', fromReq: 'new.person@forka.com', person: { email: 'new.person@forka.com', name: 'Sara Ali', level: 'staff', status: 'active', apps: { proc: 1 }, sides: ['fin', 'dept'], method: 'google' } });
ck('CEO allows request with Procurement Finance', r.ok && r.people.find(p => p.email === 'new.person@forka.com').sides.join() === 'fin,dept', r);
ck('Request marked approved', r.requests.find(x => x.email === 'new.person@forka.com').state === 'approved');
const ham2 = (await call({ action: 'google', idToken: 'tok-new' })).token; ck('Approved person signs in', !!ham2);
r = await call({ action: 'reject', token: ceo, id: 'other@forka.com', reason: 'Not part of the team' }); ck('CEO rejects with reason', r.ok);
r = await call({ action: 'google', idToken: 'tok-other' }); ck('Rejected person sees reason', r.status === 'rejected' && r.reason === 'Not part of the team', r);
r = await call({ action: 'savePerson', token: ceo, id: '', person: { name: 'Store Helper', method: 'pin', pinNew: '12', status: 'active', apps: { branch: 1 } } }); ck('Short PIN refused', r.error === 'pinBad');
r = await call({ action: 'savePerson', token: ceo, id: '', person: { name: 'Store Helper', method: 'pin', pinNew: '482916', status: 'active', apps: { branch: 1 } } }); ck('PIN person added', r.ok && r.people.some(p => p.name === 'Store Helper' && p.method === 'pin' && p.hasPin));
ck('PIN stored only as hash', !JSON.stringify((await q('select * from accounts.people')).rows).includes('482916'));
r = await call({ action: 'savePerson', token: ceo, id: '', person: { name: 'Other', method: 'pin', pinNew: '482916', status: 'active', apps: {} } }); ck('Duplicate PIN refused', r.error === 'pinDupe');
r = await call({ action: 'pin', pin: '482916' }); ck('PIN person signs in', r.ok && r.me.name === 'Store Helper' && r.me.apps.branch === 1, r);
ck('Wrong PIN refused', (await call({ action: 'pin', pin: '000000' })).error === 'pin');
for (let i = 0; i < 9; i++) await call({ action: 'pin', pin: '111' + i + '11' });
ck('Ten wrong PINs lock PIN sign-in', (await call({ action: 'pin', pin: '482916' })).error === 'locked');
await q("update accounts.settings set value='0' where key='PIN_LOCK'");
r = await call({ action: 'savePerson', token: ceo, id: 'ceo@forka.com', person: { name: 'Khaled Alamer', email: 'x@y.com', level: 'staff', status: 'active', apps: { proc: 1 }, sides: ['ceo'], method: 'google' } }); ck('Cannot remove the last CEO', r.error === 'lastCeo');
r = await call({ action: 'savePerson', token: ceo, id: 'arman@kuwaitikitchen.com', person: { name: 'Arman', email: 'hacker@x.com', level: 'manager', status: 'active', apps: { proc: 1, branch: 1 }, sides: ['ops', 'fin'], method: 'google' } });
const ar = r.people.find(p => p.name === 'Arman'); ck('Clearance change saved and email cannot be swapped', ar && ar.email === 'arman@kuwaitikitchen.com' && ar.level === 'manager' && ar.apps.branch === 1 && ar.sides.join() === 'ops,fin', ar);
await call({ action: 'setStatus', token: ceo, id: 'store@kuwaitikitchen.com', status: 'blocked' });
ck('Blocked person session stops working', (await call({ action: 'me', token: ham })).error === 'session');
await call({ action: 'open', token: ceo, app: 'proc' });
const acts = (await call({ action: 'me', token: ceo })).activity.map(a => a.verb);
ck('Activity has sign-ins, confirm, allow, reject, add, edit, block, open', ['signin', 'confirm', 'allow', 'reject', 'add', 'edit', 'block', 'open', 'req'].every(v => acts.includes(v)), acts);
{
  const r1 = await call({ action: 'me', token: ceo });
  const r2 = await call({ action: 'me', token: ceo, ver: r1.ver });
  ck('Refresh with the same stamp answers "same" without the lists', r1.ver && r2.ok && r2.same && !r2.people && !r2.activity, r2);
  await call({ action: 'open', token: ceo, app: 'hire' }); const r3 = await call({ action: 'me', token: ceo, ver: r1.ver });
  ck('Any change gives a new stamp and the full lists again', r3.ok && !r3.same && Array.isArray(r3.people) && r3.ver !== r1.ver);
  const w = await call({ action: 'who', token: ceo });
  ck('"who" answers with the person only (for Procurement and Hiring)', w.ok && w.me.email === 'ceo@forka.com' && !w.people && !w.activity && !JSON.stringify(w).includes('pinHash'));
  ck('"who" refuses an unknown session', (await call({ action: 'who', token: 'nope' })).error === 'session');
}
{
  const r4 = await call({ action: 'savePerson', token: ceo, id: 'arman@kuwaitikitchen.com', person: { name: 'Arman', email: 'arman@kuwaitikitchen.com', level: 'manager', status: 'active', apps: { proc: 1 }, sides: ['oman'], method: 'google' } });
  ck('CEO can give someone the Oman store section in Procurement', r4.ok && r4.people.find(p => p.email === 'arman@kuwaitikitchen.com').sides.join() === 'oman', r4.error);
}
// New checks for the PostgreSQL version
{
  const tokRow = (await q('select token_hash from accounts.sessions limit 1')).rows[0];
  ck('Only a hash of each session token is stored', tokRow && !tokRow.token_hash.includes('-') && tokRow.token_hash !== ceo);
  const parallel = await Promise.all(Array.from({ length: 6 }, (_, i) => call({ action: 'savePerson', token: ceo, id: '', person: { name: 'P' + i, method: 'pin', pinNew: '700001', status: 'active', apps: {} } })));
  ck('Six people saved at the same moment with the same PIN: only one gets it', parallel.filter(x => x.ok).length === 1, parallel.map(x => x.error || 'ok'));
  const bad = JSON.parse((await app.inject({ method: 'POST', url: '/accounts', headers: { 'content-type': 'text/plain' }, payload: '{not json' })).body);
  ck('Broken request answered with "bad"', bad.error === 'bad');
  const g = await app.inject({ method: 'GET', url: '/accounts' });
  ck('GET answers like the Apps Script ping, open to every page', JSON.parse(g.body).service === 'forka-apps-accounts' && g.headers['access-control-allow-origin'] === '*');
}
{
  const d = await call({ action: 'directory', token: ham2 });
  ck('Boards directory: any signed-in person gets names of active and "To confirm" people, nothing else', d.ok && d.people.some(p => p.email === 'ceo@forka.com' && p.ceo) && !d.people.some(p => p.status === 'blocked') && !JSON.stringify(d).includes('pinHash') && !JSON.stringify(d).includes('apps'), d);
  const i1 = await call({ action: 'invite', token: ham2, email: 'Sara.New@Forka.com', name: 'Sara New', title: 'Designer' });
  const row = (await q("select * from accounts.people where email='sara.new@forka.com'")).rows[0];
  ck('Boards invite adds the person as "To confirm" with no apps', i1.ok && row && row.status === 'pending' && !row.app_proc && !row.app_hire && row.added_by === 'Boards: new.person@forka.com', row);
  ck('Inviting someone who already has an account changes nothing', (await call({ action: 'invite', token: ham2, email: 'ceo@forka.com', name: 'X' })).exists === true);
  ck('Invite without a session is refused', (await call({ action: 'invite', token: 'nope', email: 'a@b.com' })).error === 'session');
}
ck('Sign out ends the session', (await call({ action: 'signout', token: ceo })).ok && (await call({ action: 'me', token: ceo })).error === 'session');
console.log(`${res.filter(Boolean).length}/${res.length} platform accounts checks passed`);
await app.close(); await pool.end();
process.exit(res.every(Boolean) ? 0 : 1);
