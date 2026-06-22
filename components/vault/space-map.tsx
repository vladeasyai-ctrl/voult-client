'use client';

import { motion } from 'framer-motion';
import { Layers, Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { findPresetById } from '@/lib/presets';
import type { Space } from '@/lib/types';

interface SpaceMapProps {
  spaces: Space[];
  activeSpaceId: string | null;
  branchCounts: Record<string, number>;
  onSelect: (spaceId: string) => void;
  onAddSpace: () => void;
  onClose: () => void;
}

export function SpaceMap({
  spaces,
  activeSpaceId,
  branchCounts,
  onSelect,
  onAddSpace,
  onClose,
}: SpaceMapProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          title={t('common.close')}
        >
          <X size={18} />
        </button>

        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          {t('vault.storageMap')}
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          {t('vault.spaces')}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[var(--color-muted)]">
          {t('vault.spaceMapHint')}
        </p>

        {spaces.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">{t('vault.noSpaces')}</p>
            <button
              type="button"
              onClick={onAddSpace}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-soft)] px-4 py-2 text-sm text-[var(--color-accent)]"
            >
              <Plus size={14} /> {t('vault.createFirstSpace')}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {spaces.map((space) => {
              const preset = findPresetById(space.presetId);
              const branchCount = branchCounts[space.id] ?? 0;
              const isActive = space.id === activeSpaceId;

              return (
                <button
                  key={space.id}
                  type="button"
                  onClick={() => onSelect(space.id)}
                  className={cn(
                    'rounded-2xl border p-5 text-left transition',
                    isActive
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/30 shadow-md'
                      : 'border-[var(--color-border)] hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-lg',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl">{preset?.emoji ?? '📁'}</span>
                    <Layers
                      size={16}
                      className={cn(
                        'mt-1 shrink-0',
                        isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)]',
                      )}
                    />
                  </div>
                  <p className="mt-3 text-lg font-medium">{space.name}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {t('vault.branchCount', { count: branchCount })}
                  </p>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onAddSpace}
              className="flex min-h-[8.5rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <Plus size={24} />
              <span className="mt-2 text-sm">{t('vault.addSpace')}</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
