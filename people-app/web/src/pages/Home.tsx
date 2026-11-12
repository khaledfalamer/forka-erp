import { useEffect, useState } from 'react';
import { api, DEMO } from '../api';
import { useI18n } from '../i18n';
import type { Me } from '../App';
import { ltr, Illustration } from '../ui';

export function Home({ me }: { me: Me }) {
  const { t, bi, date } = useI18n();
  const [d, setD] = useState<any>(null);
  const [extra, setExtra] = useState<any>({});
  const [err, setErr] = useState(false);
  useEffect(() => {
    api('/dashboard').then(setD).catch(() => setErr(true));
    if (!DEMO) return;   // module endpoints exist in the preview build only, for now
    const get = (k: string, p: string) => api(p).then(v => setExtra((x: any) => ({ ...x, [k]: v }))).catch(() => {});
    if (me.user.employmentId) { get('balances', '/leave/balances'); get('time', '/time/my'); }
    if (me.can.isManager) get('approve', '/requests?box=approve');
    get('mine', '/requests?box=mine'); get('news', '/policies');
  }, []);
  if (err) return <p className="error">{t.error}</p>;
  if (!d) return <p className="muted">{t.loading}</p>;
  const today = new Date().toISOString().slice(0, 10);
  const annual = extra.balances?.find((b: any) => b.code === 'annual');
  const todayShift = extra.time?.days?.find((x: any) => x.date === today);
  const myPending = extra.mine?.filter((r: any) => r.status === 'pending').length;
  const unread = extra.news?.policies?.filter((p: any) => !p.acked).length;
  return (
    <div className="stack">
      <div className="hero">
        <div className="hero-text"><h1>{t.hello}{t.comma} {me.user.name.split(' ')[0]}</h1><p className="muted">{t.heroLine}</p>
        {DEMO && (
          <div className="quick">
            {me.user.employmentId && <a className="btn" href="#/leave">{t.m.leave.request}</a>}
            {me.user.employmentId && <a className="btn ghost" href="#/time">{extra.time?.clock?.in ? t.m.time.clockOut : t.m.time.clockIn}</a>}
            <a className="btn ghost" href="#/desk">{t.m.desk.new}</a>
          </div>
        )}
        </div>
        <Illustration className="hero-illus" decorative priority />
      </div>
      <div className="cards">
        {d.me && (
          <a className="card link accent-sea" href={'#/people/' + d.me.employmentId}>
            <div className="card-label">{t.myJob}</div>
            <div className="card-main">{bi(d.me.job)}</div>
            <div className="muted">{bi(d.me.branch)} · {bi(d.me.department)}</div>
          </a>
        )}
        {todayShift && (
          <a className="card link accent-saffron" href="#/time">
            <div className="card-label">{t.m.time.schedule}</div>
            <div className="card-main">{todayShift.leave ? t.m.time.onLeave : todayShift.shift ? bi(todayShift.shift.name) : t.m.time.rest}</div>
            <div className="muted">{todayShift.shift ? todayShift.shift.segments.map((s: string[]) => ltr(s.join('–'))).join(' + ') : ''}</div>
          </a>
        )}
        {annual && (
          <a className="card link accent-sage" href="#/leave">
            <div className="card-label">{bi(annual.name)}</div>
            <div className="card-number">{annual.balance} <small>{t.m.common.days}</small></div>
          </a>
        )}
        {extra.approve && (
          <a className="card link accent-terracotta" href="#/approvals">
            <div className="card-label">{t.m.req.toApprove}</div>
            <div className="card-number">{extra.approve.length}</div>
          </a>
        )}
        {!!myPending && (
          <a className="card link" href="#/requests">
            <div className="card-label">{t.m.req.mine}</div>
            <div className="card-number sm">{myPending}</div><div className="muted small">{t.m.st.pending}</div>
          </a>
        )}
        {(me.can.isManager || me.can.isHr) && (
          <a className="card link" href="#/people">
            <div className="card-label">{t.teamCount}</div>
            <div className="card-number">{d.teamCount}</div>
          </a>
        )}
      </div>
      <section className="panel">
        <h2>{t.expiringSoon}</h2>
        {d.expiring.length === 0 ? <p className="muted">{t.noneExpiring}</p> : (
          <ul className="rows">
            {d.expiring.slice(0, 8).map((x: any, i: number) => (
              <li key={i}>
                <a href={'#/people/' + x.employmentId} className="row-link">
                  <span className="row-main">{bi(x.name)}<small>{bi(x.type)} · {bi(x.branch)}</small></span>
                  <span className={'pill ' + (x.expiry < today ? 'bad' : 'warn')}>{x.expiry < today ? t.expired + ' · ' : ''}{date(x.expiry)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        {d.expiring.length > 8 && DEMO && <a className="link-btn" href="#/documents">{t.m.nav.documents} →</a>}
      </section>
      {extra.news && (
        <section className="panel">
          <div className="row-between"><h2>{t.m.pol.news}</h2>{!!unread && <a className="link-btn" href="#/policies">{unread} {t.m.pol.policies}</a>}</div>
          {extra.news.announcements.map((a: any) => <article key={a.id} className="news flat"><small className="muted">{date(a.at)}</small><h3>{bi(a.title)}</h3><p>{bi(a.body)}</p></article>)}
        </section>
      )}
    </div>
  );
}
