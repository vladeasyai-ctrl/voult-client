'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismissOnPointerDown } from '@/hooks/use-dismiss-on-pointer-down';
import { t } from '@/lib/i18n';
import { findPresetById } from '@/lib/presets';
import type { Space } from '@/lib/types';

interface SpaceMapProps {
  spaces: Space[];
  activeSpaceId: string | null;
  branchCounts: Record<string, number>;
  onSelect: (spaceId: string) => void;
  onAddSpace: () => void;
  onDeleteSpace: (spaceId: string) => Promise<void>;
  onClose: () => void;
}

interface SpaceMapCardProps {
  space: Space;
  isActive: boolean;
  branchCount: number;
  menuOpen: boolean;
  onSelect: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onRequestDelete: () => void;
}

function SpaceMapCard({
  space,
  isActive,
  branchCount,
  menuOpen,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onRequestDelete,
}: SpaceMapCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const preset = findPresetById(space.presetId);

  useDismissOnPointerDown(menuOpen, onCloseMenu, cardRef);

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative rounded-2xl border p-5 transition',
        isActive
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/30 shadow-md'
          : 'border-[var(--color-border)] hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-lg',
      )}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between gap-3 pr-8">
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

      <button
        type="button"
        className={cn(
          'absolute right-3 top-3 rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
          menuOpen ? 'bg-[var(--color-surface-2)] opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
      >
        <MoreHorizontal size={18} />
      </button>

      {menuOpen && (
        <div className="absolute right-3 top-11 z-20 min-w-[170px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
            onClick={() => {
              onCloseMenu();
              onRequestDelete();
            }}
          >
            <Trash2 size={14} /> {t('vault.deleteSpace')}
          </button>
        </div>
      )}
    </div>
  );
}

export function SpaceMap({
  spaces,
  activeSpaceId,
  branchCounts,
  onSelect,
  onAddSpace,
  onDeleteSpace,
  onClose,
}: SpaceMapProps) {
  const [menuSpaceId, setMenuSpaceId] = useState<string | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!spaceToDelete) return;
    setDeleting(true);
    try {
      await onDeleteSpace(spaceToDelete.id);
      setSpaceToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex max-h-[min(90vh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          title={t('common.close')}
        >
          <X size={18} />
        </button>

        <div className="shrink-0 pr-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            {t('vault.storageMap')}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
            {t('vault.spaces')}
          </h2>
          <p className="mt-2 max-w-lg text-sm text-[var(--color-muted)]">
            {t('vault.spaceMapHint')}
          </p>
        </div>

        {spaces.length === 0 ? (
          <div className="mt-8 shrink-0 rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center">
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
          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-4 pb-1 sm:grid-cols-2">
              {spaces.map((space) => (
                <SpaceMapCard
                  key={space.id}
                  space={space}
                  isActive={space.id === activeSpaceId}
                  branchCount={branchCounts[space.id] ?? 0}
                  menuOpen={menuSpaceId === space.id}
                  onSelect={() => onSelect(space.id)}
                  onToggleMenu={() =>
                    setMenuSpaceId((prev) => (prev === space.id ? null : space.id))
                  }
                  onCloseMenu={() => setMenuSpaceId(null)}
                  onRequestDelete={() => setSpaceToDelete(space)}
                />
              ))}

              <button
                type="button"
                onClick={onAddSpace}
                className="flex min-h-[8.5rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <Plus size={24} />
                <span className="mt-2 text-sm">{t('vault.addSpace')}</span>
              </button>
            </div>
          </div>
        )}

        {spaceToDelete && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl bg-black/45 p-6">
            <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
              <h3 className="text-lg font-medium">
                {t('vault.deleteSpaceTitle', { name: spaceToDelete.name })}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {t('vault.deleteSpaceDescription')}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setSpaceToDelete(null)}
                  className="rounded-lg px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleConfirmDelete()}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? t('common.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
