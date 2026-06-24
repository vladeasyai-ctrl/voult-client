'use client';

import { AiImportCard } from '@/components/vault/ai-import-card';
import type { AiImportQueue } from '@/hooks/use-ai-import-queue';

interface AiImportStackProps {
  queue: AiImportQueue;
}

export function AiImportStack({ queue }: AiImportStackProps) {
  const { items, busyIds, queueError, confirmItem, rejectItem, dismissItem, clearQueueError } = queue;

  if (items.length === 0 && !queueError) return null;

  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-50 flex max-w-md flex-col-reverse gap-3">
      {queueError && (
        <div className="pointer-events-auto rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start justify-between gap-2">
            <span>{queueError}</span>
            <button
              type="button"
              onClick={clearQueueError}
              className="shrink-0 text-amber-700 underline"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {items.map((item) => (
        <AiImportCard
          key={item.clientId}
          item={item}
          busy={busyIds.has(item.clientId)}
          onConfirm={(payload) => confirmItem(item.clientId, payload)}
          onReject={() => rejectItem(item.clientId)}
          onDismiss={() => dismissItem(item.clientId)}
        />
      ))}
    </div>
  );
}
