import { useEffect, useState } from 'react';
import { LangPicker, AutoNotice } from './LangPicker';
import { api, useRoute, go, DEMO } from './api';
import { useI18n } from './i18n';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { People } from './pages/People';
import { Profile } from './pages/Profile';
import { Org } from './pages/Org';
import { Leave } from './pages/Leave';
import { Requests } from './pages/Requests';
import { MyTime, Roster, Attendance } from './pages/Time';
import { Documents, Lifecycle, Payroll, Payslips } from './pages/Hr';
import { Performance, Learning, Desk, Policies, Reports, Settings } from './pages/More';
import { Icon, Logo, GROUP_OF, iconFor } from './icons';
import { RouteCtx } from './ui';
import { Feed, Welcome } from './pages/Extra';

export type Me = { user: { id: string; name: string; email: string; employmentId: string | null }; roles: string[]; can: { isHr: boolean; isManager: boolean }; newJoiner?: boolean };

// Menu. "live" = also served by the real server today; the others exist in the preview build only until their server part is built.
type Item = { key: string; label: (t: any) => string; group: 'me' | 'team' | 'hr' | 'company'; show: (m: Me) => boolean; live?: boolean };
const isPayroll = (m: Me) => m.roles.some(r => ['CEO', 'HR_MANAGER', 'PAYROLL'].includes(r));
const ITEMS: Item[] = [
  { key: '', label: t => t.m.nav.home, group: 'me', show: () => true, live: true },
  { key: 'welcome', label: t => t.m.nav.welcome, group: 'me', show: m => !!m.newJoiner },
  { key: 'feed', label: t => t.m.nav.feed, group: 'me', show: () => true },
  { key: 'requests', label: t => t.m.nav.requests, group: 'me', show: () => true },
  { key: 'leave', label: t => t.m.nav.leave, group: 'me', show: m => !!m.user.employmentId },
  { key: 'time', label: t => t.m.nav.time, group: 'me', show: m => !!m.user.employmentId },
  { key: 'payslips', label: t => t.m.nav.payslips, group: 'me', show: m => !!m.user.employmentId },
  { key: 'learning', label: t => t.m.nav.learning, group: 'me', show: () => true },
  { key: 'policies', label: t => t.m.nav.policies, group: 'me', show: () => true },
  { key: 'people', label: t => t.m.nav.people, group: 'team', show: () => true, live: true },
  { key: 'approvals', label: t => t.m.nav.approvals, group: 'team', show: m => m.can.isManager },
  { key: 'roster', label: t => t.m.nav.roster, group: 'team', show: m => m.can.isManager },
  { key: 'attendance', label: t => t.m.nav.attendance, group: 'team', show: m => m.can.isManager },
  { key: 'performance', label: t => t.m.nav.performance, group: 'team', show: () => true },
  { key: 'documents', label: t => t.m.nav.documents, group: 'hr', show: () => true },
  { key: 'lifecycle', label: t => t.m.nav.lifecycle, group: 'hr', show: m => m.can.isManager },
  { key: 'payroll', label: t => t.m.nav.payroll, group: 'hr', show: isPayroll },
  { key: 'desk', label: t => t.m.nav.desk, group: 'hr', show: () => true },
  { key: 'reports', label: t => t.m.nav.reports, group: 'hr', show: m => m.can.isManager },
  { key: 'settings', label: t => t.m.nav.settings, group: 'company', show: m => m.can.isHr },
  { key: 'org', label: t => t.m.nav.org, group: 'company', show: () => true, live: true },
];

export function App() {
  const { t, lang, setLang } = useI18n();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [more, setMore] = useState(false);
  const [approvals, setApprovals] = useState(0);
  const [, force] = useState(0);
  useEffect(() => {
    const on = () => { force(x => x + 1); setMore(false); };
    window.addEventListener('hashchange', on);
    window.addEventListener('fp-route', on);
    return () => { window.removeEventListener('hashchange', on); window.removeEventListener('fp-route', on); };
  }, []);
  const load = () => api<Me>('/me').then(setMe).catch(() => setMe(null));
  useEffect(() => { load(); }, []);
  const route = useRoute();
  const tab = route[0] || '';
  useEffect(() => {
    if (me?.can.isManager && DEMO) api<any[]>('/requests?box=approve').then(l => setApprovals(l.length)).catch(() => {});
  }, [me, tab]);

  if (me === undefined) return <div className="center muted">{t.loading}</div>;
  if (me === null) return <Login onDone={load} />;

  const items = ITEMS.filter(i => i.show(me) && (DEMO || i.live));
  const signOut = async () => { await api('/logout', { method: 'POST' }); setMe(null); go(''); };
  const groups: [Item['group'], string][] = [['me', t.m.nav.me], ['team', t.m.nav.team], ['hr', t.m.nav.hr], ['company', t.m.nav.company]];
  const Link = ({ i }: { i: Item }) => (
    <a href={'#/' + i.key} className={'side-link g-' + i.group + (tab === i.key ? ' active' : '')}>
      <span className="side-label"><Icon name={iconFor(i.key)} />{i.label(t)}</span>{i.key === 'approvals' && approvals > 0 && <span className="badge">{approvals}</span>}
    </a>
  );
  const bottom = items.filter(i => ['', 'requests', 'time', 'people'].includes(i.key)).slice(0, 3);
  const page = (() => {
    switch (tab) {
      case '': return <Home me={me} />;
      case 'people': return route[1] ? <Profile id={route[1]} key={route[1]} /> : <People />;
      case 'org': return <Org />;
      case 'requests': return <Requests me={me} key="mine" />;
      case 'approvals': return <Requests me={me} start="approve" key="approve" />;
      case 'leave': return <Leave me={me} />;
      case 'time': return <MyTime />;
      case 'roster': return <Roster />;
      case 'attendance': return <Attendance />;
      case 'payslips': return <Payslips />;
      case 'documents': return <Documents me={me} />;
      case 'lifecycle': return <Lifecycle />;
      case 'payroll': return <Payroll id={route[1]} key={route[1] || 'list'} />;
      case 'performance': return <Performance me={me} id={route[1]} key={route[1] || 'list'} />;
      case 'learning': return <Learning me={me} />;
      case 'desk': return <Desk me={me} />;
      case 'policies': return <Policies />;
      case 'feed': return <Feed />;
      case 'welcome': return <Welcome emp={route[1]} key={route[1] || 'me'} />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <p className="muted">{t.notFound}</p>;
    }
  })();
  const D = t.dash;
  const ws = me.roles.includes('CEO') ? D.workspace.ceo : me.can.isHr ? D.workspace.hr : me.can.isManager ? D.workspace.manager : D.workspace.employee;
  const here = items.find(i => i.key === tab);
  const initials = me.user.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="shell v2">
      <aside className="side" aria-label="Main">
        <a href="#/" className="side-brand"><Logo /></a>
        <nav>
          {groups.map(([g, label]) => { const list = items.filter(i => i.group === g); return list.length ? (
            <div key={g} className="side-group"><div className="side-head">{label}</div>{list.map(i => <Link key={i.key} i={i} />)}</div>) : null; })}
        </nav>
        <div className="side-foot">Forka People{DEMO ? ' · ' + t.demo : ''}</div>
      </aside>
      <div className="main-col">
        <header className="top">
          <a href="#/" className="brand-link mobile-only"><Logo dark /></a>
          <div className="crumb"><span>{ws}</span>{here && tab !== '' && <><span aria-hidden="true">/</span><span>{here.label(t)}</span></>}{DEMO && <em className="demo-pill">{t.demo}</em>}</div>
          <div className="top-right">
            <LangPicker dark />
            <details className="acct">
              <summary aria-label={D.account} title={me.user.name}><span className="avatar-btn">{initials}</span></summary>
              <div className="acct-menu">
                <strong>{me.user.name}</strong><small>{me.user.email}</small><small>{me.roles.map(r => t.roles[r] || r).join(' · ')}</small>
                <button className="btn ghost" onClick={signOut}>{t.signOut}</button>
              </div>
            </details>
          </div>
        </header>
        <AutoNotice />
        <main className="page"><RouteCtx.Provider value={tab}>{page}</RouteCtx.Provider></main>
      </div>
      <nav className="bottom-nav">
        {bottom.map(i => <a key={i.key} href={'#/' + i.key} className={'nav-link g-' + i.group + (tab === i.key ? ' active' : '')}><Icon name={iconFor(i.key)} size={22} /><span>{i.label(t)}</span></a>)}
        {me.can.isManager && DEMO && <a href="#/approvals" className={'nav-link g-team' + (tab === 'approvals' ? ' active' : '')}><Icon name="approvals" size={22} /><span>{t.m.nav.approvals}{approvals > 0 && <span className="badge">{approvals}</span>}</span></a>}
        <button className={'nav-link' + (more ? ' active' : '')} onClick={() => setMore(!more)} aria-expanded={more}><svg className="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg><span>{t.m.nav.more}</span></button>
      </nav>
      {more && (
        <div className="sheet-back" onClick={() => setMore(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            {groups.map(([g, label]) => { const list = items.filter(i => i.group === g); return list.length ? (
              <div key={g} className="side-group"><div className="side-head">{label}</div><div className="sheet-grid">{list.map(i => <Link key={i.key} i={i} />)}</div></div>) : null; })}
            <div className="sheet-foot"><span>{me.user.name}</span><button className="link-btn" onClick={signOut}>{t.signOut}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
