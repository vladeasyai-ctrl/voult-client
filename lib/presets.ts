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
    label: 'Работа',
    description: 'Клиенты, резюме, проекты и рабочие документы',
    emoji: '💼',
    rootName: 'Работа',
    branches: [
      {
        name: 'Клиенты',
        childSuggestions: (n) => [`Клиент ${n + 1}`, `Клиент ${n + 2}`],
      },
      { name: 'Резюме' },
    ],
  },
  {
    id: 'health',
    label: 'Здоровье',
    description: 'Анализы, визиты к врачу, рецепты и медкарта',
    emoji: '🩺',
    rootName: 'Здоровье',
    branches: [
      {
        name: 'Анализы',
        childSuggestions: (n) => [`Анализ ${n + 1}`],
      },
      {
        name: 'Визиты',
        childSuggestions: (n) => [`Визит ${n + 1}`],
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
        label: '+ Новая ветка',
        parentId: parent.id,
      },
    ];
  }

  return [];
}
