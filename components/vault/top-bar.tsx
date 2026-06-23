'use client';

import {
  Lock,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { clearToken } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useVaultStore } from '@/stores/vault-store';

interface TopBarProps {
  onRefresh: () => void;
  onOpenAiImport: () => void;
}

export function TopBar({ onRefresh, onOpenAiImport }: TopBarProps) {
  const router = useRouter();
  const rightPanelOpen = useVaultStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useVaultStore((s) => s.toggleRightPanel);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 backdrop-blur-md">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-lg transition hover:opacity-80"
        title={t('common.backToHome')}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
          <Lock size={16} />
        </div>
        <span className="font-[family-name:var(--font-display)] text-lg tracking-tight">
          Vault
        </span>
      </Link>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('vault:open-palette'))}
        className="ml-4 flex flex-1 max-w-xl items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)]"
      >
        <Search size={15} />
        <span>{t('vault.searchPlaceholder')}</span>
        <kbd className="ml-auto rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-xs">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onOpenAiImport}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-3 py-2 text-sm text-white hover:opacity-90"
      >
        <Sparkles size={15} />
        {t('vault.aiImport')}
      </button>

      <button
        type="button"
        onClick={onRefresh}
        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
        title={t('common.refresh')}
      >
        <RefreshCw size={16} />
      </button>

      <button
        type="button"
        onClick={toggleRightPanel}
        className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
        title={t('vault.detailsPanel')}
      >
        {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
      </button>

      <ThemeToggle />

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
        {t('common.signOut')}
      </button>
    </header>
  );
}
