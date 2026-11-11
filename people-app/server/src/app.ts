import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import fstatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type pg from 'pg';
import { config } from './config.js';
import { pool, withTx } from './db.js';
import { loadMe, can, roleSummary, type Me, type EmpRow } from './access.js';
import { audit, logAccess } from './audit.js';

const COOKIE = 'fp_session';

class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code); }
}

// Current job row for an employment (the assignment in force today), with names in both languages.
const EMP_SQL = `
  select e.id as employment_id, e.employee_no, e.status, e.start_date, e.probation_end_date, e.contract_type,
         e.entity_id, le.legal_name_en as entity_en, le.legal_name_ar as entity_ar, le.country_code,
         p.id as person_id, p.legal_name_en as name_en, p.legal_name_ar as name_ar,
         a.id as assignment_id, a.branch_id, a.department_id, a.job_title_id, a.manager_employment_id,
         a.effective_from as job_since, a.permit_job_title,
         jt.name_en as job_en, jt.name_ar as job_ar, jl.name_en as level_en, jl.name_ar as level_ar,
         b.name_en as branch_en, b.name_ar as branch_ar, d.name_en as dept_en, d.name_ar as dept_ar,
         mp.legal_name_en as manager_en, mp.legal_name_ar as manager_ar
  from employment e
  join person p on p.id = e.person_id
  join legal_entity le on le.id = e.entity_id
  left join lateral (
    select * from assignment x where x.employment_id = e.id and x.effective_from <= current_date
      and (x.effective_to is null or x.effective_to >= current_date) order by x.effective_from desc limit 1) a on true
  left join job_title jt on jt.id = a.job_title_id
  left join job_level jl on jl.code = jt.level_code
  left join branch b on b.id = a.branch_id
  left join department d on d.id = a.department_id
  left join employment me on me.id = a.manager_employment_id
  left join person mp on mp.id = me.person_id`;

type Emp = EmpRow & Record<string, any>;

// Returns the employee only if the user may see their work record. Anyone else gets "not found",
// so the answer never reveals whether a person exists outside the user's scope.
async function getEmp(c: pg.PoolClient, id: string, m: Me): Promise<Emp> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, 'not_found');
  const r = (await c.query(EMP_SQL + ' where e.id = $1', [id])).rows[0];
  if (!r || !can.seeWork(m, r)) throw new HttpError(404, 'not_found');
  return r;
}

export function buildApp() {
  const app = Fastify({ logger: config.env === 'test' ? false : config.env === 'development' ? { level: 'warn' } : true, trustProxy: true });
  app.register(cookie, { secret: config.sessionSecret });

  app.setErrorHandler((err: any, req, reply) => {
    if (err instanceof HttpError) return reply.code(err.status).send({ error: err.code, message: err.message });
    if (err.validation || err instanceof z.ZodError) return reply.code(400).send({ error: 'invalid', details: err.issues ?? err.validation });
    req.log.error(err);
    return reply.code(500).send({ error: 'server_error' });
  });

  // Security headers for every response.
  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'same-origin');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Content-Security-Policy',
      "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'");
    return payload;
  });

  async function me(req: FastifyRequest): Promise<Me> {
    const raw = req.cookies[COOKIE];
    const un = raw ? req.unsignCookie(raw) : null;
    if (!un || !un.valid || !un.value) throw new HttpError(401, 'signed_out');
    const m = await loadMe(un.value);
    if (!m) throw new HttpError(401, 'signed_out');
    return m;
  }
  const tx = <T>(m: Me, fn: (c: pg.PoolClient) => Promise<T>) => withTx({ userId: m.userId, entityIds: m.entityIds }, fn);
  const setSession = (reply: FastifyReply, userId: string) =>
    reply.setCookie(COOKIE, userId, { signed: true, httpOnly: true, sameSite: 'lax', secure: config.env === 'production', path: '/', maxAge: 60 * 60 * 12 });

  app.get('/api/health', async () => ({ ok: true, service: 'forka-people' }));

  // ---------- demo sign-in (development only; real sign-in is Google / phone code, Phase 1A) ----------
  app.get('/api/dev/users', async (_req, reply) => {
    if (!config.devLogin) return reply.code(404).send({ error: 'not_found' });
    const r = await pool.query(`select u.email, u.display_name, coalesce(string_agg(distinct g.role, ','), 'EMPLOYEE') as roles
      from user_account u left join role_grant g on g.user_id = u.id where u.status = 'active'
      group by u.email, u.display_name order by min(case g.role when 'CEO' then 1 when 'HR_MANAGER' then 2 when 'HR_OFFICER' then 3 when 'BRANCH_MANAGER' then 4 else 5 end), u.display_name`);
    return r.rows;
  });
  app.post('/api/dev/login', async (req, reply) => {
    if (!config.devLogin) return reply.code(404).send({ error: 'not_found' });
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const u = (await pool.query("select id from user_account where email = $1 and status = 'active'", [email])).rows[0];
    if (!u) throw new HttpError(401, 'unknown_user');
    setSession(reply, u.id);
    return { ok: true };
  });
  app.post('/api/logout', async (_req, reply) => { reply.clearCookie(COOKIE, { path: '/' }); return { ok: true }; });

  app.get('/api/me', async (req) => {
    const m = await me(req);
    const roles = roleSummary(m);
    const hr = m.isCeo || m.grants.some(g => ['HR_MANAGER', 'HR_OFFICER'].includes(g.role));
    const manager = hr || m.grants.some(g => g.role === 'BRANCH_MANAGER');
    return {
      user: { id: m.userId, name: m.displayName, email: m.email, employmentId: m.employmentIds[0] ?? null },
      roles, can: { seePeople: true, seeOrg: true, isHr: hr, isManager: manager },
    };
  });

  app.get('/api/org', async (req) => {
    await me(req);
    const q = (s: string) => pool.query(s).then(r => r.rows);
    const [entities, branches, departments, levels, jobTitles] = await Promise.all([
      q('select id, country_code, legal_name_en, legal_name_ar, currency from legal_entity order by country_code, legal_name_en'),
      q('select b.id, b.entity_id, b.code, b.name_en, b.name_ar, b.city, br.name_en as brand_en, br.name_ar as brand_ar from branch b left join brand br on br.id = b.brand_id order by b.code'),
      q('select id, entity_id, name_en, name_ar from department order by name_en'),
      q('select code, name_en, name_ar, rank from job_level order by rank'),
      q('select t.id, t.name_en, t.name_ar, t.level_code from job_title t join job_level l on l.code = t.level_code order by l.rank, t.name_en'),
    ]);
    return { entities, branches, departments, levels, jobTitles };
  });

  app.get('/api/employees', async (req) => {
    const m = await me(req);
    const { q, branch } = z.object({ q: z.string().max(80).optional(), branch: z.string().uuid().optional() }).parse(req.query);
    return tx(m, async c => {
      const rows = (await c.query(EMP_SQL + " where e.status <> 'exited' order by b.code nulls first, jt.level_code, p.legal_name_en")).rows as Emp[];
      const needle = q?.trim().toLowerCase();
      return rows
        .filter(r => can.seeWork(m, r))
        .filter(r => !branch || r.branch_id === branch)
        .filter(r => !needle || [r.name_en, r.name_ar, r.employee_no, r.job_en].some(v => v && String(v).toLowerCase().includes(needle)))
        .map(publicWork);
    });
  });

  // Work data only (D1/D2). Personal and pay data have their own endpoints so every view can be logged.
  function publicWork(r: Emp) {
    return {
      employmentId: r.employment_id, personId: r.person_id, employeeNo: r.employee_no, status: r.status,
      name: { en: r.name_en, ar: r.name_ar }, job: { en: r.job_en, ar: r.job_ar }, level: { en: r.level_en, ar: r.level_ar },
      branch: { id: r.branch_id, en: r.branch_en, ar: r.branch_ar }, department: { id: r.department_id, en: r.dept_en, ar: r.dept_ar },
      entity: { id: r.entity_id, en: r.entity_en, ar: r.entity_ar, country: r.country_code },
      manager: r.manager_employment_id ? { employmentId: r.manager_employment_id, en: r.manager_en, ar: r.manager_ar } : null,
      startDate: r.start_date, jobSince: r.job_since, probationEnd: r.probation_end_date, contractType: r.contract_type,
      permitJobTitle: r.permit_job_title,
    };
  }

  app.get('/api/employees/:id', async (req) => {
    const m = await me(req);
    const { id } = req.params as { id: string };
    return tx(m, async c => {
      const e = await getEmp(c, id, m);
      const docs = (await c.query(`select d.type_code, t.name_en, t.name_ar, d.expiry_date, d.status
        from document d join document_type t on t.code = d.type_code where d.person_id = $1 and d.entity_id = $2 order by d.expiry_date nulls last`,
        [e.person_id, e.entity_id])).rows;
      return {
        ...publicWork(e),
        documents: docs.map(d => ({ type: d.type_code, name: { en: d.name_en, ar: d.name_ar }, expiry: d.expiry_date, status: d.status })),
        allowed: {
          personal: can.seePersonal(m, e), pay: can.seePay(m, e), changeJob: can.changeJob(m, e),
          backdate: can.backdate(m, e), audit: can.seeAudit(m, e), accessLog: can.seeAccessLog(m, e),
        },
      };
    });
  });

  app.get('/api/employees/:id/history', async (req) => {
    const m = await me(req);
    const { id } = req.params as { id: string };
    return tx(m, async c => {
      const e = await getEmp(c, id, m);
      const rows = (await c.query(`select a.id, a.effective_from, a.effective_to, a.reason, a.permit_job_title,
          jt.name_en as job_en, jt.name_ar as job_ar, b.name_en as branch_en, b.name_ar as branch_ar,
          d.name_en as dept_en, d.name_ar as dept_ar, mp.legal_name_en as manager_en, mp.legal_name_ar as manager_ar,
          u.display_name as changed_by, a.created_at
        from assignment a
        join job_title jt on jt.id = a.job_title_id
        left join branch b on b.id = a.branch_id
        left join department d on d.id = a.department_id
        left join employment me on me.id = a.manager_employment_id
        left join person mp on mp.id = me.person_id
        left join user_account u on u.id = a.created_by
        where a.employment_id = $1 order by a.effective_from desc`, [e.employment_id])).rows;
      const today = new Date().toISOString().slice(0, 10);
      return rows.map(r => ({
        id: r.id, from: r.effective_from, to: r.effective_to, reason: r.reason, permitJobTitle: r.permit_job_title,
        state: r.effective_from > today ? 'scheduled' : (r.effective_to && r.effective_to < today ? 'past' : 'current'),
        job: { en: r.job_en, ar: r.job_ar }, branch: { en: r.branch_en, ar: r.branch_ar }, department: { en: r.dept_en, ar: r.dept_ar },
        manager: r.manager_en ? { en: r.manager_en, ar: r.manager_ar } : null, changedBy: r.changed_by, changedAt: r.created_at,
      }));
    });
  });

  app.get('/api/employees/:id/personal', async (req) => {
    const m = await me(req);
    const { id } = req.params as { id: string };
    return tx(m, async c => {
      const e = await getEmp(c, id, m);
      if (!can.seePersonal(m, e)) {
        await audit(c, { actor: m.userId, action: 'denied.personal', table: 'person', recordId: e.person_id, entityId: e.entity_id, subjectPersonId: e.person_id, requestId: req.id });
        throw new HttpError(403, 'no_access');
      }
      const p = (await c.query('select legal_name_en, legal_name_ar, gender, nationality, date_of_birth, mobile, personal_email from person where id = $1', [e.person_id])).rows[0];
      const fields = ['gender', 'nationality', 'date_of_birth', 'mobile', 'personal_email'];
      await logAccess(c, m.userId, e.person_id, e.entity_id, 'D3', fields, 'profile.personal');
      return { gender: p.gender, nationality: p.nationality, dateOfBirth: p.date_of_birth, mobile: p.mobile, personalEmail: p.personal_email };
    });
  });

  app.get('/api/employees/:id/pay', async (req) => {
    const m = await me(req);
    const { id } = req.params as { id: string };
    return tx(m, async c => {
      const e = await getEmp(c, id, m);
      if (!can.seePay(m, e)) {
        await audit(c, { actor: m.userId, action: 'denied.pay', table: 'salary_line', entityId: e.entity_id, subjectPersonId: e.person_id, requestId: req.id });
        throw new HttpError(403, 'no_access');
      }
      const lines = (await c.query(`select s.amount, s.currency, s.effective_from, s.effective_to, pc.code, pc.name_en, pc.name_ar, pc.kind
        from salary_line s join pay_component pc on pc.id = s.pay_component_id
        where s.employment_id = $1 order by s.effective_from desc, pc.code`, [e.employment_id])).rows;
      await logAccess(c, m.userId, e.person_id, e.entity_id, 'D4', ['salary_line'], 'profile.pay');
      const today = new Date().toISOString().slice(0, 10);
      const current = lines.filter(l => l.effective_from <= today && (!l.effective_to || l.effective_to >= today));
      const total = current.reduce((s, l) => s + (l.kind === 'earning' ? 1 : -1) * Number(l.amount), 0);
      return {
        currency: current[0]?.currency ?? null, monthlyTotal: total.toFixed(2),
        lines: lines.map(l => ({ code: l.code, name: { en: l.name_en, ar: l.name_ar }, amount: l.amount, currency: l.currency, from: l.effective_from, to: l.effective_to })),
      };
    });
  });

  // Job change (transfer / promotion / new manager) with an effective date. History is kept, never overwritten.
  const ChangeBody = z.object({
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    jobTitleId: z.string().uuid(),
    branchId: z.string().uuid(),
    departmentId: z.string().uuid(),
    managerEmploymentId: z.string().uuid().nullable().optional(),
    reason: z.enum(['transfer', 'promotion', 'role_change', 'manager_change', 'correction']),
  });
  app.post('/api/employees/:id/assignments', async (req, reply) => {
    const m = await me(req);
    const { id } = req.params as { id: string };
    const body = ChangeBody.parse(req.body);
    const result = await tx(m, async c => {
      const e = await getEmp(c, id, m);
      if (!can.changeJob(m, e)) {
        await audit(c, { actor: m.userId, action: 'denied.assignment', table: 'assignment', entityId: e.entity_id, subjectPersonId: e.person_id, requestId: req.id });
        throw new HttpError(403, 'no_access');
      }
      const today = new Date().toISOString().slice(0, 10);
      if (body.effectiveFrom < today && !can.backdate(m, e)) throw new HttpError(403, 'backdate_needs_hr_manager', 'Changes dated in the past need the HR Manager.');
      if (!e.assignment_id) throw new HttpError(409, 'no_current_job');
      if (body.effectiveFrom <= e.job_since) throw new HttpError(400, 'date_before_current', 'The new date must be after the current job started.');
      const future = (await c.query('select 1 from assignment where employment_id = $1 and effective_from > current_date', [e.employment_id])).rowCount;
      if (future) throw new HttpError(409, 'already_scheduled', 'A change is already scheduled for this person.');
      const b = (await c.query('select entity_id from branch where id = $1', [body.branchId])).rows[0];
      const d = (await c.query('select entity_id from department where id = $1', [body.departmentId])).rows[0];
      if (!b || !d) throw new HttpError(400, 'unknown_branch_or_department');
      if (b.entity_id !== e.entity_id || d.entity_id !== e.entity_id)
        throw new HttpError(400, 'other_company', 'Moving to another company is a separate process (end and start employment).');
      if (body.managerEmploymentId) {
        if (body.managerEmploymentId === e.employment_id) throw new HttpError(400, 'own_manager', 'A person cannot be their own manager.');
        const mgr = (await c.query('select 1 from employment where id = $1', [body.managerEmploymentId])).rowCount;
        if (!mgr) throw new HttpError(400, 'unknown_manager');
      }
      const before = (await c.query('select * from assignment where id = $1', [e.assignment_id])).rows[0];
      await c.query("update assignment set effective_to = ($1::date - 1) where id = $2", [body.effectiveFrom, e.assignment_id]);
      const created = (await c.query(`insert into assignment(employment_id, entity_id, job_title_id, branch_id, department_id, manager_employment_id,
          permit_job_title, effective_from, reason, created_by) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
        [e.employment_id, e.entity_id, body.jobTitleId, body.branchId, body.departmentId,
         body.managerEmploymentId === undefined ? e.manager_employment_id : body.managerEmploymentId,
         before.permit_job_title, body.effectiveFrom, body.reason, m.userId])).rows[0];
      await audit(c, { actor: m.userId, action: 'assignment.change', table: 'assignment', recordId: created.id, entityId: e.entity_id,
        subjectPersonId: e.person_id, before, after: created, requestId: req.id });
      return { id: created.id, scheduled: body.effectiveFrom > today, payrollFlag: body.effectiveFrom < today };
    });
    return reply.code(201).send(result);
  });

  app.get('/api/employees/:id/audit', async (req) => {
    const m = await me(req);
    const { id } = req.params as { id: string };
    return tx(m, async c => {
      const e = await getEmp(c, id, m);
      if (!can.seeAudit(m, e)) throw new HttpError(403, 'no_access');
      const rows = (await c.query(`select a.id, a.at, a.action, a.table_name, a.before, a.after, u.display_name as actor
        from audit_event a left join user_account u on u.id = a.actor_user_id
        where a.subject_person_id = $1 order by a.id desc limit 200`, [e.person_id])).rows;
      return rows;
    });
  });

  // Who viewed this person's personal or pay data. Employees can see this for themselves.
  app.get('/api/employees/:id/access-log', async (req) => {
    const m = await me(req);
    const { id } = req.params as { id: string };
    return tx(m, async c => {
      const e = await getEmp(c, id, m);
      if (!can.seeAccessLog(m, e)) throw new HttpError(403, 'no_access');
      return (await c.query(`select l.at, l.data_class, l.screen, u.display_name as viewer
        from access_log l join user_account u on u.id = l.actor_user_id
        where l.subject_person_id = $1 order by l.id desc limit 100`, [e.person_id])).rows;
    });
  });

  // Home screen numbers: my team and documents expiring soon (types and dates only, never numbers).
  app.get('/api/dashboard', async (req) => {
    const m = await me(req);
    return tx(m, async c => {
      const rows = (await c.query(EMP_SQL + " where e.status <> 'exited'")).rows as Emp[];
      const visible = rows.filter(r => can.seeWork(m, r) && !m.employmentIds.includes(r.employment_id));
      const ids = visible.map(r => r.person_id);
      const self = rows.find(r => m.employmentIds.includes(r.employment_id));
      const docRows = (await c.query(`select d.person_id, d.type_code, t.name_en, t.name_ar, d.expiry_date
        from document d join document_type t on t.code = d.type_code
        where d.expiry_date is not null and d.expiry_date <= current_date + 60 and d.status in ('valid','expired')
          and d.person_id = any($1::uuid[]) order by d.expiry_date`, [[...ids, ...(self ? [self.person_id] : [])]])).rows;
      const byPerson = new Map(rows.map(r => [r.person_id, r]));
      return {
        me: self ? publicWork(self) : null,
        teamCount: visible.length,
        expiring: docRows.map(d => {
          const r = byPerson.get(d.person_id)!;
          return { employmentId: r.employment_id, name: { en: r.name_en, ar: r.name_ar }, branch: { en: r.branch_en, ar: r.branch_ar },
            type: { en: d.name_en, ar: d.name_ar }, expiry: d.expiry_date };
        }),
      };
    });
  });

  // Serve the built web app in production-like runs.
  const dist = fileURLToPath(new URL('../../web/dist/', import.meta.url));
  if (existsSync(dist)) {
    app.register(fstatic, { root: dist, wildcard: false });
    app.setNotFoundHandler((req, reply) =>
      req.url.startsWith('/api/') ? reply.code(404).send({ error: 'not_found' }) : reply.sendFile('index.html'));
  }
  return app;
}
