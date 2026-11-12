// Start: node src/server.js  (Cloud Run gives PORT).
// On start it brings the database tables up to date (every migration is safe to run again), then listens.
import { readdirSync, readFileSync } from 'node:fs';
import { pool } from './db.js';
import { buildApp } from './app.js';

if (process.env.MIGRATE_ON_START !== '0') {
  const dir = new URL('../migrations/', import.meta.url);
  for (const f of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) await pool.query(readFileSync(new URL(f, dir), 'utf8'));
}
const app = buildApp();
await app.listen({ port: Number(process.env.PORT || 8080), host: '0.0.0.0' });
