'use client';

import type { RefObject } from 'react';
import { motion } from 'framer-motion';
import { Folder, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { getMindMapNodeHeight } from '@/lib/mind-map-node-theme';
import type { TreeNode } from '@/lib/types';
import { FileTypeIcon } from '@/components/ui/file-type-icon';

interface MindMapTrashZoneProps {
  active: boolean;
  denied?: boolean;
  trashRef: RefObject<HTMLDivElement | null>;
}

export function MindMapTrashZone({ active, denied, trashRef }: MindMapTrashZoneProps) {
  return (
    <div
      ref={trashRef}
      data-canvas-control
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'absolute bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-200',
        denied && 'animate-pulse border-red-400 bg-red-500/15',
        active && !denied && 'scale-110 border-red-400 bg-red-500/15 shadow-red-500/20',
        !active && !denied && 'border-[var(--color-border)] bg-[var(--color-surface)]/95',
      )}
      title={t('vault.trashHint')}
    >
      <Trash2
        size={22}
        className={cn(
          'transition-colors',
          active || denied ? 'text-red-500' : 'text-[var(--color-muted)]',
        )}
      />
    </div>
  );
}

interface MindMapDeleteFlyProps {
  node: TreeNode;
  startLeft: number;
  startTop: number;
  startWidth: number;
  startHeight: number;
  targetLeft: number;
  targetTop: number;
  onComplete: () => void;
}

export function MindMapDeleteFly({
  node,
  startLeft,
  startTop,
  startWidth,
  startHeight,
  targetLeft,
  targetTop,
  onComplete,
}: MindMapDeleteFlyProps) {
  const isFolder = node.type === 'FOLDER';

  return (
    <motion.div
      className="pointer-events-none absolute z-50"
      initial={{
        left: startLeft,
        top: startTop,
        width: startWidth,
        height: startHeight,
        opacity: 1,
        scale: 1,
      }}
      animate={{
        left: targetLeft,
        top: targetTop,
        width: startWidth * 0.35,
        height: startHeight * 0.35,
        opacity: 0.15,
        scale: 0.85,
      }}
      transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
      onAnimationComplete={onComplete}
    >
      <div
        className={cn(
          'flex h-full items-center gap-2 rounded-2xl border px-3 shadow-xl',
          isFolder
            ? 'border-red-300/60 bg-[var(--color-surface)]'
            : 'border-red-300/60 bg-[var(--color-surface-2)]',
        )}
      >
        {isFolder ? (
          <Folder size={16} className="shrink-0 text-red-400" />
        ) : (
          <FileTypeIcon filename={node.name} size={18} />
        )}
        <span className="truncate text-sm font-medium">{node.name}</span>
      </div>
    </motion.div>
  );
}

export function nodeViewportBox(
  nodeId: string,
  layoutNodes: Array<{ id: string; x: number; y: number; width: number }>,
  canvas: { x: number; y: number; scale: number },
): { left: number; top: number; width: number; height: number } | null {
  const positioned = layoutNodes.find((n) => n.id === nodeId);
  if (!positioned) return null;

  return {
    left: canvas.x + positioned.x * canvas.scale,
    top: canvas.y + positioned.y * canvas.scale,
    width: positioned.width * canvas.scale,
    height: getMindMapNodeHeight() * canvas.scale,
  };
}

export function trashTargetInContainer(
  trashEl: HTMLElement,
  containerEl: HTMLElement,
  flyWidth: number,
  flyHeight: number,
): { left: number; top: number } {
  const container = containerEl.getBoundingClientRect();
  const trash = trashEl.getBoundingClientRect();
  return {
    left: trash.left - container.left + trash.width / 2 - flyWidth / 2,
    top: trash.top - container.top + trash.height / 2 - flyHeight / 2,
  };
}

export function isOverTrash(clientX: number, clientY: number, trashEl: HTMLElement): boolean {
  const rect = trashEl.getBoundingClientRect();
  const pad = 12;
  return (
    clientX >= rect.left - pad &&
    clientX <= rect.right + pad &&
    clientY >= rect.top - pad &&
    clientY <= rect.bottom + pad
  );
}
