import { createContext, useContext } from 'react';
import { WORDS, type WordKey } from './words';

export type Lang = 'en' | 'ar';
export interface LangCtx { lang: Lang; t: (k: WordKey | string) => string; setLang: (l: Lang) => void }

export const makeT = (lang: Lang) => (k: string): string =>
  (WORDS[lang] as Record<string, string>)[k] ?? (WORDS.en as Record<string, string>)[k] ?? k;

export const LangContext = createContext<LangCtx>({ lang: 'en', t: makeT('en'), setLang: () => {} });
export const useLang = () => useContext(LangContext);

export function savedLang(): Lang {
  try { return localStorage.getItem('fa-lang') === 'ar' ? 'ar' : 'en'; } catch { return 'en'; }
}

export function fmtTime(iso: string | undefined, lang: Lang) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
