'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isAiEnrichmentPending } from '@/lib/ai-enrichment';
import { formatBytes, formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { useVaultStore } from '@/stores/vault-store';
import { DocumentPreview } from '@/components/vault/document-preview';
import { FileTypeLabel } from '@/components/ui/file-type-icon';

const LIVE_DOC_POLL_MS = 2000;

export function DocumentPanel() {
  const selectedDocumentId = useVaultStore((s) => s.selectedDocumentId);
  const documents = useVaultStore((s) => s.documents);
  const upsertDocument = useVaultStore((s) => s.upsertDocument);

  const cachedDocument = documents.find((d) => d.id === selectedDocumentId);

  const liveDocumentQuery = useQuery({
    queryKey: ['document', selectedDocumentId],
    queryFn: () => api.getDocument(selectedDocumentId!),
    enabled: Boolean(selectedDocumentId),
    refetchInterval: (query) =>
      isAiEnrichmentPending(query.state.data?.aiStatus) ? LIVE_DOC_POLL_MS : false,
  });

  useEffect(() => {
    if (liveDocumentQuery.data) {
      upsertDocument(liveDocumentQuery.data);
    }
  }, [liveDocumentQuery.data, upsertDocument]);

  const document = liveDocumentQuery.data ?? cachedDocument;
  const aiPending = document ? isAiEnrichmentPending(document.aiStatus) : false;
  const aiFailed = document?.aiStatus === 'FAILED';

  const assetQuery = useQuery({
    queryKey: ['asset', document?.assetId],
    queryFn: () => api.getAsset(document!.assetId),
    enabled: !!document?.assetId,
  });

  const downloadQuery = useQuery({
    queryKey: ['download', document?.assetId, document?.title],
    queryFn: () => api.getDownloadUrl(document!.assetId, document!.title),
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

  const summaryText = document.aiSummary ?? document.description;

  return (
    <aside className="flex h-full flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="shrink-0 border-b border-[var(--color-border)] p-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">{t('common.document')}</p>
        <h2 className="mt-1 flex items-start gap-2 font-[family-name:var(--font-display)] text-2xl leading-tight">
          {aiPending && (
            <Loader2 size={22} className="mt-1 shrink-0 animate-spin text-[var(--color-accent)]" />
          )}
          <span className={aiPending ? 'text-[var(--color-muted)]' : undefined}>{document.title}</span>
        </h2>
        {aiPending ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Loader2 size={14} className="animate-spin" />
            {t('vault.aiEnrichmentPending')}
          </p>
        ) : aiFailed ? (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            {t('vault.aiEnrichmentFailed')}
          </p>
        ) : (
          <>
            {document.aiSummary && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{document.aiSummary}</p>
            )}
            {document.description && document.description !== document.aiSummary && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{document.description}</p>
            )}
            {!summaryText && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{t('vault.noDocumentDescription')}</p>
            )}
          </>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-[var(--color-border)] p-5 text-sm">
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

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <DocumentPreview
          className="min-h-0 flex-1"
          assetId={document.assetId}
          downloadUrl={downloadQuery.data?.url}
          mimeType={assetQuery.data?.mimeType}
          title={document.title}
        />
        {downloadQuery.data?.attachmentUrl && (
          <a
            href={downloadQuery.data.attachmentUrl}
            download={document.title}
            className="mt-3 inline-flex shrink-0 items-center gap-2 text-sm text-[var(--color-accent)] hover:underline"
          >
            <Download size={14} />
            {t('common.download')}
          </a>
        )}
      </div>
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
