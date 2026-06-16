import { flattenTree } from '@/lib/tree-utils';
import type { Document, TreeNode } from '@/lib/types';

export interface HealthHotspotRect {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

export interface HealthFolderTemplate {
  id: string;
  label: string;
  folderName: string;
  description: string;
  aliases?: string[];
}

export interface HealthBodyRegion {
  id: string;
  label: string;
  hotspot: HealthHotspotRect;
  /** Zoom focal point (% of figure) */
  focus: { xPct: number; yPct: number };
  folders: HealthFolderTemplate[];
}

export const HEALTH_BODY_REGIONS: HealthBodyRegion[] = [
  {
    id: 'head',
    label: 'Голова',
    hotspot: { xPct: 28, yPct: 2, wPct: 44, hPct: 16 },
    focus: { xPct: 50, yPct: 10 },
    folders: [
      {
        id: 'teeth',
        label: 'Зубы',
        folderName: 'Стоматолог',
        description: 'Снимки, лечение, гигиена',
      },
      {
        id: 'eyes',
        label: 'Глаза',
        folderName: 'Офтальмолог',
        description: 'Проверки зрения, OCT',
      },
      {
        id: 'brain',
        label: 'Мозг',
        folderName: 'МРТ',
        description: 'МРТ, КТ головы, невролог',
        aliases: ['КТ головы', 'Голова'],
      },
    ],
  },
  {
    id: 'shoulder-left',
    label: 'Левое плечо',
    hotspot: { xPct: 4, yPct: 18, wPct: 24, hPct: 11 },
    focus: { xPct: 16, yPct: 23 },
    folders: [
      {
        id: 'joints-l',
        label: 'Суставы',
        folderName: 'Ортопед',
        description: 'Плечо, связки, реабилитация',
      },
    ],
  },
  {
    id: 'shoulder-right',
    label: 'Правое плечо',
    hotspot: { xPct: 72, yPct: 18, wPct: 24, hPct: 11 },
    focus: { xPct: 84, yPct: 23 },
    folders: [
      {
        id: 'joints-r',
        label: 'Суставы',
        folderName: 'Ортопед',
        description: 'Плечо, связки, реабилитация',
      },
    ],
  },
  {
    id: 'chest',
    label: 'Грудная клетка',
    hotspot: { xPct: 24, yPct: 27, wPct: 52, hPct: 13 },
    focus: { xPct: 50, yPct: 33 },
    folders: [
      {
        id: 'heart',
        label: 'Сердце',
        folderName: 'ЭКГ',
        description: 'ЭКГ, кардиолог, давление',
        aliases: ['Кардиолог'],
      },
      {
        id: 'lungs',
        label: 'Лёгкие',
        folderName: 'Рентген',
        description: 'Рентген, флюорография',
        aliases: ['Флюорография'],
      },
    ],
  },
  {
    id: 'abdomen',
    label: 'Живот',
    hotspot: { xPct: 26, yPct: 41, wPct: 48, hPct: 12 },
    focus: { xPct: 50, yPct: 47 },
    folders: [
      {
        id: 'uzi',
        label: 'УЗИ',
        folderName: 'УЗИ',
        description: 'УЗИ брюшной полости',
        aliases: ['Гастроэнтеролог'],
      },
      {
        id: 'blood',
        label: 'Анализы',
        folderName: 'Анализы крови',
        description: 'Общий анализ, биохимия',
        aliases: ['Анализы', 'Кровь'],
      },
    ],
  },
  {
    id: 'pelvis',
    label: 'Таз',
    hotspot: { xPct: 24, yPct: 54, wPct: 52, hPct: 11 },
    focus: { xPct: 50, yPct: 59 },
    folders: [
      {
        id: 'pelvis-doc',
        label: 'Осмотры',
        folderName: 'Гинеколог / Уролог',
        description: 'УЗИ малого таза, осмотры',
        aliases: ['Гинеколог'],
      },
      {
        id: 'urine',
        label: 'Почки',
        folderName: 'Анализы мочи',
        description: 'Анализ мочи, УЗИ почек',
        aliases: ['Почки'],
      },
    ],
  },
  {
    id: 'hand-left',
    label: 'Левая рука',
    hotspot: { xPct: 0, yPct: 36, wPct: 17, hPct: 18 },
    focus: { xPct: 8, yPct: 45 },
    folders: [
      {
        id: 'blood-l',
        label: 'Анализы крови',
        folderName: 'Анализы крови',
        description: 'Забор крови, результаты',
      },
    ],
  },
  {
    id: 'hand-right',
    label: 'Правая рука',
    hotspot: { xPct: 83, yPct: 36, wPct: 17, hPct: 18 },
    focus: { xPct: 92, yPct: 45 },
    folders: [
      {
        id: 'blood-r',
        label: 'Анализы крови',
        folderName: 'Анализы крови',
        description: 'Забор крови, результаты',
      },
    ],
  },
  {
    id: 'knee-left',
    label: 'Левое колено',
    hotspot: { xPct: 22, yPct: 69, wPct: 22, hPct: 11 },
    focus: { xPct: 33, yPct: 74 },
    folders: [
      {
        id: 'knee-l',
        label: 'Колено',
        folderName: 'Ортопед',
        description: 'МРТ колена, ортопед',
      },
      {
        id: 'xray-l',
        label: 'Рентген',
        folderName: 'Рентген костей',
        description: 'Снимки костей и суставов',
        aliases: ['Кости'],
      },
    ],
  },
  {
    id: 'knee-right',
    label: 'Правое колено',
    hotspot: { xPct: 56, yPct: 69, wPct: 22, hPct: 11 },
    focus: { xPct: 67, yPct: 74 },
    folders: [
      {
        id: 'knee-r',
        label: 'Колено',
        folderName: 'Ортопед',
        description: 'МРТ колена, ортопед',
      },
      {
        id: 'xray-r',
        label: 'Рентген',
        folderName: 'Рентген костей',
        description: 'Снимки костей и суставов',
        aliases: ['Кости'],
      },
    ],
  },
  {
    id: 'foot-left',
    label: 'Левая стопа',
    hotspot: { xPct: 16, yPct: 87, wPct: 28, hPct: 11 },
    focus: { xPct: 30, yPct: 92 },
    folders: [
      {
        id: 'foot-l',
        label: 'Стопа',
        folderName: 'Ортопед',
        description: 'Стопа, плоскостопие, стельки',
      },
    ],
  },
  {
    id: 'foot-right',
    label: 'Правая стопа',
    hotspot: { xPct: 56, yPct: 87, wPct: 28, hPct: 11 },
    focus: { xPct: 70, yPct: 92 },
    folders: [
      {
        id: 'foot-r',
        label: 'Стопа',
        folderName: 'Ортопед',
        description: 'Стопа, плоскостопие, стельки',
      },
    ],
  },
];

export function isHealthPresetRoot(
  rootName: string,
  presetId: string | null,
): boolean {
  if (presetId === 'health') return true;
  return rootName.toLowerCase() === 'здоровье';
}

export function findRegionById(id: string): HealthBodyRegion | undefined {
  return HEALTH_BODY_REGIONS.find((r) => r.id === id);
}

export function findFolderForTemplate(
  template: HealthFolderTemplate,
  childFolders: TreeNode[],
): TreeNode | null {
  const names = [template.folderName, ...(template.aliases ?? [])].map((n) =>
    n.toLowerCase(),
  );
  return (
    childFolders.find((c) => c.type === 'FOLDER' && names.includes(c.name.toLowerCase())) ??
    null
  );
}

export function countDocumentsInSubtree(
  node: TreeNode,
  documents: Document[],
): number {
  const ids = new Set(flattenTree([node]).map((n) => n.id));
  return documents.filter((d) => ids.has(d.nodeId)).length;
}

export function countDocumentsUnderRoot(
  root: TreeNode,
  documents: Document[],
): number {
  return countDocumentsInSubtree(root, documents);
}

export function countDocumentsForFolder(
  folder: TreeNode | null,
  documents: Document[],
): number {
  if (!folder) return 0;
  return countDocumentsInSubtree(folder, documents);
}
