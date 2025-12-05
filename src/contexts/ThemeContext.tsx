import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Carregar preferência do localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        try {
          const value = JSON.parse(saved);
          // Aplicar imediatamente ao carregar
          const root = document.documentElement;
          if (value) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          return value;
        } catch {
          // Se houver erro, garantir modo claro
          document.documentElement.classList.remove('dark');
          return false;
        }
      }
    }
    // Padrão: modo claro - garantir que não tenha classe dark
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
    return false;
  });

  // Aplicar tema sempre que darkMode mudar
  useEffect(() => {
    const root = document.documentElement;
    
    // Remover classe dark primeiro
    root.classList.remove('dark');
    
    // Adicionar apenas se darkMode for true
    if (darkMode) {
      root.classList.add('dark');
    }
    
    // Salvar preferência no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

