-- Boards: one row per board, list, card, message, goal... (was the "Data" tab of the "Forka Boards" Sheet).
create schema if not exists boards;
create table if not exists boards.docs (
  id    text primary key,
  kind  text not null,
  scope text not null default '',
  json  jsonb,                 -- null when deleted
  at    bigint not null,       -- milliseconds, like the Sheet's "At"
  by_   text not null default '',
  del   boolean not null default false
);
create index if not exists docs_at on boards.docs (at);
