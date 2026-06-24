'use client';

import { cn } from '@/lib/cn';
import { resolveFolderAppearance } from '@/lib/folder-theme';

interface FolderAppearanceProps {
  iconKey?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
  iconClassName?: string;
  preview?: boolean;
}

export function FolderAppearance({
  iconKey,
  color,
  size = 22,
  className,
  iconClassName,
  preview = false,
}: FolderAppearanceProps) {
  const { Icon, theme } = resolveFolderAppearance(iconKey, color);

  if (preview) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl border',
          theme.containerClassName,
          className,
        )}
      >
        <Icon size={size} className={cn(theme.iconClassName, iconClassName)} />
      </div>
    );
  }

  return <Icon size={size} className={cn(theme.iconClassName, iconClassName)} />;
}

export function FolderAppearanceContainer({
  iconKey,
  color,
  children,
  className,
}: {
  iconKey?: string | null;
  color?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = resolveFolderAppearance(iconKey, color);

  return (
    <div className={cn('border', theme.containerClassName, className)}>
      {children}
    </div>
  );
}
