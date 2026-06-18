'use client';

import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import type { DropTarget, ImportProposal } from '@/lib/types';
import { useAiImport } from '@/hooks/use-ai-import';

const inputClassName =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]';

interface AiImportCardProps {
  open: boolean;
  onClose: () => void;
  initialFile?: File | null;
  dropTarget?: DropTarget | null;
  external?: ReturnType<typeof useAiImport>;
}

function dropTargetLabel(target: DropTarget | null): string | null {
  if (!target) return null;
  if (target.kind === 'folder') return 'выбранную папку';
  return 'корень';
}

export function AiImportCard({
  open,
  onClose,
  initialFile,
  dropTarget: externalDropTarget,
  external,
}: AiImportCardProps) {
  const internal = useAiImport();
  const ai = external ?? internal;
  const {
    session,
    fileName,
    dropTarget,
    busy,
    error,
    startImport,
    confirmWithDefaults,
    discard,
    reset,
  } = ai;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [tags, setTags] = useState('');

  const effectiveDropTarget = externalDropTarget ?? dropTarget;

  useEffect(() => {
    if (!open && !external) {
      reset();
      setTitle('');
      setSummary('');
      setFolderPath('');
      setTags('');
    }
  }, [open, reset, external]);

  useEffect(() => {
    if (external || !open || !initialFile) return;
    startImport(initialFile, effectiveDropTarget ?? null);
  }, [external, open, initialFile, effectiveDropTarget, startImport]);

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

  const analyzing = session?.status === 'ANALYZING' || (busy && session?.status === 'UPLOADED');
  const ready = session?.status === 'PROPOSAL_READY' && session.proposal;
  const failed = session?.status === 'FAILED';
  const targetHint = dropTargetLabel(effectiveDropTarget);

  const handleConfirm = async () => {
    if (!ready) return;
    const ok = await confirmWithDefaults({
      title: title.trim() || session.proposal!.title,
      summary: summary.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      folderPath: folderPath
        .split('/')
        .map((p) => p.trim())
        .filter(Boolean),
      parentId: effectiveDropTarget?.kind === 'folder' ? effectiveDropTarget.nodeId : null,
    });
    if (ok) onClose();
  };

  const handleDiscard = async () => {
    await discard();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="pointer-events-none absolute bottom-6 right-6 z-50 flex max-w-md flex-col">
      <div className="pointer-events-auto w-[min(100vw-2rem,24rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-accent)]" />
            <h2 className="text-sm font-medium">AI-импорт</h2>
          </div>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={busy}
            className="rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          {fileName && (
            <p className="text-xs text-[var(--color-muted)]">
              Файл: <span className="text-[var(--color-text)]">{fileName}</span>
            </p>
          )}

          {targetHint && !ready && (
            <p className="text-xs text-[var(--color-muted)]">
              Цель: <span className="text-[var(--color-text)]">{targetHint}</span>
            </p>
          )}

          {(analyzing || (!session && busy)) && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-2)] px-3 py-2.5 text-sm">
              <Loader2 size={14} className="animate-spin text-[var(--color-accent)]" />
              AI анализирует файл…
            </div>
          )}

          {(error || failed) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error ?? session?.errorMessage ?? 'Ошибка анализа'}
            </div>
          )}

          {ready && (
            <>
              {session.proposal!.createMissingFolders && (
                <p className="rounded-lg bg-[var(--color-accent-soft)] px-3 py-2 text-xs text-[var(--color-accent)]">
                  AI предлагает создать новые папки: {session.proposal!.folderPath.join(' → ')}
                </p>
              )}

              <Field label="Название">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClassName} />
              </Field>
              <Field label="Описание">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  className={cn(inputClassName, 'resize-none')}
                />
              </Field>
              <Field label="Папка (через / )">
                <input value={folderPath} onChange={(e) => setFolderPath(e.target.value)} className={inputClassName} />
              </Field>
              <Field label="Теги">
                <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClassName} />
              </Field>

              {session.proposal!.confidence != null && (
                <p className="text-xs text-[var(--color-muted)]">
                  Уверенность AI: {Math.round(session.proposal!.confidence * 100)}%
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={busy}
            className="rounded-xl px-3 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]"
          >
            Отклонить
          </button>
          {ready && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className={cn(
                'flex items-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs text-white',
                'hover:opacity-90 disabled:opacity-50',
              )}
            >
              <Check size={14} />
              Подтвердить
            </button>
          )}
        </div>
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
