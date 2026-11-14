/* Hire's menu, header and main area (was render() in the original page), and opt() for dropdown choices. */
import {
  $, CFG, DEMO, DEMO_PEOPLE, DEPTS, HURL, NAV_IC, OWNER, PAGE_LABEL, S, V, afterData, allCands, go, headSees, reqOf,
} from '../core';
import { paint, svg } from '../ui';
import { pApprovals, pDash, pPipeline, pPool, pReqs } from './pages';
import { pCareers, pJobs, pMine, pTeam } from './team';

/** One dropdown choice. Which one is chosen is set with defaultValue on the <select>. */
export const opt = (v: unknown, label: unknown, _cur?: unknown) => <option key={String(v)} value={String(v)}>{String(label)}</option>;

export function render() {
  if (!V.pages) return;
  const C = allCands();
  const badge: Record<string, number> = {
    approvals: Object.values(S.reqs).filter((r: any) => r.status === 'requested').length + Object.values(C).filter((c: any) => c.stage === 'approval').length,
    reqs: V.role === 'head' ? Object.values(S.reqs).filter((r: any) => r.status === 'review' && headSees(r)).length : Object.values(S.reqs).filter((r: any) => r.status === 'approved' || r.status === 'ready').length,
    pipeline: V.role === 'head'
      ? Object.values(C).filter((c: any) => headSees(reqOf(c)) && (c.stage === 'shortlist' || (c.stage === 'interview' && !(c.iv || {})[V.me]))).length
      : Object.values(C).filter((c: any) => c.stage === 'applied').length,
  };
  paint('#nav', V.pages.map((p: string) => (
    <a key={p} className={p === V.page ? 'on' : ''} onClick={() => go(p)} title={PAGE_LABEL[p]} aria-current={p === V.page ? 'page' : undefined}>
      {svg(NAV_IC[p] || '')}<span className="lb">{PAGE_LABEL[p]}</span>{badge[p] ? <span className="n">{badge[p]}</span> : null}
    </a>
  )));
  paint('#crumb', <><span className="cr-app">Hire</span><span className="cr-sep" aria-hidden="true">›</span><span className="cr-pg">{PAGE_LABEL[V.page] || ''}</span></>);
  const roleName = ({ hr: V.ceo ? 'CEO · HR' : 'HR', head: 'Dept head' + (V.dept ? ' · ' + V.dept : ''), candidate: 'Candidate' } as Record<string, string>)[V.role];
  let sw = null;
  if (DEMO) sw = (
    <select defaultValue={V.viewAs} onChange={e => { V.viewAs = e.currentTarget.value; V.page = null; afterData(); }}>
      {Object.entries(DEMO_PEOPLE).map(([k, p]: [string, any]) => <option key={k} value={k}>{p.name}</option>)}
    </select>
  );
  else if (OWNER) {
    const cur = V.role === 'head' && DEPTS.includes(V.dept) ? 'head:' + V.dept : V.role === 'candidate' && !HURL ? 'candidate' : 'hr';
    sw = (
      <select defaultValue={cur} onChange={e => { const v = e.currentTarget.value; V.viewAs = v.split(':')[0]; V.viewDept = v.split(':')[1] || null; V.page = null; afterData(); }}>
        <option value="hr">View as: CEO · HR</option>
        {DEPTS.map((d: string) => <option key={d} value={'head:' + d}>View as: {d} head</option>)}
        {HURL ? null : <option value="candidate">View as: Candidate</option>}
      </select>
    );
  }
  paint('#who', <><span className="role">{roleName}</span>{sw}</>);
  paint('#sideFoot', HURL ? (
    <a className="sd-apps" href={CFG.ERP_HOME || '/'} title="Forka Apps">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>
      <span className="lb">Forka Apps</span>
    </a>
  ) : null);
  const fn = ({ dash: pDash, approvals: pApprovals, reqs: pReqs, pipeline: pPipeline, pool: pPool, careers: pCareers, team: pTeam, jobs: pJobs, mine: pMine } as Record<string, (c: any) => any>)[V.page];
  paint('#main', fn(C));
}
void $;
