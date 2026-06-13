'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { formatRelative } from '@/lib/format';
import type { DocumentVersion } from '@/lib/types';

interface VersionTimelineProps {
  versions: DocumentVersion[];
}

export function VersionTimeline({ versions }: VersionTimelineProps) {
  if (!versions.length) {
    return <p className="text-sm text-[var(--color-muted)]">Версий пока нет</p>;
  }

  return (
    <div className="space-y-0">
      {versions.map((version, index) => (
        <VersionItem key={version.id} version={version} isLatest={index === 0} />
      ))}
    </div>
  );
}

function VersionItem({
  version,
  isLatest,
}: {
  version: DocumentVersion;
  isLatest: boolean;
}) {
  const assetQuery = useQuery({
    queryKey: ['asset-meta', version.assetId],
    queryFn: () => api.getDownloadUrl(version.assetId),
    enabled: isLatest,
  });

  return (
    <div className="relative flex gap-3 pb-6 last:pb-0">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'z-10 h-3 w-3 rounded-full border-2 bg-[var(--color-surface)]',
            isLatest
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
              : 'border-[var(--color-border)]',
          )}
        />
        <div className="w-px flex-1 bg-[var(--color-border)]" />
      </div>
      <div className="min-w-0 flex-1 -mt-0.5">
        <p className={cn('text-sm font-medium', isLatest && 'text-[var(--color-accent)]')}>
          Version {version.version}
          {isLatest && (
            <span className="ml-2 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs">
              latest
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          uploaded {formatRelative(version.createdAt)}
        </p>
        {isLatest && assetQuery.data && (
          <a
            href={assetQuery.data.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-[var(--color-accent)] hover:underline"
          >
            Открыть файл
          </a>
        )}
      </div>
    </div>
  );
}
