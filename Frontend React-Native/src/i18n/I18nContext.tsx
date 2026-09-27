import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import en from './en.json';
import mr from './mr.json';
import hin from './hin.json';

export type Language = 'en' | 'mr' | 'hin';
type TranslationKey = (keyof typeof en) | string;
type TranslationValues = Record<string, string | number>;

const dictionaries: Record<Language, Record<string, string>> = { en, mr, hin };
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
} | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    void SecureStore.getItemAsync('app-language').then((stored) => {
      if (stored === 'en' || stored === 'mr' || stored === 'hin') setLanguageState(stored);
    });
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    void SecureStore.setItemAsync('app-language', nextLanguage);
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key: TranslationKey, values: TranslationValues = {}) =>
      (dictionaries[language][key] || dictionaries.en[key] || key).replace(/\{(\w+)\}/g, (_, name) =>
        String(values[name] ?? `{${name}}`)
      )
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used inside I18nProvider');
  return context;
}
