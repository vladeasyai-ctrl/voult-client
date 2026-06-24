import {
  Baby,
  BadgeCheck,
  Banknote,
  BookOpen,
  Bookmark,
  Briefcase,
  Building2,
  Calendar,
  Car,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Dog,
  Droplets,
  Eye,
  FileStack,
  FileText,
  Folder,
  FolderOpen,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Hospital,
  IdCard,
  Landmark,
  Lightbulb,
  Lock,
  Mail,
  Microscope,
  Package,
  Phone,
  Pill,
  Plane,
  Receipt,
  Scale,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  Tag,
  TreePine,
  Users,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type FolderIconKey =
  | 'folder'
  | 'folder-open'
  | 'landmark'
  | 'home'
  | 'briefcase'
  | 'users'
  | 'building-2'
  | 'file-stack'
  | 'zap'
  | 'droplets'
  | 'shield'
  | 'hammer'
  | 'badge-check'
  | 'heart-pulse'
  | 'receipt'
  | 'file-text'
  | 'stethoscope'
  | 'pill'
  | 'syringe'
  | 'hospital'
  | 'eye'
  | 'id-card'
  | 'lightbulb'
  | 'star'
  | 'bookmark'
  | 'tag'
  | 'calendar'
  | 'lock'
  | 'wrench'
  | 'car'
  | 'plane'
  | 'graduation-cap'
  | 'wallet'
  | 'credit-card'
  | 'scale'
  | 'microscope'
  | 'clipboard-list'
  | 'phone'
  | 'mail'
  | 'package'
  | 'shopping-cart'
  | 'baby'
  | 'dog'
  | 'tree-pine'
  | 'banknote'
  | 'circle-dollar-sign'
  | 'book-open'
  | 'sparkles';

export type FolderColorKey =
  | 'default'
  | 'emerald'
  | 'slate'
  | 'violet'
  | 'blue'
  | 'indigo'
  | 'amber'
  | 'yellow'
  | 'sky'
  | 'teal'
  | 'orange'
  | 'lime'
  | 'rose'
  | 'pink';

export const DEFAULT_FOLDER_ICON: FolderIconKey = 'folder';
export const DEFAULT_FOLDER_COLOR: FolderColorKey = 'default';

export const FOLDER_ICON_COMPONENTS: Record<FolderIconKey, LucideIcon> = {
  folder: Folder,
  'folder-open': FolderOpen,
  landmark: Landmark,
  home: Home,
  briefcase: Briefcase,
  users: Users,
  'building-2': Building2,
  'file-stack': FileStack,
  zap: Zap,
  droplets: Droplets,
  shield: Shield,
  hammer: Hammer,
  'badge-check': BadgeCheck,
  'heart-pulse': HeartPulse,
  receipt: Receipt,
  'file-text': FileText,
  stethoscope: Stethoscope,
  pill: Pill,
  syringe: Syringe,
  hospital: Hospital,
  eye: Eye,
  'id-card': IdCard,
  lightbulb: Lightbulb,
  star: Star,
  bookmark: Bookmark,
  tag: Tag,
  calendar: Calendar,
  lock: Lock,
  wrench: Wrench,
  car: Car,
  plane: Plane,
  'graduation-cap': GraduationCap,
  wallet: Wallet,
  'credit-card': CreditCard,
  scale: Scale,
  microscope: Microscope,
  'clipboard-list': ClipboardList,
  phone: Phone,
  mail: Mail,
  package: Package,
  'shopping-cart': ShoppingCart,
  baby: Baby,
  dog: Dog,
  'tree-pine': TreePine,
  banknote: Banknote,
  'circle-dollar-sign': CircleDollarSign,
  'book-open': BookOpen,
  sparkles: Sparkles,
};

export const FOLDER_ICON_KEYS = Object.keys(FOLDER_ICON_COMPONENTS) as FolderIconKey[];

export interface FolderColorTheme {
  key: FolderColorKey;
  swatchClassName: string;
  containerClassName: string;
  iconClassName: string;
}

export const FOLDER_COLOR_THEMES: Record<FolderColorKey, FolderColorTheme> = {
  default: {
    key: 'default',
    swatchClassName: 'bg-[var(--color-surface-2)] ring-[var(--color-border)]',
    containerClassName: 'border-[var(--color-border)] bg-[var(--color-surface)]',
    iconClassName: 'text-[var(--color-muted)]',
  },
  emerald: {
    key: 'emerald',
    swatchClassName: 'bg-emerald-500',
    containerClassName: 'border-emerald-500/35 bg-emerald-500/10 dark:bg-emerald-500/15',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
  },
  slate: {
    key: 'slate',
    swatchClassName: 'bg-slate-500',
    containerClassName: 'border-slate-500/30 bg-slate-500/10 dark:bg-slate-400/10',
    iconClassName: 'text-slate-600 dark:text-slate-300',
  },
  violet: {
    key: 'violet',
    swatchClassName: 'bg-violet-500',
    containerClassName: 'border-violet-500/30 bg-violet-500/10 dark:bg-violet-500/15',
    iconClassName: 'text-violet-600 dark:text-violet-400',
  },
  blue: {
    key: 'blue',
    swatchClassName: 'bg-blue-500',
    containerClassName: 'border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/15',
    iconClassName: 'text-blue-600 dark:text-blue-400',
  },
  indigo: {
    key: 'indigo',
    swatchClassName: 'bg-indigo-500',
    containerClassName: 'border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-500/15',
    iconClassName: 'text-indigo-600 dark:text-indigo-400',
  },
  amber: {
    key: 'amber',
    swatchClassName: 'bg-amber-500',
    containerClassName: 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15',
    iconClassName: 'text-amber-600 dark:text-amber-400',
  },
  yellow: {
    key: 'yellow',
    swatchClassName: 'bg-yellow-500',
    containerClassName: 'border-yellow-500/30 bg-yellow-500/10 dark:bg-yellow-500/15',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
  },
  sky: {
    key: 'sky',
    swatchClassName: 'bg-sky-500',
    containerClassName: 'border-sky-500/35 bg-sky-500/12 dark:bg-sky-500/15',
    iconClassName: 'text-sky-600 dark:text-sky-400',
  },
  teal: {
    key: 'teal',
    swatchClassName: 'bg-teal-500',
    containerClassName: 'border-teal-500/35 bg-teal-500/12 dark:bg-teal-500/15',
    iconClassName: 'text-teal-600 dark:text-teal-400',
  },
  orange: {
    key: 'orange',
    swatchClassName: 'bg-orange-500',
    containerClassName: 'border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/15',
    iconClassName: 'text-orange-600 dark:text-orange-400',
  },
  lime: {
    key: 'lime',
    swatchClassName: 'bg-lime-500',
    containerClassName: 'border-lime-500/30 bg-lime-500/10 dark:bg-lime-500/15',
    iconClassName: 'text-lime-600 dark:text-lime-400',
  },
  rose: {
    key: 'rose',
    swatchClassName: 'bg-rose-500',
    containerClassName: 'border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/15',
    iconClassName: 'text-rose-600 dark:text-rose-400',
  },
  pink: {
    key: 'pink',
    swatchClassName: 'bg-pink-500',
    containerClassName: 'border-pink-500/30 bg-pink-500/10 dark:bg-pink-500/15',
    iconClassName: 'text-pink-600 dark:text-pink-400',
  },
};

export const FOLDER_COLOR_KEYS = Object.keys(FOLDER_COLOR_THEMES) as FolderColorKey[];

export function resolveFolderIconKey(iconKey?: string | null): FolderIconKey {
  if (iconKey && iconKey in FOLDER_ICON_COMPONENTS) {
    return iconKey as FolderIconKey;
  }
  return DEFAULT_FOLDER_ICON;
}

export function resolveFolderColorKey(color?: string | null): FolderColorKey {
  if (color && color in FOLDER_COLOR_THEMES) {
    return color as FolderColorKey;
  }
  return DEFAULT_FOLDER_COLOR;
}

export function resolveFolderAppearance(
  iconKey?: string | null,
  color?: string | null,
) {
  const resolvedIcon = resolveFolderIconKey(iconKey);
  const resolvedColor = resolveFolderColorKey(color);
  return {
    iconKey: resolvedIcon,
    colorKey: resolvedColor,
    Icon: FOLDER_ICON_COMPONENTS[resolvedIcon],
    theme: FOLDER_COLOR_THEMES[resolvedColor],
  };
}
