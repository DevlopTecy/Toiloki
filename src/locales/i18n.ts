import enStrings from './en.json';

export type TranslationKey = typeof enStrings;

let currentStrings: TranslationKey = enStrings;

export function t(): TranslationKey {
  return currentStrings;
}

export function setLanguage(lang: 'en'): void {
  if (lang === 'en') {
    currentStrings = enStrings;
  }
}

export default enStrings;
