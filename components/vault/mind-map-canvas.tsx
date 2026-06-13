'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Folder,
  Map,
  Minus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  buildMindMapLayout,
  curvedEdgePath,
  NODE_HEIGHT,
  NODE_WIDTH,
  SUGGESTION_HEIGHT,
} from '@/lib/mind-map-layout';
import { getSuggestions, findPresetByRootName, type VaultPreset } from '@/lib/presets';
import { flattenTree } from '@/lib/tree-utils';
import type { DropTarget, TreeNode } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';
import { PresetPicker } from '@/components/vault/preset-picker';
import { RootFolderMap } from '@/components/vault/root-folder-map';

interface MindMapCanvasProps {
  onUploadFiles: (files: File[], target?: DropTarget) => Promise<void>;
}

export function MindMapCanvas({ onUploadFiles }: MindMapCanvasProps) {
  const tree = useVaultStore((s) => s.tree);
  const documents = useVaultStore((s) => s.documents);
  const presetId = useVaultStore((s) => s.presetId);
  const onboarded = useVaultStore((s) => s.onboarded);
  const canvas = useVaultStore((s) => s.canvas);
  const setCanvas = useVaultStore((s) => s.setCanvas);
  const setOnboarded = useVaultStore((s) => s.setOnboarded);
  const setPresetId = useVaultStore((s) => s.setPresetId);
  const selectNode = useVaultStore((s) => s.selectNode);
  const selectedNodeId = useVaultStore((s) => s.selectedNodeId);
  const renamingNodeId = useVaultStore((s) => s.renamingNodeId);
  const setRenamingNodeId = useVaultStore((s) => s.setRenamingNodeId);
  const activeRootId = useVaultStore((s) => s.activeRootId);
  const setActiveRootId = useVaultStore((s) => s.setActiveRootId);

  const { createFolder, renameNode, deleteFolder, deleteDocument, invalidate } =
    useVaultMutations();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showRootMap, setShowRootMap] = useState(false);

  const rootFolders = useMemo(
    () => tree.filter((n) => n.type === 'FOLDER'),
    [tree],
  );

  const activeRoot = useMemo(() => {
    if (rootFolders.length === 0) return null;
    if (activeRootId) {
      const found = rootFolders.find((r) => r.id === activeRootId);
      if (found) return found;
    }
    return rootFolders[0];
  }, [rootFolders, activeRootId]);

  const displayTree = useMemo(
    () => (activeRoot ? [activeRoot] : []),
    [activeRoot],
  );

  useEffect(() => {
    if (rootFolders.length === 0) {
      if (activeRootId) setActiveRootId(null);
      return;
    }
    if (!activeRootId || !rootFolders.some((r) => r.id === activeRootId)) {
      setActiveRootId(rootFolders[0].id);
    }
  }, [rootFolders, activeRootId, setActiveRootId]);

  const docByNode = useMemo(
    () => Object.fromEntries(documents.map((d) => [d.nodeId, d])),
    [documents],
  );

  const flat = useMemo(() => flattenTree(displayTree), [displayTree]);

  useEffect(() => {
    if (!onboarded && tree.length === 0) {
      setShowPresetPicker(true);
    }
  }, [onboarded, tree.length]);

  const allSuggestions = useMemo(() => {
    return flat
      .filter((n) => n.type === 'FOLDER')
      .flatMap((n) =>
        getSuggestions(n, resolvePresetId(n, displayTree, presetId)),
      );
  }, [flat, presetId, displayTree]);

  const layout = useMemo(
    () => buildMindMapLayout(displayTree, allSuggestions),
    [displayTree, allSuggestions],
  );

  const handleAddRoot = async () => {
    const name = prompt('Название корневой ветки');
    if (!name?.trim()) return;
    const created = await createFolder.mutateAsync({
      name: name.trim(),
      parentId: null,
    });
    setActiveRootId(created.id);
    setCanvas({ x: 0, y: 0, scale: 1 });
    await invalidate();
  };

  const handlePreset = async (preset: VaultPreset) => {
    const created = await createFolder.mutateAsync({ name: preset.rootName, parentId: null });
    setPresetId(preset.id);
    setActiveRootId(created.id);
    setOnboarded(true);
    setShowPresetPicker(false);
    await invalidate();
  };

  const handleSkipPreset = () => {
    setOnboarded(true);
    setShowPresetPicker(false);
  };

  const handleCreateSuggestion = async (parentId: string, label: string) => {
    const name =
      label === '+ Новая ветка'
        ? prompt('Название ветки') ?? ''
        : label;
    if (!name.trim()) return;
    const created = await createFolder.mutateAsync({
      name: name.trim(),
      parentId,
    });
    selectNode(created.id);
    await invalidate();
  };

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const next = Math.min(2, Math.max(0.35, canvas.scale + delta));
      setCanvas({ scale: next });
    },
    [canvas.scale, setCanvas],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-mind-node]')) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      canvasX: canvas.x,
      canvasY: canvas.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setCanvas({
      x: panStart.current.canvasX + (e.clientX - panStart.current.x),
      y: panStart.current.canvasY + (e.clientY - panStart.current.y),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <>
      {showPresetPicker && (
        <PresetPicker onSelect={handlePreset} onSkip={handleSkipPreset} />
      )}

      {showRootMap && (
        <RootFolderMap
          roots={rootFolders}
          activeRootId={activeRoot?.id ?? null}
          onSelect={(rootId) => {
            setActiveRootId(rootId);
            setCanvas({ x: 0, y: 0, scale: 1 });
            selectNode(null);
            setShowRootMap(false);
          }}
          onAddRoot={async () => {
            setShowRootMap(false);
            await handleAddRoot();
          }}
          onClose={() => setShowRootMap(false)}
        />
      )}

      <div className="relative flex h-full flex-col overflow-hidden bg-[var(--color-canvas)]">
        <CanvasToolbar
          activeRootName={activeRoot?.name}
          rootCount={rootFolders.length}
          scale={canvas.scale}
          onOpenMap={() => setShowRootMap(true)}
          onZoomIn={() => setCanvas({ scale: Math.min(2, canvas.scale + 0.1) })}
          onZoomOut={() => setCanvas({ scale: Math.max(0.35, canvas.scale - 0.1) })}
          onReset={() => setCanvas({ x: 0, y: 0, scale: 1 })}
          onAddRoot={handleAddRoot}
        />

        <div
          ref={containerRef}
          className={cn(
            'mind-map-viewport relative flex-1 overflow-hidden',
            isPanning && 'cursor-grabbing',
            !isPanning && 'cursor-grab',
          )}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${canvas.x}px, ${canvas.y}px) scale(${canvas.scale})`,
              width: layout.width,
              height: layout.height,
            }}
          >
            <svg
              className="pointer-events-none absolute inset-0"
              width={layout.width}
              height={layout.height}
            >
              {layout.edges.map((edge) => (
                <path
                  key={`${edge.fromId}-${edge.toId}`}
                  d={curvedEdgePath(edge.x1, edge.y1, edge.x2, edge.y2)}
                  fill="none"
                  stroke="var(--color-border)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {layout.nodes.map(({ id, node, x, y }) => (
              <MindMapNodeCard
                key={id}
                node={node}
                document={docByNode[node.id]}
                x={x}
                y={y}
                selected={selectedNodeId === id}
                renaming={renamingNodeId === id}
                showMenu={contextMenu === id}
                onSelect={() => {
                  const doc = docByNode[node.id];
                  selectNode(id, doc?.id ?? null);
                }}
                onRename={(name) => {
                  renameNode.mutate({ id, name });
                  setRenamingNodeId(null);
                }}
                onStartRename={() => setRenamingNodeId(id)}
                onDelete={async () => {
                  const doc = docByNode[node.id];
                  if (doc) await deleteDocument.mutateAsync(doc.id);
                  else if (node.type === 'FOLDER') await deleteFolder.mutateAsync(id);
                  if (node.parentId === null) {
                    const remaining = rootFolders.filter((r) => r.id !== id);
                    setActiveRootId(remaining[0]?.id ?? null);
                  }
                  selectNode(null);
                }}
                onContextMenu={() => setContextMenu(id)}
                onCloseMenu={() => setContextMenu(null)}
                onUpload={(files) =>
                  onUploadFiles(
                    files,
                    docByNode[node.id]
                      ? {
                          kind: 'document',
                          documentId: docByNode[node.id].id,
                          nodeId: node.id,
                        }
                      : { kind: 'folder', nodeId: node.id },
                  )
                }
              />
            ))}

            {layout.suggestions.map(({ suggestion, x, y }) => (
              <button
                key={suggestion.key}
                type="button"
                data-mind-node
                style={{ left: x, top: y, width: NODE_WIDTH, height: SUGGESTION_HEIGHT }}
                className={cn(
                  'absolute flex items-center justify-center rounded-2xl border-2 border-dashed',
                  'border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)]/40',
                  'text-sm text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]',
                )}
                onClick={() =>
                  handleCreateSuggestion(suggestion.parentId, suggestion.label)
                }
              >
                {suggestion.label}
              </button>
            ))}

            {displayTree.length === 0 && onboarded && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ width: 320 }}
              >
                <p className="text-lg font-medium">Пустой холст</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Создайте корневую ветку или выберите пресет в меню
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">
          Перетаскивайте холст · Колёсико — масштаб · Клик по пунктиру — создать ветку
        </div>
      </div>
    </>
  );
}

function resolvePresetId(
  node: TreeNode,
  roots: TreeNode[],
  storedPresetId: string | null,
): string | null {
  if (storedPresetId) return storedPresetId;
  const flat = flattenTree(roots);
  let current: TreeNode | undefined = node;
  while (current?.parentId) {
    current = flat.find((n) => n.id === current!.parentId);
  }
  if (current) return findPresetByRootName(current.name)?.id ?? null;
  return null;
}

function CanvasToolbar({
  activeRootName,
  rootCount,
  scale,
  onOpenMap,
  onZoomIn,
  onZoomOut,
  onReset,
  onAddRoot,
}: {
  activeRootName?: string;
  rootCount: number;
  scale: number;
  onOpenMap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onAddRoot: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-2 backdrop-blur">
      <button
        type="button"
        onClick={onAddRoot}
        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm text-[var(--color-accent)]"
      >
        <Plus size={14} /> Корневая ветка
      </button>
      {activeRootName && (
        <span className="hidden truncate text-sm text-[var(--color-muted)] sm:inline">
          {activeRootName}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenMap}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          title="Карта корневых веток"
        >
          <Map size={14} />
          <span className="hidden sm:inline">Карта</span>
          {rootCount > 1 && (
            <span className="rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
              {rootCount}
            </span>
          )}
        </button>
        <button type="button" onClick={onZoomOut} className="rounded-lg p-2 hover:bg-[var(--color-surface-2)]">
          <Minus size={14} />
        </button>
        <span className="w-12 text-center text-xs text-[var(--color-muted)]">
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={onZoomIn} className="rounded-lg p-2 hover:bg-[var(--color-surface-2)]">
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="ml-2 rounded-lg px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
        >
          Сбросить вид
        </button>
      </div>
    </div>
  );
}

interface MindMapNodeCardProps {
  node: TreeNode;
  document?: { id: string };
  x: number;
  y: number;
  selected: boolean;
  renaming: boolean;
  showMenu: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onStartRename: () => void;
  onDelete: () => void;
  onContextMenu: () => void;
  onCloseMenu: () => void;
  onUpload: (files: File[]) => void;
}

function MindMapNodeCard({
  node,
  document,
  x,
  y,
  selected,
  renaming,
  showMenu,
  onSelect,
  onRename,
  onStartRename,
  onDelete,
  onContextMenu,
  onCloseMenu,
  onUpload,
}: MindMapNodeCardProps) {
  const [name, setName] = useState(node.name);
  const isFolder = node.type === 'FOLDER';
  const [dragOver, setDragOver] = useState(false);

  return (
    <motion.div
      data-mind-node
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ left: x, top: y, width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={cn(
        'absolute group',
        dragOver && 'drop-active',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onUpload(Array.from(e.dataTransfer.files));
      }}
    >
      <div
        className={cn(
          'flex h-full items-center gap-2 rounded-2xl border px-3 shadow-sm transition',
          isFolder
            ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface-2)]',
          selected && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/25',
          node.parentId === null && isFolder && 'rounded-full px-5',
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={onSelect}
        >
          {isFolder ? (
            <Folder size={16} className="shrink-0 text-[var(--color-accent)]" />
          ) : (
            <FileText size={16} className="shrink-0 text-[var(--color-muted)]" />
          )}
          {renaming ? (
            <input
              autoFocus
              className="w-full rounded border border-[var(--color-border)] bg-transparent px-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => onRename(name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRename(name);
              }}
            />
          ) : (
            <span className="truncate text-sm font-medium">{node.name}</span>
          )}
        </button>

        <button
          type="button"
          className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-2)]"
          onClick={onContextMenu}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {showMenu && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[150px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
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
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]">
            <Upload size={14} /> Загрузить файл
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                onUpload(Array.from(e.target.files ?? []));
                onCloseMenu();
              }}
            />
          </label>
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
    </motion.div>
  );
}
