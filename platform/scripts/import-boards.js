// Copies the "Forka Boards" Sheet (tab Data) into PostgreSQL, once, at the Boards switch.
// 1. In the Sheet "Forka Boards": tab Data > File > Download > Comma-separated values (.csv).
// 2. Cloud Shell (Cloud SQL Auth Proxy running):  PGHOST=127.0.0.1 PGPORT=5433 PGUSER=forka_app PGDATABASE=Forka \
//      node scripts/import-boards.js Data.csv
// Refuses to run if the database already has Boards rows, unless you add --replace.
import { readFileSync } from 'node:fs';
import { pool, tx } from '../src/db.js';
import { csv } from './csv.js';

const file = process.argv.slice(2).find(a => !a.startsWith('--'));
const replace = process.argv.includes('--replace');
if (!file) { console.log('usage: node scripts/import-boards.js Data.csv [--replace]'); process.exit(1); }
const rows = csv(readFileSync(file, 'utf8')).slice(1); // Id, Kind, Scope, Json, At, By, Deleted
let n = 0, skipped = 0;
try {
  await tx(async db => {
    const have = +(await db('select count(*) from boards.docs')).rows[0].count;
    if (have && !replace) throw new Error(`The database already has ${have} Boards rows. Add --replace to wipe and copy again.`);
    if (replace) await db('truncate boards.docs');
    for (const r of rows) {
      const id = String(r[0] || '').trim(); if (!id) continue;
      const del = String(r[6]).trim().toUpperCase() === 'TRUE';
      let json = null;
      if (!del) { try { json = JSON.parse(r[3] || 'null'); } catch { skipped++; continue; } }
      await db(`insert into boards.docs (id, kind, scope, json, at, by_, del) values ($1,$2,$3,$4,$5,$6,$7)
        on conflict (id) do update set kind=excluded.kind, scope=excluded.scope, json=excluded.json, at=excluded.at, by_=excluded.by_, del=excluded.del`,
      [id, String(r[1] || ''), String(r[2] || ''), json === null ? null : JSON.stringify(json), Number(r[4]) || Date.now(), String(r[5] || ''), del]);
      n++;
    }
  }, 'boards');
} catch (e) { console.error(e.message); await pool.end(); process.exit(1); }
console.log(`Copied ${n} Boards rows${skipped ? ` (${skipped} rows with broken text skipped)` : ''}.`);
await pool.end();
