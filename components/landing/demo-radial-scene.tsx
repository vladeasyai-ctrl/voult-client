'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { t } from '@/lib/i18n';
import { HOME_CANVAS_H, HOME_CANVAS_W, HOME_LAYOUT } from '@/lib/demo-home-layout';
import type { DemoPhase } from '@/lib/demo-presets';
import { DemoNode } from './demo-shared';
import { DemoRadialUploadFlight, useDemoDocLanding } from './demo-upload-flight';

const EDGES: [string, string][] = [
  ['home', 'documents'],
  ['documents', 'deed'],
  ['documents', 'registration'],
  ['home', 'warranties'],
  ['warranties', 'appliance'],
  ['home', 'utilities'],
  ['utilities', 'waterBills'],
  ['waterBills', 'waterJan'],
  ['waterBills', 'waterFeb'],
  ['waterBills', 'waterMar'],
  ['utilities', 'electricity'],
  ['electricity', 'electricBill'],
  ['home', 'renovation'],
  ['renovation', 'floorPlan'],
  ['home', 'insurance'],
  ['insurance', 'homePolicy'],
];

interface DemoRadialSceneProps {
  phase: DemoPhase;
  highlightPath: boolean;
  showNewDoc: boolean;
  searchActive: boolean;
  uploadFileName: string;
}

export function DemoRadialScene({
  phase,
  highlightPath,
  showNewDoc,
  searchActive,
  uploadFileName,
}: DemoRadialSceneProps) {
  const nodeMap = new Map(HOME_LAYOUT.map((n) => [n.id, n]));

  const highlightIds = new Set<string>();
  if (highlightPath) {
    ['home', 'utilities', 'waterBills'].forEach((id) => highlightIds.add(id));
  }
  if (searchActive) {
    ['home', 'utilities', 'waterBills', 'waterJan'].forEach((id) => highlightIds.add(id));
  }

  const pulseRoute = phase === 'route';
  const dimOthers = phase === 'analyze' || highlightPath || searchActive;
  const { docVisible, onDocLanded } = useDemoDocLanding(showNewDoc, phase, 'home');
  const flightActive = phase === 'route' || (phase === 'placed' && !docVisible);

  function nodeProps(id: string) {
    const highlighted = highlightIds.has(id);
    const dimmed = dimOthers && !highlighted;
    const searchHit = searchActive && id === 'waterJan';
    return { highlighted, dimmed, pulse: pulseRoute && highlighted, searchHit };
  }

  const visibleNodes = HOME_LAYOUT.filter((n) => n.id !== 'waterMar');

  return (
    <div className="relative h-[460px] w-[600px] origin-center">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 ${HOME_CANVAS_W} ${HOME_CANVAS_H}`}
        aria-hidden
      >
        {EDGES.map(([from, to]) => {
          if (to === 'waterMar' && !showNewDoc) return null;
          const a = nodeMap.get(from);
          const b = nodeMap.get(to);
          if (!a || !b) return null;
          const active =
            (highlightPath || searchActive) &&
            highlightIds.has(from) &&
            highlightIds.has(to);
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={active ? 'var(--color-accent)' : 'var(--color-border)'}
              strokeWidth={active ? 1.5 : 1}
              strokeOpacity={active ? 0.75 : 0.45}
            />
          );
        })}
      </svg>

      {visibleNodes.map((n) => {
        const label = n.labelKey ? t(n.labelKey) : n.id;
        const props = nodeProps(n.id);

        return (
          <div
            key={n.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(n.x / HOME_CANVAS_W) * 100}%`,
              top: `${(n.y / HOME_CANVAS_H) * 100}%`,
            }}
          >
            <DemoNode
              label={label}
              nodeId={n.id}
              doc={n.doc}
              filename={n.filename}
              folderKind={n.folderKind ?? (n.id === 'home' ? 'home' : 'default')}
              accent={n.id === 'home'}
              compact
              {...props}
            />
          </div>
        );
      })}

      <AnimatePresence>
        {flightActive && (
          <DemoRadialUploadFlight
            phase={phase === 'route' ? 'route' : 'placed'}
            fileName={uploadFileName}
            onLanded={onDocLanded}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {docVisible && (
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(nodeMap.get('waterMar')!.x / HOME_CANVAS_W) * 100}%`,
              top: `${(nodeMap.get('waterMar')!.y / HOME_CANVAS_H) * 100}%`,
            }}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          >
            <DemoNode
              label={t('demo.waterMar')}
              nodeId="waterMar"
              doc
              filename="Mar_2025.pdf"
              newDoc
              compact
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-1 right-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-1.5 py-0.5 text-[8px] text-[var(--color-muted)] sm:text-[9px]">
        {t('common.radial')}
      </div>
    </div>
  );
}
