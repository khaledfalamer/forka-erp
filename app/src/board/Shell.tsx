import { Fragment } from 'react';
/* Board's frame: top bar, side menu, the current screen, windows on top, and the loading / sign-in screen.
   Moved from render(), sideHTML() and gate() in the original page, element for element. */
import {
  ASK, B, CFG, D, DEPTS, GATE, LIVE, ME, PEOPLE, SV, V, allCards, bMini, bname, boards, cardsOf, chatUnread, depts, gate,
  headAny, isCEO, lang, lead, meP, pname, setLang, stats, t, theme, unread,
} from './core';
import { av, fkLock, ic, css } from './ui';
import { boardHTML, deptHTML, spaceHTML } from './views/board';
import { modalHTML, ntHTML, popHTML } from './views/card';
import { goalFormHTML, goalsHTML, mineHTML, progressHTML, projectsHTML } from './views/home';
import { chatHTML, peopleHTML, portsHTML, profHTML, reportHTML, resHTML } from './views/insights';

const viewAsOptions = (prefix: boolean) => PEOPLE.map((p: any) => (
  <option key={p.id} value={p.id}>{prefix ? `${t('viewAs')}: ${pname(p.id)}` : `${pname(p.id)}${p.ceo ? ' - ' + t('ceoRole') : ''}`}</option>
));

export function sideHTML() {
  const mineN = allCards().filter(({ c }: any) => !c.done && c.members.includes(ME())).length;
  const nav = (v: string, icon: string, label: string, n?: any) => (
    <button className={`nav ${V.view === v ? 'on' : ''}`} data-a="go" data-v={v}>{ic(icon)}{label}{n !== undefined ? <span className="n">{n || ''}</span> : null}</button>
  );
  return (
    <nav className={`side ${V.side ? 'open' : ''}`} aria-label={t('departments')}>
      {LIVE ? null : <select className="viewas sm-only" id="viewas2" aria-label={t('viewAs')} defaultValue={ME()}>{viewAsOptions(true)}</select>}
      <div className="bs-top"><button className="bs-mini" onClick={() => bMini()} aria-label={t('collapse')} title={t('collapse')}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg></button></div>
      <button className="btn newt" data-a="newtask" title={t('newTask')}>{ic('plus')}<span className="lb">{t('newTask')}</span></button>
      {nav('mine', 'inbox', t('mine'), mineN)}
      {nav('projects', 'folder', t('projectsNav'))}
      {nav('chat', 'chat', t('chat'), chatUnread())}
      {nav('people', 'users', t('people'))}
      {isCEO() ? nav('progress', 'chart', t('progress')) : null}
      <h5>{t('strategy')}</h5>
      {nav('goals', 'target', t('goals'))}
      {lead() ? <>{nav('ports', 'folders', t('ports'))}{nav('report', 'chart', t('report'))}{nav('res', 'users', t('resourcing'))}</> : null}
      <h5 className="h5r">{t('departments')}{isCEO() || headAny(meP()) ? <button className="h5b" data-a="spnew" title={t('newSpace')} aria-label={t('newSpace')}>{ic('plus')}</button> : null}</h5>
      {depts().map((d: any) => {
        const bs = boards().filter((b: any) => b.dept === d.id), s = stats(bs.flatMap(cardsOf));
        const open = V.dept === d.id || (V.view === 'board' && B() && B().dept === d.id);
        return (
          <Fragment key={d.id}>
            <button className={`nav ${V.view === 'dept' && V.dept === d.id ? 'on' : ''}`} data-a="dept" data-id={d.id}><span className="dot" style={{ background: d.dot }} />{d[lang]}<span className={`n ${s.over ? 'bad' : ''}`}>{s.over ? s.over : ''}</span></button>
            {open ? bs.map((b: any) => (
              <button key={b.id} className={`nav sub ${V.view === 'board' && V.board === b.id ? 'on' : ''}`} data-a="board" data-id={b.id}>{bname(b)}{b.kind ? <span className="n">{D.lists[b.lists[0]].cards.length || ''}</span> : null}</button>
            )) : null}
          </Fragment>
        );
      })}
      <div className="bs-foot"><a className="bs-apps" href={CFG.ERP_HOME || '../'} title="Forka Apps">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>
        <span className="lb">Forka Apps</span></a></div>
    </nav>
  );
}

function mainView() {
  switch (V.view) {
    case 'board': return boardHTML();
    case 'progress': return progressHTML();
    case 'dept': return deptHTML();
    case 'projects': return projectsHTML();
    case 'goals': return goalsHTML();
    case 'ports': return portsHTML();
    case 'report': return reportHTML();
    case 'res': return resHTML();
    case 'people': return peopleHTML();
    case 'chat': return chatHTML();
    default: return mineHTML();
  }
}

/** The whole Board page (was render()). */
export function AppView() {
  const n = unread();
  return (
    <>
      <div className="top">
        <button className="ib menu-b" data-a="side" aria-label={t('departments')}>{ic('menu')}</button>
        <img className="blogo" src="../logos/forka-board-logo.png" alt="Forka Board" />
        <div className="search">{V.view === 'board' ? <>{ic('search')}<input id="q" type="search" placeholder={t('search')} defaultValue={V.f.q} aria-label={t('search')} /></> : null}</div>
        {LIVE
          ? <span id="sync" className={`sync ${SV.state || 'ok'}`}>{t(SV.state === 'saving' ? 'sSaving' : SV.state === 'off' ? 'sOff' : 'sSaved')}</span>
          : <label className="hide-sm" style={{ fontSize: 12, color: '#a9a196' }}>{t('viewAs')}</label>}
        {LIVE ? null : <select className="viewas" id="viewas" aria-label={t('viewAs')} defaultValue={ME()}>{viewAsOptions(false)}</select>}
        <div className="seg"><button data-a="lang" data-v="en" className={lang === 'en' ? 'on' : ''}>EN</button><button data-a="lang" data-v="ar" className={lang === 'ar' ? 'on' : ''}>عربي</button></div>
        <button className="ib bell" data-a="bell" aria-label={t('alerts')} title={t('alerts')} style={{ color: '#f3eee6' }}>{ic('bell')}{n ? <span className="dot">{n}</span> : null}</button>
        <button className="meav" data-a="prof" data-v={ME()} aria-label={t('editProfile')}>{av(ME())}</button>
      </div>
      <div className={`board ${theme() === 'light' ? 'light' : ''} shell`}>
        {sideHTML()}
        <div className="main">{mainView()}</div>
        {V.card && D.cards[V.card] ? modalHTML(D.cards[V.card]) : null}
        {V.nt ? ntHTML() : null}
        {V.gf ? goalFormHTML() : null}
        {V.prof ? profHTML() : null}
        {V.sp ? spaceHTML() : null}
        {V.pop ? popHTML() : null}
        {V.toast ? <div className="toast" role="status">{V.toast.m || V.toast}{V.toast.undo ? <button className="tundo" data-a="undo" data-v={V.toast.undo}>{t('undo')}</button> : null}</div> : null}
        {ASK ? (
          <div className="ov" style={{ zIndex: 60, alignItems: 'center' }}>
            <div className="md" role="alertdialog" aria-modal="true" style={{ maxWidth: 400, padding: 22 }}>
              <p style={css('margin:0 0 18px;font-size:15px;line-height:1.45')}>{ASK.msg}</p>
              <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn sec" data-a="ask-no">{t('cancel')}</button><button className="btn" style={{ background: '#a33a2c' }} data-a="ask-yes">{t('yes')}</button></div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

const LEAVES: [string, number, number][] = [['p1', 61, 111], ['p2', 181, 111], ['p3', 181, 231], ['p4', 61, 231]];
/** Loading, "please sign in" or "no connection" (was gate()). */
export function GateView() {
  const k = GATE;
  if (k === 'load') return (
    <div className="fk-load" role="status" style={css('--lc:#397F8F')}>
      <svg className="fk-mk" viewBox="46 96 255 255" aria-hidden="true">
        <defs><mask id="fkm"><rect x="0" y="0" width="400" height="400" fill="#fff" /><circle cx="173.5" cy="223.5" r="47" fill="#000" /></mask>
          <filter id="fkg" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16" /></filter></defs>
        <g filter="url(#fkg)">{LEAVES.map(([c, x, y]) => <rect key={c} className={'pg ' + c} x={x} y={y} width="105" height="105" rx="24" fill="#397F8F" />)}</g>
        <g mask="url(#fkm)">{LEAVES.map(([c, x, y]) => <rect key={c} className={'pt ' + c} x={x} y={y} width="105" height="105" rx="24" fill="#397F8F" />)}</g>
        <circle className="pc" cx="173.5" cy="223.5" r="34" fill="#397F8F" />
      </svg><span className="fk-vh">Loading</span>
    </div>
  );
  const switchTo = (l: string) => { setLang(l); gate(k); };
  return (
    <div className="gate">{fkLock(lang === 'ar' ? t('app') : 'Board')}
      {k === 'signin' ? <><p>{t('signinNeed')}</p><a className="btn" href={CFG.ERP_HOME || '../'}>{t('signinBtn')}</a></>
        : <><p>{t('netErr')}</p><button className="btn" onClick={() => location.reload()}>{t('retry')}</button></>}
      <div className="seg" style={{ marginTop: 18 }}>
        <button onClick={() => switchTo('en')} className={lang === 'en' ? 'on' : ''}>EN</button>
        <button onClick={() => switchTo('ar')} className={lang === 'ar' ? 'on' : ''}>عربي</button>
      </div>
    </div>
  );
}
