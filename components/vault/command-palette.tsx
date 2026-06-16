'use client';

import { Command } from 'cmdk';
import { FilePlus, FolderPlus, Search, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { flattenTree } from '@/lib/tree-utils';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useUpload } from '@/hooks/use-upload';
import { useVaultStore } from '@/stores/vault-store';
import { api } from '@/lib/api';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const tree = useVaultStore((s) => s.tree);
  const documents = useVaultStore((s) => s.documents);
  const selectedFolderId = useVaultStore((s) => s.selectedFolderId);
  const selectFolder = useVaultStore((s) => s.selectFolder);
  const selectNode = useVaultStore((s) => s.selectNode);
  const { createFolder } = useVaultMutations();
  const { uploadToTarget } = useUpload();
  const [searchResults, setSearchResults] = useState(documents);

  const folders = useMemo(
    () => flattenTree(tree).filter((n) => n.type === 'FOLDER'),
    [tree],
  );

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('vault:open-palette', handler);
    return () => window.removeEventListener('vault:open-palette', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(documents);
      return;
    }
    const t = setTimeout(() => {
      api.searchDocuments(query).then(setSearchResults).catch(() => setSearchResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query, documents]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[12vh] backdrop-blur-sm">
      <Command
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        shouldFilter={false}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4">
          <Search size={16} className="text-[var(--color-muted)]" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Найти документ, папку или действие…"
            className="h-12 w-full bg-transparent text-sm outline-none"
          />
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">
            Ничего не найдено
          </Command.Empty>

          <Command.Group heading="Действия" className="px-2 py-1 text-xs text-[var(--color-muted)]">
            <PaletteItem
              icon={FolderPlus}
              label="Создать папку"
              onSelect={() => {
                const name = prompt('Название папки');
                if (name) createFolder.mutate({ name, parentId: selectedFolderId });
                setOpen(false);
              }}
            />
            <PaletteItem
              icon={FilePlus}
              label="Создать документ"
              onSelect={() => {
                const name = prompt('Название документа');
                if (name) {
                  api.createDocument(name, selectedFolderId).then(() => setOpen(false));
                }
              }}
            />
            <PaletteItem
              icon={Upload}
              label="Загрузить файл"
              onSelect={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = async () => {
                  await uploadToTarget(Array.from(input.files ?? []));
                  setOpen(false);
                };
                input.click();
              }}
            />
          </Command.Group>

          {searchResults.length > 0 && (
            <Command.Group heading="Документы" className="px-2 py-1 text-xs text-[var(--color-muted)]">
              {searchResults.map((doc) => (
                <PaletteItem
                  key={doc.id}
                  icon={Search}
                  label={doc.title}
                  hint={doc.aiSummary ?? 'Документ'}
                  onSelect={() => {
                    selectNode(doc.nodeId, doc.id);
                    setOpen(false);
                  }}
                />
              ))}
            </Command.Group>
          )}

          {folders.length > 0 && (
            <Command.Group heading="Папки" className="px-2 py-1 text-xs text-[var(--color-muted)]">
              {folders
                .filter((f) => !query || f.name.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 8)
                .map((folder) => (
                  <PaletteItem
                    key={folder.id}
                    icon={FolderPlus}
                    label={folder.name}
                    hint="Перейти"
                    onSelect={() => {
                      selectFolder(folder.id);
                      setOpen(false);
                    }}
                  />
                ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>

      <button
        type="button"
        className="fixed inset-0 -z-10"
        aria-label="Закрыть"
        onClick={() => setOpen(false)}
      />
    </div>
  );
}

function PaletteItem({
  icon: Icon,
  label,
  hint,
  onSelect,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
        'aria-selected:bg-[var(--color-accent-soft)]',
      )}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {hint && <span className="text-xs text-[var(--color-muted)]">{hint}</span>}
    </Command.Item>
  );
}
