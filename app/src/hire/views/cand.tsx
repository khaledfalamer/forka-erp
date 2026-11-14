/* Hire: the candidate window (openCand), interview scorecards, the side-by-side comparison, booking cards and the
   booking-time picker. Moved from hiring/index.html (g_cand.js) as an exact copy. */
import {
  allCands, reqOf, DRAFT, SCH, V, SI, scr, ivAvg, setScore, PASS, f1, AI_ON, aiSum, aiScreen, autoCheck, CALL, CR,
  pooled, fmtN, lock_iv, refSet, finSet, workDaysSince, DOCS, nm, fmtD, addNote, move, schedDlg, inviteIv, panelDone,
  openModal, closeModal, place, rejectC, toPool, saveDraft, PV, ivSheet, whoOf, SAMPLE, ivNote, ivSet, submitIv, REC,
  COMPETENCY, PR, HR_Q, ivScore, bookLink, whenTxt, waLink, copyTxt, uaeParts, uaeTime, schTog, schSend,
} from '../core';
import * as core from '../core';
import { css, nchange, Fragment } from '../ui';
import { stageHead, contactHTML, stageTag } from './pages';
import { cvLink } from './team';
import { aiSumHTML, aiQs } from './request';

/* DRAFT and SCH are `let` values owned by core; another module cannot assign them, so these call core's setters
   (core needs: export function setDRAFT(v){DRAFT=v} and export function setSCH(v){SCH=v}). */
const setDRAFT = (v: any) => (core as any).setDRAFT(v);
const setSCH = (v: any) => (core as any).setSCH(v);

export function openCand(id){
  const c=allCands()[id]; if(!c) return; const r=reqOf(c);
  if(!DRAFT||DRAFT.id!==id) setDRAFT(JSON.parse(JSON.stringify(c)));
  const d=DRAFT, isHR=V.role==="hr", isHead=V.role==="head", st=d.stage, si=SI[st]??-1;
  const scoreBtns=(path,val,dis)=><div className="score">{[1,2,3,4,5].map(n=><button key={n} disabled={!!dis} className={val===n?"on":""} onClick={() => setScore(path,n)}>{n}</button>)}</div>;
  const sAvg=scr(d,r), iAvg=ivAvg(d);
  const myIv=(d.iv||{})[V.me]||{tech:[],comp:[]};
  const body: any[]=[];
  body.push(<Fragment key="sh">{stageHead(d)}</Fragment>);
  if(st==="rejected"||st==="pool") body.push(<div key="rj" className={`note ${st==="pool"?"info":""}`} style={css("margin:10px 0")}>{st==="pool"?"In talent pool":"Rejected"}{d.reject?.reason?" — "+d.reject.reason:""}{d.reject?.auto?" (automatic, pre-screen)":""}</div>);
  // profile
  const profLine=<>{d.location||""} · {d.years??"–"} yrs · notice {d.notice??"–"} days · {d.visa||""}</>;
  body.push(<div key="pf" className="grid g2" style={css("margin-top:10px")}><div className="card"><h3>Profile</h3>{pooled(d)?<>{contactHTML(d)}<p className="small">{profLine}</p></>:<p className="small">{d.email||""}{' '}{d.phone?" · "+d.phone:""}<br/>{profLine}</p>}{isHR?<p className="small"><b>Expected salary:</b> {fmtN(d.salary)} {r.cur||""} {d.salary&&r.salMax&&d.salary>r.salMax?<span className="tag warn">above range</span>:null}</p>:null}
    {(d.answers||[]).length?<p className="small"><b>Pre-screen:</b> {d.answers.map((a,i)=><Fragment key={i}>{i?<br/>:null}{a[0]} — <b>{a[1]}</b></Fragment>)}</p>:null}<p className="small muted">Source: {d.source||""} · consent {d.consent?"recorded":"not recorded"}</p></div>
    <div className="card"><div className="row"><h3>CV</h3><span className="sp"></span>{AI_ON()&&(d.cvFile||d.cvText)?<button className="btn sm ai" id="aisumbtn" onClick={() => aiSum()}>{d.ai?"Summarise again":"Summarise CV"}</button>:null}{cvLink(d.cvFile)}</div>{aiSumHTML(d)}{d.cvText?<pre className="out" style={css("max-height:170px;margin-top:8px")}>{d.cvText}</pre>:<p className="small muted">{d.cvFile?"Open the file above.":"No CV yet."}</p>}</div></div>);
  // screening (HR only)
  if(isHR&&si>=SI.screening){ const lock=si>SI.screening;
    body.push(<div key="scr" className="card sec"><div className="row"><h3>Screening scorecard</h3><span className={`tag ${sAvg>=PASS?"ok":"warn"}`}>avg {f1(sAvg)} · pass {PASS}</span><span className="sp"></span>{AI_ON()&&!lock?<button className="btn sm ai" onClick={() => aiScreen()}>Summarise CV and suggest scores</button>:null}</div>
    {(()=>{const F=autoCheck(d,r);return F.length?<p className="small"><b>Auto-check:</b> {F.map(([k,x],j)=><span key={j} className={`flag tag ${k}`}>{x}</span>)}</p>:null})()}<p className="small muted">Part 1 — CV against the must-haves (1 does not meet · 3 meets with gaps · 5 exceeds)</p>{(r.mustHaves||[]).map((m,i)=><div key={i} className="crit"><span>{m}{d.aiWhy?.[i]?<div className="small muted">AI: {d.aiWhy[i]}</div>:null}</span>{scoreBtns("cv."+i,d.cv?.[i],lock)}</div>)}
    <p className="small muted" style={css("margin-top:10px")}>Part 2 — HR call, 15–30 minutes</p>{CALL.map((m,i)=><div key={i} className="crit"><span>{m}</span>{scoreBtns("call."+i,d.call?.[i],lock)}</div>)}
    <label>Call notes</label><textarea disabled={!!lock} onInput={e => { DRAFT.callNotes=e.currentTarget.value; }} defaultValue={d.callNotes||""}></textarea></div>); }
  // personality
  if(isHR&&si>=SI.personality){ const lock=si>SI.personality, P=d.personality||{};
    body.push(<div key="per" className="card sec"><h3>Personality assessment <span className="tag br">mandatory · input, not pass/fail</span></h3>
    <div className="chk"><input type="checkbox" defaultChecked={!!P.consent} disabled={!!lock} onChange={e => { DRAFT.personality={...(DRAFT.personality||{}),consent:e.currentTarget.checked}; }}/><span>Candidate consented and completed the assessment (tool: {P.tool||"to be chosen"})</span></div>
    {(r.traits||[]).map((t,i)=><div key={i} className="crit"><span>{t}{CR(r).includes(t)?<>{' '}<span className="tag bad">critical</span></>:null}</span><select style={css("width:150px")} disabled={!!lock} defaultValue={(P.tr||{})[i]??""} onChange={e => { DRAFT.personality={...(DRAFT.personality||{}),tr:{...((DRAFT.personality||{}).tr||{}),[i]:e.currentTarget.value}}; }}><option value="">—</option>{["Match","Watch-out","Very low"].map(o=><option key={o}>{o}</option>)}</select></div>)}
    <label>Summary for the panel <span className="hint">3 lines — the head sees this, never the raw report</span></label><textarea disabled={!!lock} onInput={e => { DRAFT.personality={...(DRAFT.personality||{}),summary:e.currentTarget.value}; }} defaultValue={P.summary||""}></textarea>
    <label>2 follow-up questions for the interview</label><textarea disabled={!!lock} onInput={e => { DRAFT.personality={...(DRAFT.personality||{}),qs:e.currentTarget.value}; }} defaultValue={P.qs||""}></textarea></div>); }
  // shortlist pack (head sees)
  if(si>=SI.shortlist&&st!=="rejected"||(isHead&&si>=SI.shortlist)){ const P=d.personality||{};
    body.push(<div key="sl" className="card sec"><h3>Shortlist pack</h3><div className="grid g3"><div className="kpi"><div className="l">Screening score</div><div className="v">{f1(sAvg)}</div></div><div className="kpi"><div className="l">Experience</div><div className="v">{d.years??"–"}<span className="small"> yrs</span></div></div><div className="kpi"><div className="l">Notice</div><div className="v">{d.notice??"–"}<span className="small"> days</span></div></div></div>
    <p className="small"><b>Personality summary:</b> {P.summary||"—"}</p>{Object.values(P.tr||{}).includes("Very low")?<div className="note">A critical trait came out very low — the panel must clear it in the interview.</div>:null}<p className="small"><b>Follow-up questions:</b> {P.qs||"—"}</p>{d.callNotes&&isHR?<p className="small"><b>HR call:</b> {d.callNotes}</p>:null}</div>); }
  // booking links (HR call / interview)
  if((isHR||isHead)&&d.books&&Object.keys(d.books).length) body.push(<Fragment key="bk">{bookCard(d)}</Fragment>);
  // interview
  if(si>=SI.interview&&(isHR||isHead)){ body.push(<Fragment key="iv">{ivCard(d,r,lock_iv(si))}</Fragment>); }
  // references
  if(isHR&&si>=SI.references){ const lock=si>SI.references, R2=d.refs||[{},{}];
    body.push(<div key="ref" className="card sec"><h3>Reference checks</h3><div className="chk"><input type="checkbox" defaultChecked={!!d.refConsent} disabled={!!lock} onChange={e => { DRAFT.refConsent=e.currentTarget.checked; }}/><span>Candidate consents to contacting the current employer (if not: check previous employers, offer conditional)</span></div>
    {[0,1].map(i=><div key={i} className="grid g4" style={css("margin-top:6px")}><input disabled={!!lock} placeholder="Referee name" defaultValue={R2[i]?.name??""} onInput={e => refSet(i,'name',e.currentTarget.value)}/><input disabled={!!lock} placeholder="Company · relation" defaultValue={R2[i]?.co??""} onInput={e => refSet(i,'co',e.currentTarget.value)}/><select disabled={!!lock} defaultValue={R2[i]?.ok??""} onChange={e => refSet(i,'ok',e.currentTarget.value)}><option value="">Result…</option>{["Verified — positive","Verified — concerns","Could not reach"].map(o=><option key={o}>{o}</option>)}</select><input disabled={!!lock} placeholder="Notes" defaultValue={R2[i]?.notes??""} onInput={e => refSet(i,'notes',e.currentTarget.value)}/></div>)}</div>); }
  // final evaluation
  if((isHR||V.ceo)&&si>=SI.final){ const lock=si>SI.final||!isHR, F=d.fin||{};
    body.push(<div key="fin" className="card sec"><h3>Final evaluation report</h3><table><tbody><tr><td>Screening</td><td>{f1(sAvg)}</td></tr><tr><td>Interview + practical (panel)</td><td>{f1(iAvg)}</td></tr><tr><td>Personality</td><td>{(d.personality||{}).summary||"—"}</td></tr><tr><td>References</td><td>{(d.refs||[]).map(x=>x.ok||"").filter(Boolean).join(" · ")||"—"}</td></tr></tbody></table>
    <div className="grid g3"><div><label>Proposed total package ({r.cur||"AED"}/month)</label><input type="number" disabled={!!lock} defaultValue={F.total||""} onInput={e => finSet(e.currentTarget.value)}/></div><div><label>Basic salary (30%)</label><input disabled id="basicOut" defaultValue={F.basic?fmtN(F.basic):""}/></div><div><label>Range</label><input disabled defaultValue={`${fmtN(r.salMin)}–${fmtN(r.salMax)}`}/></div></div>
    <div className="chk"><input type="checkbox" defaultChecked={!!F.nego} disabled={!!lock} onChange={e => { DRAFT.fin={...(DRAFT.fin||{}),nego:e.currentTarget.checked}; }}/><span>One more negotiation round done (HR only — the department head is not involved in salary)</span></div>
    <label>Recommendation</label><textarea disabled={!!lock} onInput={e => { DRAFT.fin={...(DRAFT.fin||{}),rec:e.currentTarget.value}; }} defaultValue={F.rec||""}></textarea>
    {st==="approval"?<div className="note" style={css("margin-top:8px")}>Waiting for CEO approval · {workDaysSince(d.stageAt)} of 2 working days</div>:null}</div>); }
  // offer
  if(isHR&&si>=SI.offer){ const lock=si>SI.offer, O=d.offer||{};
    body.push(<div key="off" className="card sec"><h3>Offer &amp; documents</h3><div className="grid g2"><div><label>Joining date</label><input type="date" disabled={!!lock} defaultValue={O.join||""} ref={nchange(e => { DRAFT.offer={...(DRAFT.offer||{}),join:e.currentTarget.value}; })}/></div><div className="chk" style={css("margin-top:28px")}><input type="checkbox" defaultChecked={!!O.accepted} disabled={!!lock} onChange={e => { DRAFT.offer={...(DRAFT.offer||{}),accepted:e.currentTarget.checked}; }}/><span>Offer letter signed and accepted</span></div></div>
    {DOCS.map((x,i)=><div key={i} className="chk"><input type="checkbox" defaultChecked={!!(O.docs||{})[i]} disabled={!!lock} onChange={e => { DRAFT.offer={...(DRAFT.offer||{}),docs:{...((DRAFT.offer||{}).docs||{}),[i]:e.currentTarget.checked}}; }}/><span>{x}</span></div>)}
    <p className="small muted">No one starts work without complete documentation (control approved 23 Jul).</p></div>); }
  // notes + history
  body.push(<div key="nt" className="card sec"><h3>Notes</h3>{(d.notes||[]).map((n,i)=><div key={i} className="small" style={css("margin:4px 0")}><b>{nm(n.by)}</b> <span className="muted">{fmtD(n.t)}</span> — {n.m}</div>)}<div className="row" style={css("margin-top:6px")}><input id="noteIn" placeholder="Opinions go here; scores stay numbers" style={css("flex:1")}/><button className="btn sm sec" onClick={() => addNote()}>Add</button></div>
  <div className="hist">{(d.history||[]).map((h,i)=><div key={i}>{fmtD(h.t)} · {nm(h.by)} — {h.m}</div>)}</div></div>);
  // actions
  const A: any[]=[]; const can=(x)=>x; void can;
  if(isHR&&st==="applied") A.push(<button key="a1" className="btn br" onClick={() => move('screening')}>Start screening</button>);
  if(isHR&&st==="screening") A.push(<button key="a2" className="btn br" disabled={!(sAvg!=null&&sAvg>=PASS&&d.cv&&d.call&&Object.keys(d.cv).length>=(r.mustHaves||[]).length&&Object.keys(d.call).length>=CALL.length)} onClick={() => move('personality')}>Pass → personality assessment</button>);
  if(isHR&&st==="personality") A.push(<button key="a3" className="btn br" disabled={!((d.personality||{}).consent&&(d.personality||{}).summary)} onClick={() => move('shortlist')}>Send to {r.dept} head's shortlist</button>);
  if(isHR&&["screening","personality"].includes(st)&&!(d.books||{}).call) A.push(<button key="a4" className="btn sec" onClick={() => schedDlg('call')}>Book the HR call</button>);
  if((isHead||isHR)&&st==="shortlist") A.push(<button key="a5" className="btn br" onClick={() => inviteIv()}>Invite to interview</button>);
  if((isHead||isHR)&&st==="interview"&&!(d.books||{}).interview) A.push(<button key="a6" className="btn sec" onClick={() => schedDlg('interview')}>Send interview times</button>);
  if((isHead||isHR)&&st==="interview") A.push(<button key="a7" className="btn br" disabled={!(panelDone(d)&&iAvg!=null&&iAvg>=PASS)} title={`Needs the head's and HR's submitted scorecards, panel average ${PASS}+`} onClick={() => move('references')}>Passed → references</button>);
  if(isHR&&st==="references") A.push(<button key="a8" className="btn br" disabled={!((d.refs||[]).filter(x=>x&&x.ok&&x.ok.startsWith("Verified")).length>=2)} onClick={() => move('final')}>References clear → final evaluation</button>);
  if(isHR&&st==="final") A.push(<button key="a9" className="btn br" disabled={!(d.fin?.total&&d.fin?.nego&&d.fin?.rec)} onClick={() => move('approval')}>Send to CEO for approval</button>);
  if(V.ceo&&st==="approval") A.push(<Fragment key="a10"><button className="btn sec" onClick={() => move('final','CEO asked to renegotiate')}>Renegotiate</button><button className="btn ok" onClick={() => move('offer','CEO approved candidate and package')}>Approve</button></Fragment>);
  if(isHR&&st==="offer") A.push(<button key="a11" className="btn ok" disabled={!(d.offer?.accepted&&d.offer?.join&&DOCS.every((x,i)=>(d.offer?.docs||{})[i]))} onClick={() => move('hired')}>Mark hired → onboarding</button>);
  if(isHR&&(st==="rejected"||st==="pool")) A.push(<button key="a12" className="btn sec" onClick={() => move('applied','Reopened')}>Reopen</button>);
  const rej=!["hired","rejected","pool"].includes(st)&&(isHR||(isHead&&["shortlist","interview"].includes(st)));
  void myIv;
  openModal(<><div className="hd"><div><div className="small muted">{r.reqId||""} · {r.title||""} · {place(r)}</div><h2>{d.name}</h2></div>{stageTag(d)}<button className="x" onClick={() => { closeModal(); setDRAFT(null); }}>×</button></div>
  <div className="bd">{body}</div>
  <div className="ft">{rej?<button className="btn bad" onClick={() => rejectC()}>Reject with reason</button>:null}{isHR&&rej?<button className="btn sec" onClick={() => toPool()}>Talent pool</button>:null}<span className="sp"></span>{(isHR||isHead)&&!["hired"].includes(st)?<button className="btn sec" onClick={() => saveDraft()}>Save</button>:null}{A}</div></>);
}

export function ivCard(d,r,lock){
  const myIv=(d.iv||{})[V.me]||{tech:[],comp:[]}, mine=myIv.done||lock;
  const others=Object.entries(d.iv||{}).filter(([k])=>k!==V.me);
  const canSee=lock||myIv.done||(V.ceo&&!(d.iv||{})[V.me]);
  const hidden=others.filter(([,s]: [string, any])=>s.done&&(s.hidden||!canSee)), shown=canSee?Object.entries(d.iv||{}).filter(([,s]: [string, any])=>!s.hidden&&s.done):[];
  const iAvg=ivAvg(d), sheet=ivSheet(V.role==="head"?"head":"hr",r,d);
  const val=(k,i)=>k==="prac"?PV(myIv)[i]:(myIv[k]||[])[i];
  const sb=(path,v,dis)=><div className="score">{[1,2,3,4,5].map(n=><button key={n} disabled={!!dis} className={v===n?"on":""} onClick={() => setScore(path,n)}>{n}</button>)}</div>;
  const waiting=["head","hr"].filter(w=>!Object.entries(d.iv||{}).some(([k,s])=>whoOf(k,s)===w&&(s as any).done)).map(w=>w==="head"?(reqOf(d).dept||"Dept")+" head":"HR");
  return <div className="card sec"><div className="row"><h3>Interview scorecards</h3>{shown.length?<span className={`tag ${iAvg>=PASS?"ok":"warn"}`}>panel avg {f1(iAvg)}</span>:null}{waiting.length&&!lock?<span className="tag warn">waiting for {waiting.join(" + ")}</span>:lock?null:<span className="tag ok">panel complete</span>}<span className="sp"></span>{SAMPLE&&!mine?<button className="btn sm ai" onClick={() => aiQs()}>Interview questions</button>:null}</div>
  {shown.length?ivCompare(d,r):hidden.length?<p className="small muted">{hidden.map(([k])=>nm(k)).join(", ")} submitted. Their scores and notes open here once you submit yours, so nobody is swayed by the other.</p>:null}
  {!lock?<details open={!!(!myIv.done&&((d.iv||{})[V.me]||!shown.length))} style={css("margin-top:10px")}><summary className="small"><b>Your scorecard</b> ({V.role==="head"?"department head questions":"HR questions"}){myIv.done?" — submitted "+fmtD(myIv.at):""}</summary><div id="aiqs"></div>
    <p className="small muted">Ask each question, score 1–5 (1 weak · 3 meets · 5 excellent) and write what they said. Score on your own before talking to the other interviewer.</p>
    {sheet.map(sec=><Fragment key={sec.k}><p className="small" style={css("margin-top:8px")}><b>{sec.t}</b></p>{sec.L.map(([lab,q],i)=><div key={i} className="crit"><span>{lab}<span className="pr">{q}</span></span>{sb("iv."+sec.k+"."+i,val(sec.k,i),mine)}<input className="ivn" disabled={!!mine} placeholder="What they said / what you saw" defaultValue={(myIv.n||{})[sec.k+"."+i]||""} onInput={e => ivNote(`${sec.k}.${i}`,e.currentTarget.value)}/></div>)}</Fragment>)}
    <div className="grid g2" style={css("margin-top:8px")}><div><label>Strengths</label><textarea disabled={!!mine} onInput={e => ivSet('strengths',e.currentTarget.value,true)} defaultValue={myIv.strengths||""}></textarea></div><div><label>Concerns</label><textarea disabled={!!mine} onInput={e => ivSet('concerns',e.currentTarget.value,true)} defaultValue={myIv.concerns||myIv.notes||""}></textarea></div></div>
    <div className="grid g2"><div><label>Your recommendation</label><select disabled={!!mine} defaultValue={myIv.rec??""} onChange={e => ivSet('rec',e.currentTarget.value)}><option value="">—</option>{REC.map(o=><option key={o}>{o}</option>)}</select></div>
    <div><label>Personality follow-up</label><select disabled={!!mine} defaultValue={myIv.pf??""} onChange={e => ivSet('pf',e.currentTarget.value)}><option value="">—</option>{["Confirmed","Concern"].map(o=><option key={o}>{o}</option>)}</select></div></div>
    {myIv.done?<p className="small muted" style={css("margin-top:6px")}>Submitted and locked.</p>:<div className="row" style={css("margin-top:10px")}><span className="sp"></span><button className="btn sec" onClick={() => saveDraft()}>Save draft</button><button className="btn br" onClick={() => submitIv()}>Submit my scorecard</button></div>}</details>:null}</div>;
}

export function ivCompare(d,r){
  const P: [string, any][]=Object.entries(d.iv||{}).filter(([,s]: [string, any])=>!s.hidden&&s.done).sort((a,b)=>(whoOf(...a)==="head"?0:1)-(whoOf(...b)==="head"?0:1)) as [string, any][];
  if(!P.length) return null;
  const fq=String((d.personality||{}).qs||"").split(/\n+/).map(x=>x.replace(/^\s*[-•\d.)]+\s*/,"").trim()).filter(Boolean).slice(0,2);
  const secs: [string, string, any[]][]=[["tech","Technical",(r.testQs||[])],["comp","Competency",COMPETENCY],["prac","Practical",PR(r)],["hr","HR questions",[...HR_Q.map(x=>x[0]),...fq.map(q=>"Follow-up: "+q)]]];
  const cell=(s,k,i,key)=>{ const v=k==="prac"?PV(s)[i]:(s[k]||[])[i], n=(s.n||{})[k+"."+i]; if(v==null&&!n) return <td key={key} className="muted small">not asked</td>;
    return <td key={key}><span className={`sc ${v>=4?"hi":v!=null&&v<=2?"lo":""}`}>{v??"–"}</span>{n?<span className="nt">{n}</span>:null}</td> };
  const rows: any[]=[];
  secs.forEach(([k,t,L])=>{ const used=L.map((x,i)=>i).filter(i=>P.some(([,s])=>(k==="prac"?PV(s)[i]:(s[k]||[])[i])!=null)); if(!used.length) return;
    rows.push(<tr key={"s-"+k} className="sec"><td colSpan={P.length+1}>{t}</td></tr>);
    used.forEach(i=>{ const vs=P.map(([,s])=>k==="prac"?PV(s)[i]:(s[k]||[])[i]).filter(v=>typeof v==="number"); const gap=vs.length>1&&Math.max(...vs)-Math.min(...vs)>=2;
      rows.push(<tr key={k+"-"+i} className={gap?"gap":""}><td className="q">{L[i]}{gap?<>{' '}<span className="tag warn">differ</span></>:null}</td>{P.map(([pk,s])=>cell(s,k,i,pk))}</tr>) }) });
  const foot=(lab,f)=><tr key={"f-"+lab}><td className="q"><b>{lab}</b></td>{P.map(([pk,s])=><td key={pk}>{f(s)}</td>)}</tr>;
  rows.push(<tr key="s-sum" className="sec"><td colSpan={P.length+1}>Summary</td></tr>,foot("Average",s=><span className={`sc ${ivScore(s)>=PASS?"hi":"lo"}`}>{f1(ivScore(s))}</span>),foot("Recommendation",s=><b>{s.rec||"—"}</b>),
    foot("Strengths",s=><span className="nt">{s.strengths||"—"}</span>),foot("Concerns",s=><span className="nt">{s.concerns||s.notes||"—"}</span>),foot("Personality follow-up",s=>s.pf||"—"));
  const recs=P.map(([,s])=>s.rec).filter(Boolean), split=recs.some(x=>/hire/i.test(x)&&!/No/.test(x))&&recs.some(x=>/No hire/.test(x));
  return <>{split?<div className="note" style={css("margin-top:8px")}>The interviewers disagree on hiring — talk it through before moving on.</div>:null}<div className="cmp"><table><tbody><tr><th>Question</th>{P.map(([k,s])=><th key={k}>{nm(k)}<br/><span className={`tag ${whoOf(k,s)==="head"?"blue":"br"}`}>{whoOf(k,s)==="head"?"Dept head":"HR"}</span> <span className="muted">{fmtD(s.at)}</span></th>)}</tr>{rows}</tbody></table></div></>;
}

export function bookCard(d){ const B=d.books||{};
  return <div className="card sec"><h3>Scheduling</h3>{["call","interview"].filter(k=>B[k]).map(k=>{const b=B[k],link=bookLink(b);
    return <div key={k} className="crit"><span><b>{k==="call"?"HR call":"Interview"}</b> · {b.mode}{b.place?" · "+b.place:""} · {b.mins} min<br/>{b.pick?<span className="tag ok">Booked: {whenTxt(b.pick)}</span>:<span className="tag warn">Link sent {fmtD(b.at)} — waiting for the candidate to pick ({b.slots.length} times offered)</span>}<span className="small muted"> by {b.byName||nm(b.by)}</span></span>
    <div className="row">{d.phone?<a className="btn sm sec" target="_blank" rel="noopener" href={waLink(d,link,k)}>WhatsApp</a>:null}<button className="btn sm sec" onClick={() => copyTxt(link)}>Copy link</button><button className="btn sm sec" onClick={() => schedDlg(k)}>New times</button></div></div>})}</div> }

export function schedRender(){ const d=DRAFT, S2=SCH, days=[]; const t0=uaeParts(Date.now());
  for(let i=1;days.length<10&&i<16;i++){ const base=uaeTime(t0.y,t0.m,t0.d+i,0); days.push(uaeParts(base)) }
  const HRS=[10,11,12,13,14,15,16,17,18];
  const back=() => { setSCH(null); openCand(DRAFT.id); };
  if(S2.sent){ const link=S2.sent.link;
    openModal(<><div className="hd"><h2>Booking link sent</h2><span className="sp"></span><button className="x" onClick={back}>×</button></div><div className="bd">
    <p>{S2.sent.mailed?<>Emailed to <b>{d.email}</b>.</>:<><span className="tag warn">The email could not be sent</span> — send the link another way.</>} {d.name} picks one of the {S2.slots.size} times; you and HR get an email with a calendar invite as soon as they do. Times already booked by another candidate disappear for them.</p>
    <input readOnly defaultValue={link} onClick={e => e.currentTarget.select()} style={css("margin-top:8px")}/></div>
    <div className="ft"><span className="sp"></span><button className="btn sec" onClick={() => copyTxt(link)}>Copy link</button>{d.phone?<a className="btn ok" target="_blank" rel="noopener" href={waLink(d,link,S2.kind)}>Send on WhatsApp</a>:null}<button className="btn br" onClick={back}>Done</button></div></>); return }
  openModal(<><div className="hd"><div><div className="small muted">{d.name} · {reqOf(d).title||""}</div><h2>{S2.kind==="call"?"Book the HR call":"Send interview times"}</h2></div><span className="sp"></span><button className="x" onClick={back}>×</button></div><div className="bd">
  <p className="small muted">Tick the times you are free (UAE time). The candidate gets a link by email and picks one — no back and forth.</p>
  <div className="slots">{days.map((p,j)=><div key={j} className="day"><b>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][p.wd]} {p.d} {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][p.m]}</b><div>{HRS.map(h=>{const t=uaeTime(p.y,p.m,p.d,h);return <button key={h} className={S2.slots.has(t)?"on":""} onClick={() => schTog(t)}>{(h+11)%12+1}{h<12?"am":"pm"}</button>})}</div></div>)}</div>
  <div className="grid g3" style={css("margin-top:6px")}><div><label>How</label><select defaultValue={S2.mode} onChange={e => { SCH.mode=e.currentTarget.value; }}>{["In person","Phone","Video call"].map(o=><option key={o}>{o}</option>)}</select></div>
  <div><label>Length (minutes)</label><input type="number" min="15" max="180" defaultValue={S2.mins} onInput={e => { SCH.mins=+e.currentTarget.value||30; }}/></div>
  <div><label>Where / link <span className="hint">address, phone or Meet link</span></label><input defaultValue={S2.place??""} onInput={e => { SCH.place=e.currentTarget.value; }}/></div></div>
  <label>Message to the candidate <span className="hint">optional — e.g. bring your passport copy</span></label><textarea onInput={e => { SCH.note=e.currentTarget.value; }} defaultValue={S2.note??""}></textarea></div>
  <div className="ft"><span className="small muted">{S2.slots.size} time{S2.slots.size===1?"":"s"} picked</span><span className="sp"></span><button className="btn sec" onClick={back}>Cancel</button><button className="btn br" id="schGo" disabled={!S2.slots.size} onClick={() => schSend()}>Send booking link</button></div></>) }
