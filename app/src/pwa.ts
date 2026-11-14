// Installable app + notifications on this device. Listens from the first moment, because the browser's
// "can install" signal can arrive before the home page is shown.
import { useEffect, useState } from 'react';

interface InstallPrompt extends Event { prompt: () => void; userChoice: Promise<{ outcome: string }> }
export interface PwaState { prompt: InstallPrompt | null; installed: boolean; perm: NotificationPermission | 'none'; busy: boolean; laterAt: number }

const state: PwaState = {
  prompt: null, installed: false, busy: false,
  perm: typeof Notification !== 'undefined' ? Notification.permission : 'none',
  laterAt: (() => { try { return +(localStorage.getItem('fa-app-later') || 0); } catch { return 0; } })(),
};
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

export const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true; } catch { return false; } };
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const swOK = () => 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);

if (swOK()) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
addEventListener('beforeinstallprompt', e => { e.preventDefault(); state.prompt = e as InstallPrompt; emit(); });
addEventListener('appinstalled', () => { state.installed = true; state.prompt = null; emit(); });

export function usePwa(): PwaState {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force(n => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return state;
}

export async function install() {
  const e = state.prompt; if (!e) return; state.prompt = null;
  try { e.prompt(); const c = await e.userChoice; if (c?.outcome === 'accepted') state.installed = true; } catch { /* ignore */ }
  emit();
}
export function later() { state.laterAt = Date.now(); try { localStorage.setItem('fa-app-later', String(state.laterAt)); } catch { /* ignore */ } emit(); }

const b64u = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };

/** Sends this device's notification address to the Forka Apps server. Only once the server's public key is in config.js. */
export async function subscribe(publicKey: string | undefined, send: (sub: PushSubscriptionJSON, device: string) => void) {
  if (!publicKey || !swOK()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(publicKey) }));
    send(sub.toJSON(), isIOS() ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'desktop');
  } catch { /* ignore */ }
}

export async function askNotify(): Promise<NotificationPermission | 'none'> {
  if (typeof Notification === 'undefined') return 'none';
  state.busy = true; emit();
  try { state.perm = await Notification.requestPermission(); } catch { state.perm = Notification.permission; }
  state.busy = false; emit();
  return state.perm;
}

export async function testNotice(title: string, body: string, lang: string) {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, icon: '/logos/forka-app-192.png', badge: '/logos/forka-app-icon.png', lang, dir: lang === 'ar' ? 'rtl' : 'ltr', tag: 'forka-test', data: { url: './' } });
  } catch { /* ignore */ }
}
