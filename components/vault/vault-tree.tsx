'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { findNode, isDescendant } from '@/lib/tree-utils';
import type { DropTarget, TreeNode } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';

interface VaultTreeProps {
  onUploadFiles: (files: File[], target?: DropTarget) => Promise<void>;
}

export function VaultTree({ onUploadFiles }: VaultTreeProps) {
  const tree = useVaultStore((s) => s.tree);
  const documents = useVaultStore((s) => s.documents);
  const selectedFolderId = useVaultStore((s) => s.selectedFolderId);
  const selectedNodeId = useVaultStore((s) => s.selectedNodeId);
  const selectFolder = useVaultStore((s) => s.selectFolder);
  const selectNode = useVaultStore((s) => s.selectNode);
  const { createFolder, renameNode, moveNode, deleteFolder, deleteDocument } = useVaultMutations();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const renamingNodeId = useVaultStore((s) => s.renamingNodeId);
  const setRenamingNodeId = useVaultStore((s) => s.setRenamingNodeId);

  const docByNode = useMemo(
    () => Object.fromEntries(documents.map((d) => [d.nodeId, d])),
    [documents],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const toggle = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = String(active.id);
    const targetId = String(over.id);

    if (targetId === '__root__') {
      await moveNode.mutateAsync({ id: draggedId, parentId: null });
      return;
    }

    const target = findNode(tree, targetId);
    if (!target || target.type !== 'FOLDER') return;
    if (draggedId === targetId || isDescendant(tree, draggedId, targetId)) return;

    await moveNode.mutateAsync({ id: draggedId, parentId: targetId });
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.type === 'FOLDER';
    const isOpen = expanded[node.id] ?? depth < 1;
    const doc = docByNode[node.id];
    const isSelected =
      selectedNodeId === node.id || (isFolder && selectedFolderId === node.id);

    return (
      <div key={node.id}>
        <TreeItem
          node={node}
          depth={depth}
          isOpen={isOpen}
          isSelected={isSelected}
          isRenaming={renamingNodeId === node.id}
          onToggle={() => isFolder && toggle(node.id)}
          onSelect={() => {
            if (isFolder) {
              selectFolder(node.id);
            } else if (doc) {
              selectNode(node.id, doc.id);
            }
          }}
          onRename={(name) => {
            renameNode.mutate({ id: node.id, name });
            setRenamingNodeId(null);
          }}
          onStartRename={() => setRenamingNodeId(node.id)}
          onDelete={async () => {
            if (isFolder) await deleteFolder.mutateAsync(node.id);
            else if (doc) await deleteDocument.mutateAsync(doc.id);
          }}
          onContextMenu={() => setContextMenu(node.id)}
          showMenu={contextMenu === node.id}
          onCloseMenu={() => setContextMenu(null)}
          onDropFiles={(files) => {
            if (isFolder) {
              onUploadFiles(files, { kind: 'folder', nodeId: node.id });
            }
          }}
        />
        <AnimatePresence>
          {isFolder && isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children.map((child) => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const activeNode = activeId ? findNode(tree, activeId) : null;

  return (
    <aside className="flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Vault Tree
        </span>
        <button
          type="button"
          className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          title="Новая папка"
          onClick={() => {
            const name = prompt('Название папки');
            if (name) createFolder.mutate({ name, parentId: selectedFolderId });
          }}
        >
          <FolderPlus size={15} />
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <RootDropZone />
          {tree.map((node) => renderNode(node))}
        </div>
        <DragOverlay>
          {activeNode && (
            <div className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm shadow-lg">
              {activeNode.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </aside>
  );
}

function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: '__root__' });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mb-2 rounded-lg px-3 py-2 text-xs text-[var(--color-muted)] transition',
        isOver && 'drop-active',
      )}
    >
      Корень хранилища
    </div>
  );
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  isOpen: boolean;
  isSelected: boolean;
  isRenaming: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onRename: (name: string) => void;
  onStartRename: () => void;
  onDelete: () => void;
  onContextMenu: () => void;
  showMenu: boolean;
  onCloseMenu: () => void;
  onDropFiles: (files: File[]) => void;
}

function TreeItem({
  node,
  depth,
  isOpen,
  isSelected,
  isRenaming,
  onToggle,
  onSelect,
  onRename,
  onStartRename,
  onDelete,
  onContextMenu,
  showMenu,
  onCloseMenu,
  onDropFiles,
}: TreeItemProps) {
  const isFolder = node.type === 'FOLDER';
  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging } = useDraggable({
    id: node.id,
  });
  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: node.id,
    disabled: !isFolder,
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const [name, setName] = useState(node.name);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      ref={(el) => {
        dragRef(el);
        if (isFolder) dropRef(el);
      }}
      style={{ ...style, paddingLeft: depth * 14 + 8 }}
      className={cn(
        'group relative mb-0.5 flex items-center gap-1 rounded-lg py-1.5 pr-2 transition',
        isSelected && 'bg-[var(--color-accent-soft)]',
        (isOver || dragOver) && 'drop-active',
        isDragging && 'opacity-40',
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onDropFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <button type="button" className="p-0.5 text-[var(--color-muted)]" onClick={onToggle}>
        {isFolder ? (
          <ChevronRight size={14} className={cn('transition', isOpen && 'rotate-90')} />
        ) : (
          <span className="inline-block w-3.5" />
        )}
      </button>

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
        onClick={onSelect}
        {...listeners}
        {...attributes}
      >
        {isFolder ? (
          <Folder size={15} className="shrink-0 text-[var(--color-accent)]" />
        ) : (
          <FileText size={15} className="shrink-0 text-[var(--color-muted)]" />
        )}
        {isRenaming ? (
          <input
            autoFocus
            className="w-full rounded border border-[var(--color-border)] bg-transparent px-1 py-0.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onRename(name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRename(name);
              if (e.key === 'Escape') onRename(node.name);
            }}
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
      </button>

      <button
        type="button"
        className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-2)]"
        onClick={onContextMenu}
      >
        <MoreHorizontal size={14} />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full z-20 min-w-[140px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
            onClick={() => {
              onStartRename();
              onCloseMenu();
            }}
          >
            <Pencil size={14} /> Переименовать
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
            onClick={() => {
              onDelete();
              onCloseMenu();
            }}
          >
            <Trash2 size={14} /> Удалить
          </button>
        </div>
      )}
    </div>
  );
}
