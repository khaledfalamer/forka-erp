// Who can see and do what. Rules follow docs/people/03-roles-permissions.md.
// Row-level security in the database already limits rows to the user's entities; these checks narrow further
// (branch, team, data class).
import { pool } from './db.js';

export type Grant = { role: string; scope_type: 'group' | 'entity' | 'branch'; scope_id: string | null };
export type Me = {
  userId: string; email: string; displayName: string; personId: string | null;
  employmentIds: string[]; grants: Grant[]; entityIds: string[]; isCeo: boolean;
};
export type EmpRow = { employment_id: string; entity_id: string; branch_id: string | null; manager_employment_id: string | null };

export async function loadMe(userId: string): Promise<Me | null> {
  const u = (await pool.query("select id, email, display_name, person_id from user_account where id = $1 and status = 'active'", [userId])).rows[0];
  if (!u) return null;
  const grants = (await pool.query(`select role, scope_type, scope_id from role_grant
    where user_id = $1 and current_date >= valid_from and (valid_to is null or current_date <= valid_to)`, [userId])).rows as Grant[];
  const ents = (await pool.query('select user_entities($1) as ids', [userId])).rows[0].ids as string[];
  const emps = (await pool.query('select user_employments($1) as ids', [userId])).rows[0].ids as string[];
  return {
    userId: u.id, email: u.email, displayName: u.display_name, personId: u.person_id,
    employmentIds: emps, grants, entityIds: ents, isCeo: grants.some(g => g.role === 'CEO'),
  };
}

const has = (me: Me, roles: string[], entityId: string) =>
  me.isCeo || me.grants.some(g => roles.includes(g.role) && g.scope_type === 'entity' && g.scope_id === entityId);

export const isSelf = (me: Me, e: EmpRow) => me.employmentIds.includes(e.employment_id);

export const can = {
  // D1/D2: work data (job, branch, manager, shifts, document expiry dates).
  seeWork: (me: Me, e: EmpRow) =>
    isSelf(me, e) || has(me, ['HR_MANAGER', 'HR_OFFICER', 'PAYROLL'], e.entity_id) ||
    (e.branch_id !== null && me.grants.some(g => g.role === 'BRANCH_MANAGER' && g.scope_id === e.branch_id)) ||
    (e.manager_employment_id !== null && me.employmentIds.includes(e.manager_employment_id)),
  // D3: personal data.
  seePersonal: (me: Me, e: EmpRow) => isSelf(me, e) || has(me, ['HR_MANAGER', 'HR_OFFICER'], e.entity_id),
  // D4: pay.
  seePay: (me: Me, e: EmpRow) => isSelf(me, e) || has(me, ['HR_MANAGER', 'PAYROLL'], e.entity_id),
  changeJob: (me: Me, e: EmpRow) => !isSelf(me, e) && has(me, ['HR_MANAGER', 'HR_OFFICER'], e.entity_id),
  backdate: (me: Me, e: EmpRow) => !isSelf(me, e) && has(me, ['HR_MANAGER'], e.entity_id),
  seeAudit: (me: Me, e: EmpRow) => has(me, ['HR_MANAGER'], e.entity_id),
  seeAccessLog: (me: Me, e: EmpRow) => isSelf(me, e) || has(me, ['HR_MANAGER'], e.entity_id),
};

export function roleSummary(me: Me) {
  if (me.isCeo) return ['CEO'];
  const r = [...new Set(me.grants.map(g => g.role))];
  return r.length ? r : ['EMPLOYEE'];
}
