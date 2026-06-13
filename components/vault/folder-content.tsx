'use client';

import { motion } from 'framer-motion';
import { FileText, Folder, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { getBreadcrumb, getChildren } from '@/lib/tree-utils';
import type { DropTarget } from '@/lib/types';
import { useVaultStore } from '@/stores/vault-store';
import { Breadcrumbs } from '@/components/vault/breadcrumbs';

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
                Перетащите файлы сюда
              </h2>
              <p className="mt-2 max-w-sm text-sm text-[var(--color-muted)]">
                Бросьте документы, фото или PDF — они станут частью вашего архива
              </p>
              <label className="mt-6 cursor-pointer rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm text-white">
                Выбрать файлы
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

            return (
              <motion.button
                key={node.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  if (isFolder) selectFolder(node.id);
                  else if (doc) selectNode(node.id, doc.id);
                }}
                onDoubleClick={() => isFolder && selectFolder(node.id)}
                className={cn(
                  'flex flex-col items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]',
                  isSelected && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20',
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-2)]">
                  {isFolder ? (
                    <Folder size={22} className="text-[var(--color-accent)]" />
                  ) : (
                    <FileText size={22} className="text-[var(--color-muted)]" />
                  )}
                </div>
                <div>
                  <p className="line-clamp-2 font-medium">{node.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {isFolder ? 'Папка' : 'Документ'}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="rounded-xl bg-[var(--color-surface)] px-6 py-3 text-sm shadow-lg">
              Загрузка…
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
