// Team feed, new joiner portal, and the request form builder.
import { useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Page, Loading, Pill, Modal, Field, useApi, errText, Person, Bar, Illustration } from '../ui';
import { tone } from './People';
import type { Me } from '../App';

export const actionKey = (a: any) => (a.kind === 'email' ? 'email_' + a.to : a.kind);

// ---------- Team feed ----------
export function Feed() {
  const { t, bi, date } = useI18n(); const FD = t.m.feed;
  const d = useApi<any>('/feed');
  const [text, setText] = useState(''); const [welcome, setWelcome] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});
  if (!d.data) return <Page title={FD.title}><Loading error={d.error} /></Page>;
  const post = async () => { if (!text.trim()) return; await api('/feed', { method: 'POST', body: { text, kind: welcome ? 'welcome' : 'post' } }); setText(''); setWelcome(false); d.reload(); };
  const like = async (id: string) => { await api(`/feed/${id}/like`, { method: 'POST' }); d.reload(); };
  const comment = async (id: string) => { if (!reply[id]?.trim()) return; await api(`/feed/${id}/comment`, { method: 'POST', body: { text: reply[id] } }); setReply({ ...reply, [id]: '' }); d.reload(); };
  return (
    <Page title={FD.title} sub={FD.onlyManagers}>
      {d.data.canPost && (
        <section className="composer">
          <textarea rows={3} placeholder={FD.placeholder} value={text} onChange={e => setText(e.target.value)} aria-label={FD.placeholder} />
          <div className="row-between"><label className="check"><input type="checkbox" checked={welcome} onChange={e => setWelcome(e.target.checked)} /> {FD.welcomePost}</label>
            <button className="btn" onClick={post} disabled={!text.trim()}>{FD.post}</button></div>
        </section>
      )}
      <div className="stack-sm">{d.data.posts.map((p: any) => (
        <article key={p.id} className={'post kind-' + p.kind}>
          <header><span className={'avatar ' + tone(p.author)} aria-hidden>{p.author.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}</span>
            <div><strong>{p.author}</strong><small className="muted"> · {p.role} · {date(p.at.slice(0, 10))}</small></div>
            <Pill tone={p.kind === 'welcome' ? 'good' : p.kind === 'announcement' ? 'info' : ''}>{FD.kinds[p.kind]}</Pill></header>
          <p className="post-text">{bi(p.text)}</p>
          <div className="post-actions"><button className={'link-btn' + (p.liked ? ' liked' : '')} onClick={() => like(p.id)} aria-pressed={p.liked}>♥ {p.liked ? FD.liked : FD.like} · {p.likes}</button>
            <span className="muted small">{FD.comments}: {p.comments.length}</span></div>
          {p.comments.map((c: any, i: number) => <div key={i} className="post-comment"><strong>{c.by}</strong> {c.text}</div>)}
          <div className="post-reply"><input placeholder={FD.comment} value={reply[p.id] || ''} onChange={e => setReply({ ...reply, [p.id]: e.target.value })} onKeyDown={e => e.key === 'Enter' && comment(p.id)} aria-label={FD.comment} />
            <button className="btn sm ghost" onClick={() => comment(p.id)}>{FD.send}</button></div>
        </article>
      ))}</div>
    </Page>
  );
}

// ---------- New joiner portal ----------
const ORDER = ['welcome', 'forms', 'documents', 'team', 'company', 'training'];
export function Welcome({ emp }: { emp?: string }) {
  const { t, bi } = useI18n(); const W = t.m.welcome;
  const d = useApi<any>('/welcome' + (emp ? '?emp=' + emp : ''), [emp]);
  const [open, setOpen] = useState<string>('welcome');
  if (!d.data) return <Page title={W.title}><Loading error={d.error} /></Page>;
  const p = d.data;
  const mark = async (step: string) => { const r = await api('/welcome', { method: 'POST', body: { step, employmentId: emp } }); d.setData(r); const next = ORDER.find(k => !r.steps.find((s: any) => s.key === k).done); if (next) setOpen(next); };
  const st = (k: string) => p.steps.find((s: any) => s.key === k);
  const Done = ({ k }: { k: string }) => p.isSelf && !st(k).done ? <div className="actions"><button className="btn" onClick={() => mark(k)}>{W.markDone}</button></div> : null;
  return (
    <Page title={p.isSelf ? W.title : `${W.previewOf} ${bi(p.employee.name)}`}>
      <section className="welcome-hero">
        <Illustration className="welcome-illus" priority />
        <div className="welcome-text"><h2>{W.hello}{t.comma} {bi(p.employee.name).split(' ')[0]}</h2><p>{W.intro}</p><p className="welcome-tag">{t.introTitle}</p></div>
        <div className="progress-num"><strong>{p.progress}%</strong> <small className="muted">{W.progress}</small><Bar value={p.progress} max={100} tone="sage" /></div>
      </section>
      {p.progress === 100 && <p className="ok">{W.allDone}</p>}
      <div className="welcome-grid">
        <ol className="welcome-steps">{ORDER.map((k, i) => (
          <li key={k}><button className={(open === k ? 'on ' : '') + (st(k).done ? 'done' : '')} onClick={() => setOpen(k)}>
            <span className="dot">{st(k).done ? '✓' : i + 1}</span>{W.steps[k]}</button></li>
        ))}</ol>
        <section className="panel">
          <h2>{W.steps[open]}</h2>
          {open === 'welcome' && <><blockquote className="note"><p>{W.message}</p><small className="muted">{W.fromCeo}</small></blockquote>
            {p.manager && <p><span className="muted">{W.yourManager}: </span><Person p={p.manager} /></p>}<Done k="welcome" /></>}
          {open === 'forms' && <><ul className="rows">{(['personal', 'bank', 'emergency'] as const).map(k => (
            <li key={k} className="row-static"><span className="row-main">{W[k]}</span><Pill tone={p.forms[k] ? 'good' : 'warn'}>{p.forms[k] ? t.m.common.done : W.missing}</Pill></li>))}</ul>
            {p.isSelf && !st('forms').done && <div className="actions"><button className="btn" onClick={() => mark('forms')}>{W.fillIn}</button></div>}</>}
          {open === 'documents' && <>
            <ul className="rows">{p.documents.map((x: any) => <li key={x.code} className="row-static"><span className="row-main">{bi(x.name)}</span>
              {x.status === 'missing' ? <a className="link-btn" href="#/documents">{W.uploadIt}</a> : <Pill tone={x.status === 'valid' ? 'good' : 'warn'}>{t.statuses[x.status] || x.status}</Pill>}</li>)}</ul>
            <ul className="rows">{p.policies.map((x: any) => <li key={x.id} className="row-static"><span className="row-main">{bi(x.title)}</span><Pill tone={x.acked ? 'good' : 'warn'}>{x.acked ? t.m.pol.acked : W.missing}</Pill></li>)}</ul>
            {p.isSelf && p.policies.some((x: any) => !x.acked) && <div className="actions"><button className="btn" onClick={() => mark('policies')}>{W.readAll}</button></div>}</>}
          {open === 'team' && <>{p.manager && <><h3>{W.yourManager}</h3><Person p={p.manager} /></>}
            <h3 className="mt">{W.yourTeam}</h3><div className="team-grid">{p.team.map((x: any) => <div key={x.employmentId} className="team-card"><span className={'avatar ' + tone(x.name.en)} aria-hidden>{x.name.en.split(' ').map((s: string) => s[0]).slice(0, 2).join('')}</span><Person p={x} sub={bi(x.job)} /></div>)}</div><Done k="team" /></>}
          {open === 'company' && <><h3>{W.brands}</h3><div className="chips">{p.brands.map((b: any, i: number) => <span key={i} className="chip">{bi(b)}</span>)}</div>
            <h3 className="mt">{W.branches}</h3><div className="chips">{p.branches.map((b: any, i: number) => <span key={i} className="chip">{bi(b)}</span>)}</div><Done k="company" /></>}
          {open === 'training' && <><ul className="rows">{p.training.map((x: any) => <li key={x.code} className="row-static"><span className="row-main">{bi(x.name)}</span><Pill tone={x.status === 'completed' ? 'good' : x.status === 'expired' ? 'bad' : 'warn'}>{t.m.st[x.status]}</Pill></li>)}</ul><Done k="training" /></>}
        </section>
      </div>
    </Page>
  );
}

// ---------- Request form builder (Settings) ----------
const RULES = ['line_manager', 'hr', 'hr_manager', 'finance', 'ceo'];
const ACTS = [{ kind: 'email', to: 'hr' }, { kind: 'email', to: 'finance' }, { kind: 'email', to: 'store' }, { kind: 'email', to: 'driver' }, { kind: 'email', to: 'kitchen' }, { kind: 'notify_employee' }, { kind: 'add_to_payroll' }];

export function FormsAdmin() {
  const { t, bi } = useI18n(); const FM = t.m.forms;
  const d = useApi<any[]>('/forms?all=1');
  const [edit, setEdit] = useState<any>(null); const [flash, setFlash] = useState('');
  if (!d.data) return <Loading error={d.error} />;
  const toggle = async (id: string) => { await api(`/forms/${id}/toggle`, { method: 'POST' }); d.reload(); };
  return (
    <div className="stack-sm">
      <div className="row-between"><p className="muted">{FM.intro}</p><button className="btn" onClick={() => { setFlash(''); setEdit({ name: { en: '', ar: '' }, description: { en: '', ar: '' }, fields: [{ label: { en: '', ar: '' }, type: 'text', required: true }], steps: ['line_manager'], actions: [{ kind: 'notify_employee' }] }); }}>{FM.newForm}</button></div>
      {flash && <p className="ok">{flash}</p>}
      <div className="form-cards">{d.data.map(f => (
        <article key={f.id} className={'form-card' + (f.active ? '' : ' off')}>
          <header><strong>{bi(f.name)}</strong><Pill tone={f.active ? 'good' : ''}>{f.active ? FM.on : FM.off}</Pill></header>
          <p className="muted small">{bi(f.description)}</p>
          <p className="small">{f.fields.length} {FM.questions} · {f.steps.map((s: string) => t.m.req.rules[s]).join(' → ')}</p>
          <div className="chips">{f.actions.map((a: any, i: number) => <span key={i} className="chip">{FM.act[actionKey(a)]}</span>)}</div>
          <div className="actions"><button className="btn sm ghost" onClick={() => { setFlash(''); setEdit(JSON.parse(JSON.stringify(f))); }}>{FM.edit}</button><button className="btn sm ghost" onClick={() => toggle(f.id)}>{f.active ? FM.turnOff : FM.turnOn}</button></div>
        </article>
      ))}</div>
      {edit && <FormEditor initial={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); setFlash(FM.saved); d.reload(); }} />}
    </div>
  );
}

function FormEditor({ initial, onClose, onSaved }: { initial: any; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n(); const FM = t.m.forms;
  const [f, setF] = useState<any>(initial); const [tried, setTried] = useState(false); const [err, setErr] = useState('');
  const setField = (i: number, patch: any) => setF({ ...f, fields: f.fields.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)) });
  const hasAct = (a: any) => f.actions.some((x: any) => actionKey(x) === actionKey(a));
  const save = async () => {
    setTried(true); setErr('');
    if (!f.name.en || f.fields.some((x: any) => !x.label.en) || !f.steps.length) return;
    const body = { ...f, fields: f.fields.map((x: any) => ({ ...x, options: x.type === 'select' ? (typeof x.options === 'string' ? x.options.split(',').map((o: string) => o.trim()).filter(Boolean) : x.options) : undefined })) };
    try { await api('/forms', { method: 'POST', body }); onSaved(); } catch (e) { setErr(errText(t, e)); }
  };
  return (
    <Modal title={f.id ? FM.edit : FM.newForm} onClose={onClose}>
      <div className="form">
        <Field label={FM.name} missing={tried && !f.name.en}><input value={f.name.en} onChange={e => setF({ ...f, name: { ...f.name, en: e.target.value } })} /></Field>
        <Field label={FM.nameAr}><input dir="rtl" value={f.name.ar} onChange={e => setF({ ...f, name: { ...f.name, ar: e.target.value } })} /></Field>
        <Field label={FM.description}><input value={f.description?.en || ''} onChange={e => setF({ ...f, description: { en: e.target.value, ar: f.description?.ar || e.target.value } })} /></Field>
        <h3>{FM.fields}</h3>
        {f.fields.map((x: any, i: number) => (
          <div key={i} className="field-row">
            <Field label={FM.label} missing={tried && !x.label.en}><input value={x.label.en} onChange={e => setField(i, { label: { ...x.label, en: e.target.value } })} /></Field>
            <Field label={FM.labelAr}><input dir="rtl" value={x.label.ar} onChange={e => setField(i, { label: { ...x.label, ar: e.target.value } })} /></Field>
            <Field label={FM.type}><select value={x.type} onChange={e => setField(i, { type: e.target.value })}>{Object.entries(FM.types).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}</select></Field>
            {x.type === 'select' && <Field label={FM.options}><input value={Array.isArray(x.options) ? x.options.join(', ') : x.options || ''} onChange={e => setField(i, { options: e.target.value })} /></Field>}
            <div className="row-between"><label className="check"><input type="checkbox" checked={!!x.required} onChange={e => setField(i, { required: e.target.checked })} /> {FM.required}</label>
              {f.fields.length > 1 && <button className="link-btn" onClick={() => setF({ ...f, fields: f.fields.filter((_: any, j: number) => j !== i) })}>{FM.remove}</button>}</div>
          </div>
        ))}
        <button className="btn ghost sm" onClick={() => setF({ ...f, fields: [...f.fields, { label: { en: '', ar: '' }, type: 'text', required: false }] })}>+ {FM.addField}</button>
        <h3>{FM.approvers}</h3>
        <ol className="approver-list">{f.steps.map((s: string, i: number) => (
          <li key={i}><select value={s} onChange={e => setF({ ...f, steps: f.steps.map((y: string, j: number) => (j === i ? e.target.value : y)) })}>{RULES.map(r => <option key={r} value={r}>{t.m.req.rules[r]}</option>)}</select>
            {f.steps.length > 1 && <button className="link-btn" onClick={() => setF({ ...f, steps: f.steps.filter((_: string, j: number) => j !== i) })}>{FM.remove}</button>}</li>
        ))}</ol>
        {f.steps.length < 4 && <button className="btn ghost sm" onClick={() => setF({ ...f, steps: [...f.steps, 'hr'] })}>+ {FM.addStep}</button>}
        <h3>{FM.actions}</h3>
        <div className="checks">{ACTS.map(a => (
          <label key={actionKey(a)} className="check"><input type="checkbox" checked={hasAct(a)} onChange={e => setF({ ...f, actions: e.target.checked ? [...f.actions, a] : f.actions.filter((x: any) => actionKey(x) !== actionKey(a)) })} /> {FM.act[actionKey(a)]}</label>
        ))}</div>
        <p className="muted small">{FM.demoNote}</p>
        {err && <p className="error">{err}</p>}
        <div className="actions"><button className="btn" onClick={save}>{t.save}</button><button className="btn ghost" onClick={onClose}>{t.cancel}</button></div>
      </div>
    </Modal>
  );
}

// Fill in a custom form (used from New request).
export function CustomForm({ form, onBack, onSaved }: { form: any; me?: Me; onBack: () => void; onSaved: () => void }) {
  const { t, bi } = useI18n();
  const [a, setA] = useState<any>({}); const [tried, setTried] = useState(false); const [err, setErr] = useState('');
  const send = async () => {
    setTried(true); setErr('');
    if (form.fields.some((x: any) => x.required && (a[x.key] === undefined || a[x.key] === ''))) return;
    try { await api(`/forms/${form.id}/submit`, { method: 'POST', body: { answers: a } }); onSaved(); } catch (e) { setErr(errText(t, e)); }
  };
  return (
    <div className="form">
      <h3>{bi(form.name)}</h3><p className="muted small">{bi(form.description)}</p>
      {form.fields.map((x: any) => {
        const miss = tried && x.required && (a[x.key] === undefined || a[x.key] === '');
        const set = (v: any) => setA({ ...a, [x.key]: v });
        return (
          <Field key={x.key} label={bi(x.label)} missing={miss} hint={x.type === 'file' ? t.m.common.demoFile : undefined}>
            {x.type === 'select' ? <select value={a[x.key] || ''} onChange={e => set(e.target.value)}><option value="">—</option>{x.options.map((o: string) => <option key={o} value={o}>{o}</option>)}</select>
              : x.type === 'yesno' ? <select value={a[x.key] || ''} onChange={e => set(e.target.value)}><option value="">—</option><option value="yes">{t.m.common.yes}</option><option value="no">{t.m.common.no}</option></select>
              : x.type === 'file' ? <input type="file" accept="image/*,application/pdf" onChange={e => set(e.target.files?.[0]?.name || '')} />
              : <input type={x.type === 'number' ? 'number' : x.type === 'date' ? 'date' : 'text'} value={a[x.key] || ''} onChange={e => set(x.type === 'number' ? e.target.value : e.target.value)} />}
          </Field>
        );
      })}
      <p className="muted small">{t.m.leave.approvers}: {form.steps.map((s: string) => t.m.req.rules[s]).join(' → ')}</p>
      {err && <p className="error">{err}</p>}
      <div className="actions"><button className="btn" onClick={send}>{t.m.common.submit}</button><button className="btn ghost" onClick={onBack}>{t.back}</button></div>
    </div>
  );
}
