'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatBytes } from '@/lib/format';

interface DocumentPreviewProps {
  downloadUrl?: string;
  mimeType?: string;
  title: string;
}

export function DocumentPreview({ downloadUrl, mimeType, title }: DocumentPreviewProps) {
  if (!downloadUrl) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-sm text-[var(--color-muted)]">
        Нет файла для предпросмотра
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
        className="h-64 w-full rounded-2xl border border-[var(--color-border)] bg-white"
      />
    );
  }

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={downloadUrl}
        alt={title}
        className="max-h-64 w-full rounded-2xl border border-[var(--color-border)] object-contain"
      />
    );
  }

  if (mimeType?.startsWith('text/') || /\.(txt|md|json|xml|csv)$/i.test(title)) {
    return <TextPreview url={downloadUrl} />;
  }

  return (
    <div className="rounded-2xl bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
      Предпросмотр недоступен для этого типа файла. Используйте скачивание.
    </div>
  );
}

function TextPreview({ url }: { url: string }) {
  const { data } = useQuery({
    queryKey: ['text-preview', url],
    queryFn: async () => {
      const res = await fetch(url);
      const text = await res.text();
      return text.slice(0, 4000);
    },
  });

  return (
    <pre className="max-h-64 overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-xs leading-relaxed">
      {data ?? 'Загрузка…'}
    </pre>
  );
}
