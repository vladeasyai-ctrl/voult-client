'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useVaultStore } from '@/stores/vault-store';

export function useVaultData() {
  const queryClient = useQueryClient();
  const applyOrderedTree = useVaultStore((s) => s.applyOrderedTree);
  const setDocuments = useVaultStore((s) => s.setDocuments);
  const setSpaces = useVaultStore((s) => s.setSpaces);
  const activeSpaceId = useVaultStore((s) => s.activeSpaceId);
  const setActiveSpaceId = useVaultStore((s) => s.setActiveSpaceId);

  const spacesQuery = useQuery({
    queryKey: ['spaces'],
    queryFn: api.getSpaces,
  });

  const treeQuery = useQuery({
    queryKey: ['space-tree', activeSpaceId],
    queryFn: () => api.getSpaceTree(activeSpaceId!),
    enabled: Boolean(activeSpaceId),
  });

  const docsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: api.getDocuments,
  });

  useEffect(() => {
    if (!spacesQuery.data) return;
    setSpaces(spacesQuery.data);
    if (
      spacesQuery.data.length > 0 &&
      (!activeSpaceId || !spacesQuery.data.some((space) => space.id === activeSpaceId))
    ) {
      setActiveSpaceId(spacesQuery.data[0].id);
    }
    if (spacesQuery.data.length === 0 && activeSpaceId) {
      setActiveSpaceId(null);
    }
  }, [spacesQuery.data, activeSpaceId, setSpaces, setActiveSpaceId]);

  useEffect(() => {
    if (treeQuery.data) applyOrderedTree(treeQuery.data);
  }, [treeQuery.data, applyOrderedTree]);

  useEffect(() => {
    if (docsQuery.data) setDocuments(docsQuery.data);
  }, [docsQuery.data, setDocuments]);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      queryClient.invalidateQueries({ queryKey: ['space-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
    ]);
  }, [queryClient]);

  return {
    refresh,
    isLoading: spacesQuery.isLoading || treeQuery.isLoading || docsQuery.isLoading,
  };
}

export function useVaultMutations() {
  const queryClient = useQueryClient();

  const reconcileTree = () => {
    queryClient.invalidateQueries({ queryKey: ['space-tree'] });
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
  };

  const createFolder = useMutation({
    mutationFn: ({
      name,
      spaceId,
      parentId,
    }: {
      name: string;
      spaceId: string;
      parentId: string | null;
      tempId?: string;
    }) => api.createFolder(name, spaceId, parentId),
    onSuccess: (data, variables) => {
      if (variables.tempId) {
        useVaultStore.getState().confirmPendingFolder(variables.tempId, {
          id: data.id,
          spaceId: data.spaceId,
          name: data.name,
          parentId: data.parentId,
          type: 'FOLDER',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        const state = useVaultStore.getState();
        if (state.selectedNodeId === variables.tempId) {
          state.selectNode(data.id);
        }
      }
      reconcileTree();
    },
    onError: (_err, variables) => {
      if (variables.tempId) {
        useVaultStore.getState().removeNodeLocal(variables.tempId);
      }
      reconcileTree();
    },
  });

  const renameNode = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameNode(id, name),
    onError: () => reconcileTree(),
    onSettled: () => reconcileTree(),
  });

  const moveNode = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      api.moveNode(id, parentId),
    onError: () => reconcileTree(),
    onSettled: () => reconcileTree(),
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSettled: () => {
      reconcileTree();
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSettled: () => {
      reconcileTree();
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const invalidate = reconcileTree;

  return {
    createFolder,
    renameNode,
    moveNode,
    deleteFolder,
    deleteDocument,
    invalidate,
  };
}
