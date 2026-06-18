'use client';

import { useCallback, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { ConfirmImportPayload, DropTarget, ImportSession } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveParentId(target: DropTarget | null): string | null {
  if (!target) return null;
  if (target.kind === 'folder') return target.nodeId;
  return target.folderId;
}

export function useAiImport() {
  const { invalidate } = useVaultMutations();
  const selectNode = useVaultStore((s) => s.selectNode);
  const setRightPanelOpen = useVaultStore((s) => s.setRightPanelOpen);
  const [session, setSession] = useState<ImportSession | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollUntilReady = useCallback(async (importId: string) => {
    for (let i = 0; i < 60; i++) {
      const current = await api.getImport(importId);
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
  }, []);

  const uploadFile = useCallback(async (file: File, target: DropTarget | null = null) => {
    setBusy(true);
    setError(null);
    setFileName(file.name);
    setDropTarget(target);
    try {
      const created = await api.createImport(file);
      setSession(created);
      return created;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setSession(null);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const runAnalysis = useCallback(async (importId?: string) => {
    const id = importId ?? session?.id;
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await api.analyzeImport(id);
      setSession((prev) => (prev ? { ...prev, status: 'ANALYZING' } : prev));
      await pollUntilReady(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setBusy(false);
    }
  }, [pollUntilReady, session?.id]);

  const startImport = useCallback(
    async (file: File, target: DropTarget | null = null) => {
      const created = await uploadFile(file, target);
      if (!created) return;
      await runAnalysis(created.id);
    },
    [runAnalysis, uploadFile],
  );

  const confirm = useCallback(
    async (payload: ConfirmImportPayload): Promise<boolean> => {
      if (!session) return false;
      setBusy(true);
      setError(null);
      try {
        const doc = await api.confirmImport(session.id, payload);
        selectNode(doc.nodeId, doc.id);
        setRightPanelOpen(true);
        await invalidate();
        setSession(null);
        setFileName(null);
        setDropTarget(null);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Confirm failed');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [invalidate, selectNode, session, setRightPanelOpen],
  );

  const confirmWithDefaults = useCallback(
    async (overrides: Partial<ConfirmImportPayload> = {}): Promise<boolean> => {
      if (!session?.proposal) return false;
      const proposal = session.proposal;
      return confirm({
        title: overrides.title ?? proposal.title,
        summary: overrides.summary ?? proposal.summary,
        tags: overrides.tags ?? proposal.tags,
        folderPath: overrides.folderPath ?? proposal.folderPath,
        parentId: overrides.parentId !== undefined ? overrides.parentId : resolveParentId(dropTarget),
      });
    },
    [confirm, dropTarget, session?.proposal],
  );

  const discard = useCallback(async () => {
    if (!session) {
      setFileName(null);
      setDropTarget(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.discardImport(session.id);
      setSession(null);
      setFileName(null);
      setDropTarget(null);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INVALID_IMPORT_STATE') {
        setSession(null);
        setFileName(null);
        setDropTarget(null);
        return;
      }
      setError(e instanceof Error ? e.message : 'Discard failed');
    } finally {
      setBusy(false);
    }
  }, [session]);

  const reset = useCallback(() => {
    setSession(null);
    setFileName(null);
    setDropTarget(null);
    setError(null);
    setBusy(false);
  }, []);

  return {
    session,
    fileName,
    dropTarget,
    busy,
    error,
    uploadFile,
    runAnalysis,
    startImport,
    confirm,
    confirmWithDefaults,
    discard,
    reset,
  };
}
