import {
  resolveFolderAppearance,
  type FolderColorKey,
  type FolderIconKey,
} from '@/lib/folder-theme';

export type DemoFolderKind =
  | 'default'
  | 'archive'
  | 'home'
  | 'work'
  | 'clients'
  | 'company'
  | 'project'
  | 'documents'
  | 'utilities'
  | 'water'
  | 'electricity'
  | 'insurance'
  | 'renovation'
  | 'warranties'
  | 'health'
  | 'labs';

const DEMO_KIND_TO_ICON: Record<DemoFolderKind, FolderIconKey> = {
  default: 'folder',
  archive: 'landmark',
  home: 'home',
  work: 'briefcase',
  clients: 'users',
  company: 'building-2',
  project: 'folder',
  documents: 'file-stack',
  utilities: 'zap',
  water: 'droplets',
  electricity: 'zap',
  insurance: 'shield',
  renovation: 'hammer',
  warranties: 'badge-check',
  health: 'heart-pulse',
  labs: 'heart-pulse',
};

const DEMO_KIND_TO_COLOR: Record<DemoFolderKind, FolderColorKey> = {
  default: 'default',
  archive: 'default',
  home: 'emerald',
  work: 'slate',
  clients: 'violet',
  company: 'blue',
  project: 'indigo',
  documents: 'amber',
  utilities: 'yellow',
  water: 'sky',
  electricity: 'amber',
  insurance: 'teal',
  renovation: 'orange',
  warranties: 'lime',
  health: 'rose',
  labs: 'pink',
};

export function resolveDemoFolderAppearance(folderKind: DemoFolderKind) {
  return resolveFolderAppearance(
    DEMO_KIND_TO_ICON[folderKind],
    DEMO_KIND_TO_COLOR[folderKind],
  );
}
