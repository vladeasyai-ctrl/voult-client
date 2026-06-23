'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document, Space, TreeNode } from '@/lib/types';
import type { NodeOrderMap } from '@/lib/node-order';
import {
  applyNodeOrder,
  moveInOrderMap,
  parentOrderKey,
  reorderInMap,
  syncOrderMap,
} from '@/lib/node-order';
import {
  collectPendingNodes,
  insertChild,
  mergePendingIntoTree,
  removeNodeFromTree,
  renameNodeInTree,
  replaceNodeIdInTree,
} from '@/lib/tree-mutations';

export type VaultLayoutMode = 'tree' | 'radial';

interface VaultState {
  spaces: Space[];
  tree: TreeNode[];
  documents: Document[];
  nodeOrder: NodeOrderMap;
  selectedFolderId: string | null;
  selectedNodeId: string | null;
  selectedDocumentId: string | null;
  rightPanelOpen: boolean;
  renamingNodeId: string | null;
  presetId: string | null;
  onboarded: boolean;
  activeSpaceId: string | null;
  layoutMode: VaultLayoutMode;
  canvas: { x: number; y: number; scale: number };
  setSpaces: (spaces: Space[]) => void;
  setActiveSpaceId: (id: string | null) => void;
  setTree: (tree: TreeNode[]) => void;
  setDocuments: (documents: Document[]) => void;
  setNodeOrder: (order: NodeOrderMap) => void;
  applyOrderedTree: (tree: TreeNode[]) => void;
  reorderNodeLocal: (
    nodeId: string,
    parentId: string | null,
    sortIndex: number,
  ) => void;
  moveNodeLocal: (
    nodeId: string,
    fromParentId: string | null,
    toParentId: string | null,
    sortIndex: number,
  ) => void;
  addPendingFolder: (parentId: string | null, node: TreeNode) => void;
  confirmPendingFolder: (
    tempId: string,
    real: Pick<TreeNode, 'id' | 'spaceId' | 'name' | 'parentId' | 'type' | 'createdAt' | 'updatedAt'>,
  ) => void;
  removeNodeLocal: (nodeId: string) => void;
  renameNodeLocal: (nodeId: string, name: string) => void;
  selectFolder: (id: string | null) => void;
  selectNode: (nodeId: string | null, documentId?: string | null) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setRenamingNodeId: (id: string | null) => void;
  setPresetId: (id: string | null) => void;
  setOnboarded: (value: boolean) => void;
  setLayoutMode: (mode: VaultLayoutMode) => void;
  resetCanvasView: () => void;
  setCanvas: (canvas: Partial<{ x: number; y: number; scale: number }>) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      spaces: [],
      tree: [],
      documents: [],
      nodeOrder: {},
      selectedFolderId: null,
      selectedNodeId: null,
      selectedDocumentId: null,
      rightPanelOpen: true,
      renamingNodeId: null,
      presetId: null,
      onboarded: false,
      activeSpaceId: null,
      layoutMode: 'tree',
      canvas: { x: 0, y: 0, scale: 1 },
      setSpaces: (spaces) => set({ spaces }),
      setActiveSpaceId: (id) => set({ activeSpaceId: id }),
      setTree: (tree) => set({ tree }),
      setDocuments: (documents) => set({ documents }),
      setNodeOrder: (nodeOrder) => set({ nodeOrder }),
      applyOrderedTree: (apiTree) =>
        set((s) => {
          const pending = collectPendingNodes(s.tree);
          const merged = mergePendingIntoTree(apiTree, pending);
          const synced = syncOrderMap(merged, s.nodeOrder);
          return {
            nodeOrder: synced,
            tree: applyNodeOrder(merged, synced),
          };
        }),
      reorderNodeLocal: (nodeId, parentId, sortIndex) =>
        set((s) => {
          const nodeOrder = reorderInMap(s.nodeOrder, parentId, nodeId, sortIndex);
          return {
            nodeOrder,
            tree: applyNodeOrder(s.tree, nodeOrder),
          };
        }),
      moveNodeLocal: (nodeId, fromParentId, toParentId, sortIndex) =>
        set((s) => ({
          nodeOrder: moveInOrderMap(
            s.nodeOrder,
            nodeId,
            fromParentId,
            toParentId,
            sortIndex,
          ),
        })),
      addPendingFolder: (parentId, node) =>
        set((s) => {
          const withChild = insertChild(s.tree, parentId, node);
          const key = parentOrderKey(parentId);
          const list = [...(s.nodeOrder[key] ?? []), node.id];
          const nodeOrder = { ...s.nodeOrder, [key]: list };
          return { tree: applyNodeOrder(withChild, nodeOrder), nodeOrder };
        }),
      confirmPendingFolder: (tempId, real) =>
        set((s) => {
          const replaced = replaceNodeIdInTree(s.tree, tempId, real.id, {
            ...real,
            children: [],
          });
          const nodeOrder: NodeOrderMap = {};
          for (const [key, ids] of Object.entries(s.nodeOrder)) {
            nodeOrder[key] = ids.map((id) => (id === tempId ? real.id : id));
          }
          return { tree: applyNodeOrder(replaced, nodeOrder), nodeOrder };
        }),
      removeNodeLocal: (nodeId) =>
        set((s) => {
          const nodeOrder: NodeOrderMap = {};
          for (const [key, ids] of Object.entries(s.nodeOrder)) {
            nodeOrder[key] = ids.filter((id) => id !== nodeId);
          }
          return {
            tree: applyNodeOrder(removeNodeFromTree(s.tree, nodeId), nodeOrder),
            nodeOrder,
          };
        }),
      renameNodeLocal: (nodeId, name) =>
        set((s) => ({
          tree: applyNodeOrder(renameNodeInTree(s.tree, nodeId, name), s.nodeOrder),
        })),
      selectFolder: (id) =>
        set({ selectedFolderId: id, selectedNodeId: id, selectedDocumentId: null }),
      selectNode: (nodeId, documentId = null) =>
        set({
          selectedNodeId: nodeId,
          selectedDocumentId: documentId,
          selectedFolderId: documentId ? null : nodeId,
        }),
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
      setRenamingNodeId: (id) => set({ renamingNodeId: id }),
      setPresetId: (id) => set({ presetId: id }),
      setOnboarded: (value) => set({ onboarded: value }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      resetCanvasView: () =>
        set({
          canvas: { x: 0, y: 0, scale: 1 },
        }),
      setCanvas: (canvas) =>
        set((s) => ({ canvas: { ...s.canvas, ...canvas } })),
    }),
    {
      name: 'vault-ui',
      partialize: (s) => ({
        rightPanelOpen: s.rightPanelOpen,
        presetId: s.presetId,
        onboarded: s.onboarded,
        activeSpaceId: s.activeSpaceId,
        layoutMode: s.layoutMode,
        canvas: s.canvas,
        nodeOrder: s.nodeOrder,
      }),
    },
  ),
);

interface ThemeState {
  theme: 'light' | 'dark';
  toggle: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggle: () =>
        set((s) => {
          const next = s.theme === 'light' ? 'dark' : 'light';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next === 'dark');
          }
          return { theme: next };
        }),
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        set({ theme });
      },
    }),
    { name: 'vault-theme' },
  ),
);
