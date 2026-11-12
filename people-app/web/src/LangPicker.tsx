// The language box at the top of every screen: click, search, choose.
import { useMemo, useState } from 'react';
import { useI18n } from './i18n';
import { Icon } from './icons';
import { LANGS, langInfo } from './languages';
import { Modal } from './ui';

export function LangPicker({ dark = false }: { dark?: boolean }) {
  const { t, ui, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const cur = langInfo(ui);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? LANGS.filter(l => [l.native, l.english, l.code].some(x => x.toLowerCase().includes(s))) : LANGS;
  }, [q]);
  const pick = (code: string) => { setLang(code); setOpen(false); setQ(''); };
  const row = (l: (typeof LANGS)[number]) => (
    <button key={l.code} className={'lang-row' + (l.code === ui ? ' on' : '')} onClick={() => pick(l.code)} aria-pressed={l.code === ui}>
      <span className="lang-native" lang={l.code} dir="auto">{l.native}</span>
      <span className="lang-en">{l.english}</span>
      {l.code === ui && <span className="lang-tick" aria-hidden="true">✓</span>}
    </button>
  );
  const base = list.filter(l => l.base), auto = list.filter(l => !l.base);
  return (
    <>
      <button className={'lang-btn' + (dark ? ' dark' : '')} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={t.chooseLanguage}>
        <Icon name="globe" size={18} /><span lang={cur.code}>{cur.native}</span><span className="lang-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <Modal title={t.chooseLanguage} onClose={() => setOpen(false)}>
          <input className="lang-search" type="search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t.searchLanguage} aria-label={t.searchLanguage} />
          {base.length > 0 && <><div className="lang-head">{t.baseLanguages}</div><div className="lang-list">{base.map(row)}</div></>}
          {auto.length > 0 && <><div className="lang-head">{t.autoLanguages}</div><div className="lang-list">{auto.map(row)}</div></>}
          {!list.length && <p className="muted">{t.noLanguage}</p>}
        </Modal>
      )}
    </>
  );
}

// Shown under the top bar while a machine-translated language is in use.
export function AutoNotice() {
  const { t, auto } = useI18n();
  return auto ? <div className="auto-notice" role="note">{t.autoNotice}</div> : null;
}
