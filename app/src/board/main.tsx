/* Forka Board: start. The logic (core) is the original page's, unchanged; React draws the screens. */
import '../shared/keepTyping'; // keep what people type when a screen is redrawn (same code in every Forka app)
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import './board.css';
import * as core from './core';
import { LIVE, bootLive, render, setRenderer } from './core';
import { AppView, GateView } from './Shell';

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol))
  addEventListener('load', () => navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}));
try { if (localStorage.getItem('fb-side') === 'mini') document.body.classList.add('bside-mini'); } catch { /* ignore */ }

const root = createRoot(document.getElementById('app')!);
let rev = 0;
// Every redraw replaces the whole page, exactly like the original (innerHTML): the logic reads typed values,
// focus and scroll from the page and puts them back itself.
setRenderer((mode: 'app' | 'gate') => {
  rev++;
  flushSync(() => root.render(mode === 'gate' ? <GateView key={'g' + rev} /> : <AppView key={'a' + rev} />));
});

// The old page's names (D, V, SV, render, pull, ...) stay reachable from the browser console and the checks.
const settable = new Set(['lang', 'D', 'PEOPLE', 'ASK']);
for (const k of Object.keys(core)) {
  if (k in window) continue;
  Object.defineProperty(window, k, {
    configurable: true,
    get: () => (core as Record<string, unknown>)[k],
    set: settable.has(k) ? (v: unknown) => core.__set(k, v) : undefined,
  });
}

if (LIVE) bootLive(); else render();
