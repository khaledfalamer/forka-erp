// Shared building blocks for module pages.
import { useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from './api';
import { useI18n, type Bi } from './i18n';

export function useApi<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    api<T>(path).then(d => live && (setData(d), setError(null))).catch(e => live && setError(e instanceof ApiError ? e.code : 'error'));
    return () => { live = false; };
  }, [path, n, ...deps]);
  return { data, error, reload: () => setN(x => x + 1), setData };
}

export function Page({ title, sub, actions, children }: { title: string; sub?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="stack">
      <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted sub">{sub}</p>}</div>{actions && <div className="head-actions">{actions}</div>}</div>
      {children}
    </div>
  );
}

export function Loading({ error }: { error?: string | null }) {
  const { t } = useI18n();
  if (error) return <p className="error">{error === 'no_access' ? t.errors.no_access : error === 'not_found' ? t.notFound : t.error}</p>;
  return <p className="muted">{t.loading}</p>;
}

export function Tabs<K extends string>({ value, onChange, items }: { value: K; onChange: (k: K) => void; items: [K, string, (number | null)?][] }) {
  return (
    <div className="tabs" role="tablist">
      {items.map(([k, label, count]) => (
        <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'active' : ''} onClick={() => onChange(k)}>
          {label}{count ? <span className="badge">{count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Pill({ tone = '', children }: { tone?: '' | 'good' | 'warn' | 'bad' | 'info'; children: ReactNode }) {
  return <span className={'pill ' + tone}>{children}</span>;
}

export const statusTone = (s: string): '' | 'good' | 'warn' | 'bad' | 'info' =>
  ['approved', 'done', 'completed', 'resolved', 'published', 'released', 'closed', 'valid'].includes(s) ? 'good' :
  ['pending', 'waiting', 'manager', 'exceptions', 'draft', 'cut_off', 'pending_verification', 'assigned', 'open'].includes(s) ? 'warn' :
  ['rejected', 'expired', 'cancelled'].includes(s) ? 'bad' : '';

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty-box"><span className="empty-mark" aria-hidden>✓</span><p className="muted">{children}</p></div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useI18n();
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label={t.m.common.close}>✕</button></div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, missing, hint, children }: { label: string; missing?: boolean; hint?: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  return <label className={'field' + (missing ? ' invalid' : '')}>{label}{children}{hint && <small className="muted">{hint}</small>}{missing && <small className="req">{t.required}</small>}</label>;
}

export function Bar({ value, max, tone = 'sea' }: { value: number; max: number; tone?: string }) {
  return <span className="bar"><span className={'bar-fill ' + tone} style={{ inlineSize: (max ? Math.max(2, (value / max) * 100) : 0) + '%' }} /></span>;
}

export function Person({ p, sub }: { p: { employmentId: string; name: Bi; job?: Bi; branch?: Bi }; sub?: ReactNode }) {
  const { bi } = useI18n();
  return <a href={'#/people/' + p.employmentId} className="person"><strong>{bi(p.name)}</strong><small className="muted">{sub ?? [bi(p.job), bi(p.branch)].filter(Boolean).join(' · ')}</small></a>;
}

export const errText = (t: any, e: unknown) => (e instanceof ApiError ? t.m.err[e.code] || t.errors[e.code] || t.error : t.error);
export const daysBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 864e5);

// Keep times and number ranges left-to-right inside Arabic text (16:00–00:00 must not flip).
export const ltr = (s: string) => '\u2066' + s + '\u2069';
