'use client';

import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { resolveFolderAppearance } from '@/lib/folder-theme';
import { getBreadcrumb, getChildren } from '@/lib/tree-utils';
import type { DropTarget } from '@/lib/types';
import { useVaultStore } from '@/stores/vault-store';
import { Breadcrumbs } from '@/components/vault/breadcrumbs';
import { FileTypeIcon } from '@/components/ui/file-type-icon';
import { FolderAppearance } from '@/components/ui/folder-appearance';
import { t } from '@/lib/i18n';

interface FolderContentProps {
  onUploadFiles: (files: File[], target?: DropTarget) => Promise<void>;
}

export function FolderContent({ onUploadFiles }: FolderContentProps) {
  const tree = useVaultStore((s) => s.tree);
  const documents = useVaultStore((s) => s.documents);
  const selectedFolderId = useVaultStore((s) => s.selectedFolderId);
  const selectedNodeId = useVaultStore((s) => s.selectedNodeId);
  const selectFolder = useVaultStore((s) => s.selectFolder);
  const selectNode = useVaultStore((s) => s.selectNode);
  const setRightPanelOpen = useVaultStore((s) => s.setRightPanelOpen);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const children = useMemo(
    () => getChildren(tree, selectedFolderId),
    [tree, selectedFolderId],
  );

  const docByNode = useMemo(
    () => Object.fromEntries(documents.map((d) => [d.nodeId, d])),
    [documents],
  );

  const breadcrumb = getBreadcrumb(tree, selectedFolderId);

  const handleDrop = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    try {
      await onUploadFiles(files, { kind: 'content', folderId: selectedFolderId });
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  return (
    <main className="flex h-full flex-col bg-[var(--color-canvas)]">
      <div className="border-b border-[var(--color-border)] px-6 py-4">
        <Breadcrumbs
          items={breadcrumb}
          onNavigate={(id) => selectFolder(id)}
          onRoot={() => selectFolder(null)}
        />
      </div>

      <div
        className={cn(
          'relative flex flex-1 flex-col overflow-hidden',
          dragOver && 'drop-active',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(Array.from(e.dataTransfer.files));
        }}
      >
        <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(180px,1fr))] content-start gap-4 overflow-y-auto p-6">
          {children.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-10 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Upload size={28} />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {t('vault.dropFilesHere')}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
                {t('vault.dropFilesHint')}
              </p>
              <label className="mt-6 cursor-pointer rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm text-white">
                {t('vault.pickFiles')}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleDrop(Array.from(e.target.files ?? []))}
                />
              </label>
            </motion.div>
          )}

          {children.map((node, i) => {
            const doc = docByNode[node.id];
            const isFolder = node.type === 'FOLDER';
            const isSelected = selectedNodeId === node.id;
            const folderTheme = isFolder
              ? resolveFolderAppearance(node.iconKey, node.color).theme
              : null;

            return (
              <motion.button
                key={node.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  if (isFolder) {
                    selectNode(node.id);
                    setRightPanelOpen(true);
                  } else if (doc) {
                    selectNode(node.id, doc.id);
                    setRightPanelOpen(true);
                  }
                }}
                onDoubleClick={() => isFolder && selectFolder(node.id)}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]',
                  isSelected && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20',
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    isFolder ? folderTheme?.containerClassName : 'bg-[var(--color-surface-2)]',
                  )}
                >
                  {isFolder ? (
                    <FolderAppearance
                      iconKey={node.iconKey}
                      color={node.color}
                      size={22}
                    />
                  ) : (
                    <FileTypeIcon
                      mimeType={doc?.mimeType}
                      filename={doc?.title ?? node.name}
                      size={24}
                    />
                  )}
                </div>
                <div>
                  <p className="line-clamp-2 font-medium">{node.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {isFolder ? t('common.folder') : t('common.document')}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="rounded-xl bg-[var(--color-surface)] px-6 py-3 text-sm shadow-lg">
              {t('common.loading')}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
