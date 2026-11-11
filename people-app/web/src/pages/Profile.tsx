import { useEffect, useState } from 'react';
import { api, ApiError, go, back } from '../api';
import { useI18n } from '../i18n';
import { tone } from './People';

type Tab = 'overview' | 'history' | 'personal' | 'pay' | 'activity' | 'viewed';

export function Profile({ id }: { id: string }) {
  const { t, bi, date } = useI18n();
  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [editing, setEditing] = useState(false);
  const [flash, setFlash] = useState('');
  const load = () => api('/employees/' + id).then(setP).catch(e => setErr(e instanceof ApiError && e.status === 404 ? t.notFound : t.error));
  useEffect(() => { load(); }, [id]);

  if (err) return <div className="stack"><button className="link-btn back" onClick={() => go('people')}>{t.backArrow} {t.back}</button><p className="error">{err}</p></div>;
  if (!p) return <p className="muted">{t.loading}</p>;

  const tabs: [Tab, string, boolean][] = [
    ['overview', t.overview, true], ['history', t.history, true], ['personal', t.personal, p.allowed.personal],
    ['pay', t.pay, p.allowed.pay], ['activity', t.activity, p.allowed.audit], ['viewed', t.viewedBy, p.allowed.accessLog],
  ];
  return (
    <div className="stack">
      <button className="link-btn back" onClick={() => back()}>{t.backArrow} {t.back}</button>
      <div className="profile-head">
        <span className={'avatar big ' + tone(p.name.en)} aria-hidden>{(p.name.en || '?').split(' ').map((s: string) => s[0]).slice(0, 2).join('')}</span>
        <div>
          <h1>{bi(p.name)}</h1>
          <div className="muted">{bi(p.job)} · {bi(p.branch)}</div>
          <div className="muted small">{t.employeeNo}: <span className="mono">{p.employeeNo}</span> · {t.statuses[p.status] || p.status}</div>
        </div>
        {p.allowed.changeJob && !editing && <button className="btn" onClick={() => { setEditing(true); setFlash(''); }}>{t.changeJob}</button>}
      </div>
      {flash && <p className="ok">{flash}</p>}
      {editing && <ChangeJob p={p} onCancel={() => setEditing(false)} onSaved={msg => { setEditing(false); setFlash(msg); load(); setTab('history'); }} />}
      <div className="tabs" role="tablist">
        {tabs.filter(x => x[2]).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>
      {tab === 'overview' && (
        <>
          <dl className="facts">
            <Fact k={t.job} v={bi(p.job)} />
            <Fact k={t.level} v={bi(p.level)} />
            <Fact k={t.branch} v={bi(p.branch)} />
            <Fact k={t.department} v={bi(p.department)} />
            <Fact k={t.company} v={bi(p.entity)} />
            <Fact k={t.manager} v={p.manager ? (bi(p.manager) || '—') : '—'} />
            <Fact k={t.startDate} v={date(p.startDate)} />
            <Fact k={t.jobSince} v={date(p.jobSince)} />
            <Fact k={t.probationEnd} v={date(p.probationEnd)} />
            {p.permitJobTitle && <Fact k={t.permitTitle} v={p.permitJobTitle} />}
          </dl>
          <section className="panel">
            <h2>{t.documents}</h2>
            <ul className="rows">
              {p.documents.map((d: any, i: number) => (
                <li key={i} className="row-static">
                  <span className="row-main">{bi(d.name)}</span>
                  <span className={'pill ' + (d.status === 'expired' ? 'bad' : soon(d.expiry) ? 'warn' : '')}>{t.statuses[d.status] || d.status} · {date(d.expiry)}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {tab === 'history' && <History id={id} />}
      {tab === 'personal' && <Personal id={id} />}
      {tab === 'pay' && <Pay id={id} />}
      {tab === 'activity' && <Activity id={id} />}
      {tab === 'viewed' && <Viewed id={id} />}
    </div>
  );
}

const soon = (d: string | null) => !!d && (new Date(d).getTime() - Date.now()) / 864e5 <= 60;
const Fact = ({ k, v }: { k: string; v: string }) => <div><dt>{k}</dt><dd>{v || '—'}</dd></div>;

function useLoad<T>(path: string) {
  const [d, setD] = useState<T | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api<T>(path).then(setD).catch(() => setErr(true)); }, [path]);
  return { d, err };
}

function History({ id }: { id: string }) {
  const { t, bi, date } = useI18n();
  const { d, err } = useLoad<any[]>(`/employees/${id}/history`);
  if (err) return <p className="error">{t.error}</p>;
  if (!d) return <p className="muted">{t.loading}</p>;
  return (
    <ol className="timeline">
      {d.map(h => (
        <li key={h.id} className={h.state}>
          <div className="tl-head"><strong>{bi(h.job)}</strong><span className={'pill ' + (h.state === 'scheduled' ? 'warn' : h.state === 'current' ? 'good' : '')}>{t[h.state as 'current']}</span></div>
          <div className="muted">{bi(h.branch)} · {bi(h.department)}{h.manager ? ' · ' + t.manager + ': ' + bi(h.manager) : ''}</div>
          <div className="small">{date(h.from)} {t.toArrow} {h.to ? date(h.to) : '…'} · {t.reasons[h.reason] || h.reason}{h.changedBy ? ' · ' + t.changedBy + ': ' + h.changedBy : ''}</div>
        </li>
      ))}
    </ol>
  );
}

function Personal({ id }: { id: string }) {
  const { t, date } = useI18n();
  const { d, err } = useLoad<any>(`/employees/${id}/personal`);
  if (err) return <p className="error">{t.errors.no_access}</p>;
  if (!d) return <p className="muted">{t.loading}</p>;
  return (
    <>
      <p className="notice">{t.personalNotice}</p>
      <dl className="facts">
        <Fact k={t.gender} v={t.genders[d.gender] || '—'} />
        <Fact k={t.nationality} v={d.nationality} />
        <Fact k={t.dateOfBirth} v={date(d.dateOfBirth)} />
        <Fact k={t.mobile} v={d.mobile} />
        <Fact k={t.personalEmail} v={d.personalEmail} />
      </dl>
    </>
  );
}

function Pay({ id }: { id: string }) {
  const { t, bi, date, money } = useI18n();
  const { d, err } = useLoad<any>(`/employees/${id}/pay`);
  if (err) return <p className="error">{t.errors.no_access}</p>;
  if (!d) return <p className="muted">{t.loading}</p>;
  return (
    <>
      <p className="notice">{t.payNotice}</p>
      <div className="card"><div className="card-label">{t.monthlyTotal}</div><div className="card-number">{money(d.monthlyTotal, d.currency)}</div></div>
      <table className="table">
        <thead><tr><th>{t.component}</th><th className="num">{t.amount}</th><th>{t.from}</th></tr></thead>
        <tbody>{d.lines.map((l: any, i: number) => <tr key={i}><td>{bi(l.name)}</td><td className="num">{money(l.amount, l.currency)}</td><td>{date(l.from)}</td></tr>)}</tbody>
      </table>
    </>
  );
}

function Activity({ id }: { id: string }) {
  const { t } = useI18n();
  const { d, err } = useLoad<any[]>(`/employees/${id}/audit`);
  if (err) return <p className="error">{t.errors.no_access}</p>;
  if (!d) return <p className="muted">{t.loading}</p>;
  if (!d.length) return <p className="muted">{t.noEntries}</p>;
  return (
    <table className="table">
      <thead><tr><th>{t.when}</th><th>{t.action}</th><th>{t.by}</th></tr></thead>
      <tbody>{d.map(a => <tr key={a.id}><td>{new Date(a.at).toLocaleString()}</td><td>{t.actions[a.action] || a.action}</td><td>{a.actor}</td></tr>)}</tbody>
    </table>
  );
}

function Viewed({ id }: { id: string }) {
  const { t } = useI18n();
  const { d, err } = useLoad<any[]>(`/employees/${id}/access-log`);
  if (err) return <p className="error">{t.errors.no_access}</p>;
  if (!d) return <p className="muted">{t.loading}</p>;
  if (!d.length) return <p className="muted">{t.noEntries}</p>;
  return (
    <table className="table">
      <thead><tr><th>{t.when}</th><th>{t.dataClass}</th><th>{t.by}</th></tr></thead>
      <tbody>{d.map((a, i) => <tr key={i}><td>{new Date(a.at).toLocaleString()}</td><td>{t.dataClasses[a.data_class] || a.data_class}</td><td>{a.viewer}</td></tr>)}</tbody>
    </table>
  );
}

function ChangeJob({ p, onCancel, onSaved }: { p: any; onCancel: () => void; onSaved: (msg: string) => void }) {
  const { t, bi } = useI18n();
  const [org, setOrg] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [f, setF] = useState({ effectiveFrom: '', jobTitleId: '', branchId: p.branch.id || '', departmentId: p.department.id || '', managerEmploymentId: '__keep', reason: 'transfer' });
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { api('/org').then(setOrg); api<any[]>('/employees').then(setPeople); }, []);
  if (!org) return <p className="muted">{t.loading}</p>;
  const missing = (k: keyof typeof f) => tried && !f[k];
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    setTried(true); setErr('');
    if (!f.effectiveFrom || !f.jobTitleId || !f.branchId || !f.departmentId) return;
    setBusy(true);
    try {
      const body: any = { ...f };
      if (f.managerEmploymentId === '__keep') delete body.managerEmploymentId;
      const r = await api('/employees/' + p.employmentId + '/assignments', { method: 'POST', body });
      onSaved(r.payrollFlag ? t.savedPayroll : r.scheduled ? t.savedScheduled : t.saved);
    } catch (e) {
      setErr(e instanceof ApiError ? (t.errors[e.code] || t.error) : t.error);
    } finally { setBusy(false); }
  };
  return (
    <section className="panel form">
      <h2>{t.changeJob}</h2>
      <label className={missing('effectiveFrom') ? 'invalid' : ''}>{t.effectiveFrom}
        <input type="date" value={f.effectiveFrom} onChange={set('effectiveFrom')} />
        {!p.allowed.backdate && <small className="muted">{t.backdateHint}</small>}
        {missing('effectiveFrom') && <small className="req">{t.required}</small>}
      </label>
      <label>{t.reason}
        <select value={f.reason} onChange={set('reason')}>
          {['transfer', 'promotion', 'role_change', 'manager_change', 'correction'].map(r => <option key={r} value={r}>{t.reasons[r]}</option>)}
        </select>
      </label>
      <label className={missing('jobTitleId') ? 'invalid' : ''}>{t.job}
        <select value={f.jobTitleId} onChange={set('jobTitleId')}>
          <option value="">—</option>
          {org.jobTitles.map((j: any) => <option key={j.id} value={j.id}>{bi({ en: j.name_en, ar: j.name_ar })}</option>)}
        </select>
        {missing('jobTitleId') && <small className="req">{t.required}</small>}
      </label>
      <label className={missing('branchId') ? 'invalid' : ''}>{t.branch}
        <select value={f.branchId} onChange={set('branchId')}>
          {org.branches.filter((b: any) => b.entity_id === p.entity.id).map((b: any) => <option key={b.id} value={b.id}>{bi({ en: b.name_en, ar: b.name_ar })}</option>)}
        </select>
      </label>
      <label className={missing('departmentId') ? 'invalid' : ''}>{t.department}
        <select value={f.departmentId} onChange={set('departmentId')}>
          {org.departments.filter((d: any) => d.entity_id === p.entity.id).map((d: any) => <option key={d.id} value={d.id}>{bi({ en: d.name_en, ar: d.name_ar })}</option>)}
        </select>
      </label>
      <label>{t.newManager}
        <select value={f.managerEmploymentId} onChange={set('managerEmploymentId')}>
          <option value="__keep">{t.keepManager}</option>
          {people.filter(x => x.employmentId !== p.employmentId).map(x => <option key={x.employmentId} value={x.employmentId}>{bi(x.name)} · {bi(x.job)}</option>)}
        </select>
      </label>
      {err && <p className="error">{err}</p>}
      <div className="actions">
        <button className="btn" onClick={submit} disabled={busy}>{t.save}</button>
        <button className="btn ghost" onClick={onCancel}>{t.cancel}</button>
      </div>
    </section>
  );
}
