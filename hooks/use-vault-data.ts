'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { documentsNeedEnrichmentPoll } from '@/lib/ai-enrichment';
import { api } from '@/lib/api';
import { useVaultStore } from '@/stores/vault-store';

const ENRICHMENT_POLL_MS = 3000;

export function useVaultData() {
  const queryClient = useQueryClient();
  const applyOrderedTree = useVaultStore((s) => s.applyOrderedTree);
  const setDocuments = useVaultStore((s) => s.setDocuments);
  const setSpaces = useVaultStore((s) => s.setSpaces);
  const activeSpaceId = useVaultStore((s) => s.activeSpaceId);
  const hasHydrated = useVaultStore((s) => s.hasHydrated);
  const setActiveSpaceId = useVaultStore((s) => s.setActiveSpaceId);

  const spacesQuery = useQuery({
    queryKey: ['spaces'],
    queryFn: api.getSpaces,
  });

  const treeQuery = useQuery({
    queryKey: ['space-tree', activeSpaceId],
    queryFn: () => api.getSpaceTree(activeSpaceId!),
    enabled: Boolean(activeSpaceId),
    refetchInterval: (query) =>
      documentsNeedEnrichmentPoll(
        queryClient.getQueryData(['documents', activeSpaceId]) as
          | Array<{ aiStatus?: string | null }>
          | undefined,
      )
        ? ENRICHMENT_POLL_MS
        : false,
  });

  const docsQuery = useQuery({
    queryKey: ['documents', activeSpaceId],
    queryFn: () => api.getDocuments(activeSpaceId!),
    enabled: Boolean(activeSpaceId),
    refetchInterval: (query) =>
      documentsNeedEnrichmentPoll(query.state.data) ? ENRICHMENT_POLL_MS : false,
  });

  useEffect(() => {
    if (!spacesQuery.data || !hasHydrated) return;

    setSpaces(spacesQuery.data);

    if (spacesQuery.data.length === 0) {
      if (activeSpaceId) setActiveSpaceId(null);
      return;
    }

    const activeExists = Boolean(
      activeSpaceId && spacesQuery.data.some((space) => space.id === activeSpaceId),
    );

    if (!activeSpaceId || !activeExists) {
      setActiveSpaceId(spacesQuery.data[0].id);
    }
  }, [spacesQuery.data, activeSpaceId, hasHydrated, setSpaces, setActiveSpaceId]);

  useEffect(() => {
    if (treeQuery.data) applyOrderedTree(treeQuery.data);
  }, [treeQuery.data, applyOrderedTree]);

  useEffect(() => {
    if (!activeSpaceId) {
      setDocuments([]);
      return;
    }
    if (docsQuery.data) setDocuments(docsQuery.data);
  }, [activeSpaceId, docsQuery.data, setDocuments]);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      queryClient.invalidateQueries({ queryKey: ['space-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
    ]);
  }, [queryClient]);

  return {
    refresh,
    isLoading:
      !hasHydrated ||
      spacesQuery.isLoading ||
      (Boolean(activeSpaceId) && treeQuery.isLoading) ||
      docsQuery.isLoading,
  };
}

export function useVaultMutations() {
  const queryClient = useQueryClient();

  const reconcileTree = () => {
    queryClient.invalidateQueries({ queryKey: ['space-tree'] });
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
  };

  const invalidate = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['space-tree'] }),
      queryClient.invalidateQueries({ queryKey: ['spaces'] }),
      queryClient.invalidateQueries({ queryKey: ['documents'] }),
    ]);
  }, [queryClient]);

  const createFolder = useMutation({
    mutationFn: ({
      name,
      spaceId,
      parentId,
      iconKey,
      color,
      description,
    }: {
      name: string;
      spaceId: string;
      parentId: string | null;
      tempId?: string;
      iconKey?: string;
      color?: string;
      description?: string;
    }) =>
      api.createFolder(name, spaceId, parentId, { iconKey, color, description }),
    onSuccess: (data, variables) => {
      if (variables.tempId) {
        useVaultStore.getState().confirmPendingFolder(variables.tempId, {
          id: data.id,
          spaceId: data.spaceId,
          name: data.name,
          parentId: data.parentId,
          type: 'FOLDER',
          iconKey: data.iconKey,
          color: data.color,
          description: data.description,
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

  const updateFolder = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      name?: string;
      iconKey?: string;
      color?: string;
      description?: string | null;
    }) => api.updateNode(id, payload),
    onMutate: ({ id, ...payload }) => {
      useVaultStore.getState().updateNodeLocal(id, payload);
    },
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

  const deleteSpace = useMutation({
    mutationFn: (id: string) => api.deleteSpace(id),
    onSettled: () => {
      reconcileTree();
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    createFolder,
    renameNode,
    updateFolder,
    moveNode,
    deleteFolder,
    deleteDocument,
    deleteSpace,
    invalidate,
  };
}
