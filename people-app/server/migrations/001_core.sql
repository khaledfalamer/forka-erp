-- Forka People: core schema (Phase 1 skeleton).
-- Runs as the owner role. The application connects as people_app, which is NOT the owner,
-- so row-level security applies to every query it makes.
-- See docs/people/04-data-model.md and 06-security.md.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------- helpers ----------
-- Entities the current request may see. Set per transaction by the server (set_config(..., true)).
-- No setting = empty list = no rows.
create or replace function app_entities() returns uuid[]
language sql stable as $$
  select coalesce(nullif(current_setting('app.entity_ids', true), '')::uuid[], '{}'::uuid[])
$$;

create or replace function app_user() returns uuid
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- ---------- organisation (readable by every signed-in user; no personal data) ----------
create table country (
  code char(2) primary key,
  name_en text not null,
  name_ar text not null,
  currency char(3) not null
);

create table legal_entity (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references country(code),
  legal_name_en text not null,
  legal_name_ar text not null,
  currency char(3) not null,
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now()
);

create table brand (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null
);

create table branch (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references legal_entity(id),
  brand_id uuid references brand(id),
  code text not null unique,
  name_en text not null,
  name_ar text not null,
  city text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  geofence_radius_m int not null default 150,
  timezone text not null default 'Asia/Dubai',
  status text not null default 'active' check (status in ('active','closed'))
);

create table department (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references legal_entity(id),
  name_en text not null,
  name_ar text not null,
  cost_centre_code text
);

create table job_level (
  code text primary key,
  name_en text not null,
  name_ar text not null,
  rank int not null unique
);

create table job_title (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  level_code text not null references job_level(code)
);

-- Positions follow the org structure file (POS-SH-01 ...): a position exists even when vacant.
create table position (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  entity_id uuid not null references legal_entity(id),
  branch_id uuid references branch(id),
  department_id uuid references department(id),
  job_title_id uuid not null references job_title(id),
  reports_to_position_id uuid references position(id),
  headcount int not null default 1 check (headcount >= 0),
  status text not null default 'active' check (status in ('active','planned','closed'))
);

-- ---------- people (row-level security by legal entity) ----------
create table person (
  id uuid primary key default gen_random_uuid(),
  legal_name_en text not null,
  legal_name_ar text,
  preferred_name text,
  date_of_birth date,
  gender text check (gender in ('male','female')),
  nationality text,
  mobile text,
  personal_email citext,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table employment (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references person(id),
  entity_id uuid not null references legal_entity(id),
  employee_no text not null,
  start_date date not null,
  contract_type text not null default 'limited' check (contract_type in ('limited','unlimited','part_time','temporary')),
  probation_end_date date,
  status text not null default 'active' check (status in ('pending_start','active','on_leave_of_absence','notice','exited')),
  exit_date date,
  created_at timestamptz not null default now(),
  unique (entity_id, employee_no)
);
create index on employment(person_id);

-- Job history. Nothing is overwritten: a change closes the current row and adds a new one.
create table assignment (
  id uuid primary key default gen_random_uuid(),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  position_id uuid references position(id),
  job_title_id uuid not null references job_title(id),
  branch_id uuid references branch(id),
  department_id uuid references department(id),
  manager_employment_id uuid references employment(id),
  permit_job_title text,                 -- title on the work permit, which often differs from the real job
  effective_from date not null,
  effective_to date,
  reason text not null default 'hire',
  created_at timestamptz not null default now(),
  created_by uuid,
  check (effective_to is null or effective_to >= effective_from)
);
create index on assignment(employment_id, effective_from);

create table pay_component (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references legal_entity(id),
  code text not null,
  name_en text not null,
  name_ar text not null,
  kind text not null check (kind in ('earning','deduction')),
  unique (entity_id, code)
);

create table salary_line (
  id uuid primary key default gen_random_uuid(),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  pay_component_id uuid not null references pay_component(id),
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);
create index on salary_line(employment_id);

create table document_type (
  code text primary key,
  name_en text not null,
  name_ar text not null,
  requires_expiry boolean not null default true,
  reminder_days int[] not null default '{90,60,30,7,0}',
  data_class text not null default 'D3' check (data_class in ('D2','D3','D4','D5'))
);

create table document (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references person(id),
  entity_id uuid not null references legal_entity(id),
  type_code text not null references document_type(code),
  number_last4 text,                     -- full numbers will be stored field-encrypted (Phase 1A); the skeleton keeps only the last 4
  issue_date date,
  expiry_date date,
  status text not null default 'valid' check (status in ('pending_verification','valid','expired','replaced','rejected')),
  created_at timestamptz not null default now(),
  check (expiry_date is null or issue_date is null or expiry_date >= issue_date)
);
create index on document(expiry_date);

-- ---------- access ----------
create table user_account (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references person(id),
  email citext not null unique,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create table role_grant (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_account(id),
  role text not null check (role in ('CEO','HR_MANAGER','HR_OFFICER','PAYROLL','BRANCH_MANAGER','SYS_ADMIN')),
  scope_type text not null check (scope_type in ('group','entity','branch')),
  scope_id uuid,
  valid_from date not null default current_date,
  valid_to date,
  check ((scope_type = 'group') = (scope_id is null))
);

-- ---------- audit (append-only, hash-chained) ----------
create table audit_event (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_user_id uuid,
  on_behalf_of uuid,
  action text not null,
  table_name text,
  record_id uuid,
  entity_id uuid,
  subject_person_id uuid,
  before jsonb,
  after jsonb,
  request_id text,
  prev_hash bytea,
  hash bytea
);
create index on audit_event(subject_person_id, at);

create table access_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_user_id uuid not null,
  subject_person_id uuid not null,
  entity_id uuid,
  data_class text not null,
  fields text[] not null default '{}',
  screen text
);
create index on access_log(subject_person_id, at);

-- Each audit row stores a hash of itself plus the previous row's hash, so any edit or deletion breaks the chain.
-- Runs as the owner (security definer) so it can read the last row regardless of the caller's entity.
create or replace function audit_chain() returns trigger
language plpgsql security definer set search_path = public as $$
declare last bytea;
begin
  perform pg_advisory_xact_lock(424242);
  select hash into last from audit_event order by id desc limit 1;
  new.prev_hash := last;
  new.hash := digest(
    coalesce(encode(last, 'hex'), '') || '|' || new.at::text || '|' || coalesce(new.actor_user_id::text, '') || '|' ||
    new.action || '|' || coalesce(new.table_name, '') || '|' || coalesce(new.record_id::text, '') || '|' ||
    coalesce(new.before::text, '') || '|' || coalesce(new.after::text, ''), 'sha256');
  return new;
end $$;
create trigger audit_chain before insert on audit_event for each row execute function audit_chain();

-- Recompute the chain; returns the id of the first broken row, or null if intact.
create or replace function audit_verify() returns bigint
language plpgsql security definer set search_path = public as $$
declare r record; last bytea := null; expect bytea;
begin
  for r in select * from audit_event order by id loop
    expect := digest(
      coalesce(encode(last, 'hex'), '') || '|' || r.at::text || '|' || coalesce(r.actor_user_id::text, '') || '|' ||
      r.action || '|' || coalesce(r.table_name, '') || '|' || coalesce(r.record_id::text, '') || '|' ||
      coalesce(r.before::text, '') || '|' || coalesce(r.after::text, ''), 'sha256');
    if r.hash is distinct from expect or r.prev_hash is distinct from last then return r.id; end if;
    last := r.hash;
  end loop;
  return null;
end $$;

-- ---------- row-level security ----------
alter table employment enable row level security;
alter table assignment enable row level security;
alter table salary_line enable row level security;
alter table document enable row level security;
alter table person enable row level security;
alter table audit_event enable row level security;
alter table access_log enable row level security;

create policy entity_rows on employment using (entity_id = any(app_entities())) with check (entity_id = any(app_entities()));
create policy entity_rows on assignment using (entity_id = any(app_entities())) with check (entity_id = any(app_entities()));
create policy entity_rows on salary_line using (entity_id = any(app_entities())) with check (entity_id = any(app_entities()));
create policy entity_rows on document using (entity_id = any(app_entities())) with check (entity_id = any(app_entities()));

-- A person is visible when they have an employment in an allowed entity.
create policy person_read on person for select using (
  exists (select 1 from employment e where e.person_id = person.id and e.entity_id = any(app_entities())));
create policy person_update on person for update using (
  exists (select 1 from employment e where e.person_id = person.id and e.entity_id = any(app_entities())));
create policy person_insert on person for insert with check (true);  -- the server checks the HR role before inserting

create policy audit_read on audit_event for select using (entity_id is null or entity_id = any(app_entities()));
create policy audit_insert on audit_event for insert with check (true);
create policy access_read on access_log for select using (entity_id is null or entity_id = any(app_entities()));
create policy access_insert on access_log for insert with check (actor_user_id = app_user());

-- ---------- privileges for the application role ----------
grant usage on schema public to people_app;
grant select on country, legal_entity, brand, branch, department, job_level, job_title, position, document_type, pay_component to people_app;
grant select on user_account, role_grant to people_app;
grant select, insert, update on person, employment, assignment, salary_line, document to people_app;
-- Logs: the app may add and read, never change or delete.
grant select, insert on audit_event, access_log to people_app;
grant usage on sequence audit_event_id_seq, access_log_id_seq to people_app;
grant execute on function app_entities(), app_user(), audit_verify() to people_app;

-- Entities a user may see: all for an active CEO; otherwise from their grants, their own employment,
-- and the people who report to them. Runs as the owner so it can look across entities.
create or replace function user_entities(u uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct x) filter (where x is not null), '{}') from (
    select le.id as x from legal_entity le
      where exists (select 1 from role_grant g where g.user_id = u and g.role = 'CEO'
                    and current_date >= g.valid_from and (g.valid_to is null or current_date <= g.valid_to))
    union select g.scope_id from role_grant g
      where g.user_id = u and g.scope_type = 'entity' and current_date >= g.valid_from and (g.valid_to is null or current_date <= g.valid_to)
    union select b.entity_id from role_grant g join branch b on b.id = g.scope_id
      where g.user_id = u and g.scope_type = 'branch' and current_date >= g.valid_from and (g.valid_to is null or current_date <= g.valid_to)
    union select e.entity_id from employment e join user_account a on a.person_id = e.person_id where a.id = u
    union select r.entity_id from assignment r
      join employment m on m.id = r.manager_employment_id
      join user_account a on a.person_id = m.person_id
      where a.id = u and r.effective_from <= current_date and (r.effective_to is null or r.effective_to >= current_date)
  ) s
$$;
grant execute on function user_entities(uuid) to people_app;

-- The user's own employments (needed before entity context is set).
create or replace function user_employments(u uuid) returns uuid[]
language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(e.id), '{}') from employment e join user_account a on a.person_id = e.person_id where a.id = u
$$;
grant execute on function user_employments(uuid) to people_app;
