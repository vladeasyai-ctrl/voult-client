import { Briefcase, Home, type LucideIcon } from 'lucide-react';
import { t } from '@/lib/i18n';

export type DemoPhase =
  | 'archive'
  | 'search'
  | 'drop'
  | 'analyze'
  | 'route'
  | 'placed'
  | 'preview'
  | 'hold';

export type DemoLayout = 'tree' | 'radial';

export interface DemoPreset {
  id: string;
  label: string;
  icon: LucideIcon;
  layout: DemoLayout;
  sequence: DemoPhase[];
  phaseMs: Partial<Record<DemoPhase, number>>;
  upload: {
    fileName: string;
    targetPath: readonly string[];
    title: string;
    summary: string;
  };
  search?: {
    query: string;
    resultPath: readonly string[];
    resultTitle: string;
    snippet: string;
    highlight: string;
  };
}

const DEFAULT_PHASE_MS: Record<DemoPhase, number> = {
  archive: 2200,
  search: 2800,
  drop: 1300,
  analyze: 2000,
  route: 1800,
  placed: 1600,
  preview: 2800,
  hold: 2000,
};

export function getPhaseDuration(preset: DemoPreset, phase: DemoPhase): number {
  return preset.phaseMs[phase] ?? DEFAULT_PHASE_MS[phase];
}

/** True once the demo upload has landed (placed step and later). */
export function isDocPlaced(sequence: readonly DemoPhase[], stepIndex: number): boolean {
  const placedIndex = sequence.indexOf('placed');
  return placedIndex >= 0 && stepIndex >= placedIndex;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'home',
    label: t('demo.presets.home'),
    icon: Home,
    layout: 'radial',
    sequence: ['archive', 'search', 'drop', 'analyze', 'route', 'placed', 'preview', 'hold'],
    phaseMs: { archive: 2600 },
    upload: {
      fileName: 'water_bill_mar.pdf',
      targetPath: [t('demo.home'), t('demo.utilities'), t('demo.waterBills')],
      title: t('demo.waterBillTitle'),
      summary: t('demo.waterBillSummary'),
    },
    search: {
      query: t('demo.homeSearchQuery'),
      resultPath: [t('demo.home'), t('demo.utilities'), t('demo.waterBills'), t('demo.waterJan')],
      resultTitle: t('demo.waterJan'),
      snippet: t('demo.homeSearchSnippet'),
      highlight: t('demo.homeSearchHighlight'),
    },
  },
  {
    id: 'work',
    label: t('demo.presets.work'),
    icon: Briefcase,
    layout: 'tree',
    sequence: ['archive', 'drop', 'analyze', 'route', 'placed', 'preview', 'search', 'hold'],
    phaseMs: {},
    upload: {
      fileName: 'amendment_acme.pdf',
      targetPath: [
        t('demo.work'),
        t('demo.clients'),
        t('demo.acme'),
        t('demo.websiteProject'),
      ],
      title: t('demo.amendmentTitle'),
      summary: t('demo.amendmentSummary'),
    },
    search: {
      query: t('demo.workSearchQuery'),
      resultPath: [t('demo.work'), t('demo.clients'), t('demo.acme'), t('demo.invoice')],
      resultTitle: t('demo.invoice'),
      snippet: t('demo.workSearchSnippet'),
      highlight: t('demo.workSearchHighlight'),
    },
  },
];

export function getDemoPreset(id: string): DemoPreset {
  return DEMO_PRESETS.find((p) => p.id === id) ?? DEMO_PRESETS[0];
}
