import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'pt-BR' | 'en-US' | 'es-ES';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Carregar preferência do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      if (saved) {
        try {
          const lang = saved as Language;
          if (['pt-BR', 'en-US', 'es-ES'].includes(lang)) {
            return lang;
          }
        } catch {
          // Se houver erro, usar padrão
        }
      }
    }
    return 'pt-BR';
  });

  useEffect(() => {
    // Aplicar idioma ao documento HTML
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.setAttribute('lang', language);
    }

    // Salvar preferência no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}








