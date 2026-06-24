'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isVaultImportFile } from '@/lib/vault-import-files';
import { api } from '@/lib/api';
import type { Document, DropTarget } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';

export function useUpload() {
  const queryClient = useQueryClient();
  const { invalidate } = useVaultMutations();
  const selectNode = useVaultStore((s) => s.selectNode);
  const upsertDocument = useVaultStore((s) => s.upsertDocument);
  const setRightPanelOpen = useVaultStore((s) => s.setRightPanelOpen);
  const selectedFolderId = useVaultStore((s) => s.selectedFolderId);

  const primeDocumentPreview = useCallback(
    (doc: Document) => {
      upsertDocument(doc);
      selectNode(doc.nodeId, doc.id);
      setRightPanelOpen(true);
      void queryClient.invalidateQueries({ queryKey: ['asset', doc.assetId] });
      void queryClient.invalidateQueries({ queryKey: ['download', doc.assetId] });
    },
    [queryClient, selectNode, setRightPanelOpen, upsertDocument],
  );

  const uploadFile = useCallback(
    async (file: File, target: DropTarget, enrichWithAi = false) => {
      const asset = await api.uploadAsset(file);
      const title = file.name.replace(/\.[^.]+$/, '') || file.name;
      const parentId = target.kind === 'folder' ? target.nodeId : target.folderId;
      const shouldEnrich = enrichWithAi && isVaultImportFile(file);
      const doc = await api.createDocument(title, parentId, asset.id, undefined, shouldEnrich);
      primeDocumentPreview(doc);
      void queryClient.invalidateQueries({ queryKey: ['document', doc.id] });
      await invalidate();
      return doc;
    },
    [invalidate, primeDocumentPreview],
  );

  const uploadToTarget = useCallback(
    async (files: File[], target?: DropTarget, enrichWithAi = false) => {
      const resolved: DropTarget =
        target ?? { kind: 'content', folderId: selectedFolderId };

      for (const file of files) {
        await uploadFile(file, resolved, enrichWithAi);
      }
    },
    [selectedFolderId, uploadFile],
  );

  return { uploadFile, uploadToTarget };
}
