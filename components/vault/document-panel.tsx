'use client';

import type { ReactNode } from 'react';
import { Download, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatBytes, formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useVaultStore } from '@/stores/vault-store';
import { DocumentPreview } from '@/components/vault/document-preview';
import { FutureFeatures } from '@/components/vault/future-features';
import { FileTypeIcon, FileTypeLabel } from '@/components/ui/file-type-icon';

export function DocumentPanel() {
  const selectedDocumentId = useVaultStore((s) => s.selectedDocumentId);
  const documents = useVaultStore((s) => s.documents);

  const document = documents.find((d) => d.id === selectedDocumentId);

  const assetQuery = useQuery({
    queryKey: ['asset', document?.assetId],
    queryFn: () => api.getAsset(document!.assetId),
    enabled: !!document?.assetId,
  });

  const downloadQuery = useQuery({
    queryKey: ['download', document?.assetId],
    queryFn: () => api.getDownloadUrl(document!.assetId),
    enabled: !!document?.assetId,
  });

  if (!selectedDocumentId || !document) {
    return (
      <aside className="flex h-full items-center justify-center border-l border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <div>
          <FileText size={32} className="mx-auto mb-3 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">
            {t('vault.selectDocument')}
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] p-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{t('common.document')}</p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight">
          {document.title}
        </h2>
        {document.aiSummary && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">{document.aiSummary}</p>
        )}
        {document.description && document.description !== document.aiSummary && (
          <p className="mt-2 text-sm text-[var(--color-muted)]">{document.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-[var(--color-border)] p-5 text-sm">
        <Meta label={t('common.created')} value={formatDate(document.createdAt)} />
        <Meta label={t('common.updated')} value={formatDate(document.updatedAt)} />
        <Meta label={t('common.size')} value={assetQuery.data ? formatBytes(assetQuery.data.size) : '—'} />
        <Meta
          label={t('common.type')}
          value={
            assetQuery.data ? (
              <FileTypeLabel
                mimeType={assetQuery.data.mimeType ?? document.mimeType}
                filename={document.title}
              />
            ) : document.mimeType ? (
              <FileTypeLabel mimeType={document.mimeType} filename={document.title} />
            ) : (
              '—'
            )
          }
        />
      </div>

      <div className="border-b border-[var(--color-border)] p-5">
        <DocumentPreview
          downloadUrl={downloadQuery.data?.url}
          mimeType={assetQuery.data?.mimeType}
          title={document.title}
        />
        {downloadQuery.data?.url && (
          <a
            href={downloadQuery.data.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline"
          >
            <Download size={14} />
            {t('common.download')}
          </a>
        )}
      </div>

      <FutureFeatures />
    </aside>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-0.5">{value}</p>
    </div>
  );
}
