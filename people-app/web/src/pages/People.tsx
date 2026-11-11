import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';

const TONES = ['t-saffron', 't-sage', 't-sea', 't-terracotta', 't-bronze'];
export const tone = (s: string | null) => TONES[[...(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];

export function People() {
  const { t, bi } = useI18n();
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [branch, setBranch] = useState('');
  const [err, setErr] = useState(false);
  useEffect(() => { api<any[]>('/employees').then(setRows).catch(() => setErr(true)); }, []);
  const branches = useMemo(() => {
    const m = new Map<string, any>();
    (rows || []).forEach(r => r.branch.id && m.set(r.branch.id, r.branch));
    return [...m.values()];
  }, [rows]);
  const shown = (rows || []).filter(r =>
    (!branch || r.branch.id === branch) &&
    (!q || [r.name.en, r.name.ar, r.employeeNo, r.job.en, r.job.ar].some((v: string | null) => v && v.toLowerCase().includes(q.toLowerCase()))));
  if (err) return <p className="error">{t.error}</p>;
  return (
    <div className="stack">
      <h1>{t.people} {rows && <span className="count">{shown.length}</span>}</h1>
      <div className="filters">
        <input type="search" placeholder={t.search} value={q} onChange={e => setQ(e.target.value)} aria-label={t.search} />
        {branches.length > 1 && (
          <select value={branch} onChange={e => setBranch(e.target.value)} aria-label={t.branch}>
            <option value="">{t.allBranches}</option>
            {branches.map(b => <option key={b.id} value={b.id}>{bi(b)}</option>)}
          </select>
        )}
      </div>
      {!rows ? <p className="muted">{t.loading}</p> : shown.length === 0 ? <p className="muted">{t.noResults}</p> : (
        <ul className="rows people">
          {shown.map(r => (
            <li key={r.employmentId}>
              <a href={'#/people/' + r.employmentId} className="row-link">
                <span className={'avatar ' + tone(r.name.en)} aria-hidden>{(r.name.en || '?').split(' ').map((s: string) => s[0]).slice(0, 2).join('')}</span>
                <span className="row-main">{bi(r.name)}<small>{bi(r.job)} · {bi(r.branch)}</small></span>
                <span className="muted mono">{r.employeeNo}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
