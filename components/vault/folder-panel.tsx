'use client';

import { useEffect, useState } from 'react';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import {
  FOLDER_COLOR_KEYS,
  FOLDER_COLOR_THEMES,
  FOLDER_ICON_COMPONENTS,
  FOLDER_ICON_KEYS,
  resolveFolderAppearance,
  type FolderColorKey,
  type FolderIconKey,
} from '@/lib/folder-theme';
import { t } from '@/lib/i18n';
import { flattenTree } from '@/lib/tree-utils';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';
import { FolderAppearance } from '@/components/ui/folder-appearance';

export function FolderPanel() {
  const tree = useVaultStore((s) => s.tree);
  const selectedNodeId = useVaultStore((s) => s.selectedNodeId);
  const selectedDocumentId = useVaultStore((s) => s.selectedDocumentId);
  const { updateFolder } = useVaultMutations();

  const folder = flattenTree(tree).find(
    (node) => node.id === selectedNodeId && node.type === 'FOLDER',
  );

  const [description, setDescription] = useState('');

  useEffect(() => {
    setDescription(folder?.description ?? '');
  }, [folder?.id, folder?.description]);

  if (selectedDocumentId || !folder) {
    return (
      <aside className="flex h-full items-center justify-center border-l border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <div>
          <Folder size={32} className="mx-auto mb-3 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">{t('vault.selectFolder')}</p>
        </div>
      </aside>
    );
  }

  const appearance = resolveFolderAppearance(folder.iconKey, folder.color);
  const isSaving = updateFolder.isPending;

  const saveAppearance = (patch: {
    iconKey?: FolderIconKey;
    color?: FolderColorKey;
    description?: string | null;
  }) => {
    updateFolder.mutate({ id: folder.id, ...patch });
  };

  return (
    <aside className="flex h-full flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="shrink-0 border-b border-[var(--color-border)] p-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {t('common.folder')}
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight">
          {folder.name}
        </h2>
        {folder.description ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">{folder.description}</p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-muted)]">{t('vault.noFolderDescription')}</p>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-[var(--color-border)] p-5 text-sm">
        <Meta label={t('common.created')} value={formatDate(folder.createdAt)} />
        <Meta label={t('common.updated')} value={formatDate(folder.updatedAt)} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
          {t('vault.folderDescriptionLabel')}
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => {
            const trimmed = description.trim();
            const current = folder.description ?? '';
            if (trimmed === current) return;
            saveAppearance({ description: trimmed || null });
          }}
          rows={4}
          placeholder={t('vault.folderDescriptionPlaceholder')}
          className="mt-2 w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm outline-none ring-[var(--color-accent)]/20 focus:ring-2"
        />

        <div className="mt-6">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
            {t('vault.folderAppearance')}
          </p>
          <div
            className={cn(
              'mt-3 flex h-20 w-20 items-center justify-center rounded-2xl border',
              appearance.theme.containerClassName,
            )}
          >
            <FolderAppearance
              iconKey={folder.iconKey}
              color={folder.color}
              size={36}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium">{t('vault.folderIconLabel')}</p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-7">
            {FOLDER_ICON_KEYS.map((key) => {
              const Icon = FOLDER_ICON_COMPONENTS[key];
              const active = appearance.iconKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isSaving}
                  title={key}
                  onClick={() => saveAppearance({ iconKey: key })}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-xl border transition',
                    active
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
                  )}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pb-4">
          <p className="mb-3 text-sm font-medium">{t('vault.folderColorLabel')}</p>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLOR_KEYS.map((key) => {
              const theme = FOLDER_COLOR_THEMES[key];
              const active = appearance.colorKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isSaving}
                  title={key}
                  onClick={() => saveAppearance({ color: key })}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition',
                    theme.swatchClassName,
                    active
                      ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/25'
                      : 'border-transparent hover:scale-105',
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-muted)]">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
