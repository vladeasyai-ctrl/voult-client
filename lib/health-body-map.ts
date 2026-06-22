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
    label: 'Head',
    hotspot: { xPct: 28, yPct: 2, wPct: 44, hPct: 16 },
    focus: { xPct: 50, yPct: 10 },
    folders: [
      {
        id: 'teeth',
        label: 'Teeth',
        folderName: 'Dentist',
        description: 'X-rays, treatment, hygiene',
      },
      {
        id: 'eyes',
        label: 'Eyes',
        folderName: 'Ophthalmologist',
        description: 'Vision checks, OCT',
      },
      {
        id: 'brain',
        label: 'Brain',
        folderName: 'MRI',
        description: 'MRI, head CT, neurologist',
        aliases: ['Head CT', 'Head'],
      },
    ],
  },
  {
    id: 'shoulder-left',
    label: 'Left shoulder',
    hotspot: { xPct: 4, yPct: 18, wPct: 24, hPct: 11 },
    focus: { xPct: 16, yPct: 23 },
    folders: [
      {
        id: 'joints-l',
        label: 'Joints',
        folderName: 'Orthopedist',
        description: 'Shoulder, ligaments, rehabilitation',
      },
    ],
  },
  {
    id: 'shoulder-right',
    label: 'Right shoulder',
    hotspot: { xPct: 72, yPct: 18, wPct: 24, hPct: 11 },
    focus: { xPct: 84, yPct: 23 },
    folders: [
      {
        id: 'joints-r',
        label: 'Joints',
        folderName: 'Orthopedist',
        description: 'Shoulder, ligaments, rehabilitation',
      },
    ],
  },
  {
    id: 'chest',
    label: 'Chest',
    hotspot: { xPct: 24, yPct: 27, wPct: 52, hPct: 13 },
    focus: { xPct: 50, yPct: 33 },
    folders: [
      {
        id: 'heart',
        label: 'Heart',
        folderName: 'ECG',
        description: 'ECG, cardiologist, blood pressure',
        aliases: ['Cardiologist'],
      },
      {
        id: 'lungs',
        label: 'Lungs',
        folderName: 'X-ray',
        description: 'X-ray, fluorography',
        aliases: ['Fluorography'],
      },
    ],
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    hotspot: { xPct: 26, yPct: 41, wPct: 48, hPct: 12 },
    focus: { xPct: 50, yPct: 47 },
    folders: [
      {
        id: 'uzi',
        label: 'Ultrasound',
        folderName: 'Ultrasound',
        description: 'Abdominal ultrasound',
        aliases: ['Gastroenterologist'],
      },
      {
        id: 'blood',
        label: 'Blood tests',
        folderName: 'Blood tests',
        description: 'CBC, biochemistry',
        aliases: ['Labs', 'Blood'],
      },
    ],
  },
  {
    id: 'pelvis',
    label: 'Pelvis',
    hotspot: { xPct: 24, yPct: 54, wPct: 52, hPct: 11 },
    focus: { xPct: 50, yPct: 59 },
    folders: [
      {
        id: 'pelvis-doc',
        label: 'Exams',
        folderName: 'Gynecologist / Urologist',
        description: 'Pelvic ultrasound, exams',
        aliases: ['Gynecologist'],
      },
      {
        id: 'urine',
        label: 'Kidneys',
        folderName: 'Urinalysis',
        description: 'Urinalysis, kidney ultrasound',
        aliases: ['Kidneys'],
      },
    ],
  },
  {
    id: 'hand-left',
    label: 'Left arm',
    hotspot: { xPct: 0, yPct: 36, wPct: 17, hPct: 18 },
    focus: { xPct: 8, yPct: 45 },
    folders: [
      {
        id: 'blood-l',
        label: 'Blood draw',
        folderName: 'Blood tests',
        description: 'Blood draw, results',
      },
    ],
  },
  {
    id: 'hand-right',
    label: 'Right arm',
    hotspot: { xPct: 83, yPct: 36, wPct: 17, hPct: 18 },
    focus: { xPct: 92, yPct: 45 },
    folders: [
      {
        id: 'blood-r',
        label: 'Blood draw',
        folderName: 'Blood tests',
        description: 'Blood draw, results',
      },
    ],
  },
  {
    id: 'knee-left',
    label: 'Left knee',
    hotspot: { xPct: 22, yPct: 69, wPct: 22, hPct: 11 },
    focus: { xPct: 33, yPct: 74 },
    folders: [
      {
        id: 'knee-l',
        label: 'Knee',
        folderName: 'Orthopedist',
        description: 'Knee MRI, orthopedist',
      },
      {
        id: 'xray-l',
        label: 'X-ray',
        folderName: 'Bone X-ray',
        description: 'Bone and joint imaging',
        aliases: ['Bones'],
      },
    ],
  },
  {
    id: 'knee-right',
    label: 'Right knee',
    hotspot: { xPct: 56, yPct: 69, wPct: 22, hPct: 11 },
    focus: { xPct: 67, yPct: 74 },
    folders: [
      {
        id: 'knee-r',
        label: 'Knee',
        folderName: 'Orthopedist',
        description: 'Knee MRI, orthopedist',
      },
      {
        id: 'xray-r',
        label: 'X-ray',
        folderName: 'Bone X-ray',
        description: 'Bone and joint imaging',
        aliases: ['Bones'],
      },
    ],
  },
  {
    id: 'foot-left',
    label: 'Left foot',
    hotspot: { xPct: 16, yPct: 87, wPct: 28, hPct: 11 },
    focus: { xPct: 30, yPct: 92 },
    folders: [
      {
        id: 'foot-l',
        label: 'Foot',
        folderName: 'Orthopedist',
        description: 'Foot, flat feet, insoles',
      },
    ],
  },
  {
    id: 'foot-right',
    label: 'Right foot',
    hotspot: { xPct: 56, yPct: 87, wPct: 28, hPct: 11 },
    focus: { xPct: 70, yPct: 92 },
    folders: [
      {
        id: 'foot-r',
        label: 'Foot',
        folderName: 'Orthopedist',
        description: 'Foot, flat feet, insoles',
      },
    ],
  },
];

export function isHealthPresetRoot(
  rootName: string,
  presetId: string | null,
): boolean {
  if (presetId === 'health') return true;
  return rootName.toLowerCase() === 'health';
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
