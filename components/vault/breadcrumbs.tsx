'use client';

import { ChevronRight, Home } from 'lucide-react';
import type { TreeNode } from '@/lib/types';
import { t } from '@/lib/i18n';

interface BreadcrumbsProps {
  items: TreeNode[];
  onNavigate: (id: string) => void;
  onRoot: () => void;
}

export function Breadcrumbs({ items, onNavigate, onRoot }: BreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      <button
        type="button"
        onClick={onRoot}
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
      >
        <Home size={14} />
        <span>{t('vault.storage')}</span>
      </button>
      {items.map((item) => (
        <span key={item.id} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-[var(--color-muted)]" />
          <button
            type="button"
            onClick={() => onNavigate(item.id)}
            className="rounded-lg px-2 py-1 hover:bg-[var(--color-surface-2)]"
          >
            {item.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
