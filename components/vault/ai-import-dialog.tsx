'use client';

import { Loader2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { AI_IMPORT_ACCEPT, isAiImportFile } from '@/lib/ai-import';
import { t } from '@/lib/i18n';

interface AiImportDialogProps {
  open: boolean;
  onClose: () => void;
  onEnqueue: (files: File[]) => void;
}

export function AiImportDialog({ open, onClose, onEnqueue }: AiImportDialogProps) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(isAiImportFile);
    if (files.length === 0) return;
    setBusy(true);
    onEnqueue(files);
    setBusy(false);
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
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center hover:border-[var(--color-accent)]">
            {busy ? (
              <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
            ) : (
              <Sparkles size={24} className="text-[var(--color-accent)]" />
            )}
            <span className="text-sm">{t('vault.aiImportPickFile')}</span>
            <span className="text-xs text-[var(--color-muted)]">{t('vault.aiImportSupported')}</span>
            <input
              type="file"
              accept={AI_IMPORT_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>

        <div className="flex justify-end border-t border-[var(--color-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-xl px-4 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]',
            )}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
