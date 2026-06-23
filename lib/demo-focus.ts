import { HOME_CANVAS_H, HOME_CANVAS_W, HOME_LAYOUT } from '@/lib/demo-home-layout';

export interface DemoViewportFocus {
  scale: number;
  x: number;
  y: number;
}

export interface DemoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DemoFocusTarget =
  | { mode: 'all' }
  | { mode: 'nodes'; ids: string[] };

const NODE_HALF_W = 52;
const NODE_HALF_H = 16;
const OVERVIEW_PADDING = 56;
const FOCUS_PADDING = 44;
const MAX_SCALE = 3;

/** Tree nodes always present before the demo upload lands. */
export const TREE_OVERVIEW_NODE_IDS = [
  'work',
  'clients',
  'acme',
  'invoice',
  'requirements',
  'websiteProject',
  'mockups',
  'spec',
  'nordline',
  'nda',
  'q2Project',
  'sprintPlan',
  'apiDocs',
  'brightCo',
  'contract',
  'proposal',
  'internal',
  'templates',
] as const;

export function getDemoFocusTarget(
  presetId: string,
  options?: { showNewDoc?: boolean },
): DemoFocusTarget {
  // Zoom in once when the document lands; keep focus through preview/search/hold.
  if (!options?.showNewDoc) {
    return { mode: 'all' };
  }

  if (presetId === 'home') {
    return {
      mode: 'nodes',
      ids: ['waterMar', 'waterBills', 'utilities', 'home'],
    };
  }

  return {
    mode: 'nodes',
    ids: ['amendment', 'websiteProject', 'acme', 'clients', 'work'],
  };
}

export function getStableOverviewTarget(presetId: string): DemoFocusTarget {
  if (presetId === 'home') {
    return { mode: 'all' };
  }
  return { mode: 'nodes', ids: [...TREE_OVERVIEW_NODE_IDS] };
}

export function measureNodeBounds(
  contentEl: HTMLElement,
  target: DemoFocusTarget,
): DemoRect | null {
  const contentRect = contentEl.getBoundingClientRect();
  const nodeList =
    target.mode === 'all'
      ? Array.from(contentEl.querySelectorAll<HTMLElement>('[data-demo-node]'))
      : target.ids
          .map((id) => contentEl.querySelector<HTMLElement>(`[data-demo-node="${id}"]`))
          .filter((el): el is HTMLElement => el != null);

  if (!nodeList.length) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodeList) {
    const rect = node.getBoundingClientRect();
    minX = Math.min(minX, rect.left - contentRect.left);
    minY = Math.min(minY, rect.top - contentRect.top);
    maxX = Math.max(maxX, rect.right - contentRect.left);
    maxY = Math.max(maxY, rect.bottom - contentRect.top);
  }

  if (!Number.isFinite(minX)) return null;

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

/** Fallback bounds from home layout coordinates before DOM measurement. */
export function homeLayoutBounds(target: DemoFocusTarget, showNewDoc: boolean): DemoRect {
  const ids =
    target.mode === 'all'
      ? HOME_LAYOUT.map((n) => n.id)
      : target.ids.filter((id) => id !== 'waterMar' || showNewDoc);

  const nodes = HOME_LAYOUT.filter((n) => ids.includes(n.id));
  if (!nodes.length) {
    return { x: 0, y: 0, width: HOME_CANVAS_W, height: HOME_CANVAS_H };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x - NODE_HALF_W);
    minY = Math.min(minY, n.y - NODE_HALF_H);
    maxX = Math.max(maxX, n.x + NODE_HALF_W);
    maxY = Math.max(maxY, n.y + NODE_HALF_H);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function paddedBounds(bounds: DemoRect, padding: number): DemoRect {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

export function computeViewportTransform(
  bounds: DemoRect,
  contentSize: { width: number; height: number },
  viewportSize: { width: number; height: number },
  padding: number,
  fixedScale?: number,
): DemoViewportFocus {
  const vw = Math.max(viewportSize.width, 1);
  const vh = Math.max(viewportSize.height, 1);
  const padded = paddedBounds(bounds, padding);

  const scale =
    fixedScale ?? Math.min(vw / padded.width, vh / padded.height, MAX_SCALE);

  const focusCx = padded.x + padded.width / 2;
  const focusCy = padded.y + padded.height / 2;
  const contentCx = contentSize.width / 2;
  const contentCy = contentSize.height / 2;

  return {
    scale,
    x: -(focusCx - contentCx) * scale,
    y: -(focusCy - contentCy) * scale,
  };
}

export function focusTargetKey(target: DemoFocusTarget): string {
  return target.mode === 'all' ? 'all' : `nodes:${target.ids.join(',')}`;
}

export function focusPadding(target: DemoFocusTarget): number {
  return target.mode === 'all' ? OVERVIEW_PADDING : FOCUS_PADDING;
}

export { HOME_CANVAS_W, HOME_CANVAS_H };
