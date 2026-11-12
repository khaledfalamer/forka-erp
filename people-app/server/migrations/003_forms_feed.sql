-- Forka People: request forms built by HR, team feed, and new joiner portal progress.

create table form_definition (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  fields jsonb not null,            -- [{"key":"item","label":{"en":"Item","ar":"القطعة"},"type":"select","required":true,"options":["Shirt"]}]
  steps jsonb not null,             -- ["line_manager","hr","finance"]
  actions jsonb not null default '[]', -- [{"kind":"email","to":"store"},{"kind":"notify_employee"},{"kind":"add_to_payroll"}]
  active boolean not null default true,
  version int not null default 1,
  updated_by uuid references user_account(id),
  updated_at timestamptz not null default now()
);

-- A submitted form is a request (type 'custom') with its answers in request.payload; automatic actions are logged here.
alter table request drop constraint if exists request_type_check;
alter table request add constraint request_type_check check (type in ('leave','attendance_correction','schedule_change','letter','profile_update','general','salary_change','termination','custom'));
create table automation_run (
  id bigserial primary key,
  request_id uuid not null references request(id),
  entity_id uuid not null references legal_entity(id),
  action jsonb not null,
  status text not null default 'queued' check (status in ('queued','done','failed')),
  error text,
  created_at timestamptz not null default now()
);

create table feed_post (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid references legal_entity(id),   -- null = whole group
  branch_id uuid references branch(id),
  author uuid not null references user_account(id),
  kind text not null default 'post' check (kind in ('post','welcome','announcement')),
  body text not null,
  language text not null default 'en' check (language in ('en','ar')),
  hidden boolean not null default false,        -- HR can hide a post; it is never deleted
  created_at timestamptz not null default now()
);
create table feed_like (post_id uuid not null references feed_post(id), user_id uuid not null references user_account(id), primary key (post_id, user_id));
create table feed_comment (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_post(id),
  author uuid not null references user_account(id),
  body text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table welcome_progress (
  employment_id uuid not null references employment(id),
  entity_id uuid not null references legal_entity(id),
  step text not null check (step in ('welcome','forms','documents','team','company','training')),
  done_at timestamptz not null default now(),
  primary key (employment_id, step)
);

alter table automation_run enable row level security;
create policy entity_rows on automation_run using (entity_id = any(app_entities())) with check (entity_id = any(app_entities()));
alter table welcome_progress enable row level security;
create policy entity_rows on welcome_progress using (entity_id = any(app_entities())) with check (entity_id = any(app_entities()));
-- Feed: group-wide posts (entity null) are visible to everyone; others only within the user's companies.
alter table feed_post enable row level security;
create policy feed_rows on feed_post using (entity_id is null or entity_id = any(app_entities())) with check (entity_id is null or entity_id = any(app_entities()));

grant select on form_definition to people_app;
grant insert, update on form_definition to people_app;
grant select, insert, update on automation_run, feed_post, feed_comment, welcome_progress to people_app;
grant select, insert, delete on feed_like to people_app;
grant usage on sequence automation_run_id_seq to people_app;
