// Languages staff can choose from the box at the top of the app.
// English and Arabic are the base languages, written by hand (base-text.ts) and never changed by this file.
// Every other language is a machine-translated layer over the English text, loaded only when someone picks it.
// A missing phrase shows in English. To add a language: put locales/<code>.json next to the others (same keys as
// locales/_source-en.json) and add a line below. People and places (names, branches) stay in English for these languages.

export type LangInfo = {
  code: string;
  native: string; // the name in its own language
  english: string;
  rtl?: boolean;
  font?: string; // Google font family for the script; loaded only when chosen
  base?: boolean; // hand-written (English, Arabic)
};

export const LANGS: LangInfo[] = [
  { code: 'en', native: 'English', english: 'English', base: true },
  { code: 'ar', native: 'العربية', english: 'Arabic', rtl: true, base: true },
  { code: 'ur', native: 'اردو', english: 'Urdu', rtl: true, font: 'Noto Nastaliq Urdu' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', font: 'Noto Sans Devanagari' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali', font: 'Noto Sans Bengali' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam', font: 'Noto Sans Malayalam' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', font: 'Noto Sans Tamil' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', font: 'Noto Sans Telugu' },
  { code: 'ne', native: 'नेपाली', english: 'Nepali', font: 'Noto Sans Devanagari' },
  { code: 'fil', native: 'Filipino', english: 'Filipino (Tagalog)' },
  { code: 'si', native: 'සිංහල', english: 'Sinhala', font: 'Noto Sans Sinhala' },
  { code: 'fa', native: 'فارسی', english: 'Persian', rtl: true, font: 'Vazirmatn' },
  { code: 'ps', native: 'پښتو', english: 'Pashto', rtl: true, font: 'Noto Naskh Arabic' },
  { code: 'am', native: 'አማርኛ', english: 'Amharic', font: 'Noto Sans Ethiopic' },
];

export const langInfo = (code: string) => LANGS.find(l => l.code === code) ?? LANGS[0];

// Machine-translated phrase lists, one file per language, fetched only when picked.
const files = import.meta.glob<{ default: Record<string, string> }>('./locales/[a-z]*.json');
export const hasLayer = (code: string) => `./locales/${code}.json` in files;
export async function loadLayer(code: string): Promise<Record<string, string>> {
  const f = files[`./locales/${code}.json`];
  return f ? (await f()).default : {};
}

// Apply a flat { "a.b.c": "text" } list on top of a copy of the English text.
export function overlay<T>(base: T, flat: Record<string, string>, keep: string[]): T {
  const out = structuredClone(base) as Record<string, unknown>;
  for (const [path, text] of Object.entries(flat)) {
    if (!text || keep.includes(path)) continue;
    const parts = path.split('.');
    let node = out as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = node[parts[i]];
      if (next === null || typeof next !== 'object') { node = {}; break; }
      node = next as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (typeof node[last] === 'string') node[last] = text;
  }
  return out as T;
}

const loadedFonts = new Set<string>();
export function loadFont(family?: string) {
  if (!family || loadedFonts.has(family) || typeof document === 'undefined') return;
  loadedFonts.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;600&display=swap`;
  document.head.appendChild(link);
}
