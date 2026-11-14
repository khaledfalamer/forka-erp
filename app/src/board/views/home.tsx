/* Board screens: Company progress, My tasks, Projects, Goals and the goal form (moved from the old HTML templates, same markup). */
import {
  D, V, PEOPLE, DEPTS, lang, t, LIVE, pgState, dlist, meP, boards, cardsOf, stats, headOfDept, pname, bname, deptName, ago,
  boardPeople, dnames, PRANGES, myState, label, LN, listOf, itCls, itDate, secName, myItems, allCards, ME, day, today,
  dueCls, fmtDay, pfState, lastMod, bOwner, depts, dept, goalPct, goalsSeen, isCEO, headAny, canGoal, scopeD, inD,
} from '../core';
import { ic, av, pbar, stChip, apChip, chevTd, chevTh, css, Fragment } from '../ui';
import { calHTML } from './board';

export function progressHTML() {
  const P = pgState(), rd = P.range, myDs = dlist(meP()), pickFrom = myDs.length ? myDs : DEPTS.map(d => d.id);
  if (P.scope === 'mine' && !pickFrom.includes(P.dept)) P.dept = pickFrom[0];
  const inScope = d => P.scope !== 'mine' || d === P.dept;
  const all = boards().filter(b => inScope(b.dept)), S = stats(all.flatMap(cardsOf), rd);
  const kOK = s => !P.k || P.k.startsWith('st:') || s[{ open: 'open', over: 'over', week: 'week', done: 'doneW' }[P.k]] > 0;
  const wkT = rd === 7 ? t('t_week') : t('t_weekN', { n: rd }), dnT = rd === 7 ? t('t_done') : t('t_doneN', { n: rd });
  const rows = DEPTS.filter(d => inScope(d.id)).map(d => {
    const bs = all.filter(b => b.dept === d.id), s = stats(bs.flatMap(cardsOf), rd), h = headOfDept(d.id); if (!kOK(s)) return null;
    return (
      <tr key={d.id} className="click" data-a="dept" data-id={d.id}><td><span className="dot" style={css(`display:inline-block;width:10px;height:10px;border-radius:3px;background:${d.dot};margin-inline-end:8px`)}></span><b>{d[lang]}</b></td>
        <td className="sm">{h ? pname(h.id) : '-'}</td><td className="num">{bs.length}</td><td className="num">{s.open}</td><td className={`num ${s.over ? 'bad' : ''}`}>{s.over}</td><td className="num">{s.week}</td><td className="num">{s.doneW}</td><td>{pbar(s.pct)}</td>{chevTd()}</tr>
    );
  });
  const order = { off: 0, risk: 1, on: 2 }, stOf = b => (b.status && b.status.s) || 'none';
  const projAll = all.filter(b => b.kind !== 'requests'), cnt = { off: 0, risk: 0, on: 0, none: 0 }; projAll.forEach(b => cnt[stOf(b)] = (cnt[stOf(b)] || 0) + 1);
  const proj = projAll.filter(b => P.k.startsWith('st:') ? stOf(b) === P.k.slice(3) : kOK(stats(cardsOf(b), rd))).sort((a, b) => (order[a.status && a.status.s] ?? 3) - (order[b.status && b.status.s] ?? 3)).map(b => {
    const s = stats(cardsOf(b), rd);
    return (
      <tr key={b.id} className="click" data-a="board" data-id={b.id}><td><b dir="auto">{bname(b)}</b><div className="sm">{deptName(b.dept)}</div></td><td>{stChip(b.status)}</td>
        <td className="sm" style={css('max-width:280px')}>{b.status && b.status.note ? <>{b.status.note}<div>{pname(b.status.by)} · {ago(b.status.at)}</div></> : '-'}</td>
        <td>{pbar(s.pct)}</td><td className={`num ${s.over ? 'bad' : ''}`}>{s.over}</td><td><div style={css('display:flex')}>{boardPeople(b).slice(0, 5).map(m => <Fragment key={m}>{av(m)}</Fragment>)}</div></td>{chevTd()}</tr>
    );
  });
  const load = PEOPLE.map(p => { const cs = all.flatMap(cardsOf).filter(c => c.members.includes(p.id)); return { p, s: stats(cs, rd) }; }).filter(x => x.s.total && kOK(x.s)).sort((a, b) => b.s.over - a.s.over || b.s.open - a.s.open)
    .map(({ p, s }) => <tr key={p.id}><td><div style={css('display:flex;align-items:center;gap:8px')}>{av(p.id)}<span>{pname(p.id)}</span></div></td><td className="sm">{p.ceo ? t('ceoRole') : dnames(p)}</td><td className="num">{s.open}</td><td className={`num ${s.over ? 'bad' : ''}`}>{s.over}</td><td className="num">{s.week}</td><td className="num">{s.doneW}</td></tr>);
  const K = [['open', S.open, t('k_open')], ['over', S.over, t('k_over')], ['week', S.week, rd === 7 ? t('k_week') : t('k_weekN', { n: rd })], ['done', S.doneW, rd === 7 ? t('k_done') : t('k_doneN', { n: rd })]];
  const kName = P.k ? (P.k.startsWith('st:') ? t('st_' + P.k.slice(3)) : K.find(x => x[0] === P.k)[2]) : '';
  const none = n => <tr><td colSpan={n} className="sm" style={css('text-align:center;padding:16px')}>{t('noRows')}</td></tr>;
  return (
    <div className="page pgpage">
      <div className="phead pghead"><div><h1>{t('progress')}</h1><p className="lead">{t('progLead')}</p></div>
        <div className="pgbar">
          <div className="vseg" role="group" aria-label={t('progress')}><button data-a="pgscope" data-v="all" className={P.scope === 'all' ? 'on' : ''} aria-pressed={P.scope === 'all'}>{t('scopeAll')}</button><button data-a="pgscope" data-v="mine" className={P.scope === 'mine' ? 'on' : ''} aria-pressed={P.scope === 'mine'}>{t('scopeMine')}</button></div>
          {P.scope === 'mine' && pickFrom.length > 1 ? <select className="fld" id="pg-dept" aria-label={t('pickDept')} defaultValue={P.dept}>{pickFrom.map(d => <option key={d} value={d}>{deptName(d)}</option>)}</select> : null}
          <label className="pgr">{ic('cal')}<span>{t('rangeL')}</span><select className="fld" id="pg-range" defaultValue={rd}>{PRANGES.map(n => <option key={n} value={n}>{t(n === 7 ? 'r7' : 'p' + n)}</option>)}</select></label>
        </div></div>
      <div className="kpis pgk">{K.map(([k, v, l]) => <button key={k} className={`kpi ${k === 'over' && v ? 'bad' : ''} ${P.k === k ? 'on' : ''}`} data-a="pgk" data-v={k} aria-pressed={P.k === k}><b>{v}</b><span>{l}</span></button>)}</div>
      <div className="pgsum"><span className="pgsl">{t('projSum')}</span>{['off', 'risk', 'on', 'none'].map(k => <button key={k} className={`st ${k} ${P.k === 'st:' + k ? 'sel' : ''}`} data-a="pgk" data-v={`st:${k}`} aria-pressed={P.k === 'st:' + k}><i></i>{t('st_' + k)}{' '}<b>{cnt[k] || 0}</b></button>)}
        <span className="pgshow" role="status">{P.k ? <>{t('showing', { x: kName })}{' '}<button className="lk2" data-a="pgk" data-v="">{ic('x')}{t('showAll')}</button></> : <span className="sm">{t('kpiHint')}</span>}</span></div>
      <div className="tw"><table className="tbl"><tbody><tr><th>{t('t_dept')}</th><th>{t('t_head')}</th><th className="num">{t('t_boards')}</th><th className="num">{t('t_open')}</th><th className="num">{t('t_over')}</th><th className="num">{wkT}</th><th className="num">{dnT}</th><th>{t('t_prog')}</th>{chevTh()}</tr>{rows.some(Boolean) ? rows : none(9)}</tbody></table></div>
      <div className="h2">{ic('flag')}{t('projects')}</div>
      <div className="tw"><table className="tbl pin"><tbody><tr><th>{t('t_board')}</th><th>{t('t_status')}</th><th>{t('t_note')}</th><th>{t('t_prog')}</th><th className="num">{t('t_over')}</th><th>{t('t_members')}</th>{chevTh()}</tr>{proj.length ? proj : none(7)}</tbody></table></div>
      <div className="h2">{ic('users')}{t('workload')}</div>
      <div className="tw"><table className="tbl"><tbody><tr><th>{t('t_person')}</th><th>{t('t_dept')}</th><th className="num">{t('t_open')}</th><th className="num">{t('t_over')}</th><th className="num">{wkT}</th><th className="num">{dnT}</th></tr>{load.length ? load : none(6)}</tbody></table></div>
      {LIVE ? null : <p className="lead" style={css('margin-top:18px')}><span className="note" style={css('margin:0')}>{t('preview')}</span></p>}
    </div>
  );
}

export function myRow(x, secs) {
  const M = myState(), cur = M.at[x.k];
  return (
    <tr key={x.k} className="click" data-a="open" data-id={x.c.id}><td><b dir="auto">{!x.s && x.c.type === 'milestone' ? <><span className="msd">{ic('diamond')}</span>{' '}</> : null}{x.title}</b>{x.s ? <div className="sm subof" dir="auto">{ic('subs')}{t('subOf', { x: x.c.title })}</div> : null}
      {!x.s && x.c.labels.length ? <div style={css('display:flex;gap:4px;margin-top:5px')}>{x.c.labels.map(l => <span key={l} style={css(`height:6px;width:28px;border-radius:3px;background:${(label(l, x.b) || {}).color || '#999'}`)}></span>)}</div> : null}{!x.s && x.c.type === 'approval' ? <div style={css('margin-top:5px')}>{apChip(x.c)}</div> : null}</td>
      <td className="sm">{bname(x.b)}<div>{deptName(x.b.dept)} · {LN(listOf(x.c.id))}</div></td>
      <td className="num">{x.due ? <span className={`due ${itCls(x)}`} style={css('display:inline-flex;gap:4px;align-items:center')}>{ic('clock')}{itDate(x)}</span> : null}</td>
      {secs ? <td className="msc"><select className="fld msec" data-k={x.k} aria-label={t('moveSec')} defaultValue={cur || M.secs[0].id}>{M.secs.map(s => <option key={s.id} value={s.id}>{secName(s)}</option>)}</select></td> : null}</tr>
  );
}

export function mineHTML() {
  const tab = V.mtab || 'list', grp = V.mgrp || 'sec', items = myItems(), M = myState();
  const secOf = x => M.secs.some(y => y.id === M.at[x.k]) ? M.at[x.k] : M.secs[0].id;
  const tabs = <div className="tabs">{[['list', 'myList', 'list'], ['board', 'myBoard', 'board'], ['cal', 'myCal', 'cal'], ['files', 'myFiles', 'clip']].map(([k, l, i]) => <button key={k} className={`tab ${tab === k ? 'on' : ''}`} data-a="mtab" data-v={k}>{ic(i)}{' '}{t(l)}</button>)}</div>;
  let body = null;
  if (tab === 'list') {
    const reqs = allCards().filter(({ c }) => c.requester === ME() && (!c.done || (c.doneAt || 0) > Date.now() - 14 * day));
    let main = null;
    if (!items.length) main = <div className="empty-p">{t('nothingMine')}</div>;
    else if (grp === 'due') {
      const t0 = today(), G = { over: [], today: [], week: [], later: [], none: [] };
      items.forEach(x => { const d = x.due; G[!d ? 'none' : d < t0 ? 'over' : d < t0 + day ? 'today' : d < t0 + 7 * day ? 'week' : 'later'].push(x); });
      main = ['over', 'today', 'week', 'later', 'none'].map(k => G[k].length ? <Fragment key={k}><div className={`mine-g ${k === 'over' ? 'bad' : ''}`}>{t('g_' + k)}{' '}<span className="c">{G[k].length}</span></div><div className="tw"><table className="tbl mtbl"><tbody>{G[k].map(x => myRow(x, false))}</tbody></table></div></Fragment> : null);
    }
    else main = <>{M.secs.map((s, i) => {
      const its = items.filter(x => secOf(x) === s.id);
      return (
        <Fragment key={s.id}><div className="mine-g sech" data-sec={s.id}>{V.secEdit === s.id ? <input className="fld" id="secname" dir="auto" maxLength={40} defaultValue={secName(s)} data-v={s.id} /> : <span dir="auto">{secName(s)}</span>}{' '}<span className="c">{its.length}</span>{' '}
          <span className="sp"></span><button className="lk2" data-a="secren" data-v={s.id}>{t('renameSec')}</button>{i ? <button className="lk2" data-a="secdel" data-v={s.id}>{t('delSec')}</button> : null}</div>
          {its.length ? <div className="tw"><table className="tbl mtbl"><tbody>{its.map(x => myRow(x, true))}</tbody></table></div> : null}</Fragment>
      );
    })}
      <div className="row secadd"><input className="fld" id="secnew" dir="auto" maxLength={40} placeholder={t('secPh')} /><button className="btn sec" data-a="secadd">{ic('plus')}{t('addSec')}</button></div></>;
    body = <>
      <div className="row" style={css('margin:0 0 6px;align-items:center;gap:8px')}><span className="sm" style={css('color:var(--muted);font-size:13px')}>{t('groupBy')}</span><div className="vseg"><button data-a="mgrp" data-v="sec" className={grp === 'sec' ? 'on' : ''}>{t('gSec')}</button><button data-a="mgrp" data-v="due" className={grp === 'due' ? 'on' : ''}>{t('gDue')}</button></div></div>
      {main}
      {reqs.length ? <><div className="mine-g">{ic('inbox')}{t('requested')}{' '}<span className="c">{reqs.length}</span></div><div className="tw"><table className="tbl" id="myreqs"><tbody>{reqs.map(({ c, b }) => <tr key={c.id} className="click" data-a="open" data-id={c.id}>
        <td><b dir="auto">{c.title}</b><div className="sm">{deptName(b.dept)}</div></td>
        <td>{c.done ? <span className="st on"><i></i>{t('doneTag')}</span> : <span className="st none">{LN(listOf(c.id))}</span>}</td>
        <td className="sm">{c.members.length ? c.members.map(m => pname(m)).join(', ') : ''}</td>
        <td className="num">{c.due ? <span className={`due ${dueCls(c)}`} style={css('display:inline-flex;gap:4px;align-items:center')}>{ic('clock')}{fmtDay(c.due)}</span> : null}</td></tr>)}</tbody></table></div></> : null}
    </>;
  }
  else if (tab === 'board') {
    body = <div className="mboard"><div className="canvas" id="canvas">{M.secs.map(s => {
      const its = items.filter(x => secOf(x) === s.id);
      return (
        <div key={s.id} className="list" data-id={s.id}><div className="lhead nodrag"><div className="ltitle" dir="auto">{secName(s)}</div><span className="lcount">{its.length}</span></div>
          <div className="cards">{its.length ? its.map(x => <div key={x.k} className={`card ${!x.s && x.c.type === 'milestone' ? 'ms' : ''}`} data-id={x.k} data-card={x.c.id} tabIndex={0}><div className="ct" dir="auto">{!x.s && x.c.type === 'milestone' ? <><span className="msd">{ic('diamond')}</span>{' '}</> : null}{x.title}</div>
            {x.s ? <div className="subof" dir="auto">{ic('subs')}{x.c.title}</div> : null}<div className="bd">{x.due ? <span className={`due ${itCls(x)}`}>{ic('clock')}{itDate(x)}</span> : null}<span>{bname(x.b)}</span></div></div>) : <div className="empty">{t('emptySec')}</div>}</div><div style={css('height:10px')}></div></div>
      );
    })}</div></div>;
  }
  else if (tab === 'cal') body = calHTML(items.map(x => ({ id: x.c.id, title: x.title, due: x.due, cls: itCls(x), ms: !x.s && x.c.type === 'milestone' })));
  else {
    const fl = allCards().filter(({ c }) => c.members.includes(ME()) || (c.follow || []).includes(ME()) || c.requester === ME()).flatMap(({ c, b }) => (c.atts || []).map(a => ({ a, c, b }))).sort((x, y) => y.a.at - x.a.at);
    body = fl.length ? <div className="tw"><table className="tbl" id="myfiles"><tbody><tr><th>{t('t_file')}</th><th>{t('t_task')}</th><th></th></tr>{fl.map(({ a, c, b }) => <tr key={c.id + ':' + a.id} className="click" data-a="open" data-id={c.id}>
      <td><div className="att" style={css('border:0;padding:0;background:none')}>{/^image\//.test(a.type) ? <img className="th" data-att={a.id} alt="" /> : <span className="th">{(a.name.split('.').pop() || '').toUpperCase().slice(0, 4)}</span>}<div className="nm" dir="auto">{a.name}<small>{Math.max(1, Math.round(a.size / 1024))} KB · {pname(a.by)} · {ago(a.at)}</small></div></div></td>
      <td className="sm"><b dir="auto" style={css('color:var(--text)')}>{c.title}</b><div>{bname(b)}</div></td><td style={css('text-align:end')}><button className="btn sec" data-a="attopen" data-v={a.id}>{t('openF')}</button></td></tr>)}</tbody></table></div> : <div className="empty-p">{t('noFiles')}</div>;
  }
  return <div className="page"><h1>{t('mine')}</h1><p className="lead">{t('mineLead')}</p>{tabs}{body}</div>;
}

export function projectsHTML() {
  const P = pfState();
  let bs = boards().map(b => ({ b, s: stats(cardsOf(b)), m: lastMod(b), o: bOwner(b) }));
  const owners = [...new Set(bs.map(x => x.o).filter(Boolean))], mem = [...new Set(bs.flatMap(x => boardPeople(x.b)))];
  bs = bs.filter(({ b, o }) => (!P.q || bname(b).toLowerCase().includes(P.q.toLowerCase())) && (!P.dept || b.dept === P.dept) && (!P.owner || o === P.owner) && (!P.member || boardPeople(b).includes(P.member)) && (!P.status || (b.kind ? '' : ((b.status && b.status.s) || 'none')) === P.status));
  const SO = { off: 0, risk: 1, on: 2, none: 3 }, stK = b => b.kind ? 4 : SO[(b.status && b.status.s) || 'none'];
  const S = { mod: (x, y) => x.m - y.m, name: (x, y) => bname(x.b).localeCompare(bname(y.b)), status: (x, y) => stK(x.b) - stK(y.b), owner: (x, y) => (x.o ? pname(x.o) : '').localeCompare(y.o ? pname(y.o) : ''), prog: (x, y) => x.s.pct - y.s.pct, over: (x, y) => x.s.over - y.s.over };
  const f = S[P.sort] || S.mod, dir = P.dir === 'asc' ? 1 : -1; bs.sort((x, y) => f(x, y) * dir);
  const sel = (id, all, opts, v) => <select className="fld" id={id} aria-label={all} defaultValue={v}><option value="">{all}</option>{opts.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>;
  const th = (k, label, cls?) => { const on = P.sort === k; return <th className={cls || ''} aria-sort={on ? (P.dir === 'asc' ? 'ascending' : 'descending') : 'none'}><button className={`srt ${on ? 'on' : ''}`} data-a="psort" data-v={k} title={t('sortBy', { x: label })}>{label}{ic(on ? (P.dir === 'asc' ? 'up' : 'down') : 'updown')}</button></th>; };
  const any = P.q || P.dept || P.owner || P.member || P.status;
  return (
    <div className="page"><h1>{t('projectsNav')}</h1><p className="lead">{t('projLead')}</p>
      <div className="pfind">{ic('search')}<input id="pq" type="search" placeholder={t('findProj')} defaultValue={P.q} aria-label={t('findProj')} /></div>
      <div className="pfil">{sel('pf-dept', t('anyDept'), depts().map(d => [d.id, d[lang]]), P.dept)}{sel('pf-owner', t('anyOwner'), owners.map(o => [o, pname(o)]), P.owner)}{sel('pf-member', t('anyMember'), mem.map(o => [o, pname(o)]), P.member)}{' '}
        {sel('pf-status', t('anyStatus'), ['on', 'risk', 'off', 'none'].map(k => [k, t('st_' + k)]), P.status)}{any ? <button className="lk2 pfclr" data-a="pfclear">{ic('x')}{t('clearF')}</button> : null}{' '}
        <label className="sortl">{t('sortL')}{' '}<select className="fld" id="pf-sort" defaultValue={P.sort}>{['mod', 'name', 'prog', 'over'].map(k => <option key={k} value={k}>{t({ mod: 'sortMod', name: 'sortName', prog: 'sortProg', over: 'sortOver' }[k])}</option>)}{['status', 'owner'].includes(P.sort) ? <option value={P.sort}>{t(P.sort === 'status' ? 't_status' : 't_owner')}</option> : null}</select></label></div>
      {bs.length ? <div className="tw"><table className="tbl pin" id="projtbl"><tbody><tr>{th('name', t('t_board'))}{th('status', t('t_status'))}{th('owner', t('t_owner'))}{th('prog', t('t_prog'))}{th('over', t('t_over'), 'num')}<th>{t('t_members')}</th>{th('mod', t('t_last'))}{chevTh()}</tr>
        {bs.map(({ b, s, m, o }) => <tr key={b.id} className="click" data-a="board" data-id={b.id}><td><div style={css('display:flex;align-items:center;gap:8px')}><span style={css(`display:inline-block;width:10px;height:10px;border-radius:3px;flex:none;background:${dept(b.dept).dot}`)}></span><span style={css('min-width:0')}><b dir="auto">{bname(b)}</b><div className="sm">{deptName(b.dept)}</div></span></div></td>
          <td>{b.kind ? null : stChip(b.status)}</td><td className="sm">{o ? pname(o) : '-'}</td><td>{pbar(s.pct)}</td><td className={`num ${s.over ? 'bad' : ''}`}>{s.over}</td><td><div style={css('display:flex')}>{boardPeople(b).slice(0, 5).map(x => <Fragment key={x}>{av(x)}</Fragment>)}</div></td><td className="sm">{m ? ago(m) : '-'}</td>{chevTd()}</tr>)}</tbody></table></div> : <div className="empty-p">{t('noProj')}{any ? <>{' '}<button className="lk2" data-a="pfclear">{t('clearF')}</button></> : null}</div>}</div>
  );
}

export const legend = items => <div className="legend">{items.map(([cls, txt], i) => <span key={i}><i className={cls}></i>{txt}</span>)}</div>;

export function goalRow(g) {
  const bs = (g.boards || []).map(id => D.boards[id]).filter(Boolean);
  return (
    <tr key={g.id} className="click" data-a="gopen" data-id={g.id}><td><b dir="auto">{g.title}</b>{g.status && g.status.note ? <div className="sm" dir="auto">{g.status.note}</div> : null}</td>
      <td>{stChip(g.status)}</td><td>{pbar(goalPct(g))}</td><td className="sm">{g.owner ? <div style={css('display:flex;align-items:center;gap:6px')}>{av(g.owner)}{pname(g.owner)}</div> : '-'}</td>
      <td className="sm">{g.due ? fmtDay(g.due) : '-'}</td><td className="sm">{bs.length ? bs.map(b => bname(b)).join(', ') : '-'}</td></tr>
  );
}

export function goalsHTML() {
  const G = goalsSeen(), groups = [['company', t('companyGoals')]].concat(DEPTS.filter(d => G.some(g => g.lvl === d.id)).map(d => [d.id, d[lang]]));
  const can = isCEO() || headAny(meP());
  return (
    <div className="page"><div className="phead"><div><h1>{t('goals')}</h1><p className="lead">{t('goalsLead')}</p></div>{can ? <button className="btn" data-a="gnew">{ic('plus')}{t('newGoal')}</button> : null}</div>
      {G.length ? groups.map(([k, n]) => {
        const gs = G.filter(g => g.lvl === k); return gs.length ? <Fragment key={k}><div className="h2">{k === 'company' ? ic('target') : <span className="dot" style={css(`width:10px;height:10px;border-radius:3px;background:${dept(k).dot}`)}></span>}{n}</div>
          <div className="tw"><table className="tbl goaltbl"><tbody><tr><th>{t('gTitle')}</th><th>{t('gStatus')}</th><th>{t('t_prog')}</th><th>{t('gOwner')}</th><th>{t('gDue')}</th><th>{t('gBoards').split(' (')[0]}</th></tr>{gs.map(goalRow)}</tbody></table></div></Fragment> : null;
      }) : <div className="empty-p">{t('noGoals')}</div>}</div>
  );
}

export function goalFormHTML() {
  const f = V.gf, g = f.id && (D.goals || []).find(x => x.id === f.id), ro = g && !canGoal(g), miss = k => f.bad.includes(k) ? 'miss' : '';
  const lvls = (isCEO() ? ['company'].concat(DEPTS.map(d => d.id)) : scopeD());
  const bs = boards().filter(b => f.lvl === 'company' || b.dept === f.lvl);
  return (
    <div className="ov"><div className="md" role="dialog" aria-modal="true" aria-label={t('editGoal')} style={css('max-width:640px')}>
      <button className="ib x" data-a="gx" aria-label={t('close')}>{ic('x')}</button>
      <div className="mhead">{ic('target')}<div className="mt" style={css('cursor:default')}>{f.id ? t('editGoal') : t('newGoal')}</div></div>
      <div className="ntf"><fieldset className="ro" disabled={!!ro}>
        {ro ? <div className="reqnote">{t('gRo')}</div> : null}{f.bad.length ? <div className="errbox">{t('need')}</div> : null}
        <label className="fl" htmlFor="gf-title">{t('gTitle')}{' '}<b>*</b></label><input className={`fld ${miss('title')}`} id="gf-title" dir="auto" maxLength={160} style={css('width:100%')} placeholder={t('gTitlePh')} defaultValue={f.title} />
        <div className="g3">
          <div><label className="fl" htmlFor="gf-lvl">{t('gLevel')}</label><select className="fld" id="gf-lvl" defaultValue={f.lvl}>{lvls.map(k => <option key={k} value={k}>{k === 'company' ? t('companyLvl') : deptName(k)}</option>)}</select></div>
          <div><label className="fl" htmlFor="gf-owner">{t('gOwner')}{' '}<b>*</b></label><select className={`fld ${miss('owner')}`} id="gf-owner" defaultValue={f.owner}><option value="">-</option>{PEOPLE.filter(p => !p.invited && (f.lvl === 'company' || inD(p, f.lvl) || p.ceo)).map(p => <option key={p.id} value={p.id}>{pname(p.id)}</option>)}</select></div>
          <div><label className="fl" htmlFor="gf-due">{t('gDue')}{' '}<b>*</b></label><input className={`fld ${miss('due')}`} type="date" id="gf-due" defaultValue={f.due} /></div>
        </div>
        <label className="fl">{t('gBoards')}</label><div className="lchips">{bs.map(b => <button key={b.id} className={`pchip ${f.boards.includes(b.id) ? 'on' : ''}`} style={css('padding:0 12px')} data-a="gfb" data-v={b.id}>{f.boards.includes(b.id) ? ic('tick') : null}{bname(b)}</button>)}</div>
        {f.boards.length ? null : <><label className="fl" htmlFor="gf-pct">{t('gPct')}</label><input className="fld" type="number" min="0" max="100" id="gf-pct" defaultValue={f.pct} style={css('width:120px')} /></>}
        <div className="g3"><div><label className="fl" htmlFor="gf-s">{t('gStatus')}</label><select className="fld" id="gf-s" defaultValue={f.s}>{['on', 'risk', 'off'].map(k => <option key={k} value={k}>{t('st_' + k)}</option>)}</select></div></div>
        <label className="fl" htmlFor="gf-note">{t('gNote')}</label><textarea className="desc" id="gf-note" dir="auto" style={css('min-height:60px')} maxLength={240} defaultValue={f.note}></textarea>
        <div className="row" style={css('justify-content:flex-end;margin-top:18px')}>{f.id && !ro ? <button className="btn dan" data-a="gdel" style={css('margin-inline-end:auto')}>{t('delGoal')}</button> : null}<button className="btn sec" data-a="gx">{t('cancel')}</button>{ro ? null : <button className="btn" data-a="gsave">{t('saveB')}</button>}</div>
      </fieldset></div></div></div>
  );
}
