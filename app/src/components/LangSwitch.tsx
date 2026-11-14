import { useLang } from '../i18n';

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang">
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'ar' ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
    </div>
  );
}
