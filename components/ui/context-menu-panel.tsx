'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ContextMenuVariant = 'node' | 'card';

interface ContextMenuPanelProps {
  children: ReactNode;
  className?: string;
  variant?: ContextMenuVariant;
}

export function ContextMenuPanel({
  children,
  className,
  variant = 'card',
}: ContextMenuPanelProps) {
  return (
    <div
      className={cn(
        'absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl',
        variant === 'node' ? 'p-1' : 'p-1.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ContextMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  as?: 'button' | 'label';
  className?: string;
  variant?: ContextMenuVariant;
}

export function ContextMenuItem({
  children,
  onClick,
  danger = false,
  as = 'button',
  className,
  variant = 'card',
}: ContextMenuItemProps) {
  const itemClass = cn(
    'flex w-full cursor-pointer items-center gap-3 rounded-xl text-left font-medium transition hover:bg-[var(--color-surface-2)]',
    variant === 'node'
      ? 'px-[var(--mind-map-node-padding)] py-2.5 [font-size:calc(var(--mind-map-node-font-size)*0.6)]'
      : 'px-4 py-2.5 text-sm',
    danger && 'text-red-500 hover:bg-red-500/10',
    className,
  );

  if (as === 'label') {
    return <label className={itemClass}>{children}</label>;
  }

  return (
    <button type="button" className={itemClass} onClick={onClick}>
      {children}
    </button>
  );
}
