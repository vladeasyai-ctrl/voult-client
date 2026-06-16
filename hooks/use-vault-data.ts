'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { useVaultStore } from '@/stores/vault-store';

export function useVaultData() {
  const queryClient = useQueryClient();
  const setTree = useVaultStore((s) => s.setTree);
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
    if (treeQuery.data) setTree(treeQuery.data);
  }, [treeQuery.data, setTree]);

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

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tree'] });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  const createFolder = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId: string | null }) =>
      api.createFolder(name, parentId),
    onSuccess: invalidate,
  });

  const renameNode = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameNode(id, name),
    onSuccess: invalidate,
  });

  const moveNode = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      api.moveNode(id, parentId),
    onSuccess: invalidate,
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: invalidate,
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: invalidate,
  });

  return {
    createFolder,
    renameNode,
    moveNode,
    deleteFolder,
    deleteDocument,
    invalidate,
  };
}
