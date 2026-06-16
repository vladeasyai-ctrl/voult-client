'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, FolderOpen, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { HealthBodyRegion, HealthFolderTemplate } from '@/lib/health-body-map';

interface FolderItem {
  template: HealthFolderTemplate;
  folderId: string | null;
  docCount: number;
}

interface HealthBodyRegionViewProps {
  region: HealthBodyRegion;
  folders: FolderItem[];
  creatingId: string | null;
  variant?: 'default' | 'xray';
  onBack: () => void;
  onOpenFolder: (folderId: string) => void;
  onCreateFolder: (template: HealthFolderTemplate) => void;
}

export function HealthBodyRegionView({
  region,
  folders,
  creatingId,
  variant = 'default',
  onBack,
  onOpenFolder,
  onCreateFolder,
}: HealthBodyRegionViewProps) {
  const xray = variant === 'xray';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex w-full max-w-md flex-col gap-4"
    >
      <button
        type="button"
        onClick={onBack}
        className={cn(
          'flex w-fit items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition',
          xray
            ? 'text-cyan-200/60 hover:bg-cyan-500/10 hover:text-cyan-100'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
        )}
      >
        <ArrowLeft size={16} />
        К телу
      </button>

      <div>
        <h3
          className={cn(
            'font-[family-name:var(--font-display)] text-2xl',
            xray && 'text-cyan-50',
          )}
        >
          {region.label}
        </h3>
        <p
          className={cn(
            'mt-1 text-sm',
            xray ? 'text-cyan-200/50' : 'text-[var(--color-muted)]',
          )}
        >
          Выберите папку или создайте новую
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {folders.map(({ template, folderId, docCount }) => {
          const exists = folderId != null;
          const loading = creatingId === template.id;

          return (
            <li key={template.id}>
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  exists ? onOpenFolder(folderId!) : onCreateFolder(template)
                }
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition',
                  xray
                    ? exists
                      ? 'border-cyan-400/35 bg-cyan-500/10 hover:border-cyan-300/60 hover:bg-cyan-500/15'
                      : 'border-dashed border-cyan-500/25 bg-slate-900/60 hover:border-cyan-400/45 hover:bg-cyan-500/8'
                    : exists
                      ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] hover:border-[var(--color-accent)]'
                      : 'border-dashed border-[var(--color-border)] bg-[var(--color-surface)] hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    xray
                      ? exists
                        ? 'bg-cyan-400/15 text-cyan-300'
                        : 'bg-slate-800 text-cyan-200/40'
                      : exists
                        ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                        : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
                  )}
                >
                  {exists ? <FolderOpen size={20} /> : <FolderPlus size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block font-medium',
                      xray && (exists ? 'text-cyan-50' : 'text-cyan-100/80'),
                    )}
                  >
                    {template.label}
                    <span
                      className={cn(
                        'ml-1.5',
                        xray ? 'text-cyan-200/45' : 'text-[var(--color-muted)]',
                      )}
                    >
                      ({docCount})
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block truncate text-xs',
                      xray ? 'text-cyan-200/40' : 'text-[var(--color-muted)]',
                    )}
                  >
                    {exists ? template.folderName : `Создать «${template.folderName}»`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
