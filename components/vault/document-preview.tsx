'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import { resolveFileType } from '@/lib/file-type';
import { isVaultImportPreviewKind } from '@/lib/vault-import-files';

interface DocumentPreviewProps {
  assetId?: string;
  downloadUrl?: string;
  mimeType?: string;
  title: string;
  className?: string;
}

export function DocumentPreview({
  assetId,
  downloadUrl,
  mimeType,
  title,
  className,
}: DocumentPreviewProps) {
  const { kind } = resolveFileType(mimeType, title);
  const usesExtractedTextPreview =
    !!assetId && (kind === 'word' || kind === 'excel');

  if (!downloadUrl && !usesExtractedTextPreview) {
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

  const isPdf = kind === 'pdf';
  const isImage = kind === 'image';
  const isText = kind === 'text' || mimeType?.startsWith('text/') || /\.(txt|md|json|xml|csv)$/i.test(title);

  if (isPdf && downloadUrl) {
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

  if (isImage && downloadUrl) {
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

  if (usesExtractedTextPreview) {
    return <ExtractedTextPreview assetId={assetId!} className={className} />;
  }

  if (isText && downloadUrl) {
    return <TextPreview url={downloadUrl} className={className} />;
  }

  if (!isVaultImportPreviewKind(kind)) {
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

function ExtractedTextPreview({ assetId, className }: { assetId: string; className?: string }) {
  const { data, isError } = useQuery({
    queryKey: ['text-preview', assetId],
    queryFn: () => api.getAssetTextPreview(assetId),
  });

  if (isError) {
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

  return (
    <pre
      className={cn(
        'overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs leading-relaxed whitespace-pre-wrap',
        className,
      )}
    >
      {data?.text ?? t('common.loading')}
      {data?.truncated ? `\n\n[${t('vault.previewTruncated')}]` : ''}
    </pre>
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
        'overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs leading-relaxed whitespace-pre-wrap',
        className,
      )}
    >
      {data ?? t('common.loading')}
    </pre>
  );
}
