import { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Page, Loading, Tabs, Pill, statusTone, Empty, Modal, Field, useApi, errText } from '../ui';
import { RequestCard } from './Requests';
import type { Me } from '../App';

export function Leave({ me }: { me: Me }) {
  const { t } = useI18n(); const L = t.m.leave;
  const [tab, setTab] = useState<'mine' | 'calendar'>('mine');
  const [asking, setAsking] = useState(false);
  const [flash, setFlash] = useState('');
  const bal = useApi<any[]>('/leave/balances');
  const reqs = useApi<any[]>('/requests?box=mine');
  const reload = () => { bal.reload(); reqs.reload(); };
  return (
    <Page title={L.title} actions={<button className="btn" onClick={() => { setAsking(true); setFlash(''); }}>{L.request}</button>}>
      {flash && <p className="ok">{flash}</p>}
      {me.can.isManager && <Tabs value={tab} onChange={setTab} items={[['mine', L.balances], ['calendar', L.calendar]]} />}
      {tab === 'mine' ? (
        <>
          {!bal.data ? <Loading error={bal.error} /> : <Balances list={bal.data} />}
          <section className="stack-sm">
            <h2>{L.myRequests}</h2>
            {!reqs.data ? <Loading error={reqs.error} /> : reqs.data.filter(r => r.type === 'leave').length === 0 ? <Empty>{t.m.req.noRequests}</Empty> :
              reqs.data.filter(r => r.type === 'leave').map(r => <RequestCard key={r.id} r={r} onChange={reload} />)}
          </section>
          <p className="muted small">{L.policyNote}</p>
        </>
      ) : <TeamCalendar />}
      {asking && <LeaveForm me={me} onClose={() => setAsking(false)} onSaved={() => { setAsking(false); setFlash(t.m.req.sent); reload(); }} />}
    </Page>
  );
}

function Balances({ list }: { list: any[] }) {
  const { t, bi, date } = useI18n(); const L = t.m.leave;
  const [open, setOpen] = useState<string | null>(null);
  const tracked = list.filter(b => b.tracked);
  const other = list.filter(b => !b.tracked);
  return (
    <>
      <div className="cards">
        {tracked.map(b => (
          <button key={b.code} className={'card balance tone-' + (b.code === 'annual' ? 'sea' : 'sage')} onClick={() => setOpen(open === b.code ? null : b.code)} aria-expanded={open === b.code}>
            <div className="card-label">{bi(b.name)}</div>
            <div className="card-number">{fmt(b.balance)} <small>{t.m.common.days}</small></div>
            <div className="muted small">{L.available}{b.pending ? ` · ${fmt(b.pending)} ${L.pendingNote}` : ''}</div>
          </button>
        ))}
      </div>
      {open && (
        <section className="panel">
          <h2>{L.history}</h2>
          <table className="table"><tbody>
            {tracked.find(b => b.code === open)!.lines.map((l: any, i: number) => (
              <tr key={i}><td>{date(l.day)}</td><td>{L.kinds[l.kind] || l.kind}</td><td className="muted">{l.note}</td><td className={'num ' + (l.days < 0 ? 'neg' : 'pos')}>{l.days > 0 ? '+' : ''}{fmt(l.days)}</td></tr>
            ))}
          </tbody></table>
        </section>
      )}
      <div className="chips">
        {other.map(b => <span key={b.code} className="chip">{bi(b.name)}{b.perYear ? ` · ${b.perYear} ${t.m.common.days}` : ''}{b.paid === 0 ? ` · ${L.unpaid}` : ''}</span>)}
      </div>
    </>
  );
}
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

export function LeaveForm({ me, onClose, onSaved, employmentId }: { me: Me; onClose: () => void; onSaved: () => void; employmentId?: string }) {
  const { t, bi, date } = useI18n(); const L = t.m.leave;
  const team = useApi<any[]>(me.can.isManager ? '/employees' : null);
  const [emp, setEmp] = useState(employmentId || me.user.employmentId || '');
  const types = useApi<any[]>(emp ? '/leave/types?emp=' + emp : null, [emp]);
  const [f, setF] = useState({ leaveType: 'annual', start: '', end: '', halfStart: false, halfEnd: false, reason: '', attachment: '' });
  const [preview, setPreview] = useState<any>(null);
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setPreview(null);
    if (!f.start || !f.end || f.end < f.start) return;
    api(`/leave/preview?emp=${emp}&type=${f.leaveType}&start=${f.start}&end=${f.end}&hs=${f.halfStart ? 1 : 0}&he=${f.halfEnd ? 1 : 0}`).then(setPreview).catch(() => {});
  }, [f.leaveType, f.start, f.end, f.halfStart, f.halfEnd, emp]);
  const type = types.data?.find(x => x.code === f.leaveType);
  const needsDoc = type?.docAfter && preview && preview.days > type.docAfter;
  const send = async () => {
    setTried(true); setErr('');
    if (!f.start || !f.end || (needsDoc && !f.attachment)) return;
    setBusy(true);
    try { await api('/leave/requests', { method: 'POST', body: { ...f, employmentId: emp } }); onSaved(); }
    catch (e) { setErr(errText(t, e)); } finally { setBusy(false); }
  };
  return (
    <Modal title={L.request} onClose={onClose}>
      <div className="form">
        {me.can.isManager && team.data && (
          <Field label={L.forWho}>
            <select value={emp} onChange={e => setEmp(e.target.value)}>
              {me.user.employmentId && <option value={me.user.employmentId}>{L.me}</option>}
              {team.data.filter(p => p.employmentId !== me.user.employmentId).map(p => <option key={p.employmentId} value={p.employmentId}>{bi(p.name)} · {bi(p.branch)}</option>)}
            </select>
          </Field>
        )}
        <Field label={L.type}>
          <select value={f.leaveType} onChange={e => setF({ ...f, leaveType: e.target.value })}>
            {types.data?.map(x => <option key={x.code} value={x.code}>{bi(x.name)}</option>)}
          </select>
        </Field>
        <Field label={L.from} missing={tried && !f.start}><input type="date" value={f.start} onChange={e => setF({ ...f, start: e.target.value, end: f.end && f.end >= e.target.value ? f.end : e.target.value })} /></Field>
        <Field label={L.to} missing={tried && !f.end}><input type="date" value={f.end} min={f.start} onChange={e => setF({ ...f, end: e.target.value })} /></Field>
        {type?.halfDay && (
          <div className="checks">
            <label className="check"><input type="checkbox" checked={f.halfStart} onChange={e => setF({ ...f, halfStart: e.target.checked })} /> {L.halfStart}</label>
            {f.end !== f.start && <label className="check"><input type="checkbox" checked={f.halfEnd} onChange={e => setF({ ...f, halfEnd: e.target.checked })} /> {L.halfEnd}</label>}
          </div>
        )}
        <Field label={L.reason}><input value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} /></Field>
        {(needsDoc || f.leaveType === 'sick') && (
          <Field label={L.attachment} missing={tried && needsDoc && !f.attachment} hint={t.m.common.demoFile}>
            <input type="file" accept="image/*,application/pdf" onChange={e => setF({ ...f, attachment: e.target.files?.[0]?.name || '' })} />
          </Field>
        )}
        {preview && (
          <div className="summary">
            <div><span className="muted">{L.days}</span><strong>{preview.days}</strong></div>
            {preview.balanceAfter !== null && <div><span className="muted">{L.after}</span><strong className={preview.balanceAfter < 0 ? 'neg' : ''}>{fmt(preview.balanceAfter)}</strong></div>}
            <div><span className="muted">{L.approvers}</span><strong>{preview.steps.map((s: any) => bi(s)).join(' → ')}</strong></div>
            {preview.overlaps && <p className="error">{L.overlap}</p>}
            {preview.holidays.length > 0 && <p className="muted small">{L.holidaysIn}: {preview.holidays.map((h: any) => `${bi(h.name)} (${date(h.day)})`).join(', ')}</p>}
          </div>
        )}
        {err && <p className="error">{err}</p>}
        <div className="actions"><button className="btn" onClick={send} disabled={busy}>{t.m.common.submit}</button><button className="btn ghost" onClick={onClose}>{t.cancel}</button></div>
      </div>
    </Modal>
  );
}

function TeamCalendar() {
  const { t, bi, lang } = useI18n(); const L = t.m.leave;
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const cal = useApi<any>('/leave/calendar?month=' + month, [month]);
  const shift = (n: number) => { const d = new Date(month + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); setMonth(d.toISOString().slice(0, 7)); };
  if (!cal.data) return <Loading error={cal.error} />;
  const days: string[] = []; for (let d = cal.data.first; d <= cal.data.last; d = new Date(new Date(d + 'T00:00:00Z').getTime() + 864e5).toISOString().slice(0, 10)) days.push(d);
  const label = new Date(month + '-01T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { month: 'long', year: 'numeric' });
  return (
    <section className="panel">
      <div className="row-between"><button className="btn ghost sm" onClick={() => shift(-1)}>{t.m.common.previous}</button><h2>{label}</h2><button className="btn ghost sm" onClick={() => shift(1)}>{t.m.common.next}</button></div>
      {cal.data.people.length === 0 ? <Empty>{L.noLeave}</Empty> : (
        <div className="cal-scroll">
          <table className="cal">
            <thead><tr><th />{days.map(d => <th key={d} className={cal.data.holidays.some((h: any) => h.day === d) ? 'hol' : ''}>{+d.slice(8)}</th>)}</tr></thead>
            <tbody>{cal.data.people.map((p: any) => (
              <tr key={p.employmentId}><th className="cal-name">{bi(p.name)}<small>{bi(p.branch)}</small></th>
                {days.map(d => { const x = p.days.find((y: any) => y.start <= d && y.end >= d); return <td key={d} className={x ? 'on ' + x.status : ''} title={x ? t.m.st[x.status] : ''} />; })}
              </tr>))}</tbody>
          </table>
        </div>
      )}
      <div className="legend"><span><i className="sw approved" />{t.m.st.approved}</span><span><i className="sw pending" />{t.m.st.pending}</span><span><i className="sw hol" />{t.m.set.holidays}</span></div>
    </section>
  );
}

export const LeaveStatus = ({ s }: { s: string }) => { const { t } = useI18n(); return <Pill tone={statusTone(s)}>{t.m.st[s] || s}</Pill>; };
