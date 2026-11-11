import { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';

export function Org() {
  const { t, bi } = useI18n();
  const [org, setOrg] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  useEffect(() => {
    api('/org').then(setOrg);
    api<any[]>('/employees').then(setPeople).catch(() => setPeople([]));
  }, []);
  if (!org) return <p className="muted">{t.loading}</p>;
  const count = (branchId: string) => people.filter(p => p.branch.id === branchId).length;
  return (
    <div className="stack">
      <h1>{t.org}</h1>
      {org.entities.map((e: any) => (
        <section className="panel" key={e.id}>
          <h2>{bi({ en: e.legal_name_en, ar: e.legal_name_ar })} <small className="muted">{e.country_code} · {e.currency}</small></h2>
          <ul className="rows">
            {org.branches.filter((b: any) => b.entity_id === e.id).map((b: any) => (
              <li key={b.id} className="row-static">
                <span className="row-main">{bi({ en: b.name_en, ar: b.name_ar })}<small>{bi({ en: b.brand_en, ar: b.brand_ar })}</small></span>
                <span className="muted">{count(b.id)} {t.people_n}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="panel">
        <h2>{t.levels}</h2>
        <ol className="levels">{org.levels.map((l: any) => <li key={l.code}>{bi(l)}</li>)}</ol>
      </section>
    </div>
  );
}
