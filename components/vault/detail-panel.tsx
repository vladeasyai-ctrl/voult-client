'use client';

import { useVaultStore } from '@/stores/vault-store';
import { DocumentPanel } from '@/components/vault/document-panel';
import { FolderPanel } from '@/components/vault/folder-panel';

export function DetailPanel() {
  const selectedDocumentId = useVaultStore((s) => s.selectedDocumentId);

  if (selectedDocumentId) {
    return <DocumentPanel />;
  }

  return <FolderPanel />;
}
