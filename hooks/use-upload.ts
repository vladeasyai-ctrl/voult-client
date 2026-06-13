'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api';
import type { DropTarget } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';

export function useUpload() {
  const { invalidate } = useVaultMutations();
  const selectNode = useVaultStore((s) => s.selectNode);
  const selectedFolderId = useVaultStore((s) => s.selectedFolderId);

  const uploadFile = useCallback(
    async (file: File, target: DropTarget) => {
      const asset = await api.uploadAsset(file);
      const title = file.name.replace(/\.[^.]+$/, '') || file.name;

      if (target.kind === 'document') {
        await api.createVersion(target.documentId, asset.id);
        selectNode(target.nodeId, target.documentId);
      } else {
        const parentId = target.kind === 'folder' ? target.nodeId : target.folderId;
        const doc = await api.createDocument(title, parentId);
        await api.createVersion(doc.id, asset.id);
        selectNode(doc.nodeId, doc.id);
      }

      await invalidate();
    },
    [invalidate, selectNode],
  );

  const uploadToTarget = useCallback(
    async (files: File[], target?: DropTarget) => {
      const resolved: DropTarget =
        target ?? { kind: 'content', folderId: selectedFolderId };

      for (const file of files) {
        await uploadFile(file, resolved);
      }
    },
    [selectedFolderId, uploadFile],
  );

  return { uploadFile, uploadToTarget };
}
