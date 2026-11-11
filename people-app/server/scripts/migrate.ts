// Applies migrations/*.sql in order, once each, as the owner role.
import pg from 'pg';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from '../src/config.js';

export async function migrate(url = config.ownerUrl) {
  const dir = fileURLToPath(new URL('../migrations/', import.meta.url));
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  await c.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const done = new Set((await c.query('select name from schema_migrations')).rows.map(r => r.name));
  for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    if (done.has(f)) continue;
    await c.query('begin');
    try {
      await c.query(readFileSync(dir + f, 'utf8'));
      await c.query('insert into schema_migrations(name) values ($1)', [f]);
      await c.query('commit');
      console.log('applied', f);
    } catch (e) { await c.query('rollback'); throw e; }
  }
  await c.end();
}

if (import.meta.url === `file://${process.argv[1]}`) await migrate();
