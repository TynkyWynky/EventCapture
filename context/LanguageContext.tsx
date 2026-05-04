import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Language, translations, TranslationKey } from '@/constants/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = 'eventcapture.language';
const DEFAULT_LANGUAGE: Language = 'EN';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const storedLang = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedLang === 'EN' || storedLang === 'NL' || storedLang === 'FR') {
          if (isMounted) setLanguageState(storedLang as Language);
        }
      } catch {
        // Ignore
      } finally {
        if (isMounted) setHasHydrated(true);
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['EN'][key] || key;
  };

  // Wait for hydration before rendering children to prevent UI language flickering
  if (!hasHydrated) {
    return null; 
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
