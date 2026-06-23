import {
  BadgeCheck,
  Briefcase,
  Building2,
  Droplets,
  FileStack,
  Folder,
  Hammer,
  HeartPulse,
  Home,
  Landmark,
  Shield,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

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

interface FolderTheme {
  icon: LucideIcon;
  className: string;
  iconClassName: string;
}

export const DEMO_FOLDER_THEMES: Record<DemoFolderKind, FolderTheme> = {
  default: {
    icon: Folder,
    className: 'border-[var(--color-border)] bg-[var(--color-surface)]',
    iconClassName: 'text-[var(--color-muted)]',
  },
  archive: {
    icon: Landmark,
    className: 'border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)]',
    iconClassName: 'text-[var(--color-accent)]',
  },
  home: {
    icon: Home,
    className: 'border-emerald-500/35 bg-emerald-500/10 dark:bg-emerald-500/15',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
  work: {
    icon: Briefcase,
    className: 'border-slate-500/30 bg-slate-500/10 dark:bg-slate-400/10',
    iconClassName: 'text-slate-600 dark:text-slate-300',
  },
  clients: {
    icon: Users,
    className: 'border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15',
    iconClassName: 'text-violet-600 dark:text-violet-400',
  },
  company: {
    icon: Building2,
    className: 'border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/15',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  project: {
    icon: Folder,
    className: 'border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-500/15',
    iconClassName: 'text-indigo-600 dark:text-indigo-400',
  },
  documents: {
    icon: FileStack,
    className: 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  utilities: {
    icon: Zap,
    className: 'border-yellow-500/30 bg-yellow-500/10 dark:bg-yellow-500/15',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
  },
  water: {
    icon: Droplets,
    className: 'border-sky-500/35 bg-sky-500/12 dark:bg-sky-500/15',
    iconClassName: 'text-sky-600 dark:text-sky-400',
  },
  electricity: {
    icon: Zap,
    className: 'border-amber-400/35 bg-amber-400/12 dark:bg-amber-400/15',
    iconClassName: 'text-amber-500 dark:text-amber-300',
  },
  insurance: {
    icon: Shield,
    className: 'border-teal-500/35 bg-teal-500/12 dark:bg-teal-500/15',
    iconClassName: 'text-teal-600 dark:text-teal-400',
  },
  renovation: {
    icon: Hammer,
    className: 'border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/15',
    iconClassName: 'text-orange-600 dark:text-orange-400',
  },
  warranties: {
    icon: BadgeCheck,
    className: 'border-lime-500/30 bg-lime-500/10 dark:bg-lime-500/15',
    iconClassName: 'text-lime-600 dark:text-lime-400',
  },
  health: {
    icon: HeartPulse,
    className: 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15',
    iconClassName: 'text-rose-600 dark:text-rose-400',
  },
  labs: {
    icon: HeartPulse,
    className: 'border-pink-500/30 bg-pink-500/10 dark:bg-pink-500/15',
    iconClassName: 'text-pink-600 dark:text-pink-400',
  },
};
