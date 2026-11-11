// Permission and audit tests against a real PostgreSQL test database with demo data.
// Run: npm test (needs a local PostgreSQL; see README).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import pg from 'pg';

process.env.PEOPLE_DB_NAME = 'forka_people_test';
process.env.NODE_ENV = 'test';
const { config } = await import('../src/config.js');
execFileSync('npx', ['tsx', 'scripts/setup-db.ts', '--fresh'], { env: process.env, stdio: 'ignore' });
const { migrate } = await import('../scripts/migrate.js');
const { seed } = await import('../scripts/seed.js');
await migrate();
await seed();
const { buildApp } = await import('../src/app.js');
const { pool } = await import('../src/db.js');

const app = buildApp();
before(() => app.ready());
after(async () => { await app.close(); await pool.end(); });

async function login(email: string) {
  const r = await app.inject({ method: 'POST', url: '/api/dev/login', payload: { email } });
  assert.equal(r.statusCode, 200, r.body);
  const c = r.cookies.find(c => c.name === 'fp_session')!;
  return { cookie: `fp_session=${c.value}` };
}
const get = (h: { cookie: string }, url: string) => app.inject({ method: 'GET', url, headers: h });
const list = async (h: { cookie: string }) => JSON.parse((await get(h, '/api/employees')).body) as any[];
const byName = (rows: any[], n: string) => rows.find(r => r.name.en === n);

const CEO = 'ceo@demo.forka.local', HRM = 'hr.manager@demo.forka.local', HRO = 'hr.officer@demo.forka.local',
  SHJ = 'sharjah.manager@demo.forka.local', OMN = 'oman.manager@demo.forka.local', EMP = 'employee@demo.forka.local';

test('signed-out requests are refused', async () => {
  const r = await app.inject({ method: 'GET', url: '/api/employees' });
  assert.equal(r.statusCode, 401);
});

test('a forged session cookie is refused', async () => {
  const r = await app.inject({ method: 'GET', url: '/api/me', headers: { cookie: 'fp_session=00000000-0000-0000-0000-000000000000' } });
  assert.equal(r.statusCode, 401);
});

test('CEO sees everyone in every entity, including Oman', async () => {
  const rows = await list(await login(CEO));
  assert.equal(rows.length, 27);
  assert.ok(rows.some(r => r.entity.country === 'OM'));
});

test('HR Manager with UAE entities only cannot see Oman staff (entity separation)', async () => {
  const h = await login(HRM);
  const rows = await list(h);
  assert.ok(rows.length > 0);
  assert.ok(rows.every(r => r.entity.country === 'AE'));
  const ceoRows = await list(await login(CEO));
  const omani = byName(ceoRows, 'Faisal Al Busaidi');
  assert.equal((await get(h, `/api/employees/${omani.employmentId}`)).statusCode, 404);
  assert.equal((await get(h, `/api/employees/${omani.employmentId}/pay`)).statusCode, 404);
});

test('Branch manager sees only their branch and never receives salary', async () => {
  const h = await login(SHJ);
  const rows = await list(h);
  assert.ok(rows.length >= 7);
  assert.ok(rows.every(r => r.branch.en === 'Sharjah'), 'only Sharjah staff');
  const body = JSON.stringify(rows);
  for (const k of ['amount', 'salary', 'BASIC', 'mobile', 'dateOfBirth']) assert.ok(!body.includes(k), `list must not contain ${k}`);
  const waiter = byName(rows, 'John Mensah');
  const detail = JSON.parse((await get(h, `/api/employees/${waiter.employmentId}`)).body);
  assert.equal(detail.allowed.pay, false);
  assert.equal(detail.allowed.personal, false);
  assert.equal((await get(h, `/api/employees/${waiter.employmentId}/pay`)).statusCode, 403);
  assert.equal((await get(h, `/api/employees/${waiter.employmentId}/personal`)).statusCode, 403);
});

test('Oman branch manager cannot see UAE staff', async () => {
  const rows = await list(await login(OMN));
  assert.ok(rows.length >= 3);
  assert.ok(rows.every(r => r.entity.country === 'OM'));
});

test('Employee sees their own pay but nobody else\'s, and only themself in the list', async () => {
  const h = await login(EMP);
  const rows = await list(h);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name.en, 'John Mensah');
  const pay = await get(h, `/api/employees/${rows[0].employmentId}/pay`);
  assert.equal(pay.statusCode, 200);
  assert.equal(JSON.parse(pay.body).currency, 'AED');
  const ceoRows = await list(await login(CEO));
  const colleague = byName(ceoRows, 'Hassan Ali');
  assert.equal((await get(h, `/api/employees/${colleague.employmentId}`)).statusCode, 404);
  assert.equal((await get(h, `/api/employees/${colleague.employmentId}/pay`)).statusCode, 404);
});

test('HR Officer sees personal data but not pay', async () => {
  const h = await login(HRO);
  const rows = await list(h);
  const p = byName(rows, 'Aisha Rahman');
  assert.equal((await get(h, `/api/employees/${p.employmentId}/personal`)).statusCode, 200);
  assert.equal((await get(h, `/api/employees/${p.employmentId}/pay`)).statusCode, 403);
});

test('Viewing pay is written to the access log, and the employee can see who looked', async () => {
  const h = await login(HRM);
  const p = byName(await list(h), 'John Mensah');
  assert.equal((await get(h, `/api/employees/${p.employmentId}/pay`)).statusCode, 200);
  const e = await login(EMP);
  const log = JSON.parse((await get(e, `/api/employees/${p.employmentId}/access-log`)).body);
  assert.ok(log.some((l: any) => l.viewer === 'Layla Haddad' && l.data_class === 'D4'));
});

test('Job change keeps history, schedules future dates and is audited', async () => {
  const h = await login(HRO);
  const org = JSON.parse((await get(h, '/api/org')).body);
  const rows = await list(h);
  const p = byName(rows, 'Hassan Ali');
  const fuj = org.branches.find((b: any) => b.code === 'FUJ');
  const dep = org.departments.find((d: any) => d.entity_id === p.entity.id && d.name_en === 'Service Operations');
  const detail = JSON.parse((await get(h, `/api/employees/${p.employmentId}`)).body);
  const jobId = (await pool.query("select id from job_title where name_en = 'Waiter'")).rows[0].id;
  const future = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  const r = await app.inject({ method: 'POST', url: `/api/employees/${p.employmentId}/assignments`, headers: h,
    payload: { effectiveFrom: future, jobTitleId: jobId, branchId: fuj.id, departmentId: dep.id, reason: 'transfer' } });
  assert.equal(r.statusCode, 201, r.body);
  assert.equal(JSON.parse(r.body).scheduled, true);
  const hist = JSON.parse((await get(h, `/api/employees/${p.employmentId}/history`)).body);
  assert.equal(hist.length, 2);
  assert.equal(hist[0].state, 'scheduled');
  assert.equal(hist[1].state, 'current');
  assert.equal(detail.branch.en, 'Sharjah');
  // A second change while one is scheduled is refused.
  const again = await app.inject({ method: 'POST', url: `/api/employees/${p.employmentId}/assignments`, headers: h,
    payload: { effectiveFrom: future, jobTitleId: jobId, branchId: fuj.id, departmentId: dep.id, reason: 'transfer' } });
  assert.equal(again.statusCode, 409);
  const audit = JSON.parse((await get(await login(HRM), `/api/employees/${p.employmentId}/audit`)).body);
  assert.ok(audit.some((a: any) => a.action === 'assignment.change'));
});

test('Back-dated change by an HR Officer is refused; branch manager cannot change jobs', async () => {
  const h = await login(HRO);
  const org = JSON.parse((await get(h, '/api/org')).body);
  const p = byName(await list(h), 'Tesfaye Bekele');
  const dep = org.departments.find((d: any) => d.entity_id === p.entity.id && d.name_en === 'Culinary Operations');
  const jobId = (await pool.query("select id from job_title where name_en = 'Assistant Cook'")).rows[0].id;
  const past = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  const payload = { effectiveFrom: past, jobTitleId: jobId, branchId: p.branch.id, departmentId: dep.id, reason: 'correction' };
  const r = await app.inject({ method: 'POST', url: `/api/employees/${p.employmentId}/assignments`, headers: h, payload });
  assert.equal(r.statusCode, 403);
  assert.equal(JSON.parse(r.body).error, 'backdate_needs_hr_manager');
  const m = await login(SHJ);
  const r2 = await app.inject({ method: 'POST', url: `/api/employees/${p.employmentId}/assignments`, headers: m,
    payload: { ...payload, effectiveFrom: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) } });
  assert.equal(r2.statusCode, 403);
});

test('Moving to another company through a job change is refused', async () => {
  const h = await login(HRM);
  const org = JSON.parse((await get(h, '/api/org')).body);
  const p = byName(await list(h), 'Ram Thapa');
  const myr = org.branches.find((b: any) => b.code === 'MYR');
  const dep = org.departments.find((d: any) => d.entity_id === myr.entity_id);
  const jobId = (await pool.query("select id from job_title where name_en = 'Steward'")).rows[0].id;
  const r = await app.inject({ method: 'POST', url: `/api/employees/${p.employmentId}/assignments`, headers: h,
    payload: { effectiveFrom: new Date(Date.now() + 864e5).toISOString().slice(0, 10), jobTitleId: jobId, branchId: myr.id, departmentId: dep.id, reason: 'transfer' } });
  assert.equal(r.statusCode, 400);
  assert.equal(JSON.parse(r.body).error, 'other_company');
});

test('Database: the app role cannot change or delete audit entries, and sees nothing without context', async () => {
  const c = new pg.Client({ connectionString: config.appUrl });
  await c.connect();
  await assert.rejects(c.query('update audit_event set action = $1', ['x']), /permission denied/);
  await assert.rejects(c.query('delete from audit_event'), /permission denied/);
  await assert.rejects(c.query('delete from salary_line'), /permission denied/);
  const n = (await c.query('select count(*)::int as n from salary_line')).rows[0].n;
  assert.equal(n, 0, 'no entity context = no rows');
  const broken = (await c.query('select audit_verify() as id')).rows[0].id;
  assert.equal(broken, null, 'audit hash chain intact');
  await c.end();
});

test('Tampering with the audit log is detected', async () => {
  const owner = new pg.Client({ connectionString: config.ownerUrl });
  await owner.connect();
  await owner.query("update audit_event set action = 'tampered' where id = (select min(id) from audit_event)");
  const broken = (await owner.query('select audit_verify() as id')).rows[0].id;
  assert.notEqual(broken, null);
  await owner.end();
});

test('Demo sign-in does not exist in production', async () => {
  const prev = config.devLogin;
  (config as any).devLogin = false;
  const r = await app.inject({ method: 'POST', url: '/api/dev/login', payload: { email: CEO } });
  assert.equal(r.statusCode, 404);
  (config as any).devLogin = prev;
});
