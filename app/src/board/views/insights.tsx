/* Board screens: Portfolios, Timeline, Reporting, Resourcing, People, profile window, Chat (moved from the HTML templates). */
import {
  V, D, t, lang, day, today, portsSeen, stats, cardsOf, canSee, boards, bname, deptName, bStart, bDue, bOwner, fmtDay, pname,
  mondayOf, liveLists, match, LN, fmtRange, dueCls, scopeBoards, isCEO, DEPTS, pct, scopePeople, scopeD, wlItems, dnames,
  perRange, perfOf, listOf, boardOfList, away, PEOPLE, dlist, inD, dept, isHd, allCards, person, ME, prof, pD, canCh, myChans,
  myDms, chUnread, dmKey, chName, chMembers, LIVE, withMentions,
} from '../core';
import { ic, av, pbar, stChip, css, Fragment } from '../ui';
import { legend } from './home';

export function portsHTML() {
  const P = portsSeen(), cur = V.port && P.find(x => x.id === V.port);
  if (!cur) return (
    <div className="page"><div className="phead"><div><h1>{t('ports')}</h1><p className="lead">{t('portsLead')}</p></div></div>
      <div className="tiles">{P.map(x => {
        const bs = x.items.map(i => D.boards[i.b]).filter(Boolean), worst = ['off', 'risk', 'on'].find(k => bs.some(b => b.status && b.status.s === k));
        return (
          <button key={x.id} className="tile" data-a="popen" data-id={x.id}><span className="band" style={css('background:var(--bronze)')}></span><h3 dir="auto">{x.name}</h3><div>{worst ? stChip({ s: worst }) : null}</div>
            <div className="meta"><span>{t('projN', { n: bs.length })}</span></div>{pbar(stats(bs.flatMap(cardsOf)).pct)}<div className="foot"><span className="who">{av(x.owner)}</span></div></button>
        );
      })}
        <div className="tile comp" style={css('justify-content:center')}><input id="newport" className="fld" dir="auto" maxLength={60} placeholder={t('portPh')} /><div className="row"><button className="btn" data-a="pnew">{ic('plus')}{t('newPort')}</button></div></div></div>
      {P.length ? null : <div className="empty-p" style={css('margin-top:14px')}>{t('noPorts')}</div>}</div>
  );
  const items = cur.items.filter(i => D.boards[i.b] && canSee(D.boards[i.b])), tab = V.ptab || 'list';
  const add = boards().filter(b => !cur.items.some(i => i.b === b.id));
  return (
    <div className="page"><button className="crumb" data-a="go" data-v="ports" style={css('color:var(--muted);padding-inline-start:0')}>{ic(lang === 'ar' ? 'right' : 'left')} {t('ports')}</button>
      <div className="phead"><div><h1 dir="auto">{cur.name}</h1></div><button className="btn dan" data-a="pdel">{t('delPort')}</button></div>
      <div className="tabs"><button className={`tab ${tab === 'list' ? 'on' : ''}`} data-a="ptab" data-v="list">{ic('list')} {t('listV')}</button><button className={`tab ${tab === 'tl' ? 'on' : ''}`} data-a="ptab" data-v="tl">{ic('gantt')} {t('tlV')}</button></div>
      {tab === 'tl' ? timelineHTML(items.map(i => { const b = D.boards[i.b], s = stats(cardsOf(b)); return { id: b.id, act: 'board', label: bname(b), sub: deptName(b.dept), start: bStart(b), end: bDue(b), cls: s.pct === 100 ? 'done' : s.over ? 'over' : '', pct: s.pct }; }), '', t('tlProjects')) :
        <Fragment>
          <div className="tw"><table className="tbl" id="porttbl"><tbody><tr><th>{t('t_board')}</th><th>{t('t_status')}</th><th>{t('t_prog')}</th><th>{t('t_due')}</th><th>{t('t_pri')}</th><th>{t('t_owner')}</th><th></th></tr>
            {items.map(i => {
              const b = D.boards[i.b], s = stats(cardsOf(b)), o = bOwner(b), du = bDue(b);
              return (
                <tr key={b.id} className="click" data-a="board" data-id={b.id}><td><b dir="auto">{bname(b)}</b><div className="sm">{deptName(b.dept)}</div></td>
                  <td>{b.kind ? null : stChip(b.status)}</td><td>{pbar(s.pct)}</td><td className="sm">{du ? fmtDay(du) : '-'}</td>
                  <td><select className="fld ppri" data-b={b.id} aria-label={t('t_pri')} defaultValue={i.pri || 'normal'}>{['low', 'normal', 'high', 'urgent'].map(r => <option key={r} value={r}>{t('p_' + r)}</option>)}</select></td>
                  <td className="sm">{o ? <div style={css('display:flex;align-items:center;gap:6px')}>{av(o)}{pname(o)}</div> : '-'}</td><td style={css('text-align:end')}><button className="lk2" data-a="prm" data-v={b.id}>{t('removeP')}</button></td></tr>
              );
            })}</tbody></table></div>
          <div className="row" style={css('max-width:460px;margin-top:12px')}><select className="fld" id="padd" style={css('flex:1;min-width:0')}><option value="">{t('addProj')}</option>{add.map(b => <option key={b.id} value={b.id}>{bname(b)}</option>)}</select></div>
        </Fragment>}</div>
  );
}

export function timelineHTML(rows, head, nameHead) {
  const DW = 26, t0 = today(); const dated = rows.filter(r => r.end || r.start);
  let from = Math.min(t0 - 7 * day, ...dated.map(r => r.start || r.end)), to = Math.max(t0 + 28 * day, ...dated.map(r => r.end || r.start));
  from = mondayOf(from); to = Math.min(to, from + 150 * day); const n = Math.round((to - from) / day) + 7, W = n * DW, x = ts => Math.round((Math.max(from, Math.min(ts, to + 6 * day)) - from) / day) * DW;
  const weeks = []; for (let w = from; w < from + n * day; w += 7 * day) weeks.push(w);
  const loc = lang === 'ar' ? 'ar-AE' : 'en-GB';
  return (
    <div className="tl">{legend([['lg-open', t('legOpen')], ['lg-over', t('legOver')], ['lg-done', t('legDone')], ['lg-ms', t('legMs')]])}
      <div className="tlw"><div className="tlg" style={css(`--w:${W}px`)}>
        <div className="tll tlhd tlnh">{nameHead || ''}</div><div className="tlr tlhd">{weeks.map(w => <span key={w} style={css(`inset-inline-start:${x(w)}px`)}>{new Date(w).toLocaleDateString(loc, { day: 'numeric', month: 'short' })}</span>)}<i className="tnow" style={css(`inset-inline-start:${x(t0) + DW / 2}px`)}></i><b className="tnowl" style={css(`inset-inline-start:${x(t0) + DW / 2}px`)}>{t('tlNow')}</b></div>
        {rows.map((r, ri) => {
          if (r.group) return <Fragment key={ri}><div className="tll tlgrp" dir="auto">{r.group}</div><div className="tlr tlgrp"></div></Fragment>;
          const rng = `${r.start && r.end && r.start !== r.end ? fmtDay(r.start) + ' – ' : ''}${fmtDay(r.end || r.start)}`;
          return (
            <Fragment key={ri}>
              <button className="tll" data-a={r.act} data-id={r.id} dir="auto"><span>{r.label}</span>{r.sub ? <small>{r.sub}</small> : null}</button>
              <div className="tlr">{weeks.map(w => <i key={w} className="tvl" style={css(`inset-inline-start:${x(w)}px`)}></i>)}<i className="tnow" style={css(`inset-inline-start:${x(t0) + DW / 2}px`)}></i>
                {!(r.end || r.start) ? null : r.ms
                  ? <button className={`tms ${r.cls}`} data-a={r.act} data-id={r.id} style={css(`inset-inline-start:${x(r.end) + 3}px`)} title={`${r.label} · ${fmtDay(r.end)}`} aria-label={`${r.label} · ${fmtDay(r.end)}`}>{ic('diamond')}</button>
                  : <button className={`tbar ${r.cls}`} data-a={r.act} data-id={r.id} aria-label={`${r.label} · ${rng}`} style={css(`inset-inline-start:${x(r.start || r.end) + 2}px;width:${Math.max(DW - 4, x(r.end || r.start) - x(r.start || r.end) + DW - 4)}px`)} title={`${r.label} · ${rng}`}>{r.pct != null ? <em>{r.pct}%</em> : null}</button>}</div>
            </Fragment>
          );
        })}
      </div></div>{head || null}</div>
  );
}

export function boardTimeline(b) {
  const rows = []; let none = 0; liveLists(b).forEach(id => {
    const L = D.lists[id], cs = L.cards.map(c => D.cards[c]).filter(c => c && !c.archived && match(c)); const dated = cs.filter(c => c.due || c.start); none += cs.length - dated.length;
    if (dated.length) { rows.push({ group: LN(L) }); dated.forEach(c => rows.push({ id: c.id, act: 'open', label: c.title, sub: fmtRange(c) || fmtDay(c.start), start: c.start, end: c.due, ms: c.type === 'milestone', cls: c.done ? 'done' : dueCls(c) === 'over' ? 'over' : '' })); }
  });
  return timelineHTML(rows, none ? <p className="sm" style={css('margin:10px 0 0;opacity:.8')}>{t('noDates', { n: none })}</p> : '', t('tlTasks'));
}

export function hbars(rows, stack?) {
  const max = Math.max(1, ...rows.map(r => stack ? r.v.reduce((a, b) => a + b, 0) : r.v));
  return (
    <div className="hb">{rows.map((r, ri) => {
      const tot = stack ? r.v.reduce((a, b) => a + b, 0) : r.v;
      return (
        <div key={ri} className="hbr"><span className="hbl" dir="auto">{r.l}</span><span className="hbt">{stack ? r.v.map((v, i) => v ? <i key={i} className={stack[i]} style={css(`width:${v / max * 100}%`)} title={`${r.l}: ${v}`}></i> : null) : <i className={r.cls || 'lg-one'} style={css(`width:${tot / max * 100}%`)} title={`${r.l}: ${tot}`}></i>}<b>{tot}</b></span></div>
      );
    })}</div>
  );
}

export const tableOf = (heads, rows) => (
  <details className="dtab"><summary>{t('asTable')}</summary><table className="tbl"><tbody><tr>{heads.map((h, i) => <th key={i} className={i ? 'num' : ''}>{h}</th>)}</tr>{rows.map((r, ri) => <tr key={ri}>{r.map((v, i) => <td key={i} className={i ? 'num' : ''}>{v}</td>)}</tr>)}</tbody></table></details>
);

export function reportHTML() {
  const bs = scopeBoards(), all = bs.flatMap(b => cardsOf(b).map(c => ({ c, b }))), S = stats(all.map(x => x.c)), t0 = today(), a30 = Date.now() - 30 * day;
  const d30 = all.filter(x => x.c.done && (x.c.doneAt || 0) >= a30), dd = d30.filter(x => x.c.due), ot = dd.filter(x => x.c.doneAt < x.c.due + day).length;
  const byDept = isCEO(); const grp = byDept ? DEPTS.map(d => ({ l: d[lang], cs: all.filter(x => x.b.dept === d.id).map(x => x.c) })) : bs.map(b => ({ l: bname(b), cs: cardsOf(b) }));
  const st = grp.map(g => { const s = stats(g.cs); return { l: g.l, v: [s.done, s.open - s.over, s.over] }; }).filter(r => r.v.some(Boolean));
  const w0 = mondayOf(t0), wk = [...Array(8)].map((_, i) => w0 - (7 - i) * 7 * day).map(w => ({ w, n: all.filter(x => x.c.done && x.c.doneAt >= w && x.c.doneAt < w + 7 * day).length })); const wmax = Math.max(1, ...wk.map(x => x.n));
  const pri = ['urgent', 'high', 'normal', 'low'].map(k => ({ l: t('p_' + k), v: all.filter(x => !x.c.done && (x.c.priority || 'normal') === k).length, cls: k === 'urgent' ? 'lg-over' : 'lg-one' }));
  const op = scopePeople().map(p => ({ l: pname(p.id), v: all.filter(x => !x.c.done && x.c.due && x.c.due < t0 && x.c.members.includes(p.id)).length, cls: 'lg-over' })).filter(r => r.v).sort((a, b) => b.v - a.v).slice(0, 8);
  const loc = lang === 'ar' ? 'ar-AE' : 'en-GB', wl = w => new Date(w).toLocaleDateString(loc, { day: 'numeric', month: 'short' });
  return (
    <div className="page rep"><div className="phead"><div><h1>{t('report')}</h1><p className="lead">{isCEO() ? t('reportLead') : t('reportLeadHead', { d: scopeD().map(deptName).join(', ') })}</p></div>
      <div className="row noprint" style={css('margin:0;flex-wrap:wrap')}><button className="btn sec" data-a="csv">{ic('download')}{t('exportCsv')}</button><button className="btn sec" data-a="print">{ic('print')}{t('printB')}</button></div></div>
      <div className="kpis"><div className="kpi"><b>{S.open}</b><span>{t('k_open')}</span></div><div className={`kpi ${S.over ? 'bad' : ''}`}><b>{S.over}</b><span>{t('k_over')}</span></div>
        <div className="kpi"><b>{d30.length}</b><span>{t('k_done30')}</span></div><div className="kpi"><b>{dd.length ? pct(ot, dd.length) + '%' : '-'}</b><span>{t('k_ontime')}</span></div></div>
      <div className="charts">
        <div className="chart"><h3>{byDept ? t('ch_status') : t('ch_statusB')}</h3>{legend([['lg-done', t('legDone')], ['lg-open', t('legOpen')], ['lg-over', t('legOver')]])}{hbars(st, ['lg-done', 'lg-open', 'lg-over'])}
          {tableOf([byDept ? t('t_dept') : t('t_board'), t('legDone'), t('legOpen'), t('legOver')], st.map(r => [r.l, ...r.v]))}</div>
        <div className="chart"><h3>{t('ch_weeks')}</h3><div className="vb">{wk.map(x => <div key={x.w} className="vbc" title={`${t('weekOf', { d: wl(x.w) })}: ${x.n}`}><b>{x.n}</b><i style={css(`height:${x.n / wmax * 100}%`)}></i><span>{wl(x.w)}</span></div>)}</div>
          {tableOf([t('weekOf', { d: '' }).trim(), t('pf_done')], wk.map(x => [wl(x.w), x.n]))}</div>
        <div className="chart"><h3>{t('ch_pri')}</h3>{hbars(pri)}</div>
        <div className="chart"><h3>{t('ch_overP')}</h3>{op.length ? hbars(op) : <p className="sm" style={css('color:var(--muted)')}>{t('nothingOver')}</p>}</div>
      </div></div>
  );
}

export const delta = (a, b, good, u?) => { if (a == null || b == null || a === b) return null; const up = a > b; return <small dir="ltr" className={`dl ${up === good ? 'g' : 'b'}`} title={t('vsPrev')}>{`${up ? '+' : '−'}${Math.abs(a - b)}${u || ''}`}</small>; };

export function resHTML() {
  const tab = V.rtab || 'wl', P = scopePeople(), t0 = today(), w0 = mondayOf(t0), loc = lang === 'ar' ? 'ar-AE' : 'en-GB';
  const tabs = <div className="tabs"><button className={`tab ${tab === 'wl' ? 'on' : ''}`} data-a="rtab" data-v="wl">{ic('users')} {t('wlTab')}</button><button className={`tab ${tab === 'perf' ? 'on' : ''}`} data-a="rtab" data-v="perf">{ic('chart')} {t('perfTab')}</button></div>;
  let body;
  if (tab === 'wl') {
    const W = [0, 1, 2, 3].map(i => w0 + i * 7 * day);
    body = <Fragment><p className="lead">{t('wlLead')}</p><div className="tw"><table className="tbl" id="wltbl"><tbody><tr><th>{t('t_person')}</th>{isCEO() ? <th>{t('t_dept')}</th> : null}<th className="num">{t('overdueCol')}</th>{W.map((w, i) => <th key={i} className="num">{i ? new Date(w).toLocaleDateString(loc, { day: 'numeric', month: 'short' }) : t('thisWeek')}</th>)}<th className="num">{t('limitL')}</th></tr>
      {P.map(p => {
        const it = wlItems(p.id), cap = (D.cap || {})[p.id] || 6, over = it.filter(x => x.due && x.due < t0).length;
        const cell = (n, k) => <td key={k} className="num"><button className={`wlc ${n > cap ? 'hi' : n >= Math.ceil(cap * .8) && n ? 'mid' : ''} ${n ? '' : 'z'}`} data-a="wlc" data-v={`${p.id}|${k}`} data-wl={`${p.id}|${k}`} disabled={!n}>{n}</button></td>;
        return (
          <tr key={p.id}><td><div style={css('display:flex;align-items:center;gap:8px')}>{av(p.id)}<span>{pname(p.id)}</span></div></td>{isCEO() ? <td className="sm">{dnames(p)}</td> : null}
            <td className="num"><button className={`wlc ${over ? 'hi' : 'z'}`} data-a="wlc" data-v={`${p.id}|over`} data-wl={`${p.id}|over`} disabled={!over}>{over}</button></td>
            {W.map((w, i) => cell(it.filter(x => x.due && x.due >= Math.max(w, t0) && x.due < w + 7 * day).length, i))}
            <td className="num"><input className="fld capin" type="number" min="1" max="40" data-p={p.id} defaultValue={cap} aria-label={t('limitL')} /></td></tr>
        );
      })}</tbody></table></div></Fragment>;
  } else {
    const [f, to, pf, pt] = perRange(), per = V.pper || '30';
    const rows = P.map(p => ({ p, a: perfOf(p.id, f, to), b: perfOf(p.id, pf, pt) })).sort((x, y) => y.a.n - x.a.n);
    body = <Fragment><div className="reqnote" style={css('margin:0 0 14px')}>{ic('chart')}<span>{t('perfLead')}</span></div>
      <div className="row" style={css('margin:0 0 12px;align-items:center;gap:8px')}><span className="sm" style={css('color:var(--muted)')}>{t('period')}</span><div className="vseg">{['30', '90', 'month'].map(k => <button key={k} data-a="pper" data-v={k} className={per === k ? 'on' : ''}>{t(k === 'month' ? 'pmonth' : 'p' + k)}</button>)}</div></div>
      <div className="tw"><table className="tbl" id="perftbl"><tbody><tr><th>{t('t_person')}</th>{isCEO() ? <th>{t('t_dept')}</th> : null}<th className="num">{t('pf_done')}</th><th className="num">{t('pf_ontime')}</th><th className="num">{t('pf_late')}</th><th className="num">{t('pf_avgLate')}</th><th className="num">{t('pf_overNow')}</th><th className="num">{t('pf_subs')}</th></tr>
        {rows.map(({ p, a, b }) => (
          <tr key={p.id} className="click" data-a="pfp" data-v={p.id}><td><div style={css('display:flex;align-items:center;gap:8px')}>{av(p.id)}<span>{pname(p.id)}</span></div></td>{isCEO() ? <td className="sm">{dnames(p)}</td> : null}
            <td className="num">{a.n}{delta(a.n, b.n, true)}</td><td className="num">{a.rate == null ? '-' : <span className={`rt ${a.rate >= 80 ? 'g' : a.rate >= 60 ? 'm' : 'b'}`}>{a.rate}%</span>}{delta(a.rate, b.rate, true, '%')}</td><td className="num">{a.late}</td><td className="num">{a.late ? a.avgLate : '-'}</td>
            <td className={`num ${a.over ? 'bad' : ''}`}>{a.over}</td><td className="num">{a.subs}</td></tr>
        ))}</tbody></table></div>
      {V.perfP ? perfDetail(V.perfP, f, to) : null}</Fragment>;
  }
  return <div className="page"><h1>{t('resourcing')}</h1><p className="lead">{t('resLead')}</p>{tabs}{body}</div>;
}

export function perfDetail(pid, f, to) {
  const a = perfOf(pid, f, to), over = Object.values(D.cards).filter((c: any) => !c.archived && c.members.includes(pid) && !c.done && c.due && c.due < today() && listOf(c.id)) as any[];
  const row = c => {
    const b = boardOfList(listOf(c.id).id), late = c.due ? Math.ceil((c.doneAt - c.due - day) / day) : null;
    return (
      <tr key={c.id} className="click" data-a="open" data-id={c.id}><td><b dir="auto">{c.title}</b><div className="sm">{bname(b)}</div></td><td className="sm">{c.due ? fmtDay(c.due) : t('noDue')}</td><td className="sm">{fmtDay(c.doneAt)}</td>
        <td>{c.due == null ? null : late > 0 ? <span className="st off"><i></i>{t('lateBy', { n: late })}</span> : <span className="st on"><i></i>{t('onTimeTag')}</span>}</td></tr>
    );
  };
  return (
    <Fragment>
      <div className="h2" id="perfdet">{av(pid)} {t('perfOf', { p: pname(pid) })}<span className="sp" style={css('flex:1')}></span><button className="lk2" data-a="pfp" data-v="">{t('close2')}</button></div>
      {a.done.length ? <div className="tw"><table className="tbl"><tbody><tr><th>{t('t_task')}</th><th>{t('due')}</th><th>{t('doneOn')}</th><th></th></tr>{a.done.sort((x, y) => y.doneAt - x.doneAt).map(row)}</tbody></table></div> : <div className="empty-p">{t('noTasksP')}</div>}
      {over.length ? <Fragment><div className="mine-g bad">{t('stillOver')} <span className="c">{over.length}</span></div><div className="tw"><table className="tbl"><tbody>{over.map(c => <tr key={c.id} className="click" data-a="open" data-id={c.id}><td><b dir="auto">{c.title}</b></td><td className="num"><span className="due over">{fmtDay(c.due)}</span></td></tr>)}</tbody></table></div></Fragment> : null}
    </Fragment>
  );
}

export const awayTag = id => { const o = away(id); return o ? <span className="awt">{t('awayUntil', { d: fmtDay(new Date(o.to + 'T00:00:00').getTime()) })}</span> : null; };

export function peopleHTML() {
  const q = (V.pq2 || '').toLowerCase(), L = PEOPLE.filter(p => !p.invited || isCEO()).filter(p => !q || pname(p.id).toLowerCase().includes(q) || dlist(p).some(d => deptName(d).toLowerCase().includes(q)));
  const grp = [['ceo', L.filter(p => p.ceo)]].concat(DEPTS.map(d => [d.id, L.filter(p => inD(p, d.id))]), [['none', L.filter(p => !p.ceo && !dlist(p).length)]]).filter(g => g[1].length);
  return (
    <div className="page"><h1>{t('people')}</h1><p className="lead">{t('peopleLead')}</p>
      <div className="pfind">{ic('search')}<input id="pq2" type="search" placeholder={t('findPerson')} defaultValue={V.pq2 || ''} aria-label={t('findPerson')} /></div>
      {grp.map(([k, ps]: [any, any[]]) => (
        <Fragment key={k}>
          <div className="h2">{k === 'ceo' ? t('ceoRole') : k === 'none' ? t('noDept') : <Fragment><span style={css(`width:10px;height:10px;border-radius:3px;background:${dept(k).dot}`)}></span>{deptName(k)}</Fragment>}</div>
          <div className="ppl">{ps.map(p => {
            const n = allCards().filter(({ c }) => !c.done && c.members.includes(p.id)).length;
            return (
              <button key={p.id} className="pcard" data-a="prof" data-v={p.id}>{av(p.id, 'lg')}<span><b dir="auto">{pname(p.id)}</b>
                <small>{`${p.ceo ? t('ceoRole') : k !== 'none' && isHd(p, k) ? t('headLabel') : t('staff')}${n ? ' · ' + t('openN', { n }) : ''}`}</small>{awayTag(p.id)}</span></button>
            );
          })}</div>
        </Fragment>
      ))}</div>
  );
}

export function profHTML() {
  const id = V.prof, p = person(id), me = id === ME(), ed = me && V.profEdit, P = ed && V.prDraft ? V.prDraft : prof(id), o = P.ooo || {};
  const open = allCards().filter(({ c }) => !c.done && c.members.includes(id)), email = p.email || P.email || '', ph = (P.phone || '').replace(/[^\d+]/g, '');
  return (
    <div className="ov" data-a="profx"><div className="md" role="dialog" aria-modal="true" aria-label={pname(id)} style={css('max-width:560px')}>
      <button className="ib x" data-a="profx" aria-label={t('close')}>{ic('x')}</button>
      <div className="profh">{av(id, 'xl')}<div><h2 dir="auto">{pname(id)}</h2><div className="sm">{p.ceo ? t('ceoRole') : dlist(p).length ? dlist(p).map(d => deptName(d) + (isHd(p, d) ? ' (' + t('head') + ')' : '')).join(' · ') : t('noDept')}</div>{awayTag(id)}</div></div>
      <div className="ntf">{ed ? (
        <Fragment>
          <label className="fl" htmlFor="pr-phone">{t('phone')}</label><input className="fld" id="pr-phone" dir="ltr" maxLength={30} defaultValue={P.phone || ''} style={css('width:100%')} placeholder="+971 5x xxx xxxx" />
          <label className="fl" htmlFor="pr-about">{t('about')}</label><textarea className="desc" id="pr-about" dir="auto" maxLength={300} style={css('min-height:70px')} placeholder={t('aboutPh')} defaultValue={P.about || ''}></textarea>
          <label className="fl">{t('ooo')}</label><div className="g3"><div><label className="fl" htmlFor="pr-from" style={css('margin-top:0')}>{t('oooFrom')}</label><input className="fld" type="date" id="pr-from" defaultValue={o.from || ''} /></div><div><label className="fl" htmlFor="pr-to" style={css('margin-top:0')}>{t('oooTo')}</label><input className={`fld ${V.oooBad ? 'miss' : ''}`} type="date" id="pr-to" defaultValue={o.to || ''} /></div><div><label className="fl" htmlFor="pr-note" style={css('margin-top:0')}>{t('oooNote')}</label><input className="fld" id="pr-note" dir="auto" maxLength={80} defaultValue={o.note || ''} /></div></div>
          {V.oooBad ? <div className="errbox">{t('oooBad')}</div> : null}
          <div className="row" style={css('justify-content:flex-end;margin-top:16px')}><button className="btn sec" data-a="profcancel">{t('cancel')}</button><button className="btn" data-a="profsave">{t('saveB')}</button></div>
        </Fragment>
      ) : (
        <Fragment>
          {P.about ? <p className="about" dir="auto">{P.about}</p> : null}{away(id) && o.note ? <div className="reqnote">{o.note}</div> : null}
          <div className="cbtns">{email ? <a className="btn sec" href={`mailto:${email}`}>{ic('inbox')}{t('emailB')}</a> : null}{ph ? <Fragment><a className="btn sec" href={`tel:${ph}`}>{t('call')}</a><a className="btn sec" href={`https://wa.me/${ph.replace('+', '')}`} target="_blank" rel="noopener">{t('whatsapp')}</a></Fragment> : null}
            {me ? null : <button className="btn" data-a="dm" data-v={id}>{ic('chat')}{t('sendMsg')}</button>}{me ? <button className="btn" data-a="profedit">{t('editProfile')}</button> : null}</div>
          {!email && !ph ? <div className="lock" style={css('padding:8px 0 0')}>{t('noContact')}</div> : null}
          <div className="h2" style={css('margin-top:18px')}>{t('openTasks')} <span className="sm" style={css('color:var(--muted);font-weight:500')}>{open.length}</span></div>
          {open.length ? <div className="tw"><table className="tbl"><tbody>{open.slice(0, 8).map(({ c, b }) => <tr key={c.id} className="click" data-a="open" data-id={c.id}><td><b dir="auto">{c.title}</b><div className="sm">{bname(b)}</div></td><td className="num">{c.due ? <span className={`due ${dueCls(c)}`}>{fmtDay(c.due)}</span> : null}</td></tr>)}</tbody></table></div> : null}
          {isCEO() && !p.ceo ? <Fragment><div className="h2" style={css('margin-top:16px')}>{t('pDepts')}</div><div className="lock" style={css('padding:0 0 6px')}>{t('pDeptsH')}</div><div className="prds">{DEPTS.map(d => <label key={d.id}><span><i style={css(`background:${d.dot}`)}></i>{d[lang]}</span><select className="fld prd" data-d={d.id} defaultValue={isHd(p, d.id) ? 'head' : pD(p)[d.id] === 'staff' ? 'staff' : ''}><option value="">{t('notIn')}</option><option value="staff">{t('staff')}</option><option value="head">{t('headLabel')}</option></select></label>)}</div></Fragment> : null}
          {me ? <div className="lock" style={css('padding:10px 0 0')}>{t('myProfileHint')}</div> : null}
        </Fragment>
      )}</div></div></div>
  );
}

export function chatHTML() {
  const k = V.ch && canCh(V.ch) ? V.ch : null, list = myChans(), dms = myDms();
  const item = x => { const n = chUnread(x); return <button key={x} className={`chi ${k === x ? 'on' : ''}`} data-a="chopen" data-v={x}>{x.startsWith('dm:') ? av(x.slice(3).split('|').find(y => y !== ME()) || ME()) : <span className="hash">#</span>}<span dir="auto">{chName(x)}</span>{n ? <span className="cnt">{n}</span> : null}</button>; };
  const others = PEOPLE.filter(p => p.id !== ME() && !p.invited && !dms.includes(dmKey(ME(), p.id)));
  const msgs = k ? ((D.msgs || {})[k] || []) : []; let lastDay = '';
  const dayL = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); const x = d.getTime(); return x === today() ? t('today2') : x === today() - day ? t('yesterday') : fmtDay(ts); };
  return (
    <div className={`chat ${k ? 'has' : ''}`}><div className="chl"><h1>{t('chat')}</h1><h5>{t('channels')}</h5>{list.map(item)}
      <h5>{t('dms')}</h5>{dms.map(item)}<select className="fld" id="dmnew" aria-label={t('newDm')}><option value="">{t('newDm')}</option>{others.map(p => <option key={p.id} value={p.id}>{pname(p.id)}</option>)}</select>
      {LIVE ? null : <p className="lock" style={css('padding:12px 4px 0')}>{t('chatNote')}</p>}</div>
      <div className="chm">{k ? (
        <Fragment>
          <div className="chh"><button className="ib chback" data-a="chopen" data-v="" aria-label={t('back')}>{ic(lang === 'ar' ? 'right' : 'left')}</button><b dir="auto">{`${k.startsWith('dm:') ? '' : '# '}${chName(k)}`}</b><span className="sm">{k === 'all' ? t('chatAll') : k.startsWith('dm:') ? '' : t('chatLead', { d: deptName(k) }) + ' · ' + chMembers(k).length}</span></div>
          <div className="chs" id="chs">{msgs.length ? msgs.map((m, mi) => {
            const dl = dayL(m.at), sep = dl !== lastDay ? <div className="chday"><span>{dl}</span></div> : null; lastDay = dl;
            return (
              <Fragment key={mi}>{sep}<div className={`msg ${m.by === ME() ? 'me' : ''}`}>{av(m.by)}<div><div className="mh"><b>{pname(m.by)}</b><span>{new Date(m.at).toLocaleTimeString(lang === 'ar' ? 'ar-AE' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div><div className="mb" dir="auto" dangerouslySetInnerHTML={{ __html: withMentions(m.t) }}></div></div></div></Fragment>
            );
          }) : <div className="empty-p" style={css('margin:20px')}>{t('noMsgs')}</div>}</div>
          <div className="chc"><textarea id="chin" className="desc" dir="auto" rows={1} maxLength={2000} placeholder={t('msgPh')}></textarea><button className="btn" data-a="chsend">{t('sendB')}</button></div>
        </Fragment>
      ) : <div className="empty-p" style={css('margin:40px 20px')}>{t('pickChat')}</div>}</div></div>
  );
}
