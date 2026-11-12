import { useEffect, useState } from 'react';
import { LangPicker, AutoNotice } from '../LangPicker';
import { api, DEMO } from '../api';
import { useI18n } from '../i18n';
import { Logo } from '../icons';

type U = { email: string; display_name: string; roles: string };

export function Login({ onDone }: { onDone: () => void }) {
  const { t, lang, setLang } = useI18n();
  const [users, setUsers] = useState<U[]>([]);
  const [err, setErr] = useState('');
  useEffect(() => { api<U[]>('/dev/users').then(setUsers).catch(() => setErr(t.error)); }, []);
  const pick = async (email: string) => {
    try { await api('/dev/login', { method: 'POST', body: { email } }); onDone(); } catch { setErr(t.error); }
  };
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-head">
          <Logo dark />
          <LangPicker dark />
        </div>
        <AutoNotice />
        <h1>{t.signIn}</h1>
        <p className="notice">{t.demoNotice}{DEMO ? ' ' + t.demoBrowser : ''}</p>
        <h2>{t.chooseAccount}</h2>
        {err && <p className="error">{err}</p>}
        <ul className="pick">
          {users.map(u => (
            <li key={u.email}>
              <button onClick={() => pick(u.email)}>
                <strong>{u.display_name}</strong>
                <span>{u.roles.split(',').map(r => t.roles[r] || r).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
