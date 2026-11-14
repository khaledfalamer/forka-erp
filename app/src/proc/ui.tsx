/* Small helpers for Procurement's screens (the same ones Hire uses), plus the date helpers. */
import { dd } from './core';
export { paint, svg, css, nchange, offAtStart, Fragment } from '../hire/ui';

const unesc = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
/** A date as on the original page: <bdi class="dt">14 Nov 2026</bdi> (core's dd() gives it as page text). */
export function ddJ(v: unknown, time?: unknown) {
  const h: string = dd(v, time);
  if (!h) return '';
  const m = /^<bdi class="dt">([\s\S]*)<\/bdi>$/.exec(h);
  return m ? <bdi className="dt">{unesc(m[1])}</bdi> : unesc(h);
}
/** The same date as plain text (inside a dropdown choice the browser keeps only the text). */
export const ddT = (v: unknown, time?: unknown) => unesc(String(dd(v, time)).replace(/<[^>]*>/g, ''));
