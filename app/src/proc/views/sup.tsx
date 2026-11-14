/* Procurement screens: summary, suppliers, analysis (ABC, suppliers, scorecards, OTIF). Copied from the original page. */
import {
  lines, calc, stockVal, t, fmt, CON, lang, isOwner, SHEET, mode, suppliers, sq, fl, supRank, supRankKey, missingS, CATS,
  emi, OMAN, EMIRATES, paySched, DAYS, U, anaTab, abc, stockState, pct, abcF, recs, supScore, band, grnOtif, evalOpen,
  evalScore, CRIT, dd, rec, me, delivOpen, otif, __set,
} from '../core';
import { css, Fragment } from '../ui';
import { banner, head } from './shell';
import { vGRN } from './recv';

const REQ = () => <span style={css('color:var(--fk-danger)')}>*</span>;

export function vSum() {
  const L = lines(); const by = {}, bc = {};
  L.forEach(l => { const v = calc(l).v; if (!v) return; const k = l.sup || '—'; by[k] = by[k] || { v: 0, n: 0, pay: new Set() }; by[k].v += v; by[k].n++; by[k].pay.add(l.pay || ''); bc[l.con] = (bc[l.con] || 0) + v });
  const S = Object.entries(by).sort((a: any, b: any) => b[1].v - a[1].v) as any[], mx = S[0] ? S[0][1].v : 1;
  const sv = stockVal(L), catN = k => k === 'Food' ? t('food') : k === 'Non-food' ? t('nonfood') : k;
  const svCard = <div className="card" id="stcard"><h2>{`${t('stVal')}: AED ${fmt(sv.v)}`}</h2><p style={css('color:var(--fk-muted);font-size:12px;margin:2px 0 10px')}>{t('stValH')}{sv.noP ? <>{' · '}<span style={css('color:var(--fk-danger)')}>{`${sv.noP} ${t('stNoPrice')}`}</span></> : null}{sv.notC ? <>{' · '}<span style={css('color:var(--fk-warning)')}>{`${sv.notC} ${t('stNotCounted')}`}</span></> : null}</p>
    <div className="grid" style={css('grid-template-columns:repeat(auto-fit,minmax(240px,1fr))')}>
      <div><b style={css('font-size:13px')}>{t('byCon')}</b><div className="list">{(Object.entries(sv.bc) as any[]).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div className="li" key={k}><div className="grow">{CON[k] ? CON[k][lang] : k}</div><b>{`AED ${fmt(v)}`}</b></div>)}</div></div>
      <div><b style={css('font-size:13px')}>{t('byType')}</b><div className="list">{(Object.entries(sv.bk) as any[]).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div className="li" key={k}><div className="grow">{catN(k)}</div><b>{`AED ${fmt(v)}`}</b></div>)}</div></div>
      <div><b style={css('font-size:13px')}>{t('topStock')}</b><div className="list">{sv.items.slice(0, 8).map(([l, v], i) => <div className="li" key={i}><div className="grow">{l.n}<small style={css('display:block;color:var(--fk-muted)')}>{`${fmt(+l.st)} ${l.u || ''} x ${fmt(+l.p)}`}</small></div><b>{fmt(v)}</b></div>)}</div></div>
    </div></div>;
  return <>{banner()}{head(L)}{svCard}<div className="grid two">
    <div className="card"><h2>{t('bySup')}</h2><div className="list">{S.map(([k, o]) => <div className="li" key={k}><div className="grow">{`${k} `}{o.pay.has('pemo') ? <span className="badge b-pemo">Pemo</span> : null}{o.pay.has('') ? <>{' '}<span className="badge b-bad">{t('nopay')}</span></> : null}<div className="bar"><i style={css(`width:${o.v / mx * 100}%`)}></i></div></div><span style={css('color:var(--fk-muted);font-size:12px')}>{o.n}</span><b>{fmt(o.v)}</b></div>)}</div></div>
    <div style={css('display:flex;flex-direction:column;gap:14px')}><div className="card"><h2>{t('byCon')}</h2><div className="list">{(Object.entries(bc) as any[]).map(([k, v]) => <div className="li" key={k}><div className="grow">{CON[k] ? CON[k][lang] : k}</div><b>{`AED ${fmt(v)}`}</b></div>)}</div>
      <div style={css('margin-top:12px')}><button className="btn btn-accent" data-act="csv">{t('copyCsv')}</button></div></div>
      {(isOwner || SHEET) && mode === 'live' ? <div className="card"><h2>{t('importT')}</h2><p style={css('color:var(--fk-text-2);font-size:13px;margin:0 0 8px')}>{t('importH')}</p><textarea id="imp"></textarea><div style={css('margin-top:8px')}><button className="btn btn-primary" data-act="import">{t('imp')}</button></div></div> : null}</div></div></>;
}

export function vSupList() {
  const L = lines(), S = suppliers(); const st = {}; L.forEach(l => { if (!l.sup) return; const k = l.sup.trim().toUpperCase(); st[k] = st[k] || { n: 0, v: 0 }; st[k].n++; st[k].v += calc(l).v });
  let R = S; if (sq) { const q = sq.toLowerCase(); R = R.filter(x => (x.n || '').toLowerCase().includes(q) || (x.contact || '').toLowerCase().includes(q)) }
  if (fl.cat) R = R.filter(x => (x.cats || []).includes(fl.cat));
  if (!supRank || supRankKey !== sq) { __set('supRankKey', sq); const r = {}; __set('supRank', r); [...S].sort((a, b) => ((st[(b.n || '').toUpperCase()] || { v: 0 }).v - (st[(a.n || '').toUpperCase()] || { v: 0 }).v) || ((a.n || '') > (b.n || '') ? 1 : -1)).forEach((x, i) => r[x.id] = i) }
  const rk = x => supRank[x.id] ?? -1; R.sort((a, b) => rk(a) - rk(b) || (b.id > a.id ? 1 : -1));
  const nm = S.filter(x => missingS(x).length).length;
  return <>{banner()}<div className="card"><div className="controls"><input id="sq" placeholder={t('supSearch')} defaultValue={sq} style={css('min-width:240px')} />
    <select id="fcat" defaultValue={fl.cat}><option value="">{`${t('supplies')}: ${t('all')}`}</option>{CATS.map(c => <option key={c[0]} value={c[0]}>{lang === 'ar' ? c[2] : c[1]}</option>)}</select>
    <span className={`badge ${nm ? 'b-bad' : 'b-ok'}`}>{`${nm} ${t('supMissing')}`}</span><span className="sp"></span><button className="btn btn-primary" data-act="addsup">{`+ ${t('addSup')}`}</button></div>
    <p style={css('color:var(--fk-muted);font-size:12px;margin:8px 0 0')}>{t('supHint2')}</p></div>
    <div className="tbl-wrap"><table><thead><tr><th>{t('supplier')}</th><th>{t('supplies')}</th><th>{t('terms')}</th><th>{t('phone')}</th><th>{t('emirate')}</th><th className="n">{t('items')}</th><th className="n">{t('monthly')}</th><th>{t('status')}</th></tr></thead><tbody>
      {R.length ? R.map(x => {
        const m = missingS(x), c = st[(x.n || '').toUpperCase()] || { n: 0, v: 0 }; return <tr key={x.id} className={`${m.length ? 'r-miss' : 'r-ok'} sup-row`} data-open={x.id} style={css('cursor:pointer')}>
          <td className="item">{x.n || <span style={css('color:var(--fk-danger)')}>{t('newSup')}</span>}{x.contact ? <small>{x.contact}</small> : null}</td>
          <td style={css('max-width:260px;white-space:normal')}>{(x.cats || []).map((k, i) => { const c = CATS.find(z => z[0] === k); return <span key={i} className="badge b-pemo" style={css('margin:1px')}>{c ? (lang === 'ar' ? c[2] : c[1]) : k}</span> })}</td>
          <td>{x.terms ? (x.terms === 'credit' ? t('creditW') + (x.days ? ` · ${x.days} ${t('dayW')}` : '') : x.terms === 'pemo' ? t('pemoW') : t('cash')) : ''}</td>
          <td dir="ltr">{x.phone}</td><td>{emi(x.emirate)}</td>
          <td className="n">{c.n || ''}</td><td className="n"><b>{c.v ? fmt(c.v) : ''}</b></td>
          <td>{m.length ? <span className="badge b-bad">{`${t('needs')}: ${m.map(k => t('s_' + k)).join(', ')}`}</span> : <span className="badge b-ok">{`✓ ${t('complete')}`}</span>}</td></tr>
      }) : <tr><td colSpan={8} className="empty">—</td></tr>}
    </tbody></table></div></>;
}

export function vSupPage(x) {
  const m = missingS(x), L = lines().filter(l => l.sup && l.sup === x.n), tot = L.reduce((a, l) => a + calc(l).v, 0);
  const fld = (f, label, opt: any = {}) => <div className="fld"><label>{label}{opt.req ? <>{' '}<REQ /></> : null}</label><input dir={opt.ltr ? 'ltr' : 'auto'} type={opt.type || undefined} className={m.includes(opt.mk || f) ? 'miss' : ''} data-sid={x.id} data-sf={f} defaultValue={x[f] ?? ''} placeholder={opt.ph || ''} /></div>;
  const chips = (f, list) => <div className="chips">{list.map(c => { const on = (x[f] || []).includes(c[0]); return <button key={c[0]} className={`chip ${on ? 'on' : ''}`} data-act="tog" data-sid={x.id} data-tf={f} data-v={c[0]}>{`${on ? '✓ ' : ''}${lang === 'ar' ? c[2] : c[1]}`}</button> })}</div>;
  return <>{banner()}<div className="controls"><button className="btn" data-act="supback">{`${lang === 'ar' ? '→' : '←'} ${t('allSups')}`}</button><span className="sp"></span>{m.length ? <span className="badge b-bad">{`${t('needs')}: ${m.map(k => t('s_' + k)).join(', ')}`}</span> : <span className="badge b-ok">{`✓ ${t('complete')}`}</span>}</div>
    <div className="card"><h2 style={css('font-size:26px')}>{x.n || t('newSup')}</h2><div style={css('color:var(--fk-muted);font-size:13px')}>{`${L.length} ${t('items')} · AED ${fmt(tot)} ${t('perMonth')}${x.who ? ` · ${t('lastBy')} ${x.who}` : ''}`}</div></div>
    <div className="grid two">
      <div className="card"><h3 className="sec">{t('secContact')}</h3><div className="form">{fld('n', t('supName'), { req: 1, mk: 'name' })}{fld('contact', t('contact'))}{fld('phone', t('phone'), { req: 1, type: 'tel', ltr: 1, ph: '+971 5x xxx xxxx' })}{fld('phone2', t('phone2'), { type: 'tel', ltr: 1 })}{fld('email', t('email'), { type: 'email', ltr: 1 })}</div></div>
      <div className="card"><h3 className="sec">{t('secAddress')}</h3><div className="form"><div className="fld"><label>{OMAN() ? t('gov') : t('emirate')}{' '}<REQ /></label><select className={m.includes('emirate') ? 'miss' : ''} data-sid={x.id} data-sf="emirate" defaultValue={x.emirate}><option value="">{t('choose')}</option>{EMIRATES.map(e => <option key={e[0]} value={e[0]}>{lang === 'ar' ? e[1] : e[0]}</option>)}</select></div>{fld('address', t('address'), { ph: t('addressPh') })}{fld('map', t('map'), { ltr: 1, ph: 'https://maps.google.com/…' })}</div>{x.map && /^https?:\/\//.test(x.map) ? <a href={x.map} target="_blank" rel="noopener" style={css('color:var(--fk-bronze);font-size:13px')}>{`${t('openMap')} ↗`}</a> : null}</div>
      <div className="card"><h3 className="sec">{t('secTerms')}</h3><div className="form"><div className="fld"><label>{t('terms')}{' '}<REQ /></label><select className={m.includes('terms') ? 'miss' : ''} data-sid={x.id} data-sf="terms" defaultValue={x.terms}><option value="">{t('choose')}</option>{[['credit', t('creditW')], ['pemo', t('pemoW')], ['cash', t('cash')]].map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></div>
        {OMAN() ? <div className="fld"><label>{t('payFrom')}{' '}<REQ /></label><select className={x.payFrom ? '' : 'miss'} data-sid={x.id} data-sf="payFrom" defaultValue={x.payFrom}><option value="">{t('choose')}</option>{[['uae', t('payFromUae')], ['oman', t('payFromOman')]].map(o => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></div> : null}
        {x.terms === 'credit' ? fld('days', t('days'), { req: 1, type: 'number' }) : null}<div className="fld"><label>{t('paySch')}</label><select data-sid={x.id} data-sf="payCycle" defaultValue={paySched(x)}>{['delivery', 'days', 'weekly', 'monthly'].map(k => <option key={k} value={k}>{t('ps_' + k)}</option>)}</select></div>{paySched(x) === 'weekly' ? <div className="fld"><label>{t('payDow')}</label><select data-sid={x.id} data-sf="payDow" defaultValue={x.payDow || 'sun'}>{DAYS.map(d => <option key={d[0]} value={d[0]}>{lang === 'ar' ? d[2] : d[1]}</option>)}</select></div> : null}{paySched(x) === 'monthly' ? fld('payDom', t('payDom'), { type: 'number' }) : null}{fld('lead', t('lead'), { type: 'number' })}{fld('minOrder', t('minOrder'), { type: 'number' })}{fld('trn', t('trn'), { ltr: 1 })}{fld('licence', t('licence'), { ltr: 1 })}</div><p style={css('color:var(--fk-muted);font-size:12px;margin:10px 0 0')}>{t('paySchH')}</p>
        <label style={css('display:block;margin:12px 0 6px')}>{t('deliv')}</label>{chips('deliv', DAYS)}</div>
      <div className="card"><h3 className="sec">{t('secBank')}</h3><div className="form">{fld('bankName', t('bankName'))}{fld('accName', t('accName'))}{fld('iban', t('iban'), { req: x.terms === 'credit', ltr: 1, ph: 'AE00 0000 0000 0000 0000 000' })}{fld('accNo', t('accNo'), { ltr: 1 })}{fld('swift', t('swift'), { ltr: 1 })}</div><p style={css('color:var(--fk-muted);font-size:12px;margin:10px 0 0')}>{t('bankNote')}</p></div>
    </div>
    <div className="card"><h3 className="sec">{t('supplies')}{' '}<REQ /></h3>{chips('cats', CATS)}{m.includes('cats') ? <p style={css('color:var(--fk-danger);font-size:12px;margin:8px 0 0')}>{t('pickCat')}</p> : null}</div>
    <div className="card"><h3 className="sec">{t('snotes')}</h3><textarea data-sid={x.id} data-sf="notes" style={css('min-height:70px')} defaultValue={x.notes ?? ''}></textarea></div>
    <div className="card"><h3 className="sec">{`${t('itemsFrom')} (${L.length})`}</h3><p className="hint" style={css('margin:-4px 0 10px;white-space:normal')}>{t('siExplain')}</p>{L.length ? <><div className="list">{L.slice(0, 60).map((l, i) => { const c = calc(l); return <div className="li" key={i}>{l.img ? <img className="sithumb" src={l.img} alt="" /> : <span className="sithumb none" aria-hidden="true"></span>}<div className="grow">{l.n}<div style={css('color:var(--fk-muted);font-size:12px')}>{`${t('unitPrice')}: ${fmt(l.p, 2)} / ${U(l.u) || '—'}`}</div></div><div className="sinum">{c.v ? <><b><bdi>{`${OMAN() ? 'OMR' : 'AED'} ${fmt(c.v)}`}</bdi></b><span>{`${t('siToBuy')} `}<bdi>{`${fmt(c.q, c.q % 1 ? 2 : 0)} ${U(l.u || '')}`}</bdi></span></> : <span className="sizero">{t('siNothing')}</span>}</div></div> })}</div><div style={css('margin-top:10px')}><button className="btn" data-act="supitems" data-n={x.n}>{t('openItems')}</button></div></> : <div className="empty">—</div>}</div></>;
}

export function vAna() {
  const tabs = [['abc', t('aStock')], ['sup', t('aSup')], ['score', t('aScore')]]; if (anaTab === 'grn') __set('anaTab', 'abc');
  return <>{banner()}<div className="chips">{tabs.map(([k, l]) => <button key={k} className={`chip ${anaTab === k ? 'on' : ''}`} data-ana={k}>{l}</button>)}</div>
    {({ abc: vABC, sup: vSupAna, score: vScore, grn: vGRN, otif: vOtif }[anaTab])()}</>;
}

export function vABC() {
  const { L, tot } = abc(); const G = { A: [], B: [], C: [] }; L.forEach(x => G[x.cls].push(x));
  const onHand = lines().reduce((a, l) => a + (+l.st || 0) * (+l.p || 0), 0);
  const excess = lines().reduce((a, l) => a + Math.max(0, (+l.st || 0) - ((+l.use || 0) + (+l.par || 0))) * (+l.p || 0), 0);
  const col = { A: 'var(--fk-bronze)', B: 'var(--fk-bronze-light)', C: 'var(--fk-bronze-soft)' };
  const pol = { A: t('polA'), B: t('polB'), C: t('polC') };
  let R = L; if (abcF) R = R.filter(x => x.cls === abcF);
  const st = g => { const c = { ok: 0, order: 0, below: 0 }; g.forEach(x => { const k = stockState(x.l); if (k) c[k]++ }); return c };
  return <><div className="grid kpis">
    <div className="card stat"><div className="lbl">{t('useVal')}</div><div className="num">{fmt(tot)}<small>AED</small></div><div className="hint">{`${L.length} ${t('items')}`}</div></div>
    <div className="card stat"><div className="lbl">{t('onHand')}</div><div className="num">{fmt(onHand)}<small>AED</small></div><div className="hint">{t('onHandH')}</div></div>
    <div className="card stat"><div className="lbl">{t('excess')}</div><div className="num" style={css(`color:${excess ? 'var(--fk-warning)' : 'inherit'}`)}>{fmt(excess)}<small>AED</small></div><div className="hint">{t('excessH')}</div></div></div>
    <div className="card"><h2>{t('abcTitle')}</h2>
      <div style={css('display:flex;height:26px;border-radius:8px;overflow:hidden;margin:6px 0 2px')}>{['A', 'B', 'C'].map(k => <i key={k} style={css(`width:${G[k].length / L.length * 100}%;background:${col[k]}`)}></i>)}</div><div style={css('font-size:11px;color:var(--fk-muted);margin-bottom:8px')}>{t('shareItems')}</div>
      <div style={css('display:flex;height:26px;border-radius:8px;overflow:hidden;margin-bottom:2px')}>{['A', 'B', 'C'].map(k => <i key={k} style={css(`width:${G[k].reduce((a, x) => a + x.v, 0) / tot * 100}%;background:${col[k]}`)}></i>)}</div><div style={css('font-size:11px;color:var(--fk-muted);margin-bottom:12px')}>{t('shareValue')}</div>
      <div className="grid" style={css('grid-template-columns:repeat(auto-fit,minmax(250px,1fr))')}>{['A', 'B', 'C'].map(k => {
        const v = G[k].reduce((a, x) => a + x.v, 0), c = st(G[k]); return <div key={k} style={css('border:1px solid var(--fk-line);border-radius:10px;padding:12px;cursor:pointer')} data-abc={k}>
          <div style={css('display:flex;align-items:center;gap:8px')}><span className="badge" style={css(`background:${col[k]};color:${k === 'C' ? 'var(--fk-bronze-hover)' : '#fff'};font-size:13px`)}>{k}</span><b>{`${G[k].length} ${t('items')}`}</b><span style={css('color:var(--fk-muted);font-size:12px')}>{`${pct(G[k].length / L.length)} ${t('ofItems')} · ${pct(v / tot)} ${t('ofValue')}`}</span></div>
          <div style={css('font-size:20px;font-weight:600;margin:6px 0')}>{`AED ${fmt(v)}`}</div>
          <div style={css('font-size:12px;display:flex;gap:10px;flex-wrap:wrap')}><span className="badge b-bad">{`${c.below} ${t('sBelow')}`}</span><span className="badge b-warn">{`${c.order} ${t('sOrder')}`}</span><span className="badge b-ok">{`${c.ok} ${t('sOk')}`}</span></div>
          <p style={css('font-size:12px;color:var(--fk-text-2);margin:8px 0 0')}>{pol[k]}</p></div>
      })}</div>
      <p style={css('color:var(--fk-muted);font-size:12px;margin:10px 0 0')}>{t('abcNote')}</p></div>
    <div className="controls"><div className="chips">{['', 'A', 'B', 'C'].map(k => <button key={k} className={`chip ${abcF === k ? 'on' : ''}`} data-abc={k}>{k || t('all')}</button>)}</div></div>
    <div className="tbl-wrap"><table><thead><tr><th>#</th><th>{t('item')}</th><th>ABC</th><th>{t('supplier')}</th><th className="n">{t('use')}</th><th className="n">{t('price')}</th><th className="n">{t('monthVal')}</th><th className="n">{t('cumShare')}</th><th className="n">{t('stock')}</th><th className="n">{t('cover')}</th><th>{t('stockF')}</th></tr></thead><tbody>
      {R.slice(0, 400).map((x, i) => { const l = x.l, k = stockState(l), cov = +l.use > 0 ? (+l.st || 0) / (+l.use / 30) : null; return <tr key={i}><td className="muted">{L.indexOf(x) + 1}</td><td className="item">{l.n}<small>{l.id}</small></td><td><span className="badge" style={css(`background:${col[x.cls]};color:${x.cls === 'C' ? 'var(--fk-bronze-hover)' : '#fff'}`)}>{x.cls}</span></td><td>{l.sup}</td><td className="n">{`${fmt(l.use, l.use % 1 ? 1 : 0)} ${U(l.u)}`}</td><td className="n">{fmt(l.p, 2)}</td><td className="n"><b>{fmt(x.v)}</b></td><td className="n">{pct(x.cum)}</td><td className="n">{fmt(l.st, l.st % 1 ? 1 : 0)}</td><td className="n">{cov == null ? '–' : fmt(cov, 0) + ' ' + t('dayW')}</td><td>{k ? <span className={`badge ${k === 'ok' ? 'b-ok' : k === 'order' ? 'b-warn' : 'b-bad'}`}>{t(k === 'ok' ? 'sOk' : k === 'order' ? 'sOrder' : 'sBelow')}</span> : null}</td></tr> })}
    </tbody></table></div></>;
}

export function vSupAna() {
  const { L } = abc(); const cls = {}; L.forEach(x => cls[x.l.id] = x.cls); const by = {}; lines().forEach(l => { const k = l.sup || '—'; const v = calc(l).v; by[k] = by[k] || { n: k, v: 0, items: 0, A: 0, pay: {} }; by[k].v += v; by[k].items++; if (cls[l.id] === 'A') by[k].A++; by[k].pay[l.pay || ''] = 1 });
  const S = (Object.values(by) as any[]).sort((a, b) => b.v - a.v), tot = S.reduce((a, x) => a + x.v, 0); let cum = 0; S.forEach(x => { cum += x.v; x.cum = tot ? cum / tot : 0 });
  const top5 = S.slice(0, 5).reduce((a, x) => a + x.v, 0), D = recs('Deliveries'); void D;
  const pe = lines().filter(l => l.pay === 'pemo').reduce((a, l) => a + calc(l).v, 0), cr = lines().filter(l => l.pay === 'credit').reduce((a, l) => a + calc(l).v, 0);
  const n80 = S.findIndex(x => x.cum >= 0.8) + 1;
  return <><div className="grid kpis">
    <div className="card stat"><div className="lbl">{t('activeSups')}</div><div className="num">{S.filter(x => x.v > 0).length}</div><div className="hint">{`${n80} ${t('sups80')}`}</div></div>
    <div className="card stat"><div className="lbl">{t('top5')}</div><div className="num">{pct(tot ? top5 / tot : 0)}</div><div className="hint">{`AED ${fmt(top5)} ${t('ofBudget')}`}</div></div>
    <div className="card stat"><div className="lbl">{t('payMix')}</div><div className="num">{pct(tot ? cr / tot : 0)}<small>{t('creditW')}</small></div><div className="hint">{`${pct(tot ? pe / tot : 0)} ${t('pemoW')}`}</div></div></div>
    <div className="card"><h2>{t('supSpend')}</h2><p style={css('color:var(--fk-muted);font-size:12px;margin:0 0 8px')}>{t('supSpendH')}</p>
      <div className="tbl-wrap" style={css('max-height:none')}><table><thead><tr><th>{t('supplier')}</th><th className="n">{t('monthly')}</th><th style={css('min-width:160px')}>{t('share')}</th><th className="n">{t('cumShare')}</th><th className="n">{t('items')}</th><th className="n">{t('aItems')}</th><th>{t('payment')}</th><th>{t('score')}</th><th>OTIF</th></tr></thead><tbody>
        {S.map(x => { const sc = supScore(x.n), b = band(sc), o = grnOtif(recs('GRN').filter(g => g.sup === x.n)); return <tr key={x.n}><td className="item">{x.n}</td><td className="n"><b>{fmt(x.v)}</b></td><td><div className="bar" style={css('margin:0')}><i style={css(`width:${tot ? x.v / tot * 100 / (S[0].v / tot) : 0}%`)}></i></div><span style={css('font-size:11px;color:var(--fk-muted)')}>{pct(tot ? x.v / tot : 0)}</span></td><td className="n">{pct(x.cum)}</td><td className="n">{x.items}</td><td className="n">{x.A || ''}</td><td>{Object.keys(x.pay).map((p, i) => <Fragment key={p}>{i ? ' ' : null}{p === 'pemo' ? <span className="badge b-pemo">Pemo</span> : p === 'credit' ? <span className="badge b-mute">{t('creditW')}</span> : <span className="badge b-bad">{t('nopay')}</span>}</Fragment>)}</td><td>{sc != null ? <><b>{sc.toFixed(1)}</b>{' '}<span className={`badge ${b[0]}`}>{b[1]}</span></> : <span className="muted">–</span>}</td><td>{o.n ? <span className={`badge ${o.s >= 0.95 ? 'b-ok' : o.s >= 0.85 ? 'b-warn' : 'b-bad'}`}>{pct(o.s)}</span> : <span className="muted">–</span>}</td></tr> })}
      </tbody></table></div></div></>;
}

export function vScore() {
  if (evalOpen) return vEvalForm(evalOpen);
  const E = recs('Evaluations').sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1); const names = [...new Set(E.map(e => e.sup))];
  const rank = names.map(n => { const es = E.filter(e => e.sup === n && evalScore(e) != null); const avg = es.length ? es.reduce((a, e) => a + evalScore(e), 0) / es.length : null; return { n, avg, last: supScore(n), cnt: es.length } }).sort((a, b) => (b.last ?? -1) - (a.last ?? -1));
  return <><div className="card"><div className="controls"><div><h2 style={css('margin:0')}>{t('aScore')}</h2><p style={css('color:var(--fk-muted);font-size:12px;margin:4px 0 0')}>{t('scoreH')}</p></div><span className="sp"></span><button className="btn btn-primary" data-act="neweval">{`+ ${t('newEval')}`}</button></div>
    <div className="chips" style={css('margin-top:10px')}>{CRIT.map(([k, w]) => <span key={k} className="badge b-mute">{`${t('c_' + k)} ${w}%`}</span>)}</div>
    <div className="chips" style={css('margin-top:6px')}><span className="badge b-ok">{`≥ 4.5 ${t('bPref')}`}</span><span className="badge b-ok">{`≥ 3.5 ${t('bAppr')}`}</span><span className="badge b-warn">{`≥ 2.5 ${t('bWatch')}`}</span><span className="badge b-bad">{`< 2.5 ${t('bRepl')}`}</span></div></div>
    <div className="grid two"><div className="card"><h2>{t('ranking')}</h2>{rank.length ? <div className="list">{rank.map((r, i) => { const b = band(r.last); return <div className="li" key={i}><b style={css('width:22px')}>{i + 1}</b><div className="grow">{r.n}<div style={css('font-size:12px;color:var(--fk-muted)')}>{`${r.cnt} ${t('evals')}${r.avg != null ? ' · ' + t('avg') + ' ' + r.avg.toFixed(1) : ''}`}</div></div><b>{r.last != null ? r.last.toFixed(1) : '–'}</b><span className={`badge ${b[0]}`}>{b[1]}</span></div> })}</div> : <div className="empty">{t('noEvals')}</div>}</div>
      <div className="card"><h2>{t('history')}</h2>{E.length ? <div className="list">{E.map(e => { const sc = evalScore(e), b = band(sc); return <div className="li" key={e.id} style={css('cursor:pointer')} data-evopen={e.id}><div className="grow"><b>{e.sup || '—'}</b><div style={css('font-size:12px;color:var(--fk-muted)')}>{`${dd(e.date)} · ${e.by || e.who || ''}${e.cat ? ' · ' + e.cat : ''}`}</div></div><b>{sc != null ? sc.toFixed(1) : '–'}</b><span className={`badge ${b[0]}`}>{b[1]}</span></div> })}</div> : <div className="empty">{t('noEvals')}</div>}</div></div></>;
}

export function vEvalForm(id) {
  const e = Object.assign({ id, date: new Date().toISOString().slice(0, 10) }, rec('Evaluations', id)); const sc = evalScore(e), b = band(sc); const sups = suppliers().map(x => x.n).filter(Boolean).sort();
  return <><div className="controls"><button className="btn" data-act="evback">{`${lang === 'ar' ? '→' : '←'} ${t('aScore')}`}</button><span className="sp"></span><span style={css('font-size:22px;font-weight:600')}>{sc != null ? sc.toFixed(2) + ' / 5' : '–'}</span><span className={`badge ${b[0]}`}>{b[1]}</span></div>
    <div className="card"><div className="form"><div className="fld"><label>{t('supplier')}{' '}<REQ /></label><select className={e.sup ? '' : 'miss'} data-rk="Evaluations" data-rid={id} data-rf="sup" defaultValue={e.sup}><option value="">{t('choose')}</option>{sups.map(s => <option key={s}>{s}</option>)}</select></div>
      <div className="fld"><label>{t('evDate')}</label><input type="date" data-rk="Evaluations" data-rid={id} data-rf="date" defaultValue={e.date || ''} /></div>
      <div className="fld"><label>{t('evBy')}</label><input dir="auto" data-rk="Evaluations" data-rid={id} data-rf="by" defaultValue={e.by || me || ''} /></div>
      <div className="fld"><label>{t('evCat')}</label><input dir="auto" data-rk="Evaluations" data-rid={id} data-rf="cat" defaultValue={e.cat || ''} placeholder={t('evCatPh')} /></div></div></div>
    <div className="card"><h3 className="sec">{t('rateEach')}</h3><div className="list">{CRIT.map(([k, w]) => <div className="li" key={k}><div className="grow"><b>{t('c_' + k)}</b>{' '}<span style={css('color:var(--fk-muted);font-size:12px')}>{`${w}%`}</span><div style={css('font-size:12px;color:var(--fk-muted)')}>{t('q_' + k)}</div></div>
      <div className="chips">{[1, 2, 3, 4, 5].map(n => <button key={n} className={`chip ${+e[k] === n ? 'on' : ''}`} style={css('min-width:40px')} data-act="rate" data-rid={id} data-k={k} data-v={n}>{n}</button>)}</div></div>)}</div>
      <p style={css('color:var(--fk-muted);font-size:12px;margin:8px 0 0')}>{t('scale')}</p></div>
    <div className="card"><h3 className="sec">{t('comment')}</h3><textarea data-rk="Evaluations" data-rid={id} data-rf="note" style={css('min-height:70px')} defaultValue={e.note || ''}></textarea></div></>;
}

export function vOtif() {
  if (delivOpen) return vDelivForm(delivOpen);
  const D = recs('Deliveries').sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1); const all = otif(D); const names = [...new Set(D.map(d => d.sup))];
  const per = names.map(n => Object.assign(otif(D.filter(d => d.sup === n)), { name: n })).sort((a, b) => (a.s ?? 2) - (b.s ?? 2));
  const cls = x => x == null ? 'b-mute' : x >= 0.95 ? 'b-ok' : x >= 0.85 ? 'b-warn' : 'b-bad';
  return <><div className="card"><div className="controls"><div><h2 style={css('margin:0')}>{t('aOtif')}</h2><p style={css('color:var(--fk-muted);font-size:12px;margin:4px 0 0')}>{t('otifH')}</p></div><span className="sp"></span><button className="btn btn-primary" data-act="newdeliv">{`+ ${t('newDeliv')}`}</button></div></div>
    <div className="grid kpis">{[['qtyPct', all.q], ['qualPct', all.ql], ['timePct', all.tm], ['otifPct', all.s]].map(([k, v]) => <div className="card stat" key={k}><div className="lbl">{t(k)}</div><div className="num">{pct(v)}</div><div className="hint"><span className={`badge ${cls(v)}`}>{v == null ? '–' : v >= 0.95 ? t('good') : v >= 0.85 ? t('watch') : t('poor')}</span></div></div>)}</div>
    <div className="grid two"><div className="card"><h2>{t('bySup')}</h2>{per.length ? <div className="tbl-wrap" style={css('max-height:none;border:0')}><table><thead><tr><th>{t('supplier')}</th><th className="n">{t('dels')}</th><th className="n">{t('qtyPct')}</th><th className="n">{t('qualPct')}</th><th className="n">{t('timePct')}</th><th className="n">OTIF</th></tr></thead><tbody>{per.map((p, i) => <tr key={i}><td className="item">{p.name}</td><td className="n">{p.n}</td><td className="n">{pct(p.q)}</td><td className="n">{pct(p.ql)}</td><td className="n">{pct(p.tm)}</td><td className="n"><span className={`badge ${cls(p.s)}`}>{pct(p.s)}</span></td></tr>)}</tbody></table></div> : <div className="empty">{t('noDels')}</div>}</div>
      <div className="card"><h2>{t('history')}</h2>{D.length ? <div className="list">{D.slice(0, 80).map(d => { const o = otif([d]); return <div className="li" key={d.id} style={css('cursor:pointer')} data-dopen={d.id}><div className="grow"><b>{d.sup || '—'}</b>{` · ${d.item || ''}`}<div style={css('font-size:12px;color:var(--fk-muted)')}>{`${dd(d.date)} · ${fmt(d.recv)}/${fmt(d.ord)}${+d.rej ? ' · ' + fmt(d.rej) + ' ' + t('rejW') : ''} · ${d.ontime === 'yes' ? t('onTime') : d.ontime === 'no' ? t('late') : '?'}`}</div></div><span className={`badge ${cls(o.s)}`}>{pct(o.s)}</span></div> })}</div> : <div className="empty">{t('noDels')}</div>}</div></div></>;
}

export function vDelivForm(id) {
  const d = Object.assign({ id, date: new Date().toISOString().slice(0, 10) }, rec('Deliveries', id)); const o = otif([d]); const sups = suppliers().map(x => x.n).filter(Boolean).sort();
  const items = lines().filter(l => !d.sup || l.sup === d.sup).map(l => l.n).sort();
  const f = (k, lab, type?, req?) => <div className="fld"><label>{lab}{req ? <>{' '}<REQ /></> : null}</label><input type={type || undefined} dir="auto" className={req && !(d[k] || d[k] === 0) ? 'miss' : ''} data-rk="Deliveries" data-rid={id} data-rf={k} defaultValue={d[k] ?? ''} list={k === 'item' ? 'ditems' : undefined} /></div>;
  return <><div className="controls"><button className="btn" data-act="dback">{`${lang === 'ar' ? '→' : '←'} ${t('aOtif')}`}</button><span className="sp"></span><span style={css('font-size:22px;font-weight:600')}>{`OTIF ${pct(o.s)}`}</span></div>
    <div className="card"><div className="form"><div className="fld"><label>{t('supplier')}{' '}<REQ /></label><select className={d.sup ? '' : 'miss'} data-rk="Deliveries" data-rid={id} data-rf="sup" defaultValue={d.sup}><option value="">{t('choose')}</option>{sups.map(s => <option key={s}>{s}</option>)}</select></div>
      {f('date', t('evDate'), 'date')}{f('item', t('item'), '', 1)}<datalist id="ditems">{items.map((n, i) => <option key={i} value={n} />)}</datalist>
      {f('ord', t('qOrd'), 'number', 1)}{f('recv', t('qRecv'), 'number', 1)}{f('rej', t('qRej'), 'number')}
      <div className="fld"><label>{t('onTimeQ')}{' '}<REQ /></label><div className="chips">{[['yes', t('onTime')], ['no', t('late')]].map(([v, l]) => <button key={v} className={`chip ${d.ontime === v ? 'on' : ''}`} data-act="ontime" data-rid={id} data-v={v}>{l}</button>)}</div></div>
      {f('inv', t('invNo'))}</div></div>
    <div className="grid kpis">{[['qtyPct', o.q], ['qualPct', o.ql], ['timePct', o.tm]].map(([k, v]) => <div className="card stat" key={k}><div className="lbl">{t(k)}</div><div className="num">{pct(v)}</div></div>)}</div></>;
}
