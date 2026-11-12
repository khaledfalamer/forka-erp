import { useEffect, useState } from 'react';
import { api, DEMO } from '../api';
import { useI18n } from '../i18n';
import type { Me } from '../App';
import { ltr, Illustration } from '../ui';
import { Icon } from '../icons';

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
  const unread = extra.news?.policies?.filter((p: any) => !p.acked).length;
  const D = t.dash;
  const hour = new Date().getHours();
  const greet = hour < 12 ? D.morning : hour < 17 ? D.afternoon : D.evening;
  const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const next = extra.time?.days?.find((x: any) => x.date >= today && x.shift && !x.leave);
  const clockedIn = !!extra.time?.clock?.in;
  const hasJob = !!me.user.employmentId;
  const waiting = extra.approve?.length || 0;
  // Quick actions: what this person can do, most used first. Links only; nothing here changes who can see what.
  const qa: { href: string; icon: string; tone: string; title: string; sub: string; count?: number }[] = [];
  if (hasJob) {
    qa.push({ href: '#/time', icon: 'time', tone: 'sea', title: clockedIn ? D.clockOut : D.clockIn, sub: clockedIn ? D.clockOutSub : D.clockInSub });
    qa.push({ href: '#/time', icon: 'roster', tone: 'sage', title: D.shifts, sub: D.shiftsSub });
    qa.push({ href: '#/leave', icon: 'leave', tone: 'saffron', title: D.leave, sub: annual ? `${annual.balance} ${D.daysLeft}` : D.leaveSub });
  }
  if (me.can.isManager) qa.push({ href: '#/approvals', icon: 'approvals', tone: 'terracotta', title: D.approvals, sub: waiting ? `${waiting} ${D.waiting}` : D.mineSub, count: waiting });
  else qa.push({ href: '#/requests', icon: 'requests', tone: 'terracotta', title: D.mine, sub: D.mineSub });
  if (qa.length < 4) qa.push({ href: '#/desk', icon: 'desk', tone: 'sea', title: D.askHr, sub: D.askHrSub });
  if (qa.length < 4) qa.push({ href: '#/people', icon: 'people', tone: 'sage', title: D.people, sub: D.peopleSub });
  // Latest updates from the person's own data
  const ups: { href: string; title: string; sub: string; pill: string; tone: string }[] = [];
  if (next) ups.push({ href: '#/time', title: D.nextShift, sub: `${next.date === today ? D.today : next.date === tomorrow ? D.tomorrow : date(next.date)} · ${next.shift.segments.map((x: string[]) => ltr(x.join('–'))).join(' + ')}`, pill: D.scheduled, tone: 'sea' });
  if (waiting) ups.push({ href: '#/approvals', title: D.toApprove, sub: `${waiting} ${D.waiting}`, pill: D.toDo, tone: 'terracotta' });
  (extra.mine || []).filter((r: any) => r.status === 'pending').slice(0, 2).forEach((r: any) => ups.push({ href: '#/requests', title: t.m.req.types[r.type] || r.type, sub: D.awaiting, pill: D.pending, tone: 'saffron' }));
  (extra.news?.policies || []).filter((p: any) => !p.acked).slice(0, 2).forEach((p: any) => ups.push({ href: '#/policies', title: bi(p.title), sub: D.readConfirm, pill: D.isNew, tone: 'sage' }));
  return (
    <div className="stack dash">
      <section className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-tag"><span aria-hidden="true">✦</span> {D.tag}</span>
          <h1>{greet}{t.comma} {me.user.name.split(' ')[0]}</h1>
          <p>{D.lead}</p>
          {DEMO && <a className="btn cta" href="#/feed">{D.cta} <span aria-hidden="true">{t.toArrow}</span></a>}
        </div>
        <div className="dash-hero-art"><Illustration fit="cover" decorative priority /></div>
      </section>
      {DEMO && <>
        <div className="sec-head"><h2>{D.quick}</h2><span className="muted">{D.quickSub}</span></div>
        <div className="qa-grid">
          {qa.slice(0, 4).map((q, i) => (
            <a key={i} className="qa-card" href={q.href}>
              <span className={'qa-ico t-' + q.tone}><Icon name={q.icon} size={26} />{!!q.count && <span className="badge">{q.count}</span>}</span>
              <strong>{q.title}</strong><span className="muted">{q.sub}</span>
            </a>
          ))}
        </div>
      </>}
      <div className="dash-cols">
        <section className="panel dash-updates">
          <h2>{D.updates}</h2>
          {ups.length === 0 ? <p className="muted">{D.caughtUp}</p> : (
            <ul>{ups.slice(0, 5).map((u, i) => (
              <li key={i}><a href={u.href}><span className={'dot t-' + u.tone} aria-hidden="true" /><span className="up-main"><strong>{u.title}</strong><small>{u.sub}</small></span><span className={'up-pill t-' + u.tone}>{u.pill}</span></a></li>
            ))}</ul>
          )}
        </section>
        <section className="panel dash-together">
          <h2>{D.together}</h2>
          <div className="together-row">
            <Illustration className="together-art" decorative />
            <div><h3>{D.everyone}</h3><p>{D.everyoneText}</p></div>
          </div>
          <dl className="facts">
            {d.me && <a href={'#/people/' + d.me.employmentId}><dt>{t.myJob}</dt><dd>{bi(d.me.job)}<small>{bi(d.me.branch)}</small></dd></a>}
            {annual && <a href="#/leave"><dt>{bi(annual.name)}</dt><dd>{annual.balance} <small>{t.m.common.days}</small></dd></a>}
            {(me.can.isManager || me.can.isHr) && <a href="#/people"><dt>{t.teamCount}</dt><dd>{d.teamCount}</dd></a>}
          </dl>
        </section>
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
