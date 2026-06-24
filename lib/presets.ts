import { t } from '@/lib/i18n';
import type { FolderColorKey, FolderIconKey } from './folder-theme';
import type { TreeNode } from './types';

export type HomeHousingType = 'rent' | 'own';

export const HOME_HOUSING_TYPE_KEY = 'housingType';

export interface PresetChildTemplate {
  name: string;
  iconKey?: FolderIconKey;
  color?: FolderColorKey;
  childSuggestions?: (existingCount: number) => string[];
  seedChildren?: { name: string; iconKey?: FolderIconKey; color?: FolderColorKey }[];
}

export interface VaultPreset {
  id: string;
  label: string;
  description: string;
  emoji: string;
  rootName: string;
  branches?: PresetChildTemplate[];
  variants?: Record<HomeHousingType, PresetChildTemplate[]>;
  requiresOnboarding?: 'housingType';
}

export interface PresetSelection {
  preset: VaultPreset;
  housingType?: HomeHousingType;
}

export const VAULT_PRESETS: VaultPreset[] = [
  {
    id: 'work',
    label: t('presets.work.label'),
    description: t('presets.work.description'),
    emoji: '💼',
    rootName: t('presets.work.rootName'),
    branches: [
      {
        name: t('presets.work.clients'),
        iconKey: 'users',
        color: 'violet',
        childSuggestions: (n) => [
          t('presets.work.clientN', { n: n + 1 }),
          t('presets.work.clientN', { n: n + 2 }),
        ],
      },
    ],
  },
  {
    id: 'health',
    label: t('presets.health.label'),
    description: t('presets.health.description'),
    emoji: '🩺',
    rootName: t('presets.health.rootName'),
    branches: [
      { name: t('presets.health.labResults'), iconKey: 'microscope', color: 'pink' },
      { name: t('presets.health.visits'), iconKey: 'stethoscope', color: 'rose' },
      { name: t('presets.health.prescriptions'), iconKey: 'pill', color: 'teal' },
      { name: t('presets.health.vaccinations'), iconKey: 'syringe', color: 'sky' },
      { name: t('presets.health.insurance'), iconKey: 'shield', color: 'teal' },
      { name: t('presets.health.dentalVision'), iconKey: 'eye', color: 'indigo' },
      { name: t('presets.health.hospital'), iconKey: 'hospital', color: 'rose' },
    ],
  },
  {
    id: 'home',
    label: t('presets.home.label'),
    description: t('presets.home.description'),
    emoji: '🏠',
    rootName: t('presets.home.rootName'),
    requiresOnboarding: 'housingType',
    variants: {
      rent: [
        { name: t('presets.home.bills'), iconKey: 'receipt', color: 'yellow' },
        { name: t('presets.home.lease'), iconKey: 'file-text', color: 'amber' },
        { name: t('presets.home.insurance'), iconKey: 'shield', color: 'teal' },
        { name: t('presets.home.appliances'), iconKey: 'zap', color: 'amber' },
        { name: t('presets.home.maintenance'), iconKey: 'wrench', color: 'orange' },
        { name: t('presets.home.building'), iconKey: 'building-2', color: 'slate' },
      ],
      own: [
        { name: t('presets.home.bills'), iconKey: 'receipt', color: 'yellow' },
        { name: t('presets.home.property'), iconKey: 'landmark', color: 'emerald' },
        { name: t('presets.home.insurance'), iconKey: 'shield', color: 'teal' },
        { name: t('presets.home.appliances'), iconKey: 'zap', color: 'amber' },
        { name: t('presets.home.maintenance'), iconKey: 'wrench', color: 'orange' },
        { name: t('presets.home.taxes'), iconKey: 'scale', color: 'slate' },
        { name: t('presets.home.renovation'), iconKey: 'hammer', color: 'orange' },
      ],
    },
  },
  {
    id: 'personal',
    label: t('presets.personal.label'),
    description: t('presets.personal.description'),
    emoji: '🧑',
    rootName: t('presets.personal.rootName'),
    branches: [
      { name: t('presets.personal.cv'), iconKey: 'file-text', color: 'blue' },
      { name: t('presets.personal.ideas'), iconKey: 'lightbulb', color: 'amber' },
      { name: t('presets.personal.background'), iconKey: 'book-open', color: 'indigo' },
      {
        name: t('presets.personal.identity'),
        iconKey: 'id-card',
        color: 'violet',
        seedChildren: [
          { name: t('presets.personal.passport'), iconKey: 'id-card', color: 'blue' },
          { name: t('presets.personal.visas'), iconKey: 'plane', color: 'sky' },
          { name: t('presets.personal.id'), iconKey: 'badge-check', color: 'emerald' },
          { name: t('presets.personal.otherId'), iconKey: 'folder', color: 'slate' },
        ],
      },
    ],
  },
];

export function findPresetById(id: string | null) {
  return VAULT_PRESETS.find((p) => p.id === id) ?? null;
}

export function findPresetByRootName(name: string) {
  return VAULT_PRESETS.find((p) => p.rootName === name) ?? null;
}

export function getHomeHousingType(
  settings: Record<string, unknown> | null | undefined,
): HomeHousingType | null {
  const value = settings?.[HOME_HOUSING_TYPE_KEY];
  return value === 'rent' || value === 'own' ? value : null;
}

export function getPresetBranches(
  preset: VaultPreset,
  settings?: Record<string, unknown> | null,
  housingType?: HomeHousingType | null,
): PresetChildTemplate[] {
  if (preset.variants) {
    const resolved = housingType ?? getHomeHousingType(settings);
    if (resolved && preset.variants[resolved]) {
      return preset.variants[resolved];
    }
    return preset.variants.rent;
  }
  return preset.branches ?? [];
}

export function getDisplayBranches(
  preset: VaultPreset,
  housingType?: HomeHousingType | null,
): PresetChildTemplate[] {
  return getPresetBranches(preset, null, housingType);
}

const PRESETS_WITH_SEED_FOLDERS = new Set(['work', 'home', 'health', 'personal']);

export function shouldSeedPresetFolders(preset: VaultPreset): boolean {
  return PRESETS_WITH_SEED_FOLDERS.has(preset.id);
}

export interface MindMapSuggestion {
  key: string;
  label: string;
  parentId: string;
}

export function getSuggestions(
  parent: TreeNode,
  presetId: string | null,
  spaceSettings?: Record<string, unknown> | null,
): MindMapSuggestion[] {
  const preset = findPresetById(presetId);
  if (!preset) {
    if (parent.type === 'FOLDER') {
      return [
        {
          key: `generic-${parent.id}`,
          label: t('presets.newBranch'),
          parentId: parent.id,
        },
      ];
    }
    return [];
  }

  const branches = getPresetBranches(preset, spaceSettings);
  const existingNames = new Set(parent.children.map((c) => c.name.toLowerCase()));

  if (parent.parentId === null && parent.type === 'FOLDER') {
    const missingBranches = branches.filter(
      (b) => !existingNames.has(b.name.toLowerCase()),
    );
    if (missingBranches.length > 0) {
      return missingBranches.slice(0, 3).map((b) => ({
        key: `branch-${parent.id}-${b.name}`,
        label: b.name,
        parentId: parent.id,
      }));
    }
  }

  const branch = branches.find((b) => b.name.toLowerCase() === parent.name.toLowerCase());
  if (branch?.seedChildren) {
    return branch.seedChildren
      .filter((child) => !existingNames.has(child.name.toLowerCase()))
      .slice(0, 3)
      .map((child) => ({
        key: `seed-${parent.id}-${child.name}`,
        label: child.name,
        parentId: parent.id,
      }));
  }
  if (branch?.childSuggestions) {
    const folderChildren = parent.children.filter((c) => c.type === 'FOLDER');
    const suggestions = branch.childSuggestions(folderChildren.length);
    return suggestions
      .filter((label) => !existingNames.has(label.toLowerCase()))
      .slice(0, 3)
      .map((label) => ({
        key: `child-${parent.id}-${label}`,
        label,
        parentId: parent.id,
      }));
  }

  if (parent.type === 'FOLDER') {
    return [
      {
        key: `generic-${parent.id}`,
        label: t('presets.newBranch'),
        parentId: parent.id,
      },
    ];
  }

  return [];
}
