'use client';

import { Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { AI_IMPORT_ACCEPT } from '@/lib/ai-import';
import { t } from '@/lib/i18n';
import type { ImportProposal } from '@/lib/types';
import { useAiImport } from '@/hooks/use-ai-import';

const inputClassName =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]';

interface AiImportDialogProps {
  open: boolean;
  onClose: () => void;
  initialFile?: File | null;
}

export function AiImportDialog({ open, onClose, initialFile }: AiImportDialogProps) {
  const {
    session,
    fileName,
    busy,
    error,
    uploadFile,
    runAnalysis,
    confirmWithDefaults,
    discard,
    reset,
  } = useAiImport();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [tags, setTags] = useState('');
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      reset();
      startedRef.current = null;
      setTitle('');
      setSummary('');
      setFolderPath('');
      setTags('');
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open || !initialFile) return;
    const key = `${initialFile.name}:${initialFile.size}:${initialFile.lastModified}`;
    if (startedRef.current === key) return;
    startedRef.current = key;
    void (async () => {
      const created = await uploadFile(initialFile);
      if (created) await runAnalysis(created.id);
    })();
  }, [open, initialFile, uploadFile, runAnalysis]);

  useEffect(() => {
    if (session?.proposal) {
      applyProposal(session.proposal);
    }
  }, [session?.proposal]);

  const applyProposal = (proposal: ImportProposal) => {
    setTitle(proposal.title);
    setSummary(proposal.summary);
    setFolderPath(proposal.folderPath.join(' / '));
    setTags(proposal.tags.join(', '));
  };

  if (!open) return null;

  const analyzing = session?.status === 'ANALYZING';
  const ready = session?.status === 'PROPOSAL_READY' && session.proposal;

  const handleConfirm = async () => {
    if (!ready) return;
    const ok = await confirmWithDefaults({
      title: title.trim() || session.proposal!.title,
      summary: summary.trim(),
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      folderPath: folderPath
        .split('/')
        .map((p) => p.trim())
        .filter(Boolean),
    });
    if (ok) onClose();
  };

  const handleDiscard = async () => {
    await discard();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--color-accent)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg">{t('vault.aiImportTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {fileName && (
            <p className="text-sm text-[var(--color-muted)]">
              {t('vault.aiImportFile')}: <span className="text-[var(--color-text)]">{fileName}</span>
            </p>
          )}

          {!session && !busy && (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center hover:border-[var(--color-accent)]">
              <Sparkles size={24} className="text-[var(--color-accent)]" />
              <span className="text-sm">{t('vault.aiImportPickFile')}</span>
              <input
                type="file"
                accept={AI_IMPORT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file).then((s) => s && runAnalysis(s.id));
                }}
              />
            </label>
          )}

          {analyzing && (
            <div className="flex items-center gap-3 rounded-xl bg-[var(--color-surface-2)] px-4 py-3 text-sm">
              <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
              {t('vault.aiAnalyzing')}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          {ready && (
            <div className="space-y-3">
              {session.proposal!.createMissingFolders && (
                <p className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-accent)]">
                  {t('vault.aiFoldersWillBeCreated', {
                    path: session.proposal!.folderPath.join(' → '),
                  })}
                </p>
              )}
              <Field label={t('common.name')}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClassName} />
              </Field>
              <Field label={t('vault.aiSummaryLabel')}>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className={cn(inputClassName, 'resize-none')}
                />
              </Field>
              <Field label={t('vault.aiFolderPathLabel')}>
                <input
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className={inputClassName}
                  placeholder={t('vault.aiFolderPathPlaceholder')}
                />
              </Field>
              <Field label={t('vault.aiTagsLabel')}>
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClassName} />
              </Field>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={busy}
            className="rounded-xl px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            {t('common.reject')}
          </button>
          {ready && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className={cn(
                'rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm text-white',
                'hover:opacity-90 disabled:opacity-50',
              )}
            >
              {t('common.confirm')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  );
}
