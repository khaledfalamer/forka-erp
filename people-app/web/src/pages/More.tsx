import { useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Page, Loading, Tabs, Pill, statusTone, Empty, Modal, Field, useApi, errText, Person, Bar, ltr, Donut } from '../ui';
import type { Me } from '../App';

// ---------- Performance ----------
export function Performance({ me, id }: { me: Me; id?: string }) {
  const { t, bi, date } = useI18n(); const PF = t.m.perf;
  const d = useApi<any>(id ? null : '/performance');
  const [tab, setTab] = useState<'team' | 'mine'>(me.can.isManager ? 'team' : 'mine');
  if (id) return <ReviewForm id={id} />;
  if (!d.data) return <Page title={PF.title}><Loading error={d.error} /></Page>;
  const list = tab === 'team' ? d.data.team : d.data.mine;
  return (
    <Page title={PF.title} sub={d.data.cycles.map((c: any) => `${bi(c.name)} (${date(c.starts)} – ${date(c.ends)})`).join(' · ')}>
      {me.can.isManager && <Tabs value={tab} onChange={setTab} items={[['team', PF.team], ['mine', PF.myReviews]]} />}
      {tab === 'team' && d.data.completion !== null && <div className="card tone-sage inline-card"><span className="card-number sm">{d.data.completion}%</span> <span className="muted">{PF.completion}</span><Bar value={d.data.completion} max={100} tone="sage" /></div>}
      {list.length === 0 ? <Empty>{PF.noReviews}</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>{t.m.common.employee}</th><th>{t.m.common.type}</th><th>{t.m.common.status}</th><th className="num">{PF.score}</th><th /></tr></thead>
          <tbody>{list.map((r: any) => (
            <tr key={r.id}><td><Person p={r.employee} /></td><td>{bi(r.cycle)}{r.due && <small className="muted"> · {t.m.common.due} {date(r.due)}</small>}</td>
              <td><Pill tone={statusTone(r.status)}>{t.m.st[r.status] || r.status}</Pill></td><td className="num">{r.score ?? '—'}</td>
              <td><a className="btn sm ghost" href={'#/performance/' + r.id}>{t.m.common.open}</a></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </Page>
  );
}

function ReviewForm({ id }: { id: string }) {
  const { t, bi } = useI18n(); const PF = t.m.perf;
  const d = useApi<any>('/performance/review/' + id);
  const [ratings, setRatings] = useState<Record<string, number> | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [err, setErr] = useState(''); const [flash, setFlash] = useState('');
  if (!d.data) return <Page title={PF.title}><Loading error={d.error} /></Page>;
  const r = d.data; const rt = ratings ?? r.ratings; const cm = comment ?? r.comment; const oc = outcome ?? r.outcome;
  const save = async (submit: boolean) => {
    setErr(''); setFlash('');
    try { const res = await api('/performance/review/' + id, { method: 'POST', body: { ratings: rt, comment: cm, outcome: oc, submit } }); d.setData(res); setRatings(null); setComment(null); setOutcome(null); setFlash(t.saved); }
    catch (e) { setErr(errText(t, e)); }
  };
  return (
    <Page title={bi(r.cycle)} sub={<><Person p={r.employee} /> · {PF.families[r.family]}</>}>
      <a className="link-btn back" href="#/performance">{t.backArrow} {t.back}</a>
      {flash && <p className="ok">{flash}</p>}
      <section className="panel">
        <div className="row-between"><h2>{PF.rate}</h2><Pill tone={statusTone(r.status)}>{t.m.st[r.status] || r.status}</Pill></div>
        <div className="criteria">{r.criteria.map((c: any) => (
          <div key={c.code} className={'criterion' + (err && !rt[c.code] ? ' invalid' : '')}>
            <div><strong>{bi(c.name)}</strong><small className="muted"> · {PF.weight} {c.weight}%</small></div>
            <div className="rating" role="radiogroup" aria-label={bi(c.name)}>
              {[1, 2, 3, 4, 5].map(n => <button key={n} role="radio" aria-checked={rt[c.code] === n} className={rt[c.code] === n ? 'on r' + n : ''} disabled={!r.canEdit} title={PF.scale[n - 1]} onClick={() => setRatings({ ...rt, [c.code]: n })}>{n}</button>)}
            </div>
            {rt[c.code] && <small className="muted">{PF.scale[rt[c.code] - 1]}</small>}
          </div>
        ))}</div>
        <Field label={PF.comment}><textarea rows={4} value={cm} disabled={!r.canEdit} onChange={e => setComment(e.target.value)} /></Field>
        {r.probation && <Field label={PF.outcome}><select value={oc || ''} disabled={!r.canEdit} onChange={e => setOutcome(e.target.value)}><option value="">—</option>{Object.entries(PF.outcomes).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></Field>}
        {r.score !== null && <p><span className="muted">{PF.score}: </span><strong className="card-number sm">{r.score}</strong> / 5</p>}
        {err && <p className="error">{err}</p>}
        {r.canEdit && <div className="actions"><button className="btn" onClick={() => save(true)}>{PF.submitReview}</button><button className="btn ghost" onClick={() => save(false)}>{PF.save}</button></div>}
      </section>
    </Page>
  );
}

// ---------- Learning ----------
export function Learning({ me }: { me: Me }) {
  const { t, bi, date } = useI18n(); const LN = t.m.learn;
  const d = useApi<any>('/learning');
  const [tab, setTab] = useState<'team' | 'mine'>(me.can.isManager ? 'team' : 'mine');
  if (!d.data) return <Page title={LN.title}><Loading error={d.error} /></Page>;
  return (
    <Page title={LN.title}>
      {me.can.isManager && <Tabs value={tab} onChange={setTab} items={[['team', LN.team], ['mine', LN.mine]]} />}
      {tab === 'mine' ? (
        <div className="table-wrap"><table className="table"><thead><tr><th>{LN.course}</th><th>{t.m.common.status}</th><th>{LN.completed}</th><th>{LN.expires}</th></tr></thead>
          <tbody>{d.data.mine.map((r: any) => <tr key={r.code}><td>{bi(r.course)}</td><td><Pill tone={statusTone(r.status)}>{t.m.st[r.status]}</Pill></td><td>{date(r.completed)}</td><td>{date(r.expires)}</td></tr>)}</tbody></table></div>
      ) : (
        <>
          {d.data.compliance !== null && <div className="card tone-sea inline-card"><span className="card-number sm">{d.data.compliance}%</span> <span className="muted">{LN.compliance}</span><Bar value={d.data.compliance} max={100} /></div>}
          {d.data.team.every((p: any) => p.missing.length === 0) ? <Empty>{LN.allGood}</Empty> : (
            <div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.employee}</th><th>{t.m.common.progress}</th><th>{LN.missing}</th></tr></thead>
              <tbody>{d.data.team.filter((p: any) => p.missing.length).map((p: any) => (
                <tr key={p.employmentId}><td><Person p={p} /></td><td className="nowrap">{p.done}/{p.total} <Bar value={p.done} max={p.total} /></td>
                  <td>{p.missing.map((m: any) => <Pill key={m.code} tone={m.status === 'expired' ? 'bad' : 'warn'}>{bi(m.course)}</Pill>)}</td></tr>
              ))}</tbody></table></div>
          )}
          <section className="panel"><h2>{LN.course}</h2><ul className="rows">{d.data.courses.map((c: any) => (
            <li key={c.code} className="row-static"><span className="row-main">{bi(c.name)}<small>{c.for.map((f: string) => t.m.perf.families[f]?.split(' ')[0]).join(' · ')}</small></span>
              <span className="muted small">{c.months ? `${LN.every} ${c.months} ${LN.months}` : LN.once}</span></li>
          ))}</ul></section>
        </>
      )}
    </Page>
  );
}

// ---------- HR desk ----------
export function Desk({ me }: { me: Me }) {
  const { t, date } = useI18n(); const DK = t.m.desk;
  const list = useApi<any[]>('/desk');
  const [creating, setCreating] = useState(false); const [flash, setFlash] = useState('');
  const setStatus = async (id: string, status: string) => { await api(`/desk/${id}/status`, { method: 'POST', body: { status } }); list.reload(); };
  return (
    <Page title={DK.title} actions={me.user.employmentId && <button className="btn" onClick={() => { setCreating(true); setFlash(''); }}>{DK.new}</button>}>
      {flash && <p className="ok">{flash}</p>}
      {!list.data ? <Loading error={list.error} /> : list.data.length === 0 ? <Empty>{DK.none}</Empty> : (
        <div className="stack-sm">{list.data.map(c => (
          <article key={c.id} className="req-card">
            <header><div><strong>{c.title}</strong>{c.sensitive && <Pill tone="bad">{DK.private.split(':')[0]}</Pill>}
              <div className="muted small">{DK.ref} {c.ref} · {DK.cats[c.category]} · {c.mine ? '' : <Person p={c.employee} />}</div></div>
              <Pill tone={statusTone(c.status)}>{t.m.st[c.status] || c.status}</Pill></header>
            {c.notes.map((n: any, i: number) => <blockquote key={i} className="note"><small className="muted">{n.by} · {date(n.at)}</small><p>{n.body}</p></blockquote>)}
            <footer className="muted small">{t.m.common.owner}: {c.owner} · {DK.due} {date(c.due)}{c.overdue && <strong className="neg"> · {t.m.common.overdue}</strong>}</footer>
            {!c.mine && me.can.isHr && c.status !== 'resolved' && <div className="actions"><button className="btn sm good" onClick={() => setStatus(c.id, 'resolved')}>{DK.resolve}</button><button className="btn sm ghost" onClick={() => setStatus(c.id, 'waiting')}>{DK.waiting}</button></div>}
          </article>
        ))}</div>
      )}
      {creating && <NewCase onClose={() => setCreating(false)} onSaved={() => { setCreating(false); setFlash(DK.sent); list.reload(); }} />}
    </Page>
  );
}

function NewCase({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n(); const DK = t.m.desk;
  const [f, setF] = useState({ category: 'question', title: '', body: '' }); const [tried, setTried] = useState(false); const [err, setErr] = useState('');
  const send = async () => { setTried(true); if (!f.title) return; try { await api('/desk', { method: 'POST', body: f }); onSaved(); } catch (e) { setErr(errText(t, e)); } };
  const sensitive = ['grievance', 'disciplinary', 'medical'].includes(f.category);
  return (
    <Modal title={DK.new} onClose={onClose}>
      <div className="form">
        <Field label={DK.category} hint={sensitive ? DK.private : undefined}><select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{Object.entries(DK.cats).filter(([k]) => k !== 'disciplinary').map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></Field>
        <Field label={DK.subject} missing={tried && !f.title}><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
        <Field label={DK.message}><textarea rows={4} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></Field>
        {err && <p className="error">{err}</p>}
        <div className="actions"><button className="btn" onClick={send}>{t.m.common.submit}</button><button className="btn ghost" onClick={onClose}>{t.cancel}</button></div>
      </div>
    </Modal>
  );
}

// ---------- News and policies ----------
export function Policies() {
  const { t, bi, date } = useI18n(); const PL = t.m.pol;
  const d = useApi<any>('/policies');
  if (!d.data) return <Page title={PL.title}><Loading error={d.error} /></Page>;
  const ack = async (id: string) => { await api(`/policies/${id}/ack`, { method: 'POST' }); d.reload(); };
  return (
    <Page title={PL.title}>
      <section className="stack-sm"><h2>{PL.news}</h2>{d.data.announcements.map((a: any) => (
        <article key={a.id} className="news"><small className="muted">{date(a.at)}</small><h3>{bi(a.title)}</h3><p>{bi(a.body)}</p></article>
      ))}</section>
      <section className="panel"><h2>{PL.policies}</h2><ul className="rows">{d.data.policies.map((p: any) => (
        <li key={p.id} className="row-static">
          <span className="row-main">{bi(p.title)}<small>{p.code} · {PL.version} {p.version}{p.ackRate !== null ? ` · ${p.ackRate}% ${PL.ackRate}` : ''}</small></span>
          {p.acked ? <Pill tone="good">✓ {PL.acked}</Pill> : <button className="btn sm" onClick={() => ack(p.id)}>{PL.read}</button>}
        </li>
      ))}</ul></section>
    </Page>
  );
}

// ---------- Reports ----------
export function Reports() {
  const { t, bi, date } = useI18n(); const RP = t.m.rep;
  const d = useApi<any>('/reports');
  if (!d.data) return <Page title={RP.title}><Loading error={d.error} /></Page>;
  const r = d.data;
  const Bars = ({ rows, tone = 'sea', label }: { rows: any[]; tone?: string; label?: (x: any) => string }) => {
    const max = Math.max(1, ...rows.map(x => x.value));
    return <ul className="bars">{rows.map(x => <li key={x.key}><span className="bar-label">{label ? label(x) : x.ar ? bi({ en: x.key, ar: x.ar }) : x.key}</span><Bar value={x.value} max={max} tone={tone} /><span className="num">{x.value}</span></li>)}</ul>;
  };
  return (
    <Page title={RP.title} sub={RP.exportNote}>
      <div className="report-meta">
        <span><strong>{RP.period}:</strong> {date(r.meta.from)} – {date(r.meta.to)}</span>
        <span><strong>{RP.source}:</strong> {r.meta.source}</span>
        <span><strong>{RP.access}:</strong> {RP.scope[r.meta.scope]} · {r.meta.people} {RP.people}</span>
      </div>
      <div className="cards">
        <div className="card tone-sea"><div className="card-label">{RP.headcount}</div><div className="card-number">{r.meta.people}</div></div>
        <div className="card tone-sage"><div className="card-label">{RP.joiners}</div><div className="card-number">{r.joiners90}</div></div>
        <div className="card tone-terracotta"><div className="card-label">{RP.leavers}</div><div className="card-number">{r.leavers90}</div></div>
        <div className="card tone-saffron"><div className="card-label">{RP.reviews}</div><div className="card-number sm">{r.reviews.done}/{r.reviews.total}</div></div>
        <div className="card tone-sea"><div className="card-label">{RP.training}</div><div className="card-number sm">{r.training.total ? Math.round(r.training.done / r.training.total * 100) : 0}%</div></div>
      </div>
      <div className="grid-2">
        <section className="panel"><h2>{RP.byEntity}</h2><Donut label={RP.byEntity} rows={r.headcountByEntity.map((x: any) => ({ ...x, name: x.key.replace(' (demo)', '') }))} /></section>
        <section className="panel"><h2>{RP.byBranch}</h2><Bars rows={r.headcountByBranch} tone="sage" /></section>
        <section className="panel"><h2>{RP.byLevel}</h2><Donut label={RP.byLevel} rows={r.headcountByLevel.map((x: any) => ({ ...x, name: bi({ en: x.key, ar: x.ar }) }))} /></section>
        <section className="panel"><h2>{RP.attendance}</h2><Donut label={RP.attendance} rows={r.attendance.map((x: any) => ({ ...x, name: t.m.time.exc[x.key] }))} /></section>
        <section className="panel"><h2>{RP.documents}</h2><Bars rows={r.documents} tone="terracotta" label={x => RP.docBuckets[x.key]} /></section>
        <section className="panel"><h2>{RP.leave}</h2><Donut label={RP.leave} rows={r.leave.map((x: any) => ({ ...x, name: x.key === 'annual' ? bi({ en: 'Annual leave', ar: 'الإجازة السنوية' }) : bi({ en: 'Sick leave', ar: 'الإجازة المرضية' }) }))} /></section>
      </div>
      <section className="panel"><h2>{RP.hours}</h2>
        <div className="table-wrap"><table className="table"><thead><tr><th>{t.branch}</th><th className="num">{RP.scheduled}</th><th className="num">{RP.actual}</th><th className="num">{RP.overtime}</th><th /></tr></thead>
          <tbody>{r.hours.map((h: any) => <tr key={h.key}><td>{bi({ en: h.key, ar: h.ar })}</td><td className="num">{h.scheduled}</td><td className="num">{h.actual}</td><td className="num">{h.overtime}</td><td><Bar value={h.actual} max={h.scheduled} tone={h.actual >= h.scheduled * .97 ? 'sage' : 'saffron'} /></td></tr>)}</tbody></table></div>
      </section>
    </Page>
  );
}

// ---------- Settings ----------
export function Settings() {
  const { t, bi, date } = useI18n(); const S = t.m.set;
  const d = useApi<any>('/settings');
  const [tab, setTab] = useState<'leave' | 'approvals' | 'holidays' | 'shifts' | 'docs' | 'access' | 'rules'>('leave');
  if (!d.data) return <Page title={S.title}><Loading error={d.error} /></Page>;
  const s = d.data;
  return (
    <Page title={S.title} sub={S.readOnly}>
      <Tabs value={tab} onChange={setTab} items={[['leave', S.leaveTypes], ['approvals', S.approvals], ['holidays', S.holidays], ['shifts', S.shifts], ['docs', S.docTypes], ['access', S.access], ['rules', S.rules]]} />
      {tab === 'leave' && <div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.type}</th><th>{t.company}</th><th className="num">{S.perYear}</th><th>{S.paid}</th><th>{S.halfDay}</th><th /></tr></thead>
        <tbody>{s.leaveTypes.map((l: any) => <tr key={l.country + l.code}><td>{bi(l.name)}</td><td>{l.country}</td><td className="num">{l.perYear ?? '—'}</td><td>{l.paid ? `${l.paid}%` : t.m.common.no}</td><td>{l.halfDay ? t.m.common.yes : t.m.common.no}</td>
          <td><Pill tone={l.note === 'to_confirm' ? 'warn' : ''}>{l.note === 'to_confirm' ? t.m.common.toConfirm : t.m.common.policy}</Pill></td></tr>)}</tbody></table></div>}
      {tab === 'approvals' && <div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.type}</th><th>{S.when}</th><th>{S.route}</th></tr></thead>
        <tbody>{s.approvals.map((a: any, i: number) => <tr key={i}><td>{t.m.req.types[a.type]}</td><td>{a.when ? bi(a.when) : '—'}</td><td>{a.steps.map((x: string) => t.m.req.rules[x]).join(' → ')}</td></tr>)}</tbody></table></div>}
      {tab === 'holidays' && <><div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.date}</th><th>{t.company}</th><th>{t.m.common.type}</th><th /></tr></thead>
        <tbody>{s.holidays.map((h: any, i: number) => <tr key={i}><td>{date(h.day)}</td><td>{h.country}</td><td>{bi(h.name)}</td><td><Pill tone="warn">{S.provisional}</Pill></td></tr>)}</tbody></table></div><p className="muted small">{S.religiousNote}</p></>}
      {tab === 'shifts' && <ul className="rows panel">{s.templates.map((x: any) => <li key={x.id} className="row-static"><span className={'sw ' + x.color} /><span className="row-main">{bi(x.name)}<small>{x.segments.map((z: string[]) => ltr(z.join('–'))).join(' + ')}</small></span><span className="muted">{x.hours} {t.m.common.hours}</span></li>)}</ul>}
      {tab === 'docs' && <ul className="rows panel">{s.documentTypes.map((x: any) => <li key={x.code} className="row-static"><span className="row-main">{bi({ en: x.name_en, ar: x.name_ar })}<small>{x.code}</small></span></li>)}</ul>}
      {tab === 'access' && <div className="table-wrap"><table className="table"><thead><tr><th>{t.m.common.employee}</th><th>{S.role}</th><th>{S.scope}</th></tr></thead>
        <tbody>{s.access.map((u: any) => <tr key={u.email}><td>{u.name}<small className="muted"> · {u.email}</small></td><td>{u.grants.length ? u.grants.map((g: any) => t.roles[g.role]).join(', ') : t.roles.EMPLOYEE}</td><td>{u.grants.map((g: any) => bi(g.scope)).join(', ') || '—'}</td></tr>)}</tbody></table></div>}
      {tab === 'rules' && <><p className="notice">{S.rulesNote}</p><div className="table-wrap"><table className="table"><thead><tr><th>Code</th><th>{t.m.common.status}</th><th>{S.source}</th></tr></thead>
        <tbody>{s.rules.map((r: any) => <tr key={r.code}><td className="mono">{r.code}</td><td><Pill tone="warn">{t.m.st[r.status]}</Pill></td><td>{r.source}</td></tr>)}</tbody></table></div></>}
    </Page>
  );
}
