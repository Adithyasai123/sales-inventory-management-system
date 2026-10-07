import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { lightTheme, darkTheme, ThemeDefinition, ThemeColors } from './theme.config';
import { getCookie, setCookie } from '../lib/cookies';

type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: ResolvedTheme) => void;
  themeDefinition: ThemeDefinition;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(
    cleanHex.length === 3
      ? cleanHex.split('').map((c) => c + c).join('')
      : cleanHex,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ResolvedTheme>(() => {
    try {
      const saved = getCookie('theme-mode') || (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('theme-mode') : null);
      if (saved === 'light' || saved === 'dark') {
        // Clean up legacy localStorage if present
        try { localStorage.removeItem('theme-mode'); } catch {}
        setCookie('theme-mode', saved, { days: 365 });
        return saved;
      }
      // First visit: follow OS preference once
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch {}
    return 'light';
  });

  const setTheme = (newTheme: ResolvedTheme) => {
    setThemeState(newTheme);
    try {
      setCookie('theme-mode', newTheme, { days: 365 });
      localStorage.removeItem('theme-mode');
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const activeTheme = theme === 'dark' ? darkTheme : lightTheme;

  // Apply CSS variables and document attribute dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    const colors = activeTheme.colors;
    Object.entries(colors).forEach(([token, hexValue]) => {
      root.style.setProperty(`--color-${token}`, hexValue);
      root.style.setProperty(`--color-${token}-rgb`, hexToRgb(hexValue));
    });

    // Backward compatibility aliases for existing components
    root.style.setProperty('--color-forest', colors.accent);
    root.style.setProperty('--color-forest-dark', colors.accent);
    root.style.setProperty('--color-forest-muted', colors.textMuted);
    root.style.setProperty('--color-forest-border', colors.border);
    root.style.setProperty('--color-forest-surface', colors.surfaceAlt);
    root.style.setProperty('--color-forest-bg', colors.bg);
    root.style.setProperty('--color-mint', colors.primary);
    root.style.setProperty('--color-mint-200', colors.primarySoft);
    root.style.setProperty('--color-mint-400', colors.chart2);
    root.style.setProperty('--color-slate', colors.accent);
    root.style.setProperty('--color-slate-muted', colors.textMuted);
    root.style.setProperty('--color-page-bg', colors.bg);

    // Update <meta name="theme-color">
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', activeTheme.metaThemeColor);
  }, [theme, activeTheme]);

  const value = {
    theme,
    toggleTheme,
    setTheme,
    themeDefinition: activeTheme,
    colors: activeTheme.colors,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook for Recharts and SVG charts to dynamically consume theme tokens
 */
export const useThemeColors = (): ThemeColors => {
  const { colors } = useTheme();
  return colors;
};
