'use client';

import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import type { TreeNode } from '@/lib/types';
import { FolderAppearance } from '@/components/ui/folder-appearance';
import { resolveFolderAppearance } from '@/lib/folder-theme';

interface RootFolderMapProps {
  roots: TreeNode[];
  activeRootId: string | null;
  onSelect: (rootId: string) => void;
  onAddRoot: () => void;
  onClose: () => void;
}

function countDescendants(node: TreeNode): number {
  return node.children.reduce(
    (sum, child) => sum + 1 + countDescendants(child),
    0,
  );
}

export function RootFolderMap({
  roots,
  activeRootId,
  onSelect,
  onAddRoot,
  onClose,
}: RootFolderMapProps) {
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
          {t('vault.rootBranches')}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-[var(--color-muted)]">
          {t('vault.storageMapHint')}
        </p>

        {roots.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">
              {t('vault.noRootBranches')}
            </p>
            <button
              type="button"
              onClick={onAddRoot}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-soft)] px-4 py-2 text-sm text-[var(--color-accent)]"
            >
              <Plus size={14} /> {t('vault.createFirstBranch')}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {roots.map((root) => {
              const childFolders = root.children.filter((c) => c.type === 'FOLDER');
              const totalNodes = countDescendants(root);
              const isActive = root.id === activeRootId;
              const appearance = resolveFolderAppearance(root.iconKey, root.color);

              return (
                <button
                  key={root.id}
                  type="button"
                  onClick={() => onSelect(root.id)}
                  className={cn(
                    'rounded-2xl border p-5 text-left transition',
                    'hover:-translate-y-0.5 hover:shadow-lg',
                    isActive
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]/30 shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                        appearance.theme.containerClassName,
                      )}
                    >
                      <FolderAppearance
                        iconKey={root.iconKey}
                        color={root.color}
                        size={24}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-medium">{root.name}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {t('vault.branchCount', { count: childFolders.length })}
                        {totalNodes > 0 && ` · ${t('vault.itemCount', { count: totalNodes })}`}
                      </p>
                    </div>
                  </div>

                  {childFolders.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {childFolders.slice(0, 4).map((child) => (
                        <span
                          key={child.id}
                          className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-xs text-[var(--color-muted)]"
                        >
                          {child.name}
                        </span>
                      ))}
                      {childFolders.length > 4 && (
                        <span className="rounded-full px-2.5 py-1 text-xs text-[var(--color-muted)]">
                          +{childFolders.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {isActive && (
                    <p className="mt-3 text-xs font-medium text-[var(--color-accent)]">
                      {t('vault.onCanvasNow')}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {roots.length > 0 && (
          <button
            type="button"
            onClick={onAddRoot}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] underline-offset-4 hover:underline"
          >
            <Plus size={14} /> {t('vault.addRootBranch')}
          </button>
        )}
      </motion.div>
    </div>
  );
}
