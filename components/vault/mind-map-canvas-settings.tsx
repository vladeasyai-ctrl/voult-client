'use client';

import type { RefObject } from 'react';
import { Minus, Plus, Settings2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface MindMapCanvasSettingsProps {
  open: boolean;
  scale: number;
  mindMapLayoutMode: 'classic' | 'radial';
  folderRayLength: number;
  minFolderRayLength: number;
  maxFolderRayLength: number;
  settingsRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFolderRayLengthChange: (value: number) => void;
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
  mindMapLayoutMode,
  folderRayLength,
  minFolderRayLength,
  maxFolderRayLength,
  onZoomIn,
  onZoomOut,
  onFolderRayLengthChange,
  onReset,
}: Omit<MindMapCanvasSettingsProps, 'settingsRef' | 'onToggle'>) {
  if (!open) return null;

  const showRaySlider = mindMapLayoutMode === 'radial';

  return (
    <div
      role="dialog"
      aria-label={t('vault.canvasSettings')}
      className="absolute top-[5.25rem] right-5 z-30 w-[min(18rem,calc(100vw-2.5rem))] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/98 p-4 shadow-xl backdrop-blur-md"
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
              onClick={onZoomOut}
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
              onClick={onZoomIn}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
              title={t('vault.zoomIn')}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {showRaySlider && (
          <div>
            <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>{t('vault.folderRayLength')}</span>
              <span>{Math.round(folderRayLength)} px</span>
            </div>
            <input
              type="range"
              min={minFolderRayLength}
              max={maxFolderRayLength}
              step={1}
              value={folderRayLength}
              onChange={(e) => onFolderRayLengthChange(Number(e.target.value))}
              className="w-full accent-[var(--color-accent)]"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[var(--color-muted)]">
              <span>{t('vault.rayMin', { value: Math.round(minFolderRayLength) })}</span>
              <span>{t('vault.rayMax', { value: Math.round(maxFolderRayLength) })}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)]"
        >
          {t('vault.resetCanvasView')}
        </button>
      </div>
    </div>
  );
}
