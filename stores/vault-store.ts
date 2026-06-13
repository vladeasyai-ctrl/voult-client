'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Document, TreeNode } from '@/lib/types';

interface VaultState {
  tree: TreeNode[];
  documents: Document[];
  selectedFolderId: string | null;
  selectedNodeId: string | null;
  selectedDocumentId: string | null;
  rightPanelOpen: boolean;
  renamingNodeId: string | null;
  presetId: string | null;
  onboarded: boolean;
  activeRootId: string | null;
  canvas: { x: number; y: number; scale: number };
  setTree: (tree: TreeNode[]) => void;
  setDocuments: (documents: Document[]) => void;
  selectFolder: (id: string | null) => void;
  selectNode: (nodeId: string | null, documentId?: string | null) => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setRenamingNodeId: (id: string | null) => void;
  setPresetId: (id: string | null) => void;
  setOnboarded: (value: boolean) => void;
  setActiveRootId: (id: string | null) => void;
  setCanvas: (canvas: Partial<{ x: number; y: number; scale: number }>) => void;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set) => ({
      tree: [],
      documents: [],
      selectedFolderId: null,
      selectedNodeId: null,
      selectedDocumentId: null,
      rightPanelOpen: true,
      renamingNodeId: null,
      presetId: null,
      onboarded: false,
      activeRootId: null,
      canvas: { x: 0, y: 0, scale: 1 },
      setTree: (tree) => set({ tree }),
      setDocuments: (documents) => set({ documents }),
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
      setActiveRootId: (id) => set({ activeRootId: id }),
      setCanvas: (canvas) =>
        set((s) => ({ canvas: { ...s.canvas, ...canvas } })),
    }),
    {
      name: 'vault-ui',
      partialize: (s) => ({
        rightPanelOpen: s.rightPanelOpen,
        presetId: s.presetId,
        onboarded: s.onboarded,
        activeRootId: s.activeRootId,
        canvas: s.canvas,
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
      theme: 'light',
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
