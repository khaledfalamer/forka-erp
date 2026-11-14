import { useLang } from '../i18n';

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang">
      <button data-lang="en" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
      <button data-lang="ar" className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
    </div>
  );
}
