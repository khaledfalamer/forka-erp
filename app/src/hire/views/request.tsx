/* Hire: the hiring request form (4 steps), opening a request, adding an applicant, AI summary and AI questions. */
import {
  S, V, DRAFT, $, fmtD, fmtN, fmtT, f1, nm, place, scr, PR, CR, PASS, DEPTS, BRANCHES, WORK, PRACTICAL, TRAITS,
  COMPETENCY, REQ_STATUS, WSTEPS, allCands, headSees, reqOf, openModal, closeModal, canPost, postFlow,
  reqDraftGet, reqDraftClear, reqDraftSave, wValidate, wShow, wStep, wGo, saveReq, reqAct, delReq, saveJD,
  saveApplicant, copyTxt, AI_ON, askJSON, aiBusy, aiJD, aiParse,
} from '../core';
import { paint, css, Fragment } from '../ui';
import { stageTag } from './pages';
import { openCand } from './cand';

/* The same text esc() gave, without the HTML escaping (React escapes text itself). */
const sx = (s: any) => String(s ?? '');

export function reqForm(copyId?: any, fresh?: any) {
  const prev = Object.values(S.reqs as Record<string, any>).filter(headSees).sort((a: any, b: any) => b.createdAt - a.createdAt) as any[];
  const dr = !copyId && !fresh ? reqDraftGet() : null;
  const r: any = copyId ? { ...S.reqs[copyId] } : dr && dr.r ? { ...dr.r } : { dept: V.dept || "", mustHaves: ["", "", ""], testQs: ["", "", ""], traits: [] };
  V.rstep = dr && !copyId ? Math.max(1, Math.min(4, dr.step || 1)) : 1; V.rtried = {};
  const sel = (id: string, opts: any[], v: any) => <select id={id} aria-describedby={`e_${id}`} defaultValue={v}><option value="">Choose…</option>{opts.map(o => <option key={o}>{o}</option>)}</select>;
  const RQ = <span className="hx-req" aria-hidden="true">*</span>;
  const err = (id: string) => <div className="hx-err" id={`e_${id}`} aria-live="polite"></div>;
  const F = (id: string, label: any, ctl: any, opt2?: any) => <div className={`hx-f${opt2 && opt2.wide ? " wide" : ""}`}><label htmlFor={id}><span>{label}</span>{opt2 && opt2.req ? RQ : null}{opt2 && opt2.hint ? <>{' '}<span className="hint">{opt2.hint}</span></> : null}</label>{ctl}{opt2 && opt2.help ? <div className="small muted">{opt2.help}</div> : null}{err(id)}</div>;
  const inp = (id: string, val: any, extra?: any) => <input id={id} aria-describedby={`e_${id}`} defaultValue={sx(val)} {...(extra || {})} />;
  openModal(<div className="hx-wiz"><div className="hd"><div><h2>New hiring request</h2><div className="small muted">Step 1 of the Hiring Guide · about 10 minutes · CEO approves within 2 working days</div></div><button className="x" onClick={() => closeModal()} aria-label="Close">×</button></div>
    <div className="bd">
      <ol className="hx-prog" id="w_prog" aria-label="Progress">{WSTEPS.map((t: any, i: number) => <li key={i}><button type="button" onClick={() => wGo(i + 1)}><span className="n"><bdi>{i + 1}</bdi></span><span className="t">{t}</span></button></li>)}</ol>
      <p className="small muted hx-stepn"><span id="w_stepn">Step 1 of 4</span> · <span>Fields marked * are required</span></p>
      {dr && !copyId ? <div className="note info hx-dn"><span>Your draft is back</span> · <bdi>{fmtT(dr.at)}</bdi> <button type="button" className="btn sm sec" onClick={() => reqDraftClear(true)}>Start over</button></div> : null}
      <section data-wstep="1"><h3>Role &amp; location</h3>
        {prev.length ? <div className="note info" style={css("margin-top:8px")}>Same role as before? <select style={css("width:auto;margin-inline-start:6px")} onChange={e => { e.currentTarget.value && reqForm(e.currentTarget.value); }}><option value="">Start from a previous request…</option>{prev.map(p => <option key={p.id} value={p.id}>{`${sx(p.title)} · ${sx(p.branch)} · ${fmtD(p.createdAt)}`}</option>)}</select></div> : null}
        <div className="grid g3">
          {F("f_title", "Role title", inp("f_title", r.title, { placeholder: "e.g. Branch Supervisor", 'aria-required': "true" }), { req: 1 })}
          {F("f_dept", "Department", V.role === "head" && V.dept ? sel("f_dept", [V.dept], V.dept) : sel("f_dept", DEPTS, r.dept), { req: 1 })}
          {F("f_branch", "Branch / location", sel("f_branch", BRANCHES, r.branch), { req: 1, help: "Remote: the branch is optional (the team it reports to)" })}
          {F("f_work", "Work type", sel("f_work", WORK, r.work || "On site"))}
          {F("f_hc", "Headcount", <input id="f_hc" type="number" min="1" inputMode="numeric" defaultValue={`${r.headcount || 1}`} />)}
          {F("f_reason", "New or replacement", sel("f_reason", ["New position", "Replacement"], r.reason))}
        </div>
        {F("f_purpose", "Role purpose", <textarea id="f_purpose" placeholder="e.g. Run the floor and the shift team so every guest gets the same standard." defaultValue={sx(r.purpose)}></textarea>, { hint: "one or two lines", wide: 1 })}
        {F("f_duties", "Key duties", <textarea id="f_duties" placeholder="e.g. Open and close the branch, lead shift briefings, handle complaints, train new staff." defaultValue={sx(r.duties)}></textarea>, { wide: 1 })}
      </section>
      <section data-wstep="2" hidden><h3>Compensation &amp; timing</h3>
        <div className="grid g3">
          {F("f_smin", "Salary range — min (total package)", <input id="f_smin" type="number" inputMode="numeric" placeholder="e.g. 6000" defaultValue={`${r.salMin || ""}`} />)}
          {F("f_smax", "Salary range — max", <input id="f_smax" type="number" inputMode="numeric" placeholder="e.g. 8000" aria-required="true" aria-describedby="e_f_smax" defaultValue={`${r.salMax || ""}`} />, { req: 1 })}
          {F("f_cur", "Currency", sel("f_cur", ["AED", "OMR"], r.cur || "AED"))}
          {F("f_join", "Target joining date", <input id="f_join" type="date" defaultValue={r.joinBy ? new Date(r.joinBy).toISOString().slice(0, 10) : ""} />)}
        </div>
        <div className="note" style={css("margin-top:12px")}>The salary range is for the CEO and HR only. It never appears in the job ad.</div>
      </section>
      <section data-wstep="3" hidden><h3>Evaluation plan</h3>
        <div className="grid g2"><div className="hx-f"><label><span>Top 3 must-haves</span>{RQ} <span className="hint">CV screening scores against these</span></label>{[0, 1, 2].map(i => <Fragment key={i}><input id={`f_mh${i}`} aria-label={`Must-have ${i + 1}`} aria-describedby={`e_f_mh${i}`} aria-required="true" style={css("margin-bottom:2px")} placeholder={i === 0 ? "e.g. 3+ years supervising in a UAE restaurant" : undefined} defaultValue={sx(r.mustHaves?.[i])} />{err("f_mh" + i)}</Fragment>)}</div>
          <div className="hx-f"><label><span>Top 3 things to test in interview</span></label>{[0, 1, 2].map(i => <input key={i} id={`f_tq${i}`} aria-label={`Interview test ${i + 1}`} style={css("margin-bottom:6px")} placeholder={i === 0 ? "e.g. Handling a guest complaint at peak time" : undefined} defaultValue={sx(r.testQs?.[i])} />)}</div></div>
        <div className="hx-f"><label><span>Practical test(s)</span>{RQ} <span className="hint">choose one or more</span></label><div className="pills hx-grp" id="g_pr" role="group" aria-describedby="e_g_pr">{PRACTICAL.map((x: any) => <label key={x} className="chk" style={css("margin:0 12px 0 0;font-weight:500")}><input type="checkbox" className="f_pr" value={x} defaultChecked={!!PR(r).includes(x)} />{x}</label>)}</div>{err("g_pr")}
          <input id="f_prother" placeholder="Other practical test (optional)" aria-label="Other practical test (optional)" style={css("margin-top:6px")} defaultValue={sx(PR(r).filter((x: any) => !PRACTICAL.includes(x)).join(", "))} /></div>
        <div className="hx-f"><label><span>2–3 personality traits that matter most</span>{RQ} <span className="hint">tick "Critical" on any trait where a very low result must be cleared in interview — as many as you need</span></label><div className="hx-grp" id="g_tr" role="group" aria-describedby="e_g_tr">{TRAITS.map((t: any) => <div key={t[0]} className="crit"><label className="chk" style={css("margin:0;font-weight:500")}><input type="checkbox" className="f_tr" value={t[0]} defaultChecked={!!(r.traits || []).includes(t[0])} /><span><b>{t[0]}</b> <span className="muted small">{`— ${t[1]}`}</span></span></label><label className="chk" style={css("margin:0;font-weight:500;color:var(--bad)")}><input type="checkbox" className="f_cr" value={t[0]} defaultChecked={!!CR(r).includes(t[0])} onChange={e => { if (e.currentTarget.checked) (document.querySelector('.f_tr[value="' + e.currentTarget.value + '"]') as HTMLInputElement).checked = true; }} />Critical</label></div>)}</div>{err("g_tr")}</div>
      </section>
      <section data-wstep="4" hidden><h3>Review &amp; submit</h3>
        <p className="small muted">Check everything once. Use Edit to change a part.</p>
        <div id="w_review"></div>
        <div className="note info" style={css("margin-top:12px")}>When you send it, the CEO approves or declines it within 2 working days. Nothing is posted before that.</div>
      </section>
    </div>
    <div className="ft hx-wft"><span className="small muted hx-dsv" id="w_saved" aria-live="polite">{dr && !copyId ? "Draft saved " + fmtT(dr.at) : ""}</span><span className="sp"></span><button className="btn sec" onClick={() => closeModal()}>Cancel</button><button className="btn sec" id="w_back" onClick={() => wStep(-1)}>Back</button><button className="btn br" id="w_next" onClick={() => wStep(1)}>Next</button><button className="btn br" id="w_send" onClick={() => saveReq()}>Send for CEO approval</button></div></div>);
  const box = document.querySelector("#dlg .hx-wiz");
  const on = () => { if (V.rtried[V.rstep]) wValidate(V.rstep, true); clearTimeout((window as any)._rdt); (window as any)._rdt = setTimeout(reqDraftSave, 400) };
  box.addEventListener("input", on); box.addEventListener("change", on);
  wShow();
}

export function openReq(id: any) {
  const r: any = S.reqs[id]; if (!r) return; const s = REQ_STATUS[r.status] || [r.status, ""];
  const isHR = V.role === "hr", canHead = V.role === "head" || isHR;
  const cands = Object.values(allCands() as Record<string, any>).filter((c: any) => c.req === id) as any[];
  const steps = ["requested", "approved", "review", "ready", "open"]; const si = steps.indexOf(r.status);
  openModal(<><div className="hd"><div><div className="small muted">{`${sx(r.reqId || "Not yet approved")} · raised by ${sx(nm(r.createdBy))} ${fmtD(r.createdAt)}`}</div><h2>{`${sx(r.title)} × ${r.headcount}`}</h2><div className="small">{`${sx(r.dept)} · ${sx(place(r))} · ${sx(r.reason)} · join by ${fmtD(r.joinBy)}`}</div></div><span className={`tag ${s[1]}`} style={css("margin-left:auto")}>{s[0]}</span><button className="x" onClick={() => closeModal()}>×</button></div>
    <div className="bd"><div className="steps">{["Request", "CEO approves", "HR scorecard", "Head approves", "Posted"].map((t, i) => <span key={i} className={si > i || r.status === "filled" ? "done" : si === i ? "cur" : ""}>{t}</span>)}</div>
      <div className="grid g2" style={css("margin-top:12px")}><div className="card"><h3>The role</h3><p className="small"><b>Purpose:</b>{` ${sx(r.purpose || "—")}`}</p><p className="small"><b>Duties:</b>{` ${sx(r.duties || "—")}`}</p>{isHR || V.ceo ? <p className="small"><b>Salary range:</b>{` ${fmtN(r.salMin)}–${fmtN(r.salMax)} ${r.cur} total package · basic = 30%`}</p> : <p className="small"><b>Salary range:</b>{` ${fmtN(r.salMin)}–${fmtN(r.salMax)} ${r.cur}`}</p>}</div>
        <div className="card"><h3>Scorecard inputs</h3><p className="small"><b>Must-haves:</b>{` ${r.mustHaves.map(sx).join(" · ")}`}</p><p className="small"><b>Test in interview:</b>{` ${r.testQs.map(sx).join(" · ")}`}</p><p className="small"><b>Practical:</b>{` ${sx(r.practical)} · `}<b>Traits:</b>{` ${r.traits.map(sx).join(", ")}${r.critical ? " · " : ""}`}{r.critical ? <><b>critical:</b>{` ${sx(r.critical)}`}</> : null}</p></div></div>
      {(isHR && ["approved", "review", "ready", "open"].includes(r.status)) ? <div className="card sec"><div className="row"><h3>Job description, ad &amp; pre-screening</h3><span className="sp"></span>{AI_ON() ? <button className="btn sm ai" onClick={() => aiJD(id)}>Draft JD + ads with AI</button> : null}</div>
        {AI_ON() ? <><label>Notes for the AI, for this job only <span className="hint">optional — e.g. "mention the night-shift allowance"</span></label><input id="r_ainote" maxLength={600} placeholder="Anything special about this job?" /></> : null}
        <label>Job description</label><textarea id="r_jd" style={css("min-height:140px")} defaultValue={sx(r.jd || "")}></textarea>
        <div className="grid g2"><div><label>Job ad — English <span className="hint">LinkedIn / Indeed</span></label><textarea id="r_ad" style={css("min-height:120px")} defaultValue={sx(r.ad || "")}></textarea></div><div><label>Job ad — Arabic</label><textarea id="r_adar" dir="rtl" style={css("min-height:120px")} defaultValue={sx(r.adAr || "")}></textarea></div></div>
        <label>Job title — Arabic <span className="hint">shown on the careers page in Arabic</span></label><input id="r_titlear" dir="rtl" defaultValue={sx(r.titleAr || "")} />
        <label>Pre-screening knock-out questions <span className="hint">one per line — candidate must answer Yes, or is auto-rejected with the reason logged</span></label><textarea id="r_ko" defaultValue={(r.knockout || []).join("\n")}></textarea>
        <label>Knock-out questions — Arabic <span className="hint">same questions, same order, one per line</span></label><textarea id="r_koar" dir="rtl" defaultValue={(r.knockoutAr || []).join("\n")}></textarea>
        <div className="row" style={css("margin-top:10px")}><button className="btn sec" onClick={() => saveJD(id)}>Save</button>{r.status === "approved" ? <button className="btn br" onClick={() => saveJD(id, 'review')}>{`Send scorecard to ${sx(r.dept)} head`}</button> : null}{r.ad ? <button className="btn sm sec" onClick={() => copyTxt((document.getElementById('r_ad') as HTMLTextAreaElement).value)}>Copy English ad</button> : null}</div></div> : (r.jd ? <div className="card sec"><h3>Job description</h3><pre className="out">{r.jd}</pre>{r.knockout?.length ? <p className="small"><b>Knock-out questions:</b>{` ${r.knockout.map(sx).join(" · ")}`}</p> : null}</div> : null)}
      {cands.length ? <div className="card sec"><h3>{`Candidates (${cands.length})`}</h3><table><tbody>{cands.map(c => <tr key={c.id} className="click" onClick={() => openCand(c.id)}><td>{c.name}</td><td>{stageTag(c)}</td><td>{f1(scr(c, r))}</td></tr>)}</tbody></table></div> : null}
      <div className="hist">{(r.history || []).map((h: any, i: number) => <div key={i}>{`${fmtD(h.t)} · ${sx(nm(h.by))} — ${sx(h.m)}`}</div>)}</div></div>
    <div className="ft">
      {r.status === "requested" && V.ceo ? <><button className="btn bad" onClick={() => reqAct(id, 'decline')}>Decline</button><button className="btn ok" onClick={() => reqAct(id, 'approve')}>Approve vacancy</button></> : null}
      {r.status === "review" && canHead && (V.role === "head" || V.ceo) ? <><button className="btn sec" onClick={() => reqAct(id, 'changes')}>Ask HR for changes</button><button className="btn ok" onClick={() => reqAct(id, 'headok')}>Approve scorecard</button></> : null}
      {r.status === "ready" && isHR ? <button className="btn br" onClick={() => reqAct(id, 'post')}>Post job</button> : null}
      {r.status === "open" && isHR ? <><button className="btn sec" onClick={() => reqAct(id, 'close')}>Close role</button><button className="btn sec" onClick={() => addApplicant(id)}>+ Add applicant</button></> : null}
      {V.role !== "candidate" ? <button className="btn sec" onClick={() => reqForm(id)}>Duplicate</button> : null}
      {isHR || V.ceo ? <button className="btn bad" id="delreq" style={css("margin-inline-start:auto")} onClick={() => delReq(id)}>Delete request</button> : null}
    </div></>);
}

export function addApplicant(reqId?: any) {
  const R = Object.values(S.reqs as Record<string, any>).filter((r: any) => ["open", "ready"].includes(r.status)) as any[];
  if (!R.length) { openModal(<><div className="hd"><div><h2>Add applicant</h2></div><button className="x" onClick={() => closeModal()} aria-label="Close">×</button></div><div className="bd hx-empty"><p>Post a role first — no open roles yet</p><p className="small muted">Applicants are added to a posted role. Post one, then add walk-ins and email CVs here.</p></div><div className="ft"><button className="btn sec" onClick={() => closeModal()}>Cancel</button>{canPost() ? <button className="btn br" onClick={() => postFlow()}>Post a role</button> : null}</div></>); return }
  openModal(<><div className="hd"><div><h2>Add applicant</h2><div className="small muted">From hr@forka.com, LinkedIn, Indeed, referral or walk-in</div></div><button className="x" onClick={() => closeModal()}>×</button></div>
    <div className="bd"><div className="grid g2"><div><label>Role</label><select id="n_req" defaultValue={reqId}>{R.map(r => <option key={r.id} value={r.id}>{`${sx(r.title)} · ${sx(place(r))}`}</option>)}</select></div><div><label>Source</label><select id="n_src">{["Email (hr@forka.com)", "LinkedIn", "Indeed", "Referral", "Walk-in", "Talent pool", "Agency"].map(s => <option key={s}>{s}</option>)}</select></div></div>
      <label>CV file <span className="hint">PDF or photo, from the email</span></label><input type="file" id="n_file" accept=".pdf,application/pdf,image/*" />
      <label>CV text <span className="hint">{`paste it — ${AI_ON() ? "AI can fill the fields below" : "then fill the fields"}`}</span></label><textarea id="n_cv" style={css("min-height:120px")}></textarea>{AI_ON() ? <button className="btn sm ai" style={css("margin-top:6px")} onClick={() => aiParse()}>Fill fields from CV</button> : null}
      <div className="grid g3"><div><label>Name</label><input id="n_name" /></div><div><label>Email</label><input id="n_email" /></div><div><label>Phone</label><input id="n_phone" /></div><div><label>Location</label><input id="n_loc" /></div><div><label>Years experience</label><input id="n_yrs" type="number" /></div><div><label>Expected salary</label><input id="n_sal" type="number" /></div></div>
      <div className="chk"><input type="checkbox" id="n_cons" /><span>Candidate consented to Forka holding their data (stated in the application email or form)</span></div></div>
    <div className="ft"><button className="btn sec" onClick={() => closeModal()}>Cancel</button><button className="btn br" onClick={() => saveApplicant()}>Add to pipeline</button></div></>);
}

export function aiSumHTML(d: any) {
  const a = d.ai; if (!a) return null;
  const li = (x: any[]) => x && x.length ? <ul style={css("margin:4px 0 0;padding-inline-start:18px")}>{x.map((y, i) => <li key={i}>{sx(y)}</li>)}</ul> : null;
  return <div className="note info" id="aisum" style={css("margin-top:8px")}><div className="row"><b>AI summary</b><span className="tag">Suggestion — check it against the CV</span><span className="sp"></span><span className="small muted">{fmtD(a.at)}</span></div>
    <p style={css("margin:6px 0")}>{sx(a.summary || "")}</p>
    <p className="small" style={css("margin:4px 0")}>{a.role ? <><b>Role:</b>{` ${sx(a.role)} · `}</> : null}{a.years != null ? <><b>Years:</b>{` ${sx(a.years)} · `}</> : null}{(a.languages || []).length ? <><b>Languages:</b>{` ${sx(a.languages.join(", "))} · `}</> : null}{a.visaNotice ? <><b>Visa / notice:</b>{` ${sx(a.visaNotice)}`}</> : null}</p>
    {(a.employers || []).length ? <p className="small" style={css("margin:4px 0")}><b>Recent employers:</b>{` ${sx(a.employers.join(" · "))}`}</p> : null}
    {(a.mustHaves || []).length ? <table className="small" style={css("margin-top:6px")}><tbody><tr><th>Must-have</th><th>AI score</th><th>Evidence in the CV</th></tr>{a.mustHaves.map((m: any, i: number) => <tr key={i}><td>{sx(m.item)}</td><td><span className={`tag ${m.score >= PASS ? "ok" : "warn"}`} dir="ltr">{`${m.score} / 5`}</span></td><td>{sx(m.evidence)}</td></tr>)}</tbody></table> : null}
    {(a.checks || []).length ? <><p className="small" style={css("margin:8px 0 0")}><b>Check with the candidate</b></p>{li(a.checks)}</> : null}
    {(a.questions || []).length ? <><p className="small" style={css("margin:8px 0 0")}><b>Questions about this CV</b></p>{li(a.questions)}</> : null}</div>;
}

/* The original read the global `event` (the click on the button). window.event is the same event while a React
   click handler runs; a caller may also pass the event. */
export function aiQs(ev?: any) {
  const btn = (ev || (window as any).event).target; aiBusy(btn, async () => {
    const d: any = DRAFT, r: any = reqOf(d);
    const o = await askJSON(`Write interview questions for ${r.title} at a UAE restaurant group. For each item give one question. Technical items: ${JSON.stringify(r.testQs)}. Competencies (behavioural "tell me about a time"): ${JSON.stringify(COMPETENCY)}. Personality follow-ups to probe: ${(d.personality || {}).qs || r.traits.join(", ")}. Return {"technical":[...],"competency":[...],"followups":[...]}`);
    paint($("#aiqs"), <div className="note info"><b>Questions</b><br />{[...(o.technical || []), ...(o.competency || []), ...(o.followups || [])].map((q, i) => <Fragment key={i}>{i ? <br /> : null}{"• " + sx(q)}</Fragment>)}</div>)
  })
}
