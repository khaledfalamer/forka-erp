import { CFG } from '../config';
import { BRAND, canOpen, hasApp, type AppDef } from '../apps';
import { useLang } from '../i18n';
import { initials, isCeo } from '../people';
import type { AccessRequest, ActivityItem, Person } from '../types';
import { askNotify, install, isIOS, isStandalone, later, swOK, testNotice, usePwa } from '../pwa';
import { LangSwitch } from './LangSwitch';
import { BrandMark, Icon } from './marks';

export function TopBar({ me, onHome, onSignOut }: { me: Person; onHome: () => void; onSignOut: () => void }) {
  const { t, lang } = useLang();
  return (
    <div className="top">
      <button className="toplogo" onClick={onHome} aria-label="Forka App"><img src="/logos/forka-app-logo.svg" alt="Forka App" height={40} /></button>
      <div className="sp" />
      <div className="me">
        <div className="av">{initials(me.name)}</div>
        <div className="txt"><div className="nm">{me.name}</div><div className="lv">{t(me.level + 'Lv')}</div></div>
      </div>
      <a className="btn sm" id="helpl" href={'/help/?lang=' + lang} target="_blank" rel="noopener">{t('help')}</a>
      <button className="btn sm" onClick={onSignOut}>{t('out')}</button>
      <LangSwitch />
    </div>
  );
}

export interface Stats { sign: number; act: number; wait: number; conf: number; active: number; open: number; chg: number }
export function stats(people: Person[], requests: AccessRequest[], activity: ActivityItem[]): Stats {
  const n = new Date();
  const d0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(), m0 = new Date(n.getFullYear(), n.getMonth(), 1).getTime();
  const at = (x: ActivityItem) => new Date(x.at).getTime();
  const td = activity.filter(x => at(x) >= d0), mo = activity.filter(x => at(x) >= m0);
  return {
    sign: td.filter(x => x.verb === 'signin').length,
    act: td.filter(x => !['signin', 'signout'].includes(x.verb)).length,
    wait: requests.filter(r => r.state === 'waiting').length,
    conf: people.filter(p => p.status === 'pending').length,
    active: people.filter(p => p.status === 'active').length,
    open: mo.filter(x => x.verb === 'open').length,
    chg: mo.filter(x => ['allow', 'reject', 'add', 'edit', 'confirm', 'block', 'unblock'].includes(x.verb)).length,
  };
}

function Kpi({ v, label, warn, color }: { v: number; label: string; warn?: boolean; color: string }) {
  const { t } = useLang();
  return <div className={'kpi' + (warn ? ' warn' : '')} style={{ ['--k' as string]: color }}><div className="v">{v}</div><div className="l">{t(label)}</div></div>;
}

export function Hero({ me, s }: { me: Person; s: Stats | null }) {
  const { t, lang } = useLang();
  const h = new Date().getHours();
  const greet = t(h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening');
  let d = '';
  try { d = new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch { /* ignore */ }
  return (
    <div className="hero"><div className="hero-in">
      <div className="date">{d}</div>
      <h1>{greet}{lang === 'ar' ? '، ' : ', '}{me.name.split(' ')[0]}</h1>
      <p>{t('helloTxt')}</p>
      {s && (
        <div className="card ceo" id="ceobox">
          <div className="hd"><h3>{t('today')}</h3><span className="tag">{t('ceoOnly')}</span></div>
          <div className="kpis">
            <Kpi v={s.sign} label="kSign" color="#2c7a76" /><Kpi v={s.act} label="kAct" color="#3e5c8a" />
            <Kpi v={s.wait} label="kWait" warn={s.wait > 0} color="#a8703d" /><Kpi v={s.conf} label="kConf" warn={s.conf > 0} color="#b5651d" />
          </div>
          <div className="grp">{t('month')}</div>
          <div className="kpis">
            <Kpi v={s.active} label="kActive" color="#5f8a45" /><Kpi v={s.open} label="kOpen" color="#a8703d" /><Kpi v={s.chg} label="kChg" color="#7b4e6e" />
          </div>
        </div>
      )}
    </div></div>
  );
}

function AppTile({ a, me, onOpen }: { a: AppDef; me: Person; onOpen: (a: AppDef) => void }) {
  const { t } = useLang();
  const ok = canOpen(a, me); const B = BRAND[a.id];
  return (
    <button className={'app tile' + (B ? '' : ' br') + (ok ? '' : ' off')} style={{ ['--c' as string]: B ? B[0] : a.color }}
      data-app={a.id} aria-disabled={ok ? undefined : true} onClick={() => ok && onOpen(a)}>
      {B
        ? <><div className="lg"><BrandMark color={B[0]} /><div className="lgk">FORKA</div><div className="lgn">{B[1]}</div></div><h3 className="vh">{t('a_' + a.id)}</h3></>
        : <><div className="ic"><Icon name={a.id} /></div><h3>{t('a_' + a.id)}</h3></>}
      <p>{t('d_' + a.id)}</p>
      {a.id === 'proc' && me.sides?.length > 0 && <div className="meta">{me.sides.map(s => t('s_' + s)).join(' · ')}</div>}
      {!ok ? <span className="soon">{t('soon')}</span> : a.ceoOnlyUntilMoved && <span className="soon gold">{t('curOnly')}</span>}
      {ok && <span className="go">{t('openA')} <i>&rarr;</i></span>}
    </button>
  );
}

const SHARE = <svg className="shr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12" /><path d="M8 7l4-4 4 4" /><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" /></svg>;
const BELL = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;

/** "On this device": install the app, turn on notifications. */
function Device({ me, onSubscribe }: { me: Person; onSubscribe: () => void }) {
  const { t, lang } = useLang();
  const pwa = usePwa();
  const standalone = isStandalone() || pwa.installed, snoozed = Date.now() - pwa.laterAt < 14 * 864e5;
  const kinds = ['n_board']; if (isCeo(me)) kinds.push('n_ceo'); if (me.apps?.proc) kinds.push('n_lpo'); if (me.apps?.hire) kinds.push('n_hire');
  const canNotify = typeof Notification !== 'undefined' && swOK();
  const turnOn = async () => { if ((await askNotify()) === 'granted') { testNotice(t('notTestT'), t('notTestB'), lang); onSubscribe(); } };
  let how = null;
  if (!standalone && !snoozed) {
    if (pwa.prompt) how = <div className="row2"><button className="btn pri" onClick={install}>{t('install')}</button><button className="lnk" onClick={later}>{t('later')}</button></div>;
    else if (isIOS()) how = <><ol id="iosSteps"><li>{t('iosS1')} {SHARE}</li><li>{t('iosS2')}</li><li>{t('iosS3')}</li></ol><div className="sm-n">{t('iosSafari')}</div><div className="row2"><button className="lnk" onClick={later}>{t('later')}</button></div></>;
    else how = <><p>{t('othS')}</p><div className="row2"><button className="lnk" onClick={later}>{t('later')}</button></div></>;
  }
  let st;
  if (isIOS() && !standalone) st = <div className="wl">{t('notIos')}</div>;
  else if (pwa.perm === 'granted') st = <><div className="okl">&#10003; {t('notIsOn')}</div>{!CFG.PUSH_PUBLIC_KEY && <div className="sm-n">{t('notSoon')}</div>}<div className="row2"><button className="btn sm" onClick={() => testNotice(t('notTestT'), t('notTestB'), lang)}>{t('notTest')}</button></div></>;
  else if (pwa.perm === 'denied') st = <div className="wl">{t('notBlocked')}</div>;
  else if (!canNotify) st = <div className="sm-n">{t('notNo')}</div>;
  else st = <div className="row2"><button className="btn pri" onClick={turnOn} disabled={pwa.busy}>{t('notOn')}</button></div>;
  return (
    <div className="sec" id="device"><h2>{t('devT')}</h2><div className="dev">
      {how && <div className="card" id="appcard"><div className="dh"><img src="/logos/forka-app-192.png" alt="" /><h3>{t('appT')}</h3></div><p>{t('appTxt')}</p>{how}</div>}
      <div className="card" id="notcard"><div className="dh"><div className="bell">{BELL}</div><h3>{t('notT')}</h3></div><p>{t('notTxt')}</p>
        <ul className="nk">{kinds.map(k => <li key={k}>{t(k)}</li>)}</ul>{st}</div>
    </div></div>
  );
}

export function Home({ me, apps, s, onOpen, onPeople, onActivity, onSubscribe }: {
  me: Person; apps: AppDef[]; s: Stats | null; onOpen: (a: AppDef) => void; onPeople: () => void; onActivity: () => void; onSubscribe: () => void;
}) {
  const { t } = useLang();
  const mine = apps.filter(a => hasApp(a, me));
  return <>
    <div className="sec"><h2>{t('yourApps')}</h2>
      {mine.length ? <div className="apps">{mine.map(a => <AppTile key={a.id} a={a} me={me} onOpen={onOpen} />)}</div> : <div className="empty-apps">{t('noApps')}</div>}
    </div>
    <Device me={me} onSubscribe={onSubscribe} />
    {s && (
      <div className="sec"><h2>{t('admin')}</h2><div className="apps">
        <button className="app adm" style={{ ['--c' as string]: '#7b4e6e' }} onClick={onPeople}><div className="ic"><Icon name="people" /></div><h3>{t('a_people')}</h3><p>{t('d_people')}</p>
          {s.wait + s.conf > 0 && <span className="badge">{s.wait + s.conf}</span>}</button>
        <button className="app adm" style={{ ['--c' as string]: '#3e5c8a' }} onClick={onActivity}><div className="ic"><Icon name="act" /></div><h3>{t('a_act')}</h3><p>{t('d_act')}</p></button>
      </div></div>
    )}
  </>;
}
