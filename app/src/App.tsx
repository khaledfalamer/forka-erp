import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CFG, DEMO, LIVE, NOT_SET_UP } from './config';
import { call, wake } from './api';
import { appList, canOpen, type AppDef } from './apps';
import { LangContext, makeT, savedLang, type Lang } from './i18n';
import { ceoAll, isCeo, key, validEmail } from './people';
import { subscribe } from './pwa';
import type { AccessRequest, ActivityItem, Answer, Person, PersonDraft } from './types';
import { freshGate, Gate, GateFrame, type GateState } from './components/Gate';
import { Hero, Home, stats, TopBar } from './components/Home';
import { Activity, blankDraft, draftOf, People, PersonModal, RejectModal } from './components/People';

type View = 'home' | 'people' | 'activity';
type Modal = { kind: 'person'; id: string | null; fromReq: string | null; draft: PersonDraft } | { kind: 'reject'; req: AccessRequest } | null;
interface Data { me: string; people: Record<string, Person>; requests: AccessRequest[]; activity: ActivityItem[] }

const store = {
  token: () => { try { return localStorage.getItem('fa-token') || ''; } catch { return ''; } },
  setToken: (t: string) => { try { localStorage.setItem('fa-token', t); } catch { /* ignore */ } },
  cache: (): Answer | null => { try { const c = JSON.parse(localStorage.getItem('fa-cache') || 'null'); return c?.me?.email ? c : null; } catch { return null; } },
  keep: (b: Answer) => { try { const c = { ...b }; delete c.token; delete c.same; localStorage.setItem('fa-cache', JSON.stringify(c)); } catch { /* ignore */ } },
  clear: () => { try { localStorage.removeItem('fa-token'); localStorage.removeItem('fa-cache'); } catch { /* ignore */ } },
};

export default function App() {
  const [lang, setLangState] = useState<Lang>(savedLang);
  const t = useMemo(() => makeT(lang), [lang]);
  const setLang = useCallback((l: Lang) => { setLangState(l); try { localStorage.setItem('fa-lang', l); } catch { /* ignore */ } }, []);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; }, [lang]);

  const [data, setData] = useState<Data | null>(null);
  const [view, setView] = useState<View>('home');
  const [gate, setGate] = useState<GateState>(freshGate());
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const token = useRef(''), ver = useRef(''), idToken = useRef(''), woke = useRef(false);
  const apps = useMemo(appList, []);

  const errText = useCallback((e?: string) => ({
    net: t('netErr'), noclient: t('noClient'), need: t('need'), dupe: t('dupe'), pinBad: t('pinBad'), pinDupe: t('pinDupe'), lastCeo: t('lastCeo'),
    pin: t('badPin'), locked: t('badPin'), session: t('sessionEnd'), badMail: t('badMail'),
  } as Record<string, string>)[e || ''] || String(e || ''), [t]);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  /** Take a server answer: remember the session, keep a copy so the page opens at once next time. */
  const apply = useCallback((b: Answer, fromCache = false) => {
    if (!b.me) return;
    if (b.token) { token.current = b.token; store.setToken(b.token); }
    if (b.ver) ver.current = b.ver;
    if (!fromCache) store.keep(b);
    const m = b.me;
    // Wake the Hiring, Procurement and Board servers while the person looks at the tiles.
    if (!woke.current && m.status === 'active') {
      woke.current = true;
      if (m.apps?.hire) wake(CFG.HIRING_URL); if (m.apps?.proc) wake(CFG.PROCUREMENT_SERVER); wake(CFG.BOARDS_URL);
    }
    const people: Record<string, Person> = {};
    (b.people || [m]).forEach(p => { people[p.email] = p; });
    people[m.email] = m;
    setData({ me: m.email, people, requests: b.requests || [], activity: b.activity || [] });
  }, []);

  const sessionGone = useCallback((msg: string) => {
    token.current = ''; ver.current = ''; store.clear();
    setData(null); setView('home'); setModal(null); setGate(freshGate(msg));
  }, []);

  const api = useCallback((action: string, payload: Record<string, unknown> = {}) => call(action, payload, token.current), []);

  // ---- start: open at once from the last visit, then ask the server in the background ----
  const dataRef = useRef(data); dataRef.current = data;
  const refresh = useCallback(async () => {
    const r = await api('me', { ver: ver.current });
    if (r.ok) {
      if (r.same) { if (r.me && r.me.status !== 'active') sessionGone(''); return; }
      apply(r); setGate(freshGate()); return;
    }
    if (r.error === 'session') sessionGone(dataRef.current ? t('sessionEnd') : '');
    else setGate(g => (g.step === 'busy' ? freshGate(errText(r.error)) : g));
  }, [api, apply, sessionGone, errText, t]);

  useEffect(() => {
    if (NOT_SET_UP) return;
    const tok = store.token();
    if (tok) {
      token.current = tok;
      const c = store.cache();
      if (c) { apply(c, true); ver.current = c.ver || ''; } else setGate({ ...freshGate(), step: 'busy' });
      refresh();
    } else if (LIVE) wake(CFG.ACCOUNTS_URL, true); // wake the accounts server while the person reaches for the Google button
    const every = setInterval(() => { if (token.current && !document.hidden) refresh(); }, 60000);
    const onShow = () => { if (!document.hidden && token.current) refresh(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { clearInterval(every); document.removeEventListener('visibilitychange', onShow); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- sign in ----
  const signedIn = (r: Answer) => { apply(r); setView('home'); setGate(freshGate()); };
  const refused = (r: Answer) => {
    if (r.status) {
      setGate({ ...freshGate(), step: (r.status === 'unknown' ? 'request' : r.status) as GateState['step'], email: r.email || '', reason: r.reason, prefillName: r.name || '' });
      return;
    }
    setGate(freshGate(errText(r.error)));
  };
  const onGoogleToken = useCallback(async (cred: string) => {
    idToken.current = cred; setGate({ ...freshGate(), step: 'busy' });
    const r = await call('google', { idToken: cred });
    if (r.ok) signedIn(r); else refused(r);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onDemoEmail = async (email: string) => {
    const e = key(email);
    if (!validEmail(e)) { setGate({ ...gate, err: t('badMail') }); return; }
    idToken.current = e; setGate({ ...freshGate(), step: 'busy' });
    const r = await call('google', { demoEmail: e });
    if (r.ok) signedIn(r); else refused(r);
  };
  const onPin = async (pin: string) => {
    setGate({ ...gate, step: 'busy', pinErr: '' });
    const r = await call('pin', { pin: String(pin || '').trim() });
    if (r.ok) signedIn(r); else setGate({ ...freshGate(), step: 'pin', pinErr: errText(r.error) });
  };
  const onRequest = async (f: { name: string; title: string; why: string }) => {
    const r = await call('request', { ...f, ...(DEMO ? { demoEmail: idToken.current } : { idToken: idToken.current }) });
    if (r.ok) { setGate({ ...gate, step: 'waiting', err: '' }); return ''; }
    return errText(r.error);
  };
  const signOut = () => { api('signout'); sessionGone(''); };

  // ---- CEO actions ----
  const afterWrite = (r: Answer): boolean => {
    if (r.ok) { apply(r); return true; }
    if (r.error === 'session') { sessionGone(t('sessionEnd')); return false; }
    showToast(errText(r.error)); return false;
  };
  const savePerson = async (d: PersonDraft) => {
    if (modal?.kind !== 'person') return null;
    const fields = [!d.name.trim() && 'name', d.method === 'google' && !validEmail(key(d.email)) && 'email'].filter(Boolean) as string[];
    if (fields.length) return { msg: t('need'), fields };
    const r = await api('savePerson', { id: modal.id || '', fromReq: modal.fromReq || '', person: {
      email: key(d.email), name: d.name, title: d.title, level: d.level, status: d.status, apps: d.apps, sides: d.sides, method: d.method, pinNew: d.pinNew || '' } });
    if (r.ok) { apply(r); setModal(null); showToast(t('saved')); return null; }
    if (r.error === 'session') { sessionGone(t('sessionEnd')); return null; }
    return { msg: errText(r.error), fields: r.error === 'need' ? r.fields || [] : r.error === 'dupe' ? ['email'] : /^pin/.test(r.error || '') ? ['pinNew'] : [] };
  };
  const setStatus = async (id: string, status: string) => afterWrite(await api('setStatus', { id, status }));
  const reject = async (id: string, reason: string) => { if (afterWrite(await api('reject', { id, reason }))) setModal(null); };
  const openApp = (a: AppDef) => {
    const me = data && ceoAll(data.people[data.me]); if (!me || !canOpen(a, me)) return;
    const u = a.id === 'proc' ? a.url + '#erp=' + encodeURIComponent(token.current) : a.url;
    api('open', { app: a.id });
    if (!DEMO) setTimeout(() => location.assign(u), 150);
  };
  const onSubscribe = () => subscribe(CFG.PUSH_PUBLIC_KEY, (sub, device) => { api('pushSubscribe', { subscription: sub, lang, device }); });

  // ---- screens ----
  const ctx = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);
  let screen;
  if (NOT_SET_UP) {
    screen = <GateFrame><div className="gcard"><h2>{t('setupT')}</h2><p>{t('setupTxt')}</p></div></GateFrame>;
  } else if (!data || !data.people[data.me] || data.people[data.me].status !== 'active') {
    screen = <Gate gate={gate} setGate={setGate} pickable={DEMO ? demoPickable() : []}
      onGoogleToken={onGoogleToken} onDemoEmail={onDemoEmail} onPin={onPin} onRequest={onRequest} />;
  } else {
    const me = ceoAll(data.people[data.me]);
    const ceo = isCeo(me);
    const people = Object.values(data.people).map(ceoAll);
    const s = ceo ? stats(people, data.requests, data.activity) : null;
    const v: View = view !== 'home' && !ceo ? 'home' : view;
    const nameOf = (id: string) => data.people[id]?.name || data.requests.find(r => r.email === id)?.name || id;
    screen = <>
      <TopBar me={me} onHome={() => { setView('home'); setModal(null); }} onSignOut={signOut} />
      {v === 'home'
        ? <><Hero me={me} s={s} /><div className="page lift">
            <Home me={me} apps={apps} s={s} onOpen={openApp} onPeople={() => setView('people')} onActivity={() => setView('activity')} onSubscribe={onSubscribe} />
          </div></>
        : <div className="page">{v === 'people'
            ? <People people={people} requests={data.requests} onBack={() => setView('home')}
                onAdd={() => setModal({ kind: 'person', id: null, fromReq: null, draft: blankDraft() })}
                onOpen={p => setModal({ kind: 'person', id: p.email, fromReq: null, draft: draftOf(p) })}
                onAllow={r => setModal({ kind: 'person', id: null, fromReq: r.email, draft: { ...blankDraft(), email: r.email, name: r.name, title: r.title || '' } })}
                onReject={r => setModal({ kind: 'reject', req: r })}
                onConfirm={p => setStatus(p.email, 'active')} />
            : <Activity activity={data.activity} nameOf={nameOf} onBack={() => setView('home')} />}
          </div>}
      {modal?.kind === 'person' && (
        <PersonModal key={(modal.id || '') + (modal.fromReq || '')} draft={modal.draft} isNew={!modal.id}
          title={modal.fromReq ? t('allow') + ': ' + modal.draft.name : !modal.id ? t('newP') : t('edit')}
          canBlock={!!modal.id && modal.id !== data.me}
          onClose={() => setModal(null)} onSave={savePerson}
          onBlock={() => { const id = modal.id!; setModal(null); setStatus(id, 'blocked'); }} />
      )}
      {modal?.kind === 'reject' && <RejectModal r={modal.req} onClose={() => setModal(null)} onGo={why => reject(modal.req.email, why)} />}
    </>;
  }
  return (
    <LangContext.Provider value={ctx}>
      {screen}
      {toast && <div className="toast">{toast}</div>}
    </LangContext.Provider>
  );
}

/** Demo only: the made-up accounts you can pick on the sign-in page. */
function demoPickable() {
  return [
    { email: 'ceo@forka.com', name: 'Khaled Alamer' }, { email: 'buyer@example.com', name: 'Sample Buyer' },
    { email: 'hr@example.com', name: 'Sample HR' }, { email: 'ops.manager@example.com', name: 'Sample Manager' },
  ];
}
