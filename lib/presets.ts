import { t } from '@/lib/i18n';
import type { TreeNode } from './types';

export interface PresetChildTemplate {
  name: string;
  childSuggestions?: (existingCount: number) => string[];
}

export interface VaultPreset {
  id: string;
  label: string;
  description: string;
  emoji: string;
  rootName: string;
  branches: PresetChildTemplate[];
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
        childSuggestions: (n) => [
          t('presets.work.clientN', { n: n + 1 }),
          t('presets.work.clientN', { n: n + 2 }),
        ],
      },
      { name: t('presets.work.resume') },
    ],
  },
  {
    id: 'health',
    label: t('presets.health.label'),
    description: t('presets.health.description'),
    emoji: '🩺',
    rootName: t('presets.health.rootName'),
    branches: [
      {
        name: t('presets.health.labs'),
        childSuggestions: (n) => [t('presets.health.labN', { n: n + 1 })],
      },
      {
        name: t('presets.health.visits'),
        childSuggestions: (n) => [t('presets.health.visitN', { n: n + 1 })],
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

export interface MindMapSuggestion {
  key: string;
  label: string;
  parentId: string;
}

export function getSuggestions(
  parent: TreeNode,
  presetId: string | null,
): MindMapSuggestion[] {
  const preset = findPresetById(presetId);
  const existingNames = new Set(parent.children.map((c) => c.name.toLowerCase()));

  if (preset && parent.name === preset.rootName && parent.parentId === null) {
    return preset.branches
      .filter((b) => !existingNames.has(b.name.toLowerCase()))
      .map((b) => ({
        key: `branch-${parent.id}-${b.name}`,
        label: b.name,
        parentId: parent.id,
      }));
  }

  if (preset) {
    const branch = preset.branches.find(
      (b) => b.name.toLowerCase() === parent.name.toLowerCase(),
    );
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
