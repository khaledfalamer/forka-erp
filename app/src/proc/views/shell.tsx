/* Procurement's shell: top bar, side menu, main page area (render), landing and PIN screens, Oman home, status bar, how-to.
   Exact copy of the original page's templates, as React. */
import {
  t, lang, tab, side, fkI, UNITS, editMsg, local, supLocal, recPending, SHEET, mode, BGWAIT, myRole, me, editMode,
  invEdit, saving, rqNewCount, rqApprCount, rqGoCount, unlocked, omSub, sideTabs, tabName, TAB_IC, CFG, eff, notifOpen,
  gateSide, lastTab, OMAN, poOpen, poAutoRestock, vSups, omr, EDIT_SEL, canEl, canSeeBank, hideBank, invAfter, calPrep,
  calEl, calClose, grnOpen, status, calc, stockVal, fmt, DOOR_IC, doorBadge, ERP, ERP_SIDES, gateMsg, DEMO_PIN, pMini, pSide,
  __set, rqDeepLink } from '../core';
import { paint, svg, css, offAtStart, Fragment } from '../ui';
import { vFill } from './inv';
import { vSum, vAna } from './sup';
import { vGRN, vMoves, vLpo } from './recv';
import { vRqNew, vRqMine, vPrq } from './req';
import { vReq, vPay, vSoa, notifPanel, bellBtn, vCeo, ceoBell, vPeople, vActivity } from './pay';

/** An attribute text like `data-door="plan"` as React props (the original passed attributes as text). */
function attrProps(s: any) {
  const o: Record<string, string> = {};
  for (const a of String(s || '').matchAll(/([a-zA-Z0-9:_-]+)="([^"]*)"/g)) o[a[1]] = a[2];
  return o;
}

export function fkMark() {
  __set('fkI', fkI + 1);
  const m = 'fkm' + fkI;
  return svg(`<svg viewBox="0 0 118 118" aria-hidden="true"><defs><mask id="${m}"><rect width="118" height="118" fill="#fff"/><circle cx="59" cy="59" r="22" fill="#000"/></mask></defs><g mask="url(#${m})"><rect x="7" y="7" width="48" height="48" rx="12" fill="#BD5038"/><rect x="63" y="7" width="48" height="48" rx="12" fill="#BD5038" fill-opacity="0.85"/><rect x="7" y="63" width="48" height="48" rx="12" fill="#BD5038" fill-opacity="0.68"/><rect x="63" y="63" width="48" height="48" rx="12" fill="#BD5038" fill-opacity="0.95"/></g><circle cx="59" cy="59" r="15.8" fill="#BD5038"/></svg>`);
}

export function fkLock(name, cls, attrs?) {
  return <div className={`fk-lock ${cls || ''}`} {...attrProps(attrs)}>{fkMark()}<div><span className="fk-k">FORKA</span><span className="fk-n">{name}</span></div></div>;
}

export function uSel(l, f, miss) {
  const v = l[f] || '';
  return (
    <select className={`us ${miss ? 'miss' : ''}`} data-id={l.id} data-f={f} defaultValue={v}>
      <option value="">—</option>
      {UNITS.map(u => <option key={u[0]} value={u[0]}>{lang === 'ar' ? u[2] : u[1]}</option>)}
      {v && !UNITS.some(u => u[0] === v) ? <option value={v}>{v}</option> : null}
    </select>
  );
}

export function loginView() {
  return (
    <div className="card login"><div style={css('margin-bottom:14px')}>{fkLock(t('landSub'), 'on-light')}</div><h2>{t('loginT')}</h2><p style={css('color:var(--fk-text-2);font-size:13px')}>{t('loginH')}</p>
      <form data-login="1" onSubmit={e => { e.preventDefault(); }} className="controls"><input id="pin" type="password" inputMode="numeric" placeholder={t('yourPin')} autoComplete="current-password" style={css('width:180px')} /><button className="btn btn-accent" data-act="startedit">{t('signIn')}</button></form>
      {editMsg ? <div style={css(`color:${editMsg === t('checking') ? 'var(--fk-muted)' : 'var(--fk-danger)'};font-size:13px;margin-top:8px`)}>{editMsg}</div> : null}</div>
  );
}

export function statusBar() {
  const nl = Object.keys(local).length + Object.keys(supLocal).length + recPending();
  if (SHEET) {
    if (mode === 'login') return null;
    if (mode === 'loading') return <span className="st">{t('loading')}</span>;
    const who = <>{BGWAIT ? <span className="st st-muted" id="bgst">{t('updating')}</span> : null}<span className="st">{myRole === 'team' ? <input id="me" defaultValue={me} placeholder={t('name')} className={me ? '' : 'miss'} style={css('width:140px;min-height:30px')} /> : <b>{me}</b>}<span className="st-role">{t('r_' + (myRole || 'viewer'))}</span></span></>;
    if (mode === 'offline') return <>{who}<span className="st st-warn">{t('net')}</span><button className="btn btn-sm" data-act="doneedit">{t('doneEdit')}</button></>;
    if (!editMode) return <>{who}<span className="st st-muted">{t('roleOnly')}</span><button className="btn btn-sm" data-act="doneedit">{t('doneEdit')}</button></>;
    const waitInv = invEdit && Object.keys(local).length === nl;
    return <>{who}{saving || (nl && !waitInv) ? <span className="st st-chg" id="svst">{t('saving')}</span> : nl ? <span className="st st-chg">{`${nl} ${t('unsaved')}`}</span> : <span className="st st-muted" id="svst">{`✓ ${t('allSaved')}`}</span>}</>;
  }
  if (mode === 'live') return <>{me ? <span className="st"><b>{me}</b></span> : null}<span className="st"><i className="dot-live"></i>{t('live')}</span>{nl ? <button className="btn btn-sm" data-act="send">{`${t('send')} (${nl})`}</button> : null}</>;
  return me ? <span className="st"><b>{me}</b></span> : null;
}

export function tabCount(k) {
  return k === 'prq' && rqNewCount() ? <span className="tcount">{rqNewCount()}</span> : k === 'appr' && rqApprCount() ? <span className="tcount">{rqApprCount()}</span> : k === 'pon' && rqGoCount() ? <span className="tcount soft">{rqGoCount()}</span> : null;
}

export function renderTop() {
  const el = document.getElementById('top'), sd = document.getElementById('pside');
  if (!unlocked) { paint(el, null); el.style.display = 'none'; paint(sd, null); document.body.classList.remove('has-pside'); return; } el.style.display = ''; document.body.classList.add('has-pside');
  const sideName = t(side === 'plan' ? 'sidePlan' : side === 'fin' ? 'sideFin' : side === 'dept' ? 'sideDept' : side === 'ceo' ? 'sideCeo' : side === 'oman' ? 'sideOman' : 'sideOps') + (side === 'oman' && omSub ? ' · ' + t({ plan: 'omPlan', ops: 'omOps', fin: 'omFin' }[omSub]) : '');
  paint(sd, <>
    <div className="ps-top"><button className="plogo" data-act="exit" title={t('exit')} aria-label="Forka Procurement"><img src="logos/forka-procurement-logo.png" alt="Forka Procurement" /></button><button className="ps-mini" onClick={() => { pMini(); }} aria-label="Collapse menu" title="Collapse menu"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg></button></div>
    <div className="ps-side">{sideName}</div>
    <nav className="tabs ps-nav">{sideTabs().map(k => <button key={k} className={`tab ${tab === k ? 'on' : ''}`} data-tab={k} title={tabName(k)} aria-current={tab === k ? 'page' : undefined}>{svg(TAB_IC[k] || '')}<span className="lb">{tabName(k)}</span>{tabCount(k)}</button>)}</nav>
    {CFG.ERP_URL ? <div className="ps-foot"><a className="ps-apps" href={CFG.ERP_URL} title="Forka Apps"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg><span className="lb">Forka Apps</span></a></div> : null}
  </>);
  paint(el, <>
    <div className="t1"><button className="ps-burger" onClick={() => { pSide(true); }} aria-label="Menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button><div className="crumb"><span className="sidetag">{sideName}</span><span className="cr-sep" aria-hidden="true">›</span><span className="cr-pg">{sideTabs().includes(tab) ? tabName(tab) : ''}</span></div>
      <span className="sp"></span><div className="status">{statusBar()}</div>{eff() === 'fin' ? bellBtn() : side === 'ceo' ? ceoBell() : null}{langSw('lang')}{side === 'oman' && omSub ? <button className="exitb" data-act="omhome">{`${lang === 'ar' ? '→' : '←'} ${t('omBack')}`}</button> : null}<button className="exitb" data-act="exit">{t('exit')}</button></div>{eff() === 'fin' && notifOpen ? notifPanel() : null}
  </>);
}

export function render() {
  __set('_lead', null); rqDeepLink();
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  renderTop(); const P: any = document.getElementById('page');
  if (!unlocked) { paint(P, gateSide ? vPin() : vLanding()); __set('lastTab', ''); const pp = document.getElementById('pin'); if (pp) pp.focus(); return; }
  if (side === 'oman' && !omSub) { paint(P, vOmHome()); __set('lastTab', ''); return; }
  const ae: any = document.activeElement, af: any = ae && ae.dataset && ae.dataset.f && ae.dataset.id ? { id: ae.dataset.id, f: ae.dataset.f, dr: !!ae.closest('.invdr') } : ae && ae.dataset && ae.dataset.sf ? { sid: ae.dataset.sid, sf: ae.dataset.sf } : ae && ae.id ? { elid: ae.id } : null;
  const same = lastTab === tab; __set('lastTab', tab); const wy = window.scrollY, sc = [...P.querySelectorAll('.tbl-wrap')].map((e: any) => [e.scrollTop, e.scrollLeft]);
  if (!sideTabs().includes(tab)) __set('tab', sideTabs()[0]);
  if (tab === 'lpo' && !poOpen) poAutoRestock();
  paint(P, <>{OMAN() ? <div className="banner bn-info" style={css('margin-bottom:12px')}>{t('omBanner')}</div> : null}{tab === 'lpo' ? vLpo() : tab === 'people' ? vPeople() : tab === 'activity' ? vActivity() : tab === 'appr' ? vCeo() : tab === 'rnew' ? vRqNew() : tab === 'rmine' ? vRqMine() : tab === 'prq' ? vPrq('in') : tab === 'pon' ? vPrq('go') : tab === 'soa' ? vSoa() : tab === 'pay' ? vPay() : tab === 'fill' ? vFill() : tab === 'sups' ? vSups() : tab === 'ana' ? vAna() : tab === 'sum' ? vSum() : tab === 'grn' ? <>{banner()}{vGRN()}</> : tab === 'req' ? vReq() : tab === 'moves' ? vMoves() : vHow()}</>); if (OMAN()) omr(P);
  if (SHEET) {
    if (!editMode) P.querySelectorAll(EDIT_SEL).forEach((e: any) => e.disabled = true); else P.querySelectorAll(EDIT_SEL).forEach((e: any) => { if (!canEl(e)) e.disabled = true; }); if (!canSeeBank()) hideBank(P);
    Object.entries(supLocal).forEach(([id, p]: [string, any]) => Object.keys(p).forEach(f => { const el = P.querySelector(`[data-sid="${CSS.escape(id)}"][data-sf="${f}"]`); if (el) el.classList.add('chg'); }));
    Object.entries(local).forEach(([id, p]: [string, any]) => Object.keys(p).forEach(f => { const el = P.querySelector(`[data-id="${CSS.escape(id)}"][data-f="${f}"]`); if (el) el.classList.add('chg'); }));
  }
  if (tab === 'fill' && !invEdit) P.querySelectorAll('.inv [data-f],.inv button[data-act="ok"],.inv button[data-act="useprice"]').forEach((e: any) => e.disabled = true);
  if (tab === 'fill') invAfter(P);
  calPrep(P); if (calEl && !document.body.contains(calEl)) calClose();
  if (eff() === 'fin' && grnOpen) P.querySelectorAll('input,select,textarea,button').forEach((el: any) => { if (!['gback'].includes(el.dataset.act) && !(el.dataset.act === 'gstatus' && el.dataset.v === 'paid')) el.disabled = true; });
  if (same) { [...P.querySelectorAll('.tbl-wrap')].forEach((e: any, i) => { if (sc[i]) { e.scrollTop = sc[i][0]; e.scrollLeft = sc[i][1]; } }); window.scrollTo(0, wy); }
  if (af) { const el: any = af.elid ? document.getElementById(af.elid) : af.sid ? P.querySelector(`[data-sid="${CSS.escape(af.sid)}"][data-sf="${af.sf}"]`) : (af.dr && P.querySelector('.invdr') || P).querySelector(`[data-id="${CSS.escape(af.id)}"][data-f="${af.f}"]`); if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT')) { el.focus({ preventScroll: true }); try { const v = el.value; el.setSelectionRange(v.length, v.length); } catch (_) { /* not a text field */ } } }
}

export function banner() {
  const nl = Object.keys(local).length + Object.keys(supLocal).length + recPending();
  if (SHEET) {
    if (mode === 'loading') return <div className="banner bn-info">{t('loading')}</div>;
    if (mode === 'offline') return <div className="banner bn-warn">{t('net')}</div>;
    return null;
  }
  if (mode === 'loading') return <div className="banner bn-info">{t('loading')}</div>;
  if (mode === 'live') return null;
  if (mode === 'offline') return <div className="banner bn-warn">{t('offline')}{nl ? <><span className="sp"></span><button className="btn btn-accent" data-act="send">{`${t('send')} (${nl})`}</button></> : null}</div>;
  return <div className="banner bn-warn">{t('local')}<span className="sp"></span><button className="btn btn-accent" data-act="send" ref={offAtStart(!nl)}>{`${t('send')} (${nl})`}</button></div>;
}

export function head(L) {
  const c = { missing: 0, toconfirm: 0, confirmed: 0, notneeded: 0 }; let tot = 0, pe = 0, cr = 0, np = 0;
  L.forEach(l => { c[status(l)]++; const v = calc(l).v; tot += v; if (l.pay === 'pemo') pe += v; else if (l.pay === 'credit') cr += v; else np += v; });
  const n = L.length, col = { missing: 'var(--fk-danger)', toconfirm: 'var(--fk-warning)', confirmed: 'var(--fk-success)', notneeded: 'var(--fk-muted)' };
  return <>
    <div className="grid kpis">
      <div className="card stat"><div className="lbl">{t('budget')}</div><div className="num">{fmt(tot)}<small>AED</small></div><div className="hint">{`${n} ${t('lines')}`}</div></div>
      <div className="card stat" id="stval"><div className="lbl">{t('stVal')}</div><div className="num">{fmt(stockVal(L).v)}<small>AED</small></div><div className="hint">{t('stValH')}</div></div>
      <div className="card stat"><div className="lbl">{t('pemo')}</div><div className="num">{fmt(pe)}<small>AED</small></div><div className="hint">{t('topup')}</div></div>
      <div className="card stat"><div className="lbl">{t('credit')}</div><div className="num">{fmt(cr)}<small>AED</small></div></div>
      <div className="card stat"><div className="lbl">{t('nopay')}</div><div className="num" style={css(`color:${np ? 'var(--fk-danger)' : 'inherit'}`)}>{fmt(np)}<small>AED</small></div></div></div>
    <div className="card"><div className="controls"><b>{t('progress')}</b><span className="muted" style={css('color:var(--fk-muted)')}>{`${c.confirmed + c.notneeded} ${t('of')} ${n}`}</span></div>
      <div className="prog">{['confirmed', 'notneeded', 'toconfirm', 'missing'].map(k => <i key={k} style={css(`width:${c[k] / n * 100}%;background:${col[k]}`)}></i>)}</div>
      <div className="legend">{['missing', 'toconfirm', 'confirmed', 'notneeded'].map(k => <span key={k} data-st={k}><i className="dot" style={css(`background:${col[k]}`)}></i>{t(k)}{' '}<b>{c[k]}</b></span>)}</div></div>
  </>;
}

export function vHow() {
  return <>
    <div className="card"><h2>{t('how')}</h2><ol className="steps">{['how1', 'how2', 'how3', 'how4', 'how5'].map(k => <li key={k}>{t(k)}</li>)}</ol>
      <p style={css('color:var(--fk-muted);font-size:13px')}>{t('notes')}</p></div>{banner()}
  </>;
}

export function doorIcon(k) {
  return svg(`<svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${DOOR_IC[k] || ''}</svg>`);
}

export function doorHtml(attr, k, label, cap, badge) {
  const n = badge ? doorBadge(k) : 0;
  return <div className="door"><button {...attrProps(attr)} aria-label={label} title={cap || ''}>{doorIcon(k)}{n ? <b className="dot">{n}</b> : null}</button><span className="dlab">{label}</span></div>;
}

export function vOmHome() {
  const d = (k, cap) => doorHtml(`data-omdoor="${k}"`, k, t({ plan: 'omPlan', ops: 'omOps', fin: 'omFin' }[k]), t(cap), false);
  return <div className="omhome"><div className="mark"><div className="w">{t('sideOman')}</div><div className="rule"></div><div className="s">{t('landOman')}</div></div><p className="hint" style={css('text-align:center;max-width:560px;margin:22px auto 0;white-space:normal')}>{t('omHomeH')}</p><div className="doors"><Fragment key="plan">{d('plan', 'landOmPlan')}</Fragment><Fragment key="ops">{d('ops', 'landOmOps')}</Fragment><Fragment key="fin">{d('fin', 'landOmFin')}</Fragment></div></div>;
}

export function langSw(cls) {
  return <div className={cls}><button className={lang === 'en' ? 'on' : ''} data-l="en">EN</button><button className={lang === 'ar' ? 'on' : ''} data-l="ar">عربي</button></div>;
}

export function markHtml() {
  return <div className="mark">{fkLock(t('landSub'), 'big on-light')}</div>;
}

export function vLanding() {
  if (SHEET && CFG.ERP_URL && !ERP) return <div className="gate">{langSw('gate-lang')}{markHtml()}<div className="pinbox"><h2>{t('erpT')}</h2><p>{t('erpH')}</p>{gateMsg ? <div className="err">{gateMsg}</div> : null}<a className="go" style={css('display:block;text-align:center;text-decoration:none')} href={CFG.ERP_URL}>{t('erpGo')}</a></div></div>;
  const ok = k => !ERP || !ERP_SIDES || ERP_SIDES.includes(k);
  const d = (k, lbl, cap) => ok(k) ? doorHtml(`data-door="${k}"`, k, t(lbl), t(cap), true) : null;
  return <div className="gate">{langSw('gate-lang')}{ok('ceo') ? <button className="gate-ceo" data-door="ceo">{t('landCeo')}</button> : null}{markHtml()}
    {ERP && ERP_SIDES && !ERP_SIDES.length ? <div className="err" style={css('text-align:center')}>{t('erpNone')}</div> : null}<div className="doors"><Fragment key="plan">{d('plan', 'sidePlan', 'landPlan')}</Fragment><Fragment key="ops">{d('ops', 'sideOps', 'landOps')}</Fragment><Fragment key="dept">{d('dept', 'btnReq', 'capReq')}</Fragment><Fragment key="fin">{d('fin', 'btnPay', 'capPay')}</Fragment><Fragment key="oman">{d('oman', 'sideOman', 'landOman')}</Fragment></div>
    <div className="gate-foot">{t('landFoot')}</div></div>;
}

export function vPin() {
  const sd = gateSide;
  return <div className="gate">{langSw('gate-lang')}{markHtml()}
    <form className="pinbox" data-pinform="1" onSubmit={e => { e.preventDefault(); }}><h2>{t('pinT_' + sd)}</h2><p>{t('pinOnlyH')}</p>
      <input id="pin" type="password" inputMode="numeric" autoComplete="off" maxLength={12} aria-label="PIN" />
      <button className="go" data-act="pinok">{t('pinGo')}</button>
      <div className="err">{gateMsg}</div>
      {SHEET ? null : <div className="demo">{`${t('pinDemo')}: ${DEMO_PIN[sd]}${sd !== 'ceo' ? ' · CEO 5555' : ''}`}</div>}
      <button type="button" className="back" data-act="gateback">{`${lang === 'ar' ? '→' : '←'} ${t('pinBack')}`}</button></form></div>;
}
