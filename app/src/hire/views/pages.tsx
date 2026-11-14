/* Hire pages: Dashboard, Approvals, Hiring requests, Pipeline, Talent pool, and their small helpers.
   Exact JSX copy of the original HTML templates (views/_orig/g_pages.js). */
import {
  V, S, PAGE, SI, STAGES, RANGES, REQ_STATUS, REV, IC, PASS, DEMO, NAMES,
  go, headSees, inRange, median, overdue, nextActions, place, nm, canPost, postFlow, dashStage,
  fmtN, fmtD, fmtT, reqAct, f1, scr, ivAvg, workDaysSince, allCands, reqOf, views, sortReq, liveQ,
  useView, saveView, delView, RF0, bulk, shown, purgeOld, reconsider, maskPhone, maskEmail, canReveal, reveal,
} from '../core';
import { svg, css, Fragment, offAtStart } from '../ui';
import { render, opt } from './shell';
import { reqForm, openReq, addApplicant } from './request';
import { openCand } from './cand';


/* nextActions() keeps the Review action as code text (openReq('id') / openCand('id')); run the same call. */
function runGo(code: string) {
  const m = /^(openReq|openCand)\('([^']*)'\)$/.exec(String(code || ''));
  if (!m) return;
  if (m[1] === 'openReq') openReq(m[2]); else openCand(m[2]);
}

export function moreRow(L, key, cols) {
  const n = (V.more && V.more[key]) || PAGE; if (L.length <= n) return null;
  return <tr><td colSpan={cols} style={css('text-align:center')}><button className="btn sm sec" onClick={e => { e.stopPropagation(); V.more = V.more || {}; V.more[key] = n + PAGE; render(); }}>{`Show ${Math.min(PAGE, L.length - n)} more (${L.length - n} not shown)`}</button></td></tr>;
}

export function stageSum(c) {
  const i = SI[c.stage]; if (i == null || c.stage === "hired") return stageTag(c);
  return <span className="hx-ss"><span className="tag">{STAGES[i][1]}</span>{' '}<span className="small muted"><bdi>{`${i + 1}/${STAGES.length}`}</bdi></span><span className="hx-ssb" aria-hidden="true"><i style={css(`width:${Math.round((i + 1) / STAGES.length * 100)}%`)}></i></span></span>;
}

export function stageHead(d) {
  const i = SI[d.stage]; if (i == null) return null; const s = STAGES[i], nx = STAGES[i + 1];
  return <div className="hx-sh"><div className="hx-shr"><span className="small muted">Current stage</span>{' '}<b>{s[1]}</b>{' '}<span className="small muted"><bdi>{`${i + 1}/${STAGES.length}`}</bdi></span><span className="sp"></span><span className="small"><span className="muted">Owner</span>{` ${s[2]}`}</span>{nx ? <span className="small"><span className="muted">Next</span>{` ${nx[1]}`}</span> : null}</div><div className="hx-ssb" aria-hidden="true"><i style={css(`width:${Math.round((i + 1) / STAGES.length * 100)}%`)}></i></div></div>;
}

export function contactHTML(c) {
  const rv = REV[c.id], ph = rv ? rv.phone : maskPhone(c.phone), em = rv ? rv.email : maskEmail(c.email);
  return <div className="hx-ct"><span className="hx-cv" data-noi18n><bdi dir="ltr">{ph || "–"}</bdi><bdi dir="ltr">{em || "–"}</bdi></span>{rv ? <span className="tag ok">Shown</span> : canReveal(c) ? <button type="button" className="btn sm sec hx-show" onClick={e => { e.stopPropagation(); reveal(c.id, e.currentTarget); }}>{svg(IC.eye)}<span>Show</span></button> : <span className="tag">{svg(IC.lock)}{' HR only'}</span>}</div>;
}

export function pDash(C) {
  const D = V.dash || (V.dash = { range: "", req: "" });
  const allReqs = Object.values(S.reqs).filter(headSees) as any[];
  const reqs = allReqs.filter(r => (!D.req || r.id === D.req) && inRange(r.createdAt, D.range));
  const vis = (Object.values(C) as any[]).filter(c => headSees(reqOf(c)) && (!D.req || c.req === D.req));
  const cands = vis.filter(c => inRange(c.createdAt, D.range));
  const active = cands.filter(c => !["rejected", "pool", "hired"].includes(c.stage));
  const hired = vis.filter(c => c.stage === "hired" && c.hiredAt && inRange(c.hiredAt, D.range));
  const mdh = median(hired.map(c => (c.hiredAt - c.createdAt) / 864e5));
  const od = overdue().filter(o => V.role !== "head" || o[0].startsWith("Dept head") || o[0].includes(V.dept)).filter(o => !D.req || (o[2].t === "req" ? o[2].id === D.req : (C[o[2].id] || {}).req === D.req));
  const NA = nextActions(C, V.role === "head" ? cands.filter(c => SI[c.stage] >= SI.shortlist) : cands, reqs), shownNA = V.dashAll ? NA : NA.slice(0, 8);
  const stg = STAGES.filter(s => V.role !== "head" || SI[s[0]] >= SI.shortlist);
  const src = {}; cands.forEach(c => src[c.source || "Other"] = (src[c.source || "Other"] || 0) + 1);
  const open = reqs.filter(r => r.status === "open").length;
  let empty;
  if (V.role === "hr" && !allReqs.length) empty = <><p>No hiring requests yet.</p><p className="small muted">Raise one to start. It goes to the CEO for approval first.</p><button className="btn br" onClick={() => reqForm()}>+ New hiring request</button></>;
  else if (V.role === "hr" && !allReqs.some(r => r.status === "open")) empty = <><p>{allReqs.length === 1 ? "Your hiring request is not posted yet." : `None of your ${allReqs.length} hiring requests is posted yet.`}</p><p className="small muted">Nobody can apply until a role is posted.</p>{canPost() ? <button className="btn br" onClick={() => postFlow()}>Post a role</button> : null}</>;
  else if (V.role === "head") empty = <><p>Nothing is waiting on you.</p><p className="small muted">Shortlists and scorecards for your department show here.</p><button className="btn br" onClick={() => reqForm()}>+ New hiring request</button></>;
  else empty = <><p>Nothing is waiting on you.</p><p className="small muted">New applications and approvals show here.</p><button className="btn sec" onClick={() => go('pipeline')}>See candidates</button></>;
  const srcE = Object.entries(src);
  return <>
    <div className="top"><div><h1>{`Good to see you${DEMO || NAMES[V.me] ? ", " + nm(V.me).split(" ")[0] : ""}`}</h1><p>{V.role === "head" ? "Your department's hiring at a glance." : "Every Forka hire, request to offer, on one standard flow."}</p></div>
      {V.role === "head" ? <button className="btn br" onClick={() => reqForm()}>+ New hiring request</button> : <div className="row"><button className="btn sec" onClick={() => addApplicant()}>+ Add applicant</button><button className="btn br" onClick={() => reqForm()}>+ New hiring request</button></div>}</div>
    <div className="hx-bar" role="group" aria-label="Filters">
      <label className="fld"><span>Date range</span><select id="dsh_range" defaultValue={String(D.range ?? "")} onChange={e => { V.dash.range = e.currentTarget.value; render(); }}>{RANGES.map(([v, t]) => <Fragment key={v}>{opt(v, t)}</Fragment>)}</select></label>
      <label className="fld"><span>Role</span><select id="dsh_role" defaultValue={String(D.req ?? "")} onChange={e => { V.dash.req = e.currentTarget.value; render(); }}>{opt("", "All roles")}{allReqs.map(r => <Fragment key={r.id}>{opt(r.id, r.title + " · " + place(r))}</Fragment>)}</select></label>
    </div>
    <div className="grid g4 hx-kpis">
      <div className="card kpi"><div className="l">Open roles</div><div className="v"><bdi>{open}</bdi></div><div className="small muted">{`${reqs.filter(r => ["requested", "approved", "review", "ready"].includes(r.status)).length} in preparation`}</div></div>
      <div className="card kpi"><div className="l">Candidates in process</div><div className="v"><bdi>{active.length}</bdi></div><div className="small muted">{`${cands.filter(c => c.stage === "applied").length} new to screen`}</div></div>
      <div className="card kpi"><div className="l">Overdue approvals</div><div className="v" style={css(`color:${od.length ? "var(--bad)" : "inherit"}`)}><bdi>{od.length}</bdi></div><div className="small muted">2-day SLA</div></div>
      <div className="card kpi"><div className="l">Median days to hire</div><div className="v"><bdi>{mdh == null ? "–" : Math.round(mdh)}</bdi></div><div className="small muted">{`target 21–28 days · ${hired.length} hired`}</div></div>
    </div>
    <div className="card hx-pipe"><div className="row"><h3>Pipeline</h3><span className="sp"></span><span className="small muted">Click a stage to see its candidates</span></div>
      <ol className="hx-step">{stg.map(s => { const n = cands.filter(c => c.stage === s[0]).length; return <li key={s[0]}><button type="button" className={n ? "" : "z"} onClick={() => dashStage(s[0])}><b><bdi>{n}</bdi></b><span>{s[1]}</span></button></li>; })}</ol>
      {V.role === "hr" ? <div className="small muted hx-src"><span>Where candidates come from</span>{' '}{srcE.length ? srcE.map(([k, v], i) => <Fragment key={k}>{i ? ' ' : null}<span className="tag">{`${k} · ${v}`}</span></Fragment>) : <span>No candidates yet</span>}</div> : null}</div>
    <div className="card hx-na-card"><div className="row"><h3>Next action</h3><span className="sp"></span>{NA.length ? <span className="small muted"><bdi>{NA.length}</bdi> waiting</span> : null}</div>
      {NA.length ? <>
        <ul className="hx-na" aria-label="Next action">{shownNA.map((a, i) => <li key={i} className={a.sla && a.d > 2 ? "late" : ""}><div className="a"><b>{a.t}</b><span className="small muted" data-noi18n dir="auto">{a.s}</span></div><div className="o"><span className="small muted">Owner</span>{' '}<span>{a.o}</span></div><div className="s">{a.sla ? <span className={`tag ${a.d > 2 ? "bad" : a.d > 1 ? "warn" : "ok"}`}>{`${a.d} / 2 days`}</span> : a.d ? <span className="tag">{`${a.d}d waiting`}</span> : <span className="tag">New today</span>}</div><div className="b"><button className={`btn sm ${a.sla && a.d > 2 ? "br" : "sec"}`} onClick={() => runGo(a.go)}>Review</button></div></li>)}</ul>
        {NA.length > 8 ? <button className="btn sm sec" style={css('margin-top:8px')} onClick={() => { V.dashAll = !V.dashAll; render(); }}>{V.dashAll ? "Show fewer" : "Show all"}</button> : null}</> : <div className="hx-empty">{empty}</div>}</div>
  </>;
}

export function pApprovals(C) {
  const rq = (Object.values(S.reqs) as any[]).filter(r => r.status === "requested").sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)), fc = (Object.values(C) as any[]).filter(c => c.stage === "approval").sort((a, b) => (a.stageAt || 0) - (b.stageAt || 0));
  return <>
    <div className="top"><div><h1>CEO approvals</h1><p>Two working days on each — vacancies and final candidates.</p></div></div>
    <div className="grid g2 hx-appr">
      <div className="card"><div className="row"><h3>Vacancies to approve (step 2)</h3><span className="sp"></span><span className={`tag ${rq.length ? "warn" : ""}`}><bdi>{rq.length}</bdi></span></div>
        {rq.length ? <ul className="hx-q">{rq.map(r => <li key={r.id}><div className="m"><b data-noi18n dir="auto">{`${r.title} × ${r.headcount || 1}`}</b><span className="small muted">{`${r.dept} · ${place(r)} · ${r.reason || ""}`}</span><span className="small"><span className="muted">Salary range</span>{' '}<bdi>{`${fmtN(r.salMin)}–${fmtN(r.salMax)} ${r.cur || ""}`}</bdi></span></div><div className="s">{sla(r.createdAt)}</div><div className="b"><button className="btn sm sec" onClick={() => openReq(r.id)}>Review</button><button className="btn sm ok" onClick={() => reqAct(r.id, 'approve')}>Approve</button></div></li>)}</ul>
          : <div className="hx-empty"><p>No vacancies waiting.</p><p className="small muted">New hiring requests from department heads show here.</p></div>}</div>
      <div className="card"><div className="row"><h3>Final candidates to approve (step 14)</h3><span className="sp"></span><span className={`tag ${fc.length ? "warn" : ""}`}><bdi>{fc.length}</bdi></span></div>
        {fc.length ? <ul className="hx-q">{fc.map(c => { const r = reqOf(c); return <li key={c.id}><div className="m"><b data-noi18n dir="auto">{c.name}</b><span className="small muted" data-noi18n dir="auto">{r.title || ""}</span><span className="small">{`Screen ${f1(scr(c, r))} · Interview ${f1(ivAvg(c))}`}</span><span className="small"><span className="muted">Package</span>{' '}<bdi>{fmtN(c.fin?.total)}</bdi>{' '}<span className="muted small">{`(basic ${fmtN(c.fin?.basic)})`}</span></span></div><div className="s">{sla(c.stageAt)}</div><div className="b"><button className="btn sm br" onClick={() => openCand(c.id)}>Review</button></div></li>; })}</ul>
          : <div className="hx-empty"><p>No candidates waiting.</p><p className="small muted">HR sends final candidates here after the references.</p></div>}</div></div>
  </>;
}

export const sla = t => { const d = workDaysSince(t); return <span className={`tag ${d > 2 ? "bad" : d > 1 ? "warn" : "ok"}`}>{`${d} / 2 days`}</span>; };

export function pReqs() {
  const f = V.rf || (V.rf = RF0()), C = allCands();
  const all = (Object.values(S.reqs) as any[]).filter(headSees);
  const cnt = {}; (Object.values(C) as any[]).forEach(c => { const x = cnt[c.req] || (cnt[c.req] = [0, 0]); x[0]++; if (c.stage === "hired") x[1]++; });
  const uniq = a => [...new Set(a.filter(Boolean))].sort() as any[];
  const L = all.filter(r => {
    if (f.title && r.title !== f.title) return false; if (f.status && r.status !== f.status) return false; if (f.dept && r.dept !== f.dept) return false;
    if (f.branch && (f.branch === "Remote" ? r.work !== "Remote" : r.branch !== f.branch)) return false; if (!inRange(r.createdAt, f.date)) return false;
    if (f.q) { const q = f.q.toLowerCase(); if (![r.title, r.reqId, r.dept, place(r), nm(r.createdBy)].join(" ").toLowerCase().includes(q)) return false; } return true;
  });
  const ST = Object.keys(REQ_STATUS);
  const key = { reqId: r => r.reqId || "~", title: r => String(r.title || "").toLowerCase(), dept: r => (r.dept || "") + " " + place(r), createdAt: r => r.createdAt || 0, joinBy: r => r.joinBy || 0, cands: r => (cnt[r.id] || [0])[0], status: r => ST.indexOf(r.status) }[f.sort] || (r => r.createdAt || 0);
  L.sort((a, b) => { const x = key(a), y = key(b); return (x < y ? -1 : x > y ? 1 : 0) * f.dir || (b.createdAt || 0) - (a.createdAt || 0); });
  const th = (k, label) => <th key={k} scope="col" aria-sort={f.sort === k ? (f.dir > 0 ? "ascending" : "descending") : "none"}><button type="button" className={`hx-sort${f.sort === k ? " on" : ""}`} onClick={() => sortReq(k)}><span>{label}</span>{svg(f.sort === k ? (f.dir > 0 ? IC.up : IC.down) : IC.sort)}</button></th>;
  const V2 = views().reqs || [], filtered = f.q || f.title || f.status || f.dept || f.branch || f.date;
  return <>
    <div className="top"><div><h1>Hiring requests</h1><p>{V.role === "head" ? "One form, about 10 minutes. From the second hire of the same role, start from the last request." : "Department heads raise them; CEO approves; HR builds the scorecard; head approves; HR posts."}</p></div><button className="btn br" onClick={() => reqForm()}>+ New hiring request</button></div>
    <div className="card">
      <div className="hx-bar" role="search">
        <label className="fld q"><span>Search</span><span className="hx-search">{svg(IC.search)}<input id="rq_q" type="search" placeholder="Role, request ID, department…" defaultValue={f.q} onInput={e => { const el = e.currentTarget; liveQ('rq_q', () => { V.rf.q = el.value; }); }} /></span></label>
        <label className="fld"><span>Role</span><select id="rq_title" defaultValue={String(f.title ?? "")} onChange={e => { V.rf.title = e.currentTarget.value; render(); }}>{opt("", "All roles")}{uniq(all.map(r => r.title)).map(t => <Fragment key={t}>{opt(t, t)}</Fragment>)}</select></label>
        <label className="fld"><span>Status</span><select id="rq_status" defaultValue={String(f.status ?? "")} onChange={e => { V.rf.status = e.currentTarget.value; render(); }}>{opt("", "All statuses")}{ST.map(k => <Fragment key={k}>{opt(k, REQ_STATUS[k][0])}</Fragment>)}</select></label>
        <label className="fld"><span>Department</span><select id="rq_dept" defaultValue={String(f.dept ?? "")} onChange={e => { V.rf.dept = e.currentTarget.value; render(); }}>{opt("", "All departments")}{uniq(all.map(r => r.dept)).map(d => <Fragment key={d}>{opt(d, d)}</Fragment>)}</select></label>
        <label className="fld"><span>Branch</span><select id="rq_branch" defaultValue={String(f.branch ?? "")} onChange={e => { V.rf.branch = e.currentTarget.value; render(); }}>{opt("", "All branches")}{uniq(all.map(r => r.branch)).map(d => <Fragment key={d}>{opt(d, d)}</Fragment>)}{all.some(r => r.work === "Remote") ? opt("Remote", "Remote") : null}</select></label>
        <label className="fld"><span>Raised</span><select id="rq_date" defaultValue={String(f.date ?? "")} onChange={e => { V.rf.date = e.currentTarget.value; render(); }}>{RANGES.map(([v, t]) => <Fragment key={v}>{opt(v, t)}</Fragment>)}</select></label>
      </div>
      <div className="hx-views row">
        <label className="hx-vl"><span className="small muted">Saved views</span><select id="rq_view" defaultValue={String(V.rview ?? "")} onChange={e => useView(e.currentTarget.value)}>{opt("", "Choose a view")}{V2.map(v => <Fragment key={v.name}>{opt(v.name, v.name)}</Fragment>)}</select></label>
        <button type="button" className="btn sm sec" id="rq_save" onClick={() => saveView()}>Save view</button>
        {V.rview ? <button type="button" className="btn sm bad" onClick={() => delView()}>Delete view</button> : null}
        {filtered ? <button type="button" className="btn sm sec" onClick={() => { V.rf = { ...RF0(), sort: V.rf.sort, dir: V.rf.dir }; V.rview = ''; render(); }}>Clear filters</button> : null}
        <span className="sp"></span><span className="small muted" id="rq_count">{`Showing ${L.length} of ${all.length}`}</span>
      </div>
      {all.length ? <div className="hx-tw"><table className="hx-t"><thead><tr>{th("reqId", "Req ID")}{th("title", "Role")}{th("dept", "Dept · branch")}{th("createdAt", "Raised")}{th("joinBy", "Joining")}{th("cands", "Candidates")}{th("status", "Status")}</tr></thead><tbody>
        {L.length ? L.map(r => { const n = cnt[r.id] || [0, 0]; const s = REQ_STATUS[r.status] || [r.status, ""]; return <tr key={r.id} className="click" tabIndex={0} onClick={() => openReq(r.id)} onKeyDown={e => { if (e.key === 'Enter') openReq(r.id); }}><td className="muted"><bdi>{r.reqId || "—"}</bdi></td><td><b>{r.title}</b>{` × ${r.headcount || 1}`}</td><td>{`${r.dept} · ${place(r)}`}</td><td><bdi>{fmtD(r.createdAt)}</bdi></td><td><bdi>{fmtD(r.joinBy)}</bdi></td><td><bdi>{n[0]}</bdi>{' '}<span className="muted small">{`${n[1]} hired`}</span></td><td><span className={`tag ${s[1]}`}>{s[0]}</span></td></tr>; }) : <tr><td colSpan={7} className="empty">No requests match these filters.</td></tr>}
      </tbody></table></div> : <div className="hx-empty"><p>No hiring requests yet.</p><p className="small muted">{V.role !== "candidate" ? "Raise the first one." : ""}</p><button className="btn br" onClick={() => reqForm()}>+ New hiring request</button></div>}</div>
  </>;
}

export function pPipeline(C) {
  let L = (Object.values(C) as any[]).filter(c => headSees(reqOf(c)));
  if (V.role === "head") L = L.filter(c => SI[c.stage] >= SI.shortlist || c.stage === "hired");
  const f = V.filter; if (f.req) L = L.filter(c => c.req === f.req); if (f.q) { const q = f.q.toLowerCase(); L = L.filter(c => (c.name + " " + c.email + " " + (c.cvText || "")).toLowerCase().includes(q)); }
  const reqs = (Object.values(S.reqs) as any[]).filter(headSees);
  const stg = STAGES.filter(s => V.role !== "head" || SI[s[0]] >= SI.shortlist);
  const byStage: any = {}; L.forEach(c => byStage[c.stage] = (byStage[c.stage] || 0) + 1);
  const chipL = [["", "All stages", L.length], ...stg.map(s => [s[0], s[1], byStage[s[0]] || 0]), ...(V.role === "hr" ? [["rejected", "Rejected", byStage.rejected || 0], ["pool", "Talent pool", byStage.pool || 0]] : [])];
  const openRoles = (Object.values(S.reqs) as any[]).filter(r => ["open", "ready"].includes(r.status));
  const head = <>
    <div className="top"><div><h1>Candidates</h1><p>{V.role === "head" ? "Shortlisted candidates for your roles. Score each interview on your own before discussing." : "Every move is logged the same day. Every rejection names the criterion it failed."}</p></div>
      <div className="row">{V.role === "hr" ? <button className="btn sec" onClick={() => addApplicant()}>+ Add applicant</button> : null}<div className="hx-seg" role="group" aria-label="View"><button type="button" className={V.pv === "list" ? "on" : ""} aria-pressed={V.pv === "list" ? 'true' : 'false'} onClick={() => { V.pv = 'list'; render(); }}>List view</button><button type="button" className={V.pv === "board" ? "on" : ""} aria-pressed={V.pv === "board" ? 'true' : 'false'} onClick={() => { V.pv = 'board'; render(); }}>Board view</button></div></div></div>
    <div className="hx-bar" role="search">
      <label className="fld q"><span>Search</span><span className="hx-search">{svg(IC.search)}<input id="pp_q" type="search" placeholder="Search name, email, CV text…" defaultValue={f.q} onInput={e => { const el = e.currentTarget; liveQ('pp_q', () => { V.filter.q = el.value; }); }} /></span></label>
      <label className="fld"><span>Role</span><select id="pp_req" defaultValue={String(f.req ?? "")} onChange={e => { V.filter.req = e.currentTarget.value; render(); }}><option value="">All roles</option>{reqs.map(r => <option key={r.id} value={r.id}>{`${r.title} · ${place(r)}`}</option>)}</select></label>
    </div>
    <div className="hx-chips" role="group" aria-label="Stages">{chipL.map(([k, t, n]) => <button key={k} type="button" className={`hx-chip${(f.stage || "") === k && V.pv === "list" ? " on" : ""}${n ? "" : " z"}`} aria-pressed={(f.stage || "") === k && V.pv === "list" ? 'true' : 'false'} onClick={() => { V.filter.stage = k; V.pv = 'list'; render(); }}><span>{t}</span><b><bdi>{n}</bdi></b></button>)}</div>
  </>;
  if (!L.length && !f.q && !f.req) {
    const e = V.role !== "hr" ? <><p>No candidates on your shortlist yet.</p><p className="small muted">HR sends shortlisted candidates for your roles here.</p></>
      : !openRoles.length ? <><p>No open roles yet.</p><p className="small muted">Post a role first. Then people can apply and you can add applicants.</p>{canPost() ? <button className="btn br" onClick={() => postFlow()}>Post a role</button> : null}</>
        : <><p>No candidates yet.</p><p className="small muted">Applications from the careers page land here. You can also add walk-ins and email CVs.</p><button className="btn br" onClick={() => addApplicant()}>+ Add applicant</button></>;
    return <>{head}<div className="card hx-empty">{e}</div></>;
  }
  const live = L.filter(c => !["rejected", "pool"].includes(c.stage));
  if (V.pv === "board") {
    const cols = stg;
    return <>{head}<div className="kanban">{cols.map(s => { const cs = live.filter(c => c.stage === s[0]); return <div key={s[0]} className="col"><h4><span>{s[1]}</span><span>{cs.length}</span></h4>{cs.slice(0, 60).map(c => <Fragment key={c.id}>{card(c)}</Fragment>)}{cs.length > 60 ? <p className="small muted">{`${cs.length - 60} more in this stage. Use the list view or search.`}</p> : null}</div>; })}</div>
      <p className="small muted">{`${L.length - live.length} rejected or in talent pool — see the list view${V.role === "hr" ? " or Talent pool" : ""}.`}</p></>;
  }
  if (f.stage) L = L.filter(c => c.stage === f.stage);
  const sel = V.sel;
  const rows = shown(L.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), "list");
  return <>{head}{V.role === "hr" ? <div className="row hx-bulk"><span className="small muted">{`${sel.size} selected`}</span><button className="btn sm sec" ref={offAtStart(!sel.size)} onClick={() => bulk('advance')}>Move to next stage</button><button className="btn sm sec" ref={offAtStart(!sel.size)} onClick={() => bulk('pool')}>Talent pool</button><button className="btn sm bad" ref={offAtStart(!sel.size)} onClick={() => bulk('reject')}>Reject with reason</button></div> : null}
    <div className="card"><div className="hx-tw"><table className="hx-t"><thead><tr>{V.role === "hr" ? <th scope="col"><input type="checkbox" style={css('width:auto')} aria-label="Select all" onChange={e => (window as any).L_all(e.currentTarget.checked)} /></th> : null}<th scope="col">Candidate</th><th scope="col">Role</th><th scope="col">Stage</th><th scope="col">Screen</th><th scope="col">Interview</th><th scope="col">Applied</th></tr></thead><tbody>
      {rows.length ? rows.map(c => { const r = reqOf(c); return <tr key={c.id} className="click" onClick={() => openCand(c.id)}>{V.role === "hr" ? <td onClick={e => e.stopPropagation()}><input type="checkbox" style={css('width:auto')} aria-label="Select" defaultChecked={!!sel.has(c.id)} onChange={e => { e.currentTarget.checked ? V.sel.add(c.id) : V.sel.delete(c.id); render(); }} /></td> : null}<td><b>{c.name}</b><div className="small muted">{c.source || ""}</div></td><td>{r.title || "—"}</td><td>{stageSum(c)}</td><td><bdi>{f1(scr(c, r))}</bdi></td><td><bdi>{f1(ivAvg(c))}</bdi></td><td><bdi>{fmtD(c.createdAt)}</bdi></td></tr>; }) : <tr><td colSpan={7} className="empty">No candidates.</td></tr>}{moreRow(L, "list", 7)}</tbody></table></div></div></>;
}

export function stageTag(c) {
  if (c.stage === "rejected") return <span className="tag bad">Rejected</span>; if (c.stage === "pool") return <span className="tag blue">Talent pool</span>; if (c.stage === "hired") return <span className="tag ok">Hired</span>; return <span className="tag">{STAGES[SI[c.stage]][1]}</span>;
}

export function card(c) {
  const r = reqOf(c); const s = scr(c, r), iv = ivAvg(c); const wait = ["shortlist", "approval"].includes(c.stage) ? workDaysSince(c.stageAt) : 0;
  return <div className="cc" onClick={() => openCand(c.id)}><b>{c.name}</b><div className="small muted">{`${r.title || ""}${place(r) ? " · " + place(r) : ""}`}</div><div className="row small" style={css('margin-top:5px;gap:5px')}>{s != null ? <span className={`tag ${s >= PASS ? "ok" : "warn"}`}>{`S ${f1(s)}`}</span> : null}{iv != null ? <span className={`tag ${iv >= PASS ? "ok" : "warn"}`}>{`I ${f1(iv)}`}</span> : null}{c.cvFile ? <span className="tag">CV</span> : null}{c.online && c.unsaved ? <span className="tag br">new online</span> : null}{wait > 2 ? <span className="tag bad">{`${wait}d waiting`}</span> : null}</div></div>;
}

export function pPool(C) {
  const L = (Object.values(C) as any[]).filter(c => ["rejected", "pool"].includes(c.stage));
  const old = L.filter(c => c.personality && c.personality.summary && workDaysSince(c.reject?.at || c.stageAt) > 130);
  const rows = shown(L, "pool");
  return <>
    <div className="top"><div><h1>Talent pool & compliance</h1><p>Rejected candidates get a reply. Strong "not now" candidates stay searchable for the next opening.</p></div></div>
    {old.length ? <div className="note" style={css('margin-bottom:12px')}><b>{`${old.length} personality report(s) past 6 months`}</b>{' for unsuccessful candidates — the Hiring Guide says delete them. '}<button className="btn sm sec" onClick={() => purgeOld()}>Delete those reports</button></div> : <div className="note ok" style={css('margin-bottom:12px')}>Retention check: no personality reports older than 6 months for unsuccessful candidates.</div>}
    <p className="small muted hx-priv">{svg(IC.lock)}{' '}<span>Phone numbers and emails are hidden. Press Show to see them. Each time is recorded (who, which candidate, when).</span></p>
    <div className="card"><div className="hx-tw"><table className="hx-t"><thead><tr><th scope="col">Candidate</th><th scope="col">Contact</th><th scope="col">Applied for</th><th scope="col">Status</th><th scope="col">Reason on file</th><th scope="col">Consent</th><th scope="col"><span className="hx-sr">Actions</span></th></tr></thead><tbody>{rows.length ? rows.map(c => <tr key={c.id} className="click" onClick={() => openCand(c.id)}><td><b>{c.name}</b></td><td onClick={e => e.stopPropagation()}>{contactHTML(c)}</td><td>{reqOf(c).title || "—"}</td><td>{stageTag(c)}</td><td className="small">{c.reject?.reason || c.poolNote || "—"}</td><td>{c.consent ? <span className="tag ok">Yes</span> : <span className="tag warn">Not recorded</span>}</td><td className="right">{c.stage === "pool" ? <button className="btn sm sec" onClick={e => { e.stopPropagation(); reconsider(c.id); }}>Consider for a role</button> : null}</td></tr>) : <tr><td colSpan={7} className="empty">Nobody here yet.</td></tr>}{moreRow(L, "pool", 7)}</tbody></table></div></div>
  </>;
}

/* Pure (no handlers): core also swaps this label in place with its page text. */
export function bStat(k) {
  const dirty = V.bdraft && V.bdraft[k] != null;
  return dirty ? <span className="hx-st un" id={`st_${k}`}>Unsaved</span> : <span className="hx-st ok" id={`st_${k}`}>{svg(IC.check)}<span>{V.bsaved && V.bsaved[k] ? "Saved " + fmtT(V.bsaved[k]) : "Saved"}</span></span>;
}
