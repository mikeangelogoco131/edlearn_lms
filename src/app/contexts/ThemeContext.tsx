import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_CONTEXT_KEY = '__edlearn_theme_context__';

const ThemeContext: React.Context<ThemeContextType | undefined> =
  ((globalThis as any)[THEME_CONTEXT_KEY] as React.Context<ThemeContextType | undefined> | undefined) ??
  createContext<ThemeContextType | undefined>(undefined);

(globalThis as any)[THEME_CONTEXT_KEY] = ThemeContext;

const STORAGE_KEY = 'edlearn_theme';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

let themeTransitionTimeout: number | undefined;

function withThemeTransition(run: () => void) {
  try {
    document.documentElement.classList.add('theme-transition');
  } catch {
    // ignore
  }

  if (themeTransitionTimeout) {
    window.clearTimeout(themeTransitionTimeout);
    themeTransitionTimeout = undefined;
  }

  run();

  try {
    themeTransitionTimeout = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
      themeTransitionTimeout = undefined;
    }, 250);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      applyTheme('light');
    }
  }, []);

  const setTheme = (nextTheme: Theme) => {
  withThemeTransition(() => {
    setThemeState(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  });
  };

  const toggleTheme = () => {
  setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function applyInitialThemeFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark') applyTheme('dark');
  else applyTheme('light');
}
