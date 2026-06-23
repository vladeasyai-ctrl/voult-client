'use client';

import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Folder,
  FolderPlus,
  GripVertical,
  Map,
  MoreHorizontal,
  Network,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { en } from '@/lib/i18n/en';
import { buildMindMapLayout } from '@/lib/mind-map-layout';
import { buildRadialMindMapLayout } from '@/lib/mind-map-radial-layout';
import { readMindMapNodeDims, resolveMindMapNodeWidth } from '@/lib/mind-map-node-theme';
import { getFileTypeBorderColor } from '@/lib/file-type';
import {
  canvasPointFromClient,
  insertionPlaceholderWidth,
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
import { api } from '@/lib/api';
import { flattenTree, findNode, sortTreeChildrenForDisplay } from '@/lib/tree-utils';
import type { DropTarget, TreeNode } from '@/lib/types';
import { AI_IMPORT_UNSUPPORTED_HINT, isAiImportFile } from '@/lib/ai-import';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVaultData, useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';
import type { VaultLayoutMode } from '@/stores/vault-store';
import { NameDialog } from '@/components/vault/name-dialog';
import { FileTypeIcon } from '@/components/ui/file-type-icon';
import { PresetPicker } from '@/components/vault/preset-picker';
import { SpaceMap } from '@/components/vault/space-map';
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
  onAiImportFiles?: (files: File[], target: DropTarget) => void;
}

async function handleFileDrop(
  files: File[],
  target: DropTarget,
  onAiImportFiles: MindMapCanvasProps['onAiImportFiles'],
  onUploadFiles: MindMapCanvasProps['onUploadFiles'],
): Promise<'ai' | 'upload' | 'unsupported'> {
  const importFiles = files.filter(isAiImportFile);
  if (importFiles.length > 0 && onAiImportFiles) {
    onAiImportFiles(importFiles, target);
    return 'ai';
  }
  if (files.some((f) => !isAiImportFile(f)) && importFiles.length === 0) {
    return 'unsupported';
  }
  await onUploadFiles(files, target);
  return 'upload';
}

export function MindMapCanvas({ onUploadFiles, onAiImportFiles }: MindMapCanvasProps) {
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
  const spaces = useVaultStore((s) => s.spaces);
  const activeSpaceId = useVaultStore((s) => s.activeSpaceId);
  const setActiveSpaceId = useVaultStore((s) => s.setActiveSpaceId);
  const layoutMode = useVaultStore((s) => s.layoutMode);
  const setLayoutMode = useVaultStore((s) => s.setLayoutMode);
  const resetCanvasView = useVaultStore((s) => s.resetCanvasView);
  const reorderNodeLocal = useVaultStore((s) => s.reorderNodeLocal);
  const moveNodeLocal = useVaultStore((s) => s.moveNodeLocal);
  const setNodeOrder = useVaultStore((s) => s.setNodeOrder);
  const addPendingFolder = useVaultStore((s) => s.addPendingFolder);
  const removeNodeLocal = useVaultStore((s) => s.removeNodeLocal);
  const renameNodeLocal = useVaultStore((s) => s.renameNodeLocal);

  const { isLoading } = useVaultData();
  const queryClient = useQueryClient();
  const { createFolder, renameNode, moveNode, deleteFolder, deleteDocument, invalidate } =
    useVaultMutations();

  const createSpace = useMutation({
    mutationFn: ({ name, presetId }: { name: string; presetId?: string | null }) =>
      api.createSpace(name, presetId),
    onSuccess: (space) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      setActiveSpaceId(space.id);
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [canvasDragOver, setCanvasDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dropHint, setDropHint] = useState<string | null>(null);
  const panStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [spaceNameDialogOpen, setSpaceNameDialogOpen] = useState(false);
  const [branchNameDialogOpen, setBranchNameDialogOpen] = useState(false);
  const [showSpaceMap, setShowSpaceMap] = useState(false);
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

  const nodeDims = readMindMapNodeDims();

  const activeSpace = useMemo(
    () => spaces.find((space) => space.id === activeSpaceId) ?? null,
    [spaces, activeSpaceId],
  );

  const rootBranches = useMemo(
    () => tree.filter((n) => n.type === 'FOLDER'),
    [tree],
  );

  const displayTree = tree;

  const branchCounts = useMemo(
    () =>
      Object.fromEntries(
        spaces.map((space) => [
          space.id,
          space.id === activeSpaceId ? rootBranches.length : 0,
        ]),
      ),
    [spaces, activeSpaceId, rootBranches.length],
  );

  const docByNode = useMemo(
    () => Object.fromEntries(documents.map((d) => [d.nodeId, d])),
    [documents],
  );

  const flat = useMemo(() => flattenTree(displayTree), [displayTree]);

  useEffect(() => {
    if (isLoading) return;

    if (spaces.length > 0) {
      if (!onboarded) setOnboarded(true);
      setShowPresetPicker(false);
      return;
    }

    if (!onboarded && spaces.length === 0) {
      setShowPresetPicker(true);
    }
  }, [isLoading, onboarded, spaces.length, setOnboarded]);

  const buildLayout = useCallback(
    (roots: TreeNode[]) =>
      layoutMode === 'radial'
        ? buildRadialMindMapLayout(roots)
        : buildMindMapLayout(sortTreeChildrenForDisplay(roots)),
    [layoutMode],
  );

  const baseLayout = useMemo(
    () => buildLayout(displayTree),
    [buildLayout, displayTree],
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
    () => buildLayout(treeForLayout),
    [buildLayout, treeForLayout],
  );

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
              width:
                (baseLayout.nodes.find((n) => n.id === nodeId)?.width ?? nodeDims.width) *
                canvas.scale,
              height: nodeDims.height * canvas.scale,
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
      );
      setDropTarget(target);
    },
    [dragState, draggedNode, canvas.x, canvas.y, canvas.scale, baseLayout.nodes, displayTree],
  );

  const finishDrag = useCallback(async () => {
    if (!dragState || !draggedNode) {
      setDragState(null);
      setDropTarget(null);
      setDragToTrash(false);
      return;
    }

    if (dragToTrash) {
      const draggedWidth =
        baseLayout.nodes.find((n) => n.id === dragState.nodeId)?.width ?? nodeDims.width;
      const box = {
        left: canvas.x + dragState.canvasX * canvas.scale,
        top: canvas.y + dragState.canvasY * canvas.scale,
        width: draggedWidth * canvas.scale,
        height: nodeDims.height * canvas.scale,
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
        resolveDragDropTarget(point, dragged, baseLayout.nodes, displayTree),
      );
    },
    [baseLayout.nodes, canvas.x, canvas.y, canvas.scale, displayTree, flat],
  );

  const handleAddBranch = () => {
    if (!activeSpaceId) return;
    setBranchNameDialogOpen(true);
  };

  const handleAddSpace = () => {
    setSpaceNameDialogOpen(true);
  };

  const handleConfirmBranchName = (name: string) => {
    if (!activeSpaceId) return;
    createFolder.mutate({ name, spaceId: activeSpaceId, parentId: null });
  };

  const handleConfirmSpaceName = (name: string) => {
    createSpace.mutate(
      { name },
      {
        onSuccess: () => {
          setOnboarded(true);
          setCanvas({ x: 0, y: 0, scale: 1 });
        },
      },
    );
  };

  const handlePreset = (preset: VaultPreset) => {
    createSpace.mutate(
      { name: preset.rootName, presetId: preset.id },
      {
        onSuccess: () => {
          setPresetId(preset.id);
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
      if (!activeSpaceId) return;
      const parent = flat.find((n) => n.id === parentId);
      if (!parent || parent.type !== 'FOLDER') return;

      const suggested = suggestChildFolderName(parent.name, parent.children);
      const pending = createPendingFolder(activeSpaceId ?? '', parentId);
      setPendingDefaultNames((prev) => ({ ...prev, [pending.id]: suggested }));
      addPendingFolder(parentId, pending);
      setRenamingNodeId(pending.id);
      selectNode(pending.id);
      setContextMenu(null);
    },
    [activeSpaceId, flat, addPendingFolder, selectNode, setRenamingNodeId],
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
          spaceId: node.spaceId,
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
    if (!viewport) return;

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const handleCanvasZoomIn = useCallback(() => {
    const currentScale = useVaultStore.getState().canvas.scale;
    setCanvas({ scale: Math.min(2, currentScale + 0.1) });
  }, [setCanvas]);

  const handleCanvasZoomOut = useCallback(() => {
    const currentScale = useVaultStore.getState().canvas.scale;
    setCanvas({ scale: Math.max(0.35, currentScale - 0.1) });
  }, [setCanvas]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (dragState) return;
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
    if (rootBranches.length > 0) {
      return { kind: 'folder', nodeId: rootBranches[0].id };
    }
    return { kind: 'content', folderId: null };
  }, [rootBranches, flat, selectedNodeId]);

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
        const mode = await handleFileDrop(files, target, onAiImportFiles, onUploadFiles);
        if (mode === 'unsupported') {
          setDropHint(AI_IMPORT_UNSUPPORTED_HINT);
          window.setTimeout(() => setDropHint(null), 4000);
        }
      } finally {
        setUploading(false);
      }
    },
    [onAiImportFiles, onUploadFiles, resolveDropTarget],
  );

  return (
    <>
      {showPresetPicker && (
        <PresetPicker onSelect={handlePreset} onSkip={handleSkipPreset} />
      )}

      <NameDialog
        open={spaceNameDialogOpen}
        onClose={() => setSpaceNameDialogOpen(false)}
        onConfirm={handleConfirmSpaceName}
        title={t('vault.spaceTitle')}
        description={t('vault.spaceDescription')}
        placeholder={t('vault.spacePlaceholder')}
        suggestions={[...en.vault.rootBranchSuggestions]}
        existingNames={spaces.map((space) => space.name)}
        checkDuplicates
      />

      <NameDialog
        open={branchNameDialogOpen}
        onClose={() => setBranchNameDialogOpen(false)}
        onConfirm={handleConfirmBranchName}
        title={t('vault.branchTitle')}
        description={t('vault.branchDescription')}
        placeholder={t('vault.branchPlaceholder')}
        suggestions={[...en.vault.rootBranchSuggestions]}
        existingNames={rootBranches.map((branch) => branch.name)}
        checkDuplicates
      />

      {showSpaceMap && (
        <SpaceMap
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          branchCounts={branchCounts}
          onSelect={(spaceId) => {
            setActiveSpaceId(spaceId);
            setCanvas({ x: 0, y: 0, scale: 1 });
            selectNode(null);
            setShowSpaceMap(false);
          }}
          onAddSpace={() => {
            setShowSpaceMap(false);
            handleAddSpace();
          }}
          onClose={() => setShowSpaceMap(false)}
        />
      )}

      <div className="relative flex h-full flex-col overflow-hidden bg-[var(--color-canvas)]">
        <CanvasToolbar
          activeSpaceName={activeSpace?.name}
          branchCount={rootBranches.length}
          layoutMode={layoutMode}
          onToggleLayoutMode={() =>
            setLayoutMode(layoutMode === 'tree' ? 'radial' : 'tree')
          }
          onOpenMap={() => setShowSpaceMap(true)}
          onAddBranch={handleAddBranch}
          addBranchDisabled={!activeSpaceId}
        />

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
              layoutMode={layoutMode}
            />

            {layoutMode === 'tree' && dragState && dropTarget && draggedNode && (
              <motion.div
                className="absolute rounded-2xl border-2 border-dashed border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)]/40"
                style={{
                  left: insertionPlaceholderX(
                    dropTarget.parentId,
                    layout.nodes,
                    dropTarget.sortIndex,
                  ),
                  top: insertionPlaceholderY(
                    dropTarget.parentId,
                    dropTarget.sortIndex,
                    layout.nodes,
                    dragState.nodeId,
                  ),
                  width: insertionPlaceholderWidth(
                    dropTarget.parentId,
                    dropTarget.sortIndex,
                    layout.nodes,
                  ),
                  height: SUGGESTION_SLOT_HEIGHT,
                }}
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}

            {layout.nodes.map(({ id, node, x, y, width: layoutWidth }) => {
              if (dragState?.nodeId === id || pendingDelete?.nodeId === id) return null;

              return (
              <MindMapNodeCard
                key={id}
                node={node}
                document={docByNode[node.id]}
                x={x}
                y={y}
                layoutWidth={layoutWidth}
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
                    const mode = await handleFileDrop(files, target, onAiImportFiles, onUploadFiles);
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
                layoutWidth={
                  baseLayout.nodes.find((n) => n.id === draggedNode.id)?.width ??
                  resolveMindMapNodeWidth(draggedNode.name, draggedNode.type === 'FOLDER')
                }
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

          <MindMapCanvasSettingsButton
            open={canvasSettingsOpen}
            settingsRef={settingsRef}
            onToggle={() => setCanvasSettingsOpen((open) => !open)}
          />
          <MindMapCanvasSettingsPanel
            open={canvasSettingsOpen}
            settingsPanelRef={settingsPanelRef}
            scale={canvas.scale}
            onZoomIn={handleCanvasZoomIn}
            onZoomOut={handleCanvasZoomOut}
            onReset={() => {
              resetCanvasView();
              setCanvasSettingsOpen(false);
            }}
          />

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
  spacePresetId: string | null,
): string | null {
  if (storedPresetId) return storedPresetId;
  if (spacePresetId) return spacePresetId;
  const flat = flattenTree(roots);
  let current: TreeNode | undefined = node;
  while (current?.parentId) {
    current = flat.find((n) => n.id === current!.parentId);
  }
  if (current) return findPresetByRootName(current.name)?.id ?? null;
  return null;
}

function CanvasToolbar({
  activeSpaceName,
  branchCount,
  layoutMode,
  onToggleLayoutMode,
  onOpenMap,
  onAddBranch,
  addBranchDisabled,
}: {
  activeSpaceName?: string;
  branchCount: number;
  layoutMode: VaultLayoutMode;
  onToggleLayoutMode: () => void;
  onOpenMap: () => void;
  onAddBranch: () => void;
  addBranchDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-4 py-2 backdrop-blur">
      <button
        type="button"
        onClick={onAddBranch}
        disabled={addBranchDisabled}
        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={14} /> {t('vault.branch')}
      </button>
      {activeSpaceName && (
        <span className="hidden truncate text-sm font-medium sm:inline">{activeSpaceName}</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenMap}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          title={t('vault.spaces')}
        >
          <Map size={14} />
          <span className="hidden sm:inline">{t('common.map')}</span>
          {branchCount > 0 && (
            <span className="rounded-full bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-xs text-[var(--color-accent)]">
              {branchCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onToggleLayoutMode}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition',
            layoutMode === 'radial'
              ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
          )}
          title={layoutMode === 'radial' ? t('common.tree') : t('common.radial')}
        >
          <Network size={14} />
          <span className="hidden sm:inline">
            {layoutMode === 'radial' ? t('common.tree') : t('common.radial')}
          </span>
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
  layoutWidth: number;
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
  layoutWidth,
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
  const nodeDims = readMindMapNodeDims();
  const boxWidth = isEditing
    ? resolveMindMapNodeWidth(name || placeholderName, isFolder)
    : layoutWidth;
  const fileBorderColor = !isFolder
    ? getFileTypeBorderColor(document?.mimeType, document?.title ?? node.name)
    : null;

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
        width: boxWidth,
        height: nodeDims.height,
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
          className="absolute top-1/2 left-full z-20 flex -translate-y-1/2 items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
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
          'relative flex h-full items-center rounded-2xl border shadow-sm transition',
          isFolder
            ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface-2)]',
          !isFolder && fileBorderColor && 'border-[1.5px]',
          selected && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/25',
          isPending && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20',
          node.parentId === null && isFolder && 'rounded-full',
        )}
        style={{
          padding: 'var(--mind-map-node-padding)',
          ...(!isFolder && fileBorderColor ? { borderColor: fileBorderColor } : {}),
        }}
      >
        <button
          type="button"
          className="absolute top-1/2 left-0 z-10 -translate-x-1 -translate-y-1/2 rounded p-0.5 text-[var(--color-muted)] opacity-0 transition hover:bg-[var(--color-surface-2)] group-hover:opacity-100"
          title={t('vault.dragToReorder')}
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartDrag(e.clientX, e.clientY);
          }}
        >
          <GripVertical size={14} />
        </button>

        <div
          className={cn(
            'flex min-w-0 items-center gap-1',
            isFolder ? 'flex-1 justify-center' : 'flex-1',
          )}
        >
          {isFolder ? (
            <div className="grid min-w-0 max-w-full place-items-center">
              <div className="flex min-w-0 max-w-full items-center gap-2">
                <Folder size={32} className="shrink-0 text-[var(--color-accent)]" />
                {isEditing ? (
                  <div className="relative min-w-0 max-w-full">
                    {!name.trim() && (
                      <span
                        className="pointer-events-none absolute inset-0 truncate text-center text-[var(--color-muted)]/55"
                        style={{ fontSize: 'var(--mind-map-node-font-size)', lineHeight: 1 }}
                        aria-hidden
                      >
                        {placeholderName}
                      </span>
                    )}
                    <input
                      ref={inputRef}
                      className="relative z-[1] w-full min-w-[4rem] rounded border border-[var(--color-accent)]/40 bg-transparent text-center outline-none ring-2 ring-[var(--color-accent)]/15"
                      style={{ fontSize: 'var(--mind-map-node-font-size)', lineHeight: 1 }}
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
                    className="min-w-0 max-w-full truncate text-center font-medium"
                    style={{ fontSize: 'var(--mind-map-node-font-size)', lineHeight: 1 }}
                    onClick={onSelect}
                  >
                    {node.name}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <FileTypeIcon
                mimeType={document?.mimeType}
                filename={document?.title ?? node.name}
                size={32}
              />
              {isEditing ? (
                <div className="relative min-w-0 flex-1">
                  {!name.trim() && (
                    <span
                      className="pointer-events-none absolute inset-0 truncate text-[var(--color-muted)]/55"
                      style={{ fontSize: 'var(--mind-map-node-font-size)', lineHeight: 1 }}
                      aria-hidden
                    >
                      {placeholderName}
                    </span>
                  )}
                  <input
                    ref={inputRef}
                    className="relative z-[1] w-full rounded border border-[var(--color-accent)]/40 bg-transparent outline-none ring-2 ring-[var(--color-accent)]/15"
                    style={{ fontSize: 'var(--mind-map-node-font-size)', lineHeight: 1 }}
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
                  className="min-w-0 flex-1 truncate text-left font-medium"
                  style={{ fontSize: 'var(--mind-map-node-font-size)', lineHeight: 1 }}
                  onClick={onSelect}
                >
                  {node.name}
                </button>
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <button
            type="button"
            className={cn(
              'shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-2)]',
              isFolder
                ? 'absolute top-1/2 right-[var(--mind-map-node-padding)] -translate-y-1/2'
                : '-mr-0.5',
            )}
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
