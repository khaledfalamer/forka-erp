/* Forka Procurement - department requests: new request, my requests, the Purchasing request lists, the request detail,
   the file viewer, badges and tags. Moved from Forka-Procurment/index.html (HTML text templates) to JSX, same markup. */
import {
  t, lang, esc, dd, fmt, RQST, RQOPEN, daysTo, rqDraft, RQK, DEPTS, RQLOC, me, RQI, nm, rqAge, rqOpenId, recs, sideTabs,
  rqF, rqG, RQ_FD, rqInGroup, RQIN, RQGO, RQCH, RQS, rqMore, rqViews, rqCurView, rqNaming, rec, SHEET, editMode, side,
  SPECF, SPECREQ, rqMiss, rqClose, RQREAS, suppliers,
} from '../core';
import { paint, svg, css, offAtStart, Fragment } from '../ui';
import { banner } from './shell';

const REQ_STAR = () => <span style={css('color:var(--fk-danger)')}>*</span>;

export function rqBadge(st) { return <span className={`badge ${RQST[st] || 'b-mute'}`}>{t('rs_' + st)}</span>; }

export function rqNeedTxt(r, bare?) {
  if (!r.needBy) return null; const n = daysTo(r.needBy); const done = !RQOPEN.includes(r.status || 'new');
  return <span style={css(!done && n < 0 ? 'color:var(--fk-danger);font-weight:600' : !done && n <= 3 ? 'color:var(--fk-warning);font-weight:600' : '')}
    dangerouslySetInnerHTML={{ __html: `${bare ? '' : t('rqDue') + ' '}${dd(r.needBy)}` }} />;
}

export function rqKindTag(r) {
  return <><span className="kindtag">{t('rk_' + (r.kind || 'other'))}</span>{r.cost ? <span className={`kindtag ${r.cost}`}>{r.cost === 'capex' ? 'CAPEX' : 'OPEX'}</span> : null}</>;
}

export function vRqNew() {
  const d = rqDraft; const k = d.kind; const fld = (f, lbl, inner) => <div className="fld"><label>{lbl}</label>{inner}</div>;
  const inp = (f, ph?, type?, extra?) => <input type={type || undefined} dir="auto" data-rqd={f} defaultValue={d[f] ?? ''} placeholder={ph || ''} {...(extra || {})} />;
  const sel = (f, L, cls?) => <select className={cls} data-rqd={f} defaultValue={d[f] ?? ''}><option value="">{t('choose')}</option>{L.map(x => <option key={x[0]} value={x[0]}>{lang === 'ar' ? x[2] : x[1]}</option>)}</select>;
  return <>
    <div className="card rq-hero"><h2 style={css('font-size:26px;margin:0 0 6px')}>{t('rqHello')}</h2><p style={css('margin:0;color:var(--fk-text-2);max-width:720px')}>{t('rqHelloH')}</p></div>
    <div className="rq-kinds">{RQK.map(x => <button key={x} className={`rq-kind ${k === x ? 'on' : ''}`} data-rqkind={x}><b>{t('rk_' + x)}</b><span>{t('rk_' + x + 'D')}</span></button>)}</div>
    {k ? <div className="card"><div className="form">
      <div className="fld" style={css('grid-column:1/-1')}><label>{t('rqTitle') + ' '}<REQ_STAR /></label>{inp('title', t('rqTitlePh'), undefined, { className: String(d.title || '').trim() ? '' : 'miss' })}</div>
      <div className="fld" style={css('grid-column:1/-1')}><label>{t('rqWhy')}</label><textarea dir="auto" data-rqd="details" placeholder={t('rqWhyPh')} style={css('min-height:110px')} defaultValue={d.details || ''}></textarea></div>
      {fld('cost', t('rqCost'), <><div className="chips">{['opex', 'capex'].map(c => <button key={c} className={`chip ${d.cost === c ? 'on' : ''}`} data-rqcost={c} title={t(c + 'H')}>{t(c)}</button>)}</div><div className="hint" style={css('white-space:normal')}>{t((d.cost || 'opex') + 'H')}</div></>)}
      {fld('dept', <>{t('rqDept') + ' '}<REQ_STAR /></>, sel('dept', DEPTS, d.dept ? '' : 'miss'))}{fld('branch', t('rqBranch'), sel('branch', RQLOC))}
      {fld('qty', t('rqQty'), inp('qty', '', 'number', { min: '0', step: 'any' }))}{fld('unit', t('rqUnit'), inp('unit', 'KG / PC / set…'))}
      {fld('needBy', t('rqNeed'), inp('needBy', '', 'date'))}{fld('budget', t('rqBudget'), inp('budget', '', 'number', { min: '0', step: 'any' }))}
      {fld('urg', t('rqUrg'), <div className="chips">{[['normal', t('urgN')], ['urgent', t('urgU')]].map(([u, l]) => <button key={u} className={`chip ${(d.urg || 'normal') === u ? 'on' : ''}`} data-rqurg={u}>{l}</button>)}</div>)}
      {fld('phone', t('rqPhone'), inp('phone', '+971 5x xxx xxxx', 'tel'))}
      <div className="fld" style={css('grid-column:1/-1')}><label>{t('rqRefs')}</label>{inp('refs', t('rqRefsPh'))}</div>
      <div className="fld" style={css('grid-column:1/-1')}><label>{t('rqPhotos')}</label><div className="rq-photos">{(d.photos || []).map((ph, i) => <div key={i} className="rq-ph"><img src={ph} alt="" /><button className="btn btn-ok" data-rqphdel={i}>✕</button></div>)}{(d.photos || []).length < 3 ? <label className="btn" style={css('display:inline-flex;align-items:center;cursor:pointer')}>{'+ ' + t('rqAddPhoto')}<input type="file" accept="image/*" data-rqphoto="1" style={css('display:none')} /></label> : null}</div></div>
    </div><div className="controls" style={css('margin-top:16px')}><span className="hint" style={css('white-space:normal')}>{t('rqBy') + ': '}<b>{me}</b></span><span className="sp"></span><button className="btn btn-accent" data-act="rqsend" style={css('min-height:44px;padding:8px 22px;font-size:14px')}>{t('rqSend')}</button></div></div> : null}
  </>;
}

export const rqI = k => svg(`<svg class="rqi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RQI[k]}</svg>`);

export const rqUrgB = () => <span className="rq-urg">{rqI('flag')}{t('urgU')}</span>;

export function rqRow(r, showBy) {
  const u = r.urg === 'urgent';
  const meta = [<bdi className="rqno">{r.no || ''}</bdi>, <span>{rqKindTag(r)}</span>, <span>{nm(DEPTS, r.dept) + (r.branch ? ' · ' + nm(RQLOC, r.branch) : '')}</span>, showBy && r.by ? <span className="rqwho">{rqI('user')}{r.by}</span> : null].filter(Boolean);
  const sd = [<span>{rqI('clock')}<bdi>{rqAge(r.date)}</bdi></span>, r.needBy ? <span><bdi>{rqNeedTxt(r)}</bdi></span> : null, r.buyer ? <span>{t('rqAssigned') + ' '}<b>{r.buyer}</b></span> : null,
    ['later', 'rejected'].includes(r.status) && r.closeReason ? <span><b>{t('rr_' + r.closeReason)}</b>{r.reviewOn ? <>{' · ' + t('rqReviewOn') + ' '}<bdi>{r.reviewOn}</bdi></> : null}</span> : null].filter(Boolean);
  return <div className={`li rq-li${u ? ' is-urg' : ''}`} data-rqopen={r.id} tabIndex={0}>{(r.photos || []).length ? <img className="rq-thumb" src={r.photos[0]} alt="" /> : <span className="rq-thumb rq-noph">{rqI('box')}</span>}
    <div className="grow"><div className="rq-tl"><b dir="auto">{r.title || '—'}</b>{u ? rqUrgB() : null}</div><div className="rq-meta">{meta.map((m, i) => <Fragment key={i}>{i ? <span className="dot" aria-hidden="true">·</span> : null}{m}</Fragment>)}</div></div>
    <div className="rq-side">{sd.map((x, i) => <Fragment key={i}>{x}</Fragment>)}</div><div className="rq-st">{rqBadge(r.status || 'new')}<span className="ov-arrow">{lang === 'ar' ? '←' : '→'}</span></div></div>;
}

export function rqList(R, showBy) {
  return R.length ? <div className="card rqlist" style={css('padding:4px 0')}><div className="list">{R.map((r, i) => <Fragment key={r.id || i}>{rqRow(r, showBy)}</Fragment>)}</div></div> : <div className="card"><div className="empty">{t('rqNone')}</div></div>;
}

export function vRqMine() {
  if (rqOpenId) return vRqDetail(rqOpenId, false);
  const R = recs('Requests').filter(r => (r.by || '').trim().toLowerCase() === (me || '').trim().toLowerCase()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const canNew = sideTabs().includes('rnew');
  return <><div className="card rqhead"><div><h2 style={css('margin:0')}>{t('rmine')}</h2><div className="hint"><bdi>{R.length}</bdi>{' ' + t('rqShown')}</div></div><span className="sp"></span>{canNew ? <button className="btn btn-accent rqnewb" data-act="rqnewgo">{rqI('plus')}<span>{t('rnew')}</span></button> : null}</div>{rqList(R, false)}</>;
}

export function vPrq(mode) {
  if (rqOpenId) return vRqDetail(rqOpenId, true);
  const F = mode === 'in' ? rqF : rqG; for (const k in RQ_FD) if (!(k in F)) F[k] = RQ_FD[k];
  const A = recs('Requests').filter(r => rqInGroup(r, mode)); const cnt = s => A.filter(r => (r.status || 'new') === s).length;
  const groups = mode === 'in' ? { open: RQIN } : { active: RQGO, closed: ['done', 'rejected', 'cancelled'] }; const CH = RQCH[mode];
  if (![...CH.pills, ...CH.more].includes(F.st)) F.st = CH.pills[0];
  const meL = (me || '').trim().toLowerCase(), isMine = r => !!meL && String(r.buyer || '').trim().toLowerCase() === meL;
  let R = F.st === 'all' ? A : groups[F.st] ? A.filter(r => groups[F.st].includes(r.status || 'new')) : A.filter(r => (r.status || 'new') === F.st);
  if (F.kind) R = R.filter(r => r.kind === F.kind); if (F.urg) R = R.filter(r => r.urg === 'urgent'); if (F.mine) R = R.filter(isMine);
  if (F.cost) R = R.filter(r => r.cost === F.cost); if (F.dept) R = R.filter(r => r.dept === F.dept); if (F.branch) R = R.filter(r => r.branch === F.branch);
  const q = F.q.trim().toLowerCase(); if (q) R = R.filter(r => [r.title, r.no, r.by, r.details, r.buyer].some(v => String(v || '').toLowerCase().includes(q)));
  R.sort((a, b) => ((b.urg === 'urgent') as any) - ((a.urg === 'urgent') as any) || RQS.indexOf(a.status || 'new') - RQS.indexOf(b.status || 'new') || (a.needBy || '9').localeCompare(b.needBy || '9'));
  const act = A.filter(r => (mode === 'in' ? RQIN : RQGO).includes(r.status || 'new')); const capex = act.filter(r => r.cost === 'capex').length;
  const tone = { new: 'var(--fk-warning)', quotes: 'var(--fk-bronze)', approval: 'var(--fk-warning)', approved: 'var(--fk-success)', later: 'var(--fk-muted)', open: '#BD5038', active: '#BD5038' };
  const pills = CH.pills.map(k => {
    const n = groups[k] ? act.length : cnt(k); const l = k === 'open' ? t('rqOpenN') : k === 'active' ? t('rqActive') : t('rs_' + k);
    return <button key={k} className={`rqpill ${F.st === k ? 'on' : ''}`} data-rqst={k} aria-pressed={F.st === k ? 'true' : 'false'}><i style={css(`background:${tone[k] || 'var(--fk-line)'}`)}></i><span>{l}</span><bdi className="n">{n}</bdi>{k === 'open' ? <small>CAPEX <bdi>{capex}</bdi> · OPEX <bdi>{act.length - capex}</bdi></small> : null}</button>;
  });
  const hid = (CH.more.includes(F.st) ? 1 : 0) + ['kind', 'cost', 'dept', 'branch'].filter(k => F[k]).length; const more = !!rqMore[mode];
  const dirty = F.st !== CH.pills[0] || F.q || F.urg || F.mine || hid; const urgN = act.filter(r => r.urg === 'urgent').length, mineN = act.filter(isMine).length;
  const V = rqViews(), cv = rqCurView(mode, F), nv = V.filter(v => v.m === mode).length;
  const sel = (id, all, L, v) => <select id={id} aria-label={all} defaultValue={v ?? ''}><option value="">{all}</option>{L.map(x => <option key={x[0]} value={x[0]}>{lang === 'ar' ? x[2] : x[1]}</option>)}</select>;
  return <>{banner()}<div className="card rqhead"><div><h2 style={css('margin:0')}>{t(mode === 'in' ? 'prq' : 'pon')}</h2><p className="hint" style={css('white-space:normal;margin:4px 0 0;font-size:12.5px')}>{t(mode === 'in' ? 'prqH' : 'ponH')}</p></div><span className="sp"></span><span className="hint rqcount"><bdi>{R.length}</bdi>{' ' + t('rqShown')}</span></div>
    <div className="rqpills" role="group" aria-label={t('lt_status')}>{pills}</div>
    <div className="card rqfil"><div className="rqfr">
      <label className="rqsearch">{rqI('search')}<input id="rqq" defaultValue={F.q} placeholder={t('search')} aria-label={t('search')} dir="auto" /></label>
      <div className="chips"><button className={`chip ${F.mine ? 'on' : ''}`} data-rqfx="mine" aria-pressed={F.mine ? 'true' : 'false'}>{rqI('user')}<span>{t('rqMineF')}</span><bdi>{`· ${mineN}`}</bdi></button>{' '}
        <button className={`chip ${F.urg ? 'on' : ''}`} data-rqfx="urg" aria-pressed={F.urg ? 'true' : 'false'}>{rqI('flag')}<span>{t('urgU')}</span><bdi>{`· ${urgN}`}</bdi></button>{' '}
        <button className={`chip rqmoreb ${more ? 'on' : ''}`} data-act="rqmore" aria-expanded={more ? 'true' : 'false'} aria-controls="rqmorebox">{rqI('filter')}<span>{t(more ? 'rqLessF' : 'rqMoreF')}</span>{hid ? <bdi className="rqcnt">{hid}</bdi> : null}</button>{' '}
        {dirty ? <button className="chip" data-act="rqclear">{t('rqClearF')}</button> : null}</div>
      <span className="sp"></span>
      <span className="rqviews">{rqI('view')}{rqNaming ? <><input id="rqvname" maxLength={40} dir="auto" placeholder={t('ivViewName')} aria-label={t('ivViewName')} /><button className="btn btn-sm btn-accent" data-act="rqviewok">{t('ivViewOk')}</button><button className="btn btn-sm" data-act="rqviewno">{t('ivViewNo')}</button></>
        : <><select id="rqview" aria-label={t('ivViews')} defaultValue={cv >= 0 ? String(cv) : ''}><option value="">{t('ivViewPick') + (nv ? ' (' + nv + ')' : '')}</option>{V.map((v, i) => v.m === mode ? <option key={i} value={i}>{v.name}</option> : null)}</select>{cv >= 0 ? <button className="btn btn-sm" data-act="rqdelview" title={t('ivDelView')} aria-label={t('ivDelView')}>{rqI('trash')}</button> : <button className="btn btn-sm" data-act="rqsaveview">{t('ivSaveView')}</button>}</>}</span></div>
      {more ? <div className="rqmore" id="rqmorebox"><div className="chips">{CH.more.map(k => { const c = RQS.includes(k) ? cnt(k) : 0; return <button key={k} className={`chip ${F.st === k ? 'on' : ''}`} data-rqst={k}>{(k === 'all' ? t('rqAll') : t('rs_' + k)) + (c ? ' · ' : '')}{c ? <bdi>{c}</bdi> : null}</button>; })}</div>
        <select id="rqkind" aria-label={t('rqKindAll')} defaultValue={F.kind || ''}><option value="">{t('rqKindAll')}</option>{RQK.map(k => <option key={k} value={k}>{t('rk_' + k)}</option>)}</select>
        <select id="rqcost" aria-label={t('rqCostAll')} defaultValue={F.cost || ''}><option value="">{t('rqCostAll')}</option>{['capex', 'opex'].map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select>
        {sel('rqdept', t('rqDeptAll'), DEPTS, F.dept)}{sel('rqbranch', t('rqLocAll'), RQLOC, F.branch)}</div> : null}</div>
    {rqList(R, true)}</>;
}

export function vRqDetail(id, proc) {
  const r = Object.assign({ id }, rec('Requests', id)); if (!r.no) return null; const st = r.status || 'new'; const can = (!SHEET || editMode); const editable = proc && can && side !== 'ceo' && !['done', 'rejected', 'cancelled'].includes(st);
  const log = (r.log || []).filter(e => proc || ['msg', 'reply', 'status'].includes(e.type)); const thread = log.filter(e => e.type !== 'status'), hist = log.filter(e => e.type === 'status');
  const steps = ['new', 'review', 'sourcing', 'quotes', 'approval', 'ordered', 'done']; const st0 = st === 'later' || st === 'rejected' ? (r.prevStatus || 'new') : st; const si = st0 === 'approved' ? steps.indexOf('approval') + 0.5 : steps.indexOf(st0); const ceo = side === 'ceo';
  const specKeys = SPECF[r.kind] || SPECF.other; const req = SPECREQ[r.kind] || SPECREQ.other; const spec = r.spec || {}; const M = rqMiss(r);
  const opts = r.opts || []; const showSpec = proc && st !== 'new'; const showOpts = proc && (RQGO.includes(st) || st === 'done' || (['later', 'rejected'].includes(st) && RQGO.includes(r.prevStatus)));
  const A = []; const btn = (a, l, cls?) => <button className={`btn ${cls || ''}`} data-rqgo={a}>{t(l)}</button>;
  if (editable) {
    if (st === 'new') A.push(btn('review', 'ga_accept', 'btn-accent')); if (st === 'sourcing') A.push(btn('quotes', 'ga_quotes', 'btn-accent')); if (st === 'quotes') A.push(btn('approval', 'ga_send', 'btn-accent')); if (st === 'approval') A.push(btn('withdraw', 'ga_withdraw', ''));
    if (st === 'approved') A.push(<button className="btn btn-accent" data-act="rqopenpo">{r.poId ? t('lpWaitIssue') + ' · ' + (rec('POs', r.poId).no || '') : t('lpMake')}</button>);
    if (['ordered', 'done'].includes(st) && r.poId) A.push(<button className="btn" data-act="rqopenpo">{`${t('lpOpen')} · ${rec('POs', r.poId).no || ''}`}</button>);
    if (st === 'ordered' && !r.poId) A.push(btn('done', 'ga_done', 'btn-primary'));
    if (['sourcing', 'quotes', 'ordered'].includes(st)) A.push(btn('back', 'ga_back', '')); if (st !== 'later') A.push(btn('later', 'ga_park', '')); A.push(btn('rejected', 'ga_reject', ''));
  }
  if (proc && can && side !== 'ceo' && ['later', 'rejected'].includes(st)) A.push(btn('reopen', 'ga_reopen', 'btn-accent'));
  if (ceo && can && st === 'approval') { A.push(btn('ceook', 'ga_approve', 'btn-accent')); A.push(btn('ceoback', 'ga_ceoback', '')); A.push(btn('rejected', 'ga_reject', '')); }
  const closeBox = rqClose && rqClose.id === id ? <div className="rq-close"><h3 className="sec" style={css('margin:0 0 10px')}>{t('rqWhyT_' + rqClose.to)}</h3><div className="form">
    <div className="fld" style={css(rqClose.to === 'ceoback' ? 'display:none' : '')}><label>{t('rqReason') + ' '}<REQ_STAR /></label><select id="rqcr" className={rqClose.reason ? '' : 'miss'} defaultValue={rqClose.reason || ''}><option value="">{t('choose')}</option>{RQREAS.map(k => <option key={k} value={k}>{t('rr_' + k)}</option>)}</select></div>
    {rqClose.to === 'later' ? <div className="fld"><label>{t('rqReview')}</label><input type="date" id="rqcd" defaultValue={rqClose.date || ''} /></div> : null}
    <div className="fld" style={css('grid-column:1/-1')}><label>{(rqClose.to === 'ceoback' ? t('ceoNoteReq') : t('rqNote')) + ' '}<REQ_STAR /></label><textarea id="rqcn" dir="auto" className={String(rqClose.note || '').trim() ? '' : 'miss'} style={css('min-height:70px')} defaultValue={rqClose.note || ''}></textarea></div></div>
    <div className="controls" style={css('margin-top:10px')}><span className="sp"></span><button className="btn" data-act="rqcloseno">{t('cancelS')}</button><button className="btn btn-primary" data-act="rqcloseok">{t('rqConfirm')}</button></div></div> : null;
  const why = ['later', 'rejected'].includes(st) && r.closeReason ? <div className={`banner ${st === 'rejected' ? 'bn-warn' : 'bn-info'}`} style={css('margin-top:12px')}><b>{t('rs_' + st)}</b>{' · ' + t('rr_' + r.closeReason) + (r.closeNote ? ' — ' + r.closeNote : '') + (r.reviewOn ? ' · ' + t('rqReviewOn') + ' ' : '')}{r.reviewOn ? <bdi>{r.reviewOn}</bdi> : null}</div> : null;
  const msg = (e, key) => <div key={key} className={`rq-msg t-${e.type}`}><div className="hint"><bdi dangerouslySetInnerHTML={{ __html: dd(e.at, 1) }} />{' · '}<b>{e.by || ''}</b>{' · ' + t('lt_' + e.type)}{proc && ['note', 'call', 'meet', 'ceo'].includes(e.type) ? <>{' '}<span className="badge b-mute">{t('rqInternal')}</span></> : null}</div><div style={css('white-space:pre-wrap')} dir="auto">{e.text}</div></div>;
  const hst = (e, key) => { const p = String(e.text || '').split('|'); return <li key={key} className="rq-msg t-status"><div>{rqBadge(p[0])}{p.length > 1 ? <>{' '}<span dir="auto">{p.slice(1).join(' — ')}</span></> : null}</div><div className="hint"><bdi dangerouslySetInnerHTML={{ __html: dd(e.at, 1) }} />{' · '}<b>{e.by || ''}</b></div></li>; };
  const meta = [[t('rqQty'), <><bdi>{r.qty ?? '—'}</bdi>{' ' + (r.unit || '')}</>], [t('rqNeed'), r.needBy ? <bdi>{rqNeedTxt(r, 1)}</bdi> : '—'], [t('rqBudget').replace(/ \(.*\)/, ''), r.budget ? <bdi>{`AED ${fmt(+r.budget)}`}</bdi> : '—']];
  return <><div className="controls"><button className="btn" data-act="rqback">{(lang === 'ar' ? '→' : '←') + ' ' + (side === 'ceo' ? t('appr') : proc ? t(RQIN.includes(st) ? 'prq' : 'pon') : t('rmine'))}</button><span className="sp"></span>{r.urg === 'urgent' ? rqUrgB() : null}{rqBadge(st)}</div>
    <div className="rqd">
      <section className="card rqb" data-blk="summary" aria-label={t('rqB_sum')}><h3 className="rqbh">{rqI('doc')}<span>{t('rqB_sum')}</span></h3>
        <div className="hint"><bdi className="rqno">{r.no}</bdi>{' · '}<bdi dangerouslySetInnerHTML={{ __html: dd(r.date) }} />{' · '}{rqKindTag(r)}</div><h2 className="rqtitle" dir="auto">{r.title || ''}</h2>
        <div className="hint" style={css('font-size:13px')}>{t('rqBy') + ': '}<b>{r.by || ''}</b>{' · ' + nm(DEPTS, r.dept) + (r.branch ? ' · ' + nm(RQLOC, r.branch) : '') + (r.phone ? ' · ' : '')}{r.phone ? <span dir="ltr" className="rqphone">{r.phone}</span> : null}</div>
        {r.details ? <p className="rqdet" dir="auto">{r.details}</p> : null}
        <div className="rqmeta">{meta.map(([l, v], i) => <div key={i}><div className="hint">{l}</div><b>{v}</b></div>)}</div>
        {r.refs ? <div className="hint" style={css('margin-top:10px')}>{t('rqRefs') + ': '}<span dir="auto">{r.refs}</span></div> : null}
        {(r.photos || []).length ? <div style={css('margin-top:14px')}><div className="hint" style={css('margin-bottom:6px')}>{t('rqPhotos').replace(/ \(.*\)/, '')}</div><div className="rq-photos big">{r.photos.map((ph, i) => <button key={i} className="rq-ph" data-rqzoom={i}><img src={ph} alt="" /></button>)}</div></div> : null}</section>
      <section className="card rqb" data-blk="owner" aria-label={t('rqB_own')}><h3 className="rqbh">{rqI('user')}<span>{t('rqB_own')}</span></h3>
        <div className="rqown"><div><div className="hint">{t(proc && editable ? 'rqAssign' : 'rqAssigned')}</div>{proc && editable ? <input data-rqf="buyer" className={M.buyer ? 'miss' : ''} defaultValue={r.buyer || ''} aria-label={t('rqAssign')} dir="auto" /> : <b className="rqbuyer">{r.buyer ? r.buyer : <span className="hint">{t('rqNotAssigned')}</span>}</b>}</div>
          <div><div className="hint">{t('lt_status')}</div><div className="rqstat">{rqBadge(st)}{r.urg === 'urgent' ? rqUrgB() : null}</div></div></div>
        <div className="rq-steps">{steps.map((s, i) => <div key={s} className={`rq-step ${i < si ? 'past' : i === si ? 'now' : ''} ${['rejected', 'cancelled', 'later'].includes(st) ? 'off' : ''}`}><i>{i < si ? '✓' : i + 1}</i><span>{t('rs_' + (s === 'approval' && st0 === 'approved' ? 'approved' : s))}</span></div>)}</div>{why}
        {A.length ? <div className="controls rqacts">{A.map((x, i) => <Fragment key={i}>{x}</Fragment>)}</div> : null}
        {['approval', 'approved', 'ordered', 'done'].includes(st) || (r.ceo && r.ceo.decision) ? rqCeoBox(r) : null}
        {!proc && st === 'new' && can ? <div className="controls rqacts"><span className="sp"></span><button className="btn" data-rqgo="cancelled">{t('rqCancel')}</button></div> : null}
        {closeBox}</section>
      {showOpts ? <div className="card rqd-wide"><h3 className="sec">{t('rqOpts')}</h3><p className="hint" style={css('white-space:normal;margin:-6px 0 12px')}>{t('rqOptsH')}</p>
        {opts.length ? <div style={css('overflow:auto')}><table><thead><tr><th>{t('rqOptSup')}</th><th className="n">{t('rqOptPrice')}</th><th>{t('rqOptLead')}</th><th>{t('rqOptNote')}</th><th>{t('rqQuote')}</th><th>{t('rqPick')}</th><th></th></tr></thead><tbody>{opts.map((o, i) => <tr key={i} className={o.pick ? 'r-ok' : ''}>
          <td><input dir="auto" list="rqsups" data-rqopt={i} data-of="sup" className={M.opt && !String(o.sup || '').trim() ? 'miss' : ''} defaultValue={o.sup || ''} style={css('width:150px')} disabled={!editable} /></td>
          <td className="n"><input type="number" min="0" step="any" className={`num ${M.opt && !(+o.price > 0) ? 'miss' : ''}`} data-rqopt={i} data-of="price" defaultValue={o.price ?? ''} disabled={!editable} /></td>
          <td><input dir="auto" data-rqopt={i} data-of="lead" defaultValue={o.lead || ''} style={css('width:100px')} disabled={!editable} /></td>
          <td><input dir="auto" data-rqopt={i} data-of="note" defaultValue={o.note || ''} style={css('width:130px')} disabled={!editable} /></td>
          <td><div className="qfiles">{(o.files || []).map((f, j) => <span key={j} className="qfile"><button className="qf-open" data-rqqv={`${i}:${j}`} title={f.name}>{f.type === 'application/pdf' ? <b>PDF</b> : <img src={f.data || f.thumb || ''} alt="" />}<span>{f.name.length > 16 ? f.name.slice(0, 14) + '…' : f.name}</span></button>{editable ? <button className="qf-del" data-rqqdel={`${i}:${j}`}>✕</button> : null}</span>)}{editable && (o.files || []).length < 3 ? <label className="btn btn-sm qf-up">{'+ ' + t('rqUpload')}<input type="file" accept="application/pdf,image/*" data-rqqf={i} style={css('display:none')} /></label> : null}</div></td>
          <td><button className={`btn btn-ok ${o.pick ? 'done' : ''} ${M.pick ? 'miss' : ''}`} data-rqpick={i} ref={offAtStart(!editable)}>{o.pick ? '✓' : '—'}</button></td>
          <td>{editable ? <button className="btn btn-ok" data-rqoptdel={i}>✕</button> : null}</td></tr>)}</tbody></table></div> : (M.opt ? <div className="banner bn-warn" style={css('margin-bottom:8px')}>{t('rqNeedOpt')}</div> : null)}
        <datalist id="rqsups">{suppliers().map((x, i) => <option key={i} value={x.n ?? ''}></option>)}</datalist>
        {editable ? <button className="btn" data-act="rqaddopt" style={css('margin-top:10px')}>{'+ ' + t('rqAddOpt')}</button> : null}</div> : null}
      {showSpec ? <div className="card rqd-wide"><h3 className="sec">{t('rqSpec')}</h3><p className="hint" style={css('white-space:normal;margin:-6px 0 12px')}>{t('rqSpecH')}</p><div className="form">{specKeys.map(k => <div key={k} className="fld"><label>{t('sp_' + k) + (req.includes(k) ? ' ' : '')}{req.includes(k) ? <REQ_STAR /> : null}</label><input dir="auto" data-rqspec={k} className={M.spec.includes(k) ? 'miss' : ''} defaultValue={spec[k] || ''} disabled={!editable} /></div>)}
        <div className="fld" style={css('grid-column:1/-1')}><label>{t('rqSpecNotes')}</label><textarea dir="auto" data-rqspec="notes" style={css('min-height:70px')} disabled={!editable} defaultValue={spec.notes || ''}></textarea></div></div>{editable && st === 'review' ? <div className="controls" style={css('margin-top:16px;padding-top:14px;border-top:1px solid var(--fk-line)')}>{M.spec.length || M.buyer ? <span className="hint" style={css('white-space:normal;color:var(--fk-danger)')}>{t('rqFix')}</span> : null}<span className="sp"></span><button className="btn btn-accent" data-rqgo="sourcing" style={css('min-height:42px;padding:8px 18px')}>{t('ga_agreed')}</button></div> : null}</div> : null}
      <section className="card rqb" data-blk="thread" aria-label={t('rqB_thr')}><h3 className="rqbh">{rqI('chat')}<span>{t('rqB_thr')}</span></h3>
        <div className="rq-log">{thread.length ? thread.map((e, i) => msg(e, i)) : <div className="hint">{t('rqNoThread')}</div>}</div>
        {can && !['cancelled'].includes(st) ? <div className="rqcomp">{proc && side !== 'ceo' ? <label className="rqlt"><span className="hint">{t('rqType')}</span><select id="rqlt">{['msg', 'call', 'meet', 'note'].map(k => <option key={k} value={k}>{t('lt_' + k)}</option>)}</select></label> : null}
          <textarea id="rqtext" dir="auto" placeholder={t('rqMsgPh')} aria-label={t('rqMsgPh')}></textarea>
          <div className="rqcomp-a">{side !== 'dept' ? <><button className="btn rqmailb" data-act="rqmail" title={t('rqMailH')}>{rqI('mail')}<span>{t('rqMail')}</span></button><span className="hint rqmailh">{t('rqMailHs')}</span></> : null}<span className="sp"></span><button className="btn btn-primary" data-act="rqlog">{rqI('note')}<span>{proc ? t('rqAddNote') : t('rqSendMsg')}</span></button></div></div> : null}</section>
      <section className="card rqb" data-blk="history" aria-label={t('rqB_hist')}><h3 className="rqbh">{rqI('list')}<span>{t('rqB_hist')}</span></h3>
        {hist.length ? <ol className="rqhist">{hist.map((e, i) => hst(e, i))}</ol> : <div className="hint">{t('rqNoHist')}</div>}</section>
    </div></>;
}

export function rqViewFile(f) {
  const d = document.createElement('div'); d.className = 'rq-zoom';
  if (f.url && !f.data) { const d2 = document.createElement('a'); d2.href = f.url; d2.target = '_blank'; d2.rel = 'noopener'; d2.click(); return; }
  if (f.type === 'application/pdf') {
    let url = f.data; try { const b = atob(f.data.split(',')[1]); const u = new Uint8Array(b.length); for (let k = 0; k < b.length; k++) u[k] = b.charCodeAt(k); url = URL.createObjectURL(new Blob([u], { type: 'application/pdf' })); } catch (_) { }
    // The original used a native onclick="event.stopPropagation()". React listens on its root (this same element d), where
    // stopping the event would not stop d.onclick, so the native handler is set on the element itself.
    paint(d, <div className="qf-view" ref={el => { if (el) el.onclick = ev => ev.stopPropagation(); }}><div className="controls" style={css('padding:10px 14px;border-bottom:1px solid var(--fk-line)')}><b>{f.name}</b><span className="sp"></span><a className="btn btn-sm" href={url} target="_blank" rel="noopener">{t('rqOpenTab')}</a><button className="btn btn-sm" data-close="1">✕</button></div><iframe src={url} title={f.name}></iframe></div>);
    (d.querySelector('[data-close]') as HTMLElement).onclick = () => d.remove();
  }
  else paint(d, <><img src={f.data} alt="" /><button className="btn">✕</button></>);
  d.onclick = () => d.remove(); document.body.appendChild(d);
}

export function rqCeoBox(r) {
  const o = (r.opts || []).find(x => x.pick); const tot = o && +o.price > 0 && +r.qty > 0 ? (+o.price) * (+r.qty) : null; const c = r.ceo || {};
  return <div className="ceo-box"><div><div className="hint">{t('rqChosen')}</div><b>{o ? (o.sup || '—') : '—'}</b>{(o && o.price ? ` · AED ${fmt(+o.price, 2)}` : '') + (o && o.lead ? ` · ${o.lead}` : '')}</div>
    {tot ? <div><div className="hint">{t('rqTotal')}</div><b>{`AED ${fmt(tot, 2)}`}</b></div> : null}
    <div><div className="hint">{t('ceoSays')}</div>{r.status === 'approval' ? <><span className="badge b-warn">{t('rs_approval')}</span>{' '}<span className="hint" dangerouslySetInnerHTML={{ __html: `${t('rqWaitSince')} ${dd(r.sentCeoAt)}` }} /></>
      : c.decision === 'approved' ? <><span className="badge b-ok">{t('rqApproved')}</span>{' '}<span className="hint" dangerouslySetInnerHTML={{ __html: `${esc(c.by || '')} · ${dd(c.at)}` }} /></>
        : c.decision === 'returned' ? <><span className="badge b-bad">{t('ap_back')}</span>{' '}<span className="hint" dangerouslySetInnerHTML={{ __html: dd(c.at) }} />{c.note ? <div style={css('margin-top:4px')}>{c.note}</div> : null}</> : '—'}</div></div>;
}
