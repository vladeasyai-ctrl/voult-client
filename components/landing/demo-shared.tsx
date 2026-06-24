'use client';

import { motion } from 'framer-motion';
import { FileTypeIcon } from '@/components/ui/file-type-icon';
import { cn } from '@/lib/cn';
import { resolveDemoFolderAppearance, type DemoFolderKind } from '@/lib/demo-node-theme';
import { getFileTypeBorderColor } from '@/lib/file-type';

export function DemoFileChip({
  filename,
  compact,
  className,
}: {
  filename: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-[var(--color-surface)] shadow-xl ring-2 ring-[var(--color-accent)]/25',
        compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-sm sm:px-4 sm:py-2.5',
        className,
      )}
      style={{ borderColor: getFileTypeBorderColor(null, filename) }}
    >
      <FileTypeIcon filename={filename} size={compact ? 14 : 18} />
      <span className={cn('font-medium', compact ? 'max-w-[88px] truncate' : '')}>{filename}</span>
    </div>
  );
}

export function DemoNode({
  label,
  accent,
  doc,
  filename,
  folderKind = 'default',
  highlighted,
  pulse,
  target,
  newDoc,
  selected,
  dimmed,
  compact,
  searchHit,
  nodeId,
}: {
  label: string;
  accent?: boolean;
  doc?: boolean;
  filename?: string;
  folderKind?: DemoFolderKind;
  highlighted?: boolean;
  pulse?: boolean;
  target?: boolean;
  newDoc?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  compact?: boolean;
  searchHit?: boolean;
  nodeId?: string;
}) {
  const folderTheme = resolveDemoFolderAppearance(folderKind);
  const FolderIcon = folderTheme.Icon;
  const fileBorderColor = doc && filename ? getFileTypeBorderColor(null, filename) : null;

  return (
    <motion.div
      data-demo-node={nodeId}
      animate={{
        opacity: dimmed ? 0.35 : 1,
        scale: pulse ? [1, 1.04, 1] : searchHit ? [1, 1.03, 1] : 1,
      }}
      transition={pulse || searchHit ? { repeat: searchHit ? 2 : Infinity, duration: 1.2 } : { duration: 0.3 }}
      style={fileBorderColor ? { borderColor: fileBorderColor, borderWidth: 1.5 } : undefined}
      className={cn(
        'flex items-center gap-1.5 rounded-xl border shadow-sm transition-colors',
        compact ? 'px-1.5 py-1 text-[9px] sm:px-2 sm:py-1.5 sm:text-[10px]' : 'px-2 py-1.5 text-[10px] sm:gap-2 sm:rounded-2xl sm:px-2.5 sm:py-2 sm:text-xs',
        searchHit
          ? 'border-amber-400/80 bg-amber-50/95 ring-2 ring-amber-400/40 dark:border-amber-600 dark:bg-amber-950/60'
          : newDoc
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] ring-2 ring-[var(--color-accent)]/30'
            : selected
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
              : doc
                ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                : target && highlighted
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[0_0_0_3px_rgba(74,103,65,0.15)]'
                  : highlighted
                    ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)]/60'
                    : accent
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                      : folderTheme.theme.containerClassName,
      )}
    >
      {doc && filename ? (
        <FileTypeIcon filename={filename} size={compact ? 14 : 16} />
      ) : (
        <FolderIcon
          size={compact ? 10 : 12}
          className={cn(
            !compact && 'sm:w-[14px]',
            accent || highlighted || newDoc || selected || searchHit
              ? searchHit
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[var(--color-accent)]'
              : folderTheme.theme.iconClassName,
          )}
        />
      )}
      <span className="max-w-[80px] truncate font-medium sm:max-w-[96px]">{label}</span>
    </motion.div>
  );
}

export function Connector({ short }: { short?: boolean }) {
  return (
    <div
      className={cn(
        'mt-3.5 h-px shrink-0 self-start bg-[var(--color-border)]',
        short ? 'w-4 sm:mt-3 sm:w-5' : 'w-5 sm:mt-4 sm:w-6',
      )}
    />
  );
}

export function PdfPreviewMock({ highlight }: { highlight?: string }) {
  return (
    <div className="flex h-full flex-col p-2.5 sm:p-3">
      <div className="mb-2 h-2 w-3/4 rounded bg-[var(--color-border)]" />
      <div className="mb-1.5 h-1.5 w-full rounded bg-[var(--color-border)]/70" />
      <div className="mb-1.5 h-1.5 w-[92%] rounded bg-[var(--color-border)]/70" />
      {highlight ? (
        <p className="mb-1.5 rounded bg-amber-200/60 px-1 py-0.5 text-[8px] leading-snug text-amber-950 dark:bg-amber-900/50 dark:text-amber-100 sm:text-[9px]">
          {highlight}
        </p>
      ) : (
        <div className="mb-1.5 h-1.5 w-[88%] rounded bg-[var(--color-border)]/70" />
      )}
      <div className="mb-3 h-1.5 w-[70%] rounded bg-[var(--color-border)]/50" />
      <div className="mb-2 h-1.5 w-1/2 rounded bg-[var(--color-border)]" />
      <div className="mb-1.5 h-1.5 w-full rounded bg-[var(--color-border)]/60" />
      <div className="mb-1.5 h-1.5 w-[95%] rounded bg-[var(--color-border)]/60" />
      <div className="mt-auto flex justify-end gap-1">
        <div className="h-4 w-10 rounded bg-[var(--color-accent)]/25" />
        <div className="h-4 w-10 rounded border border-[var(--color-border)]" />
      </div>
    </div>
  );
}

export function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-muted)]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
