'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { createImportWithProgress, subscribeImportEvents, type ImportEventType } from '@/lib/import-events';
import { t } from '@/lib/i18n';
import type { ConfirmImportPayload, DropTarget, ImportPhase, ImportQueueItem } from '@/lib/types';
import { useVaultMutations } from '@/hooks/use-vault-data';
import { useVaultStore } from '@/stores/vault-store';

const MAX_QUEUE = 5;
const AUTO_DISMISS_SECONDS = 7;

function resolveParentId(target: DropTarget | null): string | null {
  if (!target) return null;
  if (target.kind === 'folder') return target.nodeId;
  return target.folderId;
}

function mapEventToPhase(type: ImportEventType, current: ImportPhase): ImportPhase {
  switch (type) {
    case 'UPLOAD_RECEIVED':
    case 'STORING':
      return 'storing';
    case 'STORAGE_COMPLETE':
      return current === 'ready' ? 'ready' : 'analyzing';
    case 'ANALYZING':
      return 'analyzing';
    case 'PROPOSAL_READY':
      return 'ready';
    case 'FAILED':
      return 'failed';
    default:
      return current;
  }
}

function hasEdits(
  item: ImportQueueItem,
  payload: ConfirmImportPayload,
): boolean {
  const proposal = item.session?.proposal;
  if (!proposal) return true;
  const sameTitle = payload.title === proposal.title;
  const sameSummary = payload.summary === proposal.summary;
  const sameTags =
    payload.tags.join(',') === proposal.tags.join(',');
  const samePath =
    payload.folderPath.join('/') === proposal.folderPath.join('/');
  return !(sameTitle && sameSummary && sameTags && samePath);
}

export function useAiImportQueue() {
  const { invalidate } = useVaultMutations();
  const selectNode = useVaultStore((s) => s.selectNode);
  const setRightPanelOpen = useVaultStore((s) => s.setRightPanelOpen);
  const activeSpaceId = useVaultStore((s) => s.activeSpaceId);

  const [items, setItems] = useState<ImportQueueItem[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const unsubscribers = useRef<Map<string, () => void>>(new Map());
  const timerIntervals = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  const updateItem = useCallback((clientId: string, patch: Partial<ImportQueueItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)),
    );
  }, []);

  const removeItem = useCallback((clientId: string) => {
    unsubscribers.current.get(clientId)?.();
    unsubscribers.current.delete(clientId);
    const timer = timerIntervals.current.get(clientId);
    if (timer) {
      clearInterval(timer);
      timerIntervals.current.delete(clientId);
    }
    setItems((prev) => prev.filter((item) => item.clientId !== clientId));
  }, []);

  const startAutoDismissTimer = useCallback(
    (clientId: string) => {
      updateItem(clientId, { timerSeconds: AUTO_DISMISS_SECONDS });
      const interval = setInterval(() => {
        setItems((prev) => {
          const item = prev.find((entry) => entry.clientId === clientId);
          if (!item || item.timerSeconds == null) return prev;
          if (item.timerSeconds <= 1) {
            clearInterval(interval);
            timerIntervals.current.delete(clientId);
            unsubscribers.current.get(clientId)?.();
            unsubscribers.current.delete(clientId);
            return prev.filter((entry) => entry.clientId !== clientId);
          }
          return prev.map((entry) =>
            entry.clientId === clientId
              ? { ...entry, timerSeconds: (entry.timerSeconds ?? 1) - 1 }
              : entry,
          );
        });
      }, 1000);
      timerIntervals.current.set(clientId, interval);
    },
    [updateItem],
  );

  const beginImport = useCallback(
    async (clientId: string, file: File, dropTarget: DropTarget | null) => {
      try {
        const session = await createImportWithProgress(file, {
          spaceId: activeSpaceId,
          parentId: resolveParentId(dropTarget),
          onProgress: (uploadProgress) => updateItem(clientId, { uploadProgress }),
        });

        updateItem(clientId, {
          importId: session.id,
          session,
          phase: 'storing',
          uploadProgress: 100,
        });

        const unsubscribe = subscribeImportEvents(
          session.id,
          (event) => {
            setItems((prev) =>
              prev.map((item) => {
                if (item.clientId !== clientId) return item;
                const phase = mapEventToPhase(event.type, item.phase);
                return {
                  ...item,
                  phase,
                  session: event.session,
                  document: event.document ?? item.document,
                  error: event.type === 'FAILED' ? event.message ?? t('vault.aiAnalysisError') : null,
                };
              }),
            );

            if (event.type === 'PROPOSAL_READY') {
              void invalidate();
              if (event.document) {
                selectNode(event.document.nodeId, event.document.id);
              }
              startAutoDismissTimer(clientId);
            }
          },
          () => {
            void api.getImport(session.id).then((current) => {
              if (current.status === 'PROPOSAL_READY') {
                updateItem(clientId, { phase: 'ready', session: current });
                startAutoDismissTimer(clientId);
              } else if (current.status === 'FAILED') {
                updateItem(clientId, {
                  phase: 'failed',
                  session: current,
                  error: current.errorMessage ?? t('vault.aiAnalysisError'),
                });
              }
            }).catch(() => {});
          },
        );
        unsubscribers.current.set(clientId, unsubscribe);
      } catch (error) {
        updateItem(clientId, {
          phase: 'failed',
          error: error instanceof Error ? error.message : t('vault.aiAnalysisError'),
        });
      }
    },
    [activeSpaceId, invalidate, selectNode, startAutoDismissTimer, updateItem],
  );

  const enqueueFiles = useCallback(
    (files: File[], dropTarget: DropTarget | null) => {
      setQueueError(null);
      setItems((prev) => {
        const available = MAX_QUEUE - prev.length;
        if (available <= 0) {
          setQueueError(t('vault.aiImportQueueFull', { max: MAX_QUEUE }));
          return prev;
        }

        const toImport = files.slice(0, available);
        if (files.length > available) {
          setQueueError(t('vault.aiImportQueuePartial', {
            added: toImport.length,
            skipped: files.length - available,
            max: MAX_QUEUE,
          }));
        }

        const newItems: ImportQueueItem[] = toImport.map((file) => ({
          clientId: crypto.randomUUID(),
          importId: null,
          file,
          dropTarget,
          phase: 'uploading' as const,
          uploadProgress: 0,
          session: null,
          document: null,
          error: null,
          timerSeconds: null,
        }));

        for (const item of newItems) {
          void beginImport(item.clientId, item.file, item.dropTarget);
        }

        return [...prev, ...newItems];
      });
    },
    [beginImport],
  );

  const dismissItem = useCallback(
    (clientId: string) => {
      removeItem(clientId);
    },
    [removeItem],
  );

  const rejectItem = useCallback(
    async (clientId: string) => {
      const item = items.find((entry) => entry.clientId === clientId);
      if (!item?.importId) {
        removeItem(clientId);
        return;
      }
      setBusyIds((prev) => new Set(prev).add(clientId));
      try {
        await api.discardImport(item.importId);
        await invalidate();
      } catch (error) {
        if (error instanceof ApiError && error.code === 'INVALID_IMPORT_STATE') {
          removeItem(clientId);
          return;
        }
        updateItem(clientId, {
          error: error instanceof Error ? error.message : t('vault.aiAnalysisError'),
        });
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(clientId);
          return next;
        });
        removeItem(clientId);
      }
    },
    [invalidate, items, removeItem, updateItem],
  );

  const confirmItem = useCallback(
    async (clientId: string, payload: ConfirmImportPayload) => {
      const item = items.find((entry) => entry.clientId === clientId);
      if (!item?.importId) return false;

      setBusyIds((prev) => new Set(prev).add(clientId));
      try {
        if (hasEdits(item, payload)) {
          const doc = await api.confirmImport(item.importId, {
            ...payload,
            spaceId: activeSpaceId,
          });
          selectNode(doc.nodeId, doc.id);
          setRightPanelOpen(true);
          await invalidate();
        }
        removeItem(clientId);
        return true;
      } catch (error) {
        updateItem(clientId, {
          error: error instanceof Error ? error.message : t('vault.aiAnalysisError'),
        });
        return false;
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(clientId);
          return next;
        });
      }
    },
    [activeSpaceId, invalidate, items, removeItem, selectNode, setRightPanelOpen, updateItem],
  );

  useEffect(() => {
    const timers = timerIntervals.current;
    const subs = unsubscribers.current;
    return () => {
      for (const timer of timers.values()) clearInterval(timer);
      for (const unsub of subs.values()) unsub();
    };
  }, []);

  return {
    items,
    queueError,
    busyIds,
    enqueueFiles,
    dismissItem,
    rejectItem,
    confirmItem,
    clearQueueError: () => setQueueError(null),
  };
}

export type AiImportQueue = ReturnType<typeof useAiImportQueue>;
