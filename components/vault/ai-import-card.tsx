'use client';

import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import type { ConfirmImportPayload, DropTarget, ImportProposal, ImportQueueItem } from '@/lib/types';

const inputClassName =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]';

interface AiImportCardProps {
  item: ImportQueueItem;
  busy: boolean;
  onConfirm: (payload: ConfirmImportPayload) => Promise<boolean>;
  onReject: () => Promise<void>;
  onDismiss: () => void;
}

function dropTargetLabel(target: DropTarget | null): string | null {
  if (!target) return null;
  if (target.kind === 'folder') return t('vault.aiImportSelectedFolder');
  return t('common.root');
}

function phaseLabel(item: ImportQueueItem): string {
  switch (item.phase) {
    case 'uploading':
      return t('vault.aiImportUploading', { percent: item.uploadProgress });
    case 'storing':
      return t('vault.aiImportSaving');
    case 'analyzing':
      return t('vault.aiAnalyzing');
    case 'ready':
      return t('vault.aiImportReady');
    case 'failed':
      return t('vault.aiAnalysisError');
    default:
      return t('vault.aiAnalyzing');
  }
}

export function AiImportCard({ item, busy, onConfirm, onReject, onDismiss }: AiImportCardProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (item.session?.proposal) {
      applyProposal(item.session.proposal);
    }
  }, [item.session?.proposal]);

  const applyProposal = (proposal: ImportProposal) => {
    setTitle(proposal.title);
    setSummary(proposal.summary);
    setFolderPath(proposal.folderPath.join(' / '));
    setTags(proposal.tags.join(', '));
  };

  const ready = item.phase === 'ready' && item.session?.proposal;
  const failed = item.phase === 'failed';
  const processing = item.phase === 'uploading' || item.phase === 'storing' || item.phase === 'analyzing';
  const targetHint = dropTargetLabel(item.dropTarget);

  const handleConfirm = async () => {
    if (!ready || !item.session?.proposal) return;
    const payload: ConfirmImportPayload = {
      title: title.trim() || item.session.proposal.title,
      summary: summary.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      folderPath: folderPath
        .split(/\s*\/\s*/)
        .map((part) => part.trim())
        .filter(Boolean),
      parentId: item.dropTarget?.kind === 'folder' ? item.dropTarget.nodeId : null,
    };
    const ok = await onConfirm(payload);
    if (ok) onDismiss();
  };

  const handleReject = async () => {
    await onReject();
  };

  return (
    <div className="pointer-events-auto w-[min(100vw-2rem,24rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles size={16} className="shrink-0 text-[var(--color-accent)]" />
          <h2 className="truncate text-sm font-medium">{t('vault.aiImportTitle')}</h2>
        </div>
        <button
          type="button"
          onClick={() => void (item.importId ? handleReject() : onDismiss())}
          disabled={busy}
          className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <p className="text-xs text-[var(--color-muted)]">
          {t('vault.aiImportFile')}: <span className="text-[var(--color-text)]">{item.file.name}</span>
        </p>

        {targetHint && !ready && (
          <p className="text-xs text-[var(--color-muted)]">
            {t('vault.aiImportTarget')}: <span className="text-[var(--color-text)]">{targetHint}</span>
          </p>
        )}

        {processing && (
          <div className="space-y-2 rounded-xl bg-[var(--color-surface-2)] px-3 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 size={14} className="animate-spin text-[var(--color-accent)]" />
              {phaseLabel(item)}
            </div>
            {item.phase === 'uploading' && (
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                  style={{ width: `${item.uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {(item.error || failed) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {item.error ?? item.session?.errorMessage ?? t('vault.aiAnalysisError')}
          </div>
        )}

        {ready && (
          <>
            {item.session!.proposal!.createMissingFolders && (
              <p className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-accent)]">
                {t('vault.aiProposesFolders', {
                  path: item.session!.proposal!.folderPath.join(' → '),
                })}
              </p>
            )}

            <Field label={t('common.name')}>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClassName} />
            </Field>
            <Field label={t('vault.aiDescriptionLabel')}>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className={cn(inputClassName, 'resize-none')}
              />
            </Field>
            <Field label={t('vault.aiFolderPathLabel')}>
              <input value={folderPath} onChange={(e) => setFolderPath(e.target.value)} className={inputClassName} />
            </Field>
            <Field label={t('vault.aiTagsLabel')}>
              <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClassName} />
            </Field>

            {item.session!.proposal!.confidence != null && (
              <p className="text-xs text-[var(--color-muted)]">
                {t('vault.aiConfidence', {
                  percent: Math.round(item.session!.proposal!.confidence * 100),
                })}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
        <button
          type="button"
          onClick={() => void handleReject()}
          disabled={busy || !item.importId}
          className="rounded-xl px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] disabled:opacity-50"
        >
          {t('common.reject')}
        </button>
        {ready && (
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy}
            className={cn(
              'flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs text-white',
              'hover:opacity-90 disabled:opacity-50',
            )}
          >
            <Check size={14} />
            {item.timerSeconds != null
              ? t('vault.aiImportConfirmTimer', { seconds: item.timerSeconds })
              : t('common.confirm')}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-xs">
      <span className="text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}
