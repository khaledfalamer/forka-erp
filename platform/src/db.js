// One PostgreSQL for all Forka apps (Cloud SQL in the project forka-apps).
// Either DATABASE_URL, or the standard PG* settings: on Cloud Run PGHOST=/cloudsql/forka-apps:me-central1:forka-db,
// PGUSER=forka_app, PGDATABASE=Forka, and PGPASSWORD from Secret Manager (so the password never needs URL-encoding).
import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  max: Number(process.env.DB_POOL || 5),
  ssl: process.env.DB_SSL === '1' ? { rejectUnauthorized: false } : undefined,
});

export const q = (text, params) => pool.query(text, params);

// Run fn inside one transaction. lockKey = serialise writes of one app (like Apps Script's LockService).
export async function tx(fn, lockKey) {
  const c = await pool.connect();
  try {
    await c.query('begin');
    if (lockKey) await c.query('select pg_advisory_xact_lock(hashtext($1))', [lockKey]);
    const r = await fn((text, params) => c.query(text, params));
    await c.query('commit');
    return r;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
