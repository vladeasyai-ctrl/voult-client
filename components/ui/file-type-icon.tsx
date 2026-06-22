import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { resolveFileType, type FileTypeKind } from '@/lib/file-type';

interface FileTypeIconProps {
  mimeType?: string | null;
  filename?: string | null;
  size?: number;
  className?: string;
}

const BADGE_TEXT: Record<FileTypeKind, string> = {
  pdf: 'PDF',
  word: 'W',
  excel: 'X',
  powerpoint: 'P',
  image: '',
  text: 'TXT',
  archive: 'ZIP',
  video: 'VID',
  generic: '',
};

import { FILE_TYPE_BORDER_COLOR } from '@/lib/file-type';

function DocShell({ children, fold = '#E8EDF2' }: { children: ReactNode; fold?: string }) {
  return (
    <>
      <path
        d="M5 1.5h12.5L22 6v20.5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 26.5V3A1.5 1.5 0 0 1 5 1.5Z"
        fill="#FFFFFF"
        stroke="#D1D9E0"
        strokeWidth="1"
      />
      <path d="M17.5 1.5V6H22" fill={fold} stroke="#D1D9E0" strokeWidth="1" />
      {children}
    </>
  );
}

function KindArt({ kind }: { kind: FileTypeKind }) {
  const color = FILE_TYPE_BORDER_COLOR[kind];

  if (kind === 'image') {
    return (
      <>
        <rect x="6" y="9" width="14" height="10" rx="1.5" fill="#EDE9FE" />
        <circle cx="10" cy="12.5" r="1.5" fill="#A78BFA" />
        <path d="M6 17.5l4-3.5 3 2.5 3-4 4 5.5" stroke="#7C3AED" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  }

  if (kind === 'generic') {
    return (
      <>
        <path d="M8 10h10M8 13.5h10M8 17h6" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
      </>
    );
  }

  const badge = BADGE_TEXT[kind];
  return (
    <>
      <rect x="5" y="16" width="16" height="7.5" rx="1.2" fill={color} />
      {badge && (
        <text
          x="13"
          y="21.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="5.5"
          fontWeight="700"
          fontFamily="Segoe UI, system-ui, sans-serif"
        >
          {badge}
        </text>
      )}
    </>
  );
}

export function FileTypeIcon({
  mimeType,
  filename,
  size = 20,
  className,
}: FileTypeIconProps) {
  const { kind } = resolveFileType(mimeType, filename);

  return (
    <svg
      viewBox="0 0 26 28"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <DocShell>
        <KindArt kind={kind} />
      </DocShell>
    </svg>
  );
}

interface FileTypeLabelProps {
  mimeType?: string | null;
  filename?: string | null;
  iconSize?: number;
  className?: string;
}

export function FileTypeLabel({
  mimeType,
  filename,
  iconSize = 18,
  className,
}: FileTypeLabelProps) {
  const resolved = resolveFileType(mimeType, filename);

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <FileTypeIcon mimeType={mimeType} filename={filename} size={iconSize} />
      <span className="lowercase">{resolved.label}</span>
    </span>
  );
}
