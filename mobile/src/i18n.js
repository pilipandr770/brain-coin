import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';

import en from './locales/en.json';
import uk from './locales/uk.json';
import de from './locales/de.json';

// Detect device language
const deviceLang =
  Platform.OS === 'ios'
    ? NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
    : NativeModules.I18nManager?.localeIdentifier;

const lng = deviceLang?.startsWith('uk') ? 'uk'
          : deviceLang?.startsWith('de') ? 'de'
          : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, uk: { translation: uk }, de: { translation: de } },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
