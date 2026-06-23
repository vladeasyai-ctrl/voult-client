'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/vault-store';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className={cn(
        'rounded-lg p-2 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
        className,
      )}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
