import { create } from 'zustand';
import i18n from '../i18n';

type Language = 'pt-BR' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem('language') as Language | null;
  if (saved === 'pt-BR' || saved === 'en') return saved;
  const browserLang = navigator.language;
  if (browserLang.startsWith('pt')) return 'pt-BR';
  return 'en';
};

export const useLanguageStore = create<LanguageState>(() => ({
  language: getInitialLanguage(),

  setLanguage: (lang: Language) => {
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
    useLanguageStore.setState({ language: lang });
  },
}));
