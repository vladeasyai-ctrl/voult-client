'use client';

import {
  Moon,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Search,
  Sun,
} from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { clearToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/vault-store';
import { useVaultStore } from '@/stores/vault-store';

interface TopBarProps {
  onRefresh: () => void;
}

export function TopBar({ onRefresh }: TopBarProps) {
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const setTheme = useThemeStore((s) => s.setTheme);
  const rightPanelOpen = useVaultStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useVaultStore((s) => s.toggleRightPanel);

  useEffect(() => {
    setTheme(theme);
  }, [setTheme, theme]);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 backdrop-blur-md">
      <div className="font-[family-name:var(--font-display)] text-lg tracking-tight">
        Vault
      </div>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('vault:open-palette'))}
        className="ml-4 flex flex-1 max-w-xl items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)]"
      >
        <Search size={15} />
        <span>Поиск и команды…</span>
        <kbd className="ml-auto rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-xs">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onRefresh}
        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
        title="Обновить"
      >
        <RefreshCw size={16} />
      </button>

      <button
        type="button"
        onClick={toggleRightPanel}
        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
        title="Панель деталей"
      >
        {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <button
        type="button"
        onClick={() => {
          clearToken();
          router.push('/login');
        }}
        className={cn(
          'rounded-lg px-3 py-1.5 text-sm text-[var(--color-muted)]',
          'hover:bg-[var(--color-surface-2)]',
        )}
      >
        Выйти
      </button>
    </header>
  );
}
