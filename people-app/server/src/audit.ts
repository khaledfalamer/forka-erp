import type pg from 'pg';

export async function audit(c: pg.PoolClient, e: {
  actor: string; action: string; table?: string; recordId?: string; entityId?: string | null;
  subjectPersonId?: string | null; before?: unknown; after?: unknown; requestId?: string;
}) {
  await c.query(`insert into audit_event(actor_user_id, action, table_name, record_id, entity_id, subject_person_id, before, after, request_id)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [e.actor, e.action, e.table ?? null, e.recordId ?? null, e.entityId ?? null, e.subjectPersonId ?? null,
     e.before === undefined ? null : JSON.stringify(e.before), e.after === undefined ? null : JSON.stringify(e.after), e.requestId ?? null]);
}

// Every view of personal (D3) or pay (D4) data is recorded.
export async function logAccess(c: pg.PoolClient, actor: string, subjectPersonId: string, entityId: string, dataClass: string, fields: string[], screen: string) {
  await c.query('insert into access_log(actor_user_id, subject_person_id, entity_id, data_class, fields, screen) values ($1,$2,$3,$4,$5,$6)',
    [actor, subjectPersonId, entityId, dataClass, fields, screen]);
}
