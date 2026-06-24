'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  buildRemoteUploadPageUrl,
  subscribeRemoteUploadEvents,
  type RemoteUploadEvent,
} from '@/lib/remote-upload';
import type { Document, DropTarget, RemoteUploadMode } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';

interface RemoteUploadOptions {
  parentId?: string | null;
  spaceId?: string | null;
  mode?: RemoteUploadMode;
  onImportCreated?: (importId: string, dropTarget: DropTarget | null) => void;
}

export function useRemoteUploadSession() {
  const { invalidate } = useVaultMutations();
  const selectNode = useVaultStore((s) => s.selectNode);
  const upsertDocument = useVaultStore((s) => s.upsertDocument);
  const setRightPanelOpen = useVaultStore((s) => s.setRightPanelOpen);
  const selectedFolderId = useVaultStore((s) => s.selectedFolderId);
  const activeSpaceId = useVaultStore((s) => s.activeSpaceId);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [session, setSession] = useState<Awaited<ReturnType<typeof api.createRemoteUploadSession>> | null>(
    null,
  );
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const optionsRef = useRef<RemoteUploadOptions>({});

  const stopListening = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
  }, []);

  const resolveDropTarget = useCallback(
    (parentId?: string | null): DropTarget | null => {
      const folderId = parentId ?? selectedFolderId;
      if (!folderId) return null;
      return { kind: 'folder', nodeId: folderId };
    },
    [selectedFolderId],
  );

  const handleEvent = useCallback(
    async (event: RemoteUploadEvent) => {
      if (event.type === 'FILE_UPLOADED' && event.document) {
        setUploadedDocuments((prev) => [...prev, event.document!]);
        setSession(event.session);
        upsertDocument(event.document);
        selectNode(event.document.nodeId, event.document.id);
        setRightPanelOpen(true);
        await invalidate();
      }
      if (event.type === 'IMPORT_CREATED' && event.importId) {
        setSession(event.session);
        optionsRef.current.onImportCreated?.(
          event.importId,
          resolveDropTarget(optionsRef.current.parentId),
        );
      }
      if (event.type === 'SESSION_CLOSED') {
        setSession(event.session);
        stopListening();
      }
    },
    [invalidate, resolveDropTarget, selectNode, setRightPanelOpen, stopListening, upsertDocument],
  );

  const startSession = useCallback(
    async (options: RemoteUploadOptions = {}) => {
      optionsRef.current = options;
      const parentId = options.parentId ?? selectedFolderId;
      const mode = options.mode ?? 'DIRECT';

      setLoading(true);
      setError(null);
      setUploadedDocuments([]);
      stopListening();

      try {
        const created = await api.createRemoteUploadSession(parentId, {
          spaceId: options.spaceId ?? activeSpaceId,
          mode,
        });
        setSession(created);
        setUploadUrl(buildRemoteUploadPageUrl(created.token));
        unsubscribeRef.current = subscribeRemoteUploadEvents(
          created.id,
          handleEvent,
          (err) => setError(err.message),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create upload session');
        setSession(null);
        setUploadUrl(null);
      } finally {
        setLoading(false);
      }
    },
    [activeSpaceId, handleEvent, selectedFolderId, stopListening],
  );

  const closeSession = useCallback(async () => {
    if (!session) return;
    stopListening();
    try {
      await api.closeRemoteUploadSession(session.id);
    } catch {
      // session may already be expired
    }
    setSession(null);
    setUploadUrl(null);
    setUploadedDocuments([]);
  }, [session, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  return {
    session,
    uploadUrl,
    uploadedDocuments,
    error,
    loading,
    startSession,
    closeSession,
  };
}
