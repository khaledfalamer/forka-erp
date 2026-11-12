import { useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Page, Loading, Tabs, Pill, statusTone, Empty, Modal, Field, useApi, errText, Person, Bar } from '../ui';
import type { Me } from '../App';

// ---------- Documents ----------
export function Documents({ me }: { me: Me }) {
  const { t, bi, date } = useI18n(); const DC = t.m.docs;
  const manager = me.can.isManager || me.can.isHr;
  const [tab, setTab] = useState<'expiring' | 'expired' | 'pending' | 'all' | 'mine'>(manager ? 'expiring' : 'mine');
  const list = useApi<any[]>(tab === 'mine' ? '/documents?mine=1' : '/documents?filter=' + tab, [tab]);
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState('');
  const verify = async (id: string, action: string) => { await api('/documents/verify', { method: 'POST', body: { id, action, reason: action === 'reject' ? 'Unclear copy' : undefined } }); list.reload(); };
  const items: [typeof tab, string][] = manager ? [['expiring', DC.expiring], ['expired', DC.expired], ['pending', DC.pending], ['all', DC.all], ['mine', DC.mine]] : [['mine', DC.mine]];
  return (
    <Page title={DC.title} actions={me.user.employmentId && <button className="btn" onClick={() => { setUploading(true); setFlash(''); }}>{DC.upload}</button>}>
      {flash && <p className="ok">{flash}</p>}
      {items.length > 1 && <Tabs value={tab} onChange={setTab} items={items} />}
      {!list.data ? <Loading error={list.error} /> : list.data.length === 0 ? <Empty>{t.noEntries}</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr>{tab !== 'mine' && <th>{t.m.common.employee}</th>}<th>{t.m.common.type}</th><th>{t.expires}</th><th>{t.m.common.status}</th><th /></tr></thead>
          <tbody>{list.data.map(d => (
            <tr key={d.id}>
              {tab !== 'mine' && <td><Person p={d.employee} /></td>}
              <td>{bi(d.type)}</td>
              <td>{date(d.expiry)}{d.daysLeft !== null && d.status === 'valid' && <small className={d.daysLeft < 0 ? 'neg' : d.daysLeft <= 30 ? 'warn-text' : 'muted'}> · {d.daysLeft < 0 ? `${-d.daysLeft} ${DC.ago}` : `${d.daysLeft} ${DC.daysLeft}`}</small>}</td>
              <td><Pill tone={statusTone(d.daysLeft !== null && d.daysLeft < 0 && d.status === 'valid' ? 'expired' : d.status)}>{t.statuses[d.daysLeft !== null && d.daysLeft < 0 && d.status === 'valid' ? 'expired' : d.status] || d.status}</Pill></td>
              <td>{d.canVerify && <div className="actions nowrap"><button className="btn sm good" onClick={() => verify(d.id, 'accept')}>{DC.verify}</button><button className="btn sm ghost" onClick={() => verify(d.id, 'reject')}>{DC.reject}</button></div>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {uploading && <Upload onClose={() => setUploading(false)} onSaved={() => { setUploading(false); setFlash(DC.uploaded); setTab('mine'); list.reload(); }} />}
    </Page>
  );
}

function Upload({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t, bi } = useI18n(); const DC = t.m.docs;
  const types = useApi<any>('/settings');
  const [f, setF] = useState({ type: 'passport', expiry: '', fileName: '' });
  const [tried, setTried] = useState(false); const [err, setErr] = useState('');
  const docTypes = types.data?.documentTypes || [{ code: 'passport', name_en: 'Passport', name_ar: 'جواز السفر' }, { code: 'emirates_id', name_en: 'Emirates ID', name_ar: 'الهوية الإماراتية' }, { code: 'health_card', name_en: 'Health card', name_ar: 'البطاقة الصحية' }, { code: 'work_permit', name_en: 'Work permit', name_ar: 'تصريح العمل' }];
  const send = async () => { setTried(true); setErr(''); if (!f.expiry || !f.fileName) return; try { await api('/documents/upload', { method: 'POST', body: f }); onSaved(); } catch (e) { setErr(errText(t, e)); } };
  return (
    <Modal title={DC.upload} onClose={onClose}>
      <div className="form">
        <Field label={t.m.common.type}><select value={f.type} onChange={e => setF({ ...f, type: e.target.value })}>{docTypes.filter((d: any) => d.code !== 'contract').map((d: any) => <option key={d.code} value={d.code}>{bi({ en: d.name_en, ar: d.name_ar })}</option>)}</select></Field>
        <Field label={DC.file} missing={tried && !f.fileName} hint={t.m.common.demoFile}><input type="file" accept="image/*,application/pdf" onChange={e => setF({ ...f, fileName: e.target.files?.[0]?.name || '' })} /></Field>
        <Field label={DC.newExpiry} missing={tried && !f.expiry}><input type="date" value={f.expiry} onChange={e => setF({ ...f, expiry: e.target.value })} /></Field>
        {err && <p className="error">{err}</p>}
        <div className="actions"><button className="btn" onClick={send}>{t.m.common.submit}</button><button className="btn ghost" onClick={onClose}>{t.cancel}</button></div>
      </div>
    </Modal>
  );
}

// ---------- Joiners and leavers ----------
export function Lifecycle() {
  const { t, bi, date } = useI18n(); const LF = t.m.life;
  const d = useApi<any>('/lifecycle');
  const [tab, setTab] = useState<'onboarding' | 'probation' | 'exits'>('onboarding');
  if (!d.data) return <Page title={LF.title}><Loading error={d.error} /></Page>;
  const tick = async (id: string) => { await api('/lifecycle/item', { method: 'POST', body: { id } }); d.reload(); };
  const runs = tab === 'onboarding' ? d.data.onboarding : d.data.exits;
  return (
    <Page title={LF.title}>
      <Tabs value={tab} onChange={setTab} items={[['onboarding', LF.onboarding, d.data.onboarding.length], ['probation', LF.probation, d.data.probation.length], ['exits', LF.exits, d.data.exits.length]]} />
      {tab === 'probation' ? (d.data.probation.length === 0 ? <Empty>{LF.noneProb}</Empty> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.employee}</th><th>{LF.ends}</th><th>{LF.review}</th></tr></thead>
          <tbody>{d.data.probation.map((p: any) => (
            <tr key={p.employmentId}><td><Person p={p} /></td><td>{date(p.ends)} <small className={p.daysLeft < 0 ? 'neg' : p.daysLeft < 21 ? 'warn-text' : 'muted'}>({p.daysLeft} {t.m.common.days})</small></td>
              <td><Pill tone={statusTone(p.review)}>{t.m.st[p.review] || p.review}</Pill> <a className="link-btn" href="#/performance">{t.m.nav.performance}</a></td></tr>
          ))}</tbody></table></div>
      )) : runs.length === 0 ? <Empty>{t.noEntries}</Empty> : runs.map((run: any) => (
        <section key={run.id} className="panel">
          <div className="row-between"><div><Person p={run.employee} /><div className="muted small">{LF.started} {date(run.start)}{tab === 'onboarding' && <> · <a className="link-btn" href={'#/welcome/' + run.employee.employmentId}>{t.m.welcome.openPortal}</a></>}</div></div>
            <div className="progress-num"><strong>{run.done}/{run.total}</strong> <small className="muted">{LF.items}</small><Bar value={run.done} max={run.total} tone={tab === 'exits' ? 'terracotta' : 'sage'} /></div></div>
          <ul className="checklist">{run.items.map((it: any) => {
            const late = !it.done && it.due < new Date().toISOString().slice(0, 10);
            return (
              <li key={it.id} className={it.done ? 'done' : late ? 'late' : ''}>
                <label><input type="checkbox" checked={!!it.done} disabled={!run.canTick} onChange={() => tick(it.id)} /> <span>{bi(it.title)}</span></label>
                <span className="muted small">{LF.owners[it.owner]} · {it.done ? `${t.m.common.done} ${date(it.done)}` : `${t.m.common.due} ${date(it.due)}`}{late && <strong className="neg"> · {t.m.common.overdue}</strong>}</span>
              </li>
            );
          })}</ul>
        </section>
      ))}
    </Page>
  );
}

// ---------- Payroll ----------
const monthLabel = (m: string, lang: string) => new Date(m + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { month: 'long', year: 'numeric' });

export function Payroll({ id }: { id?: string }) {
  const { t, bi, lang, money } = useI18n(); const P = t.m.pay;
  const list = useApi<any[]>(id ? null : '/payroll/periods');
  if (id) return <PayPeriod id={id} />;
  return (
    <Page title={P.title} sub={P.otNote}>
      {!list.data ? <Loading error={list.error} /> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>{P.month}</th><th>{P.company}</th><th className="num">{P.headcount}</th><th className="num">{P.total}</th><th>{t.m.common.status}</th><th /></tr></thead>
          <tbody>{list.data.map(p => (
            <tr key={p.id}><td>{monthLabel(p.month, lang)}</td><td>{bi(p.entity)}</td><td className="num">{p.headcount}</td><td className="num">{money(p.total, p.currency)}</td>
              <td><Pill tone={statusTone(p.status)}>{P.steps[p.status] || p.status}</Pill></td><td><a className="btn sm ghost" href={'#/payroll/' + p.id}>{P.open}</a></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </Page>
  );
}

function PayPeriod({ id }: { id: string }) {
  const { t, bi, lang, money } = useI18n(); const P = t.m.pay;
  const d = useApi<any>('/payroll/periods/' + id);
  const [tab, setTab] = useState<'inputs' | 'variance'>('variance');
  const [err, setErr] = useState('');
  if (!d.data) return <Page title={P.title}><Loading error={d.error} /></Page>;
  const p = d.data; const idx = p.steps.indexOf(p.status);
  const advance = async () => { setErr(''); try { const r = await api('/payroll/periods/' + id, { method: 'POST' }); d.setData(r); } catch (e) { setErr(errText(t, e)); } };
  return (
    <Page title={`${P.title} · ${monthLabel(p.month, lang)}`} sub={bi(p.entity)}>
      <a className="link-btn back" href="#/payroll">{t.backArrow} {t.back}</a>
      <section className="panel">
        <h2>{P.stepsTitle}</h2>
        <ol className="stepper">{p.steps.map((s: string, i: number) => <li key={s} className={i < idx ? 'done' : i === idx ? 'now' : ''}><span className="dot">{i < idx ? '✓' : i + 1}</span><span>{P.steps[s]}</span></li>)}</ol>
        {p.openExceptions > 0 && p.status === 'exceptions' && <p className="warn-text">{p.openExceptions} {P.openExc} · <a className="link-btn" href="#/attendance">{t.m.nav.attendance}</a></p>}
        {p.status === 'draft' && <p className="muted small">{P.ceoOnly}</p>}
        {p.status === 'approved' && <p className="muted small">{P.exportNote}</p>}
        {err && <p className="error">{err}</p>}
        {p.status !== 'closed' && <div className="actions"><button className="btn" onClick={advance}>{P.next}</button></div>}
      </section>
      <div className="cards">
        <div className="card tone-sea"><div className="card-label">{P.gross}</div><div className="card-number sm">{money(p.totals.gross, p.currency)}</div></div>
        <div className="card tone-saffron"><div className="card-label">{P.otHours}</div><div className="card-number sm">{p.totals.overtimeHours}</div></div>
        <div className="card tone-terracotta"><div className="card-label">{P.unpaid}</div><div className="card-number sm">{p.totals.unpaidDays}</div></div>
      </div>
      <Tabs value={tab} onChange={setTab} items={[['variance', P.variance, p.variance.length], ['inputs', P.inputs]]} />
      {tab === 'variance' ? (p.variance.length === 0 ? <Empty>{t.noEntries}</Empty> : (
        <div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.employee}</th><th className="num">{P.last}</th><th className="num">{P.now}</th><th className="num">{P.change}</th><th /></tr></thead>
          <tbody>{p.variance.map((v: any) => (
            <tr key={v.employee.employmentId}><td><Person p={v.employee} /></td><td className="num">{money(v.last)}</td><td className="num">{money(v.now)}</td>
              <td className={'num ' + (v.delta < 0 ? 'neg' : 'pos')}>{v.delta > 0 ? '+' : ''}{money(v.delta)}</td><td>{v.reasons.map((r: string) => <Pill key={r} tone="info">{P.reasons[r]}</Pill>)}</td></tr>
          ))}</tbody></table></div>
      )) : (
        <div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.employee}</th><th className="num">{P.basic}</th><th className="num">{P.housing}</th><th className="num">{P.transport}</th><th className="num">{P.otHours}</th><th className="num">{P.unpaid}</th><th className="num">{P.gross}</th></tr></thead>
          <tbody>{p.inputs.map((i: any) => (
            <tr key={i.employee.employmentId}><td><Person p={i.employee} /></td><td className="num">{money(i.basic)}</td><td className="num">{money(i.housing)}</td><td className="num">{money(i.transport)}</td>
              <td className="num">{i.overtimeHours || '—'}</td><td className="num">{i.unpaidDays || '—'}</td><td className="num"><strong>{money(i.gross)}</strong></td></tr>
          ))}</tbody></table></div>
      )}
      <p className="muted small">{P.otNote}</p>
    </Page>
  );
}

export function Payslips() {
  const { t, lang, money } = useI18n(); const P = t.m.pay;
  const list = useApi<any[]>('/payslips');
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Page title={P.myPayslips}>
      {!list.data ? <Loading error={list.error} /> : list.data.length === 0 ? <Empty>{P.noPayslips}</Empty> : (
        <div className="stack-sm">{list.data.map(s => (
          <article key={s.id} className="payslip">
            <button className="row-between full" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
              <strong>{monthLabel(s.month, lang)}</strong><span className="card-number sm">{money(s.net, s.currency)}</span>
            </button>
            {open === s.id && (
              <table className="table"><tbody>
                <tr><td>{P.basic}</td><td className="num">{money(s.basic, s.currency)}</td></tr>
                <tr><td>{P.housing}</td><td className="num">{money(s.housing, s.currency)}</td></tr>
                <tr><td>{P.transport}</td><td className="num">{money(s.transport, s.currency)}</td></tr>
                <tr><td>{P.deductions}</td><td className="num neg">{s.deductions ? '-' + money(s.deductions, s.currency) : '—'}</td></tr>
                <tr className="total"><td>{P.net}</td><td className="num"><strong>{money(s.net, s.currency)}</strong></td></tr>
              </tbody></table>
            )}
          </article>
        ))}</div>
      )}
      <p className="muted small">{t.payNotice}</p>
    </Page>
  );
}
