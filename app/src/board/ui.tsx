// @ts-nocheck
/* Small pieces used on many Board screens: icons, avatars, progress bar, status and approval chips, the Forka mark. */
import { Fragment } from 'react';
import { ICON, person, pname, t, lang, numFmt } from './core';

/** Line icon (no emojis). Same drawings as before. */
export const ic = (n, cls) => <svg viewBox="0 0 24 24" className={cls || undefined} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON[n] }} />;

let fkI = 0;
export function fkMark() {
  const m = 'fkm' + (++fkI);
  return (
    <svg viewBox="0 0 118 118" aria-hidden="true">
      <defs><mask id={m}><rect width="118" height="118" fill="#fff" /><circle cx="59" cy="59" r="22" fill="#000" /></mask></defs>
      <g mask={`url(#${m})`}>
        <rect x="7" y="7" width="48" height="48" rx="12" fill="#397F8F" />
        <rect x="63" y="7" width="48" height="48" rx="12" fill="#397F8F" fillOpacity="0.85" />
        <rect x="7" y="63" width="48" height="48" rx="12" fill="#397F8F" fillOpacity="0.68" />
        <rect x="63" y="63" width="48" height="48" rx="12" fill="#397F8F" fillOpacity="0.95" />
      </g>
      <circle cx="59" cy="59" r="15.8" fill="#397F8F" />
    </svg>
  );
}
export const fkLock = (name, cls) => (
  <div className={`fk-lock ${cls || ''}`}>{fkMark()}<div><span className="fk-k">FORKA</span><span className="fk-n">{name}</span></div></div>
);

/** A person's initials in their colour. */
export const av = (id, cls) => { const p = person(id); return <span className={`av ${cls || ''}`} style={{ background: p.color }} title={pname(id)}>{p.ini}</span>; };

export const pbar = p => <div className="pbar"><div className="bar"><i className={p === 100 ? 'full' : ''} style={{ width: p + '%' }} /></div><span>{p}%</span></div>;

/** Board status chip (on track / at risk / off track / no status); as a button it opens the status menu. */
export const stChip = (st, btn) => {
  const k = st && st.s ? st.s : 'none';
  return btn
    ? <button data-a="status" className={`st ${k}`}><i />{t('st_' + k)}</button>
    : <span className={`st ${k}`}><i />{t('st_' + k)}</span>;
};

const apS = c => (c.appr && c.appr.s) || 'pending';
export const apChip = c => { const s = apS(c); return <span className={`ap ${s}`}>{ic('stamp')}{t('ap_' + s)}</span>; };

/** The board's own fields on a card (a coloured choice, or a name and value). */
export function fieldChips(c, b) {
  return ((b && b.fields) || []).map(f => {
    const v = (c.f || {})[f.id];
    if (v == null || v === '') return null;
    if (f.type === 'select') {
      const o = (f.opts || []).find(o => o.id === v);
      return o ? <span key={f.id} className="fch"><i style={{ background: o.color }} />{o.name}</span> : null;
    }
    return <span key={f.id} className="fch">{f.name}: <b dir="auto">{f.type === 'number' ? numFmt(v) : v}</b></span>;
  });
}

export const chevTd = () => <td className="chev" aria-hidden="true">{ic(lang === 'ar' ? 'left' : 'right')}</td>;
export const chevTh = () => <th className="chev"><span className="sr">{t('openRow')}</span></th>;

/** Turn a CSS text like "display:flex;gap:4px" into a React style object (for styles copied from the old templates). */
export function css(s) {
  const o = {};
  String(s || '').split(';').forEach(d => {
    const i = d.indexOf(':'); if (i < 0) return;
    const k = d.slice(0, i).trim(), v = d.slice(i + 1).trim(); if (!k) return;
    o[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  });
  return o;
}
/** Text that already contains safe markup (for @mentions: withMentions escapes everything else). */
export const rich = (html, props = {}) => <span {...props} dangerouslySetInnerHTML={{ __html: html }} />;
export { Fragment };
