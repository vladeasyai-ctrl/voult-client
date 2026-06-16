'use client';

import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import type { ConfirmImportPayload, ImportSession } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useAiImport() {
  const { invalidate } = useVaultMutations();
  const selectNode = useVaultStore((s) => s.selectNode);
  const [session, setSession] = useState<ImportSession | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setBusy(true);
    setError(null);
    setFileName(file.name);
    try {
      const created = await api.createImport(file);
      setSession(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setSession(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await api.analyzeImport(session.id);
      setSession((prev) => (prev ? { ...prev, status: 'ANALYZING' } : prev));

      for (let i = 0; i < 60; i++) {
        const current = await api.getImport(session.id);
        setSession(current);
        if (current.status === 'PROPOSAL_READY' || current.status === 'FAILED') {
          if (current.status === 'FAILED') {
            setError(current.errorMessage ?? 'AI analysis failed');
          }
          return;
        }
        await sleep(1500);
      }
      setError('AI analysis timed out');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setBusy(false);
    }
  }, [session]);

  const confirm = useCallback(
    async (payload: ConfirmImportPayload) => {
      if (!session) return;
      setBusy(true);
      setError(null);
      try {
        const doc = await api.confirmImport(session.id, payload);
        selectNode(doc.nodeId, doc.id);
        await invalidate();
        setSession(null);
        setFileName(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Confirm failed');
      } finally {
        setBusy(false);
      }
    },
    [invalidate, selectNode, session],
  );

  const discard = useCallback(async () => {
    if (!session) {
      setFileName(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.discardImport(session.id);
      setSession(null);
      setFileName(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Discard failed');
    } finally {
      setBusy(false);
    }
  }, [session]);

  const reset = useCallback(() => {
    setSession(null);
    setFileName(null);
    setError(null);
    setBusy(false);
  }, []);

  return {
    session,
    fileName,
    busy,
    error,
    uploadFile,
    runAnalysis,
    confirm,
    discard,
    reset,
  };
}
