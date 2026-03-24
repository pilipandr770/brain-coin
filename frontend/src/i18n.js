import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from './locales/uk.json';
import en from './locales/en.json';
import de from './locales/de.json';

const saved = localStorage.getItem('bc_lang') || 'de';

i18n.use(initReactI18next).init({
  resources: {
    uk: { translation: uk },
    en: { translation: en },
    de: { translation: de },
  },
  lng:           saved,
  fallbackLng:   'de',
  interpolation: { escapeValue: false },
});

export default i18n;
