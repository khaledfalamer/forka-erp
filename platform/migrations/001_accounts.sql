-- Accounts: who may sign in to Forka Apps and what they may open (was the "Forka Apps - Accounts" Sheet).
create schema if not exists accounts;

create table if not exists accounts.people (
  id          bigserial primary key,              -- keeps the order people were added (the Sheet row order)
  email       text not null unique,               -- lower case; PIN people get 'pin-xxxxxxxx'
  name        text not null,
  title       text not null default '',
  level       text not null default 'staff' check (level in ('staff','manager','ceo')),
  status      text not null default 'pending' check (status in ('active','pending','blocked')),
  app_proc    boolean not null default false,
  sides       text[] not null default '{}',       -- Procurement sections: plan ops fin dept ceo oman
  app_hire    boolean not null default false,
  app_branch  boolean not null default false,
  method      text not null default 'google' check (method in ('google','pin')),
  pin_hash    text not null default '',           -- salted SHA-256, never sent to a browser
  added_by    text not null default '',
  updated_at  timestamptz not null default now(),
  updated_by  text not null default ''
);

create table if not exists accounts.requests (
  id          bigserial primary key,
  email       text not null,
  name        text not null,
  title       text not null default '',
  why         text not null default '',
  at          timestamptz not null default now(),
  state       text not null default 'waiting' check (state in ('waiting','approved','rejected')),
  decided_by  text not null default '',
  decided_at  timestamptz,
  note        text not null default ''
);
create index if not exists requests_email on accounts.requests (email);

create table if not exists accounts.activity (
  id      bigserial primary key,
  at      timestamptz not null default now(),
  who     text not null default '',
  action  text not null,
  about   text not null default '',
  details text not null default ''
);

-- Sessions: only a hash of the token is stored, so a copy of the database cannot be used to sign in.
create table if not exists accounts.sessions (
  token_hash text primary key,
  email      text not null,
  expires_at timestamptz not null
);
create index if not exists sessions_expiry on accounts.sessions (expires_at);

-- Small settings: PIN salt (copied from the Apps Script property SALT at migration), change stamp, PIN lock.
create table if not exists accounts.settings (
  key   text primary key,
  value text not null
);
