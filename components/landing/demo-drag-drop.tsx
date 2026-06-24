'use client';

import { motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';
import { FileTypeIcon } from '@/components/ui/file-type-icon';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { DemoFileChip } from './demo-shared';

const DRAG_DURATION = 1.15;
const DRAG_TIMES = [0, 0.22, 1] as const;

interface DemoDragDropUploadProps {
  fileName: string;
  phase: 'drop' | 'analyze';
}

function DemoOsFolder({ fileName }: { fileName: string }) {
  return (
    <motion.div
      className="absolute bottom-[12%] left-[5%] w-[132px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_16px_48px_rgba(0,0,0,0.14)] sm:bottom-[14%] sm:left-[6%] sm:w-[156px]"
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: [0, 1, 1, 0.7], y: 0, scale: 1 }}
      transition={{ duration: DRAG_DURATION, times: [0, 0.12, 0.7, 1], ease: [0.33, 0.72, 0.15, 1] }}
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5">
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400/75" />
          <span className="h-2 w-2 rounded-full bg-amber-400/75" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/75" />
        </div>
        <span className="truncate text-[8px] font-medium text-[var(--color-muted)] sm:text-[9px]">
          {t('demo.downloads')}
        </span>
      </div>
      <div className="space-y-1 p-2">
        <motion.div
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1"
          initial={{
            borderColor: 'transparent',
            backgroundColor: 'color-mix(in srgb, var(--color-accent-soft) 50%, transparent)',
          }}
          animate={{
            opacity: [1, 1, 0.32],
            borderColor: [
              'color-mix(in srgb, var(--color-accent) 25%, transparent)',
              'color-mix(in srgb, var(--color-accent) 25%, transparent)',
              'var(--color-border)',
            ],
            backgroundColor: [
              'color-mix(in srgb, var(--color-accent-soft) 50%, transparent)',
              'color-mix(in srgb, var(--color-accent-soft) 50%, transparent)',
              'color-mix(in srgb, var(--color-surface-2) 50%, transparent)',
            ],
          }}
          transition={{ duration: DRAG_DURATION, times: [...DRAG_TIMES] }}
          style={{ borderWidth: 1, borderStyle: 'dashed' }}
        >
          <FileTypeIcon filename={fileName} size={13} />
          <span className="truncate text-[8px] font-medium sm:text-[9px]">{fileName}</span>
        </motion.div>
        <div className="flex items-center gap-1.5 rounded-md px-1.5 py-1 opacity-35">
          <FileTypeIcon filename="Receipt.pdf" size={13} />
          <span className="truncate text-[8px] sm:text-[9px]">Receipt.pdf</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md px-1.5 py-1 opacity-25">
          <FileTypeIcon filename="Scan_001.jpg" size={13} />
          <span className="truncate text-[8px] sm:text-[9px]">Scan_001.jpg</span>
        </div>
      </div>
    </motion.div>
  );
}

export function DemoDragDropUpload({ fileName, phase }: DemoDragDropUploadProps) {
  const isDrop = phase === 'drop';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {isDrop && (
        <>
          <DemoOsFolder fileName={fileName} />
          <motion.div
            className="absolute left-1/2 top-[13%] -translate-x-1/2 rounded-2xl border-2 border-dashed border-[var(--color-accent)]/45 bg-[var(--color-accent-soft)]/25 px-6 py-4 sm:px-8 sm:py-5"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: [0, 0, 0.85, 0.5], scale: [0.88, 0.88, 1.03, 1] }}
            transition={{ duration: DRAG_DURATION, times: [0, 0.38, 0.78, 1], ease: 'easeOut' }}
          >
            <p className="text-center text-[10px] font-medium text-[var(--color-accent)] sm:text-xs">
              {t('demo.dropHint')}
            </p>
          </motion.div>
        </>
      )}

      <motion.div
        className="absolute"
        initial={
          isDrop
            ? {
                left: '11%',
                top: '66%',
                x: 0,
                y: 0,
                scale: 0.86,
                opacity: 0,
                rotate: 0,
              }
            : false
        }
        animate={
          isDrop
            ? {
                left: ['11%', '11%', '50%'],
                top: ['66%', '63.5%', '16%'],
                x: [0, 0, '-50%'],
                y: [0, -6, 0],
                scale: [0.86, 1.04, 1],
                opacity: [0, 1, 1],
                rotate: [0, -3, 0],
              }
            : {
                left: '50%',
                top: '16%',
                x: '-50%',
                y: [0, -5, 0],
                scale: 1,
                opacity: 1,
                rotate: 0,
              }
        }
        transition={
          isDrop
            ? { duration: DRAG_DURATION, times: [...DRAG_TIMES], ease: [0.33, 0.68, 0.18, 1] }
            : {
                y: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                default: { duration: 0.35 },
              }
        }
      >
        <div className="relative">
          <DemoFileChip
            filename={fileName}
            className={cn(isDrop && 'shadow-2xl ring-[var(--color-accent)]/35')}
          />

          {isDrop && (
            <motion.div
              className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: [0, 1, 1, 0.6],
                scale: [0.6, 1, 1, 0.85],
                x: [0, 0, 10, 4],
                y: [0, 0, 8, 2],
              }}
              transition={{ duration: DRAG_DURATION, times: [0, 0.18, 0.75, 1] }}
            >
              <MousePointer2
                size={13}
                className="text-[var(--color-text)]"
                fill="var(--color-surface)"
                strokeWidth={2}
              />
            </motion.div>
          )}

          {!isDrop && (
            <motion.div
              className="absolute -inset-1 rounded-2xl border border-[var(--color-accent)]/40"
              animate={{ opacity: [0.25, 0.7, 0.25], scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
