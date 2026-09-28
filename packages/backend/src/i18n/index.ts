import i18next, { TOptions } from 'i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'

export const defaultLang = 'fr'
export const resources = {
  fr: {
    translation: fr,
  },
  en: {
    translation: en,
  },
}

i18next.init({
  lng: defaultLang,
  resources,
  interpolation: {
    escapeValue: false,
  },
})

// Keys are not type-checked: CustomTypeOptions is global, and the webapp
// declares its own resources while compiling this file for tRPC types
type I18n = Omit<typeof i18next, 't'> & {
  t(key: string, options?: TOptions): string
}

export default i18next as I18n
export const locales = resources
