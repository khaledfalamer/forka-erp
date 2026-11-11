-- Forka People: structure for the remaining modules (leave, requests and approvals, time and attendance,
-- onboarding and lifecycle, payroll inputs, performance, learning, HR desk, announcements and policies).
-- Tables only, so the shape of the product is fixed early; server endpoints follow module by module.
-- Rules that come from law (leave days, overtime rates, end of service) are NOT stored here as fixed values:
-- they live in country_rule with a source, effective date, owner and approval status (docs/people/10).

-- ---------- country rules register ----------
create table country_rule (
  id uuid primary key default gen_random_uuid(),
  code text not null,                        -- e.g. AE-LEAVE-ANNUAL
  country_code char(2) references country(code),
  entity_id uuid references legal_entity(id),
  description text not null,
  parameters jsonb not null default '{}',
  source text,
  effective_from date,
  effective_to date,
  owner text,
  adviser text,
  status text not null default 'draft' check (status in ('draft','under_review','approved','superseded')),
  approved_by text,
  approved_on date,
  unique (code, effective_from)
);

create table public_holiday (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references country(code),
  day date not null,
  name_en text not null,
  name_ar text not null,
  status text not null default 'provisional' check (status in ('provisional','confirmed')),
  unique (country_code, day)
);

-- ---------- approvals (shared by every request type) ----------
create table approval_policy (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  entity_id uuid references legal_entity(id),
  conditions jsonb not null default '{}',    -- e.g. {"min_days": 6}
  steps jsonb not null,                      -- e.g. [{"approver":"line_manager"},{"approver":"hr"}]
  version int not null default 1,
  effective_from date not null default current_date,
  approved_by uuid references user_account(id)
);

create table request (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('leave','attendance_correction','schedule_change','letter','profile_update','general','salary_change','termination')),
  entity_id uuid not null references legal_entity(id),
  subject_employment_id uuid not null references employment(id),
  requested_by uuid not null references user_account(id),
  on_behalf boolean not null default false,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('draft','pending','approved','rejected','withdrawn','cancelled')),
  current_step int not null default 1,
  policy_id uuid references approval_policy(id),
  sla_due_at timestamptz,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index on request(subject_employment_id, created_at);

create table approval_step (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references request(id),
  entity_id uuid not null references legal_entity(id),
  step_no int not null,
  approver_rule text not null,               -- line_manager | branch_manager | hr | hr_manager | named
  assigned_to uuid references user_account(id),
  acted_by uuid references user_account(id),
  on_behalf_of uuid references user_account(id),
  action text check (action in ('approved','rejected','escalated','skipped')),
  comment text,
  acted_at timestamptz,
  unique (request_id, step_no)
);

create table delegation (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references user_account(id),
  to_user uuid not null references user_account(id),
  starts_on date not null,
  ends_on date not null,
  check (ends_on >= starts_on and from_user <> to_user)
);

-- ---------- leave ----------
create table leave_type (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null references country(code),
  code text not null,
  name_en text not null,
  name_ar text not null,
  paid_percent int not null default 100,
  counts text not null default 'calendar' check (counts in ('calendar','working')),
  needs_document_after_days int,
  allows_half_day boolean not null default true,
  allows_negative boolean not null default false,
  rule_id uuid references country_rule(id),   -- entitlement and accrual come from the approved rule
  active boolean not null default true,
  unique (country_code, code)
);

-- Balances are always the sum of ledger lines, so every balance can be explained.
create table leave_ledger (
  id bigserial primary key,
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  leave_type_id uuid not null references leave_type(id),
  day date not null,
  days numeric(6,2) not null,
  kind text not null check (kind in ('opening','accrual','taken','adjustment','carry_over','expiry','reversal')),
  source_request_id uuid references request(id),
  note text,
  created_by uuid references user_account(id),
  created_at timestamptz not null default now()
);
create index on leave_ledger(employment_id, leave_type_id);

create table leave_request (
  request_id uuid primary key references request(id),
  entity_id uuid not null references legal_entity(id),
  leave_type_id uuid not null references leave_type(id),
  start_date date not null,
  end_date date not null,
  half_day_start boolean not null default false,
  half_day_end boolean not null default false,
  days numeric(6,2) not null,
  reason text,
  attachment_file_id uuid,
  check (end_date >= start_date)
);

-- ---------- time and attendance ----------
create table shift_template (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id),
  name_en text not null,
  name_ar text not null,
  segments jsonb not null,                   -- [{"start":"10:00","end":"15:00"},{"start":"18:00","end":"23:00"}] (split shift)
  color text
);

create table roster_week (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id),
  week_start date not null,
  status text not null default 'draft' check (status in ('draft','published')),
  version int not null default 1,
  published_by uuid references user_account(id),
  published_at timestamptz,
  unique (branch_id, week_start)
);

create table shift (
  id uuid primary key default gen_random_uuid(),
  roster_week_id uuid not null references roster_week(id),
  entity_id uuid not null references legal_entity(id),
  employment_id uuid references employment(id),
  branch_id uuid not null references branch(id),
  work_date date not null,                   -- an overnight shift belongs to the day it starts
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  break_minutes int not null default 0,
  role_note text,
  status text not null default 'planned' check (status in ('planned','open','cancelled')),
  check (ends_at > starts_at)
);
create index on shift(employment_id, work_date);

create table clock_device (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branch(id),
  kind text not null check (kind in ('tablet','biometric','mobile')),
  label text not null,
  identifier text unique,
  status text not null default 'active' check (status in ('active','revoked')),
  last_seen_at timestamptz
);

-- Raw punches are never changed. Corrections are separate rows.
create table punch (
  id bigserial primary key,
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  at timestamptz not null,
  kind text not null check (kind in ('in','out')),
  source text not null check (source in ('mobile','tablet','biometric','manual')),
  device_id uuid references clock_device(id),
  latitude numeric(9,6),
  longitude numeric(9,6),
  accuracy_m int,
  inside_geofence boolean,
  synced_late boolean not null default false,
  raw jsonb
);
create index on punch(employment_id, at);

create table attendance_day (
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  work_date date not null,
  shift_id uuid references shift(id),
  worked_minutes int not null default 0,
  late_minutes int not null default 0,
  early_leave_minutes int not null default 0,
  overtime_minutes int not null default 0,
  exceptions text[] not null default '{}',   -- late, missed_punch, absent, unscheduled, wrong_branch, outside_geofence
  status text not null default 'open' check (status in ('open','approved','locked')),
  primary key (employment_id, work_date)
);

create table punch_correction (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references request(id),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  work_date date not null,
  corrects_punch_id bigint references punch(id),
  new_at timestamptz,
  kind text check (kind in ('in','out')),
  reason text not null
);

-- ---------- onboarding, lifecycle, letters ----------
create table checklist_template (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('onboarding','exit','probation')),
  name_en text not null,
  name_ar text not null,
  conditions jsonb not null default '{}'     -- country, entity, brand, job family
);
create table checklist_item_template (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_template(id),
  sort int not null,
  title_en text not null,
  title_ar text not null,
  owner_role text not null check (owner_role in ('hr','manager','employee','it','finance')),
  due_offset_days int not null default 0,
  required boolean not null default true
);
create table checklist_run (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_template(id),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  started_on date not null,
  status text not null default 'open' check (status in ('open','done','cancelled'))
);
create table checklist_item (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references checklist_run(id),
  entity_id uuid not null references legal_entity(id),
  item_template_id uuid not null references checklist_item_template(id),
  due_on date,
  done_by uuid references user_account(id),
  done_at timestamptz,
  evidence_file_id uuid
);

create table change_request (
  request_id uuid primary key references request(id),
  entity_id uuid not null references legal_entity(id),
  kind text not null check (kind in ('confirmation','probation_extension','promotion','salary_change','transfer_entity','leave_of_absence','termination','resignation')),
  effective_date date not null,
  details jsonb not null default '{}'
);

create table letter_template (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  language text not null check (language in ('en','ar')),
  title text not null,
  body text not null,                        -- placeholders like {{name}}, {{job_title}}
  shows_salary boolean not null default false,
  version int not null default 1,
  approved_by uuid references user_account(id),
  unique (code, language, version)
);
create table letter_issue (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  template_id uuid not null references letter_template(id),
  request_id uuid references request(id),
  issued_by uuid references user_account(id),
  issued_at timestamptz not null default now()
);

-- ---------- payroll inputs (calculation comes later, after adviser sign-off) ----------
create table pay_group (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references legal_entity(id),
  name text not null,
  currency char(3) not null,
  cut_off_day int not null default 25,
  pay_day int not null default 28
);
create table pay_period (
  id uuid primary key default gen_random_uuid(),
  pay_group_id uuid not null references pay_group(id),
  entity_id uuid not null references legal_entity(id),
  month date not null,                       -- first day of the month
  status text not null default 'open' check (status in ('open','cut_off','exceptions','draft','approved','exported','released','closed')),
  locked_at timestamptz,
  unique (pay_group_id, month)
);
create table payroll_input (
  id uuid primary key default gen_random_uuid(),
  pay_period_id uuid not null references pay_period(id),
  entity_id uuid not null references legal_entity(id),
  employment_id uuid not null references employment(id),
  pay_component_id uuid references pay_component(id),
  source text not null check (source in ('salary','attendance','overtime','leave','adjustment','joiner','leaver','advance','settlement')),
  quantity numeric(10,2),
  amount numeric(12,2),
  note text,
  ref_period_id uuid references pay_period(id)
);
create table payroll_approval (
  id uuid primary key default gen_random_uuid(),
  pay_period_id uuid not null references pay_period(id),
  step text not null check (step in ('hr','finance','ceo')),
  approved_by uuid references user_account(id),
  approved_at timestamptz
);
create table export_file (
  id uuid primary key default gen_random_uuid(),
  pay_period_id uuid not null references pay_period(id),
  kind text not null check (kind in ('provider','wps','journal')),
  sha256 text not null,
  file_id uuid,
  created_by uuid references user_account(id),
  created_at timestamptz not null default now()
);
create table payslip (
  id uuid primary key default gen_random_uuid(),
  pay_period_id uuid not null references pay_period(id),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  file_id uuid,
  net_amount numeric(12,2),
  released_at timestamptz
);

-- ---------- performance ----------
create table review_cycle (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  kind text not null check (kind in ('probation','quarterly','annual')),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'open' check (status in ('planned','open','calibration','closed'))
);
create table scorecard_template (
  id uuid primary key default gen_random_uuid(),
  job_family text not null,                  -- service, culinary, management, support
  name_en text not null,
  name_ar text not null,
  criteria jsonb not null                    -- [{"code":"guest","en":"Guest service","ar":"خدمة الضيوف","weight":25,"type":"behaviour"}]
);
create table review (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references review_cycle(id),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  reviewer_employment_id uuid references employment(id),
  template_id uuid references scorecard_template(id),
  status text not null default 'not_started' check (status in ('not_started','self','manager','hr','done')),
  self_assessment jsonb,
  manager_assessment jsonb,
  overall_rating numeric(3,1),
  outcome text check (outcome in ('confirm','extend','end', null)),
  updated_at timestamptz not null default now()
);
create table goal (
  id uuid primary key default gen_random_uuid(),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  cycle_id uuid references review_cycle(id),
  title text not null,
  measure text,
  target text,
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active','done','dropped'))
);

-- ---------- learning ----------
create table course (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_ar text not null,
  required_for text[] not null default '{}', -- job families
  validity_months int
);
create table training_record (
  id uuid primary key default gen_random_uuid(),
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  course_id uuid not null references course(id),
  completed_on date,
  expires_on date,
  certificate_file_id uuid,
  status text not null default 'assigned' check (status in ('assigned','completed','expired'))
);

-- ---------- HR desk, policies, announcements ----------
create table hr_case (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  entity_id uuid not null references legal_entity(id),
  subject_employment_id uuid references employment(id),
  raised_by uuid references user_account(id),
  category text not null check (category in ('question','payslip','document','letter','grievance','disciplinary','medical','other')),
  sensitive boolean not null default false,   -- grievance, disciplinary, medical: named HR owners only
  owner_user_id uuid references user_account(id),
  title text not null,
  status text not null default 'open' check (status in ('open','waiting','resolved','closed')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create table hr_case_note (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references hr_case(id),
  entity_id uuid not null references legal_entity(id),
  author uuid references user_account(id),
  internal boolean not null default true,
  body text not null,
  created_at timestamptz not null default now()
);
create table policy (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title_en text not null,
  title_ar text not null,
  version text not null,
  file_id uuid,
  requires_ack boolean not null default true,
  published_on date,
  unique (code, version)
);
create table policy_ack (
  policy_id uuid not null references policy(id),
  person_id uuid not null references person(id),
  acknowledged_at timestamptz not null default now(),
  method text not null default 'app',
  primary key (policy_id, person_id)
);
create table announcement (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ar text not null,
  body_en text not null,
  body_ar text not null,
  audience jsonb not null default '{}',      -- entity / brand / branch / department
  published_at timestamptz,
  author uuid references user_account(id)
);

-- ---------- notifications and integrations ----------
create table notification (
  id bigserial primary key,
  user_id uuid not null references user_account(id),
  channel text not null check (channel in ('app','push','email','sms','whatsapp')),
  template text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued','sent','failed','read')),
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
create table integration_message (
  id bigserial primary key,
  integration text not null,                 -- hiring, accounts, biometric, payroll, wps, accounting, email
  direction text not null check (direction in ('in','out')),
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','sent','processed','failed','cancelled')),
  attempts int not null default 0,
  last_error text,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- row-level security for every table that carries a company ----------
do $$
declare t text;
begin
  foreach t in array array['request','approval_step','leave_ledger','leave_request','shift','punch','attendance_day',
    'punch_correction','checklist_run','checklist_item','change_request','letter_issue','pay_period','payroll_input',
    'payslip','review','goal','training_record','hr_case','hr_case_note'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy entity_rows on %I using (entity_id = any(app_entities())) with check (entity_id = any(app_entities()))', t);
    execute format('grant select, insert, update on %I to people_app', t);
  end loop;
end $$;

grant select on country_rule, public_holiday, approval_policy, leave_type, shift_template, roster_week, clock_device,
  checklist_template, checklist_item_template, letter_template, pay_group, payroll_approval, export_file,
  review_cycle, scorecard_template, course, policy, announcement to people_app;
grant insert, update on roster_week, payroll_approval to people_app;
grant select, insert on policy_ack, notification, integration_message, delegation to people_app;
grant usage on sequence leave_ledger_id_seq, punch_id_seq, notification_id_seq, integration_message_id_seq to people_app;
