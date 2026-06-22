'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Folder,
  FolderPlus,
  GripVertical,
  Map,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Sun,
  TreePine,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { en } from '@/lib/i18n/en';
import {
  buildMindMapLayout,
  NODE_HEIGHT,
  NODE_WIDTH,
} from '@/lib/mind-map-layout';
import {
  canvasPointFromClient,
  insertionPlaceholderX,
  insertionPlaceholderY,
  resolveDragDropTarget,
  SUGGESTION_SLOT_HEIGHT,
  type DragDropTarget,
} from '@/lib/mind-map-dnd';
import { removeFromOrderMap } from '@/lib/node-order';
import { applyTreeMove } from '@/lib/tree-move-utils';
import { createPendingFolder, isPendingNodeId, suggestChildFolderName } from '@/lib/tree-mutations';
import { findPresetByRootName, type VaultPreset } from '@/lib/presets';
import { isHealthPresetRoot } from '@/lib/health-body-map';
import { flattenTree, findNode } from '@/lib/tree-utils';
import type { DropTarget, TreeNode } from '@/lib/types';
import { AI_IMPORT_UNSUPPORTED_HINT, isAiImportFile } from '@/lib/ai-import';
import { useVaultData, useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';
import { NameDialog } from '@/components/vault/name-dialog';
import { FileTypeIcon } from '@/components/ui/file-type-icon';
import { PresetPicker } from '@/components/vault/preset-picker';
import { RootFolderMap } from '@/components/vault/root-folder-map';
import { HealthBodyCanvas } from '@/components/vault/health-body-canvas';
import { MindMapEdges } from '@/components/vault/mind-map-edges';
import {
  MindMapCanvasSettingsButton,
  MindMapCanvasSettingsPanel,
} from '@/components/vault/mind-map-canvas-settings';
import {
  MindMapDeleteFly,
  MindMapTrashZone,
  isOverTrash,
  nodeViewportBox,
  trashTargetInContainer,
} from '@/components/vault/mind-map-trash';

interface DragState {
  nodeId: string;
  canvasX: number;
  canvasY: number;
  offsetX: number;
  offsetY: number;
}

interface PendingDelete {
  nodeId: string;
  node: TreeNode;
  documentId?: string;
  startLeft: number;
  startTop: number;
  startWidth: number;
  startHeight: number;
  targetLeft: number;
  targetTop: number;
}

interface MindMapCanvasProps {
  onUploadFiles: (files: File[], target?: DropTarget) => Promise<void>;
  onAiImportFile?: (file: File, target: DropTarget) => void;
}

async function handleFileDrop(
  files: File[],
  target: DropTarget,
  onAiImportFile: MindMapCanvasProps['onAiImportFile'],
  onUploadFiles: MindMapCanvasProps['onUploadFiles'],
): Promise<'ai' | 'upload' | 'unsupported'> {
  const importFiles = files.filter(isAiImportFile);
  if (importFiles.length > 0 && onAiImportFile) {
    onAiImportFile(importFiles[0], target);
    return 'ai';
  }
  if (files.some((f) => !isAiImportFile(f)) && importFiles.length === 0) {
    return 'unsupported';
  }
  await onUploadFiles(files, target);
  return 'upload';
}

export function MindMapCanvas({ onUploadFiles, onAiImportFile }: MindMapCanvasProps) {
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
  const healthViewMode = useVaultStore((s) => s.healthViewMode);
  const setHealthViewMode = useVaultStore((s) => s.setHealthViewMode);
  const mindMapLayoutMode = useVaultStore((s) => s.mindMapLayoutMode);
  const toggleMindMapLayoutMode = useVaultStore((s) => s.toggleMindMapLayoutMode);
  const radialFolderRayLength = useVaultStore((s) => s.radialFolderRayLength);
  const setRadialFolderRayLength = useVaultStore((s) => s.setRadialFolderRayLength);
  const resetCanvasView = useVaultStore((s) => s.resetCanvasView);
  const reorderNodeLocal = useVaultStore((s) => s.reorderNodeLocal);
  const moveNodeLocal = useVaultStore((s) => s.moveNodeLocal);
  const setNodeOrder = useVaultStore((s) => s.setNodeOrder);
  const addPendingFolder = useVaultStore((s) => s.addPendingFolder);
  const removeNodeLocal = useVaultStore((s) => s.removeNodeLocal);
  const renameNodeLocal = useVaultStore((s) => s.renameNodeLocal);

  const { isLoading } = useVaultData();
  const { createFolder, renameNode, moveNode, deleteFolder, deleteDocument, invalidate } =
    useVaultMutations();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [canvasDragOver, setCanvasDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dropHint, setDropHint] = useState<string | null>(null);
  const panStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [rootNameDialogOpen, setRootNameDialogOpen] = useState(false);
  const [showRootMap, setShowRootMap] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<DragDropTarget | null>(null);
  const [dragToTrash, setDragToTrash] = useState(false);
  const [trashDenied, setTrashDenied] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const pendingDeleteRef = useRef<PendingDelete | null>(null);
  const [canvasSettingsOpen, setCanvasSettingsOpen] = useState(false);
  const [pendingDefaultNames, setPendingDefaultNames] = useState<Record<string, string>>({});

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

  const isHealthRoot = useMemo(
    () => Boolean(activeRoot && isHealthPresetRoot(activeRoot.name, presetId)),
    [activeRoot, presetId],
  );

  const showHealthBody =
    isHealthRoot && healthViewMode === 'body' && activeRoot != null;

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
    if (isLoading) return;

    if (rootFolders.length > 0) {
      if (!onboarded) setOnboarded(true);
      setShowPresetPicker(false);
      return;
    }

    if (!onboarded && tree.length === 0) {
      setShowPresetPicker(true);
    }
  }, [isLoading, onboarded, tree.length, rootFolders.length, setOnboarded]);

  const radialLayoutConfig = useMemo(
    () => ({ folderRayLength: radialFolderRayLength }),
    [radialFolderRayLength],
  );

  const baseLayout = useMemo(
    () => buildMindMapLayout(displayTree, mindMapLayoutMode, radialLayoutConfig),
    [displayTree, mindMapLayoutMode, radialLayoutConfig],
  );

  const treeForLayout = useMemo(() => {
    if (!dragState || !dropTarget) return displayTree;
    return applyTreeMove(
      displayTree,
      dragState.nodeId,
      dropTarget.parentId,
      dropTarget.sortIndex,
    );
  }, [displayTree, dragState, dropTarget]);

  const layout = useMemo(
    () => buildMindMapLayout(treeForLayout, mindMapLayoutMode, radialLayoutConfig),
    [treeForLayout, mindMapLayoutMode, radialLayoutConfig],
  );

  const minFolderRayLength = layout.minFolderRayLength ?? 200;
  const activeFolderRayLength = layout.folderRayLength ?? minFolderRayLength;
  const maxFolderRayLength = minFolderRayLength * 2;

  useEffect(() => {
    if (mindMapLayoutMode !== 'radial') return;
    if (radialFolderRayLength == null) return;
    const clamped = Math.min(maxFolderRayLength, Math.max(minFolderRayLength, radialFolderRayLength));
    if (clamped !== radialFolderRayLength) {
      setRadialFolderRayLength(clamped);
    }
  }, [
    mindMapLayoutMode,
    minFolderRayLength,
    maxFolderRayLength,
    radialFolderRayLength,
    setRadialFolderRayLength,
  ]);

  useEffect(() => {
    if (!canvasSettingsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (settingsRef.current?.contains(target)) return;
      if (settingsPanelRef.current?.contains(target)) return;
      setCanvasSettingsOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    return () => window.removeEventListener('pointerdown', handlePointerDown, true);
  }, [canvasSettingsOpen]);

  const draggedNode = dragState
    ? flat.find((n) => n.id === dragState.nodeId) ?? null
    : null;

  const canDeleteNode = useCallback((node: TreeNode) => {
    if (node.type === 'DOCUMENT') return true;
    return node.children.length === 0;
  }, []);

  const flashTrashDenied = useCallback(() => {
    setTrashDenied(true);
    window.setTimeout(() => setTrashDenied(false), 550);
  }, []);

  const beginDeleteAnimation = useCallback(
    (node: TreeNode, box: { left: number; top: number; width: number; height: number }) => {
      if (!canDeleteNode(node)) {
        flashTrashDenied();
        return;
      }

      const trash = trashRef.current;
      const container = containerRef.current;
      if (!trash || !container) return;

      // Remove from tree immediately so the node does not reappear after animation
      removeNodeLocal(node.id);
      setNodeOrder(
        removeFromOrderMap(useVaultStore.getState().nodeOrder, node.id),
      );
      if (node.parentId === null) {
        const remaining = useVaultStore
          .getState()
          .tree.filter((r) => r.type === 'FOLDER' && r.id !== node.id);
        setActiveRootId(remaining[0]?.id ?? null);
      }
      if (selectedNodeId === node.id) selectNode(null);

      const target = trashTargetInContainer(trash, container, box.width, box.height);
      const pending: PendingDelete = {
        nodeId: node.id,
        node,
        documentId: docByNode[node.id]?.id,
        startLeft: box.left,
        startTop: box.top,
        startWidth: box.width,
        startHeight: box.height,
        targetLeft: target.left,
        targetTop: target.top,
      };

      pendingDeleteRef.current = pending;
      setPendingDelete(pending);
      setContextMenu(null);
    },
    [
      canDeleteNode,
      flashTrashDenied,
      docByNode,
      removeNodeLocal,
      setNodeOrder,
      setActiveRootId,
      selectedNodeId,
      selectNode,
    ],
  );

  const handleDeleteFlyComplete = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;

    pendingDeleteRef.current = null;
    setPendingDelete(null);

    if (pending.documentId) {
      deleteDocument.mutate(pending.documentId);
    } else {
      deleteFolder.mutate(pending.nodeId);
    }
  }, [deleteDocument, deleteFolder]);

  const requestDelete = useCallback(
    (nodeId: string) => {
      if (isPendingNodeId(nodeId)) {
        removeNodeLocal(nodeId);
        if (selectedNodeId === nodeId) selectNode(null);
        return;
      }

      const node = flat.find((n) => n.id === nodeId);
      if (!node) return;

      const box =
        nodeViewportBox(nodeId, baseLayout.nodes, canvas) ??
        (dragState?.nodeId === nodeId
          ? {
              left: canvas.x + dragState.canvasX * canvas.scale,
              top: canvas.y + dragState.canvasY * canvas.scale,
              width: NODE_WIDTH * canvas.scale,
              height: NODE_HEIGHT * canvas.scale,
            }
          : null);

      if (!box) return;
      beginDeleteAnimation(node, box);
    },
    [flat, baseLayout.nodes, canvas, dragState, beginDeleteAnimation, removeNodeLocal, selectedNodeId, selectNode],
  );

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState || !draggedNode || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const point = canvasPointFromClient(
        clientX,
        clientY,
        rect,
        canvas.x,
        canvas.y,
        canvas.scale,
      );

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              canvasX: point.x - prev.offsetX,
              canvasY: point.y - prev.offsetY,
            }
          : null,
      );

      const trashEl = trashRef.current;
      if (trashEl && isOverTrash(clientX, clientY, trashEl)) {
        setDragToTrash(true);
        setDropTarget(null);
        return;
      }

      setDragToTrash(false);
      const target = resolveDragDropTarget(
        point,
        draggedNode,
        baseLayout.nodes,
        displayTree,
        mindMapLayoutMode,
      );
      setDropTarget(target);
    },
    [dragState, draggedNode, canvas.x, canvas.y, canvas.scale, baseLayout.nodes, displayTree, mindMapLayoutMode],
  );

  const finishDrag = useCallback(async () => {
    if (!dragState || !draggedNode) {
      setDragState(null);
      setDropTarget(null);
      setDragToTrash(false);
      return;
    }

    if (dragToTrash) {
      const box = {
        left: canvas.x + dragState.canvasX * canvas.scale,
        top: canvas.y + dragState.canvasY * canvas.scale,
        width: NODE_WIDTH * canvas.scale,
        height: NODE_HEIGHT * canvas.scale,
      };
      setDragState(null);
      setDropTarget(null);
      setDragToTrash(false);
      beginDeleteAnimation(draggedNode, box);
      return;
    }

    if (!dropTarget) {
      setDragState(null);
      setDragToTrash(false);
      return;
    }

    const sameParent = draggedNode.parentId === dropTarget.parentId;
    const currentIndex = getSiblingIndex(displayTree, dragState.nodeId, draggedNode.parentId);
    const unchanged = sameParent && dropTarget.sortIndex === currentIndex;

    if (!unchanged) {
      if (sameParent) {
        reorderNodeLocal(dragState.nodeId, dropTarget.parentId, dropTarget.sortIndex);
      } else {
        moveNodeLocal(
          dragState.nodeId,
          draggedNode.parentId,
          dropTarget.parentId,
          dropTarget.sortIndex,
        );
        moveNode.mutate({
          id: dragState.nodeId,
          parentId: dropTarget.parentId,
        });
      }
    }

    setDragState(null);
    setDropTarget(null);
    setDragToTrash(false);
  }, [
    dragState,
    dropTarget,
    draggedNode,
    dragToTrash,
    canvas,
    displayTree,
    reorderNodeLocal,
    moveNodeLocal,
    moveNode,
    beginDeleteAnimation,
  ]);

  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: PointerEvent) => updateDrag(e.clientX, e.clientY);
    const onUp = () => finishDrag();

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, updateDrag, finishDrag]);

  const startNodeDrag = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const positioned = baseLayout.nodes.find((n) => n.id === nodeId);
      if (!positioned) return;

      const rect = containerRef.current.getBoundingClientRect();
      const point = canvasPointFromClient(
        clientX,
        clientY,
        rect,
        canvas.x,
        canvas.y,
        canvas.scale,
      );
      const dragged = flat.find((n) => n.id === nodeId);
      if (!dragged) return;

      const offsetX = point.x - positioned.x;
      const offsetY = point.y - positioned.y;

      setDragState({
        nodeId,
        canvasX: positioned.x,
        canvasY: positioned.y,
        offsetX,
        offsetY,
      });
      setDropTarget(
        resolveDragDropTarget(point, dragged, baseLayout.nodes, displayTree, mindMapLayoutMode),
      );
    },
    [baseLayout.nodes, canvas.x, canvas.y, canvas.scale, displayTree, flat, mindMapLayoutMode],
  );

  const handleAddRoot = () => {
    setRootNameDialogOpen(true);
  };

  const handleConfirmRootName = (name: string) => {
    createFolder.mutate(
      { name, parentId: null },
      {
        onSuccess: (created) => {
          setActiveRootId(created.id);
          setCanvas({ x: 0, y: 0, scale: 1 });
        },
      },
    );
  };

  const handlePreset = (preset: VaultPreset) => {
    createFolder.mutate(
      { name: preset.rootName, parentId: null },
      {
        onSuccess: (created) => {
          setPresetId(preset.id);
          setActiveRootId(created.id);
          if (preset.id === 'health') setHealthViewMode('body');
          setOnboarded(true);
          setShowPresetPicker(false);
        },
      },
    );
  };

  const handleSkipPreset = () => {
    setOnboarded(true);
    setShowPresetPicker(false);
  };

  const startChildFolder = useCallback(
    (parentId: string) => {
      const parent = flat.find((n) => n.id === parentId);
      if (!parent || parent.type !== 'FOLDER') return;

      const suggested = suggestChildFolderName(parent.name, parent.children);
      const pending = createPendingFolder(parentId);
      setPendingDefaultNames((prev) => ({ ...prev, [pending.id]: suggested }));
      addPendingFolder(parentId, pending);
      setRenamingNodeId(pending.id);
      selectNode(pending.id);
      setContextMenu(null);
    },
    [flat, addPendingFolder, selectNode, setRenamingNodeId],
  );

  const clearPendingDefaultName = useCallback((nodeId: string) => {
    setPendingDefaultNames((prev) => {
      if (!prev[nodeId]) return prev;
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
  }, []);

  const handleCommitRename = useCallback(
    (nodeId: string, name: string) => {
      const trimmed = name.trim();
      const node = flat.find((n) => n.id === nodeId);
      if (!node) return;

      setRenamingNodeId(null);

      if (isPendingNodeId(nodeId)) {
        const defaultName = pendingDefaultNames[nodeId] ?? '';
        const finalName = trimmed || defaultName;
        clearPendingDefaultName(nodeId);

        if (!finalName) {
          removeNodeLocal(nodeId);
          if (selectedNodeId === nodeId) selectNode(null);
          return;
        }
        renameNodeLocal(nodeId, finalName);
        selectNode(nodeId);
        createFolder.mutate({
          name: finalName,
          parentId: node.parentId,
          tempId: nodeId,
        });
        return;
      }

      if (!trimmed || trimmed === node.name) return;
      renameNodeLocal(nodeId, trimmed);
      renameNode.mutate({ id: nodeId, name: trimmed });
    },
    [
      flat,
      pendingDefaultNames,
      clearPendingDefaultName,
      selectedNodeId,
      removeNodeLocal,
      renameNodeLocal,
      selectNode,
      setRenamingNodeId,
      createFolder,
      renameNode,
    ],
  );

  const handleCancelRename = useCallback(
    (nodeId: string) => {
      setRenamingNodeId(null);
      if (isPendingNodeId(nodeId)) {
        clearPendingDefaultName(nodeId);
        removeNodeLocal(nodeId);
        if (selectedNodeId === nodeId) selectNode(null);
      }
    },
    [clearPendingDefaultName, removeNodeLocal, selectedNodeId, selectNode, setRenamingNodeId],
  );

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const currentScale = useVaultStore.getState().canvas.scale;
      const next = Math.min(2, Math.max(0.35, currentScale + delta));
      setCanvas({ scale: next });
    },
    [setCanvas],
  );

  useEffect(() => {
    const viewport = containerRef.current;
    if (!viewport || showHealthBody) return;

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [onWheel, showHealthBody]);

  const handleCreateHealthFolder = async (name: string) => {
    if (!activeRoot) return;
    const created = await createFolder.mutateAsync({ name, parentId: activeRoot.id });
    selectNode(created.id);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (showHealthBody || dragState) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-mind-node]')) return;
    if (target.closest('[data-canvas-control]')) return;
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

  const resolveDropTarget = useCallback((): DropTarget | null => {
    if (selectedNodeId) {
      const selected = flat.find((n) => n.id === selectedNodeId);
      if (selected?.type === 'FOLDER') {
        return { kind: 'folder', nodeId: selected.id };
      }
    }
    if (activeRoot) {
      return { kind: 'folder', nodeId: activeRoot.id };
    }
    return { kind: 'content', folderId: null };
  }, [activeRoot, flat, selectedNodeId]);

  const dropTargetLabel = useMemo(() => {
    const target = resolveDropTarget();
    if (!target) return t('common.archive');
    if (target.kind === 'folder') {
      return flat.find((n) => n.id === target.nodeId)?.name ?? t('common.folder');
    }
    return t('common.root');
  }, [flat, resolveDropTarget]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setCanvasDragOver(true);
  }, []);

  const handleCanvasDragLeave = useCallback((e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setCanvasDragOver(false);
  }, []);

  const handleCanvasDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setCanvasDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (!files.length) return;

      const target = resolveDropTarget();
      if (!target) return;

      setUploading(true);
      setDropHint(null);
      try {
        const mode = await handleFileDrop(files, target, onAiImportFile, onUploadFiles);
        if (mode === 'unsupported') {
          setDropHint(AI_IMPORT_UNSUPPORTED_HINT);
          window.setTimeout(() => setDropHint(null), 4000);
        }
      } finally {
        setUploading(false);
      }
    },
    [onAiImportFile, onUploadFiles, resolveDropTarget],
  );

  return (
    <>
      {showPresetPicker && (
        <PresetPicker onSelect={handlePreset} onSkip={handleSkipPreset} />
      )}

      <NameDialog
        open={rootNameDialogOpen}
        onClose={() => setRootNameDialogOpen(false)}
        onConfirm={handleConfirmRootName}
        title={t('vault.rootBranchTitle')}
        description={t('vault.rootBranchDescription')}
        placeholder={t('vault.rootBranchPlaceholder')}
        suggestions={[...en.vault.rootBranchSuggestions]}
        existingNames={rootFolders.map((r) => r.name)}
        checkDuplicates
      />

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
          onAddRoot={() => {
            setShowRootMap(false);
            handleAddRoot();
          }}
          onClose={() => setShowRootMap(false)}
        />
      )}

      <div className="relative flex h-full flex-col overflow-hidden bg-[var(--color-canvas)]">
        <CanvasToolbar
          activeRootName={activeRoot?.name}
          rootCount={rootFolders.length}
          isHealthRoot={isHealthRoot}
          healthViewMode={healthViewMode}
          mindMapLayoutMode={mindMapLayoutMode}
          onToggleMindMapLayout={toggleMindMapLayoutMode}
          onToggleHealthView={() =>
            setHealthViewMode(healthViewMode === 'body' ? 'tree' : 'body')
          }
          onOpenMap={() => setShowRootMap(true)}
          onAddRoot={handleAddRoot}
        />

        {showHealthBody ? (
          <HealthBodyCanvas
            root={activeRoot}
            documents={documents}
            onCreateFolder={handleCreateHealthFolder}
            onSelectFolder={(id) => {
              selectNode(id);
              setHealthViewMode('tree');
            }}
            onSwitchToTree={() => setHealthViewMode('tree')}
          />
        ) : (
        <>
        <div
          ref={containerRef}
          className={cn(
            'mind-map-viewport relative flex-1 overflow-hidden',
            isPanning && 'cursor-grabbing',
            !isPanning && !canvasDragOver && 'cursor-grab',
            canvasDragOver && 'ring-2 ring-inset ring-[var(--color-accent)]/40',
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
        >
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${canvas.x}px, ${canvas.y}px) scale(${canvas.scale})`,
              width: layout.width,
              height: layout.height,
            }}
          >
            <MindMapEdges
              width={layout.width}
              height={layout.height}
              edges={layout.edges}
              mode={mindMapLayoutMode}
            />

            {dragState && dropTarget && draggedNode && (
              <motion.div
                className="absolute rounded-2xl border-2 border-dashed border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)]/40"
                style={{
                  left: insertionPlaceholderX(
                    dropTarget.parentId,
                    layout.nodes,
                    mindMapLayoutMode,
                    dropTarget.sortIndex,
                    dragState.nodeId,
                  ),
                  top: insertionPlaceholderY(
                    dropTarget.parentId,
                    dropTarget.sortIndex,
                    layout.nodes,
                    dragState.nodeId,
                    mindMapLayoutMode,
                  ),
                  width: NODE_WIDTH,
                  height: SUGGESTION_SLOT_HEIGHT,
                }}
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}

            {layout.nodes.map(({ id, node, x, y }) => {
              if (dragState?.nodeId === id || pendingDelete?.nodeId === id) return null;

              return (
              <MindMapNodeCard
                key={id}
                node={node}
                document={docByNode[node.id]}
                x={x}
                y={y}
                selected={selectedNodeId === id}
                renaming={renamingNodeId === id || isPendingNodeId(id)}
                showMenu={contextMenu === id}
                defaultFolderName={pendingDefaultNames[id]}
                isDragTarget={
                  dropTarget?.parentId === id &&
                  draggedNode != null &&
                  draggedNode.id !== id
                }
                onSelect={() => {
                  const doc = docByNode[node.id];
                  selectNode(id, doc?.id ?? null);
                }}
                onRename={(name) => handleCommitRename(id, name)}
                onCancelRename={() => handleCancelRename(id)}
                onStartRename={() => setRenamingNodeId(id)}
                onDelete={() => requestDelete(id)}
                onContextMenu={() => setContextMenu(id)}
                onCloseMenu={() => setContextMenu(null)}
                onUpload={async (files) => {
                  if (isPendingNodeId(node.id) || docByNode[node.id]) return;
                  const target = { kind: 'folder' as const, nodeId: node.id };
                  setUploading(true);
                  setDropHint(null);
                  try {
                    const mode = await handleFileDrop(files, target, onAiImportFile, onUploadFiles);
                    if (mode === 'unsupported') {
                      setDropHint(AI_IMPORT_UNSUPPORTED_HINT);
                      window.setTimeout(() => setDropHint(null), 4000);
                    }
                  } finally {
                    setUploading(false);
                  }
                }}
                onStartDrag={(clientX, clientY) => startNodeDrag(id, clientX, clientY)}
                onAddChild={
                  node.type === 'FOLDER' && !isPendingNodeId(id)
                    ? () => startChildFolder(id)
                    : undefined
                }
              />
              );
            })}

            {dragState && draggedNode && !pendingDelete && (
              <MindMapNodeCard
                node={draggedNode}
                document={docByNode[draggedNode.id]}
                x={dragState.canvasX}
                y={dragState.canvasY}
                selected
                renaming={false}
                showMenu={false}
                isDragging
                onSelect={() => {}}
                onRename={() => {}}
                onStartRename={() => {}}
                onDelete={() => {}}
                onContextMenu={() => {}}
                onCloseMenu={() => {}}
                onUpload={() => {}}
                onStartDrag={() => {}}
                onCancelRename={() => {}}
              />
            )}

            {displayTree.length === 0 && onboarded && (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ width: 320 }}
              >
                <p className="text-lg font-medium">{t('vault.emptyCanvas')}</p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {t('vault.emptyCanvasHint')}
                </p>
              </div>
            )}
          </div>

          {canvasDragOver && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-accent)]/10 backdrop-blur-[1px]">
              <div className="rounded-2xl border border-[var(--color-accent)] bg-[var(--color-surface)] px-6 py-4 text-sm shadow-lg">
                {t('vault.dropForAiImport', { target: dropTargetLabel })}
              </div>
            </div>
          )}

          {dropHint && (
            <div className="pointer-events-none absolute bottom-24 left-1/2 z-40 -translate-x-1/2">
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow-lg dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-200">
                {dropHint}
              </div>
            </div>
          )}

          {uploading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="rounded-xl bg-[var(--color-surface)] px-6 py-3 text-sm shadow-lg">
                {t('common.loading')}
              </div>
            </div>
          )}

          <MindMapTrashZone
            trashRef={trashRef}
            active={dragToTrash}
            denied={trashDenied}
          />

          {!showHealthBody && (
            <>
              <MindMapCanvasSettingsButton
                open={canvasSettingsOpen}
                settingsRef={settingsRef}
                onToggle={() => setCanvasSettingsOpen((open) => !open)}
              />
              <div ref={settingsPanelRef}>
                <MindMapCanvasSettingsPanel
                  open={canvasSettingsOpen}
                  scale={canvas.scale}
                  mindMapLayoutMode={mindMapLayoutMode}
                  folderRayLength={activeFolderRayLength}
                  minFolderRayLength={minFolderRayLength}
                  maxFolderRayLength={maxFolderRayLength}
                  onZoomIn={() => setCanvas({ scale: Math.min(2, canvas.scale + 0.1) })}
                  onZoomOut={() => setCanvas({ scale: Math.max(0.35, canvas.scale - 0.1) })}
                  onFolderRayLengthChange={setRadialFolderRayLength}
                  onReset={() => {
                    resetCanvasView();
                    setCanvasSettingsOpen(false);
                  }}
                />
              </div>
            </>
          )}

          {pendingDelete && (
            <MindMapDeleteFly
              node={pendingDelete.node}
              startLeft={pendingDelete.startLeft}
              startTop={pendingDelete.startTop}
              startWidth={pendingDelete.startWidth}
              startHeight={pendingDelete.startHeight}
              targetLeft={pendingDelete.targetLeft}
              targetTop={pendingDelete.targetTop}
              onComplete={handleDeleteFlyComplete}
            />
          )}
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)]">
          {t('vault.canvasHint')}
        </div>
        </>
        )}
      </div>
    </>
  );
}

function getSiblingIndex(
  roots: TreeNode[],
  nodeId: string,
  parentId: string | null,
): number {
  const siblings =
    parentId === null ? roots : (findNode(roots, parentId)?.children ?? []);
  return siblings.findIndex((n) => n.id === nodeId);
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
  isHealthRoot,
  healthViewMode,
  mindMapLayoutMode,
  onToggleMindMapLayout,
  onToggleHealthView,
  onOpenMap,
  onAddRoot,
}: {
  activeRootName?: string;
  rootCount: number;
  isHealthRoot?: boolean;
  healthViewMode?: 'body' | 'tree';
  mindMapLayoutMode?: 'classic' | 'radial';
  onToggleMindMapLayout?: () => void;
  onToggleHealthView?: () => void;
  onOpenMap: () => void;
  onAddRoot: () => void;
}) {
  const isRadial = mindMapLayoutMode === 'radial';

  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-2 backdrop-blur">
      <button
        type="button"
        onClick={onAddRoot}
        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm text-[var(--color-accent)]"
      >
        <Plus size={14} /> {t('vault.rootBranch')}
      </button>
      {activeRootName && (
        <span className="hidden truncate text-sm text-[var(--color-muted)] sm:inline">
          {activeRootName}
        </span>
      )}
      {isHealthRoot && onToggleHealthView && (
        <button
          type="button"
          onClick={onToggleHealthView}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition',
            healthViewMode === 'body'
              ? 'bg-cyan-950/80 text-cyan-300 ring-1 ring-cyan-500/40'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
          )}
          title={healthViewMode === 'body' ? t('common.xray') : t('common.bodyMap')}
        >
          <Activity size={14} />
          <span className="hidden sm:inline">
            {healthViewMode === 'body' ? t('common.bodyMap') : t('common.xray')}
          </span>
        </button>
      )}
      <div className="ml-auto flex items-center gap-1">
        {onToggleMindMapLayout && (
          <button
            type="button"
            onClick={onToggleMindMapLayout}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition',
              isRadial
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
            )}
            title={isRadial ? t('common.rays') : t('common.tree')}
          >
            {isRadial ? <Sun size={14} /> : <TreePine size={14} />}
            <span className="hidden sm:inline">
              {isRadial ? t('common.rays') : t('common.tree')}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onOpenMap}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          title={t('vault.rootBranches')}
        >
          <Map size={14} />
          <span className="hidden sm:inline">{t('common.map')}</span>
          {rootCount > 1 && (
            <span className="rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
              {rootCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

interface MindMapNodeCardProps {
  node: TreeNode;
  document?: { id: string; title: string; mimeType?: string | null };
  x: number;
  y: number;
  selected: boolean;
  renaming: boolean;
  showMenu: boolean;
  isDragging?: boolean;
  isDragTarget?: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onStartRename: () => void;
  onDelete: () => void;
  onContextMenu: () => void;
  onCloseMenu: () => void;
  onUpload: (files: File[]) => void;
  onStartDrag: (clientX: number, clientY: number) => void;
  onAddChild?: () => void;
  defaultFolderName?: string;
}

function MindMapNodeCard({
  node,
  document,
  x,
  y,
  selected,
  renaming,
  showMenu,
  isDragging = false,
  isDragTarget = false,
  onSelect,
  onRename,
  onCancelRename,
  onStartRename,
  onDelete,
  onContextMenu,
  onCloseMenu,
  onUpload,
  onStartDrag,
  onAddChild,
  defaultFolderName,
}: MindMapNodeCardProps) {
  const isFolder = node.type === 'FOLDER';
  const isPending = isPendingNodeId(node.id);
  const isEditing = renaming || isPending;
  const [name, setName] = useState(node.name);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    setName(node.name);
  }, [node.name]);

  useEffect(() => {
    if (!isEditing) return;
    committedRef.current = false;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (!isPending) {
      input.select();
    }
  }, [isEditing, node.id, isPending]);

  const placeholderName = defaultFolderName ?? t('vault.defaultFolderName');

  const commitRename = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    onRename(name);
  };

  return (
    <motion.div
      data-mind-node
      layout={!isDragging}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.95 : 1,
        scale: isDragging ? 1.03 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      style={{
        left: x,
        top: y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        zIndex: isDragging ? 40 : isEditing ? 35 : undefined,
      }}
      className={cn(
        'absolute group',
        dragOver && 'drop-active',
        isDragging && 'pointer-events-none shadow-xl ring-2 ring-[var(--color-accent)]/40',
        isDragTarget && 'ring-2 ring-[var(--color-accent)]/30',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        onUpload(Array.from(e.dataTransfer.files));
      }}
    >
      {onAddChild && (
        <div
          className="absolute top-[18px] left-full z-20 flex items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ pointerEvents: 'none' }}
        >
          <div className="h-px w-7 origin-left -rotate-[18deg] bg-[var(--color-border)]" />
          <button
            type="button"
            title={t('common.newBranch')}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] shadow-md transition hover:scale-105 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAddChild();
            }}
          >
            <FolderPlus size={15} />
          </button>
        </div>
      )}

      <div
        className={cn(
          'flex h-full items-center gap-2 rounded-2xl border px-3 shadow-sm transition',
          isFolder
            ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface-2)]',
          selected && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/25',
          isPending && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20',
          node.parentId === null && isFolder && 'rounded-full px-5',
        )}
      >
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-[var(--color-muted)] opacity-0 transition hover:bg-[var(--color-surface-2)] group-hover:opacity-100"
          title={t('vault.dragToReorder')}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartDrag(e.clientX, e.clientY);
          }}
        >
          <GripVertical size={14} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isFolder ? (
            <Folder size={16} className="shrink-0 text-[var(--color-accent)]" />
          ) : (
            <FileTypeIcon
              mimeType={document?.mimeType}
              filename={document?.title ?? node.name}
              size={18}
            />
          )}
          {isEditing ? (
            <div className="relative min-w-0 flex-1">
              {!name.trim() && (
                <span
                  className="pointer-events-none absolute inset-0 truncate px-1 text-sm text-[var(--color-muted)]/55"
                  aria-hidden
                >
                  {placeholderName}
                </span>
              )}
              <input
                ref={inputRef}
                className="relative z-[1] w-full rounded border border-[var(--color-accent)]/40 bg-transparent px-1 text-sm outline-none ring-2 ring-[var(--color-accent)]/15"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    committedRef.current = true;
                    onCancelRename();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-sm font-medium"
              onClick={onSelect}
            >
              {node.name}
            </button>
          )}
        </div>

        {!isEditing && (
          <button
            type="button"
            className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-2)]"
            onClick={onContextMenu}
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>

      {showMenu && !isEditing && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[150px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
            onClick={() => {
              onStartRename();
              onCloseMenu();
            }}
          >
            <Pencil size={14} /> {t('common.rename')}
          </button>
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]">
            <Upload size={14} /> {t('common.uploadFile')}
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
            <Trash2 size={14} /> {t('common.delete')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
