/* Hire screens, group "team": careers page editor and preview, team and access, open roles, my applications,
   the request review step, job view, CV links. Exact JSX copy of _orig/g_team.js. */
import {
  S, V, bEd, bLive, brand, BSEC, HURL, CFG, DEMO, afterData, bEdit, saveSec, saveGuide, fmtD, fmtN, IC, place,
  DEMO_PEOPLE, nm, ME, removeMember, allCands, PUBLIC, PUB_TRACK, go, reqRead, WSTEPS, wGo, openModal, closeModal,
  submitApp, api, toast, USER, DEPTS, saveMember, saveMemberMail, NAMES, render,
  __set,
} from '../core';
import { paint, svg, css, offAtStart } from '../ui';
import { bStat } from './pages';


export function pvHtml(){ const J=Object.values(S.jobs).filter((j: any)=>j.open).sort((a: any,b: any)=>(b.postedAt||0)-(a.postedAt||0)).slice(0,3) as any[];
  return <>{heroHtml(bLive())}<h3 style={css(`margin:4px 0 8px`)}>Open roles</h3>{J.length?J.map(j=><div key={j.id} className="card job" style={css(`margin-bottom:8px`)}><div style={css(`flex:1`)}><b>{j.title}</b><div className="small muted">{`${place(j)} · ${j.dept??""}`}</div></div></div>):<div className="card empty small">No open roles right now — check back soon.</div>}</> }

export function pCareers(){ const e=bEd(), pm=V.pvm||"desktop";
  return <>
  <div className="top"><div><h1>Careers page</h1><p>Your employer brand: what every candidate sees first. Edit the words here; open roles appear automatically when HR posts them.</p></div>{HURL?<a className="btn sec" href={CFG.APPLY_URL||"https://apply.forka.com/"} target="_blank" rel="noopener">Open the careers page</a>:<button className="btn sec" onClick={()=>{V.viewAs='candidate';V.page=null;afterData()}} ref={offAtStart(!!DEMO)}>Preview as candidate</button>}</div>
  <div className="hx-ced">
   <div className="hx-ced-ed">
    {BSEC.map(([k,t,id,help])=><div key={k} className="card hx-bs" data-sec={k}><div className="row"><h3><label htmlFor={id} style={css(`all:unset`)}>{t}</label></h3><span className="sp"></span>{bStat(k)}</div><p className="small muted">{help}</p>
     <textarea id={id} style={css(`min-height:${k==="benefits"?96:130}px`)} onInput={ev=>bEdit(k,ev.currentTarget)} defaultValue={e[k]??""}></textarea>
     <div className="row" style={css(`margin-top:10px`)}><button className="btn" id={`bs_${k}`} ref={offAtStart(!(V.bdraft&&V.bdraft[k]!=null))} onClick={()=>saveSec(k)}>Save</button><span className="small muted">Saves this part only. The careers page changes only when you save.</span></div></div>)}
    {V.role==="hr"?<div className="card" id="aiguidecard"><h3>Guidance for AI</h3><p className="small muted">The AI follows this every time it drafts a job description or job ad. Write it like a note to a new HR assistant: tone, what to always include, what never to say.</p>
     <textarea id="ai_guide" style={css(`min-height:150px`)} placeholder={"For example:\n- Warm and simple English. Short sentences.\n- Always mention: free staff meal, visa provided, one day off a week.\n- Never mention salary or the branch manager's name.\n- Arabic ad in Gulf-friendly Modern Standard Arabic."} defaultValue={(S.aiguide&&S.aiguide.text)||""}></textarea>
     <div className="row" style={css(`margin-top:10px`)}><button className="btn" onClick={()=>saveGuide()}>Save guidance</button>{S.aiguide&&S.aiguide.at?<span className="small muted">{`Last saved ${fmtD(S.aiguide.at)}`}</span>:null}</div></div>:null}
   </div>
   <div className="hx-ced-pv"><div className="card"><div className="row"><h3>Live preview</h3><span className="sp"></span><div className="hx-seg" role="group" aria-label="Preview size"><button type="button" className={pm==="desktop"?"on":""} aria-pressed={pm==="desktop"?'true':'false'} onClick={()=>{V.pvm='desktop';render()}}>{svg(IC.desk)}<span>Desktop</span></button><button type="button" className={pm==="phone"?"on":""} aria-pressed={pm==="phone"?'true':'false'} onClick={()=>{V.pvm='phone';render()}}>{svg(IC.phone)}<span>Phone</span></button></div></div>
    <p className="small muted">Shows your words as you type, before you save.</p>
    <div className={`hx-pv ${pm}`} id="pvFrame"><div className="hx-pvb" id="pvBody">{pvHtml()}</div></div></div>
    <div className="note info" style={css(`margin-top:12px`)}>{HURL?<>Candidates apply at <b>apply.forka.com</b> with no account: posted jobs appear there in English and Arabic, and each application lands in Candidates with its CV. Walk-ins and email CVs: <b>+ Add applicant</b>.</>:<>Public candidates without a Forka account apply through hr@forka.com (position in the subject). HR logs them with <b>+ Add applicant</b> — paste the CV and the AI fills the form. Staff and invited candidates apply right here.</>}</div></div>
  </div></>}

export function heroHtml(b){return <div className="hero"><div className="small" style={css(`letter-spacing:2px;color:#d7b48a`)}>FORKA COLLECTIVE · CAREERS</div><h1 style={css(`margin:6px 0 8px`)}>Build the region's best restaurants with us</h1><p>{b.intro}</p><div className="vals">{b.values.map((v,i)=><span key={i}>{v}</span>)}</div><p className="small" style={css(`margin-top:12px`)}>{b.benefits}</p></div>}

export function pTeam(){
  const M=S.team.members||{};
  return <>
  <div className="top"><div><h1>{'Team & access'}</h1><p>Three access levels. Anyone not listed here sees the candidate view.</p></div>{!DEMO?<button className="btn br" onClick={()=>addMember()}>+ Add HR or department head</button>:null}</div>
  <div className="grid g3" style={css(`margin-bottom:14px`)}>
   <div className="card"><h3>HR</h3><p className="small muted">Everything: requests, scorecards, screening, personality, references, final evaluation, offers, talent pool, careers page. Khaled (owner) also gets CEO approvals.</p></div>
   <div className="card"><h3>Department head</h3><p className="small muted">Raises hiring requests, approves the scorecard, picks from the shortlist, scores interviews and practical tests. Sees only their department, from shortlist onwards — never salary negotiation or raw personality reports.</p></div>
   <div className="card"><h3>Candidate</h3><p className="small muted">Sees open roles and the careers page, applies with pre-screening questions, and tracks their own application status. Never sees scores or notes.</p></div></div>
  <div className="card"><div className="hx-tw"><table style={css(`min-width:460px`)}><tbody><tr><th>Person</th><th>Access</th><th>Department</th><th></th></tr>
   {DEMO?Object.entries(DEMO_PEOPLE).map(([k,p]: [string, any])=><tr key={k}><td>{p.name}</td><td>{p.ceo?"CEO · HR":p.role}</td><td>{p.dept||"—"}</td><td></td></tr>):
   <><tr><td><b>{nm(ME)}</b> (owner)</td><td>CEO · HR</td><td>—</td><td></td></tr>{Object.entries(M).map(([k,m]: [string, any])=><tr key={k}><td>{nm(k)}</td><td>{m.role==="hr"?"HR":"Department head"}</td><td>{m.dept||"—"}</td><td className="right"><button className="btn sm bad" onClick={()=>removeMember(k)}>Remove</button></td></tr>)}</>}</tbody></table></div>
   {!DEMO?<p className="small muted" style={css(`margin-top:10px`)}>Also share the app with each HR person and department head as <b>Editor</b> (Share button on this page), so they can save scorecards. Staff applying internally need <b>Contributor</b>.</p>:null}</div></>;
}

export function pJobs(){
  const J=Object.values(S.jobs).filter((j: any)=>j.open).sort((a: any,b: any)=>b.postedAt-a.postedAt) as any[];
  return <>{heroHtml(brand())}<h2 style={css(`margin-bottom:10px`)}>Open roles</h2>{J.length?<div className="grid">{J.map(j=><div key={j.id} className="card job"><div style={css(`flex:1`)}><h3>{j.title}</h3><div className="small muted">{`${place(j)} · ${j.dept??""} · posted ${fmtD(j.postedAt)}`}</div><p className="small" style={css(`margin:8px 0 0`)}>{(j.summary||"").slice(0,220)}</p></div><button className="btn br" onClick={()=>viewJob(j.id)}>{'View & apply'}</button></div>)}</div>:<div className="card empty">No open roles right now — check back soon.</div>}</>;
}

export function pMine(){
  const mine=Object.entries((S.apps[V.me]||{}).list||{}).map(([id,a]: [string, any])=>({...a,id}));
  const C=allCands();
  return <>
  <div className="top"><div><h1>My applications</h1><p>We reply to every applicant. You'll see each step here.</p></div><button className="btn sec" onClick={()=>go('jobs')}>Browse open roles</button></div>
  {mine.length?mine.sort((a,b)=>b.createdAt-a.createdAt).map(a=>{const c={stage:(C[a.id]&&!C[a.id].unsaved)?C[a.id].stage:(a.status||((a.knockout||[]).length?"rejected":"applied"))};const pub=PUBLIC[c.stage]||"Received";const idx=PUB_TRACK.indexOf(pub);const j=S.jobs[a.req]||{};
   return <div key={a.id} className="card" style={css(`margin-bottom:12px`)}><div className="row"><div><h3>{j.title||a.jobTitle||"Role"}</h3><div className="small muted">{`${place(j)} · applied ${fmtD(a.createdAt)}${a.cvFile?" · CV: "+(a.cvFile.name??""):""}`}</div></div><span className="sp"></span><span className={`tag ${c.stage==="rejected"?"bad":c.stage==="hired"||c.stage==="offer"?"ok":"br"}`}>{pub}</span></div>
   {idx>=0?<div className="track">{PUB_TRACK.map((p,i)=><div key={i} className={i<idx?"done":i===idx?"cur":""}>{p}</div>)}</div>:null}
   {c.stage==="rejected"?<p className="small">Thank you for applying. This time we've gone with candidates whose experience matched the role more closely. We'll keep your details for future roles if you agreed to that.</p>:null}
   {c.stage==="interview"?<p className="small">{`You've been invited to interview. HR will contact you with the time and the practical test (${(S.reqs[a.req]||{}).practical||"practical test"}).`}</p>:null}
   {c.stage==="offer"?<p className="small">Congratulations — HR will send the offer letter and the list of documents to bring.</p>:null}</div>}):<div className="card empty">You haven't applied yet. <a href="#" onClick={e=>{go('jobs');e.preventDefault()}}>See open roles</a></div>}</>;
}

export function wReview(){ const r=reqRead(), list=a=>a.filter(Boolean).join(" · ");
  const row=(k,v)=><div className="hx-rv-r"><dt>{k}</dt><dd>{v===""||v==null?<span className="muted">–</span>:v}</dd></div>;
  const sec=(n,t,rows)=><section className="hx-rv"><div className="row"><h4>{t}</h4><span className="sp"></span><button type="button" className="btn sm sec" onClick={()=>wGo(n)}>Edit</button></div><dl>{rows}</dl></section>;
  const s=v=>v==null?"":String(v);
  paint("#w_review",<>{sec(1,WSTEPS[0],<>{row("Role title",s(r.title))}{row("Department",s(r.dept))}{row("Branch / location",s(place(r)))}{row("Work type",s(r.work))}{row("Headcount",<bdi>{r.headcount}</bdi>)}{row("New or replacement",s(r.reason))}{row("Role purpose",s(r.purpose))}{row("Key duties",s(r.duties))}</>)}
   {sec(2,WSTEPS[1],<>{row("Salary range",r.salMin||r.salMax?<bdi>{`${fmtN(r.salMin)}–${fmtN(r.salMax)} ${s(r.cur)}`}</bdi>:"")}{row("Target joining date",r.joinBy?<bdi>{fmtD(r.joinBy)}</bdi>:"")}</>)}
   {sec(3,WSTEPS[2],<>{row("Top 3 must-haves",list(r.mustHaves))}{row("Top 3 things to test in interview",list(r.testQs))}{row("Practical test(s)",list(r.practicals))}{row("Personality traits",list(r.traits))}{row("Critical",list(r.criticals))}</>)}</>) }

export function viewJob(id){ const j=S.jobs[id]; if(!j)return;
  openModal(<><div className="hd"><div><div className="small muted">{`${j.dept??""} · ${place(j)}`}</div><h2>{j.title}</h2></div><button className="x" onClick={()=>closeModal()}>×</button></div>
  <div className="bd"><pre className="out">{j.jd||j.summary}</pre>
  <h3 style={css(`margin-top:16px`)}>Apply</h3><div className="grid g2"><div><label>Full name</label><input id="a_name" /></div><div><label>Email</label><input id="a_email" type="email" /></div><div><label>Phone / WhatsApp</label><input id="a_phone" /></div><div><label>Current location</label><input id="a_loc" /></div>
  <div><label>Years of relevant experience</label><input id="a_yrs" type="number" min="0" /></div><div><label>Notice period (days)</label><input id="a_notice" type="number" min="0" /></div>
  <div><label>Expected monthly salary (total)</label><input id="a_sal" type="number" /></div><div><label>Visa status</label><select id="a_visa"><option>Own visa / residency</option><option>Employer visa — transferable</option><option>Visit visa</option><option>Needs visa</option></select></div></div>
  {(j.knockout||[]).length?<><label>Quick questions</label>{j.knockout.map((q,i)=><div key={i} className="crit"><span>{q}</span><select id={`a_ko${i}`} style={css(`width:110px`)}><option value="">—</option><option>Yes</option><option>No</option></select></div>)}</>:null}
  <label>Upload your CV <span className="hint">PDF or a photo of it · max 20 MB · Word files: please save as PDF first</span></label><input type="file" id="a_file" accept=".pdf,application/pdf,image/*" />
  <label>Or paste your CV / LinkedIn link <span className="hint">optional if you uploaded a file</span></label><textarea id="a_cv" style={css(`min-height:90px`)}></textarea>
  <div className="chk"><input type="checkbox" id="a_cons" /><span>I agree Forka may use my details for this role and keep them up to 6 months for future roles.</span></div>
  </div><div className="ft"><button className="btn sec" onClick={()=>closeModal()}>Cancel</button><button className="btn br" onClick={()=>submitApp(id)}>Submit application</button></div></>);
}

export async function openCV(id){ const w=window.open("","_blank"); if(w)w.document.write("<p style='font-family:sans-serif'>Opening CV…</p>");
  const r=await api("cv",{id}); if(!r.ok){ const m=r.error==="missing"?"This CV file was not found in the Hiring CV folder.":r.error==="session"?"Please sign in again at Forka Apps.":"Couldn't open the CV ("+(r.error||"error")+"). Close this tab and try again."; if(w)w.document.body.innerHTML="<p style='font-family:sans-serif;max-width:520px;margin:12vh auto'>"+m+"</p>"; toast(m,8000); return }
  const bin=atob(r.data),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  const url=URL.createObjectURL(new Blob([u],{type:r.type||"application/pdf"})); if(w)(w as any).location=url; else (location as any).href=url }

export function cvLink(f){ if(!f) return null;
  if(f.drive) return <button className="btn sm sec" onClick={()=>openCV(f.id)}>{`Open CV · ${f.name??""} ${f.size?Math.round(f.size/1024)+" KB":""}`}</button>; const href=f.data||f.url||(f.id?"/_blob/"+f.id:""); const kb=f.size?Math.round(f.size/1024)+" KB":"";
  return href?<a className="btn sm sec" href={href} target="_blank" rel="noopener">{`Open CV · ${f.name??""} ${kb}`}</a>:<span className="small muted">{`${f.name??""} (demo: file too big to keep)`}</span> }

export async function addMember(){ if(HURL) return addMemberMail(); if(!USER) return;
  openModal(<><div className="hd"><h2>Add HR or department head</h2><button className="x" onClick={()=>closeModal()}>×</button></div><div className="bd"><label>Find person</label><input id="m_q" placeholder="Type a name" onInput={e=>memSearch(e.currentTarget.value)} onFocus={e=>memSearch(e.currentTarget.value)} /><div id="m_res"></div>
  <div className="grid g2"><div><label>Access</label><select id="m_role" onChange={e=>{document.getElementById('m_deptw').style.display=e.currentTarget.value==='head'?'block':'none'}}><option value="head">Department head</option><option value="hr">HR</option></select></div><div id="m_deptw"><label>Department</label><select id="m_dept">{DEPTS.map(d=><option key={d}>{d}</option>)}</select></div></div></div>
  <div className="ft"><button className="btn sec" onClick={()=>closeModal()}>Cancel</button><button className="btn br" onClick={()=>saveMember()}>Add</button></div></>) }

export function addMemberMail(){
  openModal(<><div className="hd"><h2>Add HR or department head</h2><button className="x" onClick={()=>closeModal()}>×</button></div><div className="bd"><p className="small muted">Use their company email, the same one they sign in with at Forka Apps. In Forka Apps, also tick Hiring for them.</p><div className="grid g2"><div><label>Name</label><input id="m_name" /></div><div><label>Company email</label><input id="m_mail" type="email" /></div></div>
  <div className="grid g2"><div><label>Access</label><select id="m_role" onChange={e=>{document.getElementById('m_deptw').style.display=e.currentTarget.value==='head'?'block':'none'}}><option value="head">Department head</option><option value="hr">HR</option></select></div><div id="m_deptw"><label>Department</label><select id="m_dept">{DEPTS.map(d=><option key={d}>{d}</option>)}</select></div></div></div>
  <div className="ft"><button className="btn sec" onClick={()=>closeModal()}>Cancel</button><button className="btn br" onClick={()=>saveMemberMail()}>Add</button></div></>) }

export async function memSearch(q){ try{ const hits=await USER.search(q||""); const list=(hits||[]).slice(0,8);
  paint("#m_res",list.length?list.map(h=><div key={h.id} className="chk"><input type="radio" name="mp" value={h.id??""} onChange={e=>__set('PICK', e.currentTarget.value)} /><span>{h.name||"Unnamed"}</span></div>):<p className="small muted">No matches — share the app with them first.</p>); (hits||[]).forEach(h=>NAMES[h.id]=h.name) }catch(e){ paint("#m_res",<p className="small muted">Search unavailable.</p>) } }

