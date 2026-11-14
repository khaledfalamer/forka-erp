/* Forka Hire: start. The logic (core) is the original page's, unchanged; React draws each area of the page. */
import './hire.css';
import * as core from './core';
import * as pages from './views/pages';
import * as team from './views/team';
import * as request from './views/request';
import * as cand from './views/cand';
import * as shell from './views/shell';
import * as paintMod from './paint';
import { SETTABLE, __set, boot, setLang, sideMini, sideOpen } from './core';

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol))
  addEventListener('load', () => navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {}));

// The page skeleton (menu, header, language buttons) is plain HTML in hiring/index.html; its buttons:
document.getElementById('sdMini')?.addEventListener('click', () => sideMini());
document.getElementById('scrim')?.addEventListener('click', () => sideOpen(false));
document.querySelector('.sd-burger')?.addEventListener('click', () => sideOpen(true));
document.querySelectorAll<HTMLButtonElement>('#langSw button[data-l]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.l)));

// The old page's names (V, S, go, openCand, render, ...) stay reachable from the browser console and the checks.
for (const mod of [core, pages, team, request, cand, shell, paintMod] as Record<string, unknown>[]) {
  for (const k of Object.keys(mod)) {
    if (k in window) continue;
    Object.defineProperty(window, k, { configurable: true, get: () => mod[k], set: mod === core && SETTABLE.includes(k) ? (v: unknown) => __set(k, v) : undefined });
  }
}

boot();
