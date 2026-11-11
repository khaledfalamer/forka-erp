import { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import type { Me } from '../App';

export function Home({ me }: { me: Me }) {
  const { t, bi, date } = useI18n();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api('/dashboard').then(setD).catch(() => setErr(true)); }, []);
  if (err) return <p className="error">{t.error}</p>;
  if (!d) return <p className="muted">{t.loading}</p>;
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="stack">
      <div className="hero">
        <div><h1>{t.hello}{t.comma} {me.user.name.split(' ')[0]}</h1><p className="muted">{t.heroLine}</p></div>
      </div>
      <div className="cards">
        {d.me && (
          <a className="card link accent-sea" href={'#/people/' + d.me.employmentId}>
            <div className="card-label">{t.myJob}</div>
            <div className="card-main">{bi(d.me.job)}</div>
            <div className="muted">{bi(d.me.branch)} · {bi(d.me.department)}</div>
          </a>
        )}
        {(me.can.isManager || me.can.isHr) && (
          <a className="card link accent-saffron" href="#/people">
            <div className="card-label">{t.teamCount}</div>
            <div className="card-number">{d.teamCount}</div>
          </a>
        )}
      </div>
      <section className="panel">
        <h2>{t.expiringSoon}</h2>
        {d.expiring.length === 0 ? <p className="muted">{t.noneExpiring}</p> : (
          <ul className="rows">
            {d.expiring.map((x: any, i: number) => (
              <li key={i}>
                <a href={'#/people/' + x.employmentId} className="row-link">
                  <span className="row-main">{bi(x.name)}<small>{bi(x.type)} · {bi(x.branch)}</small></span>
                  <span className={'pill ' + (x.expiry < today ? 'bad' : 'warn')}>{x.expiry < today ? t.expired + ' · ' : ''}{date(x.expiry)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
