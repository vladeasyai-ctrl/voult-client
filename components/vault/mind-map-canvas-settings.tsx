'use client';

import type { RefObject } from 'react';
import { Minus, Plus, Settings2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface MindMapCanvasSettingsProps {
  open: boolean;
  scale: number;
  settingsRef: RefObject<HTMLButtonElement | null>;
  settingsPanelRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function MindMapCanvasSettingsButton({
  open,
  settingsRef,
  onToggle,
}: Pick<MindMapCanvasSettingsProps, 'open' | 'settingsRef' | 'onToggle'>) {
  return (
    <button
      type="button"
      ref={settingsRef}
      data-canvas-control
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'absolute top-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-200',
        open
          ? 'scale-105 border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[var(--color-accent)]/15'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]/95 hover:border-[var(--color-accent)]/40',
      )}
      title={t('vault.canvasSettings')}
      aria-expanded={open}
      aria-haspopup="dialog"
    >
      <Settings2
        size={22}
        className={cn(
          'transition-colors',
          open ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]',
        )}
      />
    </button>
  );
}

export function MindMapCanvasSettingsPanel({
  open,
  scale,
  settingsPanelRef,
  onZoomIn,
  onZoomOut,
  onReset,
}: Omit<MindMapCanvasSettingsProps, 'settingsRef' | 'onToggle'>) {
  if (!open) return null;

  return (
    <div
      ref={settingsPanelRef}
      data-canvas-control
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute top-[5.25rem] right-5 z-30 w-[min(18rem,calc(100vw-2.5rem))]"
    >
      <div
        role="dialog"
        aria-label={t('vault.canvasSettings')}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/98 p-4 shadow-xl backdrop-blur-md"
      >
        <p className="text-sm font-medium">{t('vault.canvasSettings')}</p>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>{t('vault.canvasZoom')}</span>
              <span>{Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-canvas-control
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onZoomOut();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                title={t('vault.zoomOut')}
              >
                <Minus size={16} />
              </button>
              <div className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-center text-sm">
                {Math.round(scale * 100)}%
              </div>
              <button
                type="button"
                data-canvas-control
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onZoomIn();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
                title={t('vault.zoomIn')}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            type="button"
            data-canvas-control
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)]"
          >
            {t('vault.resetCanvasView')}
          </button>
        </div>
      </div>
    </div>
  );
}
