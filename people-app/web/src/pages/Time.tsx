import { useState } from 'react';
import { api, go } from '../api';
import { useI18n } from '../i18n';
import { Page, Loading, Tabs, Pill, statusTone, Empty, Modal, Field, useApi, errText, Person, ltr } from '../ui';

const weekday = (d: string, lang: string) => new Date(d + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const seg = (s: string[][]) => s.map(([a, b]) => ltr(`${a}–${b}`)).join(' + ');

export function MyTime() {
  const { t, bi, lang, date } = useI18n(); const T = t.m.time;
  const [week, setWeek] = useState(0);
  const d = useApi<any>('/time/my?week=' + week, [week]);
  const [busy, setBusy] = useState(false);
  if (!d.data) return <Page title={T.title}><Loading error={d.error} /></Page>;
  const ck = d.data.clock || { in: false };
  const clock = async () => { setBusy(true); try { await api('/time/clock', { method: 'POST', body: { kind: ck.in ? 'out' : 'in' } }); d.reload(); } finally { setBusy(false); } };
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayShift = d.data.days.find((x: any) => x.date === todayStr);
  return (
    <Page title={T.title}>
      <section className={'clock-card' + (ck.in ? ' on' : '')}>
        <div>
          <div className="clock-time">{new Date().toLocaleTimeString(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
          <div>{ck.in ? `${T.clockedInSince} ${ck.since}` : ck.last ? `${T.lastOut} ${ck.last}` : T.notClockedIn}</div>
          {todayShift?.shift && <div className="muted small">{bi(todayShift.shift.name)} · {seg(todayShift.shift.segments)}</div>}
        </div>
        <button className={'clock-btn' + (ck.in ? ' out' : '')} onClick={clock} disabled={busy}>{ck.in ? T.clockOut : T.clockIn}</button>
        <p className="muted small full">{T.location} ({bi(d.data.geofence?.branch)}). {T.demoLocation}</p>
      </section>
      <section className="panel">
        <div className="row-between">
          <h2>{T.schedule}</h2>
          <div className="seg-ctl">
            <button className={week === -1 ? 'on' : ''} onClick={() => setWeek(-1)}>{t.m.common.lastWeek}</button>
            <button className={week === 0 ? 'on' : ''} onClick={() => setWeek(0)}>{t.m.common.thisWeek}</button>
            <button className={week === 1 ? 'on' : ''} onClick={() => setWeek(1)}>{t.m.common.nextWeek}</button>
          </div>
        </div>
        {!d.data.days[0]?.published && week === 1 ? <p className="muted">{T.notPublished}</p> : (
          <ul className="rows">
            {d.data.days.map((x: any) => (
              <li key={x.date} className={'row-static' + (x.date === todayStr ? ' today' : '')}>
                <span className="row-main"><strong>{weekday(x.date, lang)}</strong>
                  <small>{x.leave ? `${T.onLeave} · ${bi(x.leave)}` : x.shift ? `${bi(x.shift.name)} · ${seg(x.shift.segments)}` : T.rest}</small></span>
                {x.shift && !x.leave && <span className={'shift-chip ' + x.shift.color}>{x.shift.hours} {t.m.common.hours}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <h2>{T.history}</h2>
        {d.data.history.length === 0 ? <p className="muted">{t.noEntries}</p> : (
          <table className="table"><thead><tr><th>{t.m.common.date}</th><th>{T.in}</th><th>{T.out}</th><th /></tr></thead>
            <tbody>{d.data.history.map((h: any) => (
              <tr key={h.date}><td>{date(h.date)}</td><td>{h.in}</td><td>{h.out}</td>
                <td>{h.exceptions.map((e: string) => <Pill key={e} tone={e === 'overtime' ? 'info' : 'warn'}>{T.exc[e]}</Pill>)}
                  {h.exceptions.some((e: string) => e !== 'overtime') && <button className="link-btn" onClick={() => go('requests')}>{T.fix}</button>}</td></tr>
            ))}</tbody></table>
        )}
      </section>
    </Page>
  );
}

export function Roster() {
  const { t, bi, lang } = useI18n(); const RO = t.m.roster;
  const branches = useApi<any[]>('/roster/branches');
  const templates = useApi<any[]>('/roster/templates');
  const [branch, setBranch] = useState('');
  const [week, setWeek] = useState(0);
  const [flash, setFlash] = useState('');
  const [pick, setPick] = useState<{ emp: string; name: string; date: string } | null>(null);
  const r = useApi<any>(branches.data ? `/roster?branch=${branch || branches.data[0]?.id || ''}&week=${week}` : null, [branch, week, branches.data]);
  if (!branches.data || !r.data) return <Page title={RO.title}><Loading error={branches.error || r.error} /></Page>;
  const d = r.data; const todayStr = new Date().toISOString().slice(0, 10);
  const publish = async () => { await api('/roster/publish', { method: 'POST', body: { branchId: d.branch.id, weekStart: d.weekStart } }); setFlash(RO.published_ok); r.reload(); };
  const setShift = async (templateId: string | null) => {
    if (!pick) return;
    try { await api('/roster/shift', { method: 'POST', body: { employmentId: pick.emp, date: pick.date, templateId } }); setPick(null); r.reload(); } catch (e) { setFlash(errText(t, e)); setPick(null); }
  };
  return (
    <Page title={RO.title} sub={d.published ? <Pill tone="good">{RO.published}</Pill> : <Pill tone="warn">{RO.draft}</Pill>}
      actions={d.canEdit && !d.published && <button className="btn" onClick={publish}>{RO.publish}</button>}>
      <div className="filters">
        {branches.data.length > 1 && <select value={branch || d.branch.id} onChange={e => setBranch(e.target.value)} aria-label={RO.branch}>{branches.data.map(b => <option key={b.id} value={b.id}>{bi(b.name)}</option>)}</select>}
        <div className="seg-ctl">
          <button className={week === -1 ? 'on' : ''} onClick={() => setWeek(-1)}>{t.m.common.lastWeek}</button>
          <button className={week === 0 ? 'on' : ''} onClick={() => setWeek(0)}>{t.m.common.thisWeek}</button>
          <button className={week === 1 ? 'on' : ''} onClick={() => setWeek(1)}>{t.m.common.nextWeek}</button>
        </div>
      </div>
      {flash && <p className="ok">{flash}</p>}
      <div className="roster-scroll">
        <table className="roster">
          <thead><tr><th>{bi(d.branch.name)}</th>{d.dates.map((x: string) => <th key={x} className={x === todayStr ? 'today' : ''}>{weekday(x, lang)}</th>)}<th>{RO.total}</th></tr></thead>
          <tbody>
            {d.people.map((p: any) => (
              <tr key={p.employmentId}>
                <th className="who-cell"><strong>{bi(p.name)}</strong><small>{bi(p.job)}</small></th>
                {d.dates.map((x: string) => { const c = p.cells[x]; const can = d.canEdit && x >= todayStr;
                  return (
                    <td key={x}>
                      <button className={'cell ' + (c.shift ? c.shift.color : 'rest') + (c.leave ? ' leave' : '')} disabled={!can}
                        onClick={() => setPick({ emp: p.employmentId, name: bi(p.name), date: x })} title={c.shift ? seg(c.shift.segments) : RO.clear}>
                        {c.shift ? bi(c.shift.name) : '—'}{c.leave && <em>{t.m.time.onLeave}</em>}
                      </button>
                    </td>
                  ); })}
                <td className="num">{p.hours}</td>
              </tr>
            ))}
            <tr className="cover"><th>{RO.coverage}</th>{d.coverage.map((n: number, i: number) => <td key={i} className="num">{n}</td>)}<td /></tr>
          </tbody>
        </table>
      </div>
      <div className="legend">{templates.data?.map(x => <span key={x.id}><i className={'sw ' + x.color} />{bi(x.name)} {seg(x.segments)}</span>)}</div>
      <section className="panel">
        <h2>{RO.warnings}</h2>
        {d.warnings.length === 0 ? <p className="muted">{RO.noWarnings}</p> : (
          <ul className="warn-list">{d.warnings.map((w: any, i: number) => (
            <li key={i}>{w.employee ? <strong>{bi(w.employee)} </strong> : null}{RO.w[w.kind]}{w.date ? ` · ${weekday(w.date, lang)}` : ''}{w.hours ? ` · ${w.hours} ${t.m.common.hours}` : ''}{w.count !== undefined ? ` · ${w.count}` : ''}</li>
          ))}</ul>
        )}
      </section>
      {pick && templates.data && (
        <Modal title={`${pick.name} · ${weekday(pick.date, lang)}`} onClose={() => setPick(null)}>
          <div className="choice-grid">
            <p className="muted">{RO.pick}</p>
            {templates.data.map(x => <button key={x.id} className={'choice ' + x.color} onClick={() => setShift(x.id)}>{bi(x.name)}<small>{seg(x.segments)} · {x.hours} {t.m.common.hours}</small></button>)}
            <button className="choice" onClick={() => setShift(null)}>{RO.clear}</button>
          </div>
        </Modal>
      )}
    </Page>
  );
}

export function Attendance() {
  const { t, bi, date } = useI18n(); const A = t.m.attendance; const T = t.m.time;
  const [tab, setTab] = useState<'exc' | 'all'>('exc');
  const list = useApi<any[]>('/attendance' + (tab === 'all' ? '?all=1' : ''), [tab]);
  const [fix, setFix] = useState<any>(null);
  const [f, setF] = useState({ time: '', note: '' });
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState('');
  const resolve = async (key: string, action: string, extra: any = {}) => {
    setErr('');
    try { await api('/attendance/resolve', { method: 'POST', body: { key, action, ...extra } }); setFix(null); list.reload(); } catch (e) { setErr(errText(t, e)); }
  };
  const open = list.data?.filter(z => z.status === 'open').length || null;
  return (
    <Page title={A.title}>
      <Tabs value={tab} onChange={setTab} items={[['exc', A.exceptions, tab === 'exc' ? open : null], ['all', A.all]]} />
      {!list.data ? <Loading error={list.error} /> : list.data.length === 0 ? <Empty>{A.nothing}</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>{t.m.common.date}</th><th>{t.m.common.employee}</th><th>{A.scheduled}</th><th>{T.in}</th><th>{T.out}</th><th /><th /></tr></thead>
          <tbody>{list.data.map(z => (
            <tr key={z.key}>
              <td>{date(z.date)}</td><td><Person p={z.employee} /></td><td>{bi(z.shift)}</td><td>{z.in}</td><td>{z.out}</td>
              <td>{z.exceptions.map((e: string) => <Pill key={e} tone={e === 'overtime' ? 'info' : 'warn'}>{T.exc[e]}</Pill>)}{z.correctedBy && <small className="muted"> {A.correctedBy} {z.correctedBy}</small>}</td>
              <td>{z.status === 'open' ? (
                <div className="actions nowrap"><button className="btn sm good" onClick={() => resolve(z.key, 'accept')}>{A.accept}</button>
                  {['missed_punch', 'late'].some(e => z.exceptions.includes(e)) && <button className="btn sm ghost" onClick={() => { setFix(z); setF({ time: '', note: '' }); setTried(false); }}>{A.correct}</button>}</div>
              ) : <Pill tone={statusTone(z.status)}>{t.m.st[z.status] || z.status}</Pill>}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
      {err && <p className="error">{err}</p>}
      {fix && (
        <Modal title={`${A.correct} · ${bi(fix.employee.name)} · ${date(fix.date)}`} onClose={() => setFix(null)}>
          <div className="form">
            <Field label={A.time} missing={tried && !f.time}><input type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></Field>
            <Field label={A.reason} missing={tried && !f.note}><input value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></Field>
            {err && <p className="error">{err}</p>}
            <div className="actions"><button className="btn" onClick={() => { setTried(true); if (f.time && f.note) resolve(fix.key, 'correct', f); }}>{t.save}</button><button className="btn ghost" onClick={() => setFix(null)}>{t.cancel}</button></div>
          </div>
        </Modal>
      )}
    </Page>
  );
}
