import { useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Page, Loading, Tabs, Pill, statusTone, Empty, Modal, Field, useApi, errText } from '../ui';
import { LeaveForm } from './Leave';
import type { Me } from '../App';

export function Requests({ me, start = 'mine' }: { me: Me; start?: 'mine' | 'approve' | 'all' }) {
  const { t } = useI18n(); const R = t.m.req;
  const [tab, setTab] = useState<'mine' | 'approve' | 'all'>(start);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState('');
  const list = useApi<any[]>('/requests?box=' + tab, [tab]);
  const pending = useApi<any[]>(me.can.isManager ? '/requests?box=approve' : null, [tab, flash]);
  const reload = () => { list.reload(); pending.reload(); };
  const items: ['mine' | 'approve' | 'all', string, number | null][] = [['mine', R.mine, null]];
  if (me.can.isManager) items.push(['approve', R.toApprove, pending.data?.length || null], ['all', R.allTeam, null]);
  return (
    <Page title={tab === 'approve' ? t.m.nav.approvals : t.m.nav.requests} actions={<button className="btn" onClick={() => { setCreating(true); setFlash(''); }}>{R.newRequest}</button>}>
      {flash && <p className="ok">{flash}</p>}
      {items.length > 1 && <Tabs value={tab} onChange={setTab} items={items} />}
      {!list.data ? <Loading error={list.error} /> : list.data.length === 0 ? <Empty>{tab === 'approve' ? R.nothingToApprove : R.noRequests}</Empty> :
        <div className="stack-sm">{list.data.map(r => <RequestCard key={r.id} r={r} onChange={reload} showEmployee={tab !== 'mine'} />)}</div>}
      {creating && <NewRequest me={me} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setFlash(R.sent); setTab('mine'); reload(); }} />}
    </Page>
  );
}

export function RequestCard({ r, onChange, showEmployee }: { r: any; onChange: () => void; showEmployee?: boolean }) {
  const { t, bi, date } = useI18n(); const R = t.m.req;
  const [mode, setMode] = useState<'' | 'reject'>('');
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const act = async (action: 'approve' | 'reject') => {
    setErr('');
    if (action === 'reject' && !comment.trim()) { setErr(t.m.err.reason_needed); return; }
    try { await api(`/requests/${r.id}/decide`, { method: 'POST', body: { action, comment } }); onChange(); } catch (e) { setErr(errText(t, e)); }
  };
  const withdraw = async () => { try { await api(`/requests/${r.id}/withdraw`, { method: 'POST' }); onChange(); } catch (e) { setErr(errText(t, e)); } };
  return (
    <article className="req-card">
      <header>
        <div>
          <strong>{r.type === 'leave' ? bi(r.leaveName) : R.types[r.type]}</strong>
          {showEmployee && <span className="muted"> · {bi(r.employee.name)} · {bi(r.employee.branch)}</span>}
          <div className="muted small">{summary(r, t, bi, date)}</div>
        </div>
        <Pill tone={statusTone(r.status)}>{t.m.st[r.status] || r.status}</Pill>
      </header>
      <ol className="steps">
        {r.steps.map((s: any) => (
          <li key={s.no} className={s.action || (r.status === 'pending' && s.no === r.currentStep ? 'now' : '')}>
            <span className="dot" aria-hidden>{s.action === 'approved' ? '✓' : s.action === 'rejected' ? '✕' : s.no}</span>
            <span>{s.action ? `${s.action === 'approved' ? R.approvedBy : R.rejectedBy}: ${s.actedBy}` : r.status === 'pending' && s.no === r.currentStep ? `${R.waitingFor}: ${bi(s.who)}` : bi(s.who)}
              {s.comment && <em className="muted"> “{s.comment}”</em>}</span>
          </li>
        ))}
      </ol>
      <footer className="muted small">{date(r.createdAt.slice(0, 10))}{r.onBehalf ? ` · ${R.onBehalf} ${r.requestedBy}` : ''}</footer>
      {err && <p className="error">{err}</p>}
      {r.canAct && (
        <div className="actions wrap">
          {mode === 'reject' ? (
            <>
              <input className="grow" placeholder={t.m.common.reasonForReject} value={comment} onChange={e => setComment(e.target.value)} aria-label={t.m.common.reasonForReject} />
              <button className="btn danger" onClick={() => act('reject')}>{t.m.common.reject}</button>
              <button className="btn ghost" onClick={() => setMode('')}>{t.cancel}</button>
            </>
          ) : (
            <>
              <button className="btn good" onClick={() => act('approve')}>{t.m.common.approve}</button>
              <button className="btn ghost" onClick={() => setMode('reject')}>{t.m.common.reject}</button>
            </>
          )}
        </div>
      )}
      {r.canWithdraw && <div className="actions"><button className="link-btn" onClick={withdraw}>{t.m.common.withdraw}</button></div>}
    </article>
  );
}

function summary(r: any, t: any, bi: any, date: any) {
  const p = r.payload; const R = t.m.req;
  if (r.type === 'leave') return `${date(p.start)}${p.end !== p.start ? ' – ' + date(p.end) : ''} · ${p.days} ${t.m.common.days}${p.reason ? ' · ' + p.reason : ''}`;
  if (r.type === 'letter') return `${R.letters[p.letter] || p.letter}${p.addressedTo ? ' · ' + p.addressedTo : ''}`;
  if (r.type === 'attendance_correction') return `${date(p.date)} · ${p.kind === 'in' ? R.clockIn : R.clockOut} ${p.time} · ${p.reason}`;
  if (r.type === 'schedule_change') return `${date(p.date)} · ${p.from} → ${p.to} · ${p.reason}`;
  if (r.type === 'profile_update') return `${R.fields[p.field] || p.field}`;
  return p.subject || p.question || '';
}

function NewRequest({ me, onClose, onSaved }: { me: Me; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n(); const R = t.m.req;
  const [type, setType] = useState('');
  const [p, setP] = useState<any>({});
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState('');
  if (type === 'leave') return <LeaveForm me={me} onClose={onClose} onSaved={onSaved} />;
  const need: Record<string, string[]> = { letter: ['letter'], attendance_correction: ['date', 'kind', 'time', 'reason'], schedule_change: ['date', 'from', 'to', 'reason'], profile_update: ['field', 'value'], general: ['subject', 'question'] };
  const miss = (k: string) => tried && !p[k];
  const send = async () => {
    setTried(true); setErr('');
    if ((need[type] || []).some(k => !p[k])) return;
    try { await api('/requests', { method: 'POST', body: { type, payload: p } }); onSaved(); } catch (e) { setErr(errText(t, e)); }
  };
  const set = (k: string) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });
  return (
    <Modal title={R.newRequest} onClose={onClose}>
      {!type ? (
        <div className="choice-grid">
          <p className="muted">{R.choose}</p>
          {['leave', 'letter', 'attendance_correction', 'schedule_change', 'profile_update', 'general'].map(k => (
            <button key={k} className="choice" onClick={() => { setType(k); setP(k === 'letter' ? { letter: 'salary_certificate', language: 'en' } : k === 'attendance_correction' ? { kind: 'out' } : {}); }}>{R.types[k]}</button>
          ))}
        </div>
      ) : (
        <div className="form">
          <h3>{R.types[type]}</h3>
          {type === 'letter' && <>
            <Field label={R.letter}><select value={p.letter} onChange={set('letter')}>{Object.entries(R.letters).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></Field>
            <Field label={R.addressedTo}><input value={p.addressedTo || ''} onChange={set('addressedTo')} /></Field>
            <Field label={R.language}><select value={p.language} onChange={set('language')}><option value="en">English</option><option value="ar">العربية</option></select></Field>
          </>}
          {type === 'attendance_correction' && <>
            <Field label={t.m.common.date} missing={miss('date')}><input type="date" value={p.date || ''} onChange={set('date')} /></Field>
            <Field label={R.inOut}><select value={p.kind} onChange={set('kind')}><option value="in">{R.clockIn}</option><option value="out">{R.clockOut}</option></select></Field>
            <Field label={R.time} missing={miss('time')}><input type="time" value={p.time || ''} onChange={set('time')} /></Field>
            <Field label={t.m.leave.reason} missing={miss('reason')}><input value={p.reason || ''} onChange={set('reason')} /></Field>
          </>}
          {type === 'schedule_change' && <>
            <Field label={t.m.common.date} missing={miss('date')}><input type="date" value={p.date || ''} onChange={set('date')} /></Field>
            <Field label={R.fromShift} missing={miss('from')}><input value={p.from || ''} onChange={set('from')} /></Field>
            <Field label={R.toShift} missing={miss('to')}><input value={p.to || ''} onChange={set('to')} /></Field>
            <Field label={t.m.leave.reason} missing={miss('reason')}><input value={p.reason || ''} onChange={set('reason')} /></Field>
          </>}
          {type === 'profile_update' && <>
            <Field label={R.field} missing={miss('field')}><select value={p.field || ''} onChange={set('field')}><option value="">—</option>{Object.entries(R.fields).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></Field>
            <Field label={R.newValue} missing={miss('value')}><input value={p.value || ''} onChange={set('value')} /></Field>
          </>}
          {type === 'general' && <>
            <Field label={R.subject} missing={miss('subject')}><input value={p.subject || ''} onChange={set('subject')} /></Field>
            <Field label={R.question} missing={miss('question')}><textarea rows={4} value={p.question || ''} onChange={set('question')} /></Field>
          </>}
          {err && <p className="error">{err}</p>}
          <div className="actions"><button className="btn" onClick={send}>{t.m.common.submit}</button><button className="btn ghost" onClick={() => setType('')}>{t.back}</button></div>
        </div>
      )}
    </Modal>
  );
}
