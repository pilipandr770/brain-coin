import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'uk', flag: '🇺🇦', label: 'Українська' },
];

export default function SplashScreen() {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('bc_lang', code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        {/* Language picker */}
        <div className="flex justify-center gap-2 mb-8">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => switchLang(l.code)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                i18n.language === l.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        <div className="text-8xl mb-4 animate-float">🧠</div>
        <h1 className="text-5xl font-black text-blue-400 tracking-tight mb-1">{t('app.name')}</h1>
        <p className="text-slate-400 mb-12 text-lg">{t('app.tagline')}</p>

        <div className="space-y-4">
          <button
            onClick={() => nav('/login')}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/50 text-lg"
          >
            {t('auth.login')}
          </button>
          <button
            onClick={() => nav('/register')}
            className="w-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all text-lg"
          >
            {t('auth.register')}
          </button>
        </div>

        <p className="text-slate-600 mt-10 text-xs">BrainCoin v2.0 · 2026</p>
      </div>
    </div>
  );
}
