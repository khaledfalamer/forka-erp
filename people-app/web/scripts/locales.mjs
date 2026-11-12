// Keeps the machine-translated languages in step with the English text.
//
//   node scripts/locales.mjs source           write src/locales/_source-en.json from base-text.ts (run after changing English)
//   node scripts/locales.mjs check            list, per language, how many phrases are missing or out of date
//   node scripts/locales.mjs fill <code>      machine-translate the missing phrases for one language
//
// "fill" uses Google Cloud Translation (v2). The key is read from the GOOGLE_TRANSLATE_KEY environment variable and
// must never be written into the repo. Only screen text is sent (labels, buttons, help lines): never staff data.
// English and Arabic are hand-written and are never touched by this script.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const web = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(web, 'src/locales');
const sourceFile = path.join(dir, '_source-en.json');
const KEEP = ['language', 'backArrow', 'toArrow', 'comma'];
const read = f => JSON.parse(readFileSync(f, 'utf8'));
const write = (f, o) => writeFileSync(f, JSON.stringify(o, null, 1) + '\n');

function source() {
  // base-text.ts is TypeScript; tsx (already a dev dependency of the workspace) runs it.
  const code = `import { en } from ${JSON.stringify(path.join(web, 'src/base-text.ts'))};
const flat = {}; const walk = (o, p) => { for (const [k, v] of Object.entries(o)) { const key = p ? p + '.' + k : k;
  if (typeof v === 'string') flat[key] = v; else walk(v, key); } };
walk(en, ''); process.stdout.write(JSON.stringify(flat));`;
  const out = execFileSync('npx', ['tsx', '--eval', code], { cwd: web, encoding: 'utf8' });
  write(sourceFile, JSON.parse(out));
  console.log('source:', Object.keys(JSON.parse(out)).length, 'phrases');
}

function check() {
  const src = read(sourceFile);
  for (const f of readdirSync(dir).filter(f => /^[a-z]+\.json$/.test(f))) {
    const t = read(path.join(dir, f));
    const missing = Object.keys(src).filter(k => !KEEP.includes(k) && !t[k]);
    const extra = Object.keys(t).filter(k => !(k in src));
    console.log(`${f.padEnd(9)} ${Object.keys(src).length - missing.length}/${Object.keys(src).length} translated` + (missing.length ? `, ${missing.length} missing (shown in English)` : '') + (extra.length ? `, ${extra.length} no longer used` : ''));
  }
}

async function fill(code) {
  const key = process.env.GOOGLE_TRANSLATE_KEY;
  if (!key) throw new Error('Set GOOGLE_TRANSLATE_KEY first (Google Cloud project owned by Forka).');
  if (code === 'en' || code === 'ar') throw new Error('English and Arabic are written by hand.');
  const src = read(sourceFile);
  const file = path.join(dir, `${code}.json`);
  const t = existsSync(file) ? read(file) : {};
  const todo = Object.keys(src).filter(k => !t[k]);
  for (let i = 0; i < todo.length; i += 100) {
    const batch = todo.slice(i, i + 100);
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: batch.map(k => src[k]), source: 'en', target: code, format: 'text' }),
    });
    if (!res.ok) throw new Error(`Google Translate: ${res.status} ${await res.text()}`);
    const { data } = await res.json();
    batch.forEach((k, n) => { t[k] = KEEP.includes(k) ? src[k] : data.translations[n].translatedText; });
  }
  const ordered = Object.fromEntries(Object.keys(src).filter(k => k in t).map(k => [k, t[k]]));
  write(file, ordered);
  console.log(`${code}: ${todo.length} phrases added. Add the language to src/languages.ts if it is new.`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'source') source();
else if (cmd === 'check') check();
else if (cmd === 'fill' && arg) await fill(arg);
else console.log('usage: node scripts/locales.mjs source | check | fill <code>');
