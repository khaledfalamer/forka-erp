/* Procurement: the Fill / inventory screen (stock table, cells, summary, column menu, item drawer). */
import {
  t, lang, fmt, fill, U, CON, IVI, IV_COLS, IV_PIN, SHEET, CFG, pinNeeded, pin, me, fl, invEdit, invOpen, ivMenu, ivNaming,
  keepKey, keepIds, rowRank, rowRankKey, invHK, invWin, smOf, cycOf, ropOf, stockState, calc, missing, status, ivColName,
  ivCols, ivCard, ivRange, ivPad, ivViews, ivCurView, ivConvTxt, nUnsaved, leadOf, stockVal, suppliers, line, lines, esc, __set,
} from '../core';
import { css, svg } from '../ui';
import { uSel, banner } from './shell';

/* The same element core's ivB() writes as text: <bdi class="ivn">fmt(n,d)</bdi>. */
const ivBx = (n, d?) => <bdi className="ivn">{fmt(n, d)}</bdi>;

export const ivI = k => svg(`<svg class="ivi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IVI[k]}</svg>`);

export const ivNum = (l, f, miss) => <input className={`num ${miss ? 'miss' : ''}`} type="number" min="0" step="any" inputMode="decimal" data-id={l.id} data-f={f} defaultValue={l[f] == null ? '' : l[f]} placeholder={miss ? '—' : ''} aria-label={ivColName(f === 'st' ? 'stock' : f === 'p' ? 'p' : f)} />;

export function ivRopHtml(l) {
  return smOf(l) ? <span className="badge b-pemo">{smOf(l) === 'direct' ? t('smDirect') : fill(t('smCycleB'), { n: cycOf(l) })}</span>
    : (+l.use > 0 || +l.par > 0) ? <><div className="ivrop">{ivBx(ropOf(l), ropOf(l) % 1 ? 1 : 0)}</div>{(k => k ? <span className={`badge ${k === 'ok' ? 'b-ok' : k === 'order' ? 'b-warn' : 'b-bad'}`}>{t(k === 'ok' ? 'sOk' : k === 'order' ? 'sOrder' : 'sBelow')}</span> : null)(stockState(l))}</>
    : null;
}

export function ivStatusHtml(l, s, m) {
  return <>
    {s === 'missing' ? <span className="badge b-bad ivneed">{`${t('needs')}: ${m.map(x => t('m_' + (x === 'price' ? 'price' : x))).join(', ')}`}</span>
      : <button className={`btn btn-ok ${l.ok ? 'done' : ''}`} data-act="ok" data-id={l.id}>{l.ok ? '✓ ' + t(s === 'notneeded' ? 'notneeded' : 'done') : t('confirm')}</button>}
    {l.who ? <div className="who">{`${l.who} · ${new Date(l.at).toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'short' })}`}</div> : null}
  </>;
}

export function ivSmHtml(l) {
  return <div className="smrow"><select className="smsel" data-id={l.id} data-f="sm" title={t('smT')} aria-label={t('smT')} defaultValue={smOf(l)}><option value="">{t('smStore')}</option><option value="direct">{t('smDirect')}</option><option value="cycle">{t('smCycle')}</option></select>{smOf(l) === 'cycle' ? <><input className="num cyc" type="number" min="1" step="1" data-id={l.id} data-f="cyc" defaultValue={cycOf(l)} title={t('smDays')} aria-label={t('smDays')} /><span className="hint">{t('smDays')}</span></> : null}</div>;
}

export function ivPayHtml(l, m) {
  return <select className={m.includes('pay') ? 'miss' : ''} data-id={l.id} data-f="pay" aria-label={t('payment')} defaultValue={l.pay === 'pemo' || l.pay === 'credit' ? l.pay : ''}><option value="">{t('choose')}</option><option value="pemo">{t('pemoW')}</option><option value="credit">{t('creditW')}</option></select>;
}

export function ivPackHtml(l, m) {
  return <div className="ivpk"><input className={`num pkn ${m.includes('pack') && !(+l.pkN > 0) ? 'miss' : ''}`} type="number" min="0" step="any" inputMode="decimal" data-id={l.id} data-f="pkN" defaultValue={l.pkN == null ? '' : l.pkN} placeholder="#" aria-label={t('pack')} />{uSel(l, 'pkU', m.includes('pack') && !l.pkU)}</div>;
}

export function ivCell(k, l, m, s, c) {
  const ref = l.ref, id = l.id, sm = smOf(l);
  switch (k) {
    case 'item': return <td key={k} className="item pin1" data-k="item">{invEdit ? <button className="rmx" data-act="rmitem" data-id={id} title={t('rmItem')} aria-label={t('rmItem')}>✕</button> : null}{l.isNew
      ? <><input dir="auto" className={m.includes('name') ? 'miss' : ''} data-id={id} data-f="n" defaultValue={String(l.n ?? '')} placeholder={t('newItem')} /><div style={css('display:flex;gap:4px;margin-top:4px')}><select data-id={id} data-f="con" defaultValue={l.con}>{Object.keys(CON).map(x => <option key={x} value={x}>{CON[x][lang]}</option>)}</select><select data-id={id} data-f="cat" defaultValue={l.cat}><option value="Food">{t('food')}</option><option value="Non-food">{t('nonfood')}</option></select></div></>
      : <><span className="ivname">{String(l.n ?? '')}</span><small>{`${CON[l.con] ? CON[l.con][lang] : String(l.con ?? '')} · ${l.cat === 'Food' ? t('food') : t('nonfood')} · `}<bdi>{id}</bdi></small></>}<button className="ivopen" data-act="invopen" data-id={id} title={t('ivOpen')} aria-label={t('ivOpen')}>{ivI('open')}</button></td>;
    case 'stock': return <td key={k} className="n pin2 ed cm" data-k="stock" data-lbl={t('stock')}>{sm === 'direct' ? <span className="hint">{t('smDirectS')}</span> : <>{ivNum(l, 'st', false)}{!sm && +l.use > 0 ? <div className="hint">{ivBx((+l.st || 0) / (+l.use / 30), 0)}{' ' + t('daysLeft')}</div> : null}</>}</td>;
    case 'sup': return <td key={k} className="ed" data-k="sup"><input dir="auto" className={`sup ${m.includes('sup') ? 'miss' : ''}`} list="sups" data-id={id} data-f="sup" defaultValue={String(l.sup ?? '')} placeholder={m.includes('sup') ? t('m_sup') : ''} aria-label={t('supplier')} /></td>;
    case 'sm': return <td key={k} className="ed" data-k="sm">{ivSmHtml(l)}</td>;
    case 'pay': return <td key={k} className="ed" data-k="pay">{ivPayHtml(l, m)}</td>;
    case 'use': return <td key={k} className="n ed" data-k="use">{ivNum(l, 'use', m.includes('use'))}{sm === 'cycle' && +l.use > 0 ? <div className="hint">{fill(t('perOrder'), { q: fmt(+l.use / 30 * cycOf(l), (+l.use / 30 * cycOf(l)) % 1 ? 1 : 0), u: U(l.u || '') })}</div> : null}{ref && ref.q ? <div className="hint">{t('storeRef') + ': '}{ivBx(ref.q, ref.q % 1 ? 1 : 0)}</div> : null}</td>;
    case 'par': return <td key={k} className={`n ${sm ? '' : 'ed'}`} data-k="par">{sm ? <span className="hint">-</span> : ivNum(l, 'par', m.includes('par'))}</td>;
    case 'rop': return <td key={k} className="n cm" data-k="rop" data-lbl={t('rop')}>{ivRopHtml(l)}</td>;
    case 'buy': return <td key={k} className="n cm" data-k="buy" data-lbl={t('buy')}><b>{c.q ? ivBx(c.q, c.q % 1 ? 2 : 0) : null}</b></td>;
    case 'p': return <td key={k} className="n ed" data-k="p">{ivNum(l, 'p', m.includes('price'))}{ref && ref.p > 0 ? <div className="hint">{t('storeRef') + ': '}{ivBx(ref.p, 2)}{m.includes('price') ? <>{' · '}<button data-act="useprice" data-id={id} data-v={ref.p}>{t('use_')}</button></> : null}</div> : null}</td>;
    case 'unit': return <td key={k} className="ed" data-k="unit">{uSel(l, 'u', m.includes('unit'))}{ref && ref.u ? <div className="hint">{`${t('storeRef')}: ${ref.u}`}</div> : null}</td>;
    case 'pack': return <td key={k} className="ed" data-k="pack">{ivPackHtml(l, m)}{ivConvTxt(l) ? <div className="hint" dangerouslySetInnerHTML={{ __html: ivConvTxt(l) }} /> : null}</td>;
    case 'bud': return <td key={k} className="n" data-k="bud"><b>{c.v ? ivBx(c.v) : null}</b></td>;
    case 'status': return <td key={k} className="cm ivst" data-k="status">{ivStatusHtml(l, s, m)}</td>;
  }
}

export function ivRow(l) {
  const m = missing(l), s = status(l), c = calc(l);
  return <tr key={l.id} className={`${s === 'missing' ? 'r-miss' : s === 'confirmed' ? 'r-ok' : ''}${invOpen === l.id ? ' ivsel' : ''}`} data-inv={l.id}>{ivCols().map(k => ivCell(k, l, m, s, c))}</tr>;
}

export function ivSummary(L) {
  let tot = 0, pe = 0, cr = 0, np = 0, ro = 0, dn = 0;
  L.forEach(l => { const v = calc(l).v; tot += v; if (l.pay === 'pemo') pe += v; else if (l.pay === 'credit') cr += v; else np += v; if (['order', 'below'].includes(stockState(l))) ro++; const s = status(l); if (s === 'confirmed' || s === 'notneeded') dn++; });
  const n = L.length;
  return <div className="ivsum">
    <div className="card stat"><div className="lbl">{t('budget')}</div><div className="num">{ivBx(tot)}<small>AED</small></div><div className="hint ivwrap" dangerouslySetInnerHTML={{ __html: fill(t('ivPay'), { a: fmt(pe), b: fmt(cr), c: `<span style="color:${np ? 'var(--fk-danger)' : 'inherit'}">${fmt(np)}</span>` }) }} /></div>
    <div className="card stat" id="stval"><div className="lbl">{t('stVal')}</div><div className="num">{ivBx(stockVal(L).v)}<small>AED</small></div><div className="hint">{t('stValH')}</div></div>
    <button className={`card stat ivsumb ${fl.stk === 'order' ? 'on' : ''}`} data-act="ivreorder"><div className="lbl">{t('ivReorder')}</div><div className="num" style={css(`color:${ro ? 'var(--fk-danger)' : 'inherit'}`)}>{ivBx(ro)}</div><div className="hint">{t('ivReorderH')}</div></button>
    <div className="card stat"><div className="lbl">{t('ivDone')}</div><div className="num">{ivBx(dn)}<small>{'/ '}<bdi>{fmt(n)}</bdi></small></div><div className="prog" style={css('margin:8px 0 0')}><i style={css(`width:${n ? dn / n * 100 : 0}%;background:var(--fk-success)`)}></i></div></div></div>;
}

export function ivColMenu() {
  const on = ivCols();
  return <div className="ivmenu" role="menu">{IV_COLS.map(k => <label key={k} className="ivmi"><input type="checkbox" data-ivcol={k} defaultChecked={!!on.includes(k)} disabled={IV_PIN.includes(k)} /><span>{ivColName(k)}</span>{IV_PIN.includes(k) ? <small>{t('ivPinned')}</small> : null}</label>)}</div>;
}

export function ivDrawer(l) {
  const m = missing(l), s = status(l), c = calc(l), ref = l.ref, id = l.id, sm = smOf(l);
  const F = (lbl, body, cls?) => <div className={`ivf ${cls || ''}`}><span className="ivl">{lbl}</span><div className="ivv">{body}</div></div>;
  const nU = nUnsaved();
  return <aside className={`invdr ${invEdit ? 'editing' : ''}`} role="dialog" aria-label={`${t('ivDetails')}: ${l.n || t('newItem')}`} data-dr={id}>
    <div className="ivdh"><div style={css('min-width:0')}><div className="ivdk">{`${CON[l.con] ? CON[l.con][lang] : String(l.con ?? '')} · ${l.cat === 'Food' ? t('food') : t('nonfood')} · `}<bdi>{id}</bdi></div><h2>{String(l.n ?? '') || t('ivNameT')}</h2></div><button className="ivx" data-act="invclose" title={t('ivClose')} aria-label={t('ivClose')}>{ivI('x')}</button></div>
    <div className="ivdb">
      <section className="ivph"><h3>{t('ivPhoto')}</h3>{l.img ? <img className="ivimg" src={l.img} alt={String(l.n ?? '')} /> : <div className="ivimg none">{t('ivNoPhoto')}</div>}
        {invEdit ? <div className="ivphb"><label className="btn btn-sm">{l.img ? t('ivChangePhoto') : t('ivAddPhoto')}<input type="file" accept="image/*" data-ivphoto={id} hidden /></label>{l.img ? <button className="btn btn-sm" data-act="ivphrm" data-id={id}>{t('ivRemovePhoto')}</button> : null}</div> : <div className="hint">{t('ivPhotoEdit')}</div>}</section>
      {l.isNew ? <section><h3>{t('ivNameT')}</h3>{F(t('item'), <input dir="auto" className={m.includes('name') ? 'miss' : ''} data-id={id} data-f="n" defaultValue={String(l.n ?? '')} placeholder={t('newItem')} />)}{F(t('concept'), <select data-id={id} data-f="con" defaultValue={l.con}>{Object.keys(CON).map(x => <option key={x} value={x}>{CON[x][lang]}</option>)}</select>)}{F(t('food') + ' / ' + t('nonfood'), <select data-id={id} data-f="cat" defaultValue={l.cat}><option value="Food">{t('food')}</option><option value="Non-food">{t('nonfood')}</option></select>)}</section> : null}
      <section><h3>{t('ivNowT')}</h3>
        {F(t('stock'), sm === 'direct' ? <span className="hint">{t('smDirectS')}</span> : ivNum(l, 'st', false))}
        {!sm && +l.use > 0 ? F(t('ivDaysLeft'), <><b>{ivBx((+l.st || 0) / (+l.use / 30), 0)}</b>{' ' + t('daysLeft')}</>, 'ro') : null}
        {F(<>{t('rop')}{' '}<span className="hint">{`(${t('auto')})`}</span></>, ivRopHtml(l) || <span className="hint">—</span>, 'ro')}
        {F(t('buy'), <><b>{c.q ? ivBx(c.q, c.q % 1 ? 2 : 0) : '0'}</b>{' ' + U(l.u || '')}</>, 'ro')}
        {F(t('bud'), <b>{ivBx(c.v, c.v % 1 ? 2 : 0)}</b>, 'ro')}</section>
      <section><h3>{t('ivUsage')}</h3>
        {F(t('use'), <>{ivNum(l, 'use', m.includes('use'))}{+l.use > 0 ? <div className="hint" dangerouslySetInnerHTML={{ __html: fill(t('ivPerDay'), { q: `<bdi>${fmt(+l.use / 30, (+l.use / 30) % 1 ? 1 : 0)}</bdi>`, u: esc(U(l.u || '')) }) }} /> : null}{sm === 'cycle' && +l.use > 0 ? <div className="hint">{fill(t('perOrder'), { q: fmt(+l.use / 30 * cycOf(l), (+l.use / 30 * cycOf(l)) % 1 ? 1 : 0), u: U(l.u || '') })}</div> : null}{ref && ref.q ? <div className="hint">{t('storeRef') + ': '}{ivBx(ref.q, ref.q % 1 ? 1 : 0)}</div> : null}</>)}
        {F(t('par'), sm ? <span className="hint">-</span> : ivNum(l, 'par', m.includes('par')))}</section>
      <section><h3>{t('ivConv')}</h3>
        {F(t('unit'), <>{uSel(l, 'u', m.includes('unit'))}{ref && ref.u ? <div className="hint">{`${t('storeRef')}: ${ref.u}`}</div> : null}</>)}
        {F(t('pack'), ivPackHtml(l, m))}
        {ivConvTxt(l) ? <div className="ivconv" dangerouslySetInnerHTML={{ __html: ivConvTxt(l) }} /> : <div className="ivconv"><span className="hint">{t('ivNoConv')}</span></div>}</section>
      <section><h3>{t('ivSupply')}</h3>
        {F(t('supplier'), <><input dir="auto" className={`sup ${m.includes('sup') ? 'miss' : ''}`} list="sups" data-id={id} data-f="sup" defaultValue={String(l.sup ?? '')} placeholder={m.includes('sup') ? t('m_sup') : ''} />{l.sup ? <div className="hint">{fill(t('ivLead'), { n: leadOf(l.sup) })}</div> : null}</>)}
        {F(t('ivSm'), ivSmHtml(l))}
        {F(t('payment'), ivPayHtml(l, m))}</section>
      <section><h3>{t('ivPrice')}</h3>
        {F(t('price'), <>{ivNum(l, 'p', m.includes('price'))}{ref && ref.p > 0 ? <div className="hint">{t('storeRef') + ': '}{ivBx(ref.p, 2)}{m.includes('price') ? <>{' · '}<button data-act="useprice" data-id={id} data-v={ref.p}>{t('use_')}</button></> : null}</div> : null}</>)}</section>
      <section><h3>{t('status')}</h3><div className="ivst">{ivStatusHtml(l, s, m)}</div></section>
    </div>
    <div className="ivdf">{nU ? <span className="st st-chg"><span>{ivBx(nU)}{' ' + t('unsaved')}</span></span> : <span className="st st-muted">{ivI('check')}<span>{t('allSaved')}</span></span>}<span className="sp"></span>{invEdit ? <button className="btn btn-accent" data-act="invsave">{`${t('saveS')}${nU ? ' (' + nU + ')' : ''}`}</button> : null}<button className="btn" data-act="invclose">{t('ivClose')}</button></div></aside>;
}

export function vFill() {
  const L = lines(); const sups = [...new Set(L.map(l => l.sup).filter(Boolean))].sort();
  const fk = JSON.stringify(fl); if (fk !== keepKey) { __set('keepKey', fk); __set('keepIds', null); }
  let R = L; const q = fl.q.toLowerCase();
  if (q) R = R.filter(l => (l.n || '').toLowerCase().includes(q) || (l.sup || '').toLowerCase().includes(q) || l.id.toLowerCase().includes(q));
  if (fl.st !== 'all') R = R.filter(l => status(l) === fl.st);
  if (fl.con) R = R.filter(l => l.con === fl.con); if (fl.sup) R = R.filter(l => l.sup === fl.sup); if (fl.pay) R = R.filter(l => (l.pay || 'none') === fl.pay); if (fl.stk) R = R.filter(l => fl.stk === 'order' ? ['order', 'below'].includes(stockState(l)) : stockState(l) === fl.stk);
  if (keepIds) { const inR = new Set(R.map(l => l.id)); L.forEach(l => { if (keepIds.has(l.id) && !inR.has(l.id)) R.push(l); }); } __set('keepIds', new Set(R.map(l => l.id)));
  if (!rowRank || rowRankKey !== fk) { __set('rowRankKey', fk); const rk = {}; __set('rowRank', rk); [...R].sort((a, b) => (a.con > b.con ? 1 : a.con < b.con ? -1 : 0) || ((a.sup || '~') > (b.sup || '~') ? 1 : (a.sup || '~') < (b.sup || '~') ? -1 : 0) || (a.n > b.n ? 1 : a.n < b.n ? -1 : 0) || (a.id > b.id ? 1 : -1)).forEach((l, k) => rk[l.id] = k); }
  const rr = l => rowRank[l.id] ?? -1; R.sort((a, b) => rr(a) - rr(b) || (b.id > a.id ? 1 : -1));
  // windowing: draw only the rows around the visible part of the table box
  const cols = ivCols(), hk = [lang, invEdit ? 1 : 0, ivCard() ? 1 : 0, cols.join(',')].join('|'); if (hk !== invHK) { __set('invHK', hk); __set('invH', {}); __set('invAvg', 0); }
  __set('invR', R); const ow = document.querySelector('#page .tbl-wrap.inv'); __set('invWin', ivRange(ow ? ow.scrollTop : 0, ow ? ow.clientHeight : Math.max(400, innerHeight - 200)));
  const [pt, pb] = ivPad(invWin.a, invWin.b), shown = R.slice(invWin.a, invWin.b);
  const nU = nUnsaved(), vw = ivViews(), cv = ivCurView();
  if (invOpen && (!L.some(l => l.id === invOpen))) __set('invOpen', null);
  return <>
    {SHEET ? null : <div className="card"><div className="controls"><label htmlFor="me">{t('name')}</label><input id="me" defaultValue={me} placeholder={t('namePh')} style={css(`min-width:220px;${me ? '' : 'border-color:var(--fk-danger);background:var(--fk-danger-bg)'}`)} />{SHEET && (CFG.PIN === true || pinNeeded || pin) ? <><label htmlFor="pin">{t('pin')}</label><input id="pin" type="password" defaultValue={pin} style={css(`width:110px;${pin ? '' : 'border-color:var(--fk-danger);background:var(--fk-danger-bg)'}`)} /></> : null}<span className="sp"></span><span style={css('color:var(--fk-muted);font-size:12px')}>{t('basis')}</span></div></div>}
    {banner()}
    <div className={`ivbar ${invEdit ? 'editing' : ''}`}><h2>{t('fill')}</h2><span className="ivcount" dangerouslySetInnerHTML={{ __html: fill(t('ivCount'), { n: `<bdi>${fmt(R.length)}</bdi>` }) }} />
      <span className="ivsave">{nU ? <span className="st st-chg"><span>{ivBx(nU)}{' ' + t('unsaved')}</span></span> : <span className="st st-muted">{ivI('check')}<span>{t('allSaved')}</span></span>}{invEdit ? <span className="ivmode">{t('ivEditing')}</span> : null}</span>
      <span className="sp"></span>
      <div className="ivacts"><div className="ivmw"><button className="btn" data-act="ivcols" aria-haspopup="true" aria-expanded={ivMenu ? 'true' : 'false'}>{ivI('cols')}{' ' + t('ivCols')}</button>{ivMenu ? ivColMenu() : null}</div>
        {invEdit ? <><button className="btn btn-primary" data-act="add">{`+ ${t('add')}`}</button><button className="btn" data-act="invcancel">{t('cancelS')}</button><button className="btn btn-accent" data-act="invsave">{`${t('saveS')}${nU ? ' (' + nU + ')' : ''}`}</button></>
          : <button className="btn btn-accent" data-act="invedit">{t('editInv')}</button>}</div></div>
    {invEdit ? null : <p className="hint ivlock">{t('editInvH')}</p>}
    {ivSummary(L)}
    <div className="controls ivfil"><input id="q" type="search" placeholder={t('search')} defaultValue={fl.q} aria-label={t('search')} />
      <div className="chips">{['all', 'missing', 'toconfirm', 'confirmed', 'notneeded'].map(k => <button key={k} className={`chip ${fl.st === k ? 'on' : ''}`} data-st={k}>{t(k)}</button>)}</div>
      <select id="fcon" aria-label={t('concept')} defaultValue={fl.con}><option value="">{`${t('concept')}: ${t('all')}`}</option>{Object.keys(CON).map(k => <option key={k} value={k}>{CON[k][lang]}</option>)}</select>
      <select id="fsup" aria-label={t('supplier')} defaultValue={fl.sup}><option value="">{`${t('supplier')}: ${t('all')}`}</option>{sups.map(s => <option key={s}>{s}</option>)}</select>
      <select id="fpay" aria-label={t('payment')} defaultValue={fl.pay}><option value="">{`${t('payment')}: ${t('all')}`}</option><option value="pemo">{t('pemoW')}</option><option value="credit">{t('creditW')}</option><option value="none">{t('nopay')}</option></select>
      <select id="fstk" aria-label={t('stockF')} defaultValue={fl.stk}><option value="">{`${t('stockF')}: ${t('all')}`}</option><option value="order">{t('sOrder')}</option><option value="below">{t('sBelow')}</option><option value="ok">{t('sOk')}</option></select>
      <span className="ivviews">{ivI('view')}<select id="ivview" aria-label={t('ivViews')} defaultValue={cv >= 0 ? String(cv) : ''}><option value="">{`${t('ivViewPick')}${vw.length ? ' (' + vw.length + ')' : ''}`}</option>{vw.map((v, i) => <option key={i} value={`${i}`}>{v.name}</option>)}</select>{' '}
        {ivNaming ? <><input id="ivvname" maxLength={40} placeholder={t('ivViewName')} aria-label={t('ivViewName')} /><button className="btn btn-sm btn-accent" data-act="ivviewok">{t('ivViewOk')}</button><button className="btn btn-sm" data-act="ivviewno">{t('ivViewNo')}</button></>
          : <><button className="btn btn-sm" data-act="ivsaveview">{t('ivSaveView')}</button>{cv >= 0 ? <button className="btn btn-sm ivdel" data-act="ivdelview" title={t('ivDelView')} aria-label={t('ivDelView')}>{ivI('trash')}</button> : null}</>}</span></div>
    <datalist id="sups">{[...new Set([...sups, ...suppliers().map(x => x.n).filter(Boolean)])].sort().map(s => <option key={s} value={s} />)}</datalist>
    <div className={`tbl-wrap inv ${invEdit ? 'editing' : ''}`}><table style={css(`margin-top:${pt}px;margin-bottom:${pb}px`)}><thead><tr>{cols.map(k => <th key={k} className={`${['stock', 'use', 'par', 'rop', 'p', 'buy', 'bud'].includes(k) ? 'n ' : ''}${k === 'item' ? 'pin1' : k === 'stock' ? 'pin2' : ''}`} data-k={k}>{ivColName(k)}{k === 'rop' ? <>{' '}<span style={css('font-weight:400;color:var(--fk-muted)')}>{`(${t('auto')})`}</span></> : null}</th>)}</tr></thead><tbody>
      {shown.length ? shown.map(ivRow) : <tr><td colSpan={cols.length} className="empty">—</td></tr>}
    </tbody></table></div><p style={css('color:var(--fk-muted);font-size:12px;margin:0')}>{`${t('notes')} ${t('ropNote')}`}</p>
    {invOpen ? ivDrawer(line(invOpen)) : null}
  </>;
}
