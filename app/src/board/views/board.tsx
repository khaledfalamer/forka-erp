/* Board screen: lists, cards, calendar, quick bar, filter bar, plus the department page, team page and space form.
   Exact JSX copy of the original templates (see _orig/board.js). */
import {
  V, D, t, lang, SPCOL, isCEO, PEOPLE, inD, boardPeople, pname, dlist, dnames, isHd, deptName, ME, LIVE,
  dept, boards, headOf, headOfDept, theme, stats, cardsOf, bname, ago, allTpls, B, canAdmin, filtering, match,
  dueCls, liveLists, ymd, labelsOf, lname, LN, openWaits, fmtRange, own, label, lblNames,
} from '../core';
import { ic, av, pbar, stChip, apChip, fieldChips, css, Fragment } from '../ui';
import { boardTimeline } from './insights';

export function spaceHTML() {
  const f = V.sp, miss = f.bad.includes('en') ? 'miss' : '';
  return (
    <div className="ov"><div className="md" role="dialog" aria-modal="true" aria-label={t('newSpace')} style={css('max-width:520px')}>
      <button className="ib x" data-a="spx" aria-label={t('close')}>{ic('x')}</button>
      <div className="mhead">{ic('board')}<div className="mt" style={css('cursor:default')}>{f.id ? t('editSpace') : t('newSpace')}</div></div>
      <div className="ntf">{f.id ? null : <p className="lock" style={css('padding:0')}>{t('spLead')}</p>}{f.bad.length ? <div className="errbox">{t('need')}</div> : null}
        <label className="fl" htmlFor="sp-en">{t('spName')} <b>*</b></label><input className={`fld ${miss}`} id="sp-en" dir="auto" maxLength={40} style={css('width:100%')} defaultValue={f.en} placeholder={t('spNamePh')} />
        <label className="fl" htmlFor="sp-ar">{t('spNameAr')}</label><input className="fld" id="sp-ar" dir="rtl" maxLength={40} style={css('width:100%')} defaultValue={f.ar} />
        <label className="fl">{t('spColour')}</label><div className="spc">{SPCOL.map((c, i) => <button key={i} className={`spsw ${f.col === i ? 'on' : ''}`} style={css(`background:${c[1]}`)} data-a="spcol" data-v={i} aria-label={`${t('spColour')} ${i + 1}`}>{f.col === i ? ic('tick') : null}</button>)}</div>
        <div className="row" style={css('justify-content:flex-end;margin-top:18px')}>{f.id && isCEO() ? <button className="btn dan" data-a="spdel" style={css('margin-inline-end:auto')}>{t('delSpace')}</button> : null}<button className="btn sec" data-a="spx">{t('cancel')}</button><button className="btn" data-a="spsave">{f.id ? t('saveB') : t('spCreate')}</button></div>
      </div></div></div>
  );
}

export function teamHTML(d) {
  const team = PEOPLE.filter(x => inD(x, d.id)), free = PEOPLE.filter(x => !x.ceo && !inD(x, d.id) && !x.invited), iv = V.inv || { name: '', email: '', bad: [] }, miss = k => iv.bad.includes(k) ? 'miss' : '';
  const nb = id => D.order.map(x => D.boards[x]).filter(b => b && b.dept === d.id && !b.kind && boardPeople(b).includes(id)).length;
  return (
    <>
      <p className="lead">{t('teamLead', { d: d[lang] })}</p>
      <div className="teamadd">
        <div className="box"><h4>{t('addExisting')}</h4><p>{t('addExistingHint', { d: d[lang] })}</p>
          {free.length ? <div className="row" style={css('margin:0')}><select className="fld" id="addp" style={css('flex:1')}>{free.map(x => <option key={x.id} value={x.id}>{pname(x.id)}{dlist(x).length ? ' (' + dnames(x) + ')' : ''}</option>)}</select><button className="btn" data-a="addp" style={css('white-space:nowrap')}>{t('addToTeam')}</button></div> : <p style={css('margin:0')}>{t('noFree')}</p>}</div>
        <div className="box"><h4>{t('inviteNew')}</h4><p>{t('inviteHint')}</p>
          {iv.bad.length ? <div className="errbox" style={css('margin:0 0 8px')}>{t('need')}</div> : null}
          <div className="g3" style={css('grid-template-columns:1fr 1fr')}><input className={`fld ${miss('name')}`} id="ivname" dir="auto" placeholder={t('fullName')} defaultValue={iv.name} maxLength={80} /><input className={`fld ${miss('email')}`} id="ivemail" type="email" dir="ltr" placeholder="name@forka.com" defaultValue={iv.email} maxLength={120} /></div>
          <div className="row"><button className="btn" data-a="invite">{t('sendInvite')}</button><span className="lock" style={css('padding:0')}>{t(LIVE ? 'inviteLive' : 'inviteAuto')}</span></div></div>
      </div>
      <div className="tw"><table className="tbl" id="teamtbl"><tbody><tr><th>{t('t_person')}</th><th>{t('roleL')}</th><th>{t('emailL')}</th><th className="num">{t('t_boards')}</th><th>{t('statusL')}</th><th></th></tr>
        {team.map(x => <tr key={x.id}><td><div style={css('display:flex;align-items:center;gap:8px')}>{av(x.id)}<b>{pname(x.id)}</b></div></td><td className="sm">{isHd(x, d.id) ? t('headLabel') : t('staff')}{dlist(x).length > 1 ? <div>{t('alsoIn', { d: dlist(x).filter(z => z !== d.id).map(deptName).join(', ') })}</div> : null}</td>
          <td className="sm" dir="ltr">{x.email || '-'}</td><td className="num">{nb(x.id)}</td>
          <td>{x.invited ? <span className="st risk"><i></i>{t('invited')}</span> : <span className="st on"><i></i>{t('active')}</span>}</td>
          <td style={css('text-align:end;white-space:nowrap')}>{x.invited ? <><button className="btn sec" style={css('height:30px;font-size:13px')} data-a="copyinv" data-v={x.id}>{t('copyInvite')}</button>{' '}</> : null}{!isHd(x, d.id) || isCEO() && x.id !== ME() ? <button className="btn dan" style={css('height:30px;font-size:13px')} data-a="rmteam" data-v={x.id}>{t('remove')}</button> : null}</td></tr>)}
      </tbody></table></div>
    </>
  );
}

export function deptHTML() {
  const d = dept(V.dept), bs = boards().filter(b => b.dept === d.id), admin = headOf(d.id), h = headOfDept(d.id), tab = admin && V.dtab === 'team' ? 'team' : 'boards';
  return (
    <div className="page" style={css(`background:${theme() === 'light' ? d.tint : 'var(--pagebg)'}`)}>
      <div className="phead"><h1 style={css('flex:1')}>{d[lang]}</h1>{d.space && headOf(d.id) ? <button className="btn sec" data-a="spedit">{t('editSpace')}</button> : null}</div><p className="lead">{admin ? t('deptLead', { n: bs.length }) : t('deptLeadStaff')}{h ? <>{' · '}{t('headLabel')}: <b style={css('color:var(--text)')}>{pname(h.id)}</b></> : null}</p>
      {admin ? <div className="tabs"><button className={`tab ${tab === 'boards' ? 'on' : ''}`} data-a="dtab" data-v="boards">{t('t_boards')}</button><button className={`tab ${tab === 'team' ? 'on' : ''}`} data-a="dtab" data-v="team">{t('teamTab')} <span className="c">{PEOPLE.filter(x => inD(x, d.id)).length}</span></button></div> : null}
      {tab === 'team' ? teamHTML(d) : <><div className="tiles">{bs.map(b => {
        const s = stats(cardsOf(b)); return <button key={b.id} className="tile" data-a="board" data-id={b.id}><span className="band" style={css(`background:${d.dot}`)}></span>
          <h3>{bname(b)}</h3><div>{b.kind ? null : stChip(b.status)}</div>
          <div className="meta"><span>{t('openN', { n: s.open })}</span>{s.over ? <span className="bad">{t('overN', { n: s.over })}</span> : null}</div>
          {pbar(s.pct)}<div className="foot"><span className="sm" style={css('color:var(--muted);font-size:12px')}>{b.status && b.status.at ? t('updated', { t: ago(b.status.at) }) : ''}</span><span className="who">{boardPeople(b).slice(0, 6).map(m => <Fragment key={m}>{av(m)}</Fragment>)}</span></div></button>;
      })}
        {admin ? (V.newBoard ? <div className="tile comp" style={css('justify-content:center')}><input id="newb" placeholder={t('boardPh')} maxLength={80} dir="auto" />
          <label className="fl" style={css('margin:6px 0 2px;font-size:12px;color:var(--muted)')}>{t('startFrom')}</label><select className="fld" id="newbtpl" style={css('width:100%')}>{allTpls().map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><div className="row"><button className="btn" data-a="bnew">{t('create')}</button><button className="ib" data-a="bnew-x" aria-label={t('cancel')}>{ic('x')}</button></div></div>
          : <button className="tile new" data-a="bnew-open">{ic('plus')}{t('newBoard')}</button>) : null}
      </div>{!bs.length && !admin ? <div className="empty-p">{t('noBoards')}</div> : null}</>}</div>
  );
}

export function boardHTML() {
  const b = B(), d = dept(b.dept), admin = canAdmin(b);
  return (
    <div style={css(`flex:1;display:flex;flex-direction:column;min-height:0;background:${theme() === 'light' ? d.tint : 'linear-gradient(135deg,#1b1917 0%,#34302b 100%)'}`)}>
      <div className="bbar">
        <button className="crumb" data-a="dept" data-id={d.id}>{d[lang]}</button>
        {V.editBoard ? <input className="bname-in" id="bname" defaultValue={b.name} maxLength={80} dir="auto" /> : <button className="bname" dir="auto" data-a={admin && !b.kind ? 'bname' : ''}>{bname(b)}</button>}
        {b.kind ? null : stChip(b.status, admin)}
        <div className="sp"></div>
        <div className="vseg"><button data-a="bview" data-v="board" className={!V.bview || V.bview === 'board' ? 'on' : ''}>{t('boardV')}</button><button data-a="bview" data-v="cal" className={V.bview === 'cal' ? 'on' : ''}>{ic('cal')} {t('calV')}</button><button data-a="bview" data-v="tl" className={V.bview === 'tl' ? 'on' : ''}>{ic('gantt')} {t('tlV')}</button></div>
        <div className="members hide-sm">{boardPeople(b).slice(0, 8).map(m => <Fragment key={m}>{av(m)}</Fragment>)}</div>
        {admin ? <button className="pill" data-a="members">{ic('users')}<span className="hide-sm">{t('members')}</span></button> : null}
        <button className={`pill ${V.filter || filtering() ? 'on' : ''}`} data-a="filter">{ic('filter')}<span className="hide-sm">{t('filter')}</span></button>
        <button className="ib" data-a="bmenu" aria-label={t('boardMenu')} title={t('boardMenu')}>{ic('dots')}</button>
      </div>
      {quickBar(b)}
      {V.filter ? filterBar() : null}
      {V.bview === 'tl' ? boardTimeline(b) : V.bview === 'cal' ? calHTML(cardsOf(b).filter(match).map(c => ({ id: c.id, title: c.title, due: c.due, cls: dueCls(c), ms: c.type === 'milestone' }))) : <div className="canvas" id="canvas">
        {liveLists(b).map(id => <Fragment key={id}>{listHTML(D.lists[id], admin)}</Fragment>)}
        {admin ? (V.addList ? <div className="addl open comp"><input id="newl" dir="auto" placeholder={t('listPh')} maxLength={60} /><div className="row"><button className="btn" data-a="addl-go">{t('addListBtn')}</button><button className="ib" data-a="addl-x" aria-label={t('cancel')}>{ic('x')}</button></div></div>
          : <button className="addl" data-a="addl">{ic('plus')}{t('addList')}</button>) : null}
      </div>}</div>
  );
}

export function calHTML(cards) {
  const m0 = V.calM ? new Date(V.calM) : new Date(), first = new Date(m0.getFullYear(), m0.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
  const byDay = {}; cards.forEach(c => { if (c.due) { const k = ymd(c.due); (byDay[k] = byDay[k] || []).push(c); } });
  const loc = lang === 'ar' ? 'ar-AE' : 'en-GB', heads = [...Array(7)].map((_, i) => new Date(2026, 10, 9 + i).toLocaleDateString(loc, { weekday: 'short' }));
  const days = [...Array(42)].map((_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const MAX = innerWidth <= 760 ? 2 : 3, long = d => d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  const chip = c => <button key={c.id} className={`cchip ${c.cls}`} data-a="open" data-id={c.id} dir="auto" title={c.title}>{c.ms ? ic('diamond') : null}{c.title}</button>;
  const dd = V.calDay && /^\d{4}-\d{2}-\d{2}$/.test(V.calDay) ? new Date(V.calDay + 'T00:00:00') : null, dl = dd ? (byDay[V.calDay] || []) : [];
  return (
    <>
      <div className="cal"><div className="calbar"><button className="ib" data-a="calm" data-v="-1" aria-label="-">{ic(lang === 'ar' ? 'right' : 'left')}</button>
        <h3>{first.toLocaleDateString(loc, { month: 'long', year: 'numeric' })}</h3><button className="ib" data-a="calm" data-v="1" aria-label="+">{ic(lang === 'ar' ? 'left' : 'right')}</button>
        <button className="pill" data-a="calm" data-v="0">{t('todayB')}</button><span className="sp"></span><span style={css('font-size:13px;opacity:.8')}>{t('noDate', { n: cards.filter(c => !c.due).length })}</span></div>
        <div className="calg">{heads.map((h, i) => <div key={'h' + i} className="calh">{h}</div>)}
          {days.map(d => {
            const k = ymd(d), cs = (byDay[k] || []), more = cs.length - MAX; return <div key={k} className={`cald ${d.getMonth() !== first.getMonth() ? 'out' : ''} ${k === ymd(Date.now()) ? 'today' : ''} ${cs.length ? 'has' : ''}`} data-day={k} data-a="calday" data-v={k}>
              <div className="dn"><button className="dnb" data-a="calday" data-v={k} aria-label={`${t('openDay', { d: long(d) })}${cs.length ? ' (' + cs.length + ')' : ''}`}>{d.getDate()}</button><button className="dadd" data-a="calnew" data-v={k} aria-label={t('newTask')}>{ic('plus')}</button></div>
              {cs.slice(0, more > 0 ? MAX - 1 : MAX).map(chip)}{more > 0 ? <button className="cmore" data-a="calday" data-v={k} aria-label={t('openDay', { d: long(d) })}>{t('moreN', { n: more + 1 })}</button> : null}</div>;
          })}</div></div>
      {dd ? <div className="ov dayov" data-a="caldov"><div className="md dayd" role="dialog" aria-modal="true" aria-labelledby="dayh">
        <button className="ib x" data-a="caldx" aria-label={t('close')}>{ic('x')}</button>
        <div className="mhead"><h2 className="dayh" id="dayh">{t('dayTitle', { d: long(dd) })}</h2></div>
        <div className="dayl">{dl.length ? dl.map(c => <button key={c.id} className="dayi" data-a="open" data-id={c.id}><span className={`dayb ${c.cls}`}></span><span className="dayt" dir="auto">{c.ms ? ic('diamond') : null}{c.title}</span>{ic(lang === 'ar' ? 'left' : 'right')}</button>) : <div className="empty-p">{t('noTasksDay')}</div>}</div>
        <div className="dayf"><button className="btn sec" data-a="caldx">{t('close')}</button><button className="btn" data-a="calnew" data-v={V.calDay}>{ic('plus')}{t('newOnDay')}</button></div>
      </div></div> : null}
    </>
  );
}

export function quickBar(b) {
  const f = V.f, ppl = boardPeople(b), n = cardsOf(b).length, shown = cardsOf(b).filter(match).length;
  return (
    <div className="qbar" role="group" aria-label={t('filter')}>
      {f.q ? <button className="chip on" data-a="fq" aria-label={t('clearSearch')}>{ic('search')}<span dir="auto">{t('searchingFor', { x: f.q })}</span>{ic('x')}</button> : null}
      <label className={`qsel ${f.owner ? 'on' : ''}`}>{ic('user')}<select id="fb-owner" aria-label={t('ownerF')} defaultValue={ppl.includes(f.owner) ? f.owner : ''}><option value="">{t('anyOwner')}</option>{ppl.map(id => <option key={id} value={id}>{pname(id)}</option>)}</select></label>
      <label className={`qsel ${f.pri ? 'on' : ''}`}>{ic('flag')}<select id="fb-pri" aria-label={t('priF')} defaultValue={['urgent', 'high', 'normal', 'low'].includes(f.pri) ? f.pri : ''}><option value="">{t('anyPri')}</option>{['urgent', 'high', 'normal', 'low'].map(r => <option key={r} value={r}>{t('p_' + r)}</option>)}</select></label>
      <button className={`chip ${f.due === 'week' ? 'on' : ''}`} data-a="fd" data-v="week" aria-pressed={f.due === 'week' ? 'true' : 'false'}>{ic('clock')} {t('dueWeek')}</button>
      {filtering() ? <><span className="qcount" role="status">{shown}/{n}</span><button className="chip" data-a="fclear">{ic('x')} {t('clear')}</button></> : null}
    </div>
  );
}

export function filterBar() {
  const f = V.f, b = B();
  return (
    <div className="fbar">
      {boardPeople(b).map(id => <button key={id} className={`chip ${f.members.includes(id) ? 'on' : ''}`} data-a="fm" data-v={id}>{av(id)} {pname(id)}</button>)}
      {labelsOf(b).map(l => <button key={l.id} className={`chip ${f.labels.includes(l.id) ? 'on' : ''}`} data-a="fl" data-v={l.id}><i style={css(`background:${l.color}`)}></i>{lname(l)}</button>)}
      <button className={`chip ${f.due === 'over' ? 'on' : ''}`} data-a="fd" data-v="over" aria-pressed={f.due === 'over' ? 'true' : 'false'}>{t('overdueF')}</button>
      {(b.fields || []).filter(x => x.type === 'select').flatMap(x => (x.opts || []).map(o => { const k = x.id + ':' + o.id; return <button key={k} className={`chip ${(f.fields || []).includes(k) ? 'on' : ''}`} data-a="ff" data-v={k}><i style={css(`background:${o.color}`)}></i>{x.name}: {o.name}</button>; }))}
    </div>
  );
}

export function listHTML(l, admin) {
  const all = l.cards.map(id => D.cards[id]).filter(c => c && !c.archived), shown = all.filter(match);
  if (l.col) return <div className="list col" data-id={l.id}><div className="lhead"><button className="ib" data-a="lcol" data-id={l.id} aria-label={t('expand')} title={t('expand')}>{ic('expand')}</button><span className="lcount">{shown.length}</span><div className="ltitle" dir="auto">{LN(l)}</div></div></div>;
  return (
    <div className="list" data-id={l.id}>
      <div className={`lhead ${admin ? '' : 'nodrag'}`}>
        {V.editList === l.id ? <input className="lin" id="lname" dir="auto" defaultValue={LN(l)} maxLength={60} /> : <div className="ltitle" dir="auto" data-a={admin ? 'lname' : undefined} data-id={admin ? l.id : undefined}>{LN(l)}</div>}
        <span className="lcount" title={t('cardsN', { n: all.length })}>{filtering() ? shown.length + '/' + all.length : all.length}</span>
        <button className="ib ladd" data-a="addct" data-id={l.id} aria-label={t('addTo', { x: LN(l) })} title={t('addTo', { x: LN(l) })}>{ic('plus')}</button>
        <button className="ib" data-a="lcol" data-id={l.id} aria-label={t('collapse')} title={t('collapse')}>{ic('collapse')}</button>
        <button className="ib" data-a="lmenu" data-id={l.id} aria-label={t('listMenu')} title={t('listMenu')}>{ic('dots')}</button>
      </div>
      <div className="cards">{shown.map(c => <Fragment key={c.id}>{cardHTML(c)}</Fragment>)}{filtering() && !shown.length && all.length ? <div className="empty">{t('noMatch')}</div> : null}
        {V.comp === l.id ? <div className="comp"><textarea id="newc" dir="auto" placeholder={t('cardPh')} maxLength={300}></textarea><div className="row"><button className="btn" data-a="addc-go" data-id={l.id}>{t('addCardBtn')}</button><button className="ib" data-a="addc-x" aria-label={t('cancel')}>{ic('x')}</button></div></div> : null}
      </div>
      {V.comp === l.id ? null : <div className="lfoot"><button className="addc" data-a="addc" data-id={l.id}>{ic('plus')}{t('addCard')}</button></div>}
    </div>
  );
}

export function cardHTML(c) {
  const b = B();
  const n = c.check.length, d = c.check.filter(x => x.d).length, cm = c.log.filter(x => x.c).length, dc = dueCls(c), sn = (c.subs || []).length, sd = (c.subs || []).filter(x => x.done).length, wt = !c.done && openWaits(c).length;
  /* Priority and due date are two separate pieces. Urgent is the one strong signal: a solid red tag and a red edge on the card. */
  const urg = c.priority === 'urgent' && !c.done;
  const pr = c.priority === 'high' || c.priority === 'urgent' ? <span className={`pri ${c.priority}`}>{ic('flag')}{t('p_' + c.priority)}</span> : null;
  const du = c.due ? <span className={`due ${dc}`}>{ic('clock')}<bdi>{fmtRange(c)}</bdi></span> : null;
  const fr = c.fromDept && b && c.fromDept !== b.dept ? <span className="from">{ic('inbox')}{t('fromD', { d: deptName(c.fromDept) })}</span> : null;
  const o = own(c), who = c.members.length ? [o].concat(c.members.filter(m => m !== o)) : [];
  const badgeList = [
    c.type === 'approval' ? <Fragment key="ap">{apChip(c)}</Fragment> : null,
    wt ? <span key="wt" className="wt">{ic('link')}{t('waitTag')}</span> : null,
    fr ? <Fragment key="fr">{fr}</Fragment> : null,
    c.repeat ? <span key="rp" title={t('repeat')}>{ic('repeat')}{t('r_' + c.repeat)}</span> : null,
    c.desc ? <span key="ds" title={t('desc')}>{ic('desc')}</span> : null,
    cm ? <span key="cm">{ic('chat')}{cm}</span> : null,
    n ? <span key="ck" className={`ckc ${d === n ? 'full' : ''}`}>{ic('check')}{d}/{n}</span> : null,
    sn ? <span key="sb" className={`ckc ${sd === sn ? 'full' : ''}`} title={t('subtasks')}>{ic('subs')}{sd}/{sn}</span> : null,
    (c.atts || []).length ? <span key="at" title={t('attach')}>{ic('clip')}{c.atts.length}</span> : null,
  ];
  const badges = badgeList.some(Boolean) ? badgeList : null;
  const fcList = fieldChips(c, b), fc = fcList.some(Boolean) ? fcList : null;
  return (
    <div className={`card ${c.done ? 'done' : ''} ${c.type === 'milestone' ? 'ms' : ''} ${urg ? 'urg' : ''}`} data-id={c.id} tabIndex={0}>
      {c.cover && (c.atts || []).some(x => x.id === c.cover) ? <img className="cover" data-att={c.cover} alt="" /> : null}
      {c.labels.length ? <div className={`lbs ${lblNames() ? 'nm' : ''}`}>{c.labels.map(id => { const l = label(id); return l ? <span key={id} style={css(`background:${l.color}`)} title={lname(l)}>{lblNames() ? lname(l) : ''}</span> : null; })}</div> : null}
      <div className="ct" dir="auto" title={c.title}>{c.done ? <><span style={css('color:var(--ok)')}>{ic('tick')}</span>{' '}</> : null}{c.type === 'milestone' ? <><span className="msd" title={t('ty_milestone')}>{ic('diamond')}</span>{' '}</> : null}{c.title}</div>
      {pr || du ? <div className="cmeta">{pr}{du}</div> : null}
      {fc ? <div className="fcs">{fc}</div> : null}
      {badges || c.members.length ? <div className="bd">{badges}{who.length ? <span className="who">{who.map((m, i) => <Fragment key={m + ':' + i}>{av(m, i === 0 && who.length > 1 ? 'own' : '')}</Fragment>)}</span> : null}</div> : null}
    </div>
  );
}
