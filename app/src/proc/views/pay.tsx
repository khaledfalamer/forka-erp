/* Procurement screens, group "pay": home, requests (store issue), bill, payments, statement of account,
   notifications, CEO approvals, people and access, activity. Moved from Forka-Procurment/index.html unchanged. */
import {
  lines, recs, status, stockState, suppliers, missingS, calc, grnStatus, fmt, lang, side, t, stockVal,
  billOpen, reqOpen, tDone, reqF, SHEET, editMode, roleNow, OMAN, BRANCHES, brName, tLines, line, dd, rec, tCan, U, me,
  issueAsk, grnOpen, payRows, payF, supAgg, schedTxt, daysTo, notes, grnTot, soaSup, soaAsk, __set, rqOpenId, apF, nm,
  DEPTS, rqApprCount, peopleList, ppDraft, SIDEK, ALERTK, ACT, OUTBOX,
} from '../core';
import { css, Fragment } from '../ui';
import { banner } from './shell';
import { vGRNForm } from './recv';
import { vRqDetail, rqKindTag, rqBadge } from './req';


export function vHome(){const L=lines(),T=recs('Transfers'),G=recs('GRN');
  const miss=L.filter(l=>status(l)==='missing').length,below=L.filter(l=>stockState(l)==='below').length,order=L.filter(l=>stockState(l)==='order').length;
  const supMiss=suppliers().filter(x=>missingS(x).length).length,budget=L.reduce((a,l)=>a+calc(l).v,0);
  const c=st=>T.filter(x=>(x.status||'draft')===st).length,gh=G.filter(g=>['hold','ready'].includes(grnStatus(g))).length;
  const bd=(n,l,cls)=>n?<span className={`badge ${cls}`}>{`${fmt(n)} ${l}`}</span>:null;
  const row=(sd,tb,title,desc,badges)=><button key={tb} className="ov-row" data-go={`${sd}:${tb}`}><span className="ov-main"><span className="ov-t">{title}</span><span className="ov-d">{desc}</span></span><span className="ov-b">{badges}</span><span className="ov-arrow">{lang==='ar'?'←':'→'}</span></button>;
  const col=(sd,title,h,rows)=><section className={`ov-col ${side===sd?'ov-on':''}`}><div className="ov-head"><h2>{title}</h2><p>{h}</p></div><div className="ov-list">{rows}</div></section>;
  return <>{banner()}<div className={`ov-grid ${side==='ops'?'ops-first':''}`}>
   {col('plan',t('sidePlan'),t('sidePlanH'),[
     row('plan','fill',t('fill'),t('dFill'),<>{bd(miss,t('hMissing'),'b-bad')}{bd(below,t('hBelow'),'b-warn')}{bd(order,t('hOrder'),'b-mute')}<span className="badge b-mute">{`AED ${fmt(stockVal(L).v)} ${t('hStock')}`}</span></>),
     row('plan','sups',t('sups'),t('dSups'),bd(supMiss,t('hSupMissing'),'b-warn')),
     row('plan','ana',t('ana'),t('dAna'),null),
     row('plan','sum',t('sum'),t('dSum'),<span className="badge b-mute">{`AED ${fmt(budget)} ${t('hBudget')}`}</span>)])}
   {col('ops',t('sideOps'),t('sideOpsH'),[
     row('ops','grn',t('aGrn'),t('dGrn'),bd(gh,t('hGrnOpen'),'b-warn')),
     row('ops','req',t('req'),t('dReq'),<>{bd(c('requested'),t('hToApprove'),'b-warn')}{bd(c('approved'),t('hToIssue'),'b-warn')}{bd(c('issued'),t('hToConfirm'),'b-mute')}</>),
     row('ops','moves',t('moves'),t('dMoves'),null)])}</div></>}

export function vReq(){if(billOpen)return vBill(billOpen);if(reqOpen)return vReqForm(reqOpen);
  let T=recs('Transfers').sort((a,b)=>((b.date||'')+(b.no||''))>((a.date||'')+(a.no||''))?1:-1);
  const done=x=>tDone(x)?'issued':'draft';const cnt=s=>T.filter(x=>done(x)===s).length;
  let R=T;if(reqF.st)R=R.filter(x=>done(x)===reqF.st);if(reqF.br)R=R.filter(x=>x.branch===reqF.br);
  const canNew=(!SHEET||editMode)&&['admin','team','store'].includes(roleNow());
  return <>{banner()}<div className="card"><div className="controls"><div><h2 style={css('margin:0')}>{t(OMAN()?'omReq':'req')}</h2><p style={css('color:var(--fk-muted);font-size:12.5px;margin:4px 0 0;max-width:640px')}>{t(OMAN()?'omReqH':'reqH')}</p></div><span className="sp"></span>{canNew?<button className="btn btn-primary" data-act="tnew">{`+ ${t('tNew')}`}</button>:null}</div></div>
  <div className="controls"><div className="chips">{[['',t('all')],['draft',t('tsDraft')],['issued',t('tsIssued')]].map(([k,l])=><button key={k} className={`chip ${reqF.st===k?'on':''}`} data-rst={k}>{`${l}${k&&cnt(k)?' · '+cnt(k):''}`}</button>)}</div><span className="sp"></span>
   <select id="rbr" defaultValue={reqF.br||''}><option value="">{t('allBranches')}</option>{BRANCHES.map(b=><option key={b[0]} value={b[0]}>{brName(b[0])}</option>)}</select></div>
  <div className="card">{R.length?<div className="list">{R.map(x=>{const L=tLines(x),v=L.reduce((a,l)=>a+(+l.iss||0)*(tDone(x)?+l.price||0:+line(l.item).p||0),0),d=tDone(x);
    return <div key={x.id} className="li" style={css('cursor:pointer')} data-topen={x.id}><div className="grow"><b>{x.no||x.id}</b>{` · ${brName(x.branch)}`}<div style={css('font-size:12px;color:var(--fk-muted)')}>{`${dd(d?x.issAt:x.date)} · ${L.length} ${t('items')}${x.issBy||x.reqBy?' · '+(x.issBy||x.reqBy):''}`}</div></div>{v?<b>{`AED ${fmt(v,2)}`}</b>:null}<span className={`badge ${d?'b-ok':'b-mute'}`}>{t(d?'tsIssued':'tsDraft')}</span></div>})}</div>:<div className="empty">{t('tNone')}</div>}</div></>}

export function vReqForm(id){const x=Object.assign({id},rec('Transfers',id)),d=tDone(x),L=tLines(x),c=tCan(x);
  const opts=lines().filter(l=>l.n).map(l=><option key={l.id} value={`${l.n} · ${U(l.u)||''} [${l.id}]`}></option>);
  const price=l=>d?+l.price||0:+line(l.item).p||0;const tot=L.reduce((a,l)=>a+(+l.iss||0)*price(l),0);
  const over=!d&&L.some(l=>+l.iss>(+line(l.item).st||0));
  return <>{banner()}<div className="controls"><button className="btn" data-act="tback">{`${lang==='ar'?'→':'←'} ${t('req')}`}</button><span className="sp"></span>{d?<><button className="btn btn-primary" data-act="tbill" data-tid={id}>{t('tOpenBill')}</button><button className="btn" data-act="tbillgo" data-go="print" data-tid={id}>{t('tPrint')}</button><button className="btn" data-act="tbillgo" data-go="share" data-tid={id}>{t('shBtn')}</button></>:null}<span className={`badge ${d?'b-ok':'b-mute'}`}>{t(d?'tsIssued':'tsDraft')}</span></div>
  <div className="card"><h2 style={css('font-size:24px')}>{x.no||id}</h2><div style={css('color:var(--fk-muted);font-size:13px')}>{`${t(OMAN()?'tFromOm':'tFrom')} → `}<b>{brName(x.branch)}</b></div>
   <div className="form" style={css('margin-top:12px')}>
    <div className="fld"><label>{`${t('branch')} `}<span style={css('color:var(--fk-danger)')}>*</span></label>{c?<select className={x.branch?'':'miss'} data-tk="branch" data-tid={id} defaultValue={x.branch||''}><option value="">{t('choose')}</option>{BRANCHES.map(b=><option key={b[0]} value={b[0]}>{brName(b[0])}</option>)}</select>:<div className="ro">{brName(x.branch)}</div>}</div>
    <div className="fld"><label>{t('tDate')}</label><div className="ro">{dd(d?x.issAt:x.date)}</div></div>
    <div className="fld"><label>{t('tIssBy')}</label><div className="ro">{x.issBy||me||'—'}</div></div></div>
   <div className="fld" style={css('margin-top:10px')}><label>{t('snotes')}</label>{c?<input dir="auto" data-tk="note" data-tid={id} defaultValue={x.note||''}/>:<div className="ro">{x.note||'—'}</div>}</div></div>
  <div className="card" style={css('padding:0')}><div style={css('padding:14px 18px 8px')} className="controls"><h3 className="sec" style={css('margin:0')}>{t('tLines')}</h3><span className="sp"></span>
   {c?<><input id="tadd" data-tid={id} list="tdl" placeholder={`+ ${t('tAddItem')}`} style={css('min-width:300px')}/><datalist id="tdl">{opts}</datalist></>:null}</div>
   <div className="tbl-wrap" style={css('border:0;border-radius:0;max-height:none')}><table><thead><tr><th>#</th><th>{t('item')}</th><th>{t('tUnit')}</th>{d?null:<th className="n">{t('tInStore')}</th>}<th className="n">{t('tQty')}</th><th className="n">{t('tCost')}</th><th className="n">{t('tValue')}</th><th>{t('snotes')}</th><th></th></tr></thead><tbody>
   {L.length?L.map((l,i)=>{const it=line(l.item),stk=+it.st||0;const ov=!d&&+l.iss>stk;
     return <tr key={i} className={ov?'r-miss':''}><td>{i+1}</td><td><b>{l.name||it.n||''}</b></td><td>{U(l.u||it.u)||''}</td>
      {d?null:<td className="n">{fmt(stk,stk%1?2:0)}</td>}
      <td className="n">{c?<input className={`num ${+l.iss>0?'':'miss'}`} type="number" min="0" step="any" style={css('width:90px')} data-tl={i} data-tid={id} data-tlf="iss" defaultValue={l.iss??''}/>:fmt(+l.iss||0,(+l.iss||0)%1?2:0)}</td>
      <td className="n">{fmt(price(l),2)}</td><td className="n"><b>{fmt((+l.iss||0)*price(l),2)}</b></td>
      <td>{c?<input dir="auto" style={css('width:160px')} data-tl={i} data-tid={id} data-tlf="snote" defaultValue={l.snote||''}/>:(l.snote||'')}</td>
      <td>{c?<button className="btn btn-ok" data-act="tdel" data-tid={id} data-i={i}>✕</button>:null}</td></tr>}):<tr><td colSpan={9} className="empty">{t('tNoLines')}</td></tr>}
   </tbody></table></div>
   <div style={css('padding:12px 18px;display:flex;gap:16px;flex-wrap:wrap;font-size:13px')}><span>{`${t('items')}: `}<b>{L.length}</b></span><span>{`${t('tTotal')}: `}<b>{`AED ${fmt(tot,2)}`}</b></span></div></div>
  {over?<div className="banner bn-warn">{t('tOver')}</div>:null}
  {c?<div className="card"><div className="controls"><div className="hint" style={css('white-space:normal;font-size:12.5px')}>{t('tRule')}</div><span className="sp"></span><button className="btn" data-act="tstatus" data-tid={id} data-v="delete">{t('tDelDraft')}</button>{issueAsk===id?null:<button className="btn btn-accent" data-act="tstatus" data-tid={id} data-v="issued">{t('tIssue')}</button>}</div>
   {issueAsk===id?<div className="banner bn-warn" style={css('margin-top:12px')}><span>{t('tIssueQ')}</span><span className="sp"></span><button className="btn" data-act="tnoissue">{t('cancelS')}</button><button className="btn btn-accent" data-act="tstatus" data-tid={id} data-v="issued">{t('tIssue')}</button></div>:null}</div>:null}</>}

export function vBill(id){const x=Object.assign({id},rec('Transfers',id)),L=tLines(x).filter(l=>+l.iss>0);
  const tot=L.reduce((a,l)=>a+(+l.iss||0)*(+l.price||0),0);
  return <><div className="controls no-print"><button className="btn" data-act="tbillback">{`${lang==='ar'?'→':'←'} ${x.no||''}`}</button><span className="sp"></span><button className="btn" data-act="tshare" data-name={x.no||'TN'}>{t('shBtn')}</button><button className="btn btn-primary" data-act="tprint">{t('tPrint')}</button></div>
  <div className="card bill" id="bill"><div className="controls" style={css('align-items:flex-start')}><div><div className="bill-mark">Forka</div><div className="bill-rule"></div><div className="hint">{t(OMAN()?'tFromOm':'tFrom')}</div></div><span className="sp"></span>
   <div style={css('text-align:end')}><h2 style={css('margin:0;font-size:24px')}>{t('tBillT')}</h2><div className="hint">{lang==='ar'?'Store Issue Bill':'إذن صرف مخزني'}</div></div></div>
   <div className="bill-meta"><div><div className="hint">{t('tBillNo')}</div><b className="docno" dir="ltr">{x.no||''}</b></div><div><div className="hint">{t('tDate')}</div><b>{dd(x.issAt||x.date)}</b></div><div><div className="hint">{t('tTo')}</div><b>{brName(x.branch)}</b></div><div><div className="hint">{t('tIssBy')}</div><b>{x.issBy||'—'}</b></div></div>
   {x.note?<p style={css('margin:0 0 12px;font-size:13px')}>{x.note}</p>:null}
   <table className="bill-t"><thead><tr><th>#</th><th>{t('item')}</th><th>{t('tUnit')}</th><th className="n">{t('tQty')}</th><th className="n">{t('tCost')}</th><th className="n">{`${t('tValue')} AED`}</th></tr></thead><tbody>
   {L.map((l,i)=><tr key={i}><td>{i+1}</td><td>{l.name||line(l.item).n||''}{l.snote?<div className="hint" style={css('white-space:normal')}>{l.snote}</div>:null}</td><td>{U(l.u)||''}</td><td className="n">{fmt(+l.iss||0,(+l.iss||0)%1?2:0)}</td><td className="n">{fmt(+l.price||0,2)}</td><td className="n">{fmt((+l.iss||0)*(+l.price||0),2)}</td></tr>)}
   </tbody><tfoot><tr><td colSpan={5} className="n"><b>{t('tTotal')}</b></td><td className="n"><b>{fmt(tot,2)}</b></td></tr></tfoot></table>
   <p className="hint" style={css('white-space:normal;margin-top:10px')}>{t('tBillNote')}</p>
   <div className="grid" style={css('grid-template-columns:1fr 1fr;gap:32px;margin-top:34px')}><div><div className="hint">{t('tIssBy')}</div><div className="sigline"></div><div className="hint">{t('tSign')}</div></div><div><div className="hint">{`${t('tRcvBy')} · ${brName(x.branch)}`}</div><div className="sigline"></div><div className="hint">{t('tSign')}</div></div></div></div></>}

export function vPay(){if(grnOpen)return vGRNForm(grnOpen);
  const all=payRows(),mo=new Date().toISOString().slice(0,7);
  const grp={topay:all.filter(r=>r.st==='ready'),hold:all.filter(r=>r.st==='hold'),paid:all.filter(r=>r.st==='paid')};
  const sum=a=>a.reduce((x,r)=>x+r.val,0);const paidMo=grp.paid.filter(r=>(r.g.paidAt||'').slice(0,7)===mo);
  let R=payF.st==='all'?all:grp[payF.st]||[];if(OMAN()&&payF.from)R=R.filter(r=>(r.S.payFrom||'')===payF.from);if(payF.sup)R=R.filter(r=>r.g.sup===payF.sup);const q=payF.q.trim().toLowerCase();if(q)R=R.filter(r=>[r.g.no,r.g.sup,r.g.inv,r.g.po].some(v=>String(v||'').toLowerCase().includes(q)));
  R.sort((a,b)=>(a.st==='paid')-(b.st==='paid')||(a.due||'').localeCompare(b.due||''));
  const sups=[...new Set(all.map(r=>r.g.sup).filter(Boolean))].sort();
  const bySup={};grp.topay.forEach(r=>{const k=r.g.sup||'—';bySup[k]=bySup[k]||{n:k,v:0,c:0,over:0,S:r.S};bySup[k].v+=r.val;bySup[k].c++;if(r.over)bySup[k].over++});
  const BS=Object.values(bySup).sort((a:any,b:any)=>b.v-a.v) as any[];
  const kpi=(k,l,v,n,col,hint=null)=><button className="card stat" data-pst={k} style={css(`text-align:start;cursor:pointer;font-family:inherit;${payF.st===k?'border-color:var(--fk-bronze);box-shadow:0 0 0 1px var(--fk-bronze)':''}`)}><div className="lbl">{l}</div><div className="num" style={css(col?'color:'+col:'')}>{fmt(v,0)}<small>AED</small></div><div className="hint">{`${n} ${t('grnList')}`}{hint}</div></button>;
  const over=grp.topay.filter(r=>r.over);
  const A=(Object.values(supAgg()) as any[]).filter(a=>a.next).sort((a,b)=>a.next.localeCompare(b.next));
  return <>{banner()}<div className="card"><h2 style={css('margin:0')}>{t('pay')}</h2><p style={css('color:var(--fk-muted);font-size:12.5px;margin:4px 0 0;max-width:720px')}>{t('payH')}</p></div>
  <div className="grid kpis">{kpi('topay',t('pToPay'),sum(grp.topay),grp.topay.length,'',over.length?<>{' · '}<span style={css('color:var(--fk-danger);font-weight:600')}>{`${over.length} ${t('pOverdue')}`}</span></>:null)}{kpi('hold',t('pHold'),sum(grp.hold),grp.hold.length,'var(--fk-warning)')}{kpi('paid',t('pPaid')+' · '+t('pThisMonth'),sum(paidMo),paidMo.length,'var(--fk-success)')}</div>
  <div className="grid" style={css('grid-template-columns:minmax(0,1fr) 330px;align-items:start')}><div style={css('display:none')}>{'\n'}</div>
   <div style={css('display:flex;flex-direction:column;gap:10px;min-width:0')}><div className="controls"><div className="chips">{[['topay',t('pToPay')],['hold',t('pHold')],['paid',t('pPaid')],['all',t('all')]].map(([k,l])=><button key={k} className={`chip ${payF.st===k?'on':''}`} data-pst={k}>{l}</button>)}</div>{OMAN()?<div className="chips">{[['',t('pFromAll')],['uae',t('payFromUae')],['oman',t('payFromOman')]].map(([k,l])=><button key={k} className={`chip ${(payF.from||'')===k?'on':''}`} data-pfrom={k}>{l}</button>)}</div>:null}<span className="sp"></span>
    <select id="psup" defaultValue={payF.sup||''}><option value="">{t('pAllSup')}</option>{sups.map(n=><option key={n}>{n}</option>)}</select><input id="pq" defaultValue={payF.q} placeholder={t('search')} style={css('width:170px')}/></div>
   <div className="tbl-wrap"><table><thead><tr><th>{t('grnList')}</th><th>{t('supplier')}</th><th>{t('gInv')}</th><th>{t('pRecv')}</th><th>{t('pTerms')}</th><th>{t('pDue')}</th><th className="n">AED</th><th>{t('status')}</th><th></th></tr></thead><tbody>
   {R.length?R.map(r=>{const g=r.g,b=r.st==='paid'?['b-ok',t('pPaid')]:r.st==='ready'?(r.over?['b-bad',t('pOverdue')]:['b-warn',t('pToPay')]):['b-mute',t('pHold')];
     return <tr key={g.id} className={r.over?'r-miss':r.st==='ready'?'r-due':r.st==='paid'?'r-ok':''}><td style={css('white-space:nowrap')}><b>{g.no||g.id}</b>{g.po?<div className="hint">{`PO ${g.po}`}</div>:null}</td><td>{g.sup||'—'}{OMAN()?<div className="hint">{`${t('payFrom')}: ${r.S.payFrom==='uae'?t('payFromUae'):r.S.payFrom==='oman'?t('payFromOman'):'—'}`}</div>:null}<div className="hint">{r.S.iban?t('pIban')+' '+r.S.iban:r.cr?<span style={css('color:var(--fk-warning)')}>{t('pNoIban')}</span>:null}</div></td><td style={css('white-space:nowrap')}>{g.inv||'—'}</td><td style={css('white-space:nowrap')}>{dd(g.date)}</td>
      <td>{schedTxt(r.S)}</td><td style={css(`white-space:nowrap;${r.over?'color:var(--fk-danger);font-weight:600':''}`)}>{r.st==='paid'?<span className="hint">{`${t('pPaid')} ${dd(g.paidAt)}${g.paidBy?' · '+g.paidBy:''}`}</span>:(r.due||'—')}</td>
      <td className="n"><b>{fmt(r.val,2)}</b></td><td><span className={`badge ${b[0]}`}>{b[1]}</span>{r.st==='hold'?<div className="hint" style={css('white-space:normal')}>{`${t('pHoldWhy')}: ${r.miss.map(k=>t('c_'+k)).join(', ')}`}</div>:null}</td>
      <td style={css('white-space:nowrap')}><button className="btn btn-sm" data-gopen={g.id}>{t('pOpen')}</button>{' '}{r.st==='ready'&&(!SHEET||editMode)?<button className="btn btn-sm btn-primary" data-act="gstatus" data-rid={g.id} data-v="paid">{t('pPayBtn')}</button>:null}</td></tr>}):<tr><td colSpan={9} className="empty">{t('pNone')}</td></tr>}
   </tbody>{R.length?<tfoot><tr><td colSpan={6} className="n"><b>{t('tTotal').split(' ')[0]}</b></td><td className="n"><b>{fmt(sum(R),2)}</b></td><td colSpan={2}></td></tr></tfoot>:null}</table></div></div>
   <div className="card"><h3 className="sec">{t('nNext')}</h3>{A.length?<div className="list">{A.map(a=><div key={a.n} className="li" style={css('cursor:pointer')} data-soa={a.n}><div className="grow"><b>{a.n}</b><div className="hint">{`${a.next} · `}{whenTxt(a.next)}{` · ${a.nextN} ${t('nBills')}`}</div></div><b>{fmt(a.nextAmt,0)}</b></div>)}</div>:<div className="empty" style={css('padding:14px')}>{t('pNone')}</div>}</div>
   <div className="card" style={css('display:none')}><h3 className="sec">{t('pBySup')}</h3>{BS.length?<div className="list">{BS.map(x=><div key={x.n} className="li" style={css('cursor:pointer')} data-psup={x.n}><div className="grow"><b>{x.n}</b><div className="hint">{`${x.c} ${t('grnList')}`}{x.over?<>{' · '}<span style={css('color:var(--fk-danger)')}>{`${x.over} ${t('pOverdue')}`}</span></>:null}</div></div><b>{fmt(x.v,0)}</b></div>)}</div>:<div className="empty" style={css('padding:14px')}>{t('pNone')}</div>}</div></div></>}

export function whenTxt(d){const n=daysTo(d);return n<0?<span style={css('color:var(--fk-danger);font-weight:600')}>{`${-n} ${t('nDays')} ${t('nOver')}`}</span>:n===0?<b style={css('color:var(--fk-warning)')}>{t('nToday')}</b>:`${t('nIn')} ${n} ${t('nDays')}`}

export function notifPanel(){const N=notes();const sum=N.due.reduce((x,a)=>x+a.nextAmt,0);
  return <div className="notif" id="notif"><div className="nhd"><b>{t('nT')}</b><button className="btn btn-sm" data-act="bell">✕</button></div>
   <div className="nsec">{t('nDue')}{N.due.length?<>{' · '}<b>{`AED ${fmt(sum,2)}`}</b></>:null}</div>
   {N.due.length?N.due.map(a=><button key={a.n} className="nrow" data-soa={a.n}><span className="grow"><b>{a.n}</b><span className="hint">{`${a.next} · `}{whenTxt(a.next)}{` · ${a.nextN} ${t('nBills')}`}</span></span><b>{fmt(a.nextAmt,2)}</b></button>):<div className="hint" style={css('padding:8px 0')}>{t('nNone')}</div>}
   {N.nw.length?<><div className="nsec">{`${t('nNew')} · `}<b>{N.nw.length}</b></div>{N.nw.slice(0,6).map((g,i)=><button key={g.id||i} className="nrow" data-soa={g.sup||''}><span className="grow"><b>{g.sup||'—'}</b><span className="hint">{`${g.no||''} · ${dd(g.date)}`}</span></span><b>{fmt(grnTot(g).val,2)}</b></button>)}</>:null}
   <div className="hint" style={css('white-space:normal;margin-top:8px')}>{t('nSet')}</div></div>}

export function bellBtn(){const N=notes(),n=N.due.length+N.nw.length;return <button className={`bell ${n?'has':''}`} data-act="bell" title={t('nT')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>{n?<span className="bn">{n}</span>:null}</button>}

export function vSoa(){const by=supAgg();const A=(Object.values(by) as any[]).sort((a,b)=>((b.bal>0) as any)-((a.bal>0) as any)||(a.next||'9').localeCompare(b.next||'9')||a.n.localeCompare(b.n));
  if(!soaSup||!by[soaSup])__set('soaSup',(A[0]||{}).n||'');const a=by[soaSup];const today=new Date().toISOString().slice(0,10);
  const list=<div className="card no-print" style={css('padding:8px 0')}><div className="list">{A.length?A.map(x=><div key={x.n} className="li" style={css(`cursor:pointer;padding:10px 16px;${x.n===soaSup?'background:var(--fk-paper)':''}`)} data-soa={x.n}><div className="grow"><b>{x.n}</b><div className="hint">{x.next?<>{`${x.next} · `}{whenTxt(x.next)}</>:schedTxt(x.S)}</div></div><b>{fmt(x.bal,0)}</b></div>):<div className="empty">{t('pNone')}</div>}</div></div>;
  if(!a)return <>{banner()}<div className="card"><h2 style={css('margin:0')}>{t('soa')}</h2><p className="hint" style={css('white-space:normal')}>{t('soaH')}</p></div>{list}</>;
  const ev=[];a.rows.forEach(r=>{const g=r.g;ev.push({d:g.date||'',k:0,desc:`${g.no||g.id}${g.inv?' · '+t('gInv')+' '+g.inv:''}`,dr:r.val,st:r.st,due:r.due,over:r.over});if(r.st==='paid')ev.push({d:(g.paidAt||'').slice(0,10)||g.date||'',k:1,desc:`${t('sPayment')} · ${g.no||g.id}${g.paidBy?' · '+g.paidBy:''}`,cr:r.val})});
  ev.sort((x,y)=>x.d.localeCompare(y.d)||x.k-y.k);let run=0;ev.forEach(e=>{run+=(e.dr||0)-(e.cr||0);e.run=run});
  const dueR=a.ready.filter(r=>a.next&&r.due<=a.next);
  return <>{banner()}<div className="grid soa-grid" style={css('grid-template-columns:300px minmax(0,1fr);align-items:start')}>{list}
  <div style={css('display:flex;flex-direction:column;gap:12px;min-width:0')}>
   <div className="card bill" style={css('max-width:none;margin:0;width:100%')}><div className="controls" style={css('align-items:flex-start')}><div><div className="bill-mark" style={css('font-size:24px')}>Forka</div><div className="bill-rule"></div><div className="hint">{`${t('sAsOf')} ${today}`}</div></div><span className="sp"></span>
    <div style={css('text-align:end')}><h2 style={css('margin:0;font-size:22px')}>{t('soa')}</h2><div style={css('font-size:15px;font-weight:600;margin-top:4px')}>{a.n}</div><div className="hint">{`${t('sSched')}: ${schedTxt(a.S)}${a.S.iban?' · IBAN '+a.S.iban:''}`}</div></div></div>
    <div className="bill-meta"><div><div className="hint">{t('sBilled')}</div><b>{fmt(a.billed,2)}</b></div><div><div className="hint">{t('sPaidT')}</div><b>{fmt(a.paid,2)}</b></div><div><div className="hint">{t('sBal')}</div><b style={css('font-size:16px')}>{`AED ${fmt(a.bal,2)}`}</b></div><div><div className="hint">{t('sNext')}</div><b>{a.next?a.next:'—'}</b>{a.next?<div className="hint">{`${t('sNextAmt')}: AED ${fmt(a.nextAmt,2)}`}</div>:null}</div></div>
    <table className="bill-t"><thead><tr><th>{t('evDate')}</th><th>{t('sDesc')}</th><th>{t('pDue')}</th><th className="n">{t('sDebit')}</th><th className="n">{t('sCredit')}</th><th className="n">{t('sRun')}</th></tr></thead><tbody>
    {ev.length?ev.map((e,i)=><tr key={i}><td style={css('white-space:nowrap')}>{e.d}</td><td>{e.desc}{e.k===0&&e.st==='hold'?<>{' '}<span className="badge b-mute">{t('pHold')}</span></>:null}</td><td style={css(`white-space:nowrap;${e.over?'color:var(--fk-danger);font-weight:600':''}`)}>{e.k===0&&e.st!=='paid'?dd(e.due):''}</td><td className="n">{e.dr?fmt(e.dr,2):''}</td><td className="n">{e.cr?fmt(e.cr,2):''}</td><td className="n"><b>{fmt(e.run,2)}</b></td></tr>):<tr><td colSpan={6} className="empty">{t('sNoBills')}</td></tr>}
    </tbody><tfoot><tr><td colSpan={5} className="n"><b>{t('sBal')}</b></td><td className="n"><b>{fmt(a.bal,2)}</b></td></tr></tfoot></table>
    {a.hold?<p className="hint" style={css('white-space:normal;margin-top:10px')}>{`${t('sHoldT')}: AED ${fmt(a.hold,2)}`}</p>:null}</div>
   <div className="controls no-print"><button className="btn" data-act="tprint">{t('sPrint')}</button><span className="sp"></span>{dueR.length&&(!SHEET||editMode)?(soaAsk?<div className="banner bn-warn"><span>{`${t('sPayQ')} ${dueR.length} ${t('nBills')} · AED ${fmt(a.nextAmt,2)}`}</span><button className="btn" data-act="soano">{t('cancelS')}</button><button className="btn btn-primary" data-act="soapay">{t('sPayDue')}</button></div>:<button className="btn btn-primary" data-act="soaask">{`${t('sPayDue')} (${dueR.length}) · AED ${fmt(a.nextAmt,2)}`}</button>):null}</div></div></div></>}

export function vCeo(){if(rqOpenId)return vRqDetail(rqOpenId,true);
  const A=recs('Requests');const sets={pending:A.filter(r=>r.status==='approval'),ok:A.filter(r=>r.ceo&&r.ceo.decision==='approved'),back:A.filter(r=>r.ceo&&r.ceo.decision==='returned'),all:A.filter(r=>r.status==='approval'||(r.ceo&&r.ceo.decision))};
  const R=(sets[apF]||[]).sort((a,b)=>(a.sentCeoAt||'').localeCompare(b.sentCeoAt||''));
  return <>{banner()}<div className="card"><h2 style={css('margin:0')}>{t('appr')}</h2><p className="hint" style={css('white-space:normal;margin:4px 0 0;font-size:12.5px;max-width:720px')}>{t('apprH')}</p></div>
  <div className="controls"><div className="chips">{[['pending',t('ap_pending')],['ok',t('ap_ok')],['back',t('ap_back')],['all',t('ap_all')]].map(([k,l])=><button key={k} className={`chip ${apF===k?'on':''}`} data-apf={k}>{`${l}${sets[k].length?' · '+sets[k].length:''}`}</button>)}</div></div>
  {R.length?<div className="card" style={css('padding:4px 0')}><div className="list">{R.map(r=>{const o=(r.opts||[]).find(x=>x.pick);const tot=o&&+o.price>0&&+r.qty>0?(+o.price)*(+r.qty):null;return <div key={r.id} className="li rq-li" data-rqopen={r.id}>{(r.photos||[]).length?<img className="rq-thumb" src={r.photos[0]} alt=""/>:null}<div className="grow"><b>{r.title||''}</b>
    <div className="hint" style={css('white-space:normal;margin-top:3px')}>{`${r.no||''} · `}{rqKindTag(r)}{` · ${r.by||''} · ${nm(DEPTS,r.dept)}`}{o?<>{` · ${t('rqChosen')}: `}<b>{o.sup||''}</b></>:null}{r.buyer?` · ${t('rqAssigned')} ${r.buyer}`:null}</div></div>{tot?<b>{`AED ${fmt(tot,0)}`}</b>:o&&o.price?<b>{`AED ${fmt(+o.price,2)}`}</b>:null}{rqBadge(r.status||'new')}<span className="ov-arrow">{lang==='ar'?'←':'→'}</span></div>})}</div></div>:<div className="card"><div className="empty">{t('nApprNone')}</div></div>}</>}

export function ceoBell(){const n=rqApprCount();return <button className={`bell ${n?'has':''}`} data-act="ceobell" title={t('nApprT')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>{n?<span className="bn">{n}</span>:null}</button>}

export function vPeople(){const L=peopleList().slice().sort((a,b)=>((b.active!==false) as any)-((a.active!==false) as any)||a.name.localeCompare(b.name));const d=ppDraft;
  const chip=(f,k,lbl,on)=><button key={k} className={`chip ${on?'on':''}`} data-ppt={`${f}:${k}`}>{lbl}</button>;
  const sideLbl=k=>t(k==='plan'?'sidePlan':k==='ops'?'sideOps':k==='dept'?'btnReq':k==='fin'?'btnPay':k==='oman'?'sideOman':'landCeo');
  const form=d?<div className="card pp-form"><div className="form">
     <div className="fld"><label>{`${t('ppName')} `}<span style={css('color:var(--fk-danger)')}>*</span></label><input dir="auto" data-ppf="name" className={String(d.name||'').trim()?'':'miss'} defaultValue={d.name||''}/></div>
     <div className="fld"><label>{`${t('ppPin')} `}<span style={css('color:var(--fk-danger)')}>*</span></label><input data-ppf="pin" inputMode="numeric" maxLength={6} className={/^\d{4,6}$/.test(d.pin||'')?'':'miss'} defaultValue={d.pin||''} autoComplete="off"/></div>
     <div className="fld"><label>{t('ppEmail')}</label><input dir="ltr" data-ppf="email" defaultValue={d.email||''} placeholder="name@forka.com"/></div>
     <div className="fld"><label>{t('ppWa')}</label><input dir="ltr" data-ppf="wa" defaultValue={d.wa||''} placeholder="+971 5x xxx xxxx"/></div>
     <div className="fld" style={css('grid-column:1/-1')}><label>{t('ppSides')}</label><div className="chips">{SIDEK.map(k=>chip('sides',k,sideLbl(k),(d.sides||[]).includes(k)))}</div></div>
     <div className="fld" style={css('grid-column:1/-1')}><label>{t('ppAlerts')}</label><div className="chips">{ALERTK.map(k=>chip('alerts',k,t('al_'+k),(d.alerts||[]).includes(k)))}</div></div>
     <div className="fld"><label>{t('ppActive')}</label><div className="chips">{chip('active','1',t('ppActive'),d.active!==false)}{chip('active','0',t('ppOff'),d.active===false)}</div></div></div>
     <div className="controls" style={css('margin-top:14px')}><span className="sp"></span><button className="btn" data-act="ppcancel">{t('cancelS')}</button><button className="btn btn-accent" data-act="ppsave">{t('ppSave')}</button></div></div>:null;
  return <>{banner()}<div className="card"><div className="controls"><div><h2 style={css('margin:0')}>{t('people')}</h2><p className="hint" style={css('white-space:normal;margin:4px 0 0;font-size:12.5px;max-width:720px')}>{`${t('ppH')}${SHEET?' '+t('ppSheet'):''}`}</p></div><span className="sp"></span>{d||SHEET?null:<button className="btn btn-primary" data-act="ppadd">{`+ ${t('ppAdd')}`}</button>}</div></div>
  {d&&!d.id?form:null}
  <div className="card" style={css('padding:0')}><div className="tbl-wrap" style={css('border:0;max-height:none')}><table><thead><tr><th>{t('ppName')}</th><th>PIN</th><th>{t('ppSides')}</th><th>{t('ppAlerts')}</th><th>{`${t('ppEmail')} / WhatsApp`}</th><th></th></tr></thead><tbody>
  {L.map(p=><Fragment key={p.id}><tr style={css(p.active===false?'opacity:.5':'')}><td><b>{p.name}</b>{p.active===false?<>{' '}<span className="badge b-mute">{t('ppOff')}</span></>:null}</td><td className="hint">••••</td><td>{(p.sides||[]).map(k=><span key={k} className="kindtag">{sideLbl(k)}</span>)}</td><td className="hint" style={css('white-space:normal')}>{(p.alerts||[]).map(k=>t('al_'+k)).join(' · ')||'—'}</td><td className="hint" dir="ltr" style={css('text-align:start')}>{`${p.email||''}${p.email&&p.wa?' · ':''}${p.wa||''}`}</td><td>{SHEET?null:<button className="btn btn-sm" data-ppedit={p.id}>{t('ppEdit')}</button>}</td></tr>{d&&d.id===p.id?<tr><td colSpan={6} style={css('padding:0 0 12px')}>{form}</td></tr>:null}</Fragment>)}
  </tbody></table></div></div></>}

export function vActivity(){const A=(Object.values(ACT) as any[]).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,300);const O=(Object.values(OUTBOX) as any[]).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,100);
  return <>{banner()}<div className="grid two" style={css('align-items:start')}><div className="card" style={css('padding:0')}><div style={css('padding:16px 18px 6px')}><h2 style={css('margin:0')}>{t('activity')}</h2><p className="hint" style={css('white-space:normal;margin:4px 0 0')}>{t('actH')}</p></div>
   <div className="tbl-wrap" style={css('border:0;max-height:70vh')}><table><thead><tr><th>{t('actWhen')}</th><th>{t('actWho')}</th><th>{t('actWhat')}</th></tr></thead><tbody>{A.length?A.map((a,i)=><tr key={a.id||i}><td style={css('white-space:nowrap')} className="hint">{dd(a.at,1)}</td><td><b>{a.by||''}</b></td><td><span className="kindtag">{t('ak_'+a.kind)}</span>{a.label||''}{(a.fields||[]).length&&!/→/.test(a.label||'')?<div className="hint" style={css('white-space:normal')}>{a.fields.join(', ')}</div>:null}</td></tr>):<tr><td colSpan={3} className="empty">{t('actNone')}</td></tr>}</tbody></table></div></div>
   <div className="card"><h2 style={css('margin:0')}>{t('outT')}</h2><p className="hint" style={css('white-space:normal;margin:4px 0 10px')}>{SHEET?t('outLive'):t('outH')}</p>{SHEET?null:<button className="btn btn-sm" data-act="outrun">{t('outRun')}</button>}
   <div className="rq-log" style={css('margin-top:12px')}>{O.length?O.map((o,i)=><div key={o.id||i} className="rq-msg"><div className="hint">{`${dd(o.at,1)} · ${t('al_'+o.ev)}`}</div><div>{lang==='ar'?o.text_ar:o.text}</div><div className="hint" style={css('white-space:normal;margin-top:4px')}>{`${t('outTo')}: `}{o.to.length?o.to.map((p,j)=><Fragment key={j}>{j?'  |  ':null}<b>{p.name}</b>{`${p.email?' · '+p.email:''}${p.wa?' · WhatsApp '+p.wa:''}`}{!p.email&&!p.wa?<>{' · '}<span style={css('color:var(--fk-warning)')}>no email / WhatsApp</span></>:null}</Fragment>):<span style={css('color:var(--fk-danger)')}>{t('outNoOne')}</span>}</div></div>):<div className="hint">{t('outNone')}</div>}</div></div></div></>}
