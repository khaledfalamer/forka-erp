// @ts-nocheck
/* Small helpers for Hire's screens. */
import { createElement, Fragment } from 'react';
export { paint } from './paint';
export { Fragment };

const ATTR = { class: 'className', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'fill-opacity': 'fillOpacity', 'stroke-opacity': 'strokeOpacity', 'xmlns:xlink': 'xmlnsXlink' };
/** An icon kept as drawing text (IC.x, NAV_IC.x) as a real <svg> element, same attributes, no extra wrapper. */
export function svg(str, key) {
  if (!str) return null;
  const m = /^\s*<svg([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(str);
  if (!m) return <span key={key} dangerouslySetInnerHTML={{ __html: str }} />;
  const props = { key, dangerouslySetInnerHTML: { __html: m[2] } };
  for (const a of m[1].matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) props[ATTR[a[1]] || a[1]] = a[2];
  return createElement('svg', props);
}

/** CSS text like "display:flex;gap:4px" as a React style object (keeps --custom properties). */
export function css(s) {
  const o = {};
  String(s || '').split(';').forEach(d => {
    const i = d.indexOf(':'); if (i < 0) return;
    const k = d.slice(0, i).trim(), v = d.slice(i + 1).trim(); if (!k) return;
    o[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  });
  return o;
}

/** The browser's own "change" event (fires when you leave a text box), which React's onChange is not.
    Use as ref={nchange(e => ...)} on text, number, date and textarea fields that had onchange="...". */
export const nchange = fn => el => { if (el && !el.__nchange) { el.__nchange = true; el.addEventListener('change', fn); } };
