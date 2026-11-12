// Applies migrations/*.sql in order. Safe to run again (every statement is "if not exists").
import { readdirSync, readFileSync } from 'node:fs';
import { pool } from '../src/db.js';
const dir = new URL('../migrations/', import.meta.url);
for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  await pool.query(readFileSync(new URL(f, dir), 'utf8'));
  console.log('applied', f);
}
await pool.end();
