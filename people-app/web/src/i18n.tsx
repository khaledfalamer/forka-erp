import { store } from './api';
import { en, ar } from './base-text';
import { LANGS, langInfo, loadLayer, overlay, loadFont } from './languages';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'ar';
export type Bi = { en: string | null; ar: string | null } | null | undefined;

const dict = { en, ar };
type Text = typeof en;
type Ctx = {
  lang: Lang; // base language for data, names and dates: 'ar' only when Arabic is chosen, otherwise 'en'
  ui: string; // the language the person chose in the language box
  auto: boolean; // true when the screen text is machine-translated
  t: Text; setLang: (l: string) => void;
  bi: (v: Bi) => string; date: (d: string | null | undefined) => string; money: (v: string | number, cur?: string | null) => string;
};
const I18n = createContext<Ctx>(null as unknown as Ctx);
// Symbols that follow the reading direction, not the language.
const KEEP = ['language', 'backArrow', 'toArrow', 'comma'];

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ui, setUi] = useState<string>(() => { const v = store.get('fp_lang') || 'en'; return LANGS.some(l => l.code === v) ? v : 'en'; });
  const [layer, setLayer] = useState<{ code: string; t: Text } | null>(null);
  const info = langInfo(ui);
  const lang: Lang = ui === 'ar' ? 'ar' : 'en';
  useEffect(() => {
    const root = document.documentElement;
    root.lang = ui;
    root.dir = info.rtl ? 'rtl' : 'ltr';
    store.set('fp_lang', ui);
    if (info.base) { root.style.removeProperty('--font'); root.style.removeProperty('--head'); return; }
    loadFont(info.font);
    const f = info.font ? `'${info.font}', 'Inter Tight', system-ui, sans-serif` : '';
    if (f) { root.style.setProperty('--font', f); root.style.setProperty('--head', f); }
    else { root.style.removeProperty('--font'); root.style.removeProperty('--head'); }
    let live = true;
    loadLayer(ui).then(flat => {
      if (!live) return;
      const t = overlay(en, flat, KEEP);
      if (info.rtl) { t.backArrow = ar.backArrow; t.toArrow = ar.toArrow; t.comma = ar.comma; }
      setLayer({ code: ui, t });
    });
    return () => { live = false; };
  }, [ui]);
  const t: Text = info.base ? dict[lang] : layer?.code === ui ? layer.t : en;
  const locale = lang === 'ar' ? 'ar-AE-u-nu-latn' : info.base ? 'en-GB' : `${ui}-u-nu-latn`;
  const fmt = (fn: () => string, fallback: () => string) => { try { return fn(); } catch { return fallback(); } };
  const value: Ctx = {
    lang, ui, auto: !info.base, t, setLang: setUi,
    bi: v => (v ? (lang === 'ar' ? v.ar || v.en : v.en || v.ar) || '' : ''),
    date: d => {
      if (!d) return '—';
      const x = new Date(d + (d.length === 10 ? 'T00:00:00' : ''));
      const o = { day: 'numeric', month: 'short', year: 'numeric' } as const;
      return fmt(() => x.toLocaleDateString(locale, o), () => x.toLocaleDateString('en-GB', o));
    },
    money: (v, cur) => `${Number(v).toLocaleString(lang === 'ar' ? locale : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${cur ? ' ' + cur : ''}`,
  };
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}
export const useI18n = () => useContext(I18n);
