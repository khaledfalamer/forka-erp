// In-browser stand-in for the server, used only by the demo build (VITE_DEMO=1).
// It mirrors server/src/access.ts and server/src/app.ts on made-up data. The real protection
// (database row-level security, logs that cannot be edited) lives in the server and its tests.
import raw from './data.json';
import { makeModules } from './modules';

type Any = Record<string, any>;
const D: Any = JSON.parse(JSON.stringify(raw));
const audit: Any[] = [];
const access: Any[] = [];
let session: string | null = null;
const today = () => new Date().toISOString().slice(0, 10);
const addDay = (d: string, n: number) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

class E extends Error { constructor(public status: number, public code: string) { super(code); } }

const byId = <T extends Any>(list: T[], id: string | null | undefined) => list.find(x => x.id === id);

function me() {
  const u = byId(D.users, session);
  if (!u) throw new E(401, 'signed_out');
  const grants: Any[] = u.grants;
  const isCeo = grants.some(g => g.role === 'CEO');
  const employmentIds = D.employments.filter((e: Any) => e.person_id === u.person_id).map((e: Any) => e.id);
  const ents = new Set<string>();
  if (isCeo) D.entities.forEach((e: Any) => ents.add(e.id));
  grants.forEach(g => {
    if (g.scope_type === 'entity') ents.add(g.scope_id);
    if (g.scope_type === 'branch') ents.add(byId(D.branches, g.scope_id)?.entity_id);
  });
  D.employments.filter((e: Any) => employmentIds.includes(e.id)).forEach((e: Any) => ents.add(e.entity_id));
  D.assignments.filter((a: Any) => employmentIds.includes(a.manager_employment_id) && current(a)).forEach((a: Any) => ents.add(a.entity_id));
  return { userId: u.id, email: u.email, displayName: u.display_name, personId: u.person_id, grants, isCeo, employmentIds, entityIds: [...ents] };
}
type Me = ReturnType<typeof me>;

const current = (a: Any) => a.effective_from <= today() && (!a.effective_to || a.effective_to >= today());
const has = (m: Me, roles: string[], ent: string) => m.isCeo || m.grants.some(g => roles.includes(g.role) && g.scope_type === 'entity' && g.scope_id === ent);
const isSelf = (m: Me, e: Any) => m.employmentIds.includes(e.employment_id);
const can = {
  seeWork: (m: Me, e: Any) => isSelf(m, e) || has(m, ['HR_MANAGER', 'HR_OFFICER', 'PAYROLL'], e.entity_id) ||
    (!!e.branch_id && m.grants.some(g => g.role === 'BRANCH_MANAGER' && g.scope_id === e.branch_id)) ||
    (!!e.manager_employment_id && m.employmentIds.includes(e.manager_employment_id)),
  seePersonal: (m: Me, e: Any) => isSelf(m, e) || has(m, ['HR_MANAGER', 'HR_OFFICER'], e.entity_id),
  seePay: (m: Me, e: Any) => isSelf(m, e) || has(m, ['HR_MANAGER', 'PAYROLL'], e.entity_id),
  changeJob: (m: Me, e: Any) => !isSelf(m, e) && has(m, ['HR_MANAGER', 'HR_OFFICER'], e.entity_id),
  backdate: (m: Me, e: Any) => !isSelf(m, e) && has(m, ['HR_MANAGER'], e.entity_id),
  seeAudit: (m: Me, e: Any) => has(m, ['HR_MANAGER'], e.entity_id),
  seeAccessLog: (m: Me, e: Any) => isSelf(m, e) || has(m, ['HR_MANAGER'], e.entity_id),
};

// Same shape as the server's employee row (EMP_SQL).
function row(emp: Any): Any {
  const p = byId(D.persons, emp.person_id)!;
  const le = byId(D.entities, emp.entity_id)!;
  const a = D.assignments.filter((x: Any) => x.employment_id === emp.id && current(x)).sort((x: Any, y: Any) => y.effective_from.localeCompare(x.effective_from))[0] || {};
  const jt = byId(D.jobTitles, a.job_title_id) || {};
  const lv = D.levels.find((l: Any) => l.code === jt.level_code) || {};
  const b = byId(D.branches, a.branch_id) || {};
  const d = byId(D.departments, a.department_id) || {};
  const mgrEmp = byId(D.employments, a.manager_employment_id);
  const m = session ? me() : null;
  const mp = mgrEmp && m && m.entityIds.includes(mgrEmp.entity_id) ? byId(D.persons, mgrEmp.person_id) : null;  // as row-level security would
  return {
    employment_id: emp.id, employee_no: emp.employee_no, status: emp.status, start_date: emp.start_date, probation_end_date: emp.probation_end_date,
    contract_type: emp.contract_type, entity_id: emp.entity_id, entity_en: le.legal_name_en, entity_ar: le.legal_name_ar, country_code: le.country_code,
    person_id: p.id, name_en: p.legal_name_en, name_ar: p.legal_name_ar, assignment_id: a.id, branch_id: a.branch_id ?? null, department_id: a.department_id ?? null,
    job_title_id: a.job_title_id, manager_employment_id: a.manager_employment_id ?? null, job_since: a.effective_from, permit_job_title: a.permit_job_title ?? null,
    job_en: jt.name_en, job_ar: jt.name_ar, level_en: lv.name_en, level_ar: lv.name_ar, branch_en: b.name_en, branch_ar: b.name_ar,
    dept_en: d.name_en, dept_ar: d.name_ar, manager_en: mp?.legal_name_en ?? null, manager_ar: mp?.legal_name_ar ?? null,
  };
}
const rows = (m: Me) => D.employments.filter((e: Any) => m.entityIds.includes(e.entity_id) && e.status !== 'exited').map(row);
function getEmp(m: Me, id: string) {
  const emp = byId(D.employments, id);
  if (!emp || !m.entityIds.includes(emp.entity_id)) throw new E(404, 'not_found');
  const r = row(emp);
  if (!can.seeWork(m, r)) throw new E(404, 'not_found');
  return r;
}
const publicWork = (r: Any) => ({
  employmentId: r.employment_id, personId: r.person_id, employeeNo: r.employee_no, status: r.status,
  name: { en: r.name_en, ar: r.name_ar }, job: { en: r.job_en, ar: r.job_ar }, level: { en: r.level_en, ar: r.level_ar },
  branch: { id: r.branch_id, en: r.branch_en, ar: r.branch_ar }, department: { id: r.department_id, en: r.dept_en, ar: r.dept_ar },
  entity: { id: r.entity_id, en: r.entity_en, ar: r.entity_ar, country: r.country_code },
  manager: r.manager_employment_id ? { employmentId: r.manager_employment_id, en: r.manager_en, ar: r.manager_ar } : null,
  startDate: r.start_date, jobSince: r.job_since, probationEnd: r.probation_end_date, contractType: r.contract_type, permitJobTitle: r.permit_job_title,
});
const roleOrder = (u: Any) => Math.min(...(u.grants.length ? u.grants : [{ role: 'X' }]).map((g: Any) => ({ CEO: 1, HR_MANAGER: 2, HR_OFFICER: 3, BRANCH_MANAGER: 4 } as Any)[g.role] || 5));
const log = (m: Me, action: string, r: Any, before?: Any, after?: Any) =>
  audit.unshift({ id: audit.length + 1, at: new Date().toISOString(), action, subject: r.person_id, entity: r.entity_id, actor: m.displayName, before, after });

function handle(method: string, path: string, body: Any): any {
  const [p, qs] = path.split('?');
  const seg = p.split('/').filter(Boolean);
  if (p === '/health') return { ok: true, service: 'forka-people-demo' };
  if (p === '/dev/users') return [...D.users].sort((a, b) => roleOrder(a) - roleOrder(b) || a.display_name.localeCompare(b.display_name))
    .map((u: Any) => ({ email: u.email, display_name: u.display_name, roles: [...new Set(u.grants.map((g: Any) => g.role))].join(',') || 'EMPLOYEE' }));
  if (p === '/dev/login' && method === 'POST') {
    const u = D.users.find((x: Any) => x.email === body?.email); if (!u) throw new E(401, 'unknown_user'); session = u.id; return { ok: true };
  }
  if (p === '/logout') { session = null; return { ok: true }; }
  const m = me();
  if (p === '/me') {
    const roles = m.isCeo ? ['CEO'] : ([...new Set(m.grants.map(g => g.role))] as string[]);
    const hr = m.isCeo || m.grants.some(g => ['HR_MANAGER', 'HR_OFFICER'].includes(g.role));
    return { user: { id: m.userId, name: m.displayName, email: m.email, employmentId: m.employmentIds[0] ?? null }, roles: roles.length ? roles : ['EMPLOYEE'],
      can: { seePeople: true, seeOrg: true, isHr: hr, isManager: hr || m.grants.some(g => g.role === 'BRANCH_MANAGER') } };
  }
  if (p === '/org') return { entities: D.entities, branches: D.branches, departments: D.departments, levels: D.levels, jobTitles: D.jobTitles };
  if (p === '/employees') {
    const params = new URLSearchParams(qs || '');
    return rows(m).filter((r: Any) => can.seeWork(m, r)).filter((r: Any) => !params.get('branch') || r.branch_id === params.get('branch')).map(publicWork);
  }
  if (p === '/dashboard') {
    const all = rows(m);
    const visible = all.filter((r: Any) => can.seeWork(m, r) && !isSelf(m, r));
    const self = all.find((r: Any) => isSelf(m, r));
    const ids = new Set([...visible.map((r: Any) => r.person_id), ...(self ? [self.person_id] : [])]);
    const limit = addDay(today(), 60);
    const docs = D.documents.filter((d: Any) => d.expiry_date && d.expiry_date <= limit && ids.has(d.person_id) && ['valid', 'expired'].includes(d.status))
      .sort((a: Any, b: Any) => a.expiry_date.localeCompare(b.expiry_date));
    return { me: self ? publicWork(self) : null, teamCount: visible.length, expiring: docs.map((d: Any) => {
      const r = all.find((x: Any) => x.person_id === d.person_id)!; const t = D.documentTypes.find((x: Any) => x.code === d.type_code);
      return { employmentId: r.employment_id, name: { en: r.name_en, ar: r.name_ar }, branch: { en: r.branch_en, ar: r.branch_ar }, type: { en: t.name_en, ar: t.name_ar }, expiry: d.expiry_date };
    }) };
  }
  if (seg[0] === 'employees' && seg[1]) {
    const r = getEmp(m, seg[1]);
    const sub = seg[2];
    if (!sub) {
      const docs = D.documents.filter((d: Any) => d.person_id === r.person_id && d.entity_id === r.entity_id)
        .sort((a: Any, b: Any) => (a.expiry_date || '9').localeCompare(b.expiry_date || '9'));
      return { ...publicWork(r), documents: docs.map((d: Any) => { const t = D.documentTypes.find((x: Any) => x.code === d.type_code); return { type: d.type_code, name: { en: t.name_en, ar: t.name_ar }, expiry: d.expiry_date, status: d.status }; }),
        allowed: { personal: can.seePersonal(m, r), pay: can.seePay(m, r), changeJob: can.changeJob(m, r), backdate: can.backdate(m, r), audit: can.seeAudit(m, r), accessLog: can.seeAccessLog(m, r) } };
    }
    if (sub === 'history') {
      return D.assignments.filter((a: Any) => a.employment_id === r.employment_id).sort((a: Any, b: Any) => b.effective_from.localeCompare(a.effective_from)).map((a: Any) => {
        const jt = byId(D.jobTitles, a.job_title_id)!, b = byId(D.branches, a.branch_id) || {}, d = byId(D.departments, a.department_id) || {};
        const me2 = byId(D.employments, a.manager_employment_id); const mp = me2 && m.entityIds.includes(me2.entity_id) ? byId(D.persons, me2.person_id) : null;
        const by = byId(D.users, a.created_by);
        return { id: a.id, from: a.effective_from, to: a.effective_to, reason: a.reason, permitJobTitle: a.permit_job_title,
          state: a.effective_from > today() ? 'scheduled' : (a.effective_to && a.effective_to < today() ? 'past' : 'current'),
          job: { en: jt.name_en, ar: jt.name_ar }, branch: { en: b.name_en, ar: b.name_ar }, department: { en: d.name_en, ar: d.name_ar },
          manager: mp ? { en: mp.legal_name_en, ar: mp.legal_name_ar } : null, changedBy: by?.display_name ?? null, changedAt: a.created_at };
      });
    }
    if (sub === 'personal') {
      if (!can.seePersonal(m, r)) { log(m, 'denied.personal', r); throw new E(403, 'no_access'); }
      const p = byId(D.persons, r.person_id)!;
      access.unshift({ at: new Date().toISOString(), data_class: 'D3', viewer: m.displayName, subject: r.person_id });
      return { gender: p.gender, nationality: p.nationality, dateOfBirth: p.date_of_birth, mobile: p.mobile, personalEmail: p.personal_email };
    }
    if (sub === 'pay') {
      if (!can.seePay(m, r)) { log(m, 'denied.pay', r); throw new E(403, 'no_access'); }
      const lines = D.salaryLines.filter((s: Any) => s.employment_id === r.employment_id).map((s: Any) => ({ ...s, pc: byId(D.payComponents, s.pay_component_id) }));
      access.unshift({ at: new Date().toISOString(), data_class: 'D4', viewer: m.displayName, subject: r.person_id });
      const cur = lines.filter((l: Any) => l.effective_from <= today() && (!l.effective_to || l.effective_to >= today()));
      return { currency: cur[0]?.currency ?? null, monthlyTotal: cur.reduce((s: number, l: Any) => s + Number(l.amount), 0).toFixed(2),
        lines: lines.map((l: Any) => ({ code: l.pc.code, name: { en: l.pc.name_en, ar: l.pc.name_ar }, amount: l.amount, currency: l.currency, from: l.effective_from, to: l.effective_to })) };
    }
    if (sub === 'audit') {
      if (!can.seeAudit(m, r)) throw new E(403, 'no_access');
      return audit.filter(a => a.subject === r.person_id).map(a => ({ id: a.id, at: a.at, action: a.action, actor: a.actor }));
    }
    if (sub === 'access-log') {
      if (!can.seeAccessLog(m, r)) throw new E(403, 'no_access');
      return access.filter(a => a.subject === r.person_id);
    }
    if (sub === 'assignments' && method === 'POST') {
      if (!can.changeJob(m, r)) { log(m, 'denied.assignment', r); throw new E(403, 'no_access'); }
      const f = body || {};
      if (!/^\d{4}-\d{2}-\d{2}$/.test(f.effectiveFrom || '') || !f.jobTitleId || !f.branchId || !f.departmentId) throw new E(400, 'invalid');
      if (f.effectiveFrom < today() && !can.backdate(m, r)) throw new E(403, 'backdate_needs_hr_manager');
      if (f.effectiveFrom <= r.job_since) throw new E(400, 'date_before_current');
      if (D.assignments.some((a: Any) => a.employment_id === r.employment_id && a.effective_from > today())) throw new E(409, 'already_scheduled');
      const b = byId(D.branches, f.branchId), d = byId(D.departments, f.departmentId);
      if (!b || !d) throw new E(400, 'unknown_branch_or_department');
      if (b.entity_id !== r.entity_id || d.entity_id !== r.entity_id) throw new E(400, 'other_company');
      if (f.managerEmploymentId === r.employment_id) throw new E(400, 'own_manager');
      const before = byId(D.assignments, r.assignment_id)!;
      const prev = { ...before };
      before.effective_to = addDay(f.effectiveFrom, -1);
      const created = { id: crypto.randomUUID(), employment_id: r.employment_id, entity_id: r.entity_id, job_title_id: f.jobTitleId, branch_id: f.branchId,
        department_id: f.departmentId, manager_employment_id: f.managerEmploymentId === undefined ? r.manager_employment_id : f.managerEmploymentId,
        permit_job_title: before.permit_job_title, effective_from: f.effectiveFrom, effective_to: null, reason: f.reason, created_by: m.userId, created_at: new Date().toISOString() };
      D.assignments.push(created);
      log(m, 'assignment.change', r, prev, created);
      return { id: created.id, scheduled: f.effectiveFrom > today(), payrollFlag: f.effectiveFrom < today() };
    }
  }
  const out = mods().handle(method, seg, new URLSearchParams(qs || ''), body || {}, m);
  if (out !== undefined) return out;
  throw new E(404, 'not_found');
}

let _mods: ReturnType<typeof makeModules> | null = null;
const mods = () => (_mods ??= makeModules({ D, E, me, rows, row, can, has, isSelf, publicWork, today, addDay, byId, log, current }));
export type Ctx = { D: Any; E: typeof E; me: typeof me; rows: typeof rows; row: typeof row; can: typeof can; has: typeof has; isSelf: typeof isSelf;
  publicWork: typeof publicWork; today: typeof today; addDay: typeof addDay; byId: typeof byId; log: typeof log; current: typeof current };

export async function mockFetch(method: string, path: string, body?: unknown): Promise<{ status: number; data: any }> {
  await new Promise(r => setTimeout(r, 60));
  try { return { status: 200, data: handle(method, path, body as Any) }; }
  catch (e) { if (e instanceof E) return { status: e.status, data: { error: e.code } }; console.error(e); return { status: 500, data: { error: 'server_error' } }; }
}
