import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ja from './locales/ja.json'
import en from './locales/en.json'
import { resolveDatavizLocale } from '../utils/datavizLocale'

const appLocale = resolveDatavizLocale()
if (typeof document !== 'undefined' && document.documentElement) {
  document.documentElement.lang = appLocale
}

i18n
  .use(initReactI18next)
  .init({
    lng: appLocale,
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    fallbackLng: 'en',
    supportedLngs: ['ja', 'en'],
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
