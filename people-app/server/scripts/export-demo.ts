// Exports the demo database (made-up people only) to web/src/demo/data.json for the in-browser demo build.
import pg from 'pg';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../src/config.js';

const c = new pg.Client({ connectionString: config.ownerUrl });
await c.connect();
pg.types.setTypeParser(1082, (v: string) => v);
pg.types.setTypeParser(1700, (v: string) => v);
const q = async (s: string) => (await c.query(s)).rows;
const data = {
  entities: await q('select id, country_code, legal_name_en, legal_name_ar, currency from legal_entity order by country_code, legal_name_en'),
  brands: await q('select id, name_en, name_ar from brand'),
  branches: await q('select b.id, b.entity_id, b.code, b.name_en, b.name_ar, b.city, br.name_en as brand_en, br.name_ar as brand_ar from branch b left join brand br on br.id = b.brand_id order by b.code'),
  departments: await q('select id, entity_id, name_en, name_ar from department order by name_en'),
  levels: await q('select code, name_en, name_ar, rank from job_level order by rank'),
  jobTitles: await q('select t.id, t.name_en, t.name_ar, t.level_code from job_title t join job_level l on l.code = t.level_code order by l.rank, t.name_en'),
  persons: await q('select id, legal_name_en, legal_name_ar, gender, nationality, date_of_birth, mobile, personal_email from person'),
  employments: await q('select id, person_id, entity_id, employee_no, start_date, contract_type, probation_end_date, status from employment'),
  assignments: await q('select id, employment_id, entity_id, job_title_id, branch_id, department_id, manager_employment_id, permit_job_title, effective_from, effective_to, reason, created_by, created_at from assignment'),
  payComponents: await q('select id, entity_id, code, name_en, name_ar, kind from pay_component'),
  salaryLines: await q('select employment_id, entity_id, pay_component_id, amount, currency, effective_from, effective_to from salary_line'),
  documentTypes: await q('select code, name_en, name_ar from document_type'),
  documents: await q('select person_id, entity_id, type_code, expiry_date, status from document'),
  users: await q("select u.id, u.email, u.display_name, u.person_id, coalesce(json_agg(json_build_object('role', g.role, 'scope_type', g.scope_type, 'scope_id', g.scope_id)) filter (where g.id is not null), '[]') as grants from user_account u left join role_grant g on g.user_id = u.id group by u.id"),
};
await c.end();
const out = fileURLToPath(new URL('../../web/src/demo/data.json', import.meta.url));
writeFileSync(out, JSON.stringify(data));
console.log('wrote', out, Object.fromEntries(Object.entries(data).map(([k, v]) => [k, (v as unknown[]).length])));
