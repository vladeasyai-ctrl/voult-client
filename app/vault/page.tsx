'use client';

import { usePreventBrowserFileDrop } from '@/hooks/use-prevent-browser-file-drop';
import { useUpload } from '@/hooks/use-upload';
import { useAiImport } from '@/hooks/use-ai-import';
import { useVaultData } from '@/hooks/use-vault-data';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AiCommandBar } from '@/components/vault/ai-command-bar';
import { AiImportDialog } from '@/components/vault/ai-import-dialog';
import { CommandPalette } from '@/components/vault/command-palette';
import { TopBar } from '@/components/vault/top-bar';
import { VaultLayout } from '@/components/vault/vault-layout';
import type { DropTarget } from '@/lib/types';

export default function VaultPage() {
  const router = useRouter();
  const { refresh } = useVaultData();
  const { uploadToTarget } = useUpload();
  const aiImport = useAiImport();
  const [aiImportOpen, setAiImportOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  usePreventBrowserFileDrop();

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('vault:open-palette'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleAiImportFile = useCallback(
    async (file: File, target: DropTarget) => {
      setAiImportOpen(true);
      await aiImport.startImport(file, target);
    },
    [aiImport],
  );

  const handleAiImportClose = useCallback(() => {
    setAiImportOpen(false);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-canvas)]">
      <TopBar onRefresh={refresh} onOpenAiImport={() => setDialogOpen(true)} />
      <div className="flex min-h-0 flex-1 flex-col">
        <VaultLayout
          onUploadFiles={uploadToTarget}
          onAiImportFile={handleAiImportFile}
          aiImportOpen={aiImportOpen}
          onAiImportClose={handleAiImportClose}
          aiImport={aiImport}
        />
        <AiCommandBar />
      </div>
      <AiImportDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <CommandPalette />
    </div>
  );
}
