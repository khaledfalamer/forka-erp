/* Forka Procurement: start. The logic (core) is the original page's, unchanged; React draws each area of the page.
   Procurement now lives inside the Forka App at /procurement/. */
import '../shared/keepTyping'; // keep what people type when a screen is redrawn (same code in every Forka app)
import './settings';
import './proc.css';
import * as core from './core';
import * as paintMod from '../shared/paint';
import * as inv from './views/inv';
import * as sup from './views/sup';
import * as recv from './views/recv';
import * as req from './views/req';
import * as pay from './views/pay';
import * as shell from './views/shell';
import { SETTABLE, __set, boot, pSide } from './core';

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol))
  addEventListener('load', () => navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}));
document.getElementById('pscrim')?.addEventListener('click', () => pSide(false));

// The old page's names (tab, lang, render, rec, ...) stay reachable from the browser console and the checks.
for (const mod of [core, paintMod, inv, sup, recv, req, pay, shell] as Record<string, unknown>[]) {
  for (const k of Object.keys(mod)) {
    if (k in window) continue;
    Object.defineProperty(window, k, { configurable: true, get: () => mod[k], set: mod === core && SETTABLE.includes(k) ? (v: unknown) => __set(k, v) : undefined });
  }
}

boot();
