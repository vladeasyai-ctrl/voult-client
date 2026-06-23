'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/vault-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  return children;
}
