import { useEffect, useRef, useState } from 'react';
import { CFG, DEMO, LIVE } from '../config';
import { useLang } from '../i18n';
import { LangSwitch } from './LangSwitch';
import { GoogleIcon, Loader } from './marks';

export type GateStep = 'start' | 'busy' | 'pick' | 'pin' | 'request' | 'waiting' | 'pending' | 'blocked' | 'rejected';
export interface GateState { step: GateStep; email: string; err: string; pinErr: string; reason?: string; prefillName?: string }
export const freshGate = (err = ''): GateState => ({ step: 'start', email: '', err, pinErr: '' });

interface Props {
  gate: GateState;
  setGate: (g: GateState) => void;
  pickable: { email: string; name: string }[];
  onGoogleToken: (idToken: string) => void;
  onDemoEmail: (email: string) => void;
  onPin: (pin: string) => void;
  onRequest: (f: { name: string; title: string; why: string }) => Promise<string>;
}

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (o: Record<string, unknown>) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    } } };
  }
}

/** Google's own sign-in button (live only). */
function GoogleButton({ onToken }: { onToken: (t: string) => void }) {
  const { t, lang } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const draw = () => {
      const el = box.current; const g = window.google;
      if (!el || !g) return;
      try {
        g.accounts.id.initialize({ client_id: CFG.GOOGLE_CLIENT_ID, callback: (r: { credential: string }) => onToken(r.credential), ux_mode: 'popup', auto_select: false });
        el.innerHTML = '';
        g.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 300, locale: lang === 'ar' ? 'ar' : 'en' });
      } catch { setFailed(true); }
    };
    if (window.google?.accounts?.id) { draw(); return; }
    let sc = document.getElementById('gsi') as HTMLScriptElement | null;
    if (!sc) { sc = document.createElement('script'); sc.id = 'gsi'; sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true; document.head.appendChild(sc); }
    sc.addEventListener('load', draw);
    return () => sc?.removeEventListener('load', draw);
  }, [lang, onToken]);
  if (failed) return <div className="err">{t('noClient')}</div>;
  return <div id="gbtn" className="gbox" ref={box}><div className="note">{t('gWait')}</div></div>;
}

export function Gate({ gate, setGate, pickable, onGoogleToken, onDemoEmail, onPin, onRequest }: Props) {
  const { t, lang } = useLang();
  const [pick, setPick] = useState('');
  const [typed, setTyped] = useState('');
  const [pin, setPin] = useState('');
  const [rq, setRq] = useState({ name: gate.prefillName || '', title: '', why: '' });
  const [bad, setBad] = useState<string[]>([]);
  useEffect(() => { setRq(r => ({ ...r, name: r.name || gate.prefillName || '' })); }, [gate.prefillName]);
  const back = () => { setBad([]); setPin(''); setTyped(''); setGate(freshGate()); };

  if (gate.step === 'busy') return <Loader />;

  let body;
  if (gate.step === 'start') {
    body = <>
      <h2>{t('signin')}</h2><p>{t('signinTxt')}</p>
      {LIVE
        ? <><GoogleButton onToken={onGoogleToken} />{gate.err && <div className="err">{gate.err}</div>}</>
        : <button className="gbtn" data-a="g-open" onClick={() => setGate({ ...gate, step: 'pick', err: '' })}><GoogleIcon /><span>{t('google')}</span></button>}
      <div className="or">{t('or')}</div>
      <button className="lnk" data-a="g-pin" onClick={() => setGate({ ...gate, step: 'pin', pinErr: '' })}>{t('usePin')}</button>
    </>;
  } else if (gate.step === 'pick' && DEMO) {
    body = <>
      <h2>{t('choose')}</h2><div className="prev">{t('prevNote')}</div>
      <select id="gpick" value={pick} onChange={e => setPick(e.target.value)}>
        <option value="">{t('choose')}</option>
        {pickable.map(p => <option key={p.email} value={p.email}>{p.name} - {p.email}</option>)}
      </select>
      <label className="f">{t('other')}<input type="email" id="gmail" placeholder="name@forka.com" value={typed}
        onChange={e => setTyped(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onDemoEmail(typed); }} /></label>
      {gate.err && <div className="err">{gate.err}</div>}
      <button className="btn pri" data-a="g-go" onClick={() => onDemoEmail(typed.trim() || pick)}>{t('cont')}</button>
      <button className="lnk" onClick={back}>{t('back')}</button>
    </>;
  } else if (gate.step === 'pin') {
    body = <>
      <h2>{t('pinGo')}</h2>
      <label className="f">{t('pin')}<input type="password" inputMode="numeric" id="gpin" autoComplete="off" value={pin}
        onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onPin(pin); }} /></label>
      {gate.pinErr && <div className="err">{gate.pinErr}</div>}
      <button className="btn pri" onClick={() => onPin(pin)}>{t('signin')}</button>
      <button className="lnk" onClick={back}>{t('back')}</button>
    </>;
  } else if (gate.step === 'request') {
    const send = async () => {
      const miss = [!rq.name.trim() && 'name', !rq.why.trim() && 'why'].filter(Boolean) as string[];
      setBad(miss);
      if (miss.length) { setGate({ ...gate, err: t('need') }); return; }
      const err = await onRequest({ name: rq.name.trim(), title: rq.title.trim(), why: rq.why.trim() });
      if (err) setGate({ ...gate, err });
    };
    const cls = (k: string) => (bad.includes(k) ? 'miss' : undefined);
    body = <>
      <h2>{t('reqT')}</h2><p>{t('reqTxt')}</p><div className="note">{gate.email}</div>
      <form id="rq" style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={e => e.preventDefault()}>
        <label className="f">{t('name')}<input type="text" name="name" className={cls('name')} value={rq.name} onChange={e => setRq({ ...rq, name: e.target.value })} /></label>
        <label className="f">{t('title')}<input type="text" name="title" value={rq.title} onChange={e => setRq({ ...rq, title: e.target.value })} /></label>
        <label className="f">{t('why')}<textarea name="why" rows={3} className={cls('why')} value={rq.why} onChange={e => setRq({ ...rq, why: e.target.value })} /></label>
      </form>
      {gate.err && <div className="err">{gate.err}</div>}
      <button className="btn pri" onClick={send}>{t('send')}</button>
      <button className="lnk" onClick={back}>{t('back')}</button>
    </>;
  } else {
    const m = ({ waiting: ['waitT', 'waitTxt', 'ok'], pending: ['pendT', 'pendTxt', 'ok'], blocked: ['blockT', 'blockTxt', 'err'], rejected: ['rejT', 'blockTxt', 'err'] } as Record<string, string[]>)[gate.step] || ['signin', 'signinTxt', 'ok'];
    body = <>
      <h2>{t(m[0])}</h2>
      <div className={m[2]}>{t(m[1])}{gate.step === 'rejected' && gate.reason && <><br /><b>{gate.reason}</b></>}</div>
      <div className="note">{gate.email}</div>
      <button className="lnk" onClick={back}>{t('back')}</button>
    </>;
  }

  return (
    <GateFrame>
      <div className="gcard">{body}</div>
      <div className="gfoot">
        <a className="plink" href={'/help/?lang=' + lang} target="_blank" rel="noopener">{t('help')}</a>
        <span aria-hidden="true">·</span>
        <a className="plink" href="/privacy.html">{t('privacy')}</a>
      </div>
    </GateFrame>
  );
}

/** The sign-in background ("Courtyard ripples" video), language switch and logo. */
export function GateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="gate">
      <div className="gscene" aria-hidden="true">
        <video autoPlay muted loop playsInline poster="/logos/courtyard-poster.jpg">
          <source src="/logos/courtyard.webm" type="video/webm" />
          <source src="/logos/courtyard.mp4" type="video/mp4" />
        </video>
      </div>
      <LangSwitch />
      <div className="gside">
        <img className="glogo" src="/logos/forka-app-logo.svg" alt="Forka App" />
        {children}
      </div>
    </div>
  );
}
