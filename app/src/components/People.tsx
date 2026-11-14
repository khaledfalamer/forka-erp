import { Fragment, useEffect, useState } from 'react';
import { ALLOWED_DOMAINS } from '../config';
import { appList } from '../apps';
import { fmtTime, useLang } from '../i18n';
import { validEmail } from '../people';
import type { AccessRequest, ActivityItem, Level, Method, Person, PersonDraft, Status } from '../types';
import { SIDES } from '../types';

export function People({ people, requests, onBack, onAdd, onOpen, onAllow, onReject, onConfirm }: {
  people: Person[]; requests: AccessRequest[]; onBack: () => void; onAdd: () => void; onOpen: (p: Person) => void;
  onAllow: (r: AccessRequest) => void; onReject: (r: AccessRequest) => void; onConfirm: (p: Person) => void;
}) {
  const { t, lang } = useLang();
  const [q, setQ] = useState('');
  const [st, setSt] = useState<'all' | Status>('all');
  const apps = appList();
  const waiting = requests.filter(r => r.state === 'waiting').sort((a, b) => ((a.at || '') < (b.at || '') ? -1 : 1));
  const ql = q.toLowerCase();
  const list = people
    .filter(p => (st === 'all' || p.status === st) && (!ql || (p.name + ' ' + p.email).toLowerCase().includes(ql)))
    .sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) || a.name.localeCompare(b.name));
  const appChips = (p: Person) => apps.filter(a => a.id !== 'boards' && p.apps?.[a.id as 'proc']).map(a =>
    <span key={a.id} className="chip">{t('a_' + a.id)}{a.id === 'proc' && p.sides?.length ? ': ' + p.sides.map(s => t('s_' + s)).join(', ') : ''}</span>);
  return <>
    <button className="back" onClick={onBack}>&larr; {t('back')}</button>
    <div className="bar"><h1>{t('people')}</h1><div className="sp" style={{ flex: 1 }} /><button className="btn pri" onClick={onAdd}>{t('addP')}</button></div>
    {waiting.length > 0 && (
      <div className="sec"><h2>{t('waiting')} ({waiting.length})</h2><div className="reqs">
        {waiting.map(r => (
          <div className="req" key={r.email} data-req={r.email}>
            <div className="who">{r.name}{r.title && <> <span className="sm-t">- {r.title}</span></>}</div>
            <div className="em">{r.email}</div><div className="why">{r.why}</div><div className="sm-t">{fmtTime(r.at, lang)}</div>
            <div className="acts" style={{ justifyContent: 'flex-start' }}>
              <button className="btn pri sm" onClick={() => onAllow(r)}>{t('allow')}</button>
              <button className="btn dan sm" onClick={() => onReject(r)}>{t('reject')}</button>
            </div>
          </div>
        ))}
      </div></div>
    )}
    <div className="card">
      <div className="bar" style={{ marginBottom: 10 }}><h2 style={{ fontSize: 20 }}>{t('team')}</h2><div style={{ flex: 1 }} />
        <div className="filters">
          <input type="text" id="fq" placeholder={t('search')} value={q} onChange={e => setQ(e.target.value)} />
          <select id="fst" value={st} onChange={e => setSt(e.target.value as 'all' | Status)}>
            {(['all', 'active', 'pending', 'blocked'] as const).map(s => <option key={s} value={s}>{s === 'all' ? t('all') : t('st_' + s)}</option>)}
          </select>
        </div>
      </div>
      <div className="tw"><table className="tbl">
        <thead><tr><th>{t('colP')}</th><th>{t('colL')}</th><th className="dst">{t('colS')}</th><th className="hm">{t('colA')}</th><th className="hm">{t('colM')}</th><th /></tr></thead>
        <tbody>{list.map(p => (
          <tr className="row" key={p.email} data-pid={p.email} onClick={e => { if (!(e.target as HTMLElement).closest('button')) onOpen(p); }}>
            <td><b>{p.name}</b><div className="sm-t">{p.method === 'pin' ? t('m_pin') : p.email}{p.title ? ' - ' + p.title : ''}</div></td>
            <td><span className="pill p-lv">{t(p.level + 'Lv')}</span><span className={'pill p-' + p.status + ' mst'}>{t('st_' + p.status)}</span></td>
            <td className="dst"><span className={'pill p-' + p.status}>{t('st_' + p.status)}</span></td>
            <td className="hm"><div className="chips">{appChips(p)}</div></td>
            <td className="hm nw">{t('m_' + (p.method || 'google'))}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{p.status === 'pending' && <button className="btn pri sm" onClick={() => onConfirm(p)}>{t('confirm')}</button>}</td>
          </tr>
        ))}</tbody>
      </table></div>
      {!list.length && <div className="empty">-</div>}
    </div>
  </>;
}

export function Activity({ activity, nameOf, onBack }: { activity: ActivityItem[]; nameOf: (id: string) => string; onBack: () => void }) {
  const { t, lang } = useLang();
  const [who, setWho] = useState('all');
  const list = activity.filter(x => who === 'all' || x.by === who).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 300);
  const everyone = [...new Set(activity.map(x => x.by))];
  return <>
    <button className="back" onClick={onBack}>&larr; {t('back')}</button>
    <div className="bar"><h1>{t('act')}</h1><div style={{ flex: 1 }} />
      <select id="fwho" style={{ maxWidth: 260 }} value={who} onChange={e => setWho(e.target.value)}>
        <option value="all">{t('everyone')}</option>{everyone.map(w => <option key={w} value={w}>{nameOf(w)}</option>)}
      </select>
    </div>
    <div className="card"><div className="log">
      {list.length ? list.map((x, i) => (
        <div className="it" key={i}><div className="tm">{fmtTime(x.at, lang)}</div>
          <div className="tx"><b>{nameOf(x.by)}</b> {t('v_' + x.verb)}{x.target && <> <b>{nameOf(x.target)}</b></>}{x.extra && <> <span className="sm-t">({x.extra})</span></>}</div></div>
      )) : <div className="empty">{t('noAct')}</div>}
    </div></div>
  </>;
}

function Overlay({ onClose, children, id }: { onClose: () => void; children: React.ReactNode; id?: string }) {
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onClose]);
  return <div className="ov" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="md" id={id}>{children}</div></div>;
}

export function RejectModal({ r, onClose, onGo }: { r: AccessRequest; onClose: () => void; onGo: (reason: string) => void }) {
  const { t } = useLang();
  const [why, setWhy] = useState('');
  return <Overlay onClose={onClose}>
    <h2>{t('reject')}: {r.name}</h2><div className="sm-t">{r.email}</div>
    <label className="f">{t('rejWhy')}<textarea id="rjw" rows={3} value={why} onChange={e => setWhy(e.target.value)} /></label>
    <div className="acts"><button className="btn" onClick={onClose}>{t('cancel')}</button><button className="btn dan" onClick={() => onGo(why.trim())}>{t('rejGo')}</button></div>
  </Overlay>;
}

export const blankDraft = (): PersonDraft => ({ email: '', name: '', title: '', level: 'staff', status: 'active', apps: { proc: 0, hire: 0, branch: 0 }, sides: [], method: 'google', pinNew: '' });
export const draftOf = (p: Person): PersonDraft => ({
  email: p.email, name: p.name, title: p.title || '', level: p.level, status: p.status, apps: { ...p.apps }, sides: [...(p.sides || [])], method: p.method || 'google', pinNew: '', hasPin: p.hasPin,
});

/** Add or change a person. Required fields show red when they block saving. */
export function PersonModal({ draft: start, isNew, title, canBlock, onClose, onSave, onBlock }: {
  draft: PersonDraft; isNew: boolean; title: string; canBlock: boolean;
  onClose: () => void; onSave: (d: PersonDraft) => Promise<{ msg: string; fields: string[] } | null>; onBlock: () => void;
}) {
  const { t } = useLang();
  const [d, setD] = useState<PersonDraft>(start);
  const [err, setErr] = useState<{ msg: string; fields: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (p: Partial<PersonDraft>) => setD(x => ({ ...x, ...p }));
  const cls = (k: string) => (err?.fields.includes(k) ? 'miss' : undefined);
  const dom = d.email && validEmail(d.email) && !ALLOWED_DOMAINS.includes(d.email.split('@')[1]);
  const ceoFull = d.level === 'ceo' && d.status === 'active';
  const apps = appList().filter(a => a.id !== 'boards');
  const save = async () => { setBusy(true); const e = await onSave(d); setBusy(false); setErr(e); };
  return <Overlay onClose={onClose} id="pm">
    <h2>{title}</h2>
    <div className="g2">
      <label className="f">{t('name')}<input type="text" data-k="name" className={cls('name')} value={d.name} onChange={e => set({ name: e.target.value })} /></label>
      <label className="f">{t('title')}<input type="text" data-k="title" value={d.title} onChange={e => set({ title: e.target.value })} /></label>
    </div>
    <div className="box"><div className="t">{t('method')}</div>
      <div className="seg">{(['google', 'pin'] as Method[]).map(m => <button key={m} className={d.method === m ? 'on' : ''} onClick={() => set({ method: m })}>{t('m_' + m)}</button>)}</div>
      {d.method === 'google'
        ? <><label className="f">{t('email')}<input type="email" data-k="email" className={cls('email')} readOnly={!isNew}
            value={d.email.startsWith('pin-') ? '' : d.email} onChange={e => set({ email: e.target.value })} /></label>{dom && <div className="sm-t">{t('domainNote')}</div>}</>
        : <><label className="f">{t('setPin')}<input type="password" inputMode="numeric" autoComplete="new-password" data-k="pinNew" className={cls('pinNew')}
            value={d.pinNew} onChange={e => set({ pinNew: e.target.value })} /></label>{d.hasPin && <div className="sm-t">{t('pinKeep')}</div>}</>}
    </div>
    <div className="g2">
      <div className="box"><div className="t">{t('lv')}</div>
        <div className="seg">{(['staff', 'manager', 'ceo'] as Level[]).map(l => <button key={l} className={d.level === l ? 'on' : ''} onClick={() => set({ level: l })}>{t(l + 'Lv')}</button>)}</div></div>
      <div className="box"><div className="t">{t('st')}</div>
        <div className="seg">{(['active', 'pending', 'blocked'] as Status[]).map(s => <button key={s} className={d.status === s ? 'on' : ''} onClick={() => set({ status: s })}>{t('st_' + s)}</button>)}</div></div>
    </div>
    <div className="box"><div className="t">{t('appsAcc')}</div>
      {ceoFull ? <div className="sm-t">{t('ceoAll')}</div> : apps.map(a => {
        const k = a.id as 'proc' | 'hire' | 'branch';
        return <Fragment key={k}>
          <label className="ck"><input type="checkbox" checked={!!d.apps[k]} onChange={e => {
            const on = e.target.checked;
            set({ apps: { ...d.apps, [k]: on ? 1 : 0 }, sides: k === 'proc' && on && !d.sides.length ? ['dept'] : d.sides });
          }} />{t('a_' + k)}</label>
          {k === 'proc' && !!d.apps.proc && (
            <div className="subs" id="sides"><span className="sm-t" style={{ width: '100%' }}>{t('procSides')}</span>
              {SIDES.map(s => <label className="ck" key={s}><input type="checkbox" checked={d.sides.includes(s)} onChange={e => {
                const next = new Set(d.sides); if (e.target.checked) next.add(s); else next.delete(s);
                set({ sides: SIDES.filter(x => next.has(x)) });
              }} />{t('s_' + s)}</label>)}
            </div>
          )}
        </Fragment>;
      })}
    </div>
    {err && <div className="err">{err.msg}</div>}
    <div className="acts">
      {canBlock && d.status !== 'blocked' && <button className="btn dan" onClick={onBlock}>{t('block')}</button>}
      <div className="sp" />
      <button className="btn" onClick={onClose}>{t('cancel')}</button>
      <button className="btn pri" onClick={() => { if (!busy) save(); }}>{t('save')}</button>
    </div>
  </Overlay>;
}
