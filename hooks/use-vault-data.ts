'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useVaultStore } from '@/stores/vault-store';

export function useVaultData() {
  const queryClient = useQueryClient();
  const applyOrderedTree = useVaultStore((s) => s.applyOrderedTree);
  const setDocuments = useVaultStore((s) => s.setDocuments);

  const treeQuery = useQuery({
    queryKey: ['tree'],
    queryFn: api.getTree,
  });

  const docsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: api.getDocuments,
  });

  useEffect(() => {
    if (treeQuery.data) applyOrderedTree(treeQuery.data);
  }, [treeQuery.data, applyOrderedTree]);

  useEffect(() => {
    if (docsQuery.data) setDocuments(docsQuery.data);
  }, [docsQuery.data, setDocuments]);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tree'] }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
    ]);
  }, [queryClient]);

  return {
    refresh,
    isLoading: treeQuery.isLoading || docsQuery.isLoading,
  };
}

export function useVaultMutations() {
  const queryClient = useQueryClient();

  const reconcileTree = () => {
    queryClient.invalidateQueries({ queryKey: ['tree'] });
  };

  const createFolder = useMutation({
    mutationFn: ({
      name,
      parentId,
    }: {
      name: string;
      parentId: string | null;
      tempId?: string;
    }) => api.createFolder(name, parentId),
    onSuccess: (data, variables) => {
      if (variables.tempId) {
        useVaultStore.getState().confirmPendingFolder(variables.tempId, {
          id: data.id,
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
