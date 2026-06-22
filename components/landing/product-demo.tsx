'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, Folder, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

type Phase =
  | 'archive'
  | 'drop'
  | 'analyze'
  | 'route'
  | 'placed'
  | 'preview'
  | 'hold';

const PHASE_MS: Record<Phase, number> = {
  archive: 2200,
  drop: 1300,
  analyze: 2000,
  route: 1800,
  placed: 1600,
  preview: 2800,
  hold: 2000,
};

const SEQUENCE: Phase[] = [
  'archive',
  'drop',
  'analyze',
  'route',
  'placed',
  'preview',
  'hold',
];

export function ProductDemo() {
  const [phase, setPhase] = useState<Phase>('archive');

  const phaseLabels = useMemo<Record<Phase, string>>(
    () => ({
      archive: t('demo.archive'),
      drop: t('demo.upload'),
      analyze: 'AI',
      route: t('demo.route'),
      placed: t('demo.ready'),
      preview: t('demo.preview'),
      hold: '',
    }),
    [],
  );

  const targetPath = useMemo(
    () => [t('demo.work'), t('demo.clients'), t('demo.alpha')] as const,
    [],
  );

  useEffect(() => {
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const advance = () => {
      const current = SEQUENCE[i];
      setPhase(current);
      timeoutId = setTimeout(() => {
        i = (i + 1) % SEQUENCE.length;
        advance();
      }, PHASE_MS[current]);
    };

    advance();
    return () => clearTimeout(timeoutId);
  }, []);

  const showFloatingFile = phase === 'drop' || phase === 'analyze';
  const showAiBar = phase === 'analyze' || phase === 'route';
  const highlightPath = phase === 'route' || phase === 'placed' || phase === 'preview' || phase === 'hold';
  const showNewDoc = phase === 'placed' || phase === 'preview' || phase === 'hold';
  const showPreviewPanel = phase === 'preview' || phase === 'hold';
  const aiConfirmed = phase === 'route' || phase === 'placed' || phase === 'preview' || phase === 'hold';

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_32px_80px_rgba(0,0,0,0.08)]">
      <div className="mind-map-viewport absolute inset-0" />

      {/* Toolbar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex h-9 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 backdrop-blur-sm">
        <span className="font-[family-name:var(--font-display)] text-xs sm:text-sm">Vault</span>
        <div className="ml-1 h-5 flex-1 max-w-[100px] rounded-md bg-[var(--color-surface-2)] sm:max-w-[120px]" />
        <div className="h-5 w-12 rounded-md bg-[var(--color-accent)] sm:w-14" />
      </div>

      <div className="absolute inset-0 top-9 flex">
        {/* Mind-map area */}
        <motion.div
          className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-4"
          animate={{ flex: showPreviewPanel ? '1 1 58%' : '1 1 100%' }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
        >
          <div className="origin-center scale-[0.68] sm:scale-[0.78] lg:scale-[0.85]">
            <div className="flex items-start gap-2 sm:gap-2.5">
              <DemoNode
                icon={Folder}
                label={t('demo.work')}
                accent
                highlighted={highlightPath}
                dimmed={phase === 'analyze'}
              />

              <Connector />

              <div className="flex flex-col gap-3.5 sm:gap-4">
                <div className="flex items-start gap-2 sm:gap-2.5">
                  <DemoNode
                    icon={Folder}
                    label={t('demo.clients')}
                    highlighted={highlightPath}
                    pulse={phase === 'route'}
                    dimmed={phase === 'analyze'}
                  />
                  <Connector />
                  <div className="flex flex-col gap-2 sm:gap-2.5">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <DemoNode
                        icon={Folder}
                        label={t('demo.alpha')}
                        highlighted={highlightPath}
                        pulse={phase === 'route'}
                        target={highlightPath}
                      />
                      <Connector />
                      <div className="flex flex-col gap-1.5">
                        <DemoNode icon={FileText} label={t('demo.invoice')} doc muted />
                        <AnimatePresence>
                          {showNewDoc && (
                            <motion.div
                              initial={{ opacity: 0, x: -10, scale: 0.85 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                            >
                              <DemoNode
                                icon={FileText}
                                label={t('demo.contract')}
                                doc
                                newDoc
                                selected={showPreviewPanel}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <DemoNode
                        icon={Folder}
                        label={t('demo.beta')}
                        dimmed={phase === 'analyze' || highlightPath}
                      />
                      <Connector />
                      <DemoNode icon={FileText} label={t('demo.act')} doc muted />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5">
                  <DemoNode icon={Folder} label={t('demo.resume')} dimmed={phase !== 'archive' && phase !== 'hold'} />
                  <Connector />
                  <DemoNode icon={FileText} label="CV.pdf" doc muted />
                </div>
              </div>
            </div>
          </div>

          {/* Drop hint */}
          <AnimatePresence>
            {phase === 'archive' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-[var(--color-muted)] sm:text-xs"
              >
                {t('demo.dropHint')}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Floating file */}
          <AnimatePresence>
            {showFloatingFile && (
              <motion.div
                key="floating-file"
                initial={{ opacity: 0, y: -50, scale: 0.75 }}
                animate={{ opacity: 1, y: phase === 'analyze' ? 8 : 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.85 }}
                className="absolute left-1/2 top-[18%] z-20 -translate-x-1/2"
              >
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-surface)] px-3 py-2 shadow-xl ring-2 ring-[var(--color-accent)]/20">
                  <FileText size={16} className="text-[var(--color-accent)]" />
                  <span className="text-xs font-medium sm:text-sm">scan_contract.pdf</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI bar */}
          <AnimatePresence>
            {showAiBar && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-2 left-2 right-2 z-20 sm:bottom-3 sm:left-3 sm:right-3"
              >
                <div
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur-sm sm:gap-3 sm:rounded-2xl sm:px-4',
                    aiConfirmed
                      ? 'border-green-300/50 bg-green-50/95 dark:border-green-800 dark:bg-green-950/90'
                      : 'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)]/95',
                  )}
                >
                  {aiConfirmed ? (
                    <Check size={16} className="shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <motion.div
                      animate={{ rotate: [0, 12, -12, 0] }}
                      transition={{ repeat: Infinity, duration: 1.1 }}
                    >
                      <Sparkles size={16} className="shrink-0 text-[var(--color-accent)]" />
                    </motion.div>
                  )}
                  <div className="min-w-0 flex-1 text-[11px] sm:text-sm">
                    <p className="font-medium">
                      {aiConfirmed ? t('demo.placeFound') : t('demo.aiAnalyzing')}
                    </p>
                    <p className="truncate text-[10px] text-[var(--color-muted)] sm:text-xs">
                      {targetPath.join(' / ')} → {t('demo.contractTitle')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Preview panel */}
        <AnimatePresence>
          {showPreviewPanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '42%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="relative shrink-0 overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <div className="flex h-full min-w-[130px] flex-col p-3 sm:min-w-[160px] sm:p-4">
                <p className="text-[9px] uppercase tracking-wider text-[var(--color-muted)] sm:text-[10px]">
                  {t('common.document')}
                </p>
                <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-sm leading-tight sm:text-base">
                  {t('demo.contractTitle')}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-[var(--color-muted)] sm:text-xs">
                  {t('demo.contractSummary')}
                </p>

                <div className="mt-3 flex-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <PdfPreviewMock />
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] sm:text-[10px]">
                  <Meta label={t('common.type')} value="PDF" />
                  <Meta label={t('common.size')} value="248 KB" />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Phase steps */}
      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 sm:bottom-2.5 sm:gap-1.5">
        {SEQUENCE.filter((p) => p !== 'hold').map((p) => (
          <div key={p} className="flex flex-col items-center gap-0.5">
            <div
              className={cn(
                'h-1 w-1 rounded-full transition-all sm:h-1.5 sm:w-1.5',
                phase === p || (phase === 'hold' && p === 'preview')
                  ? 'scale-125 bg-[var(--color-accent)]'
                  : SEQUENCE.indexOf(p) < SEQUENCE.indexOf(phase === 'hold' ? 'preview' : phase)
                    ? 'bg-[var(--color-accent)]/40'
                    : 'bg-[var(--color-border)]',
              )}
            />
            {phase === p && phaseLabels[p] && (
              <span className="hidden text-[8px] text-[var(--color-muted)] sm:block">
                {phaseLabels[p]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoNode({
  icon: Icon,
  label,
  accent,
  doc,
  muted,
  highlighted,
  pulse,
  target,
  newDoc,
  selected,
  dimmed,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  accent?: boolean;
  doc?: boolean;
  muted?: boolean;
  highlighted?: boolean;
  pulse?: boolean;
  target?: boolean;
  newDoc?: boolean;
  selected?: boolean;
  dimmed?: boolean;
}) {
  return (
    <motion.div
      animate={{
        opacity: dimmed ? 0.35 : 1,
        scale: pulse ? [1, 1.04, 1] : 1,
      }}
      transition={pulse ? { repeat: Infinity, duration: 1.2 } : { duration: 0.3 }}
      className={cn(
        'flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-[10px] shadow-sm transition-colors sm:gap-2 sm:rounded-2xl sm:px-2.5 sm:py-2 sm:text-xs',
        newDoc
          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] ring-2 ring-[var(--color-accent)]/30'
          : selected
            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
            : doc
              ? muted
                ? 'border-[var(--color-border)] bg-[var(--color-surface)]/80'
                : 'border-amber-200/80 bg-amber-50/90 dark:border-amber-900 dark:bg-amber-950/40'
              : target && highlighted
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-[0_0_0_3px_rgba(74,103,65,0.15)]'
                : highlighted
                  ? 'border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)]/60'
                  : accent
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]',
      )}
    >
      <Icon
        size={12}
        className={cn(
          'sm:w-[14px]',
          accent || highlighted || newDoc || selected
            ? 'text-[var(--color-accent)]'
            : 'text-[var(--color-muted)]',
        )}
      />
      <span className="whitespace-nowrap font-medium">{label}</span>
    </motion.div>
  );
}

function Connector() {
  return <div className="mt-3 h-px w-3 shrink-0 self-start bg-[var(--color-border)] sm:mt-3.5 sm:w-4" />;
}

function PdfPreviewMock() {
  return (
    <div className="flex h-full flex-col p-2.5 sm:p-3">
      <div className="mb-2 h-2 w-3/4 rounded bg-[var(--color-border)]" />
      <div className="mb-1.5 h-1.5 w-full rounded bg-[var(--color-border)]/70" />
      <div className="mb-1.5 h-1.5 w-[92%] rounded bg-[var(--color-border)]/70" />
      <div className="mb-1.5 h-1.5 w-[88%] rounded bg-[var(--color-border)]/70" />
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-muted)]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
