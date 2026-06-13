'use client';

import { useUpload } from '@/hooks/use-upload';
import { useVaultData } from '@/hooks/use-vault-data';
import { isAuthenticated } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CommandPalette } from '@/components/vault/command-palette';
import { TopBar } from '@/components/vault/top-bar';
import { VaultLayout } from '@/components/vault/vault-layout';

export default function VaultPage() {
  const router = useRouter();
  const { refresh } = useVaultData();
  const { uploadToTarget } = useUpload();

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-canvas)]">
      <TopBar onRefresh={refresh} />
      <VaultLayout onUploadFiles={uploadToTarget} />
      <CommandPalette />
    </div>
  );
}
