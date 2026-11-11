import pg from 'pg';
import { config } from './config.js';

// Dates stay as plain 'YYYY-MM-DD' strings (no timezone shifts).
pg.types.setTypeParser(1082, (v: string) => v);
// Money comes back as a string; keep it exact.
pg.types.setTypeParser(1700, (v: string) => v);

export const pool = new pg.Pool({ connectionString: config.appUrl, max: 10 });

export type Ctx = { userId: string; entityIds: string[] };

// Every request runs in one transaction with the user's entities set, so row-level security filters every query.
export async function withTx<T>(ctx: Ctx, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('begin');
    await c.query("select set_config('app.entity_ids', $1, true), set_config('app.user_id', $2, true)",
      ['{' + ctx.entityIds.join(',') + '}', ctx.userId]);
    const out = await fn(c);
    await c.query('commit');
    return out;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
