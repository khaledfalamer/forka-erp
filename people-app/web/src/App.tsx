import { useEffect, useState } from 'react';
import { api, ApiError, useRoute, go } from './api';
import { useI18n } from './i18n';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { People } from './pages/People';
import { Profile } from './pages/Profile';
import { Org } from './pages/Org';

export type Me = { user: { id: string; name: string; email: string; employmentId: string | null }; roles: string[]; can: { isHr: boolean; isManager: boolean } };

export function App() {
  const { t, lang, setLang } = useI18n();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [, force] = useState(0);
  useEffect(() => {
    const on = () => force(x => x + 1);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const load = () => api<Me>('/me').then(setMe).catch(e => (e instanceof ApiError && e.status === 401 ? setMe(null) : setMe(null)));
  useEffect(() => { load(); }, []);
  const route = useRoute();

  if (me === undefined) return <div className="center muted">{t.loading}</div>;
  if (me === null) return <Login onDone={load} />;

  const signOut = async () => { await api('/logout', { method: 'POST' }); setMe(null); go(''); };
  const tab = route[0] || '';
  const Nav = ({ to, label }: { to: string; label: string }) => (
    <a href={'#/' + to} className={'nav-link' + (tab === to ? ' active' : '')}>{label}</a>
  );
  return (
    <div className="shell">
      <header className="top">
        <div className="brand">Forka <span>People</span></div>
        <nav className="nav">
          <Nav to="" label={t.home} />
          <Nav to="people" label={t.people} />
          <Nav to="org" label={t.org} />
        </nav>
        <div className="top-right">
          <button className="link-btn" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t.language}</button>
          <span className="who" title={me.user.email}>{me.user.name}<small>{me.roles.map(r => t.roles[r] || r).join(' · ')}</small></span>
          <button className="link-btn" onClick={signOut}>{t.signOut}</button>
        </div>
      </header>
      <main className="page">
        {tab === '' && <Home me={me} />}
        {tab === 'people' && !route[1] && <People />}
        {tab === 'people' && route[1] && <Profile id={route[1]} key={route[1]} />}
        {tab === 'org' && <Org />}
      </main>
      <nav className="bottom-nav">
        <Nav to="" label={t.home} />
        <Nav to="people" label={t.people} />
        <Nav to="org" label={t.org} />
      </nav>
    </div>
  );
}
