'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface DocumentPreviewProps {
  downloadUrl?: string;
  mimeType?: string;
  title: string;
  className?: string;
}

export function DocumentPreview({
  downloadUrl,
  mimeType,
  title,
  className,
}: DocumentPreviewProps) {
  if (!downloadUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-sm text-[var(--color-muted)]',
          className,
        )}
      >
        {t('vault.noPreviewFile')}
      </div>
    );
  }

  const isPdf = mimeType?.includes('pdf') || title.toLowerCase().endsWith('.pdf');
  const isImage =
    mimeType?.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(title);

  if (isPdf) {
    return (
      <iframe
        src={downloadUrl}
        title={title}
        className={cn(
          'w-full rounded-2xl border border-[var(--color-border)] bg-white',
          className,
        )}
      />
    );
  }

  if (isImage) {
    return (
      <div
        className={cn(
          'flex min-h-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)]',
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={downloadUrl} alt={title} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  if (mimeType?.startsWith('text/') || /\.(txt|md|json|xml|csv)$/i.test(title)) {
    return <TextPreview url={downloadUrl} className={className} />;
  }

  return (
    <div
      className={cn(
        'flex items-center rounded-2xl bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]',
        className,
      )}
    >
      {t('vault.previewUnsupported')}
    </div>
  );
}

function TextPreview({ url, className }: { url: string; className?: string }) {
  const { data } = useQuery({
    queryKey: ['text-preview', url],
    queryFn: async () => {
      const res = await fetch(url);
      const text = await res.text();
      return text.slice(0, 4000);
    },
  });

  return (
    <pre
      className={cn(
        'overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs leading-relaxed',
        className,
      )}
    >
      {data ?? t('common.loading')}
    </pre>
  );
}
