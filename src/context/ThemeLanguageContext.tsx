import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../lib/translations';

type Theme = 'light' | 'dark';

interface ThemeLanguageContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en, ...args: (string | number)[]) => string;
  formatBDT: (amount: number) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app_theme') as Theme;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: keyof typeof translations.en, ...args: (string | number)[]): string => {
    const dict = translations[language] || translations.en;
    let str = dict[key] || translations.en[key] || (key as string);
    if (args.length > 0) {
      args.forEach((arg) => {
        str = str.replace('%s', String(arg));
      });
    }
    return str;
  };

  const formatBDT = (amount: number): string => {
    const num = Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `৳${num}`;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setLanguage,
        t,
        formatBDT,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within ThemeLanguageProvider');
  }
  return context;
};
