/* Board: the card detail window, the "new task" window and the small pop-up menus (moved from boards/index.html). */
import {
  listOf, boardOfList, canAdmin, ME, boardPeople, PEOPLE, inD, D, boards, blockingOf, cardsOf, waitsOn, bname, t,
  LN, pname, deptName, apS, ago, canDecide, own, V, ymd, labelsOf, lname, today, LIVE, withMentions, ntTargets, lang, DEPTS,
  SYS, isCEO, dlist, meP, ntPool, B, theme, lblNames, mondayOf, day, wlItems, fmtDay, notesFor, isHd, dnames, dept,
  cap, teamPool, procLink, edNote, numFmt, person,
} from '../core';
import { ic, av, apChip, css, Fragment } from '../ui';

export function modalHTML(c) {
  const l = listOf(c.id), b = boardOfList(l.id), admin = canAdmin(b), n = c.check.length, d = c.check.filter(x => x.d).length, pc = n ? Math.round(d / n * 100) : 0;
  /* Who may change what (Khaled, 14 Nov 2026): details only the creator, the department head and the CEO (ed); the work also whoever it is given to (wk). */
  const K = cap(c), ed = K.ed, wk = K.work;
  const pool = [...new Set(boardPeople(b).concat(c.members, PEOPLE.filter(x => inD(x, b.dept)).map(x => x.id)))] as any[];
  const moveTo = admin && ed ? D.order.map(x => D.boards[x]).filter(x => x && canAdmin(x)) : [];
  const copyTo = boards();
  const log = c.log.slice().sort((x, y) => y.at - x.at);
  const subs = c.subs || [], sd = subs.filter(x => x.done).length, sp = subs.length ? Math.round(sd / subs.length * 100) : 0;
  const inL = x => x && listOf(x.id), waits = (c.waits || []).map(id => D.cards[id]).filter(inL), blk = blockingOf(c).filter(inL), fol = c.follow || [];
  const cand = ed ? boards().map(x => {
    const cs = cardsOf(x).filter(y => y.id !== c.id && !y.done && !(c.waits || []).includes(y.id) && !waitsOn(y, c));
    return cs.length ? <optgroup key={x.id} label={bname(x)}>{cs.map(y => <option key={y.id} value={y.id}>{y.title.slice(0, 70)}</option>)}</optgroup> : null;
  }) : null;
  const SL = (k, top?) => <div className="sl" style={css(`font-size:12px;font-weight:600;color:var(--muted);margin:${top ? 4 : 14}px 0 6px`)}>{t(k)}</div>;
  const RO = (v?) => <div className="rov" dir="auto">{v || <span className="rom">{t('noneV')}</span>}</div>;
  const tickRO = on => <span className={`ckro ${on ? 'on' : ''}`} aria-label={on ? t('doneTag') : t('notDone')}>{on ? ic('tick') : ic('check')}</span>;
  const wrow = (w, extra?) => (
    <div key={w.id} className="wrow"><span className={w.done ? 'okd' : 'opn'}>{w.done ? ic('tick') : ic('clock')}</span><button className="lk" data-a="open" data-id={w.id} dir="auto">{w.title}</button><small>{bname(boardOfList(listOf(w.id).id))}</small>{extra || null}</div>
  );
  const supC = teamPool(c).filter(p => !c.members.includes(p) && p !== c.sup);
  const lbOn = labelsOf(b).filter(x => c.labels.includes(x.id));
  const pl = procLink(c);
  return (
    <div className="ov" data-a="ov"><div className="md" role="dialog" aria-modal="true" aria-label={c.title}>
      <button className="ib x" data-a="mclose" aria-label={t('close')}>{ic('x')}</button>
      <div className="mhead">{ic(c.type === 'milestone' ? 'diamond' : c.type === 'approval' ? 'stamp' : 'card')}{ed ? <textarea className="mt" dir="auto" id="mt" rows={1} maxLength={300} defaultValue={c.title} /> : <><h2 className="mt mtro" dir="auto" id="mtro">{c.title}</h2><button type="button" className="lockb" id="lockb" aria-expanded="false" aria-controls="ronote" title={t('roWhy')} aria-label={t('roWhy')} onClick={e => { const nn = document.getElementById('ronote'); nn.hidden = !nn.hidden; e.currentTarget.setAttribute('aria-expanded', String(!nn.hidden)); }}>{ic('lock')}</button></>}</div>
      <div className="msub">{bname(b)} · {t('inList')} <b>{LN(l)}</b>{c.requester ? <> · <span className="from">{t('reqBy', { p: pname(c.requester), d: deptName(c.fromDept) })}</span></> : null}{pl ? <> · <a className="procl" id="procl" href={pl.url} title={t('fromProcH')}>{ic('link')}<bdi>{t('fromProc', { n: pl.no || '' })}</bdi></a></> : null}</div>
      {c.archived ? <div className="arqb" id="archb">{ic('archive')}<span>{t('isArch')}</span>{ed ? <button className="btn" data-a="crestore" data-v={c.id}>{t('restore')}</button> : null}</div> : null}
      {c.arq && !c.archived ? <div className="arqb" id="arqb" role="status">{ic('archive')}<span><b>{t('arqBy', { p: pname(c.arq.by) })}</b> · {ago(c.arq.at)}{c.arq.why ? <span className="arqw" dir="auto">"{c.arq.why}"</span> : null}</span>
        {ed ? <><button className="btn" data-a="arqok">{t('arqAccept')}</button><button className="btn sec" data-a="arqno">{t('arqDecline')}</button></> : c.arq.by === ME() ? <button className="btn sec" data-a="arqwd">{t('arqWithdraw')}</button> : null}</div> : null}
      {ed ? null : <div className="reqnote ronote" id="ronote" hidden>{ic('lock')}<span>{edNote(c)} {t(wk ? 'roWork' : 'roSee')}</span></div>}
      <div className="mbody"><div><fieldset className="ro">
        {c.type === 'approval' ? <div className={`apbox ${apS(c)}`}><div>{apChip(c)}{c.appr && c.appr.by ? <> <span className="sm">{t('apBy', { s: t('ap_' + apS(c)), p: pname(c.appr.by) })} · {ago(c.appr.at)}</span></> : null}</div>
          {canDecide(c) ? <div className="row"><button className="btn okb" data-a="appr" data-v="approved">{ic('tick')}{t('approve')}</button><button className="btn sec" data-a="appr" data-v="changes">{t('reqChanges')}</button><button className="btn dan" data-a="appr" data-v="rejected">{t('reject')}</button></div> : <div className="lock" style={css('padding:6px 0 0')}>{t('apOnly')}</div>}</div> : null}
        <div className="sec kv">
          <div><label>{t(c.type === 'approval' ? 'approvers' : 'members')}</label><div className="lchips">{ed ? pool.map(p => <button key={p} className={`pchip ${c.members.includes(p) ? 'on' : ''}`} data-a="cm" data-v={p}>{av(p)}{pname(p)}</button>)
            : c.members.length ? c.members.map(p => <span key={p} className="pchip on">{av(p)}{pname(p)}</span>) : RO('')}</div>
            {K.redir ? <button className="btn sec redirb" data-a="redir">{ic('redir')}{t('redirect')}</button> : null}</div>
        </div>
        <div className="sec kv">
          {c.members.length ? <div><label>{t('owner')}</label>{ed ? <select className="fld" id="cown" title={t('ownerHint')} defaultValue={own(c)}>{c.members.map(m => <option key={m} value={m}>{pname(m)}</option>)}</select> : RO(pname(own(c)))}</div> : null}
          <div><label>{t('startD')}</label>{ed ? <input className={`fld ${V.dateErr ? 'miss' : ''}`} type="date" id="cstart" defaultValue={V.dateErr ? V.dateErr.s : c.start ? ymd(c.start) : ''} /> : RO(c.start ? fmtDay(c.start) : '')}</div>
          <div><label>{t('due')}</label><div className="row" style={css('margin:0')}>{ed ? <input className="fld" type="date" id="cdue" defaultValue={V.dateErr ? V.dateErr.d : c.due ? ymd(c.due) : ''} /> : RO(c.due ? <bdi>{fmtDay(c.due)}</bdi> : '')}
            {wk ? <button className={`donebx ${c.done ? 'on' : ''}`} data-a="cdone">{ic('tick')}{t('complete')}</button> : <span className={`donebx ${c.done ? 'on' : ''}`}>{ic('tick')}{t(c.done ? 'doneTag' : 'notDone')}</span>}</div></div>
        </div>
        {V.dateErr ? <div className="errbox">{t('startAfter')}</div> : null}
        <div className="sec"><div className="sh">{ic('tag')}{t('labels')}</div><div className="lchips">{ed ? labelsOf(b).map(x => <button key={x.id} className={`lchip ${c.labels.includes(x.id) ? 'on' : ''}`} style={css(`background:${x.color}`)} data-a="cl" data-v={x.id}>{c.labels.includes(x.id) ? ic('tick') : null}{lname(x)}</button>)
          : lbOn.length ? lbOn.map(x => <span key={x.id} className="lchip on" style={css(`background:${x.color}`)}>{lname(x)}</span>) : RO('')}</div></div>
        {(b.fields || []).length ? <div className="sec"><div className="sh">{ic('grid')}{t('fields')}</div><div className="cfg">{b.fields.map(f => {
          const v = (c.f || {})[f.id] ?? '';
          return <label key={f.id}><span dir="auto">{f.name}</span>{!ed
            ? RO(f.type === 'select' ? (((f.opts || []).find(o => o.id === v) || {}).name || '') : (f.type === 'number' && v !== '' ? numFmt(v) : v))
            : f.type === 'select'
              ? <select className="fld cf" data-f={f.id} defaultValue={v}><option value="">-</option>{(f.opts || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
              : <input className="fld cf" data-f={f.id} type={f.type === 'number' ? 'number' : 'text'} defaultValue={v} dir="auto" maxLength={120} />}</label>;
        })}</div></div> : null}
        <div className="sec"><div className="sh">{ic('desc')}{t('desc')}</div>{ed ? <textarea className="desc" dir="auto" id="cdesc" placeholder={t('descPh')} defaultValue={c.desc} /> : <div className="desc descro" dir="auto" id="cdescro">{c.desc ? c.desc : <span className="rom">{t('noneV')}</span>}</div>}</div>
        <div className="sec"><div className="sh">{ic('subs')}{t('subtasks')}</div>
          {subs.length ? <div className="prog"><span>{sd}/{subs.length}</span><div className="bar"><i className={sp === 100 ? 'full' : ''} style={css(`width:${sp}%`)} /></div></div> : null}
          {subs.map((s, i) => <div key={i} className={`subr ${s.done ? 'done' : ''}`}>{wk || s.who === ME() ? <input type="checkbox" data-a="subck" data-i={i} defaultChecked={!!s.done} aria-label={s.t} /> : tickRO(s.done)}<span dir="auto">{s.t}</span>
            {ed ? <><select className="fld subw" data-i={i} aria-label={t('assignTo')} defaultValue={s.who || ''}><option value="">{t('nobody')}</option>{pool.map(p => <option key={p} value={p}>{pname(p)}</option>)}</select>
              <input className={`fld subd ${s.due && !s.done && s.due < today() ? 'late' : ''}`} type="date" data-i={i} defaultValue={s.due ? ymd(s.due) : ''} aria-label={t('due')} />
              <button className="ib" data-a="subdel" data-i={i} aria-label={t('removeF')}>{ic('x')}</button></> : <small className="rom">{s.who ? pname(s.who) : t('nobody')}{s.due ? ' · ' + fmtDay(s.due) : ''}</small>}</div>)}
          {ed ? <div className="row"><input className="fld" style={css('flex:1')} dir="auto" id="subin" placeholder={t('subPh')} maxLength={200} /><button className="btn sec" data-a="subadd">{t('add')}</button></div> : subs.length ? null : RO('')}</div>
        <div className="sec"><div className="sh">{ic('link')}{t('waitingOn')}</div>{ed ? <div className="lock" style={css('padding:0 0 6px')}>{t('waitHint')}</div> : null}
          {waits.map(w => wrow(w, ed ? <button className="ib" data-a="waitdel" data-v={w.id} aria-label={t('removeF')}>{ic('x')}</button> : null))}
          {ed ? <div className="row"><select className="fld" style={css('flex:1;min-width:0')} id="wadd" aria-label={t('waitingOn')}><option value="">{t('pickTask')}</option>{cand}</select><button className="btn sec" data-a="waitadd">{t('addWait')}</button></div> : waits.length ? null : RO('')}
          {blk.length ? <><div className="lock" style={css('padding:12px 0 4px')}>{t('blocking')}</div>{blk.map(w => wrow(w))}</> : null}</div>
        <div className="sec"><div className="sh">{ic('clip')}{t('attach')}<span className="sp" />{wk ? <label className="btn sec upl">{ic('plus')}{t('addFile')}<input type="file" id="fileup" multiple accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" /></label> : null}</div>
          <div className="atts">{(c.atts || []).map(x => <div key={x.id} className="att">{/^image\//.test(x.type) ? <img className="th" data-att={x.id} alt="" /> : <span className="th">{(x.name.split('.').pop() || '').toUpperCase().slice(0, 4)}</span>}
            <div className="nm" dir="auto">{x.name}<small>{Math.max(1, Math.round(x.size / 1024))} KB · {pname(x.by)} · {ago(x.at)}</small></div>
            <button className="btn sec" data-a="attopen" data-v={x.id}>{t('openF')}</button>
            {wk && /^image\//.test(x.type) ? <button className="btn sec" data-a="attcover" data-v={x.id}>{c.cover === x.id ? t('noCover') : t('makeCover')}</button> : null}
            {ed || (wk && x.by === ME()) ? <button className="btn sec" data-a="attdel" data-v={x.id}>{t('removeF')}</button> : null}</div>)}</div>
          {wk ? <div className="lock" style={css('padding:6px 0 0')}>{t(LIVE ? 'attHintLive' : 'attHint')}</div> : null}</div>
        <div className="sec"><div className="sh">{ic('check')}{t('checklist')}</div>
          {n ? <div className="prog"><span>{pc}%</span><div className="bar"><i className={pc === 100 ? 'full' : ''} style={css(`width:${pc}%`)} /></div></div> : null}
          {c.check.map((x, i) => <div key={i} className={`cki ${x.d ? 'done' : ''}`}>{wk ? <input type="checkbox" data-a="ck" data-i={i} defaultChecked={!!x.d} aria-label={x.t} /> : tickRO(x.d)}<span dir="auto">{x.t}</span>{ed ? <button className="ib" data-a="ckdel" data-i={i} aria-label={t('del')}>{ic('x')}</button> : null}</div>)}
          {ed ? <div className="row"><input className="fld" style={css('flex:1')} dir="auto" id="ckin" placeholder={t('itemPh')} maxLength={200} /><button className="btn sec" data-a="ckadd">{t('add')}</button></div> : n ? null : RO('')}</div>
      </fieldset>
        <div className="sec"><div className="sh">{ic('activity')}{t('activity')}</div>
          <div className="act" style={css('margin-top:0')}>{av(ME())}<div className="tx"><textarea className="desc" dir="auto" id="cmt" style={css('min-height:44px')} placeholder={`${t('commentPh')} ${t('mentionHint')}`} /><div className="row" style={css('margin-top:6px')}><button className="btn" data-a="cmt">{t('save')}</button></div></div></div>
          {log.map((x, i) => {
            const nm = ['l_redir', 'l_sup'].includes(x.k);
            return <div key={i} className="act">{av(x.by)}<div className="tx"><b>{pname(x.by)}</b> {x.c ? '' : t(x.k, { a: nm ? pname(x.a) : x.a || '', b: nm ? pname(x.b) : x.b || '' })}<div className="tm">{ago(x.at)}</div>{x.c ? <div className="bub" dir="auto" dangerouslySetInnerHTML={{ __html: withMentions(x.c) }} /> : null}</div></div>;
          })}
        </div>
      </div>
      <div className="side2"><fieldset className="ro">
        {SL('type', 1)}
        {ed ? <select className="fld" style={css('width:100%')} id="ctype" defaultValue={c.type || 'task'}>{['task', 'milestone', 'approval'].map(r => <option key={r} value={r}>{t('ty_' + r)}</option>)}</select> : RO(t('ty_' + (c.type || 'task')))}
        {SL('priority')}
        {ed ? <select className="fld" style={css('width:100%')} id="cpri" defaultValue={c.priority || 'normal'}>{['low', 'normal', 'high', 'urgent'].map(r => <option key={r} value={r}>{t('p_' + r)}</option>)}</select> : RO(t('p_' + (c.priority || 'normal')))}
        {SL('supervisor')}
        <div className="fols" id="csupv">{c.sup ? <span className="fol">{av(c.sup)}<span>{pname(c.sup)}</span>{K.sup ? <button className="ib" data-a="supdel" aria-label={t('removeF')}>{ic('x')}</button> : null}</span> : RO('')}</div>
        {K.sup && supC.length ? <select className="fld" style={css('width:100%;margin-top:6px')} id="csup" aria-label={t('pickSup')}><option value="">{t('pickSup')}</option>{supC.map(p => <option key={p} value={p}>{pname(p)}</option>)}</select> : null}
        {K.sup ? <div className="lock" style={css('padding:6px 0 0')}>{t('supHint')}</div> : null}
        {SL('followers')}
        <div className="fols">{fol.map(f => <span key={f} className="fol">{av(f)}<span>{pname(f)}</span>{wk || f === ME() ? <button className="ib" data-a="fdel" data-v={f} aria-label={t('removeF')}>{ic('x')}</button> : null}</span>)}</div>
        <button className="btn sec" style={css('width:100%;display:flex;align-items:center;gap:8px;margin:6px 0')} data-a="follow">{ic('eye')}{fol.includes(ME()) ? t('unfollow') : t('follow')}</button>
        {wk ? <select className="fld" style={css('width:100%')} id="fadd" aria-label={t('addFollower')}><option value="">{t('addFollower')}</option>{PEOPLE.filter(p => !fol.includes(p.id) && !p.invited).map(p => <option key={p.id} value={p.id}>{pname(p.id)}</option>)}</select> : null}
        <div className="lock" style={css('padding:6px 0 0')}>{t('followHint')}</div>
        {SL('repeat')}
        {ed ? <select className="fld" style={css('width:100%')} id="crep" defaultValue={c.repeat || ''}>{['', 'daily', 'weekly', 'monthly'].map(r => <option key={r} value={r}>{t('r_' + r)}</option>)}</select> : RO(c.repeat ? t('r_' + c.repeat) : '')}
        {SL('move')}
        {wk && !c.archived ? <select className="fld" style={css('width:100%')} id="cmove" defaultValue={l && l.id}>{b.lists.map(id => <option key={id} value={id}>{LN(D.lists[id])}</option>)}</select> : RO(LN(l))}
        {SL('copyTo')}
        <div className="row" style={css('margin:0')}><select className="fld" style={css('flex:1;min-width:0')} id="ccopy" defaultValue={b.id}>{copyTo.map(x => <option key={x.id} value={x.id}>{bname(x)}</option>)}</select><button className="btn sec" data-a="ccopy">{ic('copy')}{t('copyBtn')}</button></div>
        {moveTo.length > 1 ? <>{SL('moveTo')}
          <div className="row" style={css('margin:0')}><select className="fld" style={css('flex:1;min-width:0')} id="cboard" defaultValue={b.id}>{moveTo.map(x => <option key={x.id} value={x.id}>{bname(x)}</option>)}</select><button className="btn sec" data-a="cboardgo">{t('moveBtn')}</button></div></> : null}
        {SL('actions')}
        <button className="btn sec" style={css('width:100%;display:flex;align-items:center;gap:8px;margin-bottom:6px')} data-a="ctpl">{ic('copy')}{t('cardTpl')}</button>
        {c.archived ? null : ed ? <button className="btn dan" style={css('width:100%;display:flex;align-items:center;gap:8px')} data-a="carch">{ic('archive')}{t('archiveCard')}</button>
          : K.askArch && !c.arq ? (V.arqF === c.id ? <div className="arqf"><textarea id="arqwhy" dir="auto" maxLength={240} placeholder={t('arqWhyPh')} /><div className="row" style={css('margin:0')}><button className="btn" data-a="arqsend">{t('arqSend')}</button><button className="btn sec" data-a="arqx">{t('cancel')}</button></div><div className="lock" style={css('padding:6px 0 0')}>{t('arqHint')}</div></div>
            : <button className="btn dan" style={css('width:100%;display:flex;align-items:center;gap:8px')} data-a="arqask">{ic('archive')}{t('askArch')}</button>) : null}
      </fieldset></div></div>
    </div></div>
  );
}

export function ntHTML() {
  const n = V.nt, req = n.board === '__req', b = D.boards[n.board], miss = k => n.bad.includes(k) ? 'miss' : '', dn = deptName(n.dept);
  const ts = ntTargets(n.dept).filter(x => !x.kind), bad = k => n.bad.includes(k);
  const ferr = (k, msg) => <div className="ferr" id={`nt-e-${k}`} role="alert" hidden={!bad(k)}>{ic('alert')}<span>{msg}</span></div>;
  const inv = k => ({ 'aria-invalid': String(bad(k)) as any, 'aria-describedby': `nt-e-${k}` });
  const det = n.det || !!(n.desc || n.check);
  return (
    <div className="ov ntov"><div className="md ntmd" role="dialog" aria-modal="true" aria-labelledby="nt-h" style={css('max-width:660px')}>
      <button className="ib x" data-a="ntx" aria-label={t('close')}>{ic('x')}</button>
      <div className="mhead">{ic('card')}<div style={css('min-width:0;flex:1')}><h2 className="mt ntt" id="nt-h">{t('newTask')}</h2>
        <div className="ntcrumb" id="nt-crumb"><span>{dn}</span>{ic(lang === 'ar' ? 'left' : 'right')}<span dir="auto">{req ? t('asReq', { d: dn }) : b ? bname(b) : ''}</span></div></div></div>
      <div className="ntf">
        {n.bad.length ? <div className="errbox" role="alert">{t('need')}</div> : null}
        <fieldset className="ntg"><legend>{t('g_ess')}</legend>
          {(D.cardTpl || []).length ? <><label className="fl" htmlFor="nt-tpl">{t('fromTpl')}</label><select className="fld" id="nt-tpl" style={css('width:100%')} defaultValue={n.tpl || ''}><option value="">{t('none')}</option>{D.cardTpl.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></> : null}
          <label className="fl" htmlFor="nt-title">{t('ntTitle')} <b aria-hidden="true">*</b></label>
          <textarea id="nt-title" className={`desc ${miss('title')}`} style={css('min-height:54px')} dir="auto" maxLength={300} placeholder={t('ntTitlePh')} required {...inv('title')} defaultValue={n.title} />
          {ferr('title', t('e_title'))}
          <div className="g3">
            <div><label className="fl" htmlFor="nt-dept">{t('forDept')}</label><select className="fld" id="nt-dept" defaultValue={n.dept}>{DEPTS.map(d => <option key={d.id} value={d.id}>{d[lang]}</option>)}</select></div>
            <div><label className="fl" htmlFor="nt-board">{t('onBoard')}</label><select className="fld" id="nt-board" defaultValue={req ? '__req' : n.board}>{ts.map(x => <option key={x.id} value={x.id}>{bname(x)}</option>)}<option value="__req">{t('asReq', { d: dn })}</option></select></div>
            <div><label className="fl" htmlFor="nt-list">{t('inListL')}</label><select className="fld" id="nt-list" disabled={req} defaultValue={req ? undefined : n.list}>{req ? <option>{SYS.newreq[lang === 'ar' ? 1 : 0]}</option> : b.lists.map(id => <option key={id} value={id}>{LN(D.lists[id])}</option>)}</select></div>
          </div>
          {req ? <div className="reqnote">{ic('inbox')}<span>{t('reqNote', { d: dn })}</span></div> : null}
          {req && !isCEO() && dlist(meP()).length > 1 ? <><label className="fl" htmlFor="nt-from">{t('fromL')}</label><select className="fld" id="nt-from" defaultValue={n.from}>{dlist(meP()).map(d => <option key={d} value={d}>{deptName(d)}</option>)}</select></> : null}
          <label className="fl" id="nt-ml">{t(n.type === 'approval' ? 'approvers' : 'assignTo')} {req ? <small>({t('optional')})</small> : <b aria-hidden="true">*</b>}</label>
          <div className={`lchips own ${miss('members')}`} role="group" aria-labelledby="nt-ml" {...(req ? {} : inv('members'))} style={css('padding:2px')}>{ntPool(n).map(p => <button key={p} className={`pchip ${n.members.includes(p) ? 'on' : ''}`} data-a="ntm" data-v={p} aria-pressed={String(n.members.includes(p)) as any}>{av(p)}{pname(p)}</button>)}</div>
          {req ? <div className="lock" style={css('padding:6px 0 0')}>{t('assignHint', { d: dn })}</div> : <>{ferr('members', t('e_owner'))}{n.members.length > 1 ? <div className="lock" style={css('padding:6px 0 0')}>{t('ownerNote')}</div> : null}</>}
          <label className="fl" htmlFor="nt-type">{t('type')}</label><select className="fld" id="nt-type" style={css('width:100%')} defaultValue={n.type}>{['task', 'milestone', 'approval'].map(r => <option key={r} value={r}>{t('ty_' + r)}</option>)}</select>
        </fieldset>
        <fieldset className="ntg"><legend>{t('g_sched')}</legend>
          <div className="g3">
            <div><label className="fl" htmlFor="nt-start">{t('startD')}</label><input className={`fld ${miss('start')}`} type="date" id="nt-start" defaultValue={n.start} {...inv('start')} /></div>
            <div><label className="fl" htmlFor="nt-due">{t('due')} <b aria-hidden="true">*</b></label><input className={`fld ${miss('due')}`} type="date" id="nt-due" defaultValue={n.due} required {...inv('due')} /></div>
            <div><label className="fl" htmlFor="nt-pri">{t('priority')}</label><select className="fld" id="nt-pri" defaultValue={n.pri}>{['low', 'normal', 'high', 'urgent'].map(r => <option key={r} value={r}>{t('p_' + r)}</option>)}</select></div>
          </div>
          {ferr('due', t('e_due'))}{ferr('start', t('startAfter'))}
        </fieldset>
        <details className="ntg ntdet" id="nt-det" open={!!det}><summary>{ic('down')}<span>{t('g_det')}</span> <small>({t('optional')})</small>{n.labels.length ? <span className="ntdn">{n.labels.length}</span> : null}</summary>
          <label className="fl">{t('labels')}</label><div className="lchips">{labelsOf(b).map(x => <button key={x.id} className={`lchip ${n.labels.includes(x.id) ? 'on' : ''}`} style={css(`background:${x.color}`)} data-a="ntl" data-v={x.id} aria-pressed={String(n.labels.includes(x.id)) as any}>{n.labels.includes(x.id) ? ic('tick') : null}{lname(x)}</button>)}</div>
          <label className="fl" htmlFor="nt-desc">{t('desc')}</label><textarea className="desc" id="nt-desc" dir="auto" style={css('min-height:70px')} placeholder={t('descPh')} defaultValue={n.desc} />
          <label className="fl" htmlFor="nt-check">{t('checkLines')}</label><textarea className="desc" id="nt-check" dir="auto" style={css('min-height:60px')} defaultValue={n.check} />
        </details>
      </div>
      <div className="ntfoot"><span className="ntreq"><b aria-hidden="true">*</b> {t('reqd')}</span><button className="btn sec" data-a="ntx">{t('cancel')}</button><button className="btn" data-a="ntgo">{t('createTask')}</button></div>
    </div></div>
  );
}

export function popHTML() {
  const p = V.pop, b = B();
  if (p.kind === 'bmenu') return (
    <div className="pop" id="pop"><h4>{t('theme')}</h4><div className="seg" style={css('margin:0 4px 8px;background:var(--soft)')}><button style={css('flex:1')} data-a="theme" data-v="light" className={theme() === 'light' ? 'on' : ''}>{t('light')}</button><button style={css('flex:1')} data-a="theme" data-v="dark" className={theme() === 'dark' ? 'on' : ''}>{t('dark')}</button></div>
      <hr /><button className="mi" data-a="lbltog">{ic('tag')}{lblNames() ? t('lblColours') : t('lblNames')}</button><button className="mi" data-a="archv">{ic('archive')}{t('archived')}</button>
      {b && canAdmin(b) ? <><button className="mi" data-a="labels">{ic('tag')}{t('editLabels')}</button><button className="mi" data-a="fieldsed">{ic('grid')}{t('fields')}</button><button className="mi" data-a="btpl">{ic('copy')}{t('saveTpl')}</button></> : null}
      {LIVE ? null : <><hr /><button className="mi" data-a="reset">{ic('repeat')}{t('reset')}</button></>}{b && canAdmin(b) ? <button className="mi dan" data-a="bdel">{ic('trash')}{t('deleteBoard')}</button> : null}</div>
  );
  if (p.kind === 'labels') return (
    <div className="pop wide" id="pop"><h4>{t('editLabels')}</h4><div className="lock">{t('labelsHint')}</div>
      {labelsOf(b).map(l => <div key={l.id} className="labrow"><button className="sw" style={css(`background:${l.color}`)} data-a="labcol" data-v={l.id} aria-label={t('colour')} title={t('colour')} /><input className="labname" data-lab={l.id} dir="auto" maxLength={30} defaultValue={lname(l)} aria-label={t('labelName')} /><button className="ib" data-a="labdel" data-v={l.id} aria-label={t('removeF')}>{ic('x')}</button></div>)}
      <button className="mi" data-a="labadd">{ic('plus')}{t('addLabel')}</button></div>
  );
  if (p.kind === 'fields') return (
    <div className="pop wide" id="pop" style={css('width:390px')}><h4>{t('fields')}</h4><div className="lock">{t('fieldsHint')}</div>
      {(b.fields || []).map(f => <div key={f.id} className="fedit"><div className="row" style={css('margin:0')}><input className="fld fname" data-f={f.id} dir="auto" maxLength={30} defaultValue={f.name} placeholder={t('fieldName')} aria-label={t('fieldName')} style={css('flex:1;min-width:0')} />
        <select className="fld ftype" data-f={f.id} aria-label={t('type')} defaultValue={f.type}>{['select', 'text', 'number'].map(k => <option key={k} value={k}>{t('fk_' + k)}</option>)}</select><button className="ib" data-a="fdelf" data-v={f.id} aria-label={t('removeF')}>{ic('x')}</button></div>
        {f.type === 'select' ? <input className="fld fopts" data-f={f.id} dir="auto" defaultValue={(f.opts || []).map(o => o.name).join(', ')} placeholder={t('optsPh')} aria-label={t('optsPh')} style={css('width:100%;margin-top:6px')} /> : null}</div>)}
      <button className="mi" data-a="faddf">{ic('plus')}{t('addField')}</button></div>
  );
  if (p.kind === 'wl') {
    const [pid, k] = p.v.split('|'), t0 = today(), w = mondayOf(t0) + (+k || 0) * 7 * day;
    const it = wlItems(pid).filter(x => k === 'over' ? x.due && x.due < t0 : x.due && x.due >= Math.max(w, t0) && x.due < w + 7 * day).sort((a, b) => a.due - b.due);
    return (
      <div className="pop wide" id="pop" style={css('width:340px')}><h4>{t('tasksIn', { p: pname(pid), w: k === 'over' ? t('overdueCol') : k === '0' ? t('thisWeek') : t('weekOf', { d: fmtDay(w) }) })}</h4>
        {it.map((x, i) => <button key={i} className="note-i" data-a="open" data-id={x.c.id}><span><span dir="auto">{x.title}</span><small>{x.title !== x.c.title ? t('subOf', { x: x.c.title }) + ' · ' : ''}{fmtDay(x.due)}</small></span></button>)}</div>
    );
  }
  if (p.kind === 'archive') {
    const ac = b.lists.flatMap(l => D.lists[l] ? D.lists[l].cards.map(id => D.cards[id]).filter(c => c && c.archived && !(D.lists[l].archived)) : []), al = b.lists.map(id => D.lists[id]).filter(l => l && l.archived), adm = canAdmin(b);
    return (
      <div className="pop wide" id="pop" style={css('width:360px')}><h4>{t('archived')}</h4>{!ac.length && !al.length ? <div className="lock">{t('noArch')}</div> : null}
        {al.map(l => <div key={l.id} className="arch"><span dir="auto"><b>{LN(l)}</b><small>{t('archiveList')} · {l.cards.length} {t('cards')}</small></span>{adm ? <><button className="btn sec" data-a="lrestore" data-v={l.id}>{t('restore')}</button><button className="btn dan" data-a="lgone" data-v={l.id}>{t('delForever')}</button></> : null}</div>)}
        {ac.map(c => <div key={c.id} className="arch"><span dir="auto">{c.title}<small>{LN(listOf(c.id))} · {c.archivedAt ? ago(c.archivedAt) : ''}</small></span>{cap(c).ed ? <><button className="btn sec" data-a="crestore" data-v={c.id}>{t('restore')}</button><button className="btn dan" data-a="cgone" data-v={c.id}>{t('delForever')}</button></> : null}</div>)}</div>
    );
  }
  if (p.kind === 'redir') {
    const c = D.cards[V.card];
    if (!c) return null;
    const L = teamPool(c).filter(x => !c.members.includes(x));
    return (
      <div className="pop wide" id="pop" role="dialog" aria-label={t('redirTitle')}><h4>{t('redirTitle')}</h4><div className="lock">{t('redirHint')}</div>
        {L.length ? L.map(x => <button key={x} className="mrow" data-a="redirgo" data-v={x}>{av(x)}<span><span>{pname(x)}</span><div className="r">{dnames(person(x))}</div></span></button>) : <div className="lock">{t('noTeam')}</div>}</div>
    );
  }
  if (p.kind === 'notes') {
    const L = notesFor();
    return (
      <div className="pop wide" id="pop" style={css('width:360px')}><h4>{t('alerts')}</h4>
        {L.length ? L.map((x, i) => <button key={i} className={`note-i ${x.read ? '' : 'unread'}`} data-a="nopen" data-v={x.id || ''} data-id={x.card || ''} data-ch={x.ch || ''}>{av(x.by || ME())}<span><span dir="auto">{x.txt}</span><small dir="auto">{x.title} · {x.at ? ago(x.at) : ''}</small></span></button>) : <div className="lock">{t('noAlerts')}</div>}
        <hr /><button className="mi" data-a="nread">{ic('tick')}{t('markRead')}</button>
        <label className="mi"><input type="checkbox" id="emailme" defaultChecked={!(D.emailOff || {})[ME()]} /> {t('emailMe')}</label>{LIVE ? null : <div className="lock">{t('emailNote')}</div>}</div>
    );
  }
  if (p.kind === 'lmenu') {
    const admin = canAdmin(b);
    return (
      <div className="pop" id="pop"><h4>{t('listMenu')}</h4>
        <button className="mi" data-a="addc" data-id={p.id}>{ic('plus')}{t('addCard')}</button>
        <button className="mi" data-a="lcol" data-id={p.id}>{ic('collapse')}{t('collapse')}</button>
        <button className="mi" data-a="lsort" data-id={p.id}>{ic('clock')}{t('sortDue')}</button>
        {admin ? <><hr /><button className="mi dan" data-a="larch" data-id={p.id}>{ic('archive')}{t('archiveList')}</button></> : null}</div>
    );
  }
  if (p.kind === 'members') {
    const own = PEOPLE.filter(x => inD(x, b.dept)), oth = PEOPLE.filter(x => !inD(x, b.dept) && !x.ceo && !x.invited);
    const row = x => {
      const fixed = x.ceo || isHd(x, b.dept) || (b.allDept && inD(x, b.dept)); const on = fixed || b.members.includes(x.id);
      return <button key={x.id} className="mrow" disabled={fixed ? true : undefined} style={fixed ? css('opacity:.7;cursor:default') : undefined} data-a={fixed ? undefined : 'mtoggle'} data-v={fixed ? undefined : x.id}>{av(x.id)}<span><span>{pname(x.id)}</span><div className="r">{x.ceo ? t('ceoRole') : (dnames(x) || t('noDept')) + (isHd(x, b.dept) ? ' · ' + t('head') : '')}</div></span><span className="tk">{on ? ic('tick') : null}</span></button>;
    };
    return (
      <div className="pop wide" id="pop"><h4>{t('pickMembers')}</h4><div className="lock">{t('memberHint')}</div>
        <button className="mrow" data-a="alldept"><span className="av" style={css(`background:${dept(b.dept).dot}`)}>{ic('users')}</span><span><b>{t('allDept', { d: deptName(b.dept) })}</b><div className="r">{t('allDeptHint', { n: own.filter(x => !x.ceo).length })}</div></span><span className="tk">{b.allDept ? ic('tick') : null}</span></button><hr />
        {own.map(row)}
        <button className="mrow" data-a="goteam" data-id={b.dept} style={css('color:var(--bronze);font-weight:600')}>{ic('plus')}{t('inviteTo', { d: deptName(b.dept) })}</button>
        <hr /><div className="lock">{t('otherDepts')}</div>{oth.map(row)}</div>
    );
  }
  if (p.kind === 'status') {
    const s = b.status || {};
    return (
      <div className="pop wide" id="pop"><h4>{t('setStatus')}</h4>
        {['on', 'risk', 'off'].map(k => <button key={k} className="mrow" data-a="stset" data-v={k}><span className={`st ${k}`}><i />{t('st_' + k)}</span><span className="tk">{s.s === k ? ic('tick') : null}</span></button>)}
        <div className="lock">{t('statusNote')}</div><textarea id="stnote" dir="auto" maxLength={240} defaultValue={s.note || ''} /><div className="row"><button className="btn" data-a="stsave">{t('save')}</button></div></div>
    );
  }
  return null;
}
