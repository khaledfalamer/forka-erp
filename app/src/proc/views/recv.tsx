/* Procurement: receiving (GRN list and form, GRN document), stock moves, LPO list, LPO form, LPO document. */
import {
  t, lang, dd, fmt, pct, U, recs, rec, lines, suppliers, eff, SHEET, editMode, OMAN, nm, LPLOC, BRANCHES, brName,
  grnOpen, grnDoc, grnLines, grnTot, grnOtif, grnOutcome, grnChecks, grnStatus, GST, REASONS, mediaMem,
  poOpen, poDoc, poF, poAutoMsg, poTot, poRecvd, poStatus, poMiss, supByName, schedTxt, moves, mvF,
} from '../core';
import { css, offAtStart } from '../ui';
import { banner } from './shell';

const s0 = (v: any) => (v ?? '');

export function vGRN(): any {
  if (grnOpen) return grnDoc ? vGrnDoc(grnOpen) : vGRNForm(grnOpen);
  const G = recs('GRN').sort((a, b) => ((b.date || '') + (b.no || '')) > ((a.date || '') + (a.no || '')) ? 1 : -1); const all = grnOtif(G);
  const names = [...new Set(G.map(g => g.sup).filter(Boolean))]; const per = names.map(n => Object.assign(grnOtif(G.filter(g => g.sup === n)), { name: n, cnt: G.filter(g => g.sup === n).length })).sort((a, b) => (a.s ?? 2) - (b.s ?? 2));
  const cls = x => x == null ? 'b-mute' : x >= 0.95 ? 'b-ok' : x >= 0.85 ? 'b-warn' : 'b-bad'; const cnt = k => G.filter(g => grnStatus(g) === k).length;
  return <>
    <div className="card"><div className="controls"><div><h2 style={css('margin:0')}>{t('aGrn')}</h2><p style={css('color:var(--fk-muted);font-size:12px;margin:4px 0 0')}>{t('grnH')}</p></div><span className="sp"></span><button className="btn btn-primary" data-act="newgrn">{`+ ${t('newGrn')}`}</button></div>
      <div className="chips" style={css('margin-top:10px')}><span className="badge b-mute">{`${cnt('draft')} ${t('gDraft')}`}</span><span className="badge b-warn">{`${cnt('hold')} ${t('gHold')}`}</span><span className="badge b-ok">{`${cnt('ready')} ${t('gReady')}`}</span><span className="badge b-ok">{`${cnt('paid')} ${t('gPaid')}`}</span></div></div>
    <div className="grid kpis">{[['qtyPct', all.q], ['qualPct', all.ql], ['timePct', all.tm], ['otifPct', all.s]].map(([k, v]) => <div className="card stat" key={k}><div className="lbl">{t(k)}</div><div className="num">{pct(v)}</div><div className="hint"><span className={`badge ${cls(v)}`}>{v == null ? '–' : v >= 0.95 ? t('good') : v >= 0.85 ? t('watch') : t('poor')}</span></div></div>)}</div>
    <div className="grid two"><div className="card"><h2>{t('grnList')}</h2>{G.length ? <div className="list">{G.slice(0, 100).map(g => {
      const T = grnTot(g), s = GST[grnStatus(g)], oc = grnOutcome(g), m = (g.media || []).length;
      return <div className="li" style={css('cursor:pointer')} data-gopen={s0(g.id)} key={g.id}><div className="grow"><b>{g.no || g.id}</b>{` · ${g.sup || '—'}`}<div style={css('font-size:12px;color:var(--fk-muted)')}>{`${dd(g.date)} · ${grnLines(g).length} ${t('lines')} · AED ${fmt(T.val)}`}{T.rej ? <>{' · '}<span style={css('color:var(--fk-danger)')}>{`${fmt(T.rej)} ${t('rejW')}`}</span></> : null}{m ? ` · ${m} ${t('photos')}` : null}</div></div>{oc ? <span className={`badge ${oc === 'accepted' ? 'b-ok' : oc === 'part' ? 'b-warn' : 'b-bad'}`}>{t('o_' + oc)}</span> : null}<span className={`badge ${s[0]}`}>{t(s[1])}</span></div>;
    })}</div> : <div className="empty">{t('noGrn')}</div>}</div>
      <div className="card"><h2>{`OTIF — ${t('bySup')}`}</h2>{per.length ? <div className="tbl-wrap" style={css('max-height:none;border:0')}><table><thead><tr><th>{t('supplier')}</th><th className="n">GRN</th><th className="n">{t('qtyPct')}</th><th className="n">{t('qualPct')}</th><th className="n">{t('timePct')}</th><th className="n">OTIF</th></tr></thead><tbody>{per.map(p => <tr key={p.name}><td className="item">{p.name}</td><td className="n">{p.cnt}</td><td className="n">{pct(p.q)}</td><td className="n">{pct(p.ql)}</td><td className="n">{pct(p.tm)}</td><td className="n"><span className={`badge ${cls(p.s)}`}>{pct(p.s)}</span></td></tr>)}</tbody></table></div> : <div className="empty">{t('noGrn')}</div>}</div></div>
  </>;
}

export function vGRNForm(id) {
  const g = Object.assign({ id }, rec('GRN', id)); const L = grnLines(g), T = grnTot(g), o = grnOtif([g]), st = grnStatus(g), S = GST[st], oc = grnOutcome(g);
  const sups = suppliers().map(x => x.n).filter(Boolean).sort(); const items = lines().filter(l => !g.sup || l.sup === g.sup);
  const inp = (k, lab, opt: any = {}) => <div className="fld"><label>{lab}{opt.req ? <>{' '}<span style={css('color:var(--fk-danger)')}>*</span></> : null}</label><input dir={opt.ltr ? 'ltr' : 'auto'} type={opt.type || undefined} className={opt.req && !String(g[k] ?? '').trim() ? 'miss' : ''} data-rk="GRN" data-rid={s0(id)} data-rf={k} defaultValue={s0(g[k])} placeholder={opt.ph || ''} /></div>;
  const yn = (k, lab, yes, no) => <div className="fld"><label>{lab}</label><div className="chips">{[['yes', yes], ['no', no]].map(([v, l]) => <button key={v} className={`chip ${g[k] === v ? 'on' : ''}`} data-act="gset" data-rid={s0(id)} data-k={k} data-v={v}>{l}</button>)}</div></div>;
  const ck = grnChecks(g); const tv = +g.temp; const tempBad = g.temp !== '' && g.temp != null && !isNaN(tv) && ((g.tz === 'frozen' && tv > -18) || (g.tz !== 'frozen' && g.tz !== 'dry' && tv > 5));
  return <>
    <div className="controls"><button className="btn" data-act="gback">{`${lang === 'ar' ? '→' : '←'} ${t('aGrn')}`}</button><span className="sp"></span><button className="btn" data-act="gdoc">{t('gDoc')}</button><button className="btn" data-act="gdocgo" data-go="print">{t('tPrint')}</button><button className="btn" data-act="gdocgo" data-go="share">{t('shBtn')}</button>{oc ? <span className={`badge ${oc === 'accepted' ? 'b-ok' : oc === 'part' ? 'b-warn' : 'b-bad'}`}>{t('o_' + oc)}</span> : null}<span className={`badge ${S[0]}`}>{t(S[1])}</span><span style={css('font-weight:600')}>{`OTIF ${pct(o.s)}`}</span></div>
    <div className="card"><h2 style={css('font-size:24px')}>{g.no || id}</h2><div style={css('color:var(--fk-muted);font-size:13px')}>{t('step1')}</div>
      {(() => {
        const P = recs('POs').filter(x => ['issued', 'part'].includes(poStatus(x)));
        return (P.length || g.poId) && !['received', 'paid'].includes(g.status)
          ? <div className="fld" style={css('margin-top:12px;max-width:520px')}><label>{t('gFromPo')}</label><select id="gpo" data-rid={s0(id)} defaultValue={g.poId || ''}><option value="">{t('gPickPo')}</option>{P.map(x => <option key={x.id} value={s0(x.id)}>{`${s0(x.no)} · ${x.sup || ''} · ${t('lpNeed')} ${dd(x.need)}`}</option>)}</select></div>
          : g.poId ? <div className="hint" style={css('margin-top:8px')}>{`${t('gPo')}: `}<b>{g.po || ''}</b></div> : null;
      })()}
      <div className="form" style={css('margin-top:12px')}><div className="fld"><label>{t('supplier')}{' '}<span style={css('color:var(--fk-danger)')}>*</span></label><select className={g.sup ? '' : 'miss'} data-rk="GRN" data-rid={s0(id)} data-rf="sup" defaultValue={g.sup || ''}><option value="">{t('choose')}</option>{sups.map(s => <option key={s}>{s}</option>)}</select></div>
        {inp('date', t('evDate'), { type: 'date' })}{inp('time', t('gTime'), { type: 'time' })}{inp('po', t('gPo') + ' (' + t('optional') + ')', { ltr: 1, ph: 'PO-…' })}{inp('dn', t('gDn'), { ltr: 1 })}{inp('inv', t('gInv'), { req: 1, ltr: 1 })}{inp('orderedBy', t('gOrderedBy'))}{inp('by', t('gBy'), { req: 1 })}</div>
      {ck.find(c => c[0] === 'split')[1] ? null : <p style={css('color:var(--fk-danger);font-size:13px;margin:10px 0 0')}>{t('splitWarn')}</p>}</div>
    <div className="card"><h3 className="sec">{t('step2')}</h3><div className="form">{yn('vclean', t('gClean'), t('yes'), t('no'))}
      <div className="fld"><label>{t('gZone')}</label><div className="chips">{[['chilled', t('zChill')], ['frozen', t('zFroz')], ['dry', t('zDry')]].map(([v, l]) => <button key={v} className={`chip ${(g.tz || '') === v ? 'on' : ''}`} data-act="gset" data-rid={s0(id)} data-k="tz" data-v={v}>{l}</button>)}</div></div>
      {g.tz === 'dry' ? null : <div className="fld"><label>{`${t('gTemp')} °C`}</label><input type="number" step="0.1" className={tempBad ? 'miss' : ''} data-rk="GRN" data-rid={s0(id)} data-rf="temp" defaultValue={s0(g.temp)} />{tempBad ? <div style={css('color:var(--fk-danger);font-size:12px')}>{t('tempBad')}</div> : <div className="hint">{t('tempRule')}</div>}</div>}
      {yn('ontime', t('onTimeQ'), t('onTime'), t('late'))}</div></div>
    <div className="card" style={css('padding:0')}><div className="sup-head"><h3>{t('step3')}</h3><span className="sp"></span><select id="gadd" data-rid={s0(id)} style={css('max-width:320px')}><option value="">{`+ ${t('gAddItem')}`}</option>{items.map(l => <option key={l.id} value={s0(l.id)}>{l.n}</option>)}</select></div>
      <div className="tbl-wrap" style={css('border:0;border-radius:0;max-height:none')}><table><thead><tr><th>{t('item')}</th><th className="n">{t('qOrd')}</th><th className="n">{t('qRecv')}</th><th className="n">{t('qRej')}</th><th>{t('gReason')}</th><th className="n">{t('gPrice')}</th><th>{t('gExp')}</th><th className="n">{t('gAcc')}</th><th></th></tr></thead><tbody>
        {L.length ? L.map((l, i) => {
          const acc = Math.max(0, (+l.recv || 0) - (+l.rej || 0)), vr = l.plan > 0 && +l.price > 0 && Math.abs(+l.price / l.plan - 1) > 0.01;
          const ni = (f, w?) => <input className={`num ${(f === 'recv' || f === 'ord') && (l[f] == null || l[f] === '') ? 'miss' : ''}`} type="number" min="0" step="any" style={css(`width:${w || 80}px`)} data-gl={i} data-rid={s0(id)} data-gf={f} defaultValue={s0(l[f])} />;
          return <tr key={i} className={+l.rej > 0 || (l.scanned && !l.item) ? 'r-miss' : ''}><td className="item">{l.scanned || (!l.item && l.poLine == null) ? <><select className={!l.item ? 'miss' : l.check ? 'warnsel' : ''} data-gl={i} data-rid={s0(id)} data-gf="item" style={css('max-width:260px')} defaultValue={s0(l.item)}><option value="">{t('pickItem')}</option>{lines().map(x => <option key={x.id} value={s0(x.id)}>{x.n}</option>)}</select>{l.check ? <div style={css('color:var(--fk-warning);font-size:11px;font-weight:600')}>{t('checkMatch')}</div> : null}</> : l.name}<small>{`${l.billName && l.billName !== l.name ? `${t('onBill')}: ${l.billName} · ` : ''}${U(l.u) || ''}`}</small></td><td className="n">{ni('ord')}{l.planQ ? <div className="hint">{`${t('monthPlan')} ${fmt(l.planQ, l.planQ % 1 ? 1 : 0)}`}</div> : null}</td><td className="n">{ni('recv')}</td><td className="n">{ni('rej')}</td>
            <td>{+l.rej > 0 ? <select className={l.reason ? '' : 'miss'} data-gl={i} data-rid={s0(id)} data-gf="reason" defaultValue={s0(l.reason)}><option value="">{t('choose')}</option>{REASONS.map(r => <option key={r[0]} value={r[0]}>{lang === 'ar' ? r[2] : r[1]}</option>)}</select> : null}</td>
            <td className="n">{ni('price', 90)}{l.plan > 0 ? <div className="hint" style={css(vr ? 'color:var(--fk-danger);font-weight:600' : '')}>{`${t('plan')} ${fmt(l.plan, 2)}${vr ? ' ≠' : ''}`}</div> : null}</td>
            <td><input type="date" data-gl={i} data-rid={s0(id)} data-gf="exp" defaultValue={l.exp || ''} /></td><td className="n"><b>{fmt(acc, acc % 1 ? 2 : 0)}</b></td><td><button className="btn btn-ok" data-act="gdel" data-rid={s0(id)} data-i={i}>✕</button></td></tr>;
        }) : <tr><td colSpan={9} className="empty">{t('gNoLines')}</td></tr>}
      </tbody></table></div>
      <div style={css('padding:12px 18px;display:flex;gap:16px;flex-wrap:wrap;font-size:13px')}><span>{`${t('qOrd')}: `}<b>{fmt(T.o)}</b></span><span>{`${t('qRecv')}: `}<b>{fmt(T.r)}</b></span><span>{`${t('qRej')}: `}<b style={css(`color:${T.rej ? 'var(--fk-danger)' : 'inherit'}`)}>{fmt(T.rej)}</b></span><span>{`${t('gValue')}: `}<b>{`AED ${fmt(T.val, 2)}`}</b></span>{T.varc ? <span style={css('color:var(--fk-danger)')}>{`${T.varc} ${t('priceVar')}`}</span> : null}</div></div>
    <div className="card"><h3 className="sec">{t('step4')}</h3><p style={css('color:var(--fk-muted);font-size:12px;margin:0 0 10px')}>{t('mediaH')}</p>
      <label className="btn" style={css('display:inline-flex;align-items:center;gap:6px;cursor:pointer')}>{t('addMedia')}<input type="file" accept="image/*,video/*" capture="environment" multiple data-media={s0(id)} style={css('display:none')} /></label>
      <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:12px')}>{(g.media || []).map((m, i) => {
        const src = mediaMem[m.id] || m.url || '';
        return <div key={i} style={css('border:1px solid var(--fk-line);border-radius:10px;overflow:hidden;background:var(--fk-paper)')}>{m.type && m.type.startsWith('video') ? (src ? <video src={src} controls style={css('width:100%;height:110px;object-fit:cover;background:#000')}></video> : <div className="empty" style={css('height:110px;padding:40px 0')}>{t('ph_video')}</div>) : (src ? <img src={src} style={css('width:100%;height:110px;object-fit:cover;display:block')} /> : <div className="empty" style={css('height:110px;padding:40px 0')}>{t('ph_photo')}</div>)}
          <div style={css('padding:6px 8px;font-size:11px;color:var(--fk-muted);display:flex;gap:6px;align-items:center')}><span className="grow" style={css('flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{`${s0(m.name)} · ${fmt((m.size || 0) / 1048576, 1)} MB`}</span><button className="btn btn-ok" data-act="mdel" data-rid={s0(id)} data-i={i}>✕</button></div></div>;
      })}</div>
      {T.rej > 0 ? <div style={css('margin-top:12px')}>{yn('signed', t('gSigned'), t('yes'), t('no'))}</div> : null}</div>
    <div className="card"><h3 className="sec">{t('step5')}</h3><div className="list">{ck.map(([k, ok]) => <div className="li" key={k}><span className={`badge ${ok ? 'b-ok' : 'b-bad'}`}>{ok ? '✓' : '✕'}</span><div className="grow">{t('ck2_' + k)}</div></div>)}</div>
      {(+g.varc || T.varc) ? <div style={css('margin-top:10px')}>{yn('varOk', t('varOk'), t('yes'), t('no'))}</div> : null}
      <div className="controls" style={css('margin-top:12px')}>
        {g.status !== 'received' && g.status !== 'paid' ? <button className="btn btn-accent" data-act="gstatus" data-rid={s0(id)} data-v="received" ref={offAtStart(!L.length)}>{t('markRecv')}</button> : null}
        {g.status === 'received' && !g.stockDone ? <button className="btn" data-act="gstock" data-rid={s0(id)}>{t('addStock')}</button> : null}{g.stockDone ? <span className="badge b-ok">{`✓ ${t('stockAdded')}`}</span> : null}
        {st === 'ready' && eff() === 'fin' ? <button className="btn btn-primary" data-act="gstatus" data-rid={s0(id)} data-v="paid">{t('markPaid')}</button> : null}
        {g.status && g.status !== 'draft' ? <button className="btn" data-act="gstatus" data-rid={s0(id)} data-v="draft">{t('reopen')}</button> : null}</div>
      <p style={css('color:var(--fk-muted);font-size:12px;margin:10px 0 0')}>{t('ruleGolden')}</p></div>
    <div className="card"><h3 className="sec">{t('comment')}</h3><textarea data-rk="GRN" data-rid={s0(id)} data-rf="note" style={css('min-height:60px')} defaultValue={g.note || ''}></textarea></div>
  </>;
}

export function lpBadge(st) { return <span className={`badge ${st === 'draft' ? 'b-warn' : st === 'received' ? 'b-ok' : st === 'cancelled' ? 'b-mute' : st === 'part' ? 'b-pemo' : 'b-ok'}`}>{t('lp_' + st)}</span>; }

export function vLpo(): any {
  if (poOpen) return poDoc ? vLpoDoc(poOpen) : vLpoForm(poOpen);
  const A = recs('POs').sort((a, b) => ((b.date || '') + (b.no || '')).localeCompare((a.date || '') + (a.no || ''))); const cnt = s => A.filter(x => poStatus(x) === s).length;
  const R = poF === 'all' ? A : poF === 'open' ? A.filter(x => ['draft', 'issued', 'part'].includes(poStatus(x))) : A.filter(x => poStatus(x) === poF);
  return <>
    {banner()}<div className="card"><h2 style={css('margin:0')}>{t('lpo')}</h2><p className="hint" style={css('white-space:normal;margin:4px 0 0;font-size:12.5px;max-width:760px')}>{t('lpoH')}</p></div>
    {poAutoMsg ? <div className="banner bn-info">{poAutoMsg}</div> : null}
    <div className="controls">{(!SHEET || editMode) && eff() === 'plan' ? <button className="btn btn-accent" data-act="ponew">{t('lpNew')}</button> : null}<div className="chips">{[['open', t('rqOpenN')], ['draft', t('lp_draft')], ['issued', t('lp_issued')], ['part', t('lp_part')], ['received', t('lp_received')], ['cancelled', t('lp_cancelled')], ['all', t('rqAll')]].map(([k, l]) => <button key={k} className={`chip ${poF === k ? 'on' : ''}`} data-pof={k}>{`${l}${!['open', 'all'].includes(k) && cnt(k) ? ' · ' + cnt(k) : ''}`}</button>)}</div></div>
    {R.length ? <div className="card" style={css('padding:4px 0')}><div className="list">{R.map(po => {
      const T2 = poTot(po), st = poStatus(po);
      return <div className="li rq-li" data-poopen={s0(po.id)} key={po.id}><div className="grow"><b className="docno" dir="ltr">{po.no}</b>{` · ${po.sup || '—'}`}<div className="hint" style={css('white-space:normal;margin-top:3px')}><span className="kindtag">{(po.src || {}).type === 'request' ? t('lpFromReq') + ' ' + s0(po.src.no || '') : (po.src || {}).type === 'manual' ? t('lpManual') : t('lpFromStock')}</span>{`${(po.lines || []).length} ${t('items')} · ${t('lpNeed')} ${po.need ? dd(po.need) : '—'} · ${nm(LPLOC, po.deliverTo)}`}</div></div><b>{`AED ${fmt(T2.tot, 2)}`}</b>{lpBadge(st)}<span className="ov-arrow">{lang === 'ar' ? '←' : '→'}</span></div>;
    })}</div></div> : <div className="card"><div className="empty">{t('lpNone')}</div></div>}
  </>;
}

export function vLpoForm(id) {
  const po = Object.assign({ id }, rec('POs', id)); if (!po.no) return null; const st = poStatus(po), draft = st === 'draft', can = (!SHEET || editMode) && draft && eff() === 'plan'; const M = poMiss(po), T2 = poTot(po), R = poRecvd(po); const S = supByName(po.sup) || {};
  const opts = lines().filter(l => l.n && (!po.sup || l.sup === po.sup)).map((l, i) => <option key={i} value={`${s0(l.n)} · ${U(l.u) || ''} [${s0(l.id)}]`}></option>);
  return <>
    <div className="controls"><button className="btn" data-act="poback">{`${lang === 'ar' ? '→' : '←'} ${t('lpBack')}`}</button><span className="sp"></span>{!draft ? <button className="btn btn-primary" data-act="podoc">{t('lpPrintBtn')}</button> : null}{lpBadge(st)}</div>
    <div className="card"><div className="hint">{(po.src || {}).type === 'request' ? <>{`${t('lpSrcReq')} `}<b>{po.src.no || ''}</b>{po.apprBy ? ' · ' + t('lpAppr') + ' ' + po.apprBy : null}</> : t('lpSrcStock')}</div><h2 style={css('font-size:26px;margin:6px 0 10px')}>{po.no}</h2>
      <div className="form">
        <div className="fld"><label>{t('supplier')}{' '}<span style={css('color:var(--fk-danger)')}>*</span></label>{can ? <select data-pof2="sup" className={M.sup ? 'miss' : ''} defaultValue={po.sup || ''}><option value="">{t('choose')}</option>{suppliers().map((x, i) => <option key={i}>{x.n}</option>)}</select> : <div className="ro"><b>{po.sup || '—'}</b></div>}</div>
        <div className="fld"><label>{t('lpTo')}</label>{can ? <select data-pof2="deliverTo" defaultValue={po.deliverTo}>{LPLOC.map(x => <option key={x[0]} value={x[0]}>{lang === 'ar' ? x[2] : x[1]}</option>)}</select> : <div className="ro">{nm(LPLOC, po.deliverTo)}</div>}</div>
        <div className="fld"><label>{t('lpNeed')}{' '}<span style={css('color:var(--fk-danger)')}>*</span></label>{can ? <input type="date" data-pof2="need" className={M.need ? 'miss' : ''} defaultValue={po.need || ''} /> : <div className="ro">{po.need ? dd(po.need) : '—'}</div>}</div>
        <div className="fld"><label>{t('lpTerms')}</label><div className="ro">{schedTxt(S)}</div></div>
        <div className="fld" style={css('grid-column:1/-1')}><label>{t('lpNotes')}</label>{can ? <input dir="auto" data-pof2="notes" defaultValue={po.notes || ''} /> : <div className="ro">{po.notes || '—'}</div>}</div></div></div>
    <div className="card" style={css('padding:0')}><div style={css('padding:14px 18px 8px')} className="controls"><h3 className="sec" style={css('margin:0')}>{t('items')}</h3><span className="sp"></span>{can ? <><input id="poadd" list="podl" placeholder={`+ ${t('lpAddLine')}`} style={css('min-width:280px')} /><datalist id="podl">{opts}</datalist></> : null}</div>
      <div className="tbl-wrap" style={css('border:0;border-radius:0;max-height:none')}><table><thead><tr><th>#</th><th>{t('lpItem')}</th><th>{t('lpUnit')}</th><th className="n">{t('lpQty')}</th><th className="n">{t('lpPrice')}</th><th className="n">{t('lpLine')}</th>{draft ? null : <th className="n">{t('lpRecv')}</th>}<th></th></tr></thead><tbody>
        {(po.lines || []).length ? (po.lines || []).map((l, i) => <tr key={i} className={!draft && R[i] >= (+l.qty || 0) ? 'r-ok' : ''}><td>{i + 1}</td><td>{can ? <input dir="auto" data-pol={i} data-plf="name" defaultValue={l.name || ''} style={css('width:100%;min-width:220px')} /> : <b>{l.name || ''}</b>}</td><td>{U(l.unit) || l.unit || ''}</td>
          <td className="n">{can ? <input type="number" min="0" step="any" className={`num ${M.lines[i].qty ? 'miss' : ''}`} data-pol={i} data-plf="qty" defaultValue={s0(l.qty)} /> : fmt(+l.qty || 0, (+l.qty || 0) % 1 ? 2 : 0)}</td>
          <td className="n">{can ? <input type="number" min="0" step="any" className={`num ${M.lines[i].price ? 'miss' : ''}`} data-pol={i} data-plf="price" defaultValue={s0(l.price)} /> : fmt(+l.price || 0, 2)}</td>
          <td className="n"><b>{fmt((+l.qty || 0) * (+l.price || 0), 2)}</b></td>{draft ? null : <td className="n">{fmt(R[i], R[i] % 1 ? 2 : 0)}</td>}<td>{can ? <button className="btn btn-ok" data-poldel={i}>✕</button> : null}</td></tr>) : <tr><td colSpan={8} className="empty">—</td></tr>}
      </tbody><tfoot><tr><td colSpan={5} className="n">{t('lpSub')}</td><td className="n">{fmt(T2.sub, 2)}</td><td colSpan={2}></td></tr><tr><td colSpan={5} className="n">{t('lpVat')}</td><td className="n">{fmt(T2.vat, 2)}</td><td colSpan={2}></td></tr><tr><td colSpan={5} className="n"><b>{t('lpTot')}</b></td><td className="n"><b>{`AED ${fmt(T2.tot, 2)}`}</b></td><td colSpan={2}></td></tr></tfoot></table></div></div>
    {can ? <div className="card"><div className="controls">{M.any ? <span className="hint" style={css('color:var(--fk-danger)')}>{t('lpFix')}</span> : null}<span className="sp"></span><button className="btn" data-act="pocancel">{t('lpCancel')}</button><button className="btn btn-accent" data-act="poissue" style={css('min-height:42px;padding:8px 18px')}>{t('lpIssue')}</button></div></div> : null}
  </>;
}

export function vLpoDoc(id) {
  const po = Object.assign({ id }, rec('POs', id)); const T2 = poTot(po), S = supByName(po.sup) || {};
  return <>
    <div className="controls no-print"><button className="btn" data-act="podocback">{`${lang === 'ar' ? '→' : '←'} ${s0(po.no)}`}</button><span className="sp"></span><button className="btn" data-act="tshare" data-name={po.no || 'LPO'}>{t('shBtn')}</button><button className="btn btn-primary" data-act="tprint">{t('tPrint')}</button></div>
    <div className="card bill" id="bill"><div className="controls" style={css('align-items:flex-start')}><div><div className="bill-mark">Forka</div><div className="bill-rule"></div><div className="hint">Forka Collective Investment</div></div><span className="sp"></span>
      <div style={css('text-align:end')}><h2 style={css('margin:0;font-size:24px')}>{t('lpTitle')}</h2><div className="hint">{t('lpTitleAr')}</div></div></div>
      <div className="bill-meta"><div><div className="hint">{t('lpNo')}</div><b className="docno" dir="ltr">{po.no}</b></div><div><div className="hint">{t('lpDate')}</div><b>{dd(po.issAt || po.date)}</b></div><div><div className="hint">{t('lpNeed')}</div><b>{po.need ? dd(po.need) : '—'}</b></div><div><div className="hint">{t('lpTerms')}</div><b>{schedTxt(S)}</b></div></div>
      <div className="grid" style={css('grid-template-columns:1fr 1fr;gap:20px;margin-bottom:14px')}><div><div className="hint">{t('supplier')}</div><b>{po.sup || ''}</b><div className="hint" style={css('white-space:normal')}>{[S.contact, S.phone, S.email, S.trn ? t('lpTrn') + ' ' + S.trn : ''].filter(Boolean).map(s0).join(' · ')}</div></div><div><div className="hint">{t('lpTo')}</div><b>{nm(LPLOC, po.deliverTo)}</b></div></div>
      <table className="bill-t"><thead><tr><th>#</th><th>{t('lpItem')}</th><th>{t('lpUnit')}</th><th className="n">{t('lpQty')}</th><th className="n">{t('lpPrice')}</th><th className="n">{`${t('lpLine')} AED`}</th></tr></thead><tbody>
        {(po.lines || []).map((l, i) => <tr key={i}><td>{i + 1}</td><td>{l.name || ''}</td><td>{U(l.unit) || l.unit || ''}</td><td className="n">{fmt(+l.qty || 0, (+l.qty || 0) % 1 ? 2 : 0)}</td><td className="n">{fmt(+l.price || 0, 2)}</td><td className="n">{fmt((+l.qty || 0) * (+l.price || 0), 2)}</td></tr>)}
      </tbody><tfoot><tr><td colSpan={5} className="n">{t('lpSub')}</td><td className="n">{fmt(T2.sub, 2)}</td></tr><tr><td colSpan={5} className="n" style={css('border-top:0')}>{t('lpVat')}</td><td className="n" style={css('border-top:0')}>{fmt(T2.vat, 2)}</td></tr><tr><td colSpan={5} className="n"><b>{t('lpTot')}</b></td><td className="n"><b>{`AED ${fmt(T2.tot, 2)}`}</b></td></tr></tfoot></table>
      {po.notes ? <p style={css('margin:12px 0 0;font-size:13px')}>{po.notes}</p> : null}
      <p className="hint" style={css('white-space:normal;margin-top:12px')}>{t('lpRule')}</p>
      <div className="grid" style={css('grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:30px')}><div><div className="hint">{t('lpPrep')}</div><b>{po.issBy || po.by || ''}</b><div className="sigline"></div></div><div><div className="hint">{t('lpAppr')}</div><b>{po.apprBy || ''}</b><div className="sigline"></div></div><div><div className="hint">{t('lpSupSign')}</div><b>{' '}</b><div className="sigline"></div></div></div></div>
  </>;
}

export function vGrnDoc(id) {
  const g = Object.assign({ id }, rec('GRN', id)); const L = grnLines(g), T2 = grnTot(g), S = supByName(g.sup) || {}, oc = grnOutcome(g);
  const yes = v => v === 'yes' ? t('yes') : v === 'no' ? t('no') : '—'; const z = { chilled: t('zChill'), frozen: t('zFroz'), dry: t('zDry') }[g.tz] || '—';
  return <>
    <div className="controls no-print"><button className="btn" data-act="gdocback">{`${lang === 'ar' ? '→' : '←'} ${s0(g.no || id)}`}</button><span className="sp"></span><button className="btn" data-act="tshare" data-name={s0(g.no || id)}>{t('shBtn')}</button><button className="btn btn-primary" data-act="tprint">{t('tPrint')}</button></div>
    <div className="card bill" id="bill"><div className="controls" style={css('align-items:flex-start')}><div><div className="bill-mark">Forka</div><div className="bill-rule"></div><div className="hint">Forka Collective Investment</div></div><span className="sp"></span>
      <div style={css('text-align:end')}><h2 style={css('margin:0;font-size:24px')}>{t('gDocT')}</h2><div className="hint">{t('gDocTAr')}</div></div></div>
      <div className="bill-meta"><div><div className="hint">{t('gDocNo')}</div><b className="docno" dir="ltr">{g.no || id}</b></div><div><div className="hint">{t('lpDate')}</div><b>{dd(g.date)}{g.time ? <>{' · '}<span className="docno" dir="ltr">{g.time}</span></> : null}</b></div><div><div className="hint">{t('gPo')}</div><b>{g.po || '—'}</b></div><div><div className="hint">{t('gInv')}</div><b>{g.inv || '—'}</b></div></div>
      <div className="grid" style={css('grid-template-columns:1fr 1fr;gap:20px;margin-bottom:14px')}><div><div className="hint">{t('supplier')}</div><b>{g.sup || ''}</b><div className="hint" style={css('white-space:normal')}>{[S.contact, S.phone, S.trn ? t('lpTrn') + ' ' + S.trn : ''].filter(Boolean).map(s0).join(' · ')}</div></div>
        <div><div className="hint">{t('lpTo')}</div><b>{OMAN() ? nm(LPLOC, 'oman') : g.loc ? nm(LPLOC, g.loc) : nm(LPLOC, 'ajman')}</b><div className="hint" style={css('white-space:normal')}>{`${t('gDn')}: ${g.dn || '—'} · ${t('gZone')}: ${z} · ${t('gTemp')}: ${g.temp !== '' && g.temp != null ? s0(g.temp) + ' °C' : '—'} · ${t('gClean')} ${yes(g.clean)}`}</div></div></div>
      <table className="bill-t"><thead><tr><th>#</th><th>{t('lpItem')}</th><th>{t('lpUnit')}</th><th className="n">{t('gOrd')}</th><th className="n">{t('gRecv')}</th><th className="n">{t('gRej')}</th><th className="n">{t('gAcc')}</th><th className="n">{t('lpPrice')}</th><th className="n">{`${t('lpLine')} AED`}</th></tr></thead><tbody>
        {L.length ? L.map((l, i) => {
          const acc = Math.max(0, (+l.recv || 0) - (+l.rej || 0)); const q = v => v == null || v === '' ? '—' : fmt(+v, (+v) % 1 ? 2 : 0);
          return <tr key={i}><td>{i + 1}</td><td>{l.name || ''}{l.reason ? <div className="hint" style={css('white-space:normal')}>{l.reason}</div> : null}{l.exp ? <div className="hint">{`${t('gExp')} ${l.exp}`}</div> : null}</td><td>{U(l.u) || l.u || ''}</td><td className="n">{q(l.ord)}</td><td className="n">{q(l.recv)}</td><td className="n">{q(l.rej)}</td><td className="n"><b>{fmt(acc, acc % 1 ? 2 : 0)}</b></td><td className="n">{l.price ? fmt(+l.price, 2) : '—'}</td><td className="n">{fmt(acc * (+l.price || 0), 2)}</td></tr>;
        }) : <tr><td colSpan={9} className="hint">{t('gNoLines')}</td></tr>}
      </tbody><tfoot><tr><td colSpan={8} className="n"><b>{t('gValue')}</b></td><td className="n"><b>{`AED ${fmt(T2.val, 2)}`}</b></td></tr></tfoot></table>
      {oc ? <p style={css('margin:12px 0 0;font-size:13px')}>{`${t('gDocResult')}: `}<b>{t('o_' + oc)}</b></p> : null}{g.note ? <p style={css('margin:8px 0 0;font-size:13px')}>{g.note}</p> : null}
      <p className="hint" style={css('white-space:normal;margin-top:12px')}>{t('gDocRule')}</p>
      <div className="grid" style={css('grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:30px')}><div><div className="hint">{t('gBy')}</div><b>{g.by || ''}</b><div className="sigline"></div></div><div><div className="hint">{t('gDocDriver')}</div><b>{' '}</b><div className="sigline"></div></div><div><div className="hint">{t('gOrderedBy')}</div><b>{g.orderedBy || ''}</b><div className="sigline"></div></div></div></div>
  </>;
}

export function vMoves() {
  const all = moves(); const months = [...new Set(all.map(m => m.d.slice(0, 7)).filter(Boolean))].sort().reverse(); const mo = mvF.m || months[0] || '';
  let M = all.filter(m => !mo || m.d.slice(0, 7) === mo); const q = mvF.q.trim().toLowerCase(); if (q) M = M.filter(m => (m.name || '').toLowerCase().includes(q) || (m.ref || '').toLowerCase().includes(q) || (m.who || '').toLowerCase().includes(q));
  const inV = M.filter(m => m.dir === 'in').reduce((a, m) => a + m.v, 0), outV = M.filter(m => m.dir === 'out').reduce((a, m) => a + m.v, 0);
  const byBr = BRANCHES.map(b => [b[0], M.filter(m => m.br === b[0]).reduce((a, m) => a + m.v, 0)]);
  return <>
    {banner()}<div className="card"><div className="controls"><div><h2 style={css('margin:0')}>{t('moves')}</h2><p style={css('color:var(--fk-muted);font-size:12px;margin:4px 0 0')}>{t('movesH')}</p></div><span className="sp"></span>
      <select id="mvm" defaultValue={months.length ? mo : undefined}>{months.length ? months.map(m => <option key={m}>{m}</option>) : <option>—</option>}</select><input id="mvq" defaultValue={s0(mvF.q)} placeholder={t('search')} style={css('width:180px')} /></div></div>
    <div className="grid kpis"><div className="card stat"><div className="lbl">{t('mvIn')}</div><div className="num">{fmt(inV)}<small>AED</small></div></div><div className="card stat"><div className="lbl">{t('mvOut')}</div><div className="num">{fmt(outV)}<small>AED</small></div></div>
      {byBr.map(([b, v]) => <div className="card stat" key={b}><div className="lbl">{brName(b)}</div><div className="num" style={css('font-size:22px')}>{fmt(v)}<small>AED</small></div><div className="hint">{t('mvAtCost')}</div></div>)}</div>
    <div className="tbl-wrap"><table><thead><tr><th>{t('evDate')}</th><th>{t('mvRef')}</th><th>{t('mvFromTo')}</th><th>{t('item')}</th><th className="n">{t('mvQty')}</th><th>{t('tUnit')}</th><th className="n">AED</th></tr></thead><tbody>
      {M.length ? M.map((m, i) => <tr key={i} className={m.dir === 'in' ? 'r-ok' : ''}><td>{m.d}</td><td><b>{m.ref}</b></td><td><span className={`dir dir-${m.dir}`}>{t(m.dir === 'in' ? 'mvInL' : 'mvOutL')}</span>{' '}{m.who}</td><td>{m.name || ''}</td><td className="n" style={css(`color:var(--fk-${m.dir === 'in' ? 'success' : 'danger'})`)}><b>{`${m.dir === 'in' ? '+' : '−'}${fmt(m.q, m.q % 1 ? 2 : 0)}`}</b></td><td>{U(m.u) || ''}</td><td className="n">{fmt(m.v, 2)}</td></tr>) : <tr><td colSpan={7} className="empty">{t('mvNone')}</td></tr>}</tbody></table></div>
  </>;
}
