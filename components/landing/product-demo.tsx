'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  DEMO_PRESETS,
  getDemoPreset,
  getPhaseDuration,
  isDocPlaced,
  type DemoPhase,
} from '@/lib/demo-presets';
import { en } from '@/lib/i18n/en';
import { t } from '@/lib/i18n';
import { DemoRadialScene } from './demo-radial-scene';
import { DemoTreeScene } from './demo-tree-scene';
import { DemoViewport } from './demo-viewport';
import { Meta, PdfPreviewMock } from './demo-shared';
import { DemoDragDropUpload } from './demo-drag-drop';
import { getDemoFocusTarget } from '@/lib/demo-focus';

const PHASE_LABELS: Partial<Record<DemoPhase, string>> = {
  archive: 'demo.archive',
  search: 'demo.search',
  drop: 'demo.upload',
  route: 'demo.route',
  placed: 'demo.ready',
  preview: 'demo.preview',
};

function getStepCaption(
  phase: DemoPhase,
  sequence: readonly DemoPhase[],
  stepIndex: number,
): { title: string; desc: string } {
  let key: DemoPhase = phase;
  if (phase === 'hold') {
    const prev = sequence[(stepIndex - 1 + sequence.length) % sequence.length];
    key = prev === 'hold' ? 'archive' : prev;
  }
  return en.demo.stepCaptions[key as keyof typeof en.demo.stepCaptions];
}

interface ProductDemoProps {
  fullWidth?: boolean;
}

export function ProductDemo({ fullWidth = false }: ProductDemoProps) {
  const [presetId, setPresetId] = useState(DEMO_PRESETS[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [workFocusReady, setWorkFocusReady] = useState(false);
  const preset = useMemo(() => getDemoPreset(presetId), [presetId]);
  const phase = preset.sequence[stepIndex];
  const caption = getStepCaption(phase, preset.sequence, stepIndex);

  const selectPreset = useCallback((id: string) => {
    setPresetId(id);
    setStepIndex(0);
    setAutoPlay(true);
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      setAutoPlay(false);
      setStepIndex((index + preset.sequence.length) % preset.sequence.length);
    },
    [preset.sequence.length],
  );

  const goPrev = useCallback(() => {
    goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const goNext = useCallback(() => {
    goToStep(stepIndex + 1);
  }, [goToStep, stepIndex]);

  useEffect(() => {
    if (!autoPlay) return;

    const duration = getPhaseDuration(preset, phase);
    const timeoutId = setTimeout(() => {
      setStepIndex((i) => (i + 1) % preset.sequence.length);
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [autoPlay, preset, phase, stepIndex]);

  const showFloatingFile = phase === 'drop' || phase === 'analyze';
  const highlightPath = phase === 'route' || phase === 'placed' || phase === 'preview' || phase === 'hold';
  const showNewDoc = isDocPlaced(preset.sequence, stepIndex);
  const showPreviewPanel =
    phase === 'preview' ||
    phase === 'search' ||
    (presetId === 'work' && phase === 'hold');
  const searchActive = phase === 'search';

  useEffect(() => {
    if (presetId !== 'work' || !showNewDoc) {
      setWorkFocusReady(false);
      return;
    }
    if (phase === 'preview') {
      const id = window.setTimeout(() => setWorkFocusReady(true), 500);
      return () => window.clearTimeout(id);
    }
    if (phase === 'search' || phase === 'hold') {
      setWorkFocusReady(true);
      return;
    }
    setWorkFocusReady(false);
  }, [presetId, phase, showNewDoc]);

  const applyFocusZoom = showNewDoc && (presetId !== 'work' || workFocusReady);

  const focusTarget = useMemo(
    () => getDemoFocusTarget(presetId, { showNewDoc: applyFocusZoom }),
    [presetId, applyFocusZoom],
  );

  const displayPhase = phase === 'hold' ? preset.sequence[preset.sequence.length - 2] : phase;
  const stepPhases = preset.sequence.filter((p) => p !== 'hold' && p !== 'analyze');

  return (
    <div className={cn('flex flex-col', fullWidth ? 'gap-5' : 'gap-3')}>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          fullWidth && 'justify-center px-6',
        )}
      >
        {DEMO_PRESETS.map((p) => {
          const Icon = p.icon;
          const active = p.id === presetId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPreset(p.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm',
                active
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
              )}
            >
              <Icon size={14} />
              {p.label}
            </button>
          );
        })}
        <span className="text-[10px] text-[var(--color-muted)] sm:text-xs">
          {t('demo.moreComing')}
        </span>
      </div>

      <div
        className={cn(
          'flex w-full flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]',
          fullWidth
            ? 'min-h-[min(82vh,860px)] rounded-none border-x-0 shadow-none'
            : 'aspect-[4/3] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.08)]',
        )}
      >
        {/* Toolbar */}
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 backdrop-blur-sm sm:h-11">
          <span className="font-[family-name:var(--font-display)] text-sm">Vault</span>
          <div className="ml-1 h-5 flex-1 max-w-[140px] rounded-md bg-[var(--color-surface-2)] sm:max-w-[180px]" />
          <div className="h-5 w-14 rounded-md bg-[var(--color-accent)] sm:w-16" />
        </div>

        {/* Step caption */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${presetId}-${phase}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center sm:px-6 sm:py-4"
          >
            <p className="font-[family-name:var(--font-display)] text-sm font-medium sm:text-base">
              {caption.title}
            </p>
            <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-[var(--color-muted)] sm:text-sm">
              {caption.desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Canvas */}
        <div className="relative min-h-0 flex-1">
          <div className="mind-map-viewport absolute inset-0" />

          <div className="absolute inset-0 flex">
            <motion.div
              className="relative flex min-w-0 flex-1 overflow-hidden p-3 sm:p-6"
              animate={{ flex: showPreviewPanel ? '1 1 58%' : '1 1 100%' }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <DemoViewport target={focusTarget} presetId={presetId}>
                {preset.layout === 'tree' ? (
                  <DemoTreeScene
                    phase={phase}
                    highlightPath={highlightPath}
                    showNewDoc={showNewDoc}
                    showPreviewPanel={showPreviewPanel}
                    searchActive={searchActive}
                    uploadFileName={preset.upload.fileName}
                  />
                ) : (
                  <DemoRadialScene
                    phase={phase}
                    highlightPath={highlightPath}
                    showNewDoc={showNewDoc}
                    searchActive={searchActive}
                    uploadFileName={preset.upload.fileName}
                  />
                )}
              </DemoViewport>

              <AnimatePresence>
                {phase === 'archive' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.45 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-[var(--color-muted)]"
                  >
                    {t('demo.dropHint')}
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showFloatingFile && (
                  <motion.div
                    key="drag-drop-upload"
                    className="absolute inset-0 z-20"
                    exit={{ opacity: 0, scale: 0.55, y: 36 }}
                    transition={{ duration: 0.35, ease: 'easeIn' }}
                  >
                    <DemoDragDropUpload
                      fileName={preset.upload.fileName}
                      phase={phase === 'analyze' ? 'analyze' : 'drop'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {showPreviewPanel && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '42%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                  className="relative shrink-0 overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-surface)]"
                >
                  <div className="flex h-full min-w-[160px] flex-col p-4 sm:min-w-[200px] sm:p-5">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                      {searchActive ? t('demo.searchResult') : t('common.document')}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-base leading-tight sm:text-lg">
                      {searchActive && preset.search ? preset.search.resultTitle : preset.upload.title}
                    </h3>
                    {searchActive && preset.search && (
                      <p className="mt-1.5 truncate text-[10px] text-[var(--color-accent)] sm:text-xs">
                        {preset.search.resultPath.join(' / ')}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-3 text-xs leading-snug text-[var(--color-muted)] sm:text-sm">
                      {searchActive && preset.search ? preset.search.snippet : preset.upload.summary}
                    </p>

                    <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                      <PdfPreviewMock
                        highlight={searchActive ? preset.search?.highlight : undefined}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                      <Meta label={t('common.type')} value="PDF" />
                      <Meta label={t('common.size')} value={searchActive ? '186 KB' : '248 KB'} />
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:gap-3 sm:py-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label={t('demo.prev')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] shadow-sm transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)] sm:h-9 sm:w-9"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 shadow-sm sm:gap-2 sm:px-3">
            {stepPhases.map((p) => {
              const labelKey = PHASE_LABELS[p];
              const seqIndex = preset.sequence.indexOf(p);
              const currentIdx = stepPhases.indexOf(displayPhase === 'analyze' ? 'drop' : displayPhase);
              const stepIdx = stepPhases.indexOf(p);
              const isCurrent =
                displayPhase === p ||
                (phase === 'hold' && p === stepPhases[stepPhases.length - 1]) ||
                (phase === 'analyze' && p === 'drop');

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToStep(seqIndex)}
                  aria-label={labelKey ? t(labelKey) : p}
                  className="flex flex-col items-center gap-0.5 px-0.5"
                >
                  <div
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-all sm:h-2 sm:w-2',
                      isCurrent
                        ? 'scale-125 bg-[var(--color-accent)]'
                        : stepIdx < currentIdx
                          ? 'bg-[var(--color-accent)]/40'
                          : 'bg-[var(--color-border)]',
                    )}
                  />
                  {isCurrent && labelKey && (
                    <span className="hidden text-[9px] text-[var(--color-muted)] sm:block">
                      {labelKey === 'demo.upload' && phase === 'analyze' ? 'AI' : t(labelKey)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label={t('demo.next')}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] shadow-sm transition hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)] sm:h-9 sm:w-9"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
